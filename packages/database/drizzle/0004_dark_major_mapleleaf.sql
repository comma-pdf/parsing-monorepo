ALTER TABLE `tokens` ADD `is_revoked` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `email_index` ON `users` (`email`);