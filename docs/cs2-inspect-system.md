# CS2 Inspect System Documentation

## Overview

The CS2 Inspect System is a comprehensive backend implementation for handling Counter-Strike 2 item inspection via Steam's Game Coordinator. It supports both masked and unmasked inspect URLs, protobuf encoding/decoding, and real-time item data fetching from the CS2 client.

## Core Components

### 1. Steam Client Integration

#### Dependencies
```json
{
  "steam-user": "^5.2.0",
  "globaloffensive": "^3.2.0",
  "@types/globaloffensive": "^2.3.4"
}
```

#### Steam Client (`server/utils/csinspect/steamClient.ts`)
- **Singleton Pattern**: Manages a single Steam client instance
- **Queue System**: Handles multiple inspect requests with rate limiting (1.5s delay)
- **Auto-reconnection**: Maintains connection to CS2 Game Coordinator
- **Server Connection**: Connects to specific CS2 servers for inspection

**Key Features:**
- Rate limiting: 1.5 seconds between requests
- Queue size limit: 100 concurrent requests
- Request timeout: 10 seconds
- Queue timeout: 30 seconds
- Automatic expired item cleanup

#### Environment Variables Required
```env
# Steam Account Configuration (Required for unmasked URLs)
STEAM_USERNAME=your_steam_username
STEAM_PASSWORD=your_steam_password
STEAM_API_KEY=your_steam_api_key
```

### 2. Inspect URL Processing

#### URL Analysis (`server/utils/csinspect/base.ts`)
Supports multiple URL formats:
- Full Steam URLs: `steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20{data}`
- Command format: `csgo_econ_action_preview {data}`
- Short format: `+csgo_econ_action_preview {data}`
- Raw data: `{hex_data}` or `{unmasked_data}`

#### URL Types
1. **Masked URLs**: Hex-encoded protobuf data (community market items)
2. **Unmasked URLs**: Direct Steam inventory references (format: `S{steamid}A{assetid}D{classid}`)

### 3. Protobuf System

#### Protobuf Decoder (`server/utils/csinspect/protobuf-decoder.ts`)
Decodes masked inspect URLs containing protobuf-encoded item data:

**Supported Fields:**
- `defindex`: Weapon/item definition index
- `paintindex`: Skin paint index
- `paintseed`: Pattern seed
- `paintwear`: Float value (wear)
- `rarity`: Item rarity level
- `quality`: Item quality
- `killeaterscoretype/killeatervalue`: StatTrak data
- `customname`: Name tag
- `stickers`: Array of applied stickers
- `keychains`: Array of attached keychains

#### Protobuf Writer (`server/utils/csinspect/protobuf-writer.ts`)
Creates masked inspect URLs from item data:

**Features:**
- CRC32 checksum validation
- Proper protobuf field encoding
- Support for stickers and keychains
- Float-to-bytes conversion for wear values

### 4. Type Definitions

#### Core Interfaces
```typescript
interface InspectURLInfo {
    original_url: string;
    cleaned_url: string;
    url_type: 'masked' | 'unmasked';
    is_quoted: boolean;
    market_id?: string;
    owner_id?: string;
    asset_id?: string;
    class_id?: string;
    hex_data?: string;
}

interface ItemBuilder {
    defindex: number | WeaponType;
    paintindex: number;
    paintseed: number;
    paintwear: number;
    rarity?: ItemRarity | number | string;
    quality?: number;
    killeaterscoretype?: number;
    killeatervalue?: number;
    customname?: string;
    stickers?: Sticker[];
    keychains?: Sticker[];
}

interface Sticker {
    slot: number;
    sticker_id: number;
    wear?: number;
    scale?: number;
    rotation?: number;
    tint_id?: number;
    offset_x?: number;
    offset_y?: number;
    offset_z?: number;
    pattern?: number;
}
```

#### Enums
```typescript
enum ItemRarity {
    STOCK = 0,
    CONSUMER_GRADE = 1,
    INDUSTRIAL_GRADE = 2,
    MIL_SPEC_GRADE = 3,
    RESTRICTED = 4,
    CLASSIFIED = 5,
    COVERT = 6,
    CONTRABAND = 7,
    GOLD = 99
}

enum WeaponType {
    // Pistols
    DESERT_EAGLE = 1,
    GLOCK_18 = 4,
    // ... (extensive weapon definitions)
    
    // Knives
    BAYONET = 500,
    KARAMBIT = 507,
    // ... (knife definitions)
    
    // Gloves
    GLOVES_BLOODHOUND = 5027,
    GLOVES_SPORT = 5030,
    // ... (glove definitions)
}
```

### 5. API Endpoints

