# Background Jobs & Cron Jobs Guide

## What Are Background Jobs?

**Background jobs** are tasks that run asynchronously outside of the main request-response cycle. Instead of making users wait for slow operations (like generating PDFs, sending emails, or processing data), you:

1. **Queue the job** (save to database/queue system)
2. **Return immediately** to the user ("Your report is being generated...")
3. **Process the job later** in a separate worker process

## Background Jobs vs. Cron Jobs

### Background Jobs (On-Demand)
- **Triggered by user actions** (user completes assessment → queue PDF generation)
- **Processed as needed** (whenever something needs to happen)
- **Examples**: Generate PDF after assessment, send welcome email after signup

### Cron Jobs (Scheduled)
- **Triggered by time** (run daily at 2 AM, every hour, weekly on Monday)
- **Processed on schedule** regardless of user actions
- **Examples**: Daily benchmark recalculation, weekly cleanup tasks, monthly reports

**Note**: A job system can handle both! You can schedule background jobs to run at specific times.

---

## Current Problems Without Background Jobs

Looking at your current code in `server/services/ai.service.ts`:

```typescript
// Current: User waits for ALL of this during the HTTP request
async generateRecommendations() {
  // 1. Call LLM API (can take 30-60 seconds)
  const content = await this.generateContent(...);
  
  // 2. Generate PDF (can take 10-20 seconds)
  const pdfResult = await this.generateAndSavePDF(...);
  
  // 3. Send email (can take 5-10 seconds)
  await this.sendAssessmentCompleteEmail(...);
}
// Total: User waits 45-90 seconds! ❌
```

**Problems:**
- User sees loading spinner for 1-2 minutes
- HTTP request timeout risk (many servers timeout after 30-60s)
- If email fails, entire request fails
- No retry logic for failures
- Can't handle multiple requests efficiently

---

## Use Cases for Your Platform

### 1. **PDF Report Generation** (HIGH PRIORITY)

**Current**: User waits 20-30 seconds for PDF generation
**With Background Job**: User gets immediate response, PDF generated async

```typescript
// User completes assessment
POST /api/assessments/complete
→ Queue job: "generate-pdf-report"
→ Return: { success: true, jobId: "abc-123" }

// Worker processes job later
Worker picks up job → Generates PDF → Updates assessment.pdfPath → Sends email
```

**Why background?**
- PDF generation is slow (React PDF rendering, file I/O)
- User doesn't need to wait
- Can retry if file system fails

---

### 2. **Email Sending** (HIGH PRIORITY)

**Current**: Emails sent synchronously during request
**With Background Job**: Queue email, send async

**Examples:**
- Assessment completion email
- Welcome email after signup
- Password reset emails
- Incomplete assessment reminders (drip campaigns)

**Why background?**
- Email delivery can be slow (SMTP servers)
- If email service is down, don't fail the request
- Can retry failed emails automatically

---

### 3. **AI/LLM Content Generation** (HIGH PRIORITY)

**Current**: LLM calls happen during HTTP request (slow!)
**With Background Job**: Queue LLM call, generate async

**Why background?**
- LLM API calls take 30-60+ seconds
- OpenAI/Google can rate limit or fail
- User gets immediate "processing" response
- Retry automatically on failure

---

### 4. **Benchmark Recalculation** (CRON JOB)

**Use Case**: Recalculate industry benchmarks when new assessments complete

```typescript
// Cron: Run every hour
- Find new assessments since last run
- Recalculate average scores by industry/category
- Update survey_stats table
- Clear any cached benchmark data
```

**Why cron?**
- Needs to run regularly, not on-demand
- Updates statistical data for accuracy
- Can be scheduled during low-traffic hours

---

### 5. **Orphaned File Cleanup** (CRON JOB)

**Use Case**: Clean up PDFs/files with no database reference (per M1.3 R2 integration)

```typescript
// Cron: Run daily at 2 AM
- Find files in R2 bucket older than 7 days
- Check if database has reference
- Delete orphaned files
- Log cleanup stats
```

**Why cron?**
- Maintenance task, not user-initiated
- Runs during off-peak hours
- Saves storage costs

---

