create table wp_player_loadouts
(
    id                int unsigned auto_increment
        primary key,
    steamid           varchar(64)                           not null,
    name              varchar(25)                           not null,
    active            tinyint(1)   default 0                not null comment 'Whether this loadout is currently active',
    selected_knife_t  smallint unsigned                     null comment 'DEFINDEX of selected knife',
    selected_knife_ct smallint unsigned                     null comment 'DEFINDEX of selected knife for ct',
    selected_glove_t  smallint unsigned                     null comment 'DEFINDEX of selected glove for t',
    selected_glove_ct smallint unsigned                     null comment 'DEFINDEX of selected glove for ct',
    selected_agent_t  smallint unsigned                     null comment 'DEFINDEX of selected agent for t',
    selected_agent_ct smallint unsigned                     null comment 'DEFINDEX of selected agent for ct',
    selected_music    smallint unsigned                     null comment 'ID of selected music kit',
    selected_pin      smallint unsigned                     null comment 'ID of selected pin',
    created_at        timestamp default current_timestamp() not null,
    updated_at        timestamp default current_timestamp() not null on update current_timestamp()
);

create table wp_player_agents
(
    id         int unsigned auto_increment
        primary key,
    steamid    varchar(64)                            not null,
    loadoutid  int unsigned                           not null,
    active     tinyint(1) default 1                   null,
    team       tinyint unsigned                       not null,
    defindex   int unsigned                           not null,
    agent_name varchar(255)                           not null,
    created_at timestamp  default current_timestamp() not null,
    updated_at timestamp  default current_timestamp() not null on update current_timestamp(),
    constraint wp_player_agents_ibfk_1
        foreign key (loadoutid) references wp_player_loadouts (id)
            on delete cascade
);

create index idx_steamid_loadout
    on wp_player_agents (steamid, loadoutid);

create index loadoutid
    on wp_player_agents (loadoutid);

create table wp_player_gloves
(
    id         int unsigned auto_increment
        primary key,
    steamid    varchar(64)                            not null,
    loadoutid  int unsigned                           not null,
    active     tinyint(1) default 1                   null,
    team       tinyint unsigned                       not null,
    defindex   int unsigned                           not null,
    paintindex int unsigned                           not null,
    paintseed  int unsigned                           not null,
    paintwear  float                                  not null,
    created_at timestamp  default current_timestamp() not null,
    updated_at timestamp  default current_timestamp() not null on update current_timestamp(),
    constraint wp_player_gloves_ibfk_1
        foreign key (loadoutid) references wp_player_loadouts (id)
            on delete cascade
);

create index idx_steamid_loadout
    on wp_player_gloves (steamid, loadoutid);

create index loadoutid
    on wp_player_gloves (loadoutid);

create table wp_player_heavys
(
    id               int unsigned auto_increment
        primary key,
    steamid          varchar(64)                              not null,
    loadoutid        int unsigned                             not null,
    active           tinyint(1)   default 1                   null,
    team             tinyint unsigned                         not null,
    defindex         int unsigned                             not null,
    paintindex       int unsigned                             not null,
    paintseed        int unsigned                             not null,
    paintwear        float                                    not null,
    stattrak_enabled tinyint(1)   default 0                   null,
    stattrak_count   int unsigned default 0                   null,
    nametag          varchar(255)                             null,
    sticker_0        varchar(200) default '0;0;0;0;0;0'       not null comment 'id;x;y;wear;scale;rotation',
    sticker_1        varchar(200) default '0;0;0;0;0;0'       not null comment 'id;x;y;wear;scale;rotation',
    sticker_2        varchar(200) default '0;0;0;0;0;0'       not null comment 'id;x;y;wear;scale;rotation',
    sticker_3        varchar(200) default '0;0;0;0;0;0'       not null comment 'id;x;y;wear;scale;rotation',
    sticker_4        varchar(200) default '0;0;0;0;0;0'       not null comment 'id;x;y;wear;scale;rotation',
    keychain         varchar(200) default '0;0;0;0;0'         not null comment 'id;x;y;z;seed',
    created_at       timestamp    default current_timestamp() not null,
    updated_at       timestamp    default current_timestamp() not null on update current_timestamp(),
    constraint wp_player_heavys_ibfk_1
        foreign key (loadoutid) references wp_player_loadouts (id)
            on delete cascade
);

