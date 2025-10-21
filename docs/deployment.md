# Deployment Guide

## Overview

This guide covers deploying the CS2Inspect application to production environments. The application is a Nuxt 3 server-side rendered (SSR) application with a backend API and requires a MariaDB database and optionally a Steam bot account.

## Deployment Options

### 1. Vercel (Recommended)

Vercel provides seamless Nuxt 3 deployment with automatic builds, serverless functions, and edge caching.

#### Prerequisites
- Vercel account
- External MariaDB database (e.g., PlanetScale, AWS RDS, DigitalOcean)
- GitHub repository connected to Vercel

#### Setup Steps

1. **Connect Repository to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository: `sak0a/cs2inspect-web`

2. **Configure Build Settings**:
   ```
   Framework Preset: Nuxt.js
   Build Command: npm run build
   Output Directory: .output/public
   Install Command: npm install
   ```

3. **Set Environment Variables**:
   
   In Vercel project settings → Environment Variables, add:
   
   ```
   # Server Configuration
   PORT=3000
   HOST=0.0.0.0
   
   # JWT Configuration
   JWT_TOKEN=<your-secure-random-key-32-chars>
   JWT_EXPIRY=7d
   
   # Database Configuration
   DATABASE_HOST=<your-db-host>
   DATABASE_PORT=3306
   DATABASE_USER=<your-db-user>
   DATABASE_PASSWORD=<your-db-password>
   DATABASE_NAME=csinspect
   DATABASE_CONNECTION_LIMIT=10
   
   # Steam API
   STEAM_API_KEY=<your-steam-api-key>
   
   # Optional: Steam Bot Account
   STEAM_USERNAME=<bot-username>
   STEAM_PASSWORD=<bot-password>
   
   # Logging
   LOG_API_REQUESTS=true
   ```

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your application
   - Access via provided URL: `https://your-project.vercel.app`

5. **Custom Domain** (Optional):
   - Go to Project Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

#### Vercel Configuration File

