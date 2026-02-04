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
        } catch (err) {
            console.error('Failed to refresh stats:', err);
        }
    }, []);

    const refreshActivity = useCallback(async () => {
        try {
            const activityData = await teacherService.getActivity(10);
            setActivity(activityData);
        } catch (err) {
            console.error('Failed to refresh activity:', err);
            // On error or no data, activity will remain empty
            // Demo data will be added in the dashboard component if needed
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
            console.error('Dashboard initialization error:', err);
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
    // ACTIONS
    // ============================================
    const handleLogout = useCallback(() => {
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
            case 'input-scores':
                openModal('isInputScoresOpen');
                break;
            default:
                console.warn(`Unknown action: ${actionId}`);
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
