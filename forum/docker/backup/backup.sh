#!/bin/bash
# Automated Database Backup Script for Agent Forum
# This script performs daily backups with retention policy

set -e

# Configuration
BACKUP_DIR="/backup"
DB_HOST="db"
DB_USER="${DB_USER:-forum_user}"
DB_NAME="${DB_NAME:-forum_db}"
PGPASSWORD="${DB_PASSWORD:-change_me_in_production}"
export PGPASSWORD

# Date format for backup files
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/forum_db_${DATE}.sql.gz"

# Logging
LOG_FILE="${BACKUP_DIR}/backup.log"
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

log "Starting backup of database: $DB_NAME"

# Perform backup
if pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"; then
    log "Backup completed successfully: $BACKUP_FILE"
    
    # Verify backup file exists and has content
    if [ -s "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log "Backup size: $BACKUP_SIZE"
        
        # Update last successful backup timestamp
        echo "$DATE" > "${BACKUP_DIR}/last_backup"
    else
        log "ERROR: Backup file is empty!"
        exit 1
    fi
else
    log "ERROR: Backup failed!"
    exit 1
fi

# Retention policy - keep backups for 7 days
log "Cleaning up old backups (keeping last 7 days)..."
find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +7 -delete
DELETED_COUNT=$(find "$BACKUP_DIR" -name "*.sql.gz.*" -type f -mtime +7 -delete 2>&1 | wc -l)
log "Cleanup completed"

# List current backups
log "Current backups:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tee -a "$LOG_FILE"

log "Backup process completed"
