# Security Architecture Guidelines

> **⚠️ CRITICAL**: This document outlines security requirements that MUST be implemented before production deployment. Security is not optional.

## 📋 Table of Contents

1. [🔐 Authentication & Authorization](#-authentication--authorization)
2. [🛡️ Input Validation & API Security](#️-input-validation--api-security)
3. [🌐 HTTP & Transport Security](#-http--transport-security)
4. [📱 Client-Side Security](#-client-side-security)
5. [🗄️ Data Protection & Storage](#-data-protection--storage)
6. [🔧 Configuration & Environment](#-configuration--environment)
7. [🔍 Monitoring & Incident Response](#-monitoring--incident-response)
8. [🎯 Production Readiness Checklist](#-production-readiness-checklist)

---

## 🔐 Authentication & Authorization

### Password Security
**✅ DO:**
- Use **Argon2id** for password hashing (memory-hard, time-hard, parallelism-resistant)
- Require **minimum 8 characters** with complexity requirements
- Implement **password history tracking** (prevent reuse of last 12 passwords)
- Add **password strength meter** with real-time feedback
- Enforce **account lockout** after 5 failed attempts (30min lockout)
- Provide **secure password change** flow with current password verification
- Implement **password reset** with time-limited tokens (1 hour expiry)

**❌ DON'T:**
- Use weak hashing (MD5, SHA1, bcrypt) or store plain text
- Allow weak passwords or common patterns
- Skip password history tracking
- Allow unlimited failed login attempts
- Skip current password verification for changes

### Token Management
**✅ DO:**
- Implement **dual-token system**: short access tokens (15min) + rotating refresh tokens (7 days)
- Store tokens in **HttpOnly, Secure, SameSite=Lax cookies**
- Use **separate secrets** for access and refresh tokens (32+ characters each)
- Implement **token rotation** on refresh (revoke old refresh token)
- Add **automatic token refresh** on client-side (401 error handling)
- Set **appropriate token expiry** times based on security requirements

**❌ DON'T:**
- Put JWTs in localStorage (XSS vulnerability)
- Use long-lived access tokens (>30 minutes)
- Skip token rotation on refresh
- Use the same secret for access and refresh tokens
- Use weak JWT secrets (<32 characters)

### Session Management
**✅ DO:**
- Track **device/browser information** for sessions (user agent, IP)
- Provide **session management UI** (view/revoke active sessions)
- Implement **"logout everywhere"** functionality
- Monitor **session activity** and last used timestamps
- Implement **session cleanup** for expired tokens
- Add **session security warnings** for new devices
- Revoke **all sessions** on suspicious activity

**❌ DON'T:**
- Allow unlimited concurrent sessions
- Skip session invalidation on logout
- Ignore suspicious authentication patterns
- Use predictable session identifiers
- Allow session fixation attacks
- Skip device tracking for sessions

---

## 🛡️ Input Validation & API Security

### Input Validation
**✅ DO:**
- Validate **ALL inputs** with schema validation (Zod, Joi, etc.)
- Use **parameterized queries** (never string concatenation)
- Set **request body size limits** (prevent DoS attacks)
- Validate **Content-Type headers** and file uploads
- Implement **file type validation** for uploads
- Use **whitelist validation** (allow only known good patterns)

**❌ DON'T:**
- Trust any user input without validation
- Use dynamic SQL queries with user input
- Allow unlimited file uploads
- Skip Content-Type validation
- Use blacklist validation (block known bad patterns)

### Rate Limiting & Abuse Prevention
**✅ DO:**
- Implement **comprehensive rate limiting** on all endpoints
- Use **user-specific rate limiting** (IP + user ID combination)
- Add **progressive delays** for repeated violations
- Set **different limits** for different operations:
  - Login: 5 attempts per 15min
  - Registration: 3 attempts per hour
  - Password reset: 3 attempts per hour
  - Sensitive operations: 10 per 5min
- Implement **account lockout** after repeated violations

**❌ DON'T:**
- Skip rate limiting (leads to abuse)
- Use only IP-based rate limiting
- Allow unlimited sensitive operations
- Ignore progressive penalty systems

### Error Handling
**✅ DO:**
- Return **consistent error formats** without sensitive data
- Use **generic error messages** (prevent information leakage)
- Log **detailed errors server-side** for debugging
- Implement **proper error boundaries** for auth failures
- **Never expose** internal error details in production

**❌ DON'T:**
- Expose internal error details in production
- Return different error messages for existing vs non-existing users
- Log sensitive information (passwords, tokens, PII)
- Skip error monitoring and alerting

---

## 🌐 HTTP & Transport Security

### Security Headers
**✅ DO:**
- Set **comprehensive security headers**:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(self), geolocation=()`
- Implement **Content Security Policy (CSP)** with strict rules
- Use **Strict-Transport-Security (HSTS)** in production
- Remove **server information headers** (X-Powered-By, Server)

**❌ DON'T:**
- Skip security headers (CSP, HSTS, X-Frame-Options)
- Use weak CSP policies
- Allow dangerous permissions (camera, geolocation, etc.) - microphone is allowed for AI chat functionality
- Expose server information

### CORS & CSRF Protection
**✅ DO:**
- Configure **CORS with explicit allowed origins**
- Implement **proper CSRF protection** (SameSite cookies)
- Validate **Origin headers** (don't trust alone)
- Use **credentials: "include"** for cookie-based auth
- Set **appropriate CORS headers** for preflight requests

**❌ DON'T:**
- Use `Access-Control-Allow-Origin: *` with credentials
- Ignore CSRF protection
- Trust the Origin header alone
- Skip preflight request handling

### Transport Security
**✅ DO:**
- **Enforce HTTPS** in production (Secure cookies)
- Use **TLS 1.2+** with strong cipher suites
- Implement **certificate pinning** for mobile apps
- Use **secure cookie attributes** (HttpOnly, Secure, SameSite)

**❌ DON'T:**
- Allow HTTP in production
- Use weak TLS configurations
- Skip certificate validation
- Use insecure cookie attributes

---

## 📱 Client-Side Security

### Authentication Handling
**✅ DO:**
- Implement **automatic token refresh**
- Use **centralized API client** with credential handling
- Add **error boundaries** for auth failures
- Validate **data on both client and server**
- Implement **proper logout** (clear all tokens)
- Use **HttpOnly cookies** instead of localStorage
- Handle **token refresh failures** gracefully

**❌ DON'T:**
- Store sensitive data in localStorage (but allow non-sensitive like: theme, language)
- Skip client-side input validation
- Ignore expired token handling
- Trust client-side authorization alone
- Leave tokens in memory after logout
- Skip automatic token refresh

### Client-Side Validation
**✅ DO:**
- Implement **real-time password strength** feedback
- Add **input sanitization** for user-generated content
- Use **secure random** for client-side operations
- Implement **proper error handling** for network failures
- Add **loading states** to prevent double submissions

**❌ DON'T:**
- Skip client-side input validation
- Show weak passwords without feedback
- Use predictable random values
- Ignore network error handling
- Allow double form submissions

---

## 🗄️ Data Protection & Storage

### Database Security
**✅ DO:**
- Use **connection pooling** with proper limits
- Enable **SSL/TLS** for database connections
- Implement **database migrations** with rollback capability
- Use **repositories/DAOs** to abstract database access
- Implement **database-level encryption** for sensitive data
- Use **least privilege** database access

**❌ DON'T:**
- Use root database credentials in applications
- Skip database connection security
- Allow direct database access from frontend
- Store sensitive data unencrypted
- Skip database access logging

### Data Encryption
**✅ DO:**
- Encrypt **sensitive data at rest** (PII, financial data)
- Use **strong encryption algorithms** (AES-256)
- Implement **key rotation** policies
- Use **separate encryption keys** per environment
- Encrypt **backup data** and logs

**❌ DON'T:**
- Store sensitive data unencrypted
- Use weak encryption algorithms
- Skip key rotation
- Use the same encryption keys across environments

### Data Retention & Privacy
**✅ DO:**
- Implement **data retention policies**
- Provide **data deletion** capabilities (GDPR compliance)
- Log **data access** for auditing
- Implement **data anonymization** where possible
- Use **pseudonymization** for analytics

**❌ DON'T:**
- Keep data indefinitely
- Skip data deletion capabilities
- Ignore privacy regulations
- Log sensitive data without encryption

---

## 🔧 Configuration & Environment

### Environment Management
**✅ DO:**
- Validate **environment variables** with schemas
- Use **different security settings** per environment
- **Rotate secrets regularly** (quarterly)
- Use **proper secret management** (not .env in production)
- Set **secure defaults** for all configuration
- Implement **configuration validation** on startup

**❌ DON'T:**
- Commit secrets to version control
- Use default passwords or keys
- Skip environment validation
- Use development settings in production
- Hardcode sensitive configuration

### Security Configuration
**✅ DO:**
- Validate **JWT secrets** are at least 32 characters
- Use **separate secrets** for access and refresh tokens
- Validate **database connection strings**
- Set **appropriate rate limiting** configurations
- Validate **Argon2 parameters** (memory, time, parallelism)
- Configure **token expiry times** appropriately
- Set **account lockout parameters**

**❌ DON'T:**
- Use weak JWT secrets (<32 characters)
- Use the same secret for access and refresh tokens
- Skip database connection validation
- Use weak rate limiting settings
- Use insecure Argon2 parameters

---

## 🔍 Monitoring & Incident Response

### Security Monitoring
**✅ DO:**
- Log **all authentication events** for audit trails
- Monitor **suspicious login patterns** and failed attempts
- Track **session anomalies** and unusual access patterns
- Implement **real-time alerting** for security events
- Use **security information and event management (SIEM)**
- Monitor **API usage patterns** for abuse

**❌ DON'T:**
- Skip security event logging
- Ignore suspicious authentication patterns
- Log sensitive information (passwords, tokens, PII)
- Skip real-time alerting
- Ignore API abuse patterns

### Incident Response
**✅ DO:**
- Have **incident response plan** documented
- Implement **automated threat detection**
- Provide **security contact information**
- Implement **emergency access** procedures
- Have **backup and recovery** procedures
- Document **security procedures** and runbooks

**❌ DON'T:**
- Skip incident response planning
- Ignore security alerts
- Skip backup procedures
- Leave security procedures undocumented

---

## 🚨 Security Incident Response

### Immediate Actions
1. **Isolate** affected systems
2. **Preserve** evidence and logs
3. **Notify** security team immediately
4. **Document** timeline and actions taken
5. **Implement** emergency controls

### Recovery Steps
1. **Assess** scope and impact
2. **Patch** vulnerabilities
3. **Reset** compromised credentials
4. **Monitor** for continued threats
5. **Update** security measures

---

> **⚠️ REMEMBER**: Security is an ongoing process, not a one-time implementation. Regular security reviews, updates, and testing are essential for maintaining a secure application.

## 🎯 Production Readiness Checklist

### Critical Security Requirements
Before going to production, verify ALL items are implemented:

#### Authentication & Passwords
- [ ] **Argon2id password hashing** implemented
- [ ] **Dual-token system** (access + refresh) working
- [ ] **HttpOnly cookies** for token storage
- [ ] **Password history tracking** (12 passwords)
- [ ] **Account lockout** after 5 failed attempts
- [ ] **Password strength validation** active
- [ ] **Secure password change** flow implemented
- [ ] **Password reset flow** with time-limited tokens

#### API & Input Security
- [ ] **Rate limiting** on all endpoints
- [ ] **Input validation** with schemas
- [ ] **Parameterized queries** (no SQL injection)
- [ ] **Generic error messages** (no information leakage)
- [ ] **Request size limits** configured
- [ ] **File upload validation** implemented

#### Transport & Headers
- [ ] **HTTPS enforced** in production
- [ ] **Security headers** configured (CSP, HSTS, etc.)
- [ ] **CORS configured** with explicit origins
- [ ] **CSRF protection** implemented
- [ ] **TLS 1.2+** with strong ciphers

#### Client-Side Security
- [ ] **Automatic token refresh** working
- [ ] **API interceptor** handles 401 errors
- [ ] **Password strength meter** active
- [ ] **Error boundaries** for auth failures
- [ ] **No localStorage** for sensitive data

#### Data Protection
- [ ] **Database encryption** at rest
- [ ] **Connection encryption** (SSL/TLS)
- [ ] **Sensitive data encryption** implemented
- [ ] **Data retention policies** defined
- [ ] **Backup encryption** configured

#### Configuration & Environment
- [ ] **Environment variables validated**
- [ ] **Secrets management** implemented
- [ ] **JWT secrets** (32+ characters each)
- [ ] **Separate secrets** for access/refresh tokens
- [ ] **Argon2 parameters** validated
- [ ] **Rate limiting** configured appropriately
 
#### Session Management
- [ ] **Session management UI** available
- [ ] **Device tracking** implemented
- [ ] **"Logout everywhere"** functionality
- [ ] **Session cleanup** for expired tokens
- [ ] **Suspicious activity detection**

#### Monitoring & Response
- [ ] **Security event logging** active
- [ ] **Real-time alerting** configured
- [ ] **Incident response plan** documented
- [ ] **Security monitoring** dashboard
- [ ] **Backup procedures** tested

### Security Testing
- [ ] **Penetration testing** completed
- [ ] **Vulnerability scanning** passed
- [ ] **Security code review** completed
- [ ] **Load testing** with rate limits
- [ ] **Authentication flow testing** completed

---
