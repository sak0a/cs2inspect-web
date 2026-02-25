# Self-Hosting Guide

::: tip Recommended: Coolify Deployment
For the easiest production deployment, we recommend using **Coolify** with pre-built Docker images from GHCR. See the [Coolify Deployment Guide](./coolify.md).

This page documents alternative self-hosting options for advanced users who prefer manual server management.
:::

Complete guide for deploying CS2Inspect on your own infrastructure. This guide covers multiple deployment scenarios from simple Docker setups to production-ready cloud deployments.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (Docker)](#quick-start-docker)
- [Production Deployment](#production-deployment)
  - [VPS Deployment (Ubuntu/Debian)](#vps-deployment-ubuntudebian)
  - [Bare Metal Deployment](#bare-metal-deployment)
  - [Docker Compose (Production)](#docker-compose-production)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [Reverse Proxy Setup (Nginx)](#reverse-proxy-setup-nginx)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required

- **Server**: VPS or dedicated server with minimum:
  - 2 CPU cores
  - 4GB RAM (8GB recommended)
  - 20GB storage (SSD recommended)
  - Ubuntu 22.04 LTS / Debian 12 (recommended)

- **Domain**: Registered domain name pointing to your server
- **Steam API Key**: Get from [Steam Developer Portal](https://steamcommunity.com/dev/apikey)
- **Database**: MariaDB 11

### Optional but Recommended

- **Steam Bot Account**: Separate Steam account for inspect features (without 2FA)
- **Email Service**: For notifications and alerts
- **Monitoring Tools**: Uptime Kuma, Grafana, or similar

---

## Quick Start (Docker)

The fastest way to get CS2Inspect running on your server.

### 1. Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### 2. Clone Repository

```bash
git clone https://github.com/sak0a/cs2inspect-web.git
cd cs2inspect-web
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit with your settings
nano .env
```

**Minimum required configuration:**

```env
# Server
PORT=3210
HOST=0.0.0.0

# JWT (generate with: openssl rand -hex 32)
JWT_TOKEN=your_secure_random_key_here
JWT_EXPIRY=7d

# Database
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_USER=csinspect
DATABASE_PASSWORD=your_secure_password_here
DATABASE_NAME=csinspect
DATABASE_CONNECTION_LIMIT=10

# Steam API
STEAM_API_KEY=your_steam_api_key_here
```

### 4. Start Services

```bash
# Start all services
docker compose up -d

# Check logs
docker compose logs -f

# Verify health
curl http://localhost:3210/api/health/ready
```

### 5. Setup Database

```bash
# Run migrations
docker compose exec web bun run db:push

# Verify database
docker compose exec web bun run db:studio
```

Your application should now be running at `http://localhost:3210`!

---

## Production Deployment

### VPS Deployment (Ubuntu/Debian)

Complete setup for production environment on a VPS.

#### Step 1: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y git curl wget unzip software-properties-common \
                    build-essential ufw fail2ban

# Configure firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Enable fail2ban for SSH protection
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

#### Step 2: Install Node.js 20

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

#### Step 3: Install and Configure MariaDB

```bash
# Install MariaDB
sudo apt install -y mariadb-server mariadb-client

# Secure installation
sudo mysql_secure_installation
# Answer: Y, Set root password, Y, Y, Y, Y

# Create database and user
sudo mysql -u root -p << EOF
CREATE DATABASE csinspect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'csinspect'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON csinspect.* TO 'csinspect'@'localhost';
FLUSH PRIVILEGES;
EOF

# Verify database
sudo mysql -u csinspect -p csinspect
```

#### Step 4: Deploy Application

```bash
# Create application user (security best practice)
sudo useradd -m -s /bin/bash cs2inspect
sudo usermod -aG sudo cs2inspect

# Switch to application user
sudo su - cs2inspect

# Clone repository
git clone https://github.com/sak0a/cs2inspect-web.git
cd cs2inspect-web

# Install dependencies
bun install --production

# Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# Build application
bun run build

# Test run
bun run preview
```

#### Step 5: Setup Process Manager (PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'cs2inspect',
    script: './.output/server/index.mjs',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3210,
      HOST: '0.0.0.0'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
EOF

# Create logs directory
mkdir -p logs

# Start application with PM2
pm2 start ecosystem.config.js

# Setup PM2 to start on boot
pm2 startup systemd
# Follow the displayed command

# Save PM2 configuration
pm2 save

# Monitor application
pm2 monit
```

#### Step 6: Configure Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/cs2inspect
```

**Nginx configuration:**

```nginx
# /etc/nginx/sites-available/cs2inspect

upstream cs2inspect_backend {
    server 127.0.0.1:3210;
    keepalive 64;
}

# HTTP server (redirects to HTTPS)
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (we'll add these in next step)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL configuration (Mozilla Intermediate)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logging
    access_log /var/log/nginx/cs2inspect.access.log;
    error_log /var/log/nginx/cs2inspect.error.log;

    # Client body size limit
    client_max_body_size 10M;

    # Proxy to Nuxt application
    location / {
        proxy_pass http://cs2inspect_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Health check endpoint
    location /api/health/ {
        proxy_pass http://cs2inspect_backend;
        access_log off;
    }

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://cs2inspect_backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Enable site and restart Nginx:**

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/cs2inspect /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 7: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 8: Setup Monitoring

```bash
# Install monitoring script
cat > /home/cs2inspect/monitor.sh << 'EOF'
#!/bin/bash

# Check if application is responding
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3210/api/health/ready)

if [ "$HEALTH_CHECK" != "200" ]; then
    echo "Health check failed! Restarting application..."
    pm2 restart cs2inspect
    
    # Send alert (optional - configure with your email)
    # echo "CS2Inspect health check failed at $(date)" | mail -s "CS2Inspect Alert" your@email.com
fi
EOF

chmod +x /home/cs2inspect/monitor.sh

# Add to crontab (check every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/cs2inspect/monitor.sh") | crontab -
```

---

### Bare Metal Deployment

For deployment without Docker on a dedicated server.

#### System Requirements

- Ubuntu 22.04 LTS or Debian 12
- Node.js 20.x
- MariaDB 11
- Nginx (reverse proxy)
- 8GB RAM minimum
- 40GB+ storage

#### Installation Steps

Follow the VPS deployment steps above. The process is identical for bare metal servers.

**Additional considerations for bare metal:**

1. **RAID Configuration**: Setup RAID 1 or RAID 10 for database storage
2. **Backup Strategy**: Implement automated backups to external storage
3. **Hardware Monitoring**: Install monitoring tools like `lm-sensors`

```bash
# Install hardware monitoring
sudo apt install -y lm-sensors smartmontools

# Detect sensors
sudo sensors-detect

# Check temperatures
sensors

# Check disk health
sudo smartctl -a /dev/sda
```

---

### Docker Compose (Production)

Optimized Docker Compose setup for production.

#### Create Production Compose File

Create `docker-compose.coolify.yml`:

```yaml
version: "3.9"

services:
  database:
    image: mariadb:11
    container_name: cs2inspect-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DATABASE_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DATABASE_NAME}
      MYSQL_USER: ${DATABASE_USER}
      MYSQL_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 30s
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
      - --max-connections=200
      - --innodb-buffer-pool-size=1G

  web:
    container_name: cs2inspect-web
    build:
      context: .
      dockerfile: Dockerfile
    image: cs2inspect-web:latest
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=${PORT:-3210}
      - HOST=${HOST:-0.0.0.0}
      - JWT_TOKEN=${JWT_TOKEN}
      - JWT_EXPIRY=${JWT_EXPIRY}
      - DATABASE_HOST=database
      - DATABASE_PORT=3306
      - DATABASE_USER=${DATABASE_USER}
      - DATABASE_PASSWORD=${DATABASE_PASSWORD}
      - DATABASE_NAME=${DATABASE_NAME}
      - DATABASE_CONNECTION_LIMIT=${DATABASE_CONNECTION_LIMIT}
      - STEAM_API_KEY=${STEAM_API_KEY}
      - STEAM_SERVICE_URL=${STEAM_SERVICE_URL}
      - LOG_API_REQUESTS=${LOG_API_REQUESTS}
    ports:
      - "${PORT:-3210}:${PORT:-3210}"
    depends_on:
      database:
        condition: service_healthy
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:3210/api/health/ready"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 60s
    volumes:
      - ./logs:/app/logs

  steam-service:
    container_name: cs2inspect-steam-service
    build:
      context: ./services/steam-service
      dockerfile: Dockerfile
    image: cs2inspect-steam-service:latest
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=${STEAM_SERVICE_PORT:-3211}
      - HOST=${STEAM_SERVICE_HOST:-0.0.0.0}
      - STEAM_USERNAME=${STEAM_USERNAME}
      - STEAM_PASSWORD=${STEAM_PASSWORD}
      - STEAM_API_KEY=${STEAM_API_KEY}
      - API_KEYS=${STEAM_SERVICE_API_KEYS}
      - CORS_ORIGINS=${STEAM_SERVICE_CORS_ORIGINS}
    ports:
      - "${STEAM_SERVICE_PORT:-3211}:${STEAM_SERVICE_PORT:-3211}"
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:3211/api/health/ready"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 60s

  nginx:
    image: nginx:alpine
    container_name: cs2inspect-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - web
    networks:
      - app-network

  certbot:
    image: certbot/certbot:latest
    container_name: cs2inspect-certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

networks:
  app-network:
    driver: bridge

volumes:
  db_data:
    driver: local
```

#### Deploy with Production Compose

```bash
# Build images
docker compose -f docker-compose.coolify.yml build

# Start services
docker compose -f docker-compose.coolify.yml up -d

# View logs
docker compose -f docker-compose.coolify.yml logs -f

# Check status
docker compose -f docker-compose.coolify.yml ps
```

---

## Database Setup

### Initial Database Configuration

```sql
-- Connect to MariaDB
mysql -u root -p

-- Create database with proper charset
CREATE DATABASE csinspect 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- Create user with secure password
CREATE USER 'csinspect'@'localhost' 
  IDENTIFIED BY 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON csinspect.* 
  TO 'csinspect'@'localhost';

FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User = 'csinspect';
```

### Database Optimization

```sql
-- Add to /etc/mysql/mariadb.conf.d/50-server.cnf

[mysqld]
# Connection settings
max_connections = 200
max_allowed_packet = 64M
connect_timeout = 10

# Buffer sizes
innodb_buffer_pool_size = 2G
innodb_log_file_size = 512M
innodb_log_buffer_size = 16M

# Query cache
query_cache_size = 0
query_cache_type = 0

# Character set
character_set_server = utf8mb4
collation_server = utf8mb4_unicode_ci

# Logging
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2
```

### Run Migrations

```bash
# Using bun
bun run db:push

# Or with docker
docker compose exec web bun run db:push

# Open database studio
bun run db:studio
```

---

## Environment Configuration

### Complete .env Template

```env
########## Server Configuration ##########
PORT=3210
HOST=0.0.0.0
NODE_ENV=production

########## JWT Configuration ##########
# Generate with: openssl rand -hex 32
JWT_TOKEN=your_64_character_secure_random_key_here
JWT_EXPIRY=7d

########## Database Configuration ##########
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=csinspect
DATABASE_PASSWORD=your_secure_db_password_here
DATABASE_NAME=csinspect
DATABASE_CONNECTION_LIMIT=10

# For Docker deployments
DATABASE_ROOT_PASSWORD=your_root_password_here

########## Steam API Configuration ##########
STEAM_API_KEY=your_steam_api_key_from_steamcommunity

########## Steam Bot Account (Optional) ##########
# Use dedicated bot account without 2FA
STEAM_USERNAME=your_bot_username
STEAM_PASSWORD=your_bot_password

########## Steam Service Configuration ##########
STEAM_SERVICE_URL=http://localhost:3211
STEAM_SERVICE_API_KEY=your_service_api_key_here
STEAM_SERVICE_PORT=3211
STEAM_SERVICE_HOST=0.0.0.0

########## Rate Limiting ##########
STEAM_RATE_LIMIT_DELAY=1500
STEAM_MAX_QUEUE_SIZE=100
STEAM_REQUEST_TIMEOUT=10000
STEAM_QUEUE_TIMEOUT=30000

########## Logging ##########
LOG_API_REQUESTS=true
LOG_LEVEL=info

########## Assets CDN (Optional) ##########
ASSETS_URL=https://assets.yourdomain.com
ASSETS_STICKER_PATH=/stickers
ASSETS_CHARMS_PATH=/charms
ASSETS_WEAPONS_PATH=/weapons

########## Application URLs ##########
PUBLIC_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
```

### Generate Secure Keys

```bash
# Generate JWT secret (32 bytes)
openssl rand -hex 32

# Generate API key (16 bytes)
openssl rand -hex 16

# Generate secure password (24 characters)
openssl rand -base64 24
```

### Validate Environment

Create a validation script `scripts/validate-env.sh`:

```bash
#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Validating environment configuration..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Copy .env.example to .env and configure it."
    exit 1
fi

# Load .env
source .env

# Required variables
REQUIRED_VARS=(
    "PORT"
    "HOST"
    "JWT_TOKEN"
    "DATABASE_HOST"
    "DATABASE_USER"
    "DATABASE_PASSWORD"
    "DATABASE_NAME"
    "STEAM_API_KEY"
)

errors=0

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ $var is not set${NC}"
        errors=$((errors + 1))
    else
        echo -e "${GREEN}✅ $var is set${NC}"
    fi
done

# Check JWT token length
if [ ${#JWT_TOKEN} -lt 32 ]; then
    echo -e "${YELLOW}⚠️  JWT_TOKEN should be at least 32 characters${NC}"
    errors=$((errors + 1))
fi

# Check database connection
echo ""
echo "🔍 Testing database connection..."
if command -v mysql &> /dev/null; then
    if mysql -h"$DATABASE_HOST" -u"$DATABASE_USER" -p"$DATABASE_PASSWORD" -e "USE $DATABASE_NAME" 2>/dev/null; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        errors=$((errors + 1))
    fi
else
    echo -e "${YELLOW}⚠️  MySQL client not installed, skipping database test${NC}"
fi

echo ""
if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Found $errors error(s)${NC}"
    exit 1
fi
```

Make it executable:

```bash
chmod +x scripts/validate-env.sh
./scripts/validate-env.sh
```

---

## Reverse Proxy Setup (Nginx)

### Install Nginx

```bash
sudo apt update
sudo apt install -y nginx
```

### Configure Nginx for CS2Inspect

See the complete Nginx configuration in the [VPS Deployment](#step-6-configure-nginx-reverse-proxy) section above.

### Nginx Performance Tuning

Edit `/etc/nginx/nginx.conf`:

```nginx
user www-data;
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Gzip Settings
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log warn;

    # Include configs
    include /etc/nginx/mime.types;
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

---

## SSL/TLS Configuration

### Obtain SSL Certificate with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Stop Nginx temporarily
sudo systemctl stop nginx

# Obtain certificate
sudo certbot certonly --standalone \
    -d yourdomain.com \
    -d www.yourdomain.com \
    --email your@email.com \
    --agree-tos \
    --no-eff-email

# Start Nginx
sudo systemctl start nginx

# Setup automatic renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

### SSL Best Practices

Add to your Nginx SSL configuration:

```nginx
# Mozilla Modern SSL Configuration
ssl_protocols TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# DH Parameters
ssl_dhparam /etc/nginx/dhparam.pem;

# Session settings
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;
```

Generate DH parameters:

```bash
sudo openssl dhparam -out /etc/nginx/dhparam.pem 2048
```

---

## Monitoring & Maintenance

### Setup Uptime Monitoring

**Option 1: Uptime Kuma (Self-hosted)**

```bash
# Install Uptime Kuma with Docker
docker run -d --restart=always \
    -p 3001:3001 \
    -v uptime-kuma:/app/data \
    --name uptime-kuma \
    louislam/uptime-kuma:1

# Access at http://your-server:3001
```

**Option 2: External Services**

- [UptimeRobot](https://uptimerobot.com/) - Free tier available
- [Pingdom](https://www.pingdom.com/)
- [StatusCake](https://www.statuscake.com/)

Configure monitor for: `https://yourdomain.com/api/health/ready`

### Application Logging

```bash
# PM2 logs
pm2 logs cs2inspect

# Nginx logs
sudo tail -f /var/log/nginx/cs2inspect.access.log
sudo tail -f /var/log/nginx/cs2inspect.error.log

# Application logs
tail -f ~/cs2inspect-web/logs/out.log
tail -f ~/cs2inspect-web/logs/err.log

# Docker logs
docker compose logs -f --tail=100 web
```

### Database Backups

Create backup script `scripts/backup-db.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/home/cs2inspect/backups"
DB_NAME="csinspect"
DB_USER="csinspect"
DB_PASS="your_password"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/csinspect_$DATE.sql.gz

# Delete old backups
find $BACKUP_DIR -name "csinspect_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: csinspect_$DATE.sql.gz"
```

Schedule with cron:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/cs2inspect/scripts/backup-db.sh >> /home/cs2inspect/logs/backup.log 2>&1
```

### System Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js dependencies
cd ~/cs2inspect-web
bun install

# Rebuild application
bun run build

# Restart with PM2
pm2 restart cs2inspect

# Or with Docker
docker compose pull
docker compose up -d --build
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 status
pm2 list
pm2 logs cs2inspect --lines 100

# Check if port is in use
sudo lsof -i :3210

# Check environment variables
pm2 env 0

# Restart application
pm2 restart cs2inspect

# Or delete and restart
pm2 delete cs2inspect
pm2 start ecosystem.config.js
```

### Database Connection Issues

```bash
# Test database connection
mysql -h localhost -u csinspect -p csinspect

# Check database status
sudo systemctl status mariadb

# Check database logs
sudo tail -f /var/log/mysql/error.log

# Restart database
sudo systemctl restart mariadb
```

### High Memory Usage

```bash
# Check memory usage
free -h
htop

# Check PM2 memory
pm2 monit

# Restart application to free memory
pm2 restart cs2inspect
```

### SSL Certificate Issues

```bash
# Check certificate expiry
sudo certbot certificates

# Renew certificate manually
sudo certbot renew --force-renewal

# Check Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Performance Issues

```bash
# Check system resources
htop
iotop
netstat -tulpn

# Check application metrics
pm2 monit

# Analyze slow queries
sudo tail -f /var/log/mysql/slow-query.log

# Check Nginx access patterns
sudo tail -f /var/log/nginx/cs2inspect.access.log | grep -E "POST|GET"
```

### Health Check Failures

```bash
# Manual health check
curl http://localhost:3210/api/health/ready
curl http://localhost:3210/api/health/details

# Check application logs
pm2 logs cs2inspect --lines 50

# Check database health
mysql -u csinspect -p -e "SELECT 1"

# Restart services
pm2 restart cs2inspect
sudo systemctl restart mariadb
```

---

## Security Checklist

Before going to production, verify:

- [ ] UFW firewall enabled with only necessary ports open
- [ ] Fail2ban configured for SSH protection
- [ ] SSL/TLS certificates installed and auto-renewal working
- [ ] Strong passwords for database and application
- [ ] JWT secret is random and secure (32+ characters)
- [ ] Database user has minimal required privileges
- [ ] Nginx security headers configured
- [ ] Application running as non-root user
- [ ] Regular backups configured and tested
- [ ] Monitoring and alerting configured
- [ ] Server SSH key-only authentication enabled
- [ ] Application logs properly configured
- [ ] Rate limiting configured
- [ ] CORS properly configured

---

## Performance Optimization

### Enable HTTP/2 in Nginx

Already configured in the Nginx template above with `http2` directive.

### Enable Brotli Compression

```bash
# Install brotli module
sudo apt install -y libnginx-mod-http-brotli

# Add to nginx.conf http block
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### Database Query Optimization

```sql
-- Add indexes for frequently queried tables
ALTER TABLE loadouts ADD INDEX idx_user_id (user_id);
ALTER TABLE user_items ADD INDEX idx_user_loadout (user_id, loadout_id);

-- Analyze tables
ANALYZE TABLE loadouts, user_items, health_check_history;
```

### CDN Configuration (Optional)

For serving static assets:

1. Setup CloudFlare (free tier)
2. Point your domain to CloudFlare nameservers
3. Enable caching for static assets
4. Configure Page Rules for `/img/*`, `/assets/*`

---

## Next Steps

After deployment:

1. **Monitor**: Setup monitoring dashboards
2. **Backup**: Test backup restoration process
3. **Scale**: Add load balancer if traffic increases
4. **Optimize**: Tune database and application based on metrics
5. **Update**: Keep system and dependencies updated

---

## Related Documentation

- [Development Setup](setup.md) - Local development environment
- [Deployment Guide](deployment.md) - Detailed deployment scenarios
- [Health Checks](HEALTH_CHECKS.md) - Health monitoring system
- [API Reference](api/) - API documentation

---

## Support

- **Issues**: [GitHub Issues](https://github.com/sak0a/cs2inspect-web/issues)
- **Documentation**: [Full Docs](https://github.com/sak0a/cs2inspect-web/tree/master/docs)
- **Community**: Join discussions on GitHub

---

**Last Updated**: January 2026  
**Tested On**: Ubuntu 22.04 LTS, Debian 12, Node.js 20.x
