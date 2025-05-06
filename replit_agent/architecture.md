# Architecture

## Overview

This application is a full-stack web application built to provide AI readiness assessments for organizations. It follows a modern TypeScript-based architecture with a React frontend and an Express backend. The system allows users to register, log in, complete AI readiness surveys, view their results, and track their organization's AI journey over time.

The application uses a client-server architecture with a REST API for communication between the frontend and backend. It leverages PostgreSQL for data persistence, with Drizzle ORM for database interactions.

## System Architecture

The system follows a typical three-tier architecture:

1. **Presentation Layer**: React-based frontend with TailwindCSS for styling and shadcn/ui component library
2. **Application Layer**: Express.js backend with RESTful API endpoints
3. **Data Layer**: PostgreSQL database accessed through Drizzle ORM

### Directory Structure

```
├── client/               # Frontend React application
│   ├── src/              # Source code for React components
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions and shared code
│   │   ├── pages/        # Page components
│   │   └── schemas/      # Zod validation schemas
├── server/               # Backend Express application
│   ├── index.ts          # Entry point for the server
│   ├── routes.ts         # API routes definition
│   ├── storage.ts        # Data access layer
│   └── vite.ts           # Vite development setup
├── shared/               # Shared code between frontend and backend
│   └── schema.ts         # Database schema definitions
├── migrations/           # Database migration files (generated)
└── public/               # Static assets
```

## Key Components

### Frontend

1. **Component Library**: The application uses the shadcn/ui component library, which is built on top of Radix UI. These components provide accessible UI elements with consistent styling.

2. **Page Structure**: The application has several key pages:
   - Home page (`/`) - Landing page with information about the AI readiness assessment
   - Login page (`/login`) - User authentication
   - Survey page (`/survey`) - AI readiness assessment interface
   - Dashboard (`/dashboard`) - Results and analytics for completed assessments

3. **State Management**: The application uses React's context API and hooks for state management, along with `react-query` for server state management.

4. **Form Handling**: Forms are managed using `react-hook-form` with `zod` for validation schema definitions.

5. **Routing**: The application uses `wouter` as a lightweight routing solution.

### Backend

1. **API Server**: Express.js provides the HTTP server and routing capabilities.

2. **Authentication**: The application includes authentication with support for both username/password and Google OAuth.

3. **Database Access**: The server uses Drizzle ORM to interact with the PostgreSQL database.

4. **Storage Interface**: The application defines a storage interface in `server/storage.ts` with implementations for both in-memory storage (for development) and database storage (for production).

### Data Model

The primary data entities include:

1. **Users**: Representing system users with authentication information.
   ```typescript
   export const users = pgTable("users", {
     id: serial("id").primaryKey(),
     username: text("username").notNull().unique(),
     password: text("password").notNull(),
   });
   ```

2. **Surveys**: (Implied from the code) Representing the AI readiness assessments completed by users.

3. **Questions**: (Implied from the code) Representing individual questions in the AI readiness assessment.

## Data Flow

1. **User Authentication**:
   - Users register or log in through the login page or Google OAuth
   - The backend validates credentials and creates a session
   - Session information is stored in PostgreSQL using `connect-pg-simple`

2. **Survey Completion**:
   - Users start a new survey from the dashboard
   - The frontend loads questions from predefined survey data
   - Users progress through survey steps, with responses validated by Zod schemas
   - Completed survey data is sent to the backend and stored in the database

3. **Dashboard Viewing**:
   - Users access their dashboard to view assessment results
   - The frontend fetches completed survey data from the backend
   - Results are displayed with visualizations and comparisons to benchmarks

## External Dependencies

### Frontend Dependencies

- **UI Framework**: React with TailwindCSS
- **Component Library**: shadcn/ui (built on Radix UI)
- **Form Handling**: react-hook-form with zod validation
- **HTTP Client**: Built-in fetch API with react-query
- **Routing**: wouter
- **Authentication**: @react-oauth/google for Google OAuth integration

### Backend Dependencies

- **Server Framework**: Express.js
- **Database ORM**: Drizzle ORM
- **Database Driver**: @neondatabase/serverless for PostgreSQL connectivity
- **Session Management**: connect-pg-simple
- **Authentication**: Built-in password handling with potential for Google OAuth integration

## Deployment Strategy

The application is configured for deployment on Replit, as indicated by the `.replit` configuration file. The deployment strategy includes:

1. **Build Process**:
   - Frontend: Vite builds the React application into static assets
   - Backend: esbuild bundles the server code for production

2. **Runtime Configuration**:
   - The application uses environment variables for configuration
   - Different environments (development/production) are handled via NODE_ENV

3. **Database Provisioning**:
   - The application expects a PostgreSQL database to be available
   - Database connection is configured via the DATABASE_URL environment variable

4. **Deployment Commands**:
   - `npm run build`: Builds both frontend and backend for production
   - `npm run start`: Starts the production server
   - `npm run dev`: Starts the development server with hot-reloading

5. **Port Configuration**:
   - The application listens on port 5000 by default
   - In the Replit environment, this is mapped to port 80 externally

## Security Considerations

1. **Authentication**: The application handles user authentication with secure password storage.

2. **Data Validation**: All user inputs are validated using Zod schemas before processing.

3. **CSRF Protection**: The application likely includes CSRF protection through session handling.

4. **Response Sanitization**: API responses are controlled to prevent information leakage.

## Future Improvements

1. **Enhanced Authentication**: Expanding the authentication system with more providers and features like password reset.

2. **Offline Support**: Adding service workers for offline capabilities.

3. **Internationalization**: Adding support for multiple languages.

4. **Advanced Analytics**: Enhancing the dashboard with more sophisticated data visualization and insights.