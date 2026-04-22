/**
 * extract-teacher-mode.cjs
 * Extracts the teacher mode content JSX from CourseViewPage.tsx
 * into a TeacherModeContent component.
 */
const fs = require('fs');
const path = require('path');

const srcFile = 'src/pages/studentdashboard/content/CourseViewPage/CourseViewPage.tsx';
const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

const compDir = 'src/pages/studentdashboard/content/CourseViewPage/components';

// Find the teacher mode content block
// Start: the line with "// Teacher Mode Content" comment inside the ternary
const teacherContentStart = lines.findIndex(l => l.trim() === '// Teacher Mode Content');
console.log('Teacher Mode Content starts at line:', teacherContentStart + 1);
console.log('Context:', lines[teacherContentStart - 1].trim(), '|', lines[teacherContentStart].trim(), '|', lines[teacherContentStart + 1].trim());

// The actual motion.div starts on the next line
const motionDivStart = teacherContentStart + 1;

// Find the end: ") : (" which is the ternary else branch (Student Mode Content)
const studentModeStart = lines.findIndex((l, i) => i > teacherContentStart && l.trim() === ') : (');
console.log('Student Mode starts at line:', studentModeStart + 1);
console.log('Context:', lines[studentModeStart - 1].trim(), '|', lines[studentModeStart].trim(), '|', lines[studentModeStart + 1].trim());

// The teacher mode JSX is from motionDivStart to studentModeStart - 1
const teacherJSX = lines.slice(motionDivStart, studentModeStart).join('\n');
console.log('Teacher mode JSX lines:', teacherJSX.split('\n').length);

// Verify the JSX looks right
console.log('\nFirst 3 lines:');
teacherJSX.split('\n').slice(0, 3).forEach(l => console.log(' ', l));
console.log('Last 3 lines:');
teacherJSX.split('\n').slice(-3).forEach(l => console.log(' ', l));

// Build TeacherModeContent.tsx
// The teacher mode uses these state variables from CourseViewPage:
// teacherTab, setTeacherTab, isTeacherLoading, yearLevelFilter, setYearLevelFilter,
// sectionFilter, setSectionFilter, submissions, setSubmissions, isAiGrading,
// setIsAiGrading, aiGradingProgress, setAiGradingProgress, showAiWarning,
// setShowAiWarning, selectedTaskType, setSelectedTaskType, showAddTaskModal,
// setShowAddTaskModal, course, systemConfig, supabaseStudents, supabaseTasks,
// fetchSupabaseTasks (now refetch from hook), getDemoAIGradingData

