#!/bin/bash

# Lightweight monitor — runs every 5 min via cron
# Only checks: disk, memory, PM2 process. Does NOT do backup.

set -a
source /root/luuux/.env
set +a

LOG_FILE="/root/luuux/pm2-logs/cleanup.log"
APP_NAME="aitoolshelper"
ALERT_SCRIPT="/root/luuux/scripts/alert.mjs"
ALERT_EMAIL="${SMTP_USER:-}"
BACKUP_DIR="/root/luuux/backups"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

send_alert() {
  if [ -f "$ALERT_SCRIPT" ] && [ -n "$ALERT_EMAIL" ]; then
    node "$ALERT_SCRIPT" "$ALERT_EMAIL" "$1" "$2" >> "$LOG_FILE" 2>&1
  fi
}

# 1. Disk space — critical threshold 90%, warning 80%
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$DISK_USAGE" -ge 95 ]; then
  log "CRITICAL: Disk usage at ${DISK_USAGE}%! Emergency cleanup..."
  send_alert "磁盘空间严重告警 ${DISK_USAGE}%" "磁盘即将满！已执行紧急清理。"
  rm -rf /root/luuux/.next/cache 2>/dev/null
  ls -t "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null | tail -n +2 | xargs -r rm
  for logfile in /root/luuux/pm2-logs/*.log; do
    [ -f "$logfile" ] && truncate -s 0 "$logfile" 2>/dev/null
  done
  npm cache clean --force >> "$LOG_FILE" 2>&1
elif [ "$DISK_USAGE" -ge 85 ]; then
  log "WARNING: Disk usage at ${DISK_USAGE}%"
  send_alert "磁盘空间告警 ${DISK_USAGE}%" "磁盘使用率 ${DISK_USAGE}%，建议检查。"
  ls -t "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null | tail -n +3 | xargs -r rm
  for logfile in /root/luuux/pm2-logs/*.log; do
    [ -f "$logfile" ] && SIZE=$(stat -c%s "$logfile" 2>/dev/null || echo 0)
    if [ "${SIZE:-0}" -gt 5242880 ]; then
      tail -c 2621440 "$logfile" > "${logfile}.tmp" && mv "${logfile}.tmp" "$logfile"
    fi
  done
fi

# 2. Memory — PM2 handles restart at 512M RSS, here we check system-level
MEM_AVAIL=$(free -m | awk '/Mem:/ {print $7}')
if [ -n "$MEM_AVAIL" ] && [ "$MEM_AVAIL" -lt 300 ]; then
  log "CRITICAL: Available memory only ${MEM_AVAIL}MB, restarting app"
  send_alert "内存严重不足" "可用内存仅 ${MEM_AVAIL}MB，已自动重启应用。"
  pm2 restart "$APP_NAME" >> "$LOG_FILE" 2>&1
fi

# 3. PM2 process alive check
if ! pm2 pid "$APP_NAME" > /dev/null 2>&1; then
  log "CRITICAL: PM2 process down! Attempting restart..."
  pm2 resurrect >> "$LOG_FILE" 2>&1 || pm2 start /root/luuux/ecosystem.config.js >> "$LOG_FILE" 2>&1
  send_alert "应用进程已恢复" "PM2 检测到进程掉线，已尝试自动恢复。"
fi

# 4. HTTP health check (app alive but hung?)
if pm2 pid "$APP_NAME" > /dev/null 2>&1; then
  if ! curl -sf "http://localhost:3000/api/health" >/dev/null 2>&1; then
    log "CRITICAL: App not responding to health check! Restarting..."
    send_alert "应用无响应" "健康检查失败，应用可能已挂起，已自动重启。"
    pm2 restart "$APP_NAME" >> "$LOG_FILE" 2>&1
  fi
fi
