# ARCHITECTURE.md

## High-Level Architecture

This project uses a **modular monolith** backend and a **feature-based frontend**.

- Backend: NestJS modular monolith, REST-first API
- Frontend: Next.js App Router + feature-based modules + shared UI/design system layer
- Database: PostgreSQL with Prisma
- Infrastructure: Redis / BullMQ / MinIO added incrementally

---

## Backend Architecture (NestJS)

### Architectural Style
Use a practical layered structure inside each domain module:
- **Controllers**: transport layer (HTTP)
- **DTOs**: input validation / transport contracts
- **Application services**: use cases and orchestration
- **Domain layer**: business rules, statuses, invariants (lightweight)
- **Infrastructure layer**: repositories, storage adapters, external integrations

Avoid overengineering. Do not implement “clean architecture by ceremony” unless required.

### Backend Modules (Planned)
Core modules:
- `auth`
- `users`
- `categories`
- `listings`
- `files`
- `messages`
- `moderation`
- `admin`
- `audit-log`
- `notifications` (later)
- `orders` / `reservations` (later)

Cross-cutting modules:
- `config`
- `database`
- `cache`
- `queue`
- `logger`
- `health`
- `common` (keep small and strict)

### Example Backend Folder Structure

src/
  main.ts
  app.module.ts
  modules/
    auth/
      controllers/
      dto/
      application/
      domain/
      infrastructure/
      auth.module.ts
    listings/
      controllers/
      dto/
      application/
      domain/
      infrastructure/
      listings.module.ts
    ...
  common/
    guards/
    decorators/
    filters/
    interceptors/
    pipes/

## Backend Rules

### Controllers

- Controllers must be thin
- Validate input via DTOs (and runtime validation)
- Delegate business logic to application services
- Return clear and safe response shapes
- Do not leak internal errors directly to clients

### Services / Use Cases

- Place core business logic in application services
- Keep domain rules explicit (statuses, invariants, transitions)
- Use transactions for critical multi-step operations
- Prefer idempotent design for operations likely to be retried

### Prisma / Data Access

- Access Prisma through infrastructure/repository layer (not controllers)
- Write readable queries
- Add indexes based on actual query patterns
- Avoid premature raw SQL
- If using raw SQL for performance, document the reason clearly

### Validation / Security

- Backend validation is mandatory (frontend validation is not sufficient)
- Normalize inputs where needed (email lowercase/trim)
- Hash passwords securely
- Never store secrets in source code
- Never return sensitive fields (password hashes, token hashes)
- Enforce auth and authorization checks on protected endpoints


## Frontend Architecture (Next.js App Router)

### Architectural Style

Use Next.js App Router for routing/layouts and a feature-based code organization for business logic and UI composition.

### Folder Strategy

- `app/` — routes, layouts, page composition
- `features/` — business use cases (forms, flows, interactions)
- `entities/` — reusable domain-specific UI units
- `shared/` — generic UI, API client, helpers, hooks, config, utilities

### Example Frontend Folder Structure

src/
  app/
    (public)/
      page.tsx
      catalog/page.tsx
      listing/[id]/page.tsx
    (auth)/
      login/page.tsx
      register/page.tsx
    (account)/
      profile/page.tsx
      seller/listings/page.tsx
    admin/
      page.tsx
    layout.tsx

  features/
    auth/
      components/
      hooks/
      api/
    listings/
      components/
      forms/
      api/
    catalog-filters/
      components/
      hooks/
    messages/
      components/
      api/

  entities/
    listing/
      components/
      model/
    user/
      components/
      model/
    category/
      components/
      model/

  shared/
    ui/
      shadcn/      # generated shadcn components (or equivalent configured dir)
      app/         # project-standardized wrappers/components
    api/
      client.ts
      types.ts
    lib/
    hooks/
    config/
    constants/
    types/

## Frontend Rules (Next.js + React)
### Component Design
- Keep route page files thin
- Put business logic in features/hooks/services
- Reusable UI primitives go in `shared/ui`
- Domain-specific reusable pieces go in `entities/*`
- Avoid deeply nested prop drilling when composition or hooks solve it better

### Data Fetching
- Use TanStack Query for server state (default)
- Use clear query keys
- Handle loading, error, and empty states
- Avoid ad hoc fetch calls scattered across components if shared logic exists

### Forms
- Use React Hook Form + Zod
- Validate on client for UX, but rely on backend validation for correctness
- Disable submit while request is pending
- Show actionable error messages

### UI Consistency
- Use shadcn/ui building blocks through project conventions
- Prefer consistent component variants and spacing
- Add Storybook stories for reusable components

## Testing Requirements
### General
Testing is not optional for non-trivial logic.

### Backend
- Add unit tests for service/domain logic
- Add integration/e2e tests for critical flows (auth, listing create/update, filters)
- Test error cases, not only happy path

### Frontend
- Add component tests for complex interactive components
- Add Storybook stories for reusable UI components
- Add visual regression coverage (Loki or equivalent) when configured

### What counts as a critical flow
Examples:
- register / login / refresh token
- create listing / publish listing
- listing filtering / sorting / pagination
- admin moderation actions
- messaging anti-spam checks (later)

---

## Error Handling Rules
- No silent error swallowing (`catch {}`)
- No broad try/catch without meaningful logging or mapping
- Map domain/application errors to clear HTTP responses
- Prefer typed error handling where possible

---

## Logging / Observability Rules
- Use structured logging (when logger is configured)
- Log important business events (auth, moderation, critical writes) without leaking secrets
- Include request identifiers / correlation IDs later when infrastructure supports it
- Add health checks early

---

## Git / CI / Quality Gates
### Local quality baseline
At minimum, changes should satisfy:
- lint
- typecheck
- relevant tests

### CI quality baseline (GitHub Actions)
CI should run:
- install
- lint
- typecheck
- tests

### Pre-commit hooks (Husky/lint-staged)
Recommended, but CI remains the source of truth.
Hooks should be fast (format/lint staged files), not full builds.

### shadcn/ui Integration Strategy

shadcn/ui is used as a UI foundation, not as the complete design system by itself.

### Rules

- Generated/base shadcn components live in a dedicated folder (e.g. shared/ui/shadcn)
- Project-specific wrappers and standardized patterns live in shared/ui/app
- Feature-specific usage remains inside features/.../components

## API & Contracts

### Current approach

- REST-first API with typed frontend API client
- Validation on backend is mandatory
- Frontend validation is UX-only and does not replace backend validation

### Future option

- Introduce GraphQL for specific read-heavy modules after core flows are stable

### Observability / Reliability (Incremental)

Must be designed with expansion in mind:

- health endpoint early
- structured logging early
- error handling and mapping early
- metrics/tracing later
- background jobs + retries later
- audit logs for admin/moderation flows later

## Architecture Anti-Patterns to Avoid

- Fat controllers
- Direct DB access from controllers
- Business logic inside React page files
- Massive shared “utils” dumping ground
- Premature microservices
- Premature CQRS everywhere
- Generic abstractions with unclear value
