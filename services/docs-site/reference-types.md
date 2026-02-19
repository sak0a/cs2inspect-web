# TypeScript Types Reference

## Overview

CS2Inspect uses a comprehensive TypeScript type system to ensure type safety throughout the application. This document provides reference documentation for all type definitions, branded types, type guards, and utilities.

## Type System Architecture

The type system is organized into several categories:

```
types/
├── core/              # Core types (branded types, common utilities)
├── api/               # API request/response types
├── business/          # Business logic types (items, configurations)
├── database/          # Database record types
├── components/        # Component-specific types
└── index.ts           # Central export

server/types/
├── api.ts             # Server API types
├── database.ts        # Server database types
├── items.ts           # Enhanced item types
├── inspect.ts         # Inspect system types
├── health.ts          # Health check types
└── index.ts           # Server types export
```

---

## Branded Types

Branded types add compile-time safety by preventing accidental mixing of different ID types.

**Location**: `/types/core/branded.ts`

### Entity IDs

#### `LoadoutId`

```typescript
type LoadoutId = number & { readonly __brand: 'LoadoutId' }
```

Loadout identifier (numeric in database, often string in URLs).

**Usage**:
```typescript
import { toLoadoutId } from '~/types/core/branded'

// Convert from URL param
const loadoutId = toLoadoutId(params.id)

// Type-safe database query
await db.select().from(loadouts).where(eq(loadouts.id, loadoutId))
```

**Type Guard**:
```typescript
function isValidLoadoutId(value: unknown): value is LoadoutId {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}
```

---

#### `SteamId`

```typescript
type SteamId = string & { readonly __brand: 'SteamId' }
```

64-bit Steam identifier (17-digit string).

**Example**: `"76561198012345678"`

**Usage**:
```typescript
import { toSteamId } from '~/types/core/branded'

const steamId = toSteamId(user.steamId)
await loadoutStore.fetchLoadouts(steamId)
```

**Type Guard**:
```typescript
function isValidSteamId(value: unknown): value is SteamId {
  return typeof value === 'string' && /^\d{17}$/.test(value)
}
```

---

### Item Identifiers

#### `Defindex`

```typescript
type Defindex = number & { readonly __brand: 'Defindex' }
```

Weapon/item definition index (unique identifier for each item type).

**Examples**:
- `7` - AK-47
- `500` - Bayonet
- `5027` - Hand Wraps

**Usage**:
```typescript
import { toDefindex } from '~/types/core/branded'

const weaponDefindex = toDefindex(7) // AK-47
```

---

#### `PaintIndex`

```typescript
type PaintIndex = number & { readonly __brand: 'PaintIndex' }
```

Paint/skin index (unique identifier for each skin).

**Examples**:
- `12` - Crimson Web
- `44` - Asiimov
- `253` - Fire Serpent

**Usage**:
```typescript
import { toPaintIndex } from '~/types/core/branded'

const skinIndex = toPaintIndex(253) // Fire Serpent
```

---

#### `PaintSeed`

```typescript
type PaintSeed = number & { readonly __brand: 'PaintSeed' }
```

Pattern seed (determines pattern variation).

**Range**: 0-999

**Examples**:
- `661` - Blue Gem Case Hardened
- `0` - Default pattern

**Usage**:
```typescript
import { toPaintSeed } from '~/types/core/branded'

const seed = toPaintSeed(661) // Blue Gem seed
```

---

#### Other Item IDs

```typescript
type StickerId = number & { readonly __brand: 'StickerId' }
type KeychainId = number & { readonly __brand: 'KeychainId' }
type MusicKitDefindex = number & { readonly __brand: 'MusicKitDefindex' }
type PinDefindex = number & { readonly __brand: 'PinDefindex' }
```

**Converters**:
```typescript
import {
  toStickerId,
  toKeychainId,
  toMusicKitDefindex,
  toPinDefindex
} from '~/types/core/branded'
```

---

#### Admin & Utility IDs

```typescript
type AdminId = number & { readonly __brand: 'AdminId' }
type BanId = number & { readonly __brand: 'BanId' }
type SettingKey = string & { readonly __brand: 'SettingKey' }
type ISOTimestamp = string & { readonly __brand: 'ISOTimestamp' }
```

