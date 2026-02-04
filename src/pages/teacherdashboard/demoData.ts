/**
 * Teacher Dashboard Demo Data
 * Provides sample data to populate empty states for demonstration purposes
 * 
 * This file contains:
 * - Schedule items (today's classes)
 * - Urgent tasks
 * - Activity feed items
 * - Demo submissions for grading
 * - Demo students with scores
 */

// ============================================
// SCHEDULE DEMO DATA
// ============================================
export interface ScheduleItem {
    id: string;
    subject: string;
    section: string;
    room: string;
    startTime: string;
    endTime: string;
    status: 'upcoming' | 'ongoing' | 'completed';
    studentsPresent?: number;
    totalStudents?: number;
}

export const DEMO_SCHEDULE: ScheduleItem[] = [
    {
        id: 'schedule-1',
        subject: 'Introduction to Programming',
        section: 'CS-3A',
        room: 'Room 301',
        startTime: '08:00',
        endTime: '09:30',
        status: 'completed',
        studentsPresent: 28,
        totalStudents: 30,
    },
    {
        id: 'schedule-2',
        subject: 'Data Structures',
        section: 'CS-3B',
        room: 'Room 205',
        startTime: '10:00',
        endTime: '11:30',
        status: 'ongoing',
        studentsPresent: 32,
        totalStudents: 35,
    },
    {
        id: 'schedule-3',
        subject: 'Web Development',
        section: 'CS-4A',
        room: 'Lab 102',
        startTime: '13:00',
        endTime: '14:30',
        status: 'upcoming',
        totalStudents: 25,
    },
    {
        id: 'schedule-4',
        subject: 'Database Systems',
        section: 'CS-4B',
        room: 'Room 401',
        startTime: '15:00',
        endTime: '16:30',
        status: 'upcoming',
        totalStudents: 28,
    },
];

// ============================================
// TASKS DEMO DATA
// ============================================
export interface TaskItem {
    id: string;
    type: 'grading' | 'deadline' | 'meeting';
    title: string;
    description: string;
    dueDate: string;
    priority: 'high' | 'medium' | 'low';
    count?: number;
}

export const DEMO_TASKS: TaskItem[] = [
    {
        id: 'task-1',
        type: 'grading',
        title: 'Ungraded Submissions',
        description: '15 submissions awaiting review',
        dueDate: 'Due today',
        priority: 'high',
        count: 15,
    },
    {
        id: 'task-2',
        type: 'deadline',
        title: 'Midterm Exam Preparation',
        description: 'Finalize exam questions and rubric',
        dueDate: 'Due in 2 days',
        priority: 'high',
    },
    {
        id: 'task-3',
        type: 'meeting',
        title: 'Department Meeting',
        description: 'Curriculum review and updates',
        dueDate: 'Tomorrow at 2:00 PM',
        priority: 'medium',
    },
    {
        id: 'task-4',
        type: 'grading',
        title: 'Lab Reports Review',
        description: '8 lab reports need feedback',
        dueDate: 'Due in 3 days',
        priority: 'medium',
        count: 8,
    },
];

// ============================================
// ACTIVITY DEMO DATA
// ============================================
export interface ActivityItem {
    id: string;
    type: 'submission' | 'grade' | 'question' | 'attendance';
    student: string;
    course: string;
    action: string;
    timestamp: Date;
    details?: string;
}

export const DEMO_ACTIVITY: ActivityItem[] = [
    {
        id: 'activity-1',
        type: 'submission',
        student: 'Maria Santos',
        course: 'CS-3A',
        action: 'submitted assignment',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        details: 'Programming Assignment #3',
    },
    {
        id: 'activity-2',
        type: 'grade',
        student: 'Juan Dela Cruz',
        course: 'CS-3B',
        action: 'received grade',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        details: 'Midterm Exam: 92/100',
    },
    {
        id: 'activity-3',
        type: 'question',
        student: 'Ana Reyes',
        course: 'CS-4A',
        action: 'asked a question',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        details: 'About the final project requirements',
    },
    {
        id: 'activity-4',
        type: 'submission',
        student: 'Pedro Garcia',
        course: 'CS-4B',
        action: 'submitted late',
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        details: 'Database Design Project',
    },
    {
        id: 'activity-5',
        type: 'attendance',
        student: 'Sofia Martinez',
        course: 'CS-3A',
        action: 'marked present',
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    },
    {
        id: 'activity-6',
        type: 'grade',
        student: 'Carlos Lopez',
        course: 'CS-3B',
        action: 'received grade',
        timestamp: new Date(Date.now() - 90 * 60 * 1000), // 1.5 hours ago
        details: 'Quiz #5: 45/50',
    },
    {
        id: 'activity-7',
        type: 'submission',
        student: 'Isabella Cruz',
        course: 'CS-4A',
        action: 'submitted assignment',
        timestamp: new Date(Date.now() - 120 * 60 * 1000), // 2 hours ago
        details: 'Web Development Project',
    },
    {
        id: 'activity-8',
        type: 'question',
        student: 'Miguel Torres',
        course: 'CS-4B',
        action: 'asked a question',
        timestamp: new Date(Date.now() - 150 * 60 * 1000), // 2.5 hours ago
        details: 'About SQL joins and relationships',
    },
];

