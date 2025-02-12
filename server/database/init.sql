-- Player Loadouts (Parent table)
CREATE TABLE wp_player_loadouts (
                                    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                                    steamid VARCHAR(64) NOT NULL,
                                    name VARCHAR(255) NOT NULL,
                                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                    INDEX idx_steamid (steamid)
);

-- Player Knives
CREATE TABLE wp_player_knifes (
                                  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                                  steamid VARCHAR(64) NOT NULL,
                                  loadoutid INT UNSIGNED NOT NULL,
                                  active BOOLEAN DEFAULT TRUE,
                                  team TINYINT UNSIGNED NOT NULL,
                                  defindex INT UNSIGNED NOT NULL,
                                  paintindex INT UNSIGNED NOT NULL,
                                  paintseed INT UNSIGNED NOT NULL,
                                  paintwear FLOAT NOT NULL,
                                  stattrack_enabled BOOLEAN DEFAULT FALSE,
                                  stattrack_count INT UNSIGNED DEFAULT 0,
                                  nametag VARCHAR(255),
                                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                  FOREIGN KEY (loadoutid) REFERENCES wp_player_loadouts(id) ON DELETE CASCADE,
                                  INDEX idx_steamid_loadout (steamid, loadoutid)
);

-- Player SMGs
CREATE TABLE wp_player_smgs (
                                id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                                steamid VARCHAR(64) NOT NULL,
                                loadoutid INT UNSIGNED NOT NULL,
                                active BOOLEAN DEFAULT TRUE,
                                team TINYINT UNSIGNED NOT NULL,
                                defindex INT UNSIGNED NOT NULL,
                                paintindex INT UNSIGNED NOT NULL,
                                paintseed INT UNSIGNED NOT NULL,
                                paintwear FLOAT NOT NULL,
                                stattrack_enabled BOOLEAN DEFAULT FALSE,
                                stattrack_count INT UNSIGNED DEFAULT 0,
                                nametag VARCHAR(255),
                                sticker_0 VARCHAR(200) DEFAULT '0;0;0;0;0;0' NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
                                sticker_1 VARCHAR(200) DEFAULT '0;0;0;0;0;0' NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
                                sticker_2 VARCHAR(200) DEFAULT '0;0;0;0;0;0' NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
                                sticker_3 VARCHAR(200) DEFAULT '0;0;0;0;0;0' NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
                                sticker_4 VARCHAR(200) DEFAULT '0;0;0;0;0;0' NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
                                keychain VARCHAR(200) DEFAULT '0;0;0;0;0' NOT NULL COMMENT 'id;x;y;z;seed',
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                FOREIGN KEY (loadoutid) REFERENCES wp_player_loadouts(id) ON DELETE CASCADE,
                                INDEX idx_steamid_loadout (steamid, loadoutid)
);

-- Player Rifles
CREATE TABLE wp_player_rifles (
                                  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                                  steamid VARCHAR(64) NOT NULL,
                                  loadoutid INT UNSIGNED NOT NULL,
                                  active BOOLEAN DEFAULT TRUE,
                                  team TINYINT UNSIGNED NOT NULL,
                                  defindex INT UNSIGNED NOT NULL,
                                  paintindex INT UNSIGNED NOT NULL,
                                  paintseed INT UNSIGNED NOT NULL,
                                  paintwear FLOAT NOT NULL,
                                  stattrack_enabled BOOLEAN DEFAULT FALSE,
                                  stattrack_count INT UNSIGNED DEFAULT 0,
                                  nametag VARCHAR(255),
                                  sticker_0 VARCHAR(200) DEFAULT '0;0;0;0;0;0' NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
                                  sticker_1 VARCHAR(200) DEFAULT '0;0;0;0;0;0' NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
                                  sticker_2 VARCHAR(200) DEFAULT '0;0;0;0;0;0' NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
                                  sticker_3 VARCHAR(200) DEFAULT '0;0;0;0;0;0' NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
                                  sticker_4 VARCHAR(200) DEFAULT '0;0;0;0;0;0' NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
                                  keychain VARCHAR(200) DEFAULT '0;0;0;0;0' NOT NULL COMMENT 'id;x;y;z;seed',
                                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                  FOREIGN KEY (loadoutid) REFERENCES wp_player_loadouts(id) ON DELETE CASCADE,
                                  INDEX idx_steamid_loadout (steamid, loadoutid)
);