Create `vercel.json` in the project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "nuxt.config.ts",
      "use": "@nuxtjs/vercel-builder"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ]
}
```

---

### 2. Docker Deployment

Deploy using Docker containers for full control and portability.

#### Prerequisites
- Docker and Docker Compose installed
- Server with Docker support (VPS, dedicated server)
- Domain name pointed to server IP

#### Setup Steps

1. **Build Docker Image**:
   ```bash
   docker build -t cs2inspect-web .
   ```

2. **Docker Compose Setup**:
   
   Create `docker-compose.prod.yml`:
   ```yaml
   version: '3.8'
   
   services:
     app:
       image: cs2inspect-web
       container_name: cs2inspect-app
       restart: unless-stopped
       ports:
         - "3000:3000"
       environment:
         - PORT=3000
         - HOST=0.0.0.0
         - DATABASE_HOST=db
         - DATABASE_PORT=3306
         - DATABASE_USER=csinspect
         - DATABASE_PASSWORD=${DATABASE_PASSWORD}
         - DATABASE_NAME=csinspect
         - JWT_TOKEN=${JWT_TOKEN}
         - STEAM_API_KEY=${STEAM_API_KEY}
         - STEAM_USERNAME=${STEAM_USERNAME}
         - STEAM_PASSWORD=${STEAM_PASSWORD}
       depends_on:
         - db
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:3000/api/health/ready"]
         interval: 30s
         timeout: 5s
         retries: 3
         start_period: 30s
       networks:
         - cs2inspect-network
   
     db:
       image: mariadb:10.11
       container_name: cs2inspect-db
       restart: unless-stopped
       environment:
         - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
         - MYSQL_DATABASE=csinspect
         - MYSQL_USER=csinspect
         - MYSQL_PASSWORD=${DATABASE_PASSWORD}
       volumes:
         - db-data:/var/lib/mysql
         - ./db_structure.sql:/docker-entrypoint-initdb.d/init.sql
       ports:
         - "3306:3306"
       networks:
         - cs2inspect-network
   
     nginx:
       image: nginx:alpine
       container_name: cs2inspect-nginx
       restart: unless-stopped
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx.conf:/etc/nginx/nginx.conf
         - ./ssl:/etc/nginx/ssl
       depends_on:
         - app
       networks:
         - cs2inspect-network
   
   volumes:
     db-data:
   
   networks:
     cs2inspect-network:
       driver: bridge
   ```

3. **Nginx Configuration**:
   
   Create `nginx.conf`:
   ```nginx
   events {
     worker_connections 1024;
   }
   
   http {
     upstream app {
       server app:3000;
     }
   
     server {
       listen 80;
       server_name your-domain.com;
       
       # Redirect HTTP to HTTPS
       return 301 https://$server_name$request_uri;
     }
   
     server {
       listen 443 ssl http2;
       server_name your-domain.com;
       
       ssl_certificate /etc/nginx/ssl/cert.pem;
       ssl_certificate_key /etc/nginx/ssl/key.pem;
       
       location / {
         proxy_pass http://app;
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
   }
   ```

4. **Deploy**:
   ```bash
   # Create .env file with secrets
   cp .env.example .env
   # Edit .env with production values
   
   # Start services
   docker-compose -f docker-compose.prod.yml up -d
   
   # View logs
   docker-compose -f docker-compose.prod.yml logs -f
   ```

5. **SSL Certificate** (Let's Encrypt):
   ```bash
   # Install certbot
   sudo apt-get install certbot
   
   # Generate certificate
   sudo certbot certonly --standalone -d your-domain.com
   
   # Copy certificates
   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem
   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem
   ```

---

### 3. Node.js + PM2

Deploy directly to a VPS using Node.js and PM2 process manager.

#### Prerequisites
- VPS with Node.js 16+ installed
- PM2 installed globally: `npm install -g pm2`
- Nginx for reverse proxy
- MariaDB database

#### Setup Steps

1. **Clone Repository**:
   ```bash
   cd /var/www
   git clone https://github.com/sak0a/cs2inspect-web.git
   cd cs2inspect-web
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Build Application**:
   ```bash
   npm run build
   ```

4. **Configure Environment**:
   ```bash
   cp .env.example .env
   nano .env
   # Set production values
   ```

5. **PM2 Configuration**:
   
   Create `ecosystem.config.js`:
   ```javascript
   module.exports = {
     apps: [{
       name: 'cs2inspect',
       script: './.output/server/index.mjs',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3000,
         HOST: '127.0.0.1'
       },
       error_file: './logs/error.log',
       out_file: './logs/out.log',
       log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
       merge_logs: true,
       max_memory_restart: '1G'
     }]
   }
   ```

6. **Start with PM2**:
   ```bash
   # Start application
   pm2 start ecosystem.config.js
   
   # Save PM2 configuration
   pm2 save
   
   # Setup startup script
   pm2 startup
   # Run the command it outputs
   ```

7. **Nginx Configuration**:
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;
     
     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

8. **Enable and Restart Nginx**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/cs2inspect /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## Database Deployment

### Option 1: Managed Database (Recommended)

Use a managed database service for reliability and automatic backups:

- **PlanetScale**: MySQL-compatible, serverless, free tier available
- **AWS RDS**: Managed MariaDB/MySQL
- **DigitalOcean Managed Databases**: Simple setup, automatic backups
- **Google Cloud SQL**: Highly available MySQL

**Setup Example (PlanetScale)**:
1. Create account at planetscale.com
2. Create new database
3. Create branch (e.g., `production`)
4. Get connection string
5. Add to environment variables

### Option 2: Self-Hosted Database

Run MariaDB on your own server:

```bash
# Install MariaDB
sudo apt-get install mariadb-server

# Secure installation
sudo mysql_secure_installation

# Create database
sudo mysql -u root -p
```

```sql
CREATE DATABASE csinspect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'csinspect'@'%' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON csinspect.* TO 'csinspect'@'%';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# Import schema
mysql -u csinspect -p csinspect < db_structure.sql
```

---

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Manual Deployment Script

Create `scripts/deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# Pull latest code
git pull origin main

# Install dependencies
npm ci

# Build application
npm run build

# Restart PM2
pm2 restart cs2inspect

# Check status
pm2 status

echo "✅ Deployment complete!"
```

Make it executable:
```bash
chmod +x scripts/deploy.sh
```

---

## Environment-Specific Configuration

### Development
```env
NODE_ENV=development
PORT=3000
HOST=127.0.0.1
LOG_API_REQUESTS=true
```

### Staging
```env
NODE_ENV=staging
PORT=3000
HOST=0.0.0.0
LOG_API_REQUESTS=true
```

### Production
```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
LOG_API_REQUESTS=false
```

---

## Monitoring and Logging

### Built-in Health Check System

The application includes a comprehensive health monitoring system:

**Health Check Endpoints**:
- `/api/health/live` - Liveness probe (process running)
- `/api/health/ready` - Readiness probe (dependencies healthy)
- `/api/health/details` - Detailed component health
- `/api/health/history` - Historical health data

**Status Dashboard**:
- Visual status page at `/status`
- Real-time component health monitoring
- Historical charts with Chart.js
- Uptime percentage tracking
- Auto-refresh every 30 seconds

**Docker Health Checks**:
The Dockerfile includes a built-in HEALTHCHECK:
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://localhost:3000/api/health/ready || exit 1
```

**Health Check Configuration**:
- Automatic health sampling every 60 seconds
- Data stored in `health_check_history` table
- Configurable via `health_check_config` table
- Monitors: Database, Environment, Steam API, Disk, Memory

**Using Health Checks**:
1. **Kubernetes**: Configure liveness and readiness probes
2. **Docker Compose**: Built-in healthcheck in service definition
3. **Load Balancers**: Point health checks to `/api/health/ready`
4. **Monitoring Tools**: Query `/api/health/details` for metrics

See [HEALTH_CHECKS.md](../HEALTH_CHECKS.md) for complete documentation.

### Application Monitoring

1. **PM2 Monitoring**:
   ```bash
   pm2 monit
   pm2 logs cs2inspect
   ```

2. **Log Files**:
   - Application logs: `logs/out.log`
   - Error logs: `logs/error.log`
   - Nginx logs: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`

3. **External Monitoring** (Recommended):
   - **Sentry**: Error tracking
   - **LogRocket**: Session replay
   - **New Relic**: APM
   - **Datadog**: Infrastructure monitoring

### Database Monitoring

```bash
# Check database size
mysql -u csinspect -p -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.TABLES GROUP BY table_schema;"

# Monitor connections
mysql -u csinspect -p -e "SHOW PROCESSLIST;"
```

---

## Backup Strategy

### Database Backups

**Automated Backup Script** (`scripts/backup.sh`):

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/cs2inspect"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/cs2inspect_$DATE.sql.gz"

# Create backup
mysqldump -u csinspect -p$DATABASE_PASSWORD csinspect | gzip > $BACKUP_FILE

# Keep only last 7 days
find $BACKUP_DIR -name "cs2inspect_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

**Setup Cron Job**:
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /var/www/cs2inspect-web/scripts/backup.sh >> /var/log/cs2inspect-backup.log 2>&1
```

### File Backups

```bash
# Backup application files
tar -czf cs2inspect_files_$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  /var/www/cs2inspect-web
```

---

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Use Nginx or cloud load balancer
2. **Multiple App Instances**: Run multiple PM2 instances or containers
3. **Database Replication**: Setup master-slave replication
4. **Redis Cache**: Add Redis for session and data caching

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Enable database query caching
- Use CDN for static assets

---

## Security Best Practices

1. **Environment Variables**:
   - Never commit `.env` file
   - Use secrets management (AWS Secrets Manager, Vault)
   - Rotate credentials regularly

2. **SSL/TLS**:
   - Always use HTTPS in production
   - Use strong cipher suites
   - Enable HSTS header

3. **Database Security**:
   - Use strong passwords
   - Restrict database access by IP
   - Enable SSL for database connections
   - Regular security updates

4. **Application Security**:
   - Keep dependencies updated
   - Use rate limiting
   - Implement CSRF protection
   - Sanitize user inputs
   - Regular security audits

---

## Rollback Procedure

### Quick Rollback

1. **PM2 Rollback**:
   ```bash
   # Revert to previous build
   git checkout <previous-commit-hash>
   npm ci
   npm run build
   pm2 restart cs2inspect
   ```

2. **Docker Rollback**:
   ```bash
   # Use previous image
   docker pull cs2inspect-web:previous-tag
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Vercel Rollback**:
   - Go to Vercel dashboard
   - Click "Deployments"
   - Select previous deployment
   - Click "Promote to Production"

---

## Health Checks

### Endpoint Monitoring

Create health check endpoint:

```typescript
// server/api/health.ts
export default defineEventHandler(() => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }
})
```

### Monitoring Script

```bash
#!/bin/bash

URL="https://your-domain.com/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ $RESPONSE -eq 200 ]; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed (HTTP $RESPONSE)"
  # Send alert
fi
```

---

## Related Documentation

- [Setup Guide](setup.md) - Development setup
- [Architecture](architecture.md) - System architecture
- [API Reference](api.md) - API documentation
- [Contributing](contributing.md) - Contribution guidelines
