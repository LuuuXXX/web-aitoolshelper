#!/bin/bash

BACKUP_DIR="/root/luuux/backups"
DB_FILE="/root/luuux/prisma/dev.db"
MAX_BACKUPS=7
LOG_FILE="/root/luuux/pm2-logs/cleanup.log"

mkdir -p "$BACKUP_DIR" "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# 1. Database backup
if [ -f "$DB_FILE" ]; then
  BACKUP_NAME="db_$(date '+%Y%m%d_%H%M%S').db"
  cp "$DB_FILE" "$BACKUP_DIR/$BACKUP_NAME"
  log "Database backed up: $BACKUP_NAME"
  # Remove old backups
  ls -t "$BACKUP_DIR"/db_*.db 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm
  log "Old backups cleaned (keeping last $MAX_BACKUPS)"
fi

# 2. Clean Next.js cache
NEXT_CACHE="/root/luuux/.next/cache"
if [ -d "$NEXT_CACHE" ]; then
  du -sh "$NEXT_CACHE" >> "$LOG_FILE" 2>/dev/null
fi

# 3. Clean old PM2 logs (keep last 5MB)
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
  # Clean npm cache
  npm cache clean --force >> "$LOG_FILE" 2>&1
fi

# 5. Memory check
MEM_AVAIL=$(free -m | awk '/Mem:/ {print $7}')
if [ "$MEM_AVAIL" -lt 500 ]; then
  log "WARNING: Low memory (${MEM_AVAIL}MB available), restarting app"
  pm2 restart aitoolshelper >> "$LOG_FILE" 2>&1
fi

log "Cleanup completed"
