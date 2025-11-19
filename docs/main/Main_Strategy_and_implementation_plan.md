# MyZone AI Readiness Assessment - Strategy & Implementation Plan

Last updated: October 25, 2025  
Owner: Andrej (Architecture & Development Lead), Mike Schwarz (Product & Strategy Lead), Bican (Developer)

## MVP Critical Features Checklist

### M0 — Platform Refactoring & Security Hardening 🔄 IN PROGRESS
- ✅ Secure authentication with HttpOnly cookies and refresh token rotation 
- ✅ Proper database migration tracking with Drizzle migration files
- ✅ Security middleware: CORS restrictions, rate limiting, CSRF protection
- ✅ Centralized error handling with typed error classes
- ✅ API response standardization across all endpoints
- ✅ Service layer extraction for core business logic
- ⏳ Structured logging with Logtail/Pino; error tracking with Sentry

### M1 — Core Infrastructure
- ✅ **M1.1** — LLM Service & Logging System
- ⏳ **M1.2** — Background Jobs System
- ⏳ **M1.3** — R2 Bucket File Storage Integration

### M2 — Assessment & Reporting Features
- ⏳ **M2.1** — Assessment Admin & Question Management
- ⏳ **M2.2** — PDF Report Configuration System
- ⏳ **M2.3** — Question Versioning System
- ⏳ **M2.4** — Partners & Promotional Content System
- ⏳ **M2.5** — KPIs & Analytics Dashboard

---

## Executive summary

This document outlines the comprehensive strategy and implementation plan for the MyZone AI Readiness Assessment platform - a SaaS solution designed to help organizations assess, benchmark, and improve their AI readiness across eight critical dimensions. The platform provides companies with detailed, AI-generated recommendations and actionable insights to transform them into AI-first organizations.

Based on the strategy session held on October 20, 2025, this plan focuses on delivering a Minimum Viable Product (MVP) that can be launched to market for data collection and validation, while establishing the architectural foundation for future enterprise features including multi-tenancy, white-labeling, and advanced analytics.

**Current State:**
The platform currently has a functional V1 implementation with core assessment capabilities, user/team management, guest assessments, benchmarking with NAICS industry codes, and basic PDF report generation. The system is operational but requires significant enhancements to deliver the full value proposition needed for market launch.

**MVP Goals:**
The primary objective is to refine V1 into a market-ready MVP that can be launched with a free tier to collect user data, validate the product-market fit, and generate early revenue through strategic referrals and affiliate partnerships with MyZone AI services.

**Key principles:**
- **Start with value-first approach**: Launch with free tier to maximize user acquisition and data collection, then monetize through strategic referrals and premium features
- **MVP mindset**: Focus on core features that deliver immediate value - enhanced PDF reports, analytics tracking, and referral monetization
- **Data-driven benchmarking**: Build comprehensive NAICS-based industry benchmarking with hierarchical fallback to ensure statistically significant comparisons
- **AI-first architecture**: Leverage AI throughout for recommendations, industry analysis, and content generation
- **Scalable foundation**: Build V1 with architecture that supports future multi-tenancy, white-labeling, and enterprise features
- **Human-in-the-loop philosophy**: Maintain admin oversight for prompts, content, and strategic elements while automating the heavy lifting

**Decision-making approach:**
- **ROI-driven prioritization**: Focus on features that drive immediate business value (PDF quality, monetization, analytics) before expanding to nice-to-have features
- **Iterative releases**: Deploy MVP quickly, collect feedback from CEO network (EO members), iterate based on real usage data
- **Feature gating for future versions**: Clear delineation between V1 (MVP), V1.1 (enhanced monetization), V2 (department/individual assessments), and V3 (white-label multi-tenancy)
- **Regular strategy reviews**: Weekly Monday meetings to align on priorities, review progress, and adjust roadmap based on market feedback


## Context and objectives

### Business context

