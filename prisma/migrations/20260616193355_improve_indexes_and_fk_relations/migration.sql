-- CreateIndex
CREATE INDEX `balance_adjustments_userId_idx` ON `balance_adjustments`(`userId`);

-- CreateIndex
CREATE INDEX `budget_events_createdBy_deletedAt_idx` ON `budget_events`(`createdBy`, `deletedAt`);

-- CreateIndex
CREATE INDEX `budget_events_status_deletedAt_idx` ON `budget_events`(`status`, `deletedAt`);

-- CreateIndex
CREATE INDEX `cards_userId_deletedAt_idx` ON `cards`(`userId`, `deletedAt`);

-- CreateIndex
CREATE INDEX `transactions_eventId_deletedAt_idx` ON `transactions`(`eventId`, `deletedAt`);

-- AddForeignKey
ALTER TABLE `balance_adjustments` ADD CONSTRAINT `balance_adjustments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `event_participants` RENAME INDEX `event_participants_userId_fkey` TO `event_participants_userId_idx`;

-- RenameIndex
ALTER TABLE `transactions` RENAME INDEX `transactions_cardId_fkey` TO `transactions_cardId_idx`;
