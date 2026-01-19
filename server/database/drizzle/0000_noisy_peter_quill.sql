CREATE TABLE `wp_player_agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`steamid` varchar(64) NOT NULL,
	`loadoutid` int NOT NULL,
	`active` tinyint DEFAULT 1,
	`team` tinyint NOT NULL,
	`defindex` int NOT NULL,
	`agent_name` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wp_player_agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_wp_player_agents_unique` UNIQUE(`steamid`,`loadoutid`,`team`,`defindex`)
);
--> statement-breakpoint
CREATE TABLE `wp_player_gloves` (
	`id` int AUTO_INCREMENT NOT NULL,
	`steamid` varchar(64) NOT NULL,
	`loadoutid` int NOT NULL,
	`active` tinyint DEFAULT 1,
	`team` tinyint NOT NULL,
	`defindex` int NOT NULL,
	`paintindex` int NOT NULL,
	`paintseed` int NOT NULL,
	`paintwear` float NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wp_player_gloves_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_wp_player_gloves_unique` UNIQUE(`steamid`,`loadoutid`,`team`,`defindex`)
);
--> statement-breakpoint
CREATE TABLE `health_check_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`check_name` varchar(64) NOT NULL,
	`enabled` tinyint NOT NULL DEFAULT 1,
	`warning_threshold_ms` int,
	`error_threshold_ms` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `health_check_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `health_check_config_check_name_unique` UNIQUE(`check_name`)
);
--> statement-breakpoint
CREATE TABLE `health_check_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`check_name` varchar(64) NOT NULL,
	`status` varchar(20) NOT NULL,
	`latency_ms` int,
	`message` text,
	`metadata` text,
	`checked_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `health_check_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wp_player_heavys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`steamid` varchar(64) NOT NULL,
	`loadoutid` int NOT NULL,
	`active` tinyint DEFAULT 1,
	`team` tinyint NOT NULL,
	`defindex` int NOT NULL,
	`paintindex` int NOT NULL,
	`paintseed` int NOT NULL,
	`paintwear` float NOT NULL,
	`stattrak_enabled` tinyint DEFAULT 0,
	`stattrak_count` int DEFAULT 0,
	`nametag` varchar(255),
	`sticker_0` varchar(200) NOT NULL DEFAULT '0;0;0;0;0;0',
	`sticker_1` varchar(200) NOT NULL DEFAULT '0;0;0;0;0;0',
	`sticker_2` varchar(200) NOT NULL DEFAULT '0;0;0;0;0;0',
	`sticker_3` varchar(200) NOT NULL DEFAULT '0;0;0;0;0;0',
	`sticker_4` varchar(200) NOT NULL DEFAULT '0;0;0;0;0;0',
	`keychain` varchar(200) NOT NULL DEFAULT '0;0;0;0;0',
	`wrapped_sticker_id` int,
	`highlight_reel_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wp_player_heavys_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_wp_player_heavys_unique` UNIQUE(`steamid`,`loadoutid`,`team`,`defindex`)
);
--> statement-breakpoint
CREATE TABLE `wp_player_knifes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`steamid` varchar(64) NOT NULL,
	`loadoutid` int NOT NULL,
	`active` tinyint DEFAULT 1,
	`team` tinyint NOT NULL,
	`defindex` int NOT NULL,
	`paintindex` int NOT NULL,
	`paintseed` int NOT NULL,
	`paintwear` float NOT NULL,
	`stattrak_enabled` tinyint DEFAULT 0,
	`stattrak_count` int DEFAULT 0,
	`nametag` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wp_player_knifes_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_wp_player_knifes_unique` UNIQUE(`steamid`,`loadoutid`,`team`,`defindex`)
);
--> statement-breakpoint
CREATE TABLE `wp_player_loadouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`steamid` varchar(64) NOT NULL,
	`name` varchar(25) NOT NULL,
	`active` tinyint NOT NULL DEFAULT 0,
	`selected_knife_t` smallint,
	`selected_knife_ct` smallint,
	`selected_glove_t` smallint,
	`selected_glove_ct` smallint,
	`selected_agent_t` smallint,
	`selected_agent_ct` smallint,
	`selected_music` smallint,
	`selected_pin` smallint,
	`share_code` varchar(32),
	`is_default` tinyint DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wp_player_loadouts_id` PRIMARY KEY(`id`),
	CONSTRAINT `wp_player_loadouts_share_code_unique` UNIQUE(`share_code`)
);
--> statement-breakpoint
CREATE TABLE `_migrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`filename` varchar(255) NOT NULL,
	`executed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `_migrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `_migrations_filename_unique` UNIQUE(`filename`)
);
--> statement-breakpoint
CREATE TABLE `wp_player_music` (
	`id` int AUTO_INCREMENT NOT NULL,
	`steamid` varchar(64) NOT NULL,
	`loadoutid` int NOT NULL,
	`active` tinyint DEFAULT 1,
	`team` tinyint NOT NULL,
	`musicid` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wp_player_music_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_wp_player_music_unique` UNIQUE(`steamid`,`loadoutid`,`team`,`musicid`)
);
--> statement-breakpoint
CREATE TABLE `wp_player_pins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`steamid` varchar(64) NOT NULL,
	`loadoutid` int NOT NULL,
	`defindex` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wp_player_pins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wp_player_pistols` (
	`id` int AUTO_INCREMENT NOT NULL,
	`steamid` varchar(64) NOT NULL,
	`loadoutid` int NOT NULL,
	`active` tinyint DEFAULT 1,
	`team` tinyint NOT NULL,
	`defindex` int NOT NULL,
	`paintindex` int NOT NULL,
	`paintseed` int NOT NULL,
	`paintwear` float NOT NULL,
	`stattrak_enabled` tinyint DEFAULT 0,
	`stattrak_count` int DEFAULT 0,
	`nametag` varchar(255),
	`sticker_0` varchar(200) NOT NULL DEFAULT '0;0;0;0;0;0',
	`sticker_1` varchar(200) NOT NULL DEFAULT '0;0;0;0;0;0',
	`sticker_2` varchar(200) NOT NULL DEFAULT '0;0;0;0;0;0',
	`sticker_3` varchar(200) NOT NULL DEFAULT '0;0;0;0;0;0',
	`sticker_4` varchar(200) NOT NULL DEFAULT '0;0;0;0;0;0',
	`keychain` varchar(200) NOT NULL DEFAULT '0;0;0;0;0',
	`wrapped_sticker_id` int,
	`highlight_reel_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wp_player_pistols_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_wp_player_pistols_unique` UNIQUE(`steamid`,`loadoutid`,`team`,`defindex`)
);
--> statement-breakpoint
CREATE TABLE `wp_player_rifles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`steamid` varchar(64) NOT NULL,
	`loadoutid` int NOT NULL,
	`active` tinyint DEFAULT 1,
	`team` tinyint NOT NULL,
	`defindex` int NOT NULL,
	`paintindex` int NOT NULL,
	`paintseed` int NOT NULL,
	`paintwear` float NOT NULL,
	`stattrak_enabled` tinyint DEFAULT 0,
	`stattrak_count` int DEFAULT 0,
	`nametag` varchar(255),
	`sticker_0` varchar(200) NOT NULL DEFAULT '0;0;0;0;0;0',
	`sticker_1` varchar(200) NOT NULL DEFAULT '0;0;0;0;0;0',
	`sticker_2` varchar(200) NOT NULL DEFAULT '0;0;0;0;0;0',
	`sticker_3` varchar(200) NOT NULL DEFAULT '0;0;0;0;0;0',
	`sticker_4` varchar(200) NOT NULL DEFAULT '0;0;0;0;0;0',
	`keychain` varchar(200) NOT NULL DEFAULT '0;0;0;0;0',
	`wrapped_sticker_id` int,
	`highlight_reel_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wp_player_rifles_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_wp_player_rifles_unique` UNIQUE(`steamid`,`loadoutid`,`team`,`defindex`)
);
--> statement-breakpoint
CREATE TABLE `wp_player_smgs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`steamid` varchar(64) NOT NULL,
	`loadoutid` int NOT NULL,
	`active` tinyint DEFAULT 1,
	`team` tinyint NOT NULL,
	`defindex` int NOT NULL,
	`paintindex` int NOT NULL,
	`paintseed` int NOT NULL,
	`paintwear` float NOT NULL,
	`stattrak_enabled` tinyint DEFAULT 0,
	`stattrak_count` int DEFAULT 0,
	`nametag` varchar(255),
	`sticker_0` varchar(200) NOT NULL DEFAULT '0;0;0;0;0;0',
	`sticker_1` varchar(200) NOT NULL DEFAULT '0;0;0;0;0;0',
	`sticker_2` varchar(200) NOT NULL DEFAULT '0;0;0;0;0;0',
	`sticker_3` varchar(200) NOT NULL DEFAULT '0;0;0;0;0;0',
	`sticker_4` varchar(200) NOT NULL DEFAULT '0;0;0;0;0;0',
	`keychain` varchar(200) NOT NULL DEFAULT '0;0;0;0;0',
	`wrapped_sticker_id` int,
	`highlight_reel_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wp_player_smgs_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_wp_player_smgs_unique` UNIQUE(`steamid`,`loadoutid`,`team`,`defindex`)
);
--> statement-breakpoint
ALTER TABLE `wp_player_agents` ADD CONSTRAINT `wp_player_agents_loadoutid_wp_player_loadouts_id_fk` FOREIGN KEY (`loadoutid`) REFERENCES `wp_player_loadouts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wp_player_gloves` ADD CONSTRAINT `wp_player_gloves_loadoutid_wp_player_loadouts_id_fk` FOREIGN KEY (`loadoutid`) REFERENCES `wp_player_loadouts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wp_player_heavys` ADD CONSTRAINT `wp_player_heavys_loadoutid_wp_player_loadouts_id_fk` FOREIGN KEY (`loadoutid`) REFERENCES `wp_player_loadouts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wp_player_knifes` ADD CONSTRAINT `wp_player_knifes_loadoutid_wp_player_loadouts_id_fk` FOREIGN KEY (`loadoutid`) REFERENCES `wp_player_loadouts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wp_player_music` ADD CONSTRAINT `wp_player_music_loadoutid_wp_player_loadouts_id_fk` FOREIGN KEY (`loadoutid`) REFERENCES `wp_player_loadouts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wp_player_pins` ADD CONSTRAINT `wp_player_pins_loadoutid_wp_player_loadouts_id_fk` FOREIGN KEY (`loadoutid`) REFERENCES `wp_player_loadouts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wp_player_pistols` ADD CONSTRAINT `wp_player_pistols_loadoutid_wp_player_loadouts_id_fk` FOREIGN KEY (`loadoutid`) REFERENCES `wp_player_loadouts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wp_player_rifles` ADD CONSTRAINT `wp_player_rifles_loadoutid_wp_player_loadouts_id_fk` FOREIGN KEY (`loadoutid`) REFERENCES `wp_player_loadouts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wp_player_smgs` ADD CONSTRAINT `wp_player_smgs_loadoutid_wp_player_loadouts_id_fk` FOREIGN KEY (`loadoutid`) REFERENCES `wp_player_loadouts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_steamid_loadout` ON `wp_player_agents` (`steamid`,`loadoutid`);--> statement-breakpoint
CREATE INDEX `loadoutid` ON `wp_player_agents` (`loadoutid`);--> statement-breakpoint
CREATE INDEX `idx_steamid_loadout` ON `wp_player_gloves` (`steamid`,`loadoutid`);--> statement-breakpoint
CREATE INDEX `loadoutid` ON `wp_player_gloves` (`loadoutid`);--> statement-breakpoint
CREATE INDEX `idx_check_name_time` ON `health_check_history` (`check_name`,`checked_at`);--> statement-breakpoint
CREATE INDEX `idx_checked_at` ON `health_check_history` (`checked_at`);--> statement-breakpoint
CREATE INDEX `idx_steamid_loadout` ON `wp_player_heavys` (`steamid`,`loadoutid`);--> statement-breakpoint
CREATE INDEX `loadoutid` ON `wp_player_heavys` (`loadoutid`);--> statement-breakpoint
CREATE INDEX `idx_steamid_loadout` ON `wp_player_knifes` (`steamid`,`loadoutid`);--> statement-breakpoint
CREATE INDEX `loadoutid` ON `wp_player_knifes` (`loadoutid`);--> statement-breakpoint
CREATE INDEX `idx_steamid` ON `wp_player_loadouts` (`steamid`);--> statement-breakpoint
CREATE INDEX `idx_filename` ON `_migrations` (`filename`);--> statement-breakpoint
CREATE INDEX `idx_steamid_loadout` ON `wp_player_music` (`steamid`,`loadoutid`);--> statement-breakpoint
CREATE INDEX `loadoutid` ON `wp_player_music` (`loadoutid`);--> statement-breakpoint
CREATE INDEX `idx_steamid_loadout` ON `wp_player_pins` (`steamid`,`loadoutid`);--> statement-breakpoint
CREATE INDEX `loadoutid` ON `wp_player_pins` (`loadoutid`);--> statement-breakpoint
CREATE INDEX `idx_steamid_loadout` ON `wp_player_pistols` (`steamid`,`loadoutid`);--> statement-breakpoint
CREATE INDEX `loadoutid` ON `wp_player_pistols` (`loadoutid`);--> statement-breakpoint
CREATE INDEX `idx_steamid_loadout` ON `wp_player_rifles` (`steamid`,`loadoutid`);--> statement-breakpoint
CREATE INDEX `loadoutid` ON `wp_player_rifles` (`loadoutid`);--> statement-breakpoint
CREATE INDEX `idx_steamid_loadout` ON `wp_player_smgs` (`steamid`,`loadoutid`);--> statement-breakpoint
CREATE INDEX `loadoutid` ON `wp_player_smgs` (`loadoutid`);