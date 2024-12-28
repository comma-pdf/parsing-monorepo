CREATE TABLE `tokens` (
	`id` integer PRIMARY KEY NOT NULL,
	`userId` integer NOT NULL,
	`token` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `token_index` ON `tokens` (`token`);