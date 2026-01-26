# CS2Inspect Type System v2.0

This directory contains the refactored and organized TypeScript interfaces for the CS2Inspect web application. The new type system provides better organization, consistency, and maintainability.

## 🏗️ Architecture Overview

The type system is organized into logical categories with clear separation of concerns:

```
types/
├── core/           # Fundamental types and utilities
├── api/            # External API interfaces
├── database/       # Database record and query interfaces
├── business/       # Business logic and domain models
├── components/     # Component-specific interfaces
├── index.ts        # Main export file
└── README.md       # This documentation
```

## 📁 Directory Structure

### `core/common.ts`
Fundamental types used throughout the application:
- Utility types (`EntityId`, `Timestamp`, `Optional`, etc.)
- Team and side definitions (`TeamSide`, `TeamAvailability`)
- Error handling interfaces (`ErrorInfo`, `ValidationError`)
- Pagination and filtering (`PaginationOptions`, `FilterOptions`)
- Loading states and async operations

### `api/`
External API interfaces and response structures:
- **`responses.ts`**: Standardized API response formats
- **`items.ts`**: CS2 item interfaces from external APIs
- **`index.ts`**: Consolidated API exports

### `database/`
Database-related interfaces:
- **`records.ts`**: Database table record interfaces
- **`queries.ts`**: Query parameters and operations
- **`index.ts`**: Consolidated database exports

### `business/`
Business logic and domain model interfaces:
- **`items.ts`**: Item customization and configuration
- **`loadouts.ts`**: Loadout management (future)
- **`users.ts`**: User-related business logic (future)

### `components/`
Component-specific interfaces:
- **`modals.ts`**: Modal component props, state, and events
- **`forms.ts`**: Form component interfaces (future)
- **`displays.ts`**: Display component interfaces (future)

## 🎯 Key Improvements

### 1. **Consistent Naming Conventions**
- **API Interfaces**: `API` + EntityName + [Type] (e.g., `APIWeaponSkin`)
- **Database Interfaces**: `DB` + EntityName (e.g., `DBWeapon`)
- **Component Interfaces**: ComponentName + [Purpose] (e.g., `WeaponModalProps`)
- **Business Logic**: EntityName + [Purpose] (e.g., `WeaponConfiguration`)

### 2. **Clear Interface Hierarchy**
```typescript
// Base interfaces provide common structure
interface BaseItemConfiguration { ... }

// Specific interfaces extend base with additional properties
interface WeaponConfiguration extends BaseItemConfiguration {
  statTrak: boolean
  stickers: StickerConfiguration[]
  // ...
}
```

### 3. **Comprehensive Documentation**
Every interface includes:
- JSDoc comments explaining purpose and usage
- `@example` blocks showing practical usage
- `@description` explaining the interface's role
- `@since` and `@version` for tracking changes

### 4. **Type Safety Improvements**
- Discriminated unions for better type inference
- Type guards for runtime type checking
- Generic interfaces for reusable patterns
- Utility types for common operations
- **Branded types for compile-time ID and value safety**

## 🏷️ Branded Types

Branded types provide compile-time safety for primitive values, preventing common mistakes like mixing up different ID types or using invalid values.

### Available Branded Types

#### Entity Identifiers
| Type | Base | Purpose |
|------|------|---------|
| `LoadoutId` | `number` | Loadout identifiers |
| `SteamId` | `string` | Steam 64-bit identifiers (17-digit) |
| `Defindex` | `number` | Weapon/item definition index |
| `PaintIndex` | `number` | Paint/skin index |
| `PaintSeed` | `number` | Pattern seed (0-999) |
| `StickerId` | `number` | Sticker identifiers |
| `KeychainId` | `number` | Keychain/charm identifiers |
| `MusicKitDefindex` | `number` | Music kit identifiers |
| `PinDefindex` | `number` | Pin/collectible identifiers |

#### Value Types (Tier 1 - Critical Safety)
| Type | Base | Purpose | Range |
|------|------|---------|-------|
| `InspectUrl` | `string` | Steam inspect protocol URLs | `steam://rungame/730/...` |
| `HexData` | `string` | Hex-encoded item data | Valid hex characters |
| `FloatValue` | `number` | Item wear/float values | 0.0 - 1.0 |
| `StickerSlotIndex` | `number` | Sticker slot positions | 0 - 4 |
| `TeamId` | `1 \| 2` | Team identifiers | 1 (T) or 2 (CT) |

