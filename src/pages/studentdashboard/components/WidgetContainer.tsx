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
    StudyInsightsWidget,
    CalendarWidget,
    TodoWidget
} from '../widgets';

import type { WidgetSidebarProps } from './WidgetSidebar';

// Re-use the same props as WidgetSidebar (minus the sidebar open/close state)
type WidgetContainerProps = Omit<WidgetSidebarProps, 'widgetsSidebarActive' | 'toggleWidgetsSidebar'> & {
    activeTab?: 'Overview' | 'Academics';
    isInline?: boolean;
};

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
    activeTab = 'Overview',
    isInline = false,
    widgetVisibility,
    toggleWidget,
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearAllTodos,
    completedCount,
    setNewTodoText,
    studyInsights,
    quickViewSettings,
    formatMinutesToHours,
    upcomingDeadlines,
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
        <div className={`${isInline ? '' : 'px-3'} ${compactMode ? 'space-y-2' : 'space-y-3'}`}>






            <AnimatePresence>
                {widgetVisibility['mastery-widget'] && activeTab === 'Academics' && (
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
                {widgetVisibility['calendar-widget'] && activeTab === 'Academics' && (
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
                {widgetVisibility['todo-widget'] && activeTab === 'Academics' && (
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

        </div>
    );
};

export default WidgetContainer;
