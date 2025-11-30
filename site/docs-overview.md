# CS2Inspect Documentation

Welcome to the comprehensive documentation for CS2Inspect, a web application for Counter-Strike 2 players to customize and manage their in-game item loadouts.

## Table of Contents

### Getting Started
- **[User Guide](user-guide.md)** <Badge type="tip" text="For End Users" /> - How to use the application
- **[Setup Guide](setup.md)** <Badge type="tip" text="For Developers" /> - Complete development environment setup
- **[How It Works](how-it-works.md)** <Badge type="info" text="Core Concepts" /> - User flows and core features explained
- **[FAQ](faq.md)** <Badge type="warning" text="Troubleshooting" /> - Frequently asked questions and troubleshooting

### Technical Documentation
- **[Architecture](architecture.md)** <Badge type="info" text="System Design" /> - System architecture and technology stack
- **[Components](components.md)** <Badge type="info" text="Reference" /> - Frontend and backend component reference
- **[API Reference](api.md)** <Badge type="info" text="Endpoints" /> - Complete API endpoint documentation

### Deployment & Contributing
- **[Deployment Guide](deployment.md)** <Badge type="danger" text="Production" /> - Production deployment instructions
- **[Contributing Guide](contributing.md)** <Badge type="tip" text="Community" /> - How to contribute to the project

### Additional Resources
- **[Health Checks](HEALTH_CHECKS.md)** <Badge type="info" text="Monitoring" /> - Comprehensive health monitoring system
- **[Theme Customization](theme-customization.md)** <Badge type="tip" text="Styling" /> - UI theming and styling guide
- **[Sticker Slots](StickerSlots.md)** <Badge type="info" text="Advanced" /> - Sticker slot configuration
- **[Glassmorphism](GLASSMORPHISM.md)** <Badge type="tip" text="UI Effects" /> - Glass effect styling guide

---

## Quick Start

### For Users

::: warning Self-Hosted Only
CS2Inspect is a **self-hosted application only**. There is no public hosted version. You or your server administrator must deploy and host your own instance. See the [Deployment Guide](deployment.md) for setup instructions.
:::

1. **Access Your Instance**: Navigate to your self-hosted CS2Inspect instance (URL provided by your server administrator)
2. **Login**: Click "Login with Steam" to authenticate
3. **Create Loadout**: Set up your first loadout configuration
4. **Customize Items**: Select weapons, skins, stickers, and more
5. **Save & Manage**: Your configurations are automatically saved

See the **[User Guide](user-guide.md)** for detailed instructions.

### For Developers

::: tip Quick Start
This is a quick overview. For complete setup instructions including database configuration, environment variables, and troubleshooting, see the [Setup Guide](setup.md).
:::

```bash
# Clone the repository
git clone https://github.com/sak0a/cs2inspect-web.git
cd cs2inspect-web

# Install dependencies (using Bun - recommended)
bun install

# Or using npm
npm install

# Configure environment (see setup.md for all required variables)
cp .env.example .env
# Edit .env with your settings

# Start development server (using Bun)
bun run dev

# Or using npm
npm run dev
```

**Next Steps**: See the [Setup Guide](setup.md) for:
- Database setup and configuration
- Complete environment variable reference
- Development workflow
- Troubleshooting common issues

---

## What is CS2Inspect?

CS2Inspect is a **self-hosted** full-stack web application that allows Counter-Strike 2 players to:

::: warning Self-Hosted Only
CS2Inspect is **self-hosted only** - there is no public hosted version available. You must deploy your own instance or use one provided by your server administrator. See the [Deployment Guide](deployment.md) for setup instructions.
:::

