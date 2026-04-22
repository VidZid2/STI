/**
 * extract-teacher-mode-v3.cjs
 * Uses exact line numbers from analysis to extract teacher mode content.
 */
const fs = require('fs');
const path = require('path');

const srcFile = 'src/pages/studentdashboard/content/CourseViewPage/CourseViewPage.tsx';
const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

const compDir = 'src/pages/studentdashboard/content/CourseViewPage/components';

// From analysis:
// Line 2810 (idx 2809): {isTeacherMode ? (
// Line 2811 (idx 2810): // Teacher Mode Content
// Line 2812 (idx 2811): <motion.div key="teacher-content" ...
// Line 3841 (idx 3840): </motion.div>   <- closes key="teacher-content"
// Line 3842 (idx 3841): ) : (           <- student mode ternary else

// Verify these lines
console.log('Line 2810:', lines[2809].trim());
console.log('Line 2811:', lines[2810].trim());
console.log('Line 2812:', lines[2811].trim());
console.log('Line 3840:', lines[3839].trim());
console.log('Line 3841:', lines[3840].trim());
console.log('Line 3842:', lines[3841].trim());
console.log('Line 3843:', lines[3842].trim());

// Find the exact closing </motion.div> by searching for the pattern
// "                        </motion.div>" followed by "                    ) : ("
let closingIdx = -1;
for (let i = 3800; i < 3900; i++) {
    if (lines[i].trim() === '</motion.div>' && lines[i+1].trim() === ') : (') {
        closingIdx = i;
        break;
    }
}
console.log('\nFound closing </motion.div> at line:', closingIdx + 1);
console.log('Followed by:', lines[closingIdx + 1].trim());

// The teacher mode JSX is from line 2812 (idx 2811) to closingIdx (inclusive)
const teacherJSX = lines.slice(2811, closingIdx + 1).join('\n');
console.log('Teacher mode JSX lines:', teacherJSX.split('\n').length);
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
// Replace lines 2809 (ternary start) through closingIdx with the component call
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
    ...lines.slice(0, 2809),
    ...replacement,
    ...lines.slice(closingIdx + 1),
];

fs.writeFileSync(srcFile, newLines.join('\n'), 'utf8');
console.log('CourseViewPage.tsx new line count:', newLines.length);
console.log('Done.');
