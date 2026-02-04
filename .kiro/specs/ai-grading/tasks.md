# Implementation Tasks

## Phase 1: Core AI Grading Service
> Create the foundational service that interfaces with GROQ API for grading

### Task 1.1: Create AI Grading Service Types
- [x] Create `src/lib/grading/types.ts` with interfaces:
  - `AIGradingResult` (score, confidence, reasoning, feedback)
  - `RubricCriteria` and `RubricScore`
  - `GradingRequest` (submission content, rubric, maxPoints)
  - `BatchGradingProgress`

### Task 1.2: Create AI Grading Service
- [x] Create `src/lib/grading/aiGradingService.ts`
- [x] Copy multi-account rotation pattern from `groqService.ts`
- [x] Implement `gradeSubmission()` function with GROQ API call
- [x] Implement `generateFeedback()` function
- [x] Add error handling and rate limit rotation
- [x] Export `isAIGradingConfigured()` helper

## Phase 2: Single Submission AI Grading UI
> Add "AI Grade" button to the grading panel

### Task 2.1: Add AI Grade Button to GradingPanel
- [x] Add "AI Grade" button next to score input in `GradeSubmissionsModal.tsx`
- [x] Add loading state with "Analyzing..." text
- [x] Add `isAIGrading` state to track loading
- [x] Wire button to call `gradeSubmission()` from service

### Task 2.2: Display AI Suggestions
- [x] Show AI-suggested score with confidence percentage
- [x] Show "Accept" and "Dismiss" buttons for suggestions
- [x] Auto-populate score and feedback on "Accept"
- [x] Track dismissed suggestions to avoid re-suggesting

## Phase 3: Rubric-Based AI Scoring
> Enable AI to score against individual rubric criteria

### Task 3.1: Enhance AI Service for Rubric Grading
- [ ] Add `gradeWithRubric()` function to service
- [ ] Create prompt template that evaluates each criterion
- [ ] Return individual criterion scores with reasoning

### Task 3.2: Update UI for Rubric AI Grading
- [ ] When rubric is open, AI grades each criterion separately
- [ ] Display AI reasoning per criterion in tooltip
- [ ] Allow accepting/rejecting individual criterion scores

## Phase 4: Personalized Feedback Generation
> Generate contextual feedback based on submission content

### Task 4.1: Enhance Feedback Generation
- [x] Create `generatePersonalizedFeedback()` function
- [x] Include submission strengths and areas for improvement
- [x] Maintain professional, encouraging tone
- [x] Keep feedback between 50-200 words

### Task 4.2: Add "Generate Feedback" Button
- [x] Add separate "AI Feedback" button in feedback section
- [x] Allow generating feedback independently of scoring
- [x] Show preview before applying to feedback textarea

## Phase 5: Batch AI Grading
> Process multiple submissions with AI assistance

### Task 5.1: Add Batch AI Grading Service
- [x] Add `batchGradeSubmissions()` function
- [x] Process submissions sequentially with progress callback
- [x] Handle failures gracefully (skip and continue)
- [x] Return summary of graded/failed counts

### Task 5.2: Add "AI Grade All" Button to Batch Mode
- [x] Show "AI Grade All" button when in batch mode with ungraded submissions
- [x] Display progress indicator during batch grading
- [x] Show completion summary
- [x] Allow review before final submission

## Phase 6: Outlier Detection (Optional Enhancement)
> Identify exceptional or concerning submissions

### Task 6.1: Add Outlier Detection Logic
- [x] Flag submissions with unusually high/low quality
- [x] Integrate with existing similarity_score for plagiarism warnings
- [x] Add outlier indicators to submission list

### Task 6.2: Add Outlier UI Indicators
- [x] Show star icon for exceptional submissions
- [x] Show warning icon for concerning submissions
- [x] Add tooltip explaining the flag reason

---

## Implementation Order
1. **Phase 1** - Foundation (must complete first)
2. **Phase 2** - Core feature (single AI grading)
3. **Phase 4** - Quick win (feedback generation)
4. **Phase 3** - Enhancement (rubric integration)
5. **Phase 5** - Power feature (batch grading)
6. **Phase 6** - Polish (outlier detection)

## Notes
- Each phase is independently deployable
- Phase 1 is required before any other phase
- Phases 2-4 can be done in any order after Phase 1
- Phase 5 requires Phase 2
- Phase 6 is optional enhancement
