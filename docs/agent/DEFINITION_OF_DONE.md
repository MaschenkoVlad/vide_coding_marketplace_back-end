# DEFINITION_OF_DONE.md

A task is **not done** until the applicable items below are satisfied.

---

## 1. Scope & Correctness
- [ ] Implementation matches the requested task
- [ ] No unrelated refactors or rewrites
- [ ] Behavior is correct for happy path and expected error paths
- [ ] Edge cases were considered and documented

---

## 2. Code Quality
- [ ] Code is readable and maintainable
- [ ] No `any` without justification
- [ ] No obvious duplication without reason
- [ ] Error handling is explicit and meaningful
- [ ] Logging is added where important (if logger is available)
- [ ] Follow best practices
- [ ] Follow patterns
- [ ] Follow principles

---

## 3. Backend Checklist (if backend is affected)
- [ ] Input validation added/updated (DTO/runtime validation)
- [ ] Auth checks added/verified (if protected endpoint)
- [ ] Authorization checks added/verified (RBAC / ownership / admin rights)
- [ ] Business logic implemented in service/use-case layer (not controller)
- [ ] DB schema/migration updated if required
- [ ] Queries/indexes considered for performance-sensitive endpoints
- [ ] Sensitive data is not exposed in responses
- [ ] Unit/integration/e2e tests added/updated (as appropriate)

---

## 4. Frontend Checklist (if frontend is affected)
- [ ] Loading state handled
- [ ] Error state handled
- [ ] Empty state handled (if applicable)
- [ ] Form validation implemented (if form exists)
- [ ] Submit is disabled while pending (if form submits)
- [ ] Reusable components placed in correct layer (`shared` / `entities` / `features`)
- [ ] Storybook story added/updated for reusable UI components
- [ ] Visual regression baseline updated (if Loki/visual tests are configured)

---

## 5. Contracts & Types
- [ ] API contracts are clear and consistent
- [ ] Frontend/backend type expectations match
- [ ] No hidden assumptions in request/response formats

---

## 6. Quality Gates
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Relevant tests pass
- [ ] CI config remains valid (if CI files changed)

---

## 7. Documentation (when applicable)
- [ ] README updated if setup/run commands changed
- [ ] Architecture docs updated if patterns/structure changed
- [ ] New env vars added to `.env.example`