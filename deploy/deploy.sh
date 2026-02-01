#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/draaiboek"
WEB_DIR="/var/www/draaiboek/dist"

cd "$APP_DIR"

echo "== Pull (optioneel) =="
# git pull || true

echo "== Install =="
npm install

echo "== Build =="
npm run build

echo "== Sync naar webroot =="
sudo mkdir -p "$WEB_DIR"
sudo rsync -a --delete dist/ "$WEB_DIR"/

echo "✅ Klaar: https://draaiboek.landstede.live"
