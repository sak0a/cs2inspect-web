CREATE TABLE IF NOT EXISTS wp_player_loadouts
(
    id                INT UNSIGNED AUTO_INCREMENT
        PRIMARY KEY,
    steamid           VARCHAR(64)                           NOT NULL,
    name              VARCHAR(25)                           NOT NULL,
    active            TINYINT(1)   DEFAULT 0                NOT NULL COMMENT 'Whether this loadout is currently active',
    selected_knife_t  SMALLINT UNSIGNED                     NULL COMMENT 'DEFINDEX of selected knife',
    selected_knife_ct SMALLINT UNSIGNED                     NULL COMMENT 'DEFINDEX of selected knife for ct',
    selected_glove_t  SMALLINT UNSIGNED                     NULL COMMENT 'DEFINDEX of selected glove for t',
    selected_glove_ct SMALLINT UNSIGNED                     NULL COMMENT 'DEFINDEX of selected glove for ct',
    selected_agent_t  SMALLINT UNSIGNED                     NULL COMMENT 'DEFINDEX of selected agent for t',
    selected_agent_ct SMALLINT UNSIGNED                     NULL COMMENT 'DEFINDEX of selected agent for ct',
    selected_music    SMALLINT UNSIGNED                     NULL COMMENT 'ID of selected music kit',
    selected_pin      SMALLINT UNSIGNED                     NULL COMMENT 'ID of selected pin',
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP()
);

