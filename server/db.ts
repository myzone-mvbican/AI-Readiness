import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Determine which database URL to use based on environment
const getDatabaseUrl = () => {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.REPLIT_ENVIRONMENT === 'production';
  
  // If production database URL is explicitly set, use it
  if (isProduction && process.env.PRODUCTION_DATABASE_URL) {
    console.log('Using production database from PRODUCTION_DATABASE_URL');
    return process.env.PRODUCTION_DATABASE_URL;
  }
  
  // If production host variables are set, construct URL from components
  if (isProduction && process.env.PROD_PGHOST) {
    const prodUrl = `postgresql://${process.env.PROD_PGUSER || 'neondb_owner'}:${process.env.PROD_PGPASSWORD}@${process.env.PROD_PGHOST}/${process.env.PROD_PGDATABASE || 'neondb'}?sslmode=require`;
    console.log('Using production database from PROD_PG* variables');
    return prodUrl;
  }
  
  // For production without explicit production URL, use pooled connection
  if (isProduction && process.env.DATABASE_URL) {
    console.log('Using production database with connection pooling (same host)');
    // Convert regular URL to pooled URL by adding -pooler to hostname
    return process.env.DATABASE_URL.replace(
      /(@[^.]+)(\.[^/]+)/,
      '$1-pooler$2'
    );
  }
  
  // Default to development database
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  
  console.log('Using development database');
  return process.env.DATABASE_URL;
};

const databaseUrl = getDatabaseUrl();
export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