**Converters**:
```typescript
import {
  toAdminId,
  toBanId,
  toSettingKey,
  toISOTimestamp
} from '~/types/core/branded'
```

**Type Guards**: `isValidAdminId()`, `isValidBanId()`, `isValidSettingKey()`, `isValidISOTimestamp()`

---

## Item Configuration Types

**Location**: `/types/business/items.ts`

### Base Configuration

```typescript
interface ItemConfiguration {
  active: boolean
  team: number              // 1=T, 2=CT
  defindex: number
  paintIndex: number
  paintIndexOverride: boolean
  pattern: number           // 0-999
  wear: number              // 0.0-1.0
}
```

### Weapon Configuration

```typescript
interface WeaponConfiguration extends ItemConfiguration {
  statTrak: boolean
  statTrakCount: number
  nameTag: string
  stickers: Array<StickerConfig | null>  // 5 slots
  keychain: KeychainConfig | null
}

interface StickerConfig {
  id: number
  wear: number      // 0.0-1.0
  scale: number     // Scale factor
  rotation: number  // Rotation in degrees
  x: number         // X offset
  y: number         // Y offset
}

interface KeychainConfig {
  id: number
  seed: number
  x: number
  y: number
  z: number
}
```

### Knife Configuration

```typescript
interface KnifeConfiguration extends ItemConfiguration {
  statTrak: boolean
  statTrakCount: number
  nameTag: string
}
```

### Glove Configuration

```typescript
interface GloveConfiguration extends ItemConfiguration {
  // No additional properties beyond ItemConfiguration
}
```

### Type Guards

```typescript
function isWeaponConfiguration(config: ItemConfiguration): config is WeaponConfiguration
function isKnifeConfiguration(config: ItemConfiguration): config is KnifeConfiguration
function isGloveConfiguration(config: ItemConfiguration): config is GloveConfiguration
```

**Usage**:
```typescript
import { isWeaponConfiguration } from '~/types/business/items'

if (isWeaponConfiguration(config)) {
  // TypeScript knows config has stickers, keychain, etc.
  console.log(config.stickers)
  console.log(config.nameTag)
}
```

---

## Database Record Types

**Location**: `/types/database/records.ts`

### DBLoadout

```typescript
interface DBLoadout {
  id: number
  steamid: string
  name: string
  selected_knife_t: number | null
  selected_knife_ct: number | null
  selected_glove_t: number | null
  selected_glove_ct: number | null
  selected_agent_ct: number | null
  selected_agent_t: number | null
  selected_music: number | null
  active: boolean | number
  is_default: boolean | number
  created_at: string
  updated_at: string
}
```

### DBWeapon

```typescript
interface DBWeapon {
  id: number
  steamid: string
  loadoutid: number
  team: number
  weapon_defindex: number
  weapon_name: string
  active: boolean | number
  paintindex: number
  paintseed: number
  paintwear: number
  stattrak_enabled: boolean | number
  stattrak_count: number
  nametag: string | null
  created_at: string
  updated_at: string
}
```

### DBKnife

```typescript
interface DBKnife {
  id: number
  steamid: string
  loadoutid: number
  team: number
  weapon_defindex: number
  weapon_name: string
  active: boolean | number
  paintindex: number
  paintseed: number
  paintwear: number
  stattrak_enabled: boolean | number
  stattrak_count: number
  nametag: string | null
  created_at: string
  updated_at: string
}
```

### DBGlove

```typescript
interface DBGlove {
  id: number
  steamid: string
  loadoutid: number
  team: number
  weapon_defindex: number
  weapon_name: string
  active: boolean | number
  paintindex: number
  paintseed: number
  paintwear: number
  created_at: string
  updated_at: string
}
```

---

## API Types

**Location**: `/types/api/`

### API Response Wrapper

```typescript
interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: APIError
  meta?: APIMetadata
}

interface APIError {
  code: string
  message: string
  details?: Record<string, unknown>
}

interface APIMetadata {
  loadoutId?: number
  steamId?: string
  rows?: number
  page?: number
  totalPages?: number
}
```

