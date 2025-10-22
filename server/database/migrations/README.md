# Database Migrations

This directory contains database migration scripts that are automatically executed when the server starts.

## How It Works

The migration system automatically:
- Runs all pending migrations on server startup
- Tracks executed migrations in the `_migrations` table
- Ensures migrations are executed in sequential order (000_, 001_, 002_, etc.)
- Skips already executed migrations

## Migration Files

Migrations are numbered sequentially and applied in order:

0. **`000_initial.sql`** - Initial database schema (base tables)
   - Player loadouts, weapons, agents, gloves, etc.
   
1. **`001_add_health_checks.sql`** - Adds health monitoring tables
   - `health_check_history` - Stores historical health check results
   - `health_check_config` - Stores configuration for health checks

## Automatic Migration Execution

**Migrations run automatically on server startup!**

When the server starts, it will:
1. Check for pending migrations
2. Execute them in sequential order (000_, 001_, 002_, etc.)
3. Track execution in the `_migrations` table
4. Log progress to the console

No manual intervention is required for normal operation.

## Manual Migration Application (if needed)

If you need to apply migrations manually (e.g., troubleshooting):

### Using MySQL CLI

```bash
# Apply a specific migration
mysql -h <host> -u <user> -p <database> < server/database/migrations/000_initial.sql

# Or apply all migrations in order
for file in server/database/migrations/*.sql; do
  echo "Applying migration: $file"
  mysql -h <host> -u <user> -p <database> < "$file"
done
```

### Using MariaDB CLI

```bash
# Apply a specific migration
mariadb -h <host> -u <user> -p <database> < server/database/migrations/000_initial.sql
```

## Creating New Migrations

When adding new database changes:

1. Create a new file with the next sequential number: `00X_description.sql`
2. Use descriptive names (e.g., `002_add_user_preferences.sql`)
3. Use UPPERCASE SQL keywords (CREATE, TABLE, INSERT, etc.)
4. Use `IF NOT EXISTS` for all CREATE statements
5. Include both the schema changes and any required data updates
6. Document the changes in this README
7. Restart the server - migrations will run automatically

## Migration Guidelines

- **Automatic**: Migrations run automatically on server startup
- **Idempotent**: Use `CREATE TABLE IF NOT EXISTS`, etc. to make migrations safe to re-run
- **Sequential**: Always use sequential numbering (000_, 001_, 002_, etc.)
- **Uppercase**: Use UPPERCASE for SQL keywords (CREATE, TABLE, INT, VARCHAR, etc.)
- **Tested**: Test migrations on a development database before deploying
- **Documented**: Update this README when adding new migrations
- **Tracked**: The system automatically tracks executed migrations in `_migrations` table

## Migration Tracking

The system uses a `_migrations` table to track which migrations have been executed:
- Automatically created on first run
- Contains filename and execution timestamp
- Prevents duplicate execution
- Can be queried to see migration history:

```sql
SELECT * FROM _migrations ORDER BY executed_at;
```

## Initial Schema

The initial database schema is in `000_initial.sql`. This migration:
- Contains all base tables (loadouts, weapons, agents, etc.)
- Uses UPPERCASE SQL keywords and `IF NOT EXISTS`
- Is automatically executed on first server startup

For existing databases created with the old `init.sql`, the system will safely skip already-existing tables thanks to `IF NOT EXISTS`.
