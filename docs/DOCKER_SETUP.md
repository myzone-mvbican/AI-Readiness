# Docker Setup for MZ Flight Director

This project includes Docker configuration for PostgreSQL and Redis services for development. The application runs locally while using containerized databases.

## Quick Start

### Option 1: Fresh Start (New Database)
1. **Start the PostgreSQL and Redis services:**
   ```bash
   npm run docker:services:up
   ```

2. **Set up your environment variables:**
   Create a `.env` file in the root directory with:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mzflightdirector
   REDIS_URL=redis://localhost:6379
   PGDATABASE=mzflightdirector
   PGHOST=localhost
   PGPORT=5432
   PGUSER=postgres
   PGPASSWORD=postgres
   ```

3. **Run database migrations:**
   ```bash
   npm run db:push
   ```

4. **Start your development server:**
   ```bash
   npm run dev
   ```

### Option 2: Use Pre-configured Environment Files
1. **For local development:**
   ```bash
   npm run use:dev
   ```

2. **For Neon database:**
   ```bash
   npm run use:remote
   ```

3. **Start the database services:**
   ```bash
   npm run docker:services:up
   ```

## Available Docker Commands

### Database Commands
- `npm run docker:db:up` - Start PostgreSQL container only
- `npm run docker:db:logs` - View PostgreSQL logs
- `npm run docker:db:reset` - Reset PostgreSQL database (removes all data)

### Redis Commands
- `npm run docker:redis:up` - Start Redis container only
- `npm run docker:redis:logs` - View Redis logs

### Service Commands
- `npm run docker:services:up` - Start all services (PostgreSQL + Redis)
- `npm run docker:services:down` - Stop all services
- `npm run docker:logs` - View all service logs
- `npm run docker:reset` - Reset everything and start fresh

## Docker Configuration

### PostgreSQL Service
- **Image:** PostgreSQL 16 Alpine
- **Port:** 5432 (configurable via PGPORT env var)
- **Database:** mzflightdirector (configurable via PGDATABASE env var)
- **User:** postgres (configurable via PGUSER env var)
- **Password:** postgres (configurable via PGPASSWORD env var)
- **Health Check:** Uses `pg_isready` to verify database readiness

### Redis Service
- **Image:** Redis 8 Alpine
- **Port:** 6379
- **Persistence:** AOF (Append Only File) enabled
- **Health Check:** Uses `redis-cli ping` to verify Redis readiness

### Data Persistence
- **PostgreSQL:** Data persisted in `postgres_data_dev` volume
- **Redis:** Data persisted in `redis_data_dev` volume

To completely reset all data, use:
```bash
npm run docker:reset
```

## Environment Variables

### Local Development (env.dev)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mzflightdirector
REDIS_URL=redis://localhost:6379
PGDATABASE=mzflightdirector
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
```

### Remote Database (env.remote)
```env
DATABASE_URL=postgresql://neondb_owner:npg_ACOwfW3d6Gvk@ep-curly-lake-a6itruar.us-west-2.aws.neon.tech/neondb?sslmode=require
REDIS_URL=redis://localhost:6379
PGDATABASE=neondb
PGHOST=ep-curly-lake-a6itruar.us-west-2.aws.neon.tech
PGPORT=5432
PGUSER=neondb_owner
PGPASSWORD=npg_ACOwfW3d6Gvk
```

## Development Workflow

### Local Development with Docker Services
1. **Start database services:**
   ```bash
   npm run docker:services:up
   npm run use:dev
   npm run dev
   ```

### Using Remote Database
1. **Use remote database configuration:**
   ```bash
   npm run use:remote
   npm run dev
   ```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL container is healthy: `docker-compose ps`
- Check database logs: `npm run docker:db:logs`
- Verify environment variables are set correctly

### Redis Connection Issues
- Ensure Redis container is healthy: `docker-compose ps`
- Check Redis logs: `npm run docker:redis:logs`
- Verify Redis URL is correct in environment variables

### Port Conflicts
- Change ports in docker-compose.yml if needed
- Update environment variables accordingly
- Restart containers after port changes

## Security Notes

- Database credentials should be changed in production
- Environment files contain sensitive information - never commit to version control
- Use Docker secrets for production deployments
- Redis is exposed on localhost only (not accessible from outside Docker network)

## Performance Optimization

- Health checks ensure proper startup order
- Volume mounts optimize development experience
- AOF persistence provides Redis data durability
- Alpine images reduce container size and attack surface