**Usage**:
```typescript
type LoadoutsResponse = APIResponse<{ loadouts: DBLoadout[] }>

const response: LoadoutsResponse = await fetch('/api/loadouts')
if (response.success) {
  console.log(response.data.loadouts)
}
```

### API Item Types

```typescript
interface APIWeaponSkin {
  id: number
  defindex: number
  paintindex: number
  name: string
  weapon: string
  pattern: string
  rarity: {
    id: string
    name: string
    color: string
  }
  collection: string
  min_float: number
  max_float: number
  image: string
  statTrakAvailable: boolean
  category: string
}

interface APISkin extends APIWeaponSkin {
  // Alias for backward compatibility
}
```

### Admin API Types

**Location**: `/types/api/admin.ts`

```typescript
/** Dashboard overview statistics */
interface AdminOverviewStats {
  totalUsers: number
  activeUsers7d: number
  activeUsers30d: number
  totalLoadouts: number
  totalItems: { weapons: number; knives: number; gloves: number; agents: number; musicKits: number; pins: number }
  bannedUsers: number
}

/** User details for admin view */
interface AdminUserDetails {
  steamId: SteamId
  loadoutCount: number
  itemCounts: { weapons: number; knives: number; gloves: number; agents: number; musicKits: number; pins: number }
  firstActivity: ISOTimestamp
  lastActivity: ISOTimestamp
  isBanned: boolean
  banInfo?: { reason: string | null; bannedAt: ISOTimestamp; bannedBy: SteamId; expiresAt: ISOTimestamp | null }
}

/** User list item (summary for table display) */
interface AdminUserSummary {
  steamId: SteamId
  loadoutCount: number
  totalItems: number
  lastActivity: ISOTimestamp | null
  isBanned: boolean
}

/** Activity data point for time-series charts */
interface AdminActivityData {
  date: string
  newUsers: number
  activeUsers: number
  loadoutsCreated: number
  itemsSaved: number
}

/** Heatmap data for calendar visualization */
interface AdminHeatmapData { date: string; value: number }

/** Top user for leaderboard display */
interface AdminTopUser { steamId: SteamId; loadoutCount: number; totalItems: number }

/** Application setting */
interface AdminSetting {
  key: string; value: string; type: 'string' | 'boolean' | 'number' | 'json'
  description: string | null; updatedAt: ISOTimestamp; updatedBy: SteamId | null
}

/** Admin user info */
interface AdminInfo {
  id: number; steamId: SteamId; role: 'admin' | 'superadmin'
  permissions: string[]; createdBy: SteamId | null; createdAt: ISOTimestamp
}

/** Admin activity log entry */
interface AdminActivityLogEntry {
  id: number; adminSteamId: SteamId; action: string
  targetSteamId: SteamId | null; details: Record<string, unknown> | null; createdAt: ISOTimestamp
}

/** Request types */
interface AdminBanUserRequest { reason: string; duration?: number }
interface AdminUpdateSettingRequest { key: string; value: string | number | boolean }
interface AdminAddAdminRequest { steamId: string; role: 'admin' | 'superadmin' }

/** Query parameter types */
interface AdminUserSearchParams { search?: string; page?: number; limit?: number; bannedOnly?: boolean }
interface AdminActivityParams { range: '7d' | '30d' | '90d' }
```

---

## Server-Side Types

**Location**: `/server/types/`

### Enhanced Item Types

```typescript
interface IEnhancedItem {
  weapon_defindex: number
  defaultName: string
  paintIndex: number
  defaultImage: string
  weapon_name: string
  category: string
  availableTeams: string
  name: string
  image: string
  minFloat: number
  maxFloat: number
  rarity: RarityInfo
  team: number | null
}

interface IEnhancedWeapon extends IEnhancedItem {
  databaseInfo?: DatabaseInfo
  type: 'weapon'
}

interface IEnhancedKnife extends IEnhancedItem {
  databaseInfo?: DatabaseInfo
  type: 'knife'
}

interface DatabaseInfo {
  id: number
  defindex: number
  team: number
  paintindex: number
  paintseed: number
  paintwear: number
  stattrak_enabled: boolean
  stattrak_count: number
  nametag: string | null
  active: boolean
}

interface RarityInfo {
  id: string
  name: string
  color: string
}
```

