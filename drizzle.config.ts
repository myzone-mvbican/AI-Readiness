import { defineConfig } from "drizzle-kit";
import { env } from "./server/utils/environment"; 

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