MyZone AI provides AI transformation consulting and fractional CAIO (Chief AI Officer) services to help businesses become AI-first organizations. The AI Readiness Assessment platform serves as both a lead generation tool and a standalone product that delivers immediate value to organizations beginning their AI transformation journey.

**Market Opportunity:**
- Organizations across all industries are facing pressure to adopt AI but lack clarity on where to start
- No standardized, comprehensive framework exists for assessing organizational AI readiness
- Companies need actionable roadmaps, not just abstract assessments
- The assessment serves as an entry point for MyZone AI's consulting and automation services

**Current Product State:**
- Platform has been built and tested with early users
- Core functionality exists: user management, team management, survey administration, guest assessments, basic PDF generation
- Hundreds of users have already completed assessments, providing initial benchmark data
- System uses NAICS industry codes for detailed industry-specific benchmarking
- Google OAuth integration for easy onboarding
- Admin panel for survey and user management

**Strategic Context:**
This is not just an assessment tool - it's positioning to become the industry-standard framework for organizational AI readiness. Early data collection through free tier will create a defensible moat through benchmarking data that competitors cannot easily replicate.

### Roadmap

Based on the strategy session, the following features have been identified as critical for MVP launch:

1. **Enhanced PDF Report Generation**
   - Multi-chain AI prompts for chapter-based reports (8 chapters)
   - Admin panel for editing knowledge base content per chapter
   - Branded PDF wrapper (cover page, about us, intro, closing)
   - Referral/affiliate link integration with QR codes
   - Professional design matching MyZone AI brand

2. **Analytics Infrastructure**
   - Conversion tracking (signup → assessment start → completion → PDF download)
   - Retention metrics and user engagement
   - Referral link click-through tracking
   - Funnel visualization for optimization
   - KPI dashboard for business decision-making

3. **Brevo Email Integration**
   - User segmentation (signed up, completed, etc.)
   - Automated transactional emails (welcome, completion, password reset)
   - Drip campaign automation (incomplete assessment reminders)
   - Marketing campaign capability
   - Engagement analytics

4. **NAICS Hierarchical Benchmarking**
   - Statistical significance thresholds (minimum 5 assessments)
   - Automatic fallback to parent industry codes
   - Clear communication when using fallback benchmarks
   - Admin tool for recalculating statistics

5. **Admin Content Management**
   - Prompt editing interface for each report chapter
   - Affiliate/referral management system
   - Conditional promotional content based on assessment answers
   - Knowledge base updates without code changes

6. **Security Improvements**
   - Move JWT tokens from localStorage to httpOnly cookies
   - Rate limiting on authentication endpoints
   - CSRF protection
   - Enhanced audit logging

### V2 - Multi-Level Assessments

- Department-level assessments
- Individual/role-based assessments
- Paid subscription tiers
- Quarterly assessment automation
- Enhanced analytics for companies

### V3 - Enterprise & White-Label

- Multi-tenant architecture refactor
- White-label customization
- Custom domains and branding
- Enterprise SSO
- API platform


## Milestones and deliverables

### M0 — Platform Refactoring & Security Hardening (prerequisite)

**Purpose**
Establish production-grade security, logging, and architectural foundations before building new features. This milestone addresses critical security vulnerabilities and technical debt identified in the code quality assessment, ensuring the platform can safely scale and be maintained.

**Deliverables:**
- Secure authentication with HttpOnly cookies and refresh token rotation
- Structured logging with Logtail/Pino; error tracking with Sentry
- Proper database migration tracking with Drizzle migration files
- Security middleware: CORS restrictions, rate limiting, CSRF protection
- Centralized error handling with typed error classes
- API response standardization across all endpoints
- Service layer extraction for core business logic