- **Customize Weapon Skins**: Choose from thousands of skins with full float value, pattern seed, and StatTrak™ control
- **Manage Multiple Loadouts**: Create unlimited loadout configurations and switch between them instantly
- **Apply Stickers & Keychains**: Add and position stickers on weapons with the advanced Visual Customizer
- **Configure Knives & Gloves**: Separate T/CT side configurations with all skin options
- **Select Agents**: Choose agents from all factions for both teams
- **Import from Inspect URLs**: Parse CS2 inspect links to import item configurations
- **Generate Inspect Links**: Create masked inspect URLs from your configurations

::: info CS2Inspect Plugin Integration
This web application is designed to work with the **CS2Inspect Plugin** (CounterStrikeSharp) for CS2 game servers. The plugin reads loadout configurations directly from the shared database and applies them in-game. The web application provides the user interface for players to configure their loadouts, while the plugin handles the in-game application.

**Note**: The CS2Inspect Plugin is currently in a private repository and may be released as open-source or as a paid product in the future. The web application can be set up independently, but it's primarily designed for use with the plugin to provide the complete loadout management experience.
:::

---

## Architecture Overview

::: tip Detailed Architecture
For comprehensive architecture documentation including diagrams, component details, and system design, see the [Architecture Guide](architecture.md).
:::

```
Frontend (Nuxt 3 + Vue 3)
├── Pages & Components
├── Pinia Stores
├── Composables
└── Internationalization (EN, DE, RU)

Backend (Nitro Server)
├── API Routes
├── CS2 Inspect System
├── Steam Integration
└── Database Layer (MariaDB)

External Services
├── Steam OpenID (Authentication)
├── Steam Web API
└── Steam Game Coordinator
```

See the [Architecture Guide](architecture.md) for:
- Detailed system architecture diagrams
- Frontend and backend component breakdown
- Deployment architecture
- Security and performance considerations

---

## Documentation Structure

### Core Guides

| Document | Purpose | Audience |
|----------|---------|----------|
| [User Guide](user-guide.md) | Using the application | End users |
| [Setup](setup.md) | Development environment setup | Developers |
| [How It Works](how-it-works.md) | Feature explanations and flows | All users |
| [Architecture](architecture.md) | System design and structure | Developers, DevOps |
| [Components](components.md) | Component reference | Frontend developers |
| [API Reference](api.md) | Endpoint documentation | Backend developers |
| [Deployment](deployment.md) | Production deployment | DevOps, Administrators |
| [Contributing](contributing.md) | Contribution guidelines | Contributors |
| [FAQ](faq.md) | Common questions & issues | All users |

### Specialized Topics

- **Health Monitoring**: Comprehensive health check system with real-time monitoring ([HEALTH_CHECKS.md](../HEALTH_CHECKS.md))
- **Theme Customization**: UI theming, color schemes, and styling ([theme-customization.md](theme-customization.md))
- **Sticker Configuration**: Weapon sticker slot definitions ([StickerSlots.md](StickerSlots.md))
- **CS2 Inspect System**: Protobuf encoding/decoding, Steam GC integration ([CS2_INSPECT_SYSTEM_README.md](../CS2_INSPECT_SYSTEM_README.md))
- **Type System**: TypeScript interfaces and data structures ([types/README.md](../types/README.md))

---

## Key Features

### Weapon Customization
- **Thousands of Skins**: Browse and select from the complete CS2 skin catalog
- **Float Control**: Precise float value adjustment (0.00 - 1.00)
- **Pattern Seeds**: Set pattern seed for special skins (Case Hardened, Fade, etc.)
- **StatTrak™**: Enable StatTrak™ and set kill count
- **Name Tags**: Custom weapon names
- **Stickers**: Apply up to 5 stickers per weapon
- **Keychains**: Attach keychains (CS2 feature)

### Advanced Tools
- **Visual Customizer**: Canvas-based sticker positioning with drag-and-drop, rotation, and scaling
- **Inspect URL Processing**: Import items from Steam Market or player inventories
- **Multi-Loadout System**: Unlimited loadout configurations
- **Team-Based Configuration**: Separate T/CT configurations for knives, gloves, and agents

