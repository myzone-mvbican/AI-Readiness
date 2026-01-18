# Database Scripts

This folder contains utility scripts for database operations and migrations.

## Available Scripts

### Password Migration Scripts

#### Original Migration Script

**File**: `migrate-passwords.js`

**Purpose**: Migrates all user passwords from bcrypt to Argon2 for improved security.

**Usage**:
```bash
npm run migrate:passwords
```

**What it does**:
- Finds all users with old bcrypt passwords (`$2b$` or `$2a$` format)
- Updates them to use Argon2id hashing
- Sets a temporary default password for all users
- Resets password security fields (history, attempts, lockout)
- Provides migration summary and next steps

**Important Notes**:
- ⚠️ **All users will need to reset their passwords** after running this script
- The script sets a temporary password that users should change immediately
- Consider sending password reset emails to all users after migration
- Run this script in a maintenance window

#### Targeted Migration Script

**File**: `migrate-passwords-targeted.js`

**Purpose**: Flexible password migration with options for individual users or specific scenarios.

**Usage**:
```bash
npm run migrate:passwords:targeted <command> [options]
```

**Available Commands**:

1. **Status Check**:
   ```bash
   npm run migrate:passwords:targeted status
   ```
   - Shows current password status (bcrypt vs argon2)
   - Lists all users and their password types

2. **Dry Run**:
   ```bash
   npm run migrate:passwords:targeted dry-run
   ```
   - Preview what would be migrated without making changes
   - Safe to run anytime

3. **Migrate All Users**:
   ```bash
   npm run migrate:passwords:targeted migrate-all [password]
   ```
   - Migrates all bcrypt passwords to argon2
   - Optional: specify custom default password
   - Default password: `TempPassword123!`

4. **Migrate Specific User**:
   ```bash
   npm run migrate:passwords:targeted migrate-user <userId> <newPassword>
   ```
   - Migrates password for a specific user
   - Sets the exact password you specify
   - Example: `npm run migrate:passwords:targeted migrate-user 1 "SecurePassword123!"`

**Examples**:
```bash
# Check current status
npm run migrate:passwords:targeted status

# Preview migration
npm run migrate:passwords:targeted dry-run

# Migrate specific user
npm run migrate:passwords:targeted migrate-user 1 "NewSecurePassword123!"

# Migrate all users with custom password
npm run migrate:passwords:targeted migrate-all "TempPassword456!"
```

**Security Features**:
- Uses Argon2id (more secure than bcrypt)
- Memory cost: 64 MB
- Time cost: 3 iterations
- Parallelism: 1 thread
- Matches PasswordSecurityService configuration

## Environment Requirements

Make sure your database connection is properly configured in your environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- For local development: `postgresql://postgres:postgres@localhost:5432/mzflightdirector`
- For production: Your Neon database URL

## Running Scripts

All scripts use `tsx` for TypeScript execution and can be run with:

```bash
npm run migrate:passwords
```

Or directly with tsx:

```bash
npx tsx scripts/migrate-passwords.js
```

