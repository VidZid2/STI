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

import type { CalendarData, WeatherData, WidgetVisibility, AchievementStats, TodoItem } from '../types';
import type { Deadline } from '../../../services/deadlinesService';
import type { ActivityItem } from '../../../services/activityService';
import type { CourseProgressData } from '../../../services/studyTimeService';

// ── Prop types ────────────────────────────────────────────────────────────────
export interface WidgetSidebarProps {
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
    gradePredictor: any;
    // Study insights
    studyInsights: any;
    // Notifications
    notifications: any[];
    groupedNotifications: any[];
    // Quick view settings
    quickViewSettings: { compactMode: boolean; showStreak: boolean; showUpcoming: boolean; autoRefresh: boolean };
    // Achievements
    achievements: AchievementStats;
    // Dashboard data
    refreshTrigger: number;
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
    hasDeadlines,
}) => {
    return (
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

                            {/* Widget Container — extracted to ./WidgetContainer.tsx */}
                            <WidgetContainer
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
    );
};

export default WidgetSidebar;
