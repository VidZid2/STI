# Demo Submission Added to GradeSubmissionsModal

## What Was Added

A demo submission with local data has been added to the GradeSubmissionsModal to demonstrate the grading interface when there are no real submissions in the database.

## Demo Data Details

### Demo Submission
- **Student Name**: Maria Santos
- **Student ID**: 2024-001234
- **Section**: CS-3A
- **Status**: Submitted (pending grading)
- **Submission**: Includes a PDF attachment (dummy.pdf)
- **Similarity Score**: 12% (low, no plagiarism concerns)
- **Late Status**: Not late
- **Text Content**: Sample description of the submission

### Demo Task
- **Title**: Research Paper - Data Structures
- **Type**: Assignment
- **Points**: 100
- **Description**: Write a comprehensive research paper on advanced data structures

## How It Works

1. When you open the Grade Submissions modal
2. The system checks for real submissions from Supabase
3. **If no submissions are found**, it automatically loads the demo submission
4. **If no tasks are found**, it also loads the demo task
5. This allows you to test and demonstrate the grading interface immediately

## Features You Can Test

With this demo submission, you can:

✅ View the submission details
✅ See the attached PDF file
✅ Enter a score (0-100)
✅ Use quick score buttons
✅ Write feedback
✅ Use the rubric grading feature
✅ Test AI grading (if configured)
✅ Flag the submission
✅ See the grading statistics
✅ Test keyboard shortcuts
✅ Preview the PDF attachment

## Location

File: `src/pages/TeacherDashboard/GradeSubmissionsModal.tsx`

The demo data is defined at the top of the file after the imports:
- Lines ~110-140: DEMO_SUBMISSION and DEMO_TASK constants

The demo data is loaded in the useEffect hook:
- Lines ~2660-2680: When no real submissions are found, demo data is loaded

## Testing

To see the demo submission:
1. Open the Teacher Dashboard
2. Click on "Grade Submissions"
3. If you have no real submissions in your database, you'll see Maria Santos' submission
4. Click on it to start grading
5. Try all the grading features!

## Note

The demo submission will only appear when there are **no real submissions** in the database. Once you have real data, it will use that instead.
