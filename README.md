# CS2Inspect Web

A full-stack web application for Counter-Strike 2 players to customize and manage their in-game item loadouts with real-time preview capabilities.

![Nuxt](https://img.shields.io/badge/Nuxt-4.x-00DC82?style=flat-square&logo=nuxt.js)
![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)
![MariaDB](https://img.shields.io/badge/MariaDB-10.x-003545?style=flat-square&logo=mariadb)
![CI/CD](https://github.com/sak0a/cs2inspect-web/workflows/CI%2FCD%20Pipeline/badge.svg)
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
docker-compose up -d

# Run database migrations
bun run db:push

# Start development server
bun run dev  # or npm run dev
```

#### Option 4: Using Makefile

```bash
# View all available commands
make help

# Install and setup
make install
make setup

# Start development
make dev
```

#### Option 5: Docker Deployment

```bash
# Development
docker-compose -f docker-compose.dev.yml up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

See [SELF_HOSTING.md](docs/SELF_HOSTING.md) for complete production deployment guide.

The app will be available at `http://localhost:3000`.

## 📜 Available Scripts

### Bun/npm Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run preview` | Preview production build |
| `bun run lint` | Run ESLint |
| `bun test` | Run tests |
| `bun run db:push` | Push database schema |
| `bun run db:studio` | Open Drizzle Studio |
| `bun run docs:dev` | Start documentation site |

### Makefile Commands

For a complete list of Makefile commands, run `make help`

**Common commands:**
- `make install` - Install dependencies
- `make setup` - Run interactive setup wizard
- `make dev` - Start development server
- `make build` - Build for production
- `make test` - Run all tests
- `make docker-up` - Start Docker containers
- `make deploy` - Deploy to production

### Shell Scripts

- `./scripts/install.sh` - Automated installation script
- `./scripts/setup-wizard.sh` - Interactive configuration wizard
- `./scripts/validate-env.sh` - Validate environment configuration
- `./scripts/deploy-app.sh` - Deploy to app branch

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
- [Self-Hosting Guide](./docs/SELF_HOSTING.md) – Complete production deployment guide
- [GitHub Actions CI/CD](./docs/github-actions.md) – Automated workflows and deployment
- [Coolify Deployment](./services/docs-site/coolify.md) – Deploy with Coolify platform
- [Architecture](./docs/architecture.md) – System architecture overview
- [API Reference](./docs/api.md) – API endpoint documentation
- [Components](./docs/components.md) – Component reference
- [Recommendations](./docs/RECOMMENDATIONS.md) – Best practices and improvements
- [Contributing](./docs/contributing.md) – Contribution guidelines

## 🔄 CI/CD & Automation

This project uses GitHub Actions for automated CI/CD:

- **✅ Automated Testing** – Tests run on every push and PR
- **📦 Build Artifacts** – Production-ready builds generated automatically
- **🚀 Auto Deployment** – Master branch automatically syncs to app branch
- **🐳 Docker Images** – Multi-platform images published to GitHub Container Registry
- **📊 Status Monitoring** – Real-time workflow status and build reports

See [GitHub Actions Documentation](./docs/github-actions.md) for complete details.

**Workflows:**
- `ci.yml` – Test, lint, and build on every push
- `auto-deploy.yml` – Automatically deploy master to app branch
- `deploy-app.yml` – Build and package deployment artifacts
- `docker.yml` – Build and publish Docker images

## 🤝 Contributing

Contributions are welcome! Please read the [Contributing Guide](./docs/contributing.md) before submitting a pull request.

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
