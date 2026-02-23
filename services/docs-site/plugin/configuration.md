# Plugin Configuration <Badge type="info" text="Reference" />

## Config File Location

- **Config file**: `configs/plugins/CS2Inspect/CS2Inspect.json`
- **Reference template**: `configs/config.example.json`

The config file is created automatically on first run with default values. If the database section is invalid or the required `gamedata/cs2inspect.json` file is missing, the plugin logs an error and unloads immediately.

---

## Database Settings (Required)

All five database settings must be non-empty. The plugin will unload if any are missing.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `DatabaseHost` | string | `""` | MariaDB server hostname or IP |
| `DatabasePort` | int | `3306` | MariaDB server port |
| `DatabaseUser` | string | `""` | Database username |
| `DatabasePassword` | string | `""` | Database password |
| `DatabaseName` | string | `""` | Database name |

::: warning Same Database as Web App
These must point to the **same MariaDB database** used by your CS2Inspect web application. The plugin and web app share the same `wp_player_*` tables.
:::

Connection pooling is handled internally (up to 640 connections). No manual tuning needed.

---

## General Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `ConfigVersion` | int | `11` | Internal schema version. Do not change unless a plugin update instructs you to. |
| `SkinsLanguage` | string | `"en"` | Language code for command messages. Corresponds to JSON files in the `lang/` directory. |
| `MenuType` | string | `"selectable"` | How in-game menus render. The default is recommended. |

---

## Feature Toggles (`Additional`)

These settings control which features are enabled. Disabling a feature bypasses its handlers and database lookups entirely.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `KnifeEnabled` | bool | `true` | Enable knife system (`!knife`, knife loadout data) |
| `KnifeDroppingEnabled` | bool | `false` | Set `mp_drop_knife_enable 1` so knives can be dropped. Toggleable at runtime via `!cs2inspect dropknife`. |
| `KnifeShortCommandsEnabled` | bool | `true` | Enable per-knife shortcuts (`!karambit`, `!butterfly`, etc.) |
| `DisabledKnifeCommands` | string[] | `[]` | Knife aliases to disable (case-insensitive). E.g., `["karambit", "m9"]` |
| `GloveEnabled` | bool | `true` | Enable glove system (`!glove`, `!gloves`) |
| `MusicEnabled` | bool | `true` | Enable music kit system (`!music`) |
| `AgentEnabled` | bool | `true` | Enable custom agent models (`!agent`) |
| `SkinEnabled` | bool | `true` | Enable weapon skin application (loadouts and `!g`) |
| `PinsEnabled` | bool | `true` | Enable pins (`!pin`) |
| `ShowSkinImage` | bool | `true` | Show a preview image for the player's current weapon skin via center HTML |
| `HideChatCommandMessages` | bool | `true` | When the chat handler is active, hide command messages from public chat |

---

## Permission Settings (`Additional`)

CS2Inspect integrates with CounterStrikeSharp's admin system for optional command restrictions.

### Global Permission

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `RequiredCommandPermission` | string | `""` | Permission required for **all** CS2Inspect player commands. Empty = no restriction. |

### Per-Category Permissions (`CommandPermissions`)

Checked **in addition** to `RequiredCommandPermission`. Empty string = no category restriction.

| Key | Controls |
|-----|----------|
| `Knives` | `!knife` and all knife shortcuts |
| `Gloves` | `!glove`, `!gloves` and glove shortcuts |
| `Weapons` | `!g`, `!weapon` and weapon shortcuts |
| `Music` | `!music` |
| `Pins` | `!pin` |
| `Agents` | `!agent` |

**Example**: Only VIPs can use weapon commands:

```json
"RequiredCommandPermission": "",
"CommandPermissions": {
  "Knives": "",
  "Gloves": "",
  "Weapons": "@css/vip",
  "Music": "",
  "Pins": "",
  "Agents": ""
}
```

---

## Logging Configuration (`Logging`)

### Global Level

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `GlobalLogLevel` | string | `"Info"` | Minimum log level: `Debug`, `Info`, `Warning`, `Error`, `Success` |
| `ShowTimestamp` | bool | `true` | Include timestamp in log output |
| `ShowCategory` | bool | `true` | Include category name in log output |
| `PluginPrefix` | string | `"CS2Inspect"` | Prefix for all log messages |

### Per-Category Levels (`Categories`)

Override the global level for specific subsystems:

| Category | Default | What It Logs |
|----------|---------|-------------|
| `Database` | `Info` | Database queries, connection events |
| `Commands` | `Info` | Command parsing, execution |
| `Weapons` | `Info` | Weapon skin application |
| `Handlers` | `Info` | Handler operations |
| `Events` | `Info` | Game event processing |
| `Performance` | `Warning` | Performance metrics |
| `Security` | `Warning` | Permission checks, security events |
| `Configuration` | `Info` | Config loading, validation |
| `Menu` | `Info` | Menu operations |
| `Network` | `Info` | Network operations |
| `ErrorHandling` | `Error` | Error handling flow |

::: tip Production Tip
Set `Database` and `Performance` to `Warning` or higher on production servers to reduce noise. Use `Debug` level temporarily when diagnosing issues.
:::

### File Logging (`FileLogging`)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `true` | Write logs to disk |
| `LogDirectory` | string | `"logs/CS2Inspect"` | Directory relative to game server root |
| `MaxFileSize` | string | `"10MB"` | Max size per log file |
| `MaxFiles` | int | `5` | Max number of log files (rotation) |
| `FileNamePattern` | string | `"cs2inspect-{date:yyyy-MM-dd}.log"` | File naming pattern |
| `MinimumLogLevel` | string | `"Debug"` | Minimum level for file logs (can differ from console) |
| `IncludeColors` | bool | `false` | Include color codes in file output |
| `AutoFlush` | bool | `true` | Flush after each write |

