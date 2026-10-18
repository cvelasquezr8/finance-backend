# Finance Backend

REST API for [finance-pwa](https://github.com/cvelasquezr8/finance-pwa), a personal finance app with bi-weekly (quincena) budgeting. It manages users, transactions, balance, cards, shared budget events and notifications.

![CI](https://github.com/cvelasquezr8/finance-backend/actions/workflows/ci.yml/badge.svg)

## Stack

| Layer | Technology |
| :--- | :--- |
| Framework | NestJS 11 · TypeScript |
| Database | MySQL 8 · Prisma ORM (migrations and seed) |
| Auth | Passport (local + JWT) · access and refresh tokens · Argon2 password hashing |
| Storage | S3-compatible object storage (Cloudflare R2) with presigned URLs |
| Docs | Swagger / OpenAPI (development only) |
| Quality | Jest unit tests · ESLint · Prettier · Husky · GitHub Actions |

## Architecture

Clean architecture with four layers, so business rules do not depend on frameworks or the database:

```
src/
├── domain/          # Entities, repository interfaces, domain exceptions
├── application/     # Use cases: auth, user, transaction, balance, card, event, notifications, admin
├── infrastructure/  # Prisma repositories, JWT/Passport, mail, file storage
├── interface/       # HTTP controllers, guards, filters, interceptors, decorators, middlewares
└── shared/          # Config, logger, pagination, i18n, circuit breaker
```

## Features

- Registration, login, refresh token rotation and role-based access (user / admin).
- Transactions with categories, bi-weekly periods, balance adjustments and analytics.
- Shared budget events with participants and shopping lists.
- Idempotency keys for safe retries on write endpoints.
- Security: Helmet, CORS allow list, rate limiting, input validation with class-validator.
- Centralized error handling with persisted error logs, and a circuit breaker for external services.
- Scheduled jobs and in-app / email notifications.

## Getting started

Requirements: Node.js 20+ and MySQL 8.

```bash
npm install
cp .env.example .env     # fill DATABASE_URL, JWT secrets and storage keys
npm run db:generate
npm run db:deploy
npm run db:seed          # optional sample data
npm run start:dev
```

API: `http://localhost:3000/api/v1` · Swagger: `http://localhost:3000/api/v1/docs`

## Scripts

| Command | Description |
| :--- | :--- |
| `npm run start:dev` | Run in watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run lint` | ESLint |
| `npm test` | Unit tests |
| `npm run test:cov` | Unit tests with coverage |
| `npm run test:e2e` | End-to-end tests |

## CI/CD

GitHub Actions runs lint, unit tests and build on every push, then applies Prisma migrations and deploys. See [DEPLOYMENT.md](DEPLOYMENT.md) and the design document [SDD.md](SDD.md).

## Author

Carlos Velasquez · [carlos-velasquez.dev](https://www.carlos-velasquez.dev/en/) · [LinkedIn](https://www.linkedin.com/in/cvelasquezr8)
