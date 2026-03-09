#!/bin/bash

log() {
    echo -e "\033[0;32m[OK] $1\033[0m"
}

log_error() {
    echo -e "\033[0;31m[FAIL] $1\033[0m"
}

log_warn() {
    echo -e "\033[0;33m[WARN] $1\033[0m"
}

errors=0

echo "=========================================="
echo "Проверка требований для установки"
echo "=========================================="
echo ""

echo "=== Операционная система ==="
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    if [[ "$ID" == "ubuntu" && ( "$VERSION_ID" == "20.04" || "$VERSION_ID" == "22.04" ) ]]; then
        log "Ubuntu $VERSION_ID"
    else
        log_error "Требуется Ubuntu 20.04 или 22.04. Текущая: $PRETTY_NAME"
        ((errors++))
    fi
else
    log_error "Не удалось определить ОС"
    ((errors++))
fi
echo ""

echo "=== Права доступа ==="
if [[ $EUID -eq 0 ]]; then
    log "Запущено от root"
else
    log_error "Требуются права root. Запустите с sudo"
    ((errors++))
fi
echo ""

echo "=== Ресурсы ==="
TOTAL_MEM=$(free -m | awk '/^Mem:/ {print $2}')
if [[ $TOTAL_MEM -ge 2048 ]]; then
    log "Память: ${TOTAL_MEM}MB"
else
    log_warn "Память: ${TOTAL_MEM}MB (рекомендуется минимум 2048MB)"
fi

TOTAL_DISK=$(df -BG / | awk 'NR==2 {print $4}' | tr -d 'G')
if [[ $TOTAL_DISK -ge 20 ]]; then
    log "Свободное место на диске: ${TOTAL_DISK}GB"
else
    log_error "Свободное место на диске: ${TOTAL_DISK}GB (требуется минимум 20GB)"
    ((errors++))
fi
echo ""

echo "=== Сеть ==="
if ping -c 1 -W 2 8.8.8.8 > /dev/null 2>&1; then
    log "Интернет соединение"
else
    log_error "Нет интернет соединения"
    ((errors++))
fi

read -p "Введите домен для проверки DNS: " DOMAIN
if [[ -n "$DOMAIN" ]]; then
    SERVER_IP=$(curl -sf ifconfig.me 2>/dev/null || curl -sf icanhazip.com 2>/dev/null)
    DOMAIN_IP=$(dig +short "$DOMAIN" | tail -1)
    
    if [[ "$SERVER_IP" == "$DOMAIN_IP" ]]; then
        log "DNS запись $DOMAIN указывает на этот сервер ($SERVER_IP)"
    else
        log_error "DNS запись $DOMAIN указывает на $DOMAIN_IP, а IP сервера $SERVER_IP"
        ((errors++))
    fi
else
    log_warn "Домен не указан, пропускаем проверку DNS"
fi
echo ""

echo "=== Порты ==="
for port in 80 443 22; do
    if ss -tuln | grep -q ":$port "; then
        log "Порт $port доступен"
    else
        log "Порт $port"
    fi
done
echo ""

echo "=== Уже установленные сервисы ==="
for cmd in node npm mysql redis-server nginx certbot; do
    if command -v $cmd &> /dev/null; then
        VERSION=$($cmd --version 2>/dev/null || echo "installed")
        log_warn "$cmd уже установлен ($VERSION)"
    else
        log "$cmd не установлен (будет установлен)"
    fi
done
echo ""

echo "=========================================="
if [[ $errors -eq 0 ]]; then
    echo -e "\033[0;32mВсе проверки пройдены. Можно запускать setup-vps.sh\033[0m"
    exit 0
else
    echo -e "\033[0;31mОбнаружено ошибок: $errors. Исправьте их перед установкой.\033[0m"
    exit 1
fi
