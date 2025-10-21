# CS2Inspect Documentation

Welcome to the comprehensive documentation for CS2Inspect, a web application for Counter-Strike 2 players to customize and manage their in-game item loadouts.

## 📚 Table of Contents

### Getting Started
- **[Setup Guide](setup.md)** - Complete development environment setup
- **[How It Works](how-it-works.md)** - User flows and core features explained
- **[FAQ](faq.md)** - Frequently asked questions and troubleshooting

### Technical Documentation
- **[Architecture](architecture.md)** - System architecture and technology stack
- **[Components](components.md)** - Frontend and backend component reference
- **[API Reference](api.md)** - Complete API endpoint documentation

### Deployment & Contributing
- **[Deployment Guide](deployment.md)** - Production deployment instructions
- **[Contributing Guide](contributing.md)** - How to contribute to the project

### Additional Resources
- **[Theme Customization](theme-customization.md)** - UI theming and styling guide
- **[Sticker Slots](StickerSlots.md)** - Sticker slot configuration
- **[CS2 Inspect System](../CS2_INSPECT_SYSTEM_README.md)** - In-depth inspect URL processing
- **[Type System](../types/README.md)** - TypeScript interfaces and types

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

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Nuxt 3 (Vue 3 + TypeScript)
- **UI Library**: Naive UI
- **Styling**: Tailwind CSS + SASS
- **State**: Pinia
- **Icons**: Iconify + MDI

### Backend
- **Runtime**: Node.js with Nitro
- **Database**: MariaDB/MySQL
- **Authentication**: Steam OpenID + JWT
- **CS2 Integration**: cs2-inspect-lib, node-cs2

### DevOps
- **Build**: Vite
- **Testing**: Vitest + Vue Test Utils
- **Linting**: ESLint
- **Container**: Docker + Docker Compose
- **Deployment**: Vercel compatible

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
