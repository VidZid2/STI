/**
 * GradeSubmissionsModal Mock Data
 * Phase 1C: Extracted demo/fallback data for development and testing
 */

import type { Task, Submission, Course, RubricCriteria } from './types';

// ============================================
// FALLBACK COURSES
// ============================================
export const FALLBACK_COURSES: Course[] = [
    { id: 'course-1', name: 'Introduction to Programming', code: 'CS101', section: 'A' },
    { id: 'course-2', name: 'Data Structures', code: 'CS201', section: 'B' },
    { id: 'course-3', name: 'Web Development', code: 'CS301', section: 'A' },
    { id: 'course-4', name: 'Database Systems', code: 'CS401', section: 'C' },
];

// ============================================
// DEMO TASKS
// ============================================
export const DEMO_TASKS: Task[] = [
    {
        id: 'task-1',
        title: 'Midterm Essay: Modern Literature Analysis',
        course_id: 'course-1',
        course_name: 'Introduction to Programming',
        type: 'assignment',
        due_date: '2024-03-15T23:59:00Z',
        points: 100,
        description: 'Write a comprehensive analysis of a modern literary work.',
        submission_count: 28,
        graded_count: 15,
        rubric: [
            { id: 'r1', name: 'Thesis Statement', description: 'Clear and arguable thesis', points: 20 },
            { id: 'r2', name: 'Evidence & Analysis', description: 'Strong textual evidence with analysis', points: 30 },
            { id: 'r3', name: 'Organization', description: 'Logical structure and flow', points: 20 },
            { id: 'r4', name: 'Grammar & Style', description: 'Proper grammar and academic style', points: 15 },
            { id: 'r5', name: 'Citations', description: 'Proper MLA/APA citations', points: 15 },
        ],
    },
    {
        id: 'task-2',
        title: 'Chapter 5 Quiz: Algorithms',
        course_id: 'course-2',
        course_name: 'Data Structures',
        type: 'quiz',
        due_date: '2024-03-18T14:00:00Z',
        points: 50,
        description: 'Quiz covering sorting and searching algorithms.',
        submission_count: 32,
        graded_count: 32,
    },
    {
        id: 'task-3',
        title: 'Lab Report: Physics Experiment',
        course_id: 'course-3',
        course_name: 'Web Development',
        type: 'assignment',
        due_date: '2024-03-20T23:59:00Z',
        points: 75,
        description: 'Document your findings from the pendulum experiment.',
        submission_count: 24,
        graded_count: 8,
    },
    {
        id: 'task-4',
        title: 'Performance Assessment: Presentation Skills',
        course_id: 'course-4',
        course_name: 'Database Systems',
        type: 'performance',
        due_date: '2024-03-22T16:00:00Z',
        points: 100,
        description: 'Deliver a 10-minute presentation on your research topic.',
        submission_count: 18,
        graded_count: 0,
    },
];

