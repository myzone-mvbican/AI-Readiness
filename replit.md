# MyZone AI - AI Readiness Assessment Platform

## Overview

MyZone AI is a comprehensive full-stack application designed to evaluate and benchmark organizations' AI readiness. The platform provides detailed assessments, industry benchmarking, and personalized recommendations to help businesses prepare for AI implementation. Built with modern TypeScript architecture, it features a React frontend with Express.js backend and PostgreSQL database.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React Context API and TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js 20 with Express.js framework
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful API with standardized response formats
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Uploads**: Multer middleware for CSV survey uploads

### Database Architecture
- **Database**: PostgreSQL 16 with connection pooling
- **ORM**: Drizzle ORM for type-safe database operations
- **Migrations**: Automated schema migrations via drizzle-kit
- **Connection**: Neon serverless driver with WebSocket support

## Key Components

### Authentication System
- JWT-based authentication with secure token management
- Google OAuth integration for social login
- Password reset functionality with email notifications
- Role-based access control (admin/client roles)
- Guest assessment capabilities for unauthenticated users

### Assessment Engine
- Multi-stage assessment workflow with progress tracking
- Support for multiple survey templates via CSV uploads
- Real-time answer validation and storage
- Resume functionality for incomplete assessments
- Industry-specific question categorization

### Benchmarking System
- Quarterly industry benchmark calculations
- Global and industry-specific score comparisons
- Automated survey statistics generation
- Configurable completion limits per survey

### Data Management
- Comprehensive database schema with proper relationships
- Type-safe data validation using Zod schemas
- Shared type definitions between frontend and backend
- Audit trails for key system changes

## Data Flow

