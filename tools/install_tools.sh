#!/bin/bash
echo "Installing tools service..."

# 1. Setup systemd service
cat << 'EOF' > /etc/systemd/system/alabtnt-tools.service
[Unit]
Description=AlabTNT Tools Portal
After=network.target

[Service]
ExecStart=/usr/local/bin/node /opt/alabtnt-tools/server.js
WorkingDirectory=/opt/alabtnt-tools
Restart=always
User=root
Environment=NODE_ENV=production
Environment=PORT=3002

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable alabtnt-tools
systemctl restart alabtnt-tools

# 2. Patch Nginx
echo "Updating Nginx configuration for tools.alabtnt.cn..."
mkdir -p /etc/nginx/conf.d
cat << 'EOF' > /etc/nginx/conf.d/tools.conf
server {
    listen 80;
    server_name tools.alabtnt.cn;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name tools.alabtnt.cn;

    ssl_certificate /etc/letsencrypt/live/tools.alabtnt.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tools.alabtnt.cn/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
# Ensure nginx includes conf.d if it doesn't already. Usually it does.
if ! grep -q "include /etc/nginx/conf.d/\*.conf;" /etc/nginx/nginx.conf; then
    echo "Please verify that /etc/nginx/conf.d/*.conf is included in your nginx.conf."
fi

# Reload nginx
systemctl reload nginx


# 3. UFW Firewall
echo "Ensuring UFW allows port 80..."
ufw allow 80/tcp
# Port 3001 doesn't need to be public since Nginx reverse proxies to 127.0.0.1:3001,
# but we can allow it just in case direct access is needed.
# ufw allow 3001/tcp
ufw reload

echo "Tools service installed and started on port 3001."
