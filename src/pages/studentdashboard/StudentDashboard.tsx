import * as React from 'react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import '../../styles/dashboard.css';
import '../../styles/intro.css';
import '../../styles/settings-modal.css';
import '../../styles/responsive-optimization.css';
import '../../styles/home-content.css';

// Component imports
import { WelcomeModal, SettingsModal } from '../../components/modals';
import { Confetti, ErrorBoundary } from '../../components/shared';
import MaintenanceBanner from '../../components/shared/MaintenanceBanner';
const ToolsContent = React.lazy(() => import('./content/ToolsContent'));
const HomeContent = React.lazy(() => import('./content/HomeContent'));
const PathsContent = React.lazy(() => import('./content/PathsContent'));



// Heavy content tabs — lazy loaded to reduce initial bundle size
const GroupsContent = React.lazy(() => import('./content/GroupsContent'));
const GoalsContent = React.lazy(() => import('./content/GoalsContent'));
const UsersContent = React.lazy(() => import('./content/UsersContent'));

const CourseViewPage = React.lazy(() => import('./content/CourseViewPage'));

// Context imports
import { useNotifications } from '../../contexts/NotificationContext';


// Extracted modules from local folder
import { NotificationItem, GroupedNotification, DashboardIntro, DashboardTutorial, DashboardHeader, DashboardSidebar } from './components';
import { DashboardSuspenseFallback } from './components/DashboardSuspenseFallback';
import { getSidebarCoursesWithProgress } from './utils';
import { isDashboardView } from './types';
import { ToolsSkeleton } from './content/ToolsContent/components/ToolsShared';

// Custom hooks - extracted for cleaner code
import {
    useDashboardState,
    useKeyboardNavigation } from './hooks';

// ============================================================================
// REFACTORED: State and logic extracted to ./DashboardPage/hooks
// This reduces the component from ~3000 lines to ~800 lines
// ============================================================================

