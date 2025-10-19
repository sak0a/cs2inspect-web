# CS2Inspect Implementation Guidelines

## 🎯 Purpose

This document provides specific technical guidance for implementing the type consistency migrations identified in the audit. Follow these guidelines to maintain the high quality standards established during the TypeScript refactoring.

## 📋 Pre-Migration Checklist

Before starting any migration:

- [ ] Read the `NEW_AGENT_ONBOARDING.md` for context
- [ ] Review the `TYPE_CONSISTENCY_AUDIT_PLAN.md` for scope
- [ ] Examine successfully migrated components as examples
- [ ] Understand the paint index bug fix and database field mappings
- [ ] Set up proper TypeScript checking in your development environment

## 🔧 Step-by-Step Migration Process

### **Step 1: Import Statement Migration**

#### **Pattern Recognition**
```typescript
// 🔍 IDENTIFY these patterns
import { SteamUser } from "~/services/steamAuth"
import { WeaponCustomization, IEnhancedItem, APISkin } from "~/server/utils/interfaces"
```

#### **Migration Strategy**
```typescript
// ✅ REPLACE with
import type { UserProfile, WeaponConfiguration, WeaponItemData, APIWeaponSkin } from '~/types'
import type { SteamUser } from "~/services/steamAuth"  // Keep if steamAuth service requires it
```

#### **Import Mapping Reference**
| Legacy Import | New Import | Notes |
|---------------|------------|-------|
| `SteamUser` | `UserProfile` | For component props/state |
| `WeaponCustomization` | `WeaponConfiguration` | Configuration objects |
| `KnifeCustomization` | `KnifeConfiguration` | Configuration objects |
| `GloveCustomization` | `GloveConfiguration` | Configuration objects |
| `IEnhancedWeapon` | `WeaponItemData` | Display data |
| `IEnhancedKnife` | `KnifeItemData` | Display data |
| `IEnhancedGlove` | `GloveItemData` | Display data |
| `APISkin` | `APIWeaponSkin` | API response data |

### **Step 2: Type Annotation Updates**

#### **Variable Declarations**
```typescript
// ❌ BEFORE
const user = ref<SteamUser | null>(null)
const customization = ref<WeaponCustomization>()
const items = ref<IEnhancedWeapon[]>([])

// ✅ AFTER
const user = ref<UserProfile | null>(null)
const customization = ref<WeaponConfiguration>()
const items = ref<WeaponItemData[]>([])
```

#### **Function Parameters**
```typescript
// ❌ BEFORE
const handleSave = async (weapon: IEnhancedWeapon, config: WeaponCustomization) => {

// ✅ AFTER
const handleSave = async (weapon: WeaponItemData, config: WeaponConfiguration) => {
```

#### **Props Interfaces**
```typescript
// ❌ BEFORE
interface Props {
  user: SteamUser | null
  weapon: IEnhancedWeapon
}

// ✅ AFTER
interface Props {
  user: UserProfile | null
  weapon: WeaponItemData
}
```

### **Step 3: Database Field Mapping Validation**

#### **Critical: Use Correct Database Interfaces**
```typescript
// ❌ WRONG - This caused the paint index bug
const dbInfo = weapon.databaseInfo as IMappedDBWeapon

// ✅ CORRECT - Use specific database interfaces
const dbInfo = weapon.databaseInfo as DBWeapon   // For weapons
const dbInfo = weapon.databaseInfo as DBKnife    // For knives  
const dbInfo = weapon.databaseInfo as DBGlove    // For gloves
```

#### **Database Field Mapping Template**
```typescript
// ✅ ALWAYS use this pattern for database field mapping
const createConfigurationFromDB = (dbInfo: DBWeapon): WeaponConfiguration => {
  return {
    active: dbInfo.active || false,
    team: dbInfo.team || 1,
    defindex: dbInfo.defindex,
    paintIndex: dbInfo.paintindex || 0,           // lowercase 'paintindex'
    paintIndexOverride: false,
    pattern: parseInt(dbInfo.paintseed) || 0,     // 'paintseed' not 'pattern'
    wear: parseFloat(dbInfo.paintwear) || 0,      // 'paintwear' not 'paintWear'
    statTrak: dbInfo.stattrak_enabled || false,   // 'stattrak_enabled'
    statTrakCount: dbInfo.stattrak_count || 0,    // 'stattrak_count'
    nameTag: dbInfo.nametag || '',                // 'nametag' not 'nameTag'
    stickers: [null, null, null, null, null],     // Default empty stickers
    keychain: null                                // Default no keychain
  }
}
```

### **Step 4: Error Handling Implementation**

#### **Standard Error Handling Pattern**
```typescript
// ✅ ALWAYS use this error handling pattern
const performOperation = async () => {
  try {
    // Clear previous errors
    state.value.error = null
    
    // Perform operation
    const result = await someAsyncOperation()
    
    // Handle success
    console.log('Operation successful:', result)
    
  } catch (error: any) {
    // Create user-friendly error message
    const errorMessage = error.message || 'Operation failed'
    
    // Update component state
    state.value.error = errorMessage
    
    // Emit error event for parent components
    emit('error', errorMessage)
    
    // Log detailed error for debugging
    console.error('Operation failed with context:', error)
    
    // Show user notification
    message.error(errorMessage)
  }
}
```

## 🧪 Testing Procedures

### **Functional Testing Checklist**

After each migration, verify:

