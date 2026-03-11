# Pizza Delivery Platform - Сводка изменений

## Последнее обновление: 2026-03-11

---

## Что сделано

### 1. Админ-панель - Управление товарами
- **Страница**: `app/admin/products/page.tsx`
- **Функционал**:
  - Добавление товаров (авто-slug с транслитерацией)
  - Редактирование товаров во всплывающем окне (модалка)
  - Удаление товаров
  - Поле "Состав" (composition)
  - Вес товара
  - Управление допами (extras) в модалке
  - **Загрузка фото** - локальный preview + загрузка на сервер

### 2. Админ-панель - Управление категориями
- **Страница**: `app/admin/categories/page.tsx`
- **Функционал**:
  - CRUD категорий
  - CRUD подкатегорий (subcategories)
  - Активация/деактивация, сортировка

### 3. Админ-панель - Банеры
- **Страница**: `app/admin/banners/page.tsx`
- **Функционал**:
  - CRUD банеров
  - Заголовок, подзаголовок, изображение, ссылка, текст кнопки
  - Активация/деактивация, сортировка

### 4. Публичное меню
- **Страница**: `app/(public)/menu/page.tsx`
- **Функционал**:
  - При клике на товар открывается модалка
  - Показ описания и состава
  - Выбор допов (extras) с чекбоксами
  - Количество с кнопками +/-
  - Автоматический подсчёт итоговой цены
  - **Фильтр по категориям** - кнопки категорий над товарами

### 5. Корзина
- **Страница**: `app/(public)/cart/page.tsx`
- **Функционал**:
  - Отображение допов (extras) для каждого товара
  - Удаление товаров по uniqueKey
  - Обновление количества

### 6. Оформление заказа
- **Страница**: `app/(public)/checkout/page.tsx`
- **Функционал**:
  - Проверка авторизации перед оформлением
  - Понятные сообщения об ошибках

### 7. Избранное
- **Компонент**: `components/features/product-card.tsx`
- **Исправлено**:
  - Понятное сообщение при попытке добавить без авторизации

### 8. Личный кабинет
- **Страницы**:
  - `/account` - профиль (имя, телефон, выход)
  - `/account/orders` - история заказов
  - `/account/favorites` - избранное
  - `/account/addresses` - адреса (добавить, редактировать, удалить, основной)
  - **Layout** с навигацией

### 9. Главная страница
- **Страница**: `app/page.tsx`
- **Функционал**:
  - **Банер** - загружается из админки, показывается первым
  - **Хиты продаж** - товары с isFeatured=true
  - **Акции** - товары со скидкой (discountPrice)
  - **Преимущества** - блок с иконками

### 10. Админ-панель - Дашборд
- **Страница**: `app/admin/dashboard/page.tsx`
- **Функционал**:
  - График заказов за 7 дней
  - Статусы заказов (с цветовой индикацией)
  - Топ продаваемых товаров
  - Сравнение с вчерашним днём
  - Ссылка на банеры

### 11. API endpoints

| Endpoint | Описание |
|----------|----------|
| `GET/POST /api/admin/categories` | Категории |
| `GET/PUT/DELETE /api/admin/categories/[id]` | Категория по ID |
| `GET/POST /api/admin/subcategories` | Подкатегории |
| `GET/PUT/DELETE /api/admin/subcategories/[id]` | Подкатегория по ID |
| `GET/POST /api/admin/extras` | Допы к товарам |
| `GET/PUT/DELETE /api/admin/extras/[id]` | Доп по ID |
| `GET /api/admin/products` | Товары |
| `POST /api/admin/products` | Создать товар |
| `GET/PUT/DELETE /api/admin/products/[id]` | Товар по ID |
| `GET /api/products/[id]/extras` | Допы товара для публичного API |
| `GET/POST /api/admin/banners` | Банеры |
| `GET/PUT/DELETE /api/admin/banners/[id]` | Банер по ID |
| `GET /api/banners` | Активные банеры |
| `GET /api/categories` | Категории для меню |
| `GET/POST /api/addresses` | Адреса пользователя |
| `GET/PUT/DELETE /api/addresses/[id]` | Адрес по ID |
| `POST /api/addresses/[id]/default` | Сделать основным |
| `PUT /api/auth/profile` | Обновить профиль |

### 12. База данных (Prisma Schema)
- **Файл**: `db/prisma/schema.prisma`
- **Добавлено**:
  - Поле `composition` в модели Product
  - Модель `ProductExtra` для допов к товарам
  - Модель `Banner` для банеров

### 13. Бизнес-логика
- **Транслитерация**: Функция `transliterate()` - русский → английский
- **uniqueKey в корзине** - товары с разными допами分开

### 14. Архитектура
- Clean Architecture: `modules/*/domain`, `application`, `infrastructure`
- Core: `auth`, `config`, `errors`, `logger`, `validation`
- Next.js App Router

---

## Как деплоить на VPS

```bash
cd /var/www/pizza-delivery
git pull
npx prisma generate --schema=db/prisma/schema.prisma
npx prisma db push --schema=db/prisma/schema.prisma
npm run build
pm2 restart pizza-delivery
```

---

## Текущие issues / TODO
- [ ] Unit тесты на транслитерацию
- [ ] Страница extras для админов

---

## Последние коммиты

| Хеш | Дата | Описание |
|------|------|----------|
| `2734013` | 2026-03-11 | feat: add banners - model, API, admin page, home page with hits and discounts |
| `4905aca` | 2026-03-11 | fix: favorites error, image upload, add categories to menu |
| `dfd34c7` | 2026-03-11 | feat: add user account pages - profile, addresses, favorites with API |
| `4355ff9` | 2026-03-11 | feat: add charts and stats to admin dashboard |
| `579cf6a` | 2026-03-11 | fix: resolve favorites, cart extras, checkout auth, composition, image preview |
| `c41e5ef` | 2026-03-11 | fix: resolve cart uniqueKey type error and useEffect dependencies |
| `ac23d78` | 2026-03-10 | feat: add extras support to cart - separate items with different extras |

---

## Структура проекта

```
app/
├── (public)/          # Публичные страницы
│   ├── menu/          # Меню с модалкой товара
│   ├── cart/          # Корзина
│   ├── checkout/      # Оформление заказа
│   └── account/       # Личный кабинет
├── admin/             # Админ-панель
│   ├── products/      # Товары
│   ├── categories/    # Категории
│   ├── banners/       # Банеры
│   ├── orders/        # Заказы
│   └── dashboard/     # Дашборд
└── api/               # API endpoints
    ├── admin/         # Админские API
    ├── products/      # Публичные API товаров
    ├── categories/    # Категории
    ├── banners/       # Банеры
    ├── addresses/     # Адреса
    └── auth/          # Авторизация

modules/
├── cart/              # Корзина
├── order/             # Заказы
├── product/           # Товары
├── user/              # Пользователи
└── delivery/          # Доставка

core/
├── auth/              # JWT
├── config/            # Env
├── errors/            # ApiError
├── logger/            # Логирование
└── validation/        # Zod схемы
```

---

## Контакты
- GitHub: stanislavb6890-sketch/pizza-app
- Telegram/Email: см. в проекте
