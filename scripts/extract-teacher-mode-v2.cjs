/**
 * extract-teacher-mode-v2.cjs
 * Extracts the teacher mode content JSX from CourseViewPage.tsx.
 * Uses precise boundary detection.
 */
const fs = require('fs');
const path = require('path');

const srcFile = 'src/pages/studentdashboard/content/CourseViewPage/CourseViewPage.tsx';
const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

const compDir = 'src/pages/studentdashboard/content/CourseViewPage/components';

// Find the ternary: {isTeacherMode ? (
const ternaryLine = lines.findIndex((l, i) => i > 2800 && l.trim() === '{isTeacherMode ? (');
console.log('Ternary at line:', ternaryLine + 1);

// The motion.div with key="teacher-content" starts 2 lines after
const motionDivLine = ternaryLine + 2; // skip the comment line
console.log('motion.div starts at line:', motionDivLine + 1, '|', lines[motionDivLine].trim());

// Find the matching closing </motion.div> by tracking depth
// We need to find the </motion.div> that closes the key="teacher-content" div
let depth = 0;
let closingMotionDiv = -1;
for (let i = motionDivLine; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.startsWith('<motion.div') || t.startsWith('<motion.div ')) depth++;
    if (t === '</motion.div>') {
        depth--;
        if (depth === 0) {
            closingMotionDiv = i;
            break;
        }
    }
}
console.log('Closing </motion.div> at line:', closingMotionDiv + 1);

// The ternary else ") : (" should be right after
console.log('Line after closing:', lines[closingMotionDiv + 1].trim());
console.log('Line after that:', lines[closingMotionDiv + 2].trim());

// Extract the teacher mode JSX (from motion.div to closing motion.div inclusive)
const teacherJSX = lines.slice(motionDivLine, closingMotionDiv + 1).join('\n');
console.log('\nTeacher mode JSX lines:', teacherJSX.split('\n').length);
console.log('First 3 lines:');
teacherJSX.split('\n').slice(0, 3).forEach(l => console.log(' ', l));
console.log('Last 3 lines:');
teacherJSX.split('\n').slice(-3).forEach(l => console.log(' ', l));

// Build TeacherModeContent.tsx
const teacherModeFile = `/**
 * TeacherModeContent
 * Teacher mode tab content for CourseViewPage (Manage Tasks, Grade Students, Analytics).
 * Extracted from CourseViewPage.tsx during Phase 8.1 continuation.
 */
import * as React from 'react';
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
// Replace from ternaryLine to closingMotionDiv (inclusive) with the component call
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
    ...lines.slice(0, ternaryLine),
    ...replacement,
    ...lines.slice(closingMotionDiv + 1),
];

fs.writeFileSync(srcFile, newLines.join('\n'), 'utf8');
console.log('CourseViewPage.tsx new line count:', newLines.length);
console.log('Done.');
