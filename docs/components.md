# Components

## Overview

This document provides a comprehensive guide to all components in the CS2Inspect application, organized by category and functionality.

## Component Architecture

The application follows a modular component architecture with clear separation of concerns:

- **Modal Components**: Handle item selection and customization
- **Tab Components**: Organize items by category/team
- **Display Components**: Show item previews and information
- **Utility Components**: Provide common functionality (theme, language, etc.)

## Frontend Components

### Modal Components

#### WeaponSkinModal.vue
**Purpose**: Comprehensive weapon skin selection and customization

**Features**:
- Skin selection with search and filtering
- Float value (wear) adjustment with slider
- Pattern seed customization
- StatTrak™ configuration (enabled/disabled, kill count)
- Name tag support
- Sticker application (up to 5 slots)
- Keychain attachment
- Real-time preview
- Save/reset functionality

**Props**:
```typescript
interface WeaponModalProps {
  weapon: WeaponItemData       // Current weapon data
  show: boolean                // Modal visibility
  isCreatingNew?: boolean      // Creating vs editing mode
}
```

**Emits**:
- `update:show` - Modal visibility change
- `save` - Weapon customization saved
- `error` - Error occurred during operation

**Key State**:
- Selected skin (paintIndex)
- Float value (0.0 - 1.0)
- Pattern seed (0 - 1000)
- StatTrak enabled/count
- Name tag
- Sticker slots array
- Keychain data

---

#### KnifeSkinModal.vue
**Purpose**: Knife skin selection and customization

**Features**:
- Knife-specific skin catalog
- Team-based knife selection (T/CT)
- Float value and pattern customization
- StatTrak™ support
- Name tag support
- Doppler phase detection for special patterns
- Save to loadout

**Props**:
```typescript
interface KnifeModalProps {
  weapon: KnifeItemData
  show: boolean
  isCreatingNew?: boolean
}
```

**Special Features**:
- Doppler phase visualization (Phase 1-4, Ruby, Sapphire, Black Pearl)
- Fade percentage calculation
- Gamma Doppler phases

---

#### GloveSkinModal.vue
**Purpose**: Glove skin selection and customization

**Features**:
- Glove model selection
- Glove skin selection
- Team-based configuration
- Float value adjustment
- Pattern seed customization
- Real-time preview

**Props**:
```typescript
interface GloveModalProps {
  weapon: GloveItemData
  show: boolean
  isCreatingNew?: boolean
}
```

**Note**: Gloves don't support StatTrak™ or name tags

---

#### StickerModal.vue
**Purpose**: Sticker selection and application

**Features**:
- Browse sticker catalog
- Search by name
- Filter by category/tournament
- Sticker wear selection (pristine, scratched, heavily scratched)
- Rotation and positioning
- Apply to specific weapon slot

**Props**:
```typescript
interface StickerModalProps {
  show: boolean
  weaponSlots: number          // Available sticker slots
  currentStickers: Sticker[]   // Already applied stickers
}
```

**Emits**:
- `update:show`
- `apply` - Sticker applied to slot

---

#### KeychainModal.vue
**Purpose**: Keychain selection and attachment

**Features**:
- Keychain catalog browsing
- Search functionality
- Pattern seed selection
- Attach to weapons (CS2 feature)

**Props**:
```typescript
interface KeychainModalProps {
  show: boolean
  currentKeychain?: Keychain
}
```

---

#### VisualCustomizerModal.vue
**Purpose**: Advanced visual customization with canvas-based editing

**Features**:
- Canvas-based sticker positioning
- Drag-and-drop sticker placement
- Rotation and scaling controls
- Multi-layer sticker management
- Real-time preview
- Undo/redo functionality
- Export customization

**Technical Details**:
- Uses HTML5 Canvas API
- Touch/mouse event handling
- Image loading and caching
- Transform matrix calculations
- Hit detection for selection

**Props**:
```typescript
interface VisualCustomizerProps {
  show: boolean
  weapon: WeaponItemData
  stickers: Sticker[]
}
```

---

#### InspectURLModal.vue
**Purpose**: Import items from CS2 inspect URLs

**Features**:
- Paste inspect URL from game/market
- Parse masked and unmasked URLs
- Validate URL format
- Extract item data
- Create item from URL

**Supported URL Formats**:
```
steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20{data}
csgo_econ_action_preview {data}
+csgo_econ_action_preview {data}
{hex_data}
S{steamid}A{assetid}D{classid}
```

---

#### DuplicateItemModal.vue
**Purpose**: Confirm duplication of existing items

**Features**:
- Display current item details
- Confirm duplicate action
- Cancel operation

---

#### ResetModal.vue
**Purpose**: Confirm reset of item customization

**Features**:
- Warning message
- Confirm reset action
- Cancel protection

---

### Tab Components

