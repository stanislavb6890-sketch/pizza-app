#!/bin/bash

set -e

PROJECT_DIR="/var/www/pizza-delivery"
BACKUP_DIR="/var/backups/pizza-delivery"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

log() {
    echo -e "\033[0;32m[$(date +'%H:%M:%S')] $1\033[0m"
}

error() {
    echo -e "\033[0;31m[ERROR] $1\033[0m"
    exit 1
}

backup_db() {
    log "Создание бекапа базы данных..."
    
    mkdir -p "$BACKUP_DIR"
    
    source "$PROJECT_DIR/.env"
    
    mysqldump --defaults-extra-file=<(echo "[client]
user=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
password=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
host=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
database=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')") \
        --single-transaction --routines --triggers \
        > "$BACKUP_DIR/db_$TIMESTAMP.sql"
    
    gzip "$BACKUP_DIR/db_$TIMESTAMP.sql"
    
    find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +7 -delete
    
    log "Бекап создан: $BACKUP_DIR/db_$TIMESTAMP.sql.gz"
}

update_code() {
    log "Обновление кода..."
    
    cd "$PROJECT_DIR"
    
    git fetch origin
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    git pull origin "$CURRENT_BRANCH"
}

install_deps() {
    log "Установка зависимостей..."
    
    cd "$PROJECT_DIR"
    npm install
}

build() {
    log "Сборка проекта..."
    
    cd "$PROJECT_DIR"
    npm run build
}

migrate_db() {
    log "Применение миграций..."
    
    cd "$PROJECT_DIR"
    npx prisma db push --schema=db/prisma/schema.prisma --accept-data-loss
    npx prisma generate --schema=db/prisma/schema.prisma
}

restart_app() {
    log "Перезапуск приложения..."
    
    pm2 restart pizza-delivery
}

check_health() {
    log "Проверка здоровья приложения..."
    
    sleep 5
    
    if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        log "Приложение работает корректно"
    else
        log "Внимание: health check не прошел. Проверьте логи: pm2 logs pizza-delivery"
    fi
}

main() {
    log "=========================================="
    log "Обновление Pizza Delivery Platform"
    log "=========================================="
    
    backup_db
    update_code
    install_deps
    migrate_db
    build
    restart_app
    check_health
    
    log "=========================================="
    log "Обновление завершено!"
    log "=========================================="
}

main "$@"
