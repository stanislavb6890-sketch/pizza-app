#!/bin/bash

set -e

PROJECT_DIR="/var/www/pizza-delivery"
BACKUP_DIR="/var/backups/pizza-delivery"

log() {
    echo -e "\033[0;32m[$(date +'%H:%M:%S')] $1\033[0m"
}

error() {
    echo -e "\033[0;31m[ERROR] $1\033[0m"
    exit 1
}

list_backups() {
    log "Доступные бекапы базы данных:"
    ls -lh "$BACKUP_DIR"/db/*.sql.gz 2>/dev/null || echo "Бекапов не найдено"
}

list_commits() {
    log "Последние коммиты:"
    cd "$PROJECT_DIR"
    git log --oneline -10
}

restore_db() {
    local backup_file=$1
    
    if [[ ! -f "$backup_file" ]]; then
        error "Файл бекапа не найден: $backup_file"
    fi
    
    log "Восстановление БД из $backup_file..."
    
    source "$PROJECT_DIR/.env"
    
    gunzip -c "$backup_file" | mysql --defaults-extra-file=<(echo "[client]
user=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
password=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
host=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
database=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')")
    
    log "База данных восстановлена"
}

rollback_code() {
    local commit=$1
    
    log "Откат кода к коммиту $commit..."
    
    cd "$PROJECT_DIR"
    git checkout "$commit"
}

main() {
    if [[ $EUID -ne 0 ]]; then
        error "Запустите с правами root"
    fi
    
    echo ""
    echo "=========================================="
    echo "Откат Pizza Delivery Platform"
    echo "=========================================="
    echo ""
    
    list_backups
    echo ""
    list_commits
    echo ""
    
    read -p "Выберите действие: [1] Откатить код, [2] Восстановить БД, [3] И то и другое: " action
    
    case $action in
        1)
            read -p "Введите хеш коммита для отката: " commit
            rollback_code "$commit"
            npm install --prefix "$PROJECT_DIR"
            npm run build --prefix "$PROJECT_DIR"
            pm2 restart pizza-delivery
            ;;
        2)
            read -p "Введите путь к файлу бекапа: " backup_file
            pm2 stop pizza-delivery
            restore_db "$backup_file"
            pm2 start pizza-delivery
            ;;
        3)
            read -p "Введите хеш коммита для отката: " commit
            read -p "Введите путь к файлу бекапа: " backup_file
            pm2 stop pizza-delivery
            restore_db "$backup_file"
            rollback_code "$commit"
            npm install --prefix "$PROJECT_DIR"
            npm run build --prefix "$PROJECT_DIR"
            pm2 start pizza-delivery
            ;;
        *)
            error "Неверный выбор"
            ;;
    esac
    
    log "Откат завершен!"
}

main "$@"