// ============================================
// AT-RISK STUDENTS DEMO DATA
// ============================================
export interface AtRiskStudentData {
    id: string;
    name: string;
    section: string;
    subject: string;
    currentGrade: number;
    absences: number;
    issue: string;
    trend: 'declining' | 'stable' | 'improving';
}

export const DEMO_AT_RISK_STUDENTS: AtRiskStudentData[] = [
    {
        id: 'risk-1',
        name: 'Roberto Fernandez',
        section: 'CS-3A',
        subject: 'Introduction to Programming',
        currentGrade: 68,
        absences: 5,
        issue: 'Low grades, multiple absences',
        trend: 'declining',
    },
    {
        id: 'risk-2',
        name: 'Lucia Mendoza',
        section: 'CS-3B',
        subject: 'Data Structures',
        currentGrade: 72,
        absences: 3,
        issue: 'Struggling with recent topics',
        trend: 'stable',
    },
    {
        id: 'risk-3',
        name: 'Diego Ramirez',
        section: 'CS-4A',
        subject: 'Web Development',
        currentGrade: 65,
        absences: 7,
        issue: 'Missing assignments, poor attendance',
        trend: 'declining',
    },
];

// ============================================
// DEMO SUBMISSIONS FOR GRADING MODAL
// ============================================
export interface DemoSubmission {
    id: string;
    task_id: string;
    student_id: string;
    student_name: string;
    student_email: string;
    submitted_at: string;
    status: 'submitted' | 'graded' | 'late' | 'resubmitted' | 'pending';
    score?: number | null;
    feedback?: string | null;
    attachments: Array<{
        name: string;
        type: string;
        url: string;
        size?: number;
    }>;
    is_late: boolean;
    is_flagged: boolean;
    similarity_score?: number;
    grade_history?: Array<{
        score: number;
        feedback: string;
        graded_at: string;
        graded_by: string;
    }>;
    text_content?: string;
}

export interface DemoTask {
    id: string;
    title: string;
    description: string;
    type: 'assignment' | 'quiz' | 'performance' | 'journal';
    points: number;
    due_date: string;
    course_id: string;
    course_name?: string;
    submission_count?: number;
    graded_count?: number;
}

export const DEMO_GRADING_TASKS: DemoTask[] = [
    {
        id: 'demo-task-1',
        title: 'Programming Assignment #3',
        description: 'Implement a binary search tree with insert, delete, and search operations',
        type: 'assignment',
        points: 100,
        due_date: new Date().toISOString(),
        course_id: 'demo-course-1',
        course_name: 'Data Structures - CS-3B',
        submission_count: 12,
        graded_count: 5,
    },
    {
        id: 'demo-task-2',
        title: 'Midterm Exam',
        description: 'Comprehensive exam covering chapters 1-5',
        type: 'quiz',
        points: 100,
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        course_id: 'demo-course-2',
        course_name: 'Introduction to Programming - CS-3A',
        submission_count: 28,
        graded_count: 20,
    },
    {
        id: 'demo-task-3',
        title: 'Web Development Project',
        description: 'Create a responsive website using HTML, CSS, and JavaScript',
        type: 'assignment',
        points: 150,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        course_id: 'demo-course-3',
        course_name: 'Web Development - CS-4A',
        submission_count: 8,
        graded_count: 0,
    },
];

