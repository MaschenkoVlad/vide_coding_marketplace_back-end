# Marketplace API

NestJS backend for the marketplace application.

## Tech Stack

- **Framework:** NestJS + TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Validation:** class-validator + class-transformer

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Yarn

### Installation

```bash
# Install dependencies
yarn install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
yarn db:generate

# Run database migrations
yarn db:migrate
```

### Running the Application

```bash
# Development mode (with hot reload)
yarn start:dev

# Production mode
yarn build
yarn start:prod
```

The API will be available at `http://localhost:4000/api`

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

## Available Scripts

- `yarn start:dev` - Run in development mode with hot reload
- `yarn build` - Build for production
- `yarn lint` - Run ESLint
- `yarn test` - Run unit tests
- `yarn test:e2e` - Run end-to-end tests
- `yarn db:migrate` - Create and apply migrations
- `yarn db:generate` - Generate Prisma client
- `yarn db:studio` - Open Prisma Studio

## Project Structure

```
src/
├── modules/
│   ├── config/        # Environment configuration
│   ├── database/      # Prisma service and module
│   └── health/        # Health check endpoint
├── app.module.ts      # Root module
└── main.ts            # Application bootstrap
```
