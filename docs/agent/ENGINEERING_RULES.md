
# ENGINEERING_RULES.md

## Core Principle
This codebase is a production-like learning project.
Prioritize correctness, maintainability, clarity, and testability over speed hacks.

---

## General Coding Standards
- Use TypeScript strict mode
- Prefer explicit types and clear contracts
- Avoid `any`; if unavoidable, justify it in code comments
- Keep functions focused and composable
- Keep files reasonably small and cohesive
- Use descriptive names (avoid vague names like `data`, `item`, `handler2`)
- Do not introduce new dependencies unless needed and justified

---

## Backend Rules (NestJS + Prisma)
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

---

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

---

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

---

## Anti-Patterns (Do Not Do)
- Fat controllers
- DB queries directly in controllers
- Business logic in React page files
- Frontend-only validation for security-sensitive flows
- Massive global `components` or `utils` dumps
- Disabling lint/type errors to “move faster”
- Copy-pasting code without extracting shared logic when repeated 3+ times
- Premature complex abstractions