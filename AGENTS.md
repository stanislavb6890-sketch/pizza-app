# AGENTS.md

This document provides guidance for AI coding agents working in this Pizza Delivery Platform codebase.

---

## Project Overview

Pizza Delivery Platform is a production-grade ecommerce application built with Next.js (App Router), TypeScript, MySQL, Prisma, and Redis. The architecture follows Clean Architecture + Domain-Driven Design (DDD) principles.

---

## Build/Lint/Test Commands

### Development

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
```

### Linting & Formatting

```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm run format:check # Check formatting without changes
```

### Testing

```bash
npm run test                    # Run all unit tests (Vitest)
npm run test:watch              # Run tests in watch mode
npm run test:coverage           # Run tests with coverage report
npm run test -- path/to/file.ts # Run single test file
npm run test -- -t "test name"  # Run tests matching pattern

npm run test:integration        # Run integration tests
npm run test:e2e                # Run E2E tests (Playwright)
npm run test:e2e:ui             # Run E2E tests with UI
```

### Database (Prisma)

```bash
npx prisma validate             # Validate schema
npx prisma migrate dev          # Create and apply migration
npx prisma migrate deploy       # Apply migrations (production)
npx prisma generate             # Generate Prisma Client
npx prisma studio               # Open Prisma Studio
npx prisma db push              # Push schema changes (dev only)
```

---

## Project Structure

```
app/                    # Next.js App Router pages and routes
  (public)/            # Public routes (menu, cart, checkout)
  (admin)/             # Admin panel routes
  api/                 # API Route Handlers
components/            # Reusable UI components
  ui/                  # Base UI components (Button, Input, etc.)
  features/            # Feature-specific components
modules/               # Domain modules (bounded contexts)
  cart/
    domain/            # Entities, value objects, domain events
    application/       # Use cases, application services
    infrastructure/    # Repository implementations
  order/
  product/
  user/
  delivery/
core/                  # Cross-domain shared utilities
  auth/                # Authentication interfaces, token types
  config/              # Environment configuration
  logger/              # Logging abstraction
  validation/          # DTO validation schemas (Zod)
db/                    # Database configuration
  prisma/
    schema.prisma
services/              # External service integrations
  payment/             # Payment providers (YooKassa, Stripe)
  email/
  notification/
infra/                 # Infrastructure adapters
  redis/
  queue/
  storage/
tests/                 # Test files
  unit/
  integration/
  e2e/
```

---

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - all code must pass strict type checking
- **No `any`** - use `unknown` when type is truly unknown, then narrow it
- **Explicit return types** for public functions and methods
- **Prefer interfaces** for object shapes, types for unions/primitives
- **Use const assertions** for literal types and readonly arrays

```typescript
// Good
interface CreateOrderInput {
  userId: string;
  items: OrderItemInput[];
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  // ...
}

// Bad
export async function createOrder(input: any) {
  // ...
}
```

### Imports

Import order (enforced by ESLint):

1. React/Next.js imports
2. Third-party libraries
3. Internal aliases (`@/`, `@modules/`, `@core/`)
4. Relative imports (same directory)
5. Type imports (use `import type`)

```typescript
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { createOrder } from '@/modules/order/application/use-cases';
import type { Order } from '@/modules/order/domain/entities';
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProductCard`, `CheckoutForm` |
| Functions | camelCase | `createOrder`, `validatePayment` |
| Variables | camelCase | `orderItems`, `totalPrice` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_CART_ITEMS`, `DEFAULT_TTL` |
| Files (components) | PascalCase | `ProductCard.tsx` |
| Files (utilities) | kebab-case | `format-price.ts` |
| Files (pages) | kebab-case | `checkout-success.tsx` |
| Interfaces | PascalCase, no `I` prefix | `OrderRepository`, `PaymentService` |
| Types | PascalCase | `OrderStatus`, `PaymentResult` |
| Enums | PascalCase | `OrderStatus`, `UserRole` |

### Formatting

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings, double quotes for JSX attributes
- **Semicolons**: Required
- **Trailing commas**: Always (ES5 compatible)
- **Max line length**: 100 characters
- **Arrow functions**: Always parentheses for parameters

```typescript
const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};
```

---

## Architecture Guidelines

### Clean Architecture Layers

Dependencies flow **inward only**:

```
Infrastructure → Application → Domain
```

- **Domain layer** (`modules/*/domain`): No external dependencies
- **Application layer** (`modules/*/application`): Depends only on domain
- **Infrastructure layer** (`modules/*/infrastructure`): Implements interfaces from application

### Domain-Driven Design

- **Entities**: Objects with identity (User, Order, Product)
- **Value Objects**: Immutable, no identity (Money, Address, Email)
- **Aggregates**: Consistency boundaries (Order with OrderItems)
- **Repositories**: Abstract data access, defined in domain, implemented in infrastructure

```typescript
// Domain - entity
export class Order {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly items: OrderItem[],
    public status: OrderStatus,
  ) {}

  static create(input: CreateOrderInput): Order {
    // Domain validation and creation logic
  }
}

// Application - use case
export class CreateOrderUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    // Use case logic
  }
}
```

---

## Error Handling

### API Routes

Use consistent error response format:

```typescript
// core/errors/api-error.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

// Usage in route handlers
export async function POST(request: Request) {
  try {
    // ...
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}
```

### Validation

Use Zod schemas for all external input:

```typescript
import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
  addressId: z.string().uuid(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
```

---

## Testing Guidelines

### Unit Tests (Vitest)

- Test domain logic in isolation
- Test use cases with mocked repositories
- Aim for 80% coverage on critical modules (`order`, `payment`, `cart`)

```typescript
describe('Order', () => {
  it('should calculate total correctly', () => {
    const order = Order.create({ items: mockItems });
    expect(order.total).toBe(expectedTotal);
  });
});
```

### Integration Tests

- Use test database with transactions (rollback after each test)
- Test repository implementations
- Test API endpoints

### E2E Tests (Playwright)

- Test critical user flows: browse → cart → checkout → payment
- Test admin operations
- Run against staging environment

---

## Security

- **Never commit secrets** - use environment variables
- **Validate all input** at API boundaries with Zod
- **Use parameterized queries** (Prisma handles this)
- **Sanitize user content** before rendering
- **Rate limit** public endpoints (Redis)
- **CSRF protection** enabled for session-based routes
- **HTTP-only cookies** for authentication tokens

---

## Git Commit Conventions

Use conventional commits:

```
feat: add order cancellation feature
fix: correct cart total calculation
refactor: extract payment validation to core
test: add unit tests for order entity
docs: update API documentation
chore: update dependencies
```

---

## Notes

- Run `npm run lint` and `npm run test` before committing
- All new features require corresponding tests
- Follow existing patterns in the codebase
- Keep domain logic pure (no external side effects)
