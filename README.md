# CS2Inspect Web

A full-stack web application for Counter-Strike 2 players to customize and manage their in-game item loadouts with real-time preview capabilities.

![Nuxt](https://img.shields.io/badge/Nuxt-4.x-00DC82?style=flat-square&logo=nuxt.js)
![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)
![MariaDB](https://img.shields.io/badge/MariaDB-11-003545?style=flat-square&logo=mariadb)
![CI](https://github.com/sak0a/cs2inspect-web/workflows/CI/badge.svg)
![Docker](https://github.com/sak0a/cs2inspect-web/workflows/Build%20Docker%20Images/badge.svg)

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

| Page              | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `/`               | Main dashboard with loadout management               |
| `/weapons/[type]` | Weapon customization (pistols, rifles, smgs, heavys) |
| `/knives`         | Knife skin selection and customization               |
| `/gloves`         | Glove skin selection and customization               |
| `/agents`         | Agent selection for T/CT sides                       |
| `/music-kits`     | Music kit selection                                  |
| `/pins`           | Collectible pins management                          |
| `/status`         | System health status dashboard                       |
| `/auth/login`     | Steam authentication                                 |

## 🛠️ Tech Stack

| Category             | Technology                               |
| -------------------- | ---------------------------------------- |
| Framework            | Nuxt 4 (Vue 3 + TypeScript)              |
| UI Library           | Naive UI                                 |
| Styling              | Tailwind CSS + SASS                      |
| State Management     | Pinia                                    |
| Database             | MariaDB (Drizzle ORM)                    |
| Authentication       | Steam OpenID + JWT                       |
| Internationalization | nuxt-i18n-micro (EN, DE, RU, ES, FR, NL) |
| Testing              | Vitest + Vue Test Utils                  |
| Containerization     | Docker + Docker Compose                  |

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20
- MariaDB/MySQL or Docker
- Bun (recommended) or npm

### Installation

#### Option 1: Remote Installation (One Command)

```bash
# Install directly from GitHub (Linux/macOS)
curl -fsSL https://raw.githubusercontent.com/sak0a/cs2inspect-web/master/scripts/remote-install.sh | bash
```

This will automatically:

- Install Node.js, Bun, and dependencies
- Clone the repository
- Setup database (optional)
- Configure environment
- Build application
- Setup systemd service (optional)

#### Option 2: Local Automated Installation (Linux/macOS)

```bash
# Clone the repository
git clone https://github.com/sak0a/cs2inspect-web.git
cd cs2inspect-web

# Run installation script
./scripts/install.sh

# Or use setup wizard for interactive configuration
./scripts/setup-wizard.sh
```

#### Option 3: Manual Installation

```bash
# Clone the repository
git clone https://github.com/sak0a/cs2inspect-web.git
cd cs2inspect-web

# Install dependencies
bun install  # or npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start database (Docker)
docker run -d --name csinspect-db -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=csinspect \
  -e MYSQL_USER=csinspect \
  -e MYSQL_PASSWORD=devpass \
  mariadb:11

# Run database migrations
bun run db:push

# Start development server
bun run dev  # or npm run dev
```

#### Option 4: Docker Deployment (Coolify)

```bash
# Production with Docker Compose
docker-compose -f docker-compose.coolify.yml up -d
```

The app will be available at `http://localhost:3210`.

## 📜 Available Scripts

### Bun/npm Scripts

| Command             | Description              |
| ------------------- | ------------------------ |
| `bun run dev`       | Start development server |
| `bun run build`     | Build for production     |
| `bun run preview`   | Preview production build |
| `bun run lint`      | Run ESLint               |
| `bun test`          | Run tests                |
| `bun run db:push`   | Push database schema     |
| `bun run db:studio` | Open Drizzle Studio      |

### Shell Scripts

- `./scripts/install.sh` - Automated installation script
- `./scripts/setup-wizard.sh` - Interactive configuration wizard
- `./scripts/validate-env.sh` - Validate environment configuration

## 📁 Project Structure

```
├── app/              # Nuxt 4 app source root
│   ├── assets/       # CSS, JS, SVG assets
│   ├── components/   # Vue components (modals, tabs, customizers)
│   ├── composables/  # Vue composables (useItems, useInspectItem, etc.)
│   ├── layouts/      # Nuxt layouts
│   ├── locales/      # i18n translation files
│   ├── middleware/   # Route middleware
│   ├── pages/        # Nuxt pages (auto-routed)
│   ├── stores/       # Pinia stores
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Shared utilities
├── public/           # Static files
├── server/           # Backend (API routes, database, utils)
│   ├── api/          # API endpoints
│   ├── database/     # Drizzle schema & helpers
│   └── utils/        # Server utilities
└── services/         # External services (Steam, scrapers)
```

## 🔄 CI/CD & Automation

This project uses GitHub Actions for automated CI/CD:

- **✅ Automated Testing** – Tests, lint, and build on every push and PR
- **🐳 Docker Images** – Pre-built images published to GitHub Container Registry
- **🏷️ Releases** – Manual release workflow creates tags and triggers Docker builds
- **📄 Documentation** – VitePress docs auto-deployed to GitHub Pages

**Workflows:**

- `ci.yml` – Test, lint, and build on push to `master`/`dev`
- `docker.yml` – Build and publish Docker images to GHCR
- `release.yml` – Create releases and trigger Docker builds
- `deploy-docs.yml` – Build and deploy documentation to GitHub Pages

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**All commits trigger automated testing via GitHub Actions. Make sure tests pass before merging!**

## 📄 License

This project is private and proprietary.

---

<p align="center">
  Made with ❤️ for the CS2 community
</p>
