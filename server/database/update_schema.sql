-- Add selected_music column to wp_player_loadouts table
ALTER TABLE wp_player_loadouts ADD COLUMN selected_music smallint unsigned NULL COMMENT 'ID of selected music kit';