export const DEMO_GRADING_SUBMISSIONS: DemoSubmission[] = [
    {
        id: 'demo-sub-1',
        task_id: 'demo-task-1',
        student_id: 'demo-stu-1',
        student_name: 'Maria Santos',
        student_email: 'maria.santos@university.edu',
        submitted_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'submitted',
        attachments: [
            {
                name: 'binary_search_tree.py',
                type: 'text/x-python',
                url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                size: 15420,
            },
            {
                name: 'test_cases.py',
                type: 'text/x-python',
                url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                size: 8230,
            },
        ],
        is_late: false,
        is_flagged: false,
        similarity_score: 8,
        text_content: 'Implementation of binary search tree with all required operations. Includes comprehensive test cases.',
    },
    {
        id: 'demo-sub-2',
        task_id: 'demo-task-1',
        student_name: 'Juan Dela Cruz',
        student_id: 'demo-stu-2',
        student_email: 'juan.delacruz@university.edu',
        submitted_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        status: 'graded',
        score: 95,
        feedback: 'Excellent implementation! Clean code with proper documentation. Minor optimization suggestion for the delete operation.',
        attachments: [
            {
                name: 'bst_implementation.py',
                type: 'text/x-python',
                url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                size: 18750,
            },
        ],
        is_late: false,
        is_flagged: false,
        similarity_score: 5,
        grade_history: [
            {
                score: 95,
                feedback: 'Excellent implementation!',
                graded_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                graded_by: 'Prof. Rodriguez',
            },
        ],
    },
    {
        id: 'demo-sub-3',
        task_id: 'demo-task-1',
        student_id: 'demo-stu-3',
        student_name: 'Ana Reyes',
        student_email: 'ana.reyes@university.edu',
        submitted_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        status: 'late',
        attachments: [
            {
                name: 'assignment3.py',
                type: 'text/x-python',
                url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                size: 12340,
            },
        ],
        is_late: true,
        is_flagged: true,
        similarity_score: 42,
        text_content: 'Late submission with high similarity score - needs review.',
    },
    {
        id: 'demo-sub-4',
        task_id: 'demo-task-2',
        student_id: 'demo-stu-4',
        student_name: 'Pedro Garcia',
        student_email: 'pedro.garcia@university.edu',
        submitted_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        status: 'graded',
        score: 88,
        feedback: 'Good understanding of core concepts. Some minor errors in the algorithm section.',
        attachments: [
            {
                name: 'midterm_exam.pdf',
                type: 'application/pdf',
                url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                size: 245000,
            },
        ],
        is_late: false,
        is_flagged: false,
        similarity_score: 3,
    },
    {
        id: 'demo-sub-5',
        task_id: 'demo-task-3',
        student_id: 'demo-stu-5',
        student_name: 'Sofia Martinez',
        student_email: 'sofia.martinez@university.edu',
        submitted_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        status: 'submitted',
        attachments: [
            {
                name: 'website_project.zip',
                type: 'application/zip',
                url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                size: 1250000,
            },
            {
                name: 'documentation.pdf',
                type: 'application/pdf',
                url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                size: 156000,
            },
        ],
        is_late: false,
        is_flagged: false,
        similarity_score: 15,
        text_content: 'Complete website project with responsive design and interactive features.',
    },
];

// ============================================
// DEMO STUDENTS FOR INPUT SCORES MODAL
// ============================================
export interface DemoStudent {
    id: string;
    name: string;
    studentId: string;
    section: string;
    email: string;
}

export interface DemoExam {
    id: string;
    title: string;
    maxScore: number;
    date: string;
    courseId: string;
    type: 'prelim' | 'midterm' | 'prefinal' | 'final';
}

export interface DemoExamScore {
    studentId: string;
    studentName?: string;
    score: number | null;
    remarks?: string;
    isAbsent?: boolean;
    isExcused?: boolean;
}

export const DEMO_STUDENTS: DemoStudent[] = [
    { id: 'demo-stu-1', name: 'Maria Santos', studentId: '2024-001234', section: 'CS-3A', email: 'maria.santos@university.edu' },
    { id: 'demo-stu-2', name: 'Juan Dela Cruz', studentId: '2024-001235', section: 'CS-3A', email: 'juan.delacruz@university.edu' },
    { id: 'demo-stu-3', name: 'Ana Reyes', studentId: '2024-001236', section: 'CS-3A', email: 'ana.reyes@university.edu' },
    { id: 'demo-stu-4', name: 'Pedro Garcia', studentId: '2024-001237', section: 'CS-3A', email: 'pedro.garcia@university.edu' },
    { id: 'demo-stu-5', name: 'Sofia Martinez', studentId: '2024-001238', section: 'CS-3A', email: 'sofia.martinez@university.edu' },
    { id: 'demo-stu-6', name: 'Carlos Lopez', studentId: '2024-001239', section: 'CS-3A', email: 'carlos.lopez@university.edu' },
    { id: 'demo-stu-7', name: 'Isabella Cruz', studentId: '2024-001240', section: 'CS-3A', email: 'isabella.cruz@university.edu' },
    { id: 'demo-stu-8', name: 'Miguel Torres', studentId: '2024-001241', section: 'CS-3A', email: 'miguel.torres@university.edu' },
    { id: 'demo-stu-9', name: 'Lucia Mendoza', studentId: '2024-001242', section: 'CS-3A', email: 'lucia.mendoza@university.edu' },
    { id: 'demo-stu-10', name: 'Diego Ramirez', studentId: '2024-001243', section: 'CS-3A', email: 'diego.ramirez@university.edu' },
];

