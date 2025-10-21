# Health Check System Documentation

## Overview

The CS2 Inspect Web application includes a comprehensive health check system that monitors the status of all critical dependencies and services. This system provides real-time and historical health data through multiple endpoints and a visual status dashboard.

## Health Check Endpoints

### 1. Liveness Probe - `/api/health/live`

**Purpose:** Indicates if the application process is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-10-21T00:00:00.000Z"
}
```

**Status Codes:**
- `200 OK` - Process is alive

**Usage:** Container orchestrators use this to determine if the container should be restarted.

---

### 2. Readiness Probe - `/api/health/ready`

**Purpose:** Indicates if the application is ready to serve traffic.

**Response (Healthy):**
```json
{
  "status": "ok",
  "timestamp": "2024-10-21T00:00:00.000Z",
  "ready": true,
  "checks": [
    {
      "name": "database",
      "status": "ok",
      "latency_ms": 15
    },
    {
      "name": "environment",
      "status": "ok",
      "latency_ms": 2
    }
  ]
}
```

**Response (Unhealthy):**
```json
{
  "status": "fail",
  "timestamp": "2024-10-21T00:00:00.000Z",
  "ready": false,
  "checks": [
    {
      "name": "database",
      "status": "fail",
      "latency_ms": 5000
    }
  ]
}
```

**Status Codes:**
- `200 OK` - All critical dependencies are healthy
- `503 Service Unavailable` - One or more critical dependencies are unhealthy

**Critical Checks:**
- Database connectivity
- Environment configuration

**Usage:** Load balancers and orchestrators use this to determine if traffic should be routed to this instance.

---

### 3. Detailed Health - `/api/health/details`

**Purpose:** Provides detailed health information for all system components.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-10-21T00:00:00.000Z",
  "checks": [
    {
      "name": "database",
      "status": "ok",
      "latency_ms": 15,
      "message": "Database connection healthy",
      "metadata": {
        "pool_active_connections": 2,
        "pool_total_connections": 5,
        "pool_idle_connections": 3
      },
      "checked_at": "2024-10-21T00:00:00.000Z"
    },
    {
      "name": "steam_api",
      "status": "ok",
      "latency_ms": 1,
      "message": "Steam API key configured",
      "metadata": {
        "api_key_length": 32,
        "has_steam_username": true,
        "has_steam_password": true
      },
      "checked_at": "2024-10-21T00:00:00.000Z"
    },
    {
      "name": "steam_client",
      "status": "ok",
      "latency_ms": 5,
      "message": "Steam client ready - connected",
      "metadata": {
        "is_ready": true,
        "status": "connected",
        "queue_length": 0,
        "unmasked_support": true
      },
      "checked_at": "2024-10-21T00:00:00.000Z"
    },
    {
      "name": "environment",
      "status": "ok",
      "latency_ms": 1,
      "message": "All required environment variables present",
      "metadata": {
        "required_vars_count": 5,
        "present_vars_count": 5,
        "missing_vars": [],
        "node_env": "production",
        "port": "3000"
      },
      "checked_at": "2024-10-21T00:00:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Always returns 200, check individual component statuses

**Health Checks:**
- **Database:** Connection health, latency, connection pool status
- **Steam API:** API key configuration, credentials presence
- **Steam Client:** CS2 inspect client connection status, queue health
- **Environment:** Required environment variables validation

---

### 4. Historical Health Data - `/api/health/history`

**Purpose:** Provides historical health check data for visualization.

**Query Parameters:**
- `check_name` (optional) - Filter by specific check name
- `start_time` (optional) - Start of time range (ISO 8601 format), defaults to 24 hours ago
- `end_time` (optional) - End of time range (ISO 8601 format)
- `limit` (optional) - Maximum number of data points, defaults to 100

**Example Request:**
```
GET /api/health/history?check_name=database&start_time=2024-10-20T00:00:00Z&limit=200
```

**Response:**
```json
[
  {
    "check_name": "database",
    "data_points": [
      {
        "timestamp": "2024-10-21T00:00:00.000Z",
        "status": "ok",
        "latency_ms": 15
      },
      {
        "timestamp": "2024-10-21T00:01:00.000Z",
        "status": "ok",
        "latency_ms": 18
      }
    ]
  }
]
```

**Status Codes:**
- `200 OK` - Returns historical data (may be empty array)

---

## Status Dashboard

A visual status dashboard is available at `/status` that provides:

- **Overall System Status Banner** - Quick view of overall health
- **Individual Service Cards** - Status cards for each dependency with:
  - Current status (Operational/Degraded/Failed)
  - Response latency
  - Status message
- **Historical Performance Charts** - Time-series graphs showing:
  - Status changes over time
  - Latency trends
  - Configurable time ranges (1h, 6h, 24h, 7d)
- **Auto-refresh** - Automatically updates every 30 seconds

### Accessing the Status Page

Navigate to: `http://your-domain.com/status`

---

## Health Status Values

Health checks return one of three status values:

- **`ok`** - Service is fully operational
- **`degraded`** - Service is operational but performance is below normal thresholds
- **`fail`** - Service is unavailable or not functioning

### Latency Thresholds

Default thresholds for degraded/failed status:

| Service | Degraded | Failed |
|---------|----------|--------|
| Database | > 50ms | > 200ms |
| Steam API | > 300ms | > 1000ms |
| Steam Client | > 500ms | > 2000ms |
| Environment | > 10ms | > 50ms |

---

## Background Sampling

The health check system includes a background sampler that:

