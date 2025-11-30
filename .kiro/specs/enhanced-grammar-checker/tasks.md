# Implementation Plan

- [x] 1. Set up project structure and core interfaces





  - [x] 1.1 Create TypeScript interfaces for the analysis engine







    - Create `src/lib/grammar/types.ts` with GrammarIssue, Correction, AnalysisResult, WritingScore, ReadabilityMetrics, ToneAnalysis, TextStatistics interfaces
    - Define ToneType, ToneBreakdown, ToneInconsistency, DismissedPattern types
    - _Requirements: 1.1, 3.1, 4.1, 5.1, 6.1, 9.1_
  - [x] 1.2 Write property test for issue categorization

















    - **Property 7: Issue categorization completeness**
    --**Validates: Requirements 4.1, 4.2**

  - [x] 1.3 Set up fast-check testing framework






    - Install fast-check as dev dependency
    - Create test utilities and generators in `src/lib/grammar/__tests__/generators.ts`
    - _Requirements: Testing infrastructure_
-

- [x] 2. Implement text statistics calculator




-

  - [x] 2.1 Create statistics calculation module


















    - Create `src/lib/grammar/statistics.ts`
    - Implement wordCount, characterCount, sentenceCount, paragraphCount calculations
    - Implement readingTimeMinutes and averageSentenceLength calculations
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [x] 2.2 Write property test for statistics accuracy







    - **Property 15: Statistics calculation accuracy**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
-

- [x] 3. Implement readability calculator



 

  - [ ] 3.1 Create readability calculation module






    - Create `src/lib/grammar/readability.ts`
    - Implement syllable counting algorithm
    - Implement Flesch-Kincaid grade level formula
    - Implement education level mapping from grade to string
    - Implement difficult sentence detection (>25 words)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
 

  - [x] 3.2 Write property test for Flesch-Kincaid calculation




    - **Property 8: Readability score calculation**
    - **Validates: Requirements 5.1**
  - [x] 3.3 Write property test for education level mapping









    - **Property 9: Education level mapping**
    - **Validates: Requirements 5.2**
  - [x] 3.4 Write property test for readability issue detection









    - **Property 10: Readability issue detection**
    - **Validates: Requirements 5.3, 5.4**
-
-

- [x] 4. Implement grammar and spelling checker




  - [x] 4.1 Create grammar rules engine


    - Create `src/lib/grammar/rules.ts`
    - Migrate existing typo patterns from current GrammarChecker
    - Migrate confused words patterns
    - Add position tracking (startIndex, endIndex) for each match
    - _Requirements: 1.1, 1.3, 7.1, 7.2, 7.3, 7.4_

  - [x] 4.2 Write property test for inline highlight position accuracy

    - **Property 1: Inline highlight position accuracy**
    - **Validates: Requirements 1.1**

  - [x] 4.3 Write property test for multiple error detection
    - **Property 2: Multiple error detection per sentence**
    - **Validates: Requirements 1.3**
  - [x] 4.4 Implement advanced writing checks


    - Add passive voice detection using compromise NLP
    - Add wordy phrase detection with concise alternatives
    - Add cliché detection with original alternatives
    - Add inconsistent formatting detection (number styles)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 4.5 Write property test for advanced writing issue detection









    - **Property 13: Advanced writing issue detection**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [x] 5. Checkpoint - Ensure all tests pass









  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement tone analyzer








  - [x] 6.1 Create tone analysis module

    - Create `src/lib/grammar/tone.ts`
    - Implement tone detection for formal, informal, confident, neutral, friendly
    - Implement tone percentage breakdown calculation
    - Implement consistency detection and inconsistency identification
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 6.2 Write property test for tone analysis validity


    - **Property 11: Tone analysis validity**
    - **Validates: Requirements 6.1, 6.2**
  - [x] 6.3 Write property test for mixed tone detection


    - **Property 12: Mixed tone detection**
    - **Validates: Requirements 6.4**
-

- [x] 7. Implement writing score calculator





  - [x] 7.1 Create score calculation module

    - Create `src/lib/grammar/score.ts`
    - Implement overall score calculation (0-100 range)
    - Implement category scores (correctness, clarity, engagement, delivery)
    - Implement score update logic when issues are fixed
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 7.2 Write property test for writing score bounds


    - **Property 5: Writing score bounds**
    - **Validates: Requirements 3.1**

  - [x] 7.3 Write property test for score improvement on fix

    - **Property 6: Score improvement on fix**
    - **Validates: Requirements 3.3**
