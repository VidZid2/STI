/**
 * TeacherDashboard Constants
 * Phase 1: Design tokens and shared constants for consistent styling
 */

// ============================================
// PHASE 1: COLOR PALETTE & DESIGN TOKENS
// ============================================

export const COLORS = {
    // Primary colors
    primary: 'var(--accent-primary)',
    primaryLight: 'var(--accent-bg)',
    primaryBorder: 'var(--ring-focus)',

    // Semantic colors — use CSS variables so themes can override
    success: 'var(--color-success)',
    successLight: 'var(--color-success-bg)',
    successBorder: 'rgba(16, 185, 129, 0.2)',

    warning: 'var(--color-warning)',
    warningLight: 'var(--color-warning-bg)',
    warningBorder: 'rgba(245, 158, 11, 0.2)',

    danger: 'var(--color-danger)',
    dangerLight: 'var(--color-danger-bg)',
    dangerBorder: 'rgba(239, 68, 68, 0.2)',

    purple: 'var(--color-purple)',
    purpleLight: 'var(--color-purple-bg)',
    purpleBorder: 'rgba(139, 92, 246, 0.2)',

    // Text colors
    textPrimary: 'var(--text-primary)',
    textSecondary: 'var(--text-secondary)',
    textMuted: 'var(--text-muted)',
    textLight: 'var(--text-muted)',

    // Background colors
    background: 'var(--bg-canvas)',
    surface: 'var(--bg-surface)',
    surfaceHover: 'rgba(0, 0, 0, 0.02)',

    // Border colors
    border: 'var(--border-subtle)',
    borderLight: 'rgba(0, 0, 0, 0.04)',
    borderHover: 'rgba(0, 0, 0, 0.08)',
} as const;

// ============================================
// PHASE 2: SPACING & SIZING
// ============================================

export const SPACING = {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    xxxl: '32px',
} as const;

// ============================================
// RESPONSIVE BREAKPOINTS
// ============================================

export const BREAKPOINTS = {
    xs: 480,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
} as const;

export const BORDER_RADIUS = {
    sm: '6px',
    md: '8px',
    lg: '10px',
    xl: '12px',
    xxl: '14px',
    xxxl: '16px',
    full: '20px',
} as const;

// ============================================
// PHASE 3: TYPOGRAPHY
// ============================================

export const FONT_SIZE = {
    xs: '11px',
    sm: '12px',
    md: '13px',
    base: '14px',
    lg: '15px',
    xl: '16px',
    xxl: '18px',
    xxxl: '28px',
} as const;

export const FONT_WEIGHT = {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
} as const;

// ============================================
// PHASE 4: ANIMATION CONSTANTS
// ============================================

export const ANIMATION = {
    duration: {
        fast: 0.15,
        normal: 0.2,
        slow: 0.4,
    },
    ease: {
        smooth: [0.22, 1, 0.36, 1],
        spring: { type: 'spring', stiffness: 400, damping: 25 },
    },
} as const;

// ============================================
// PHASE 5: RECENT ACTIVITY DATA (Mock)
// ============================================

export interface ActivityItem {
    action: string;
    student: string;
    course: string;
    time: string;
    color: string;
    iconType: 'submission' | 'deadline' | 'quiz' | 'enrollment';
}

export const RECENT_ACTIVITY: ActivityItem[] = [
    {
        action: 'New submission',
        student: 'Josiah De Asis',
        course: 'CP1',
        time: '2 hours ago',
        color: '#3b82f6',
        iconType: 'submission',
    },
    {
        action: 'Assignment due',
        student: 'BSIT101A',
        course: 'ITC',
        time: '5 hours ago',
        color: '#f59e0b',
        iconType: 'deadline',
    },
    {
        action: 'Quiz completed',
        student: 'Divine Acorda',
        course: 'CP1',
        time: '1 day ago',
        color: '#10b981',
        iconType: 'quiz',
    },
    {
        action: 'New enrollment',
        student: 'Blake Baldivas',
        course: 'PURCOM',
        time: '2 days ago',
        color: '#8b5cf6',
        iconType: 'enrollment',
    },
];

// ============================================
// TODAY'S SCHEDULE (Mock Data)
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

