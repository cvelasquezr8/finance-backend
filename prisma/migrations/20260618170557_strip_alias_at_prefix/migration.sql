-- Strip the '@' prefix from existing aliases stored with the old format.
-- New registrations no longer include '@' in the alias field.
UPDATE `users` SET `alias` = SUBSTRING(`alias`, 2) WHERE `alias` LIKE '@%';