**Acceptance criteria:**
- JWT access tokens stored in HttpOnly cookies (not localStorage); 15-minute expiry with refresh token rotation
- CORS configured with explicit allowed origins (no wildcards in production)
- Rate limiting active on authentication endpoints (login, register, password reset)
- CSRF protection implemented for state-changing operations
- Structured logging operational with correlation IDs; all console.log replaced with logger
- Sentry integrated for exception tracking and monitoring
- Database migrations using `drizzle-kit generate/migrate` (not push); migration history tracked
- Typed error classes (ValidationError, AuthenticationError, NotFoundError) used throughout
- Centralized error handler middleware catches and formats all errors consistently
- Standard API response format enforced: `{ success: true, data: T }` or `{ success: false, error: {...} }`
- Core services extracted: AuthService, AssessmentService, UserService with business logic separated from controllers

**Priority:** CRITICAL - Must complete before production launch or new feature development.

---

### M1.1 — LLM Service & Logging System

**Purpose**
Provide a unified, multi-provider AI service layer with comprehensive logging, cost tracking, and usage analytics to enable intelligent automation across the platform while maintaining complete visibility into AI operations and costs.

**Features:**
- Multi-provider LLM service supporting Google Gemini and OpenAI with single unified interface
- Provider and model selection configurable per-call (not global)
- Support for text generation, vision inputs (image + text), structured outputs with JSON schemas, and web search augmentation
- Automatic logging of every LLM call with provider, model, purpose, tokens, costs, latency, and full request/response
- Cost calculation per provider and model with USD tracking
- Admin interface for reviewing individual LLM call logs with filtering by provider, model, purpose, and status
- Admin usage analytics showing aggregated metrics by day, provider, model, and purpose with total cost visibility
- Paginated logs list with detail view showing full request/response text

**Acceptance criteria:**
- Service supports Google Gemini and OpenAI providers with single unified interface
- Provider can be selected per-call, not globally configured
- Service supports text generation, vision inputs, structured outputs, and web search augmentation
- All LLM calls automatically log to database with all metadata (provider, model, purpose, tokens, costs, latency, request, response, status)
- Token counts and costs accurately captured from provider responses
- Errors are caught, logged with error code and message, and propagated appropriately
- Admin can access paginated list of all LLM logs at `/admin/llm/logs`
- Admin can filter logs by provider, model, purpose, and status (server-side filtering)
- Admin can click any log to view full details including complete request/response text
- Admin can access usage analytics at `/admin/llm/usage` with aggregated data by day/provider/model/purpose
- Total cost prominently displayed in analytics view
- Admin can filter analytics by date range (from/to)

---

### M1.2 — Background Jobs System

**Purpose**
Provide a robust, scalable background job processing system with job queuing, scheduling, dependency management, retry logic, and comprehensive observability to enable asynchronous task execution across the platform.

**Features:**
- Job queuing with type, payload, scheduling, priority, and queue partitioning
- Parallel job execution with configurable concurrency
- Automatic retry with exponential backoff up to configurable max attempts
- Job dependencies via `depends_on_job_id` for sequential workflows
- Comprehensive event logging (queued, started, progress, completed, failed, retry_scheduled, canceled)
- Scheduled worker processing jobs every 10 seconds with atomic job claiming
- Admin dashboard showing key metrics (average runtime, oldest queued job, status counts, runtime by type)
- Admin jobs list with server-side filtering by status, type, queue, org, and date range
- Job detail view showing metadata, formatted payload with sensitive data redacted, and event timeline
- Administrative actions: retry failed jobs (with attempt reset option), cancel queued/processing jobs

