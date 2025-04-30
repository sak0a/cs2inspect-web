# CS2 Loadout Manager

A comprehensive web application for managing Counter-Strike 2 weapon loadouts, built with Nuxt 3.

![CS2 Loadout Manager](https://example.com/cs2-loadout-manager-preview.png)

## 🚀 Overview

This application allows users to:
- Create and manage multiple CS2 weapon loadouts
- Customize weapons with skins, stickers, and keychains
- Configure team-specific equipment (T/CT sides)
- Authenticate via Steam

## 🔄 Application Flow

### Server-side
1. **Initialization**: Fetches latest CS2 item data from the [CSGO-API](https://bymykel.github.io/CSGO-API/)
2. **Authentication**: Handles Steam authentication and user sessions
3. **Database**: Manages user loadouts and weapon configurations

### Client-side
1. **Authentication**: User logs in via Steam
2. **Loadout Management**: 
   - Fetches user loadouts from `/api/loadouts?steamid=[id]`
   - Displays loadout selection interface
3. **Weapon Customization**:
   - Fetches weapon data for selected loadout via `/api/weapons/[type]?loadoutid=[id]&steamid=[id]`
   - Provides interface for skin, sticker, and keychain selection

## 📊 Data Models

### Core Interfaces

#### APISkin
Represents weapon skins from the CS2 API:

```typescript
interface APISkin {
    id: string;
    name: string;
    description?: string;
    weapon: {
        id: string;
        name: string;
        weapon_id: string;
    }
    category: {
        id: string;
        name: string
    }
    pattern: {
        id: string;
        name: string;
    }
    min_float: number;
    max_float: number;
    rarity: {
        id: string;
        name: string;
        color: string;
    }
    stattrak?: boolean
    souvenir?: boolean
    paint_index: string
    wears?: any[]
    collections?: any[]
    crates?: any[]
    team?: {
        id: string;
        name: string;
    }
    image: string;
}
```

#### APISticker
Represents stickers from the CS2 API:

```typescript
interface APISticker {
    id: string;
    name: string;
    description?: string;
    rarity: {
        id: string;
        name: string;
        color: string
    }
    crates?: any[]
    tournament_event: string
    tournament_team: string
    type: string
    market_hash_name?: string
    effect?: string
    image: string
}
```

#### APIKeychain
Represents weapon charms from the CS2 API:

```typescript
interface APIKeychain {
    id: string;
    name: string;
    description?: string;
    rarity: {
        id: string;
        name: string;
        color: string;
    }
    market_hash_name?: string;
    image: string;
}
```

#### APIMusicKit
Represents music kits from the CS2 API:

```typescript
interface APIMusicKit {
    id: string
    name: string
    description?: string
    rarity: {
        id: string
        name: string
        color: string
    }
    market_hash_name?: string
    exclusive?: boolean
    image: string
}
```

#### APIAgent
Represents player models from the CS2 API:

```typescript
interface APIAgent {
  id: string;
  name: string;
  description?: string;
  rarity: {
    id: string;
    name: string;
    color: string;
  }
  collections?: any[];
  team: {
    id: string;
    name: string;
  }
  market_hash_name?: string;
  image: string;
}
```

#### DBLoadout
Represents a user's loadout in the database:

```typescript
interface DBLoadout {
    id: string;
    steamid: string;
    name: string;
    selected_knife_t: number | null;
    selected_knife_ct: number | null;
    selected_glove_t: number | null;
    selected_glove_ct: number | null;
    created_at: string;
    updated_at: string;
}
```

#### DBKnife
Represents a user's knife entry in the database:

```typescript
interface DBKnife {
    id: string;
    steamid: string;
    loadoutid: string;
    active: boolean;
    team: number;
    defindex: number;
    paintindex: number;
    paintseed: string;
    paintwear: string;
    stattrak_enabled: boolean;
    stattrak_count: number;
    nametag: string;
    created_at: string;
    updated_at: string;
}
```

#### DBGlove
Represents a user's glove entry in the database:

```typescript
interface DBGlove {
    id: string;
    steamid: string;
    loadoutid: string;
    active: boolean;
    team: number;
    defindex: number;
    paintindex: number;
    paintseed: string;
    paintwear: string;
    created_at: string;
    updated_at: string;
}
```

#### DBWeapon
Represents a user's weapon entry in the database:

```typescript
interface DBWeapon {
    id: string;
    steamid: string;
    loadoutid: string;
    active: boolean;
    team: number;
    defindex: number;
    paintindex: number;
    paintseed: string;
    paintwear: string;
    stattrak_enabled: boolean;
    stattrak_count: number;
    nametag: string;
    sticker_0: string;
    sticker_1: string;
    sticker_2: string;
    sticker_3: string;
    sticker_4: string;
    keychain: string;
    created_at: string;
    updated_at: string;
}
```

#### DBPin
Represents a user's pin entry in the database:

```typescript
interface DBPin {
    id: string;
    steamid: string;
    loadoutid: string;
    active: boolean
    team: number
    pinid: number;
    created_at: string;
    updated_at: string;
}
```

#### DBMusicKit
Represents a user's music kit entry in the database:

```typescript
interface DBMusicKit {
    id: string;
    steamid: string;
    loadoutid: string;
    active: boolean
    team: number;
    musicid: number;
    created_at: string;
    updated_at: string;
}
```

#### DBAgent
Represents a user's agent entry in the database:

```typescript
interface DBAgent {
    id: string;
    steamid: string;
    loadoutid: string;
    active: boolean
    team: number;
    defindex: number;
    agent_name: string;
    created_at: string;
    updated_at: string;
}
```


### Frontend Data Structures

### StickerData
Represents a sticker applied to a weapon:

```typescript
interface IEnhancedWeaponSticker {
  id: number;
  x: number;
  y: number;
  wear: number;
  scale: number;
  rotation: number;
  api: {
    name: string;
    type: string;
    image: string;
    effect: string;
    rarity: {
      name: string;
      id: string;
      color: string;
    };
    tournament_team: string;
    tournament_event: string;
  };
}
```

### KeychainData
Represents a keychain attached to a weapon:

```typescript
interface IEnhancedWeaponKeychain {
  id: number;
  x: number;
  y: number;
  z: number;
  seed: number;
  api: {
    name: string;
    image: string;
    rarity: {
      name: string;
      id: string;
      color: string;
    };
  };
}
```

### WeaponData
`IMappedDBWeapon` represents a weapon's database information with mapped Keychain and Sticker data:
```typescript
interface IMappedDBWeapon {
  active: boolean;
  team: number;
  defindex: number;
  statTrak: boolean;
  statTrakCount: number;
  paintIndex: number;
  paintWear: number;
  pattern: number;
  nameTag: string;
  stickers: any;
  keychain: IEnhancedWeaponKeychain | null;
}
```

`IDefaultItem` represents default weapon information used from `/server/utils/constants.ts` to display default weapons
```ts
interface IDefaultItem {
  weapon_defindex: number;
  defaultName: string;
  paintIndex: number;
  defaultImage: string;
  weapon_name: string;
  category: string;
  availableTeams: string;
}
```

`IEnhancedItem` extends `IDefaultItem` and uses `DBKnife` or `IMappedDBWeapon` or `DBGlove` for database information:
```typescript
interface IEnhancedItem extends IDefaultItem {
  name: string;
  image: string;
  minFloat: number;
  maxFloat: number;
  rarity?: {
    name: string;
    id: string;
    color: string;
  };
  databaseInfo?: DBKnife | IEnha | IMappedDBWeapon;
}
```

## 🗄️ Database Structure

The application uses the following database tables:

| Table | Description |
|-------|-------------|
| `wp_player_loadouts` | Stores user loadout configurations |
| `wp_player_knifes` | Knife configurations for each loadout |
| `wp_player_gloves` | Glove configurations for each loadout |
| `wp_player_rifles` | Rifle configurations for each loadout |
| `wp_player_smgs` | SMG configurations for each loadout |
| `wp_player_pistols` | Pistol configurations for each loadout |
| `wp_player_heavys` | Heavy weapon configurations for each loadout |
| `wp_player_agents` | Agent (player model) configurations |
| `wp_player_pins` | Pin configurations |
| `wp_player_music` | Music kit configurations |

## 🔌 API Endpoints

All endpoints require authentication.

### Loadout Management

#### `GET /api/loadouts?steamId=[id]`
Fetches all loadouts for a user.

**Response:**
```json
{
  "loadouts": [
    {
      "id": 1,
      "steamid": "1234567890",
      "name": "Example Name",
      "selected_knife_t": 500,
      "selected_knife_ct": 505,
      "selected_glove_t": null,
      "selected_glove_ct": null,
      "created_at": "2025-01-30T15:48:11.000Z",
      "updated_at": "2025-03-15T01:20:21.000Z"
    }
  ],
  "message": "Loadouts fetched successfully!"
}
```

#### `POST /api/loadouts?steamId=[id]`
Creates a new loadout.

**Request:**
```json
{
  "name": "Example Name"
}
```

**Response:**
```json
{
  "loadout": {
    "id": 1,
    "steamid": "1234567890",
    "name": "Example Name",
    "selected_knife_t": 500,
    "selected_knife_ct": 505,
    "selected_glove_t": null,
    "selected_glove_ct": null,
    "created_at": "2025-01-30T15:48:11.000Z",
    "updated_at": "2025-03-15T01:20:21.000Z"
  },
  "message": "Loadout created successfully"
}
```

#### `PUT /api/loadouts?steamId=[id]&id=[id]`
Updates a loadout (currently only name updates are supported).

**Request:**
```json
{
  "name": "New Name"
}
```

**Response:**
```json
{
  "loadout": {
    "id": 1,
    "steamid": "1234567890",
    "name": "New Name",
    "selected_knife_t": 500,
    "selected_knife_ct": 505,
    "selected_glove_t": null,
    "selected_glove_ct": null,
    "created_at": "2025-01-30T15:48:11.000Z",
    "updated_at": "2025-03-15T01:20:21.000Z"
  },
  "message": "Loadout updated successfully"
}
```

#### `DELETE /api/loadouts?steamId=[id]&id=[id]`
Deletes a loadout.

**Response:**
```json
{
  "message": "Loadout deleted successfully"
}
```

#### `POST /api/loadouts/select?steamId=[id]&loadoutId=[id]&type=[type]`
Updates the selected knife/glove for a loadout.

**Request:**
```json
{
  "team": 1,  // 1 = Terrorists, 2 = Counter Terrorists
  "defindex": 503  // Weapon defindex, or null to unselect
}
```

## 🛠️ Setup and Development

### Prerequisites
- Node.js (v16+)
- MySQL/MariaDB database

### Installation

```bash
# Install dependencies
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### Development Server

```bash
# Start development server on http://localhost:3000
npm run dev
# or
yarn dev
# or
pnpm run dev
# or
bun run dev
# or
nuxt dev
```

### Production Build

```bash
# Build for production
npm run build
# or
yarn build
# or
pnpm run build

# Preview production build
npm run preview
# or
yarn preview
# or
pnpm run preview
```

## 📚 Documentation
- [Nuxt 3 Documentation](https://nuxt.com/docs/getting-started/introduction)
- [CS:GO API Documentation](https://bymykel.github.io/CSGO-API/)
