#!/bin/bash

PROJECT_DIR="/var/www/pizza-delivery"
BACKUP_DIR="/var/backups/pizza-delivery"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=14

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Начало резервного копирования"

mkdir -p "$BACKUP_DIR"/{db,files,env}

source "$PROJECT_DIR/.env.production" 2>/dev/null || { log "ERROR: .env.production not found"; exit 1; }

log "Бекап базы данных..."
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

mysqldump -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" "$DB_NAME" \
    --single-transaction --routines --triggers --events \
    | gzip > "$BACKUP_DIR/db/db_$TIMESTAMP.sql.gz"

log "Бекап загруженных файлов..."
if [[ -d "$PROJECT_DIR/public/uploads" ]]; then
    tar -czf "$BACKUP_DIR/files/uploads_$TIMESTAMP.tar.gz" -C "$PROJECT_DIR/public/uploads" .
fi

log "Бекап переменных окружения..."
cp "$PROJECT_DIR/.env.production" "$BACKUP_DIR/env/env_$TIMESTAMP"

log "Бекап конфига Nginx..."
cp /etc/nginx/sites-available/pizza-delivery "$BACKUP_DIR/nginx_$TIMESTAMP.conf"

log "Удаление старых бекапов (старше $RETENTION_DAYS дней)..."
find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -type d -empty -delete

BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Резервное копирование завершено. Размер: $BACKUP_SIZE"

cat << EOF
$(date +'%Y-%m-%d %H:%M:%S') - Backup completed
  Database: $BACKUP_DIR/db/db_$TIMESTAMP.sql.gz
  Files: $BACKUP_DIR/files/uploads_$TIMESTAMP.tar.gz
  Env: $BACKUP_DIR/env/env_$TIMESTAMP
  Total size: $BACKUP_SIZE
EOF
