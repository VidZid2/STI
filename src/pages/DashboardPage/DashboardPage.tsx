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
import { Confetti } from '../../components/shared';
import ToolbarExpandable from '../../components/ui/toolbar/ToolbarExpandable';
import UserProfileDropdown from '../../components/ui/dropdowns/UserProfileDropdown';
import ToolsContent from '../ToolsContent';
import HomeContent from '../HomeContent';
import { ContainerTextFlip } from '../../components/ui/primitives/container-text-flip';
import PathsContent from '../PathsContent';
import GroupsContent from '../GroupsContent';
import GoalsContent from '../GoalsContent';
import UsersContent from '../UsersContent';
import CatalogContent from '../CatalogContent';
import ToolsNavTooltip from '../../components/ui/misc/ToolsNavTooltip';
import WidgetsToggleButton from '../../components/ui/misc/WidgetsToggleButton';
import CourseViewPage from '../CourseViewPage';
import StreakDropdown from '../../components/ui/dropdowns/StreakDropdown';
import QuickSettingsDropdown from '../../components/ui/dropdowns/QuickSettingsDropdown';
import HelpDropdown from '../../components/ui/dropdowns/HelpDropdown';
import { Dock, DockIcon, DockAutoHide } from '../../components/ui/primitives/dock';

// Context imports
import { useNotifications } from '../../contexts/NotificationContext';
import { useQuickViewSettings } from '../../contexts/QuickViewSettingsContext';

// Service imports
import { getCourseProgressData, formatMinutesToHours } from '../../services/studyTimeService';
import { formatDaysUntil, getDeadlineTypeColor } from '../../services/deadlinesService';
import { formatRelativeTime } from '../../services/activityService';

