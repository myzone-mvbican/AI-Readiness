import { log } from "server/vite";
import { config } from "dotenv";
config({ override: true });

(async () => {
  try {
    await import("./server");
    log("🚀 Server bootstrap complete");
  } catch (err) {
    log(`❌ Failed to start server: ${(err as Error).message}`);
    process.exit(1);
  }
})();