// ============================================
// DEMO SUBMISSIONS
// ============================================
export const DEMO_SUBMISSIONS: Submission[] = [
    {
        id: 'sub-1',
        task_id: 'task-1',
        student_id: 'stu-1',
        student_name: 'Alice Johnson',
        student_email: 'alice.johnson@school.edu',
        section: 'CS-3A',
        submitted_at: '2024-03-14T22:30:00Z',
        status: 'submitted',
        score: null,
        attachments: [
            { name: 'essay_final.pdf', type: 'application/pdf', url: '/files/essay1.pdf', size: 245000 },
            { name: 'references.docx', type: 'application/docx', url: '/files/refs1.docx', size: 32000 },
        ],
        is_late: false,
        is_flagged: false,
        similarity_score: 12,
    },
    {
        id: 'sub-2',
        task_id: 'task-1',
        student_id: 'stu-2',
        student_name: 'Bob Smith',
        student_email: 'bob.smith@school.edu',
        section: 'CS-3A',
        submitted_at: '2024-03-15T08:15:00Z',
        status: 'graded',
        score: 92,
        feedback: 'Excellent analysis with strong thesis. Minor citation formatting issues.',
        attachments: [
            { name: 'midterm_essay.pdf', type: 'application/pdf', url: '/files/essay2.pdf', size: 312000 },
        ],
        is_late: false,
        is_flagged: false,
        similarity_score: 8,
        grade_history: [
            { score: 92, feedback: 'Excellent analysis with strong thesis.', graded_at: '2024-03-16T10:00:00Z', graded_by: 'Prof. Williams', version: 1 },
        ],
    },
    {
        id: 'sub-3',
        task_id: 'task-1',
        student_id: 'stu-3',
        student_name: 'Carol Davis',
        student_email: 'carol.davis@school.edu',
        section: 'CS-3A',
        submitted_at: '2024-03-16T02:45:00Z',
        status: 'late',
        score: null,
        attachments: [
            { name: 'literature_analysis.pdf', type: 'application/pdf', url: '/files/essay3.pdf', size: 198000 },
        ],
        is_late: true,
        is_flagged: true,
        similarity_score: 45,
    },
    {
        id: 'sub-4',
        task_id: 'task-1',
        student_id: 'stu-4',
        student_name: 'David Lee',
        student_email: 'david.lee@school.edu',
        section: 'CS-3A',
        submitted_at: '2024-03-15T23:58:00Z',
        status: 'graded',
        score: 78,
        feedback: 'Good effort but thesis needs more clarity. Evidence is solid.',
        attachments: [
            { name: 'essay_v2.pdf', type: 'application/pdf', url: '/files/essay4.pdf', size: 267000 },
        ],
        is_late: false,
        is_flagged: false,
        similarity_score: 15,
    },
    {
        id: 'sub-5',
        task_id: 'task-1',
        student_id: 'stu-5',
        student_name: 'Emma Wilson',
        student_email: 'emma.wilson@school.edu',
        section: 'CS-3A',
        submitted_at: '2024-03-14T16:20:00Z',
        status: 'resubmitted',
        score: null,
        attachments: [
            { name: 'essay_revised.pdf', type: 'application/pdf', url: '/files/essay5.pdf', size: 289000 },
            { name: 'outline.docx', type: 'application/docx', url: '/files/outline5.docx', size: 45000 },
        ],
        is_late: false,
        is_flagged: false,
        similarity_score: 5,
        grade_history: [
            { score: 65, feedback: 'Needs revision. See comments.', graded_at: '2024-03-13T14:00:00Z', graded_by: 'Prof. Williams', version: 1 },
        ],
    },
    {
        id: 'sub-6',
        task_id: 'task-3',
        student_id: 'stu-1',
        student_name: 'Alice Johnson',
        student_email: 'alice.johnson@school.edu',
        section: 'CS-3A',
        submitted_at: '2024-03-19T20:00:00Z',
        status: 'submitted',
        score: null,
        attachments: [
            { name: 'lab_report.pdf', type: 'application/pdf', url: '/files/lab1.pdf', size: 456000 },
            { name: 'data_charts.xlsx', type: 'application/xlsx', url: '/files/data1.xlsx', size: 78000 },
        ],
        is_late: false,
        is_flagged: false,
    },
    {
        id: 'sub-7',
        task_id: 'task-3',
        student_id: 'stu-6',
        student_name: 'Frank Miller',
        student_email: 'frank.miller@school.edu',
        section: 'CS-3A',
        submitted_at: '2024-03-20T23:55:00Z',
        status: 'submitted',
        score: null,
        attachments: [
            { name: 'physics_lab.pdf', type: 'application/pdf', url: '/files/lab2.pdf', size: 523000 },
        ],
        is_late: false,
        is_flagged: false,
        similarity_score: 22,
    },
];

// ============================================
// DEMO RUBRIC (standalone for testing)
// ============================================
export const DEMO_RUBRIC: RubricCriteria[] = [
    {
        id: 'rubric-1',
        name: 'Content Quality',
        description: 'Accuracy and depth of content',
        points: 40,
        max_points: 40,
        levels: [
            { score: 40, label: 'Excellent', description: 'Comprehensive and accurate' },
            { score: 30, label: 'Good', description: 'Mostly accurate with minor gaps' },
            { score: 20, label: 'Satisfactory', description: 'Basic understanding shown' },
            { score: 10, label: 'Needs Work', description: 'Significant gaps in understanding' },
        ],
    },
    {
        id: 'rubric-2',
        name: 'Organization',
        description: 'Structure and logical flow',
        points: 30,
        max_points: 30,
        levels: [
            { score: 30, label: 'Excellent', description: 'Clear, logical structure' },
            { score: 22, label: 'Good', description: 'Generally well-organized' },
            { score: 15, label: 'Satisfactory', description: 'Some organizational issues' },
            { score: 8, label: 'Needs Work', description: 'Lacks clear structure' },
        ],
    },
    {
        id: 'rubric-3',
        name: 'Organization',
        description: 'Grammar, formatting, and style',
        points: 30,
        max_points: 30,
        levels: [
            { score: 30, label: 'Excellent', description: 'Professional quality' },
            { score: 22, label: 'Good', description: 'Minor errors only' },
            { score: 15, label: 'Satisfactory', description: 'Several errors present' },
            { score: 8, label: 'Needs Work', description: 'Many errors, needs revision' },
        ],
    },
];
