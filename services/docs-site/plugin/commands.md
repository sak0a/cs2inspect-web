# Plugin Commands <Badge type="info" text="Reference" />

## Overview

CS2Inspect exposes player-facing commands via chat (`!` or `/` prefix) and console (`css_` prefix). Most commands share these rules:

- **Chat**: `!command` or `/command`
- **Console/RCON**: `css_command`
- **Cooldown**: 2-second cooldown per player per command
- **Permissions**: Optional global and per-category permission gates (see [Configuration](./configuration.md))
- **Localization**: All feedback messages support multiple languages via JSON files

---

## Help Commands

### `!cs2inspect` / `!help`

Shows a categorized overview of all available commands.

```
!cs2inspect              # Show all command categories
!cs2inspect <category>   # Filter by category
```

**Categories**: `knife`, `glove`, `loadout`, `agent`, `music`, `pin`, `weapon`, `inspect`, `utility`, `all`

### `!cs2inspect doppler`

Displays a reference table of paint indices for Doppler and Gamma Doppler finishes. Useful when building `!g` commands.

### `!cs2inspect dropknife`

Toggles knife dropping at runtime by flipping the `mp_drop_knife_enable` ConVar.

::: warning Admin Only
Requires `@css/root` permission. Non-admins will see an error message.
:::

---

## Knife Commands

::: info Requires `Additional.KnifeEnabled = true`
:::

| Command | Description |
|---------|-------------|
| `!knife` | Refresh knife from active loadout |
| `!knife <type>` | Apply specific knife type (e.g., `!knife karambit`) |
| `!knife inventory` | Use player's Steam inventory knife (Player Inventory mode) |
| `!knife default` | Force vanilla CS2 knife (Default mode) |

### Per-Knife Shortcuts

When `Additional.KnifeShortCommandsEnabled` is `true`, you can use direct shortcuts:

```
!karambit    !m9          !bayonet     !flip        !gut
!falchion    !bowie       !butterfly   !huntsman    !shadow
!paracord    !survival    !ursus       !navaja      !stiletto
!talon       !classic     !nomad       !skeleton    !kukri
```

#### Knife Inline Customization

Knife shortcuts accept the same modular arguments as the `!g` command. This lets you switch knife type **and** configure it in a single command:

```bash
!karambit                                      # Switch to karambit (no customization)
!karambit doppler4                             # Switch + set paint by name
!karambit doppler4 .02 s991 "oh my god" t444   # Switch + full customization
!butterfly p415                                # Switch + set paint by index
!m9 default                                    # Reset m9 properties to defaults (keeps m9 selected)
!karambit reset                                # Full config reset for karambit
```

Arguments are **position-independent** — you can provide wear, paint, seed, StatTrak, and nametag in any order. All property tokens from the `!g` command work here.

::: warning Unsupported Properties
Knives do **not** support stickers or keychains. Using these will show an error. Supported: paint, wear, seed, StatTrak, nametag.
:::

::: tip Partial Updates
Specifying only some properties (e.g. `!butterfly s222`) preserves the existing skin configuration — only the specified property is changed.
:::

::: info Cross-Category Paint Names
If a paint name isn't found in the knife category but exists for another weapon type (e.g., rifles), it is still applied and a warning is shown telling you where the paint was found.
:::

::: tip Disabling Specific Shortcuts
Individual shortcuts can be disabled via the `Additional.DisabledKnifeCommands` array in config. Additional configurable shortcuts are available via the `KnifeCommands` config block.
:::

---

## Glove Commands

::: info Requires `Additional.GloveEnabled = true`
:::

| Command | Description |
|---------|-------------|
| `!glove` / `!gloves` | Refresh gloves from active loadout |
| `!glove <type>` | Apply specific glove type (e.g., `!glove sport`) |
| `!glove inventory` | Use player's Steam inventory gloves |
| `!glove default` | Force vanilla CS2 gloves |

### Per-Glove Shortcuts

Per-glove shortcuts (e.g., `!sport`, `!driver`, `!hand`, `!moto`, `!specialist`, `!hydra`, `!bloodhound`) can be configured via the `GloveCommands` config block.

#### Glove Inline Customization

Glove shortcuts accept the same modular arguments as the `!g` command:

