import cors from "cors";
import { env } from "server/utils/environment";

/**
 * CORS Middleware Configuration
 * Handles cross-origin requests with environment-aware origin validation
 */
export const corsMiddleware = cors({
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Define allowed origins
    const allowedOrigins = [
      // Add domains here
      "https://12117086-597e-46e4-a7fb-e0010820ad61-00-3nh6gunq158cm.janeway.replit.dev",
      "https://abfd7d50-659f-4b18-b01c-1598baef61ec-00-39eptfts4f6nz.picard.replit.dev",
      env.FRONTEND_URL,
    ].filter(Boolean); // Remove undefined values

    // In development, allow all localhost and 127.0.0.1 origins
    if (
      env.NODE_ENV !== "production" &&
      origin &&
      (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:"))
    ) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true, // Allow cookies to be sent
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "x-csrf-token",
    "X-Csrf-Token",
    "X-Trace-Id",
  ],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
});
