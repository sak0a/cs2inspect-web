# Coolify Deployment Guide

Complete guide for deploying CS2Inspect on Coolify - the self-hosted alternative to Heroku and Vercel.

## 📋 Overview

[Coolify](https://coolify.io/) is an open-source, self-hostable platform that makes deployment simple. This guide covers deploying CS2Inspect with all its services (web app, database, Steam service) on Coolify.

## Prerequisites

- Coolify instance (v4+) - [Install Coolify](https://coolify.io/docs/installation)
- GitHub account (for repository integration)
- Domain name (optional, for production)

---

## 🚀 Deployment Options

### Option 1: Docker Compose (Recommended)

Deploy the entire stack (web + database + Steam service) with a single configuration.

#### Step 1: Create New Project in Coolify

1. Log into your Coolify dashboard
2. Click **"New Project"**
3. Name it: `cs2inspect`
4. Click **"New Resource"** → **"Docker Compose"**

#### Step 2: Configure Docker Compose

**Resource Type**: Docker Compose  
**Source**: GitHub Repository  
**Repository**: `https://github.com/sak0a/cs2inspect-web`  
**Branch**: `master`  
**Compose File**: Choose your deployment type:
- `docker-compose.yml` - Basic setup
- `docker-compose.prod.yml` - Production optimized

#### Step 3: Environment Variables

Click **"Environment Variables"** and add:

```bash
# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# JWT Configuration (generate with: openssl rand -hex 32)
JWT_TOKEN=your_64_character_secure_random_key
JWT_EXPIRY=7d

# Database Configuration
DATABASE_HOST=database
DATABASE_PORT=3306
DATABASE_USER=csinspect
DATABASE_PASSWORD=your_secure_db_password
DATABASE_NAME=csinspect
DATABASE_CONNECTION_LIMIT=10
DATABASE_ROOT_PASSWORD=your_root_password

# Steam API
STEAM_API_KEY=your_steam_api_key

# Steam Bot Account (Optional)
STEAM_USERNAME=your_bot_username
STEAM_PASSWORD=your_bot_password

# Steam Service (if using separate service)
STEAM_SERVICE_URL=http://steam-service:3001
STEAM_SERVICE_API_KEY=your_service_api_key
STEAM_SERVICE_PORT=3001

# Logging
LOG_API_REQUESTS=true
LOG_LEVEL=info
```

#### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~5-10 minutes)
3. Access your app at the provided URL

#### Step 5: Run Database Migrations

After first deployment:

1. Go to your deployment
2. Click **"Execute Command"**
3. Select the `web` container
4. Run: `bun run db:push`

---

### Option 2: Nixpacks (Simple)

Deploy just the web application (requires external database).

#### Step 1: Create Application

1. **New Resource** → **"Application"**
2. **Source**: GitHub Repository
3. **Repository**: `https://github.com/sak0a/cs2inspect-web`
4. **Branch**: `master`
5. **Build Pack**: Nixpacks (auto-detected)

#### Step 2: Configure Build

**Build Command**: (leave empty, Nixpacks auto-detects)  
**Start Command**: `bun run .output/server/index.mjs`  
**Port**: `3000`

#### Step 3: Add Database

1. Go to **"New Resource"** → **"Database"**
2. Select **"MariaDB"**
3. Set version: `10.11`
4. Create database: `csinspect`

#### Step 4: Environment Variables

Link your database and add:

```bash
# Auto-filled by Coolify when linking database
DATABASE_HOST=$DATABASE_HOST
DATABASE_PORT=$DATABASE_PORT
DATABASE_USER=$DATABASE_USER
DATABASE_PASSWORD=$DATABASE_PASSWORD
DATABASE_NAME=csinspect

# Add these manually
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
JWT_TOKEN=your_secure_jwt_token
STEAM_API_KEY=your_steam_api_key
```

#### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for build
3. Run migrations via command line

---

### Option 3: Dockerfile (Advanced)

Use custom Dockerfile for optimized builds.

#### Configuration

1. **Build Pack**: Dockerfile
2. **Dockerfile Location**: `Dockerfile` (root)
3. **Build Context**: `.`
4. **Port**: `3000`

Rest follows same pattern as Nixpacks deployment.

---

## 📦 Service Configurations

### Web Application

**Resource Type**: Application or Docker Compose Service  
**Port**: `3000`  
**Health Check**: `/api/health/ready`  
**Health Check Interval**: `30s`

**Environment Variables**:
```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
JWT_TOKEN=<secret>
DATABASE_HOST=database
STEAM_API_KEY=<key>
```

### MariaDB Database

**Resource Type**: Database or Docker Compose Service  
**Version**: `10.11`  
**Port**: `3306` (internal only)

**Volumes**:
- `/var/lib/mysql` - Database data
- `/backups` - Backup directory

**Configuration**:
```bash
MYSQL_ROOT_PASSWORD=<secret>
MYSQL_DATABASE=csinspect
MYSQL_USER=csinspect
MYSQL_PASSWORD=<secret>
```

### Steam Service (Optional)

**Resource Type**: Application or Docker Compose Service  
**Port**: `3001`  
**Build Context**: `services/steam-service`  
**Health Check**: `/api/health/ready`

**Environment Variables**:
```bash
NODE_ENV=production
PORT=3001
STEAM_USERNAME=<bot_username>
STEAM_PASSWORD=<bot_password>
STEAM_API_KEY=<key>
```

---

## 🔧 Advanced Configuration

### Custom Domain

1. Go to your deployment
2. Click **"Domains"**
3. Add your domain: `cs2inspect.yourdomain.com`
4. Coolify automatically provisions SSL with Let's Encrypt

### Health Checks

**Coolify Auto-Configuration**:
```yaml
healthcheck:
  test: ["CMD", "curl", "-fsS", "http://localhost:3000/api/health/ready"]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 60s
```

Already configured in our Docker Compose files!

### Persistent Storage

**Volumes to persist**:
- Database data: `/var/lib/mysql`
- Application logs: `/app/logs`
- Backups: `/backups`

Coolify handles volumes automatically for Docker Compose deployments.

### Resource Limits

Set in Coolify UI:

**Web Application**:
- Memory: 2GB
- CPU: 2 cores

**Database**:
- Memory: 2GB
- CPU: 2 cores

**Steam Service**:
- Memory: 1GB
- CPU: 1 core

---

## 🔄 Deployment Workflows

### Automatic Deployments

Enable in Coolify:

1. Go to your deployment
2. Click **"Settings"**
3. Enable **"Automatic Deployment"**
4. Select trigger: `Push to branch: master`

Now every push to master triggers automatic deployment!

### Manual Deployments

```bash
# Push to trigger
git push origin master

# Or redeploy in Coolify UI
Click "Redeploy" button
```

### Rollback

1. Go to **"Deployments"** tab
2. Find previous successful deployment
3. Click **"Redeploy"**

---

## 🗂️ Complete Docker Compose for Coolify

Create `coolify.docker-compose.yml`:

```yaml
version: '3.9'

services:
  database:
    image: mariadb:10.11
    restart: always
    environment:
      - MYSQL_ROOT_PASSWORD=${DATABASE_ROOT_PASSWORD}
      - MYSQL_DATABASE=${DATABASE_NAME}
      - MYSQL_USER=${DATABASE_USER}
      - MYSQL_PASSWORD=${DATABASE_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
    networks:
      - cs2inspect
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 30s
      timeout: 5s
      retries: 3
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci

  web:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    environment:
      - NODE_ENV=production
      - PORT=${PORT:-3000}
      - HOST=0.0.0.0
      - JWT_TOKEN=${JWT_TOKEN}
      - JWT_EXPIRY=${JWT_EXPIRY:-7d}
      - DATABASE_HOST=database
      - DATABASE_PORT=3306
      - DATABASE_USER=${DATABASE_USER}
      - DATABASE_PASSWORD=${DATABASE_PASSWORD}
      - DATABASE_NAME=${DATABASE_NAME}
      - STEAM_API_KEY=${STEAM_API_KEY}
      - STEAM_SERVICE_URL=${STEAM_SERVICE_URL}
      - LOG_API_REQUESTS=${LOG_API_REQUESTS:-false}
    ports:
      - "${PORT:-3000}:3000"
    depends_on:
      database:
        condition: service_healthy
    networks:
      - cs2inspect
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:3000/api/health/ready"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 60s
    labels:
      - "coolify.managed=true"

  steam-service:
    build:
      context: ./services/steam-service
      dockerfile: Dockerfile
    restart: always
    environment:
      - NODE_ENV=production
      - PORT=${STEAM_SERVICE_PORT:-3001}
      - STEAM_USERNAME=${STEAM_USERNAME}
      - STEAM_PASSWORD=${STEAM_PASSWORD}
      - STEAM_API_KEY=${STEAM_API_KEY}
    networks:
      - cs2inspect
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:3001/api/health/ready"]
      interval: 30s
      timeout: 5s
      retries: 3
    labels:
      - "coolify.managed=true"

networks:
  cs2inspect:
    driver: bridge

volumes:
  db_data:
    driver: local
```

---

## 🛠️ Post-Deployment Tasks

### 1. Initialize Database

```bash
# In Coolify terminal for web container
bun run db:push
```

### 2. Verify Health

```bash
curl https://your-domain.com/api/health/ready
```

### 3. Check Logs

In Coolify:
- Click **"Logs"** tab
- View real-time logs from all services

### 4. Setup Monitoring

Coolify provides:
- **CPU/Memory metrics** - Built-in
- **Health check monitoring** - Automatic
- **Log aggregation** - Real-time

---

## 🔍 Troubleshooting

### Build Fails

**Issue**: Build timeout or failure

**Solutions**:
1. Check build logs in Coolify
2. Increase build timeout in settings
3. Check Dockerfile syntax
4. Verify Bun installation

### Database Connection Failed

**Issue**: Web app can't connect to database

**Solutions**:
1. Verify `DATABASE_HOST=database` (service name)
2. Check database is healthy
3. Verify credentials
4. Check network configuration

### Health Check Failing

**Issue**: Service marked as unhealthy

**Solutions**:
1. Increase `start_period` to 90s
2. Check application logs
3. Verify port configuration
4. Test health endpoint manually

### Out of Memory

**Issue**: Container killed due to OOM

**Solutions**:
1. Increase memory limits
2. Optimize database buffer pool
3. Check for memory leaks
4. Scale horizontally

---

## 📊 Monitoring & Maintenance

### Built-in Monitoring

Coolify provides:
- **Resource usage graphs**
- **Deployment history**
- **Health check status**
- **Log streaming**

### External Monitoring (Optional)

Add these services to Coolify:

**Uptime Kuma**:
```yaml
services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    ports:
      - "3001:3001"
    volumes:
      - uptime:/app/data
```

Monitor: `https://your-domain.com/api/health/ready`

### Backups

**Automatic Database Backups**:

1. Add backup service to Docker Compose:

```yaml
services:
  backup:
    image: mariadb:10.11
    depends_on:
      - database
    volumes:
      - ./backups:/backups
    command: >
      bash -c "while true; do
        mysqldump -h database -u root -p$$MYSQL_ROOT_PASSWORD $$MYSQL_DATABASE | gzip > /backups/backup_$$(date +%Y%m%d_%H%M%S).sql.gz
        find /backups -name '*.sql.gz' -mtime +30 -delete
        sleep 86400
      done"
    environment:
      - MYSQL_ROOT_PASSWORD=${DATABASE_ROOT_PASSWORD}
      - MYSQL_DATABASE=${DATABASE_NAME}
```

2. Backups saved to `./backups` folder
3. Old backups auto-deleted after 30 days

---

## 🚀 Scaling

### Horizontal Scaling

In Coolify:
1. Go to your web service
2. Click **"Scale"**
3. Set replicas: `2` or more
4. Coolify automatically load balances

### Vertical Scaling

Increase resources:
1. Click **"Resources"**
2. Adjust Memory/CPU
3. Redeploy

---

## 🔐 Security Best Practices

### Environment Variables

- ✅ Use Coolify's encrypted environment variables
- ✅ Never commit secrets to Git
- ✅ Rotate secrets regularly

### Network Security

- ✅ Use internal networks for service communication
- ✅ Only expose web service publicly
- ✅ Database should be internal only

### SSL/TLS

- ✅ Coolify automatically provisions Let's Encrypt certificates
- ✅ Force HTTPS in Coolify settings
- ✅ HSTS enabled automatically

### Backups

- ✅ Enable automatic backups
- ✅ Test restoration process
- ✅ Store backups off-server

---

## 📝 Quick Start Checklist

- [ ] Install Coolify on server
- [ ] Create new project in Coolify
- [ ] Add Docker Compose configuration
- [ ] Set all environment variables
- [ ] Configure custom domain (optional)
- [ ] Deploy application
- [ ] Run database migrations
- [ ] Verify health checks passing
- [ ] Setup automatic backups
- [ ] Configure monitoring
- [ ] Test rollback procedure

---

## 🎯 Comparison: Deployment Methods

| Method | Complexity | Build Time | Best For |
|--------|-----------|------------|----------|
| **Docker Compose** | Low | 5-10 min | Full stack, production |
| **Nixpacks** | Very Low | 3-5 min | Simple deployments |
| **Dockerfile** | Medium | 5-10 min | Custom builds |

**Recommendation**: Use **Docker Compose** for production deployments with all services.

---

## 📚 Additional Resources

- [Coolify Documentation](https://coolify.io/docs)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [CS2Inspect Self-Hosting Guide](./self-hosting.md)
- [CS2Inspect GitHub](https://github.com/sak0a/cs2inspect-web)

---

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/sak0a/cs2inspect-web/issues)
- **Coolify Discord**: [Join](https://discord.gg/coolify)
- **Documentation**: This site

---

**Happy Deploying! 🚀**