### Inspect Types

```typescript
interface InspectResult {
  success: boolean
  urlType: 'masked' | 'unmasked'
  requiresSteam: boolean
  item: InspectItem
  parsed?: ParsedItemInfo
}

interface InspectItem {
  defindex: number
  paintindex: number
  paintseed: number
  paintwear: number
  rarity?: number
  quality?: number
  statTrak?: {
    enabled: boolean
    count: number
  }
  nameTag?: string
  stickers?: StickerData[]
  keychain?: KeychainData
}

interface ParsedItemInfo {
  weaponName: string
  skinName: string
  wear: string
  floatValue: number
}
```

---

## Utility Types

**Location**: `/types/core/common.ts`

### Loading States

```typescript
enum LoadingState {
  Idle = 'idle',
  Loading = 'loading',
  Success = 'success',
  Error = 'error'
}
```

### Async Result

```typescript
interface AsyncResult<T = unknown> {
  state: LoadingState
  data: T | null
  error?: {
    code: string
    message: string
  }
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
}
```

**Usage**:
```typescript
const asyncState = computed<AsyncResult<IEnhancedItem>>(() => ({
  state: isLoading.value ? LoadingState.Loading :
    error.value ? LoadingState.Error :
    item.value ? LoadingState.Success : LoadingState.Idle,
  data: item.value,
  error: error.value ? { code: 'ERROR', message: error.value } : undefined,
  isLoading: isLoading.value,
  isSuccess: !!item.value && !error.value,
  isError: !!error.value
}))
```

### User Profile

```typescript
interface UserProfile {
  steamId: string
  username: string
  avatar: string
  profileUrl?: string
  createdAt?: string
}
```

---

## Component Types

**Location**: `/types/components/`

### Modal Types

```typescript
interface ItemModalProps {
  visible: boolean
  selectedItem: IEnhancedItem | null
  team: number
}

interface ItemModalEmits {
  (e: 'update:visible', value: boolean): void
  (e: 'save', config: ItemConfiguration): void
  (e: 'close'): void
}
```

---

## Canvas Types

**Location**: `/types/canvas.ts`

```typescript
interface CanvasSticker {
  id: number
  x: number
  y: number
  rotation: number
  scale: number
  wear: number
  image: HTMLImageElement | null
}

interface CanvasConfig {
  width: number
  height: number
  backgroundColor: string
  gridSize: number
  snapToGrid: boolean
}
```

---

## Item Type Enums

```typescript
type ItemType = 'weapon' | 'knife' | 'glove' | 'agent' | 'musickit' | 'pin'

type WeaponCategory = 'rifles' | 'pistols' | 'smgs' | 'heavys'

type Team = 1 | 2 | 3  // 1=T, 2=CT, 3=Both
```

---

## Type Conversion Best Practices

### 1. **Always Use Branded Type Converters**

```typescript
// ✅ Good
const loadoutId = toLoadoutId(params.id)

// ❌ Bad
const loadoutId = Number(params.id) as LoadoutId
```

### 2. **Use Type Guards for Runtime Checks**

```typescript
// ✅ Good
if (isWeaponConfiguration(config)) {
  console.log(config.stickers)
}

// ❌ Bad
if ((config as WeaponConfiguration).stickers) {
  console.log((config as WeaponConfiguration).stickers)
}
```

### 3. **Leverage TypeScript Inference**

```typescript
// ✅ Good - TypeScript infers types
const weapon: IEnhancedWeapon = {
  weapon_defindex: 7,
  // ... TypeScript ensures all required properties
}

// ❌ Bad - Using 'any' defeats type safety
const weapon: any = { weapon_defindex: 7 }
```

### 4. **Use Generic Constraints**

```typescript
// ✅ Good
function processItem<T extends IEnhancedItem>(item: T): void {
  console.log(item.weapon_defindex)
}

// ❌ Bad
function processItem(item: any): void {
  console.log(item.weapon_defindex)
}
```

---

## Common Patterns

### Pattern 1: API Response Handling

