# ⚠️ URGENT: Remove dropSchema Configuration ⚠️

## What was added:
1. **dropSchema: true** in TypeORM configuration
2. Temporary config file: `src/config/database-temp-fix.config.ts`
3. Modified files:
   - `src/app.module.ts`
   - `src/database/data-source.ts`

## Why it was added:
To fix the duplicate index conflict on the `users.email` column by completely dropping and recreating the schema.

## When to remove:
**IMMEDIATELY AFTER** the application starts successfully and the index conflict is resolved.

## How to remove:

### Option 1: Automatic removal (recommended)
```bash
./scripts/remove-dropschema.sh
```

### Option 2: Manual removal
1. Delete `src/config/database-temp-fix.config.ts`
2. Remove the import and dropSchema configuration from `src/app.module.ts`
3. Remove the import from `src/database/data-source.ts`

## Steps to fix the issue:

1. **Start the application** (this will drop all tables):
   ```bash
   npm run start:dev
   ```

2. **Wait for the schema to be recreated**

3. **Stop the application** (Ctrl+C)

4. **Remove dropSchema configuration**:
   ```bash
   ./scripts/remove-dropschema.sh
   ```

5. **Start the application again**:
   ```bash
   npm run start:dev
   ```

6. **Seed the database**:
   ```bash
   npm run seed:full
   ```

## ⚠️ WARNING ⚠️
**dropSchema: true** will DELETE ALL DATA in your database!
Only use this in development environment.

---
Created: ${new Date().toISOString()}
Remove by: ASAP after fixing the index issue