create index idx_steamid_loadout
    on wp_player_heavys (steamid, loadoutid);

create index loadoutid
    on wp_player_heavys (loadoutid);

create table wp_player_knifes
(
    id               int unsigned auto_increment
        primary key,
    steamid          varchar(64)                              not null,
    loadoutid        int unsigned                             not null,
    active           tinyint(1)   default 1                   null,
    team             tinyint unsigned                         not null,
    defindex         int unsigned                             not null,
    paintindex       int unsigned                             not null,
    paintseed        int unsigned                             not null,
    paintwear        float                                    not null,
    stattrak_enabled tinyint(1)   default 0                   null,
    stattrak_count   int unsigned default 0                   null,
    nametag          varchar(255)                             null,
    created_at       timestamp    default current_timestamp() not null,
    updated_at       timestamp    default current_timestamp() not null on update current_timestamp(),
    constraint wp_player_knifes_ibfk_1
        foreign key (loadoutid) references wp_player_loadouts (id)
            on delete cascade
);

create index idx_steamid_loadout
    on wp_player_knifes (steamid, loadoutid);

create index loadoutid
    on wp_player_knifes (loadoutid);

create index idx_steamid
    on wp_player_loadouts (steamid);

create table wp_player_music
(
    id         int unsigned auto_increment
        primary key,
    steamid    varchar(64)                            not null,
    loadoutid  int unsigned                           not null,
    active     tinyint(1) default 1                   null,
    team       tinyint unsigned                       not null,
    musicid    int unsigned                           not null,
    created_at timestamp  default current_timestamp() not null,
    updated_at timestamp  default current_timestamp() not null on update current_timestamp(),
    constraint wp_player_music_ibfk_1
        foreign key (loadoutid) references wp_player_loadouts (id)
            on delete cascade
);

create index idx_steamid_loadout
    on wp_player_music (steamid, loadoutid);

create index loadoutid
    on wp_player_music (loadoutid);

create table wp_player_pins
(
    id         int unsigned auto_increment
        primary key,
    steamid    varchar(64)                            not null,
    loadoutid  int unsigned                           not null,
    active     tinyint(1) default 1                   null,
    team       tinyint unsigned                       not null,
    pinid      int unsigned                           not null,
    created_at timestamp  default current_timestamp() not null,
    updated_at timestamp  default current_timestamp() not null on update current_timestamp(),
    constraint wp_player_pins_ibfk_1
        foreign key (loadoutid) references wp_player_loadouts (id)
            on delete cascade
);

create index idx_steamid_loadout
    on wp_player_pins (steamid, loadoutid);

create index loadoutid
    on wp_player_pins (loadoutid);

create table wp_player_pistols
(
    id               int unsigned auto_increment
        primary key,
    steamid          varchar(64)                              not null,
    loadoutid        int unsigned                             not null,
    active           tinyint(1)   default 1                   null,
    team             tinyint unsigned                         not null,
    defindex         int unsigned                             not null,
    paintindex       int unsigned                             not null,
    paintseed        int unsigned                             not null,
    paintwear        float                                    not null,
    stattrak_enabled tinyint(1)   default 0                   null,
    stattrak_count   int unsigned default 0                   null,
    nametag          varchar(255)                             null,
    sticker_0        varchar(200) default '0;0;0;0;0;0'       not null comment 'id;x;y;wear;scale;rotation',
    sticker_1        varchar(200) default '0;0;0;0;0;0'       not null comment 'id;x;y;wear;scale;rotation',
    sticker_2        varchar(200) default '0;0;0;0;0;0'       not null comment 'id;x;y;wear;scale;rotation',
    sticker_3        varchar(200) default '0;0;0;0;0;0'       not null comment 'id;x;y;wear;scale;rotation',
    sticker_4        varchar(200) default '0;0;0;0;0;0'       not null comment 'id;x;y;wear;scale;rotation',
    keychain         varchar(200) default '0;0;0;0;0'         not null comment 'id;x;y;z;seed',
    created_at       timestamp    default current_timestamp() not null,
    updated_at       timestamp    default current_timestamp() not null on update current_timestamp(),
    constraint wp_player_pistols_ibfk_1
        foreign key (loadoutid) references wp_player_loadouts (id)
            on delete cascade
);

