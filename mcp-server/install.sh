#!/bin/bash
set -e

INSTALL_DIR="/opt/alabtnt-mcp"
SERVICE_NAME="alabtnt-mcp"
PORT=8766

echo "=== Installing AlabTNT MCP Server ==="

mkdir -p "$INSTALL_DIR"
cp server.py requirements.txt "$INSTALL_DIR/"

cd "$INSTALL_DIR"

if command -v pip3 &> /dev/null; then
    pip3 install -r requirements.txt
elif command -v pip &> /dev/null; then
    pip install -r requirements.txt
else
    echo "ERROR: pip not found"
    exit 1
fi

cat > "/etc/systemd/system/${SERVICE_NAME}.service" << 'UNITEOF'
[Unit]
Description=AlabTNT MCP Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/alabtnt-mcp
ExecStart=/usr/bin/python3 /opt/alabtnt-mcp/server.py
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1
Environment=PORT=8766

[Install]
WantedBy=multi-user.target
UNITEOF

# Patch nginx configs for alabtnt.cn - add /mcp/ route
cat > /tmp/patch_nginx_mcp.py << 'PYEOF'
import re, sys

MCP_BLOCK = """\
    location /mcp/ {
        proxy_pass http://127.0.0.1:8766/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }"""

def patch_nginx(conf_path):
    with open(conf_path) as f:
        conf = f.read()

    servers = list(re.finditer(r'server\s*\{', conf))
    patched = 0
    for m in reversed(servers):
        start = m.start()
        depth = 0
        end_pos = None
        for i in range(start, len(conf)):
            if conf[i] == '{':
                depth += 1
            elif conf[i] == '}':
                depth -= 1
                if depth == 0:
                    end_pos = i
                    break
        if end_pos:
            conf = conf[:end_pos] + '\n' + MCP_BLOCK + '\n' + conf[end_pos:]
            patched += 1

    if patched > 0:
        with open(conf_path, 'w') as f:
            f.write(conf)
        print(f'  patched {patched} server block(s) in {conf_path}')
    else:
        print(f'  no server blocks in {conf_path}')

for conf_path in sys.argv[1:]:
    if not __file__ or conf_path == __file__:
        continue
    if 'location /mcp/' in open(conf_path).read():
        print(f'  {conf_path} already has /mcp/, skipping')
        continue
    patch_nginx(conf_path)
PYEOF

found_cfgs=""
for conf in /etc/nginx/conf.d/*.conf; do
    if grep -q "alabtnt.cn" "$conf" 2>/dev/null; then
        found_cfgs="$found_cfgs $conf"
    fi
done
if grep -q "alabtnt.cn" /etc/nginx/nginx.conf 2>/dev/null; then
    found_cfgs="$found_cfgs /etc/nginx/nginx.conf"
fi

if [ -n "$found_cfgs" ]; then
    echo "Patching nginx configs..."
    python3 /tmp/patch_nginx_mcp.py $found_cfgs
else
    echo "WARNING: no nginx config with alabtnt.cn found"
fi

rm -f /tmp/patch_nginx_mcp.py

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
systemctl reload nginx

echo ""
echo "=== MCP Server installed successfully ==="
echo "Service: $SERVICE_NAME (port $PORT)"
echo "Endpoint: https://alabtnt.cn/mcp/"
echo ""
systemctl status "$SERVICE_NAME" --no-pager -l || true
