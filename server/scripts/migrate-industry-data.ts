import { db } from "../db";
import { users, surveyStats } from "@shared/schema";
import { eq } from "drizzle-orm";

// Mapping from old industry names to NAICS codes
const INDUSTRY_MAPPING: Record<string, string> = {
  "technology": "541511",     // Technology / Software
  "healthcare": "621111",     // Healthcare
  "finance": "524210",        // Finance / Insurance
  "retail": "454110",         // Retail / E-commerce
  "manufacturing": "31-33",   // Manufacturing
  "education": "611310",      // Education
  "government": "921190",     // Government
  "energy": "221118",         // Energy / Utilities
  "transportation": "484121", // Transportation / Logistics
  "other": "999999",          // Other
};

async function migrateIndustryData() {
  try {
    console.log("Starting industry data migration...");

    // 1. Migrate users table
    console.log("Migrating users table...");
    const allUsers = await db.select().from(users);
    
    for (const user of allUsers) {
      if (user.industry && INDUSTRY_MAPPING[user.industry]) {
        const newIndustryCode = INDUSTRY_MAPPING[user.industry];
        await db
          .update(users)
          .set({ industry: newIndustryCode })
          .where(eq(users.id, user.id));
        
        console.log(`Updated user ${user.id}: ${user.industry} -> ${newIndustryCode}`);
      }
    }

    // 2. Migrate surveyStats table
    console.log("Migrating survey_stats table...");
    const allStats = await db.select().from(surveyStats);
    
    for (const stat of allStats) {
      if (stat.industry && INDUSTRY_MAPPING[stat.industry]) {
        const newIndustryCode = INDUSTRY_MAPPING[stat.industry];
        await db
          .update(surveyStats)
          .set({ industry: newIndustryCode })
          .where(eq(surveyStats.id, stat.id));
        
        console.log(`Updated survey_stats ${stat.id}: ${stat.industry} -> ${newIndustryCode}`);
      }
    }

    console.log("Industry data migration completed successfully!");

  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateIndustryData()
    .then(() => {
      console.log("Migration completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { migrateIndustryData, INDUSTRY_MAPPING };