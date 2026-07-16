#!/bin/bash

# Load .env (cron doesn't inherit shell environment)
set -a
source /root/luuux/.env
set +a

BACKUP_DIR="/root/luuux/backups"
MAX_BACKUPS=7
LOG_FILE="/root/luuux/pm2-logs/cleanup.log"
APP_NAME="aitoolshelper"
ALERT_SCRIPT="/root/luuux/scripts/alert.mjs"
ALERT_EMAIL="${SMTP_USER:-}"  # Send alerts to self

mkdir -p "$BACKUP_DIR" "$(dirname "$LOG_FILE")"

# Strip Prisma-specific ?schema= param for pg_dump compatibility
DB_URL_FOR_DUMP=$(echo "$DATABASE_URL" | sed 's/\?schema=.*//')

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

send_alert() {
  if [ -f "$ALERT_SCRIPT" ] && [ -n "$ALERT_EMAIL" ]; then
    node "$ALERT_SCRIPT" "$ALERT_EMAIL" "$1" "$2" >> "$LOG_FILE" 2>&1
  fi
}

HAS_ERROR=0

# 1. PostgreSQL database backup via pg_dump
if [ -n "$DATABASE_URL" ]; then
  BACKUP_NAME="db_$(date '+%Y%m%d_%H%M%S').sql.gz"
  set -o pipefail
  if pg_dump "$DB_URL_FOR_DUMP" 2>>"$LOG_FILE" | gzip > "$BACKUP_DIR/$BACKUP_NAME"; then
    BACKUP_SIZE=$(stat -c%s "$BACKUP_DIR/$BACKUP_NAME" 2>/dev/null || echo 0)
    if [ "$BACKUP_SIZE" -lt 100 ]; then
      log "ERROR: Backup file too small (${BACKUP_SIZE} bytes), likely failed"
      rm -f "$BACKUP_DIR/$BACKUP_NAME"
      send_alert "数据库备份失败" "备份文件异常小 (${BACKUP_SIZE} bytes)，pg_dump 可能执行失败。"
      HAS_ERROR=1
    else
      log "Database backed up: $BACKUP_NAME (${BACKUP_SIZE} bytes)"
      ls -t "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm
      log "Old backups cleaned (keeping last $MAX_BACKUPS)"
    fi
  else
    log "ERROR: Database backup failed"
    rm -f "$BACKUP_DIR/$BACKUP_NAME"
    send_alert "数据库备份失败" "pg_dump 执行失败，请检查 RDS 连接和磁盘空间。"
    HAS_ERROR=1
  fi
  set +o pipefail
else
  log "WARNING: DATABASE_URL not set, skipping database backup"
  send_alert "DATABASE_URL 未配置" "cleanup.sh 无法读取 DATABASE_URL，数据库备份未执行。"
  HAS_ERROR=1
fi

# 2. Clean Next.js build cache if oversized
NEXT_CACHE="/root/luuux/.next/cache"
if [ -d "$NEXT_CACHE" ]; then
  CACHE_SIZE=$(du -sm "$NEXT_CACHE" 2>/dev/null | awk '{print $1}')
  log "Next.js cache size: ${CACHE_SIZE}MB"
  if [ "$CACHE_SIZE" -gt 500 ] 2>/dev/null; then
    rm -rf "$NEXT_CACHE"
    log "Next.js cache cleared (was > 500MB)"
  fi
fi

# 3. Truncate old PM2 logs (keep last 2.5MB)
for logfile in /root/luuux/pm2-logs/*.log; do
  if [ -f "$logfile" ]; then
    SIZE=$(stat -c%s "$logfile" 2>/dev/null || echo 0)
    if [ "$SIZE" -gt 5242880 ]; then
      tail -c 2621440 "$logfile" > "${logfile}.tmp" && mv "${logfile}.tmp" "$logfile"
      log "Truncated: $logfile"
    fi
  fi
done

# 4. Disk space check
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$DISK_USAGE" -gt 85 ]; then
  log "WARNING: Disk usage at ${DISK_USAGE}%!"
  send_alert "磁盘空间告警 ${DISK_USAGE}%" "服务器磁盘使用率已达 ${DISK_USAGE}%，已自动清理旧备份。"
  ls -t "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null | tail -n +3 | xargs -r rm
  log "Reduced backups to last 3 due to disk pressure"
  npm cache clean --force >> "$LOG_FILE" 2>&1
fi

# 5. Memory check
MEM_AVAIL=$(free -m | awk '/Mem:/ {print $7}')
if [ "$MEM_AVAIL" -lt 500 ]; then
  log "WARNING: Low memory (${MEM_AVAIL}MB available), restarting app"
  send_alert "内存不足告警" "可用内存仅 ${MEM_AVAIL}MB，已自动重启应用。"
  pm2 restart "$APP_NAME" >> "$LOG_FILE" 2>&1
fi

# 6. Verify PM2 process is alive
if ! pm2 pid "$APP_NAME" > /dev/null 2>&1; then
  log "CRITICAL: PM2 process '$APP_NAME' is down! Attempting restart..."
  pm2 resurrect >> "$LOG_FILE" 2>&1 || pm2 start /root/luuux/ecosystem.config.js >> "$LOG_FILE" 2>&1
  send_alert "应用进程已恢复" "PM2 检测到进程掉线，已尝试自动恢复。"
fi

# 7. Purge expired verification codes
if [ -n "$DATABASE_URL" ]; then
  node -e "
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    pool.query(\"DELETE FROM verification_codes WHERE \\\"expiresAt\\\" < NOW() - INTERVAL '1 day'\")
      .then(r => console.log('Purged ' + r.rowCount + ' expired verification codes'))
      .catch(() => {})
      .finally(() => pool.end());
  " >> "$LOG_FILE" 2>&1
fi

# 8. Lock down backup file permissions
chmod 600 "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null || true

if [ "$HAS_ERROR" -eq 0 ]; then
  log "Cleanup completed - all OK"
fi