#### WeaponTabs.vue
**Purpose**: Organize weapons by category

**Categories**:
- Pistols (Glock-18, USP-S, P2000, etc.)
- SMGs (MP9, MP7, UMP-45, etc.)
- Rifles (AK-47, M4A4, M4A1-S, etc.)
- Heavy (Nova, XM1014, MAG-7, etc.)

**Features**:
- Team-based filtering (T/CT/Both)
- Category tabs
- Weapon grid display
- Click to select weapon

**Props**:
```typescript
interface WeaponTabsProps {
  modelValue: number           // Selected weapon defindex
  team?: 'T' | 'CT' | 'all'   // Team filter
}
```

---

#### KnifeTabs.vue
**Purpose**: Display available knives by team

**Features**:
- T-side knives tab
- CT-side knives tab
- Knife grid with icons
- Team-specific defaults

**Knives**:
- Bayonet, M9 Bayonet, Karambit
- Butterfly, Huntsman, Falchion
- Bowie, Shadow Daggers, Navaja
- Stiletto, Ursus, Talon
- Classic Knife, Paracord, Survival
- Nomad, Skeleton, Kukri

---

#### GloveTabs.vue
**Purpose**: Display available gloves by team

**Features**:
- T-side gloves tab
- CT-side gloves tab
- Glove model grid

**Glove Types**:
- Bloodhound Gloves
- Driver Gloves
- Hand Wraps
- Moto Gloves
- Specialist Gloves
- Sport Gloves
- Hydra Gloves
- Broken Fang Gloves

---

#### AgentTabs.vue
**Purpose**: Agent selection by team

**Features**:
- Terrorist agents
- Counter-Terrorist agents
- Agent preview cards
- Faction grouping

---

#### MusicKitTabs.vue
**Purpose**: Music kit selection

**Features**:
- Browse all music kits
- Preview audio (if available)
- Select active music kit
- Artist and track information

---

#### PinTabs.vue
**Purpose**: Pin collection management

**Features**:
- Display owned pins
- Pin categories
- Add/remove pins
- Pin showcase

---

### Display Components

#### InspectItemDisplay.vue
**Purpose**: Universal item preview display

**Features**:
- Item name and type
- Skin name and wear
- Float value display
- StatTrak™ counter
- Sticker preview (with slots)
- Keychain display
- Name tag display
- Pattern/fade information
- Team indicator

**Props**:
```typescript
interface InspectItemDisplayProps {
  item: ItemData
  showDetails?: boolean
  compact?: boolean
}
```

---

#### LoadoutSelector.vue
**Purpose**: Manage multiple loadouts

**Features**:
- Create new loadouts
- Switch between loadouts
- Rename loadouts
- Delete loadouts
- Loadout preview

**Props**:
```typescript
interface LoadoutSelectorProps {
  loadouts: Loadout[]
  activeLoadout: number
}
```

**Emits**:
- `select` - Loadout selected
- `create` - New loadout created
- `delete` - Loadout deleted
- `rename` - Loadout renamed

---

### Utility Components

#### ThemeProvider.vue
**Purpose**: Global theme configuration

**Features**:
- Dark/light theme support
- Naive UI theme customization
- CSS variable configuration
- Theme persistence

**Configuration**:
```typescript
// Primary colors (yellow accent by default)
primaryColor: '#FACC15'
primaryColorHover: '#F59E0B'
primaryColorPressed: '#CA8A04'

// Dark modal theme
colorModal: '#101010'
borderRadius: '20px'
```

---

#### LanguageSwitcher.vue
**Purpose**: Multi-language support

**Supported Languages**:
- English (en-US)
- German (de-DE)
- Russian (ru-RU)

**Features**:
- Dropdown language selector
- Persistent language preference
- Automatic page translation

---

#### SitePreloader.vue
**Purpose**: Initial loading screen

**Features**:
- Loading animation
- Progress indication
- Smooth fade-in transition

---

#### SkinPageLayout.vue
**Purpose**: Consistent page layout for skin pages

**Features**:
- Header with navigation
- Content area
- Footer
- Responsive design

---

### Shared UI Patterns

#### Selection States
All item selection components use consistent visual feedback:
```css
/* Selected item */
.ring-2.ring-[var(--selection-ring)]

/* Hover state */
.hover:ring-1.hover:ring-[var(--selection-ring)]

/* Active indicator */
.border-b-2.border-[var(--tab-indicator)]
```

#### Modal Pattern
Standard modal structure:
```vue
<NModal
  v-model:show="showModal"
  :theme-overrides="skinModalThemeOverrides"
  preset="card"
  :style="{ width: '90%', maxWidth: '1200px' }"
>
  <!-- Modal content -->
</NModal>
```

## Backend Components

### API Handlers

#### Authentication Handler
**File**: `server/api/auth/validate.ts`

**Purpose**: Validate JWT tokens

