# Finance Backend — Claude Guide

## 1. Critical Business Rules

### 1.1 Transactions

- **Everything is a Transaction.** Types: `scheduled`, `daily`, `income`, `adjustment`.
- **Auto-status by type:**
  - `income` → always `confirmed` on creation
  - `daily` → always `confirmed` on creation
  - `scheduled` → always `pending` on creation (requires explicit confirmation)
  - `adjustment` → always `confirmed` on creation
- **Credit Card (`isCC: true`):** Does NOT reduce cash balance immediately. Only represents projected debt (`totalDebt`). Payment is a separate transaction with `category: 'deuda'`.
- **Soft Delete required:** No transaction is physically deleted. Mark `deletedAt` + `status: 'cancelled'`.
- **Idempotency:** Every `POST`/`PUT`/`PATCH` must support `x-idempotency-key` header. If key exists, return cached response without executing logic.

### 1.2 Quincena

- `primera`: days 1–15 of the month
- `segunda`: days 16–31 of the month
- Every transaction belongs to exactly one quincena
- `dailyAllowance` is calculated over remaining days in the active quincena

### 1.3 Balance

- `currentBalance = initialBalance + income_confirmed - scheduled_confirmed - daily_expenses`
- `projectedBalance = currentBalance - pendingScheduled`
- `dailyAllowance = projectedBalance / remainingDays`
- `initialBalance` comes from the latest record in `balance_adjustments`

### 1.4 Auth and Sessions

- Tokens: Access Token (15m) + Refresh Token (7d)
- Refresh token is persisted in `refresh_tokens` and revoked on logout
- Passwords: Argon2 (never bcrypt, never MD5)
- A `blocked` or `deleted` user cannot authenticate even with a valid token

### 1.5 RBAC

- `ADMIN`: can view all users, change roles and statuses
- `USER`: can only access their own resources
- Guards validate JWT first, then Role. Never the reverse.

### 1.6 Timestamps

- `createdAt`, `updatedAt`, `deletedAt`: always UTC (managed by Prisma)
- `createdLocalTimeAt`, `updatedLocalTimeAt`, `deletedLocalTimeAt`: user local time based on `user.timezone`
- Use `dayjs` for date calculations. Never `new Date()` directly for local times.

---

## 2. Development Standards

### 2.1 Naming

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `transaction.service.ts` |
| Classes | PascalCase | `TransactionService` |
| Methods/variables | camelCase | `getUserById()` |
| Global constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE_MB` |
| Interfaces/Types | PascalCase | `TransactionEntity` |
| DTOs | PascalCase + Dto suffix | `CreateTransactionDto` |
| NestJS Modules | PascalCase + Module suffix | `TransactionModule` |

### 2.2 Language Standard

- **All code in English**: variable names, class names, comments, JSDoc, error messages in thrown exceptions, API operation summaries.
- User-facing messages (returned to the client in HTTP responses) are translated via `I18nService` based on `req['lang']` (set by `LangMiddleware`).

### 2.3 API Contracts (frontend sync)

**All fields use camelCase.** `finance-pwa` exclusively consumes camelCase.

```typescript
// Correct
{ isRecurring: true, cardId: null, confirmedAt: "2026-05-01T..." }

