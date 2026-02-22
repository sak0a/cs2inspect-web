# Composables API Reference

## Overview

CS2Inspect uses Vue 3 composables to encapsulate and reuse stateful logic across components. This document provides comprehensive API reference for all available composables.

## Available Composables

1. [useInspectItem](#useinspectitem) - Inspect link processing and item management
2. [useItemModal](#useitemmodal) - Shared modal state management
3. [useItems (useOtherTeamSkin, useGroupedWeapons)](#useitems) - Item utilities and grouping
4. [useFilterSort](#usefiltersort) - Filter, sort, and pagination for item modals
5. [useSidebarMode](#usesidebarmode) - Sidebar layout and collapse state
6. [useTeamBadge](#useteambadge) - Team label and badge styling
7. [useAutoSave](#useautosave) - Automatic saving with debouncing
8. [useChangeTracker](#usechangetracker) - Change detection between configurations
9. [useAdminAuth](#useadminauth) - Admin authentication and authorization
10. [useAdminStats](#useadminstats) - Admin statistics with caching
11. [useTutorial](#usetutorial) - Interactive tutorial system controls

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

## useFilterSort

**Location**: `/composables/useFilterSort.ts`

**Purpose**: Shared filter, sort, and pagination logic for item-selection modals (Sticker, Keychain, WrappedSticker modals).

### Import

```typescript
import { useFilterSort } from '~/composables/useFilterSort'
```

### Usage

```vue
<script setup>
const {
  sortBy, sortDir, rarityFilterIds, effectFilterIds,
  availableRarities, availableEffects,
  filteredItems, sortedItems, paginatedItems, totalPages,
  toggleSortDir, toggleRarityFilter, toggleEffectFilter, resetFilters
} = useFilterSort({
  items: allStickers,
  searchQuery: searchRef,
  currentPage: pageRef,
  pageSize: 20,
  sortKeys: ['name', 'rarity'],
  hasEffects: false
})
</script>
```

### Options

```typescript
interface UseFilterSortOptions<T> {
  items: Ref<T[]> | ComputedRef<T[]>              // All items
  searchQuery: Ref<string> | ComputedRef<string>   // Search query
  currentPage: Ref<number> | WritableComputedRef<number>  // Current page (mutated on filter changes)
  pageSize: number                                  // Items per page
  sortKeys: string[]                                // Available sort keys (e.g., 'name', 'rarity')
  hasEffects?: boolean                              // Enable effect filtering
}
```

### Returns

| Value | Type | Description |
|-------|------|-------------|
| `sortBy` | `Ref<string>` | Current sort key |
| `sortDir` | `Ref<'asc' \| 'desc'>` | Sort direction |
| `rarityFilterIds` | `Ref<Set<string>>` | Active rarity filters |
| `effectFilterIds` | `Ref<Set<string>>` | Active effect filters |
| `availableRarities` | `ComputedRef` | Rarities present in items |
| `availableEffects` | `ComputedRef` | Effects present in items |
| `filteredItems` | `ComputedRef<T[]>` | Items after search + rarity/effect filters |
| `sortedItems` | `ComputedRef<T[]>` | Filtered items after sorting |
| `paginatedItems` | `ComputedRef<T[]>` | Current page slice |
| `totalPages` | `ComputedRef<number>` | Total page count |
| `toggleSortDir()` | Method | Toggle asc/desc |
| `toggleRarityFilter(id)` | Method | Toggle a rarity filter on/off |
| `toggleEffectFilter(id)` | Method | Toggle an effect filter on/off |
| `resetFilters()` | Method | Clear all filters |

---

## useSidebarMode

**Location**: `/composables/useSidebarMode.ts`

**Purpose**: Manages sidebar collapse/expand state and layout mode with persistent cookies and hover expansion. SSR-safe.

### Import

```typescript
import { useSidebarMode } from '~/composables/useSidebarMode'
```

### Usage

```vue
<script setup>
const {
  sidebarCollapsed,
  sidebarMode,
  hoverExpanded,
  isReady,
  isEffectivelyExpanded,
  toggleCollapsed,
  toggleMode,
  onMouseEnter,
  onMouseLeave
} = useSidebarMode()
</script>
```

### Returns

| Value | Type | Description |
|-------|------|-------------|
| `sidebarCollapsed` | `Ref<boolean>` | Whether sidebar is collapsed |
| `sidebarMode` | `Ref<'left' \| 'top'>` | Sidebar layout mode |
| `hoverExpanded` | `Ref<boolean>` | Temporarily expanded on hover |
| `isReady` | `Ref<boolean>` | Initial render complete (suppresses transitions) |
| `isEffectivelyExpanded` | `ComputedRef<boolean>` | True if not collapsed OR hover-expanded |
| `toggleCollapsed()` | Method | Toggle collapse state |
| `toggleMode()` | Method | Toggle between left/top mode |
| `onMouseEnter()` | Method | Expand on hover (when collapsed) |
| `onMouseLeave()` | Method | Collapse after hover ends |

State is persisted to cookies for SSR compatibility. Migrates from legacy localStorage automatically.

---

## useTeamBadge

**Location**: `/composables/useTeamBadge.ts`

**Purpose**: Returns reactive team label text and badge CSS classes based on team number.

### Import

```typescript
import { useTeamBadge } from '~/composables/useTeamBadge'
```

### Usage

```vue
<script setup>
const { teamLabel, teamBadgeClasses } = useTeamBadge(teamRef)
</script>

<template>
  <span :class="teamBadgeClasses">{{ teamLabel }}</span>
</template>
```

### Parameters

- `team: Ref<number | undefined> | (() => number | undefined)` — Team value (1=Terrorist, 2=Counter-Terrorist)

### Returns

| Value | Type | Description |
|-------|------|-------------|
| `teamLabel` | `ComputedRef<string \| null>` | Localized team name (i18n), or null |
| `teamBadgeClasses` | `ComputedRef<string>` | Tailwind CSS classes (orange for T, blue for CT) |

---

## useAutoSave

**Location**: `/composables/useAutoSave.ts`

**Purpose**: Automatic saving with debouncing, retry logic, status tracking, and offline handling.

### Import

```typescript
import { useAutoSave, useWatchAutoSave } from '~/composables/useAutoSave'
```

### Usage

```vue
<script setup>
const { status, isDirty, isSaving, triggerSave, saveNow, retry } = useAutoSave(
  async (data) => {
    await api.post('/api/items/weapons/save', data)
  },
  { debounceMs: 1500, retryAttempts: 3 }
)

// Trigger debounced save
triggerSave(weaponConfig)

// Or use the watch wrapper
useWatchAutoSave(
  () => weaponConfig.value,
  async (data) => { await api.post('/api/items/weapons/save', data) }
)
</script>
```

### Options

```typescript
interface AutoSaveOptions {
  debounceMs?: number        // Default: 1500
  retryAttempts?: number     // Default: 3
  retryDelayMs?: number      // Default: 1000
  savedDisplayMs?: number    // How long to show "saved" status (default: 2000)
  onSaveStart?: () => void
  onSaveSuccess?: () => void
  onSaveError?: (error: Error) => void
}
```

### Returns

| Value | Type | Description |
|-------|------|-------------|
| `status` | `Ref<'idle' \| 'saving' \| 'saved' \| 'error'>` | Current save status |
| `isDirty` | `Ref<boolean>` | Unsaved changes exist |
| `isSaving` | `ComputedRef<boolean>` | Currently saving |
| `hasPending` | `ComputedRef<boolean>` | Pending save operation |
| `errorMessage` | `Ref<string \| null>` | Last error message |
| `triggerSave(data)` | Method | Debounced save |
| `saveNow(data)` | Method | Immediate save (returns Promise) |
| `flushPending()` | Method | Execute pending save immediately |
| `cancelPending()` | Method | Cancel pending operation |
| `retry()` | Method | Retry failed save |
| `markAsSaved()` | Method | Mark as saved (external save) |
| `resetStatus()` | Method | Reset to idle |

---

## useChangeTracker

**Location**: `/composables/useChangeTracker.ts`

**Purpose**: Detects and describes changes between item configuration states for the version history feature.

### Import

```typescript
import { useChangeTracker } from '~/composables/useChangeTracker'
```

### Usage

```typescript
const { detectChanges, getPrimaryChangeType, getCombinedDescription, configToSnapshot } = useChangeTracker()

const changes = detectChanges(oldConfig, newConfig)
const type = getPrimaryChangeType(changes)        // e.g., 'paint_changed'
const desc = getCombinedDescription(changes)       // e.g., 'Asiimov -> Dragon Lore'
const snapshot = configToSnapshot(currentConfig)   // For history storage
```

### Returns

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `detectChanges` | `(old, new)` | `DetectedChange[]` | Detect all changes between two configurations |
| `getPrimaryChangeType` | `(changes)` | `ChangeType` | Get the primary change type (or `multiple_changes`) |
| `getCombinedDescription` | `(changes)` | `string` | Human-readable change summary |
| `configToSnapshot` | `(config)` | `ItemHistorySnapshot` | Convert config to snapshot format for storage |

### Change Types

`initial_save`, `paint_changed`, `wear_changed`, `pattern_changed`, `active_toggled`, `stattrak_toggled`, `stattrak_count_changed`, `nametag_changed`, `sticker_added`, `sticker_removed`, `sticker_modified`, `keychain_added`, `keychain_removed`, `keychain_modified`, `multiple_changes`

Functions are also exported standalone for server-side use.

---

## useAdminAuth

**Location**: `/composables/useAdminAuth.ts`

**Purpose**: Admin authentication and authorization with role-based access control.

### Import

```typescript
import { useAdminAuth, adminNavigationGuard, superAdminNavigationGuard } from '~/composables/useAdminAuth'
```

### Usage

```vue
<script setup>
const { isAdmin, isSuperAdmin, adminRole, isChecking, checkAdminStatus, requireAdmin, hasPermission } = useAdminAuth()

await checkAdminStatus()

if (isSuperAdmin.value) {
  // Show admin management UI
}
</script>
```

### Returns

| Value | Type | Description |
|-------|------|-------------|
| `isAdmin` | `ComputedRef<boolean>` | User is an admin |
| `isSuperAdmin` | `ComputedRef<boolean>` | User is a superadmin |
| `adminRole` | `ComputedRef<'admin' \| 'superadmin' \| null>` | Current role |
| `isChecking` | `ComputedRef<boolean>` | Status check in progress |
| `checkAdminStatus()` | Method | Verify admin status from server |
| `requireAdmin()` | Method | Throws if not admin |
| `requireSuperAdmin()` | Method | Throws if not superadmin |
| `hasPermission(perm)` | Method | Check specific permission string |

### Route Guards

```typescript
// Use in page middleware
definePageMeta({
  middleware: [adminNavigationGuard]
})

// Or for superadmin-only pages
definePageMeta({
  middleware: [superAdminNavigationGuard]
})
```

---

## useAdminStats

**Location**: `/composables/useAdminStats.ts`

**Purpose**: Fetch and cache admin dashboard statistics with auto-refresh capability.

### Import

```typescript
import { useAdminStats, formatNumber, getTimeRangeLabel } from '~/composables/useAdminStats'
```

### Usage

```vue
<script setup>
const {
  overviewStats, activityData, topUsers,
  timeRange, isLoading, error,
  fetchStats, fetchActivity, fetchTopUsers, refreshAll, setTimeRange
} = useAdminStats({
  fetchOnMount: true,
  defaultTimeRange: '30d'
})
</script>
```

### Options

```typescript
interface UseAdminStatsOptions {
  fetchOnMount?: boolean          // Fetch on composable creation (default: true)
  autoRefreshInterval?: number    // ms, 0 = disabled (default: 0)
  defaultTimeRange?: '7d' | '30d' | '90d'  // Default: '30d'
}
```

### Returns

| Value | Type | Description |
|-------|------|-------------|
| `overviewStats` | `ComputedRef<AdminOverviewStats \| null>` | Dashboard metrics |
| `activityData` | `ComputedRef<AdminActivityData \| null>` | Chart data |
| `topUsers` | `ComputedRef<AdminTopUser[]>` | Leaderboard data |
| `timeRange` | `Ref<'7d' \| '30d' \| '90d'>` | Current time range |
| `isLoadingStats` | `ComputedRef<boolean>` | Stats loading |
| `isLoadingActivity` | `ComputedRef<boolean>` | Activity loading |
| `isLoading` | `ComputedRef<boolean>` | Any loading |
| `error` | `ComputedRef<string \| null>` | Error message |
| `fetchStats(force?)` | Method | Fetch overview stats |
| `fetchActivity(range?, force?)` | Method | Fetch activity data |
| `fetchTopUsers(limit?)` | Method | Fetch top users |
| `refreshAll(force?)` | Method | Refresh all data in parallel |
| `setTimeRange(range)` | Method | Change range and re-fetch |

### Utility Exports

- `formatNumber(n)` — Format with locale separators
- `calculatePercentChange(old, new)` — Percent change calculation
- `formatPercent(value)` — Format as percentage string
- `getTimeRangeLabel(range)` — Human-readable label ("Last 7 days", etc.)
- `getDaysFromRange(range)` — Convert range to day count

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

## useTutorial

**Location**: `/composables/useTutorial.ts`

**Purpose**: Provides reactive state and controls for the interactive tutorial system. Wraps the tutorial Pinia store with a clean composable API.

### Import

```typescript
import { useTutorial } from '~/composables/useTutorial'
```

### Usage

```vue
<script setup>
const {
  isActive,
  activeTutorialId,
  currentStep,
  currentStepIndex,
  totalSteps,
  progressLabel,
  isLastStep,
  start,
  stop,
  next,
  previous,
  isCompleted,
  resetAll
} = useTutorial()

// Start a tutorial
start('customize-weapon')

// Check completion
if (isCompleted('navigate-app')) {
  console.log('User has completed the navigation tutorial')
}
</script>
```

### Return Values

| Property             | Type                                | Description                                       |
| -------------------- | ----------------------------------- | ------------------------------------------------- |
| `isActive`           | `ComputedRef<boolean>`              | Whether a tutorial is currently running            |
| `activeTutorialId`   | `ComputedRef<string \| null>`       | ID of the active tutorial                          |
| `currentStep`        | `ComputedRef<TutorialStep \| null>` | The current step definition                        |
| `currentStepIndex`   | `ComputedRef<number>`               | Zero-based index of the current step               |
| `totalSteps`         | `ComputedRef<number>`               | Total number of steps in the active tutorial       |
| `progressLabel`      | `ComputedRef<string>`               | Formatted progress string (e.g. `"3 / 10"`)       |
| `isLastStep`         | `ComputedRef<boolean>`              | Whether the current step is the last one           |

### Methods

| Method                  | Parameters            | Description                                                    |
| ----------------------- | --------------------- | -------------------------------------------------------------- |
| `start(tutorialId)`     | `tutorialId: string`  | Start a tutorial by ID. Navigates to the tutorial's start route |
| `stop()`                | none                  | Stop the active tutorial without marking it complete            |
| `next()`                | none                  | Advance to the next step (completes tutorial if on last step)   |
| `previous()`            | none                  | Go back to the previous step                                   |
| `isCompleted(id)`       | `tutorialId: string`  | Check if a tutorial has been completed                          |
| `resetAll()`            | none                  | Clear all completion records from localStorage                  |

### Persistence

Loads completed tutorial IDs from `localStorage` on mount. Completion state survives page reloads and browser restarts.

### Related

- [Tutorial System Guide](./tutorial-system.md) - Full architecture and step-by-step guide
- [tutorialStore](./reference-stores.md#tutorialstore) - Underlying Pinia store

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
