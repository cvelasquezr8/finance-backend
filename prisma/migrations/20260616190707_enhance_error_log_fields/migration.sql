-- AlterTable
ALTER TABLE `error_logs` ADD COLUMN `errorType` VARCHAR(191) NULL,
    ADD COLUMN `requestQuery` JSON NULL,
    ADD COLUMN `statusCode` INTEGER NULL;

-- CreateIndex
CREATE INDEX `error_logs_statusCode_createdAt_idx` ON `error_logs`(`statusCode`, `createdAt`);

-- CreateIndex
CREATE INDEX `error_logs_userId_createdAt_idx` ON `error_logs`(`userId`, `createdAt`);
