CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`steamid` varchar(64) NOT NULL,
	`personaname` varchar(128) NOT NULL,
	`avatarfull` varchar(512),
	`lastseen` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_profiles_steamid_unique` UNIQUE(`steamid`)
);
--> statement-breakpoint
CREATE INDEX `idx_userprofiles_personaname` ON `user_profiles` (`personaname`);