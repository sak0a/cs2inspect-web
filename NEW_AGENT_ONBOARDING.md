# CS2Inspect Web Application - New AI Agent Onboarding

## 🎯 Welcome to CS2Inspect

You are now working on **CS2Inspect**, a sophisticated web application for Counter-Strike 2 players to customize and manage their in-game item loadouts. This application handles weapons, knives, gloves, agents, music kits, and pins with comprehensive customization options including skins, StatTrak counters, stickers, keychains, and more.

## 🏗️ Current Project State

### **Major Achievement: TypeScript Refactoring Complete**

The project has just completed a comprehensive TypeScript interface refactoring (Phases 1-4) that modernized the entire type system. **This is the most important context for your work.**

#### **What's Been Accomplished**
- ✅ **New Type System**: Complete `~/types` module with organized, documented interfaces
- ✅ **Modal Components**: WeaponSkinModal, KnifeSkinModal, GloveSkinModal fully migrated
- ✅ **Critical Bug Fixed**: Paint index initialization issue resolved
- ✅ **Database Validation**: All field mappings corrected and validated
- ✅ **Backward Compatibility**: 100% maintained through type aliases
- ✅ **Documentation**: Comprehensive guides and references created

#### **Current Status**
- **Core System**: ✅ Complete and production-ready
- **Modal Components**: ✅ Fully migrated with enhanced error handling
- **Page Components**: 🚧 Partial migration - **THIS IS YOUR PRIMARY FOCUS**
- **Server Handlers**: 🚧 Mixed legacy/new type usage
- **Legacy Cleanup**: 📋 Planned for future phases

## 🎯 Your Primary Mission

**FOCUS**: Complete the type consistency migration across all page components and remaining files.

### **Immediate Priorities**

1. **Page Component Migration** (High Priority)
   - `pages/agents/index.vue` - Uses legacy `SteamUser`, `APIAgent`
   - `pages/weapons/[type].vue` - Uses legacy `WeaponCustomization`
   - `pages/knifes/index.vue` - Uses legacy `KnifeCustomization`
   - `pages/gloves/index.vue` - Needs audit and potential migration

2. **Type Consistency Enforcement**
   - Replace `*Customization` with `*Configuration` types
   - Update `SteamUser` to `UserProfile`
   - Change imports from `~/server/utils/interfaces` to `~/types`

## 🧠 Critical Knowledge - Paint Index Bug Context

**EXTREMELY IMPORTANT**: A critical bug was recently fixed that you must understand:

### **The Bug**
- **Problem**: KnifeSkinModal and GloveSkinModal couldn't save existing items
- **Symptom**: "Paint Index is required" API errors
- **Root Cause**: Wrong database field mapping during refactoring

### **The Fix**
```typescript
// ❌ WRONG (caused the bug)
const dbInfo = props.weapon.databaseInfo as IMappedDBWeapon
paintIndex: dbInfo.paintIndex || 0  // Field doesn't exist!

// ✅ CORRECT (fixed)
const dbInfo = props.weapon.databaseInfo as DBKnife  // Correct interface
paintIndex: dbInfo.paintindex || 0  // Correct field name (lowercase)
```

### **Key Lesson**
**ALWAYS** use the correct database interface and field names:
- Database fields are **lowercase**: `paintindex`, `paintseed`, `paintwear`
- Interface properties are **camelCase**: `paintIndex`, `pattern`, `wear`
- Use `DBKnife` for knives, `DBGlove` for gloves, not `IMappedDBWeapon`

## 📋 Coding Standards You Must Follow

### **1. Import Patterns**
```typescript
// ✅ ALWAYS DO THIS
import type { WeaponConfiguration, APIWeaponSkin, UserProfile } from '~/types'

// ❌ NEVER DO THIS
import type { WeaponCustomization, APISkin, SteamUser } from '~/server/utils/interfaces'
import type { WeaponConfiguration } from '~/types/business/items'  // Wrong path
```

### **2. Type Migration Mapping**
| Legacy Type | New Type | Usage |
|-------------|----------|-------|
| `SteamUser` | `UserProfile` | User authentication |
| `WeaponCustomization` | `WeaponConfiguration` | Weapon settings |
| `KnifeCustomization` | `KnifeConfiguration` | Knife settings |
| `GloveCustomization` | `GloveConfiguration` | Glove settings |
| `APISkin` | `APIWeaponSkin` | API skin data |
| `IEnhancedWeapon` | `WeaponItemData` | Weapon display data |

