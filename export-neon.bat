@echo off
REM Simple Neon to Local PostgreSQL Export for MZ Flight Director
set NEON_URL=postgresql://neondb_owner:npg_ACOwfW3d6Gvk@ep-curly-lake-a6itruar.us-west-2.aws.neon.tech/neondb?sslmode=require
set LOCAL_CONTAINER=mz-flight-director-db-dev
set LOCAL_USER=postgres
set LOCAL_DB=mzflightdirector

echo Dropping local database...
docker exec -i "%LOCAL_CONTAINER%" psql -U "%LOCAL_USER%" -c "DROP DATABASE IF EXISTS \"%LOCAL_DB%\";"

echo Creating local database...
docker exec -i "%LOCAL_CONTAINER%" psql -U "%LOCAL_USER%" -c "CREATE DATABASE \"%LOCAL_DB%\";"

echo Exporting from Neon to local...
docker run --rm -i postgres:16 pg_dump --no-owner --no-privileges --dbname="%NEON_URL%" | docker exec -i "%LOCAL_CONTAINER%" psql -U "%LOCAL_USER%" -d "%LOCAL_DB%"

echo Done! Local database cloned from Neon.