```typescript
async function fetchLoadouts(steamId: SteamId): Promise<DBLoadout[]> {
  const response = await fetch(`/api/loadouts?steamId=${steamId}`)
  const data: APIResponse<{ loadouts: DBLoadout[] }> = await response.json()

  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to fetch loadouts')
  }

  return data.data?.loadouts || []
}
```

### Pattern 2: Type-Safe State Updates

```typescript
const state = ref<{
  loadouts: DBLoadout[]
  selectedId: LoadoutId | null
}>({
  loadouts: [],
  selectedId: null
})

// TypeScript ensures type safety
function selectLoadout(id: LoadoutId) {
  state.value.selectedId = id  // ✅ Type-safe
  // state.value.selectedId = "123"  // ❌ Error: string not assignable
}
```

### Pattern 3: Discriminated Unions

```typescript
type ItemConfig =
  | { type: 'weapon'; config: WeaponConfiguration }
  | { type: 'knife'; config: KnifeConfiguration }
  | { type: 'glove'; config: GloveConfiguration }

function processConfig(item: ItemConfig) {
  switch (item.type) {
    case 'weapon':
      // TypeScript knows item.config is WeaponConfiguration
      console.log(item.config.stickers)
      break
    case 'knife':
      // TypeScript knows item.config is KnifeConfiguration
      console.log(item.config.statTrak)
      break
    case 'glove':
      // TypeScript knows item.config is GloveConfiguration
      console.log(item.config.wear)
      break
  }
}
```

---

## Migration Guide

### From Untyped to Typed

**Before**:
```typescript
function getLoadout(id: any) {
  return fetch(`/api/loadouts/${id}`)
}

const loadoutId = Number(params.id)
getLoadout(loadoutId)
```

**After**:
```typescript
function getLoadout(id: LoadoutId): Promise<DBLoadout> {
  return fetch(`/api/loadouts/${id}`).then(r => r.json())
}

const loadoutId = toLoadoutId(params.id)
getLoadout(loadoutId)
```

### From Loose Types to Branded Types

**Before**:
```typescript
interface Weapon {
  id: number
  steamId: string
  defindex: number
  paintIndex: number
}
```

**After**:
```typescript
interface Weapon {
  id: number
  steamId: SteamId
  defindex: Defindex
  paintIndex: PaintIndex
}
```

---

## Type Safety Benefits

### 1. **Compile-Time Error Detection**

```typescript
const loadoutId = toLoadoutId(1)
const steamId = toSteamId("76561198012345678")

// ❌ Compile error: LoadoutId not assignable to SteamId
loadoutStore.fetchLoadouts(loadoutId)

// ✅ Correct
loadoutStore.fetchLoadouts(steamId)
```

### 2. **Autocomplete & IntelliSense**

TypeScript provides autocomplete for all type properties:
```typescript
const weapon: IEnhancedWeapon = {
  // IDE suggests all required properties
  weapon_defindex: 7,
  defaultName: "AK-47",
  // ...
}
```

### 3. **Refactoring Safety**

When types change, TypeScript flags all affected code:
```typescript
// Change LoadoutId from number to string
type LoadoutId = string & { readonly __brand: 'LoadoutId' }

// TypeScript will flag all places that assumed LoadoutId was a number
```

---

## Related Documentation

- [Composables Reference](./reference-composables.md) - Composable APIs using these types
- [Stores Reference](./reference-stores.md) - Pinia stores using these types
- [API Reference](./api/) - API endpoints and their types
- [Components](./components.md) - Component prop types

---

## TypeScript Configuration

The project uses strict TypeScript configuration:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

---

## Contributing

When adding new types:

1. **Choose Appropriate Location**:
   - Core types → `/types/core/`
   - API types → `/types/api/`
   - Database types → `/types/database/`
   - Business logic → `/types/business/`

2. **Add JSDoc Comments**:
   ```typescript
   /**
    * Description of the type
    *
    * @example
    * ```typescript
    * const example: MyType = { ... }
    * ```
    */
   export interface MyType {
     // ...
   }
   ```

3. **Export from index.ts**:
   ```typescript
   export type { MyType } from './path/to/type'
   ```

4. **Update This Documentation**

5. **Write Type Tests** (if applicable):
   ```typescript
   import { expectType } from 'tsd'
   expectType<LoadoutId>(toLoadoutId(1))
   ```
