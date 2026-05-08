# Software Design Document (SDD)
## Finance Backend — v1.0.0

---

## 1. Visión General

Sistema backend para la aplicación de finanzas personales `finance-pwa`. Provee una API REST que gestiona transacciones, balance, tarjetas, eventos presupuestarios y administración de usuarios.

**URL Base:** `http://localhost:3000/api/v1`  
**Documentación:** `http://localhost:3000/api/v1/docs` (Swagger)

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | NestJS | 11.x |
| Lenguaje | TypeScript | 5.x |
| ORM | Prisma | latest |
| Base de Datos | MySQL | 8.x |
| Autenticación | JWT (passport-jwt) | — |
| Hash de contraseñas | Argon2 | — |
| Rate Limiting | @nestjs/throttler | — |
| Validación | class-validator | — |
| Fechas | dayjs | — |
| Config | @nestjs/config + js-yaml | — |
| Documentación | Swagger (@nestjs/swagger) | — |
| Archivos | Multer | — |
| Tests | Jest + Cucumber | — |

---

## 3. Arquitectura — Domain-Driven Design

```
finance-backend/
├── src/
│   ├── domain/                  # ← Núcleo. Sin dependencias externas.
│   │   ├── entities/            # Contratos puros de datos
│   │   ├── repositories/        # Interfaces abstractas
│   │   ├── value-objects/       # (Futuro: Money, Alias, etc.)
│   │   └── exceptions/          # Errores de negocio tipados
│   │
│   ├── application/             # ← Casos de uso / lógica de negocio
│   │   ├── auth/use-cases/
│   │   ├── transaction/use-cases/
│   │   ├── balance/use-cases/
│   │   ├── card/use-cases/
│   │   ├── event/use-cases/
│   │   └── admin/use-cases/
│   │
│   ├── infrastructure/          # ← Implementaciones concretas
│   │   ├── database/            # PrismaService
│   │   ├── repositories/        # PrismaXxxRepository
│   │   ├── auth/                # JwtStrategy
│   │   └── storage/             # FileStorageService
│   │
│   ├── interface/               # ← Adaptadores HTTP
│   │   ├── http/                # Controllers + DTOs por módulo
│   │   ├── filters/             # GlobalExceptionFilter
│   │   ├── guards/              # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/        # LoggingInterceptor, IdempotencyInterceptor
│   │   └── decorators/          # @CurrentUser, @Roles, @Public
│   │
│   └── shared/                  # ← Transversal
│       ├── config/              # Loader YAML
│       └── logger/              # AppLogger
│
├── prisma/schema.prisma          # Esquema de base de datos
├── config/app.yml                # Configuración de app
├── config/database.yml           # JWT y DB config
├── features/                     # BDD Gherkin scenarios
└── test/                         # Jest unit tests
```

---

## 4. Modelo de Base de Datos

### 4.1 Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios del sistema (admin y user) |
| `refresh_tokens` | Tokens de refresco JWT (para revocación) |
| `transactions` | Todas las transacciones financieras |
| `cards` | Tarjetas de crédito/débito del usuario |
| `budget_events` | Eventos presupuestarios compartidos |
| `event_participants` | Participantes en eventos |
| `shopping_items` | Lista de compras de un evento |
| `balance_adjustments` | Historial de ajustes manuales de saldo |
| `idempotency_keys` | Caché de respuestas para idempotencia |
| `error_logs` | Logs de errores críticos persistidos |

### 4.2 Campos de Auditoría (Todas las tablas)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `createdAt` | DateTime UTC | Prisma @default(now()) |
| `updatedAt` | DateTime UTC | Prisma @updatedAt |
| `deletedAt` | DateTime? UTC | Soft delete: null = activo |
| `createdLocalTimeAt` | DateTime? | Hora local del usuario |
| `updatedLocalTimeAt` | DateTime? | Hora local del usuario |
| `deletedLocalTimeAt` | DateTime? | Hora local del usuario |

### 4.3 Soft Delete

Todos los registros se "eliminan" lógicamente:
- `deletedAt` se establece en UTC actual
- `deletedLocalTimeAt` se establece en hora local del usuario
- Las queries usan `where: { deletedAt: null }`

---

## 5. Endpoints de la API

### 5.1 Auth (`/auth`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/login` | No | Iniciar sesión |
| POST | `/auth/register` | No | Registrar usuario |
| POST | `/auth/logout` | Sí | Cerrar sesión |

**Respuesta de Login/Register:**
```json
{
  "token": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Carlos Velasquez",
    "firstName": "Carlos",
    "lastName": "Velasquez",
    "alias": "@carlos_v",
    "currency": "MXN",
    "timezone": "America/Mexico_City",
    "monthlyNotifications": true,
    "role": "USER",
    "status": "active",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

### 5.2 Transactions (`/transactions`)

| Método | Ruta | Idempotente | Descripción |
|--------|------|-------------|-------------|
| GET | `/transactions?month=&year=&quincena=` | No | Listar por quincena |
| POST | `/transactions` | Sí | Crear transacción |
| PATCH | `/transactions/:id/confirm` | No | Confirmar/revertir |
| PUT | `/transactions/:id` | Sí | Actualizar |
| DELETE | `/transactions/:id` | No | Soft delete |
| GET | `/transactions/history?year=&type=&category=` | No | Historial anual |
| POST | `/transactions/:id/receipt` | No | Subir comprobante |

### 5.3 Balance (`/balance`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/balance?month=&year=&quincena=` | Resumen de balance |
| POST | `/balance/adjust` | Ajuste manual de saldo |
| POST | `/balance/income` | Registrar ingreso rápido |
| GET | `/balance/trend?months=6` | Tendencia mensual |

