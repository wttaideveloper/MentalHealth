# User Testing Guide - Assessment Module

## Prerequisites
- User account created and logged in
- Backend server running
- Frontend client running
- At least one test/assessment in the database

---

## Test Flow Overview

### 1. **Browse Assessments** (Phase 4)
- [ ] Navigate to "All Assessments" page
- [ ] Verify assessments list displays
- [ ] Test search functionality (search by name)
- [ ] Test "Free Only" filter toggle
- [ ] Click on an assessment card
- [ ] Verify assessment detail page loads with:
  - Test title, description, price
  - Duration, questions count
  - Featured assessments sidebar
  - "Start Free" or "Buy Now" button

### 2. **View My Assessments** (Phase 4)
- [ ] Navigate to "My Assessments" page
- [ ] Verify "Completed" tab shows results (if any)
- [ ] Check result band colors (Low=green, Moderate=orange, High=red)
- [ ] Click "View" button on a result
- [ ] Verify it navigates to result page
- [ ] Click "Download Report" button
- [ ] Verify PDF downloads successfully

### 3. **Take an Assessment** (Phase 5)
- [ ] From assessment detail page, click "Start Free" (or buy if paid)
- [ ] Verify test page loads with:
  - Test title and description
  - Progress bar showing 0%
  - Questions displayed dynamically
- [ ] Answer questions (select radio options)
- [ ] Verify:
  - Progress bar updates
  - Answers are highlighted in green
  - Autosave works (check "Last saved" timestamp)
  - Timer displays (if time limit exists)
- [ ] Test "Save & Do it Later" button
- [ ] Verify navigation to My Assessments
- [ ] Resume the assessment from My Assessments
- [ ] Verify previous answers are loaded
- [ ] Complete remaining questions
- [ ] Click "Submit" button
- [ ] Verify validation (if questions unanswered)
- [ ] Submit complete assessment
- [ ] Verify redirect to result page

### 4. **View Results** (Phase 6)
- [ ] Verify result page displays:
  - Result header with band and score
  - Completion date
  - Risk flags alert (if any)
  - Interpretation section
  - Subscales section (if available)
  - Progress bar (100%)
  - All questions with selected answers highlighted
- [ ] Verify answer selections match what was submitted
- [ ] Click "Download Report" button
- [ ] Verify PDF downloads with correct content
- [ ] Navigate back to "My Assessments"
- [ ] Verify new result appears in completed list

### 5. **Edge Cases & Error Handling**
- [ ] Test with expired assessment (if applicable)
- [ ] Test with time limit (verify auto-submit when time expires)
- [ ] Test network error scenarios
- [ ] Test validation (submit without answering required questions)
- [ ] Test accessing result without permission (different user)
- [ ] Test with assessment that has no questions
- [ ] Test with assessment that has sub-questions

---

## Quick Test Checklist (5-Minute Version)

1. ✅ **Browse**: View assessments list → Search → Open detail page
2. ✅ **Start**: Click "Start Free" → Answer 2-3 questions
3. ✅ **Save**: Click "Save & Do it Later" → Resume from My Assessments
4. ✅ **Complete**: Finish all questions → Submit assessment
5. ✅ **Review**: View result page → Check score/band → Download PDF
6. ✅ **Verify**: Go to My Assessments → Confirm result appears

---

## Expected Results

- All API calls succeed
- Data displays correctly from backend
- Progress tracking works accurately
- Autosave functions properly
- PDF generation works
- Error messages are user-friendly
- Loading states display appropriately
- Navigation flows smoothly
- Responsive design works on mobile/tablet

---

## Notes

- Ensure backend has sample test data with `schemaJson`, `scoringRules`, and `riskRules`
- For paid tests, verify entitlement/payment flow works
- Check browser console for any JavaScript errors
- Verify all toast notifications display correctly

