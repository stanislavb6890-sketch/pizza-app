#!/bin/bash

set -e

REPO_URL="https://github.com/stanislavb6890-sketch/pizza-app.git"
PROJECT_DIR="/var/www/pizza-delivery"
DOMAIN=""
EMAIL=""

log() {
    echo -e "\033[0;32m[$(date +'%H:%M:%S')] $1\033[0m"
}

error() {
    echo -e "\033[0;31m[ERROR] $1\033[0m"
    exit 1
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "Этот скрипт должен быть запущен с правами root (sudo)"
    fi
}

get_params() {
    if [[ -f /root/.pizza_config ]]; then
        source /root/.pizza_config
        log "Найдена конфигурация из предыдущей установки"
        read -p "Использовать домен $DOMAIN и email $EMAIL? (y/n): " confirm
        if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
            read -p "Введите домен (например, example.com): " DOMAIN
            read -p "Введите email для SSL-сертификата: " EMAIL
        fi
    else
        read -p "Введите домен (например, example.com): " DOMAIN
        read -p "Введите email для SSL-сертификата: " EMAIL
    fi
    
    if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
        error "Домен и email обязательны"
    fi
    
    echo "DOMAIN=\"$DOMAIN\"" > /root/.pizza_config
    echo "EMAIL=\"$EMAIL\"" >> /root/.pizza_config
    
    log "Домен: $DOMAIN"
    log "Email: $EMAIL"
}

init_env_file() {
    log "Создание файла настроек..."
    if [[ ! -f /root/.pizza_env ]]; then
        touch /root/.pizza_env
        chmod 600 /root/.pizza_env
    fi
}

update_system() {
    if command -v node &> /dev/null && command -v npm &> /dev/null; then
        log "Система уже обновлена, пропускаем..."
        return 0
    fi
    
    log "Обновление системы..."
    export DEBIAN_FRONTEND=noninteractive
    apt update && apt upgrade -y
    apt install -y curl wget git unzip software-properties-common ca-certificates lsb-release
}

install_nodejs() {
    if command -v node &> /dev/null; then
        log "Node.js уже установлен: $(node --version)"
        if command -v pm2 &> /dev/null; then
            log "PM2 уже установлен"
        else
            npm install -g pm2
        fi
        return 0
    fi
    
    log "Установка Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    npm install -g pm2
    node --version
    npm --version
}

install_mysql() {
    if command -v mysql &> /dev/null; then
        log "MySQL уже установлен"
        
        local DB_NAME="pizza_delivery"
        local DB_USER="pizza_user"
        
        if ! grep -q "DATABASE_URL" /root/.pizza_env 2>/dev/null; then
            local DB_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 12)
            mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF
            echo "DATABASE_URL=\"mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}?schema=public\"" >> /root/.pizza_env
        else
            log "Конфигурация MySQL уже существует"
        fi
        return 0
    fi
    
    log "Установка MySQL..."
    export DEBIAN_FRONTEND=noninteractive
    apt install -y mysql-server
    
    systemctl start mysql
    systemctl enable mysql
    sleep 3
    
    local DB_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 12)
    local DB_NAME="pizza_delivery"
    local DB_USER="pizza_user"
    
    mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    echo "DATABASE_URL=\"mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}?schema=public\"" >> /root/.pizza_env
    
    log "MySQL установлен"
}

install_redis() {
    if command -v redis-server &> /dev/null; then
        log "Redis уже установлен"
        if ! grep -q "REDIS_URL" /root/.pizza_env 2>/dev/null; then
            echo "REDIS_URL=\"redis://localhost:6379\"" >> /root/.pizza_env
        fi
        return 0
    fi
    
    log "Установка Redis..."
    apt install -y redis-server
    sed -i 's/^supervised .*/supervised systemd/' /etc/redis/redis.conf || true
    systemctl restart redis-server
    systemctl enable redis-server
    sleep 2
    echo "REDIS_URL=\"redis://localhost:6379\"" >> /root/.pizza_env
    log "Redis установлен"
}

