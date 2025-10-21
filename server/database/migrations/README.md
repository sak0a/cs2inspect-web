# Database Migrations

This directory contains database migration scripts that build upon the initial schema defined in `init.sql`.

## Migration Files

Migrations are numbered sequentially and should be applied in order:

1. **`001_add_health_checks.sql`** - Adds health monitoring tables
   - `health_check_history` - Stores historical health check results
   - `health_check_config` - Stores configuration for health checks

## Applying Migrations

### Using MySQL CLI

```bash
# Apply a specific migration
mysql -h <host> -u <user> -p <database> < server/database/migrations/001_add_health_checks.sql

# Or apply all migrations in order
for file in server/database/migrations/*.sql; do
  echo "Applying migration: $file"
  mysql -h <host> -u <user> -p <database> < "$file"
done
```

### Using MariaDB CLI

```bash
# Apply a specific migration
mariadb -h <host> -u <user> -p <database> < server/database/migrations/001_add_health_checks.sql
```

## Creating New Migrations

When adding new database changes:

1. Create a new file with the next sequential number: `00X_description.sql`
2. Use descriptive names (e.g., `002_add_user_preferences.sql`)
3. Include both the schema changes and any required data updates
4. Document the changes in this README

## Migration Guidelines

- **Idempotent**: Migrations should be safe to run multiple times using `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE IF EXISTS`, etc.
- **Sequential**: Always apply migrations in numerical order
- **Tested**: Test migrations on a development database before applying to production
- **Documented**: Update this README when adding new migrations

## Initial Schema

The initial database schema is defined in `init.sql` (located in the parent `database/` directory). This file should be used for fresh database setup.

For existing databases, use only the migration files to update the schema incrementally.
