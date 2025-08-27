# Item Modal Composables Documentation

This document describes the universal utility functions and composables created to consolidate common modal operations across `GloveSkinModal`, `WeaponSkinModal`, and `KnifeSkinModal` components.

## Overview

The refactoring introduces three main modules:

1. **`useItemModalActions`** - Universal composable for common item operations
2. **`useWeaponModalActions`** - Weapon-specific composable for stickers and keychains
3. **`itemModalTypes`** - Type definitions for type safety across all item types

## Core Composables

### `useItemModalActions`

The main composable that provides universal functionality for all item types.

```typescript
import { useItemModalActions } from '~/composables/useItemModalActions'

const {
  // State
  state,
  
  // Actions
  handleSkinSelect,
  handleCreateInspectLink,
  handleImportInspectLink,
  handleDuplicate,
  handleReset,
  
  // Computed properties
  canDuplicate,
  canReset,
  canCreateInspectLink,
  oppositeTeam,
  
  // Configuration
  config
} = useItemModalActions({
  itemType: 'weapon', // 'weapon' | 'knife' | 'glove'
  user,
  weapon,
  customization,
  selectedSkin,
  onSuccess: (message) => console.log('Success:', message),
  onError: (message) => console.error('Error:', message)
})
```

#### Key Features

- **Type-safe operations** - Automatically handles different data structures for each item type
- **Automatic field filtering** - Only processes relevant fields for each item type:
  - **Weapons**: StatTrak, name tags, stickers, keychains
  - **Knives**: StatTrak, name tags (no stickers/keychains)
  - **Gloves**: Basic customization only (no StatTrak, stickers, or keychains)
- **Consistent API endpoints** - Maintains existing endpoint structure
- **Error handling** - Built-in error handling with user feedback

### `useWeaponModalActions`

Weapon-specific composable for sticker and keychain management.

```typescript
import { useWeaponModalActions } from '~/composables/useWeaponModalActions'

const {
  // State
  state,
  
  // Sticker actions
  handleAddSticker,
  handleStickerSelect,
  handleRemoveSticker,
  handleClearAllStickers,
  handleMoveSticker,
  
  // Keychain actions
  handleAddKeychain,
  handleKeychainSelect,
  handleRemoveKeychain,
  
  // Computed properties
  hasStickers,
  hasKeychain,
  stickerCount,
  availableStickerPositions,
  
  // Utility functions
  getStickerAtPosition,
  isValidStickerPosition,
  
  // Modal control
  closeStickerModal,
  closeKeychainModal
} = useWeaponModalActions({
  customization
})
```

## Type Safety

### Item Type Configuration

Each item type has a specific configuration that determines which features are available:

```typescript
const ITEM_TYPE_CONFIG = {
  weapon: {
    hasStatTrak: true,
    hasNameTag: true,
    hasStickers: true,
    hasKeychain: true
  },
  knife: {
    hasStatTrak: true,
    hasNameTag: true,
    hasStickers: false,
    hasKeychain: false
  },
  glove: {
    hasStatTrak: false,
    hasNameTag: false,
    hasStickers: false,
    hasKeychain: false
  }
}
```

### Type Guards

The system includes type guards for runtime type checking:

```typescript
import { 
  isWeaponItem, 
  isKnifeItem, 
  isGloveItem,
  isWeaponCustomization,
  isKnifeCustomization,
  isGloveCustomization
} from '~/types/itemModalTypes'

if (isWeaponItem(item)) {
  // TypeScript knows this is IEnhancedWeapon
  console.log(item.stickers)
}
```

## Usage Examples

### Basic Weapon Modal

```vue
<script setup lang="ts">
import { useItemModalActions } from '~/composables/useItemModalActions'
import { useWeaponModalActions } from '~/composables/useWeaponModalActions'

const props = defineProps<WeaponModalProps>()
const emit = defineEmits<WeaponModalEmits>()

// Main actions
const {
  handleSkinSelect,
  handleCreateInspectLink,
  handleImportInspectLink,
  handleDuplicate,
  handleReset,
  canDuplicate,
  canReset
} = useItemModalActions({
  itemType: 'weapon',
  user,
  weapon,
  customization,
  selectedSkin
})

// Weapon-specific actions
const {
  handleAddSticker,
  handleStickerSelect,
  handleAddKeychain,
  hasStickers,
  hasKeychain
} = useWeaponModalActions({
  customization
})

// Event handlers
const onDuplicate = (item, customization) => {
  emit('duplicate', item, customization)
}

const onReset = (item, customization) => {
  emit('select', item, customization)
}
</script>
```

