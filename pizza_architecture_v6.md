# 🍕 Pizza Delivery Platform — Architecture v6.1

**Status:** Production Grade\
**Architecture:** Scalable Modular Monolith → Microservice Ready\
**Stack:** Next.js (App Router), TypeScript, MySQL, Prisma, Redis, Docker, VPS/Kubernetes Ready

---

## 1. System Overview

Pizza Delivery Platform — высокопроизводительное ecommerce‑приложение для:

- Онлайн‑заказов
- Работающей в реальном времени корзины
- Админ‑управления
- Обработки платежей
- Логистики и доставки

Архитектура v6.1 фокусируется на:

- Чистой архитектуре (Clean Architecture)
- Domain‑Driven Design (DDD)
- Security by Default
- Observability
- Horizontal Scalability
- Production Reliability

---

## 2. High‑Level Architecture

Client Layer ↓ Edge Layer (Nginx / CDN) ↓ Application Layer (Next.js App Server) ↓ Domain Layer ↓ Infrastructure Layer ↓ Data Layer (MySQL + Redis)

---

## 3. Technology Stack

**Frontend**

- Next.js (App Router, React Server Components)
- TypeScript
- TailwindCSS
- Zustand (глобальное состояние)
- React Query / TanStack Query (data‑fetching и кэширование)

**Backend**

- Next.js Route Handlers / API Routes
- Prisma ORM
- MySQL
- Redis (кэш, сессии, rate limit)

**Infrastructure**

- Docker
- Nginx
- PM2 / Node runtime
- Ubuntu VPS / Kubernetes‑кластер

**Observability**

- Prometheus (метрики)
- Grafana (дашборды)
- Loki (логи)

**CI/CD**

- GitHub Actions
- Docker Registry
- Автоматические миграции (Prisma)

---

## 4. Project Structure (v6.1)

Высокоуровневая структура:

- `app/`
  - UI (страницы, RSC, маршруты)
  - Public/Edge‑слой
- `components/`
  - Переиспользуемые UI‑компоненты
- `modules/`
  - Фиче‑модули (bounded contexts на уровне приложения):
  - `cart/`, `order/`, `product/`, `user/`, `delivery/`
- `core/`
  - Кросс‑доменные вещи:
  - `auth/`, `config/`, `logger/`, `validation/`
- `db/`
  - `prisma/`, `migrations/`
- `services/`
  - Интеграции и инфраструктурные сервисы:
  - `payment/`, `email/`, `notification/`
- `infra/`
  - `redis/`, `queue/`, `storage/` и др. адаптеры
- `tests/`
  - `e2e/`, `integration/`, `unit/`

---

## 5. Clean Architecture Layers & Mapping

**Presentation**

- React UI (`app/`, `components/`)
- API Routes / Route Handlers (`app/api/…`)
- DTO‑валидация (`core/validation/`)

**Application**

- Use‑cases и application‑сервисы (`modules/*/application`, `modules/*/use-cases`)
- Транзакционный оркестратор (сервисы, управляющие несколькими репозиториями)
- Управление workflow (создание заказа, оплата, уведомления)

**Domain**

- Доменные сущности и value‑objects (`modules/*/domain`)
- Доменные правила и инварианты
- Агрегаты (например, `Order` как агрегат с `OrderItem`)

**Infrastructure**

- Реализации репозиториев (Prisma, Redis) (`modules/*/infrastructure`, `db/`, `infra/`)
- Внешние API и платёжные провайдеры (`services/payment/*`)
- Очереди, хранилища, email‑провайдеры (`infra/queue/`, `services/email/`)

Такое маппирование делает связку DDD + Clean Architecture прозрачной и однозначной.

---

## 6. Database Design

**Main Entities (доменные агрегаты и сущности):**

- `User`
- `AdminUser`
- `Product`
- `Category`
- `SubCategory`
- `Cart`
- `Order`
- `OrderItem`
- `Address`
- `DeliveryZone`
- `Payment`

