CREATE TABLE `plugin_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(128) NOT NULL,
	`value` text NOT NULL,
	`type` varchar(20) NOT NULL DEFAULT 'string',
	`category` varchar(32) NOT NULL,
	`label` varchar(128),
	`description` text,
	`reload_behavior` varchar(20) NOT NULL DEFAULT 'immediate',
	`sort_order` int NOT NULL DEFAULT 0,
	`updated_by` varchar(64),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plugin_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `plugin_settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE INDEX `idx_plugin_settings_category` ON `plugin_settings` (`category`);--> statement-breakpoint
CREATE INDEX `idx_plugin_settings_key` ON `plugin_settings` (`key`);
