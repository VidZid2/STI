/**
 * Teacher Dashboard Demo Data Service
 * Provides realistic demo data for first-time teachers to see a populated dashboard
 * Demo data is temporary and stored only in localStorage (not synced to database)
 */

const DEMO_MODE_KEY = 'teacher-demo-mode-active';
const DEMO_SCHEDULE_KEY = 'teacher-demo-schedule';
const DEMO_TASKS_KEY = 'teacher-demo-tasks';
const DEMO_ACTIVITY_KEY = 'teacher-demo-activity';
const DEMO_SUBMISSIONS_KEY = 'teacher-demo-submissions';
const DEMO_STUDENTS_KEY = 'teacher-demo-students';
const DEMO_EXAMS_KEY = 'teacher-demo-exams';

// ============================================
// DEMO DATA TYPES
// ============================================
export interface DemoScheduleItem {
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

export interface DemoTaskItem {
    id: string;
    type: 'grading' | 'deadline' | 'meeting';
    title: string;
    description: string;
    dueDate: string;
    priority: 'high' | 'medium' | 'low';
    count?: number;
}

export interface DemoActivityItem {
    id: string;
    type: 'submission' | 'grade' | 'attendance' | 'announcement';
    student: string;
    course: string;
    action: string;
    timestamp: Date;
    details?: string;
}

export interface DemoSubmission {
    id: string;
    student_id: string;
    student_name: string;
    section: string;
    assignment_title: string;
    course_code: string;
    submitted_at: string;
    status: 'pending' | 'submitted' | 'graded' | 'late';
    score: number | null;
    max_score: number;
    is_late: boolean;
}

export interface DemoStudent {
    id: string;
    student_id: string;
    full_name: string;
    section: string;
    email: string;
    program: string;
}

export interface DemoExam {
    id: string;
    title: string;
    course_id: string;
    course_code: string;
    max_score: number;
    exam_date: string;
    exam_type: 'prelim' | 'midterm' | 'prefinal' | 'final';
}

export interface DemoExamScore {
    student_id: string;
    student_name: string;
    score: number | null;
    is_absent: boolean;
}

// ============================================
// DEMO DATA GENERATORS
// ============================================

const generateDemoSchedule = (): DemoScheduleItem[] => {
    const now = new Date();
    const currentHour = now.getHours();
    
    return [
        {
            id: 'demo-sched-1',
            subject: 'Computer Programming 1',
            section: 'CS-3A',
            room: 'Lab 201',
            startTime: '08:00 AM',
            endTime: '10:00 AM',
            status: currentHour >= 10 ? 'completed' : currentHour >= 8 ? 'ongoing' : 'upcoming',
            studentsPresent: 28,
            totalStudents: 30,
        },
        {
            id: 'demo-sched-2',
            subject: 'Data Structures',
            section: 'CS-3B',
            room: 'Lab 202',
            startTime: '10:30 AM',
            endTime: '12:30 PM',
            status: currentHour >= 12.5 ? 'completed' : currentHour >= 10.5 ? 'ongoing' : 'upcoming',
            studentsPresent: 25,
            totalStudents: 28,
        },
        {
            id: 'demo-sched-3',
            subject: 'Web Development',
            section: 'IT-2A',
            room: 'Lab 203',
            startTime: '01:00 PM',
            endTime: '03:00 PM',
            status: currentHour >= 15 ? 'completed' : currentHour >= 13 ? 'ongoing' : 'upcoming',
            studentsPresent: 30,
            totalStudents: 32,
        },
        {
            id: 'demo-sched-4',
            subject: 'Database Systems',
            section: 'IT-3A',
            room: 'Lab 204',
            startTime: '03:30 PM',
            endTime: '05:30 PM',
            status: currentHour >= 17.5 ? 'completed' : currentHour >= 15.5 ? 'ongoing' : 'upcoming',
            studentsPresent: 22,
            totalStudents: 25,
        },
    ];
};

const generateDemoTasks = (): DemoTaskItem[] => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return [
        {
            id: 'demo-task-1',
            type: 'grading',
            title: 'Ungraded Submissions',
            description: '12 programming assignments awaiting review',
            dueDate: 'Due today',
            priority: 'high',
            count: 12,
        },
        {
            id: 'demo-task-2',
            type: 'deadline',
            title: 'Midterm Exam Preparation',
            description: 'Prepare exam questions for CS-3A',
            dueDate: tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            priority: 'high',
        },
        {
            id: 'demo-task-3',
            type: 'meeting',
            title: 'Department Meeting',
            description: 'Curriculum review and planning',
            dueDate: nextWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            priority: 'medium',
        },
    ];
};