### 6. **Drip Campaign Emails** (CRON JOB)

**Use Case**: Send reminders to users who started but didn't complete assessments

```typescript
// Cron: Run daily at 9 AM
- Find assessments started > 3 days ago, not completed
- Find users who haven't received reminder
- Queue "incomplete-assessment-reminder" job per user
- Jobs send personalized emails
```

**Why cron + background jobs?**
- Cron finds candidates, queues background jobs
- Jobs send individual emails (can retry if needed)
- Can handle thousands of emails without blocking

---

### 7. **Analytics Aggregation** (CRON JOB)

**Use Case**: Pre-calculate analytics metrics for dashboard (per M2.5)

```typescript
// Cron: Run hourly
- Calculate conversion funnel metrics
- Aggregate user engagement stats
- Update analytics cache/database
- Dashboard queries pre-aggregated data (fast!)
```

**Why cron?**
- Expensive calculations, better to pre-compute
- Dashboard loads instantly with cached data
- Updates regularly for freshness

---

### 8. **Data Export/Import** (BACKGROUND JOB)

**Use Case**: Admin exports all assessments to CSV, or imports survey questions

```typescript
// Admin triggers export
POST /api/admin/export-assessments
→ Queue job: "export-assessments-csv"
→ Return jobId immediately

// Worker generates CSV, uploads to R2
// Admin receives email with download link when complete
```

**Why background?**
- Large exports can take minutes
- Admin can do other things while waiting
- Can handle multiple exports in parallel

---

### 9. **Partner Link Click Tracking** (BACKGROUND JOB)

**Use Case**: Track partner referral clicks without blocking the redirect

```typescript
// User clicks partner link in PDF
GET /api/partner/click?partnerId=123&assessmentId=456
→ Queue job: "track-partner-click" (low priority)
→ Immediately redirect to partner URL

// Worker logs click to database for analytics
```

**Why background?**
- Analytics shouldn't slow down user experience
- Redirect must be instant
- Can batch track multiple clicks

---

### 10. **Scheduled Assessment Reminders** (CRON JOB)

**Future Use Case**: Quarterly assessment reminders (per V2 roadmap)

```typescript
// Cron: Run weekly, check for quarterly reminders
- Find companies that completed assessment 3 months ago
- Queue "quarterly-reminder" email job per company
- Jobs send personalized "time to reassess" emails
```

**Why cron?**
- Time-based automation
- Handles recurring business logic
- Scales to many companies

---

## Job Types Breakdown

### Immediate Priority Jobs (M1.2 Implementation)

1. **`generate-pdf-report`** - Generate assessment PDF
   - Trigger: Assessment completed
   - Priority: High
   - Dependencies: Assessment must exist

2. **`send-email`** - Send transactional email
   - Trigger: Various events (signup, completion, password reset)
   - Priority: Medium
   - Types: welcome, completion, password-reset, reminder

3. **`generate-ai-recommendations`** - Call LLM API
   - Trigger: Assessment completed
   - Priority: High
   - Dependencies: Assessment answers must exist

### Scheduled Cron Jobs (Post-M1.2)

4. **`recalculate-benchmarks`** - Update industry stats
   - Schedule: Hourly
   - Priority: Low

5. **`cleanup-orphaned-files`** - Delete unused files from R2
   - Schedule: Daily at 2 AM
   - Priority: Low

6. **`send-drip-campaign-emails`** - Incomplete assessment reminders
   - Schedule: Daily at 9 AM
   - Priority: Medium

7. **`aggregate-analytics`** - Pre-compute dashboard metrics
   - Schedule: Hourly
   - Priority: Low

---

## Implementation Architecture

### Job Queue System (M1.2)

```
┌─────────────────┐
│  API Request    │
│  (User Action)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Enqueue Job    │
│  (Save to DB)   │
└────────┬────────┘
         │
         │ Returns immediately
         ▼
┌─────────────────┐
│  Job Queue      │
│  (PostgreSQL)   │
│  - status       │
│  - payload      │
│  - run_at       │
│  - priority     │
└────────┬────────┘
         │
         │ Worker picks up
         ▼
┌─────────────────┐
│  Worker Process │
│  (Every 10s)    │
│  - Claims job   │
│  - Executes     │
│  - Retries      │
│  - Logs events  │
└─────────────────┘
```

