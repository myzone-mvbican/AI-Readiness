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
    console.log('Using production database');
    return process.env.PRODUCTION_DATABASE_URL;
  }
  
  // For production without explicit production URL, use pooled connection
  if (isProduction && process.env.DATABASE_URL) {
    console.log('Using production database with connection pooling');
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