const generateDemoActivity = (): DemoActivityItem[] => {
    const now = new Date();
    
    return [
        {
            id: 'demo-act-1',
            type: 'submission',
            student: 'Maria Santos',
            course: 'Computer Programming 1',
            action: 'submitted Assignment 3',
            timestamp: new Date(now.getTime() - 5 * 60 * 1000), // 5 min ago
            details: 'Loop Exercises',
        },
        {
            id: 'demo-act-2',
            type: 'submission',
            student: 'Juan Dela Cruz',
            course: 'Data Structures',
            action: 'submitted Quiz 2',
            timestamp: new Date(now.getTime() - 15 * 60 * 1000), // 15 min ago
            details: 'Arrays and Linked Lists',
        },
        {
            id: 'demo-act-3',
            type: 'grade',
            student: 'Ana Reyes',
            course: 'Web Development',
            action: 'received grade',
            timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 min ago
            details: '95/100 on Project 1',
        },
        {
            id: 'demo-act-4',
            type: 'submission',
            student: 'Pedro Garcia',
            course: 'Database Systems',
            action: 'submitted Performance Task',
            timestamp: new Date(now.getTime() - 45 * 60 * 1000), // 45 min ago
            details: 'SQL Query Exercises',
        },
        {
            id: 'demo-act-5',
            type: 'attendance',
            student: 'CS-3A Section',
            course: 'Computer Programming 1',
            action: 'attendance recorded',
            timestamp: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
            details: '28/30 students present',
        },
        {
            id: 'demo-act-6',
            type: 'submission',
            student: 'Sofia Martinez',
            course: 'Web Development',
            action: 'submitted Assignment 2',
            timestamp: new Date(now.getTime() - 90 * 60 * 1000), // 1.5 hours ago
            details: 'CSS Styling Project',
        },
        {
            id: 'demo-act-7',
            type: 'grade',
            student: 'Carlos Ramos',
            course: 'Data Structures',
            action: 'received grade',
            timestamp: new Date(now.getTime() - 120 * 60 * 1000), // 2 hours ago
            details: '88/100 on Quiz 1',
        },
        {
            id: 'demo-act-8',
            type: 'submission',
            student: 'Lisa Fernandez',
            course: 'Computer Programming 1',
            action: 'submitted Quiz 3',
            timestamp: new Date(now.getTime() - 150 * 60 * 1000), // 2.5 hours ago
            details: 'Functions and Methods',
        },
    ];
};

