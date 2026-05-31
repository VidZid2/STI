/**
 * WidgetContainer
 * The scrollable widget area inside WidgetSidebar.
 * Contains all 10 widgets: Quote, Weather, Activity, CourseProgress,
 * StudyInsights, Calendar, Todo, Announcements, GradePredictor, Achievements.
 * Refactored to compose small, React.memo wrapped widgets for 10/10 performance.
 */
import * as React from 'react';
import { AnimatePresence } from 'motion/react';
import { ErrorBoundary } from '../../../components/shared';

import {
    QuoteWidget,
    WeatherWidget,
    ActivityWidget,
    CourseProgressWidget,
    StudyInsightsWidget,
    CalendarWidget,
    TodoWidget,
    AnnouncementsWidget,
    GradePredictorWidget,
    AchievementsWidget
} from '../widgets';

import type { WidgetSidebarProps } from './WidgetSidebar';

// Re-use the same props as WidgetSidebar (minus the sidebar open/close state)
type WidgetContainerProps = Omit<WidgetSidebarProps, 'widgetsSidebarActive' | 'toggleWidgetsSidebar'>;

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
    widgetVisibility,
    toggleWidget,
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearAllTodos,
    completedCount,
    setNewTodoText,
    weather,
    weatherLoading,
    weatherError,
    gradePredictor,
    studyInsights,
    quickViewSettings,
    achievements,
    formatRelativeTime,
    getCourseProgressData,
    formatMinutesToHours,
    upcomingDeadlines,
    todaysQuote,
    recentActivities,
    calendarData,
    calendarView,
    setCalendarView,
    calendarMonth,
    setCalendarMonth,
    hasDeadlines,
    getDeadlineTypeColor
}) => {
    const compactMode = quickViewSettings.compactMode;

    return (
        <div className={`px-3 ${compactMode ? 'space-y-2' : 'space-y-3'}`}>
            <AnimatePresence>
                {widgetVisibility['quote-widget'] && todaysQuote && (
                    <ErrorBoundary name="QuoteWidget">
                        <QuoteWidget
                            quote={todaysQuote}
                            compactMode={compactMode}
                            onClose={() => toggleWidget('quote-widget')}
                        />
                    </ErrorBoundary>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {widgetVisibility['weather-widget'] && (
                    <ErrorBoundary name="WeatherWidget">
                        <WeatherWidget
                            weather={weather}
                            weatherLoading={weatherLoading}
                            weatherError={weatherError}
                            compactMode={compactMode}
                            onClose={() => toggleWidget('weather-widget')}
                        />
                    </ErrorBoundary>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {widgetVisibility['activity-widget'] && (
                    <ErrorBoundary name="ActivityWidget">
                        <ActivityWidget
                            recentActivities={recentActivities}
                            formatRelativeTime={formatRelativeTime}
                            compactMode={compactMode}
                            onClose={() => toggleWidget('activity-widget')}
                        />
                    </ErrorBoundary>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {widgetVisibility['courses-widget'] && (
                    <ErrorBoundary name="CourseProgressWidget">
                        <CourseProgressWidget
                            getCourseProgressData={getCourseProgressData}
                            compactMode={compactMode}
                            onClose={() => toggleWidget('courses-widget')}
                        />
                    </ErrorBoundary>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {widgetVisibility['mastery-widget'] && (
                    <ErrorBoundary name="StudyInsightsWidget">
                        <StudyInsightsWidget
                            studyInsights={studyInsights}
                            formatMinutesToHours={formatMinutesToHours}
                            compactMode={compactMode}
                            onClose={() => toggleWidget('mastery-widget')}
                        />
                    </ErrorBoundary>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {widgetVisibility['calendar-widget'] && (
                    <ErrorBoundary name="CalendarWidget">
                        <CalendarWidget
                            calendarData={calendarData}
                            calendarView={calendarView}
                            setCalendarView={setCalendarView}
                            calendarMonth={calendarMonth}
                            setCalendarMonth={setCalendarMonth}
                            hasDeadlines={hasDeadlines}
                            upcomingDeadlines={upcomingDeadlines}
                            getDeadlineTypeColor={getDeadlineTypeColor}
                            compactMode={compactMode}
                            onClose={() => toggleWidget('calendar-widget')}
                        />
                    </ErrorBoundary>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {widgetVisibility['todo-widget'] && (
                    <ErrorBoundary name="TodoWidget">
                        <TodoWidget
                            todos={todos}
                            addTodo={addTodo}
                            toggleTodo={toggleTodo}
                            deleteTodo={deleteTodo}
                            clearAllTodos={clearAllTodos}
                            completedCount={completedCount}
                            setNewTodoText={setNewTodoText}
                            compactMode={compactMode}
                            onClose={() => toggleWidget('todo-widget')}
                        />
                    </ErrorBoundary>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {widgetVisibility['announcements-widget'] && (
                    <ErrorBoundary name="AnnouncementsWidget">
                        <AnnouncementsWidget
                            compactMode={compactMode}
                            onClose={() => toggleWidget('announcements-widget')}
                        />
                    </ErrorBoundary>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {widgetVisibility['grade-predictor-widget'] && (
                    <ErrorBoundary name="GradePredictorWidget">
                        <GradePredictorWidget
                            gradePredictor={gradePredictor}
                            compactMode={compactMode}
                            onClose={() => toggleWidget('grade-predictor-widget')}
                        />
                    </ErrorBoundary>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {widgetVisibility['achievements-widget'] && (
                    <ErrorBoundary name="AchievementsWidget">
                        <AchievementsWidget
                            achievements={achievements}
                            compactMode={compactMode}
                            onClose={() => toggleWidget('achievements-widget')}
                        />
                    </ErrorBoundary>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WidgetContainer;
