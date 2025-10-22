# Development Setup <Badge type="tip" text="Getting Started" />

## Prerequisites

::: tip Important
Before setting up the CS2Inspect development environment, ensure you have the following installed:
:::

### Required Software

- **Node.js**: Version 16.x or higher (18.x recommended) <Badge type="warning" text="Required" />
  ```bash
  node --version  # Should be v16.0.0 or higher
  ```

- **npm**: Version 8.x or higher (comes with Node.js) <Badge type="warning" text="Required" />
  ```bash
  npm --version
  ```

- **MariaDB/MySQL**: Version 10.x or higher <Badge type="warning" text="Required" />
  - Alternative: Docker (for containerized database)

- **Git**: Latest version <Badge type="warning" text="Required" />
  ```bash
  git --version
  ```

### Optional Software

- **Docker & Docker Compose**: For containerized development <Badge type="info" text="Recommended" />
- **Visual Studio Code**: Recommended IDE with extensions:
  - Volar (Vue Language Features)
  - ESLint
  - Tailwind CSS IntelliSense
  - TypeScript Vue Plugin

---

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/sak0a/cs2inspect-web.git
cd cs2inspect-web
```

### 2. Install Dependencies

```bash
npm install
```

::: details What gets installed?
This will install all required packages including:
- Nuxt 3 framework
- Vue 3 and TypeScript
- Naive UI components
- Tailwind CSS
- Database drivers
- Testing frameworks
- And more...
:::

### 3. Database Setup

#### Option A: Using Docker (Recommended for Development) <Badge type="tip" text="Recommended" />

```bash
# Start MariaDB container
docker-compose up -d

# This will:
# - Start MariaDB on port 3306
# - Create database 'csinspect'
# - Set root password from .env file
```

#### Option B: Using Local MariaDB/MySQL

1. **Install MariaDB**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install mariadb-server
   
   # macOS
   brew install mariadb
   
   # Windows
   # Download from https://mariadb.org/download/
   ```

2. **Start MariaDB**:
   ```bash
   sudo systemctl start mariadb
   ```

3. **Create Database**:
   ```bash
   mysql -u root -p
   ```
   
   ```sql
   CREATE DATABASE csinspect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'csinspect'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON csinspect.* TO 'csinspect'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

4. **Database Schema**:
   
   ::: tip Automatic Migrations
   The application now uses **automatic database migrations**. You no longer need to manually import the schema. The migrations will run automatically when you start the server for the first time.
   :::
   
   If you prefer to manually initialize the database:
   ```bash
   mysql -u csinspect -p csinspect < server/database/migrations/000_initial.sql
   ```
   
   The migration system will:
   - Create all required tables automatically
   - Track applied migrations in the `_migrations` table
   - Run any new migrations on subsequent starts
   - Skip already-applied migrations

### 4. Environment Configuration

1. **Copy the example environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file** with your configuration:

   ::: warning Security Notice
   Make sure to generate a secure JWT token and use strong passwords for production!
   :::

   ```env
   ########## Server Configuration ##########
   PORT=3000
   HOST=127.0.0.1
   
   ########## JWT API Configuration ##########
   # Generate a random secret key
   JWT_TOKEN=your_random_secret_key_here_min_32_characters
   JWT_EXPIRY=7d
   
   ########## Database Configuration ##########
   DATABASE_HOST=127.0.0.1
   DATABASE_PORT=3306
   DATABASE_USER=csinspect
   DATABASE_PASSWORD=your_database_password
   DATABASE_NAME=csinspect
   DATABASE_CONNECTION_LIMIT=5
   
   ########## Steam API Configuration ##########
   # Get your Steam API key: https://steamcommunity.com/dev/apikey
   STEAM_API_KEY=your_steam_api_key_here
   
   ########## Steam Account Configuration (Optional) ##########
   # Required for unmasked inspect URLs
   # Use a separate Steam account (Steam Guard not currently supported)
   STEAM_USERNAME=your_steam_username
   STEAM_PASSWORD=your_steam_password
   
   ########## Logging (Optional) ##########
   LOG_API_REQUESTS=true
   ```

3. **Generate a secure JWT token**:
   ```bash
   # Using Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Or using OpenSSL
   openssl rand -hex 32
   ```

### 5. Verify Configuration

Check that your configuration is correct:

```bash
# Test database connection
npm run db:test

# Or manually test:
mysql -h 127.0.0.1 -u csinspect -p csinspect -e "SHOW TABLES;"
```

---

## Running the Application

### Development Mode

Start the development server with hot-reload:

```bash
npm run dev
```

The application will be available at:
- **Local**: http://localhost:3000
- **Network**: http://YOUR_IP:3000
- **Health Status**: http://localhost:3000/status

**First Startup**:
- Database migrations run automatically
- Health check sampling starts automatically
- Check console for migration progress
- Monitor startup health at `/api/health/details`

### Production Build

Build the application for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

### Docker Development

Run the entire stack with Docker Compose:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Database Management

### Automatic Migrations

The project now uses an **automatic migration system**. Migrations run on server startup.

**How it works**:
1. Migrations stored in `server/database/migrations/`
2. Executed sequentially on startup (000_, 001_, 002_, etc.)
3. Tracked in `_migrations` table
4. Skips already-applied migrations
5. Safe to re-run (idempotent operations)

**Available Migrations**:
- `000_initial.sql` - Initial database schema (base tables)
- `001_add_health_checks.sql` - Health monitoring tables

**No manual intervention required** - migrations run automatically!

**Manual Migration (if needed)**:
```bash
# Apply specific migration
mysql -u csinspect -p csinspect < server/database/migrations/000_initial.sql