### Technical Features
- **Server-Side Rendering**: Nuxt 3 SSR for optimal performance
- **Real-Time Validation**: Client and server-side validation
- **Type Safety**: Full TypeScript implementation
- **Internationalization**: Multi-language support (EN, DE, RU)
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Health Monitoring**: Built-in health check system with status dashboard
- **Automatic Migrations**: Database schema migrations run on startup
- **Docker Ready**: Includes HEALTHCHECK for container orchestration

---

## Technology Stack

::: tip Detailed Architecture
For comprehensive technology stack information, architecture diagrams, and system design details, see the [Architecture Guide](architecture.md).
:::

### Frontend
- **Framework**: Nuxt 3 (Vue 3 + TypeScript)
- **UI Library**: Naive UI
- **Styling**: Tailwind CSS + SASS
- **State**: Pinia
- **Icons**: Iconify + MDI
- **Charts**: Chart.js + vue-chartjs

### Backend
- **Runtime**: Bun (Node.js compatible) with Nitro
- **Database**: MariaDB/MySQL (with automatic migrations)
- **Authentication**: Steam OpenID + JWT
- **CS2 Integration**: cs2-inspect-lib, node-cs2
- **Health Monitoring**: Built-in health check system

### DevOps
- **Build**: Vite
- **Testing**: Vitest + Vue Test Utils
- **Linting**: ESLint
- **Container**: Docker + Docker Compose (with HEALTHCHECK)
- **Deployment**: Vercel compatible
- **Monitoring**: Health checks + status dashboard

---

## Contributing

We welcome contributions! Please read the [Contributing Guide](contributing.md) for:

- Code standards and style guide
- Development workflow
- Pull request process
- Issue guidelines
- Testing requirements

### Internationalization

We especially welcome contributions for **translations**! The application currently supports:
- English (EN)
- German (DE)
- Russian (RU)

To contribute translations:
1. Check the `locales/` directory for existing language files
2. Copy the English (`en.json`) file
3. Translate the strings to your language
4. Test your translations in the application
5. Submit a pull request

See the [Contributing Guide](contributing.md) for detailed instructions on adding new languages.

---

## Credits

### Main Author
- **[@sak0a](https://github.com/sak0a)** - Creator and maintainer

### Dependencies & Libraries
This project is built with the help of many excellent open-source libraries:
- **Nuxt 3** - Vue.js framework
- **Naive UI** - Vue 3 component library
- **cs2-inspect-lib** - CS2 item inspection
- **node-cs2** - Steam Game Coordinator integration
- **And many more** - See `package.json` for the complete list

### Contributors
All contributors who have submitted pull requests, reported bugs, suggested features, or helped improve documentation.

---

## License

[Add your license information here]

---

## Quick Links

- **Repository**: https://github.com/sak0a/cs2inspect-web
- **Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas

---

## Support

Need help? Check these resources:

1. **[User Guide](user-guide.md)** - Step-by-step usage instructions
2. **[FAQ](faq.md)** - Common questions and solutions
3. **Documentation** - Search this docs directory
4. **GitHub Issues** - Search existing issues
5. **GitHub Discussions** - Ask the community

---

## Related Projects

- **cs2-inspect-lib**: CS2 item inspection library
- **node-cs2**: Steam Game Coordinator integration
- **csgo-fade-percentage-calculator**: Fade pattern calculations

---

## Documentation Updates

This documentation is actively maintained. Last major update: January 2025

**Contributing to Docs**: Found an error or want to improve the documentation? See [Contributing Guide](contributing.md).

---

## Navigation

**Getting Started** → [User Guide](user-guide.md) → [Setup Guide](setup.md) → [How It Works](how-it-works.md)

**Development** → [Architecture](architecture.md) → [Components](components.md) → [API Reference](api.md)

**Deployment** → [Deployment Guide](deployment.md)

**Contributing** → [Contributing Guide](contributing.md)

---

*Built with ❤️ by the CS2Inspect community*
