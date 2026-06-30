/**
 * WidgetSidebar
 * The collapsible right-side widget panel for StudentDashboard.
 * Contains: Todo, Weather, Deadlines, Activity, GradePredictor, StudyInsights widgets.
 * Extracted from StudentDashboard.tsx during Phase 11.
 */
import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StreakWidget } from './index';
import { WidgetContainer } from './WidgetContainer';
import QuickSettingsDropdown from '../../../components/ui/dropdowns/QuickSettingsDropdown';
import HelpDropdown from '../../../components/ui/dropdowns/HelpDropdown';
import ToolbarExpandable from '../../../components/ui/toolbar/ToolbarExpandable';
import { Drawer, DrawerContent, DrawerTitle } from '../../../components/ui/drawer';
import { AnimatedCircularProgressBar } from '../../../components/ui/animated-circular-progress-bar';

import { Skeleton } from '../../../components/ui/skeleton';


import type { CalendarData, WeatherData, WidgetVisibility, AchievementStats, TodoItem, GradePrediction, StudyInsights } from '../types';
import { getDaysUntil, type Deadline } from '../../../services/deadlinesService';
import type { ActivityItem } from '../../../services/activityService';
import type { CourseProgressData } from '../../../services/studyTimeService';

// ── Prop types ────────────────────────────────────────────────────────────────
export interface WidgetSidebarProps {
    isInline?: boolean;
    widgetsSidebarActive: boolean;
    toggleWidgetsSidebar: () => void;
    widgetVisibility: WidgetVisibility;
    toggleWidget: (id: string) => void;
    restoreAllWidgets: () => void;
    hasHiddenWidgets: boolean;
    isDemoMode: boolean;
    // Todos
    todos: TodoItem[];
    newTodoText: string;
    setNewTodoText: (v: string) => void;
    isAddingTodo: boolean;
    setIsAddingTodo: (v: boolean) => void;
    todoInputRef: React.RefObject<HTMLInputElement | null>;
    addTodo: () => void;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
    clearAllTodos: () => void;
    completedCount: number;
    // Weather
    weather: WeatherData | null;
    isWeatherLoading: boolean;
    // Deadlines
    deadlines: Deadline[];
    // Activity
    recentActivity: ActivityItem[];
    // Grade predictor
    gradePredictor: GradePrediction;
    // Study insights
    studyInsights: StudyInsights;
    // Notifications
    notifications: any[];
    groupedNotifications: any[];
    // Quick view settings
    quickViewSettings: { compactMode: boolean; showStreak: boolean; showUpcoming: boolean; autoRefresh: boolean };
    // Achievements
    achievements: AchievementStats;
    // Dashboard data
    refreshTrigger: number;
    triggerRefresh?: () => void;
    totalCourses: number;
    upcomingDeadlines: Deadline[];
    overallProgress: number;
    openSettingsModal: () => void;
    // Additional dashboard state
    todaysQuote: { text: string; author: string } | null;
    weatherLoading: boolean;
    weatherError: string | null;
    recentActivities: ActivityItem[];
    calendarData: CalendarData;
    calendarView: 'mini' | 'full';
    setCalendarView: (v: 'mini' | 'full') => void;
    calendarMonth: Date;
    setCalendarMonth: (d: Date) => void;
    hasDeadlines: (date: Date) => boolean;
    // Formatters
    formatDaysUntil: (date: string) => { text: string; color: string };
    getDeadlineTypeColor: (type: Deadline['type']) => string;
    formatRelativeTime: (date: string) => string;
    getCourseProgressData: () => CourseProgressData;
    formatMinutesToHours: (minutes: number) => string;
}