# Or apply all in order
for file in server/database/migrations/*.sql; do
  echo "Applying: $file"
  mysql -u csinspect -p csinspect < "$file"
done
```

**Creating New Migrations**:
1. Create file: `002_your_description.sql`
2. Use sequential numbering
3. Use `IF NOT EXISTS` for tables/indexes
4. Document in `server/database/migrations/README.md`
5. Restart server - migration runs automatically

**Backup database**:
```bash
mysqldump -u csinspect -p csinspect > backup_$(date +%Y%m%d).sql
```

**Restore database**:
```bash
mysql -u csinspect -p csinspect < backup_20240101.sql
```

### Database Schema

The main tables are:

```
# Core Application Tables
wp_player_loadouts      - User loadout configurations
wp_player_weapons       - Weapon customizations
wp_player_knifes        - Knife customizations
wp_player_gloves        - Glove customizations
wp_player_agents        - Agent selections
wp_player_pins          - Pin collections

# Health Monitoring Tables (added in 001_add_health_checks.sql)
health_check_history    - Historical health check data
health_check_config     - Health check configuration

# System Tables
_migrations             - Migration tracking
```

View migration files in `server/database/migrations/` directory.

---

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Test Structure

```
tests/
├── unit/           # Component and utility tests
├── integration/    # API integration tests
└── e2e/           # End-to-end tests
```

---

## Linting and Code Quality

### Run Linter

```bash
npm run lint
```

### Auto-fix Linting Issues

```bash
npm run lint -- --fix
```

### ESLint Configuration

The project uses ESLint with:
- Nuxt recommended rules
- TypeScript support
- Vue 3 rules
- Tailwind CSS rules

Configuration: `eslint.config.mjs`

---

## Development Workflow

### 1. Feature Branch Workflow

```bash
# Create feature branch
git checkout -b feature/my-new-feature

# Make changes
# ...

# Commit changes
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/my-new-feature

# Create pull request on GitHub
```

### 2. Component Development

When creating a new component:

1. Create component file in `components/`
2. Use TypeScript for type safety
3. Follow existing naming conventions
4. Add to component documentation if major feature
5. Write unit tests if applicable

**Example**:
```vue
<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  title: string
  active?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  active: false
})

const emit = defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <div>
    <!-- Component template -->
  </div>
</template>
```

### 3. API Development

When creating a new API endpoint:

1. Create file in `server/api/`
2. Use TypeScript interfaces
3. Implement authentication if needed
4. Add error handling
5. Document in API reference
6. Write integration tests

**Example**:
```typescript
// server/api/myendpoint.ts
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    // Your logic here
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
})
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Error**: `ECONNREFUSED 127.0.0.1:3306`

**Solution**:
```bash
# Check if MariaDB is running
sudo systemctl status mariadb

# Start MariaDB
sudo systemctl start mariadb

# Or with Docker
docker-compose up -d
```

#### 2. Steam Authentication Issues

**Error**: `Steam API key invalid`

**Solution**:
- Verify your Steam API key at https://steamcommunity.com/dev/apikey
- Ensure `STEAM_API_KEY` in `.env` is correct
- Check that your IP is not blocked by Steam

#### 3. Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

#### 4. Missing Dependencies

**Error**: `Cannot find module 'xyz'`

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 5. TypeScript Errors

**Error**: `Type 'X' is not assignable to type 'Y'`

**Solution**:
```bash
# Regenerate type definitions
npm run postinstall

# Or restart TypeScript server in your IDE
```

#### 6. Steam Client Connection Issues

**Error**: `Steam client disconnected` or `GC timeout`

**Solution**:
- Check that `STEAM_USERNAME` and `STEAM_PASSWORD` are correct
- Ensure Steam Guard is disabled on the account (not currently supported)
- Wait a few minutes and retry (Steam may be rate limiting)
- Check Steam server status: https://steamstat.us/

#### 7. Inspect URL Processing Fails

**Error**: `Invalid inspect URL format`

**Solution**:
- Verify the URL format (see [API documentation](api.md))
- For unmasked URLs, ensure Steam account is configured
- Check that the item still exists (not deleted from inventory)

---

## Development Tools

### Useful Commands

```bash
# Generate static site
npm run generate

# Analyze bundle size
npm run build -- --analyze

# Update dependencies
npm update

# Check for outdated packages
npm outdated

# Clean build artifacts
rm -rf .nuxt .output node_modules/.cache
```

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "Vue.volar",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "Vue.vscode-typescript-vue-plugin"
  ]
}
```

---

## Next Steps

After setting up your development environment:

1. Read the [Architecture](architecture.md) documentation
2. Explore the [Components](components.md) guide
3. Review the [API Reference](api.md)
4. Check out [How It Works](how-it-works.md)
5. Learn about [Plugin Integration](plugin-integration.md) for CS:GO servers

::: tip Production Deployment
For production environment variables and deployment configurations, see the [Deployment Guide](deployment.md) which includes complete environment variable references for all platforms.
:::

---

## Getting Help

- **Documentation**: Check other docs in the `docs/` directory
- **Issues**: Report bugs on GitHub Issues
- **Discord**: Join the community Discord (if available)
- **Stack Overflow**: Tag questions with `cs2inspect`

---

## Related Documentation

- [Architecture](architecture.md) - System architecture
- [API Reference](api.md) - API documentation
- [How It Works](how-it-works.md) - User flows
- [Deployment](deployment.md) - Production deployment and environment variables
- [Plugin Integration](plugin-integration.md) - CS:GO server plugin integration
- [Contributing](contributing.md) - Contribution guidelines
