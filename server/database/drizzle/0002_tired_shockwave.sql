CREATE TABLE `wp_item_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`steamid` varchar(64) NOT NULL,
	`loadoutid` int NOT NULL,
	`item_type` varchar(20) NOT NULL,
	`item_category` varchar(20),
	`defindex` int NOT NULL,
	`team` tinyint NOT NULL,
	`configuration` json NOT NULL,
	`change_type` varchar(50) NOT NULL,
	`change_description` varchar(255),
	`is_snapshot` tinyint DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wp_item_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `wp_item_history` ADD CONSTRAINT `wp_item_history_loadoutid_wp_player_loadouts_id_fk` FOREIGN KEY (`loadoutid`) REFERENCES `wp_player_loadouts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_item_history_item` ON `wp_item_history` (`steamid`,`loadoutid`,`item_type`,`defindex`,`team`);--> statement-breakpoint
CREATE INDEX `idx_item_history_loadout` ON `wp_item_history` (`steamid`,`loadoutid`);--> statement-breakpoint
CREATE INDEX `idx_item_history_created` ON `wp_item_history` (`created_at`);