#!/bin/bash
set -euo pipefail

APP_NAME="aitoolshelper"
APP_DIR="/root/luuux"
HEALTH_URL="http://localhost:3000/api/health"
MAX_WAIT=30

cd "$APP_DIR"

log() { echo "[$(date '+%H:%M:%S')] $*"; }

log "==> Pulling latest code..."
git pull --ff-only

log "==> Installing dependencies..."
npm ci

log "==> Backing up current build..."
rm -rf "$APP_DIR/.next.prev"
cp -a "$APP_DIR/.next" "$APP_DIR/.next.prev" 2>/dev/null || true

log "==> Building Next.js (this may take a minute)..."
npm run build

log "==> Build complete. Restarting PM2..."
pm2 restart "$APP_NAME" --update-env

log "==> Waiting for health check..."
for i in $(seq 1 $MAX_WAIT); do
  if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
    log "==> Health check passed. Deployment successful!"
    rm -rf "$APP_DIR/.next.prev"
    pm2 status "$APP_NAME"
    exit 0
  fi
  sleep 1
done

log "ERROR: Health check failed after ${MAX_WAIT}s. Rolling back to previous build..."
rm -rf "$APP_DIR/.next"
mv "$APP_DIR/.next.prev" "$APP_DIR/.next" 2>/dev/null || true
pm2 restart "$APP_NAME" --update-env
sleep 3
log "Rollback complete. Last 20 error log lines:"
tail -20 "$APP_DIR/pm2-logs/error-0.log" 2>/dev/null || tail -20 "$APP_DIR/pm2-logs/error.log" 2>/dev/null || true
exit 1
