# CS2 Loadout Manager

A comprehensive web application for managing Counter-Strike 2 weapon loadouts, built with Nuxt 3 and modern web technologies.

![CS2 Loadout Manager](https://example.com/cs2-loadout-manager-preview.png)

## 🚀 Overview

CS2 Loadout Manager is a full-stack web application that provides Counter-Strike 2 players with a comprehensive tool for creating, managing, and customizing their weapon loadouts. The application features Steam authentication, real-time data synchronization with CS2 APIs, and an intuitive interface for weapon customization.

### Key Features

- **Multi-Loadout Management**: Create and manage multiple weapon loadouts
- **Comprehensive Customization**: Configure weapons, knives, gloves, agents, music kits, and pins
- **Team-Specific Equipment**: Separate configurations for Terrorist and Counter-Terrorist sides
- **Steam Integration**: Secure authentication via Steam OpenID
- **Real-time Data**: Automatic synchronization with CS2 item databases
- **Inspect Link Support**: Import items directly from CS2 inspect links
- **Internationalization**: Multi-language support (English, German, Russian)
- **Responsive Design**: Optimized for desktop and mobile devices
- **Advanced Customization**: Sticker positioning, wear values, StatTrak counters, and name tags

## 🛠️ Tech Stack

### Frontend
- **[Nuxt 3](https://nuxt.com/)** - Vue.js framework with SSR/SSG capabilities
- **[Vue 3](https://vuejs.org/)** - Progressive JavaScript framework with Composition API
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Sass](https://sass-lang.com/)** - CSS preprocessor for advanced styling
- **[Naive UI](https://www.naiveui.com/)** - Vue 3 component library
- **[Pinia](https://pinia.vuejs.org/)** - State management for Vue
- **[VueUse](https://vueuse.org/)** - Collection of Vue composition utilities
- **[Iconify](https://iconify.design/)** - Unified icon framework

### Backend
- **[Nitro](https://nitro.unjs.io/)** - Universal web server (built into Nuxt 3)
- **[H3](https://github.com/unjs/h3)** - Minimal HTTP framework
- **[MariaDB](https://mariadb.org/)** - Relational database management system
- **[JWT](https://jwt.io/)** - JSON Web Tokens for authentication
- **[Steam OpenID](https://steamcommunity.com/dev)** - Steam authentication integration

### Development & Build Tools
- **[Vite](https://vitejs.dev/)** - Fast build tool and development server
- **[ESLint](https://eslint.org/)** - JavaScript/TypeScript linting
- **[Vitest](https://vitest.dev/)** - Unit testing framework
- **[Playwright](https://playwright.dev/)** - End-to-end testing
- **[Bun](https://bun.sh/)** - JavaScript runtime and package manager

### External APIs & Services
- **[CS:GO API](https://bymykel.github.io/CSGO-API/)** - CS2 item data and images
- **[Steam Web API](https://steamcommunity.com/dev)** - Steam user data and authentication
- **[GlobalOffensive Node.js](https://github.com/DoctorMcKay/node-globaloffensive)** - CS2 game coordinator integration

### Additional Libraries
- **[Axios](https://axios-http.com/)** - HTTP client for API requests
- **[Node Cache](https://github.com/node-cache/node-cache)** - In-memory caching
- **[Auto-animate](https://auto-animate.formkit.com/)** - Smooth animations
- **[Class Variance Authority](https://cva.style/docs)** - CSS class management
- **[Date-fns](https://date-fns.org/)** - Date utility library

## 📁 Project Structure

```
cs2inspect-web/
├── 📁 assets/                    # Static assets (CSS, JS, SVG)
│   ├── css/                      # Stylesheets (Sass/CSS)
│   ├── js/                       # JavaScript utilities
│   └── svg/                      # SVG icons and graphics
├── 📁 components/                # Vue components
│   ├── AgentTabs.vue            # Agent selection interface
│   ├── *SkinModal.vue           # Weapon/knife/glove customization modals
│   ├── *Tabs.vue                # Tab navigation components
│   └── ...                      # Other reusable components
├── 📁 composables/               # Vue composables
│   ├── useInspectItem.ts        # Inspect link handling
│   └── useItems.ts              # Item management utilities
├── 📁 layouts/                   # Nuxt layouts
│   └── default.vue              # Main application layout
├── 📁 locales/                   # Internationalization files
│   ├── en.json                  # English translations
│   ├── de.json                  # German translations
│   └── ru.json                  # Russian translations
├── 📁 middleware/                # Route middleware
│   └── validate-weapon-url.ts   # URL validation
├── 📁 pages/                     # Nuxt pages (file-based routing)
│   ├── agents/                  # Agent selection page
│   ├── auth/                    # Authentication pages
│   ├── gloves/                  # Glove customization
│   ├── knifes/                  # Knife customization
│   ├── music-kits/              # Music kit selection
│   ├── pins/                    # Pin selection
│   ├── weapons/                 # Weapon customization
│   └── index.vue                # Home page
├── 📁 server/                    # Server-side code
│   ├── api/                     # API endpoints
│   ├── database/                # Database configuration and schemas
│   ├── middleware/              # Server middleware (auth, CORS, etc.)
│   ├── plugins/                 # Server plugins (initialization)
│   └── utils/                   # Server utilities and constants
├── 📁 services/                  # Service layer
│   └── steamAuth.ts             # Steam authentication service
├── 📁 storage/                   # File storage
│   └── csgo-api/                # Cached CS2 API data
├── 📁 stores/                    # Pinia stores
│   └── loadoutStore.ts          # Loadout state management
├── 📁 utils/                     # Client-side utilities
│   ├── colors.ts                # Color utilities
│   └── menuConfig.ts            # Menu configuration
├── nuxt.config.ts               # Nuxt configuration
├── package.json                 # Dependencies and scripts
├── tailwind.config.ts           # Tailwind CSS configuration
└── tsconfig.json                # TypeScript configuration
```

## 🔄 Application Flow

### Server-side
1. **Initialization**: Fetches latest CS2 item data from the [CSGO-API](https://bymykel.github.io/CSGO-API/)
2. **Authentication**: Handles Steam authentication and user sessions
3. **Database**: Manages user loadouts and weapon configurations

### Client-side
1. **Authentication**: User logs in via Steam
2. **Loadout Management**:
   - Fetches user loadouts from `/api/loadouts?steamid=[id]`
   - Displays loadout selection interface
3. **Weapon Customization**:
   - Fetches weapon data for selected loadout via `/api/weapons/[type]?loadoutid=[id]&steamid=[id]`
   - Provides interface for skin, sticker, and keychain selection

## 📊 Data Models

### Core Interfaces

#### APISkin
Represents weapon skins from the CS2 API:

```typescript
interface APISkin {
    id: string;
    name: string;
    description?: string;
    weapon: {
        id: string;
        name: string;
        weapon_id: string;
    }
    category: {
        id: string;
        name: string
    }
    pattern: {
        id: string;
        name: string;
    }
    min_float: number;
    max_float: number;
    rarity: {
        id: string;
        name: string;
        color: string;
    }
    stattrak?: boolean
    souvenir?: boolean
    paint_index: string
    wears?: any[]
    collections?: any[]
    crates?: any[]
    team?: {
        id: string;
        name: string;
    }
    image: string;
}
```

#### APISticker
Represents stickers from the CS2 API:

```typescript
interface APISticker {
    id: string;
    name: string;
    description?: string;
    rarity: {
        id: string;
        name: string;
        color: string
    }
    crates?: any[]
    tournament_event: string
    tournament_team: string
    type: string
    market_hash_name?: string
    effect?: string
    image: string
}
```

#### APIKeychain
Represents weapon charms from the CS2 API:

```typescript
interface APIKeychain {
    id: string;
    name: string;
    description?: string;
    rarity: {
        id: string;
        name: string;
        color: string;
    }
    market_hash_name?: string;
    image: string;
}
```

#### APIMusicKit
Represents music kits from the CS2 API:

```typescript
interface APIMusicKit {
    id: string
    name: string
    description?: string
    rarity: {
        id: string
        name: string
        color: string
    }
    market_hash_name?: string
    exclusive?: boolean
    image: string
}
```

#### APIAgent
Represents player models from the CS2 API:

```typescript
interface APIAgent {
  id: string;
  name: string;
  description?: string;
  rarity: {
    id: string;
    name: string;
    color: string;
  }
  collections?: any[];
  team: {
    id: string;
    name: string;
  }
  market_hash_name?: string;
  image: string;
}
```

#### DBLoadout
Represents a user's loadout in the database:

```typescript
interface DBLoadout {
    id: string;
    steamid: string;
    name: string;
    selected_knife_t: number | null;
    selected_knife_ct: number | null;
    selected_glove_t: number | null;
    selected_glove_ct: number | null;
    created_at: string;
    updated_at: string;
}
```

#### DBKnife
Represents a user's knife entry in the database:

```typescript
interface DBKnife {
    id: string;
    steamid: string;
    loadoutid: string;
    active: boolean;
    team: number;
    defindex: number;
    paintindex: number;
    paintseed: string;
    paintwear: string;
    stattrak_enabled: boolean;
    stattrak_count: number;
    nametag: string;
    created_at: string;
    updated_at: string;
}
```

#### DBGlove
Represents a user's glove entry in the database:

```typescript
interface DBGlove {
    id: string;
    steamid: string;
    loadoutid: string;
    active: boolean;
    team: number;
    defindex: number;
    paintindex: number;
    paintseed: string;
    paintwear: string;
    created_at: string;
    updated_at: string;
}
```

#### DBWeapon
Represents a user's weapon entry in the database:

```typescript
interface DBWeapon {
    id: string;
    steamid: string;
    loadoutid: string;
    active: boolean;
    team: number;
    defindex: number;
    paintindex: number;
    paintseed: string;
    paintwear: string;
    stattrak_enabled: boolean;
    stattrak_count: number;
    nametag: string;
    sticker_0: string;
    sticker_1: string;
    sticker_2: string;
    sticker_3: string;
    sticker_4: string;
    keychain: string;
    created_at: string;
    updated_at: string;
}
```

#### DBPin
Represents a user's pin entry in the database:

```typescript
interface DBPin {
    id: string;
    steamid: string;
    loadoutid: string;
    active: boolean
    team: number
    pinid: number;
    created_at: string;
    updated_at: string;
}
```

#### DBMusicKit
Represents a user's music kit entry in the database:

```typescript
interface DBMusicKit {
    id: string;
    steamid: string;
    loadoutid: string;
    active: boolean
    team: number;
    musicid: number;
    created_at: string;
    updated_at: string;
}
```

#### DBAgent
Represents a user's agent entry in the database:

```typescript
interface DBAgent {
    id: string;
    steamid: string;
    loadoutid: string;
    active: boolean
    team: number;
    defindex: number;
    agent_name: string;
    created_at: string;
    updated_at: string;
}
```


### Frontend Data Structures

### StickerData
Represents a sticker applied to a weapon:

```typescript
interface IEnhancedWeaponSticker {
  id: number;
  x: number;
  y: number;
  wear: number;
  scale: number;
  rotation: number;
  api: {
    name: string;
    type: string;
    image: string;
    effect: string;
    rarity: {
      name: string;
      id: string;
      color: string;
    };
    tournament_team: string;
    tournament_event: string;
  };
}
```

### KeychainData
Represents a keychain attached to a weapon:

```typescript
interface IEnhancedWeaponKeychain {
  id: number;
  x: number;
  y: number;
  z: number;
  seed: number;
  api: {
    name: string;
    image: string;
    rarity: {
      name: string;
      id: string;
      color: string;
    };
  };
}
```

### WeaponData
`IMappedDBWeapon` represents a weapon's database information with mapped Keychain and Sticker data:
```typescript
interface IMappedDBWeapon {
  active: boolean;
  team: number;
  defindex: number;
  statTrak: boolean;
  statTrakCount: number;
  paintIndex: number;
  paintWear: number;
  pattern: number;
  nameTag: string;
  stickers: any;
  keychain: IEnhancedWeaponKeychain | null;
}
```

`IDefaultItem` represents default weapon information used from `/server/utils/constants.ts` to display default weapons
```ts
interface IDefaultItem {
  weapon_defindex: number;
  defaultName: string;
  paintIndex: number;
  defaultImage: string;
  weapon_name: string;
  category: string;
  availableTeams: string;
}
```

`IEnhancedItem` extends `IDefaultItem` and uses `DBKnife` or `IMappedDBWeapon` or `DBGlove` for database information:
```typescript
interface IEnhancedItem extends IDefaultItem {
  name: string;
  image: string;
  minFloat: number;
  maxFloat: number;
  rarity?: {
    name: string;
    id: string;
    color: string;
  };
  databaseInfo?: DBKnife | IEnha | IMappedDBWeapon;
}
```

## 🗄️ Database Structure

The application uses the following database tables:

| Table | Description |
|-------|-------------|
| `wp_player_loadouts` | Stores user loadout configurations |
| `wp_player_knifes` | Knife configurations for each loadout |
| `wp_player_gloves` | Glove configurations for each loadout |
| `wp_player_rifles` | Rifle configurations for each loadout |
| `wp_player_smgs` | SMG configurations for each loadout |
| `wp_player_pistols` | Pistol configurations for each loadout |
| `wp_player_heavys` | Heavy weapon configurations for each loadout |
| `wp_player_agents` | Agent (player model) configurations |
| `wp_player_pins` | Pin configurations |
| `wp_player_music` | Music kit configurations |

## 🔌 API Endpoints

All endpoints require authentication.

### Loadout Management

#### `GET /api/loadouts?steamId=[id]`
Fetches all loadouts for a user.

**Response:**
```json
{
  "loadouts": [
    {
      "id": 1,
      "steamid": "1234567890",
      "name": "Example Name",
      "selected_knife_t": 500,
      "selected_knife_ct": 505,
      "selected_glove_t": null,
      "selected_glove_ct": null,
      "created_at": "2025-01-30T15:48:11.000Z",
      "updated_at": "2025-03-15T01:20:21.000Z"
    }
  ],
  "message": "Loadouts fetched successfully!"
}
```

#### `POST /api/loadouts?steamId=[id]`
Creates a new loadout.

**Request:**
```json
{
  "name": "Example Name"
}
```

**Response:**
```json
{
  "loadout": {
    "id": 1,
    "steamid": "1234567890",
    "name": "Example Name",
    "selected_knife_t": 500,
    "selected_knife_ct": 505,
    "selected_glove_t": null,
    "selected_glove_ct": null,
    "created_at": "2025-01-30T15:48:11.000Z",
    "updated_at": "2025-03-15T01:20:21.000Z"
  },
  "message": "Loadout created successfully"
}
```

#### `PUT /api/loadouts?steamId=[id]&id=[id]`
Updates a loadout (currently only name updates are supported).

**Request:**
```json
{
  "name": "New Name"
}
```

**Response:**
```json
{
  "loadout": {
    "id": 1,
    "steamid": "1234567890",
    "name": "New Name",
    "selected_knife_t": 500,
    "selected_knife_ct": 505,
    "selected_glove_t": null,
    "selected_glove_ct": null,
    "created_at": "2025-01-30T15:48:11.000Z",
    "updated_at": "2025-03-15T01:20:21.000Z"
  },
  "message": "Loadout updated successfully"
}
```

#### `DELETE /api/loadouts?steamId=[id]&id=[id]`
Deletes a loadout.

**Response:**
```json
{
  "message": "Loadout deleted successfully"
}
```

#### `POST /api/loadouts/select?steamId=[id]&loadoutId=[id]&type=[type]`
Updates the selected knife/glove for a loadout.

**Request:**
```json
{
  "team": 1,  // 1 = Terrorists, 2 = Counter Terrorists
  "defindex": 503  // Weapon defindex, or null to unselect
}
```

### Knives Management

#### `GET /api/knifes?steamId=[id]&loadoutId=[id]`
Fetches all knives for a specific loadout.

**Response:**
```json
{
  "knifes": [
    {
      "weapon_defindex": 500,
      "defaultName": "Bayonet",
      "paintIndex": 38,
      "defaultImage": "https://example.com/bayonet.png",
      "weapon_name": "Bayonet",
      "category": "knife",
      "availableTeams": "both",
      "name": "Bayonet | Fade",
      "image": "https://example.com/bayonet_fade.png",
      "minFloat": 0.01,
      "maxFloat": 0.08,
      "rarity": {
        "name": "Covert",
        "id": "covert",
        "color": "#eb4b4b"
      },
      "databaseInfo": {
        "active": true,
        "team": 1,
        "defindex": 500,
        "paintIndex": 38,
        "pattern": 661,
        "wear": 0.01,
        "statTrak": true,
        "statTrakCount": 1337,
        "nameTag": "My Knife"
      }
    }
  ]
}
```



#### `POST /api/knifes/save?steamId=[id]&loadoutId=[id]`
Saves or updates a knife configuration.

**Request:**
```json
{
  "defindex": 500,
  "active": true,
  "paintIndex": 38,
  "wear": 0.01,
  "pattern": 661,
  "statTrak": true,
  "statTrakCount": 1337,
  "nameTag": "My Knife",
  "team": 1,
  "reset": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Knifes updated successfully"
}
```

### Gloves Management

#### `GET /api/gloves?steamId=[id]&loadoutId=[id]`
Fetches all gloves for a specific loadout.

**Response:**
```json
{
  "knifes": [
    {
      "weapon_defindex": 5027,
      "defaultName": "Specialist Gloves",
      "paintIndex": 10006,
      "defaultImage": "https://example.com/specialist_gloves.png",
      "weapon_name": "Specialist Gloves",
      "category": "glove",
      "availableTeams": "both",
      "name": "Specialist Gloves | Crimson Kimono",
      "image": "https://example.com/specialist_gloves_crimson.png",
      "minFloat": 0.06,
      "maxFloat": 0.8,
      "rarity": {
        "name": "Extraordinary",
        "id": "extraordinary",
        "color": "#eb4b4b"
      },
      "databaseInfo": {
        "active": true,
        "team": 1,
        "defindex": 5027,
        "paintIndex": 10006,
        "pattern": 661,
        "wear": 0.15
      }
    }
  ]
}
```

#### `POST /api/gloves/save?steamId=[id]&loadoutId=[id]`
Saves or updates a glove configuration.

**Request:**
```json
{
  "defindex": 5027,
  "active": true,
  "paintIndex": 10006,
  "wear": 0.15,
  "pattern": 661,
  "team": 1,
  "reset": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Gloves updated successfully"
}
```

### Weapons Management

#### `GET /api/weapons/[type]?steamId=[id]&loadoutId=[id]`
Fetches weapons of a specific type (rifles, pistols, smgs, heavys) for a loadout.

**Response:**
```json
{
  "weapons": [
    {
      "weapon_defindex": 7,
      "defaultName": "AK-47",
      "paintIndex": 490,
      "defaultImage": "https://example.com/ak47.png",
      "weapon_name": "AK-47",
      "category": "rifle",
      "availableTeams": "t",
      "name": "AK-47 | Asiimov",
      "image": "https://example.com/ak47_asiimov.png",
      "minFloat": 0.05,
      "maxFloat": 0.7,
      "rarity": {
        "name": "Covert",
        "id": "covert",
        "color": "#eb4b4b"
      },
      "databaseInfo": {
        "active": true,
        "team": 1,
        "defindex": 7,
        "paintIndex": 490,
        "pattern": 661,
        "wear": 0.05,
        "statTrak": true,
        "statTrakCount": 1337,
        "nameTag": "My AK",
        "stickers": [
          {
            "id": 4,
            "x": 0,
            "y": 0,
            "wear": 0,
            "scale": 1,
            "rotation": 0,
            "api": {
              "name": "Sticker | Crown (Foil)",
              "type": "sticker",
              "image": "https://example.com/crown_foil.png",
              "effect": "foil",
              "rarity": {
                "name": "Extraordinary",
                "id": "extraordinary",
                "color": "#eb4b4b"
              },
              "tournament_team": "",
              "tournament_event": ""
            }
          }
        ],
        "keychain": {
          "id": 4187,
          "x": 0,
          "y": 0,
          "z": 0,
          "seed": 0,
          "api": {
            "name": "Chicken Capsule",
            "image": "https://example.com/chicken_capsule.png",
            "rarity": {
              "name": "Extraordinary",
              "id": "extraordinary",
              "color": "#eb4b4b"
            }
          }
        }
      }
    }
  ]
}
```

#### `POST /api/weapons/save?steamId=[id]&loadoutId=[id]`
Saves or updates a weapon configuration.

**Request:**
```json
{
  "defindex": 7,
  "active": true,
  "paintIndex": 490,
  "wear": 0.05,
  "pattern": 661,
  "statTrak": true,
  "statTrakCount": 1337,
  "nameTag": "My AK",
  "team": 1,
  "stickers": [
    {
      "slot": 0,
      "stickerId": 4,
      "wear": 0,
      "scale": 1,
      "rotation": 0
    }
  ],
  "keychain": {
    "id": 4187,
    "seed": 0
  },
  "reset": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Weapon updated successfully"
}
```

## 🔧 Environment Configuration

The application requires several environment variables to function properly. Create a `.env` file in the root directory:

```bash
# Server Configuration
PORT=3000
HOST=127.0.0.1

# JWT Configuration (Required)
JWT_TOKEN=your-super-secret-jwt-key-here
JWT_EXPIRY=7d

# Database Configuration (Required)
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=your-db-user
DATABASE_PASSWORD=your-db-password
DATABASE_NAME=cs2inspect
DATABASE_CONNECTION_LIMIT=5

# Steam API (Optional - for enhanced features)
STEAM_API_KEY=your-steam-api-key
```

### Environment Variables Explained

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 3000 |
| `HOST` | Server host | No | 127.0.0.1 |
| `JWT_TOKEN` | Secret key for JWT tokens | Yes | - |
| `JWT_EXPIRY` | JWT token expiration time | No | 7d |
| `DATABASE_HOST` | Database server host | Yes | - |
| `DATABASE_PORT` | Database server port | No | 3306 |
| `DATABASE_USER` | Database username | Yes | - |
| `DATABASE_PASSWORD` | Database password | Yes | - |
| `DATABASE_NAME` | Database name | Yes | - |
| `DATABASE_CONNECTION_LIMIT` | Max database connections | No | 5 |
| `STEAM_API_KEY` | Steam Web API key | No | - |

## 🔐 Authentication & Security

### Steam OpenID Authentication

The application uses Steam's OpenID 2.0 authentication system:

1. **Login Flow**: Users click "Login with Steam" → Redirected to Steam → Steam validates → Redirected back with identity
2. **JWT Tokens**: Upon successful authentication, a JWT token is issued and stored as an HTTP-only cookie
3. **Session Management**: JWT tokens are validated on each API request to protected endpoints
4. **Automatic Logout**: Invalid or expired tokens trigger automatic logout

### Security Features

- **HTTP-Only Cookies**: JWT tokens stored securely to prevent XSS attacks
- **CORS Protection**: Configured for specific origins in production
- **Input Validation**: All API inputs are validated and sanitized
- **SQL Injection Prevention**: Parameterized queries used throughout
- **Rate Limiting**: Built-in protection against abuse (via Nitro)

## 🚀 Performance & Caching

### API Data Caching

- **CS2 Item Data**: Cached locally in `/storage/csgo-api/` to reduce external API calls
- **Automatic Updates**: Data refreshed periodically to stay current with game updates
- **Memory Caching**: Frequently accessed data cached in memory using `node-cache`

### Frontend Optimizations

- **Server-Side Rendering**: Initial page loads are server-rendered for better SEO and performance
- **Code Splitting**: Automatic code splitting by Nuxt for optimal bundle sizes
- **Image Optimization**: Lazy loading and optimized image delivery
- **Prefetching**: Critical resources prefetched for smooth navigation

## 🛠️ Setup and Development

### Prerequisites

- **Node.js** (v18+ recommended)
- **MariaDB/MySQL** (v10.3+ / v8.0+)
- **Bun** (recommended) or npm/yarn/pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/cs2inspect-web.git
cd cs2inspect-web

# Install dependencies (using Bun - recommended)
bun install

# Or using other package managers
npm install
# yarn install
# pnpm install
```

### Database Setup

1. **Create Database**:
   ```sql
   CREATE DATABASE cs2inspect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Import Schema**:
   ```bash
   mysql -u your-username -p cs2inspect < server/database/init.sql
   ```

3. **Configure Environment**: Copy `.env.example` to `.env` and update database credentials

### Development Server

```bash
# Start development server
bun run dev
# or npm run dev

# Server will start on http://localhost:3000
```

### Production Build

```bash
# Build for production
bun run build

# Preview production build
bun run preview

# Start production server
node .output/server/index.mjs
```

## 🧪 Testing

### Unit Testing

```bash
# Run unit tests
bun run test
# or npm run test

# Run tests in watch mode
bun run test:watch

# Generate coverage report
bun run test:coverage
```

### End-to-End Testing

```bash
# Run E2E tests
bun run test:e2e

# Run E2E tests in headed mode
bun run test:e2e:headed
```

### Linting

```bash
# Run ESLint
bun run lint

# Fix linting issues
bun run lint:fix
```

## 🚢 Deployment

### Production Deployment

1. **Build the Application**:
   ```bash
   bun run build
   ```

2. **Database Migration**: Ensure your production database has the latest schema from `server/database/init.sql`

3. **Environment Variables**: Set all required environment variables in your production environment

4. **Start the Server**:
   ```bash
   node .output/server/index.mjs
   ```

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

### Reverse Proxy Configuration

For production, use a reverse proxy like Nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🤝 Contributing

We welcome contributions to CS2 Loadout Manager! Here's how you can help:

### Development Workflow

1. **Fork the Repository**
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make Your Changes**
4. **Run Tests**:
   ```bash
   bun run test
   bun run lint
   ```
5. **Commit Your Changes**:
   ```bash
   git commit -m "feat: add your feature description"
   ```
6. **Push to Your Fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**

### Coding Standards

- **TypeScript**: Use TypeScript for all new code
- **ESLint**: Follow the project's ESLint configuration
- **Conventional Commits**: Use conventional commit messages
- **Component Structure**: Follow Vue 3 Composition API patterns
- **Testing**: Write tests for new features and bug fixes

### Areas for Contribution

- 🐛 **Bug Fixes**: Report and fix bugs
- ✨ **New Features**: Implement new functionality
- 🌐 **Translations**: Add support for new languages
- 📚 **Documentation**: Improve documentation and examples
- 🎨 **UI/UX**: Enhance user interface and experience
- ⚡ **Performance**: Optimize application performance

## 📚 Documentation & Resources

### Official Documentation
- [Nuxt 3 Documentation](https://nuxt.com/docs/getting-started/introduction)
- [Vue 3 Documentation](https://vuejs.org/guide/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Naive UI Documentation](https://www.naiveui.com/en-US/os-theme)

### External APIs
- [CS:GO API Documentation](https://bymykel.github.io/CSGO-API/)
- [Steam Web API Documentation](https://steamcommunity.com/dev)

### Community Resources
- [Counter-Strike 2 Developer Community](https://developer.valvesoftware.com/wiki/Counter-Strike_2)
- [CS2 Item Database](https://csgostash.com/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Valve Corporation** - For Counter-Strike 2 and Steam APIs
- **CSGO-API Contributors** - For maintaining the comprehensive CS2 item database
- **Nuxt Team** - For the excellent full-stack framework
- **Vue.js Team** - For the progressive JavaScript framework
- **Open Source Community** - For all the amazing libraries and tools

## 📞 Support

If you encounter any issues or have questions:

1. **Check the Documentation** - Most common issues are covered here
2. **Search Issues** - Look through existing GitHub issues
3. **Create an Issue** - If you can't find a solution, create a new issue
4. **Join Discussions** - Participate in GitHub Discussions for general questions

---

**Made with ❤️ for the Counter-Strike 2 community**
