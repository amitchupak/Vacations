#!/bin/sh
# Run ON THE AWS SERVER (web terminal, VS Code, or SSH) in the same folder as docker-compose.yml.
set -e
echo "=== Docker containers ==="
docker compose ps
echo
echo "=== Is anything listening on host port 5002? (should show docker-proxy or LISTEN) ==="
if command -v ss >/dev/null 2>&1; then
  ss -tlnp 2>/dev/null | grep ':5002' || echo "(nothing on 5002 — start stack: docker compose up -d --build)"
else
  netstat -tlnp 2>/dev/null | grep 5002 || echo "(ss/netstat not available — try: docker compose up -d --build)"
fi
echo
echo "=== Local HTTP to nginx (should return HTTP/1.1) ==="
curl -sI --connect-timeout 3 http://127.0.0.1:5002/ | head -n 3 || echo "FAILED: proxy not reachable on 127.0.0.1:5002"
echo
echo "=== If local curl works but the browser on your PC still fails, open port 5002 in the AWS security group. ==="
echo "=== If local curl fails, run: docker compose logs proxy && docker compose up -d --build ==="
