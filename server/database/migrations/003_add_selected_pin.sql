-- Add selected_pin column to wp_player_loadouts table
-- This migration adds the selected_pin column if it doesn't exist
-- If the column already exists, this migration will fail but can be safely ignored

ALTER TABLE wp_player_loadouts 
ADD COLUMN selected_pin SMALLINT UNSIGNED NULL COMMENT 'ID of selected pin';
