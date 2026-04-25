/**
 * TeacherModeContent
 * Teacher mode tab content for CourseViewPage (Manage Tasks, Grade Students, Analytics).
 * Extracted from CourseViewPage.tsx during Phase 8.1 continuation.
 */
import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';

import type { CourseTask, TaskCategory } from '../data/demoCourses';
import type { UserAccount } from '../../../../../services/usersService';
// Demo imports removed

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
    course: _course,
    teacherTab,
    setTeacherTab: _setTeacherTab,
    isTeacherLoading,
    yearLevelFilter,
    setYearLevelFilter: _setYearLevelFilter,
    sectionFilter,
    setSectionFilter: _setSectionFilter,
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
    showAddTaskModal: _showAddTaskModal,
    setShowAddTaskModal,
    supabaseStudents,
    supabaseTasks,
    refetchTasks: _refetchTasks }) => {
    // const { systemConfig } = useSystemConfig();
    const tasksScrollRef = React.useRef<HTMLDivElement>(null);
    const submissionsScrollRef = React.useRef<HTMLDivElement>(null);

    // Derive courseTasks from supabaseTasks prop
    const courseTasks = supabaseTasks;

    // Derive studentsData from supabaseStudents

    // Task category filter options
    const TASK_CATEGORIES: { id: TaskCategory; label: string; icon: React.ReactNode }[] = [
        { id: 'all', label: 'All', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg> },
        { id: 'assignment', label: 'Assignments', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg> },
        { id: 'performance', label: 'Performance', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg> },
        { id: 'quiz', label: 'Quizzes', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /></svg> },
        { id: 'practical', label: 'Practical', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg> },
        { id: 'journal', label: 'Journals', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg> },
    ];

    return (
                        <motion.div
                            key="teacher-content"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {teacherTab === 'manage-tasks' && (
                                isTeacherLoading ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                        {/* Header Skeleton */}
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-2">
                                                <motion.div className="h-4 w-32 bg-zinc-200 rounded-lg" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                                                <motion.div className="h-3 w-48 bg-zinc-100 rounded-lg" animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }} />
                                            </div>
                                            <motion.div className="h-10 w-24 bg-zinc-200 rounded-xl" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                                        </div>
                                        {/* Filter Pills Skeleton */}
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                                <motion.div key={i} className="h-8 w-24 bg-zinc-100 rounded-lg flex-shrink-0" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }} />
                                            ))}
                                        </div>
                                        {/* Cards Skeleton */}
                                        <div className="flex gap-4 overflow-x-auto pt-2 pb-4 -mx-1 px-1">
                                            {[0, 1, 2, 3].map((i) => (
                                                <motion.div key={i} className="flex-shrink-0 w-64 h-48 bg-zinc-100 rounded-2xl" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }} />
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Header with Add Button */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-sm font-semibold text-zinc-800">Course Tasks</h2>
                                                <p className="text-[11px] text-zinc-500 mt-0.5">Manage assignments, quizzes, and activities</p>
                                            </div>
                                            <motion.button
                                                onClick={() => setShowAddTaskModal(true)}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                transition={{ duration: 0.1 }}
                                                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <path d="M12 5v14M5 12h14" />
                                                </svg>
                                                Add Task
                                            </motion.button>
                                        </div>

                                        {/* Task Type Filters - Horizontal Pills */}
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            {TASK_CATEGORIES.map((cat) => (
                                                <motion.button
                                                    key={cat.id}
                                                    onClick={() => setSelectedTaskType(cat.id)}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    transition={{ duration: 0.1 }}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg whitespace-nowrap ${selectedTaskType === cat.id
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                                        }`}
                                                >
                                                    {cat.icon}
                                                    {cat.label}
                                                </motion.button>
                                            ))}
                                        </div>

                                        {/* Tasks Cards - Horizontal Scroll */}
                                        {courseTasks.filter((t: { category: TaskCategory }) => selectedTaskType === 'all' || t.category === selectedTaskType).length === 0 ? (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex flex-col items-center justify-center py-16 px-6 text-center"
                                            >
                                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-zinc-50 flex items-center justify-center mb-5 border border-blue-100">
                                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                        <polyline points="14 2 14 8 20 8" />
                                                        <line x1="12" y1="18" x2="12" y2="12" />
                                                        <line x1="9" y1="15" x2="15" y2="15" />
                                                    </svg>
                                                </div>
                                                <p className="text-base font-semibold text-zinc-800 mb-2">No tasks yet</p>
                                                <p className="text-sm text-zinc-500 max-w-sm mb-6">Create your first task to get started. Add assignments, quizzes, performance tasks, and more for your students.</p>
                                                <motion.button
                                                    onClick={() => setShowAddTaskModal(true)}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/25"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <path d="M12 5v14M5 12h14" />
                                                    </svg>
                                                    Create First Task
                                                </motion.button>
                                            </motion.div>
                                        ) : (
                                            <div
                                                ref={tasksScrollRef}
                                                className="flex gap-4 overflow-x-auto pt-2 pb-4 -mx-1 px-1 snap-x snap-mandatory scroll-smooth"
                                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                            >
                                                {courseTasks.filter((t: { category: TaskCategory }) => selectedTaskType === 'all' || t.category === selectedTaskType).map((task: typeof courseTasks[0], index: number) => (
                                                    <motion.div
                                                        key={task.id}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        whileHover={{
                                                            y: -6,
                                                            scale: 1.02,
                                                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
                                                        }}
                                                        transition={{
                                                            type: 'spring',
                                                            stiffness: 400,
                                                            damping: 25,
                                                            delay: index * 0.03
                                                        }}
                                                        className="flex-shrink-0 w-64 bg-white rounded-2xl border border-blue-100 hover:border-blue-300 snap-start overflow-hidden cursor-pointer"
                                                    >
                                                        {/* Card Header with Category Color */}
                                                        <div className={`h-1.5 ${task.category === 'assignment' ? 'bg-blue-500' :
                                                            task.category === 'quiz' ? 'bg-yellow-500' :
                                                                task.category === 'performance' ? 'bg-blue-600' :
                                                                    task.category === 'practical' ? 'bg-blue-700' :
                                                                        'bg-blue-400'
                                                            }`} />

                                                        <div className="p-4">
                                                            {/* Category Badge */}
                                                            <div className="flex items-center justify-between mb-3">
                                                                <span className={`px-2 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wide ${task.category === 'assignment' ? 'bg-blue-50 text-blue-600' :
                                                                    task.category === 'quiz' ? 'bg-yellow-50 text-yellow-600' :
                                                                        task.category === 'performance' ? 'bg-blue-50 text-blue-700' :
                                                                            task.category === 'practical' ? 'bg-blue-50 text-blue-700' :
                                                                                'bg-blue-50 text-blue-600'
                                                                    }`}>
                                                                    {task.category}
                                                                </span>
                                                                <span className={`text-[10px] font-medium ${task.status === 'submitted' ? 'text-blue-600' :
                                                                    task.status === 'pending' ? 'text-yellow-600' :
                                                                        'text-zinc-400'
                                                                    }`}>
                                                                    {task.status === 'submitted' ? 'Active' : task.status === 'pending' ? 'Due Soon' : 'Upcoming'}
                                                                </span>
                                                            </div>

                                                            {/* Task Title */}
                                                            <h3 className="text-sm font-semibold text-zinc-800 line-clamp-2 mb-2">{task.title}</h3>

                                                            {/* Due Date */}
                                                            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-4">
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                                    <line x1="16" y1="2" x2="16" y2="6" />
                                                                    <line x1="8" y1="2" x2="8" y2="6" />
                                                                    <line x1="3" y1="10" x2="21" y2="10" />
                                                                </svg>
                                                                Due: {task.due}
                                                            </div>

                                                            {/* Action Buttons */}
                                                            <div className="flex items-center gap-2">
                                                                <motion.button
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    transition={{ duration: 0.1 }}
                                                                    className="flex-1 py-2 text-[10px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center gap-1.5"
                                                                >
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                        <path d="M12 20h9" />
                                                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                                                    </svg>
                                                                    Edit
                                                                </motion.button>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    transition={{ duration: 0.1 }}
                                                                    className="flex-1 py-2 text-[10px] font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg flex items-center justify-center gap-1.5"
                                                                >
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                        <circle cx="12" cy="12" r="3" />
                                                                    </svg>
                                                                    View
                                                                </motion.button>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.05 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    transition={{ duration: 0.1 }}
                                                                    className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                    </svg>
                                                                </motion.button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            )}

                            {teacherTab === 'grade-students' && (
                                isTeacherLoading ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                        {/* Header Skeleton */}
                                        <div className="flex items-center justify-between">
                                            <motion.div className="h-4 w-40 bg-zinc-200 rounded-lg" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                                            <motion.div className="h-9 w-28 bg-zinc-200 rounded-lg" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                                        </div>
                                        {/* Submission Cards Skeleton */}
                                        <div className="flex gap-4 overflow-x-auto pt-2 pb-4 px-1 -mx-1">
                                            {[0, 1, 2, 3].map((i) => (
                                                <motion.div key={i} className="flex-shrink-0 w-72 bg-zinc-100 rounded-2xl overflow-hidden" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}>
                                                    <div className="p-4 pb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-11 h-11 rounded-full bg-zinc-200" />
                                                            <div className="flex-1 space-y-2">
                                                                <div className="h-3 w-24 bg-zinc-200 rounded" />
                                                                <div className="h-2 w-16 bg-zinc-200 rounded" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="px-4 pb-3 space-y-2">
                                                        <div className="h-3 w-32 bg-zinc-200 rounded" />
                                                        <div className="h-2 w-24 bg-zinc-200 rounded" />
                                                    </div>
                                                    <div className="px-4 pb-4 flex gap-2">
                                                        <div className="flex-1 h-8 bg-zinc-200 rounded-lg" />
                                                        <div className="flex-1 h-8 bg-zinc-200 rounded-lg" />
                                                        <div className="w-9 h-8 bg-zinc-200 rounded-lg" />
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-sm font-semibold text-zinc-800">Student Submissions</h2>
                                            <div className="flex items-center gap-2">
                                                <motion.button
                                                    whileHover={!isAiGrading ? { scale: 1.02 } : {}}
                                                    whileTap={!isAiGrading ? { scale: 0.98 } : {}}
                                                    disabled={isAiGrading}
                                                    onClick={() => {
                                                        // AI Grade All - grade all pending submissions
                                                        const pendingSubmissions = submissions.filter(
                                                            (s: Submission) => s.status === 'pending' &&
                                                                (yearLevelFilter === 'all' || s.yearLevel === yearLevelFilter) &&
                                                                (sectionFilter === 'all' || s.section === sectionFilter)
                                                        );

                                                        if (pendingSubmissions.length === 0) return;

                                                        setIsAiGrading(true);
                                                        setAiGradingProgress(0);
                                                        setShowAiWarning(true);

                                                        // Auto-hide warning after 10 seconds
                                                        setTimeout(() => setShowAiWarning(false), 10000);

                                                        // Simulate AI grading with staggered updates
                                                        pendingSubmissions.forEach((sub: Submission, index: number) => {
                                                            setTimeout(() => {
                                                                setSubmissions((prev: Submission[]) => prev.map((s: Submission) =>
                                                                    s.id === sub.id
                                                                        ? { ...s, status: 'ai-checked', aiScore: Math.floor(Math.random() * 25) + 75 }
                                                                        : s
                                                                ));
                                                                setAiGradingProgress(Math.round(((index + 1) / pendingSubmissions.length) * 100));

                                                                // End grading when all done
                                                                if (index === pendingSubmissions.length - 1) {
                                                                    setTimeout(() => {
                                                                        setIsAiGrading(false);
                                                                        setAiGradingProgress(0);
                                                                    }, 500);
                                                                }
                                                            }, (index + 1) * 500); // Stagger by 500ms
                                                        });
                                                    }}
                                                    className={`flex items-center gap-2 px-3 py-2 text-[11px] font-medium rounded-lg transition-${isAiGrading
                                                        ? 'text-blue-400 bg-blue-100 cursor-not-allowed'
                                                        : 'text-white bg-blue-600 hover:bg-blue-700'
                                                        }`}
                                                >
                                                    {isAiGrading ? (
                                                        <motion.svg
                                                            width="12"
                                                            height="12"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                        >
                                                            <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                                                        </motion.svg>
                                                    ) : (
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                                                            <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                                                        </svg>
                                                    )}
                                                    {isAiGrading ? `Grading... ${aiGradingProgress}%` : 'AI Grade All'}
                                                </motion.button>
                                            </div>
                                        </div>

                                        {/* AI Grading Loading Overlay - Minimalistic */}
                                        <AnimatePresence>
                                            {isAiGrading && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                                    className="p-4 bg-white rounded-xl border border-blue-100 shadow-sm"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        {/* Circular Progress */}
                                                        <div className="relative w-11 h-11 flex-shrink-0">
                                                            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
                                                                <circle
                                                                    cx="22"
                                                                    cy="22"
                                                                    r="18"
                                                                    fill="none"
                                                                    stroke="#e5e7eb"
                                                                    strokeWidth="4"
                                                                />
                                                                <motion.circle
                                                                    cx="22"
                                                                    cy="22"
                                                                    r="18"
                                                                    fill="none"
                                                                    stroke="#2563eb"
                                                                    strokeWidth="4"
                                                                    strokeLinecap="round"
                                                                    initial={{ pathLength: 0 }}
                                                                    animate={{ pathLength: aiGradingProgress / 100 }}
                                                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                                                    style={{ strokeDasharray: '113.1', strokeDashoffset: '0' }}
                                                                />
                                                            </svg>
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <span className="text-[10px] font-bold text-blue-600">{aiGradingProgress}%</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            {/* Animated Status Text */}
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <AnimatePresence mode="wait">
                                                                    <motion.div
                                                                        key={aiGradingProgress < 50 ? 'analyzing' : aiGradingProgress < 80 ? 'grading' : 'finishing'}
                                                                        initial={{ opacity: 0, y: 8 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0, y: -8 }}
                                                                        transition={{ duration: 0.2 }}
                                                                        className="flex items-center gap-2"
                                                                    >
                                                                        {/* SVG Icons based on progress */}
                                                                        {aiGradingProgress < 50 ? (
                                                                            <motion.svg
                                                                                width="14"
                                                                                height="14"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                stroke="#2563eb"
                                                                                strokeWidth="2"
                                                                                strokeLinecap="round"
                                                                                animate={{ scale: [1, 1.1, 1] }}
                                                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                                            >
                                                                                <circle cx="11" cy="11" r="8" />
                                                                                <path d="m21 21-4.35-4.35" />
                                                                            </motion.svg>
                                                                        ) : aiGradingProgress < 80 ? (
                                                                            <motion.svg
                                                                                width="14"
                                                                                height="14"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                stroke="#2563eb"
                                                                                strokeWidth="2"
                                                                                strokeLinecap="round"
                                                                                animate={{ y: [0, -2, 0] }}
                                                                                transition={{ duration: 0.8, repeat: Infinity }}
                                                                            >
                                                                                <path d="M12 20h9" />
                                                                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                                                            </motion.svg>
                                                                        ) : (
                                                                            <motion.svg
                                                                                width="14"
                                                                                height="14"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                stroke="#2563eb"
                                                                                strokeWidth="2"
                                                                                strokeLinecap="round"
                                                                                initial={{ scale: 0 }}
                                                                                animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                                                                                transition={{ duration: 0.5 }}
                                                                            >
                                                                                <polyline points="20 6 9 17 4 12" />
                                                                            </motion.svg>
                                                                        )}
                                                                        <span className="text-sm font-medium text-zinc-800">
                                                                            {aiGradingProgress < 50 ? 'Analyzing submissions...' : aiGradingProgress < 80 ? 'Grading in progress...' : 'Almost done...'}
                                                                        </span>
                                                                    </motion.div>
                                                                </AnimatePresence>
                                                            </div>
                                                            <p className="text-[11px] text-zinc-500">Please wait a moment</p>

                                                            {/* Progress Bar - Solid Blue */}
                                                            <div className="mt-2 h-1 bg-zinc-100 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    className="h-full bg-blue-600 rounded-full"
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${aiGradingProgress}%` }}
                                                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* AI Warning Tooltip */}
                                        <AnimatePresence>
                                            {showAiWarning && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                    className="relative flex items-start gap-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200 shadow-sm"
                                                >
                                                    {/* Warning Icon */}
                                                    <motion.div
                                                        className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"
                                                        animate={{ scale: [1, 1.05, 1] }}
                                                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                                    >
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                                            <line x1="12" y1="9" x2="12" y2="13" />
                                                            <line x1="12" y1="17" x2="12.01" y2="17" />
                                                        </svg>
                                                    </motion.div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-amber-800">AI Grading Notice</p>
                                                        <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                                                            Please double-check the graded submissions. AI can sometimes make mistakes in evaluating answers.
                                                        </p>
                                                    </div>

                                                    {/* Close Button */}
                                                    <motion.button
                                                        onClick={() => setShowAiWarning(false)}
                                                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(217, 119, 6, 0.1)' }}
                                                        whileTap={{ scale: 0.95 }}
                                                        className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-amber-500 hover:text-amber-700 transition-"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <path d="M18 6L6 18M6 6l12 12" />
                                                        </svg>
                                                    </motion.button>

                                                    {/* Progress bar for auto-dismiss */}
                                                    <motion.div
                                                        className="absolute bottom-0 left-0 h-1 bg-amber-400 rounded-b-xl"
                                                        initial={{ width: '100%' }}
                                                        animate={{ width: '0%' }}
                                                        transition={{ duration: 10, ease: 'linear' }}
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Submissions List - Horizontal Scrolling Cards */}
                                        {submissions.length === 0 ? (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex flex-col items-center justify-center py-12 px-6 text-center"
                                            >
                                                <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                        <polyline points="14 2 14 8 20 8" />
                                                        <line x1="16" y1="13" x2="8" y2="13" />
                                                        <line x1="16" y1="17" x2="8" y2="17" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-semibold text-zinc-700 mb-1">No submissions yet</p>
                                                <p className="text-xs text-zinc-500 max-w-xs">Student submissions will appear here once they submit their assignments.</p>
                                            </motion.div>
                                        ) : (
                                            /* Cards Container */
                                            <div
                                                ref={submissionsScrollRef}
                                                className="flex gap-4 overflow-x-auto pt-2 pb-4 px-1 -mx-1 snap-x snap-mandatory scroll-smooth"
                                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                            >
                                                {submissions
                                                    .filter((s: Submission) => (yearLevelFilter === 'all' || s.yearLevel === yearLevelFilter) && (sectionFilter === 'all' || s.section === sectionFilter))
                                                    .map((submission: Submission, index: number) => (
                                                        <motion.div
                                                            key={submission.id}
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            whileHover={{
                                                                y: -6,
                                                                scale: 1.02,
                                                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
                                                            }}
                                                            transition={{
                                                                type: 'spring',
                                                                stiffness: 400,
                                                                damping: 25,
                                                                delay: index * 0.05
                                                            }}
                                                            className="flex-shrink-0 w-72 bg-white rounded-2xl border border-blue-100 hover:border-blue-300 snap-start overflow-hidden cursor-pointer"
                                                        >
                                                            {/* Card Header */}
                                                            <div className="p-4 pb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <motion.div
                                                                        className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                                                                        whileHover={{ scale: 1.05 }}
                                                                        transition={{ type: 'spring', stiffness: 400 }}
                                                                    >
                                                                        {submission.studentName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                                                    </motion.div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-semibold text-zinc-800 truncate">{submission.studentName}</p>
                                                                        <p className="text-[10px] text-zinc-400">{submission.yearLevel} Year · Section {submission.section}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Task Info */}
                                                            <div className="px-4 pb-3">
                                                                <p className="text-[11px] text-zinc-600 truncate">{submission.task}</p>
                                                                <p className="text-[10px] text-zinc-400 mt-0.5">Submitted: {submission.submitted}</p>
                                                            </div>

                                                            {/* Score & Status Section */}
                                                            <div className="px-4 pb-3 flex items-center justify-between">
                                                                {/* Status Badge */}
                                                                <motion.span
                                                                    layout
                                                                    className={`px-2.5 py-1 text-[10px] font-semibold rounded-full ${submission.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                                                                        submission.status === 'ai-checked' ? 'bg-blue-50 text-blue-600' :
                                                                            'bg-blue-600 text-white'
                                                                        }`}
                                                                >
                                                                    {submission.status === 'pending' ? 'Pending' : submission.status === 'ai-checked' ? 'AI Checked' : 'Graded'}
                                                                </motion.span>

                                                                {/* AI Score */}
                                                                <AnimatePresence>
                                                                    {submission.aiScore && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                                            animate={{ opacity: 1, scale: 1 }}
                                                                            className="text-right"
                                                                        >
                                                                            <p className="text-xl font-bold text-blue-600">{submission.aiScore}</p>
                                                                            <p className="text-[9px] text-zinc-400 -mt-0.5">AI Score</p>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>

                                                            {/* Action Buttons */}
                                                            <div className="px-4 pb-4 flex items-center gap-2">
                                                                <motion.button
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    onClick={() => {
                                                                        setSubmissions((prev: Submission[]) => prev.map((s: Submission) =>
                                                                            s.id === submission.id ? { ...s, status: 'ai-checked', aiScore: Math.floor(Math.random() * 25) + 75 } : s
                                                                        ));
                                                                    }}
                                                                    className="flex-1 py-2 text-[10px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-flex items-center justify-center gap-1.5"
                                                                >
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                        <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                                                                        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                                                                    </svg>
                                                                    AI Check
                                                                </motion.button>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    className="flex-1 py-2 text-[10px] font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-flex items-center justify-center gap-1.5"
                                                                >
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                        <path d="M12 20h9" />
                                                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                                                    </svg>
                                                                    Grade
                                                                </motion.button>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.05 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={() => {
                                                                        setSubmissions((prev: Submission[]) => prev.map((s: Submission) =>
                                                                            s.id === submission.id ? { ...s, status: 'graded' } : s
                                                                        ));
                                                                    }}
                                                                    className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-"
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                        <polyline points="20 6 9 17 4 12" />
                                                                    </svg>
                                                                </motion.button>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            )}

                            {teacherTab === 'analytics' && (() => {
                                // Calculate real statistics from submissions
                                const totalStudents = supabaseStudents.length;
                                const totalSubmissions = submissions.length;
                                const pendingCount = submissions.filter((s: Submission) => s.status === 'pending').length;
                                const gradedSubmissions = submissions.filter((s: Submission) => s.aiScore !== null);
                                const averageGrade = gradedSubmissions.length > 0
                                    ? Math.round(gradedSubmissions.reduce((sum: number, s: Submission) => sum + (s.aiScore || 0), 0) / gradedSubmissions.length)
                                    : 0;
                                const completionRate = totalSubmissions > 0
                                    ? Math.round(((totalSubmissions - pendingCount) / totalSubmissions) * 100)
                                    : 0;
                                const onlineStudents = supabaseStudents.filter((s: UserAccount) => s.is_online === true).length;

                                if (isTeacherLoading) {
                                    return (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                            {/* Header Skeleton */}
                                            <div className="flex items-center gap-3">
                                                <motion.div className="w-10 h-10 rounded-xl bg-zinc-200" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                                                <div className="space-y-2">
                                                    <motion.div className="h-4 w-32 bg-zinc-200 rounded-lg" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                                                    <motion.div className="h-3 w-48 bg-zinc-100 rounded-lg" animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }} />
                                                </div>
                                            </div>
                                            {/* Stats Grid Skeleton */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                                    <motion.div key={i} className="bg-zinc-100 rounded-2xl p-5 space-y-3" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.08 }}>
                                                        <div className="w-12 h-12 rounded-xl bg-zinc-200" />
                                                        <div className="h-2 w-16 bg-zinc-200 rounded" />
                                                        <div className="h-6 w-12 bg-zinc-200 rounded" />
                                                        <div className="h-2 w-10 bg-zinc-200 rounded" />
                                                    </motion.div>
                                                ))}
                                            </div>
                                            {/* Grade Distribution Skeleton */}
                                            <motion.div className="bg-zinc-100 rounded-2xl p-6 space-y-4" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-200" />
                                                    <div className="space-y-2">
                                                        <div className="h-4 w-32 bg-zinc-200 rounded" />
                                                        <div className="h-3 w-40 bg-zinc-200 rounded" />
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    {[0, 1, 2, 3, 4].map((i) => (
                                                        <div key={i} className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-zinc-200" />
                                                            <div className="flex-1 space-y-2">
                                                                <div className="h-2 w-full bg-zinc-200 rounded" />
                                                                <div className="h-2.5 w-full bg-zinc-200 rounded-full" />
                                                            </div>
                                                            <div className="w-10 h-4 bg-zinc-200 rounded" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                            {/* Quick Stats Skeleton */}
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                {[0, 1, 2, 3].map((i) => (
                                                    <motion.div key={i} className="bg-zinc-100 rounded-2xl p-5 space-y-4" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.08 }}>
                                                        <div className="flex items-start justify-between">
                                                            <div className="w-11 h-11 rounded-xl bg-zinc-200" />
                                                            <div className="w-14 h-5 rounded-full bg-zinc-200" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="h-2 w-20 bg-zinc-200 rounded" />
                                                            <div className="h-5 w-24 bg-zinc-200 rounded" />
                                                            <div className="h-3 w-16 bg-zinc-200 rounded" />
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    );
                                }

                                return (
                                    <div className="space-y-6">
                                        {/* Header */}
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                                                    <path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 5-6" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 className="text-base font-semibold text-zinc-800">Class Analytics</h2>
                                                <p className="text-[11px] text-zinc-500">Overview of class performance</p>
                                            </div>
                                        </motion.div>

                                        {/* Stats Cards - Grid Layout */}
                                        <div className="analytics-stats-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                            {[
                                                {
                                                    label: 'TOTAL STUDENTS',
                                                    value: String(totalStudents),
                                                    subtext: 'enrolled',
                                                    lordIcon: 'https://cdn.lordicon.com/atzcyedn.json',
                                                    trigger: 'hover',
                                                    color: 'blue'
                                                },
                                                {
                                                    label: 'AVERAGE GRADE',
                                                    value: `${averageGrade}%`,
                                                    subtext: 'class avg',
                                                    trend: averageGrade >= 80 ? '+3%' : '-2%',
                                                    lordIcon: 'https://cdn.lordicon.com/excswhey.json',
                                                    lordIconDown: 'https://cdn.lordicon.com/zwtssiaj.json',
                                                    trigger: 'hover',
                                                    color: 'blue'
                                                },
                                                {
                                                    label: 'SUBMISSIONS',
                                                    value: String(totalSubmissions),
                                                    subtext: 'total',
                                                    lordIcon: 'https://cdn.lordicon.com/mubdgyyw.json',
                                                    trigger: 'hover',
                                                    color: 'yellow'
                                                },
                                                {
                                                    label: 'PENDING',
                                                    value: String(pendingCount),
                                                    subtext: 'to review',
                                                    lordIcon: 'https://cdn.lordicon.com/okqjaags.json',
                                                    trigger: 'hover',
                                                    color: 'yellow'
                                                },
                                                {
                                                    label: 'COMPLETION',
                                                    value: `${completionRate}%`,
                                                    subtext: 'graded',
                                                    lordIcon: 'https://cdn.lordicon.com/uvofdfal.json',
                                                    trigger: 'hover',
                                                    color: 'blue'
                                                },
                                                {
                                                    label: 'ACTIVE NOW',
                                                    value: String(onlineStudents),
                                                    subtext: 'online',
                                                    lordIcon: 'https://cdn.lordicon.com/kthkkwpi.json',
                                                    trigger: 'hover',
                                                    color: 'green'
                                                },
                                            ].map((stat, index) => {
                                                // Determine icon based on stat color
                                                const primaryColor = stat.color === 'blue' ? '#3b82f6' :
                                                    stat.color === 'yellow' ? '#eab308' : '#22c55e';
                                                const secondaryColor = stat.color === 'blue' ? '#93c5fd' :
                                                    stat.color === 'yellow' ? '#fde047' : '#86efac';

                                                // For average grade, check if trend is negative
                                                const isNegativeTrend = stat.trend && stat.trend.startsWith('-');
                                                const iconSrc = isNegativeTrend && stat.lordIconDown ? stat.lordIconDown : stat.lordIcon;
                                                const iconPrimary = isNegativeTrend ? '#ef4444' : primaryColor;
                                                const iconSecondary = isNegativeTrend ? '#fca5a5' : secondaryColor;

                                                return (
                                                    <motion.div
                                                        key={stat.label}
                                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
                                                        whileHover={{ y: -4, scale: 1.02 }}
                                                        className="relative bg-white rounded-2xl border border-zinc-100 p-5 cursor-pointer group overflow-hidden"
                                                    >
                                                        {/* Lord Icon */}
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${stat.color === 'blue' ? 'bg-blue-50' :
                                                            stat.color === 'yellow' ? 'bg-yellow-50' : 'bg-green-50'
                                                            }`}>
                                                            <lord-icon
                                                                src={iconSrc}
                                                                trigger={stat.trigger}
                                                                ,secondary:${iconSecondary}`}
                                                                style={{ width: '32px', height: '32px' }}
                                                            />
                                                        </div>

                                                        {/* Label */}
                                                        <p className="text-[10px] font-semibold text-zinc-400 tracking-wider mb-1">{stat.label}</p>

                                                        {/* Value */}
                                                        <div className="flex items-baseline gap-2">
                                                            <p className={`text-2xl font-bold ${isNegativeTrend ? 'text-red-600' :
                                                                stat.color === 'blue' ? 'text-blue-600' :
                                                                    stat.color === 'yellow' ? 'text-yellow-600' : 'text-green-600'
                                                                }`}>
                                                                {stat.value}
                                                            </p>
                                                            {stat.trend && (
                                                                <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${isNegativeTrend ? 'text-red-500' : 'text-green-500'
                                                                    }`}>
                                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                                                        <path d={isNegativeTrend ? "M6 9l6 6 6-6" : "M18 15l-6-6-6 6"} />
                                                                    </svg>
                                                                    {stat.trend}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Subtext */}
                                                        <p className="text-[11px] text-zinc-500 mt-0.5">{stat.subtext}</p>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>

                                        {/* Grade Distribution Card */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="bg-white rounded-2xl border border-zinc-100 p-6 overflow-hidden relative"
                                        >
                                            {/* Decorative Background */}
                                            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-blue-50 opacity-50" />
                                            <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-yellow-50 opacity-50" />

                                            <div className="relative">
                                                {/* Header */}
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                                                            <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-zinc-800">Grade Distribution</p>
                                                        <p className="text-[10px] text-zinc-500">Performance breakdown by grade</p>
                                                    </div>
                                                </div>

                                                {/* Grade Bars */}
                                                <div className="space-y-4">
                                                    {[
                                                        { grade: 'A', range: '90-100', percent: 25, count: 11, color: 'from-blue-500 to-blue-600' },
                                                        { grade: 'B', range: '80-89', percent: 35, count: 16, color: 'from-blue-400 to-blue-500' },
                                                        { grade: 'C', range: '70-79', percent: 25, count: 11, color: 'from-yellow-400 to-yellow-500' },
                                                        { grade: 'D', range: '60-69', percent: 10, count: 5, color: 'from-orange-400 to-orange-500' },
                                                        { grade: 'F', range: 'Below 60', percent: 5, count: 2, color: 'from-red-400 to-red-500' },
                                                    ].map((item, index) => (
                                                        <motion.div
                                                            key={item.grade}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.4 + index * 0.08 }}
                                                            className="flex items-center gap-4"
                                                        >
                                                            {/* Grade Badge */}
                                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-sm`}>
                                                                <span className="text-sm font-bold text-white">{item.grade}</span>
                                                            </div>

                                                            {/* Progress Section */}
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between mb-1.5">
                                                                    <span className="text-[11px] text-zinc-600 font-medium">{item.range}</span>
                                                                    <span className="text-[11px] text-zinc-500">{item.count} students</span>
                                                                </div>
                                                                <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${item.percent}%` }}
                                                                        transition={{ duration: 0.6, delay: 0.5 + index * 0.1, ease: 'easeOut' }}
                                                                        className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Percentage */}
                                                            <div className="w-12 text-right">
                                                                <span className="text-sm font-bold text-zinc-700">{item.percent}%</span>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Quick Stats Row - Minimalistic White Cards */}
                                        <div className="analytics-quick-stats grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            {[
                                                {
                                                    label: 'TOP PERFORMER',
                                                    value: 'Maria Santos',
                                                    subtext: '98% Average',
                                                    badge: { text: '#1', color: 'blue' },
                                                    lordIcon: 'https://cdn.lordicon.com/namwvlmv.json',
                                                    iconBg: 'bg-blue-50',
                                                    primaryColor: '#3b82f6',
                                                    secondaryColor: '#93c5fd'
                                                },
                                                {
                                                    label: 'NEEDS ATTENTION',
                                                    value: '3 Students',
                                                    subtext: 'Below passing grade',
                                                    badge: { text: 'Alert', color: 'yellow' },
                                                    lordIcon: 'https://cdn.lordicon.com/jzwvffwx.json',
                                                    iconBg: 'bg-yellow-50',
                                                    primaryColor: '#eab308',
                                                    secondaryColor: '#fde047'
                                                },
                                                {
                                                    label: 'MOST IMPROVED',
                                                    value: 'Juan Dela Cruz',
                                                    subtext: '+15% this month',
                                                    badge: { text: '↑ Rising', color: 'green' },
                                                    lordIcon: 'https://cdn.lordicon.com/excswhey.json',
                                                    iconBg: 'bg-green-50',
                                                    primaryColor: '#22c55e',
                                                    secondaryColor: '#86efac'
                                                },
                                                {
                                                    label: 'CLASS ENGAGEMENT',
                                                    value: '87%',
                                                    subtext: 'Active participation',
                                                    badge: { text: 'High', color: 'blue' },
                                                    lordIcon: 'https://cdn.lordicon.com/dutqakce.json',
                                                    iconBg: 'bg-blue-50',
                                                    primaryColor: '#3b82f6',
                                                    secondaryColor: '#93c5fd'
                                                },
                                            ].map((card, index) => (
                                                <motion.div
                                                    key={card.label}
                                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: 0.5 + index * 0.08, type: 'spring', stiffness: 300, damping: 25 } }}
                                                    whileHover={{ y: -6, scale: 1.02, boxShadow: '0 12px 24px -8px rgba(0,0,0,0.1)' }}
                                                    transition={{ duration: 0.1 }}
                                                    className="bg-white rounded-2xl border border-zinc-100 p-5 cursor-pointer group"
                                                >
                                                    <div>
                                                        {/* Header with Icon and Badge */}
                                                        <div className="flex items-start justify-between mb-4">
                                                            {/* Lord Icon */}
                                                            <motion.div
                                                                className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center`}
                                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                                                transition={{ duration: 0.1 }}
                                                            >
                                                                <lord-icon
                                                                    src={card.lordIcon}
                                                                    trigger="hover"
                                                                    ,secondary:${card.secondaryColor}`}
                                                                    style={{ width: '28px', height: '28px' }}
                                                                />
                                                            </motion.div>

                                                            {/* Badge */}
                                                            <motion.span
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                transition={{ delay: 0.7 + index * 0.08, type: 'spring', stiffness: 500 }}
                                                                className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${card.badge.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                                                                    card.badge.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                                                                    }`}
                                                            >
                                                                {card.badge.text}
                                                            </motion.span>
                                                        </div>

                                                        {/* Label */}
                                                        <p className="text-[10px] font-semibold text-zinc-600 tracking-wider mb-1">{card.label}</p>

                                                        {/* Value */}
                                                        <p className="text-lg font-bold text-zinc-900 mb-0.5">{card.value}</p>

                                                        {/* Subtext */}
                                                        <p className="text-[11px] text-zinc-700">{card.subtext}</p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </motion.div>
    );
};

export default TeacherModeContent;
