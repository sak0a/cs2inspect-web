# Deployment, Security & Performance <Badge type="danger" text="Production" />

Production deployment architecture, security measures, and performance optimizations.

## Deployment Architecture

```mermaid
graph LR
    subgraph "User's Browser"
        UI[Web UI<br/>Vue/Nuxt App]
    end
    
    subgraph "Hosting Platform"
        Vercel[Vercel<br/>Static + Serverless]
        CDN[Global CDN]
    end
    
    subgraph "Database"
        MariaDB[(MariaDB<br/>Persistent Storage)]
    end
    
    subgraph "External APIs"
        SteamAPI[Steam Web API]
        SteamGC[Steam GC]
    end
    
    UI -->|HTTPS| CDN
    CDN -->|Route| Vercel
    Vercel -->|Query| MariaDB
    Vercel -->|Auth/Data| SteamAPI
    Vercel -->|Item Inspect| SteamGC
    
    style UI fill:#4299e1
    style Vercel fill:#48bb78
    style MariaDB fill:#ed8936
    style SteamAPI fill:#667eea
    style SteamGC fill:#9f7aea
```

### Recommended Platforms

1. **Vercel** (Recommended)
   - Automatic HTTPS
   - Global CDN
   - Serverless functions
   - Zero-config deployment

2. **Docker**
   - Full control
   - Easy scaling
   - Health check support
   - Multi-container orchestration

3. **Node.js + PM2**
   - Traditional VPS deployment
   - Process management
   - Auto-restart on crash
   - Cluster mode support

See: [Deployment Guide](deployment.md) for detailed instructions.

---

## Security Architecture

### Authentication Security

**Steam OpenID**:
- Official Steam authentication system
- No password storage required
- Secure token exchange
- Session management with JWT

**JWT Sessions**:
- HTTP-only cookies
- CSRF protection
- Short expiration times
- Secure token signing

**Best Practices**:
```typescript
// Server-side JWT configuration
const JWT_CONFIG = {
  expiresIn: '24h',
  algorithm: 'HS256',
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'lax'
}
```

### API Security

**Rate Limiting**:
- Prevents abuse
- Per-IP and per-user limits
- Configurable thresholds

**Input Validation**:
- All inputs sanitized
- Type checking with TypeScript
- SQL injection prevention
- XSS protection

**CORS Configuration**:
```typescript
// Allowed origins only
cors: {
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}
```

### Database Security

**Connection Security**:
- TLS/SSL encrypted connections
- Credential management via environment variables
- Connection pooling with limits

**Query Safety**:
- Prepared statements
- Parameterized queries
- ORM-style query builders
- No raw SQL from user input

**Access Control**:
- Least privilege principle
- User-specific data isolation
- Foreign key constraints
- Cascade deletion rules

### Environment Variables

**Sensitive Data**:
- Never commit to repository
- Use `.env` files (gitignored)
- Production secrets in platform config
- Rotate credentials regularly

**Required Variables**:
```env
# Database
DATABASE_URL=mysql://user:pass@host:3306/dbname

# Steam API
STEAM_API_KEY=your_steam_api_key
STEAM_RETURN_URL=https://your-domain.com/api/auth/steam-callback

# JWT
JWT_SECRET=your_random_secret_key

# Environment
NODE_ENV=production
```

---

## Performance Optimizations

### Frontend Performance

**Code Splitting**:
- Automatic route-based splitting
- Dynamic component imports
- Vendor bundle separation

**Asset Optimization**:
- Minified JavaScript and CSS
- Gzip/Brotli compression
- Tree-shaking unused code
- Image optimization with CDN

**Lazy Loading**:
```vue
<script setup>
// Lazy load heavy components
const VisualCustomizer = defineAsyncComponent(() => 
  import('~/components/VisualCustomizerModal.vue')
)
</script>
```

### Backend Performance

**Database Indexing**:
- Primary keys on all tables
- Foreign key indexes
- Composite indexes for common queries
- Covering indexes for frequent lookups

**Query Optimization**:
- Avoid N+1 queries
- Use JOIN when appropriate
- Limit result sets
- Cache frequent queries

**Connection Pooling**:
```typescript
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  connectionLimit: 10,
  queueLimit: 0
})
```

### Caching Strategy

**Client-Side**:
- Pinia store for state
- LocalStorage for preferences
- SessionStorage for temporary data
- Service Worker for offline support

**Server-Side**:
- API response caching
- Static asset caching
- CDN edge caching
- Database query result caching

### API Response Times

**Target Metrics**:
- API endpoints: < 200ms
- Database queries: < 100ms
- Page load time: < 2s
- Time to interactive: < 3s

---

## Scalability Considerations

### Horizontal Scaling

**Application Tier**:
- Stateless serverless functions
- Load balancer distribution
- Auto-scaling based on traffic
- Multi-region deployment

**Database Tier**:
- Read replicas for queries
- Write master for updates
- Connection pooling
- Database sharding (if needed)

### Vertical Scaling

**Server Resources**:
- CPU: 2+ cores recommended
- RAM: 2GB+ for application
- Disk: SSD for database
- Network: High bandwidth for CDN

### Performance Monitoring

**Metrics to Track**:
- Response times
- Error rates
- Database query performance
- Memory usage
- CPU utilization

**Tools**:
- Built-in health check system
- Application Performance Monitoring (APM)
- Database query logs
- Server resource monitoring

---

## Monitoring & Logging

### Health Check System

**Endpoint**: `/api/health`

**Checks**:
- Database connectivity
- Steam API availability
- Disk space
- Memory usage
- Application status

**Status Dashboard**: `/status` page with real-time monitoring

See: [Health Checks Guide](HEALTH_CHECKS.md)

### Application Logging

**Log Levels**:
- ERROR: Critical failures
- WARN: Important warnings
- INFO: General information
- DEBUG: Development debugging

**Logged Events**:
- Authentication attempts
- API errors
- Database connection issues
- Steam API failures
- Performance bottlenecks

### Error Tracking

**Client-Side**:
- Console error logging
- API error responses
- User-friendly error messages

**Server-Side**:
- Structured error logging
- Stack trace capture
- Error notification system
- Database error logs

---

## Backup & Recovery

### Database Backups

**Automated Backups**:
- Daily full backups
- Point-in-time recovery
- Offsite backup storage
- Backup retention policy

**Manual Backups**:
```bash
# Export database
mysqldump -u user -p database > backup.sql

# Restore database
mysql -u user -p database < backup.sql
```

### Disaster Recovery

**Recovery Procedures**:
1. Identify failure point
2. Restore from latest backup
3. Replay transaction logs
4. Verify data integrity
5. Resume normal operations

**RTO/RPO Targets**:
- Recovery Time Objective (RTO): < 4 hours
- Recovery Point Objective (RPO): < 1 hour

---

## Related Documentation

- **[Deployment Guide](deployment.md)** - Detailed deployment instructions
- **[Health Checks](HEALTH_CHECKS.md)** - Monitoring system guide
- **[Frontend Architecture](architecture-frontend.md)** - Client-side architecture
- **[Backend Architecture](architecture-backend.md)** - Server-side architecture
- **[Architecture Overview](architecture.md)** - System overview
