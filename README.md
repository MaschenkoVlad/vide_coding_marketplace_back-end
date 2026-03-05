# Marketplace API

NestJS backend for the marketplace application.

## Tech Stack

- **Framework:** NestJS + TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL 16
- **Cache/Queue:** Redis 7
- **Validation:** class-validator + class-transformer
- **API Docs:** Swagger/OpenAPI
- **Testing:** Jest

## Quick Start

### Prerequisites

- Node.js 20+
- Yarn 1.22+
- Docker & Docker Compose (for local infrastructure)

### 1. Start Local Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify services are healthy
docker-compose ps
```

### 2. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env if needed (defaults work with Docker Compose)
```

### 3. Install & Setup

```bash
# Install dependencies
yarn install

# Generate Prisma client
yarn prisma:generate

# Run initial migration (creates database schema)
yarn prisma:migrate:dev
```

### 4. Run the Application

```bash
# Development mode (hot reload)
yarn start:dev
```

The API will be available at:

- **API Base:** `http://localhost:4000/api`
- **Swagger Docs:** `http://localhost:4000/api/docs`
- **Health Check:** `http://localhost:4000/api/health`

## Available Scripts

### Development

- `yarn start:dev` - Run in development mode with hot reload
- `yarn build` - Build for production
- `yarn start:prod` - Run production build

### Code Quality

- `yarn lint` - Run ESLint
- `yarn lint:fix` - Fix ESLint auto-fixable issues
- `yarn typecheck` - Run TypeScript compiler (no emit)
- `yarn format` - Format code with Prettier

### Testing

- `yarn test` - Run unit tests
- `yarn test:watch` - Run tests in watch mode
- `yarn test:cov` - Run tests with coverage
- `yarn test:e2e` - Run end-to-end tests

### Database (Prisma)

- `yarn prisma:generate` - Generate Prisma client
- `yarn prisma:migrate:dev` - Create and apply migrations (dev)
- `yarn prisma:migrate:prod` - Apply migrations (production)
- `yarn prisma:studio` - Open Prisma Studio (GUI)
- `yarn prisma:seed` - Run database seeds

> **Note:** Legacy `db:*` scripts are kept for backward compatibility.

## API Endpoints

### Health Check

```bash
curl http://localhost:4000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": {
      "status": "up",
      "responseTime": "5ms"
    }
  }
}
```

### Swagger Documentation

Interactive API documentation is available at:

- **URL:** `http://localhost:4000/api/docs`
- **OpenAPI JSON:** `http://localhost:4000/api/docs-json`

## Docker Commands

```bash
# Start infrastructure
docker-compose up -d

# View logs
docker-compose logs -f

# Stop infrastructure
docker-compose down

# Reset (removes data volumes)
docker-compose down -v
```

## Project Structure

```
src/
├── modules/
│   ├── config/        # Environment configuration
│   ├── database/      # Prisma service and module
│   └── health/        # Health check endpoint
├── common/
│   └── filters/       # Global exception filter
├── app.module.ts      # Root module
└── main.ts            # Application bootstrap
```

## Environment Variables

| Variable       | Description                  | Default                  |
| -------------- | ---------------------------- | ------------------------ |
| `PORT`         | API server port              | `4000`                   |
| `DATABASE_URL` | PostgreSQL connection string | See `.env.example`       |
| `REDIS_URL`    | Redis connection string      | `redis://localhost:6379` |
| `CORS_ORIGIN`  | Allowed CORS origins         | `http://localhost:3000`  |
| `NODE_ENV`     | Environment mode             | `development`            |

## CI/CD

GitHub Actions workflow runs on every push/PR:

- Install dependencies
- Lint check
- TypeScript type check
- Build verification
- Unit tests

## Next Steps

See Sprint 1 tasks for:

- Authentication module (JWT + refresh tokens)
- User registration/login endpoints
- Password hashing with bcrypt
