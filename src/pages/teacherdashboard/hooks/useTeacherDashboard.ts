/**
 * useTeacherDashboard Hook
 * Phase 2 & 3: Custom hook to manage all dashboard state and logic
 * 
 * Phase 3 Updates:
 * - Integrated teacherService for real data fetching
 * - Added activity state management
 * - Improved error handling
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logoutUser } from '../../../services/authService';
import { teacherService, type TeacherStats, type ActivityItem } from '../../../services/teacherService';
import type { ModalState } from '../types';

// ============================================
// TYPES
// ============================================
interface UseTeacherDashboardReturn {
    // State
    isLoading: boolean;
    error: string | null;
    user: ReturnType<typeof getCurrentUser>;
    stats: TeacherStats;
    activity: ActivityItem[];
    modals: ModalState;

    // Actions
    initializeDashboard: () => Promise<void>;
    refreshStats: () => Promise<void>;
    refreshActivity: () => Promise<void>;
    handleLogout: () => void;
    openModal: (modalName: keyof ModalState) => void;
    closeModal: (modalName: keyof ModalState) => void;
    handleQuickAction: (actionId: string) => void;
    getStatValue: (statId: string) => string | number;
}

// ============================================
// DEFAULT VALUES
// ============================================
const DEFAULT_STATS: TeacherStats = {
    totalStudents: 0,
    totalCourses: 0,
    pendingSubmissions: 0,
    averageGrade: 0,
};

const DEFAULT_MODALS: ModalState = {
    isCreateAssignmentOpen: false,
    isStudentListOpen: false,
    isGradeSubmissionsOpen: false,
    isInputScoresOpen: false,
    isAtRiskStudentsOpen: false,
    isActivityModalOpen: false,
    isReportAdminOpen: false,
    isQRAttendanceOpen: false,
};

// ============================================
// HOOK IMPLEMENTATION
// ============================================
export const useTeacherDashboard = (): UseTeacherDashboardReturn => {
    const navigate = useNavigate();

    // Core state
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
    const [stats, setStats] = useState<TeacherStats>(DEFAULT_STATS);
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [modals, setModals] = useState<ModalState>(DEFAULT_MODALS);

    // ============================================
    // DATA FETCHING
    // ============================================
    const refreshStats = useCallback(async () => {
        try {
            const teacherStats = await teacherService.getStats();
            setStats(teacherStats);
        } catch {
            // Stats failure is non-critical — dashboard still renders with zeros
        }
    }, []);

    const refreshActivity = useCallback(async () => {
        try {
            const activityData = await teacherService.getActivity(10);
            setActivity(activityData);
        } catch {
            // Activity failure is non-critical — panel shows empty state
        }
    }, []);

    // ============================================
    // INITIALIZATION
    // ============================================
    const initializeDashboard = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const currentUser = getCurrentUser();

            // Auth checks
            if (!currentUser) {
                navigate('/student-login');
                return;
            }

            if (currentUser.role !== 'teacher') {
                navigate('/dashboard');
                return;
            }

            setUser(currentUser);

            // Fetch real data from service
            await Promise.all([
                refreshStats(),
                refreshActivity(),
            ]);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [navigate, refreshStats, refreshActivity]);

    // ============================================
    // EFFECTS
    // ============================================
    useEffect(() => {
        initializeDashboard();
    }, [initializeDashboard]);

    // ============================================
    // TEACHER-SCOPED THEME MANAGEMENT
    // Apply the logged-in teacher's theme preferences on mount,
    // and clean up on unmount so the student dashboard is unaffected.
    // ============================================
    useEffect(() => {
        if (!user) return;

        const userId = user.student_id || user.id || 'default';

        // Apply this teacher's dark mode preference
        const savedTheme = localStorage.getItem(`theme_${userId}`);
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark-mode');
        }
        // Keep legacy key in sync
        localStorage.setItem('theme', savedTheme || 'light');

        // Apply this teacher's pink theme preference
        const savedPink = localStorage.getItem(`pinkTheme_${userId}`);
        if (savedPink === 'enabled') {
            document.documentElement.classList.add('pink-theme');
        } else {
            document.documentElement.classList.remove('pink-theme');
        }
        localStorage.setItem('pinkTheme', savedPink || 'disabled');

        // Cleanup: remove ALL theme classes when leaving the teacher dashboard
        return () => {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark-mode');
            document.documentElement.classList.remove('pink-theme');
            // Reset legacy keys so student dashboard is never affected
            localStorage.setItem('theme', 'light');
            localStorage.setItem('pinkTheme', 'disabled');
        };
    }, [user]);

    // ============================================
    // ACTIONS
    // ============================================
    const handleLogout = useCallback(() => {
        // Clean up themes before navigating away
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark-mode');
        document.documentElement.classList.remove('pink-theme');
        localStorage.setItem('theme', 'light');
        localStorage.setItem('pinkTheme', 'disabled');
        logoutUser();
        navigate('/');
    }, [navigate]);

    const openModal = useCallback((modalName: keyof ModalState) => {
        setModals(prev => ({ ...prev, [modalName]: true }));
    }, []);

    const closeModal = useCallback((modalName: keyof ModalState) => {
        setModals(prev => ({ ...prev, [modalName]: false }));
    }, []);

    const handleQuickAction = useCallback((actionId: string) => {
        switch (actionId) {
            case 'create-assignment':
                openModal('isCreateAssignmentOpen');
                break;
            case 'grade-submissions':
                openModal('isGradeSubmissionsOpen');
                break;
            case 'view-students':
                openModal('isStudentListOpen');
                break;
            case 'report-admin':
                openModal('isReportAdminOpen');
                break;
            case 'qr-attendance':
                openModal('isQRAttendanceOpen');
                break;
            default:
                // Unknown action — silently ignore
                break;
        }
    }, [openModal]);

    const getStatValue = useCallback((statId: string): string | number => {
        switch (statId) {
            case 'students': return stats.totalStudents;
            case 'courses': return stats.totalCourses;
            case 'pending': return stats.pendingSubmissions;
            case 'average': return `${stats.averageGrade}%`;
            default: return 0;
        }
    }, [stats]);

    // ============================================
    // RETURN
    // ============================================
    return {
        // State
        isLoading,
        error,
        user,
        stats,
        activity,
        modals,

        // Actions
        initializeDashboard,
        refreshStats,
        refreshActivity,
        handleLogout,
        openModal,
        closeModal,
        handleQuickAction,
        getStatValue,
    };
};

export default useTeacherDashboard;
