#!/bin/bash
set -e

SERVER="root@alabtnt.cn"
REMOTE_DIR="/opt/alabtnt-mcp"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Deploying MCP Server to $SERVER ==="

ssh "$SERVER" "mkdir -p $REMOTE_DIR"

scp "$SCRIPT_DIR/server.py" "$SCRIPT_DIR/requirements.txt" "$SERVER:$REMOTE_DIR/"

ssh "$SERVER" "cd $REMOTE_DIR && pip3 install -r requirements.txt && systemctl restart alabtnt-mcp"

echo "=== Deploy complete, checking status ==="
ssh "$SERVER" "systemctl status alabtnt-mcp --no-pager -l"
