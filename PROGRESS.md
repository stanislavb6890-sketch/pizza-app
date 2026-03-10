# Pizza Delivery Platform - Сводка изменений

## Последнее обновление: 2026-03-10

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

### 4. API endpoints

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

# 1. Стянуть изменения
git pull

# 2. Сгенерировать Prisma клиент
npx prisma generate --schema=db/prisma/schema.prisma

# 3. Применить миграции
npx prisma db push --schema=db/prisma/schema.prisma

# 4. Пересобрать
npm run build

# 5. Перезапустить
pm2 restart pizza-delivery
```

---

## Текущие issues / TODO
- [ ] Исправить API extras - показывают ошибку LSP но работают
- [ ] Unit тесты на транслитерацию
- [ ] Страница extras для админов

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
