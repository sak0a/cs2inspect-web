# Pinia Stores Reference

## Overview

CS2Inspect uses [Pinia](https://pinia.vuejs.org/) for state management. This document provides comprehensive reference for all Pinia stores in the application.

## Available Stores

1. [loadoutStore](#loadoutstore) - Manages user loadouts and item customizations

---

## loadoutStore

**Location**: `/stores/loadoutStore.ts`

**Purpose**: Centralized state management for user loadouts, weapons, knives, gloves, agents, music kits, and pins. Handles all CRUD operations and API communication for loadout management.

### Import

```typescript
import { useLoadoutStore } from '~/stores/loadoutStore'
```

### Usage

```vue
<script setup>
const loadoutStore = useLoadoutStore()

// Access state
const loadouts = loadoutStore.loadouts
const selectedLoadoutId = loadoutStore.selectedLoadoutId

// Access getters
const selectedLoadout = loadoutStore.selectedLoadout
const hasLoadouts = loadoutStore.hasLoadouts

// Call actions
await loadoutStore.fetchLoadouts(steamId)
await loadoutStore.createLoadout(steamId, 'My Loadout')
</script>
```

---

## State

### `loadouts`
```typescript
DBLoadout[]
```
Array of all user loadouts.

**DBLoadout Structure**:
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

### `currentSkins`
```typescript
IEnhancedItem[] | IEnhancedKnife[] | IEnhancedWeapon[]
```
Currently loaded items for the selected loadout (weapons, knives, gloves, etc.).

### `selectedLoadoutId`
```typescript
LoadoutId | null
```
ID of the currently selected loadout (branded type for type safety).

### `isLoading`
```typescript
boolean
```
Loading state for async operations.

### `error`
```typescript
string | null
```
Error message from last operation.

---

## Getters

### `selectedLoadout`
```typescript
ComputedRef<DBLoadout | undefined>
```
Returns the currently selected loadout object.

**Example**:
```vue
<script setup>
const loadoutStore = useLoadoutStore()
const loadout = loadoutStore.selectedLoadout

watchEffect(() => {
  if (loadout) {
    console.log('Active loadout:', loadout.name)
  }
})
</script>
```

### `hasLoadouts`
```typescript
ComputedRef<boolean>
```
Whether the user has any loadouts.

**Example**:
```vue
<template>
  <div v-if="!loadoutStore.hasLoadouts">
    <p>No loadouts yet. Create your first loadout!</p>
  </div>
</template>
```

### `loadoutSkins`
```typescript
ComputedRef<IEnhancedItem[]>
```
Alias for `currentSkins` state.

---

## Actions

### Loadout Management

#### `fetchLoadouts(steamId)`
Fetch all loadouts for a user.

**Parameters**:
- `steamId: SteamId` - User's Steam ID (branded type)

**Returns**: `Promise<void>`

**Side Effects**:
- Updates `loadouts` state
- Auto-selects active/first loadout if none selected
- Validates selected loadout still exists

**Example**:
```typescript
import { toSteamId } from '~/types/core/branded'

const steamId = toSteamId('76561198012345678')
await loadoutStore.fetchLoadouts(steamId)
```

**Features**:
- Prevents duplicate concurrent requests using `fetchPromises` map
- Handles both old and new API response formats
- Auto-selects active loadout or falls back to first loadout
- Validates selected loadout after fetch

#### `createLoadout(steamId, name)`
Create a new loadout.

**Parameters**:
- `steamId: SteamId` - User's Steam ID
- `name: string` - Loadout name

**Returns**: `Promise<void>`

**Side Effects**:
- Creates new loadout in database
- Activates the newly created loadout
- Refreshes loadouts list

**Validation**:
- Name required
- Name must be unique per user (enforced by API)

**Example**:
```typescript
await loadoutStore.createLoadout(steamId, 'Competitive Setup')
```

#### `updateLoadout(id, steamId, newName)`
Update a loadout's name.

**Parameters**:
- `id: LoadoutId` - Loadout ID to update
- `steamId: SteamId` - User's Steam ID
- `newName: string` - New loadout name

**Returns**: `Promise<void>`

**Validation**:
- Name length: 1-20 characters
- Throws error if validation fails

**Example**:
```typescript
const loadoutId = toLoadoutId(1)
await loadoutStore.updateLoadout(loadoutId, steamId, 'Casual Setup')
```

#### `deleteLoadout(steamId, id)`
Delete a loadout.

**Parameters**:
- `steamId: SteamId` - User's Steam ID
- `id: LoadoutId` - Loadout ID to delete

**Returns**: `Promise<void>`

**Side Effects**:
- Deletes loadout from database
- Refreshes loadouts list
- Auto-selects another loadout if deleted was selected

**Restrictions**:
- Cannot delete if it's the only loadout (enforced by API)

**Example**:
```typescript
await loadoutStore.deleteLoadout(steamId, loadoutId)
```

#### `selectLoadout(id)`
Select a loadout (client-side only, doesn't persist).

**Parameters**:
- `id: LoadoutId` - Loadout ID to select

**Returns**: `void`

**Example**:
```typescript
loadoutStore.selectLoadout(toLoadoutId(2))
```

#### `activateLoadout(id, steamId)`
Activate a loadout (persists to database, sets as active).

**Parameters**:
- `id: LoadoutId` - Loadout ID to activate
- `steamId: SteamId` - User's Steam ID

**Returns**: `Promise<void>`

**Side Effects**:
- Sets loadout as active in database
- Deactivates all other loadouts
- Updates local state
- Selects the loadout

**Example**:
```typescript
await loadoutStore.activateLoadout(loadoutId, steamId)
```

#### `duplicateLoadout(steamId, loadoutId)`
Duplicate an existing loadout.

**Parameters**:
- `steamId: SteamId` - User's Steam ID
- `loadoutId: LoadoutId` - Loadout ID to duplicate

**Returns**: `Promise<void>`

**Side Effects**:
- Creates copy of loadout with all items
- Refreshes loadouts list

**Example**:
```typescript
await loadoutStore.duplicateLoadout(steamId, loadoutId)
```

#### `setLoadoutAsDefault(steamId, loadoutId)`
Set a loadout as default (used by CS2 plugin).

**Parameters**:
- `steamId: SteamId` - User's Steam ID
- `loadoutId: LoadoutId` - Loadout ID to set as default

**Returns**: `Promise<void>`

**Side Effects**:
- Sets `is_default = 1` for this loadout
- Unsets default flag for all other loadouts
- Refreshes loadouts list

**Example**:
```typescript
await loadoutStore.setLoadoutAsDefault(steamId, loadoutId)
```

#### `clearLoadout(steamId, loadoutId, categories?)`
Clear items from a loadout.

**Parameters**:
- `steamId: SteamId` - User's Steam ID
- `loadoutId: LoadoutId` - Loadout ID to clear
- `categories?: string[]` - Optional categories to clear (default: all)

**Returns**: `Promise<void>`

**Categories**: `['weapons', 'knives', 'gloves', 'agents', 'music', 'pins']`

**Side Effects**:
- Clears specified categories from loadout
- Updates `currentSkins` if selected loadout

**Example**:
```typescript
// Clear all items
await loadoutStore.clearLoadout(steamId, loadoutId)

// Clear only weapons and knives
await loadoutStore.clearLoadout(steamId, loadoutId, ['weapons', 'knives'])
```

### Sharing & Import

#### `shareLoadout(steamId, loadoutId)`
Generate a share code for a loadout.

**Parameters**:
- `steamId: SteamId` - User's Steam ID
- `loadoutId: LoadoutId` - Loadout ID to share

**Returns**: `Promise<string>` - Share code

**Example**:
```typescript
const shareCode = await loadoutStore.shareLoadout(steamId, loadoutId)
console.log(`Share code: ${shareCode}`)
// Use share code to share loadout with others
```

#### `importLoadout(steamId, shareCode)`
Import a loadout from a share code.

**Parameters**:
- `steamId: SteamId` - User's Steam ID
- `shareCode: string` - Share code from another user

**Returns**: `Promise<void>`

**Side Effects**:
- Creates new loadout from share code
- Refreshes loadouts list
- Auto-selects the imported loadout

**Example**:
```typescript
await loadoutStore.importLoadout(steamId, 'ABC123XYZ')
```

### Item Fetching

#### `fetchLoadoutWeaponSkins(type, steamId)`
Fetch weapons for current loadout.

**Parameters**:
- `type: string` - Weapon category (`'rifles'`, `'pistols'`, `'smgs'`, `'heavys'`)
- `steamId: SteamId` - User's Steam ID

**Returns**: `Promise<void>`

**Side Effects**: Updates `currentSkins` with weapons

**Example**:
```typescript
await loadoutStore.fetchLoadoutWeaponSkins('rifles', steamId)
```

#### `fetchLoadoutKnives(steamId)`
Fetch knives for current loadout.

**Parameters**:
- `steamId: SteamId` - User's Steam ID

**Returns**: `Promise<void>`

**Example**:
```typescript
await loadoutStore.fetchLoadoutKnives(steamId)
```

#### `fetchLoadoutGloves(steamId)`
Fetch gloves for current loadout.

**Parameters**:
- `steamId: SteamId` - User's Steam ID

**Returns**: `Promise<void>`

#### `fetchLoadoutMusicKits(steamId)`
Fetch music kits for current loadout.

**Parameters**:
- `steamId: SteamId` - User's Steam ID

**Returns**: `Promise<void>`

#### `fetchLoadoutPins(steamId)`
Fetch pins for current loadout.

**Parameters**:
- `steamId: SteamId` - User's Steam ID

**Returns**: `Promise<void>`

---

## Usage Patterns

### Initial Load

```vue
<script setup>
const loadoutStore = useLoadoutStore()
const { user } = useAuth()

onMounted(async () => {
  if (user.value?.steamId) {
    await loadoutStore.fetchLoadouts(toSteamId(user.value.steamId))
  }
})
</script>
```

### Creating a Loadout

```vue
<script setup>
const loadoutStore = useLoadoutStore()
const { user } = useAuth()
const message = useMessage()

const createNewLoadout = async (name: string) => {
  try {
    await loadoutStore.createLoadout(
      toSteamId(user.value.steamId),
      name
    )
    message.success('Loadout created successfully!')
  } catch (error) {
    message.error('Failed to create loadout')
  }
}
</script>
```

### Switching Loadouts

```vue
<script setup>
const loadoutStore = useLoadoutStore()
const { user } = useAuth()

const switchLoadout = async (loadoutId: LoadoutId) => {
  // Client-side selection
  loadoutStore.selectLoadout(loadoutId)

  // Fetch items for this loadout
  await loadoutStore.fetchLoadoutWeaponSkins('rifles', toSteamId(user.value.steamId))

  // Optionally activate (persist to DB)
  await loadoutStore.activateLoadout(loadoutId, toSteamId(user.value.steamId))
}
</script>
```

### Displaying Loadouts

```vue
<template>
  <div v-if="loadoutStore.isLoading">
    Loading loadouts...
  </div>

  <div v-else-if="loadoutStore.error">
    Error: {{ loadoutStore.error }}
  </div>

  <div v-else-if="!loadoutStore.hasLoadouts">
    No loadouts yet. Create one to get started!
  </div>

  <div v-else>
    <div v-for="loadout in loadoutStore.loadouts" :key="loadout.id">
      <div
        :class="{ active: loadout.id === loadoutStore.selectedLoadoutId }"
        @click="switchLoadout(toLoadoutId(loadout.id))"
      >
        {{ loadout.name }}
        <span v-if="loadout.is_default">⭐ Default</span>
        <span v-if="loadout.active">✓ Active</span>
      </div>
    </div>
  </div>
</template>
```

### Error Handling

```vue
<script setup>
const loadoutStore = useLoadoutStore()
const message = useMessage()

const handleAction = async (action: () => Promise<void>) => {
  try {
    await action()
    message.success('Operation completed successfully')
  } catch (error) {
    if (error instanceof Error) {
      message.error(error.message)
    } else {
      message.error('An unexpected error occurred')
    }
  }
}

// Usage
await handleAction(() =>
  loadoutStore.deleteLoadout(steamId, loadoutId)
)
</script>
```

---

## Advanced Patterns

### Reactive Loadout Display

```vue
<script setup>
const loadoutStore = useLoadoutStore()

// Automatically updates when selection changes
const activeLoadout = computed(() => loadoutStore.selectedLoadout)

watchEffect(() => {
  if (activeLoadout.value) {
    console.log('Active loadout changed:', activeLoadout.value.name)
    // Trigger any side effects
  }
})
</script>
```

### Optimistic Updates

```typescript
// Optimistically update UI before server response
const quickSelectLoadout = (id: LoadoutId) => {
  // Immediate UI update
  loadoutStore.selectLoadout(id)

  // Server sync in background
  loadoutStore.activateLoadout(id, steamId).catch((error) => {
    // Revert on error
    message.error('Failed to activate loadout')
  })
}
```

### Batch Operations

```typescript
// Clear and reload loadout
const resetLoadout = async (steamId: SteamId, loadoutId: LoadoutId) => {
  await loadoutStore.clearLoadout(steamId, loadoutId)
  await loadoutStore.fetchLoadoutWeaponSkins('rifles', steamId)
  await loadoutStore.fetchLoadoutKnives(steamId)
  await loadoutStore.fetchLoadoutGloves(steamId)
}
```

---

## API Response Formats

The store handles both legacy and new API response formats:

### Legacy Format
```json
{
  "loadouts": [...],
  "skins": [...]
}
```

### New Format
```json
{
  "data": {
    "loadouts": [...],
    "skins": [...]
  },
  "meta": {
    "loadoutId": 1,
    "steamId": "76561198012345678",
    "rows": 10
  }
}
```

The store automatically adapts to both formats for backward compatibility.

---

## Type Safety

The store uses branded types for enhanced type safety:

```typescript
import { toSteamId, toLoadoutId } from '~/types/core/branded'

// These prevent accidental mixing of IDs
const steamId = toSteamId('76561198012345678')  // SteamId brand
const loadoutId = toLoadoutId(1)                // LoadoutId brand

// TypeScript will catch errors:
// loadoutStore.fetchLoadouts(loadoutId)  // ❌ Error: LoadoutId is not SteamId
// loadoutStore.deleteLoadout(steamId, steamId)  // ❌ Error: SteamId is not LoadoutId
```

---

## Performance Considerations

### Deduplication

The store prevents duplicate concurrent fetches:

```typescript
// Multiple calls will share the same promise
await Promise.all([
  loadoutStore.fetchLoadouts(steamId),  // Fetches
  loadoutStore.fetchLoadouts(steamId),  // Waits for first
  loadoutStore.fetchLoadouts(steamId)   // Waits for first
])
```

### State Updates

State updates trigger minimal re-renders:

```vue
<script setup>
// Only re-renders when selectedLoadout changes
const selectedLoadout = computed(() => loadoutStore.selectedLoadout)

// Not when other loadouts update
watch(selectedLoadout, (newLoadout) => {
  console.log('Selected loadout changed:', newLoadout)
})
</script>
```

---

## Debugging

### Enable Logging

The store includes console logging for debugging:

```typescript
// Logs are automatically added for:
// - Fetch operations with counts
// - State updates
// - Error conditions
```

### DevTools

Use Vue DevTools to inspect store state:

1. Open Vue DevTools
2. Navigate to Pinia tab
3. Select `loadout` store
4. Inspect state, getters, actions

---

## Best Practices

### 1. Always Handle Errors

```typescript
try {
  await loadoutStore.fetchLoadouts(steamId)
} catch (error) {
  // Always handle errors
  console.error('Failed to fetch loadouts:', error)
  message.error('Could not load loadouts')
}
```

### 2. Use Branded Types

```typescript
// Good: Type-safe
const steamId = toSteamId(user.steamId)
await loadoutStore.fetchLoadouts(steamId)

// Bad: Not type-safe
await loadoutStore.fetchLoadouts(user.steamId)
```

### 3. Check Loading States

```vue
<template>
  <div v-if="loadoutStore.isLoading">
    <Spinner />
  </div>
  <div v-else>
    <!-- Content -->
  </div>
</template>
```

### 4. Validate Before Actions

```typescript
if (!loadoutStore.hasLoadouts) {
  message.warning('Create a loadout first')
  return
}

await loadoutStore.deleteLoadout(steamId, loadoutId)
```

### 5. Use Computed for Derived State

```typescript
// Good: Reactive
const activeLoadoutName = computed(() =>
  loadoutStore.selectedLoadout?.name ?? 'No loadout'
)

// Bad: Not reactive
const activeLoadoutName = loadoutStore.selectedLoadout?.name
```

---

## Testing

### Unit Testing

```typescript
import { setActivePinia, createPinia } from 'pinia'
import { useLoadoutStore } from '~/stores/loadoutStore'

describe('loadoutStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with empty state', () => {
    const store = useLoadoutStore()
    expect(store.loadouts).toEqual([])
    expect(store.selectedLoadoutId).toBeNull()
    expect(store.hasLoadouts).toBe(false)
  })

  it('should update state after fetch', async () => {
    const store = useLoadoutStore()
    // Mock API response
    await store.fetchLoadouts(toSteamId('123'))
    expect(store.loadouts.length).toBeGreaterThan(0)
  })
})
```

---

## Related Documentation

- [Composables Reference](./reference-composables.md) - Vue composables
- [API Reference](../api/) - Backend API documentation
- [TypeScript Types](./reference-types.md) - Type definitions
- [Components](../components.md) - Component documentation

---

## Migration Guide

### From Direct API Calls

```typescript
// Old: Direct API calls
const response = await fetch('/api/loadouts')
const loadouts = await response.json()

// New: Use store
const loadoutStore = useLoadoutStore()
await loadoutStore.fetchLoadouts(steamId)
const loadouts = loadoutStore.loadouts
```

### From Local State

```vue
<!-- Old: Local component state -->
<script setup>
const loadouts = ref([])
const fetchLoadouts = async () => {
  const response = await fetch('/api/loadouts')
  loadouts.value = await response.json()
}
</script>

<!-- New: Use store -->
<script setup>
const loadoutStore = useLoadoutStore()
onMounted(() => loadoutStore.fetchLoadouts(steamId))
</script>
```

---

## Future Enhancements

Planned improvements for the loadout store:

1. **Offline Support**: Cache loadouts in IndexedDB
2. **Real-time Updates**: WebSocket integration for multi-device sync
3. **Undo/Redo**: Action history for reverting changes
4. **Conflict Resolution**: Handle concurrent edits
5. **Performance**: Virtual scrolling for large loadout lists

---

## Contributing

When modifying the loadout store:

1. **Maintain Type Safety**: Use branded types
2. **Handle Both Formats**: Support legacy and new API responses
3. **Add Error Handling**: Catch and handle all errors
4. **Update Tests**: Add tests for new functionality
5. **Document Changes**: Update this documentation