create index idx_steamid_loadout
    on wp_player_pistols (steamid, loadoutid);

create index loadoutid
    on wp_player_pistols (loadoutid);

create table wp_player_rifles
(
    id               int unsigned auto_increment
        primary key,
    steamid          varchar(64)                              not null,
    loadoutid        int unsigned                             not null,
    active           tinyint(1)   default 1                   null,
    team             tinyint unsigned                         not null,
    defindex         int unsigned                             not null,
    paintindex       int unsigned                             not null,
    paintseed        int unsigned                             not null,
    paintwear        float                                    not null,
    stattrak_enabled tinyint(1)   default 0                   null,
    stattrak_count   int unsigned default 0                   null,
    nametag          varchar(255)                             null,
    sticker_0        varchar(200) default '0;0;0;0;0;0'       not null comment 'id;x;y;wear;scale;rotation',
    sticker_1        varchar(200) default '0;0;0;0;0;0'       not null comment 'id;x;y;wear;scale;rotation',
    sticker_2        varchar(200) default '0;0;0;0;0;0'       not null comment 'id;x;y;wear;scale;rotation',
    sticker_3        varchar(200) default '0;0;0;0;0;0'       not null comment 'id;x;y;wear;scale;rotation',
    sticker_4        varchar(200) default '0;0;0;0;0;0'       not null comment 'id;x;y;wear;scale;rotation',
    keychain         varchar(200) default '0;0;0;0;0'         not null comment 'id;x;y;z;seed',
    created_at       timestamp    default current_timestamp() not null,
    updated_at       timestamp    default current_timestamp() not null on update current_timestamp(),
    constraint wp_player_rifles_ibfk_1
        foreign key (loadoutid) references wp_player_loadouts (id)
            on delete cascade
);

create index idx_steamid_loadout
    on wp_player_rifles (steamid, loadoutid);

create index loadoutid
    on wp_player_rifles (loadoutid);

create table wp_player_smgs
(
    id               int unsigned auto_increment
        primary key,
    steamid          varchar(64)                              not null,
    loadoutid        int unsigned                             not null,
    active           tinyint(1)   default 1                   null,
    team             tinyint unsigned                         not null,
    defindex         int unsigned                             not null,
    paintindex       int unsigned                             not null,
    paintseed        int unsigned                             not null,
    paintwear        float                                    not null,
    stattrak_enabled tinyint(1)   default 0                   null,
    stattrak_count   int unsigned default 0                   null,
    nametag          varchar(255)                             null,
    sticker_0        varchar(200) default '0;0;0;0;0;0'       not null comment 'id;x;y;wear;scale;rotation',
    sticker_1        varchar(200) default '0;0;0;0;0;0'       not null comment 'id;x;y;wear;scale;rotation',
    sticker_2        varchar(200) default '0;0;0;0;0;0'       not null comment 'id;x;y;wear;scale;rotation',
    sticker_3        varchar(200) default '0;0;0;0;0;0'       not null comment 'id;x;y;wear;scale;rotation',
    sticker_4        varchar(200) default '0;0;0;0;0;0'       not null comment 'id;x;y;wear;scale;rotation',
    keychain         varchar(200) default '0;0;0;0;0'         not null comment 'id;x;y;z;seed',
    created_at       timestamp    default current_timestamp() not null,
    updated_at       timestamp    default current_timestamp() not null on update current_timestamp(),
    constraint wp_player_smgs_ibfk_1
        foreign key (loadoutid) references wp_player_loadouts (id)
            on delete cascade
);

create index idx_steamid_loadout
    on wp_player_smgs (steamid, loadoutid);

create index loadoutid
    on wp_player_smgs (loadoutid);