#### Value Types (Tier 2 - Domain Safety)
| Type | Base | Purpose | Constraint |
|------|------|---------|------------|
| `StatTrakCount` | `number` | StatTrak kill count | >= 0 |
| `NameTag` | `string` | Custom weapon name tags | max 32 chars |
| `ISOTimestamp` | `string` | ISO 8601 timestamps | Valid ISO format |

#### Value Types (Tier 3 - Visual/UX)
| Type | Base | Purpose | Range |
|------|------|---------|-------|
| `HexColor` | `string` | CSS hex color codes | #RRGGBB or #RRGGBBAA |
| `NormalizedCoordinate` | `number` | Normalized canvas positions | 0.0 - 1.0 |
| `Percentage` | `number` | Percentage values | 0 - 100 |
| `RarityId` | `string` | Item rarity identifiers | - |

### Usage Examples

```typescript
import { 
  toFloatValue, 
  toFloatValueClamped,
  toStickerSlotIndex,
  toTeamId,
  isValidFloatValue,
  isValidInspectUrl,
  floatValueToCondition
} from '~/types'

// Converting values with validation (throws on invalid)
const wear = toFloatValue(0.15)  // ✅ Returns FloatValue
const slot = toStickerSlotIndex(2)  // ✅ Returns StickerSlotIndex

// toFloatValue(1.5)  // ❌ Throws error - out of range
// toStickerSlotIndex(5)  // ❌ Throws error - invalid slot

// Converting with clamping (never throws)
const clampedWear = toFloatValueClamped(1.5)  // Returns 1.0 as FloatValue

// Type guards for validation
if (isValidFloatValue(userInput)) {
  // userInput is now typed as FloatValue
  console.log(floatValueToCondition(userInput))  // "Factory New", etc.
}

if (isValidInspectUrl(url)) {
  // url is now typed as InspectUrl
  processInspectUrl(url)
}

// Utility functions
const wear: FloatValue = toFloatValue(0.05)
console.log(floatValueToCondition(wear))  // "Factory New"
console.log(floatValueToConditionAbbr(wear))  // "FN"

const team: TeamId = toTeamId(1)
console.log(teamIdToName(team))  // "Terrorist"
console.log(teamIdToAbbr(team))  // "T"
```

### Why Branded Types?

```typescript
// WITHOUT branded types - easy to mix up IDs!
function loadWeapon(defindex: number, paintIndex: number) {
  // Oops! Parameters in wrong order - no compile error!
}
loadWeapon(paintIndex, defindex)  // Bug not caught!

// WITH branded types - compile-time safety
function loadWeaponSafe(defindex: Defindex, paintIndex: PaintIndex) {
  // Parameters have distinct types
}
loadWeaponSafe(paintIndex, defindex)  // ❌ Compile error!
loadWeaponSafe(toDefindex(7), toPaintIndex(12))  // ✅ Correct
```

## 🚀 Usage Examples

### Basic Import Patterns
```typescript
// Import specific types
import type { WeaponConfiguration, APIWeaponSkin, DBWeapon } from '~/types'

// Import category-specific types
import type * as API from '~/types/api'
import type * as DB from '~/types/database'

// Import everything (not recommended for large applications)
import type * as Types from '~/types'
```

### Working with Item Types
```typescript
import type { 
  WeaponItemData, 
  WeaponConfiguration, 
  isWeaponItemData 
} from '~/types'

// Type-safe item handling
function handleItem(item: ItemData) {
  if (isWeaponItemData(item)) {
    // TypeScript knows this is WeaponItemData
    console.log(item.category) // ✅ Available
    console.log(item.stickers) // ❌ Not available on ItemData
  }
}

// Configuration with full type safety
const weaponConfig: WeaponConfiguration = {
  active: true,
  team: TeamSide.Terrorist,
  defindex: 7,
  paintIndex: 12,
  paintIndexOverride: false,
  pattern: 123,
  wear: 0.15,
  statTrak: true,
  statTrakCount: 1337,
  nameTag: "My AK-47",
  stickers: [null, null, null, null, null],
  keychain: null
}
```