const generateDemoSubmissions = (): DemoSubmission[] => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    
    return [
        {
            id: 'demo-sub-1',
            student_id: '2024-001234',
            student_name: 'Maria Santos',
            section: 'CS-3A',
            assignment_title: 'Assignment 3: Loop Exercises',
            course_code: 'CP1',
            submitted_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
            status: 'submitted',
            score: null,
            max_score: 100,
            is_late: false,
        },
        {
            id: 'demo-sub-2',
            student_id: '2024-001235',
            student_name: 'Juan Dela Cruz',
            section: 'CS-3B',
            assignment_title: 'Quiz 2: Arrays and Linked Lists',
            course_code: 'DS',
            submitted_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
            status: 'submitted',
            score: null,
            max_score: 50,
            is_late: false,
        },
        {
            id: 'demo-sub-3',
            student_id: '2024-001236',
            student_name: 'Ana Reyes',
            section: 'IT-2A',
            assignment_title: 'Project 1: Portfolio Website',
            course_code: 'WD',
            submitted_at: yesterday.toISOString(),
            status: 'graded',
            score: 95,
            max_score: 100,
            is_late: false,
        },
        {
            id: 'demo-sub-4',
            student_id: '2024-001237',
            student_name: 'Pedro Garcia',
            section: 'IT-3A',
            assignment_title: 'Performance Task: SQL Queries',
            course_code: 'DBS',
            submitted_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
            status: 'submitted',
            score: null,
            max_score: 100,
            is_late: false,
        },
        {
            id: 'demo-sub-5',
            student_id: '2024-001238',
            student_name: 'Sofia Martinez',
            section: 'IT-2A',
            assignment_title: 'Assignment 2: CSS Styling',
            course_code: 'WD',
            submitted_at: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
            status: 'submitted',
            score: null,
            max_score: 100,
            is_late: false,
        },
        {
            id: 'demo-sub-6',
            student_id: '2024-001239',
            student_name: 'Carlos Ramos',
            section: 'CS-3B',
            assignment_title: 'Quiz 1: Basic Data Structures',
            course_code: 'DS',
            submitted_at: twoDaysAgo.toISOString(),
            status: 'graded',
            score: 88,
            max_score: 100,
            is_late: false,
        },
        {
            id: 'demo-sub-7',
            student_id: '2024-001240',
            student_name: 'Lisa Fernandez',
            section: 'CS-3A',
            assignment_title: 'Quiz 3: Functions and Methods',
            course_code: 'CP1',
            submitted_at: new Date(now.getTime() - 150 * 60 * 1000).toISOString(),
            status: 'submitted',
            score: null,
            max_score: 50,
            is_late: false,
        },
        {
            id: 'demo-sub-8',
            student_id: '2024-001241',
            student_name: 'Miguel Torres',
            section: 'CS-3A',
            assignment_title: 'Assignment 2: Variables Practice',
            course_code: 'CP1',
            submitted_at: twoDaysAgo.toISOString(),
            status: 'late',
            score: null,
            max_score: 100,
            is_late: true,
        },
        {
            id: 'demo-sub-9',
            student_id: '2024-001242',
            student_name: 'Elena Cruz',
            section: 'IT-2A',
            assignment_title: 'Quiz 1: HTML Basics',
            course_code: 'WD',
            submitted_at: twoDaysAgo.toISOString(),
            status: 'graded',
            score: 92,
            max_score: 100,
            is_late: false,
        },
        {
            id: 'demo-sub-10',
            student_id: '2024-001243',
            student_name: 'Roberto Diaz',
            section: 'IT-3A',
            assignment_title: 'Assignment 1: Database Design',
            course_code: 'DBS',
            submitted_at: yesterday.toISOString(),
            status: 'graded',
            score: 90,
            max_score: 100,
            is_late: false,
        },
        {
            id: 'demo-sub-11',
            student_id: '2024-001244',
            student_name: 'Carmen Lopez',
            section: 'CS-3B',
            assignment_title: 'Performance Task: Stack Implementation',
            course_code: 'DS',
            submitted_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
            status: 'submitted',
            score: null,
            max_score: 100,
            is_late: false,
        },
        {
            id: 'demo-sub-12',
            student_id: '2024-001245',
            student_name: 'Diego Morales',
            section: 'CS-3A',
            assignment_title: 'Assignment 3: Loop Exercises',
            course_code: 'CP1',
            submitted_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
            status: 'submitted',
            score: null,
            max_score: 100,
            is_late: false,
        },
    ];
};

