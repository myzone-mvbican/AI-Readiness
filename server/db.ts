import ws from "ws";
import pg from "pg";
import { log } from "server/vite";
import * as schema from "@shared/schema";
import { env } from "server/utils/environment"; 
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool as NeonPool } from "@neondatabase/serverless";
import { neonConfig } from "@neondatabase/serverless";

// Decide driver based on host
const dbUrl = env.DATABASE_URL!;
const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

let db: any;
let pool: any;
let driverLabel = '';

// Initialize database
if (isLocal) {
  // Use node-postgres for local Docker/Postgres
  pool = new pg.Pool({ connectionString: dbUrl });
  db = drizzlePg(pool, { schema });
  driverLabel = 'pg (node-postgres)';
} else {
  // Use Neon serverless for remote NeonDB
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: dbUrl });
  db = drizzleNeon({ client: pool, schema });
  driverLabel = '@neondatabase/serverless';
} 

// Debug logging for database connection
const dbHost = dbUrl.match(/@([^:/]+)/)?.[1] || 'unknown';
const dbPort = dbUrl.match(/:(\d+)\//)?.[1] || 'unknown';

log('='.repeat(60));
log('🔌 DATABASE CONNECTION INFO:');
log('='.repeat(60));
log(`📍 Environment: ${isLocal ? 'LOCAL' : 'REMOTE'}`);
log(`🌐 Host: ${dbHost}`);
log(`🔢 Port: ${dbPort}`);
log(`🔗 Connection String: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);
log(`🧰 Driver: ${driverLabel}`);
log('='.repeat(60));
log('✅ Database connection established');

export { db, pool };