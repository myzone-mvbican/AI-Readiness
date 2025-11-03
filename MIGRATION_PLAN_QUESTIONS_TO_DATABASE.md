# Migration Plan: Questions from File System to Database

## Current State Analysis

### How Questions Are Currently Handled

1. **Storage:**
   - CSV files stored in `public/uploads/` directory
   - File path stored in `surveys.fileReference` column (relative path)
   - Questions are NOT stored in database

2. **Parsing Flow:**
   - When creating a survey: CSV is uploaded → saved to filesystem → path stored in DB
   - When updating a survey with new CSV: Old file deleted → New file saved → Path updated
   - When fetching a survey: CSV file is parsed on-the-fly using `CsvParser.parse()`
   - Parsing happens in `SurveyService.getById()` every time a survey is requested

3. **Question Structure (from CSV):**
   ```typescript
   type CsvQuestion = {
     id: number;           // From "Question Number" column
     question: string;     // From "Question Summary" column
     category: string;     // From "Category" column
     details: string;      // From "Question Details" column
   }
   ```

4. **CSV File Format:**
   - Required columns: "Question Summary", "Category", "Question Details"
   - Optional: "Question Number" (falls back to index + 1)
   - Validation performed by `CsvParser.validate()`

5. **Usage Points:**
   - `SurveyService.getById()` - Returns survey with parsed questions
   - Guest survey pages - Display questions for anonymous users
   - Assessment detail pages - Show questions with answers
   - Public API endpoints - `/api/public/surveys/detail/:id`

## Proposed Changes

### Database Schema Update

**Add to `surveys` table:**
```sql
ALTER TABLE surveys ADD COLUMN questions JSONB;
```

**Why JSONB instead of JSON:**
- PostgreSQL JSONB allows efficient querying and indexing
- Supports operations like `?`, `@>`, `->`, `->>` for filtering questions by category
- Better performance for large question sets
- Can add indexes on specific question fields if needed

**Migration Considerations:**
- Field should be nullable initially (for backward compatibility)
- Can be made NOT NULL after migration is complete
- Need to migrate existing surveys

### New Question Storage Format

```typescript
// Stored as JSONB array in database
[
  {
    "id": 1,
    "question": "Our Vision / 3-year picture / 1-year plan explicitly considers an AGI future.",
    "category": "Strategy & Vision",
    "details": "A forward-looking vision isn't just a slogan..."
  },
  {
    "id": 2,
    "question": "The company sets at least one corporate AI Rock each quarter...",
    "category": "Strategy & Vision",
    "details": "Rocks (in EOS parlance) create focus..."
  }
  // ... more questions
]
```

## Implementation Plan

### Phase 1: Database Schema Update

1. **Create Migration:**
   - Add `questions` JSONB column to `surveys` table
   - Column should be nullable initially
   - Add database-level validation (optional): ensure it's an array if not null

2. **Update Schema Definition:**
   - Update `shared/schema.ts` to include `questions` field
   - Type: `jsonb("questions")` with `.$type<CsvQuestion[]>()`

### Phase 2: Update Service Layer

1. **Modify `SurveyService.createSurvey()`:**
   - After CSV file is saved, parse it using `CsvParser.parse()`
   - Store parsed questions as JSON in database
   - Store `questionsCount` derived from parsed questions array length
   - Keep CSV file for backup/audit trail (or delete based on decision below)

2. **Modify `SurveyService.updateSurvey()`:**
   - If new CSV file is provided:
     - Parse new CSV file
     - Update `questions` JSONB field
     - Update `questionsCount`
     - Update `fileReference` (keep or update based on decision)
   - Validate questions array is not empty

3. **Modify `SurveyService.getById()`:**
   - **Remove CSV parsing logic completely**
   - Read questions directly from database `questions` field
   - Parse JSONB to `CsvQuestion[]` array
   - Throw error if questions is null (no fallback - migration must be complete)

4. **Add Helper Method:**
   - `parseAndStoreQuestions(filePath: string): Promise<CsvQuestion[]>`
   - Extracted logic for parsing CSV and returning questions array

### Phase 3: Data Migration

1. **Migration Script:**
   - One-time script to populate `questions` field for ALL existing surveys
   - For each survey:
     - Read CSV file from `fileReference`
     - Parse using `CsvParser.parse()`
     - Update database with parsed questions JSON
     - Delete CSV file after successful migration (optional, or keep until verified)
   - Handle missing/invalid CSV files gracefully (log and skip)
   - Log successes and failures
   - Must complete successfully for all surveys before deployment

2. **Validation:**
   - Verify all surveys have questions populated
   - Compare `questionsCount` with `questions.length`
   - Flag any discrepancies

### Phase 4: Testing & Validation

1. **Unit Tests:**
   - Test parsing and storing questions
   - Test fetching questions from database
   - Test update flow with new CSV
   - Test backward compatibility (null questions fallback)

2. **Integration Tests:**
   - Test full survey creation flow
   - Test survey update with new CSV
   - Test survey retrieval with questions
   - Test guest survey display
   - Test assessment detail page

3. **Edge Cases:**
   - Empty CSV file
   - Invalid CSV structure
   - Missing CSV file (for existing surveys)
   - Very large CSV files (performance testing)