const DashboardPage: React.FC = () => {
    // ========================================================================
    // HOOKS - All state management extracted to custom hooks
    // ========================================================================

    // Main dashboard UI state (sidebars, modals, views, courses)
    const {
        sidebarActive,
        setSidebarActive,
        toggleSidebar,
        settingsModalActive,
        openSettingsModal,
        closeSettingsModal,
        welcomeModalActive,
        setWelcomeModalActive,
        showWelcomeModal,
        closeWelcomeModal,
        tutorialActive,
        setTutorialActive: _setTutorialActive,
        closeTutorial,
        activeView,
        setActiveView,
        previousView,
        setPreviousView,
        selectedCourse,
        setSelectedCourse,
        showConfetti,
        setShowConfetti: _setShowConfetti,
        showIntro,
        setShowIntro,
        isDemoMode } = useDashboardState();

    // Suppress unused variable warnings - these are available for future use
    void _setTutorialActive;
    void _setShowConfetti;

    // Keyboard navigation for main nav items (Alt+1-7, Cmd/Ctrl+, for settings, Cmd/Ctrl+B for sidebar)
    useKeyboardNavigation({
        activeView,
        setActiveView,
        openSettingsModal,
        toggleSidebar,
        isModalOpen: settingsModalActive || welcomeModalActive,
    });

    // Listen for navigate-to-course events from PathsContent
    useEffect(() => {
        const handleNavigateToCourse = (event: CustomEvent<{ courseId: string; fromView?: string }>) => {
            const { courseId, fromView } = event.detail;
            const coursesWithProgress = getSidebarCoursesWithProgress();
            const course = coursesWithProgress.find(c => c.id === courseId);

            if (course) {
                // Save scroll position before navigating away from home
                if (fromView === 'home' || activeView === 'home') {
                    sessionStorage.setItem('dashboard-scroll-y', window.scrollY.toString());
                }

                // Save the previous view so back button returns to correct page
                if (fromView === 'paths' || activeView === 'paths') {
                    setPreviousView('paths');
                } else if (activeView === 'tools') {
                    setPreviousView('tools');
                } else {
                    setPreviousView('home');
                }
                setSelectedCourse(course);
                setActiveView('course');
            } else {
            }
        };

        window.addEventListener('navigate-to-course', handleNavigateToCourse as EventListener);
        return () => {
            window.removeEventListener('navigate-to-course', handleNavigateToCourse as EventListener);
        };
    }, [activeView]);

    // Listen for navigate-to-tab events from HomeContent quick actions
    useEffect(() => {
        const handleNavigateToTab = (event: CustomEvent<{ tab: string }>) => {
            const tab = event.detail.tab;
            if (isDashboardView(tab)) {
                setActiveView(tab);
            }
        };

        window.addEventListener('navigate-to-tab', handleNavigateToTab as EventListener);
        return () => {
            window.removeEventListener('navigate-to-tab', handleNavigateToTab as EventListener);
        };
    }, []);

    // Notification System - using shared context (synced with ToolbarExpandable)
    const {
        toastNotifications,
        dismissToast,
        clearAllToasts
    } = useNotifications();

    // Calendar hook removed; moved to HomeContent if needed

    // Duplicate code removed during refactoring

    // Mouse proximity detection moved to isolated WidgetsToggleButton component
    // to prevent re-renders of the entire DashboardPage

    // AI Chat Logic - Removed

    return (
        <div className="dashboard-container">
            {/* Maintenance countdown banner */}
            <MaintenanceBanner />
            {/* Header */}
            {/* Header — extracted to ./components/DashboardHeader.tsx */}
            <DashboardHeader
                setActiveView={setActiveView}
                isDemoMode={isDemoMode}
            />

            {/* Sidebar — extracted to ./components/DashboardSidebar.tsx */}
            <DashboardSidebar
                sidebarActive={sidebarActive}
                setSidebarActive={setSidebarActive}
                activeView={activeView}
                setActiveView={setActiveView}
                selectedCourse={selectedCourse}
                setSelectedCourse={setSelectedCourse}
                openSettingsModal={openSettingsModal}
            />
            {/* Main Content */}
            <main className={`main-content ${!sidebarActive ? 'sidebar-collapsed' : ''} max-md:!mt-0 max-md:!ml-0 max-md:!p-4`}>
                <React.Suspense fallback={activeView === 'tools' ? <div className="tools-content pb-24"><ToolsSkeleton /></div> : <DashboardSuspenseFallback />}>
                <AnimatePresence mode="wait">
                    {activeView === 'home' && (
                        <motion.div
                            key="home"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ErrorBoundary name="Home">
                                <HomeContent onShowWelcomeModal={showWelcomeModal} />
                            </ErrorBoundary>
                        </motion.div>
                    )}
                    {activeView === 'tools' && (
                        <motion.div
                            key="tools"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ErrorBoundary name="Tools">
                                <ToolsContent />
                            </ErrorBoundary>
                        </motion.div>
                    )}
                    {activeView === 'course' && selectedCourse && (
                        <motion.div
                            key="course"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="h-full"
                        >
                            <ErrorBoundary name="CourseView">
                                <CourseViewPage
                                    course={selectedCourse}
                                    onBack={() => {
                                        setActiveView(previousView);
                                        setSelectedCourse(null);
                                        
                                        if (previousView === 'home') {
                                            // Wait for HomeContent to render and animate before scrolling
                                            setTimeout(() => {
                                                const savedScrollY = sessionStorage.getItem('dashboard-scroll-y');
                                                if (savedScrollY) {
                                                    window.scrollTo({
                                                        top: parseInt(savedScrollY),
                                                        behavior: 'smooth'
                                                    });
                                                    sessionStorage.removeItem('dashboard-scroll-y');
                                                }
                                            }, 350);
                                        }
                                    }}
                                />
                            </ErrorBoundary>
                        </motion.div>
                    )}
                    {activeView === 'paths' && (
                        <motion.div
                            key="paths"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ErrorBoundary name="Paths">
                                <PathsContent
                                    onPathSelect={(_pathId) => {
                                        // Future: Navigate to path detail view
                                    }}
                                />
                            </ErrorBoundary>
                        </motion.div>
                    )}
                    {activeView === 'goals' && (
                        <motion.div
                            key="goals"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ErrorBoundary name="Goals">
                                <GoalsContent />
                            </ErrorBoundary>
                        </motion.div>
                    )}
                    {activeView === 'users' && (
                        <motion.div
                            key="users"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ErrorBoundary name="Users">
                                <UsersContent />
                            </ErrorBoundary>
                        </motion.div>
                    )}

                    {activeView === 'groups' && (
                        <motion.div
                            key="groups"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ErrorBoundary name="Groups">
                                <GroupsContent />
                            </ErrorBoundary>
                        </motion.div>
                    )}
                </AnimatePresence>
                </React.Suspense>
            </main>




            {/* Dashboard sidebar and widgets removed for Bento layout */}

            <SettingsModal isOpen={settingsModalActive} onClose={closeSettingsModal} />

            <WelcomeModal isOpen={welcomeModalActive} onClose={closeWelcomeModal} />
            <DashboardTutorial
                isOpen={tutorialActive}
                onClose={closeTutorial}
            />
            <Confetti active={showConfetti} />

            {/* Dashboard Intro - shows only once per session */}
            {showIntro && <DashboardIntro onComplete={() => {
                setShowIntro(false);
                // Show welcome modal after intro if it hasn't been completed
                if (localStorage.getItem('welcome-modal-completed') !== 'true') {
                    setWelcomeModalActive(true);
                }
            }} />}

            {/* Toast Notifications Container - Compact Design on Left Side */}
            {/* Only show toast notifications after intro and tutorial are complete */}
            {!showIntro && !tutorialActive && !welcomeModalActive && (
                <div className="fixed top-20 left-4 z-[10001] w-[300px] max-w-[calc(100vw-2rem)] flex flex-col gap-2.5">
                    <AnimatePresence mode="popLayout">
                        {toastNotifications.length > 3 ? (
                            <GroupedNotification
                                key="grouped"
                                notifications={toastNotifications.map(n => ({
                                    id: n.id,
                                    title: n.title,
                                    message: n.message,
                                    type: n.type || 'assignment'
                                }))}
                                onClearAll={clearAllToasts}
                                onViewAll={() => {
                                    // Could open a notification panel or navigate
                                }}
                            />
                        ) : (
                            toastNotifications.map(notification => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={{
                                        id: notification.id,
                                        title: notification.title,
                                        message: notification.message,
                                        type: notification.type || 'assignment'
                                    }}
                                    onClose={dismissToast}
                                />
                            ))
                        )}
                    </AnimatePresence>
                </div>
            )}







        </div >
    );
};

export default DashboardPage;
