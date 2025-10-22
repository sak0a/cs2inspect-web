# CS2Inspect Documentation

Welcome to the comprehensive documentation for CS2Inspect, a web application for Counter-Strike 2 players to customize and manage their in-game item loadouts.

## 📚 Table of Contents

### Getting Started
- **[Setup Guide](setup.md)** <Badge type="tip" text="Start Here" /> - Complete development environment setup
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

## 🚀 Quick Start

### For Users

1. **Access the Application**: Navigate to the deployed CS2Inspect instance
2. **Login**: Click "Login with Steam" to authenticate
3. **Create Loadout**: Set up your first loadout configuration
4. **Customize Items**: Select weapons, skins, stickers, and more
5. **Save & Manage**: Your configurations are automatically saved

### For Developers

```bash
# Clone the repository
git clone https://github.com/sak0a/cs2inspect-web.git
cd cs2inspect-web

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start development server
npm run dev
```

See the [Setup Guide](setup.md) for detailed instructions.

---

## 🎯 What is CS2Inspect?

CS2Inspect is a full-stack web application that allows Counter-Strike 2 players to:

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

## 🏗️ Architecture Overview

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

See the [Architecture Guide](architecture.md) for detailed information.

---

## 📖 Documentation Structure

### Core Guides

| Document | Purpose | Audience |
|----------|---------|----------|
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

## 🔑 Key Features

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

## 🛠️ Technology Stack

### Frontend
- **Framework**: Nuxt 3 (Vue 3 + TypeScript)
- **UI Library**: Naive UI
- **Styling**: Tailwind CSS + SASS
- **State**: Pinia
- **Icons**: Iconify + MDI
- **Charts**: Chart.js + vue-chartjs

### Backend
- **Runtime**: Node.js with Nitro
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

## 🤝 Contributing

We welcome contributions! Please read the [Contributing Guide](contributing.md) for:

- Code standards and style guide
- Development workflow
- Pull request process
- Issue guidelines
- Testing requirements

---

## 📝 License

[Add your license information here]

---

## 🔗 Quick Links

- **Repository**: https://github.com/sak0a/cs2inspect-web
- **Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas

---

## 📬 Support

Need help? Check these resources:

1. **[FAQ](faq.md)** - Common questions and solutions
2. **Documentation** - Search this docs directory
3. **GitHub Issues** - Search existing issues
4. **GitHub Discussions** - Ask the community

---

## 🎮 Related Projects

- **cs2-inspect-lib**: CS2 item inspection library
- **node-cs2**: Steam Game Coordinator integration
- **csgo-fade-percentage-calculator**: Fade pattern calculations

---

## 📅 Documentation Updates

This documentation is actively maintained. Last major update: January 2025

**Contributing to Docs**: Found an error or want to improve the documentation? See [Contributing Guide](contributing.md).

---

## Navigation

**Getting Started** → [Setup Guide](setup.md) → [How It Works](how-it-works.md)

**Development** → [Architecture](architecture.md) → [Components](components.md) → [API Reference](api.md)

**Deployment** → [Deployment Guide](deployment.md)

**Contributing** → [Contributing Guide](contributing.md)

---

*Built with ❤️ by the CS2Inspect community*