export const DEMO_EXAMS: DemoExam[] = [
    {
        id: 'demo-exam-1',
        title: 'Prelim Exam',
        maxScore: 100,
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        courseId: 'demo-course-1',
        type: 'prelim',
    },
    {
        id: 'demo-exam-2',
        title: 'Midterm Exam',
        maxScore: 100,
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        courseId: 'demo-course-1',
        type: 'midterm',
    },
    {
        id: 'demo-exam-3',
        title: 'Pre-Final Exam',
        maxScore: 100,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        courseId: 'demo-course-1',
        type: 'prefinal',
    },
    {
        id: 'demo-exam-4',
        title: 'Final Exam',
        maxScore: 100,
        date: new Date().toISOString(),
        courseId: 'demo-course-1',
        type: 'final',
    },
];

export const DEMO_EXAM_SCORES: Record<string, DemoExamScore[]> = {
    'demo-exam-1': [
        { studentId: 'demo-stu-1', studentName: 'Maria Santos', score: 92 },
        { studentId: 'demo-stu-2', studentName: 'Juan Dela Cruz', score: 88 },
        { studentId: 'demo-stu-3', studentName: 'Ana Reyes', score: 95 },
        { studentId: 'demo-stu-4', studentName: 'Pedro Garcia', score: 78 },
        { studentId: 'demo-stu-5', studentName: 'Sofia Martinez', score: 85 },
        { studentId: 'demo-stu-6', studentName: 'Carlos Lopez', score: 90 },
        { studentId: 'demo-stu-7', studentName: 'Isabella Cruz', score: 82 },
        { studentId: 'demo-stu-8', studentName: 'Miguel Torres', score: 76 },
        { studentId: 'demo-stu-9', studentName: 'Lucia Mendoza', score: 88 },
        { studentId: 'demo-stu-10', studentName: 'Diego Ramirez', score: 72 },
    ],
    'demo-exam-2': [
        { studentId: 'demo-stu-1', studentName: 'Maria Santos', score: 95 },
        { studentId: 'demo-stu-2', studentName: 'Juan Dela Cruz', score: 90 },
        { studentId: 'demo-stu-3', studentName: 'Ana Reyes', score: 92 },
        { studentId: 'demo-stu-4', studentName: 'Pedro Garcia', score: 80 },
        { studentId: 'demo-stu-5', studentName: 'Sofia Martinez', score: 88 },
        { studentId: 'demo-stu-6', studentName: 'Carlos Lopez', score: 85 },
        { studentId: 'demo-stu-7', studentName: 'Isabella Cruz', score: 87 },
        { studentId: 'demo-stu-8', studentName: 'Miguel Torres', score: 75 },
        { studentId: 'demo-stu-9', studentName: 'Lucia Mendoza', score: 82 },
        { studentId: 'demo-stu-10', studentName: 'Diego Ramirez', score: 70 },
    ],
    'demo-exam-3': [
        { studentId: 'demo-stu-1', studentName: 'Maria Santos', score: null },
        { studentId: 'demo-stu-2', studentName: 'Juan Dela Cruz', score: null },
        { studentId: 'demo-stu-3', studentName: 'Ana Reyes', score: null },
        { studentId: 'demo-stu-4', studentName: 'Pedro Garcia', score: null },
        { studentId: 'demo-stu-5', studentName: 'Sofia Martinez', score: null },
        { studentId: 'demo-stu-6', studentName: 'Carlos Lopez', score: null },
        { studentId: 'demo-stu-7', studentName: 'Isabella Cruz', score: null },
        { studentId: 'demo-stu-8', studentName: 'Miguel Torres', score: null },
        { studentId: 'demo-stu-9', studentName: 'Lucia Mendoza', score: null },
        { studentId: 'demo-stu-10', studentName: 'Diego Ramirez', score: null },
    ],
};

// ============================================
// DEMO COURSES
// ============================================
export interface DemoCourse {
    id: string;
    title: string;
    code: string;
    section: string;
}

export const DEMO_COURSES: DemoCourse[] = [
    { id: 'demo-course-1', title: 'Introduction to Programming', code: 'CS101', section: 'CS-3A' },
    { id: 'demo-course-2', title: 'Data Structures', code: 'CS201', section: 'CS-3B' },
    { id: 'demo-course-3', title: 'Web Development', code: 'CS301', section: 'CS-4A' },
    { id: 'demo-course-4', title: 'Database Systems', code: 'CS401', section: 'CS-4B' },
];