### Modal Component Usage
```typescript
import type { 
  WeaponModalProps, 
  WeaponModalEvents, 
  WeaponModalState 
} from '~/types'

// Component definition with proper typing
const WeaponModal = defineComponent<WeaponModalProps, WeaponModalEvents>({
  props: {
    visible: { type: Boolean, required: true },
    weapon: { type: Object as PropType<WeaponItemData | null>, default: null },
    user: { type: Object as PropType<UserProfile | null>, default: null },
    otherTeamHasSkin: { type: Boolean, default: false }
  },
  
  emits: ['update:visible', 'save', 'duplicate', 'error'],
  
  setup(props, { emit }) {
    const state = ref<WeaponModalState>({
      isLoadingSkins: false,
      searchQuery: '',
      currentPage: 1,
      error: null,
      showImportModal: false,
      showDuplicateConfirm: false,
      showResetConfirm: false,
      showStickerModal: false,
      showKeychainModal: false,
      currentStickerPosition: 0,
      isImporting: false,
      isLoadingInspect: false,
      isResetting: false,
      isDuplicating: false
    })
    
    // ... component logic
  }
})
```

### Database Operations
```typescript
import type { 
  DBWeapon, 
  DBWeaponQuery, 
  DBCreateQuery 
} from '~/types'

// Type-safe database queries
async function getWeapons(query: DBWeaponQuery): Promise<DBWeapon[]> {
  // Implementation with full type safety
}

async function createWeapon(data: DBCreateQuery<DBWeapon>): Promise<DBWeapon> {
  // Implementation with full type safety
}
```

## 🔄 Migration Guide

### From Legacy Types
The new type system maintains backward compatibility through type aliases:

```typescript
// Legacy (still works)
import type { IEnhancedWeapon, APISkin } from '~/server/utils/interfaces'

// New (recommended)
import type { WeaponItemData, APIWeaponSkin } from '~/types'

// Migration mapping
type IEnhancedWeapon = WeaponItemData  // ✅ Compatible
type APISkin = APIWeaponSkin           // ✅ Compatible
```

### Gradual Migration Strategy
1. **New components**: Use new type system from the start
2. **Existing components**: Migrate one at a time during maintenance
3. **Shared utilities**: Update to use new types when touched
4. **Legacy cleanup**: Remove old interfaces after full migration

## 🧪 Type Testing

The type system includes utilities for runtime type checking:

```typescript
import { 
  isWeaponItemData, 
  isItemOfType, 
  isConfigurationOfType 
} from '~/types'

// Runtime type checking
if (isWeaponItemData(item)) {
  // Safe to access weapon-specific properties
}

// Generic type checking
if (isItemOfType(item, 'weapon')) {
  // TypeScript infers correct type
}

// Configuration validation
if (isConfigurationOfType(config, 'weapon')) {
  // Safe to access weapon configuration properties
}
```

## 📊 Benefits

### For Developers
- **Better IntelliSense**: More accurate autocomplete and error detection
- **Clearer Intent**: Interface names clearly indicate their purpose
- **Easier Refactoring**: Changes propagate correctly through the type system
- **Self-Documenting**: Comprehensive JSDoc comments explain usage

### For the Application
- **Fewer Runtime Errors**: Catch type mismatches at compile time
- **Better Performance**: TypeScript optimizations from better type information
- **Easier Maintenance**: Clear structure makes code easier to understand and modify
- **Future-Proof**: Extensible architecture for new features

## 🔮 Future Enhancements

### Planned Additions
- **Validation Schemas**: Runtime validation using the type definitions
- **API Client Generation**: Auto-generate API clients from response types
- **Database Migrations**: Type-safe database schema evolution
- **Component Generation**: Auto-generate component boilerplate from types

### Extension Points
- **Custom Item Types**: Easy addition of new item categories
- **Plugin System**: Type-safe plugin interfaces
- **Theme System**: Typed theme and styling interfaces
- **Internationalization**: Typed translation interfaces

## 📝 Contributing

When adding new types:

1. **Follow naming conventions** outlined in this document
2. **Add comprehensive JSDoc comments** with examples
3. **Include type guards** for runtime checking when appropriate
4. **Update this README** with new patterns or significant changes
5. **Add tests** for complex type utilities

## 🆘 Troubleshooting

### Common Issues

**Type not found**: Ensure you're importing from the correct module
```typescript
// ❌ Wrong
import type { WeaponConfiguration } from '~/types/business/items'

// ✅ Correct
import type { WeaponConfiguration } from '~/types'
```

**Circular dependencies**: Use type-only imports when possible
```typescript
// ❌ Can cause circular dependencies
import { SomeClass } from './other-module'

// ✅ Type-only import
import type { SomeInterface } from './other-module'
```

**Legacy compatibility**: Use the provided type aliases during migration
```typescript
// ✅ Temporary compatibility
type IEnhancedWeapon = WeaponItemData
```
