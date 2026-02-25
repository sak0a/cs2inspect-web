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

- `docker-compose.coolify.yml` - **All-in-one for Coolify** (recommended — includes MariaDB, Web, Steam Service on a shared internal network)
- `docker-compose.yml` - Web + Steam Service only (requires external/Coolify-managed database)
- `docker-compose.prod.yml` - Full production stack (for non-Coolify servers)

#### Step 3: Configure Per-Service Environment Variables

Each service appears separately in Coolify. Click on a service → **"Environment Variables"** to configure it.

::: warning Values that must match
Some values are shared across services and **must be identical**:

- `DATABASE_PASSWORD`, `DATABASE_USER`, `DATABASE_NAME` → same on **database** and **web**
- `STEAM_API_KEY` → same on **web** and **steam-service**
- Steam service auth key → `API_KEYS` on **steam-service** must contain the value set as `STEAM_SERVICE_API_KEY` on **web**
:::

**database** service:

```bash
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_DATABASE=csinspect
MYSQL_USER=csinspect
MYSQL_PASSWORD=your_secure_db_password
```

**steam-service** service:

```bash
STEAM_API_KEY=your_steam_api_key
API_KEYS=your_service_api_key       # comma-separated keys clients use to auth
# Optional — needed for unmasked inspect URLs:
# STEAM_USERNAME=your_bot_username
# STEAM_PASSWORD=your_bot_password
```

**web** service:

```bash
JWT_TOKEN=your_64_character_secure_random_key    # generate with: openssl rand -hex 32
DATABASE_PASSWORD=your_secure_db_password         # must match database service
STEAM_API_KEY=your_steam_api_key                  # must match steam-service
STEAM_SERVICE_API_KEY=your_service_api_key        # must be listed in API_KEYS on steam-service
```

::: tip
`DATABASE_HOST` and `STEAM_SERVICE_URL` are pre-configured in the compose file to use internal Docker hostnames (`database:3306` and `http://steam-service:3001`). You don't need to set these unless you have a custom setup.
:::

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
**Version**: `11` (default, configurable via `MARIADB_VERSION`)
**Internal Port**: `3306` (always available to web/steam-service via `database:3306`)
**External Port**: Configurable via `DATABASE_PORT_PUBLIC` (default `3306`) — needed for plugin or external tool access

**Volumes**:
- `/var/lib/mysql` - Database data (named volume `db_data`)

**Configuration**:
```bash
DATABASE_ROOT_PASSWORD=<secret>
DATABASE_NAME=csinspect
DATABASE_USER=csinspect
DATABASE_PASSWORD=<secret>
# DATABASE_PORT_PUBLIC=5766    # external access port
# MARIADB_MAX_CONNECTIONS=100
```

### Steam Service

**Resource Type**: Docker Compose Service
**Port**: `3001` (internal only — web app connects via `http://steam-service:3001`)
**Build Context**: `services/steam-service`
**Health Check**: `/api/health/ready`

**Environment Variables**:
```bash
STEAM_API_KEY=<key>
API_KEYS=<comma_separated_api_keys>   # keys that clients use to authenticate
STEAM_USERNAME=<bot_username>          # optional, for unmasked inspect URLs
STEAM_PASSWORD=<bot_password>
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

The repository includes a ready-to-use Coolify compose file: **`docker-compose.coolify.yml`**

This file deploys all three services (MariaDB, Web App, Steam Service) on a shared internal Docker network. The web app connects to the steam-service via `http://steam-service:3001` internally — no TLS issues, no proxy hops.

Set `docker-compose.coolify.yml` as the Compose File in Coolify and configure the environment variables listed in [Step 3](#step-3-configure-per-service-environment-variables) above.

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

### Steam Service: `DEPTH_ZERO_SELF_SIGNED_CERT` / `fetch failed`

**Issue**: The web app can't connect to the Steam service when both are deployed as separate Coolify resources on the same server. HTTPS gives `DEPTH_ZERO_SELF_SIGNED_CERT`, HTTP gives `404 page not found`.

**Why this happens**: When services are deployed as separate Coolify resources, each gets its own Docker network. Requests to the public domain (e.g. `https://steam-service.example.com`) go through Coolify's reverse proxy (Traefik/Caddy), which uses a self-signed certificate internally. Node.js rejects this. Plain HTTP on port 80 returns 404 because the proxy only routes HTTPS.

**Solution — Use internal Docker networking**:

Instead of routing through the public domain, use the container's internal hostname. Set `STEAM_SERVICE_URL` to the internal address:

```bash
# DON'T use the public domain from inside Docker:
# STEAM_SERVICE_URL=https://steam-service.example.com  ← WRONG

# Use the internal container name + port instead:
STEAM_SERVICE_URL=http://steam-service:3001
```

For this to work, both containers must be on the same Docker network. Options:

1. **Docker Compose deployment** (recommended): Use `docker-compose.coolify.yml` — all services are on the same internal network and can reach each other by service name.

2. **Separate Coolify resources**: Connect both resources to the same Docker network in Coolify's settings (or use Coolify's default `coolify` network).

3. **Quick workaround** (dev only, never production): Add `NODE_TLS_REJECT_UNAUTHORIZED=0` to the web app's environment to accept the self-signed cert. This disables all TLS verification and is a security risk.

::: warning
Always prefer internal Docker networking over public domain URLs for service-to-service communication. It's faster (no proxy hop), avoids TLS issues, and doesn't expose internal traffic to the internet.
:::

---

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

- ✅ Use internal networks for service-to-service communication
- ✅ Only expose web service publicly via domain
- ✅ Database is internal by default — only expose externally via `DATABASE_PORT_PUBLIC` if the plugin runs on a different server

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
