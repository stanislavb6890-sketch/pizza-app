# Pizza Delivery Platform

Production-grade ecommerce application for online pizza ordering with real-time cart, admin management, payment processing, and delivery logistics.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: Next.js Route Handlers, Prisma ORM
- **Database**: MySQL
- **Cache**: Redis
- **Architecture**: Clean Architecture + Domain-Driven Design (DDD)

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+
- Redis 7+

### Installation

```bash
npm install
```

### Environment Setup

Create `.env` file:

```env
DATABASE_URL="mysql://user:password@localhost:3306/pizza_platform"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="your-secret-key"
```

### Database Setup

```bash
npx prisma generate
npx prisma migrate dev
```

### Development

```bash
npm run dev
```

## Project Structure

```
app/           # Next.js App Router pages and routes
components/    # Reusable UI components
modules/       # Domain modules (bounded contexts)
core/          # Cross-domain shared utilities
db/            # Database configuration
services/      # External service integrations
infra/         # Infrastructure adapters
tests/         # Test files
```

## Architecture

See [pizza_architecture_v6.md](./pizza_architecture_v6.md) for detailed architecture documentation.

## License

ISC