CREATE TABLE IF NOT EXISTS wp_player_agents
(
    id         INT UNSIGNED AUTO_INCREMENT
        PRIMARY KEY,
    steamid    VARCHAR(64)                            NOT NULL,
    loadoutid  INT UNSIGNED                           NOT NULL,
    active     TINYINT(1) DEFAULT 1                   NULL,
    team       TINYINT UNSIGNED                       NOT NULL,
    defindex   INT UNSIGNED                           NOT NULL,
    agent_name VARCHAR(255)                           NOT NULL,
    created_at TIMESTAMP  DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    updated_at TIMESTAMP  DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP(),
    CONSTRAINT wp_player_agents_ibfk_1
        FOREIGN KEY (loadoutid) REFERENCES wp_player_loadouts (id)
            ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_steamid_loadout
    on wp_player_agents (steamid, loadoutid);

CREATE INDEX IF NOT EXISTS loadoutid
    on wp_player_agents (loadoutid);

CREATE TABLE IF NOT EXISTS wp_player_gloves
(
    id         INT UNSIGNED AUTO_INCREMENT
        PRIMARY KEY,
    steamid    VARCHAR(64)                            NOT NULL,
    loadoutid  INT UNSIGNED                           NOT NULL,
    active     TINYINT(1) DEFAULT 1                   NULL,
    team       TINYINT UNSIGNED                       NOT NULL,
    defindex   INT UNSIGNED                           NOT NULL,
    paintindex INT UNSIGNED                           NOT NULL,
    paintseed  INT UNSIGNED                           NOT NULL,
    paintwear  FLOAT                                  NOT NULL,
    created_at TIMESTAMP  DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    updated_at TIMESTAMP  DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP(),
    CONSTRAINT wp_player_gloves_ibfk_1
        FOREIGN KEY (loadoutid) REFERENCES wp_player_loadouts (id)
            ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_steamid_loadout
    on wp_player_gloves (steamid, loadoutid);

CREATE INDEX IF NOT EXISTS loadoutid
    on wp_player_gloves (loadoutid);

CREATE TABLE IF NOT EXISTS wp_player_heavys
(
    id               INT UNSIGNED AUTO_INCREMENT
        PRIMARY KEY,
    steamid          VARCHAR(64)                              NOT NULL,
    loadoutid        INT UNSIGNED                             NOT NULL,
    active           TINYINT(1)   DEFAULT 1                   NULL,
    team             TINYINT UNSIGNED                         NOT NULL,
    defindex         INT UNSIGNED                             NOT NULL,
    paintindex       INT UNSIGNED                             NOT NULL,
    paintseed        INT UNSIGNED                             NOT NULL,
    paintwear        FLOAT                                    NOT NULL,
    stattrak_enabled TINYINT(1)   DEFAULT 0                   NULL,
    stattrak_count   INT UNSIGNED DEFAULT 0                   NULL,
    nametag          VARCHAR(255)                             NULL,
    sticker_0        VARCHAR(200) DEFAULT '0;0;0;0;0;0'       NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
    sticker_1        VARCHAR(200) DEFAULT '0;0;0;0;0;0'       NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
    sticker_2        VARCHAR(200) DEFAULT '0;0;0;0;0;0'       NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
    sticker_3        VARCHAR(200) DEFAULT '0;0;0;0;0;0'       NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
    sticker_4        VARCHAR(200) DEFAULT '0;0;0;0;0;0'       NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
    keychain         VARCHAR(200) DEFAULT '0;0;0;0;0'         NOT NULL COMMENT 'id;x;y;z;seed',
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP(),
    CONSTRAINT wp_player_heavys_ibfk_1
        FOREIGN KEY (loadoutid) REFERENCES wp_player_loadouts (id)
            ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_steamid_loadout
    on wp_player_heavys (steamid, loadoutid);

CREATE INDEX IF NOT EXISTS loadoutid
    on wp_player_heavys (loadoutid);

CREATE TABLE IF NOT EXISTS wp_player_knifes
(
    id               INT UNSIGNED AUTO_INCREMENT
        PRIMARY KEY,
    steamid          VARCHAR(64)                              NOT NULL,
    loadoutid        INT UNSIGNED                             NOT NULL,
    active           TINYINT(1)   DEFAULT 1                   NULL,
    team             TINYINT UNSIGNED                         NOT NULL,
    defindex         INT UNSIGNED                             NOT NULL,
    paintindex       INT UNSIGNED                             NOT NULL,
    paintseed        INT UNSIGNED                             NOT NULL,
    paintwear        FLOAT                                    NOT NULL,
    stattrak_enabled TINYINT(1)   DEFAULT 0                   NULL,
    stattrak_count   INT UNSIGNED DEFAULT 0                   NULL,
    nametag          VARCHAR(255)                             NULL,
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP(),
    CONSTRAINT wp_player_knifes_ibfk_1
        FOREIGN KEY (loadoutid) REFERENCES wp_player_loadouts (id)
            ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_steamid_loadout
    on wp_player_knifes (steamid, loadoutid);

CREATE INDEX IF NOT EXISTS loadoutid
    on wp_player_knifes (loadoutid);

CREATE INDEX IF NOT EXISTS idx_steamid
    on wp_player_loadouts (steamid);

CREATE TABLE IF NOT EXISTS wp_player_music
(
    id         INT UNSIGNED AUTO_INCREMENT
        PRIMARY KEY,
    steamid    VARCHAR(64)                            NOT NULL,
    loadoutid  INT UNSIGNED                           NOT NULL,
    active     TINYINT(1) DEFAULT 1                   NULL,
    team       TINYINT UNSIGNED                       NOT NULL,
    musicid    INT UNSIGNED                           NOT NULL,
    created_at TIMESTAMP  DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    updated_at TIMESTAMP  DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP(),
    CONSTRAINT wp_player_music_ibfk_1
        FOREIGN KEY (loadoutid) REFERENCES wp_player_loadouts (id)
            ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_steamid_loadout
    on wp_player_music (steamid, loadoutid);

CREATE INDEX IF NOT EXISTS loadoutid
    on wp_player_music (loadoutid);

CREATE TABLE IF NOT EXISTS wp_player_pins
(
    id         INT UNSIGNED AUTO_INCREMENT
        PRIMARY KEY,
    steamid    VARCHAR(64)                            NOT NULL,
    loadoutid  INT UNSIGNED                           NOT NULL,
    active     TINYINT(1) DEFAULT 1                   NULL,
    team       TINYINT UNSIGNED                       NOT NULL,
    pinid      INT UNSIGNED                           NOT NULL,
    created_at TIMESTAMP  DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    updated_at TIMESTAMP  DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP(),
    CONSTRAINT wp_player_pins_ibfk_1
        FOREIGN KEY (loadoutid) REFERENCES wp_player_loadouts (id)
            ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_steamid_loadout
    on wp_player_pins (steamid, loadoutid);

CREATE INDEX IF NOT EXISTS loadoutid
    on wp_player_pins (loadoutid);

CREATE TABLE IF NOT EXISTS wp_player_pistols
(
    id               INT UNSIGNED AUTO_INCREMENT
        PRIMARY KEY,
    steamid          VARCHAR(64)                              NOT NULL,
    loadoutid        INT UNSIGNED                             NOT NULL,
    active           TINYINT(1)   DEFAULT 1                   NULL,
    team             TINYINT UNSIGNED                         NOT NULL,
    defindex         INT UNSIGNED                             NOT NULL,
    paintindex       INT UNSIGNED                             NOT NULL,
    paintseed        INT UNSIGNED                             NOT NULL,
    paintwear        FLOAT                                    NOT NULL,
    stattrak_enabled TINYINT(1)   DEFAULT 0                   NULL,
    stattrak_count   INT UNSIGNED DEFAULT 0                   NULL,
    nametag          VARCHAR(255)                             NULL,
    sticker_0        VARCHAR(200) DEFAULT '0;0;0;0;0;0'       NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
    sticker_1        VARCHAR(200) DEFAULT '0;0;0;0;0;0'       NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
    sticker_2        VARCHAR(200) DEFAULT '0;0;0;0;0;0'       NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
    sticker_3        VARCHAR(200) DEFAULT '0;0;0;0;0;0'       NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
    sticker_4        VARCHAR(200) DEFAULT '0;0;0;0;0;0'       NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
    keychain         VARCHAR(200) DEFAULT '0;0;0;0;0'         NOT NULL COMMENT 'id;x;y;z;seed',
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP(),
    CONSTRAINT wp_player_pistols_ibfk_1
        FOREIGN KEY (loadoutid) REFERENCES wp_player_loadouts (id)
            ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_steamid_loadout
    on wp_player_pistols (steamid, loadoutid);

CREATE INDEX IF NOT EXISTS loadoutid
    on wp_player_pistols (loadoutid);

CREATE TABLE IF NOT EXISTS wp_player_rifles
(
    id               INT UNSIGNED AUTO_INCREMENT
        PRIMARY KEY,
    steamid          VARCHAR(64)                              NOT NULL,
    loadoutid        INT UNSIGNED                             NOT NULL,
    active           TINYINT(1)   DEFAULT 1                   NULL,
    team             TINYINT UNSIGNED                         NOT NULL,
    defindex         INT UNSIGNED                             NOT NULL,
    paintindex       INT UNSIGNED                             NOT NULL,
    paintseed        INT UNSIGNED                             NOT NULL,
    paintwear        FLOAT                                    NOT NULL,
    stattrak_enabled TINYINT(1)   DEFAULT 0                   NULL,
    stattrak_count   INT UNSIGNED DEFAULT 0                   NULL,
    nametag          VARCHAR(255)                             NULL,
    sticker_0        VARCHAR(200) DEFAULT '0;0;0;0;0;0'       NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
    sticker_1        VARCHAR(200) DEFAULT '0;0;0;0;0;0'       NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
    sticker_2        VARCHAR(200) DEFAULT '0;0;0;0;0;0'       NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
    sticker_3        VARCHAR(200) DEFAULT '0;0;0;0;0;0'       NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
    sticker_4        VARCHAR(200) DEFAULT '0;0;0;0;0;0'       NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
    keychain         VARCHAR(200) DEFAULT '0;0;0;0;0'         NOT NULL COMMENT 'id;x;y;z;seed',
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP(),
    CONSTRAINT wp_player_rifles_ibfk_1
        FOREIGN KEY (loadoutid) REFERENCES wp_player_loadouts (id)
            ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_steamid_loadout
    on wp_player_rifles (steamid, loadoutid);

CREATE INDEX IF NOT EXISTS loadoutid
    on wp_player_rifles (loadoutid);

CREATE TABLE IF NOT EXISTS wp_player_smgs
(
    id               INT UNSIGNED AUTO_INCREMENT
        PRIMARY KEY,
    steamid          VARCHAR(64)                              NOT NULL,
    loadoutid        INT UNSIGNED                             NOT NULL,
    active           TINYINT(1)   DEFAULT 1                   NULL,
    team             TINYINT UNSIGNED                         NOT NULL,
    defindex         INT UNSIGNED                             NOT NULL,
    paintindex       INT UNSIGNED                             NOT NULL,
    paintseed        INT UNSIGNED                             NOT NULL,
    paintwear        FLOAT                                    NOT NULL,
    stattrak_enabled TINYINT(1)   DEFAULT 0                   NULL,
    stattrak_count   INT UNSIGNED DEFAULT 0                   NULL,
    nametag          VARCHAR(255)                             NULL,
    sticker_0        VARCHAR(200) DEFAULT '0;0;0;0;0;0'       NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
    sticker_1        VARCHAR(200) DEFAULT '0;0;0;0;0;0'       NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
    sticker_2        VARCHAR(200) DEFAULT '0;0;0;0;0;0'       NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
    sticker_3        VARCHAR(200) DEFAULT '0;0;0;0;0;0'       NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
    sticker_4        VARCHAR(200) DEFAULT '0;0;0;0;0;0'       NOT NULL COMMENT 'id;x;y;wear;scale;rotation',
    keychain         VARCHAR(200) DEFAULT '0;0;0;0;0'         NOT NULL COMMENT 'id;x;y;z;seed',
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP(),
    CONSTRAINT wp_player_smgs_ibfk_1
        FOREIGN KEY (loadoutid) REFERENCES wp_player_loadouts (id)
            ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_steamid_loadout
    on wp_player_smgs (steamid, loadoutid);

CREATE INDEX IF NOT EXISTS loadoutid
    on wp_player_smgs (loadoutid);