-- Player Heavy Weapons
CREATE TABLE wp_player_heavys (
                                  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                                  steamid VARCHAR(64) NOT NULL,
                                  loadoutid INT UNSIGNED NOT NULL,
                                  active BOOLEAN DEFAULT TRUE,
                                  team TINYINT UNSIGNED NOT NULL,
                                  defindex INT UNSIGNED NOT NULL,
                                  paintindex INT UNSIGNED NOT NULL,
                                  paintseed INT UNSIGNED NOT NULL,
                                  paintwear FLOAT NOT NULL,
                                  stattrack_enabled BOOLEAN DEFAULT FALSE,
                                  stattrack_count INT UNSIGNED DEFAULT 0,
                                  nametag VARCHAR(255),
                                  sticker_0 VARCHAR(200) DEFAULT '0;0;0;0;0;0' NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
                                  sticker_1 VARCHAR(200) DEFAULT '0;0;0;0;0;0' NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
                                  sticker_2 VARCHAR(200) DEFAULT '0;0;0;0;0;0' NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
                                  sticker_3 VARCHAR(200) DEFAULT '0;0;0;0;0;0' NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
                                  sticker_4 VARCHAR(200) DEFAULT '0;0;0;0;0;0' NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
                                  keychain VARCHAR(200) DEFAULT '0;0;0;0;0' NOT NULL COMMENT 'id;x;y;z;seed',
                                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                  FOREIGN KEY (loadoutid) REFERENCES wp_player_loadouts(id) ON DELETE CASCADE,
                                  INDEX idx_steamid_loadout (steamid, loadoutid)
);

-- Player Pistols
CREATE TABLE wp_player_pistols (
                                   id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                                   steamid VARCHAR(64) NOT NULL,
                                   loadoutid INT UNSIGNED NOT NULL,
                                   active BOOLEAN DEFAULT TRUE,
                                   team TINYINT UNSIGNED NOT NULL,
                                   defindex INT UNSIGNED NOT NULL,
                                   paintindex INT UNSIGNED NOT NULL,
                                   paintseed INT UNSIGNED NOT NULL,
                                   paintwear FLOAT NOT NULL,
                                   stattrack_enabled BOOLEAN DEFAULT FALSE,
                                   stattrack_count INT UNSIGNED DEFAULT 0,
                                   nametag VARCHAR(255),
                                   sticker_0 VARCHAR(200) DEFAULT '0;0;0;0;0;0' NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
                                   sticker_1 VARCHAR(200) DEFAULT '0;0;0;0;0;0' NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
                                   sticker_2 VARCHAR(200) DEFAULT '0;0;0;0;0;0' NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
                                   sticker_3 VARCHAR(200) DEFAULT '0;0;0;0;0;0' NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
                                   sticker_4 VARCHAR(200) DEFAULT '0;0;0;0;0;0' NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
                                   keychain VARCHAR(200) DEFAULT '0;0;0;0;0' NOT NULL COMMENT 'id;x;y;z;seed',
                                   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                   FOREIGN KEY (loadoutid) REFERENCES wp_player_loadouts(id) ON DELETE CASCADE,
                                   INDEX idx_steamid_loadout (steamid, loadoutid)
);

-- Player Gloves
CREATE TABLE wp_player_gloves (
                                  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                                  steamid VARCHAR(64) NOT NULL,
                                  loadoutid INT UNSIGNED NOT NULL,
                                  active BOOLEAN DEFAULT TRUE,
                                  team TINYINT UNSIGNED NOT NULL,
                                  defindex INT UNSIGNED NOT NULL,
                                  paintindex INT UNSIGNED NOT NULL,
                                  paintseed INT UNSIGNED NOT NULL,
                                  paintwear FLOAT NOT NULL,
                                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                  FOREIGN KEY (loadoutid) REFERENCES wp_player_loadouts(id) ON DELETE CASCADE,
                                  INDEX idx_steamid_loadout (steamid, loadoutid)
);

-- Player Agents
CREATE TABLE wp_player_agents (
                                  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                                  steamid VARCHAR(64) NOT NULL,
                                  loadoutid INT UNSIGNED NOT NULL,
                                  active BOOLEAN DEFAULT TRUE,
                                  team TINYINT UNSIGNED NOT NULL,
                                  defindex INT UNSIGNED NOT NULL,
                                  agent_name VARCHAR(255) NOT NULL,
                                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                  FOREIGN KEY (loadoutid) REFERENCES wp_player_loadouts(id) ON DELETE CASCADE,
                                  INDEX idx_steamid_loadout (steamid, loadoutid)
);

-- Player Pins
CREATE TABLE wp_player_pins (
                                id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                                steamid VARCHAR(64) NOT NULL,
                                loadoutid INT UNSIGNED NOT NULL,
                                active BOOLEAN DEFAULT TRUE,
                                team TINYINT UNSIGNED NOT NULL,
                                pinid INT UNSIGNED NOT NULL,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                FOREIGN KEY (loadoutid) REFERENCES wp_player_loadouts(id) ON DELETE CASCADE,
                                INDEX idx_steamid_loadout (steamid, loadoutid)
);

-- Player Music
CREATE TABLE wp_player_music (
                                 id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                                 steamid VARCHAR(64) NOT NULL,
                                 loadoutid INT UNSIGNED NOT NULL,
                                 active BOOLEAN DEFAULT TRUE,
                                 team TINYINT UNSIGNED NOT NULL,
                                 musicid INT UNSIGNED NOT NULL,
                                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                 FOREIGN KEY (loadoutid) REFERENCES wp_player_loadouts(id) ON DELETE CASCADE,
                                 INDEX idx_steamid_loadout (steamid, loadoutid)
);