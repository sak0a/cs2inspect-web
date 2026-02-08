CREATE TABLE `admin_activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`admin_steamid` varchar(64) NOT NULL,
	`action` varchar(64) NOT NULL,
	`target_steamid` varchar(64),
	`details` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`steamid` varchar(64) NOT NULL,
	`role` varchar(20) NOT NULL DEFAULT 'admin',
	`permissions` json DEFAULT ('[]'),
	`created_by` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_users_steamid_unique` UNIQUE(`steamid`)
);
--> statement-breakpoint
CREATE TABLE `app_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(64) NOT NULL,
	`value` text NOT NULL,
	`type` varchar(20) NOT NULL DEFAULT 'string',
	`description` text,
	`updated_by` varchar(64),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `app_settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `banned_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`steamid` varchar(64) NOT NULL,
	`reason` text,
	`banned_by` varchar(64) NOT NULL,
	`banned_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp,
	`active` tinyint NOT NULL DEFAULT 1,
	CONSTRAINT `banned_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `banned_users_steamid_unique` UNIQUE(`steamid`)
);
--> statement-breakpoint
CREATE INDEX `idx_activity_admin` ON `admin_activity_log` (`admin_steamid`);--> statement-breakpoint
CREATE INDEX `idx_activity_action` ON `admin_activity_log` (`action`);--> statement-breakpoint
CREATE INDEX `idx_activity_created` ON `admin_activity_log` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_admin_steamid` ON `admin_users` (`steamid`);--> statement-breakpoint
CREATE INDEX `idx_banned_steamid` ON `banned_users` (`steamid`);--> statement-breakpoint
CREATE INDEX `idx_banned_active` ON `banned_users` (`active`);