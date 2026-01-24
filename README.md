# CS2Inspect Web

A full-stack web application for Counter-Strike 2 players to customize and manage their in-game item loadouts with real-time preview capabilities.

![Nuxt](https://img.shields.io/badge/Nuxt-3.x-00DC82?style=flat-square&logo=nuxt.js)
![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)
![MariaDB](https://img.shields.io/badge/MariaDB-10.x-003545?style=flat-square&logo=mariadb)

## ✨ Features

- **Weapon Skin Customization** – Choose from thousands of skins with full float value, pattern seed, and StatTrak™ control
- **Multiple Loadouts** – Create unlimited loadout configurations and switch between them instantly
- **Stickers & Keychains** – Add and position stickers on weapons with the advanced Visual Customizer
- **Knives & Gloves** – Separate T/CT side configurations with all skin options
- **Agent Selection** – Choose agents from all factions for both teams
- **Music Kits & Pins** – Complete inventory customization
- **Import from Inspect URLs** – Parse CS2 inspect links to import item configurations
- **Generate Inspect Links** – Create masked inspect URLs from your configurations
- **Steam Authentication** – Secure login via Steam OpenID

## 🗂️ Pages

| Page | Description |
|------|-------------|
| `/` | Main dashboard with loadout management |
| `/weapons/[type]` | Weapon customization (pistols, rifles, smgs, heavys) |
| `/knives` | Knife skin selection and customization |
| `/gloves` | Glove skin selection and customization |
| `/agents` | Agent selection for T/CT sides |
| `/music-kits` | Music kit selection |
| `/pins` | Collectible pins management |
| `/status` | System health status dashboard |
| `/auth/login` | Steam authentication |

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Nuxt 3 (Vue 3 + TypeScript) |
| UI Library | Naive UI |
| Styling | Tailwind CSS + SASS |
| State Management | Pinia |
| Database | MariaDB (Drizzle ORM) |
| Authentication | Steam OpenID + JWT |
| Internationalization | nuxt-i18n-micro (EN, DE, RU, ES, FR, NL) |
| Testing | Vitest + Vue Test Utils |
| Containerization | Docker + Docker Compose |

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20
- MariaDB/MySQL or Docker
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/sak0a/cs2inspect-web.git
cd cs2inspect-web

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start database (Docker)
docker-compose up -d

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |
| `npm run db:push` | Push database schema |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run docs:dev` | Start documentation site |

## 📁 Project Structure

```
├── assets/           # CSS, JS, SVG assets
├── components/       # Vue components (modals, tabs, customizers)
├── composables/      # Vue composables (useItems, useInspectItem, etc.)
├── docs/             # Project documentation
├── layouts/          # Nuxt layouts
├── locales/          # i18n translation files
├── middleware/       # Route middleware
├── pages/            # Nuxt pages (auto-routed)
├── public/           # Static files
├── server/           # Backend (API routes, database, utils)
│   ├── api/          # API endpoints
│   ├── database/     # Drizzle schema & helpers
│   └── utils/        # Server utilities
├── services/         # External services (Steam, scrapers)
├── stores/           # Pinia stores
├── types/            # TypeScript type definitions
└── utils/            # Shared utilities
```

## 📖 Documentation

Comprehensive documentation is available in the [`/docs`](./docs) directory:

- [Setup Guide](./docs/setup.md) – Development environment setup
- [Architecture](./docs/architecture.md) – System architecture overview
- [API Reference](./docs/api.md) – API endpoint documentation
- [Components](./docs/components.md) – Component reference
- [Contributing](./docs/contributing.md) – Contribution guidelines

## 🤝 Contributing

Contributions are welcome! Please read the [Contributing Guide](./docs/contributing.md) before submitting a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

---

<p align="center">
  Made with ❤️ for the CS2 community
</p>
