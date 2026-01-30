# Investigation: WeaponSkinModal and Weapon API Autosave Changes

**Investigation Date:** 2026-01-30  
**Repository:** sak0a/cs2inspect-web

## Executive Summary

This investigation examined the latest commits that modified the WeaponSkinModal component and Weapon API endpoints, with a specific focus on the autosave functionality. The key finding is that **commit 20ad70e (2026-01-30)** introduced a comprehensive autosave system for weapon customizations.

---

## Latest Commits

### Commit 20ad70e - "feat: renamed" (2026-01-30)

This is the primary commit that introduced/renamed the autosave functionality across the application.

**Author:** sak0a <laurinfrank03@gmail.com>  
**Date:** Fri Jan 30 02:04:53 2026 +0100  
**Commit Hash:** 20ad70e6a6a8ee1c9cabc7567040dcfc689f4398

---

## Files Changed (Autosave-Related)

### 1. `components/WeaponSkinModal.vue` (+1743 lines)

**Key Autosave Features:**

- **Event Emission:** Added `'auto-save'` event alongside `'select'` and `'duplicate'` events
  ```typescript
  (e: 'select' | 'duplicate' | 'auto-save', skin: IEnhancedWeapon, customization: WeaponConfiguration): void
  ```

- **Autosave Initialization:**
  ```typescript
  const autoSave = useAutoSave<WeaponConfiguration>(
    async (data) => {
      if (!selectedSkin.value) return
      emit('auto-save', selectedSkin.value, data)
    },
    {
      debounceMs: 1500,
      retryAttempts: 3,
      onSaveError: (error) => {
        console.error('Auto-save failed:', error)
      }
    }
  )
  ```

- **Conditional Autosave Trigger:**
  - Only triggers when NOT initializing (prevents saving DB-loaded data)
  - Requires a skin to be selected
  - Requires paintindex > 0 (user has chosen a skin)
  - Requires modal to be visible
  
  ```typescript
  watch(
    () => customization.value,
    (newVal) => {
      if (!isInitializing.value && selectedSkin.value && newVal.paintindex > 0 && props.visible) {
        autoSave.triggerSave({ ...newVal })
      }
    },
    { deep: true }
  )
  ```

- **Save Actions:**
  - `handleSave()` - Explicit save via Enter key or button click, marks as saved
  - `handleClose()` - Flushes pending autosaves before closing modal
  - `handleInlineSave()` - Saves visual customizations in inline mode

- **UI Integration:**
  - Displays SaveStatusIndicator component showing save status
  - Fixed position indicator similar to NaiveUI messages
  - Shows retry button when in error state

### 2. `composables/useAutoSave.ts` (+460 lines)

**Complete Autosave Composable Implementation:**

**Features:**
- **Debounced Saving:** 1500ms default delay to avoid excessive API calls
- **Status Tracking:** `'idle' | 'saving' | 'saved' | 'error'`
- **Retry Logic:** 3 attempts with exponential backoff (1000ms base delay)
- **Dirty State Detection:** Deep comparison to detect actual changes
- **Online/Offline Handling:** Queues saves when offline, resumes when back online
- **Flush Mechanism:** Can immediately flush pending debounced saves

**Public API Methods:**
- `triggerSave(data)` - Debounced save trigger
- `saveNow(data)` - Immediate save without debouncing
- `flushPending()` - Execute pending save immediately
- `cancelPending()` - Cancel pending save operation
- `retry()` - Retry last failed save
- `markAsSaved()` - Mark current state as saved (for explicit saves)
- `resetStatus()` - Reset to idle state

**Internal Logic:**
- Deep equality check prevents unnecessary saves
- Automatic cleanup on component unmount
- Attempts to save pending changes before unmount
- Returns to 'idle' status 2000ms after successful save

### 3. `server/api/items/weapons/save.post.ts` (+3 lines)

**Simplified API Endpoint:**
```typescript
import { createSaveHandler } from '~/server/utils/database'

export default createSaveHandler('weapon')
```

Uses a factory pattern to create a type-safe save handler for weapons.

### 4. `server/utils/database/itemSaveHandler.ts` (+117 lines)

**Generic Save Handler Factory:**

**Features:**
- Type-safe configuration for different item types (weapon, knife, glove)
- Unified validation and error handling
- Support for reset operations (minimal validation)
- Configurable per-item-type validation and save functions

**Weapon Configuration:**
```typescript
weapon: {
    validateFields: (body) => {
        validateCommonFields(body)
        validateWeaponFields(body)
    },
    saveFunction: saveWeapon,
    requiresType: true,
    getSaveParams: (body, query) => {
        const type = query.type as string
        validateRequiredRequestData(type, 'Type')
        const table = validateWeaponDatabaseTable(type)
        return [table, query.steamId as string, query.loadoutId as string, body]
    }
}
```

