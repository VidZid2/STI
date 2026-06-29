import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SidebarProvider, SidebarInset } from '../../components/ui/sidebar';
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
import WidgetsToggleButton from '../../components/ui/misc/WidgetsToggleButton';




// Heavy content tabs — lazy loaded to reduce initial bundle size
const GroupsContent = React.lazy(() => import('./content/GroupsContent'));
const GoalsContent = React.lazy(() => import('./content/GoalsContent'));
const UsersContent = React.lazy(() => import('./content/UsersContent'));

const CourseViewPage = React.lazy(() => import('./content/CourseViewPage'));

// Context imports
import { useNotifications } from '../../contexts/NotificationContext';
import { useQuickViewSettings } from '../../contexts/QuickViewSettingsContext';

// Service imports
import { getCourseProgressData, formatMinutesToHours } from '../../services/studyTimeService';
import { formatDaysUntil, getDeadlineTypeColor, getDaysUntil } from '../../services/deadlinesService';
import { formatRelativeTime } from '../../services/activityService';

// Extracted modules from local folder
import { DashboardIntro, DashboardTutorial, DashboardHeader, DashboardSidebar, DailyInspirationToast, triggerGlobalToast } from './components';
import { WidgetSidebar } from './components/WidgetSidebar';
import { DashboardSuspenseFallback } from './components/DashboardSuspenseFallback';
import { getSidebarCoursesWithProgress, getTodaysQuote } from './utils';
import { isDashboardView } from './types';
import { ToolsSkeleton } from './content/ToolsContent/components/ToolsShared';

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
    useKeyboardNavigation } from './hooks';

// Widget components - available for future refactoring
// import { QuoteWidget, WeatherWidget, ActivityWidget, QuickStatsCard } from './widgets';

// ============================================================================
// REFACTORED: State and logic extracted to ./DashboardPage/hooks
// This reduces the component from ~3000 lines to ~800 lines
// ============================================================================

