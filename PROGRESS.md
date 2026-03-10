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

### 3. Публичное меню - Модалка товара
- **Страница**: `app/(public)/menu/page.tsx`
- **Функционал**:
  - При клике на товар открывается модалка
  - Показ описания и состава
  - Выбор допов (extras) с чекбоксами
  - Количество с кнопками +/-
  - Автоматический подсчёт итоговой цены

### 4. Корзина
- **Страница**: `app/(public)/cart/page.tsx`
- **Функционал**:
  - Отображение допов (extras) для каждого товара
  - Удаление товаров по uniqueKey
  - Обновление количества

### 5. Оформление заказа
- **Страница**: `app/(public)/checkout/page.tsx`
- **Функционал**:
  - Проверка авторизации перед оформлением
  - Понятные сообщения об ошибках

### 6. Избранное
- **Страница**: `components/features/product-card.tsx`
- **Исправлено**:
  - Понятное сообщение при попытке добавить без авторизации

### 7. API endpoints

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

### 5. База данных (Prisma Schema)
- **Файл**: `db/prisma/schema.prisma`
- **Добавлено**:
  - Поле `composition` в модели Product (текстовое, db.Text)
  - Модель `ProductExtra` для допов к товарам

### 6. Бизнес-логика
- **Транслитерация**: Функция `transliterate()` в `create-product.use-case.ts`
  - Русский → английский (а=а, б=b, пицца=pizza, Пепперони=pepperoni)
  - Авто-генерация slug при создании товара
  - Уникальный slug с рандомом если занят

### 7. Архитектура
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
| `579cf6a` | 2026-03-11 | fix: resolve favorites, cart extras, checkout auth, composition, image preview |
| `c41e5ef` | 2026-03-11 | fix: resolve cart uniqueKey type error and useEffect dependencies |
| `ac23d78` | 2026-03-10 | feat: add extras support to cart - separate items with different extras |

---

## Структура проекта

```
app/
├── (public)/          # Публичные страницы
│   ├── menu/          # Меню с модалкой товара
│   └── checkout/      # Оформление заказа
├── admin/             # Админ-панель
│   ├── products/      # Товары
│   ├── categories/    # Категории
│   └── orders/        # Заказы
└── api/               # API endpoints
    ├── admin/         # Админские API
    └── products/      # Публичные API

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