```bash
!sport                            # Switch to Sport Gloves (no customization)
!sport superconductor .02 s991    # Switch + set paint, wear and seed
!driver p10077                    # Switch + set paint by index
!sport default                    # Reset glove properties to defaults
```

Arguments are **position-independent** — paint, wear, and seed can appear in any order.

::: warning Glove Limitations
Gloves do not support StatTrak (`t`), custom nametags (`n"..."`/`"..."`), stickers, or keychains. Only paint, wear, and seed are applicable. Using unsupported properties will show an error.
:::

::: info Cross-Category Paint Names
If a paint name isn't found in the glove category but exists for another weapon type, it is still applied and a warning is shown telling you where the paint was found.
:::

---

## Agent Commands

::: info Requires `Additional.AgentEnabled = true`
:::

| Command | Description |
|---------|-------------|
| `!agent` | Refresh agent from active loadout |
| `!agent <type>` | Apply specific agent type |
| `!agent inventory` | Use player's Steam inventory agent |
| `!agent default` | Force default agent for current team |

---

## Music Kit Commands

::: info Requires `Additional.MusicEnabled = true`
:::

| Command | Description |
|---------|-------------|
| `!music` | Refresh music kit from active loadout |
| `!music <kit>` | Apply specific music kit |
| `!music default` | Reset to Steam inventory music kit |

---

## Pin Commands

::: info Requires `Additional.PinsEnabled = true`
:::

| Command | Description |
|---------|-------------|
| `!pin` | Refresh pin from active loadout |
| `!pin <id>` | Apply specific pin |
| `!pin inventory` | Use player's Steam inventory pin |
| `!pin default` | Force no pin |

---

## Loadout Commands

| Command | Description |
|---------|-------------|
| `!loadout <name>` / `!switch <name>` | Switch to a named loadout |
| `!loadouts` | List all loadouts with creation dates (highlights active) |
| `!loadout_info` | Show summary of active loadout items |
| `!loadout_info <filter>` | Filter by: `weapon`, `knife`, `glove`/`gloves`, `agent`/`agents`, `all` |

### Typical Workflow

1. Configure multiple loadouts via the web app
2. Use `!loadouts` in-game to see what exists
3. Use `!loadout <name>` to switch — the plugin reloads all items
4. Use `!loadout_info` to confirm which skins are active

::: tip
On first connect, a default loadout is created automatically if the player has none.
:::

---

## Weapon Configuration (`!g`) <Badge type="warning" text="Advanced" />

The `!g` command is CS2Inspect's most powerful feature. It provides modular, order-independent weapon configuration:

```bash
!g <weapon> <arguments...>
!weapon <weapon> <arguments...>    # Alias
```

Where `<weapon>` can be a name (`ak47`, `awp`, `deagle`) or a numeric defindex (`7`, `9`, `1`).

### Quick Examples

```bash
!g ak47 w.03                           # Set wear to 0.03
!g ak47 0.03                           # Same (single float = wear)
!g ak47 p661                           # Set paint index to 661
!g awp printstream                     # Set paint by name
!g awp printstream .02 t500 "LAN Beast"  # Paint + wear + StatTrak + name
!g ak47 default                        # Restore from Steam inventory baseline
!g ak47 --reset                        # Clear all customization
```

### Property Tokens

Tokens can appear in **any order** after the weapon:

| Token | Meaning | Example |
|-------|---------|---------|
| `w<float>` | Wear value (0.0-1.0) | `w0.03`, `w.15` |
| `p<int>` | Paint index | `p661`, `p415` |
| `s<int>` | Pattern seed | `s422`, `s661` |
| `t<int>` | StatTrak count (`t0`/`t-1` to disable) | `t1337` |
| `n"text"` | Custom nametag | `n"The Beast"` |
| `"text"` | Nametag shorthand (no `n` prefix) | `"My AK"` |
| Single float | Wear shorthand | `0.03`, `.15` |
| Paint name | Paint by name lookup | `printstream`, `dragon` |

### Stickers

Stickers are applied to slots 0-4. Multiple formats supported:

