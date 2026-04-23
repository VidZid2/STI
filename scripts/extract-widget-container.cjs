/**
 * extract-widget-container.cjs
 * Extracts the widget container section from WidgetSidebar.tsx
 * into a WidgetContainer component.
 */
const fs = require('fs');
const path = require('path');

const srcFile = 'src/pages/studentdashboard/components/WidgetSidebar.tsx';
const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

// Find the widget container div start
// Line 334: {/* Widget Container - Minimalistic Professional Design */}
// Line 335: <div className={`px-3 ${...}`}>
const containerCommentIdx = lines.findIndex(l => l.trim() === '{/* Widget Container - Minimalistic Professional Design */}');
const containerDivIdx = containerCommentIdx + 1;
console.log('Widget container comment at line:', containerCommentIdx + 1);
console.log('Widget container div at line:', containerDivIdx + 1);
console.log('Line:', lines[containerDivIdx].trim());

// Find the closing </div> of the widget container
// It's the </div> that closes the px-3 space-y-3 div
// We need to find the matching closing div
let depth = 0;
let containerEndIdx = -1;
for (let i = containerDivIdx; i < lines.length; i++) {
    const t = lines[i].trim();
    // Count opening divs
    const opens = (lines[i].match(/<div[\s>]/g) || []).length;
    const closes = (lines[i].match(/<\/div>/g) || []).length;
    depth += opens - closes;
    if (depth <= 0 && i > containerDivIdx) {
        containerEndIdx = i;
        break;
    }
}
console.log('Container closes at line:', containerEndIdx + 1);
console.log('Widget container lines:', containerEndIdx - containerCommentIdx + 1);

// Extract the widget container JSX
const widgetContainerJSX = lines.slice(containerCommentIdx, containerEndIdx + 1).join('\n');

// Read the props interface from WidgetSidebar to reuse
const propsStart = lines.findIndex(l => l.trim() === 'export interface WidgetSidebarProps {');
const propsEnd = lines.findIndex((l, i) => i > propsStart && l.trim() === '}');
const propsInterface = lines.slice(propsStart, propsEnd + 1).join('\n');

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
import { NotificationItem, GroupedNotification, StreakWidget } from './index';
import type { WidgetSidebarProps } from './WidgetSidebar';

// Re-use the same props as WidgetSidebar (all widgets need all props)
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
        <>
${widgetContainerJSX}
        </>
    );
};

export default WidgetContainer;
`;

fs.writeFileSync('src/pages/studentdashboard/components/WidgetContainer.tsx', widgetContainerFile, 'utf8');
console.log('\nWidgetContainer.tsx written:', widgetContainerFile.split('\n').length, 'lines');

// Replace the widget container section in WidgetSidebar.tsx with <WidgetContainer ... />
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
    ...lines.slice(0, containerCommentIdx),
    ...replacement,
    ...lines.slice(containerEndIdx + 1),
];

fs.writeFileSync(srcFile, newLines.join('\n'), 'utf8');
console.log('WidgetSidebar.tsx new line count:', newLines.length);
console.log('Done.');
