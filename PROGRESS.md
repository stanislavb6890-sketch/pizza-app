```markdown
# 🤖 ИНСТРУКЦИИ ДЛЯ ИИ - Pizza Delivery Platform

## 🎯 ОСНОВНОЙ СТЕК И АРХИТЕКТУРА
```
Next.js 14.2.15 (App Router) + TypeScript + Prisma + PostgreSQL
Clean Architecture: modules/*/domain → application → infrastructure
НЕ ИЗМЕНЯЙ структуру без согласования!
```

## 📁 СТРУКТУРА ПРОЕКТА (НЕ ТРОГАЙ)
```
app/
├── (public)/          # Публичные страницы (НЕ admin)
│   ├── menu/         # ✅ Готово - модалка товара + допы
│   ├── cart/         # ✅ Готово - uniqueKey + extras
│   ├── checkout/     # ⚠️ TODO: время, зоны, оплата
│   └── account/      # ✅ Готово - профиль/адреса/заказы
├── admin/            # Админка (отдельный layout)
│   ├── products/     # ✅ Готово - CRUD + фото + extras
│   ├── categories/   # ✅ Готово - CRUD + подкатегории
│   ├── banners/      # ✅ Готово
│   └── dashboard/    # ✅ Графики + стата
modules/              # Clean Arch - НЕ ЛЕЗЬ БЕЗ ПРИЧИНЫ
core/                 # auth/config/errors/logger/validation
db/prisma/schema.prisma # ✅ ProductExtra, Banner, composition
```

## 🛠️ ПРАВИЛА РАЗРАБОТКИ

### ✅ ДЕЛАЙ ТАК:
```
1. Новые API → app/api/[module]/[action]/route.ts
2. Domain логика → modules/[module]/domain/entities/*.entity.ts
3. Prisma модели → db/prisma/schema.prisma (только согласованные)
4. Zod схемы → core/validation/schemas/
5. useCallback для всех функций в useEffect
6. uniqueKey = `${productId}-${extrasHash}` в корзине
7. Транслит slug = transliterate(название)
```

### ❌ НЕ ДЕЛАЙ:
```
❌ НЕ МЕНЯЙ app/(public)/ и app/admin/ структуру
❌ НЕ ТРОГАЙ core/ без необходимости  
❌ НЕ ПИШИ SQL-запросы напрямую (только Prisma)
❌ НЕ ИСПОЛЬЗУЙ useEffect без зависимостей
❌ НЕ ЗАБЫВАЙ uniqueKey в CartItemComponent
❌ НЕ МЕНЯЙ деплой-скрипт (prisma generate → build → pm2)
```

## 🚀 ПРИОРИТЕТНЫЕ TODO (в порядке важности)

### 🔥 КРИТИЧНО ДЛЯ ЗАПУСКА:
```
1. [ ] app/(public)/checkout/ - Order модель + создание заказа
2. [ ] app/admin/orders/ - таблица статусов + назначение курьера
3. [ ] ЮKassa интеграция в checkout
4. [ ] Зоны доставки Белово (1 магазин, 2 курьера)
```

### 🟡 УЛУЧШЕНИЯ:
```
5. [ ] app/admin/extras/ - CRUD для ProductExtra
6. [ ] Telegram бот для курьеров
7. [ ] SMS уведомления
```

## 💾 ПРИМЕРЫ ПРАВИЛЬНОГО КОДА

### НОВЫЙ API (app/api/orders/route.ts):
```ts
import { NextRequest, NextResponse } from 'next/server'
import { createOrderUseCase } from '@/modules/order/application/create-order.usecase'
import { orderValidation } from '@/core/validation/schemas/order.schema'

export async function POST(req: NextRequest) {
  try {
    const data = orderValidation.parse(await req.json())
    const result = await createOrderUseCase.execute(data)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    // core/errors/ApiError
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
```

### НОВЫЙ USECASE (modules/order/application/create-order.usecase.ts):
```ts
import { Order } from '../domain/entities/order.entity'
import { IOrderRepository } from '../domain/repositories/order.repository.interface'

export class CreateOrderUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    // Бизнес-логика создания заказа
    const order = new Order(input)
    return this.orderRepo.save(order)
  }
}
```

## 🗄️ БАЗА ДАННЫХ - НЕ ИЗМЕНЯЙ БЕЗ ПРИЧИНЫ
```
Product: id, name, slug, price, discountPrice, imageUrl, composition, weight
ProductExtra: id, productId, name, price
Banner: id, title, subtitle, imageUrl, link, buttonText, isActive, sortOrder
User: стандартный next-auth
Address: userId, street, house, entrance, floor, isDefault
Cart: localStorage (uniqueKey)
```

## 🔧 ДЕПЛОЙ (НЕ МЕНЯЙ):
```bash
git pull && npx prisma generate && npx prisma db push && npm run build && pm2 restart pizza-delivery
```

## 📋 ЧЕКЛИСТ ПЕРЕД ДЕПЛОЕМ:
- [ ] Проверить `npm run lint` (если есть)
- [ ] Проверить `npm run build` локально
- [ ] Проверить базу: `npx prisma generate`
- [ ] Зайти на сайт проверить главную

## 🚀 БЫСТРЫЙ ДЕПЛОЙ (без базы):
```bash
git pull && npm run build && pm2 restart pizza-delivery
```

## 📞 КОНТАКТЫ РАЗРАБОТЧИКА
```
GitHub: stanislavb6890-sketch/pizza-app
Город: Белово (1 магазин, 2 курьера)
Масштаб: MVP → локальная доставка
```

---

**ВСЕ ИЗМЕНЕНИЯ КОПИРУЙ В ЭТОТ ФАЙЛ!** 
**ПРИ ПЕРЕДАННЫХ НОВЫХ TODO - ЧИТАЙ ЭТО ПЕРВЫМ!**
```

```markdown
# 🎨 УЛУЧШЕНИЯ UI/UX - ИНСТРУКЦИИ ДЛЯ ИИ

## 📋 КРИТЕРИИ "КРИВОТА" (что исправлять ПЕРВЫМ)

```
❌ ТЕКУЩИЕ ПРОБЛЕМЫ:
- Модалки на мобиле съезжают/перекрывают контент
- Loading спиннеры вместо скелетонов  
- Карточки товаров без hover/hover-эффектов
- Корзина без анимаций при добавлении/удалении
- Отсутствие glassmorphism/neumorphism
- Нет progress bar в checkout
```

## 🛠️ ПРИОРИТЕТНЫЕ ФИКСЫ (выполнять по порядку)

### 1. shadcn/ui + Skeletons (2 часа)
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card modal dialog badge skeleton
```

**Где ставить:**
```
✅ app/(public)/menu/loading.tsx ← Skeleton для товаров
✅ app/(public)/cart/loading.tsx  ← Skeleton для корзины  
✅ components/ui/skeleton.tsx    ← Экспорт для всех скелетонов
```

### 2. Мобильная адаптивность (3 часа)
```
📱 Фиксы Tailwind:
- Modal: max-h-[90vh] overflow-y-auto sm:max-w-2xl
- CartItem: grid grid-cols-1 sm:grid-cols-2 gap-4
- Menu filter: flex flex-wrap gap-2 justify-center
```

### 3. Framer Motion анимации (2 часа)
```tsx
// components/features/product-modal.tsx
import { motion, AnimatePresence } from 'framer-motion'

<AnimatePresence>
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    transition={{ duration: 0.2 }}
  >
```

### 4. Performance must-haves
```
✅ next/image ВЕЗДЕ:
<NextImage 
  src={product.imageUrl} 
  sizes="(max-width: 768px) 100vw, 300px"
  priority={index < 3}
/>

✅ React.memo(ProductCard)
✅ ISR для категорий: { revalidate: 3600 }
```

## 🎨 ВИЗУАЛЬНЫЕ УЛУЧШЕНИЯ (по 30 мин каждое)

```
1. Glassmorphism карточки:
   backdrop-blur-md bg-white/80 border border-white/50 shadow-xl

2. Hover эффекты:
   group-hover:scale-105 group-hover:shadow-2xl transition-all

3. Badge для акций/хитов:
   <Badge variant="destructive">−20%</Badge>

4. Counter анимация в корзине:
   <motion.span animate={{ scale: [1, 1.1, 1] }}>+1</motion.span>
```

## 📱 МОБИЛЬНЫЕ ФИЧИ ДЛЯ ДОСТАВКИ

```
✅ Bottom sheet вместо модалки:
- react-spring-bottom-sheet
- Высота auto на мобиле

✅ Swipe-to-delete корзина:
- react-swipeable

✅ Sticky кнопка "Оформить" в корзине
```

## 🚀 ПЛАН НА 3 ДНЯ (КОПИРУЙ В PROGRESS.md)

```
📅 День 1: shadcn + skeletons + next/image
📅 День 2: Mobile responsive + Framer Motion  
📅 День 3: Animations + Performance + SEO
```

## ✅ ГОТОВЫЕ CSS КЛАССЫ (копипаст)

```
Glass card: "backdrop-blur-md bg-white/80 border border-white/50 shadow-xl hover:shadow-2xl"
Loading skeleton: "animate-pulse bg-gray-200 rounded-lg h-64"
Product hover: "group hover:scale-105 transition-all duration-300"
Badge sale: "absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-500 text-xs px-2 py-1 rounded-full"
Counter: "flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-full text-sm font-medium"
```

## 🎯 МЕТРИКИ УСПЕХА (после улучшений)
```
✅ LCP < 2.5s (next/image + ISR)
✅ Mobile CLS = 0 (fixed layouts)  
✅ FCP < 1.8s (skeletons)
✅ Core Web Vitals → зелёные
```

---

**ВСЕ ИИ-ОТВЕТЫ ДОЛЖНЫ ССЫЛАТЬСЯ НА ЭТОТ РАЗДЕЛ!**
**ПЕРЕД ЛЮБЫМ КОДОМ - ПРОВЕРЯЙ ЭТОТ СПИСОК!**
```

**Скопируй это в PROGRESS.md после инструкций для ИИ** — теперь любой помощник будет понимать, что именно улучшать и в каком порядке. Твой проект получит профессиональный вид за 3 дня! [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/176442266/254e6565-821f-4b5b-a2f5-97538818b5cd/PROGRESS.md)

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

## 2026-03-11 - UI Улучшения

### Добавлено:
- **Skeletons**: `components/ui/skeleton.tsx` - ProductCardSkeleton, CartItemSkeleton, MenuPageSkeleton, CartPageSkeleton
- **Loading страницы**: `app/(public)/menu/loading.tsx`, `app/(public)/cart/loading.tsx`
- **Framer Motion**: Анимации в ProductCard (hover scale), анимации появления/удаления в Cart
- **Checkout**: Выбор способа оплаты (card/cash)
- **CreateOrderUseCase**: Использует цену из корзины с extras

### Установлено:
- framer-motion

---

## Последние коммиты

| Хеш | Дата | Описание |
|------|------|----------|
| `ef194cd` | 2026-03-11 | feat: add checkout payment method, skeletons, and framer motion animations |
| `4e15a1d` | 2026-03-11 | docs: update PROGRESS.md with all features |
| `2734013` | 2026-03-11 | feat: add banners - model, API, admin page, home page with hits and discounts |
| `4905aca` | 2026-03-11 | fix: favorites error, image upload, add categories to menu |
| `4355ff9` | 2026-03-11 | feat: add charts and stats to admin dashboard |
| `dfd34c7` | 2026-03-11 | feat: add user account pages - profile, addresses, favorites with API |

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
