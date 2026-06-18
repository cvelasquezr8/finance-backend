-- Convert numericId columns from UNSIGNED INT to INT (schema alignment)
ALTER TABLE `users`               MODIFY COLUMN `numericId` INT NOT NULL AUTO_INCREMENT;
ALTER TABLE `transactions`        MODIFY COLUMN `numericId` INT NOT NULL AUTO_INCREMENT;
ALTER TABLE `notifications`       MODIFY COLUMN `numericId` INT NOT NULL AUTO_INCREMENT;
ALTER TABLE `cards`               MODIFY COLUMN `numericId` INT NOT NULL AUTO_INCREMENT;
ALTER TABLE `budget_events`       MODIFY COLUMN `numericId` INT NOT NULL AUTO_INCREMENT;
ALTER TABLE `balance_adjustments` MODIFY COLUMN `numericId` INT NOT NULL AUTO_INCREMENT;

-- Create the categories lookup table
CREATE TABLE `transaction_categories` (
  `id`       INT          NOT NULL AUTO_INCREMENT,
  `code`     VARCHAR(191) NOT NULL,
  `nameEs`   VARCHAR(191) NOT NULL,
  `nameEn`   VARCHAR(191) NOT NULL,
  `isActive` BOOLEAN      NOT NULL DEFAULT TRUE,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_categories_code_key` (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed the 9 original categories
INSERT INTO `transaction_categories` (`code`, `nameEs`, `nameEn`) VALUES
  ('vivienda',        'Vivienda',        'Housing'),
  ('servicios',       'Servicios',       'Utilities'),
  ('alimentacion',    'Alimentación',    'Food'),
  ('transporte',      'Transporte',      'Transport'),
  ('salud',           'Salud',           'Health'),
  ('entretenimiento', 'Entretenimiento', 'Entertainment'),
  ('educacion',       'Educación',       'Education'),
  ('deuda',           'Deuda',           'Debt'),
  ('otros',           'Otros',           'Other');

-- Add categoryId column (nullable during migration)
ALTER TABLE `transactions` ADD COLUMN `categoryId` INT NULL;

-- Populate categoryId from the old category enum value
UPDATE `transactions` t
JOIN `transaction_categories` c ON c.`code` = t.`category`
SET t.`categoryId` = c.`id`;

-- Make categoryId NOT NULL and add FK
ALTER TABLE `transactions` MODIFY COLUMN `categoryId` INT NOT NULL;
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_categoryId_fkey`
  FOREIGN KEY (`categoryId`) REFERENCES `transaction_categories`(`id`);

-- Drop the old enum column
ALTER TABLE `transactions` DROP COLUMN `category`;