export const TODAYS_SCHEDULE: ScheduleItem[] = [
    { id: '1', subject: 'Computer Programming 1', section: 'BSIT101A', room: 'CL1', startTime: '7:30 AM', endTime: '9:00 AM', status: 'completed', studentsPresent: 38, totalStudents: 40 },
    { id: '2', subject: 'Information Technology Concepts', section: 'BSIT101B', room: 'CL2', startTime: '9:30 AM', endTime: '11:00 AM', status: 'ongoing', studentsPresent: 35, totalStudents: 42 },
    { id: '3', subject: 'Purposive Communication', section: 'BSIT102A', room: 'R301', startTime: '1:00 PM', endTime: '2:30 PM', status: 'upcoming' },
    { id: '4', subject: 'Computer Programming 1', section: 'BSIT102B', room: 'CL3', startTime: '3:00 PM', endTime: '4:30 PM', status: 'upcoming' },
];

// ============================================
// URGENT TASKS (Mock Data)
// ============================================

export interface UrgentTask {
    id: string;
    type: 'deadline' | 'grading' | 'meeting' | 'submission';
    title: string;
    description: string;
    dueDate: string;
    priority: 'high' | 'medium' | 'low';
    count?: number;
}

export const URGENT_TASKS: UrgentTask[] = [
    { id: '1', type: 'grading', title: 'Ungraded Submissions', description: '15 submissions awaiting review', dueDate: 'Due today', priority: 'high', count: 15 },
    { id: '2', type: 'deadline', title: 'Midterm Grades Encoding', description: 'Submit to registrar', dueDate: 'Due in 2 days', priority: 'high' },
    { id: '3', type: 'meeting', title: 'Faculty Meeting', description: 'Academic Building Room 201', dueDate: 'Tomorrow 2:00 PM', priority: 'medium' },
];

// ============================================
// AT-RISK STUDENTS (Mock Data)
// ============================================

export interface AtRiskStudent {
    id: string;
    name: string;
    section: string;
    subject: string;
    issue: string;
    currentGrade: number;
    absences: number;
    trend: 'declining' | 'stable' | 'improving';
}

export const AT_RISK_STUDENTS: AtRiskStudent[] = [
    { id: '1', name: 'Juan Dela Cruz', section: 'BSIT101A', subject: 'CP1', issue: 'Low quiz scores', currentGrade: 68, absences: 5, trend: 'declining' },
    { id: '2', name: 'Maria Santos', section: 'BSIT101B', subject: 'ITC', issue: 'Excessive absences', currentGrade: 72, absences: 8, trend: 'declining' },
    { id: '3', name: 'Pedro Reyes', section: 'BSIT102A', subject: 'PURCOM', issue: 'Missing assignments', currentGrade: 70, absences: 3, trend: 'stable' },
];

// ============================================
// PHASE 6: QUICK ACTION DEFINITIONS
// ============================================

export interface QuickAction {
    id: string;
    label: string;
    color: string;
    iconType: 'assignment' | 'grade' | 'students' | 'exam' | 'alert' | 'qr';
}

export const QUICK_ACTIONS: QuickAction[] = [
    { id: 'create-assignment', label: 'Create Assignment', color: '#3b82f6', iconType: 'assignment' },
    { id: 'grade-submissions', label: 'Grade Submissions', color: '#f59e0b', iconType: 'grade' },
    { id: 'view-students', label: 'View Student List', color: '#10b981', iconType: 'students' },
    { id: 'report-admin', label: 'Report to admin', color: '#ef4444', iconType: 'alert' },
];

// ============================================
// PHASE 7: STAT CARD DEFINITIONS
// ============================================

export interface StatDefinition {
    id: string;
    title: string;
    subtitle: string;
    color: string;
    iconType: 'students' | 'courses' | 'pending' | 'average';
}

export const STAT_DEFINITIONS: StatDefinition[] = [
    { id: 'students', title: 'Total Students', subtitle: 'Across all sections', color: '#3b82f6', iconType: 'students' },
    { id: 'courses', title: 'Active Courses', subtitle: 'This semester', color: '#10b981', iconType: 'courses' },
    { id: 'pending', title: 'Pending Reviews', subtitle: 'Submissions to grade', color: '#f59e0b', iconType: 'pending' },
    { id: 'average', title: 'Class Average', subtitle: 'Overall performance', color: '#8b5cf6', iconType: 'average' },
];
