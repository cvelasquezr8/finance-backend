-- ============================================================================
-- creation.sql — Full MySQL schema for finance-backend (generated from Prisma).
--
-- Regenerate after schema changes:
--   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/creation.sql
--
-- Prefer Prisma migrations for real deploys (`prisma migrate deploy`). This file
-- is a convenience snapshot for a manual bootstrap of an empty DB or DB review.
-- It does NOT create the _prisma_migrations history table, so if you bootstrap
-- with this file, run `prisma migrate resolve --applied 20260616031821_init`
-- afterwards so Prisma treats the initial migration as already applied.
-- ============================================================================

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `middleName` VARCHAR(191) NULL,
    `secondLastName` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `alias` VARCHAR(191) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'MXN',
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'America/Mexico_City',
    `language` VARCHAR(191) NOT NULL DEFAULT 'es',
    `theme` VARCHAR(191) NOT NULL DEFAULT 'dark',
    `avatarUrl` VARCHAR(191) NULL,
    `monthlyNotifications` BOOLEAN NOT NULL DEFAULT true,
    `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    `status` ENUM('active', 'blocked', 'deleted') NOT NULL DEFAULT 'active',
    `mustChangePassword` BOOLEAN NOT NULL DEFAULT false,
    `invitedBy` VARCHAR(191) NULL,
    `invitedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdLocalTimeAt` DATETIME(3) NULL,
    `updatedLocalTimeAt` DATETIME(3) NULL,
    `deletedLocalTimeAt` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_alias_key`(`alias`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('event_invitation', 'invitation_response', 'account_invited', 'account_blocked', 'monthly_summary') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NULL,
    `relatedId` VARCHAR(191) NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_read_createdAt_idx`(`userId`, `read`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(512) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `type` ENUM('scheduled', 'daily', 'income', 'adjustment') NOT NULL,
    `category` ENUM('vivienda', 'servicios', 'alimentacion', 'transporte', 'salud', 'entretenimiento', 'educacion', 'deuda', 'otros') NOT NULL,
    `status` ENUM('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending',
    `quincena` ENUM('primera', 'segunda') NOT NULL,
    `dueDay` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `isRecurring` BOOLEAN NOT NULL DEFAULT false,
    `isCC` BOOLEAN NOT NULL DEFAULT false,
    `cardId` VARCHAR(191) NULL,
    `eventId` VARCHAR(191) NULL,
    `receiptUrl` VARCHAR(191) NULL,
    `confirmedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdLocalTimeAt` DATETIME(3) NULL,
    `updatedLocalTimeAt` DATETIME(3) NULL,
    `deletedLocalTimeAt` DATETIME(3) NULL,

    INDEX `transactions_userId_month_year_quincena_idx`(`userId`, `month`, `year`, `quincena`),
    INDEX `transactions_userId_year_idx`(`userId`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cards` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `lastFour` CHAR(4) NOT NULL,
    `type` ENUM('CREDIT', 'DEBIT') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdLocalTimeAt` DATETIME(3) NULL,
    `updatedLocalTimeAt` DATETIME(3) NULL,
    `deletedLocalTimeAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budget_events` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `goalAmount` DECIMAL(12, 2) NOT NULL,
    `deadline` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdLocalTimeAt` DATETIME(3) NULL,
    `updatedLocalTimeAt` DATETIME(3) NULL,
    `deletedLocalTimeAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_participants` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `alias` VARCHAR(191) NOT NULL,
    `assignedPct` DECIMAL(5, 2) NOT NULL,
    `status` ENUM('PENDING_CONFIRMATION', 'CONFIRMED', 'DECLINED') NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `respondedAt` DATETIME(3) NULL,

    UNIQUE INDEX `event_participants_eventId_userId_key`(`eventId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shopping_items` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `estimatedCost` DECIMAL(12, 2) NULL,
    `bought` BOOLEAN NOT NULL DEFAULT false,
    `assignedTo` VARCHAR(191) NULL,
    `boughtBy` VARCHAR(191) NULL,
    `boughtAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `idempotency_keys` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `endpoint` VARCHAR(191) NOT NULL,
    `statusCode` INTEGER NOT NULL,
    `response` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `idempotency_keys_key_key`(`key`),
    INDEX `idempotency_keys_key_idx`(`key`),
    INDEX `idempotency_keys_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `error_logs` (
    `id` VARCHAR(191) NOT NULL,
    `level` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `context` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `ip` VARCHAR(191) NULL,
    `path` VARCHAR(191) NULL,
    `method` VARCHAR(191) NULL,
    `stack` TEXT NULL,
    `requestBody` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `error_logs_level_createdAt_idx`(`level`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `balance_adjustments` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `previousBalance` DECIMAL(12, 2) NOT NULL,
    `newBalance` DECIMAL(12, 2) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `adjustmentDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdLocalTimeAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_cardId_fkey` FOREIGN KEY (`cardId`) REFERENCES `cards`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `budget_events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cards` ADD CONSTRAINT `cards_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget_events` ADD CONSTRAINT `budget_events_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_participants` ADD CONSTRAINT `event_participants_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `budget_events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_participants` ADD CONSTRAINT `event_participants_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shopping_items` ADD CONSTRAINT `shopping_items_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `budget_events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