install_nginx() {
    if command -v nginx &> /dev/null; then
        log "Nginx уже установлен"
        return 0
    fi
    
    log "Установка Nginx..."
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    log "Nginx установлен"
}

install_certbot() {
    if command -v certbot &> /dev/null; then
        log "Certbot уже установлен"
        return 0
    fi
    
    log "Установка Certbot..."
    apt install -y certbot python3-certbot-nginx
    log "Certbot установлен"
}

ssl_exists() {
    if [[ -d "/etc/letsencrypt/live/$DOMAIN" ]]; then
        return 0
    fi
    return 1
}

create_temp_nginx_config() {
    if [[ -f /etc/nginx/sites-enabled/pizza-delivery ]]; then
        log "Nginx конфиг уже настроен, пропускаем..."
        return 0
    fi
    
    log "Создание временного конфига Nginx..."
    
    cat > /etc/nginx/sites-available/pizza-temp <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};
    
    location / {
        root /var/www/html;
        index index.html;
    }
}
EOF
    
    rm -f /etc/nginx/sites-enabled/default
    ln -sf /etc/nginx/sites-available/pizza-temp /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    log "Временный конфиг создан"
}

setup_ssl() {
    if ssl_exists; then
        log "SSL сертификат уже существует, пропускаем..."
        return 0
    fi
    
    log "Настройка SSL-сертификата для $DOMAIN..."
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" \
        --non-interactive --agree-tos --email "$EMAIL" --redirect || error "Ошибка получения SSL"
    
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
    log "SSL настроен"
}

project_exists() {
    if [[ -d "$PROJECT_DIR" && -f "$PROJECT_DIR/package.json" ]]; then
        return 0
    fi
    return 1
}

clone_project() {
    if project_exists; then
        log "Проект уже существует, обновляем..."
        cd "$PROJECT_DIR"
        git fetch origin
        git pull origin main
        return 0
    fi
    
    log "Клонирование проекта..."
    mkdir -p "$(dirname "$PROJECT_DIR")"
    rm -rf "$PROJECT_DIR"
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    log "Проект склонирован"
}

setup_env() {
    log "Настройка переменных окружения..."
    
    cd "$PROJECT_DIR"
    
    local NEXTAUTH_SECRET=$(openssl rand -base64 32)
    local JWT_SECRET=$(openssl rand -base64 32)
    
    if [[ ! -f .env ]]; then
        if [[ -f .env.example ]]; then
            cp .env.example .env
        else
            touch .env
        fi
    else
        log ".env уже существует, используем существующий"
    fi
    
    if ! grep -q "NEXTAUTH_SECRET" .env 2>/dev/null; then
        cat >> .env <<EOF

NEXT_PUBLIC_APP_URL=https://${DOMAIN}
NEXTAUTH_URL=https://${DOMAIN}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
JWT_SECRET=${JWT_SECRET}
NODE_ENV=production
EOF
    fi
    
    if ! grep -q "DATABASE_URL" .env 2>/dev/null && grep -q "DATABASE_URL" /root/.pizza_env 2>/dev/null; then
        cat /root/.pizza_env >> .env
    fi
    
    log ".env настроен"
}

install_dependencies() {
    if [[ -d "$PROJECT_DIR/node_modules" ]]; then
        log "Зависимости уже установлены, пропускаем..."
        return 0
    fi
    
    log "Установка зависимостей..."
    cd "$PROJECT_DIR"
    npm install --legacy-peer-deps || npm install
    log "Зависимости установлены"
}