-

- [x] 8. Implement main analysis engine





  - [x] 8.1 Create unified analysis engine

    - Create `src/lib/grammar/analyzer.ts`
    - Integrate grammar rules, readability, tone, and statistics modules
    - Implement debounced analysis (500ms delay)
    - Return complete AnalysisResult
    - _Requirements: 1.4, 2.3_

  - [x] 8.2 Write property test for re-analysis after correction

    - **Property 4: Re-analysis after correction**
    - **Validates: Requirements 2.3**
-

- [x] 9. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.
- [x] 10. Implement correction application logic




- [ ] 10. Implement correction application logic

  - [x] 10.1 Create correction handler


    - Create `src/lib/grammar/corrections.ts`
    - Implement text replacement at specified positions
    - Handle position adjustment after corrections
    - Trigger re-analysis after correction
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 10.2 Write property test for correction application

    - **Property 3: Correction application transforms text correctly**
    - **Validates: Requirements 2.2**

- [x] 11. Implement dismissal manager




  - [x] 11.1 Create dismissal state management


    - Create `src/lib/grammar/dismissals.ts`
    - Implement pattern storage and lookup
    - Implement score recalculation on dismissal
    - Implement session memory for dismissed patterns
    - Implement reset on text clear
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 11.2 Write property test for dismissal state management

    - **Property 14: Dismissal state management**
    - **Validates: Requirements 8.2, 8.3, 8.4**
-

- [x] 12. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.
- [x] 13. Build InlineHighlighter component




- [ ] 13. Build InlineHighlighter component


  - [x] 13.1 Create inline highlighting UI

    - Create `src/components/tools/grammar/InlineHighlighter.tsx`
    - Implement text rendering with colored underlines at issue positions
    - Implement category-based color coding
    - Handle overlapping highlights (prioritize by severity)
    - _Requirements: 1.1, 1.3_

- [x] 14. Build IssueCard component






  - [x] 14.1 Create issue card popup UI

    - Create `src/components/tools/grammar/IssueCard.tsx`
    - Display issue message and description
    - Display correction suggestions with apply buttons
    - Add dismiss button
    - Position card near highlighted text
    - _Requirements: 1.2, 2.1, 2.4, 8.1_

- [x] 15. Build ScorePanel component





  - [x] 15.1 Create score display UI

    - Create `src/components/tools/grammar/ScorePanel.tsx`
    - Implement circular progress ring for overall score
    - Implement color coding based on score range
    - Implement animated score transitions (300ms)
    - Display category breakdown scores
    - _Requirements: 3.1, 3.2, 3.4_

- [x] 16. Build StatsPanel component






  - [x] 16.1 Create statistics display UI

    - Create `src/components/tools/grammar/StatsPanel.tsx`
    - Display word count, character count, sentence count
    - Display paragraph count and average sentence length
    - Display reading time estimate
    - Display readability grade and education level
    - _Requirements: 5.1, 5.2, 9.1, 9.3, 9.4_
-

- [x] 17. Build TonePanel component





  - [x] 17.1 Create tone analysis display UI

    - Create `src/components/tools/grammar/TonePanel.tsx`
    - Display dominant tone with icon
    - Display tone breakdown with percentage bars
    - Show consistency indicator
    - _Requirements: 6.1, 6.2_
- [x] 18. Build CategoryFilter component




- [ ] 18. Build CategoryFilter component


  - [x] 18.1 Create category filter UI



    - Create `src/components/tools/grammar/CategoryFilter.tsx`
    - Display category tabs with issue counts
    - Implement filter selection
    - Show checkmark for resolved categories
    - _Requirements: 4.2, 4.3, 4.4_
-

- [x] 19. Integrate enhanced Grammar Checker





  - [x] 19.1 Refactor main GrammarChecker component

    - Update `src/components/tools/GrammarChecker.tsx`
    - Replace textarea with InlineHighlighter
    - Add sidebar with ScorePanel, StatsPanel, TonePanel
    - Add CategoryFilter above issues list
    - Wire up all state management and event handlers
    - _Requirements: All_

  - [x] 19.2 Add responsive layout


    - Implement mobile-friendly layout with collapsible panels
    - Ensure touch-friendly issue card interactions
    - _Requirements: UI responsiveness_

- [x] 20. Final Checkpoint - Ensure all tests pass









  - Ensure all tests pass, ask the user if questions arise.
