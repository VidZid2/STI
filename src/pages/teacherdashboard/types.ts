/**
 * TeacherDashboard Types
 * Phase 1: Centralized type definitions for type safety
 */

// ============================================
// CORE TYPES
// ============================================

export interface TeacherStats {
    totalStudents: number;
    totalCourses: number;
    pendingSubmissions: number;
    averageGrade: number;
}

export interface TeacherUser {
    id: string;
    email: string;
    first_name: string;
    full_name: string;
    role: 'teacher' | 'student' | 'admin';
    avatar_url?: string;
}

// ============================================
// COMPONENT PROP TYPES
// ============================================

export interface StatCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
    index: number;
}

export interface QuickActionButtonProps {
    label: string;
    icon: React.ReactNode;
    color: string;
    onClick: () => void;
    index: number;
    isPrimary?: boolean;
    disabled?: boolean;
    ariaLabel?: string;
}

export interface ActivityItemProps {
    action: string;
    student: string;
    course: string;
    time: string;
    color: string;
    icon: React.ReactNode;
    index: number;
}

// ============================================
// STATE TYPES
// ============================================

export interface DashboardState {
    isLoading: boolean;
    error: string | null;
    user: TeacherUser | null;
}

export interface ModalState {
    isCreateAssignmentOpen: boolean;
    isStudentListOpen: boolean;
    isGradeSubmissionsOpen: boolean;
    isInputScoresOpen: boolean;
    isAtRiskStudentsOpen: boolean;
    isActivityModalOpen: boolean;
}

// ============================================
// ACTION TYPES (for future reducer)
// ============================================

export type DashboardAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_USER'; payload: TeacherUser | null }
    | { type: 'SET_STATS'; payload: TeacherStats };
