# STACK_DECISIONS.md

## Why this project exists
This project is a learning platform to reach strong full-stack level with practical DevOps basics using modern, production-relevant tools.

## Chosen Stack (Current Baseline)

### Repository
- **pnpm** for package management in front-end and **yarn** for package management in back-end and workspaces
- Turborepo may be introduced later if needed (not mandatory for initial scaffold)

### Frontend
- **Next.js (App Router)**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** for UI building blocks
- **React Hook Form + Zod** for forms and validation
- **TanStack Query** for server state and caching (REST-first workflow)

### Backend
- **NestJS**
- **TypeScript**
- **REST-first API**
- **Prisma** ORM
- **PostgreSQL**
- Validation via DTOs and runtime validation (class-validator and/or Zod where appropriate)

### Infra / Platform
- **Docker Compose** for local development
- **Redis** (cache / queue dependency)
- **BullMQ** (background jobs / notifications / retries)
- **MinIO** (S3-compatible local object storage)
- **Mailhog** (local email testing)
- **GitHub Actions** for CI

### Testing / Quality
- ESLint
- Prettier
- TypeScript strict mode
- Unit tests (Jest/Vitest depending on app)
- e2e tests for critical API flows
- Storybook for reusable UI components
- Loki (or equivalent visual regression tool) later

## API Strategy Decision
### REST-first (default)
REST is chosen as the initial API style because it is:
- simpler to bootstrap
- easier to test and debug
- highly relevant for production systems
- a good fit for auth, uploads, admin tools, and CRUD + filtering flows

### GraphQL (later, targeted)
GraphQL may be added later for:
- complex read-heavy views
- dashboard aggregations
- learning comparison between REST and GraphQL approaches

## Architecture Strategy Decision
### Backend
- Modular monolith on NestJS
- Practical layered modules (controller -> application service -> domain/infrastructure)

### Frontend
- Next.js App Router + feature-based organization
- shared UI primitives and domain/entity-focused components

## Tools We Intentionally Postpone
These are good tools/approaches, but postponed to avoid early complexity:
- RabbitMQ
- CQRS (except maybe one module later)
- Event sourcing
- Microservices split
- Kubernetes

## Decision Quality Principles
When choosing tools or patterns:
1. Prefer production relevance over novelty
2. Prefer explicitness over magic
3. Prefer maintainability over speed hacks
4. Add complexity only when the problem requires it