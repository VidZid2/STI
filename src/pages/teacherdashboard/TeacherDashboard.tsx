/**
 * Teacher Dashboard - Exclusive Teacher Portal
 * Professional minimalistic design matching the app's design system
 * 
 * REFACTORED: 
 * - Phase 1: Lazy-loaded modals
 * - Phase 2: Extracted components (WelcomeBanner, SchedulePanel, etc.)
 * - Phase 3: Migrated inline styles to Tailwind CSS
 * - Phase 4: Decoupled all Supabase data-fetching into service hooks
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';

// Lazy Modal imports
const CreateAssignmentModal = lazy(() => import('./CreateAssignmentModal'));
const StudentListModal = lazy(() => import('./StudentListModal'));
const GradeSubmissionsModal = lazy(() => import('./GradeSubmissionsModal'));
const AtRiskStudentsModal = lazy(() => import('./AtRiskStudentsModal'));
const ActivityModal = lazy(() => import('./ActivityModal'));
const ReportAdminModal = lazy(() => import('./ReportAdminModal'));
const QRAttendanceModal = lazy(() => import('./QRAttendanceModal'));

// Helper to prevent downloading modals until they are actually opened, 
// while keeping them mounted after closing so exit animations play correctly.
const LazyModalWrapper: React.FC<{ isOpen: boolean; children: React.ReactNode }> = ({ isOpen, children }) => {
    const [hasOpened, setHasOpened] = useState(isOpen);
    useEffect(() => {
        if (isOpen) setHasOpened(true);
    }, [isOpen]);
    if (!hasOpened) return null;
    return <>{children}</>;
};

// Local imports - Components
import {
    DashboardSkeleton,
    ErrorDisplay,
    DashboardHeader,
    WelcomeBanner,
    SchedulePanel,
    UrgentTasksPanel,
    QuickActionsPanel,
    AtRiskPanel,
    ActivityPanel,
} from './components';

import BroadcastBanner from '../../components/shared/BroadcastBanner';
import MaintenanceBanner from '../../components/shared/MaintenanceBanner';

// Local imports - Hooks (Phase 4: all data logic lives here now)
import {
    useTeacherDashboard,
    useResponsive,
    useDashboardData,
} from './hooks';

// Local imports - Contexts
import { GradingSettingsProvider } from './contexts';
import { toast } from 'sonner';
import { ErrorBoundary } from '../../components/shared';
import { getCurrentUser } from '../../services/authService';


// ============================================
// MAIN TEACHER DASHBOARD COMPONENT
// ============================================
const TeacherDashboard: React.FC = () => {
    // Responsive state for mobile compatibility
    const { isMobile } = useResponsive();

    // Phase 4: Core dashboard hook (auth, stats, activity, modals)
    const {
        isLoading,
        error,
        user,
        activity,
        modals,
        initializeDashboard,
        handleLogout,
        openModal,
        closeModal,
        handleQuickAction,
        getStatValue,
    } = useTeacherDashboard();

    // Phase 4: All Supabase data + notifications via dedicated hook
    const {
        atRiskStudents,
        isLoadingAtRisk,
        todaysSchedule,
        urgentTasks,
        isLoadingSchedule,
        notifications,
        handleNotificationClick,
        handleViewAllNotifications,
    } = useDashboardData(activity, openModal);

    // ============================================
    // LOADING STATE
    // ============================================
    if (isLoading) {
        return (
            <div className="min-h-screen" style={{ 
                background: 'var(--bg-canvas)'
            }}>
                <DashboardSkeleton />
            </div>
        );
    }

    // ============================================
    // ERROR STATE
    // ============================================
    if (error) {
        return <ErrorDisplay message={error} onRetry={initializeDashboard} />;
    }

    // ============================================
    // MAIN RENDER
    // ============================================
    return (
        <div className="min-h-screen" style={{ 
            background: 'var(--bg-canvas)'
        }}>
            {/* Maintenance countdown banner */}
            <MaintenanceBanner />
            {/* Header */}
            <DashboardHeader
                userName={user?.full_name || 'Teacher'}
                userEmail={user?.email || ''}
                userInitial={user?.first_name?.charAt(0) || 'T'}
                onLogout={handleLogout}
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
                onViewAllNotifications={handleViewAllNotifications}
            />

            {/* Main Content */}
            <main className="p-4 md:p-8 max-w-[1400px] mx-auto">
                {/* Welcome Header */}
                <WelcomeBanner user={user} isMobile={isMobile} getStatValue={getStatValue} />

                {/* Admin Broadcast Banners — Real-time from Supabase */}
                <BroadcastBanner role="teacher" />

                {/* Two Column Layout: Today's Schedule + Urgent Tasks */}
                <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-4 md:gap-5 mb-6">
                    <SchedulePanel isLoadingSchedule={isLoadingSchedule} todaysSchedule={todaysSchedule} />
                    <UrgentTasksPanel isLoadingSchedule={isLoadingSchedule} urgentTasks={urgentTasks} />
                </div>

                {/* Quick Actions */}
                <QuickActionsPanel isMobile={isMobile} handleQuickAction={handleQuickAction} />

                {/* At-Risk Students Panel */}
                <AtRiskPanel isLoadingAtRisk={isLoadingAtRisk} atRiskStudents={atRiskStudents} openModal={openModal} />

                {/* Recent Activity Panel */}
                <ActivityPanel activity={activity} openModal={openModal} />
            </main>

            {/* ============================================ */}
            {/* MODALS */}
            {/* ============================================ */}
            <Suspense fallback={null}>
                {/* Create Assignment Modal */}
                <LazyModalWrapper isOpen={modals.isCreateAssignmentOpen}>
                    <ErrorBoundary name="CreateAssignmentModal">
                    <CreateAssignmentModal
                        isOpen={modals.isCreateAssignmentOpen}
                        onClose={() => closeModal('isCreateAssignmentOpen')}
                        onReopen={() => openModal('isCreateAssignmentOpen')}
                        onSubmit={async (data) => {
                            try {
                                const { createAssignment } = await import('../../services/teacherService');
                                const result = await createAssignment(data, getCurrentUser()?.id);

                                if (result.success) {
                                    toast.success(
                                        result.createdCount === 1
                                            ? 'Assignment created successfully'
                                            : `${result.createdCount} assignments created`
                                    );
                                    if (result.errors.length > 0) {
                                        toast.warning(`${result.errors.length} section(s) failed to create`);
                                    }
                                } else {
                                    toast.error('Failed to create assignment. Please try again.');
                                }
                            } catch {
                                toast.error('An unexpected error occurred. Please try again.');
                            }
                            closeModal('isCreateAssignmentOpen');
                        }}
                    />
                    </ErrorBoundary>
                </LazyModalWrapper>

                {/* Student List Modal */}
                <LazyModalWrapper isOpen={modals.isStudentListOpen}>
                    <StudentListModal
                        isOpen={modals.isStudentListOpen}
                        onClose={() => closeModal('isStudentListOpen')}
                    />
                </LazyModalWrapper>

                {/* Grade Submissions Modal */}
                <LazyModalWrapper isOpen={modals.isGradeSubmissionsOpen}>
                    <GradeSubmissionsModal
                        isOpen={modals.isGradeSubmissionsOpen}
                        onClose={() => closeModal('isGradeSubmissionsOpen')}
                    />
                </LazyModalWrapper>

                {/* At-Risk Students Modal */}
                <LazyModalWrapper isOpen={modals.isAtRiskStudentsOpen}>
                    <AtRiskStudentsModal
                        isOpen={modals.isAtRiskStudentsOpen}
                        onClose={() => closeModal('isAtRiskStudentsOpen')}
                    />
                </LazyModalWrapper>

                {/* Activity Modal */}
                <LazyModalWrapper isOpen={modals.isActivityModalOpen}>
                    <ActivityModal
                        isOpen={modals.isActivityModalOpen}
                        onClose={() => closeModal('isActivityModalOpen')}
                    />
                </LazyModalWrapper>

                {/* Report to Admin Modal */}
                <LazyModalWrapper isOpen={modals.isReportAdminOpen}>
                    <ReportAdminModal
                        isOpen={modals.isReportAdminOpen}
                        onClose={() => closeModal('isReportAdminOpen')}
                    />
                </LazyModalWrapper>

                {/* QR Attendance Modal */}
                <LazyModalWrapper isOpen={modals.isQRAttendanceOpen}>
                    <QRAttendanceModal
                        isOpen={modals.isQRAttendanceOpen}
                        onClose={() => closeModal('isQRAttendanceOpen')}
                    />
                </LazyModalWrapper>
            </Suspense>
        </div>
    );
};

// Wrap with GradingSettingsProvider for shared grading settings
const TeacherDashboardWithProviders: React.FC = () => (
    <GradingSettingsProvider>
        <TeacherDashboard />
    </GradingSettingsProvider>
);

export default TeacherDashboardWithProviders;
