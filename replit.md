# MyZone AI - AI Readiness Assessment Platform

## Overview
MyZone AI is a full-stack application designed to assess and benchmark organizations' AI readiness. It provides detailed assessments, industry benchmarking, and personalized recommendations to guide businesses in their AI implementation journey. The platform aims to help businesses understand their current AI posture, identify areas for improvement, and leverage AI for strategic advantage.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS with shadcn/ui
- **State Management**: React Context API, TanStack Query
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation

### Backend
- **Runtime**: Node.js 20 with Express.js
- **Language**: TypeScript (ESM)
- **API**: RESTful
- **Authentication**: JWT, bcrypt, Google OAuth, Role-based access control
- **File Uploads**: Multer (for CSV survey uploads)

### Database
- **Database**: PostgreSQL 16
- **ORM**: Drizzle ORM
- **Migrations**: drizzle-kit
- **Connection**: Neon serverless driver

### Key Features
- **Authentication System**: Secure JWT-based auth, Google OAuth, password reset, role-based access, guest assessments.
- **Assessment Engine**: Multi-stage workflow, custom survey templates (CSV), real-time validation, progress tracking, industry-specific questions.
- **Benchmarking System**: Quarterly industry benchmarks, global/industry score comparisons, automated statistics, configurable completion limits.
- **Data Management**: Type-safe data validation (Zod), shared types, audit trails.
- **AI-powered Recommendations**: AI-generated actionable recommendations.
- **PDF Generation**: Server-side PDF generation with radar charts, dynamic scoring, and branding.

## External Dependencies
- **@neondatabase/serverless**: PostgreSQL connection
- **@tanstack/react-query**: Server state management
- **@radix-ui/**: Accessible UI components
- **OpenAI**: AI-powered recommendation generation
- **SendGrid / Brevo**: Email services for notifications and password resets
- **Google OAuth**: Social authentication
- **Drizzle Kit**: Database schema management
- **Vite**: Frontend build tool
- **TypeScript**: Static type checking
- **Tailwind CSS**: Styling framework