**Acceptance criteria:**
- Jobs can be enqueued with type, payload, organization, scheduling parameters, priority, and queue
- Worker processes jobs at configured interval with configurable concurrency
- Jobs with `run_at` in future are not processed until time is reached
- Jobs with dependencies are not processed until parent job completes successfully
- Failed jobs automatically retry with exponential backoff up to `max_attempts`
- Jobs marked 'failed' after exceeding max retry attempts
- If parent job fails, all dependent jobs are automatically cancelled
- System automatically creates 'started', 'completed', 'failed', 'retry_scheduled' events for all jobs
- Job handlers can emit 'progress' events during execution
- Admin can access jobs dashboard at `/admin/jobs` showing metrics, runtime analysis, and registered job types
- Admin can access jobs list at `/admin/jobs/list` with server-side pagination and filtering
- Admin can click any job to view full details with metadata, payload (sensitive data redacted), and events
- Admin can retry failed jobs with optional attempt counter reset
- Admin can cancel queued/processing jobs
- All admin actions create corresponding job events for audit trail
- Multiple workers can run safely without duplicate job processing

---

### M1.3 — R2 Bucket File Storage Integration

**Purpose**
Migrate from filesystem-based file storage to cloud object storage (Cloudflare R2 or AWS S3) to enable scalable, reliable file management for uploaded assets including survey CSV files, generated PDFs, partner logos, and user-uploaded content.

**Features:**
- R2/S3 bucket configuration and connection management
- File upload service with automatic cloud storage
- Signed URL generation for secure temporary file access
- File metadata tracking in database (filename, size, mime type, storage path, upload date)
- Admin file management interface
- Automatic cleanup of orphaned files
- Support for multiple file types: CSV, PDF, images (PNG, JPG, SVG)
- File size validation
- CDN integration for public assets

**Acceptance criteria:**
- All file uploads route through unified file storage service (no direct filesystem writes)
- Files stored in R2 bucket with organized path structure: `/{environment}/{type}/{userId}/{filename}`
- Database tracks file metadata: id, storage_key, original_filename, mime_type, size_bytes, uploaded_by, uploaded_at
- Signed URLs generated for secure file access with configurable expiration (default: 1 hour)
- Survey CSV files uploaded to R2 and referenced by storage_key (not filesystem path)
- Generated PDF reports saved to R2 with accessible URLs
- Partner logos stored in R2 with public CDN URLs
- File upload endpoint validates: file size limits (CSV: 10MB, PDF: 50MB, images: 5MB), mime types, filename sanitization
- Admin can view all uploaded files at `/admin/files` with filtering by type, user, date range
- Admin can download or delete files through interface
- Orphaned file cleanup job runs daily, removing R2 files with no database reference older than 7 days
- Environment variables configure: R2 endpoint, bucket name, access key, secret key, CDN domain
- Error handling for R2 failures with fallback logging and user-friendly messages
- Migration script provided to move existing filesystem files to R2

---

### M2.1 — Assessment Admin & Question Management

**Purpose**
Establish comprehensive admin capabilities for creating, managing, and versioning assessments with multi-level architecture (Individual, Department, Company) and assignment workflows, providing the foundation for scalable assessment delivery.

**Features:**
- Admin panel for creating and managing assessment templates
- Question CRUD interface with category organization
- Three-layer assessment type system: Individual, Department, Company
- Assessment assignment and invitation workflows
- Manager-level assignments (Department/Company) and individual assignments
- Question locking after first completion to maintain data integrity
- Assessment template duplication for creating new versions
- Rich text editor for question details and context

**Acceptance criteria:**
- Admin can create new assessment templates with title, description, and type (Individual/Department/Company)
- Admin can add, edit, reorder, and delete questions within an assessment template
- Questions organized by category (e.g., Strategy, Data, Technology) with visual grouping
- Each question includes: text, category, response type (scale/text), details/context field
- Assessment type (Individual/Department/Company) determines assignment eligibility
- Admin can assign Department/Company assessments to managers with team/org scope
- Admin can assign Individual assessments to specific users or roles
- Once any user completes an assessment, questions become locked (read-only)
- Locked assessments display "Create New Version" option that duplicates template
- Admin can preview assessment as it will appear to end users
- Assessment list shows status, type, completion count, and last modified date
- Soft delete for assessments with restore capability

---

### M2.2 — PDF Report Configuration System

