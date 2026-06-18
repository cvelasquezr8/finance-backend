-- Add auto-increment numeric IDs to main entity tables for human-readable references.
-- MySQL automatically assigns sequential values to existing rows when adding an AUTO_INCREMENT column.

ALTER TABLE `users`               ADD COLUMN `numericId` INT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE;
ALTER TABLE `transactions`        ADD COLUMN `numericId` INT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE;
ALTER TABLE `notifications`       ADD COLUMN `numericId` INT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE;
ALTER TABLE `cards`               ADD COLUMN `numericId` INT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE;
ALTER TABLE `budget_events`       ADD COLUMN `numericId` INT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE;
ALTER TABLE `balance_adjustments` ADD COLUMN `numericId` INT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE;
