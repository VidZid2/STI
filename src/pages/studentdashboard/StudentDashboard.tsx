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
import ToolsContent from './content/ToolsContent';
import HomeContent from './content/HomeContent';
import PathsContent from './content/PathsContent';
import WidgetsToggleButton from '../../components/ui/misc/WidgetsToggleButton';
import QuickSettingsDropdown from '../../components/ui/dropdowns/QuickSettingsDropdown';
import HelpDropdown from '../../components/ui/dropdowns/HelpDropdown';
import { Dock, DockIcon, DockAutoHide } from '../../components/ui/primitives/dock';

// Heavy content tabs — lazy loaded to reduce initial bundle size
const GroupsContent = React.lazy(() => import('./content/GroupsContent'));
const GoalsContent = React.lazy(() => import('./content/GoalsContent'));
const UsersContent = React.lazy(() => import('./content/UsersContent'));
const CatalogContent = React.lazy(() => import('./content/CatalogContent'));
const CourseViewPage = React.lazy(() => import('./content/CourseViewPage'));

// Context imports
import { useNotifications } from '../../contexts/NotificationContext';
import { useQuickViewSettings } from '../../contexts/QuickViewSettingsContext';

// Service imports
import { getCourseProgressData, formatMinutesToHours } from '../../services/studyTimeService';
import { formatDaysUntil, getDeadlineTypeColor } from '../../services/deadlinesService';
import { formatRelativeTime } from '../../services/activityService';

// Extracted modules from local folder
import { NotificationItem, GroupedNotification, StreakWidget, DashboardIntro, DashboardTutorial, DashboardHeader, DashboardSidebar } from './components';
import { WidgetSidebar } from './components/WidgetSidebar';
import { getSidebarCoursesWithProgress, getTodaysQuote } from './utils';
// COURSE_NAMES available from './constants' if needed

// Custom hooks - extracted for cleaner code
import {
    useDashboardState,
    useDashboardData,
    useWeather,
    useTodos,
    useWidgetVisibility,
    useAchievements,
    useGradePredictor,
    useStudyInsights,
    useCalendar,
} from './hooks';