### Performance Logging (`Performance`)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `AsyncLogging` | bool | `true` | Queue logs for background writing |
| `BufferSize` | int | `1000` | Log queue buffer size |
| `FlushInterval` | int | `5000` | Flush interval in milliseconds |
| `IncludeStackTrace` | bool | `false` | Include stack traces (noisy) |
| `MaxMessageLength` | int | `2000` | Truncate messages exceeding this length |

Log levels can also be tuned at runtime via admin commands without editing the config file. See [Admin Commands](./commands.md#admin-commands).

---

## Weapon Command Shortcuts (`WeaponCommands`)

Enables per-weapon shortcuts that wrap `!g`:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable weapon shortcut commands |
| `ReplaceWeaponOnGive` | bool | `true` | When `GiveWeapon` is true, replace the existing weapon |

### Per-Weapon Configuration (`Weapons`)

Each weapon entry:

| Key | Type | Description |
|-----|------|-------------|
| `Enabled` | bool | Enable this shortcut |
| `Command` | string | Command name (e.g., `"awp"` for `!awp`) |
| `GiveWeapon` | bool | Also give the weapon to the player (not just apply skin) |

**Example**:

```json
"WeaponCommands": {
  "Enabled": true,
  "ReplaceWeaponOnGive": true,
  "Weapons": {
    "awp": { "Enabled": true, "Command": "awp", "GiveWeapon": true },
    "ak47": { "Enabled": true, "Command": "ak47", "GiveWeapon": false },
    "m4a4": { "Enabled": true, "Command": "m4a4", "GiveWeapon": false },
    "m4a1s": { "Enabled": true, "Command": "m4a1s", "GiveWeapon": false }
  }
}
```

With this config, `!awp p661 w.02` gives the player an AWP and applies the skin. `!ak47 p661` only applies the skin (player must already have the weapon).

---

## Knife Command Shortcuts (`KnifeCommands`)

Additional configurable knife shortcuts beyond the built-in ones (`!karambit`, etc.):

```json
"KnifeCommands": {
  "Enabled": false,
  "ReplaceKnifeOnGive": true,
  "Knives": {}
}
```

---

## Glove Command Shortcuts (`GloveCommands`)

Configurable glove shortcuts:

```json
"GloveCommands": {
  "Enabled": false,
  "Gloves": {}
}
```

---

## Required Files

### `gamedata/cs2inspect.json`

This file **must** be present at `addons/counterstrikesharp/gamedata/cs2inspect.json`. The plugin will refuse to load without it. It ships with every plugin release and contains game data offsets that the plugin needs to modify CS2 entities.

---

## Full Example Configuration

```json
{
  "ConfigVersion": 11,
  "SkinsLanguage": "en",
  "DatabaseHost": "localhost",
  "DatabasePort": 3306,
  "DatabaseUser": "cs2inspect",
  "DatabasePassword": "your_password",
  "DatabaseName": "cs2inspect",
  "Additional": {
    "KnifeEnabled": true,
    "KnifeDroppingEnabled": false,
    "KnifeShortCommandsEnabled": true,
    "DisabledKnifeCommands": [],
    "GloveEnabled": true,
    "MusicEnabled": true,
    "AgentEnabled": true,
    "SkinEnabled": true,
    "PinsEnabled": true,
    "ShowSkinImage": true,
    "HideChatCommandMessages": true,
    "RequiredCommandPermission": "",
    "CommandPermissions": {
      "Knives": "",
      "Gloves": "",
      "Weapons": "",
      "Music": "",
      "Pins": "",
      "Agents": ""
    }
  },
  "MenuType": "selectable",
  "Logging": {
    "GlobalLogLevel": "Info",
    "ShowTimestamp": true,
    "ShowCategory": true,
    "PluginPrefix": "CS2Inspect",
    "Categories": {
      "Database": "Info",
      "Commands": "Info",
      "Weapons": "Info",
      "Handlers": "Info",
      "Events": "Info",
      "Performance": "Warning",
      "Security": "Warning",
      "Configuration": "Info",
      "Menu": "Info",
      "Network": "Info",
      "ErrorHandling": "Error"
    },
    "FileLogging": {
      "Enabled": true,
      "LogDirectory": "logs/CS2Inspect",
      "MaxFileSize": "10MB",
      "MaxFiles": 5,
      "FileNamePattern": "cs2inspect-{date:yyyy-MM-dd}.log",
      "IncludeColors": false,
      "MinimumLogLevel": "Debug",
      "AutoFlush": true
    },
    "Performance": {
      "AsyncLogging": true,
      "BufferSize": 1000,
      "FlushInterval": 5000,
      "IncludeStackTrace": false,
      "MaxMessageLength": 2000
    },
    "Formatting": {
      "TimestampFormat": "HH:mm:ss.fff",
      "PadLogLevels": true,
      "CompactFormat": false,
      "IncludeThreadId": false,
      "CustomFormat": null
    }
  },
  "WeaponCommands": {
    "Enabled": true,
    "ReplaceWeaponOnGive": true,
    "Weapons": {
      "awp": { "Enabled": true, "Command": "awp", "GiveWeapon": true },
      "ak47": { "Enabled": true, "Command": "ak47", "GiveWeapon": false },
      "m4a4": { "Enabled": true, "Command": "m4a4", "GiveWeapon": false },
      "m4a1s": { "Enabled": true, "Command": "m4a1s", "GiveWeapon": false }
    }
  }
}
```

---

## Related Documentation

- **[Plugin Overview](./)** — Architecture and installation
- **[Plugin Commands](./commands.md)** — Complete command reference
- **[Self-Hosting Guide](../self-hosting.md)** — Deploy the web application
