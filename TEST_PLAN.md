# Plan de Tests Unitarios — finance-backend

> Objetivo: cubrir con tests unitarios (Jest) toda la **lógica de negocio** y los
> **cross-cutting concerns** del backend. Baseline actual: 6 tests (transaction.service + app.controller).

## Convenciones

- Ubicación: `test/unit/<nombre>.spec.ts` (sigue al existente `test/unit/transaction.service.spec.ts`).
- Patrón: `Test.createTestingModule({ providers: [Service, { provide: Repo, useValue: mockRepo }] })`
  o instanciación directa con dobles `jest.fn()`. Dependencias abstractas (repos) se mockean;
  **no se toca la DB** (eso es e2e/integration).
- Cada spec cubre: happy path + errores de dominio + reglas de negocio clave.
- Comando: `npm run test` (jest) · cobertura: `npm run test:cov`.

## Exclusiones (no requieren unit test)

- Barrels `index.ts`, `*.module.ts`, DTOs (validación vía e2e), `notification.events.ts` (constantes/tipos).
- Repositorios Prisma (`infrastructure/repositories/*`) → mejor **integration/e2e** (requieren DB).
- `configuration.ts`, `app-logger` (infra trivial).

---

## P1 — Application: use-cases / services (núcleo, prioridad alta)

| # | Archivo | Escenarios clave |
|---|---------|------------------|
| 1 | `auth/login.use-case` | creds inválidas → Unauthorized; usuario no `active` → Unauthorized; éxito: firma access+refresh, crea fila `refresh_tokens`, devuelve `toUserDto` |
| 2 | `auth/register.use-case` | email/alias duplicado → Duplicate; éxito: crea user (`mustChangePassword:false`) + tokens |
| 3 | `auth/change-password.use-case` | currentPassword incorrecta → Unauthorized; éxito: re-hashea + `mustChangePassword:false` |
| 4 | `auth/refresh-token.use-case` | sin cookie / inválido / revocado / expirado → Unauthorized; user inactivo → Unauthorized; éxito: nuevo access token |
| 5 | `admin/admin.service` | listUsers (paginación/search/sort); updateRole; updateStatus: `blocked` emite `account.blocked`, `deleted` → softDelete |
| 6 | `admin/invite-user.use-case` | email/alias duplicado → Duplicate; éxito: crea user `mustChangePassword:true`, llama `mail.sendInvitation`, emite `account.invited` |
| 7 | `balance/balance.service` | cálculo summary (excluye `isCC` de sumas cash); detección quincena 1–15/16–31; adjust; addIncome; trend |
| 8 | `card/card.service` | list/create/update/delete + ownership (Forbidden si no es dueño) |
| 9 | `event/event.service` | invite solo creador (Forbidden) + emite `participant_invited`; respond emite `participant_responded`; cancel solo creador; getLinkedTransactions; toggle item |
| 10 | `transaction/transaction.service` | **EXISTE** — ampliar: filtros `type`/`cardId`/`cc-only`, confirm, update, history, receipt |
| 11 | `user/user-profile.service` | not found → NotFound; éxito: update → `toUserDto` |
| 12 | `user/user.mapper` | `toUserDto` no expone `passwordHash`, compone `name`, incluye `mustChangePassword` |
| 13 | `notifications/notification.service` | list (+`unreadCount`); markRead/remove ownership (NotFound); markAllRead; createForUser; cada `@OnEvent` compone texto es/en según `langOf` |
| 14 | `notifications/notification.scheduler` | emite `summary.monthly` solo para usuarios `active` + `monthlyNotifications:true` |

## P2 — Interface: guards / interceptors / middleware (seguridad)