```bash
# Compact format (sticker ID with properties)
3958w.3s1.2x.1y.2r45     # id=3958, wear=0.3, scale=1.2, x=0.1, y=0.2, rotation=45

# Simple (just ID)
3958                       # Sticker 3958 with defaults

# Slot targeting
@0:3958w.3                # Explicitly target slot 0
@2:x                       # Skip slot 2 (keep existing)
@4:d                       # Delete sticker in slot 4

# Database-style
3958;.3;.1;.2;1.2;45     # Semicolon-separated values
```

### Keychains

```bash
1234                       # Simple keychain ID
1234x.1y.2z.3s42         # With offsets and seed
@k:s42                    # Modify existing keychain seed
```

#### Sticker Slab & Highlight Reel Keychains

Special keychain types use additional property prefixes:

| Prefix | Meaning | Example |
|--------|---------|---------|
| `i<id>` | Wrapped sticker ID (Sticker Slab) | `1234i5020` |
| `h<id>` | Highlight Reel ID (Souvenir charm) | `1234h9012` |

```bash
!g ak 1234i5020                  # Keychain with wrapped sticker
!g ak 1234x.1y.2z.3s42i5020     # Full keychain with sticker slab
!g ak @k:i5020                   # Update existing keychain's wrapped sticker
!g ak @k:h9012                   # Update existing keychain's highlight reel
```

### Reset Behavior

| Token | Effect |
|-------|--------|
| `default` / `--inv` | Restore from baseline inventory cache (captured on connect). Falls back to marking item inactive. |
| `reset` / `--reset` | Clear all customization (paint, wear, StatTrak, stickers, keychain, name). |

### Preview Mode

Append `--preview` to see what would be applied without writing to the database:

```bash
!g awp printstream .02 t900 "LAN Beast" --preview
```

### In-Chat Help

```bash
!g help              # Show modular format reference
!g ak47 help         # Show help for a specific weapon
```

### Per-Weapon Shortcuts

When `WeaponCommands.Enabled` is `true` in config, shortcuts like `!awp`, `!ak47` can be used instead of `!g awp`, `!g ak47`. Each shortcut can optionally give the weapon to the player (`GiveWeapon: true`).

---

## Utility Commands

| Command | Description |
|---------|-------------|
| `!kill` / `!suicide` | Immediately kill your player (useful for testing skins) |

---

## Admin Commands <Badge type="danger" text="Admin" />

These console commands require `@css/root` permission and control the logging subsystem:

| Command | Description |
|---------|-------------|
| `css_cs2inspect_loglevel <level>` | Set global log level (`Debug`, `Info`, `Warning`, `Error`, `Success`) |
| `css_cs2inspect_loglevel_category <cat> <level>` | Override log level for a specific category |
| `css_cs2inspect_logstats` | Print logging statistics |
| `css_cs2inspect_logcategories` | List all categories with their current levels |
| `css_cs2inspect_logreload` | Reload logging config without server restart |
| `css_cs2inspect_logtest` | Run logging validation tests |

**Log categories**: `Database`, `Commands`, `Weapons`, `Handlers`, `Events`, `Performance`, `Security`, `Configuration`, `Menu`, `Network`, `ErrorHandling`

---

## Permission System

### Global Permission

Set `Additional.RequiredCommandPermission` to gate **all** player commands. If empty, no global permission is required.

```json
"RequiredCommandPermission": "@css/vip"
```

### Per-Category Permissions

Set permissions for specific command categories via `Additional.CommandPermissions`. These are checked **in addition** to the global permission.

```json
"CommandPermissions": {
  "Knives": "",
  "Gloves": "",
  "Weapons": "@css/vip",
  "Music": "",
  "Pins": "",
  "Agents": ""
}
```

In this example, all players can use knife/glove/agent/music/pin commands, but only VIPs can use `!g` and weapon shortcuts.

---

## Chat Command Visibility

The config option `Additional.HideChatCommandMessages` can hide CS2Inspect commands from public chat so only the plugin's feedback messages are visible. When enabled, chat lines starting with `!` or `/` that match known commands are suppressed from broadcast.

---

## Related Documentation

- **[Plugin Overview](./)** — Architecture and installation
- **[Plugin Configuration](./configuration.md)** — Full configuration reference
- **[User Guide](../user-guide.md)** — End-user web app guide