const teacherModeFile = `/**
 * TeacherModeContent
 * Teacher mode tab content for CourseViewPage (Manage Tasks, Grade Students, Analytics).
 * Extracted from CourseViewPage.tsx during Phase 8.1 continuation.
 */
import * as React from 'react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSystemConfig } from '../../../../../contexts/SystemConfigContext';
import { TeacherActionButton, SearchBar } from './SharedComponents';
import { PreviewIconWithTooltip } from './PreviewIconWithTooltip';
import { AddTaskModal } from '../modals';
import type { CourseTask, TaskCategory } from '../data/demoCourses';
import type { UserAccount } from '../../../../../services/usersService';
import { getDemoAIGradingData } from '../data/demoCourses';

// ── Types ─────────────────────────────────────────────────────────────────────
type TeacherTabType = 'manage-tasks' | 'grade-students' | 'analytics';
type YearLevel = 'all' | '1st' | '2nd' | '3rd' | '4th';
type Section = 'all' | 'A' | 'B' | 'C' | 'D';

interface Submission {
    id: number;
    studentName: string;
    studentId: string;
    task: string;
    submitted: string;
    status: string;
    yearLevel: YearLevel;
    section: Section;
    aiScore: number | null;
}

export interface TeacherModeContentProps {
    course: {
        id: string;
        title: string;
        subtitle: string;
        image: string;
        progress: number;
        instructor?: string;
    };
    teacherTab: TeacherTabType;
    setTeacherTab: (tab: TeacherTabType) => void;
    isTeacherLoading: boolean;
    yearLevelFilter: YearLevel;
    setYearLevelFilter: (v: YearLevel) => void;
    sectionFilter: Section;
    setSectionFilter: (v: Section) => void;
    submissions: Submission[];
    setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
    isAiGrading: boolean;
    setIsAiGrading: (v: boolean) => void;
    aiGradingProgress: number;
    setAiGradingProgress: (v: number) => void;
    showAiWarning: boolean;
    setShowAiWarning: (v: boolean) => void;
    selectedTaskType: TaskCategory;
    setSelectedTaskType: (v: TaskCategory) => void;
    showAddTaskModal: boolean;
    setShowAddTaskModal: (v: boolean) => void;
    supabaseStudents: UserAccount[];
    supabaseTasks: CourseTask[];
    refetchTasks: () => Promise<void>;
}

export const TeacherModeContent: React.FC<TeacherModeContentProps> = ({
    course,
    teacherTab,
    setTeacherTab,
    isTeacherLoading,
    yearLevelFilter,
    setYearLevelFilter,
    sectionFilter,
    setSectionFilter,
    submissions,
    setSubmissions,
    isAiGrading,
    setIsAiGrading,
    aiGradingProgress,
    setAiGradingProgress,
    showAiWarning,
    setShowAiWarning,
    selectedTaskType,
    setSelectedTaskType,
    showAddTaskModal,
    setShowAddTaskModal,
    supabaseStudents,
    supabaseTasks,
    refetchTasks,
}) => {
    const { systemConfig } = useSystemConfig();

    return (
${teacherJSX}
    );
};

export default TeacherModeContent;
`;

fs.writeFileSync(path.join(compDir, 'TeacherModeContent.tsx'), teacherModeFile, 'utf8');
console.log('\nTeacherModeContent.tsx written:', teacherModeFile.split('\n').length, 'lines');

// ── Replace teacher mode JSX in CourseViewPage.tsx ────────────────────────────
// Replace from teacherContentStart-1 (the "isTeacherMode ? (" line) to studentModeStart
// with a <TeacherModeContent ... /> call

// Find the exact ternary start: "{isTeacherMode ? ("
const ternaryStart = lines.findIndex((l, i) => i > 2800 && l.trim() === '{isTeacherMode ? (');
console.log('\nTernary start at line:', ternaryStart + 1);

const replacement = [
    '                    {isTeacherMode ? (',
    '                        // Teacher Mode Content — extracted to ./components/TeacherModeContent.tsx',
    '                        <TeacherModeContent',
    '                            course={course}',
    '                            teacherTab={teacherTab}',
    '                            setTeacherTab={setTeacherTab}',
    '                            isTeacherLoading={isTeacherLoading}',
    '                            yearLevelFilter={yearLevelFilter}',
    '                            setYearLevelFilter={setYearLevelFilter}',
    '                            sectionFilter={sectionFilter}',
    '                            setSectionFilter={setSectionFilter}',
    '                            submissions={submissions}',
    '                            setSubmissions={setSubmissions}',
    '                            isAiGrading={isAiGrading}',
    '                            setIsAiGrading={setIsAiGrading}',
    '                            aiGradingProgress={aiGradingProgress}',
    '                            setAiGradingProgress={setAiGradingProgress}',
    '                            showAiWarning={showAiWarning}',
    '                            setShowAiWarning={setShowAiWarning}',
    '                            selectedTaskType={selectedTaskType}',
    '                            setSelectedTaskType={setSelectedTaskType}',
    '                            showAddTaskModal={showAddTaskModal}',
    '                            setShowAddTaskModal={setShowAddTaskModal}',
    '                            supabaseStudents={supabaseStudents}',
    '                            supabaseTasks={supabaseTasks}',
    '                            refetchTasks={fetchSupabaseTasks}',
    '                        />',
];

const newLines = [
    ...lines.slice(0, ternaryStart),
    ...replacement,
    ...lines.slice(studentModeStart),
];

fs.writeFileSync(srcFile, newLines.join('\n'), 'utf8');
console.log('CourseViewPage.tsx new line count:', newLines.length);
console.log('Done.');