- Runs health checks every 60 seconds
- Persists results to the database for historical tracking
- Automatically cleans up data older than 7 days
- Starts automatically when the server starts

---

## Docker Health Check

The Dockerfile includes a `HEALTHCHECK` instruction that:

- Calls `/api/health/ready` endpoint
- Runs every 30 seconds
- Has a 5-second timeout
- Allows 30 seconds for startup
- Retries 3 times before marking as unhealthy

Container orchestrators (Docker, Kubernetes, etc.) use this to automatically restart unhealthy containers.

---

## Database Schema

The health check system uses two database tables:

### `health_check_history`
Stores historical health check results:
- `id` - Primary key
- `check_name` - Name of the health check
- `status` - Health status (ok/degraded/fail)
- `latency_ms` - Response latency in milliseconds
- `message` - Status message or error details
- `metadata` - Additional check-specific data (JSON)
- `checked_at` - Timestamp of the check

### `health_check_config`
Stores configuration for health checks:
- `id` - Primary key
- `check_name` - Name of the health check
- `enabled` - Whether the check is enabled
- `warning_threshold_ms` - Latency threshold for degraded status
- `error_threshold_ms` - Latency threshold for error status

### Database Setup

**For new installations:**

Initialize the database with the base schema:
```bash
mysql -h <host> -u <user> -p <database> < server/database/init.sql
```

Then apply the health check migration:
```bash
mysql -h <host> -u <user> -p <database> < server/database/migrations/001_add_health_checks.sql
```

**For existing installations:**

Apply only the health check migration:
```bash
mysql -h <host> -u <user> -p <database> < server/database/migrations/001_add_health_checks.sql
```

See `server/database/migrations/README.md` for more details on the migration system.

---

## Monitoring and Alerting

### Recommended Monitoring Setup

1. **External Monitoring**
   - Set up external monitoring (e.g., UptimeRobot, Pingdom) to check `/api/health/ready`
   - Alert on 503 status codes or timeouts

2. **Prometheus Integration** (Optional)
   - Export health metrics to Prometheus
   - Create Grafana dashboards for visualization
   - Set up alerts based on status and latency thresholds

3. **Log Monitoring**
   - Monitor application logs for health check failures
   - Set up alerts for repeated failures

### Alert Thresholds

Recommended alert conditions:
- `/api/health/ready` returns 503 for more than 2 consecutive checks
- Any service shows `fail` status for more than 5 minutes
- Database latency exceeds 200ms for more than 3 consecutive minutes
- Steam client disconnects when credentials are configured

---

## Troubleshooting

### Health Check Fails on Startup

**Symptom:** Container marked unhealthy immediately after start

**Solution:** 
- Increase `start_period` in Dockerfile HEALTHCHECK
- Verify database connectivity
- Check environment variables are properly set

### Database Health Check Fails

**Symptom:** Database shows `fail` status

**Common Causes:**
- Database server is down or unreachable
- Invalid database credentials
- Connection pool exhausted
- Network issues

**Solutions:**
- Verify database server is running
- Check DATABASE_* environment variables
- Review connection pool settings
- Check network connectivity

### Steam Client Health Check Fails

**Symptom:** Steam client shows `fail` status when credentials are configured

**Common Causes:**
- Invalid Steam credentials
- Steam servers are down
- Rate limiting
- Network issues

**Solutions:**
- Verify STEAM_USERNAME and STEAM_PASSWORD
- Check Steam server status
- Ensure Steam account is not logged in elsewhere
- Check network connectivity to Steam servers

### Historical Data Not Appearing

**Symptom:** Status page shows no historical data

**Common Causes:**
- Database tables not initialized
- Sampler not running
- Insufficient permissions

**Solutions:**
- Run health_schema.sql to create tables
- Check server logs for sampler errors
- Verify database user has INSERT permissions on health_check_history table

---

## Environment Variables

The health check system uses these environment variables:

**Required:**
- `DATABASE_HOST` - Database server hostname
- `DATABASE_USER` - Database username
- `DATABASE_PASSWORD` - Database password
- `DATABASE_NAME` - Database name
- `JWT_TOKEN` - JWT secret token

**Optional:**
- `DATABASE_PORT` - Database port (default: 3306)
- `DATABASE_CONNECTION_LIMIT` - Max connections (default: 5)
- `STEAM_API_KEY` - Steam API key
- `STEAM_USERNAME` - Steam account username
- `STEAM_PASSWORD` - Steam account password
- `LOG_API_REQUESTS` - Enable request logging (default: false)

---

## Best Practices

1. **Monitor Regularly**
   - Check the status dashboard daily
   - Set up automated alerts for failures

2. **Review Historical Trends**
   - Use historical data to identify patterns
   - Look for gradual degradation over time

3. **Test Health Checks**
   - Regularly verify health endpoints respond correctly
   - Test failover scenarios

4. **Keep Data Fresh**
   - The system automatically cleans up data older than 7 days
   - Adjust retention period if needed in sampler.ts

5. **Secure Endpoints**
   - `/api/health/live` and `/api/health/ready` are public (needed for orchestrators)
   - Consider protecting `/api/health/details` and `/api/health/history` with authentication
   - Use firewall rules to restrict access to health endpoints from untrusted sources

---

## API Rate Limits

Health check endpoints are lightweight and can be called frequently:

- `/api/health/live` - No rate limit (very fast)
- `/api/health/ready` - Recommended: max 1 call per 5 seconds
- `/api/health/details` - Recommended: max 1 call per 10 seconds
- `/api/health/history` - Recommended: max 1 call per 30 seconds

The status page auto-refresh uses these recommended intervals.
