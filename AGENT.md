# AGENT.md

This repository is a production-like learning project: a marketplace for used computer hardware.

## Goal
The main goal is to become a strong full-stack web developer with solid DevOps basics by building realistic production features (auth, catalog, filters, uploads, messaging, moderation, queues, caching, CI/CD, observability).

## Before making any code changes
Always read and follow:
- `docs/agent/PROJECT_CONTEXT.md`
- `docs/agent/STACK_DECISIONS.md`
- `docs/agent/ARCHITECTURE.md`
- `docs/agent/ENGINEERING_RULES.md`
- `docs/agent/DEFINITION_OF_DONE.md`

For task generation and coding format, use:
- `docs/agent/PROMPT_TEMPLATES.md`

## Key constraints
- Repository with `pnpm` for frontend and `yarn` for backend
- Frontend: Next.js (App Router) + React + TypeScript + TanStack Query + Tailwind + shadcn/ui
- Backend: NestJS + TypeScript + Prisma + PostgreSQL
- API style: REST-first (GraphQL may be added later for specific modules)
- Redis + BullMQ will be added when needed
- Production-like code quality and testing standards are required
- Do not overengineer
- Do not rewrite unrelated code
- Follow best practices
- Use Patterns if needed
- Use SOLID principles
- Use DRY principle
- Use KISS principle
- Use YAGNI principle

## Output expectations (for coding tasks)
When implementing a task, respond with:
1. Plan
2. Files to change
3. Code by file
4. Manual test steps
5. Edge cases / pitfalls
6. Follow-up improvements (optional)