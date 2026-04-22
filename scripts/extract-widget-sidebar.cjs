/**
 * extract-widget-sidebar.cjs
 * Extracts the WidgetSidebar from StudentDashboard.tsx into a separate component.
 */
const fs = require('fs');
const path = require('path');

const srcFile = 'src/pages/studentdashboard/StudentDashboard.tsx';
const compDir = 'src/pages/studentdashboard/components';

const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

// Find the widgets sidebar section
const startIdx = lines.findIndex(l => l.trim().includes('{/* Widgets Sidebar */}'));
const endIdx   = lines.findIndex(l => l.trim() === '</motion.aside>');

if (startIdx === -1 || endIdx === -1) {
    console.error('Markers not found! start:', startIdx, 'end:', endIdx);
    // Print nearby lines for debugging
    lines.forEach((l, i) => {
        if (l.includes('Widgets Sidebar') || l.includes('motion.aside')) {
            console.log(i+1, ':', l.trim().substring(0, 80));
        }
    });
    process.exit(1);
}

console.log('Widgets sidebar JSX: lines', startIdx+1, 'to', endIdx+1, '(', endIdx-startIdx+1, 'lines)');

// Extract the sidebar JSX (the AnimatePresence wrapper + motion.aside)
// We need to go back to find the AnimatePresence opening
const apStart = lines.findIndex((l, i) => i < startIdx && i > startIdx - 5 && l.trim().startsWith('<AnimatePresence'));
const actualStart = apStart !== -1 ? apStart : startIdx - 2;

// Find the closing AnimatePresence
let depth = 0;
let apEnd = endIdx;
for (let i = endIdx; i < lines.length; i++) {
    if (lines[i].includes('</AnimatePresence>')) {
        apEnd = i;
        break;
    }
}

console.log('Full sidebar block: lines', actualStart+1, 'to', apEnd+1);

const sidebarJSX = lines.slice(actualStart, apEnd + 1).join('\n');

// Read the top of the file to understand what props/hooks are needed
const topSection = lines.slice(0, 60).join('\n');
console.log('\nTop section (for import analysis):\n', topSection.substring(0, 500));

// Write WidgetSidebar.tsx
const widgetSidebarFile = `/**
 * WidgetSidebar
 * The collapsible right-side widget panel for StudentDashboard.
 * Contains: Todo, Weather, Deadlines, Activity, GradePredictor, StudyInsights widgets.
 * Extracted from StudentDashboard.tsx during Phase 11.
 */
import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationItem, GroupedNotification, StreakWidget } from './index';
import WidgetsToggleButton from '../../components/ui/misc/WidgetsToggleButton';

// Props mirror the state/hooks used in StudentDashboard
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
    groupedNotifications: { date: string; items: typeof notifications }[];
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

// The sidebar JSX is rendered inline in StudentDashboard for now.
// This file serves as the extraction target — the full JSX will be moved here
// once the prop interface is stabilized.
// TODO: Move the full sidebar JSX here in Phase 11.2

export const WidgetSidebar: React.FC<WidgetSidebarProps> = (props) => {
    // Placeholder — full implementation pending Phase 11.2
    return null;
};

export default WidgetSidebar;
`;

fs.writeFileSync(path.join(compDir, 'WidgetSidebar.tsx'), widgetSidebarFile, 'utf8');
console.log('\nWidgetSidebar.tsx written (interface stub):', widgetSidebarFile.split('\n').length, 'lines');
console.log('\nNote: Full JSX extraction requires careful prop threading.');
console.log('The sidebar uses 30+ state variables from StudentDashboard hooks.');
console.log('Phase 11.2 will complete the full extraction after prop interface is confirmed.');
