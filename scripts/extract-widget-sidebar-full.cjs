/**
 * extract-widget-sidebar-full.cjs
 * Extracts the full WidgetSidebar JSX from StudentDashboard.tsx.
 */
const fs = require('fs');
const path = require('path');

const srcFile = 'src/pages/studentdashboard/StudentDashboard.tsx';
const compDir = 'src/pages/studentdashboard/components';

const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

// Find the AnimatePresence that wraps the widgets sidebar
// It's the one just before "{/* Widgets Sidebar */}"
const commentIdx = lines.findIndex(l => l.includes('{/* Widgets Sidebar */}'));
console.log('Comment at line:', commentIdx + 1);

// Walk back to find the AnimatePresence opening
let apStartIdx = -1;
for (let i = commentIdx; i >= Math.max(0, commentIdx - 10); i--) {
    if (lines[i].trim().startsWith('<AnimatePresence')) {
        apStartIdx = i;
        break;
    }
}
console.log('AnimatePresence start:', apStartIdx + 1);

// Find the closing </AnimatePresence> after the </motion.aside>
const motionAsideEnd = lines.findIndex(l => l.trim() === '</motion.aside>');
let apEndIdx = -1;
for (let i = motionAsideEnd; i < Math.min(lines.length, motionAsideEnd + 10); i++) {
    if (lines[i].includes('</AnimatePresence>')) {
        apEndIdx = i;
        break;
    }
}
console.log('AnimatePresence end:', apEndIdx + 1);
console.log('Total sidebar lines:', apEndIdx - apStartIdx + 1);

// Extract the sidebar JSX
const sidebarJSX = lines.slice(apStartIdx, apEndIdx + 1).join('\n');

// Build the WidgetSidebar component file
// The sidebar uses these props from StudentDashboard:
// widgetsSidebarActive, toggleWidgetsSidebar, widgetVisibility, toggleWidget,
// restoreAllWidgets, hasHiddenWidgets, isDemoMode, todos, newTodoText,
// setNewTodoText, isAddingTodo, setIsAddingTodo, todoInputRef, addTodo,
// toggleTodo, deleteTodo, clearAllTodos, completedCount, weather,
// isWeatherLoading, deadlines, recentActivity, gradePredictor, studyInsights,
// notifications, groupedNotifications, quickViewSettings, achievements,
// formatDaysUntil, getDeadlineTypeColor, formatRelativeTime,
// getCourseProgressData, formatMinutesToHours

const widgetSidebarFile = `/**
 * WidgetSidebar
 * The collapsible right-side widget panel for StudentDashboard.
 * Extracted from StudentDashboard.tsx during Phase 11.
 */
import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationItem, GroupedNotification, StreakWidget } from './index';

export interface WidgetSidebarProps {
    widgetsSidebarActive: boolean;
    toggleWidgetsSidebar: () => void;
    widgetVisibility: Record<string, boolean>;
    toggleWidget: (id: string) => void;
    restoreAllWidgets: () => void;
    hasHiddenWidgets: boolean;
    isDemoMode: boolean;
    todos: { id: string; text: string; completed: boolean; createdAt: Date }[];
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
    weather: { temp: number; condition: string; icon: string; location: string; humidity: number; wind: number } | null;
    isWeatherLoading: boolean;
    deadlines: { id: string; title: string; course: string; dueDate: Date; type: string }[];
    recentActivity: { id: string; type: string; title: string; course: string; timestamp: Date; score?: number }[];
    gradePredictor: { currentGrade: number; predictedGrade: number; trend: 'up' | 'down' | 'stable' } | null;
    studyInsights: { totalHours: number; avgSession: number; streak: number; bestDay: string } | null;
    notifications: { id: string; type: string; title: string; message: string; timestamp: Date; read: boolean }[];
    groupedNotifications: { date: string; items: { id: string; type: string; title: string; message: string; timestamp: Date; read: boolean }[] }[];
    quickViewSettings: { compactMode: boolean; showWeather: boolean; showDeadlines: boolean; showActivity: boolean };
    achievements: { id: string; title: string; description: string; icon: string; unlockedAt?: Date }[];
    formatDaysUntil: (date: Date) => string;
    getDeadlineTypeColor: (type: string) => string;
    formatRelativeTime: (date: Date) => string;
    getCourseProgressData: (courseId: string) => { progress: number; completedModules: number; totalModules: number };
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
}) => {
    return (
        <>
            ${sidebarJSX}
        </>
    );
};

export default WidgetSidebar;
`;

fs.writeFileSync(path.join(compDir, 'WidgetSidebar.tsx'), widgetSidebarFile, 'utf8');
console.log('\nWidgetSidebar.tsx written:', widgetSidebarFile.split('\n').length, 'lines');

// Now remove the sidebar JSX from StudentDashboard and replace with <WidgetSidebar ... />
// Build the replacement JSX with all props spread
const replacement = `            {/* Widgets Sidebar — extracted to ./components/WidgetSidebar.tsx */}
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
            />`;

const newLines = [
    ...lines.slice(0, apStartIdx),
    replacement,
    ...lines.slice(apEndIdx + 1),
];

fs.writeFileSync(srcFile, newLines.join('\n'), 'utf8');
console.log('StudentDashboard.tsx new line count:', newLines.length);
console.log('Done.');
