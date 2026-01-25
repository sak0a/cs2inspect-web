# Composables API Reference

## Overview

CS2Inspect uses Vue 3 composables to encapsulate and reuse stateful logic across components. This document provides comprehensive API reference for all available composables.

## Available Composables

1. [useInspectItem](#useinspectitem) - Inspect link processing and item management
2. [useItemModal](#useitemmodal) - Shared modal state management
3. [useItems (useOtherTeamSkin, useGroupedWeapons)](#useitems) - Item utilities and grouping

---

## useInspectItem

**Location**: `/composables/useInspectItem.ts`

**Purpose**: Handles CS2 inspect link processing, item data fetching, and item state management with localStorage persistence.

### Import

```typescript
import { useInspectItem } from '~/composables/useInspectItem'
```

### Usage

```vue
<script setup>
const {
  inspectedItem,
  itemType,
  customization,
  isLoading,
  error,
  hasItem,
  analyzeInspectLink,
  generateInspectLink,
  clearItem
} = useInspectItem()

// Analyze an inspect URL
await analyzeInspectLink(inspectUrl, steamId)

// Generate an inspect URL
const url = await generateInspectLink(steamId)
</script>
```

### Reactive State

#### `inspectedItem`
```typescript
Ref<IEnhancedItem | null>
```
The currently inspected item with enhanced metadata.

**Properties**:
- `weapon_defindex: number` - Item definition index
- `defaultName: string` - Default item name
- `paintIndex: number` - Paint pattern index
- `defaultImage: string` - Default item image URL
- `weapon_name: string` - Weapon name
- `category: string` - Item category
- `availableTeams: string` - Available teams ('both', 't', 'ct')
- `name: string` - Item name
- `image: string` - Item image URL
- `minFloat: number` - Minimum float value
- `maxFloat: number` - Maximum float value
- `rarity: object` - Rarity information
- `team: number | null` - Team assignment

#### `itemType`
```typescript
Ref<ItemType | null>
```
Type of the inspected item.

**Values**: `'weapon'` | `'knife'` | `'glove'` | `'agent'` | `'musickit'` | `'pin'`

#### `customization`
```typescript
Ref<ItemConfiguration | null>
```
Current item customization configuration.

**Base Properties**:
- `active: boolean` - Whether customization is active
- `team: number` - Team assignment (1=T, 2=CT)
- `defindex: number` - Item definition index
- `paintIndex: number` - Paint pattern index
- `paintIndexOverride: boolean` - Override paint index
- `pattern: number` - Pattern seed (0-1000)
- `wear: number` - Wear value (0.0-1.0)

**Weapon-specific** (extends base):
- `statTrak: boolean` - StatTrak enabled
- `statTrakCount: number` - Kill count
- `nameTag: string` - Custom name tag
- `stickers: Array` - Sticker array (5 slots)
- `keychain: object | null` - Keychain data

**Knife-specific** (extends base):
- `statTrak: boolean`
- `statTrakCount: number`
- `nameTag: string`

**Glove-specific** (base only, no additional properties)

#### `isLoading`
```typescript
Ref<boolean>
```
Loading state for async operations.

#### `error`
```typescript
Ref<string | null>
```
Error message from last operation.

#### `asyncState`
```typescript
ComputedRef<AsyncResult>
```
Comprehensive async state object.

**Properties**:
- `state: LoadingState` - Current state ('idle', 'loading', 'success', 'error')
- `data: IEnhancedItem | null` - Data result
- `error: object | undefined` - Error details
- `isLoading: boolean` - Loading flag
- `isSuccess: boolean` - Success flag
- `isError: boolean` - Error flag

### Computed Properties

#### `hasItem`
```typescript
ComputedRef<boolean>
```
Whether a valid item is currently loaded.

### Methods

#### `analyzeInspectLink(inspectUrl, steamId)`
Analyze a CS2 inspect link and extract item data.

**Parameters**:
- `inspectUrl: string` - CS2 inspect URL
- `steamId: string` - User's Steam ID

**Returns**: `Promise<void>`

**Side Effects**:
- Sets `inspectedItem`, `itemType`, `customization`
- Saves to localStorage
- Sets loading and error states

**Example**:
```typescript
await analyzeInspectLink(
  'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20...',
  '76561198012345678'
)
```

#### `generateInspectLink(steamId)`
Generate an inspect URL from current item customization.

**Parameters**:
- `steamId: string` - User's Steam ID

**Returns**: `Promise<string | null>` - Generated inspect URL or null on error

**Example**:
```typescript
const url = await generateInspectLink('76561198012345678')
console.log(url) // 'steam://rungame/...'
```

#### `saveToStorage()`
Save current item and customization to localStorage.

**Returns**: `void`

**Side Effects**: Updates localStorage with current state

#### `loadFromStorage()`
Load item and customization from localStorage.

**Returns**: `void`

**Side Effects**: Restores state from localStorage

#### `clearItem()`
Clear current item and reset all state.

**Returns**: `void`

**Side Effects**:
- Resets all reactive state
- Clears localStorage
- Resets error state

#### `updateCustomization(newCustomization)`
Update item customization and save to storage.

**Parameters**:
- `newCustomization: ItemConfiguration` - New customization object

**Returns**: `void`

**Example**:
```typescript
updateCustomization({
  ...customization.value,
  wear: 0.25,
  statTrak: true
})
```

#### `updateItem(newItem)`
Update inspected item and save to storage.

**Parameters**:
- `newItem: IEnhancedItem` - New item object

**Returns**: `void`

#### `isItemType(type)`
Check if current item is of specific type.

**Parameters**:
- `type: ItemType` - Type to check against

**Returns**: `boolean`

**Example**:
```typescript
if (isItemType('weapon')) {
  // Handle weapon-specific logic
}
```

### Error Handling

The composable handles errors gracefully:
- Network failures
- Invalid inspect URLs
- API errors
- localStorage failures
- Data validation errors

Errors are stored in the `error` ref and can be displayed to users.

### Storage Keys

```typescript
const STORAGE_KEY_ITEM = 'cs2inspect-item'
const STORAGE_KEY_CUSTOMIZATION = 'cs2inspect-customization'
const STORAGE_KEY_ITEM_TYPE = 'cs2inspect-item-type'
```

---

## useItemModal

**Location**: `/composables/useItemModal.ts`

**Purpose**: Shared composable for item skin modal functionality, reducing code duplication across WeaponSkinModal, GloveSkinModal, and KnifeSkinModal components.

### Import

```typescript
import { useItemModal } from '~/composables/useItemModal'
```

### Usage

```vue
<script setup>
const {
  state,
  apiState,
  filteredSkins,
  paginatedSkins,
  totalPages,
  fetchSkins,
  clearState
} = useItemModal({
  itemType: 'weapon',
  pageSize: 10
})

// Fetch skins for a weapon
await fetchSkins('AK-47')
</script>
```

### Configuration

```typescript
interface UseItemModalOptions {
  itemType: 'weapon' | 'knife' | 'glove'
  pageSize?: number  // Default: 10
}
```

### Reactive State

#### `state`
```typescript
Ref<ItemModalState>
```

**Properties**:
- `isLoadingSkins: boolean` - Skins loading state
- `isImporting: boolean` - Import in progress
- `isLoadingInspect: boolean` - Inspect loading state
- `isResetting: boolean` - Reset in progress
- `isDuplicating: boolean` - Duplication in progress
- `searchQuery: string` - Current search query
- `currentPage: number` - Current pagination page
- `error: string | null` - Error message
- `showImportModal: boolean` - Import modal visibility
- `showResetConfirm: boolean` - Reset confirmation visibility
- `showDuplicateConfirm: boolean` - Duplicate confirmation visibility

#### `apiState`
```typescript
Ref<ItemModalApiState>
```

**Properties**:
- `skins: APIWeaponSkin[]` - Available skins
- `showDetails: boolean` - Details panel visibility

#### `PAGE_SIZE`
```typescript
Ref<number>
```
Number of items per page.

### Computed Properties

#### `filteredSkins`
```typescript
ComputedRef<APIWeaponSkin[]>
```
Skins filtered by search query.

#### `paginatedSkins`
```typescript
ComputedRef<APIWeaponSkin[]>
```
Current page of filtered skins.

#### `totalPages`
```typescript
ComputedRef<number>
```
Total number of pages based on filtered results.

### Methods

#### `fetchSkins(itemName, onError?)`
Fetch available skins for the given item.

**Parameters**:
- `itemName: string` - Item name (e.g., 'AK-47')
- `onError?: (error: string) => void` - Optional error callback

**Returns**: `Promise<void>`

**Example**:
```typescript
await fetchSkins('M4A4', (error) => {
  console.error('Failed to load skins:', error)
})
```

#### `adjustCurrentPage()`
Adjust current page if it exceeds available pages.

**Returns**: `void`

**Side Effects**: May update `state.currentPage`

#### `resetSearchState()`
Reset search query and pagination to defaults.

**Returns**: `void`

**Side Effects**:
- Sets `searchQuery` to empty string
- Sets `currentPage` to 1

#### `clearState()`
Clear all modal state (useful when closing modal).

**Returns**: `void`

**Side Effects**: Resets all state to defaults

### Watchers

The composable automatically watches `searchQuery` and adjusts pagination when search changes.

---

## useItems

**Location**: `/composables/useItems.ts`

**Purpose**: Utility functions for item management and grouping.

### Functions

#### `useOtherTeamSkin<T>(selectedItem, skins)`
Checks if the selected weapon/knife has a skin configured for the other team.

**Parameters**:
- `selectedItem: Ref<T | null> | ComputedRef<T | null>` - Currently selected item
- `skins: Ref<Array<T>> | ComputedRef<Array<T>>` - Array of all skins

**Returns**: `ComputedRef<boolean>`

**Example**:
```typescript
const hasOtherTeamSkin = useOtherTeamSkin(selectedWeapon, allWeapons)

// Use in template
<div v-if="hasOtherTeamSkin">
  This weapon exists on the other team!
</div>
```

#### `oppositeTeam(current)`
Get the opposite team number.

**Parameters**:
- `current: number` - Current team (1=T, 2=CT)

**Returns**: `number` - Opposite team

**Example**:
```typescript
oppositeTeam(1) // Returns 2 (CT)
oppositeTeam(2) // Returns 1 (T)
```

#### `useGroupedWeapons<T>(skins)`
Groups weapons by their default name for organized display.

**Parameters**:
- `skins: Ref<Array<T>> | ComputedRef<Array<T>>` - Array of weapons

**Returns**: `ComputedRef<Record<string, GroupedWeapon>>`

**Return Type**:
```typescript
{
  [weaponName: string]: {
    weapons: Array<T>
    availableTeams: string
    defaultName: string
  }
}
```

**Example**:
```typescript
const groupedWeapons = useGroupedWeapons(weaponsList)

// Result:
// {
//   'AK-47': {
//     weapons: [weapon1, weapon2],
//     availableTeams: 't',
//     defaultName: 'AK-47'
//   },
//   'M4A4': {
//     weapons: [weapon3, weapon4],
//     availableTeams: 'ct',
//     defaultName: 'M4A4'
//   }
// }
```

---

## Best Practices

### 1. **Use Composables for Shared Logic**

```vue
<!-- Good -->
<script setup>
const { hasItem, analyzeInspectLink } = useInspectItem()
</script>

<!-- Avoid duplicating logic in components -->
```

### 2. **Handle Errors Properly**

```vue
<script setup>
const { error, analyzeInspectLink } = useInspectItem()

const handleAnalyze = async (url) => {
  await analyzeInspectLink(url, steamId)

  if (error.value) {
    // Show error to user
    message.error(error.value)
  }
}
</script>
```

### 3. **Clean Up on Unmount**

```vue
<script setup>
const { clearState } = useItemModal({ itemType: 'weapon' })

onUnmounted(() => {
  clearState()
})
</script>
```

### 4. **Use Computed Properties**

```vue
<script setup>
const { filteredSkins, paginatedSkins } = useItemModal({ itemType: 'weapon' })

// Computed properties update automatically
</script>

<template>
  <div v-for="skin in paginatedSkins" :key="skin.id">
    {{ skin.name }}
  </div>
</template>
```

---

## Type Definitions

### ItemType

```typescript
type ItemType = 'weapon' | 'knife' | 'glove' | 'agent' | 'musickit' | 'pin'
```

### LoadingState

```typescript
enum LoadingState {
  Idle = 'idle',
  Loading = 'loading',
  Success = 'success',
  Error = 'error'
}
```

### ItemConfiguration

See [TypeScript Types Documentation](./reference-types.md) for complete type definitions.

---

## Related Documentation

- [Components Guide](./components.md) - Component documentation
- [Type System](./reference-types.md) - TypeScript types
- [Architecture](./architecture-frontend.md) - Frontend architecture
- [Stores](./reference-stores.md) - Pinia store documentation

---

## Contributing

When creating new composables:

1. **Follow Naming Convention**: Use `use` prefix
2. **Export Interfaces**: Export all interfaces and types
3. **Document API**: Include JSDoc comments
4. **Add Examples**: Provide usage examples
5. **Handle Errors**: Implement proper error handling
6. **Write Tests**: Add unit tests for composables