// Extracted modules from local folder
import { NotificationItem, GroupedNotification, StreakWidget, DashboardIntro, DashboardTutorial } from './components';
import { CoursesNavItem, HelpNavItem, PathsNavItem } from './nav-items';
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
            console.log('[Dashboard] Received navigate-to-course event:', event.detail);
            const { courseId, fromView } = event.detail;
            const coursesWithProgress = getSidebarCoursesWithProgress();
            const course = coursesWithProgress.find(c => c.id === courseId);
            
            if (course) {
                console.log('[Dashboard] Found course, navigating to:', course.title);
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
                console.log('[Dashboard] Course not found for id:', courseId);
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
            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <div className="header-left">
                        <motion.button 
                            className="sidebar-toggle" 
                            onClick={toggleSidebar}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <motion.path
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    animate={sidebarActive 
                                        ? { d: "M 5 5 L 19 19" } 
                                        : { d: "M 4 6 L 20 6" }
                                    }
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                />
                                <motion.path
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    animate={sidebarActive 
                                        ? { opacity: 0 } 
                                        : { opacity: 1 }
                                    }
                                    d="M 4 12 L 20 12"
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                />
                                <motion.path
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    animate={sidebarActive 
                                        ? { d: "M 5 19 L 19 5" } 
                                        : { d: "M 4 18 L 20 18" }
                                    }
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                />
                            </svg>
                        </motion.button>
                        <div className="logo">
                            {/* STI Logo Image */}
                            <div
                                className="logo-icon-wrapper"
                                style={{
                                    width: 36,
                                    height: 36,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                <img 
                                    src="/file.svg" 
                                    alt="STI Logo" 
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            </div>
                            
                            {/* Text Logo with ContainerTextFlip */}
                            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 10, alignItems: 'flex-start' }}>
                                <ContainerTextFlip
                                    words={['eLMS', 'Learn', 'Grow', 'Excel']}
                                    interval={3000}
                                    animationDuration={500}
                                    className="!text-sm !py-1 !px-2 !rounded-md !font-bold"
                                    textClassName="!text-sm"
                                />
                                <span
                                    style={{
                                        fontSize: '0.6rem',
                                        fontWeight: 500,
                                        color: '#94a3b8',
                                        letterSpacing: '0.05em',
                                        textTransform: 'uppercase',
                                        marginTop: 4
                                    }}
                                >
                                    Learning Portal
                                </span>
                            </div>
                        </div>
                        
                        {/* Divider */}
                        <div style={{ width: 1, height: 24, backgroundColor: '#e4e4e7', marginLeft: 12, marginRight: 4 }} />
                        
                        {/* Streak Dropdown - next to eLMS logo */}
                        <StreakDropdown />
                    </div>

                    <div className="header-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '600px' }}>
                    </div>

                    <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Demo Mode Indicator & Buttons */}
                        {isDemoMode ? (
                            <>
                                {/* Demo Mode Active Badge */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                        border: '1px solid #f59e0b',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#b45309',
                                    }}
                                >
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f59e0b' }}
                                    />
                                    DEMO MODE
                                </motion.div>
                                {/* Exit Demo Button */}
                                <motion.button
                                    onClick={() => {
                                        import('../../services/studyTimeService').then(({ resetAllData }) => {
                                            resetAllData();
                                            window.location.reload();
                                        });
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #fca5a5',
                                        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                                        color: '#dc2626',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                    title="Exit demo mode and reset all data"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                    Exit Demo
                                </motion.button>
                            </>
                        ) : (
                            /* Demo Mode Button - Only show when not in demo mode */
                            <motion.button
                                onClick={() => {
                                    import('../../services/studyTimeService').then(({ loadDemoData }) => {
                                        loadDemoData();
                                        window.location.reload();
                                    });
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb',
                                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                    color: '#0369a1',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                title="Load demo data (temporary - clears on refresh)"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                                Demo
                            </motion.button>
                        )}
                        <ToolbarExpandable />
                        <UserProfileDropdown />
                    </div>
                </div>
            </header>

            {/* Sidebar Overlay */}
            <AnimatePresence mode="wait">
                {sidebarActive && (
                    <motion.div
                        className="sidebar-overlay active"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ 
                            duration: 0.35, 
                            ease: [0.4, 0, 0.2, 1] 
                        }}
                        onClick={() => setSidebarActive(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {sidebarActive && (
                    <motion.aside
                        className="sidebar active"
                        initial={{ x: '-100%', opacity: 0.5 }}
                        animate={{ 
                            x: 0, 
                            opacity: 1,
                            transition: {
                                type: 'spring',
                                stiffness: 300,
                                damping: 30,
                                mass: 0.8,
                            }
                        }}
                        exit={{ 
                            x: '-100%', 
                            opacity: 0,
                            transition: {
                                type: 'spring',
                                stiffness: 400,
                                damping: 35,
                                mass: 0.6,
                            }
                        }}
                    >
                <nav className="sidebar-nav">
                        <a href="#" className={`nav-item ${activeView === 'home' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('home'); setSidebarActive(false); }}>
                            <div className="nav-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                            </div>
                            <div className="nav-content">
                                <span className="nav-text">Home</span>
                                <span className="nav-description">Dashboard overview</span>
                            </div>
                        </a>
                        <CoursesNavItem 
                            onSidebarClose={() => setSidebarActive(false)} 
                            onCourseSelect={(course) => {
                                setSelectedCourse(course);
                                setActiveView('course');
                                // Log course access activity
                                import('../../services/activityService').then(({ logCourseAccess }) => {
                                    logCourseAccess(course.id, course.title.split(' - ')[0]);
                                });
                            }}
                            currentCourseId={activeView === 'course' ? selectedCourse?.id : null}
                        />
                        <PathsNavItem 
                            onSidebarClose={() => setSidebarActive(false)}
                            onViewPaths={() => setActiveView('paths')}
                            isActive={activeView === 'paths'}
                        />
                        <a href="#" className={`nav-item ${activeView === 'goals' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('goals'); setSidebarActive(false); }}>
                            <div className="nav-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <circle cx="12" cy="12" r="6"></circle>
                                    <circle cx="12" cy="12" r="2"></circle>
                                </svg>
                            </div>
                            <div className="nav-content">
                                <span className="nav-text">Goals</span>
                                <span className="nav-description">Track progress</span>
                            </div>
                        </a>
                        <a href="#" className={`nav-item ${activeView === 'groups' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('groups'); setSidebarActive(false); }}>
                            <div className="nav-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </div>
                            <div className="nav-content">
                                <span className="nav-text">Groups</span>
                                <span className="nav-description">Collaborate together</span>
                            </div>
                        </a>
                        <a href="#" className={`nav-item ${activeView === 'catalog' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('catalog'); setSidebarActive(false); }}>
                            <div className="nav-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="7" height="7" x="3" y="3" rx="1"></rect>
                                    <rect width="7" height="7" x="14" y="3" rx="1"></rect>
                                    <rect width="7" height="7" x="14" y="14" rx="1"></rect>
                                    <rect width="7" height="7" x="3" y="14" rx="1"></rect>
                                </svg>
                            </div>
                            <div className="nav-content">
                                <span className="nav-text">Catalog</span>
                                <span className="nav-description">Browse all courses</span>
                            </div>
                        </a>
                        <a href="#" className={`nav-item ${activeView === 'users' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('users'); setSidebarActive(false); }}>
                            <div className="nav-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </div>
                            <div className="nav-content">
                                <span className="nav-text">Users</span>
                                <span className="nav-description">Manage accounts</span>
                            </div>
                        </a>
                        <ToolsNavTooltip>
                            <a href="#" className={`nav-item ${activeView === 'tools' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('tools'); setSidebarActive(false); }}>
                                <div className="nav-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                                    </svg>
                                </div>
                                <div className="nav-content">
                                    <span className="nav-text">Tools</span>
                                    <span className="nav-description">Productivity utilities</span>
                                </div>
                            </a>
                        </ToolsNavTooltip>
                </nav>

                <div className="sidebar-bottom">
                        <a href="#" className="nav-item" id="settingsButton" onClick={openSettingsModal}>
                            <div className="nav-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path
                                        d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z">
                                    </path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </div>
                            <div className="nav-content">
                                <span className="nav-text">Settings</span>
                                <span className="nav-description">Preferences</span>
                            </div>
                        </a>
                        <HelpNavItem onSidebarClose={() => setSidebarActive(false)} />
                </div>
            </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="main-content">
                <AnimatePresence mode="wait">
                    {activeView === 'home' && (
                        <motion.div
                            key="home"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <HomeContent onShowWelcomeModal={showWelcomeModal} />
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
                            <ToolsContent />
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
                            <CourseViewPage 
                                course={selectedCourse} 
                                onBack={() => {
                                    // Return to the previous view (paths, tools, or home)
                                    setActiveView(previousView);
                                    setSelectedCourse(null);
                                }}
                            />
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
                            <PathsContent 
                                onPathSelect={(pathId) => {
                                    console.log('Selected path:', pathId);
                                    // Future: Navigate to path detail view
                                }}
                            />
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
                            <GoalsContent />
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
                            <UsersContent />
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
                            <CatalogContent />
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
                            <GroupsContent />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>





            {/* Floating Widgets Toggle Button - Always visible, outside AnimatePresence */}
            <WidgetsToggleButton 
                isWidgetsSidebarActive={widgetsSidebarActive}
                onToggle={toggleWidgetsSidebar}
            />

            {/* Widgets Sidebar */}
            <AnimatePresence mode="wait">
                {widgetsSidebarActive && (
                    <motion.aside 
                        className="widgets-sidebar active" 
                        id="widgets-sidebar"
                        initial={{ x: '100%', opacity: 0.5 }}
                        animate={{ 
                            x: 0, 
                            opacity: 1,
                            transition: {
                                type: 'spring',
                                stiffness: 300,
                                damping: 30,
                                mass: 0.8,
                            }
                        }}
                        exit={{ 
                            x: '100%', 
                            opacity: 0,
                            transition: {
                                type: 'spring',
                                stiffness: 400,
                                damping: 35,
                                mass: 0.6,
                            }
                        }}
                    >

                <div className="widgets-content" id="widgets-content-area">
                    <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-100">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <h2 className="text-base font-semibold text-zinc-800">Quick View</h2>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleWidgetsSidebar}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.button>
                    </div>

                    {/* Restore Widgets Button - Minimalistic */}
                    <AnimatePresence>
                        {hasHiddenWidgets && (
                            <motion.button
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={restoreAllWidgets}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-colors border-b border-zinc-100"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Show Hidden Widgets
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Quick Stats Card - Student Overview */}
                    <motion.div
                        key={`stats-${refreshTrigger}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className={`mx-3 mt-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white ${quickViewSettings.compactMode ? 'p-3' : 'p-4'}`}
                    >
                        <div className={`flex items-center justify-between ${quickViewSettings.compactMode ? 'mb-2' : 'mb-3'}`}>
                            <span className={`font-medium text-blue-100 ${quickViewSettings.compactMode ? 'text-[10px]' : 'text-xs'}`}>This Week</span>
                            <motion.div
                                whileHover={{ rotate: 180 }}
                                transition={{ duration: 0.3 }}
                                className={`rounded-full bg-white/20 flex items-center justify-center cursor-pointer ${quickViewSettings.compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                            >
                                <svg className={quickViewSettings.compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </motion.div>
                        </div>
                        <div className={`grid grid-cols-3 ${quickViewSettings.compactMode ? 'gap-2' : 'gap-3'}`}>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="text-center"
                            >
                                <div className={`font-bold ${quickViewSettings.compactMode ? 'text-xl' : 'text-2xl'}`}>{totalCourses}</div>
                                <div className={`text-blue-100 ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[10px]'}`}>Courses</div>
                            </motion.div>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="text-center border-x border-white/20"
                            >
                                <div className={`font-bold ${quickViewSettings.compactMode ? 'text-xl' : 'text-2xl'}`}>{upcomingDeadlines.length}</div>
                                <div className={`text-blue-100 ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[10px]'}`}>Due Soon</div>
                            </motion.div>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="text-center"
                            >
                                <div className={`font-bold ${quickViewSettings.compactMode ? 'text-xl' : 'text-2xl'}`}>{overallProgress}%</div>
                                <div className={`text-blue-100 ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[10px]'}`}>Progress</div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Study Streak - Gamification (controlled by Quick View Settings) */}
                    <AnimatePresence>
                        {quickViewSettings.showStreak && <StreakWidget compact={quickViewSettings.compactMode} />}
                    </AnimatePresence>

                    {/* Upcoming Deadlines - Student Priority (controlled by Quick View Settings) */}
                    <AnimatePresence>
                        {quickViewSettings.showUpcoming && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                                transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 }}
                                className={`mx-3 mt-3 bg-white rounded-xl border border-zinc-100 overflow-hidden ${quickViewSettings.compactMode ? 'compact-widget' : ''}`}
                            >
                                <div className={`flex items-center justify-between border-b border-zinc-50 ${quickViewSettings.compactMode ? 'px-3 py-2' : 'px-4 py-3'}`}>
                                    <div className="flex items-center gap-2.5">
                                        <div className={`rounded-lg bg-orange-50 flex items-center justify-center ${quickViewSettings.compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}>
                                            <svg className={`text-orange-500 ${quickViewSettings.compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <span className={`font-medium text-zinc-800 ${quickViewSettings.compactMode ? 'text-xs' : 'text-sm'}`}>Upcoming</span>
                                        {upcomingDeadlines.length > 0 && (
                                            <span className={`px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 ${quickViewSettings.compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                                                {upcomingDeadlines.length}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`text-zinc-400 ${quickViewSettings.compactMode ? 'text-[10px]' : 'text-xs'}`}>Next 7 days</span>
                                </div>
                                <div className={`space-y-1 ${quickViewSettings.compactMode ? 'p-2' : 'p-3 space-y-2'}`}>
                                    {upcomingDeadlines.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                            className={`flex flex-col items-center justify-center ${quickViewSettings.compactMode ? 'py-4' : 'py-6'}`}
                                        >
                                            <motion.div 
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                                                className={`rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100/80 flex items-center justify-center mb-3 ${quickViewSettings.compactMode ? 'w-10 h-10' : 'w-12 h-12'}`}
                                            >
                                                <motion.svg 
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: 1 }}
                                                    transition={{ duration: 0.5, delay: 0.3 }}
                                                    className={`text-emerald-500 ${quickViewSettings.compactMode ? 'w-5 h-5' : 'w-6 h-6'}`} 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </motion.svg>
                                            </motion.div>
                                            <motion.p 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                                className={`font-medium text-zinc-600 ${quickViewSettings.compactMode ? 'text-[11px]' : 'text-xs'}`}
                                            >
                                                You're all caught up!
                                            </motion.p>
                                            <motion.p 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.3 }}
                                                className={`text-zinc-400 mt-0.5 ${quickViewSettings.compactMode ? 'text-[9px]' : 'text-[10px]'}`}
                                            >
                                                No deadlines in the next 7 days
                                            </motion.p>
                                        </motion.div>
                                    ) : (
                                        <AnimatePresence mode="popLayout">
                                            {upcomingDeadlines.slice(0, 3).map((deadline, index) => {
                                                const dueInfo = formatDaysUntil(deadline.dueDate);
                                                const typeColor = getDeadlineTypeColor(deadline.type);
                                                return (
                                                    <motion.div
                                                        key={deadline.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 10 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        whileHover={{ x: 4 }}
                                                        className={`flex items-center gap-3 rounded-lg hover:bg-zinc-50 cursor-pointer transition-colors ${quickViewSettings.compactMode ? 'p-1.5' : 'p-2'}`}
                                                    >
                                                        <div className={`w-2 h-2 rounded-full ${typeColor}`} />
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`font-medium text-zinc-700 truncate ${quickViewSettings.compactMode ? 'text-[10px]' : 'text-xs'}`}>
                                                                {deadline.title}
                                                            </p>
                                                            <p className={`text-zinc-400 ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[10px]'}`}>
                                                                {deadline.courseName}
                                                            </p>
                                                        </div>
                                                        <span className={`font-medium ${dueInfo.color} ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[10px]'}`}>
                                                            {dueInfo.text}
                                                        </span>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    )}
                                </div>
                                <a
                                    href="#"
                                    className={`flex items-center justify-center gap-1.5 border-t border-zinc-50 text-blue-500 hover:bg-blue-50/50 transition-colors ${quickViewSettings.compactMode ? 'py-2 text-[10px]' : 'py-2.5 text-xs'}`}
                                >
                                    View all deadlines
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </a>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Section Divider */}
                    <div className="mx-3 mt-4 mb-2 flex items-center gap-2">
                        <div className="h-px flex-1 bg-zinc-100" />
                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Widgets</span>
                        <div className="h-px flex-1 bg-zinc-100" />
                    </div>

                    {/* Widget Container - Minimalistic Professional Design */}
                    <div className={`px-3 ${quickViewSettings.compactMode ? 'space-y-2' : 'space-y-3'}`}>

                    {/* Motivational Quote Widget - STI Colors (Blue & Yellow) */}
                    <AnimatePresence>
                        {widgetVisibility['quote-widget'] && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(30, 64, 175, 0.25)' }}
                                className={`bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-xl border border-blue-500/30 overflow-hidden ${quickViewSettings.compactMode ? 'shadow-none' : 'shadow-lg shadow-blue-900/20'}`}
                                id="quote-widget"
                            >
                                <div className={`relative ${quickViewSettings.compactMode ? 'p-3' : 'p-4'}`}>
                                    {/* Close button */}
                                    <motion.button
                                        whileHover={{ scale: 1.15, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => toggleWidget('quote-widget')}
                                        className={`absolute top-2 right-2 flex items-center justify-center rounded-md text-yellow-300/60 hover:text-white transition-colors ${quickViewSettings.compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                                    >
                                        <svg className={quickViewSettings.compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </motion.button>
                                    
                                    {/* Quote Icon */}
                                    <motion.div
                                        initial={{ scale: 0, rotate: -10 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                                        className="mb-2"
                                    >
                                        <svg className={`text-yellow-400 ${quickViewSettings.compactMode ? 'w-5 h-5' : 'w-6 h-6'}`} fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                                        </svg>
                                    </motion.div>
                                    
                                    {/* Quote Text */}
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 }}
                                        className={`text-yellow-300 leading-relaxed font-medium italic ${quickViewSettings.compactMode ? 'text-[11px]' : 'text-xs'}`}
                                    >
                                        "{todaysQuote.text}"
                                    </motion.p>
                                    
                                    {/* Author */}
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.25 }}
                                        className={`text-yellow-400 mt-2 font-semibold ${quickViewSettings.compactMode ? 'text-[9px]' : 'text-[10px]'}`}
                                    >
                                        â€” {todaysQuote.author}
                                    </motion.p>
                                    
                                    {/* Daily indicator */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className={`flex items-center gap-1 mt-3 pt-2 border-t border-blue-500/30`}
                                    >
                                        <svg className={`text-yellow-400 ${quickViewSettings.compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        <span className={`text-yellow-300/80 ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[9px]'}`}>
                                            Daily inspiration
                                        </span>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Weather Widget */}
                    <AnimatePresence>
                        {widgetVisibility['weather-widget'] && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                className={`bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 rounded-xl border border-sky-100/60 overflow-hidden ${quickViewSettings.compactMode ? 'shadow-none' : 'shadow-sm'}`}
                                id="weather-widget"
                            >
                                <div className={`relative ${quickViewSettings.compactMode ? 'p-3' : 'p-4'}`}>
                                    {/* Close button */}
                                    <motion.button
                                        whileHover={{ scale: 1.15, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => toggleWidget('weather-widget')}
                                        className={`absolute top-2 right-2 flex items-center justify-center rounded-md text-sky-300 hover:text-red-400 transition-colors ${quickViewSettings.compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                                    >
                                        <svg className={quickViewSettings.compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </motion.button>
                                    
                                    {weatherLoading ? (
                                        <div className="flex items-center justify-center py-4">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                className="w-6 h-6 border-2 border-sky-200 border-t-sky-500 rounded-full"
                                            />
                                        </div>
                                    ) : weatherError ? (
                                        <div className="flex flex-col items-center justify-center py-4">
                                            <svg className="w-8 h-8 text-sky-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                            </svg>
                                            <p className={`text-sky-400 ${quickViewSettings.compactMode ? 'text-[10px]' : 'text-xs'}`}>{weatherError}</p>
                                        </div>
                                    ) : weather && (
                                        <div className="flex items-center gap-3">
                                            {/* Weather Icon */}
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                                className={`flex-shrink-0 ${quickViewSettings.compactMode ? 'w-12 h-12' : 'w-14 h-14'}`}
                                            >
                                                {weather.icon === 'sunny' && (
                                                    <motion.svg 
                                                        animate={{ rotate: [0, 10, -10, 0] }}
                                                        transition={{ duration: 4, repeat: Infinity }}
                                                        className="w-full h-full text-amber-400" fill="currentColor" viewBox="0 0 24 24"
                                                    >
                                                        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                                                    </motion.svg>
                                                )}
                                                {weather.icon === 'night' && (
                                                    <svg className="w-full h-full text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                                                    </svg>
                                                )}
                                                {weather.icon === 'cloudy' && (
                                                    <svg className="w-full h-full text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z" />
                                                    </svg>
                                                )}
                                                {weather.icon === 'partly-cloudy' && (
                                                    <svg className="w-full h-full text-sky-400" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z" />
                                                    </svg>
                                                )}
                                                {weather.icon === 'rainy' && (
                                                    <svg className="w-full h-full text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z" />
                                                    </svg>
                                                )}
                                                {weather.icon === 'stormy' && (
                                                    <svg className="w-full h-full text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z" />
                                                    </svg>
                                                )}
                                            </motion.div>
                                            
                                            {/* Weather Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline gap-1">
                                                    <motion.span
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className={`font-bold text-slate-700 ${quickViewSettings.compactMode ? 'text-2xl' : 'text-3xl'}`}
                                                    >
                                                        {weather.temperature}Â°
                                                    </motion.span>
                                                    <span className={`text-slate-400 ${quickViewSettings.compactMode ? 'text-[10px]' : 'text-xs'}`}>C</span>
                                                </div>
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.1 }}
                                                    className={`text-slate-600 font-medium ${quickViewSettings.compactMode ? 'text-[10px]' : 'text-xs'}`}
                                                >
                                                    {weather.condition}
                                                </motion.p>
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.2 }}
                                                    className={`flex items-center gap-2 mt-1 text-slate-400 ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[9px]'}`}
                                                >
                                                    <span className="flex items-center gap-0.5">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                                        </svg>
                                                        {weather.location}
                                                    </span>
                                                    <span>â€¢</span>
                                                    <span>{weather.humidity}% humidity</span>
                                                </motion.div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Recent Activity Widget */}
                    <AnimatePresence>
                        {widgetVisibility['activity-widget'] && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                className={`bg-white rounded-xl border border-zinc-100/80 overflow-hidden ${quickViewSettings.compactMode ? 'shadow-none' : 'shadow-sm'}`}
                                id="activity-widget"
                            >
                                <div className={`flex items-center justify-between ${quickViewSettings.compactMode ? 'px-3 py-2' : 'px-4 py-3'}`}>
                                    <div className="flex items-center gap-2">
                                        <motion.div 
                                            whileHover={{ scale: 1.05 }}
                                            className={`rounded-lg bg-gradient-to-br from-violet-50 to-purple-100/50 flex items-center justify-center ${quickViewSettings.compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}
                                        >
                                            <svg className={`text-violet-500 ${quickViewSettings.compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </motion.div>
                                        <span className={`font-medium text-zinc-700 ${quickViewSettings.compactMode ? 'text-xs' : 'text-sm'}`}>Recent Activity</span>
                                        {recentActivities.length > 0 && (
                                            <span className={`px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 ${quickViewSettings.compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                                                {recentActivities.length}
                                            </span>
                                        )}
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.15, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => toggleWidget('activity-widget')}
                                        className={`flex items-center justify-center rounded-md text-zinc-300 hover:text-red-400 transition-colors ${quickViewSettings.compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                                    >
                                        <svg className={quickViewSettings.compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </motion.button>
                                </div>
                                
                                {/* Activity List */}
                                <div className={`${quickViewSettings.compactMode ? 'px-3 pb-3' : 'px-4 pb-4'}`}>
                                    {recentActivities.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex flex-col items-center justify-center ${quickViewSettings.compactMode ? 'py-4' : 'py-6'}`}
                                        >
                                            <motion.div 
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                className={`rounded-full bg-gradient-to-br from-violet-50 to-purple-100/80 flex items-center justify-center mb-3 ${quickViewSettings.compactMode ? 'w-10 h-10' : 'w-12 h-12'}`}
                                            >
                                                <svg className={`text-violet-400 ${quickViewSettings.compactMode ? 'w-5 h-5' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                </svg>
                                            </motion.div>
                                            <motion.p 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.1 }}
                                                className={`font-medium text-zinc-600 ${quickViewSettings.compactMode ? 'text-[11px]' : 'text-xs'}`}
                                            >
                                                No recent activity
                                            </motion.p>
                                            <motion.p 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                                className={`text-zinc-400 mt-0.5 ${quickViewSettings.compactMode ? 'text-[9px]' : 'text-[10px]'}`}
                                            >
                                                Start exploring courses
                                            </motion.p>
                                        </motion.div>
                                    ) : (
                                        <div className="space-y-1">
                                            <AnimatePresence mode="popLayout">
                                                {recentActivities.slice(0, 5).map((activity, index) => (
                                                    <motion.div
                                                        key={activity.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 10 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        whileHover={{ x: 4, backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
                                                        className={`flex items-center gap-2.5 rounded-lg cursor-pointer transition-colors ${quickViewSettings.compactMode ? 'p-1.5' : 'p-2'}`}
                                                    >
                                                        <div className={`flex-shrink-0 rounded-md flex items-center justify-center ${
                                                            activity.type === 'course_access' ? 'bg-blue-50 text-blue-500' :
                                                            activity.type === 'material_view' ? 'bg-amber-50 text-amber-500' :
                                                            activity.type === 'module_complete' ? 'bg-emerald-50 text-emerald-500' :
                                                            'bg-violet-50 text-violet-500'
                                                        } ${quickViewSettings.compactMode ? 'w-6 h-6' : 'w-7 h-7'}`}>
                                                            {activity.type === 'course_access' && (
                                                                <svg className={quickViewSettings.compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                                </svg>
                                                            )}
                                                            {activity.type === 'material_view' && (
                                                                <svg className={quickViewSettings.compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                            )}
                                                            {activity.type === 'module_complete' && (
                                                                <svg className={quickViewSettings.compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            )}
                                                            {(activity.type === 'assignment_submit' || activity.type === 'quiz_complete') && (
                                                                <svg className={quickViewSettings.compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`font-medium text-zinc-700 truncate ${quickViewSettings.compactMode ? 'text-[10px]' : 'text-xs'}`}>
                                                                {activity.title}
                                                            </p>
                                                            {activity.subtitle && (
                                                                <p className={`text-zinc-400 truncate ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[10px]'}`}>
                                                                    {activity.subtitle}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <span className={`flex-shrink-0 text-zinc-400 ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[10px]'}`}>
                                                            {formatRelativeTime(activity.timestamp)}
                                                        </span>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Course Progress Widget */}
                    <AnimatePresence>
                        {widgetVisibility['courses-widget'] && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                className={`bg-white rounded-xl border border-zinc-100/80 overflow-hidden ${quickViewSettings.compactMode ? 'shadow-none' : 'shadow-sm'}`}
                                id="courses-widget"
                            >
                                <div className={`flex items-center justify-between ${quickViewSettings.compactMode ? 'px-3 py-2' : 'px-4 py-3'}`}>
                                    <div className="flex items-center gap-2">
                                        <motion.div 
                                            whileHover={{ scale: 1.05 }}
                                            className={`rounded-lg bg-gradient-to-br from-indigo-50 to-purple-100/50 flex items-center justify-center ${quickViewSettings.compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}
                                        >
                                            <svg className={`text-indigo-500 ${quickViewSettings.compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </motion.div>
                                        <span className={`font-medium text-zinc-700 ${quickViewSettings.compactMode ? 'text-xs' : 'text-sm'}`}>My Courses</span>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.15, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => toggleWidget('courses-widget')}
                                        className={`flex items-center justify-center rounded-md text-zinc-300 hover:text-red-400 transition-colors ${quickViewSettings.compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                                    >
                                        <svg className={quickViewSettings.compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </motion.button>
                                </div>
                                
                                {/* Course List */}
                                <div className={`${quickViewSettings.compactMode ? 'px-3 pb-3' : 'px-4 pb-4'}`}>
                                    {(() => {
                                        const courseProgress = getCourseProgressData();
                                        const courseNames: Record<string, string> = {
                                            'cp1': 'Computer Programming 1',
                                            'euth1': 'Euthenics 1',
                                            'itc': 'Intro to Computing',
                                            'nstp1': 'NSTP 1',
                                            'pe1': 'PE/PATHFIT 1',
                                            'ppc': 'Philippine Popular Culture',
                                            'purcom': 'Purposive Communication',
                                            'tcw': 'The Contemporary World',
                                            'uts': 'Understanding the Self',
                                        };
                                        
                                        // Get top 3 courses sorted by last accessed (most recent first)
                                        const sortedCourses = Object.entries(courseProgress)
                                            .map(([id, data]) => ({ id, ...data, name: courseNames[id] || id }))
                                            .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
                                            .slice(0, 3);
                                        
                                        if (sortedCourses.length === 0) {
                                            return (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`flex flex-col items-center justify-center ${quickViewSettings.compactMode ? 'py-4' : 'py-6'}`}
                                                >
                                                    <motion.div 
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                        className={`rounded-full bg-gradient-to-br from-indigo-50 to-purple-100/80 flex items-center justify-center mb-3 ${quickViewSettings.compactMode ? 'w-10 h-10' : 'w-12 h-12'}`}
                                                    >
                                                        <svg className={`text-indigo-400 ${quickViewSettings.compactMode ? 'w-5 h-5' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                        </svg>
                                                    </motion.div>
                                                    <motion.p 
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: 0.1 }}
                                                        className={`font-medium text-zinc-600 ${quickViewSettings.compactMode ? 'text-[11px]' : 'text-xs'}`}
                                                    >
                                                        No courses yet
                                                    </motion.p>
                                                </motion.div>
                                            );
                                        }
                                        
                                        return (
                                            <div className="space-y-2">
                                                {sortedCourses.map((course, index) => {
                                                    const progressColor = course.progress >= 80 ? 'bg-emerald-500' : 
                                                                        course.progress >= 50 ? 'bg-blue-500' : 
                                                                        course.progress >= 20 ? 'bg-amber-500' : 'bg-zinc-300';
                                                    const progressBg = course.progress >= 80 ? 'bg-emerald-100' : 
                                                                      course.progress >= 50 ? 'bg-blue-100' : 
                                                                      course.progress >= 20 ? 'bg-amber-100' : 'bg-zinc-100';
                                                    
                                                    return (
                                                        <motion.div
                                                            key={course.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: index * 0.05 }}
                                                            whileHover={{ x: 4, backgroundColor: 'rgba(99, 102, 241, 0.05)' }}
                                                            onClick={() => {
                                                                // Navigate to course
                                                                const courseData = {
                                                                    id: course.id,
                                                                    title: `${course.name} - SY2526-1T`,
                                                                    subtitle: `BSIT101A`,
                                                                    image: '',
                                                                    progress: course.progress
                                                                };
                                                                setSelectedCourse(courseData);
                                                                setActiveView('course');
                                                            }}
                                                            className={`rounded-lg cursor-pointer transition-colors ${quickViewSettings.compactMode ? 'p-2' : 'p-2.5'}`}
                                                        >
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <p className={`font-medium text-zinc-700 truncate flex-1 ${quickViewSettings.compactMode ? 'text-[10px]' : 'text-xs'}`}>
                                                                    {course.name}
                                                                </p>
                                                                <span className={`font-semibold ml-2 ${
                                                                    course.progress >= 80 ? 'text-emerald-600' : 
                                                                    course.progress >= 50 ? 'text-blue-600' : 
                                                                    course.progress >= 20 ? 'text-amber-600' : 'text-zinc-500'
                                                                } ${quickViewSettings.compactMode ? 'text-[10px]' : 'text-xs'}`}>
                                                                    {course.progress}%
                                                                </span>
                                                            </div>
                                                            {/* Progress Bar */}
                                                            <div className={`w-full rounded-full overflow-hidden ${progressBg} ${quickViewSettings.compactMode ? 'h-1' : 'h-1.5'}`}>
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${course.progress}%` }}
                                                                    transition={{ delay: index * 0.1 + 0.2, duration: 0.5, ease: 'easeOut' }}
                                                                    className={`h-full rounded-full ${progressColor}`}
                                                                />
                                                            </div>
                                                            <p className={`text-zinc-400 mt-1 ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[9px]'}`}>
                                                                {course.completedModules}/{course.totalModules} modules
                                                            </p>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Study Insights Widget */}
                    <AnimatePresence>
                        {widgetVisibility['mastery-widget'] && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                className={`bg-white rounded-xl border border-zinc-100/80 overflow-hidden ${quickViewSettings.compactMode ? 'shadow-none' : 'shadow-sm'}`}
                                id="mastery-widget"
                            >
                                <div className={`flex items-center justify-between ${quickViewSettings.compactMode ? 'px-3 py-2' : 'px-4 py-3'}`}>
                                    <div className="flex items-center gap-2">
                                        <motion.div 
                                            whileHover={{ scale: 1.05 }}
                                            className={`rounded-lg bg-gradient-to-br from-cyan-50 to-blue-100/50 flex items-center justify-center ${quickViewSettings.compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}
                                        >
                                            <svg className={`text-cyan-500 ${quickViewSettings.compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </motion.div>
                                        <span className={`font-medium text-zinc-700 ${quickViewSettings.compactMode ? 'text-xs' : 'text-sm'}`}>Study Insights</span>
                                        {studyInsights.trend !== 'stable' && (
                                            <span className={`px-1.5 py-0.5 rounded-full ${
                                                studyInsights.trend === 'up' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                            } ${quickViewSettings.compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                                                {studyInsights.trend === 'up' ? 'â†‘' : 'â†“'} {Math.abs(studyInsights.trendPercent)}%
                                            </span>
                                        )}
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.15, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => toggleWidget('mastery-widget')}
                                        className={`flex items-center justify-center rounded-md text-zinc-300 hover:text-red-400 transition-colors ${quickViewSettings.compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                                    >
                                        <svg className={quickViewSettings.compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </motion.button>
                                </div>
                                
                                {/* Mini Bar Chart */}
                                <div className={`${quickViewSettings.compactMode ? 'px-3 pb-3' : 'px-4 pb-4'}`}>
                                    {/* Chart Area */}
                                    <div className={`flex items-end justify-between gap-1 ${quickViewSettings.compactMode ? 'h-12 mb-2' : 'h-16 mb-3'}`}>
                                        {studyInsights.dailyData.map((day, index) => {
                                            const maxMinutes = Math.max(...studyInsights.dailyData.map(d => d.minutes), 1);
                                            const heightPercent = (day.minutes / maxMinutes) * 100;
                                            const isToday = index === studyInsights.dailyData.length - 1;
                                            
                                            return (
                                                <motion.div
                                                    key={day.date}
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${Math.max(heightPercent, 8)}%` }}
                                                    transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                                                    className={`flex-1 rounded-t-sm ${
                                                        isToday 
                                                            ? 'bg-gradient-to-t from-cyan-500 to-blue-400' 
                                                            : day.minutes > 0 
                                                                ? 'bg-gradient-to-t from-cyan-200 to-cyan-100' 
                                                                : 'bg-zinc-100'
                                                    }`}
                                                    style={{ minHeight: '4px' }}
                                                />
                                            );
                                        })}
                                    </div>
                                    
                                    {/* Day Labels */}
                                    <div className="flex justify-between gap-1 mb-3">
                                        {studyInsights.dailyData.map((day, index) => {
                                            const isToday = index === studyInsights.dailyData.length - 1;
                                            return (
                                                <span 
                                                    key={day.date} 
                                                    className={`flex-1 text-center ${
                                                        isToday ? 'text-cyan-600 font-medium' : 'text-zinc-400'
                                                    } ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[9px]'}`}
                                                >
                                                    {day.dayName}
                                                </span>
                                            );
                                        })}
                                    </div>
                                    
                                    {/* Stats Row */}
                                    <div className={`flex items-center justify-between pt-2 border-t border-zinc-100 ${quickViewSettings.compactMode ? 'gap-2' : 'gap-3'}`}>
                                        <div className="flex-1 text-center">
                                            <p className={`font-semibold text-zinc-700 ${quickViewSettings.compactMode ? 'text-[11px]' : 'text-xs'}`}>
                                                {formatMinutesToHours(studyInsights.totalWeekMinutes)}
                                            </p>
                                            <p className={`text-zinc-400 ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[9px]'}`}>This Week</p>
                                        </div>
                                        <div className="w-px h-6 bg-zinc-100" />
                                        <div className="flex-1 text-center">
                                            <p className={`font-semibold text-zinc-700 ${quickViewSettings.compactMode ? 'text-[11px]' : 'text-xs'}`}>
                                                {formatMinutesToHours(studyInsights.avgDailyMinutes)}
                                            </p>
                                            <p className={`text-zinc-400 ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[9px]'}`}>Daily Avg</p>
                                        </div>
                                        {studyInsights.bestDay && (
                                            <>
                                                <div className="w-px h-6 bg-zinc-100" />
                                                <div className="flex-1 text-center">
                                                    <p className={`font-semibold text-cyan-600 ${quickViewSettings.compactMode ? 'text-[11px]' : 'text-xs'}`}>
                                                        {studyInsights.bestDay.name}
                                                    </p>
                                                    <p className={`text-zinc-400 ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[9px]'}`}>Best Day</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Calendar Widget */}
                    <AnimatePresence>
                        {widgetVisibility['calendar-widget'] && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                className={`bg-white rounded-xl border border-zinc-100/80 overflow-hidden ${quickViewSettings.compactMode ? 'shadow-none' : 'shadow-sm'}`}
                                id="calendar-widget"
                            >
                                <div className={`flex items-center justify-between ${quickViewSettings.compactMode ? 'px-3 py-2' : 'px-4 py-3'}`}>
                                    <div className="flex items-center gap-2">
                                        <motion.div 
                                            whileHover={{ scale: 1.05 }}
                                            className={`rounded-lg bg-gradient-to-br from-violet-50 to-violet-100/50 flex items-center justify-center ${quickViewSettings.compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}
                                        >
                                            <svg className={`text-violet-500 ${quickViewSettings.compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </motion.div>
                                        <span className={`font-medium text-zinc-700 ${quickViewSettings.compactMode ? 'text-xs' : 'text-sm'}`}>Calendar</span>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.15, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => toggleWidget('calendar-widget')}
                                        className={`flex items-center justify-center rounded-md text-zinc-300 hover:text-red-400 transition-colors ${quickViewSettings.compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                                    >
                                        <svg className={quickViewSettings.compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </motion.button>
                                </div>
                                <div className={quickViewSettings.compactMode ? 'p-2' : 'p-3'}>
                                    {/* Mini Calendar Month Navigation */}
                                    <div className={`flex items-center justify-between ${quickViewSettings.compactMode ? 'mb-2' : 'mb-3'}`}>
                                        <motion.button
                                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.05)' }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                                            className={`flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 ${quickViewSettings.compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                                        >
                                            <svg className={quickViewSettings.compactMode ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </motion.button>
                                        <span className={`font-medium text-zinc-600 ${quickViewSettings.compactMode ? 'text-[10px]' : 'text-xs'}`}>
                                            {calendarData.monthName}
                                        </span>
                                        <motion.button
                                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.05)' }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                                            className={`flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 ${quickViewSettings.compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                                        >
                                            <svg className={quickViewSettings.compactMode ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </motion.button>
                                    </div>
                                    {/* Mini Calendar Day Headers */}
                                    <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                            <div key={i} className={`font-medium text-zinc-400 ${quickViewSettings.compactMode ? 'text-[8px] py-0.5' : 'text-[9px] py-1'}`}>{day}</div>
                                        ))}
                                    </div>
                                    {/* Mini Calendar Grid - Using dynamic calendarData */}
                                    <div className="grid grid-cols-7 gap-1 text-center">
                                        {calendarData.days.slice(0, 35).map((dayData, i) => {
                                            const dayDeadlines = hasDeadlines(dayData.date);
                                            return (
                                                <motion.div
                                                    key={i}
                                                    whileHover={!dayData.isCurrentMonth ? {} : { scale: 1.08, color: dayData.isToday ? 'rgb(255, 255, 255)' : 'rgb(59, 130, 246)' }}
                                                    whileTap={{ scale: 0.95 }}
                                                    transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
                                                    className={`relative rounded-md cursor-pointer ${quickViewSettings.compactMode ? 'text-[9px] py-1' : 'text-[11px] py-1.5'} ${
                                                        !dayData.isCurrentMonth
                                                            ? 'text-zinc-300 cursor-default'
                                                            : dayData.isToday
                                                            ? 'bg-blue-500 text-white font-semibold shadow-md shadow-blue-200/50'
                                                            : 'text-zinc-700 font-medium'
                                                    }`}
                                                >
                                                    {dayData.day}
                                                    {/* Deadline indicator dot */}
                                                    {dayDeadlines && dayData.isCurrentMonth && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className={`absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full ${
                                                                dayData.isToday ? 'bg-white' : 'bg-orange-500'
                                                            } ${quickViewSettings.compactMode ? 'w-1 h-1' : 'w-1.5 h-1.5'}`}
                                                        />
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                    <motion.button
                                        whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setCalendarView(calendarView === 'mini' ? 'full' : 'mini')}
                                        className={`flex items-center justify-center gap-1.5 w-full border-t border-zinc-50 text-blue-500 transition-colors ${quickViewSettings.compactMode ? 'mt-2 py-2 text-[9px]' : 'mt-3 py-2.5 text-xs'}`}
                                    >
                                        {calendarView === 'mini' ? 'Full calendar' : 'Mini view'}
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={calendarView === 'mini' ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
                                        </svg>
                                    </motion.button>
                                </div>
                                
                                {/* Full Calendar View with Deadlines */}
                                <AnimatePresence>
                                    {calendarView === 'full' && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden border-t border-zinc-100"
                                        >
                                            <div className={`${quickViewSettings.compactMode ? 'p-2' : 'p-3'}`}>
                                                {/* Month Navigation */}
                                                <div className={`flex items-center justify-between ${quickViewSettings.compactMode ? 'mb-2' : 'mb-3'}`}>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.05)' }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                                                        className={`flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 ${quickViewSettings.compactMode ? 'w-6 h-6' : 'w-7 h-7'}`}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                        </svg>
                                                    </motion.button>
                                                    <span className={`font-semibold text-zinc-700 ${quickViewSettings.compactMode ? 'text-xs' : 'text-sm'}`}>
                                                        {calendarData.monthName}
                                                    </span>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.05)' }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                                                        className={`flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 ${quickViewSettings.compactMode ? 'w-6 h-6' : 'w-7 h-7'}`}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </motion.button>
                                                </div>
                                                
                                                {/* Day Headers */}
                                                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                                                        <div key={i} className={`font-semibold text-zinc-500 ${quickViewSettings.compactMode ? 'text-[9px] py-1' : 'text-[10px] py-1.5'}`}>
                                                            {day}
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                {/* Calendar Grid */}
                                                <div className="grid grid-cols-7 gap-1">
                                                    {calendarData.days.map((dayData, i) => {
                                                        const dayDeadlines = hasDeadlines(dayData.date);
                                                        return (
                                                            <motion.div
                                                                key={i}
                                                                whileHover={dayData.isCurrentMonth ? { scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 0.1)' } : {}}
                                                                className={`relative rounded-lg text-center cursor-pointer ${quickViewSettings.compactMode ? 'py-1.5' : 'py-2'} ${
                                                                    !dayData.isCurrentMonth
                                                                        ? 'text-zinc-300'
                                                                        : dayData.isToday
                                                                        ? 'bg-blue-500 text-white font-bold shadow-md'
                                                                        : 'text-zinc-700 font-medium hover:bg-zinc-50'
                                                                }`}
                                                            >
                                                                <span className={quickViewSettings.compactMode ? 'text-[10px]' : 'text-xs'}>
                                                                    {dayData.day}
                                                                </span>
                                                                {dayDeadlines && dayData.isCurrentMonth && (
                                                                    <motion.div
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-full ${
                                                                            dayData.isToday ? 'bg-white' : 'bg-orange-500'
                                                                        } ${quickViewSettings.compactMode ? 'w-1 h-1' : 'w-1.5 h-1.5'}`}
                                                                    />
                                                                )}
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                                
                                                {/* Upcoming Deadlines Section */}
                                                <div className={`mt-3 pt-3 border-t border-zinc-100`}>
                                                    <div className={`flex items-center gap-2 mb-2`}>
                                                        <svg className={`text-orange-500 ${quickViewSettings.compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span className={`font-semibold text-zinc-700 ${quickViewSettings.compactMode ? 'text-[10px]' : 'text-xs'}`}>
                                                            Upcoming Deadlines
                                                        </span>
                                                    </div>
                                                    {upcomingDeadlines.length === 0 ? (
                                                        <p className={`text-zinc-400 text-center py-2 ${quickViewSettings.compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                                                            No upcoming deadlines
                                                        </p>
                                                    ) : (
                                                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                                            {upcomingDeadlines.slice(0, 5).map((deadline, idx) => {
                                                                const dueDate = new Date(deadline.dueDate);
                                                                const typeColor = getDeadlineTypeColor(deadline.type);
                                                                return (
                                                                    <motion.div
                                                                        key={deadline.id}
                                                                        initial={{ opacity: 0, x: -10 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        transition={{ delay: idx * 0.05 }}
                                                                        className={`flex items-center gap-2 rounded-lg bg-zinc-50 ${quickViewSettings.compactMode ? 'p-1.5' : 'p-2'}`}
                                                                    >
                                                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${typeColor}`} />
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className={`font-medium text-zinc-700 truncate ${quickViewSettings.compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                                                                                {deadline.title}
                                                                            </p>
                                                                            <p className={`text-zinc-400 ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[9px]'}`}>
                                                                                {deadline.courseName}
                                                                            </p>
                                                                        </div>
                                                                        <span className={`text-zinc-500 flex-shrink-0 ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[9px]'}`}>
                                                                            {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                        </span>
                                                                    </motion.div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* To-do Widget */}
                    <AnimatePresence>
                        {widgetVisibility['todo-widget'] && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                className={`bg-white rounded-xl border border-zinc-100/80 overflow-hidden ${quickViewSettings.compactMode ? 'shadow-none' : 'shadow-sm'}`}
                                id="todo-widget"
                            >
                                {/* Header */}
                                <div className={`flex items-center justify-between ${quickViewSettings.compactMode ? 'px-3 py-2' : 'px-4 py-3'}`}>
                                    <div className="flex items-center gap-2">
                                        <motion.div 
                                            whileHover={{ scale: 1.05 }}
                                            className={`rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50 flex items-center justify-center ${quickViewSettings.compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}
                                        >
                                            <svg className={`text-amber-500 ${quickViewSettings.compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </motion.div>
                                        <span className={`font-medium text-zinc-700 ${quickViewSettings.compactMode ? 'text-xs' : 'text-sm'}`}>To-do</span>
                                        <motion.span
                                            key={todos.length}
                                            initial={{ scale: 1.3 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 500 }}
                                            className={`px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 ${quickViewSettings.compactMode ? 'text-[9px]' : 'text-[10px]'}`}
                                        >
                                            {todos.length}
                                        </motion.span>
                                        {completedCount > 0 && (
                                            <motion.span
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className={`text-emerald-500 ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[10px]'}`}
                                            >
                                                {completedCount} done
                                            </motion.span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <motion.button
                                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setIsAddingTodo(true)}
                                            className={`flex items-center justify-center rounded-md text-blue-500 hover:text-blue-600 transition-colors ${quickViewSettings.compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                                        >
                                            <svg className={quickViewSettings.compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </motion.button>
                                        {todos.length > 0 && (
                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={clearAllTodos}
                                                className={`flex items-center justify-center rounded-md text-zinc-400 hover:text-red-500 transition-colors ${quickViewSettings.compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                                                title="Clear all tasks"
                                            >
                                                <svg className={quickViewSettings.compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </motion.button>
                                        )}
                                        <motion.button
                                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => toggleWidget('todo-widget')}
                                            className={`flex items-center justify-center rounded-md text-zinc-300 hover:text-red-400 transition-colors ${quickViewSettings.compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                                        >
                                            <svg className={quickViewSettings.compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Add Todo Input */}
                                <AnimatePresence>
                                    {isAddingTodo && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden border-b border-zinc-50"
                                        >
                                            <div className="p-3 flex items-center gap-2">
                                                <input
                                                    ref={todoInputRef}
                                                    type="text"
                                                    value={newTodoText}
                                                    onChange={(e) => setNewTodoText(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') addTodo();
                                                        if (e.key === 'Escape') {
                                                            setIsAddingTodo(false);
                                                            setNewTodoText('');
                                                        }
                                                    }}
                                                    placeholder="What needs to be done?"
                                                    className="flex-1 text-sm bg-zinc-50 rounded-lg px-3 py-2 border-none outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-zinc-400"
                                                />
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={addTodo}
                                                    disabled={!newTodoText.trim()}
                                                    className="px-3 py-2 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Add
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        setIsAddingTodo(false);
                                                        setNewTodoText('');
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Todo List */}
                                <div className="max-h-64 overflow-y-auto">
                                    {todos.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="px-4 py-8 flex flex-col items-center justify-center"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center mb-3">
                                                <svg className="w-6 h-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm text-zinc-400 mb-2">No tasks yet</p>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setIsAddingTodo(true)}
                                                className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
                                            >
                                                + Add your first task
                                            </motion.button>
                                        </motion.div>
                                    ) : (
                                        <motion.ul layout className="p-2 space-y-1">
                                            <AnimatePresence mode="popLayout">
                                                {todos.map((todo) => (
                                                    <motion.li
                                                        key={todo.id}
                                                        layout
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 20, transition: { duration: 0.15 } }}
                                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                        className="group flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-50 transition-colors"
                                                    >
                                                        {/* Checkbox */}
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => toggleTodo(todo.id)}
                                                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                                                                todo.completed
                                                                    ? 'bg-blue-500 border-blue-500'
                                                                    : 'border-zinc-300 hover:border-blue-400 hover:bg-blue-50'
                                                            }`}
                                                        >
                                                            <AnimatePresence>
                                                                {todo.completed && (
                                                                    <motion.svg
                                                                        initial={{ scale: 0, opacity: 0 }}
                                                                        animate={{ scale: 1, opacity: 1 }}
                                                                        exit={{ scale: 0, opacity: 0 }}
                                                                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                                                        className="w-3 h-3 text-white"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                    </motion.svg>
                                                                )}
                                                            </AnimatePresence>
                                                        </motion.button>

                                                        {/* Text */}
                                                        <motion.span
                                                            animate={{ 
                                                                color: todo.completed ? '#a1a1aa' : '#3f3f46',
                                                                textDecoration: todo.completed ? 'line-through' : 'none'
                                                            }}
                                                            transition={{ duration: 0.2 }}
                                                            className="flex-1 text-[13px]"
                                                        >
                                                            {todo.text}
                                                        </motion.span>

                                                        {/* Delete button */}
                                                        <motion.button
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => deleteTodo(todo.id)}
                                                            className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </motion.button>
                                                    </motion.li>
                                                ))}
                                            </AnimatePresence>
                                        </motion.ul>
                                    )}
                                </div>

                                {/* Progress Footer */}
                                {todos.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                        className="px-3 py-2.5 border-t border-zinc-100 bg-zinc-50/30"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] text-zinc-500 font-medium">
                                                {completedCount} of {todos.length} completed
                                            </span>
                                            {completedCount === todos.length && todos.length > 0 && (
                                                <motion.span
                                                    initial={{ opacity: 0, scale: 0.8, y: 5 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                                    className="text-[10px] text-blue-500 font-medium flex items-center gap-1"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    All done!
                                                </motion.span>
                                            )}
                                        </div>
                                        <div className="h-1.5 bg-zinc-200/60 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${todos.length > 0 ? (completedCount / todos.length) * 100 : 0}%` }}
                                                transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.1 }}
                                                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Announcements Widget */}
                    <AnimatePresence>
                        {widgetVisibility['announcements-widget'] && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                className={`bg-white rounded-xl border border-zinc-100/80 overflow-hidden ${quickViewSettings.compactMode ? 'shadow-none' : 'shadow-sm'}`}
                                id="announcements-widget"
                            >
                                <div className={`flex items-center justify-between ${quickViewSettings.compactMode ? 'px-3 py-2' : 'px-4 py-3'}`}>
                                    <div className="flex items-center gap-2">
                                        <motion.div 
                                            whileHover={{ scale: 1.05 }}
                                            className={`rounded-lg bg-gradient-to-br from-rose-50 to-rose-100/50 flex items-center justify-center ${quickViewSettings.compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}
                                        >
                                            <svg className={`text-rose-500 ${quickViewSettings.compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                            </svg>
                                        </motion.div>
                                        <span className={`font-medium text-zinc-700 ${quickViewSettings.compactMode ? 'text-xs' : 'text-sm'}`}>Announcements</span>
                                        <span className={`px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-500 ${quickViewSettings.compactMode ? 'text-[9px]' : 'text-[10px]'}`}>New</span>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleWidget('announcements-widget')}
                                        className={`flex items-center justify-center rounded-md text-zinc-300 hover:text-red-400 transition-colors ${quickViewSettings.compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                                    >
                                        <svg className={quickViewSettings.compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </motion.button>
                                </div>
                                
                                {/* Announcement Content */}
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="px-3 pb-3"
                                >
                                    {/* Featured Image */}
                                    <motion.div 
                                        whileHover={{ scale: 1.02 }}
                                        transition={{ type: 'tween', duration: 0.2 }}
                                        className="relative rounded-lg overflow-hidden mb-3"
                                    >
                                        <img 
                                            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=200&fit=crop&crop=center" 
                                            alt="Revamped eLMS"
                                            className={`w-full object-cover ${quickViewSettings.compactMode ? 'h-20' : 'h-24'}`}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                        <div className="absolute bottom-2 left-2 right-2">
                                            <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[9px] font-medium">
                                                Featured
                                            </span>
                                        </div>
                                    </motion.div>
                                    
                                    {/* Title & Description */}
                                    <div className="space-y-1.5">
                                        <h4 className={`font-semibold text-zinc-800 leading-tight ${quickViewSettings.compactMode ? 'text-[11px]' : 'text-xs'}`}>
                                            Revamped eLMS for STI
                                        </h4>
                                        <p className={`text-zinc-500 leading-relaxed ${quickViewSettings.compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                                            Experience the new and improved learning management system with enhanced features, modern design, and better performance.
                                        </p>
                                    </div>
                                    
                                    {/* Footer */}
                                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-100">
                                        <span className={`text-zinc-400 ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[9px]'}`}>
                                            Dec 2, 2025
                                        </span>
                                        <motion.button
                                            whileHover={{ scale: 1.02, x: 2 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`flex items-center gap-1 text-blue-500 hover:text-blue-600 font-medium transition-colors ${quickViewSettings.compactMode ? 'text-[9px]' : 'text-[10px]'}`}
                                        >
                                            Read more
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </motion.button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Grade Predictor Widget */}
                    <AnimatePresence>
                        {widgetVisibility['grade-predictor-widget'] && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                className={`bg-white rounded-xl border border-zinc-100/80 overflow-hidden ${quickViewSettings.compactMode ? 'shadow-none' : 'shadow-sm'}`}
                                id="grade-predictor-widget"
                            >
                                {/* Header */}
                                <div className={`flex items-center justify-between ${quickViewSettings.compactMode ? 'px-3 py-2' : 'px-4 py-3'}`}>
                                    <div className="flex items-center gap-2">
                                        <motion.div 
                                            whileHover={{ scale: 1.05 }}
                                            className={`rounded-lg bg-gradient-to-br from-emerald-50 to-teal-100/50 flex items-center justify-center ${quickViewSettings.compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}
                                        >
                                            <svg className={`text-emerald-500 ${quickViewSettings.compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </motion.div>
                                        <span className={`font-medium text-zinc-700 ${quickViewSettings.compactMode ? 'text-xs' : 'text-sm'}`}>Grade Predictor</span>
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', delay: 0.2 }}
                                            className={`px-1.5 py-0.5 rounded-full ${
                                                gradePredictor.confidence >= 70 ? 'bg-emerald-100 text-emerald-600' :
                                                gradePredictor.confidence >= 40 ? 'bg-amber-100 text-amber-600' :
                                                'bg-zinc-100 text-zinc-500'
                                            } ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[9px]'}`}
                                        >
                                            {gradePredictor.confidence}% confident
                                        </motion.span>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.15, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => toggleWidget('grade-predictor-widget')}
                                        className={`flex items-center justify-center rounded-md text-zinc-300 hover:text-red-400 transition-colors ${quickViewSettings.compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                                    >
                                        <svg className={quickViewSettings.compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </motion.button>
                                </div>
                                
                                {/* Grade Display */}
                                <div className={`${quickViewSettings.compactMode ? 'px-3 pb-3' : 'px-4 pb-4'}`}>
                                    {/* Main Grade Circle */}
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="relative">
                                            <svg className={`transform -rotate-90 ${quickViewSettings.compactMode ? 'w-14 h-14' : 'w-16 h-16'}`}>
                                                {/* Background circle */}
                                                <circle
                                                    cx="50%"
                                                    cy="50%"
                                                    r={quickViewSettings.compactMode ? 24 : 28}
                                                    fill="none"
                                                    stroke="#e5e7eb"
                                                    strokeWidth={quickViewSettings.compactMode ? 4 : 5}
                                                />
                                                {/* Progress circle */}
                                                <motion.circle
                                                    cx="50%"
                                                    cy="50%"
                                                    r={quickViewSettings.compactMode ? 24 : 28}
                                                    fill="none"
                                                    stroke={
                                                        gradePredictor.predictedGrade >= 85 ? '#10b981' :
                                                        gradePredictor.predictedGrade >= 75 ? '#3b82f6' :
                                                        gradePredictor.predictedGrade >= 60 ? '#f59e0b' : '#ef4444'
                                                    }
                                                    strokeWidth={quickViewSettings.compactMode ? 4 : 5}
                                                    strokeLinecap="round"
                                                    initial={{ strokeDasharray: `0 ${2 * Math.PI * (quickViewSettings.compactMode ? 24 : 28)}` }}
                                                    animate={{ 
                                                        strokeDasharray: `${(gradePredictor.predictedGrade / 100) * 2 * Math.PI * (quickViewSettings.compactMode ? 24 : 28)} ${2 * Math.PI * (quickViewSettings.compactMode ? 24 : 28)}`
                                                    }}
                                                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                                                />
                                            </svg>
                                            {/* Grade text in center */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <motion.span
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.5, type: 'spring' }}
                                                    className={`font-bold ${
                                                        gradePredictor.predictedGrade >= 85 ? 'text-emerald-600' :
                                                        gradePredictor.predictedGrade >= 75 ? 'text-blue-600' :
                                                        gradePredictor.predictedGrade >= 60 ? 'text-amber-600' : 'text-red-500'
                                                    } ${quickViewSettings.compactMode ? 'text-sm' : 'text-base'}`}
                                                >
                                                    {gradePredictor.letterGrade}
                                                </motion.span>
                                            </div>
                                        </div>
                                        
                                        {/* Grade Details */}
                                        <div className="flex-1">
                                            <div className="flex items-baseline gap-1.5 mb-1">
                                                <motion.span
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.3 }}
                                                    className={`font-bold ${
                                                        gradePredictor.predictedGrade >= 85 ? 'text-emerald-600' :
                                                        gradePredictor.predictedGrade >= 75 ? 'text-blue-600' :
                                                        gradePredictor.predictedGrade >= 60 ? 'text-amber-600' : 'text-red-500'
                                                    } ${quickViewSettings.compactMode ? 'text-xl' : 'text-2xl'}`}
                                                >
                                                    {gradePredictor.predictedGrade}%
                                                </motion.span>
                                                <span className={`text-zinc-400 ${quickViewSettings.compactMode ? 'text-[9px]' : 'text-[10px]'}`}>predicted</span>
                                            </div>
                                            <p className={`text-zinc-500 ${quickViewSettings.compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                                                {gradePredictor.predictedGrade >= 85 ? 'Excellent performance!' :
                                                 gradePredictor.predictedGrade >= 75 ? 'Good progress, keep it up!' :
                                                 gradePredictor.predictedGrade >= 60 ? 'Room for improvement' : 'Needs attention'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Top Contributing Courses */}
                                    {gradePredictor.breakdown.length > 0 && (
                                        <div className="border-t border-zinc-100 pt-2">
                                            <p className={`text-zinc-400 mb-2 ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[9px]'}`}>
                                                Top contributors
                                            </p>
                                            <div className="space-y-1.5">
                                                {gradePredictor.breakdown.map((course, index) => (
                                                    <motion.div
                                                        key={course.name}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.4 + index * 0.1 }}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <div className={`flex-1 rounded-full overflow-hidden bg-zinc-100 ${quickViewSettings.compactMode ? 'h-1' : 'h-1.5'}`}>
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${course.progress}%` }}
                                                                transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                                                                className={`h-full rounded-full ${
                                                                    course.progress >= 80 ? 'bg-emerald-500' :
                                                                    course.progress >= 50 ? 'bg-blue-500' :
                                                                    course.progress >= 20 ? 'bg-amber-500' : 'bg-zinc-300'
                                                                }`}
                                                            />
                                                        </div>
                                                        <span className={`text-zinc-600 truncate ${quickViewSettings.compactMode ? 'text-[8px] w-16' : 'text-[9px] w-20'}`}>
                                                            {course.name.split(' ').slice(0, 2).join(' ')}
                                                        </span>
                                                        <span className={`font-medium ${
                                                            course.progress >= 80 ? 'text-emerald-600' :
                                                            course.progress >= 50 ? 'text-blue-600' :
                                                            course.progress >= 20 ? 'text-amber-600' : 'text-zinc-500'
                                                        } ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[9px]'}`}>
                                                            {course.progress}%
                                                        </span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Achievements Widget */}
                    <AnimatePresence>
                        {widgetVisibility['achievements-widget'] && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                className={`bg-white rounded-xl border border-zinc-100/80 overflow-hidden ${quickViewSettings.compactMode ? 'shadow-none' : 'shadow-sm'}`}
                                id="achievements-widget"
                            >
                                {/* Header */}
                                <div className={`flex items-center justify-between ${quickViewSettings.compactMode ? 'px-3 py-2' : 'px-4 py-3'}`}>
                                    <div className="flex items-center gap-2">
                                        <motion.div 
                                            whileHover={{ scale: 1.05, rotate: [0, -10, 10, 0] }}
                                            transition={{ duration: 0.3 }}
                                            className={`rounded-lg bg-gradient-to-br from-amber-50 to-yellow-100/50 flex items-center justify-center ${quickViewSettings.compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}
                                        >
                                            <span className={quickViewSettings.compactMode ? 'text-sm' : 'text-base'}>ðŸ†</span>
                                        </motion.div>
                                        <span className={`font-medium text-zinc-700 ${quickViewSettings.compactMode ? 'text-xs' : 'text-sm'}`}>Achievements</span>
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', delay: 0.2 }}
                                            className={`px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 font-medium ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[9px]'}`}
                                        >
                                            {achievements.unlocked}/{achievements.total}
                                        </motion.span>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.15, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => toggleWidget('achievements-widget')}
                                        className={`flex items-center justify-center rounded-md text-zinc-300 hover:text-red-400 transition-colors ${quickViewSettings.compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                                    >
                                        <svg className={quickViewSettings.compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </motion.button>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className={`${quickViewSettings.compactMode ? 'px-3 pb-2' : 'px-4 pb-3'}`}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className={`text-zinc-500 ${quickViewSettings.compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                                            Progress
                                        </span>
                                        <span className={`font-semibold text-amber-600 ${quickViewSettings.compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                                            {achievements.percentage}%
                                        </span>
                                    </div>
                                    <div className={`w-full rounded-full overflow-hidden bg-zinc-100 ${quickViewSettings.compactMode ? 'h-1.5' : 'h-2'}`}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${achievements.percentage}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"
                                        />
                                    </div>
                                </div>
                                
                                {/* Recent Achievements */}
                                <div className={`border-t border-zinc-100 ${quickViewSettings.compactMode ? 'px-3 py-2' : 'px-4 py-3'}`}>
                                    <p className={`text-zinc-400 mb-2 ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[9px]'}`}>
                                        {achievements.recent.length > 0 ? 'Recent unlocks' : 'Start earning achievements!'}
                                    </p>
                                    
                                    {achievements.recent.length > 0 ? (
                                        <div className="space-y-1.5">
                                            {achievements.recent.map((achievement, index) => (
                                                <motion.div
                                                    key={achievement.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.3 + index * 0.1 }}
                                                    className={`flex items-center gap-2 rounded-lg ${
                                                        achievement.rarity === 'legendary' ? 'bg-amber-50/50' :
                                                        achievement.rarity === 'epic' ? 'bg-purple-50/50' :
                                                        achievement.rarity === 'rare' ? 'bg-blue-50/50' : 'bg-zinc-50/50'
                                                    } ${quickViewSettings.compactMode ? 'p-1.5' : 'p-2'}`}
                                                >
                                                    <motion.span
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ type: 'spring', delay: 0.4 + index * 0.1 }}
                                                        className={quickViewSettings.compactMode ? 'text-base' : 'text-lg'}
                                                    >
                                                        {achievement.icon}
                                                    </motion.span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-medium text-zinc-700 truncate ${quickViewSettings.compactMode ? 'text-[10px]' : 'text-xs'}`}>
                                                            {achievement.name}
                                                        </p>
                                                        <p className={`capitalize ${
                                                            achievement.rarity === 'legendary' ? 'text-amber-500' :
                                                            achievement.rarity === 'epic' ? 'text-purple-500' :
                                                            achievement.rarity === 'rare' ? 'text-blue-500' : 'text-zinc-400'
                                                        } ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[9px]'}`}>
                                                            {achievement.rarity}
                                                        </p>
                                                    </div>
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ type: 'spring', delay: 0.5 + index * 0.1 }}
                                                    >
                                                        <svg className={`text-emerald-500 ${quickViewSettings.compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    </motion.div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex flex-col items-center py-2"
                                        >
                                            <motion.div
                                                animate={{ y: [0, -3, 0] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="text-2xl mb-1"
                                            >
                                                ðŸŽ¯
                                            </motion.div>
                                            <p className={`text-zinc-400 text-center ${quickViewSettings.compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                                                Complete tasks to unlock badges!
                                            </p>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    </div>

                    {/* Quick Actions Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mx-3 mt-4 mb-3"
                    >
                        <div className="flex items-center gap-2">
                            <QuickSettingsDropdown onOpenFullSettings={openSettingsModal} />
                            <HelpDropdown />
                        </div>
                    </motion.div>
                </div>
            </motion.aside>
                )}
            </AnimatePresence>

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
                                    console.log('View all notifications');
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
