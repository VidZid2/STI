/**
 * extract-course-tabs.cjs
 * Extracts the assignments tab case from CourseViewPage renderContent.
 */
const fs = require('fs');
const path = require('path');

const srcFile = 'src/pages/studentdashboard/content/CourseViewPage/CourseViewPage.tsx';
const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

const tabsDir = 'src/pages/studentdashboard/content/CourseViewPage/tabs';
if (!fs.existsSync(tabsDir)) fs.mkdirSync(tabsDir, { recursive: true });

// From analysis:
// case 'assignments': line 1335 (idx 1334)
// case 'news': line 2077 (idx 2076)
// case 'students': line 2172 (idx 2171)
// case 'teachers': line 2359 (idx 2358)
// renderContent ends: line 2475 (idx 2474)

const assignStart = 1334; // idx of "case 'assignments':"
const newsStart   = 2076; // idx of "case 'news':"
const studentsStart = 2171;
const teachersStart = 2358;
const renderEnd   = 2474;

console.log('Assignments case:', lines[assignStart].trim(), '-> line', assignStart+1);
console.log('News case:', lines[newsStart].trim(), '-> line', newsStart+1);
console.log('Students case:', lines[studentsStart].trim(), '-> line', studentsStart+1);
console.log('Teachers case:', lines[teachersStart].trim(), '-> line', teachersStart+1);

// Extract assignments case (from case line to just before news case)
const assignmentsJSX = lines.slice(assignStart, newsStart).join('\n');
const newsJSX        = lines.slice(newsStart, studentsStart).join('\n');
const studentsJSX    = lines.slice(studentsStart, teachersStart).join('\n');
const teachersJSX    = lines.slice(teachersStart, renderEnd).join('\n');

console.log('\nAssignments case lines:', assignmentsJSX.split('\n').length);
console.log('News case lines:', newsJSX.split('\n').length);
console.log('Students case lines:', studentsJSX.split('\n').length);
console.log('Teachers case lines:', teachersJSX.split('\n').length);

// The assignments tab uses many state variables from CourseViewPage.
// We'll extract it as a render function that receives all needed state as props.

// Build CourseAssignmentsTab.tsx
const assignmentsTabFile = `/**
 * CourseAssignmentsTab
 * The assignments/tasks tab content for CourseViewPage.
 * Extracted from CourseViewPage.tsx during Phase 8.1 continuation.
 */
import * as React from 'react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getCurrentUser } from '../../../../../services/authService';
import { useSystemConfig } from '../../../../../contexts/SystemConfigContext';
import { SearchBar, EmptyState } from '../components/SharedComponents';
import { ActionsDropdown } from '../components/ActionsDropdown';
import { PaginationButton, PageNumberButton } from '../components/PaginationControls';
import { InstructionsModal, SubmitModal, AddTaskModal } from '../modals';
import type { CourseTask, TaskCategory } from '../data/demoCourses';

const TASK_CATEGORIES: { id: TaskCategory; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'all', label: 'All', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>, color: 'zinc' },
    { id: 'assignment', label: 'Assignments', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>, color: 'emerald' },
    { id: 'performance', label: 'Performance', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>, color: 'purple' },
    { id: 'quiz', label: 'Quizzes', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /></svg>, color: 'amber' },
    { id: 'practical', label: 'Practical', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>, color: 'rose' },
    { id: 'journal', label: 'Journals', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>, color: 'cyan' },
    { id: 'overdue', label: 'Overdue', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>, color: 'red' },
];

export interface CourseAssignmentsTabProps {
    course: { id: string; title: string; subtitle: string; image: string; progress: number; instructor?: string };
    isLoading: boolean;
    courseTasks: CourseTask[];
    taskFilter: TaskCategory;
    setTaskFilter: (f: TaskCategory) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    isSearching: boolean;
    systemConfig: { submissions_enabled: boolean };
    showAddTaskModal: boolean;
    setShowAddTaskModal: (v: boolean) => void;
    refetchTasks: () => Promise<void>;
}

export const CourseAssignmentsTab: React.FC<CourseAssignmentsTabProps> = ({
    course,
    isLoading,
    courseTasks,
    taskFilter,
    setTaskFilter,
    searchQuery,
    setSearchQuery,
    isSearching,
    systemConfig,
    showAddTaskModal,
    setShowAddTaskModal,
    refetchTasks,
}) => {
    const [submitModalTask, setSubmitModalTask] = React.useState<CourseTask | null>(null);
    const [instructionsTask, setInstructionsTask] = React.useState<CourseTask | null>(null);
    const [tasksPage, setTasksPage] = React.useState(1);
    const TASKS_PER_PAGE = 8;
    const tasksScrollRef = React.useRef<HTMLDivElement>(null);

    // Filter tasks
    const filteredTasks = React.useMemo(() => {
        let tasks = courseTasks;
        if (taskFilter !== 'all' && taskFilter !== 'overdue') {
            tasks = tasks.filter(t => t.category === taskFilter);
        } else if (taskFilter === 'overdue') {
            tasks = tasks.filter(t => t.status === 'overdue' || t.due?.toLowerCase().includes('overdue'));
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            tasks = tasks.filter(t => t.title.toLowerCase().includes(q));
        }
        return tasks;
    }, [courseTasks, taskFilter, searchQuery]);

    const getTaskCategoryCount = (cat: TaskCategory) => {
        if (cat === 'all') return courseTasks.filter(t => t.status !== 'locked').length;
        if (cat === 'overdue') return courseTasks.filter(t => t.status === 'overdue' || t.due?.toLowerCase().includes('overdue')).length;
        return courseTasks.filter(t => t.category === cat).length;
    };

    return (
${assignmentsJSX}
    );
};

export default CourseAssignmentsTab;
`;

fs.writeFileSync(path.join(tabsDir, 'CourseAssignmentsTab.tsx'), assignmentsTabFile, 'utf8');
console.log('\nCourseAssignmentsTab.tsx written:', assignmentsTabFile.split('\n').length, 'lines');

// Replace the assignments case in renderContent with a component call
// The case block is: case 'assignments': ... (return JSX) ... (no explicit break, falls through to default)
// We replace the entire case block with a simple return of the component

const replacement = [
    "            case 'assignments':",
    '                // Assignments tab — extracted to ./tabs/CourseAssignmentsTab.tsx',
    '                return (',
    '                    <CourseAssignmentsTab',
    '                        course={course}',
    '                        isLoading={isLoading}',
    '                        courseTasks={courseTasks}',
    '                        taskFilter={taskFilter}',
    '                        setTaskFilter={setTaskFilter}',
    '                        searchQuery={searchQuery}',
    '                        setSearchQuery={setSearchQuery}',
    '                        isSearching={isSearching}',
    '                        systemConfig={systemConfig}',
    '                        showAddTaskModal={showAddTaskModal}',
    '                        setShowAddTaskModal={setShowAddTaskModal}',
    '                        refetchTasks={fetchSupabaseTasks}',
    '                    />',
    '                );',
];

const newLines = [
    ...lines.slice(0, assignStart),
    ...replacement,
    ...lines.slice(newsStart),
];

fs.writeFileSync(srcFile, newLines.join('\n'), 'utf8');
console.log('CourseViewPage.tsx new line count:', newLines.length);
console.log('Done.');