**Request Flow:**
1. Validates required query parameters (steamId, loadoutId, type)
2. Reads request body
3. Checks if it's a reset operation
4. Validates fields based on item type
5. Executes appropriate save function
6. Returns result or throws error

---

## Autosave Architecture

### Data Flow

```
User Changes Customization
    ↓
WeaponSkinModal watches customization (deep)
    ↓
Checks conditions (not initializing, skin selected, paintindex > 0, modal visible)
    ↓
autoSave.triggerSave(data) - DEBOUNCED
    ↓
After 1500ms delay → executeSave()
    ↓
emit('auto-save', skin, customization)
    ↓
Parent component receives event
    ↓
API call to /api/items/weapons/save
    ↓
createSaveHandler('weapon') processes request
    ↓
Validates and saves to database
    ↓
Status updated (saved/error)
```

### Key Design Decisions

1. **Initialization Guard:** The `isInitializing` flag prevents autosaving when loading data from the database, ensuring only user-initiated changes trigger saves.

2. **Debouncing:** 1500ms delay prevents excessive API calls during rapid user input (e.g., adjusting sliders).

3. **Retry with Backoff:** 3 attempts with exponential backoff (1s, 2s, 4s) handles transient network issues.

4. **Flush on Close:** Ensures pending changes aren't lost when user closes modal before debounce completes.

5. **Explicit Save Support:** `markAsSaved()` prevents duplicate saves when user explicitly clicks save or presses Enter.

6. **Deep Watching:** Monitors nested customization properties (stickers, keychain, wear, etc.) for changes.

7. **Online/Offline Detection:** Queues saves when offline and automatically retries when connection restored.

---

## Save Function Specifics

### Autosave Trigger Conditions

The autosave is **conditionally triggered** only when ALL conditions are met:

```typescript
!isInitializing.value &&      // Not loading data from DB
selectedSkin.value &&          // A skin is selected
newVal.paintindex > 0 &&       // User has chosen a skin
props.visible                  // Modal is open
```

### Save Status States

1. **idle** - No save operation in progress or recently completed
2. **saving** - Currently executing save operation
3. **saved** - Save completed successfully (shows for 2 seconds)
4. **error** - Save failed after all retry attempts

### Integration Points

- **WeaponSkinModal.vue:** Emits 'auto-save' events with skin and customization data
- **Parent Components:** Listen for 'auto-save' event and call API endpoint
- **API Endpoint:** `/api/items/weapons/save?steamId=X&loadoutId=Y&type=Z`
- **Database:** Saves to appropriate weapon table (rifles, pistols, smgs, etc.)

---

## Notable Implementation Details

### Preventing Duplicate Saves

```typescript
// In handleSave()
emit('select', selectedSkin.value, customization.value)
autoSave.markAsSaved()  // Prevents duplicate autosave
handleClose()
```

### Flush Before Close

```typescript
const handleClose = async () => {
  // Flush any pending auto-save before closing
  if (selectedSkin.value && customization.value.paintindex > 0) {
    await autoSave.flushPending()
  }
  // ... close modal
}
```

### Reset Status on Weapon Change

```typescript
watch(() => props.weapon, () => {
  if (props.visible && props.weapon) {
    isInitializing.value = true
    resetAllState()
    autoSave.resetStatus()  // Clear any previous save state
    // ... fetch new data
    nextTick(() => {
      isInitializing.value = false  // Allow autosave again
    })
  }
})
```

---

## Testing Recommendations

Based on this autosave implementation, the following test scenarios should be validated:

1. **Debounce Behavior:** Rapid changes should only trigger one save after 1500ms
2. **Initialization Guard:** Loading data from DB should not trigger autosave
3. **Offline Handling:** Changes should queue when offline and save when reconnected
4. **Retry Logic:** Failed saves should retry up to 3 times with backoff
5. **Flush on Close:** Pending saves should complete before modal closes
6. **Explicit Save:** Button/Enter save should not duplicate autosave
7. **Status Indicators:** UI should show correct status during save lifecycle
8. **Deep Change Detection:** Nested property changes should trigger autosave

---

## Conclusion

The latest commit (20ad70e) introduced a **robust, production-ready autosave system** with:

- ✅ Intelligent debouncing to reduce API calls
- ✅ Network failure resilience with retry logic
- ✅ Offline/online detection and queuing
- ✅ Initialization guards to prevent false saves
- ✅ Clean separation of concerns (composable pattern)
- ✅ Type-safe API endpoints using factory pattern
- ✅ Comprehensive status tracking for UX feedback

The implementation follows Vue 3 best practices with composables and provides a solid foundation for autosaving weapon customizations across the CS2Inspect Web application.
