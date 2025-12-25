-- Add wrapped_sticker_id and highlight_reel_id to weapon tables

-- Heavys
ALTER TABLE wp_player_heavys ADD COLUMN wrapped_sticker_id INT UNSIGNED NULL;
ALTER TABLE wp_player_heavys ADD COLUMN highlight_reel_id INT UNSIGNED NULL;

-- Pistols
ALTER TABLE wp_player_pistols ADD COLUMN wrapped_sticker_id INT UNSIGNED NULL;
ALTER TABLE wp_player_pistols ADD COLUMN highlight_reel_id INT UNSIGNED NULL;

-- Rifles
ALTER TABLE wp_player_rifles ADD COLUMN wrapped_sticker_id INT UNSIGNED NULL;
ALTER TABLE wp_player_rifles ADD COLUMN highlight_reel_id INT UNSIGNED NULL;

-- SMGs
ALTER TABLE wp_player_smgs ADD COLUMN wrapped_sticker_id INT UNSIGNED NULL;
ALTER TABLE wp_player_smgs ADD COLUMN highlight_reel_id INT UNSIGNED NULL;