**Endpoint**: `POST /api/auth/validate`

**Response**:
```typescript
interface AuthResponse {
  valid: boolean
  user?: UserProfile
  error?: string
}
```

---

#### Data Handlers
**Directory**: `server/api/data/`

**Purpose**: Serve game data (skins, agents, stickers, etc.)

**Endpoints**:
- `GET /api/data/skins` - All weapon/knife skins
- `GET /api/data/agents` - All agents
- `GET /api/data/stickers` - All stickers
- `GET /api/data/keychains` - All keychains
- `GET /api/data/musickits` - All music kits
- `GET /api/data/collectibles` - Pins and other collectibles

**Caching**: Static data cached in-memory

---

#### Item Management Handlers

**Weapons**: `server/api/weapons/`
- `GET /api/weapons/[type]` - Get weapons by type
- `POST /api/weapons/save` - Save weapon customization

**Knives**: `server/api/knifes/`
- `GET /api/knifes` - Get knives for loadout
- `POST /api/knifes/save` - Save knife customization

**Gloves**: `server/api/gloves/`
- `GET /api/gloves` - Get gloves for loadout
- `POST /api/gloves/save` - Save glove customization

---

#### Loadout Handlers
**Directory**: `server/api/loadouts/`

**Endpoints**:
- `GET /api/loadouts` - Get all loadouts for user
- `POST /api/loadouts` - Create new loadout
- `POST /api/loadouts/select` - Switch active loadout
- `DELETE /api/loadouts/[id]` - Delete loadout

---

### Server Utilities

#### CS2 Inspect System
**Directory**: `server/utils/csinspect/`

**Components**:
- `base.ts` - URL parsing and validation
- `steamClient.ts` - Steam connection management
- `protobuf-decoder.ts` - Decode inspect URLs
- `protobuf-writer.ts` - Generate inspect URLs
- `crc32.ts` - Checksum validation

See [CS2 Inspect System Documentation](../CS2_INSPECT_SYSTEM_README.md) for details.

---

#### Database Utilities
**Directory**: `server/database/`

**Purpose**: Database connection and query helpers

**Features**:
- Connection pooling
- Query builders
- Transaction support
- Error handling

---

#### Theme Customization
**File**: `server/utils/themeCustomization.ts`

**Purpose**: Export theme overrides for components

**Usage**:
```typescript
import { skinModalThemeOverrides } from '~/server/utils/themeCustomization'
```

---

## Composables (Hooks)

### useInspectItem.ts
**Purpose**: Handle CS2 inspect link processing

**Features**:
- Parse inspect URLs
- Fetch item data from Steam
- Cache items in localStorage
- Generate inspect links
- Update item customization

**API**:
```typescript
interface UseInspectItem {
  inspectedItem: Ref<ItemData | null>
  itemType: Ref<string | null>
  customization: Ref<ItemConfiguration | null>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  
  analyzeInspectLink: (url: string) => Promise<void>
  loadFromStorage: () => void
  clearItem: () => void
  updateCustomization: (config: Partial<ItemConfiguration>) => void
  updateItem: (item: ItemData) => void
  generateInspectLink: () => Promise<string>
  hasItem: ComputedRef<boolean>
}
```

---

### useItems.ts
**Purpose**: Fetch and cache game data

**Features**:
- Load skins, agents, stickers
- Cache responses
- Error handling
- Loading states

**API**:
```typescript
interface UseItems {
  items: Ref<ItemCatalog>
  loading: Ref<boolean>
  error: Ref<string | null>
  
  loadSkins: () => Promise<void>
  loadAgents: () => Promise<void>
  loadStickers: () => Promise<void>
}
```

---

## Component Communication Patterns

### Parent-Child Communication
```vue
<!-- Parent -->
<WeaponSkinModal
  :weapon="currentWeapon"
  :show="showModal"
  @save="handleSave"
  @update:show="showModal = $event"
/>

<!-- Child emits -->
emit('save', customizedWeapon)
emit('update:show', false)
```

### Store-Based State
```typescript
// Component
const loadoutStore = useLoadoutStore()
const weapons = computed(() => loadoutStore.weapons)

// Store action
await loadoutStore.saveWeapon(weaponData)
```

### Composable Hooks
```typescript
// Component
const { inspectedItem, analyzeInspectLink } = useInspectItem()

// Use composable
await analyzeInspectLink(inspectUrl)
```

## Testing Components

See test files for examples:
- Component unit tests: `components/*.spec.ts`
- Integration tests: `tests/integration/*.spec.ts`
- E2E tests: `tests/e2e/*.spec.ts`

## Related Documentation

- [Architecture](architecture.md) - System architecture overview
- [API Reference](api.md) - Backend API documentation
- [Theme Customization](README.md) - Theme and styling guide
- [Type System](../types/README.md) - TypeScript interfaces