const generateDemoStudents = (): DemoStudent[] => {
    return [
        { id: '1', student_id: '2024-001234', full_name: 'Maria Santos', section: 'CS-3A', email: 'maria.santos@university.edu', program: 'BS Computer Science' },
        { id: '2', student_id: '2024-001235', full_name: 'Juan Dela Cruz', section: 'CS-3B', email: 'juan.delacruz@university.edu', program: 'BS Computer Science' },
        { id: '3', student_id: '2024-001236', full_name: 'Ana Reyes', section: 'IT-2A', email: 'ana.reyes@university.edu', program: 'BS Information Technology' },
        { id: '4', student_id: '2024-001237', full_name: 'Pedro Garcia', section: 'IT-3A', email: 'pedro.garcia@university.edu', program: 'BS Information Technology' },
        { id: '5', student_id: '2024-001238', full_name: 'Sofia Martinez', section: 'IT-2A', email: 'sofia.martinez@university.edu', program: 'BS Information Technology' },
        { id: '6', student_id: '2024-001239', full_name: 'Carlos Ramos', section: 'CS-3B', email: 'carlos.ramos@university.edu', program: 'BS Computer Science' },
        { id: '7', student_id: '2024-001240', full_name: 'Lisa Fernandez', section: 'CS-3A', email: 'lisa.fernandez@university.edu', program: 'BS Computer Science' },
        { id: '8', student_id: '2024-001241', full_name: 'Miguel Torres', section: 'CS-3A', email: 'miguel.torres@university.edu', program: 'BS Computer Science' },
        { id: '9', student_id: '2024-001242', full_name: 'Elena Cruz', section: 'IT-2A', email: 'elena.cruz@university.edu', program: 'BS Information Technology' },
        { id: '10', student_id: '2024-001243', full_name: 'Roberto Diaz', section: 'IT-3A', email: 'roberto.diaz@university.edu', program: 'BS Information Technology' },
        { id: '11', student_id: '2024-001244', full_name: 'Carmen Lopez', section: 'CS-3B', email: 'carmen.lopez@university.edu', program: 'BS Computer Science' },
        { id: '12', student_id: '2024-001245', full_name: 'Diego Morales', section: 'CS-3A', email: 'diego.morales@university.edu', program: 'BS Computer Science' },
        { id: '13', student_id: '2024-001246', full_name: 'Isabella Gomez', section: 'IT-2A', email: 'isabella.gomez@university.edu', program: 'BS Information Technology' },
        { id: '14', student_id: '2024-001247', full_name: 'Rafael Silva', section: 'CS-3B', email: 'rafael.silva@university.edu', program: 'BS Computer Science' },
        { id: '15', student_id: '2024-001248', full_name: 'Lucia Mendoza', section: 'IT-3A', email: 'lucia.mendoza@university.edu', program: 'BS Information Technology' },
    ];
};

const generateDemoExams = (): DemoExam[] => {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    return [
        {
            id: 'demo-exam-1',
            title: 'Prelim Exam',
            course_id: 'cp1',
            course_code: 'CP1',
            max_score: 100,
            exam_date: twoWeeksAgo.toISOString(),
            exam_type: 'prelim',
        },
        {
            id: 'demo-exam-2',
            title: 'Midterm Exam',
            course_id: 'cp1',
            course_code: 'CP1',
            max_score: 100,
            exam_date: lastWeek.toISOString(),
            exam_type: 'midterm',
        },
        {
            id: 'demo-exam-3',
            title: 'Prelim Exam',
            course_id: 'ds',
            course_code: 'DS',
            max_score: 100,
            exam_date: twoWeeksAgo.toISOString(),
            exam_type: 'prelim',
        },
    ];
};

const generateDemoExamScores = (examId: string): DemoExamScore[] => {
    const students = generateDemoStudents().slice(0, 10); // First 10 students
    
    return students.map(student => ({
        student_id: student.student_id,
        student_name: student.full_name,
        score: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
        is_absent: false,
    }));
};