// Incorrect
{ is_recurring: true, card_id: null, confirmed_at: "..." }
```

### 2.4 DDD Architecture — 4 Layers

```
domain/          → Pure entities, repo interfaces, domain exceptions
application/     → Use cases / Services (business logic)
infrastructure/  → Implementations: Prisma repos, JWT strategy, Storage
interface/       → Controllers, DTOs, Guards, Filters, Interceptors
```

**Dependency rule:** `interface` → `application` → `domain` ← `infrastructure`  
**Never:** `domain` imports from `infrastructure` or `interface`.

### 2.5 Path Aliases

All cross-layer imports use path aliases. **Never use relative `../../` imports across layers.**

| Alias | Resolves to |
|-------|------------|
| `@domain/*` | `src/domain/*` |
| `@application/*` | `src/application/*` |
| `@infrastructure/*` | `src/infrastructure/*` |
| `@interface/*` | `src/interface/*` |
| `@shared/*` | `src/shared/*` |

```typescript
// Correct
import { UserRepository } from '@domain/repositories'
import { PrismaService } from '@infrastructure/database'
import { I18nService } from '@shared/i18n'

// Incorrect
import { UserRepository } from '../../../domain/repositories'
```

Aliases work at runtime via `tsconfig-paths` (dev) and `tsc-alias` (production build).

### 2.6 Barrel Files

Every folder that exports public symbols has an `index.ts` barrel. **Always import from the barrel, not directly from the implementation file** (unless importing within the same module folder).

```typescript
// Correct
import { UserEntity, UserRole } from '@domain/entities'

// Avoid when a barrel exists
import { UserEntity } from '@domain/entities/user.entity'
```

Barrel locations:
- `src/domain/index.ts` → re-exports `./entities`, `./repositories`, `./exceptions`
- `src/domain/entities/index.ts`, `src/domain/repositories/index.ts`, etc.
- `src/infrastructure/database/index.ts`, `src/infrastructure/repositories/index.ts`, etc.
- `src/shared/i18n/index.ts`, `src/shared/logger/index.ts`, etc.
- `src/interface/decorators/index.ts`, `src/interface/guards/index.ts`, etc.

### 2.7 i18n System

User-facing messages are translated based on the user's language:

1. Language detection order: **JWT payload `lang` field** → `Accept-Language` header → default `'es'`
2. `LangMiddleware` sets `req['lang']` on every request
3. `GlobalExceptionFilter` reads `req['lang']` and calls `i18n.t(key, lang, vars)` to translate
4. Locale files: `src/shared/i18n/locales/en.json` and `es.json`
5. Keys use dot-notation: `errors.notFound`, `auth.invalidCredentials`, etc.

```typescript
// Adding a new translated message:
// 1. Add key to both en.json and es.json
// 2. Throw domain exception in the use case
// 3. GlobalExceptionFilter maps exception class to the key automatically
```

### 2.8 Repository Pattern

- Domain defines abstract interfaces (`UserRepository`)
- Infrastructure provides concrete implementations (`PrismaUserRepository`)
- Modules inject via `{ provide: UserRepository, useClass: PrismaUserRepository }`
- Switching databases = only change the Prisma implementation

### 2.9 Error Handling

- Domain errors: throw `EntityNotFoundException`, `BusinessRuleViolationException`, etc. (inherit from `DomainException`)
- `GlobalExceptionFilter` transforms all exceptions to the standard envelope:
```json
{
  "success": false,
  "code": "ENTITY_NOT_FOUND",
  "message": "Transaction with id 'abc' not found",
  "details": null,
  "timestamp": "2026-05-01T...",
  "path": "/api/v1/transactions/abc"
}
```

### 2.10 Comments

- Only when the WHY is non-obvious. Never document the WHAT.

---

## 3. Agent Skills

### 3.1 `prisma-migrator`
**Trigger:** When domain entities or Prisma schema are modified.  
**Responsibility:** Generate Prisma migrations, verify entity-schema consistency, update affected repositories.  
**Rule:** Always use `prisma migrate dev --name descriptive-name`.

### 3.2 `api-contract-guardian`
**Trigger:** When DTOs, Controllers, or Services are created or modified.  
**Responsibility:** Verify response fields match EXACTLY what `finance-pwa` expects. Compare against `finance-pwa/src/core/dtos/index.ts` and `finance-pwa/src/core/types/index.ts`.  
**Rule:** If the frontend uses `camelCase`, the backend responds `camelCase`. No exceptions.

### 3.3 `security-auditor`
**Trigger:** Before any PR to production, when touching auth, guards, or validations.  
**Responsibility:** Verify: rate limiting active, helmet configured, restrictive CORS, tokens with expiry, Argon2 passwords, SQL injection impossible via Prisma, idempotency on financial operations.

### 3.4 `test-writer`
**Trigger:** When any use case / service is created or modified.  
**Responsibility:** Generate unit tests (Jest) and BDD features (Cucumber/Gherkin). Cover: happy path, domain errors, required authentication, input validation.  
**Structure:** `test/unit/[module].service.spec.ts` + `features/[module]/[scenario].feature`

### 3.5 `finance-domain-expert`
**Trigger:** When there are questions about financial business rules.  
**Responsibility:** Apply the business rules from Section 1. Expert in: balance calculation, quincenas, CC flow, transaction idempotency.

### 3.6 `logger-analyst`
**Trigger:** When production errors are reported or traceability is needed.  
**Responsibility:** Query `ErrorLog` table, correlate `requestId`, identify error patterns.

### 3.7 `i18n-maintainer`
**Trigger:** When adding new user-facing messages or supporting a new locale.  
**Responsibility:** Add keys to both `en.json` and `es.json`. Update `GlobalExceptionFilter` mappings if a new exception class is introduced. Never hardcode translated strings in use cases.

---

## 4. Mandatory Startup Checklist

When starting a new session with this backend, Claude MUST:

1. Read `prisma/schema.prisma` to understand the current data model.
2. Review frontend contracts at `../finance-pwa/src/core/dtos/index.ts`.
3. Verify that DTO fields match what the frontend expects.
4. Before creating a migration, check if a similar one exists in `prisma/migrations/`.
5. All new imports must use path aliases (`@domain/*`, `@application/*`, etc.). Never use relative `../../` across layers.

---

## 5. Critical Environment Variables

See `.env.example` for the full list. The most critical:

- `DATABASE_URL`: MySQL connection URL
- `JWT_ACCESS_SECRET`: Must be a random 64+ character string in production
- `JWT_REFRESH_SECRET`: Different from the access secret
- `CORS_ORIGINS`: Comma-separated list of allowed origins

---

## 6. Useful Scripts

```bash
# Development
npm run start:dev

# Production build (includes tsc-alias for path resolution)
npm run build

# Migrations
npx prisma migrate dev --name descriptive-name
npx prisma generate

# Tests
npm run test                    # Unit tests
npm run test:e2e                # E2E tests
npx cucumber-js features/**/*.feature  # BDD

# Code quality
npm run lint
npm run format
```

---

## 7. Git & Pre-commit Hooks

The project uses **Husky + lint-staged** for pre-commit enforcement.

**Setup (one-time, after `git init`):**
```bash
git init
npm run prepare    # installs husky hooks
```

**Pre-commit hook** runs `lint-staged` which executes on staged `.ts` files:
1. `eslint --fix` — auto-fixes lint errors
2. `prettier --write` — auto-formats code

The hook is defined in `.husky/pre-commit`. `lint-staged` configuration is in `package.json`.
