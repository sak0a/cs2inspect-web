ccl# Code Duplication & Structure Refactoring Implementation Plan

## 🎯 Purpose

This document outlines a comprehensive plan to eliminate code duplication and improve project structure organization. This will enhance maintainability, reduce bugs, and improve developer experience.

## 📋 Table of Contents

- [Phase 1: Logger Consolidation](#phase-1-logger-consolidation)
- [Phase 2: Save Endpoint Unification](#phase-2-save-endpoint-unification)
- [Phase 3: Validation Refactoring](#phase-3-validation-refactoring)
- [Phase 4: API Structure Reorganization](#phase-4-api-structure-reorganization)
- [Phase 5: Utility Organization](#phase-5-utility-organization)
- [Testing Strategy](#testing-strategy)
- [Rollout Plan](#rollout-plan)

---

## Phase 1: Logger Consolidation

### Current State
- `APIRequestLogger` and `Logger` are identical (duplicated code)
- Both exported from `server/utils/logger.ts`
- Used inconsistently across the codebase

### Implementation Steps

#### Step 1.1: Create Unified Logger
**File**: `server/utils/logger.ts`

```typescript
/**
 * Unified logger for the application
 * Provides consistent logging across server utilities and API routes
 */
export const Logger = {
    info(message: string, context?: string): void {
        if (process.env.NODE_ENV !== 'production') {
            const contextStr = context ? `[${context}] ` : '';
            console.log(`\x1b[103m\x1b[30m INFO \x1b[0m\x1b[97m ${contextStr}${message}`);
        }
    },
    error(message: string, context?: string): void {
        if (process.env.NODE_ENV !== 'production') {
            const contextStr = context ? `[${context}] ` : '';
            console.log(`\x1b[101m\x1b[30m ERROR \x1b[0m\x1b[97m ${contextStr}${message}`);
        }
    },
    success(message: string, context?: string): void {
        if (process.env.NODE_ENV !== 'production') {
            const contextStr = context ? `[${context}] ` : '';
            console.log(`\x1b[92m✔\x1b[97m ${contextStr}${message}`);
        }
    },
    header(message: string): void {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`\n---------- \x1b[104m\x1b[30m ${message} \x1b[0m ----------`);
        }
    },
    responseTime(startTime: number): void {
        const responseTime = Date.now() - startTime;
        console.log(`Response Time: ${responseTime}ms`);
    }
} as const;

// Backward compatibility alias (deprecated, will be removed in v2.0)
/** @deprecated Use Logger instead */
export const APIRequestLogger = Logger;
```

#### Step 1.2: Update All Imports
**Files to update**:
- `server/api/*.ts` - All API routes
- `server/utils/*.ts` - All utility files
- `server/middleware/*.ts` - All middleware files

**Search and replace pattern**:
```typescript
// OLD
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import { Logger } from '~/server/utils/logger'

// NEW
import { Logger } from '~/server/utils/logger'
```

#### Step 1.3: Update Usage with Context
Add context to log calls for better debugging:

```typescript
// OLD
Logger.header(`Save knife request: ${event.method} ${event.req.url}`)

// NEW
Logger.header(`${event.method} ${event.req.url}`, 'API')
```

### Testing Checklist
- [ ] All imports updated
- [ ] No TypeScript errors
- [ ] Logging still works correctly
- [ ] No console errors in production

### Estimated Time: 2-3 hours

---

## Phase 2: Save Endpoint Unification

### Current State
- `server/api/weapons/save.ts` - ~68 lines
- `server/api/knives/save.ts` - ~58 lines (missing imports!)
- `server/api/gloves/save.ts` - ~70 lines
- ~95% code duplication between these files

### Implementation Steps

#### Step 2.1: Create Generic Save Handler
**File**: `server/utils/itemSaveHandler.ts`

```typescript
import { defineEventHandler, createError, getQuery, readBody, type H3Event } from 'h3'
import { Logger } from '~/server/utils/logger'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import {
    saveWeapon,
    saveKnife,
    saveGlove,
    validateCommonFields,
    validateWeaponFields,
    validateKnifeFields,
    validateGloveFields,
    validateWeaponDatabaseTable
} from '~/server/utils/saveHelpers'
import type { ItemType, SaveRequestConfig } from '~/server/types'

/**
 * Configuration for different item types
 */
const ITEM_SAVE_CONFIG: Record<ItemType, SaveRequestConfig> = {
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
    },
    knife: {
        validateFields: (body) => {
            validateCommonFields(body)
            validateKnifeFields(body)
        },
        saveFunction: saveKnife,
        requiresType: false,
        getSaveParams: (body, query) => {
            return [query.steamId as string, query.loadoutId as string, body]
        }
    },
    glove: {
        validateFields: (body) => {
            validateCommonFields(body)
            validateGloveFields(body)
        },
        saveFunction: saveGlove,
        requiresType: false,
        getSaveParams: (body, query) => {
            return [query.steamId as string, query.loadoutId as string, body]
        }
    }
}

/**
 * Validates reset request (minimal validation for reset operations)
 */
function validateResetRequest(body: Record<string, unknown>) {
    validateRequiredRequestData(body.defindex, 'Defindex')
    validateRequiredRequestData(body.team, 'Team')
    if (body.team !== 1 && body.team !== 2) {
        Logger.error('Invalid team')
        throw createError({
            statusCode: 400,
            message: `Invalid team: ${body.team}`
        })
    }
}

/**
 * Generic save handler for all item types
 * @param itemType - The type of item being saved
 * @param event - H3 event object
 */
export function createSaveHandler(itemType: ItemType) {
    return defineEventHandler(async (event: H3Event) => {
        const query = getQuery(event)
        const config = ITEM_SAVE_CONFIG[itemType]

        Logger.header(`${event.method} ${event.req.url}`, 'API')

        // Validate required query parameters
        const steamId = query.steamId as string
        validateRequiredRequestData(steamId, 'Steam ID')

        const loadoutId = query.loadoutId as string
        validateRequiredRequestData(loadoutId, 'Loadout ID')

        // Validate type parameter if required
        if (config.requiresType) {
            validateRequiredRequestData(query.type, 'Type')
        }

        // Read and validate body
        const body = await readBody(event)
        validateRequiredRequestData(body, 'Body')

        try {
            // Handle reset case
            if (body.reset) {
                validateResetRequest(body)
                const saveParams = config.getSaveParams({ ...body, reset: true }, query)
                return await (config.saveFunction as any)(...saveParams)
            }

            // Validate all fields for non-reset cases
            config.validateFields(body)

            // Get save parameters and execute save
            const saveParams = config.getSaveParams(body, query)
            return await (config.saveFunction as any)(...saveParams)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : `Failed to save ${itemType}`
            Logger.error(`Failed to save ${itemType}: ${errorMessage}`, 'API')
            throw createError({
                statusCode: 500,
                message: `Failed to save ${itemType}`
            })
        }
    })
}
```

#### Step 2.2: Update Save Endpoints
**File**: `server/api/weapons/save.ts`
```typescript
import { createSaveHandler } from '~/server/utils/itemSaveHandler'

export default createSaveHandler('weapon')
```

**File**: `server/api/knives/save.ts`
```typescript
import { createSaveHandler } from '~/server/utils/itemSaveHandler'

export default createSaveHandler('knife')
```

**File**: `server/api/gloves/save.ts`
```typescript
import { createSaveHandler } from '~/server/utils/itemSaveHandler'

export default createSaveHandler('glove')
```

#### Step 2.3: Add Type Definitions
**File**: `server/types/save.ts` (new file)
```typescript
export type ItemType = 'weapon' | 'knife' | 'glove'

export interface SaveRequestConfig {
    validateFields: (body: Record<string, unknown>) => void
    saveFunction: (...args: any[]) => Promise<any>
    requiresType: boolean
    getSaveParams: (body: Record<string, unknown>, query: Record<string, unknown>) => any[]
}
```

### Testing Checklist
- [ ] Weapon save still works
- [ ] Knife save still works
- [ ] Glove save still works
- [ ] Reset functionality works for all types
- [ ] Validation errors are properly thrown
- [ ] Error messages are clear
- [ ] Missing imports fixed in knives/save.ts

### Estimated Time: 4-6 hours

---

## Phase 3: Validation Refactoring

### Current State
- `validateWeaponFields` and `validateKnifeFields` share ~80% duplicate code
- StatTrak and nameTag validation duplicated
- Team validation duplicated in multiple places

### Implementation Steps

#### Step 3.1: Extract Common Validation
**File**: `server/utils/validation/common.ts` (new file)

```typescript
import { createError } from 'h3'
import { Logger } from '~/server/utils/logger'
import { validateRequiredRequestData } from '~/server/utils/helpers'

/**
 * Validates team value (must be 1 or 2)
 */
export function validateTeam(team: unknown): asserts team is 1 | 2 {
    validateRequiredRequestData(team, 'Team')
    if (team !== 1 && team !== 2) {
        Logger.error('Invalid team')
        throw createError({
            statusCode: 400,
            message: `Invalid team: ${team}`
        })
    }
}

/**
 * Validates StatTrak fields
 */
export function validateStatTrak(body: Record<string, unknown>) {
    if (body.statTrak !== true && body.statTrak !== false) {
        Logger.error('Invalid StatTrak')
        throw createError({
            statusCode: 400,
            message: 'Invalid StatTrak'
        })
    }

    validateRequiredRequestData(body.statTrakCount, 'StatTrak Count', true)
    if ((body.statTrakCount as number) < 0) {
        Logger.error('Invalid StatTrak Count')
        throw createError({
            statusCode: 400,
            message: `Invalid StatTrak Count: ${body.statTrakCount}`
        })
    }
}

/**
 * Validates name tag
 */
export function validateNameTag(nameTag: unknown) {
    if (nameTag && (nameTag as string).length > 32) {
        Logger.error('Invalid Name Tag')
        throw createError({
            statusCode: 400,
            message: 'Invalid Name Tag'
        })
    }
}
```

#### Step 3.2: Refactor Field Validators
**File**: `server/utils/saveHelpers.ts`

Update `validateWeaponFields` and `validateKnifeFields`:

```typescript
import { validateStatTrak, validateNameTag } from './validation/common'

export const validateWeaponFields = (body: Record<string, unknown>) => {
    if (!VALID_WEAPON_DEFINDEXES[body.defindex as number]) {
        Logger.error('Invalid Weapon Defindex')
        throw createError({
            statusCode: 400,
            message: `Invalid Weapon Defindex: ${body.defindex}`
        })
    }
    validateStatTrak(body)
    validateNameTag(body.nameTag)
}

export const validateKnifeFields = (body: Record<string, unknown>) => {
    if (!VALID_KNIFE_DEFINDEXES[body.defindex as number]) {
        Logger.error('Invalid Knife Defindex')
        throw createError({
            statusCode: 400,
            message: `Invalid Knife Defindex: ${body.defindex}`
        })
    }
    validateStatTrak(body)
    validateNameTag(body.nameTag)
}
```

### Testing Checklist
- [ ] All validation still works
- [ ] Error messages are correct
- [ ] No duplicate validation code

### Estimated Time: 2-3 hours

---

## Phase 4: API Structure Reorganization

### Current State
```
server/api/
  ├── auth/
  ├── data/
  ├── gloves/
  ├── health/
  ├── knives/
  ├── loadouts/
  ├── pins/
  ├── proxy/
  └── weapons/
```

### Target Structure
```
server/api/
  ├── auth/
  │   └── validate.ts
  ├── items/
  │   ├── weapons/
  │   │   ├── [type].ts
  │   │   └── save.ts
  │   ├── knives/
  │   │   ├── index.ts
  │   │   └── save.ts
  │   ├── gloves/
  │   │   ├── index.ts
  │   │   └── save.ts
  │   └── pins/
  │       └── index.ts
  ├── loadouts/
  │   ├── activate.ts
  │   ├── clear.post.ts
  │   ├── default.post.ts
  │   ├── duplicate.post.ts
  │   ├── import.post.ts
  │   ├── index.ts
  │   ├── select.ts
  │   └── share.post.ts
  ├── inspect/
  │   └── index.ts (moved from inspect.ts)
  ├── data/
  │   ├── agents.ts
  │   ├── collectibles.ts
  │   ├── keychains.ts
  │   ├── musickits.ts
  │   ├── skins.ts
  │   └── stickers.ts
  ├── health/
  │   ├── details.ts
  │   ├── history.ts
  │   ├── live.ts
  │   ├── proxy.ts
  │   └── ready.ts
  └── proxy/
      └── image.ts
```

### Implementation Steps

#### Step 4.1: Create New Directory Structure
```bash
mkdir -p server/api/items/weapons
mkdir -p server/api/items/knives
mkdir -p server/api/items/gloves
mkdir -p server/api/items/pins
mkdir -p server/api/inspect
```

#### Step 4.2: Move Files
```bash
# Move weapons
mv server/api/weapons/* server/api/items/weapons/
rmdir server/api/weapons

# Move knives
mv server/api/knives/* server/api/items/knives/
rmdir server/api/knives

# Move gloves
mv server/api/gloves/* server/api/items/gloves/
rmdir server/api/gloves

# Move pins
mv server/api/pins/* server/api/items/pins/
rmdir server/api/pins

# Move inspect
mv server/api/inspect.ts server/api/inspect/index.ts
```

#### Step 4.3: Update Imports
Search and replace import paths:

```typescript
// OLD
import { saveWeapon } from '~/server/utils/saveHelpers'

// NEW (paths remain the same, only file locations changed)
// Imports don't need to change as Nuxt auto-imports handle routing
```

#### Step 4.4: Update Route References
Check for any hardcoded route references in:
- Frontend code
- Documentation
- Tests

### Testing Checklist
- [ ] All routes still work
- [ ] No 404 errors
- [ ] Frontend still calls correct endpoints
- [ ] Documentation updated

### Estimated Time: 3-4 hours

---

## Phase 5: Utility Organization

### Current State
```
server/utils/
  ├── apiResponseHelpers.ts
  ├── commonUtils.ts
  ├── constants.ts
  ├── csgoAPI.ts
  ├── dataFilters.ts
  ├── helpers.ts
  ├── inspectHelpers.ts
  ├── interfaces.ts (deprecated)
  ├── keychainUtils.ts
  ├── logger.ts
  ├── saveHelpers.ts
  ├── skinUtils.ts
  ├── steamServiceClient.ts
  ├── themeCustomization.ts
  ├── weaponNameMapping.ts
  └── health/
```

### Target Structure
```
server/utils/
  ├── api/
  │   ├── responseHelpers.ts (renamed from apiResponseHelpers.ts)
  │   └── steamServiceClient.ts
  ├── validation/
  │   ├── common.ts (new)
  │   ├── items.ts (extracted from saveHelpers.ts)
  │   └── index.ts (barrel export)
  ├── database/
  │   ├── saveHelpers.ts (renamed/moved)
  │   └── itemSaveHandler.ts (new)
  ├── data/
  │   ├── dataFilters.ts
  │   ├── skinUtils.ts
  │   ├── weaponNameMapping.ts
  │   └── keychainUtils.ts
  ├── helpers.ts
  ├── logger.ts
  ├── commonUtils.ts
  ├── constants.ts
  ├── csgoAPI.ts
  ├── inspectHelpers.ts
  ├── themeCustomization.ts
  └── health/
```

### Implementation Steps

#### Step 5.1: Create New Directory Structure
```bash
mkdir -p server/utils/api
mkdir -p server/utils/validation
mkdir -p server/utils/database
mkdir -p server/utils/data
```

#### Step 5.2: Move and Rename Files
```bash
# API utilities
mv server/utils/apiResponseHelpers.ts server/utils/api/responseHelpers.ts
mv server/utils/steamServiceClient.ts server/utils/api/steamServiceClient.ts

# Validation utilities
mv server/utils/saveHelpers.ts server/utils/database/saveHelpers.ts
mv server/utils/itemSaveHandler.ts server/utils/database/itemSaveHandler.ts

# Data utilities
mv server/utils/dataFilters.ts server/utils/data/dataFilters.ts
mv server/utils/skinUtils.ts server/utils/data/skinUtils.ts
mv server/utils/weaponNameMapping.ts server/utils/data/weaponNameMapping.ts
mv server/utils/keychainUtils.ts server/utils/data/keychainUtils.ts
```

#### Step 5.3: Create Barrel Exports
**File**: `server/utils/validation/index.ts`
```typescript
export * from './common'
export * from './items'
```

**File**: `server/utils/api/index.ts`
```typescript
export * from './responseHelpers'
export * from './steamServiceClient'
```

**File**: `server/utils/database/index.ts`
```typescript
export * from './saveHelpers'
export * from './itemSaveHandler'
```

**File**: `server/utils/data/index.ts`
```typescript
export * from './dataFilters'
export * from './skinUtils'
export * from './weaponNameMapping'
export * from './keychainUtils'
```

#### Step 5.4: Update All Imports
Use find/replace to update imports:

```typescript
// OLD
import { apiResponseHelpers } from '~/server/utils/apiResponseHelpers'

// NEW
import { apiResponseHelpers } from '~/server/utils/api'
```

### Testing Checklist
- [ ] All imports updated
- [ ] No TypeScript errors
- [ ] All functionality still works
- [ ] Build succeeds

### Estimated Time: 4-5 hours

---

## Testing Strategy

### Unit Tests
Create tests for:
- Unified logger
- Generic save handler
- Common validation functions
- Item type configurations

### Integration Tests
- Test each save endpoint
- Test validation flows
- Test error handling

### Manual Testing
- Test all save operations
- Test reset functionality
- Test validation errors
- Test API routes still work

---

## Rollout Plan

### Phase Order
1. **Phase 1** (Logger) - Lowest risk, high impact
2. **Phase 3** (Validation) - Low risk, high impact
3. **Phase 2** (Save Handler) - Medium risk, high impact
4. **Phase 5** (Utilities) - Medium risk, medium impact
5. **Phase 4** (Structure) - Higher risk, lower impact

### Rollback Strategy
- Keep old files during migration
- Use feature flags if needed
- Test thoroughly before removing old code
- Maintain git history for easy rollback

### Communication
- Document all changes in PR descriptions
- Update API documentation
- Notify team of breaking changes
- Update migration guide

---

## Success Criteria

- [ ] No duplicate logger code
- [ ] Save endpoints unified (3 files → 1 handler)
- [ ] Validation code deduplicated
- [ ] API structure organized by domain
- [ ] Utilities organized by purpose
- [ ] All tests pass
- [ ] No breaking changes to API
- [ ] Documentation updated
- [ ] TypeScript compilation succeeds
- [ ] Build succeeds

---

## Estimated Total Time

- Phase 1: 2-3 hours
- Phase 2: 4-6 hours
- Phase 3: 2-3 hours
- Phase 4: 3-4 hours
- Phase 5: 4-5 hours

**Total: 15-21 hours** (approximately 2-3 days of focused work)

---

## Notes

- This refactoring should be done incrementally
- Each phase should be completed and tested before moving to the next
- Keep backward compatibility where possible
- Update documentation as you go
- Consider creating a feature branch for this work
