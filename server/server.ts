// src/server.ts
import { createServer } from "http";
import { setupVite, serveStatic, log } from "server/vite";
import { pool } from "server/db";
import { env } from "server/utils/environment";
import { RedisCache } from "server/cache";
import app from "server/app";

const port = env.PORT;
const server = createServer(app);

(async function bootstrap() {
  // Vite in dev; static in prod
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start HTTP server
  server.listen(port, "0.0.0.0", () => {
    log(`🌐 Frontend URL: ${env.FRONTEND_URL}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    log(`🛑 Received ${signal}. Starting graceful shutdown...`);

    // Close HTTP server
    server.close(() => {
      log('🔄 HTTP server closed');
    });

    try {
      // Close Redis connection
      await RedisCache.close();
      log("🔄 Redis connection closed");
    } catch (err) {
      log(`⚠️ Error closing Redis: ${(err as Error).message}`);
    }

    try {
      // Close database connection pool
      if (pool) {
        await pool.end();
        log("🔄 Database connection pool closed");
      } else {
        log("🔄 Database pool not initialized, skipping pool closure");
      }
    } catch (err) {
      log(`⚠️ Error closing database pool: ${(err as Error).message}`);
    }

    // Allow time for cleanup before force exit
    setTimeout(() => {
      log('✅ Graceful shutdown complete');
      process.exit(0);
    }, 2000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Don't rethrow after responding; just log and shut down gracefully.
  process.on("uncaughtException", (err) => {
    log(`💥 Uncaught Exception: ${(err as Error).message}`);
    log(`💥 Stack: ${(err as Error).stack}`);
    shutdown("UNCAUGHT_EXCEPTION");
  });
  
  process.on("unhandledRejection", (reason, promise) => {
    log(`💥 Unhandled Rejection at: ${promise}, reason: ${reason}`);
    shutdown("UNHANDLED_REJECTION");
  });
})();
