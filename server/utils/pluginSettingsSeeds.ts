/**
 * Default seed data for the plugin_settings table.
 *
 * Values match the defaults in cs2-plugin/configs/config.example.json.
 * Used by the seedPluginSettings server plugin on first startup
 * and by the reset endpoint.
 */

import type { NewPluginSetting } from '~/server/database/schema'

export const PLUGIN_SETTINGS_SEEDS: NewPluginSetting[] = [
    // ======================================================================
    // GENERAL
    // ======================================================================
    {
        key: 'SkinsLanguage',
        value: 'en',
        type: 'string',
        category: 'general',
        label: 'Skins Language',
        description:
            'Language code for skin names and menu text (e.g. en, de, fr). Must match a lang file in the plugin.',
        reload_behavior: 'restart',
        sort_order: 10,
    },
    {
        key: 'MenuType',
        value: 'selectable',
        type: 'string',
        category: 'general',
        label: 'Menu Type',
        description:
            'In-game menu display mode. Options: "selectable" (interactive menu) or "chat" (chat-based).',
        reload_behavior: 'restart',
        sort_order: 20,
    },

    // ======================================================================
    // FEATURES
    // ======================================================================
    {
        key: 'Additional.KnifeEnabled',
        value: 'true',
        type: 'boolean',
        category: 'features',
        label: 'Knife Customization',
        description: 'Enable or disable knife customization for players.',
        reload_behavior: 'immediate',
        sort_order: 10,
    },
    {
        key: 'Additional.KnifeDroppingEnabled',
        value: 'false',
        type: 'boolean',
        category: 'features',
        label: 'Knife Dropping',
        description:
            'Allow players to drop knives using the default drop key (mp_drop_knife_enable).',
        reload_behavior: 'immediate',
        sort_order: 20,
    },
    {
        key: 'Additional.KnifeShortCommandsEnabled',
        value: 'true',
        type: 'boolean',
        category: 'features',
        label: 'Knife Short Commands',
        description: 'Enable per-knife chat shortcuts like !karambit, !butterfly, etc.',
        reload_behavior: 'immediate',
        sort_order: 30,
    },
    {
        key: 'Additional.DisabledKnifeCommands',
        value: '[]',
        type: 'json',
        category: 'features',
        label: 'Disabled Knife Commands',
        description:
            'List of specific knife short commands to disable by name (e.g. ["karambit", "butterfly"]). Case-insensitive.',
        reload_behavior: 'immediate',
        sort_order: 40,
    },
    {
        key: 'Additional.GloveEnabled',
        value: 'true',
        type: 'boolean',
        category: 'features',
        label: 'Glove Customization',
        description: 'Enable or disable glove customization for players.',
        reload_behavior: 'immediate',
        sort_order: 50,
    },
    {
        key: 'Additional.MusicEnabled',
        value: 'true',
        type: 'boolean',
        category: 'features',
        label: 'Music Kit Selection',
        description: 'Enable or disable music kit selection for players.',
        reload_behavior: 'immediate',
        sort_order: 60,
    },
    {
        key: 'Additional.AgentEnabled',
        value: 'true',
        type: 'boolean',
        category: 'features',
        label: 'Agent Selection',
        description: 'Enable or disable agent/model selection for players.',
        reload_behavior: 'immediate',
        sort_order: 70,
    },
    {
        key: 'Additional.SkinEnabled',
        value: 'true',
        type: 'boolean',
        category: 'features',
        label: 'Weapon Skins',
        description: 'Enable or disable weapon skin customization for players.',
        reload_behavior: 'immediate',
        sort_order: 80,
    },
    {
        key: 'Additional.PinsEnabled',
        value: 'true',
        type: 'boolean',
        category: 'features',
        label: 'Pins & Collectibles',
        description: 'Enable or disable pin/collectible selection for players.',
        reload_behavior: 'immediate',
        sort_order: 90,
    },
    {
        key: 'Additional.ShowSkinImage',
        value: 'true',
        type: 'boolean',
        category: 'features',
        label: 'Show Skin Images',
        description: 'Show preview images in the in-game menu when browsing skins.',
        reload_behavior: 'immediate',
        sort_order: 100,
    },
    {
        key: 'Additional.HideChatCommandMessages',
        value: 'true',
        type: 'boolean',
        category: 'features',
        label: 'Hide Chat Commands',
        description: 'Hide chat lines that begin with ! or / when they match CS2Inspect commands.',
        reload_behavior: 'immediate',
        sort_order: 110,
    },

    // ======================================================================
    // PERMISSIONS
    // ======================================================================
    {
        key: 'Additional.RequiredCommandPermission',
        value: '',
        type: 'string',
        category: 'permissions',
        label: 'Global Command Permission',
        description:
            'Permission flag required to use any CS2Inspect command. Empty means everyone can use commands.',
        reload_behavior: 'immediate',
        sort_order: 10,
    },
    {
        key: 'Additional.CommandPermissions',
        value: JSON.stringify({
            Knives: '',
            Gloves: '',
            Weapons: '',
            Music: '',
            Pins: '',
            Agents: '',
        }),
        type: 'json',
        category: 'permissions',
        label: 'Per-Category Permissions',
        description:
            'Permission flags for individual item categories. Empty means no restriction for that category.',
        reload_behavior: 'immediate',
        sort_order: 20,
    },

    // ======================================================================
    // COMMANDS
    // ======================================================================
    {
        key: 'WeaponCommands',
        value: JSON.stringify({
            Enabled: true,
            ReplaceWeaponOnGive: true,
            Weapons: {
                awp: { Enabled: true, Command: 'awp', GiveWeapon: true },
                ak47: { Enabled: true, Command: 'ak47', GiveWeapon: false },
                m4a4: { Enabled: true, Command: 'm4a4', GiveWeapon: false },
                m4a1s: { Enabled: true, Command: 'm4a1s', GiveWeapon: false },
            },
        }),
        type: 'json',
        category: 'commands',
        label: 'Weapon Commands',
        description:
            'Shortcut commands for weapons (e.g. !awp, !ak47). Configure enabled commands, give behavior, and per-weapon settings.',
        reload_behavior: 'restart',
        sort_order: 10,
    },
    {
        key: 'KnifeCommands',
        value: JSON.stringify({
            Enabled: true,
            ReplaceKnifeOnGive: true,
            Knives: {
                karambit: { Enabled: true, Command: 'karambit', GiveKnife: true },
                butterfly: { Enabled: true, Command: 'butterfly', GiveKnife: false },
                m9: { Enabled: true, Command: 'm9', GiveKnife: false },
            },
        }),
        type: 'json',
        category: 'commands',
        label: 'Knife Commands',
        description:
            'Shortcut commands for knives (e.g. !karambit, !butterfly). Configure enabled commands and give behavior.',
        reload_behavior: 'restart',
        sort_order: 20,
    },
    {
        key: 'GloveCommands',
        value: JSON.stringify({
            Enabled: true,
            ReplaceGloveOnGive: true,
            Gloves: {
                sport: { Enabled: true, Command: 'sport', GiveGlove: true },
                moto: { Enabled: true, Command: 'moto', GiveGlove: false },
                specialist: { Enabled: true, Command: 'specialist', GiveGlove: false },
            },
        }),
        type: 'json',
        category: 'commands',
        label: 'Glove Commands',
        description:
            'Shortcut commands for gloves (e.g. !sport, !moto). Configure enabled commands and give behavior.',
        reload_behavior: 'restart',
        sort_order: 30,
    },

    // ======================================================================
    // SYNC
    // ======================================================================
    {
        key: 'Sync.Enabled',
        value: 'true',
        type: 'boolean',
        category: 'sync',
        label: 'Sync Enabled',
        description:
            'Enable real-time bidirectional sync between the web panel and the plugin via database polling.',
        reload_behavior: 'restart',
        sort_order: 10,
    },
    {
        key: 'Sync.PollIntervalMs',
        value: '3000',
        type: 'number',
        category: 'sync',
        label: 'Poll Interval (ms)',
        description:
            'How often the plugin polls the database for sync notifications, in milliseconds. Lower = faster sync, higher = less DB load.',
        reload_behavior: 'restart',
        sort_order: 20,
    },

    // ======================================================================
    // LOGGING
    // ======================================================================
    {
        key: 'Logging',
        value: JSON.stringify({
            GlobalLogLevel: 'Info',
            ShowTimestamp: true,
            ShowCategory: true,
            PluginPrefix: 'CS2Inspect',
            Categories: {
                Database: 'Info',
                Commands: 'Info',
                Weapons: 'Info',
                Handlers: 'Info',
                Events: 'Info',
                Performance: 'Warning',
                Security: 'Warning',
                Configuration: 'Info',
                Menu: 'Info',
                Network: 'Info',
                ErrorHandling: 'Error',
            },
            FileLogging: {
                Enabled: true,
                LogDirectory: 'logs/CS2Inspect',
                MaxFileSize: '10MB',
                MaxFiles: 5,
                FileNamePattern: 'cs2inspect-{date:yyyy-MM-dd}.log',
                IncludeColors: false,
                MinimumLogLevel: 'Debug',
                AutoFlush: true,
            },
            Performance: {
                AsyncLogging: true,
                BufferSize: 1000,
                FlushInterval: 5000,
                IncludeStackTrace: false,
                MaxMessageLength: 2000,
            },
            Formatting: {
                TimestampFormat: 'HH:mm:ss.fff',
                PadLogLevels: true,
                CompactFormat: false,
                IncludeThreadId: false,
                CustomFormat: null,
            },
        }),
        type: 'json',
        category: 'logging',
        label: 'Logging Configuration',
        description:
            'Full logging configuration including log levels, file logging, performance, and formatting options.',
        reload_behavior: 'restart',
        sort_order: 10,
    },
]