### Phase 5: Cleanup & File Deletion

1. **Remove CSV Files:**
   - Delete CSV files immediately after parsing (on create/update)
   - Migration script can optionally delete CSV files after migration
   - No need to keep fileReference column - can be removed later or set to NULL

2. **Code Cleanup:**
   - All CSV parsing removed from `getById()` - no fallback
   - Keep `CsvParser` class only for parsing during create/update operations
   - Remove any remaining CSV file reading logic

## Decisions Made ✅

### 1. CSV File Handling
**Decision:** ✅ Delete CSV files after parsing
- CSV files will be deleted immediately after questions are parsed and stored in database
- No backup/audit trail of CSV files
- Cleaner system with no duplicate storage

### 2. Backward Compatibility
**Decision:** ✅ No backward compatibility - Full conversion
- Remove all CSV parsing fallback code
- All code will read questions from database only
- Migration script must populate all existing surveys before deployment

### 3. Data Migration Timing
**Decision:** ✅ One-time migration script
- Single script to migrate all existing surveys
- Run before deployment
- No lazy migration or on-demand approach

### 4. Question ID Generation
**Decision:** ✅ Keep CSV question numbers
- Use "Question Number" from CSV as-is
- These IDs will be used for ordering questions
- Maintains consistency with existing data structure

### 5. Validation on Update
**Decision:** Full CSV replacement only (default)
- Only allow full CSV replacement when updating surveys
- Future enhancement: Allow manual question editing via API

## Implementation Steps

### Step 1: Schema Update
- [ ] Create database migration file
- [ ] Add `questions JSONB` column to surveys table
- [ ] Update `shared/schema.ts` type definition
- [ ] Test migration script

### Step 2: Update Create Flow
- [ ] Modify `SurveyService.createSurvey()` to parse and store questions
- [ ] Update `SurveyController.create()` if needed
- [ ] Test creation with new CSV

### Step 3: Update Update Flow
- [ ] Modify `SurveyService.updateSurvey()` to parse and store questions when CSV provided
- [ ] Test update with new CSV file
- [ ] Test update without CSV (metadata only)

### Step 4: Update Read Flow
- [ ] Modify `SurveyService.getById()` to read from database
- [ ] Add fallback to CSV parsing for null questions
- [ ] Test reading surveys with questions from DB
- [ ] Test fallback for surveys without questions

### Step 5: Data Migration
- [ ] Create migration script
- [ ] Test on development database
- [ ] Run on production (or staging first)
- [ ] Verify all surveys migrated

### Step 6: Testing
- [ ] Unit tests for all new/modified functions
- [ ] Integration tests for full flows
- [ ] Manual testing of UI components
- [ ] Performance testing with large question sets

### Step 7: Documentation
- [ ] Update API documentation
- [ ] Update developer docs
- [ ] Add migration notes for future reference

## Risk Assessment

### Low Risk
- ✅ Adding nullable JSONB column (non-breaking)
- ✅ Adding questions on create (new surveys only)

### Medium Risk
- ⚠️ Changing `getById()` behavior (needs thorough testing)
- ⚠️ Data migration script (must handle edge cases)
- ⚠️ Update flow changes (could affect existing surveys)

### High Risk
- ❌ Removing CSV parsing completely (only after migration confirmed)
- ❌ Deleting CSV files (only if explicitly approved)

## Rollback Plan

1. **Schema Rollback:**
   - Column can remain (nullable) - no breaking change
   - Code can revert to CSV parsing only

2. **Code Rollback:**
   - Keep backward compatibility fallback
   - Revert service changes if issues arise

3. **Data Rollback:**
   - CSV files remain available for re-parsing
   - Can re-run migration if needed

## Performance Considerations

1. **JSONB Benefits:**
   - No file I/O on every survey fetch
   - Faster query performance
   - Can index question fields if needed

2. **Storage:**
   - JSONB is compressed
   - Typical survey (40 questions) ~50-100KB in DB
   - Much smaller than CSV file storage overhead

3. **Parsing:**
   - Parsing only happens on create/update
   - Not on every fetch (current bottleneck removed)

## Future Enhancements

1. **Question Management UI:**
   - Edit questions directly without CSV re-upload
   - Add/remove individual questions
   - Question versioning/history

2. **Advanced Features:**
   - Question categories indexing
   - Full-text search on questions
   - Question templates/library

3. **Import/Export:**
   - Export questions to CSV (for backup)
   - Import from multiple formats (JSON, Excel)

## Estimated Timeline

- **Phase 1 (Schema):** 2-4 hours
- **Phase 2 (Services):** 4-6 hours
- **Phase 3 (Migration):** 2-4 hours
- **Phase 4 (Testing):** 4-6 hours
- **Phase 5 (Cleanup):** 1-2 hours

**Total:** 13-22 hours

## Next Steps

1. Review this plan and answer open questions
2. Get approval for approach
3. Start with Phase 1 (lowest risk)
4. Iterate through phases with testing at each step
5. Deploy with backward compatibility
6. Monitor and verify migration success
7. Plan cleanup phase after stability confirmed

