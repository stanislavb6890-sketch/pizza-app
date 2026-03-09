#!/bin/bash

log() {
    echo -e "\033[0;32m$1\033[0m"
}

log_error() {
    echo -e "\033[0;31m$1\033[0m"
}

log_warn() {
    echo -e "\033[0;33m$1\033[0m"
}

check_service() {
    local service=$1
    if systemctl is-active --quiet "$service"; then
        log "✓ $service: OK"
        return 0
    else
        log_error "✗ $service: FAIL"
        return 1
    fi
}

check_port() {
    local port=$1
    local service=$2
    if ss -tuln | grep -q ":$port "; then
        log "✓ Port $port ($service): LISTEN"
    else
        log_error "✗ Port $port ($service): NOT LISTEN"
    fi
}

check_disk() {
    local usage=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
    if [[ $usage -lt 80 ]]; then
        log "✓ Disk usage: ${usage}%"
    elif [[ $usage -lt 90 ]]; then
        log_warn "! Disk usage: ${usage}% (warning)"
    else
        log_error "✗ Disk usage: ${usage}% (critical)"
    fi
}

check_memory() {
    local total=$(free -m | awk '/^Mem:/ {print $2}')
    local used=$(free -m | awk '/^Mem:/ {print $3}')
    local percent=$((used * 100 / total))
    
    if [[ $percent -lt 80 ]]; then
        log "✓ Memory: ${used}MB/${total}MB (${percent}%)"
    else
        log_warn "! Memory: ${used}MB/${total}MB (${percent}%)"
    fi
}

check_ssl() {
    local domain=$(grep -oP 'server_name \K[^;]+' /etc/nginx/sites-enabled/pizza-delivery 2>/dev/null | head -1)
    
    if [[ -n "$domain" ]]; then
        local expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain":443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        local expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null)
        local now_epoch=$(date +%s)
        local days=$(( (expiry_epoch - now_epoch) / 86400 ))
        
        if [[ $days -gt 30 ]]; then
            log "✓ SSL Certificate: expires in $days days"
        elif [[ $days -gt 7 ]]; then
            log_warn "! SSL Certificate: expires in $days days"
        else
            log_error "✗ SSL Certificate: expires in $days days (URGENT)"
        fi
    else
        log_warn "! SSL: Domain not found"
    fi
}

check_app() {
    if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        log "✓ App health check: OK"
    else
        log_error "✗ App health check: FAIL"
    fi
}

check_db() {
    if mysqladmin ping -h localhost --silent 2>/dev/null; then
        log "✓ MySQL: OK"
    else
        log_error "✗ MySQL: FAIL"
    fi
}

check_redis() {
    if redis-cli ping 2>/dev/null | grep -q PONG; then
        log "✓ Redis: OK"
    else
        log_error "✗ Redis: FAIL"
    fi
}

check_pm2() {
    local status=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="pizza-delivery") | .pm2_env.status' 2>/dev/null)
    
    if [[ "$status" == "online" ]]; then
        log "✓ PM2 pizza-delivery: online"
        local restarts=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="pizza-delivery") | .pm2_env.restart_time' 2>/dev/null)
        local memory=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="pizza-delivery") | .monit.memory' 2>/dev/null)
        local memory_mb=$((memory / 1024 / 1024))
        log "  Restarts: $restarts, Memory: ${memory_mb}MB"
    else
        log_error "✗ PM2 pizza-delivery: $status"
    fi
}

check_nginx() {
    if curl -sf -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
        log "✓ Nginx response: OK"
    else
        log_error "✗ Nginx response: FAIL"
    fi
}

main() {
    clear
    echo "=========================================="
    echo "Pizza Delivery - Health Check"
    echo "$(date)"
    echo "=========================================="
    echo ""
    
    echo "=== Services ==="
    check_service nginx
    check_service mysql
    check_service redis
    echo ""
    
    echo "=== Ports ==="
    check_port 80 "HTTP"
    check_port 443 "HTTPS"
    check_port 3000 "App"
    check_port 3306 "MySQL"
    check_port 6379 "Redis"
    echo ""
    
    echo "=== Application ==="
    check_pm2
    check_app
    check_nginx
    echo ""
    
    echo "=== Database ==="
    check_db
    check_redis
    echo ""
    
    echo "=== SSL ==="
    check_ssl
    echo ""
    
    echo "=== System ==="
    check_disk
    check_memory
    echo ""
    
    echo "=========================================="
}

main "$@"
