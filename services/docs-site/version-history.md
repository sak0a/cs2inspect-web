# Version History

The Version History system tracks changes to item customizations (weapons, knives, gloves) and allows users to restore previous configurations.

## Overview

Every time you save changes to an item's customization, the system automatically records a snapshot of the previous state. This creates a timeline of changes that you can browse and restore from.

### Key Features

- **Automatic Recording**: Changes are tracked automatically when saving
- **Human-Readable Version IDs**: Each version gets a memorable 2-word ID (e.g., "blue-fox", "swift-hawk")
- **Skin Name Tracking**: Skin changes show actual names (e.g., "Asiimov → Dragon Lore")
- **Full Configuration Snapshots**: Complete item state is preserved including stickers, keychains, wear, pattern, nametag, and StatTrak settings
- **Easy Restoration**: One-click restore to any previous version

## How It Works

### Recording Changes

When you modify and save an item, the system:

1. Captures the current configuration from the database
2. Compares it with the new configuration
3. Detects what changed (skin, wear, stickers, etc.)
4. Generates a unique 2-word version ID
5. Stores the snapshot with change description

### Version ID Format

Version IDs are generated using a combination of adjectives and nouns:

```
adjective-noun
```

Examples:

- `blue-fox`
- `swift-hawk`
- `gold-owl`
- `neon-bear`

This makes versions easy to reference and remember.

### Change Detection

The system tracks the following change types:

| Change Type              | Description                 | Icon |
| ------------------------ | --------------------------- | ---- |
| `paint_changed`          | Skin/paint changed          | 🎨   |
| `wear_changed`           | Wear value modified         | 💎   |
| `pattern_changed`        | Pattern seed changed        | 🎨   |
| `sticker_added`          | Sticker applied             | 🏷️   |
| `sticker_removed`        | Sticker removed             | 🗑️   |
| `sticker_modified`       | Sticker replaced            | ✏️   |
| `keychain_added`         | Keychain attached           | 🔗   |
| `keychain_removed`       | Keychain removed            | 🗑️   |
| `keychain_modified`      | Keychain replaced           | ✏️   |
| `nametag_changed`        | Name tag modified           | 📝   |
| `stattrak_toggled`       | StatTrak enabled/disabled   | 📊   |
| `stattrak_count_changed` | StatTrak count changed      | 📊   |
| `multiple_changes`       | Multiple properties changed | 📦   |
| `initial_save`           | First configuration         | ✨   |
| `reset`                  | Restored from history       | 🔄   |

### Change Descriptions

Changes are described with specific details:

```
Asiimov → Dragon Lore                    # Skin change with names
wear: 0.0100 → 0.0500                    # Wear change with values
pattern: 123 → 456                       # Pattern change
sticker 1 added                          # Sticker modification
StatTrak enabled                         # StatTrak toggle
nametag added: "My AK"                   # Nametag change
```

## Using the History Panel

### Opening the Panel

Click the **History** button in any item customization modal (weapons, knives, gloves) to open the history panel.

### Panel Features

The history panel displays:

1. **Version ID** - The 2-word identifier (e.g., "blue-fox")
2. **Change Icon** - Visual indicator of change type
3. **Timestamp** - When the change was made
4. **Change Details** - Up to 3 changes shown directly, more on hover
5. **Restore Button** - Appears on hover

### Restoring a Version

1. Open the history panel
2. Find the version you want to restore
3. Hover over the entry and click **Restore**
4. Confirm the restoration in the dialog
5. The item configuration will be updated to that version

::: warning Note
Restoring a version creates a new history entry, so you can always undo a restore by restoring the previous version.
:::

## Database Schema

The version history is stored in the `wp_item_history` table:

```sql
CREATE TABLE wp_item_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  steamid VARCHAR(64) NOT NULL,
  loadoutid INT NOT NULL,

  -- Item identification
  item_type VARCHAR(20) NOT NULL,      -- 'weapon', 'knife', 'glove'
  item_category VARCHAR(20),           -- 'rifles', 'pistols', 'smgs', 'heavys'
  defindex INT NOT NULL,
  team TINYINT NOT NULL,

  -- Snapshot data
  configuration JSON NOT NULL,          -- Full item state
  change_type VARCHAR(50) NOT NULL,     -- Type of change
  change_description VARCHAR(255),      -- Human-readable description
  version_id VARCHAR(30) NOT NULL,      -- 2-word identifier

  -- Metadata
  is_snapshot TINYINT DEFAULT 0,        -- 1 = manual snapshot
  created_at TIMESTAMP DEFAULT NOW(),

  -- Indexes for efficient queries
  INDEX idx_item_history_item (steamid, loadoutid, item_type, defindex, team),
  INDEX idx_item_history_loadout (steamid, loadoutid),
  INDEX idx_item_history_created (created_at),

  FOREIGN KEY (loadoutid) REFERENCES wp_player_loadouts(id) ON DELETE CASCADE
);
```

### Configuration Snapshot

The `configuration` JSON column stores:

```typescript
interface ItemHistorySnapshot {
  paintindex: number // Skin paint index
  paintseed: number // Pattern seed
  paintwear: number // Wear float value
  stattrak_enabled?: boolean
  stattrak_count?: number
  nametag?: string
  stickers?: Array<StickerJSON | null> // For weapons only
  keychain?: KeychainJSON | null // For weapons only
  active?: boolean
}
```

## API Endpoints

### Get Item History

```http
GET /api/items/history/{itemType}
```

Query parameters:

- `steamId` - User's Steam ID
- `loadoutId` - Loadout ID
- `defindex` - Item definition index
- `team` - Team number (1 or 2)
- `category` - Weapon category (for weapons only)
- `limit` - Max records to return (default: 20)
- `offset` - Pagination offset

### Restore Version

```http
POST /api/items/history/restore
```

Request body:

```json
{
  "historyId": 123,
  "steamId": "76561198012345678"
}
```

### Create Snapshot

```http
POST /api/items/history/snapshot
```

Request body:

```json
{
  "steamId": "76561198012345678",
  "loadoutId": 1,
  "itemType": "weapon",
  "category": "rifles",
  "defindex": 7,
  "team": 2,
  "configuration": { ... },
  "description": "Before tournament"
}
```

## Implementation Details

### Version ID Generator

Located at `server/utils/versionIdGenerator.ts`:

```typescript
// Word lists for generating memorable IDs
const adjectives = ['blue', 'red', 'gold', 'dark', 'wild', ...]
const nouns = ['fox', 'owl', 'bear', 'wolf', 'hawk', ...]

export function generateVersionId(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adjective}-${noun}`
}
```

### History Recording

History is recorded in `server/utils/database/historyHelpers.ts` through:

- `recordWeaponHistory()` - For weapon changes
- `recordKnifeHistory()` - For knife changes
- `recordGloveHistory()` - For glove changes

These functions:

1. Fetch current state from database
2. Look up skin names for better descriptions
3. Detect changes between old and new state
4. Insert history record with version ID

### UI Component

The `ItemHistoryPanel.vue` component provides:

- Glass morphism drawer panel
- Timeline view of changes
- Tooltip with full change details
- Restore confirmation dialog
- Pagination for large histories

## Best Practices

### For Users

1. **Use meaningful nametags** - They're preserved in history
2. **Check history before major changes** - You can always restore
3. **Don't worry about mistakes** - Every change can be undone

### For Developers

1. **Non-blocking recording** - History recording doesn't block saves
2. **Automatic cleanup** - Consider adding retention policies
3. **Efficient queries** - Use indexed columns for lookups
