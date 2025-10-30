-- @description Add unique indexes to all tables to prevent duplicate entries
-- Knives: add UNIQUE INDEX
CREATE UNIQUE INDEX IF NOT EXISTS uq_wp_player_knifes_unique
ON wp_player_knifes (steamid, loadoutid, team, defindex);

-- Gloves: add UNIQUE INDEX
CREATE UNIQUE INDEX IF NOT EXISTS uq_wp_player_gloves_unique
ON wp_player_gloves (steamid, loadoutid, team, defindex);

-- Pistols: add UNIQUE INDEX
CREATE UNIQUE INDEX IF NOT EXISTS uq_wp_player_pistols_unique
ON wp_player_pistols (steamid, loadoutid, team, defindex);

-- Rifles: add UNIQUE INDEX
CREATE UNIQUE INDEX IF NOT EXISTS uq_wp_player_rifles_unique
ON wp_player_rifles (steamid, loadoutid, team, defindex);

-- SMGs: add UNIQUE INDEX
CREATE UNIQUE INDEX IF NOT EXISTS uq_wp_player_smgs_unique
ON wp_player_smgs (steamid, loadoutid, team, defindex);

-- Heavy Weapons: add UNIQUE INDEX
CREATE UNIQUE INDEX IF NOT EXISTS uq_wp_player_heavys_unique
ON wp_player_heavys (steamid, loadoutid, team, defindex);

-- Agents: add UNIQUE INDEX
CREATE UNIQUE INDEX IF NOT EXISTS uq_wp_player_agents_unique
ON wp_player_agents (steamid, loadoutid, team, defindex);

-- Music Kits: add UNIQUE INDEX
CREATE UNIQUE INDEX IF NOT EXISTS uq_wp_player_music_unique
ON wp_player_music (steamid, loadoutid, team, musicid);

-- Pins: add UNIQUE INDEX
CREATE UNIQUE INDEX IF NOT EXISTS uq_wp_player_pins_unique
ON wp_player_pins (steamid, loadoutid, team, pinid);