### Basic Knife Modal

```vue
<script setup lang="ts">
import { useItemModalActions } from '~/composables/useItemModalActions'

const props = defineProps<KnifeModalProps>()
const emit = defineEmits<KnifeModalEmits>()

// Only main actions needed for knives
const {
  handleSkinSelect,
  handleCreateInspectLink,
  handleImportInspectLink,
  handleDuplicate,
  handleReset,
  canDuplicate,
  canReset
} = useItemModalActions({
  itemType: 'knife', // Automatically excludes stickers/keychains
  user,
  weapon,
  customization,
  selectedSkin
})
</script>
```

### Basic Glove Modal

```vue
<script setup lang="ts">
import { useItemModalActions } from '~/composables/useItemModalActions'

const props = defineProps<GloveModalProps>()
const emit = defineEmits<GloveModalEmits>()

// Only basic actions for gloves
const {
  handleSkinSelect,
  handleCreateInspectLink,
  handleImportInspectLink,
  handleDuplicate,
  handleReset,
  canDuplicate,
  canReset
} = useItemModalActions({
  itemType: 'glove', // Automatically excludes StatTrak, stickers, keychains
  user,
  weapon,
  customization,
  selectedSkin
})
</script>
```

## API Integration

### Inspect Link Generation

The composable automatically creates the correct payload for each item type:

```typescript
// Weapon payload includes all fields
{
  defindex: 7,
  paintindex: 12,
  paintseed: 123,
  paintwear: 0.15,
  statTrak: true,
  statTrakCount: 1337,
  nameTag: "My Weapon",
  stickers: [...],
  keychain: {...}
}

// Knife payload excludes stickers/keychains
{
  defindex: 500,
  paintindex: 12,
  paintseed: 123,
  paintwear: 0.15,
  statTrak: true,
  statTrakCount: 1337,
  nameTag: "My Knife"
}

// Glove payload is minimal
{
  defindex: 5000,
  paintindex: 12,
  paintseed: 123,
  paintwear: 0.15
}
```

### Import Functionality

Import automatically filters fields based on item type:

```typescript
// Weapon import includes all available fields
const weaponCustomization = createImportCustomization('weapon', importData, team)

// Knife import excludes stickers/keychains
const knifeCustomization = createImportCustomization('knife', importData, team)

// Glove import excludes StatTrak, stickers, keychains
const gloveCustomization = createImportCustomization('glove', importData, team)
```

## Migration Guide

### Before (Duplicated Code)

```vue
<!-- WeaponSkinModal.vue -->
<script>
const handleCreateInspectLink = async () => {
  // 50+ lines of weapon-specific code
}

const handleImportInspectLink = async (url) => {
  // 40+ lines of weapon-specific code
}

const handleDuplicate = async () => {
  // 30+ lines of weapon-specific code
}
</script>
```

### After (Using Composables)

```vue
<!-- WeaponSkinModal.vue -->
<script>
const {
  handleCreateInspectLink,
  handleImportInspectLink,
  handleDuplicate,
  handleReset
} = useItemModalActions({
  itemType: 'weapon',
  user,
  weapon,
  customization,
  selectedSkin
})

// Weapon-specific features
const {
  handleAddSticker,
  handleAddKeychain
} = useWeaponModalActions({
  customization
})
</script>
```

## Benefits

1. **Reduced Code Duplication** - ~300 lines of duplicated code eliminated
2. **Type Safety** - Full TypeScript support with proper generics
3. **Maintainability** - Single source of truth for common operations
4. **Consistency** - Uniform behavior across all modal types
5. **Extensibility** - Easy to add new item types or features
6. **Error Handling** - Centralized error handling and user feedback

## Testing

The composables can be easily unit tested:

```typescript
import { useItemModalActions } from '~/composables/useItemModalActions'

describe('useItemModalActions', () => {
  it('should handle weapon-specific fields', () => {
    const { config } = useItemModalActions({
      itemType: 'weapon',
      // ... other props
    })
    
    expect(config.hasStickers).toBe(true)
    expect(config.hasKeychain).toBe(true)
  })
  
  it('should exclude stickers for knives', () => {
    const { config } = useItemModalActions({
      itemType: 'knife',
      // ... other props
    })
    
    expect(config.hasStickers).toBe(false)
    expect(config.hasKeychain).toBe(false)
  })
})
```