### **3. Database Field Mapping**
```typescript
// ✅ CORRECT - Always use proper database interfaces
const dbInfo = props.weapon.databaseInfo as DBKnife  // Not IMappedDBWeapon!

customization.value = {
  paintIndex: dbInfo.paintindex || 0,           // lowercase 'paintindex'
  pattern: parseInt(dbInfo.paintseed) || 0,     // 'paintseed' not 'pattern'
  wear: parseFloat(dbInfo.paintwear) || 0,      // 'paintwear' not 'paintWear'
  statTrak: dbInfo.stattrak_enabled || false,   // 'stattrak_enabled'
  statTrakCount: dbInfo.stattrak_count || 0,    // 'stattrak_count'
  nameTag: dbInfo.nametag || ''                 // 'nametag' not 'nameTag'
}
```

### **4. Error Handling Pattern**
```typescript
// ✅ ALWAYS USE THIS PATTERN
try {
  state.value.error = null
  // ... operation
} catch (error: any) {
  const errorMessage = error.message || 'Operation failed'
  state.value.error = errorMessage
  emit('error', errorMessage)
  console.error('Context:', error)
}
```

## 🛠️ Development Workflow

### **Before Making Changes**
1. **Read the documentation**: Check `types/README.md` and `QUICK_REFERENCE.md`
2. **Understand the component**: Look at successfully migrated components as examples
3. **Check for similar patterns**: WeaponSkinModal, KnifeSkinModal, GloveSkinModal are your templates

### **When Migrating Components**
1. **Update imports first**: Change to `~/types` imports
2. **Update type annotations**: Use new type names
3. **Fix database field mappings**: Use correct interfaces and field names
4. **Test thoroughly**: Ensure no functionality is broken
5. **Maintain backward compatibility**: Don't break existing functionality

### **Testing Checklist**
- [ ] TypeScript compilation passes
- [ ] Component loads without errors
- [ ] Existing items load correctly (paint index populated)
- [ ] Save functionality works without manual reselection
- [ ] Error handling displays user-friendly messages
- [ ] No type-related console warnings

## 🚨 Critical Warnings

### **DO NOT**
- ❌ Use `IMappedDBWeapon` for knives/gloves (use `DBKnife`/`DBGlove`)
- ❌ Import from `~/types/business/items` directly (use `~/types`)
- ❌ Use uppercase database field names (`paintIndex` → use `paintindex`)
- ❌ Break backward compatibility without explicit approval
- ❌ Skip testing after making type changes

### **ALWAYS**
- ✅ Import from `~/types` main module
- ✅ Use correct database interfaces for each item type
- ✅ Use lowercase database field names
- ✅ Test paint index loading for existing items
- ✅ Follow the established error handling patterns
- ✅ Add JSDoc comments for new functions

## 📚 Essential Documentation

**Must Read**:
- `PROJECT_STATE_README.md` - Current project state
- `types/README.md` - Complete type system documentation
- `QUICK_REFERENCE.md` - Developer cheat sheet
- `TYPESCRIPT_REFACTORING_GUIDE.md` - Migration examples

**Reference Components**:
- `components/WeaponSkinModal.vue` - Complete migration example
- `components/KnifeSkinModal.vue` - Database field mapping example
- `components/GloveSkinModal.vue` - Simplified configuration example

## 🎯 Success Criteria

You'll know you're succeeding when:
- ✅ All imports use `~/types` instead of legacy paths
- ✅ All `*Customization` types are replaced with `*Configuration`
- ✅ All `SteamUser` references become `UserProfile`
- ✅ TypeScript compilation passes without errors
- ✅ Existing functionality works without regression
- ✅ Paint index loads correctly for existing items

## 🤝 Getting Help

If you encounter issues:
1. **Check the QUICK_REFERENCE.md** for common patterns
2. **Look at migrated components** for examples
3. **Verify database field mappings** against the documentation
4. **Test with existing items** to ensure paint index loading works

Remember: The foundation is solid. Your job is to complete the consistency migration while maintaining the high quality standards established during the refactoring. Focus on type consistency, proper database field mapping, and thorough testing.

**Welcome to the team! Let's finish this migration and make CS2Inspect even better.** 🚀
