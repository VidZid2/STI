/**
 * extract-widget-container-v2.cjs
 * Uses exact line numbers to extract the widget container.
 * Widget container: lines 334-1859 (0-indexed: 333-1858)
 * Quick Actions Footer starts at line 1861 (0-indexed: 1860)
 */
const fs = require('fs');
const path = require('path');

const srcFile = 'src/pages/studentdashboard/components/WidgetSidebar.tsx';
const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

// Exact boundaries from analysis
const containerStart = 333;  // line 334 (0-indexed)
const containerEnd   = 1858; // line 1859 (0-indexed) - the closing </div>

console.log('Extracting lines', containerStart+1, 'to', containerEnd+1);
console.log('First line:', lines[containerStart].trim());
console.log('Last line:', lines[containerEnd].trim());
console.log('Total lines:', containerEnd - containerStart + 1);

const widgetContainerJSX = lines.slice(containerStart, containerEnd + 1).join('\n');

// Build WidgetContainer.tsx
const widgetContainerFile = `/**
 * WidgetContainer
 * The scrollable widget area inside WidgetSidebar.
 * Contains all 10 widgets: Quote, Weather, Activity, CourseProgress,
 * StudyInsights, Calendar, Todo, Announcements, GradePredictor, Achievements.
 * Extracted from WidgetSidebar.tsx during Phase 11.
 */
import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StreakWidget } from './index';
import type { WidgetSidebarProps } from './WidgetSidebar';

// Re-use the same props as WidgetSidebar (minus the sidebar open/close state)
type WidgetContainerProps = Omit<WidgetSidebarProps, 'widgetsSidebarActive' | 'toggleWidgetsSidebar'>;

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
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
}) => {
    return (
${widgetContainerJSX}
    );
};

export default WidgetContainer;
`;

fs.writeFileSync('src/pages/studentdashboard/components/WidgetContainer.tsx', widgetContainerFile, 'utf8');
console.log('\nWidgetContainer.tsx written:', widgetContainerFile.split('\n').length, 'lines');

// Replace the widget container section in WidgetSidebar.tsx
const replacement = [
    '                            {/* Widget Container — extracted to ./WidgetContainer.tsx */}',
    '                            <WidgetContainer',
    '                                widgetVisibility={widgetVisibility}',
    '                                toggleWidget={toggleWidget}',
    '                                restoreAllWidgets={restoreAllWidgets}',
    '                                hasHiddenWidgets={hasHiddenWidgets}',
    '                                isDemoMode={isDemoMode}',
    '                                todos={todos}',
    '                                newTodoText={newTodoText}',
    '                                setNewTodoText={setNewTodoText}',
    '                                isAddingTodo={isAddingTodo}',
    '                                setIsAddingTodo={setIsAddingTodo}',
    '                                todoInputRef={todoInputRef}',
    '                                addTodo={addTodo}',
    '                                toggleTodo={toggleTodo}',
    '                                deleteTodo={deleteTodo}',
    '                                clearAllTodos={clearAllTodos}',
    '                                completedCount={completedCount}',
    '                                weather={weather}',
    '                                isWeatherLoading={isWeatherLoading}',
    '                                deadlines={deadlines}',
    '                                recentActivity={recentActivity}',
    '                                gradePredictor={gradePredictor}',
    '                                studyInsights={studyInsights}',
    '                                notifications={notifications}',
    '                                groupedNotifications={groupedNotifications}',
    '                                quickViewSettings={quickViewSettings}',
    '                                achievements={achievements}',
    '                                formatDaysUntil={formatDaysUntil}',
    '                                getDeadlineTypeColor={getDeadlineTypeColor}',
    '                                formatRelativeTime={formatRelativeTime}',
    '                                getCourseProgressData={getCourseProgressData}',
    '                                formatMinutesToHours={formatMinutesToHours}',
    '                            />',
];

const newLines = [
    ...lines.slice(0, containerStart),
    ...replacement,
    ...lines.slice(containerEnd + 1),
];

fs.writeFileSync(srcFile, newLines.join('\n'), 'utf8');
console.log('WidgetSidebar.tsx new line count:', newLines.length);
console.log('Done.');