// Widget components - available for future refactoring
// import { QuoteWidget, WeatherWidget, ActivityWidget, QuickStatsCard } from './widgets';

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
        widgetsSidebarActive,
        setWidgetsSidebarActive,
        toggleWidgetsSidebar,
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
        isDemoMode,
    } = useDashboardState();

    // Suppress unused variable warnings - these are available for future use
    void _setTutorialActive;
    void _setShowConfetti;

    // Listen for navigate-to-course events from PathsContent
    useEffect(() => {
        const handleNavigateToCourse = (event: CustomEvent<{ courseId: string; fromView?: string }>) => {
            const { courseId, fromView } = event.detail;
            const coursesWithProgress = getSidebarCoursesWithProgress();
            const course = coursesWithProgress.find(c => c.id === courseId);

            if (course) {
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

    // Notification System - using shared context (synced with ToolbarExpandable)
    const {
        toastNotifications,
        dismissToast,
        clearAllToasts,
        addNotification
    } = useNotifications();

    // Quick View Settings - controls sidebar widget visibility and behavior
    const { settings: quickViewSettings, refreshTrigger } = useQuickViewSettings();

    // addNotification can be called to add new notifications dynamically
    void addNotification; // Suppress unused warning - available for dynamic use

    const closeToast = (id: number) => {
        dismissToast(id);
    };

    // Widget visibility hook
    const {
        widgetVisibility,
        toggleWidget,
        restoreAllWidgets,
        hasHiddenWidgets,
    } = useWidgetVisibility();

    // Dashboard data hook (deadlines, activities, progress)
    const {
        upcomingDeadlines,
        recentActivities,
        overallProgress,
        totalCourses,
    } = useDashboardData(refreshTrigger);

    // Weather hook
    const {
        weather,
        weatherLoading,
        weatherError,
    } = useWeather();

    // Todos hook
    const {
        todos,
        newTodoText,
        setNewTodoText,
        isAddingTodo,
        setIsAddingTodo,
        todoInputRef,
        addTodo,
        toggleTodo,
        deleteTodo,
        clearAllTodos,
        completedCount,
    } = useTodos();

    // Achievements hook
    const { achievements } = useAchievements(refreshTrigger);

    // Grade predictor hook
    const { gradePredictor } = useGradePredictor(refreshTrigger);

    // Study insights hook
    const { studyInsights } = useStudyInsights(refreshTrigger);

    // Get today's quote from utils
    const todaysQuote = getTodaysQuote();

    // Calendar hook (for deadline highlighting)
    const {
        calendarView,
        setCalendarView,
        calendarMonth,
        setCalendarMonth,
        calendarData,
        hasDeadlines,
    } = useCalendar(upcomingDeadlines);

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
                sidebarActive={sidebarActive}
                toggleSidebar={toggleSidebar}
                setActiveView={setActiveView}
                setSidebarActive={setSidebarActive}
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
            <main className="main-content">
                <React.Suspense fallback={
                    <div className="flex items-center justify-center h-full min-h-[400px]">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-slate-400 font-medium">Loading...</span>
                        </div>
                    </div>
                }>
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
                    {activeView === 'catalog' && (
                        <motion.div
                            key="catalog"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ErrorBoundary name="Catalog">
                                <CatalogContent />
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





            {/* Floating Widgets Toggle Button - Always visible, outside AnimatePresence */}
            <WidgetsToggleButton
                isWidgetsSidebarActive={widgetsSidebarActive}
                onToggle={toggleWidgetsSidebar}
            />

            {/* Widgets Sidebar — extracted to ./components/WidgetSidebar.tsx */}
            <WidgetSidebar
                widgetsSidebarActive={widgetsSidebarActive}
                toggleWidgetsSidebar={toggleWidgetsSidebar}
                widgetVisibility={widgetVisibility}
                toggleWidget={toggleWidget}
                restoreAllWidgets={restoreAllWidgets}
                hasHiddenWidgets={hasHiddenWidgets}
                isDemoMode={isDemoMode}
                todos={todos}
                newTodoText={newTodoText}
                setNewTodoText={setNewTodoText}
                isAddingTodo={isAddingTodo}
                setIsAddingTodo={setIsAddingTodo}
                todoInputRef={todoInputRef}
                addTodo={addTodo}
                toggleTodo={toggleTodo}
                deleteTodo={deleteTodo}
                clearAllTodos={clearAllTodos}
                completedCount={completedCount}
                weather={weather}
                isWeatherLoading={weatherLoading}
                deadlines={upcomingDeadlines}
                recentActivity={recentActivities}
                gradePredictor={gradePredictor}
                studyInsights={studyInsights}
                notifications={toastNotifications}
                groupedNotifications={[]}
                quickViewSettings={quickViewSettings}
                achievements={achievements}
                formatDaysUntil={formatDaysUntil}
                getDeadlineTypeColor={getDeadlineTypeColor}
                formatRelativeTime={formatRelativeTime}
                getCourseProgressData={getCourseProgressData}
                formatMinutesToHours={formatMinutesToHours}
                refreshTrigger={refreshTrigger}
                totalCourses={totalCourses}
                upcomingDeadlines={upcomingDeadlines}
                overallProgress={overallProgress}
                openSettingsModal={openSettingsModal}
            />

            {/* AI Chatbot - Removed */}

            <SettingsModal isOpen={settingsModalActive} onClose={closeSettingsModal} />

            <WelcomeModal isOpen={welcomeModalActive} onClose={closeWelcomeModal} />
            <DashboardTutorial
                isOpen={tutorialActive}
                onClose={closeTutorial}
                onToggleWidgetsSidebar={(open) => setWidgetsSidebarActive(open)}
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
                                    onClose={closeToast}
                                />
                            ))
                        )}
                    </AnimatePresence>
                </div>
            )}



            {/* Floating Dock - Hidden when in course view */}
            <AnimatePresence>
                {activeView !== 'course' && (
                    <DockAutoHide>
                        <Dock
                            direction="bottom"
                            iconSize={40}
                            iconMagnification={70}
                            iconDistance={150}
                            className="mt-0 shadow-xl shadow-blue-900/20"
                        >
                            <DockIcon className="border border-blue-700" title="Continue Learning">
                                <a href="#" className="flex items-center justify-center w-full h-full">
                                    <lord-icon
                                        src="https://cdn.lordicon.com/rrbmabsx.json"
                                        trigger="hover"
                                        colors="primary:#1d4ed8,secondary:#eab308"
                                        style={{ width: '24px', height: '24px' }}
                                    />
                                </a>
                            </DockIcon>
                            <DockIcon className="border border-blue-700" title="Assignments">
                                <a href="#" className="flex items-center justify-center w-full h-full">
                                    <lord-icon
                                        src="https://cdn.lordicon.com/hmpomorl.json"
                                        trigger="hover"
                                        colors="primary:#1d4ed8,secondary:#eab308"
                                        style={{ width: '24px', height: '24px' }}
                                    />
                                </a>
                            </DockIcon>
                            <DockIcon className="border border-blue-700" title="Classes">
                                <a href="#" className="flex items-center justify-center w-full h-full">
                                    <lord-icon
                                        src="https://cdn.lordicon.com/psyssele.json"
                                        trigger="hover"
                                        state="hover-snooze"
                                        colors="primary:#1d4ed8,secondary:#eab308"
                                        style={{ width: '24px', height: '24px' }}
                                    />
                                </a>
                            </DockIcon>
                            <DockIcon className="border border-blue-700" title="Discussion">
                                <a href="#" className="flex items-center justify-center w-full h-full">
                                    <lord-icon
                                        src="https://cdn.lordicon.com/jdgfsfzr.json"
                                        trigger="hover"
                                        colors="primary:#1d4ed8,secondary:#eab308"
                                        style={{ width: '24px', height: '24px' }}
                                    />
                                </a>
                            </DockIcon>
                        </Dock>
                    </DockAutoHide>
                )}
            </AnimatePresence>


        </div >
    );
};

export default DashboardPage;