// ============================================
// PUBLIC API
// ============================================

/**
 * Load demo data for teacher dashboard
 * This populates the dashboard with realistic sample data
 */
export const loadTeacherDemoData = (): void => {
    console.log('[Teacher Demo] Loading demo data...');
    
    // Set demo mode flag
    localStorage.setItem(DEMO_MODE_KEY, 'true');
    
    // Generate and save demo data
    localStorage.setItem(DEMO_SCHEDULE_KEY, JSON.stringify(generateDemoSchedule()));
    localStorage.setItem(DEMO_TASKS_KEY, JSON.stringify(generateDemoTasks()));
    localStorage.setItem(DEMO_ACTIVITY_KEY, JSON.stringify(generateDemoActivity()));
    localStorage.setItem(DEMO_SUBMISSIONS_KEY, JSON.stringify(generateDemoSubmissions()));
    localStorage.setItem(DEMO_STUDENTS_KEY, JSON.stringify(generateDemoStudents()));
    localStorage.setItem(DEMO_EXAMS_KEY, JSON.stringify(generateDemoExams()));
    
    console.log('[Teacher Demo] Demo data loaded successfully');
};

/**
 * Check if demo mode is active
 */
export const isTeacherDemoModeActive = (): boolean => {
    return localStorage.getItem(DEMO_MODE_KEY) === 'true';
};

/**
 * Clear demo data and exit demo mode
 */
export const clearTeacherDemoData = (): void => {
    console.log('[Teacher Demo] Clearing demo data...');
    
    localStorage.removeItem(DEMO_MODE_KEY);
    localStorage.removeItem(DEMO_SCHEDULE_KEY);
    localStorage.removeItem(DEMO_TASKS_KEY);
    localStorage.removeItem(DEMO_ACTIVITY_KEY);
    localStorage.removeItem(DEMO_SUBMISSIONS_KEY);
    localStorage.removeItem(DEMO_STUDENTS_KEY);
    localStorage.removeItem(DEMO_EXAMS_KEY);
    
    console.log('[Teacher Demo] Demo data cleared');
};

/**
 * Get demo schedule data
 */
export const getDemoSchedule = (): DemoScheduleItem[] => {
    try {
        const data = localStorage.getItem(DEMO_SCHEDULE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('[Teacher Demo] Failed to load demo schedule:', e);
        return [];
    }
};

/**
 * Get demo tasks data
 */
export const getDemoTasks = (): DemoTaskItem[] => {
    try {
        const data = localStorage.getItem(DEMO_TASKS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('[Teacher Demo] Failed to load demo tasks:', e);
        return [];
    }
};

/**
 * Get demo activity data
 */
export const getDemoActivity = (): DemoActivityItem[] => {
    try {
        const data = localStorage.getItem(DEMO_ACTIVITY_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('[Teacher Demo] Failed to load demo activity:', e);
        return [];
    }
};

/**
 * Get demo submissions data
 */
export const getDemoSubmissions = (): DemoSubmission[] => {
    try {
        const data = localStorage.getItem(DEMO_SUBMISSIONS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('[Teacher Demo] Failed to load demo submissions:', e);
        return [];
    }
};

/**
 * Get demo students data
 */
export const getDemoStudents = (): DemoStudent[] => {
    try {
        const data = localStorage.getItem(DEMO_STUDENTS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('[Teacher Demo] Failed to load demo students:', e);
        return [];
    }
};

/**
 * Get demo exams data
 */
export const getDemoExams = (): DemoExam[] => {
    try {
        const data = localStorage.getItem(DEMO_EXAMS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('[Teacher Demo] Failed to load demo exams:', e);
        return [];
    }
};

/**
 * Get demo exam scores for a specific exam
 */
export const getDemoExamScores = (examId: string): DemoExamScore[] => {
    return generateDemoExamScores(examId);
};
