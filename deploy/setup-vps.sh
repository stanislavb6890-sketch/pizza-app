#!/bin/bash

set -e

REPO_URL="https://github.com/stanislavb6890-sketch/pizza.git"
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
    read -p "Введите домен (например, example.com): " DOMAIN
    read -p "Введите email для SSL-сертификата: " EMAIL
    
    if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
        error "Домен и email обязательны"
    fi
}

update_system() {
    log "Обновление системы..."
    apt update && apt upgrade -y
    apt install -y curl wget git unzip software-properties-common
}

install_nodejs() {
    log "Установка Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    npm install -g pm2
    node --version
    npm --version
}

install_mysql() {
    log "Установка MySQL..."
    export DEBIAN_FRONTEND=noninteractive
    apt install -y mysql-server
    
    systemctl start mysql
    systemctl enable mysql
    
    local DB_PASS=$(openssl rand -base64 12)
    local DB_NAME="pizza_delivery"
    local DB_USER="pizza_user"
    
    mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    echo "MYSQL_ROOT_PASSWORD=" >> /root/.pizza_env
    echo "DATABASE_URL=\"mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}\"" >> /root/.pizza_env
    
    log "MySQL установлен. Пароль сохранен в /root/.pizza_env"
}

install_redis() {
    log "Установка Redis..."
    apt install -y redis-server
    
    sed -i 's/^supervised .*/supervised systemd/' /etc/redis/redis.conf
    
    systemctl restart redis-server
    systemctl enable redis-server
    
    echo "REDIS_URL=\"redis://localhost:6379\"" >> /root/.pizza_env
}

install_nginx() {
    log "Установка Nginx..."
    apt install -y nginx
    
    systemctl start nginx
    systemctl enable nginx
}

install_certbot() {
    log "Установка Certbot..."
    apt install -y certbot python3-certbot-nginx
}

setup_ssl() {
    log "Настройка SSL-сертификата для $DOMAIN..."
    
    nginx -t && systemctl reload nginx
    
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" \
        --non-interactive --agree-tos --email "$EMAIL" \
        --redirect
    
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
    
    log "SSL настроен. Автообновление добавлено в crontab"
}

clone_project() {
    log "Клонирование проекта..."
    
    rm -rf "$PROJECT_DIR"
    git clone "$REPO_URL" "$PROJECT_DIR"
    
    cd "$PROJECT_DIR"
}

setup_env() {
    log "Настройка переменных окружения..."
    
    cd "$PROJECT_DIR"
    
    local NEXTAUTH_SECRET=$(openssl rand -base64 32)
    local JWT_SECRET=$(openssl rand -base64 32)
    
    if [[ -f .env.example ]]; then
        cp .env.example .env.production
    else
        touch .env.production
    fi
    
    cat >> .env.production <<EOF

NEXT_PUBLIC_APP_URL=https://${DOMAIN}
NEXTAUTH_URL=https://${DOMAIN}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
JWT_SECRET=${JWT_SECRET}
NODE_ENV=production
EOF
    
    cat /root/.pizza_env >> .env.production
    
    log ".env.production создан"
}

install_dependencies() {
    log "Установка зависимостей..."
    
    cd "$PROJECT_DIR"
    npm ci
}

setup_database() {
    log "Настройка базы данных..."
    
    cd "$PROJECT_DIR"
    
    npx prisma generate
    npx prisma migrate deploy
}

build_project() {
    log "Сборка проекта..."
    
    cd "$PROJECT_DIR"
    npm run build
}

configure_nginx() {
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
    ln -sf /etc/nginx/sites-available/pizza-delivery /etc/nginx/sites-enabled/
    
    nginx -t && systemctl reload nginx
}

start_app() {
    log "Запуск приложения..."
    
    cd "$PROJECT_DIR"
    
    pm2 delete pizza-delivery 2>/dev/null || true
    pm2 start npm --name "pizza-delivery" -- start
    pm2 save
    pm2 startup systemd -u root --hp /root
}

setup_firewall() {
    log "Настройка файрвола..."
    
    apt install -y ufw
    
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 'Nginx Full'
    ufw --force enable
    
    ufw status
}

print_summary() {
    log "=========================================="
    log "Установка завершена!"
    log "=========================================="
    echo ""
    echo "Сайт: https://${DOMAIN}"
    echo "Папка проекта: ${PROJECT_DIR}"
    echo "Переменные окружения: ${PROJECT_DIR}/.env.production"
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
    
    update_system
    install_nodejs
    install_mysql
    install_redis
    install_nginx
    install_certbot
    clone_project
    setup_env
    install_dependencies
    build_project
    setup_ssl
    configure_nginx
    setup_database
    start_app
    setup_firewall
    print_summary
}

main "$@"