export const WidgetSidebar: React.FC<WidgetSidebarProps> = ({
    isInline = false,
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
    isWeatherLoading,
    deadlines,
    recentActivity,
    gradePredictor,
    studyInsights,
    notifications,
    groupedNotifications,
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
    hasDeadlines }) => {
    const [activeTab, setActiveTab] = React.useState<'Overview' | 'Academics'>('Overview');
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [showScrollIndicator, setShowScrollIndicator] = React.useState(false);
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    const handleManualRefresh = () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        if (triggerRefresh) triggerRefresh();
        
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1500); // 1.5 seconds shimmer
    };

    // Compute deadline urgencies for highlighting
    const hasDeadlineToday = upcomingDeadlines.some(d => getDaysUntil(d.dueDate) === 0);
    const hasDeadlineClose = !hasDeadlineToday && upcomingDeadlines.some(d => {
        const days = getDaysUntil(d.dueDate);
        return days > 0 && days <= 3;
    });

    const upcomingContainerBorderClass = hasDeadlineToday 
        ? 'border-red-500 dark:border-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.15)] hover:border-red-600 dark:hover:border-red-400 hover:shadow-[0_0_16px_rgba(239,68,68,0.25)]' 
        : hasDeadlineClose 
            ? 'border-amber-400 dark:border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.12)] hover:border-amber-500 dark:hover:border-amber-400 hover:shadow-[0_0_16px_rgba(245,158,11,0.22)]' 
            : 'border-slate-200/80 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md';

    const upcomingContainerBgClass = hasDeadlineToday
        ? 'bg-red-50/10 dark:bg-red-950/5'
        : hasDeadlineClose
            ? 'bg-amber-50/5 dark:bg-amber-950/2'
            : 'bg-white dark:bg-slate-800/80';

    const upcomingHeaderIconStyle = hasDeadlineToday
        ? 'bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900/40 text-red-500 dark:text-red-400'
        : hasDeadlineClose
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40 text-amber-500 dark:text-amber-400'
            : 'bg-orange-50 dark:bg-orange-950/40 border-orange-100 dark:border-orange-900/40 text-orange-500 dark:text-orange-400';

    const upcomingHeaderBadgeStyle = hasDeadlineToday
        ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
        : hasDeadlineClose
            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
            : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400';

    React.useEffect(() => {
        if (!isInline && widgetsSidebarActive) {
            // Lock body scroll to prevent background scrolling/nav bar hiding
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isInline, widgetsSidebarActive]);

    React.useEffect(() => {
        if (!isInline) return;
        const el = scrollRef.current;
        if (!el) return;
        
        // Initial check to see if we should show it at all
        const initialCanScroll = el.scrollHeight - el.scrollTop - el.clientHeight > 20;
        if (initialCanScroll) {
            setShowScrollIndicator(true);
        }

        const check = () => {
            const canScroll = el.scrollHeight - el.scrollTop - el.clientHeight > 20;
            // Once they reach the bottom, hide it permanently
            if (!canScroll) {
                setShowScrollIndicator(false);
            }
        };
        
        el.addEventListener('scroll', check, { passive: true });
        const ro = new ResizeObserver(check);
        ro.observe(el);
        return () => { el.removeEventListener('scroll', check); ro.disconnect(); };
    }, [isInline, activeTab]);

    // Notify mobile dock when widgets sidebar opens/closes
    React.useEffect(() => {
        if (isInline) return;
        document.dispatchEvent(new CustomEvent(widgetsSidebarActive ? 'widgetspanel:open' : 'widgetspanel:close'));
    }, [widgetsSidebarActive, isInline]);

    const renderTabs = (size: 'small' | 'normal' = 'normal') => (
        <div className={`flex gap-1 p-1 rounded-[${size === 'small' ? '12px' : '16px'}] shadow-sm border bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 transition-colors`}>
            {['Overview', 'Academics'].map((tab) => {
                const isActive = activeTab === tab;
                return (
                    <motion.button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        whileTap={{ scale: 0.97 }}
                        className={`relative flex-1 flex items-center justify-center ${size === 'small' ? 'px-1.5 py-1 text-[10px]' : 'px-3 py-2 text-xs'} font-bold rounded-[${size === 'small' ? '8px' : '12px'}] transition-colors duration-200 z-10 ${
                            isActive 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-700/40'
                        }`}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="quickViewActiveTab"
                                className={`absolute inset-0 rounded-[${size === 'small' ? '8px' : '12px'}] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] bg-white dark:bg-slate-700 border border-slate-200/80 dark:border-slate-600`}
                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                            />
                        )}
                        <span className="relative z-10">{tab}</span>
                    </motion.button>
                );
            })}
        </div>
    );

    const innerContent = (
        <div className={`widgets-content ${isInline ? '!relative !w-full flex flex-col !h-full !overflow-hidden !bg-transparent !border-none !shadow-none !p-0 min-h-0' : ''}`} id={isInline ? "widgets-content-area-inline" : "widgets-content-area"}>
            {isInline ? (
                <>
                    <div className="flex items-center justify-between mb-2 flex-shrink-0">
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <div className="w-7 h-7 rounded-[8px] bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none whitespace-nowrap">
                                Quick View
                            </h2>
                        </div>
                    </div>
                    <hr className="border-t border-slate-100 dark:border-slate-700/50 w-full mb-3 flex-shrink-0" />
                </>
            ) : (
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <DrawerTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100 m-0">Quick View</DrawerTitle>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleWidgetsSidebar}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </motion.button>
                </div>
            )}



            {/* Restore Widgets Button - Minimalistic */}

            {/* Mobile Nav Tools */}
            {!isInline && (
                <div className="lg:hidden mx-3 mt-4 mb-2 p-1.5 flex flex-col justify-center rounded-[20px] bg-white dark:bg-slate-800/90 shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
                    <ToolbarExpandable className="!shadow-none !border-none !bg-transparent w-full flex justify-between" hideCloseButton isMobile={true} />
                    <div className="px-2 pb-1 pt-2 border-t border-slate-100 dark:border-slate-700/50 mt-1">
                        {renderTabs('small')}
                    </div>
                </div>
            )}
            
            {/* Restore Widgets Button - Minimalistic */}
            <AnimatePresence>
                {!isInline && (
                    Object.values(widgetVisibility).some(v => !v) && (
                        <motion.button
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            onClick={() => {
                                restoreAllWidgets();
                            }}
                            className="mx-3 mb-2 flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 rounded-lg text-xs font-medium transition-colors border border-dashed border-zinc-200 dark:border-zinc-700 shrink-0"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Restore Hidden Widgets
                        </motion.button>
                    )
                )}
            </AnimatePresence>

            {/* Desktop / Inline Filter Tabs */}
            {isInline && (
                <div className="px-0 mb-2 mt-2">
                    {renderTabs('normal')}
                </div>
            )}

            <div ref={isInline ? scrollRef : undefined} className={`flex-1 overflow-y-auto overflow-x-hidden min-h-0 ${isInline ? 'pl-1 -ml-1 pr-0 -mr-0' : 'px-1'} pb-4 pt-1 flex flex-col gap-2.5`} style={isInline ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties : {}}>
                {/* Hide webkit scrollbar on PC inline mode */}
                {isInline && <style>{`[data-qv-scroll]::-webkit-scrollbar { display: none; }`}</style>}
                {isInline && <script dangerouslySetInnerHTML={{ __html: '' }} ref={(el) => { if (el) el.parentElement?.setAttribute('data-qv-scroll', ''); }} />}
                <AnimatePresence mode="wait">
                    {activeTab === 'Overview' && (
                                    <motion.div
                                        key="overview-tab"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {/* Study Streak - Gamification (controlled by Quick View Settings) */}
                                        <AnimatePresence>
                                            {quickViewSettings.showStreak && (
                                                <StreakWidget compactMode={quickViewSettings.compactMode} isInline={isInline} />
                                            )}
                                        </AnimatePresence>

                                        {/* Quick Stats Card - Student Overview */}
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, ease: 'easeOut' }}
                                            className={`${isInline ? '' : 'mx-1'} mt-3 bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm rounded-[20px] transition-all duration-300 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 ${quickViewSettings.compactMode ? 'p-3' : 'p-4'}`}
                                        >
                                            <div className={`flex items-center justify-between ${quickViewSettings.compactMode ? 'mb-2.5' : 'mb-3.5'}`}>
                                                <div className="flex items-center gap-2">
                                                    <div className={`rounded-[8px] bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 ${quickViewSettings.compactMode ? 'w-6 h-6' : 'w-7 h-7'}`}>
                                                        <svg className={quickViewSettings.compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                                        </svg>
                                                    </div>
                                                    <span className={`font-semibold text-slate-800 dark:text-slate-200 ${quickViewSettings.compactMode ? 'text-xs' : 'text-sm'}`}>This Week</span>
                                                </div>
                                                <motion.button
                                                    whileHover={{ rotate: 180, scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    transition={{ duration: 0.3 }}
                                                    onClick={handleManualRefresh}
                                                    disabled={isRefreshing}
                                                    className={`rounded-lg bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center cursor-pointer text-slate-500 dark:text-slate-400 flex-shrink-0 !min-w-0 !min-h-0 !p-0 ${quickViewSettings.compactMode ? '!w-6 !h-6' : '!w-7 !h-7'} ${isRefreshing ? 'opacity-70' : ''}`}
                                                >
                                                    <svg className={`${quickViewSettings.compactMode ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                    </svg>
                                                </motion.button>
                                            </div>
                                            <div className={`grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800/50`}>
                                                <motion.div
                                                    whileHover={!isRefreshing ? { scale: 1.05, y: -2 } : {}}
                                                    className={`flex flex-col items-center justify-center transition-all duration-300 ${quickViewSettings.compactMode ? 'p-1' : 'p-2'}`}
                                                >
                                                    <AnimatePresence mode="wait">
                                                        {isRefreshing ? (
                                                            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col items-center">
                                                                <Skeleton className={`rounded-md ${quickViewSettings.compactMode ? 'h-6 w-8' : 'h-10 w-12'} mb-1 bg-slate-200/80 dark:bg-slate-700/80`} />
                                                                <div className="text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-[0.08em] mt-1">Courses</div>
                                                            </motion.div>
                                                        ) : (
                                                            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col items-center">
                                                                <div className={`font-bold text-blue-600 dark:text-blue-400 leading-none mb-1 ${quickViewSettings.compactMode ? 'text-2xl' : 'text-4xl'}`}>{totalCourses}</div>
                                                                <div className="text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-[0.08em] mt-1">Courses</div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                                <motion.div
                                                    whileHover={!isRefreshing ? { scale: 1.05, y: -2 } : {}}
                                                    className={`flex flex-col items-center justify-center transition-all duration-300 ${quickViewSettings.compactMode ? 'p-1' : 'p-2'}`}
                                                >
                                                    <AnimatePresence mode="wait">
                                                        {isRefreshing ? (
                                                            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col items-center">
                                                                <Skeleton className={`rounded-md ${quickViewSettings.compactMode ? 'h-6 w-8' : 'h-10 w-12'} mb-1 bg-slate-200/80 dark:bg-slate-700/80`} />
                                                                <div className="text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-[0.08em] mt-1">Due Soon</div>
                                                            </motion.div>
                                                        ) : (
                                                            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col items-center">
                                                                <div className={`font-bold text-amber-500 dark:text-amber-400 leading-none mb-1 ${quickViewSettings.compactMode ? 'text-2xl' : 'text-4xl'}`}>{upcomingDeadlines.length}</div>
                                                                <div className="text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-[0.08em] mt-1">Due Soon</div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                                <motion.div
                                                    whileHover={!isRefreshing ? { scale: 1.05, y: -2 } : {}}
                                                    className={`flex flex-col items-center justify-center transition-all duration-300 ${quickViewSettings.compactMode ? 'p-1' : 'p-2'}`}
                                                >
                                                    <AnimatePresence mode="wait">
                                                        {isRefreshing ? (
                                                            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col items-center">
                                                                <Skeleton className={`rounded-full ${quickViewSettings.compactMode ? 'size-10' : 'size-14'} mb-1 bg-slate-200/80 dark:bg-slate-700/80`} />
                                                                <div className="text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-[0.08em] mt-1">Progress</div>
                                                            </motion.div>
                                                        ) : (
                                                            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col items-center">
                                                                <div className="relative mb-1">
                                                                    <AnimatedCircularProgressBar
                                                                        max={100}
                                                                        min={0}
                                                                        value={overallProgress}
                                                                        gaugePrimaryColor="rgb(16 185 129)"
                                                                        gaugeSecondaryColor="rgba(148, 163, 184, 0.2)"
                                                                        className={quickViewSettings.compactMode ? '!size-10' : '!size-14'}
                                                                        hideText={true}
                                                                    >
                                                                        <div className="absolute inset-[6px] rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                                                            <svg className={`text-emerald-500 ${quickViewSettings.compactMode ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                                            </svg>
                                                                        </div>
                                                                    </AnimatedCircularProgressBar>
                                                                    <motion.div 
                                                                        initial={{ opacity: 0, y: 5, x: "-50%", scale: 0.8 }}
                                                                        animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
                                                                        transition={{ duration: 0.4, delay: 0.2, type: "spring" }}
                                                                        className={`absolute -bottom-1.5 left-1/2 px-1.5 py-0.5 rounded-full bg-white dark:bg-slate-800 border-[2px] border-white dark:border-slate-800 shadow-sm flex items-center justify-center whitespace-nowrap z-10 ${quickViewSettings.compactMode ? 'min-w-[28px]' : 'min-w-[34px]'}`}
                                                                    >
                                                                        <span className={`font-bold text-slate-700 dark:text-slate-200 leading-none ${quickViewSettings.compactMode ? 'text-[8.5px]' : 'text-[10px]'}`} style={{ paddingTop: '1px' }}>
                                                                            {overallProgress}%
                                                                        </span>
                                                                    </motion.div>
                                                                </div>
                                                                <div className="text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-[0.08em] mt-1">Progress</div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            </div>
                                        </motion.div>



                                        {/* Upcoming Deadlines - Student Priority (controlled by Quick View Settings) */}
                                        <AnimatePresence>
                                            {quickViewSettings.showUpcoming && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                                                    transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 }}
                                                    className={`${isInline ? '' : 'mx-1'} mt-3 ${upcomingContainerBgClass} border ${upcomingContainerBorderClass} shadow-sm rounded-[20px] overflow-hidden transition-all duration-300 ${quickViewSettings.compactMode ? 'compact-widget' : ''}`}
                                                >
                                                    <div className={`flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/50 ${quickViewSettings.compactMode ? 'px-3 py-2.5' : 'px-4 py-3.5'}`}>
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className={`shrink-0 rounded-[12px] border flex items-center justify-center ${upcomingHeaderIconStyle} ${quickViewSettings.compactMode ? 'w-7 h-7' : 'w-8 h-8'}`}>
                                                                <svg className={quickViewSettings.compactMode ? 'w-4 h-4' : 'w-5 h-5'} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                                </svg>
                                                            </div>
                                                            <span className={`font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate ${quickViewSettings.compactMode ? 'text-[13px]' : 'text-[15px]'}`}>Upcoming</span>
                                                            {upcomingDeadlines.length > 0 && (
                                                                <span className={`shrink-0 px-2 py-0.5 rounded-full font-bold ${upcomingHeaderBadgeStyle} ${quickViewSettings.compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                                                                    {upcomingDeadlines.length}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className={`shrink-0 flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm rounded-md ${quickViewSettings.compactMode ? 'p-0.5 pr-2' : 'p-1 pr-2.5'}`}>
                                                            <div className={`flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 rounded-[6px] sm:rounded-[8px] text-blue-600 dark:text-blue-400 ${quickViewSettings.compactMode ? 'w-[18px] h-[18px]' : 'w-6 h-6'}`}>
                                                                <svg className={quickViewSettings.compactMode ? 'w-[10px] h-[10px]' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                            <span className={`font-bold text-slate-900 dark:text-slate-100 tracking-tight ${quickViewSettings.compactMode ? 'text-[9px]' : 'text-[10px]'}`}>Next 7 Days</span>
                                                        </div>
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
                                                                    whileHover={{ scale: 1.08, rotate: -5 }}
                                                                    transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                                                                    className={`rounded-[16px] bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-sm ${quickViewSettings.compactMode ? 'w-10 h-10 rounded-[12px]' : 'w-14 h-14'}`}
                                                                >
                                                                    <motion.svg
                                                                        initial={{ pathLength: 0 }}
                                                                        animate={{ pathLength: 1 }}
                                                                        transition={{ duration: 0.5, delay: 0.3 }}
                                                                        className={quickViewSettings.compactMode ? 'w-5 h-5' : 'w-7 h-7'}
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                                    </motion.svg>
                                                                </motion.div>
                                                                <motion.h3
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ delay: 0.2 }}
                                                                    className={`font-bold text-slate-900 dark:text-slate-100 tracking-tight m-0 mb-1 leading-snug ${quickViewSettings.compactMode ? 'text-[12px]' : 'text-[14px]'}`}
                                                                >
                                                                    You're all caught up!
                                                                </motion.h3>
                                                                <motion.p
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ delay: 0.3 }}
                                                                    className={`text-slate-500 dark:text-slate-400 font-normal leading-relaxed m-0 ${quickViewSettings.compactMode ? 'text-[10px]' : 'text-[11px]'}`}
                                                                >
                                                                    No deadlines in the next 7 days
                                                                </motion.p>
                                                            </motion.div>
                                                        ) : (
                                                            <AnimatePresence mode="popLayout">
                                                                {upcomingDeadlines.slice(0, 3).map((deadline, index) => {
                                                                    const dueInfo = formatDaysUntil(deadline.dueDate);
                                                                    const isRed = dueInfo.color?.includes('red') || dueInfo.color?.includes('rose');
                                                                    const isOrange = dueInfo.color?.includes('orange') || dueInfo.color?.includes('amber');
                                                                    const badgeStyle = isRed 
                                                                        ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30' 
                                                                        : isOrange 
                                                                            ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30' 
                                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700';
                                                                    const titleColorClass = isRed 
                                                                        ? 'text-red-600 dark:text-red-400' 
                                                                        : isOrange 
                                                                            ? 'text-amber-500 dark:text-amber-400' 
                                                                            : 'text-slate-700 dark:text-slate-200';

                                                                    return (
                                                                        <motion.div
                                                                            key={deadline.id}
                                                                            onClick={() => {
                                                                                sessionStorage.setItem('defaultCourseTab', 'assignments');
                                                                                sessionStorage.setItem('targetTaskId', deadline.id.toString());
                                                                                window.dispatchEvent(new CustomEvent('switch-course-tab', { detail: { tab: 'assignments' } }));
                                                                                window.dispatchEvent(new CustomEvent('navigate-to-course', { 
                                                                                    detail: { courseId: deadline.courseId, fromView: 'home' } 
                                                                                }));
                                                                            }}
                                                                            initial={{ opacity: 0, x: -10 }}
                                                                            animate={{ opacity: 1, x: 0 }}
                                                                            exit={{ opacity: 0, x: 10 }}
                                                                            transition={{ delay: index * 0.05 }}
                                                                            whileHover={{ x: 4 }}
                                                                            className={`flex items-center gap-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition-all duration-200 ${quickViewSettings.compactMode ? 'p-1.5' : 'p-2'}`}
                                                                        >
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className={`font-bold ${titleColorClass} truncate ${quickViewSettings.compactMode ? 'text-[10px]' : 'text-xs'}`}>
                                                                                    {deadline.title}
                                                                                </p>
                                                                                <p className={`text-slate-400 dark:text-slate-500 mt-0.5 truncate ${quickViewSettings.compactMode ? 'text-[8px]' : 'text-[10px]'}`}>
                                                                                    {deadline.courseName}
                                                                                </p>
                                                                            </div>
                                                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold flex-shrink-0 ${badgeStyle}`}>
                                                                                {dueInfo.text}
                                                                            </span>
                                                                        </motion.div>
                                                                    );
                                                                })}
                                                            </AnimatePresence>
                                                        )}
                                                    </div>
                                                    <div className={`border-t border-slate-100 dark:border-slate-700/50 ${quickViewSettings.compactMode ? 'p-2' : 'p-3'}`}>
                                                        <motion.button
                                                            onClick={() => {
                                                                if (upcomingDeadlines.length > 0) {
                                                                    sessionStorage.setItem('defaultCourseTab', 'assignments');
                                                                    window.dispatchEvent(new CustomEvent('switch-course-tab', { detail: { tab: 'assignments' } }));
                                                                    window.dispatchEvent(new CustomEvent('navigate-to-course', { 
                                                                        detail: { courseId: upcomingDeadlines[0].courseId, fromView: 'home' } 
                                                                    }));
                                                                }
                                                            }}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            className={`w-full ${quickViewSettings.compactMode ? 'py-2 px-3 text-[10px]' : 'py-2.5 px-4 text-[12px]'} font-semibold rounded-[14px] transition-colors shadow-sm flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 focus-visible:ring-blue-500`}
                                                        >
                                                            <span>Go to tasks</span>
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                                            </svg>
                                                        </motion.button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                )}
                            </AnimatePresence>



                            {/* Widget Container — extracted to ./WidgetContainer.tsx */}
                            {activeTab === 'Academics' && (
                                <WidgetContainer
                                    activeTab={activeTab}
                                    isInline={isInline}
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
                                    isWeatherLoading={isWeatherLoading}
                                    deadlines={deadlines}
                                    recentActivity={recentActivity}
                                    gradePredictor={gradePredictor}
                                    studyInsights={studyInsights}
                                    notifications={notifications}
                                    groupedNotifications={groupedNotifications}
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
                                    todaysQuote={todaysQuote}
                                    weatherLoading={weatherLoading}
                                    weatherError={weatherError}
                                    recentActivities={recentActivities}
                                    calendarData={calendarData}
                                    calendarView={calendarView}
                                    setCalendarView={setCalendarView}
                                    calendarMonth={calendarMonth}
                                    setCalendarMonth={setCalendarMonth}
                                    hasDeadlines={hasDeadlines}
                                />
                            )}

                            {/* Section Divider */}
                            <div className={`${isInline ? '' : 'mx-1'} mb-2 flex items-center gap-2`}>
                                <div className="h-px flex-1 bg-zinc-100" />
                                <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Widgets</span>
                                <div className="h-px flex-1 bg-zinc-100" />
                            </div>

                            {/* Quick Actions Footer */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className={`${isInline ? '' : 'mx-1'} mt-auto pt-4 mb-3`}
                            >
                                <div className="flex items-center gap-2">
                                    <QuickSettingsDropdown onOpenFullSettings={openSettingsModal} />
                                    <HelpDropdown />
                                </div>
                            </motion.div>
                        </div>
                    </div>
    );

    if (isInline) {
        return (
            <div className="relative w-full h-full flex flex-col min-h-0">
                {innerContent}
                {/* Scroll indicator arrow */}
                <AnimatePresence>
                    {showScrollIndicator && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-30 pb-1"
                        >
                            <motion.div
                                className="flex items-center justify-center w-7 h-7 rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-md backdrop-blur-sm"
                            >
                                <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <Drawer 
            open={widgetsSidebarActive} 
            onOpenChange={(open) => {
                if (widgetsSidebarActive !== open) {
                    toggleWidgetsSidebar();
                }
            }} 
            direction="right"
        >
            <DrawerContent className="!w-[100vw] md:!w-[360px] !max-w-[100vw] h-full rounded-none p-0 border-none bg-white dark:bg-slate-900 md:border-l md:border-slate-100 dark:md:border-slate-800">
                <div className="h-full w-full overflow-hidden flex flex-col relative z-50">
                    {innerContent}
                </div>
            </DrawerContent>
        </Drawer>
    );
};

export default WidgetSidebar;
