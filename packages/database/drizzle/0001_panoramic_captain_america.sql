CREATE TABLE `files` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`key` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` integer PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`fileId` integer NOT NULL,
	`error` text,
	FOREIGN KEY (`fileId`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE no action
);
