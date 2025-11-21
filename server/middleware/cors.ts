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

    // In development, allow all origins to support Google OAuth and other external services
    if (env.NODE_ENV !== 'production') {
      callback(null, true);
      return;
    }

    // In production, restrict to allowed origins
    const allowedOrigins = [
      'https://abfd7d50-659f-4b18-b01c-1598baef61ec-00-39eptfts4f6nz.picard.replit.dev',
      env.FRONTEND_URL
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
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
