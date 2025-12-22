-- Add share_code and is_default columns for Extended Loadout Features
ALTER TABLE wp_player_loadouts ADD COLUMN share_code VARCHAR(32) NULL UNIQUE COMMENT 'Unique code for sharing loadout';
ALTER TABLE wp_player_loadouts ADD COLUMN is_default TINYINT(1) DEFAULT 0 COMMENT 'Whether this loadout is the default on startup';
