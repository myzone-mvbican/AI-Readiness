import cors from 'cors';
import { env } from 'server/utils/environment';

/**
 * CORS Middleware Configuration
 * Handles cross-origin requests with environment-aware origin validation
 */
export const corsMiddleware = cors({
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Define allowed origins
    const allowedOrigins = [
      // Add production domains here
      env.FRONTEND_URL
    ].filter(Boolean); // Remove undefined values

    // In development, allow all localhost origins
    if (env.NODE_ENV !== 'production' && origin && origin.startsWith('http://localhost:')) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'x-csrf-token',
    'X-Csrf-Token',
    'X-Trace-Id'
  ],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
});
