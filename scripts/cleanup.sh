#!/bin/bash

BACKUP_DIR="/root/luuux/backups"
MAX_BACKUPS=7
LOG_FILE="/root/luuux/pm2-logs/cleanup.log"
APP_NAME="aitoolshelper"

mkdir -p "$BACKUP_DIR" "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# 1. PostgreSQL database backup via pg_dump
if [ -n "$DATABASE_URL" ]; then
  BACKUP_NAME="db_$(date '+%Y%m%d_%H%M%S').sql.gz"
  if pg_dump "$DATABASE_URL" 2>>"$LOG_FILE" | gzip > "$BACKUP_DIR/$BACKUP_NAME"; then
    log "Database backed up: $BACKUP_NAME"
    ls -t "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm
    log "Old backups cleaned (keeping last $MAX_BACKUPS)"
  else
    log "ERROR: Database backup failed"
  fi
else
  log "WARNING: DATABASE_URL not set, skipping database backup"
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
  # Clean old backups more aggressively
  ls -t "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null | tail -n +3 | xargs -r rm
  log "Reduced backups to last 3 due to disk pressure"
  # Clean npm cache
  npm cache clean --force >> "$LOG_FILE" 2>&1
fi

# 5. Memory check
MEM_AVAIL=$(free -m | awk '/Mem:/ {print $7}')
if [ "$MEM_AVAIL" -lt 500 ]; then
  log "WARNING: Low memory (${MEM_AVAIL}MB available), restarting app"
  pm2 restart "$APP_NAME" >> "$LOG_FILE" 2>&1
fi

log "Cleanup completed"
