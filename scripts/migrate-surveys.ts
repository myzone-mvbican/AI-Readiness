import { sql } from "drizzle-orm";
import ws from "ws";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool as NeonPool } from "@neondatabase/serverless";
import { neonConfig } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL || process.argv[2];

if (!dbUrl) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

neonConfig.webSocketConstructor = ws;
const pool = new NeonPool({ connectionString: dbUrl });
const db = drizzleNeon({ client: pool });

async function runMigration() {
  try {
    console.log("Step 1: Adding questions JSONB column...");
    await db.execute(sql`ALTER TABLE surveys ADD COLUMN IF NOT EXISTS questions JSONB;`);
    console.log("✓ Questions column added");

    console.log("Step 2: Making file_reference nullable...");
    await db.execute(sql`ALTER TABLE surveys ALTER COLUMN file_reference DROP NOT NULL;`);
    console.log("✓ file_reference is now nullable");

    console.log("Migration completed");
    process.exit(0);
  } catch (error: any) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