### Job Lifecycle

1. **Queued** - Job created, waiting to be processed
2. **Started** - Worker picked up job, executing now
3. **Progress** - Worker emits progress updates (optional)
4. **Completed** - Job finished successfully
5. **Failed** - Job failed, will retry up to max_attempts
6. **Retry Scheduled** - Waiting for retry with exponential backoff
7. **Canceled** - Admin canceled the job

---

## Example: Converting PDF Generation to Background Job

### Before (Synchronous)

```typescript
// server/routes/assessments.ts
router.post('/complete', async (req, res) => {
  // User waits 20-30 seconds here! ❌
  const pdf = await PDFGenerator.generateAndSavePDF(assessment);
  await emailService.sendCompletionEmail(assessment, pdf);
  res.json({ success: true });
});
```

### After (Background Job)

```typescript
// server/routes/assessments.ts
router.post('/complete', async (req, res) => {
  // Save assessment as completed
  await db.update(assessments).set({ completed: true });
  
  // Queue background job (returns immediately)
  const job = await jobQueue.enqueue('generate-pdf-report', {
    assessmentId: assessment.id,
    userId: req.user?.id,
    guestEmail: req.body.guestEmail
  }, {
    priority: 'high',
    maxAttempts: 3
  });
  
  // User gets response in < 1 second ✅
  res.json({ 
    success: true, 
    jobId: job.id,
    message: 'Your report is being generated. You will receive an email when ready.'
  });
});

// Worker processes job later
jobQueue.register('generate-pdf-report', async (job) => {
  const { assessmentId, userId, guestEmail } = job.payload;
  
  // These slow operations happen async
  const assessment = await db.select().from(assessments).where(...);
  const pdf = await PDFGenerator.generateAndSavePDF(assessment);
  await emailService.sendCompletionEmail(assessment, pdf);
});
```

---

## Cron Job Examples

### Using Your Job System for Cron Jobs

```typescript
// server/cron/scheduler.ts

// Schedule benchmark recalculation (runs every hour)
cron.schedule('0 * * * *', async () => {
  await jobQueue.enqueue('recalculate-benchmarks', {}, {
    runAt: new Date(), // Process immediately
    priority: 'low'
  });
});

// Schedule file cleanup (runs daily at 2 AM)
cron.schedule('0 2 * * *', async () => {
  await jobQueue.enqueue('cleanup-orphaned-files', {}, {
    priority: 'low'
  });
});

// Schedule drip campaign (runs daily at 9 AM)
cron.schedule('0 9 * * *', async () => {
  // Find incomplete assessments
  const incomplete = await db.select().from(assessments)
    .where(and(
      eq(assessments.completed, false),
      lt(assessments.createdAt, threeDaysAgo)
    ));
  
  // Queue email job for each
  for (const assessment of incomplete) {
    await jobQueue.enqueue('send-email', {
      type: 'incomplete-reminder',
      assessmentId: assessment.id,
      userId: assessment.userId
    }, {
      priority: 'medium'
    });
  }
});
```

---

## Benefits Summary

### For Users
- ✅ Fast response times (no waiting for slow operations)
- ✅ Better UX (immediate feedback)
- ✅ Reliable delivery (retries on failure)

### For Developers
- ✅ Scalable (handle many requests)
- ✅ Observable (admin dashboard for monitoring)
- ✅ Reliable (automatic retries, error handling)
- ✅ Flexible (priority queues, scheduling)

### For Business
- ✅ Better user experience = higher conversion
- ✅ Handle more load without timeout issues
- ✅ Analytics on job performance
- ✅ Cost control (can pause expensive jobs during high load)

---

## Next Steps

1. **Implement M1.2 Background Jobs System** first
2. **Migrate PDF generation** to background job (biggest UX win)
3. **Migrate email sending** to background jobs
4. **Add cron scheduler** for maintenance tasks
5. **Add monitoring/alerts** for failed jobs

This foundation enables all the other use cases listed above!