### 5.4 Cards (`/cards`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/cards` | Listar tarjetas |
| POST | `/cards` | Agregar tarjeta |
| PUT | `/cards/:id` | Actualizar tarjeta |
| DELETE | `/cards/:id` | Eliminar tarjeta |

### 5.5 Events (`/events`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/events` | Listar eventos del usuario |
| GET | `/events/:id` | Detalle de evento |
| POST | `/events` | Crear evento |
| POST | `/events/:eventId/invite` | Invitar participante |
| POST | `/events/:eventId/respond` | Responder invitación |
| POST | `/events/:eventId/items` | Agregar ítem |
| PATCH | `/events/:eventId/items/:itemId` | Toggle ítem comprado |
| POST | `/events/:id/cancel` | Cancelar evento |
| GET | `/events/:eventId/transactions` | Transacciones del evento |

### 5.6 Admin (`/admin`) — Solo ADMIN

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/admin/users` | Listar usuarios |
| PATCH | `/admin/users/:userId/role` | Cambiar rol |
| PATCH | `/admin/users/:userId/status` | Cambiar estado |

### 5.7 Files (`/files`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/files/receipts/:filename?token=` | Token firmado | Servir comprobante |

---

## 6. Seguridad

### 6.1 Pipeline de seguridad por request

```
Request → Helmet → CORS → ThrottlerGuard → JwtAuthGuard → RolesGuard → ValidationPipe → Handler
```

### 6.2 JWT

- **Access Token:** 15 minutos, firmado con `JWT_ACCESS_SECRET`
- **Refresh Token:** 7 días, firmado con `JWT_REFRESH_SECRET`, persistido en DB
- **Revocación:** Al logout se revocan todos los refresh tokens del usuario

### 6.3 Rate Limiting

- 100 requests por minuto por IP (configurable vía `.env`)

### 6.4 Idempotencia

- Header: `x-idempotency-key: <uuid>`
- TTL: 24 horas
- Aplica a: POST, PUT, PATCH
- Almacenado en tabla `idempotency_keys`

### 6.5 Validación de Archivos

- Tipos permitidos: jpeg, jpg, png, pdf
- Tamaño máximo: 5MB (configurable)
- Almacenados en: `./uploads/receipts/`
- Acceso: solo con URL firmada con JWT (1 hora de validez)

---

## 7. Manejo de Errores

### 7.1 Formato de respuesta de error

```json
{
  "success": false,
  "code": "ENTITY_NOT_FOUND",
  "message": "Transaction with id 'abc' not found",
  "details": null,
  "timestamp": "2026-05-01T12:00:00.000Z",
  "path": "/api/v1/transactions/abc"
}
```

### 7.2 Códigos de error de dominio

| Código | Status HTTP | Descripción |
|--------|-------------|-------------|
| `ENTITY_NOT_FOUND` | 404 | Entidad no encontrada |
| `DUPLICATE_ENTITY` | 409 | Email o alias ya existe |
| `BUSINESS_RULE_VIOLATION` | 422 | Regla de negocio violada |
| `UNAUTHORIZED` | 401 | Sin autorización |
| `HTTP_400` | 400 | Validación fallida |
| `HTTP_403` | 403 | Sin permisos (RBAC) |
| `INTERNAL_SERVER_ERROR` | 500 | Error interno (logueado) |

---

## 8. Logging

### 8.1 Formato de log (JSON)

```json
{
  "timestamp": "2026-05-01T12:00:00.000Z",
  "level": "info",
  "context": "HTTP",
  "message": "POST /api/v1/transactions",
  "userId": "uuid",
  "ip": "192.168.1.1",
  "path": "/api/v1/transactions",
  "method": "POST",
  "executionTimeMs": 42
}
```

### 8.2 Niveles de log

| Nivel | Cuándo usar |
|-------|-------------|
| `debug` | Desarrollo, queries internas |
| `info` | Cada request HTTP |
| `warn` | Errores 4xx, validaciones fallidas |
| `error` | Errores 5xx |
| `fatal` | Errores irrecuperables |

---

## 9. Testing

### 9.1 Unit Tests (Jest)

- Ubicación: `test/unit/*.spec.ts`
- Mock de repositorios con `jest.fn()`
- Cobertura objetivo: 80%+

### 9.2 BDD (Cucumber/Gherkin)

- Ubicación: `features/**/*.feature`
- Escenarios en español
- Cubren: Auth, Transaction, Balance

### 9.3 Comandos

```bash
npm test                          # Unit tests
npm run test:e2e                  # E2E tests
npx cucumber-js features/**/*.feature  # BDD
```

---

## 10. Configuración de Entorno

Ver `.env.example` para referencia completa.

**Variables críticas en producción:**
- `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET`: mínimo 64 caracteres aleatorios
- `DATABASE_URL`: conexión MySQL con usuario de mínimos privilegios
- `CORS_ORIGINS`: solo orígenes del frontend en producción
- `NODE_ENV=production`: activa optimizaciones de NestJS

---

## 11. Roadmap Técnico (Futuras Iteraciones)

1. **Notificaciones:** WebSockets para notificaciones en tiempo real
2. **Refresh Token rotation:** Implementar rotación automática
3. **Caché:** Redis para sesiones y respuestas frecuentes
4. **Circuit Breaker:** `nestjs-resilience` para servicios externos
5. **Exportación:** PDF/Excel de reportes financieros
6. **Multi-moneda:** Soporte para divisas adicionales
7. **Value Objects:** `Money`, `Alias` para mayor type-safety en dominio
8. **Eventos de dominio:** Event Sourcing para auditoría completa
