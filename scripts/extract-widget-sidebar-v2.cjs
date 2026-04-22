/**
 * extract-widget-sidebar-v2.cjs
 * Safely extracts the WidgetSidebar from StudentDashboard.tsx.
 * Uses exact line numbers found by analysis.
 */
const fs = require('fs');
const path = require('path');

const srcFile = 'src/pages/studentdashboard/StudentDashboard.tsx';
const compDir = 'src/pages/studentdashboard/components';

const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

// Exact boundaries (1-indexed from analysis):
// Line 381: {/* Widgets Sidebar */}  <- comment before the block
// Line 382: <AnimatePresence mode="wait">  <- sidebar AnimatePresence
// Line 2162: </motion.aside>
// Line 2164: </AnimatePresence>  <- closing of sidebar AnimatePresence

// Find the sidebar AnimatePresence — the one right after the Widgets Sidebar comment
const commentIdx = lines.findIndex(l => l.trim() === '{/* Widgets Sidebar */}');
console.log('Comment line:', commentIdx + 1, '|', lines[commentIdx]);

// The AnimatePresence is the very next non-empty line after the comment
let apStartIdx = -1;
for (let i = commentIdx + 1; i < commentIdx + 5; i++) {
    if (lines[i].trim().startsWith('<AnimatePresence')) {
        apStartIdx = i;
        break;
    }
}
console.log('Sidebar AnimatePresence start:', apStartIdx + 1, '|', lines[apStartIdx].trim());

// Find the closing </AnimatePresence> that matches this one
// We know from analysis it's at line 2164 (index 2163)
const motionAsideIdx = lines.findIndex((l, i) => i > apStartIdx && l.trim() === '</motion.aside>');
console.log('</motion.aside> at line:', motionAsideIdx + 1);

// The closing </AnimatePresence> is right after </motion.aside>
let apEndIdx = -1;
for (let i = motionAsideIdx + 1; i < motionAsideIdx + 5; i++) {
    if (lines[i].trim() === '</AnimatePresence>') {
        apEndIdx = i;
        break;
    }
}
console.log('Sidebar AnimatePresence end:', apEndIdx + 1, '|', lines[apEndIdx].trim());
console.log('Total sidebar lines:', apEndIdx - apStartIdx + 1);

// Extract the sidebar JSX (lines apStartIdx to apEndIdx inclusive)
const sidebarJSX = lines.slice(apStartIdx, apEndIdx + 1).join('\n');

// Verify it looks right
console.log('\nFirst 3 lines of extracted JSX:');
sidebarJSX.split('\n').slice(0, 3).forEach(l => console.log(' ', l));
console.log('Last 3 lines of extracted JSX:');
sidebarJSX.split('\n').slice(-3).forEach(l => console.log(' ', l));

// Build WidgetSidebar.tsx
// The sidebar uses many state variables — we pass them all as props
const widgetSidebarFile = `/**
 * WidgetSidebar
 * The collapsible right-side widget panel for StudentDashboard.
 * Contains: Todo, Weather, Deadlines, Activity, GradePredictor, StudyInsights widgets.
 * Extracted from StudentDashboard.tsx during Phase 11.
 */
import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationItem, GroupedNotification, StreakWidget } from './index';

// ── Prop types ────────────────────────────────────────────────────────────────
export interface WidgetSidebarProps {
    widgetsSidebarActive: boolean;
    toggleWidgetsSidebar: () => void;
    widgetVisibility: Record<string, boolean>;
    toggleWidget: (id: string) => void;
    restoreAllWidgets: () => void;
    hasHiddenWidgets: boolean;
    isDemoMode: boolean;
    // Todos
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
    // Weather
    weather: { temp: number; condition: string; icon: string; location: string; humidity: number; wind: number } | null;
    isWeatherLoading: boolean;
    // Deadlines
    deadlines: { id: string; title: string; course: string; dueDate: Date; type: string }[];
    // Activity
    recentActivity: { id: string; type: string; title: string; course: string; timestamp: Date; score?: number }[];
    // Grade predictor
    gradePredictor: { currentGrade: number; predictedGrade: number; trend: 'up' | 'down' | 'stable' } | null;
    // Study insights
    studyInsights: { totalHours: number; avgSession: number; streak: number; bestDay: string } | null;
    // Notifications
    notifications: { id: string; type: string; title: string; message: string; timestamp: Date; read: boolean }[];
    groupedNotifications: { date: string; items: { id: string; type: string; title: string; message: string; timestamp: Date; read: boolean }[] }[];
    // Quick view settings
    quickViewSettings: { compactMode: boolean; showWeather: boolean; showDeadlines: boolean; showActivity: boolean };
    // Achievements
    achievements: { id: string; title: string; description: string; icon: string; unlockedAt?: Date }[];
    // Formatters
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
${sidebarJSX}
    );
};

export default WidgetSidebar;
`;

fs.writeFileSync(path.join(compDir, 'WidgetSidebar.tsx'), widgetSidebarFile, 'utf8');
console.log('\nWidgetSidebar.tsx written:', widgetSidebarFile.split('\n').length, 'lines');

// ── Replace sidebar block in StudentDashboard.tsx ─────────────────────────────
const replacement = [
    '            {/* Widgets Sidebar — extracted to ./components/WidgetSidebar.tsx */}',
    '            <WidgetSidebar',
    '                widgetsSidebarActive={widgetsSidebarActive}',
    '                toggleWidgetsSidebar={toggleWidgetsSidebar}',
    '                widgetVisibility={widgetVisibility}',
    '                toggleWidget={toggleWidget}',
    '                restoreAllWidgets={restoreAllWidgets}',
    '                hasHiddenWidgets={hasHiddenWidgets}',
    '                isDemoMode={isDemoMode}',
    '                todos={todos}',
    '                newTodoText={newTodoText}',
    '                setNewTodoText={setNewTodoText}',
    '                isAddingTodo={isAddingTodo}',
    '                setIsAddingTodo={setIsAddingTodo}',
    '                todoInputRef={todoInputRef}',
    '                addTodo={addTodo}',
    '                toggleTodo={toggleTodo}',
    '                deleteTodo={deleteTodo}',
    '                clearAllTodos={clearAllTodos}',
    '                completedCount={completedCount}',
    '                weather={weather}',
    '                isWeatherLoading={isWeatherLoading}',
    '                deadlines={deadlines}',
    '                recentActivity={recentActivity}',
    '                gradePredictor={gradePredictor}',
    '                studyInsights={studyInsights}',
    '                notifications={notifications}',
    '                groupedNotifications={groupedNotifications}',
    '                quickViewSettings={quickViewSettings}',
    '                achievements={achievements}',
    '                formatDaysUntil={formatDaysUntil}',
    '                getDeadlineTypeColor={getDeadlineTypeColor}',
    '                formatRelativeTime={formatRelativeTime}',
    '                getCourseProgressData={getCourseProgressData}',
    '                formatMinutesToHours={formatMinutesToHours}',
    '            />',
];

// Replace lines commentIdx through apEndIdx with the replacement
const newLines = [
    ...lines.slice(0, commentIdx),
    ...replacement,
    ...lines.slice(apEndIdx + 1),
];

fs.writeFileSync(srcFile, newLines.join('\n'), 'utf8');
console.log('StudentDashboard.tsx new line count:', newLines.length);
console.log('Done.');