**Purpose**
Enable comprehensive admin control over PDF report generation through configurable sections, customizable prompts, and knowledge base management, allowing non-technical updates to report content and structure.

**Features:**
- Admin panel for PDF report structure configuration per assessment
- Section-based report builder with configurable section count and order
- Prompt editor for each report section with template variables
- Knowledge base content management per section
- Section preview with example data
- PDF wrapper configuration (cover page, intro, closing)
- Brand customization (logo, colors, fonts)
- Template variables for dynamic content (company name, scores, categories)

**Acceptance criteria:**
- Admin can define report structure with multiple sections (default: 8 sections)
- Each section has configurable: title, prompt template, knowledge base content, order
- Prompt editor supports template variables: `{{companyName}}`, `{{categoryScores}}`, `{{answers}}`, `{{benchmarks}}`
- Knowledge base editor for each section with rich text formatting
- Admin can preview section output with sample data before saving
- PDF wrapper configuration includes: cover page content, about us text, introduction, closing
- Brand settings: upload logo, configure primary/secondary colors, select fonts
- Changes to prompts/knowledge base trigger version increment for audit trail
- Admin can duplicate section configuration when creating new assessment versions
- Section configuration inherits from previous version by default
- Test generation button generates sample PDF with current configuration

---

### M2.3 — Question Versioning System

**Purpose**
Implement comprehensive versioning for assessments and questions to enable evolution of content over time while maintaining historical integrity and enabling accurate trend analysis across different assessment iterations.

**Features:**
- Semantic versioning (v1.0, v1.1, v2.0) for assessments
- Automatic version creation when editing locked assessments
- Version comparison interface showing question changes
- Version history timeline with change annotations
- Scoring compatibility indicators across versions
- Migration path for updating user assessments to new versions
- Version metadata: created date, author, change summary, question count delta

**Acceptance criteria:**
- New assessments start at v1.0
- Attempting to edit locked assessment triggers "Create New Version" flow
- New version creates complete copy with incremented version number (admin chooses: patch/minor/major)
- Admin must provide version change summary during creation
- Version comparison view shows side-by-side diff of questions (added/removed/modified)
- Each version maintains independent completion count and statistics
- Benchmark data segregated by version (users only compared against same version)
- Admin can mark versions as: active, deprecated, or archived
- Only one version per assessment can be marked "active" (default for new users)
- Version history page shows all versions with metadata and completion counts
- When creating new version, admin can choose to inherit: prompts, knowledge base, PDF config
- System tracks which version each completed assessment used

---

### M2.4 — Partners & Promotional Content System

**Purpose**
Enable strategic monetization through managed partner promotions and affiliate content dynamically inserted into assessment reports based on user responses, providing relevant recommendations while tracking partnership ROI.

**Features:**
- Partners/affiliates admin panel with comprehensive profile management
- Partner categorization (consulting, tools, training, services)
- Conditional promotion rules based on assessment responses
- Per-section partner selection in PDF configuration
- Dynamic content insertion during AI report generation
- Partner link tracking and analytics
- QR code generation for partner links
- Partner performance dashboard

**Acceptance criteria:**
- Admin can create partner profiles with: name, category, description, logo, website URL, affiliate link
- Partner categories: AI Consulting, Software Tools, Training Programs, Professional Services
- Each partner profile includes promotional copy templates (short/medium/long)
- In PDF section configuration, admin can select 0-3 partners to promote
- Admin can define promotion rules: "If category score < 50, promote Partner X"
- During PDF generation, AI incorporates partner descriptions naturally into recommendations
- Partner links include tracking parameters (assessmentId, section, partnerId)
- QR codes automatically generated for partner links in PDF
- Admin dashboard shows: partner mentions, link clicks, click-through rate by partner
- Partner analytics filterable by date range, assessment type, score ranges
- Admin can enable/disable partners without deleting (active/inactive status)
- Promotional content respects character limits per section to maintain report quality

---

### M2.5 — KPIs & Analytics Dashboard