setup_database() {
    log "Настройка базы данных..."
    
    cd "$PROJECT_DIR"
    
    source /root/.pizza_env
    DB_URL="$DATABASE_URL"
    DB_USER=$(echo "$DB_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo "$DB_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_NAME=$(echo "$DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    log "Проверка подключения к БД..."
    for i in 1 2 3; do
        if mysql -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1" "$DB_NAME" > /dev/null 2>&1; then
            log "Подключение к БД успешно"
            break
        else
            log "Попытка $i: Ошибка подключения, пересоздаем пользователя MySQL..."
            NEW_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 12)
            mysql -u root <<EOF
DROP USER IF EXISTS '$DB_USER'@'localhost';
CREATE USER '$DB_USER'@'localhost' IDENTIFIED BY '$NEW_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF
            sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"mysql://${DB_USER}:${NEW_PASS}@localhost:3306/${DB_NAME}?schema=public\"|" /root/.pizza_env
            sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"mysql://${DB_USER}:${NEW_PASS}@localhost:3306/${DB_NAME}?schema=public\"|" .env
            DB_PASS="$NEW_PASS"
            sleep 2
        fi
    done
    
    source /root/.pizza_env
    
    npx prisma generate --schema=db/prisma/schema.prisma || error "Ошибка генерации Prisma"
    npx prisma db push --schema=db/prisma/schema.prisma --accept-data-loss || error "Ошибка миграции БД"
    
    log "База данных настроена"
}

build_project() {
    if [[ -d "$PROJECT_DIR/.next" ]]; then
        log "Проект уже собран, пропускаем..."
        return 0
    fi
    
    log "Сборка проекта..."
    cd "$PROJECT_DIR"
    npm run build || error "Ошибка сборки"
    log "Проект собран"
}

configure_nginx() {
    if [[ -f /etc/nginx/sites-enabled/pizza-delivery ]]; then
        log "Nginx конфиг уже настроен для приложения, пропускаем..."
        return 0
    fi
    
    log "Настройка Nginx..."
    
    cat > /etc/nginx/sites-available/pizza-delivery <<EOF
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=static_cache:10m max_size=100m inactive=30d;

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache static_cache;
        proxy_cache_valid 200 30d;
        proxy_cache_key \$scheme\$proxy_host\$request_uri;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
}
EOF

    rm -f /etc/nginx/sites-enabled/default
    rm -f /etc/nginx/sites-enabled/pizza-temp
    ln -sf /etc/nginx/sites-available/pizza-delivery /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    log "Nginx настроен"
}

start_app() {
    log "Запуск приложения..."
    
    cd "$PROJECT_DIR"
    
    pm2 delete pizza-delivery 2>/dev/null || true
    pm2 start npm --name "pizza-delivery" -- start
    pm2 save
    
    if [ -f /etc/systemd/system/pm2-root.service ]; then
        systemctl enable pm2-root
    else
        pm2 startup systemd -u root --hp /root 2>/dev/null || pm2 startup
    fi
    
    log "Приложение запущено"
}

setup_firewall() {
    if systemctl is-active --quiet ufw; then
        log "Файрвол уже настроен, пропускаем..."
        return 0
    fi
    
    log "Настройка файрвола..."
    apt install -y ufw
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp comment 'SSH'
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    ufw --force enable
    ufw status verbose
    log "Файрвол настроен"
}

print_summary() {
    log "=========================================="
    log "Установка завершена!"
    log "=========================================="
    echo ""
    echo "Сайт: https://${DOMAIN}"
    echo "Папка проекта: ${PROJECT_DIR}"
    echo "Переменные окружения: ${PROJECT_DIR}/.env"
    echo "Учетные данные БД: /root/.pizza_env"
    echo ""
    echo "Команды управления:"
    echo "  pm2 status              - статус приложения"
    echo "  pm2 logs pizza-delivery - логи приложения"
    echo "  pm2 restart pizza-delivery - перезапуск"
    echo "  sudo systemctl status nginx - статус Nginx"
    echo "  sudo systemctl status mysql - статус MySQL"
    echo "  sudo systemctl status redis-server - статус Redis"
    echo ""
}

main() {
    clear
    echo "=========================================="
    echo "  Pizza Delivery Platform - Автоустановка"
    echo "=========================================="
    echo ""
    
    check_root
    get_params
    init_env_file
    
    update_system
    install_nodejs
    install_mysql
    install_redis
    install_nginx
    install_certbot
    create_temp_nginx_config
    clone_project
    setup_env
    install_dependencies
    setup_database
    build_project
    setup_ssl
    configure_nginx
    start_app
    setup_firewall
    print_summary
}

main "$@"
