# Requirements Document

## Introduction

This feature adds AI-powered auto-grading capabilities to the Grade Submissions Modal, enabling teachers to leverage GROQ's Llama AI to analyze student submissions, suggest scores, generate personalized feedback, and identify outliers. The system uses the existing multi-account GROQ API rotation pattern (5 accounts × 14,400 req/day = 72,000 req/day FREE) already implemented in the paraphraser service.

## Glossary

- **AI_Grading_Service**: The core service that interfaces with GROQ API to analyze submissions and generate grading suggestions
- **Submission**: A student's submitted work including attachments, text content, and metadata
- **Rubric**: A set of criteria with point values used to evaluate submissions
- **Grade_Suggestion**: An AI-generated score recommendation with confidence level and reasoning
- **Feedback_Generator**: Component that creates personalized feedback based on submission analysis
- **Batch_Grader**: Component that processes multiple submissions in sequence with AI assistance
- **Outlier_Detector**: Component that identifies submissions with unusual characteristics (very high/low quality, potential plagiarism patterns)

## Requirements

### Requirement 1: AI Grading Service Core

**User Story:** As a teacher, I want an AI service that can analyze student submissions, so that I can get intelligent grading assistance.

#### Acceptance Criteria

1. THE AI_Grading_Service SHALL use the existing GROQ multi-account rotation pattern from groqService.ts
2. WHEN a submission is analyzed, THE AI_Grading_Service SHALL return a suggested score, confidence level (0-100%), and reasoning
3. WHEN the GROQ API rate limit is reached, THE AI_Grading_Service SHALL automatically rotate to the next available account
4. IF all GROQ accounts are rate-limited, THEN THE AI_Grading_Service SHALL return a graceful error message with retry timing
5. THE AI_Grading_Service SHALL support configurable grading criteria through rubric integration

### Requirement 2: Single Submission AI Analysis

**User Story:** As a teacher, I want to click an "AI Grade" button on a submission, so that I can get an instant AI-suggested score and feedback.

#### Acceptance Criteria

1. WHEN a teacher clicks the "AI Grade" button, THE System SHALL display a loading state with "Analyzing submission..."
2. WHEN analysis completes, THE System SHALL populate the score input with the AI-suggested score
3. WHEN analysis completes, THE System SHALL populate the feedback textarea with AI-generated feedback
4. THE System SHALL display the AI confidence level (e.g., "85% confident") next to the suggested score
5. WHEN the AI suggests a score, THE System SHALL allow the teacher to accept, modify, or reject the suggestion
6. IF the submission has no analyzable content, THEN THE System SHALL display "Unable to analyze - no content found"

### Requirement 3: Rubric-Based AI Scoring

**User Story:** As a teacher, I want the AI to score submissions against my rubric criteria, so that grading is consistent with my standards.

#### Acceptance Criteria

1. WHEN a rubric is defined for the task, THE AI_Grading_Service SHALL evaluate each rubric criterion separately
2. WHEN rubric scoring completes, THE System SHALL display individual scores for each criterion
3. THE System SHALL calculate the total score by summing rubric criterion scores
4. WHEN displaying rubric scores, THE System SHALL show AI reasoning for each criterion score
5. THE System SHALL allow teachers to adjust individual criterion scores while keeping others

### Requirement 4: Personalized Feedback Generation

**User Story:** As a teacher, I want AI-generated feedback that references specific aspects of the student's work, so that feedback is meaningful and actionable.

#### Acceptance Criteria

1. WHEN generating feedback, THE Feedback_Generator SHALL reference specific strengths in the submission
2. WHEN generating feedback, THE Feedback_Generator SHALL identify specific areas for improvement
3. THE Feedback_Generator SHALL maintain a professional, encouraging tone appropriate for students
4. WHEN the submission is late, THE Feedback_Generator SHALL NOT mention lateness in the feedback (handled separately)
5. THE Feedback_Generator SHALL generate feedback between 50-200 words for optimal readability

### Requirement 5: Batch AI Grading

**User Story:** As a teacher, I want to AI-grade multiple ungraded submissions at once, so that I can save time on large classes.

#### Acceptance Criteria

1. WHEN in batch mode with ungraded submissions, THE System SHALL display an "AI Grade All" button
2. WHEN "AI Grade All" is clicked, THE Batch_Grader SHALL process submissions sequentially with a progress indicator
3. WHILE batch grading is in progress, THE System SHALL display "Grading X of Y submissions..."
4. WHEN a submission in the batch fails AI analysis, THE Batch_Grader SHALL skip it and continue with the next
5. WHEN batch grading completes, THE System SHALL display a summary (e.g., "AI graded 15 of 18 submissions")
6. THE Batch_Grader SHALL allow teachers to review and confirm all AI grades before final submission

### Requirement 6: Comparative Analysis and Outlier Detection

**User Story:** As a teacher, I want the AI to identify unusual submissions, so that I can give extra attention to students who may need help or recognition.

#### Acceptance Criteria

1. WHEN analyzing a submission, THE Outlier_Detector SHALL flag submissions with unusually high quality for recognition
2. WHEN analyzing a submission, THE Outlier_Detector SHALL flag submissions with unusually low quality for intervention
3. WHEN a submission has high similarity score (>30%), THE System SHALL display a plagiarism warning badge
4. THE System SHALL display outlier indicators (star for exceptional, warning for concerning) in the submission list
5. WHEN hovering over an outlier indicator, THE System SHALL show the reason for flagging

### Requirement 7: AI Grading UI Integration

**User Story:** As a teacher, I want the AI grading features to integrate seamlessly with the existing grading interface, so that my workflow is enhanced not disrupted.

#### Acceptance Criteria

1. THE System SHALL add an "AI Grade" button in the grading panel next to the score input
2. THE System SHALL display AI suggestions in a visually distinct but non-intrusive manner
3. WHEN AI suggestions are displayed, THE System SHALL show an "Accept" and "Dismiss" button
4. THE System SHALL preserve all existing manual grading functionality
5. THE System SHALL remember if a teacher dismissed an AI suggestion for a submission (don't re-suggest)
6. WHILE AI is processing, THE System SHALL disable the AI Grade button to prevent duplicate requests