| # | Archivo | Escenarios |
|---|---------|-----------|
| 15 | `guards/roles.guard` | rol coincide → allow; rol insuficiente → Forbidden; sin metadata `@Roles` → allow |
| 16 | `guards/must-change-password.guard` | `@AllowDuringPasswordReset` → allow; `mustChangePassword:true` → Forbidden; sin flag → allow; sin user → allow |
| 17 | `guards/jwt-auth.guard` | respeta `@Public`; token inválido → Unauthorized |
| 18 | `interceptors/idempotency.interceptor` | cachea respuesta por `x-idempotency-key`; devuelve cacheada en repetición |
| 19 | `middlewares/lang.middleware` | lang desde JWT > Accept-Language > default `es` |

## P3 — Shared / infra utilities

| # | Archivo | Escenarios |
|---|---------|-----------|
| 20 | `shared/pagination/paginate` | search (case-insensitive), sort asc/desc, page/limit, `hasMore` (pura, fácil) |
| 21 | `shared/i18n/i18n.service` | resuelve clave por lang, fallback, interpolación de vars |
| 22 | `infrastructure/mail/mail.service` | dev (jsonTransport) loguea sin enviar; `sendInvitation` compone destinatario/subject |
| 23 | `infrastructure/storage/file-storage.service` | firma y valida token (válido/ inválido/expirado) |
| 24 | `shared/circuit-breaker/circuit-breaker.service` | abre tras N fallos; rechaza en estado abierto; cierra/half-open |

---

## Orden de ejecución propuesto

1. **Lote A (rápidos y de alto valor):** #20 paginate, #12 user.mapper, #15/#16/#17 guards, #11 user-profile.
2. **Lote B (auth):** #1–#4 (login, register, change-password, refresh).
3. **Lote C (dominio):** #5/#6 admin+invite, #7 balance, #8 card, #9 event, #10 ampliar transaction.
4. **Lote D (notificaciones + cross-cutting):** #13/#14 notifications, #18 idempotency, #19 lang.
5. **Lote E (infra):** #21 i18n, #22 mail, #23 storage, #24 circuit-breaker.

Verificación: `npm run test` verde tras cada lote; `npm run test:cov` al final para medir cobertura.

> Total estimado: ~24 specs. Repos Prisma y flujos completos quedan para una pasada de
> integración/e2e posterior (requieren DB de test).

---

## Estado de ejecución (2026-06-16)

**Baseline:** 2 suites / 6 tests → **actual: 21 suites / 72 tests, todo verde.**

**Hecho (16 specs nuevos en `test/unit/`):**
- Lote A: `paginate`, `user.mapper`, `roles.guard`, `must-change-password.guard`,
  `jwt-auth.guard`, `user-profile.service`.
- Lote B: `login`, `register`, `change-password`, `refresh-token` use-cases.
- Lote C: `card.service`, `balance.service` (incluye exclusión de `isCC`/CC debt),
  `admin.service`, `invite-user`, `event.service`. (`transaction.service` ya tenía spec.)
- Lote D (parcial): `notification.service` (+listener), `notification.scheduler`, `lang.middleware`.
- Lote E (parcial): `i18n.service`.

**Completado (Lote D/E cerrados):**
- `idempotency.interceptor` (passthrough / cache hit / store).
- `mail.service` (jsonTransport dev + sendInvitation), `file-storage.service`, `circuit-breaker.service`.
- 🐛 **Bug encontrado y corregido vía test:** `file-storage.service` firmaba/validaba el token de
  recibos con el path de config inválido `database.jwt.accessSecret` → `JWT_ACCESS_SECRET`
  (mismo bug latente que en auth; el feature de recibos firmados estaba roto en runtime).

**Estado final: 25 suites / 83 tests, todo verde (`npx jest --coverage`).**
Cobertura alta en application/services + cross-cutting (paginate 96%, idempotency 96%, lang 100%,
i18n 86%, circuit-breaker 80%). Controllers/módulos/DTOs quedan para integración/e2e con DB.

**Pendiente futuro (no unit):** integración/e2e con DB de test para repos Prisma y flujos HTTP completos.
