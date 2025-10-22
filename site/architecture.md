# Architecture <Badge type="info" text="System Design" />

This page documents the technical architecture of CS2Inspect, a full-stack web application for Counter-Strike 2 loadout customization.

## Quick Navigation

- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [High-Level Architecture](#high-level-architecture)
- [Deployment Architecture](#deployment-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Database Schema](#database-schema)
- [Security Architecture](#security-architecture)
- [Performance Optimizations](#performance-optimizations)
- [Scalability Considerations](#scalability-considerations)
- [Integration Points](#integration-points)
- [Monitoring & Logging](#monitoring-logging)

---

## System Overview

CS2Inspect is a full-stack web application built with Nuxt 3 that allows Counter-Strike 2 players to customize and manage their in-game item loadouts. The application provides a comprehensive interface for weapon skins, knives, gloves, agents, music kits, and pins customization with real-time preview capabilities.

## Technology Stack

### Frontend <Badge type="tip" text="Modern Stack" />
- **Framework**: Nuxt 3 (Vue 3 + TypeScript)
- **UI Library**: Naive UI
- **Styling**: Tailwind CSS with custom SASS
- **State Management**: Pinia
- **Internationalization**: nuxt-i18n-micro (English, German, Russian)
- **Icons**: Iconify + Material Design Icons
- **Charts**: Chart.js + vue-chartjs (for health monitoring)

### Backend <Badge type="info" text="Node.js" />
- **Runtime**: Node.js with Nitro server
- **Database**: MariaDB (MySQL compatible)
- **Authentication**: Steam OpenID + JWT
- **CS2 Integration**: 
  - `cs2-inspect-lib` - CS2 item inspection
  - `node-cs2` - Steam Game Coordinator integration
  - `csgo-fade-percentage-calculator` - Fade pattern calculations

### DevOps <Badge type="warning" text="Production Ready" />
- **Build System**: Vite
- **Testing**: Vitest + Vue Test Utils
- **Linting**: ESLint
- **Package Manager**: npm
- **Containerization**: Docker + Docker Compose (with HEALTHCHECK)
- **Deployment**: Vercel (configured)
- **Health Monitoring**: Built-in health check system with status dashboard

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        PWA[Progressive Web App]
    end
    
    subgraph "Frontend - Nuxt 3"
        Pages[Pages/Routes]
        Components[Vue Components]
        Stores[Pinia Stores]
        Composables[Composables/Hooks]
        i18n[Internationalization]
    end
    
    subgraph "Backend - Nitro Server"
        API[API Routes]
        Middleware[Middleware]
        Utils[Server Utils]
        CSInspect[CS2 Inspect System]
    end
    
    subgraph "External Services"
        Steam[Steam API]
        SteamGC[Steam Game Coordinator]
        DB[(MariaDB)]
    end
    
    Browser --> Pages
    PWA --> Components
    Pages --> Components
    Components --> Stores
    Components --> Composables
    Pages --> API
    
    API --> Middleware
    API --> Utils
    API --> CSInspect
    API --> DB
    
    CSInspect --> Steam
    CSInspect --> SteamGC
    Middleware --> Steam
    
    style Browser fill:#4299e1
    style API fill:#48bb78
    style DB fill:#ed8936
    style Steam fill:#667eea
```

::: tip Architecture Overview
This diagram shows how the different layers of the application communicate. Data flows from the browser through the Nuxt frontend to the Nitro backend, which then communicates with external services like Steam and the database.
:::

## Deployment Architecture <Badge type="danger" text="Production" />

```mermaid
graph LR
    subgraph "User's Browser"
        UI[Web UI<br/>Vue/Nuxt App]
    end
    
    subgraph "Hosting Platform"
        Vercel[Vercel<br/>Static + Serverless]
        CDN[Global CDN]
    end
    
    subgraph "Database"
        MariaDB[(MariaDB<br/>Persistent Storage)]
    end
    
    subgraph "External APIs"
        SteamAPI[Steam Web API]
        SteamGC[Steam GC]
    end
    
    UI -->|HTTPS| CDN
    CDN -->|Route| Vercel
    Vercel -->|Query| MariaDB
    Vercel -->|Auth/Data| SteamAPI
    Vercel -->|Item Inspect| SteamGC
    
    style UI fill:#4299e1
    style Vercel fill:#48bb78
    style MariaDB fill:#ed8936
    style SteamAPI fill:#667eea
    style SteamGC fill:#9f7aea
```

---

## Frontend Architecture

The frontend is built with Nuxt 3, providing a modern, reactive user interface.

### Page Structure
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

#### Component Architecture
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

#### State Management (Pinia)
```typescript
stores/
└── loadoutStore.ts    # Manages user loadouts, weapons, knives, gloves
                       # Handles persistence to database
                       # Manages active loadout selection
```

#### Composables
```typescript
composables/
├── useInspectItem.ts  # Handles CS2 inspect URL processing
│                      # Item data parsing and validation
│                      # LocalStorage persistence
└── useItems.ts        # Item data fetching and caching
```

---

## Backend Architecture

The backend uses Nitro server (part of Nuxt 3) for API routes and server-side logic.

### API Structure
```
server/api/
├── auth/
│   └── validate.ts           # JWT token validation
├── data/
│   ├── skins.ts             # Weapon/knife skin data
│   ├── agents.ts            # Agent data
│   ├── stickers.ts          # Sticker data
│   ├── keychains.ts         # Keychain data
│   ├── musickits.ts         # Music kit data
│   └── collectibles.ts      # Pins and other collectibles
├── weapons/
│   ├── [type].ts            # Get weapons by type
│   └── save.ts              # Save weapon customization
├── knifes/
│   ├── index.ts             # Get knives
│   └── save.ts              # Save knife customization
├── gloves/
│   ├── index.ts             # Get gloves
│   └── save.ts              # Save glove customization
├── loadouts/
│   ├── index.ts             # Get/create loadouts
│   └── select.ts            # Switch active loadout
├── pins/
│   └── index.ts             # Pin management
├── inspect.ts               # CS2 inspect URL processing
└── health/
    ├── live.ts              # Liveness probe endpoint
    ├── ready.ts             # Readiness probe endpoint
    ├── details.ts           # Detailed health information
    └── history.ts           # Health check history
```

#### Health Monitoring System
```
server/utils/health/
├── probes.ts                 # Health check probes (DB, env, etc.)
├── sampler.ts                # Periodic health sampling
└── history.ts                # Health data persistence

server/types/
└── health.ts                 # Health check type definitions
```

#### Database Migrations
```
server/database/migrations/
├── README.md                 # Migration system documentation
├── 000_initial.sql           # Initial database schema
└── 001_add_health_checks.sql # Health monitoring tables

server/utils/migrations/
└── runner.ts                 # Automatic migration runner
```

#### CS2 Inspect System
```
server/utils/csinspect/
├── base.ts                  # URL parsing and analysis
├── steamClient.ts           # Steam client connection management
├── protobuf-decoder.ts      # Decode masked inspect URLs
├── protobuf-writer.ts       # Generate masked inspect URLs
└── crc32.ts                 # CRC32 checksum validation
```

---

## Database Schema

CS2Inspect uses MariaDB (MySQL-compatible) for data storage.

### Core Tables
```sql
wp_player_loadouts          # User loadout configurations
wp_player_weapons           # Weapon customizations per loadout
wp_player_knifes            # Knife customizations per loadout
wp_player_gloves            # Glove customizations per loadout
wp_player_agents            # Agent selections per loadout
wp_player_pins              # Pin collections per loadout
health_check_history        # Health monitoring data
health_check_config         # Health check configuration
_migrations                 # Migration tracking
```

#### Automatic Migrations

The application includes an **automatic migration system** that runs on startup:
- Migrations stored in `server/database/migrations/`
- Executed sequentially on server start
- Tracked in `_migrations` table
- Safe to re-run (idempotent operations)

#### Data Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as API Layer
    participant DB as Database
    participant Steam as Steam API
    
    U->>F: Login with Steam
    F->>API: POST /auth (Steam OpenID)
    API->>Steam: Validate Steam user
    Steam-->>API: User data
    API->>DB: Create/update user
    API-->>F: JWT token
    
    U->>F: Select weapon skin
    F->>API: GET /data/skins
    API-->>F: Available skins
    
    U->>F: Customize weapon
    F->>API: POST /weapons/save
    API->>DB: Save customization
    DB-->>API: Success
    API-->>F: Updated weapon data
```

## Security Architecture

### Authentication Flow
1. **Steam OpenID**: Users authenticate via Steam's OpenID protocol
2. **JWT Tokens**: Server issues JWT tokens (7-day expiry by default)
3. **Token Validation**: Middleware validates tokens on protected routes
4. **Session Management**: Tokens stored client-side (secure cookies)

### Data Protection
- Environment variables for sensitive credentials
- Database connection pooling with limits
- Rate limiting on Steam API calls (1.5s between requests)
- Input validation on all API endpoints
- SQL injection prevention via parameterized queries

## Performance Optimizations

### Frontend
- **SSR/SSG**: Server-side rendering with Nuxt 3
- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Lazy loading for item images
- **State Caching**: Pinia store persistence
- **LocalStorage**: Item data caching to reduce API calls

### Backend
- **Connection Pooling**: Database connection reuse (5 connections)
- **Steam Client Singleton**: Single persistent Steam connection
- **Request Queue**: Prevents Steam API rate limit violations
- **Response Caching**: Static data cached (skins, agents, etc.)
- **Lazy Loading**: Assets loaded on-demand

## Scalability Considerations

### Current Limitations
- Single Steam account for inspect link processing
- Database connection pool limited to 5
- No horizontal scaling configured
- Single-region deployment

### Future Improvements
- Multiple Steam accounts for load distribution
- Redis caching layer for API responses
- Database read replicas
- CDN for static assets
- Kubernetes deployment for auto-scaling
- Message queue for async operations

## Integration Points

### Steam Integration
```mermaid
graph LR
    App[CS2Inspect App] -->|OpenID Auth| SteamAuth[Steam OpenID]
    App -->|API Calls| SteamAPI[Steam Web API]
    App -->|Inspect Links| SteamGC[Game Coordinator]
    
    SteamGC -->|Item Data| SteamClient[Steam Client Bot]
    SteamClient -->|Protobuf| App
```

### External Dependencies
- **Steam API**: User authentication, inventory data
- **Steam Game Coordinator**: Real-time item inspection
- **cs2-inspect-lib**: Item data parsing and generation
- **Protobuf**: Binary protocol for CS2 item data

## Deployment Architecture

### Development
```
Local Machine
├── npm run dev         # Nuxt dev server (port 3000)
├── Docker Compose      # Local MariaDB instance
└── .env                # Local configuration
```

### Production
```
Vercel Platform
├── Serverless Functions  # Nitro API routes
├── Edge Network          # Static assets + SSR
├── External MariaDB      # Cloud database
└── Environment Vars      # Secure configuration
```

## Monitoring & Logging

### Health Check System

The application includes a **comprehensive health monitoring system**:

**Health Check Endpoints:**
- `/api/health/live` - Liveness probe (always returns OK if process is running)
- `/api/health/ready` - Readiness probe (checks critical dependencies)
- `/api/health/details` - Detailed health information for all components
- `/api/health/history` - Historical health data with trends

**Monitored Components:**
- **Database**: Connection pool health, active/idle connections, latency
- **Environment**: Required environment variables validation
- **Steam API**: Steam Web API connectivity (if configured)
- **Steam GC**: Game Coordinator connectivity (if configured)
- **Disk Space**: Available disk space monitoring
- **Memory**: Memory usage tracking
- **Response Time**: API response time measurement

**Health Status Dashboard:**
- Visual status page at `/status`
- Real-time health metrics with Chart.js visualizations
- Historical data with uptime percentages
- Automatic refresh every 30 seconds
- Glassmorphism UI design with responsive layout

**Docker Integration:**
- Built-in `HEALTHCHECK` in Dockerfile
- Automatic container health monitoring
- Uses `/api/health/ready` endpoint
- 30s interval, 5s timeout, 3 retries

**Data Persistence:**
- Health check results stored in `health_check_history` table
- Automatic sampling every 60 seconds (configurable)
- Historical trends for monitoring patterns
- Configurable retention period

See [HEALTH_CHECKS.md](../HEALTH_CHECKS.md) for complete documentation.

### Current Logging
- API request logging (optional via `LOG_API_REQUESTS`)
- Error logging to console
- Steam client connection status
- Database query logging
- Health check sampling and results

### Future Monitoring
- Application Performance Monitoring (APM)
- Error tracking (e.g., Sentry)
- User analytics
- Database query performance
- Steam API rate limit tracking
- Alerting system for health check failures

## Related Documentation

- [Components Guide](components.md) - Detailed component documentation
- [API Reference](api.md) - Complete API endpoint documentation
- [Setup Guide](setup.md) - Local development setup
- [Deployment Guide](deployment.md) - Production deployment
- [Health Checks](../HEALTH_CHECKS.md) - Health monitoring system documentation
