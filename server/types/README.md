# Types Directory

This directory contains centralized type definitions for the CS2Inspect web application, following enterprise-level project organization patterns.

## Structure

```
server/types/
├── index.ts          # Main export file - import all types from here
├── api.ts            # API response and CS2 item interfaces
├── common.ts         # Common types used across the application
├── database.ts       # Database record interfaces
├── items.ts          # Item customization and enhanced item interfaces
├── classes.ts        # Class implementations (EnhancedWeaponSticker, etc.)
├── inspect.ts        # Inspect API specific types
└── README.md         # This file
```

## Usage

### Importing Types

**Recommended approach** - Import from the main index file:

```typescript
import type { 
  ItemType, 
  InspectRequest, 
  CreateUrlResponse,
  SteamUser,
  WeaponCustomization 
} from '~/server/types'
```

**Alternative approach** - Import from specific files:

```typescript
import type { ItemType, InspectRequest } from '~/server/types/inspect'
import type { SteamUser } from '~/server/types/common'
```

### Type Categories

#### API Types (`api.ts`)
- **Response Interfaces**: `BaseAPIResponse`, `PaginatedAPIResponse`, `CollectionAPIResponse`
- **Metadata Types**: `PaginationMeta`, `ResponseMeta`, `ErrorInfo`
- **Item Interfaces**: `APISkin`, `APISticker`, `APIAgent`, `APIMusicKit`, `APIKeychain`
- **Shared Types**: `ItemRarity`, `ItemTeam`, `BaseAPIItem`
- **Enums**: `CsTeam`

#### Common Types (`common.ts`)
- **Steam Types**: `SteamUser`
- **API Response Types**: `ApiResponse`, `PaginatedResponse`
- **Item Types**: `BaseItem`, `EnhancedItem`
- **Customization Types**: `WeaponCustomization`, `KnifeCustomization`, `GloveCustomization`
- **Utility Types**: `ID`, `Callback`, `Optional`, `RequiredFields`

#### Database Types (`database.ts`)
- **Base Interfaces**: `BaseDBRecord`, `BaseDBItem`
- **Specific Records**: `DBWeapon`, `DBKnife`, `DBGlove`, `DBLoadout`
- **Other Records**: `DBAgent`, `DBMusicKit`, `DBPin`

#### Item Types (`items.ts`)
- **Customization Interfaces**: `WeaponStickerCustomization`, `WeaponKeychainCustomization`
- **Enhanced Items**: `IEnhancedWeapon`, `IEnhancedKnife`, `IEnhancedGlove`
- **Weapon Components**: `IEnhancedWeaponSticker`, `IEnhancedWeaponKeychain`

#### Classes (`classes.ts`)
- **Enhanced Classes**: `EnhancedWeaponSticker`, `EnhancedWeaponKeychain`
- **Database Conversion**: Methods for converting to/from database strings

#### Inspect API Types (`inspect.ts`)
- **Action Types**: `ItemType`, `InspectAction`, `UrlType`
- **Request Interfaces**: `CreateUrlRequest`, `InspectUrlRequest`, `DecodeHexRequest`
- **Response Interfaces**: `CreateUrlResponse`, `InspectItemResponse`, `ValidateUrlResponse`
- **Configuration Types**: `ItemTypeConfig`, `ItemTypeConfigMap`

## Benefits

### 1. **Centralized Type Management**
- All types in one location for easy maintenance
- Consistent naming conventions across the application
- Single source of truth for type definitions

### 2. **Better Developer Experience**
- IntelliSense support with proper type hints
- Compile-time error checking
- Easier refactoring with TypeScript's rename functionality

### 3. **Scalability**
- Easy to add new type files as the application grows
- Clear separation of concerns between different type categories
- Follows enterprise patterns used in large-scale applications

### 4. **Import Consistency**
- Single import point reduces import statement complexity
- Easier to track type usage across the codebase
- Prevents circular dependency issues

## Adding New Types

### 1. Create a new type file
```typescript
// server/types/newFeature.ts
export interface NewFeatureType {
  id: string
  name: string
}
```

### 2. Export from index.ts
```typescript
// server/types/index.ts
export type { NewFeatureType } from './newFeature'
```

### 3. Use in your code
```typescript
import type { NewFeatureType } from '~/server/types'
```

## Best Practices

### 1. **Naming Conventions**
- Use PascalCase for interfaces and types
- Use descriptive names that clearly indicate the purpose
- Prefix with the feature name for feature-specific types

### 2. **Documentation**
- Add JSDoc comments for complex types
- Include usage examples for non-obvious types
- Document any constraints or validation rules

### 3. **Organization**
- Group related types together
- Use clear section headers with comments
- Keep files focused on a single domain

### 4. **Backwards Compatibility**
- Use `Optional<T, K>` helper for making properties optional
- Avoid breaking changes to existing interfaces
- Use union types for extending functionality

## Examples

### API Endpoint with Types
```typescript
import type { 
  InspectRequest, 
  CreateUrlResponse, 
  ItemType 
} from '~/server/types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as InspectRequest
  const itemType: ItemType = body.itemType || 'weapon'
  
  // ... implementation
  
  return {
    success: true,
    inspectUrl: 'steam://...',
    itemType
  } as CreateUrlResponse
})
```

### Frontend Component with Types
```typescript
import type { 
  WeaponCustomization, 
  SteamUser, 
  EnhancedItem 
} from '~/server/types'

interface Props {
  weapon: EnhancedItem
  user: SteamUser
  customization: WeaponCustomization
}
```

This type organization follows patterns used in large-scale applications like those at Google, Microsoft, and other tech companies, providing a solid foundation for application growth and maintenance.