**Purpose**
Provide comprehensive visibility into platform usage, user behavior, conversion funnels, and assessment performance through an admin analytics dashboard, enabling data-driven optimization and business decisions.

**Features:**
- User behavior tracking across key touchpoints
- Conversion funnel visualization (signup → assessment → completion → PDF download)
- Assessment performance metrics
- Admin analytics dashboard with time-range filtering
- Exportable reports and data
- **[TBD: Detailed metrics specification to be defined based on separate analytics requirements document]**

**Acceptance criteria:**
- Admin can access analytics dashboard at `/admin/analytics`
- Dashboard displays key metrics: total users, active users, assessments started, completion rate
- Conversion funnel shows drop-off at each stage with percentages
- Assessment metrics: average completion time, average score by category, completion rate by type
- Time-range selector: today, 7 days, 30 days, 90 days, custom range
- Charts/graphs for trend visualization (line, bar, pie charts)
- Export functionality for all data tables (CSV/Excel)
- Real-time metrics update (or near real-time with acceptable delay)
- **[Additional acceptance criteria TBD based on detailed KPI requirements document]**

---


## Technology overview

### Technology stack
- **Frontend**: React 18 with TypeScript, Vite, TailwindCSS, Radix UI components
- **Backend**: Node.js with Express, TypeScript, service-layer architecture
- **Database**: PostgreSQL (Neon serverless) with Drizzle ORM
- **AI Integration**: OpenAI GPT-4 for recommendations and industry analysis
- **PDF Generation**: @react-pdf/renderer for assessment reports
- **Email**: Nodemailer with Brevo SMTP for transactional emails
- **Authentication**: JWT with bcrypt password hashing, Google OAuth 2.0
- **Hosting**: Replit (current), PostgreSQL via Neon

### Integrations
- **AI**: OpenAI GPT-4 for multi-chain prompt report generation and industry analysis from URLs; usage/cost logging.
- **Authentication**: Google OAuth 2.0 for simplified onboarding; server-side token verification.
- **Email**: Nodemailer with Brevo SMTP for password resets, assessment completion notifications.
- **Benchmarking**: NAICS industry code database with hierarchical fallback for statistical significance.
- **PDF**: @react-pdf/renderer for generating branded assessment reports with recommendations.

**Planned integrations (V1 MVP):**
- Brevo API for user segmentation, automated drip campaigns, and marketing automation.
- Analytics platform (PostHog or custom) for conversion funnel tracking, user behavior, and retention metrics.
- Calendly for direct consultation booking from PDF reports.

**Future integrations (V2+):**
- Stripe for paid subscription tiers and payment processing.
- Zapier/Make.com for no-code customer integrations and CRM sync.
- Slack/Teams for team notifications and report sharing.

### Initial data model (high level)

```
User (with role assignments)
├── UserTeams (junction)
│   └── Team
│       ├── SurveyTeams (junction)
│       │   └── Survey (CSV file reference, questions)
│       │       └── Assessment
│       │           ├── answers (JSON)
│       │           ├── recommendations (AI-generated)
│       │           └── pdfPath
│       └── Members (other users)
│
└── Assessment (user or guest)
    ├── guest data (JSON, for anonymous)
    ├── surveyTemplateId
    └── completedOn

SurveyStats (benchmarking aggregates)
├── industry (NAICS code or "global")
├── category
├── quarter
└── averageScore, completedCount
```

**Key Data Model Features:**
- Guest assessments: Users can complete without accounts; guest data stored as JSON.
- Team hierarchy: Users belong to multiple teams; surveys assigned to teams.
- Flexible surveys: CSV-based question templates; completion limits per survey.
- Benchmarking: Aggregated stats by industry/category/quarter; NAICS hierarchical fallback for statistical significance.
- Soft deletes: Teams use deletedAt field to preserve data integrity.


## Budget and cost estimates

**Note**: This section will be defined once detailed milestone planning is complete. 




