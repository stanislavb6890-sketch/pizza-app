# AGENTS.md

Pizza Delivery Platform - AI Coding Agent Guidelines

---

## Build/Lint/Test Commands

### Development
```bash
npm run dev          # Start dev server (Next.js)
npm run build        # Production build
npm run start        # Start production server
```

### Linting
```bash
npm run lint         # Run ESLint
```

### Testing (Vitest)
```bash
npx vitest                    # Run all tests
npx vitest run                # Run once (no watch)
npx vitest -- path/to/file.ts # Run single test file
npx vitest -t "test name"     # Run tests matching pattern
npx vitest --coverage         # Run with coverage
```

### Database (Prisma)
```bash
npx prisma generate           # Generate Prisma Client
npx prisma db push            # Push schema to DB
npx prisma migrate dev        # Create & apply migration
npx prisma studio             # Open Prisma Studio
```

---

## Project Structure
```
app/                    # Next.js App Router pages/routes
  (public)/            # Public routes (menu, cart, checkout)
  (auth)/              # Auth routes (login, register)
  admin/               # Admin panel
  api/                 # API Route Handlers
    auth/              # Authentication endpoints
    admin/             # Admin API endpoints
    cart/              # Cart endpoints
    products/          # Product endpoints
    orders/            # Order endpoints
components/            # Reusable UI components
  ui/                  # Base components (Button, Input, Card, Badge)
  features/            # Feature-specific components
modules/               # Domain modules (Clean Architecture)
  cart/
    domain/            # Entities (Cart, CartItem), repositories
    application/       # Use cases (add-to-cart, get-cart, etc.)
    infrastructure/    # Redis implementation
  order/
    domain/            # Entities (Order), repositories
    application/       # Use cases (create-order, cancel-order, etc.)
  product/
    domain/            # Entities, repositories
    application/       # Use cases
    infrastructure/    # Prisma implementation
  user/
    domain/            # Entities, repositories
    application/       # Use cases (login, register, refresh-token)
  delivery/
    domain/            # Entities, repositories
core/                  # Shared utilities
  auth/               # JWT service, auth interfaces
  config/             # Environment configuration
  logger/             # Logging + metrics
  validation/         # Zod schemas
  errors/             # ApiError class
db/prisma/            # Database schema
services/             # External integrations
  payment/            # Payment providers (YooKassa, Stripe)
infra/                # Infrastructure
  redis/              # Redis client
tests/unit/           # Unit tests (Vitest)
```

---

## Code Style Guidelines

### TypeScript
- Strict mode - no `any`, use `unknown` and narrow it
- Explicit return types for public functions
- Interfaces for object shapes, types for unions
- Use `import type` for type-only imports

### Imports Order
1. React/Next.js
2. Third-party libraries
3. Internal aliases (`@/`, `@modules/`, `@core/`)
4. Relative imports

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProductCard` |
| Functions/vars | camelCase | `createOrder` |
| Constants | SCREAMING_SNAKE | `MAX_ITEMS` |
| Files (components) | PascalCase | `ProductCard.tsx` |
| Files (utils) | kebab-case | `format-price.ts` |
| Interfaces | PascalCase, no I | `OrderRepository` |

### Formatting
- Indentation: 2 spaces
- Quotes: Single quotes (double for JSX)
- Semicolons: Required
- Trailing commas: Always

---

## Architecture

### Clean Architecture Layers
Dependencies flow inward: Infrastructure → Application → Domain

- **Domain**: No external dependencies (entities, value objects)
- **Application**: Depends only on domain (use cases)
- **Infrastructure**: Implements domain interfaces (repositories)

---

## Error Handling

### API Routes
```typescript
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) { super(message); }
}

// In route handlers:
catch (error) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.code, message: error.message },
      { status: error.statusCode }
    );
  }
  return NextResponse.json(
    { error: 'INTERNAL_ERROR', message: 'Unexpected error' },
    { status: 500 }
  );
}
```

### Validation
Use Zod for all external input:
```typescript
const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive()
  })).min(1)
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
```

---

## Testing
- Test domain logic in isolation
- Use mocked repositories for use cases
- Test files: `tests/unit/**/*.test.ts`

---

## Security
- Never commit secrets - use env variables
- Validate all input with Zod
- Use parameterized queries (Prisma)
- HTTP-only cookies for auth tokens

---

## Git Commits
```
feat: add order cancellation
fix: correct cart total
refactor: extract payment validation
test: add order entity tests
```