1. **User Registration/Login**: Users authenticate via email/password or Google OAuth
2. **Assessment Creation**: Users select or are assigned survey templates
3. **Question Delivery**: Frontend fetches questions and renders assessment UI
4. **Answer Collection**: Responses are validated and stored incrementally
5. **Score Calculation**: Category scores computed based on weighted responses
6. **Benchmark Comparison**: User scores compared against industry averages
7. **Report Generation**: Comprehensive results with recommendations delivered

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection and query execution
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/**: Accessible UI component primitives
- **OpenAI**: AI-powered recommendation generation
- **SendGrid**: Email service for password resets and notifications
- **Google OAuth**: Social authentication integration

### Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **Vite**: Frontend build tooling and development server
- **TypeScript**: Static type checking across the stack
- **Tailwind CSS**: Utility-first styling framework

## Deployment Strategy

### Environment Configuration
- **Development**: Local development with hot reload via Vite
- **Production**: Containerized deployment on Replit's autoscale infrastructure
- **Database**: Managed PostgreSQL instance with environment-specific URLs
- **Assets**: Static file serving through Express with proper caching headers

### Build Process
1. Frontend assets compiled and optimized via Vite
2. Backend TypeScript transpiled to ESM using esbuild
3. Database migrations applied automatically during deployment
4. Environment variables validated for required services

### Monitoring and Performance
- Request/response logging with duration tracking
- Error handling with structured logging
- Query optimization through indexed database columns
- Caching strategies for frequently accessed data

## Changelog

```
Changelog:
- November 18, 2025. Enhanced assessment completion email with personalized AI-generated intro summary and removed generic bullet points - email now uses V2 recommendations intro text for personalized messaging, removed "🎯 Your comprehensive AI readiness report includes" section
- November 18, 2025. Enhanced V2 recommendations with Calendly CTAs and improved content - added "Schedule a Consultation" button to UI outro section, removed emojis from PDF template, added centered Calendly CTAs to PDF intro and outro sections, increased AI-generated category descriptions from 4-5 to 7-9 sentences (70% increase) for more detailed analysis
- November 18, 2025. Added button group to Results/summary tab with "View Recommendations" tab switcher and "Get Help" Calendly link (https://calendly.com/keeranmfj/30min) positioned below executive summary intro text
- November 18, 2025. Fixed "Cannot update a completed assessment" error for V2 recommendations - updated UpdateAssessmentData interface, isUpdatingOnlyRecommendations check, and updateGuestAssessment method to accept both string and object types, allowing AI-generated recommendations to be saved on completed assessments
- November 18, 2025. Fixed validation schemas to accept both V1 (string) and V2 (object) recommendations - updated server/middleware/schemas.ts (assessmentUpdateSchema and guestAssessmentUpdateSchema) and frontend RecommendationPayload type with union types, resolving "Expected string, received object" validation error when saving V2 recommendations
- November 18, 2025. Completed frontend recommendations tab to display both V1 and V2 formats - card-based UI with executive summary, category analysis with performance metrics/benchmarks/trends, best practices, and next steps; maintains backward compatibility with markdown display for legacy assessments
- November 18, 2025. Completed v2 recommendations system with structured JSON format - intro/categories/outro structure with performance metrics and best practices, OpenAI JSON mode, dual PDF templates (v1 for legacy markdown, v2 for structured data), version discriminator for reliable format detection, full backward compatibility for 8 existing assessments
- November 18, 2025. Added Google Tag Manager (GTM-57NCDM8) to track user analytics - script added to index.html head and noscript fallback in body
- November 15, 2025. Changed PDF filename format from report-{id}.pdf to {company-name}-{date}.pdf with stable completion dates for deterministic regeneration
- November 15, 2025. Updated PDF recovery system to support new filename format via pdfPath database lookup with legacy format fallback
- November 15, 2025. Removed download button from assessment completion emails - PDFs now only available as email attachment
- November 15, 2025. Added PDF attachment to assessment completion emails - PDFs now attached directly to emails while maintaining download link as backup option
- November 15, 2025. Implemented dual email delivery for assessment completion notifications - client receives email with PDF download link while sales@keeran.ca receives BCC copy for lead tracking and follow-up
- November 11, 2025. Implemented automatic PDF recovery system to handle missing files after redeployment - PDFs are regenerated on-demand when requested but file missing, using existing assessment data and recommendations from database
- November 11, 2025. Fixed password validation consistency - updated frontend PasswordInput component to display all 5 requirements (8+ chars, uppercase, lowercase, number, special character) with proper strength meter (5/5 scale)
- November 11, 2025. Updated all password validation schemas across client, shared, and common validators to require special characters matching backend requirements
- November 6, 2025. Fixed guest PDF download path returning absolute filesystem path instead of relative URL path by using relativePath instead of filePath in AIService response
- November 6, 2025. Fixed guest PDF showing "Unknown Question" by changing question ID comparison from Number(q.id) === answer.q to String(q.id) === String(answer.q) to handle type mismatch
- November 6, 2025. Fixed guest assessment linking bug by adding ::jsonb cast to PostgreSQL JSON query - guest assessments now properly transfer to new user accounts upon registration
- November 6, 2025. Fixed PDF download filename from "assessment-report-{id}.pdf" to "report-{id}.pdf" to match server-generated files
- July 13, 2025. Implemented hierarchical NAICS fallback system for benchmark statistics - when specific industry codes have no data, system progressively searches broader categories until statistics are found
- July 13, 2025. Created comprehensive export users feature for admins - supports CSV/Excel formats with configurable field selection, progress indicators, and smart filename generation
- July 13, 2025. Implemented comprehensive hard delete system for teams with strict validation - teams can only be permanently deleted if soft-deleted AND have zero members, includes database transactions and conditional UI controls
- July 13, 2025. Implemented comprehensive team deletion system with restore functionality - deleted teams filtered from all dropdowns and selectors while maintaining restore capability for admins
- July 9, 2025. Fixed Google OAuth authentication by replacing deprecated tokeninfo endpoint with Google Auth Library and switching from access tokens to ID tokens
- July 8, 2025. Added admin PDF download tool to settings page - allows admins to download any assessment PDF by ID with real-time validation
- July 8, 2025. Successfully implemented email notifications for assessment completion with PDF download links sent automatically to users
- July 8, 2025. Successfully implemented pdfPath field in assessment API responses - PDF download button now functional with database-stored relative paths
- July 8, 2025. Fixed PDF generation to store relative paths in database (/uploads/userId/filename.pdf format) for proper download functionality  
- July 8, 2025. Successfully replaced server-side radar chart with exact client-side implementation ensuring visual consistency between PDF and web interface
- July 8, 2025. Implemented proper category scoring calculation using actual assessment data from survey questions and answers
- July 8, 2025. Enhanced PDF file sizes to 20KB confirming successful integration of complex SVG radar chart with proper scaling, grid circles, and data visualization
- July 8, 2025. Verified radar chart displays actual category scores with proper normalization, axis lines, data points, and category labels positioned accurately
- January 8, 2025. Enhanced PDF generation with radar chart visualization and MyZone AI logo integration across all PDF pages
- January 8, 2025. Implemented fully functional SVG radar chart showing AI readiness categories with dynamic scoring based on assessment data
- January 8, 2025. Added MyZone AI logo to PDF cover page and headers throughout the document for professional branding
- January 8, 2025. Verified enhanced PDF generation produces comprehensive reports (9-9.4KB) with visual charts and proper logos
- January 8, 2025. Implemented comprehensive server-side PDF generation system with complete multi-page structure matching client-side template exactly
- January 8, 2025. Added complete server-side PDF component with cover page, results page, recommendations pages, and response details pages
- January 8, 2025. Enhanced PDF generation with proper styling, chart placeholders, and comprehensive assessment data display
- January 8, 2025. Verified automatic PDF generation and saving works for both authenticated users and guests with proper file organization
- June 27, 2025. Implemented React Email for professional email templates with responsive design and enhanced password reset emails
- June 27, 2025. Successfully configured Brevo email service with verified sender email and SMTP settings (smtp-relay.brevo.com:587)
- June 27, 2025. Fixed Google Auth client ID configuration - corrected environment variable from GOOGLE_CLIENT_ID to VITE_GOOGLE_CLIENT_ID for frontend access
- June 27, 2025. Implemented complete frontend Zod validation for industry selector URL analysis with error states and user feedback
- June 25, 2025. Enhanced industry selector with AI-powered URL analysis and Zod validation
- June 24, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```