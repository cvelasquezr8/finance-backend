# Deployment & Database (finance-backend)

Stack: NestJS + Prisma + MySQL, deployed on **Seenode** via GitHub Actions CI/CD.

## TL;DR — which command when

| Situación | Comando |
|-----------|---------|
| Crear el schema en una DB vacía (deploy inicial) | `npx prisma migrate deploy` |
| Crear una nueva migración (en desarrollo) | `npx prisma migrate dev --name <descripcion>` |
| Aplicar migraciones pendientes (producción / CI) | `npx prisma migrate deploy` |
| Bootstrap manual sin Prisma (snapshot SQL) | `mysql ... < prisma/creation.sql` |
| Sembrar usuario admin | `npm run db:seed` |

> `prisma migrate deploy` es **idempotente**: aplica solo lo pendiente y no pide confirmación
> (apto para CI/servidor). **Nunca** uses `migrate dev` en producción.

---

## Caso 1 — Deploy inicial (crear la base desde cero)

**Recomendado (Prisma):** con la DB vacía creada y `DATABASE_URL` apuntando a ella:

```bash
npx prisma migrate deploy   # crea todas las tablas a partir de prisma/migrations/*
npm run db:seed             # opcional: crea admin@financeapp.com / Admin123!
```

**Alternativa manual (snapshot SQL)** — para revisar el schema o si no puedes correr Prisma:

```bash
mysql -u <user> -p <db_name> < prisma/creation.sql
# Marca la migración inicial como aplicada para que Prisma no intente recrearla:
npx prisma migrate resolve --applied 20260616031821_init
```

`prisma/creation.sql` es el DDL completo (regenerable con):

```bash
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/creation.sql
```

## Caso 2 — Migraciones (cambios de schema)

1. **Desarrollo:** editar `prisma/schema.prisma` y crear la migración:
   ```bash
   npx prisma migrate dev --name add_x_field
   ```
   Esto genera `prisma/migrations/<timestamp>_add_x_field/` → **commitearla** al repo.
2. **Producción / CI:** aplicar lo pendiente (no genera, solo aplica):
   ```bash
   npx prisma migrate deploy
   ```

### ¿Dónde corren las migraciones en el CI/CD?

Dos opciones (elige una para evitar correrlas dos veces):

- **A. En el pipeline (por defecto en `.github/workflows/ci.yml`):** el job `deploy` ejecuta
  `prisma migrate deploy` con `DATABASE_URL_PROD`. Requiere que la DB sea **accesible desde el
  runner de GitHub** (host público o allowlist de IP).
- **B. En Seenode al arrancar (recomendado si la DB es privada):** pon como *start command*
  `npm run start:migrate` (= `prisma migrate deploy && node dist/src/main`). Las migraciones
  corren en el destino con su propio `DATABASE_URL`, sin exponer la DB al runner.
  Si eliges B, **elimina** el paso "Apply database migrations" del workflow.

---

## Configuración en Seenode

- **Build command:** `npm ci && npm run build`
- **Start command:**
  - Opción A (migraciones en CI): `npm run start:prod`
  - Opción B (migraciones al arrancar): `npm run start:migrate`  ← recomendado
- **Variables de entorno** (Seenode → Environment): `DATABASE_URL`, `JWT_ACCESS_SECRET`,
  `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `CORS_ORIGINS`
  (origen del front), `NODE_ENV=production`, y SMTP (`SMTP_HOST/PORT/USER/PASS`, `MAIL_FROM`,
  `APP_WEB_URL`) si se usa el envío real de invitaciones.

## Secrets de GitHub Actions (repo backend)

| Secret | Uso |
|--------|-----|
| `SEENODE_API_TOKEN` | Auth de la API de Seenode |
| `SEENODE_APPLICATION_ID` | App de Seenode a desplegar |
| `DATABASE_URL_PROD` | Solo si usas la opción A (migrar desde el CI) |

> El **frontend** (`finance-pwa`) tiene su propio `.github/workflows/ci.yml`; sus secrets son
> `SEENODE_API_TOKEN`, `SEENODE_APPLICATION_ID` y `NEXT_PUBLIC_API_HOST` (se hornea en build).
