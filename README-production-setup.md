# Production Database Setup Guide

## Current Status
✅ Database connection logic configured to support production environment
✅ Production database host identified: `ep-calm-forest-afa44mbc-2.us-west-2.aws.neon.tech`

## Next Steps to Connect to Production Database

### Option 1: Set Complete Production Database URL (Recommended)

1. **Get Full Production Database URL**:
   - Go to your Production Database → Settings tab in Replit
   - Copy the complete DATABASE_URL (should look like):
   ```
   postgresql://neondb_owner:ACTUAL_PASSWORD@ep-calm-forest-afa44mbc-2.us-west-2.aws.neon.tech/neondb?sslmode=require
   ```

2. **Add as Replit Secret**:
   - Go to your Replit project → Settings → Secrets
   - Add new secret:
     - **Key**: `PRODUCTION_DATABASE_URL`
     - **Value**: [paste the complete URL from step 1]

### Option 2: Set Individual Environment Variables

Add these secrets to your Replit project:

```
PROD_PGHOST=ep-calm-forest-afa44mbc-2.us-west-2.aws.neon.tech
PROD_PGUSER=neondb_owner
PROD_PGPASSWORD=[actual production password]
PROD_PGDATABASE=neondb
```

## Running in Production Mode

Once you've added the secrets, run:

```bash
# Set production environment and run
NODE_ENV=production npm run dev
```

Or use the script I created:
```bash
./set-production-env.sh
```

## What Happens When Connected

The system will automatically:
- Detect production environment
- Connect to your production database (ep-calm-forest-afa44mbc)
- You can then run the migration to copy development data to production

## Current Database Configuration

The `server/db.ts` now supports:
1. `PRODUCTION_DATABASE_URL` (complete connection string) ✅
2. `PROD_PGHOST` + other PROD_PG* variables ✅
3. Automatic pooled connection for production ✅
4. Development database fallback ✅

## Verification

After setting up secrets, the console should show:
```
Using production database from PRODUCTION_DATABASE_URL
```

Then you can migrate the development data to production.