#### **Basic Functionality**
- [ ] Component loads without TypeScript errors
- [ ] No console errors or warnings
- [ ] User interface renders correctly
- [ ] All interactive elements work

#### **Data Loading**
- [ ] Items load and display properly
- [ ] Existing saved items show correct paint index
- [ ] Database field mapping works correctly
- [ ] No "Paint Index is required" errors

#### **User Interactions**
- [ ] Save functionality works without errors
- [ ] Modal interactions function properly
- [ ] Form validation works correctly
- [ ] Error messages display appropriately

#### **Integration Testing**
- [ ] Authentication flows work correctly
- [ ] API calls succeed with proper data
- [ ] State management functions properly
- [ ] Navigation between pages works

### **TypeScript Validation**

```bash
# Run TypeScript check after each migration
npx tsc --noEmit --strict

# Check specific files
npx tsc --noEmit --skipLibCheck pages/agents/index.vue
```

### **Runtime Testing Commands**

```bash
# Start development server
npm run dev

# Run in different modes to test
npm run build    # Production build test
npm run preview  # Preview production build
```

## 🚨 Common Pitfalls and Solutions

### **Pitfall 1: Wrong Database Interface**
```typescript
// ❌ WRONG - Causes paint index bug
const dbInfo = weapon.databaseInfo as IMappedDBWeapon

// ✅ CORRECT
const dbInfo = weapon.databaseInfo as DBKnife  // Use specific interface
```

### **Pitfall 2: Incorrect Field Names**
```typescript
// ❌ WRONG - Database fields are lowercase
paintIndex: dbInfo.paintIndex || 0

// ✅ CORRECT - Use actual database field names
paintIndex: dbInfo.paintindex || 0
```

### **Pitfall 3: Missing Type Imports**
```typescript
// ❌ WRONG - Importing from wrong module
import type { WeaponConfiguration } from '~/types/business/items'

// ✅ CORRECT - Always import from main module
import type { WeaponConfiguration } from '~/types'
```

### **Pitfall 4: Breaking Backward Compatibility**
```typescript
// ❌ WRONG - Removing legacy support too early
// Remove all SteamUser references

// ✅ CORRECT - Maintain compatibility during transition
import type { UserProfile } from '~/types'
import type { SteamUser } from "~/services/steamAuth"  // Keep if needed

// Use UserProfile for new code, SteamUser for service compatibility
```

## 📝 Documentation Standards

### **JSDoc Comments**
```typescript
/**
 * Handle weapon save operation with enhanced error handling
 * 
 * @param weapon - Weapon item data to save
 * @param config - Weapon configuration settings
 * @returns Promise that resolves when save is complete
 * 
 * @example
 * ```typescript
 * await handleWeaponSave(weaponData, {
 *   active: true,
 *   paintIndex: 12,
 *   statTrak: true
 * })
 * ```
 */
const handleWeaponSave = async (
  weapon: WeaponItemData, 
  config: WeaponConfiguration
): Promise<void> => {
  // Implementation
}
```

### **Type Annotations**
```typescript
// ✅ ALWAYS provide explicit type annotations
const items = ref<WeaponItemData[]>([])
const loading = ref<boolean>(false)
const error = ref<string | null>(null)

// ✅ Use proper return types
const processItem = (item: WeaponItemData): WeaponConfiguration => {
  // Implementation
}
```

## 🔄 Migration Validation Script

Create this validation script to check your migrations:

```typescript
// migration-validator.ts
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

const validateMigration = (filePath: string) => {
  const content = readFileSync(filePath, 'utf-8')
  
  const issues: string[] = []
  
  // Check for legacy imports
  if (content.includes('~/server/utils/interfaces')) {
    issues.push('❌ Legacy import found: ~/server/utils/interfaces')
  }
  
  // Check for legacy types
  if (content.includes('WeaponCustomization')) {
    issues.push('❌ Legacy type found: WeaponCustomization')
  }
  
  if (content.includes('SteamUser') && !content.includes('services/steamAuth')) {
    issues.push('❌ Legacy type found: SteamUser (not from steamAuth)')
  }
  
  // Check for correct database interfaces
  if (content.includes('IMappedDBWeapon')) {
    issues.push('❌ Wrong database interface: IMappedDBWeapon')
  }
  
  if (issues.length === 0) {
    console.log(`✅ ${filePath} - Migration looks good!`)
  } else {
    console.log(`🚨 ${filePath} - Issues found:`)
    issues.forEach(issue => console.log(`  ${issue}`))
  }
}

// Usage: node migration-validator.ts pages/agents/index.vue
```

## 🎯 Success Criteria

A migration is complete when:

- [ ] All imports use `~/types` instead of legacy paths
- [ ] All type annotations use new type names
- [ ] Database field mappings use correct interfaces and field names
- [ ] TypeScript compilation passes without errors
- [ ] All functional tests pass
- [ ] No regression in user functionality
- [ ] Error handling follows established patterns
- [ ] JSDoc comments added for new/modified functions

## 🚀 Next Steps After Migration

1. **Update Documentation**: Add examples using the new types
2. **Create Tests**: Add type-safe test cases
3. **Performance Check**: Verify no performance regression
4. **User Testing**: Test critical user flows
5. **Code Review**: Have another developer review the changes

Remember: The goal is not just to change type names, but to leverage the enhanced type safety and error handling patterns established during the refactoring. Take time to understand the patterns and apply them consistently.
