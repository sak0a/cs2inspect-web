# Health Check Endpoints

## Overview

Health check endpoints are used by container orchestrators (Kubernetes, Docker Swarm) and load balancers to determine application health and readiness.

::: info No Authentication Required
All health check endpoints are public and do not require authentication.
:::

## Liveness Probe

### `GET /api/health/live`

Check if the application process is running.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-10-21T00:00:00.000Z"
}
```

**Status Codes**:
| Code | Meaning |
|------|---------|
| `200 OK` | Application is alive |

**Usage**: Container orchestrators use this to determine if the container should be restarted.

---

## Readiness Probe

### `GET /api/health/ready`

Check if the application is ready to serve traffic.

**Response (Healthy)**:
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

**Response (Unhealthy)**:
```json
{
  "status": "fail",
  "timestamp": "2024-10-21T00:00:00.000Z",
  "ready": false,
  "checks": [
    {
      "name": "database",
      "status": "fail",
      "latency_ms": 5000,
      "error": "Connection timeout"
    }
  ]
}
```

**Status Codes**:
| Code | Meaning |
|------|---------|
| `200 OK` | All critical dependencies are healthy |
| `503 Service Unavailable` | One or more critical dependencies are unhealthy |

**Critical Checks**:
- Database connectivity
- Environment configuration

---

## Detailed Health Information

### `GET /api/health/details`

Get comprehensive health information for all system components.

**Response**:
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
      }
    },
    {
      "name": "environment",
      "status": "ok",
      "latency_ms": 2,
      "message": "All required environment variables present",
      "metadata": {
        "variables_checked": 10,
        "variables_present": 10
      }
    },
    {
      "name": "steam_api",
      "status": "ok",
      "latency_ms": 250,
      "message": "Steam API accessible"
    },
    {
      "name": "disk_space",
      "status": "ok",
      "latency_ms": 5,
      "metadata": {
        "total_gb": 100,
        "used_gb": 45,
        "available_gb": 55,
        "usage_percent": 45
      }
    },
    {
      "name": "memory",
      "status": "ok",
      "latency_ms": 1,
      "metadata": {
        "total_mb": 4096,
        "used_mb": 1024,
        "free_mb": 3072,
        "usage_percent": 25
      }
    }
  ]
}
```

**Available Checks**:
| Check | Description | Critical |
|-------|-------------|----------|
| `database` | Database connectivity and pool status | ✅ |
| `environment` | Environment variable validation | ✅ |
| `steam_api` | Steam API accessibility | ❌ |
| `disk_space` | Available disk space | ❌ |
| `memory` | Memory usage | ❌ |

---

## Health History

### `GET /api/health/history`

Get historical health check data with trends.

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `hours` | number | 24 | Hours of history (max: 168) |
| `component` | string | - | Filter by component name |

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2024-10-21T00:00:00.000Z",
      "component": "database",
      "status": "ok",
      "latency_ms": 15,
      "metadata": {
        "pool_active_connections": 2
      }
    },
    {
      "timestamp": "2024-10-21T00:01:00.000Z",
      "component": "database",
      "status": "ok",
      "latency_ms": 18,
      "metadata": {
        "pool_active_connections": 3
      }
    }
  ],
  "summary": {
    "total_checks": 1440,
    "uptime_percentage": 99.9,
    "average_latency_ms": 16,
    "max_latency_ms": 45
  }
}
```

**Usage**: Status dashboard uses this to display health trends and uptime statistics.

---

## Steam Service Proxy Health

### `GET /api/health/proxy`

Check the health of the external Steam service proxy (if configured).

**Response**:
```json
{
  "status": "ok",
  "service": "steam-service",
  "latency_ms": 150,
  "message": "Steam service is healthy"
}
```

---

## Kubernetes Configuration Example

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: cs2inspect
    livenessProbe:
      httpGet:
        path: /api/health/live
        port: 3000
      initialDelaySeconds: 10
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /api/health/ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 5
```

## Docker Compose Example

```yaml
services:
  app:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health/ready"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```