#### Unified Inspect Endpoint
- `POST /api/inspect` - Universal inspection endpoint for all item types (weapons, knives, gloves, agents, music kits)

#### Query Parameters
- `action=create-url` - Create an inspect URL from item data
- `action=inspect-item` - Inspect any URL (masked or unmasked)
- `action=decode-masked-only` - Decode ONLY masked URLs (offline)
- `action=decode-hex-data` - Decode raw hex data directly
- `action=validate-url` - Validate an inspect URL with detailed analysis
- `action=analyze-url` - Analyze URL structure (weapons only)
- `action=client-status` - Get Steam client status

#### Request Body Examples
```typescript
// Decode inspect URL
{
    inspectUrl: "steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20{data}",
    itemType: "weapon" // Optional: weapon, knife, glove, agent, music-kit
}

// Create inspect URL
{
    itemType: "weapon", // Required: weapon, knife, glove, agent, music-kit
    defindex: 7, // AK-47
    paintindex: 179,
    paintseed: 420,
    paintwear: 0.15,
    statTrak: true,
    statTrakCount: 1337,
    nameTag: "My AK",
    stickers: [...], // Only for weapons
    keychain: {...}  // Only for weapons
}
```

### 6. Client Initialization

#### Server Plugin (`server/plugins/init.ts`)
```typescript
export async function initializeSteamClient() {
    const client = SteamClient.getInstance();
    await client.connect();
}

export function getCS2Client() {
    return SteamClient.getInstance();
}
```

### 7. Frontend Integration

#### Composable (`composables/useInspectItem.ts`)
Provides reactive interface for inspect functionality:

**Features:**
- Item type detection (weapon/knife/glove)
- Local storage persistence
- Inspect URL analysis
- Link generation
- Error handling

#### Components
- `InspectItemDisplay.vue` - Display inspected items
- `InspectURLModal.vue` - Input modal for inspect URLs

### 8. Utility Functions

#### Helper Functions (`server/utils/inspectHelpers.ts`)
- `mapCustomizationToRepresentation()` - Maps frontend customization to backend format

#### Base Utilities (`server/utils/csinspect/base.ts`)
- `analyzeInspectUrl()` - Parse and analyze inspect URLs
- `formatInspectUrl()` - Format URLs for different contexts
- `generateCommands()` - Generate CS2 console commands
- `hexToBytes()` / `bytesToFloat()` - Data conversion utilities

## Usage Examples

### Decoding a Masked URL
```typescript
import { analyzeInspectUrl, decodeMaskedData } from '~/server/utils/csinspect/base';

const url = "steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20001807...";
const urlInfo = analyzeInspectUrl(url);

if (urlInfo?.url_type === 'masked' && urlInfo.hex_data) {
    const itemData = decodeMaskedData(urlInfo.hex_data);
    console.log('Item:', itemData);
}
```

### Creating an Inspect URL
```typescript
import { createInspectUrl } from '~/server/utils/csinspect/protobuf-writer';

const inspectUrl = createInspectUrl({
    defindex: WeaponType.AK_47,
    paintindex: 179,
    paintseed: 420,
    paintwear: 0.15,
    rarity: ItemRarity.CLASSIFIED,
    stickers: [{
        slot: 0,
        sticker_id: 5032,
        wear: 0.1,
        offset_x: 0.0,
        offset_y: 0.0
    }]
});
```

### Inspecting via Steam Client
```typescript
import { getCS2Client } from '~/server/plugins/init';

const client = getCS2Client();
if (client.getIsReady()) {
    const itemInfo = await client.inspectItem(urlInfo);
    console.log('Steam item data:', itemInfo);
}
```

## Error Handling

The system includes comprehensive error handling:
- Steam client connection failures
- Invalid inspect URL formats
- Queue overflow protection
- Request timeouts
- Protobuf parsing errors

## Rate Limiting

- **Request Rate**: 1.5 seconds between Steam API calls
- **Queue Size**: Maximum 100 concurrent requests
- **Timeouts**: 10s per request, 30s queue timeout
- **Cleanup**: Automatic removal of expired requests

## Security Considerations

- Steam credentials stored in environment variables
- JWT-based authentication for API endpoints
- Input validation for all inspect URLs
- Rate limiting to prevent abuse
- Secure cookie handling for authentication

## Dependencies Summary

**Core Steam Integration:**
- `steam-user`: Steam client connection
- `globaloffensive`: CS2 Game Coordinator interface

**Utilities:**
- `csgo-fade-percentage-calculator`: Fade pattern calculations
- `node-cache`: Caching layer
- `bcrypt`: Password hashing
- `jsonwebtoken`: Authentication tokens

**Development:**
- `@types/globaloffensive`: TypeScript definitions
- `vitest`: Testing framework