**Key Principles:**

- UUID как первичные ключи
- Soft delete для бизнес‑данных (флаг `deleted_at`/`is_deleted`)
- Индексированные внешние ключи
- Аудит‑поля (`created_at`, `updated_at`, `created_by`, `updated_by`)

---

## 7. Security Architecture

**Authentication**

- JWT + Refresh Tokens
- HTTP‑only, Secure cookies
- Короткоживущий access‑token, более долгоживущий refresh‑token
- Ротация refresh‑токенов + blacklist/whitelist‑механизм для отзыва сессий

**Authorization**

- RBAC
- Админ‑роли (`AdminUser` с отдельной моделью и правами)
- Разделение прав по модулям (заказы, продукты, отчёты и т.п.)

**Security Layers**

- Rate limiting (Redis)
- CSRF‑защита
- XSS‑санитизация входных данных
- SQL‑инъекции — защита за счёт Prisma
- Brute‑force защита (ограничения по логину/паролю, капча после n‑попыток)

**Admin Hardening**

- Усиленный rate limit и отдельные правила для `/admin`
- Возможная IP‑фильтрация / VPN‑доступ
- Поддержка 2FA для `AdminUser`

**Security Headers**

- `Strict-Transport-Security`
- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`

---

## 8. Performance Strategy

**Caching — многоуровневая стратегия**

1. CDN — статика, изображения, публичные страницы меню
2. Next.js ISR — полустатичные страницы (меню, акции)
3. Redis Cache — кэш популярных запросов (меню, зоны доставки, настройки)
4. Query‑кэш (React Query) — кэширование на клиенте/в RSC

**Стратегия инвалидации:**

- TTL для быстро меняющихся данных (статусы заказов, корзина)
- Event‑based инвалидция:
  - после изменения меню/цен в админке
  - после успешной оплаты (инвалидируем корзину/кэш заказа)
  - после изменения зон доставки
- Явное сброс кэша из админ‑панели (масштабные изменения)

**Database**

- Пул подключений
- Индексированные запросы под конкретные use‑cases
- Оптимизированные `select` в Prisma (минимум полей)

**Frontend**

- React Server Components
- Streaming‑рендеринг
- Lazy loading для тяжёлых компонентов
- Оптимизация изображений

---

## 9. Admin Panel Architecture

**Admin‑модули:**

- Dashboard
- Orders
- Products
- Categories / SubCategories
- Customers
- Delivery / DeliveryZones
- Analytics
- Settings

**Принципы:**

- Ролевые разрешения (RBAC по модулям/действиям)
- Audit‑логи по ключевым действиям (цены, статусы заказов, роли)
- Bulk‑операции (массовые изменения статусов, цен, акций)
- Реальное время по заказам (WebSocket / SSE / polling)

---

## 10. Payment System

**Provider Abstraction Layer**

`PaymentService`:

- `YooKassaProvider`
- `StripeProvider`
- `PayPalProvider`

**Key Features:**

- Верификация webhook’ов (подписи/секреты)
- Idempotency keys для операций (создание платежа, повторный webhook)
- Retry‑логика с backoff
- Трекинг статусов платежей и привязка к `Order`
- Логирование всех платёжных событий для дальнейшего аудита

---

## 11. Order Processing Flow

1. Клиент добавляет товары в корзину
2. Корзина хранится в Redis (по `user_id`/`session_id`)
3. Валидация при checkout (наличие товаров, цены, ограничения по зоне)
4. Авторизация платежа
5. Создание `Order` + `OrderItem` в БД (в одной транзакции)
6. Обновление статуса платежа
7. Отправка уведомлений (email/push/telegram и т.п.)
8. Обновление админ‑дашборда (realtime)

---

## 12. Deployment Architecture

**Edge:**

- CDN (например, Cloudflare) — кэш статики, базовая защита

**Server:**

Nginx → Docker‑контейнеры → Next.js App → Redis → MySQL

- Nginx как reverse‑proxy и TLS‑терминация
- Несколько реплик Next.js для горизонтального масштабирования
- Отдельные контейнеры для Redis и MySQL (или управляемые сервисы)

---

## 13. CI/CD Pipeline

1. Push в GitHub
2. Запуск линтера и тестов (unit + integration)
3. Сборка Docker‑образа
4. Прогон миграций Prisma в staging
5. Deploy в staging, smoke‑тесты
6. Deploy в production (blue‑green / rolling)
7. Прогон миграций в production с учётом совместимости версий схемы
8. Health‑checks и canary‑мониторинг
9. Rollback при неуспехе (откат трафика + отдельная стратегия по миграциям)

---

## 14. Monitoring & Observability

**Metrics (через Prometheus):**

- API‑латентность (P50/P95/P99)
- Количество запросов / RPS
- Количество запросов к БД и их латентность
- Error‑rate по ключевым endpoint’ам
- Загрузка CPU/Memory по сервисам

**Logging (через Loki + структурированные логи):**

- Корреляционные ID для каждого запроса/заказа
- Логирование ключевых доменных событий (`OrderCreated`, `PaymentFailed` и т.п.)

**Dashboards (Grafana):**

- Общее состояние системы
- Бизнес‑метрики (количество заказов, конверсия checkout)
- Отдельные дашборды для платежей и доставки

**Alerts:**

- Высокая латентность API (например, P95 > 300ms)
- Ошибки БД / деградация (ошибки подключения, рост медленных запросов)
- Рост 5xx‑ошибок
- Аномальный рост `PaymentFailed`
- Утечки памяти / переполнения диска / переподключения к Redis

---

## 15. Testing Strategy

**Unit Tests (Vitest):**

- Доменные правила (скидки, статусы, правила доставки)
- value‑objects (валидация, инварианты)
- простая бизнес‑логика в use‑cases

**Integration Tests (API + DB):**

- Основные API‑ендпоинты (создание/обновление заказа, корзина, продукты)
- Репозитории с Prisma (работа с реальной схемой)
- Интеграция с Redis (кэш, сессии, rate‑limit)

**E2E Tests (Playwright):**

- Полный флоу пользователя: от выбора пиццы до оплаты и статуса заказа
- Сценарии отказов (ошибка платежа, недоступный продукт)
- Smoke‑тесты для админ‑панели (изменение цен, статусов)

**Coverage Target:**

- Минимум 80% по критичным модулям (`order`, `payment`, `cart`)

---

## 16. Scalability Roadmap

**Phase 1 — Modular Monolith**

- Текущая архитектура (монолитный репозиторий, выделенные модули/слои)

**Phase 2 — Service Extraction**

- Выделение сервисов:
  - Order Service
  - Payment Service
  - Notification Service
- Общий контракт/схема событий и API между сервисами

**Phase 3 — Event‑Driven**

- Переход к event‑driven взаимодействию:
  - Kafka / RabbitMQ
  - Явные доменные события (`OrderCreated`, `PaymentCaptured`, `OrderDelivered`)
- Отвязка долгоживущих операций (уведомления, аналитика) от синхронных запросов

---

## 17. Production Checklist

- ✓ HTTPS везде
- ✓ Регулярные бэкапы БД и проверка восстановления
- ✓ Rate limiting на публичных и админ‑ендпоинтах
- ✓ Централизованный сбор логов
- ✓ Error tracking (Sentry / аналог)
- ✓ Health‑endpoint’ы для всех сервисов
- ✓ Регулярный load‑/stress‑testing

---

## 18. Future Improvements

- Mobile App (React Native)
- Recommendation Engine
- AI‑Upsell (персонализированные предложения)
- Delivery tracking в реальном времени
- Multi‑restaurant support (multi‑tenant архитектура)

---

## Version

Architecture v6.1
