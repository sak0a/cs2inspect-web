# Frontend Architecture <Badge type="tip" text="Modern Stack" />

Detailed documentation of the CS2Inspect frontend architecture built with Nuxt 3.

## Page Structure

```
pages/
├── index.vue           # Main dashboard/loadout management
├── status.vue          # System health status dashboard
├── weapons/
│   └── [type].vue     # Dynamic weapon customization pages
├── knifes/
│   └── index.vue      # Knife customization page
├── gloves/
│   └── index.vue      # Glove customization page
├── agents/
│   └── index.vue      # Agent selection page
├── music-kits/
│   └── index.vue      # Music kit selection page
└── pins/
    └── index.vue      # Pin collection page
```

## Component Architecture

```
components/
├── WeaponSkinModal.vue        # Weapon skin selection & customization
├── KnifeSkinModal.vue         # Knife skin selection & customization
├── GloveSkinModal.vue         # Glove skin selection & customization
├── StickerModal.vue           # Sticker application
├── KeychainModal.vue          # Keychain attachment
├── VisualCustomizerModal.vue  # Advanced visual customization
├── InspectItemDisplay.vue     # Item preview display
├── LoadoutSelector.vue        # Loadout management
├── ThemeProvider.vue          # Theme configuration
├── HealthCard.vue             # Health status card component
├── HistoryChart.vue           # Health history chart component
└── [Various Tab Components]   # Item category tabs
```

## State Management (Pinia)

### Stores

1. **`weaponsStore`** (`stores/weapons.ts`)
   - Manages weapon configurations
   - Handles weapon skin data
   - Tracks active weapon selections

2. **`loadoutStore`** (`stores/loadout.ts`)
   - Current active loadout
   - Loadout switching logic
   - Loadout CRUD operations

3. **`authStore`** (`stores/auth.ts`)
   - User authentication state
   - Steam profile information
   - Session management

4. **`itemsStore`** (`stores/items.ts`)
   - Item catalog data
   - Skin, sticker, agent data
   - Cached item information

## Composables

### Core Composables

- **`useInspectItem`** - CS2 inspect URL parsing and item data extraction
- **`useLoadout`** - Loadout management utilities
- **`useWeaponConfig`** - Weapon configuration helpers
- **`useAuth`** - Authentication utilities
- **`useApi`** - API request wrapper with auth handling

## Internationalization

**Framework**: `nuxt-i18n-micro`

**Supported Languages**:
- English (EN) - Default
- German (DE)
- Russian (RU)

**Translation Files**: `locales/` directory
- `en.json` - English translations
- `de.json` - German translations
- `ru.json` - Russian translations

**Usage**:
```vue
<template>
  <div>{{ $t('nav.weapons') }}</div>
</template>
```

**Adding New Languages**: See [Contributing Guide](contributing.md#internationalization)

## Styling

### CSS Architecture

- **Framework**: Tailwind CSS
- **Preprocessor**: SASS/SCSS
- **Component Styles**: Scoped styles in `.vue` files
- **Global Styles**: `assets/css/` directory
  - `theme-variables.css` - CSS custom properties
  - `glassmorphism.css` - Glass effect utilities
  - `animations.css` - Animation definitions

### Theme Customization

**Dark Theme**: Default and forced mode
- Background: `#121212`, `#1a1a1a`, `#242424`
- Accent: `#FACC15` (yellow/gold)
- Hover: `#F59E0B`, `#CA8A04`

**Naive UI Theme Overrides**: `components/ThemeProvider.vue`

See: [Theme Customization Guide](theme-customization.md)

## UI Components

**Library**: Naive UI

**Key Components Used**:
- `n-modal` - Modal dialogs
- `n-select` - Dropdowns and selects
- `n-input` - Text inputs
- `n-button` - Buttons
- `n-tabs` - Tab navigation
- `n-card` - Card containers
- `n-data-table` - Data tables
- `n-message` - Toast notifications

## Visual Customizer

**Technology**: HTML5 Canvas API

**Features**:
- Drag-and-drop sticker placement
- Rotation and scaling controls
- Real-time preview
- Export to configuration

**Implementation**: `components/VisualCustomizerModal.vue`

## Client-Side Routing

**Framework**: Nuxt 3 file-based routing

**Routes**:
- `/` - Main dashboard
- `/weapons/:type` - Weapon customization (dynamic)
- `/knifes` - Knife customization
- `/gloves` - Glove customization
- `/agents` - Agent selection
- `/music-kits` - Music kit selection
- `/pins` - Pin collection
- `/status` - Health status dashboard

## Performance Optimizations

### Code Splitting

Nuxt automatically splits code by:
- Page-level chunks
- Component lazy loading
- Dynamic imports

### Image Optimization

- CDN delivery for skin images
- Lazy loading with IntersectionObserver
- Responsive images with `srcset`
- WebP format when supported

### Caching Strategy

- API responses cached in Pinia stores
- LocalStorage for user preferences
- Session storage for temporary data

## Related Documentation

- **[Backend Architecture](architecture-backend.md)** - Server-side architecture
- **[Architecture Overview](architecture.md)** - System overview
- **[Components Guide](components.md)** - Component reference
- **[Theme Customization](theme-customization.md)** - Styling guide