const DashboardPage: React.FC = () => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showDebugButtons, setShowDebugButtons] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '-' && e.target instanceof Element && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                setShowDebugButtons(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setIsScrolled(e.currentTarget.scrollTop > 10);
    };

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
        isDashboardReady,
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

    // Global listener for Settings
    useEffect(() => {
        const handleOpenSettings = () => openSettingsModal();
        document.addEventListener('open:settings', handleOpenSettings);
        return () => document.removeEventListener('open:settings', handleOpenSettings);
    }, [openSettingsModal]);

    // Listen for navigate-to-course events from PathsContent
    useEffect(() => {
        const handleNavigateToCourse = (event: CustomEvent<{ courseId: string; fromView?: string }>) => {
            const { courseId, fromView } = event.detail;
            const coursesWithProgress = getSidebarCoursesWithProgress();
            const course = coursesWithProgress.find(c => c.id === courseId);

            if (course) {
                // Save scroll position before navigating away from home
                if (fromView === 'home' || activeView === 'home') {
                    sessionStorage.setItem('dashboard-scroll-y', scrollContainerRef.current ? scrollContainerRef.current.scrollTop.toString() : '0');
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

    // Reset scroll position of the inset content when active tab changes
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
        setIsScrolled(false);
    }, [activeView]);

    // Notification System - using shared context (synced with ToolbarExpandable)
    const {
        toastNotifications,
        dismissToast,
        addNotification
    } = useNotifications();

    // Quick View Settings - controls sidebar widget visibility and behavior
    const { settings: quickViewSettings, refreshTrigger, triggerRefresh } = useQuickViewSettings();

    // addNotification can be called to add new notifications dynamically
    void addNotification; // Suppress unused warning - available for dynamic use

    const closeToast = (id: string | number) => {
        dismissToast(id as any);
    };

    // Widget visibility hook
    const {
        widgetVisibility,
        toggleWidget,
        restoreAllWidgets,
        hasHiddenWidgets } = useWidgetVisibility();

    // Dashboard data hook (deadlines, activities, progress)
    const {
        upcomingDeadlines,
        recentActivities,
        overallProgress,
        totalCourses } = useDashboardData(refreshTrigger);

    // Trigger deadline warning notifications
    const hasTriggeredDeadlinesNotification = React.useRef(false);
    React.useEffect(() => {
        if (!showIntro && upcomingDeadlines.length > 0 && !hasTriggeredDeadlinesNotification.current) {
            const todayDeadlines = upcomingDeadlines.filter(d => getDaysUntil(d.dueDate) === 0);
            const closeDeadlines = upcomingDeadlines.filter(d => {
                const days = getDaysUntil(d.dueDate);
                return days > 0 && days <= 3;
            });

            if (todayDeadlines.length > 0) {
                hasTriggeredDeadlinesNotification.current = true;
                triggerGlobalToast('danger', {
                    title: 'Urgent Deadline Today!',
                    message: `You have ${todayDeadlines.length} deadline(s) due today. Stay on track!`
                });
            } else if (closeDeadlines.length > 0) {
                hasTriggeredDeadlinesNotification.current = true;
                triggerGlobalToast('warning', {
                    title: 'Upcoming Deadlines',
                    message: `You have ${closeDeadlines.length} deadline(s) due within 3 days. Plan ahead!`
                });
            }
        }
    }, [upcomingDeadlines, showIntro]);

    // Weather hook
    const {
        weather,
        weatherLoading,
        weatherError } = useWeather(showIntro);

    // Handle intro-active CSS class and pre-warm lazy routes
    React.useEffect(() => {
        if (showIntro) {
            document.body.classList.add('intro-active');
        } else {
            document.body.classList.remove('intro-active');
            
            // Pre-warm secondary tabs
            if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(() => {
                    import('./content/ToolsContent').catch(() => {});
                    import('./content/PathsContent').catch(() => {});
                    import('./content/GroupsContent').catch(() => {});
                    import('./content/GoalsContent').catch(() => {});
                    import('./content/UsersContent').catch(() => {});
                });
            } else {
                setTimeout(() => {
                    import('./content/ToolsContent').catch(() => {});
                    import('./content/PathsContent').catch(() => {});
                    import('./content/GroupsContent').catch(() => {});
                    import('./content/GoalsContent').catch(() => {});
                    import('./content/UsersContent').catch(() => {});
                }, 1000);
            }
        }
        return () => document.body.classList.remove('intro-active');
    }, [showIntro]);

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
        completedCount } = useTodos();

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
        hasDeadlines } = useCalendar(upcomingDeadlines);

    // Duplicate code removed during refactoring

    // Mouse proximity detection moved to isolated WidgetsToggleButton component
    // to prevent re-renders of the entire DashboardPage

    // AI Chat Logic - Removed

    const widgetSidebarProps = {
        widgetsSidebarActive,
        toggleWidgetsSidebar,
        widgetVisibility,
        toggleWidget,
        restoreAllWidgets,
        hasHiddenWidgets,
        isDemoMode,
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
        weather,
        isWeatherLoading: weatherLoading,
        deadlines: upcomingDeadlines,
        recentActivity: recentActivities,
        gradePredictor,
        studyInsights,
        notifications: toastNotifications,
        groupedNotifications: [],
        quickViewSettings,
        achievements,
        formatDaysUntil,
        getDeadlineTypeColor,
        formatRelativeTime,
        getCourseProgressData,
        formatMinutesToHours,
        refreshTrigger,
        triggerRefresh,
        totalCourses,
        upcomingDeadlines,
        overallProgress,
        openSettingsModal,
        todaysQuote,
        weatherLoading,
        weatherError,
        recentActivities,
        calendarData,
        calendarView,
        setCalendarView,
        calendarMonth,
        setCalendarMonth,
        hasDeadlines
    };

    return (
        <SidebarProvider open={sidebarActive} onOpenChange={setSidebarActive} className="h-svh overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* Sidebar — re-implemented with shadcn primitives */}
            <DashboardSidebar
                sidebarActive={sidebarActive}
                setSidebarActive={setSidebarActive}
                activeView={activeView}
                setActiveView={setActiveView}
                selectedCourse={selectedCourse}
                setSelectedCourse={setSelectedCourse}
                openSettingsModal={openSettingsModal}
                widgetsSidebarActive={widgetsSidebarActive}
            />
            
            <SidebarInset className="flex flex-col h-svh md:h-[calc(100svh-16px)] overflow-hidden border-l-0 bg-white dark:bg-slate-900 md:m-2 md:ml-0 md:rounded-xl md:border md:shadow-sm">
                {/* Maintenance countdown banner */}
                <MaintenanceBanner />
                
                {/* Header — sticky to the top of inset card */}
                <DashboardHeader
                    activeView={activeView}
                    setActiveView={setActiveView}
                    isDemoMode={isDemoMode}
                    toggleWidgetsSidebar={toggleWidgetsSidebar}
                    isQuickViewActive={widgetsSidebarActive}
                    isScrolled={isScrolled}
                />
                
                {/* Main Content Scrollable Container */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-10 pb-24 minimal-scrollbar"
                >
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
                                <HomeContent 
                                    onShowWelcomeModal={showWelcomeModal} 
                                    quickViewSlot={<WidgetSidebar isInline={true} {...widgetSidebarProps} />}
                                    weather={weather}
                                    weatherLoading={weatherLoading}
                                />
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
                                                if (savedScrollY && scrollContainerRef.current) {
                                                    scrollContainerRef.current.scrollTo({
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
            </div>
          </SidebarInset>





            {/* Mobile/Tablet Widget Sidebar - Hidden on PC */}
            <div className="lg:hidden">
                <WidgetsToggleButton
                    isWidgetsSidebarActive={widgetsSidebarActive}
                    onToggle={toggleWidgetsSidebar}
                />
                <WidgetSidebar {...widgetSidebarProps} />
            </div>

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
            {showIntro && <DashboardIntro 
                isLoading={!isDashboardReady}
                onComplete={() => {
                setShowIntro(false);
                // Show welcome modal after intro if it hasn't been completed
                if (localStorage.getItem('welcome-modal-completed') !== 'true') {
                    setWelcomeModalActive(true);
                }
            }} />}

            {/* Daily Inspiration Toast & Generic Toasts (Unified Stack) */}
            {!showIntro && !tutorialActive && !welcomeModalActive && (
                <DailyInspirationToast 
                    quote={todaysQuote} 
                    externalToasts={toastNotifications} 
                    onExternalToastClose={closeToast} 
                />
            )}




            {/* Debug Button to Trigger All Notifications */}
            {showDebugButtons && (
                <div className="hidden sm:flex fixed bottom-4 right-4 z-[100] flex-col gap-2">
                    <button 
                        onClick={() => {
                            sessionStorage.removeItem('dashboardIntroShown');
                            setShowIntro(true);
                            setWelcomeModalActive(false);
                        }}
                        className="px-4 py-2 bg-yellow-500/80 hover:bg-yellow-600 text-white text-sm font-semibold rounded-full shadow-lg backdrop-blur-sm transition-all z-50"
                    >
                        Replay Intro
                    </button>
                    <button 
                        onClick={() => {
                            triggerGlobalToast('quote', { title: 'Daily Quote', message: 'You can do it!' });
                            setTimeout(() => triggerGlobalToast('success', { title: 'Success', message: 'Task completed successfully' }), 1000);
                            setTimeout(() => triggerGlobalToast('info', { title: 'Information', message: 'New update available' }), 2000);
                            setTimeout(() => triggerGlobalToast('warning', { title: 'Warning', message: 'Approaching deadline' }), 3000);
                            setTimeout(() => triggerGlobalToast('danger', { title: 'Danger', message: 'Deadline missed' }), 4000);
                            setTimeout(() => triggerGlobalToast('urgent', { title: 'Urgent', message: 'Action required immediately' }), 5000);
                        }}
                        className="px-4 py-2 bg-indigo-600/80 hover:bg-indigo-700 text-white text-sm font-semibold rounded-full shadow-lg backdrop-blur-sm transition-all z-50"
                    >
                        Test Notifications
                    </button>
                </div>
            )}
        </SidebarProvider>
    );
};

export default DashboardPage;
