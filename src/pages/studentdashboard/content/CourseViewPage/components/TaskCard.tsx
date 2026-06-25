/**
 * TaskCard
 * Individual task/assignment details card.
 * Modeled after ModuleCard.tsx to provide a consistent master-detail view.
 */
import React from 'react';
import { motion } from 'motion/react';
import type { CourseTask, TaskCategory } from '../data/demoCourses';

// Category color and icon config
const CATEGORY_CONFIG: Record<TaskCategory, { label: string; icon: React.ReactNode; color: string; bg: string; text: string; border: string }> = {
    'all': {
        label: 'All Tasks',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
        ),
        color: 'zinc',
        bg: 'rgba(100, 116, 139, 0.1)',
        text: '#64748b',
        border: 'rgba(100, 116, 139, 0.2)'
    },
    'assignment': {
        label: 'Assignment',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
        ),
        color: 'emerald',
        bg: 'rgba(16, 185, 129, 0.1)',
        text: '#059669',
        border: 'rgba(16, 185, 129, 0.2)'
    },
    'performance': {
        label: 'Performance Task',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
            </svg>
        ),
        color: 'purple',
        bg: 'rgba(139, 92, 246, 0.1)',
        text: '#7c3aed',
        border: 'rgba(139, 92, 246, 0.2)'
    },
    'quiz': {
        label: 'Quiz',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        ),
        color: 'amber',
        bg: 'rgba(245, 158, 11, 0.1)',
        text: '#d97706',
        border: 'rgba(245, 158, 11, 0.2)'
    },
    'practical': {
        label: 'Practical Exam',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
        ),
        color: 'rose',
        bg: 'rgba(244, 63, 94, 0.1)',
        text: '#e11d48',
        border: 'rgba(244, 63, 94, 0.2)'
    },
    'journal': {
        label: 'Journal',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
        ),
        color: 'cyan',
        bg: 'rgba(6, 182, 212, 0.1)',
        text: '#0891b2',
        border: 'rgba(6, 182, 212, 0.2)'
    },
    'overdue': {
        label: 'Overdue Task',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
        ),
        color: 'red',
        bg: 'rgba(239, 68, 68, 0.1)',
        text: '#dc2626',
        border: 'rgba(239, 68, 68, 0.2)'
    }
};

const getTaskDescription = (title: string, category: string): string => {
    const t = title.toLowerCase();
    if (t.includes('quiz')) {
        return 'Assess your understanding of the module concepts through multiple-choice questions, code completions, and analysis queries.';
    }
    if (t.includes('programming') || t.includes('laboratory') || t.includes('lab') || category === 'practical') {
        return 'Practical hands-on lab exercise. Complete the code implementations, run unit tests, and attach your source files.';
    }
    if (category === 'performance') {
        return 'Major hands-on project mapping core curriculum guidelines. Focus on modular design, clean code principles, and logical structure.';
    }
    if (category === 'journal') {
        return 'Write a reflective summary reviewing what you have learned, your struggles during programming exercises, and how you overcame them.';
    }
    return 'Read the assignment guidelines, download the provided reference files, review the rubric criteria, and submit your output.';
};

interface TaskCardProps {
    task: CourseTask;
    index: number;
    course: { id: string; title: string; subtitle: string };
    systemConfig: { submissions_enabled: boolean };
    setSubmitModalTask: (task: CourseTask | null) => void;
    setInstructionsModalTask: (task: CourseTask | null) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
    task,
    index,
    course,
    systemConfig,
    setSubmitModalTask,
    setInstructionsModalTask
}) => {
    const categoryConfig = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG.assignment;

    let isOverdue = task.due.toLowerCase().includes('overdue');
    if (task.id && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (new Date() > dueDate && task.status !== 'submitted') {
            isOverdue = true;
        }
    }

    const maxAttempts = task.maxAttempts || 1;
    const submissionCount = task.submissionCount || 0;
    const attemptsExhausted = maxAttempts > 1 && submissionCount >= maxAttempts;
    const allowLate = task.allowLateSubmission || false;
    const latePenalty = task.latePenalty || 0;

    let daysLate = 0;
    if (isOverdue && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        daysLate = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    const totalPenalty = Math.min(100, daysLate * latePenalty);

    const isSubmitted = task.status === 'submitted' || task.status === 'resubmitted' || task.status === 'graded';
    const isLocked = task.status === 'locked';

    const maxPoints = task.points || 100;
    const pointsScored = task.score !== null ? Number(task.score) : 0;
    const scorePercent = Math.round((pointsScored / maxPoints) * 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group relative overflow-hidden flex w-full flex-col lg:flex-row items-stretch gap-6 lg:gap-8 p-5 text-left transition-colors duration-200 sm:p-6 lg:p-7 h-full ${
                isLocked
                    ? 'opacity-70 dark:bg-zinc-900/40 grayscale-[0.2]'
                    : 'bg-transparent hover:bg-slate-50/30 dark:hover:bg-slate-800/30 focus-visible:ring-2 focus-visible:ring-blue-500'
            }`}
        >
            {/* Left Section: Task info & Submission buttons */}
            <div className="flex flex-col lg:w-[40%] shrink-0 justify-start gap-6 border-b lg:border-b-0 lg:border-r border-zinc-150 dark:border-zinc-800/60 pb-6 lg:pb-0 lg:pr-6">
                <div className="flex flex-col gap-4">
                    <div className="text-left">
                        {/* Type badge */}
                        <div className="mb-3">
                            <span style={{
                                padding: '4px 10px',
                                borderRadius: '8px',
                                background: categoryConfig.bg,
                                border: `1px solid ${categoryConfig.border}`,
                                color: categoryConfig.text,
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }} className="inline-flex items-center gap-1.5 shadow-sm">
                                {categoryConfig.icon}
                                {categoryConfig.label}
                            </span>
                        </div>

                        <h3 className="text-[18px] sm:text-[20px] font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
                            {task.title}
                        </h3>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1">
                            {course.title.split('-')[0].trim()}
                        </p>
                        
                        <div className="hidden lg:block mt-2">
                            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                                {task.description || getTaskDescription(task.title, task.category)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {/* Points & Score Progress */}
                    <div className="w-full">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Score</span>
                            <span className={`text-[13px] font-extrabold ${isSubmitted ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                {task.score !== null ? `${task.score} / ${maxPoints} pts` : `Not graded / ${maxPoints} pts`}
                            </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.15)] border border-black/5 dark:border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${task.score !== null ? scorePercent : 0}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                    task.score !== null
                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                        : 'bg-gradient-to-r from-blue-500 to-blue-400'
                                }`}
                            />
                        </div>
                    </div>

                    {/* Meta rows (Attempts, Penalties, etc.) */}
                    <div className="flex flex-wrap items-center gap-2 w-full">
                        {/* Due Date Tag */}
                        {/* Due Date Tag */}
                        {(() => {
                            const dueLower = task.due.toLowerCase();
                            const isDueToday = dueLower.includes('due today') || dueLower === 'today';
                            const isDueIn3Days = dueLower.includes('3 days') || dueLower.includes('2 days') || dueLower.includes('1 day');
                            
                            let containerClasses = "flex items-center gap-2.5 px-3 py-2.5 bg-white dark:bg-slate-800 rounded-[12px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default group/tag flex-1 min-w-[150px]";
                            let iconContainerClasses = "w-7 h-7 rounded-[8px] bg-blue-50 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover/tag:scale-110 transition-transform duration-300 flex-shrink-0";
                            let titleClasses = "text-[9px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider mb-0.5 leading-none whitespace-nowrap";
                            let valueClasses = "text-[12px] font-bold text-slate-800 dark:text-slate-200 leading-none whitespace-nowrap truncate";

                            if (isDueToday && !isSubmitted) {
                                containerClasses = "flex items-center gap-2.5 px-3 py-2.5 bg-[#ef4444] rounded-[12px] border border-[#ef4444] shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default group/tag flex-1 min-w-[150px]";
                                iconContainerClasses = "w-7 h-7 rounded-[8px] bg-black/10 flex items-center justify-center text-white group-hover/tag:scale-110 transition-transform duration-300 flex-shrink-0";
                                titleClasses = "text-[9px] font-extrabold text-white/90 uppercase tracking-wider mb-0.5 leading-none whitespace-nowrap";
                                valueClasses = "text-[13px] font-extrabold text-white leading-none whitespace-nowrap truncate";
                            } else if (isDueIn3Days && !isSubmitted) {
                                containerClasses = "flex items-center gap-2.5 px-3 py-2.5 bg-[#facc15] rounded-[12px] border border-[#facc15] shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default group/tag flex-1 min-w-[150px]";
                                iconContainerClasses = "w-7 h-7 rounded-[8px] bg-black/5 flex items-center justify-center text-[#713f12] group-hover/tag:scale-110 transition-transform duration-300 flex-shrink-0";
                                titleClasses = "text-[9px] font-extrabold text-[#854d0e] uppercase tracking-wider mb-0.5 leading-none whitespace-nowrap";
                                valueClasses = "text-[13px] font-extrabold text-[#422006] leading-none whitespace-nowrap truncate";
                            }

                            return (
                                <div className={containerClasses}>
                                    <div className={iconContainerClasses}>
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0 justify-center">
                                        <span className={titleClasses}>DUE DATE</span>
                                        <span className={valueClasses} title={task.due}>{task.due}</span>
                                    </div>
                                </div>
                            );
                        })()}
                        
                        {/* Attempts Tag */}
                        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white dark:bg-slate-800 rounded-[12px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default group/tag flex-1 min-w-[130px]">
                            <div className="w-7 h-7 rounded-[8px] bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover/tag:scale-110 transition-transform duration-300 flex-shrink-0">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                            </div>
                            <div className="flex flex-col flex-1 min-w-0 justify-center">
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5 leading-none whitespace-nowrap">ATTEMPTS</span>
                                <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200 leading-none whitespace-nowrap truncate">{maxAttempts} allowed</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex flex-col gap-2.5">
                        {(() => {
                            if (isLocked) {
                                return (
                                    <button disabled className="w-full py-2.5 px-4 text-[13px] font-bold rounded-[14px] bg-zinc-100 text-zinc-400 cursor-not-allowed dark:bg-zinc-800/40 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-1.5">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                        Locked
                                    </button>
                                );
                            }

                            if (attemptsExhausted) {
                                return (
                                    <div className="w-full py-2.5 px-4 text-[13px] font-bold rounded-[14px] bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-150 dark:border-red-900/30 text-center flex items-center justify-center gap-1.5">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                        No attempts remaining
                                    </div>
                                );
                            }

                            if (isOverdue && !allowLate) {
                                return (
                                    <div className="w-full py-2.5 px-4 text-[13px] font-bold rounded-[14px] bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-150 dark:border-red-900/30 text-center flex items-center justify-center gap-1.5">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                        Submission closed
                                    </div>
                                );
                            }

                            if (!systemConfig.submissions_enabled) {
                                return (
                                    <button disabled className="w-full py-2.5 px-4 text-[13px] font-bold rounded-[14px] bg-zinc-100 text-zinc-400 cursor-not-allowed dark:bg-zinc-800/40 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-1.5">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                        Submissions Disabled
                                    </button>
                                );
                            }

                            // Show late submission prompt if overdue and allowed
                            if (isOverdue && allowLate) {
                                return (
                                    <div className="flex flex-col gap-2">
                                        {latePenalty > 0 && (
                                            <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-150 dark:border-amber-900/30 px-3 py-2 rounded-lg flex items-center gap-2">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                                {daysLate} day{daysLate !== 1 ? 's' : ''} late · -{totalPenalty}% penalty
                                            </div>
                                        )}
                                        <motion.button
                                            
                                            onClick={() => setSubmitModalTask(task)}
                                            className="w-full flex items-center justify-center gap-1.5 font-bold py-2.5 px-4 rounded-[14px] transition-colors shadow-sm bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-900/70 text-amber-700 dark:text-amber-400 focus:outline-none"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                            Submit Late {maxAttempts > 1 && `(${maxAttempts - submissionCount} left)`}
                                        </motion.button>
                                    </div>
                                );
                            }

                            // Normal submission
                            return (
                                <motion.button
                                    
                                    onClick={() => setSubmitModalTask(task)}
                                    className="w-full flex items-center justify-center gap-1.5 font-bold py-2.5 px-4 rounded-[14px] transition-colors shadow-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 focus:outline-none"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                    {isSubmitted ? 'Resubmit Task' : 'Submit Task'} {maxAttempts > 1 && `(${maxAttempts - submissionCount} left)`}
                                </motion.button>
                            );
                        })()}

                        {/* View Instructions Button */}
                        {!isLocked && (
                            <motion.button
                                
                                onClick={() => setInstructionsModalTask(task)}
                                className="w-full flex items-center justify-center gap-1.5 font-bold py-2.5 px-4 rounded-[14px] transition-colors shadow-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                                Instructions & Rubrics
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Section: Task Resources / Attachments & Rubric */}
            <div className="flex flex-col lg:flex-1 gap-4 justify-start mt-5 lg:mt-0">
                {/* Section header */}
                <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-800/60">
                    <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                        <h4 className="text-[13px] font-bold uppercase tracking-wider">Task Resources & Criteria</h4>
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[380px] px-2 py-2 -mx-2 -my-2 scrollbar-thin">
                    {/* Attachments Section */}
                    {task.attachments && task.attachments.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <div className="flex-1 min-w-0 px-1 mb-2 mt-1">
                                <h3 className="m-0 mb-[3px] text-[17px] font-extrabold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
                                    <div className="w-[6px] h-[16px] rounded-[3px] bg-blue-500" />
                                    Reference Attachments
                                </h3>
                                <p className="m-0 text-[12.5px] text-slate-500 dark:text-slate-400 font-normal pl-[14px]">
                                    Additional files and resources for this task
                                </p>
                            </div>
                            <div className="flex flex-col gap-2">
                                {task.attachments.map((file, fIdx) => (
                                    <motion.div
                                        key={fIdx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: fIdx * 0.05, duration: 0.2 }}
                                        
                                        
                                        onClick={() => !isLocked && window.open(file.url, '_blank')}
                                        className={`relative flex items-center justify-between p-4 rounded-2xl border transition-colors duration-200 ${
                                            isLocked 
                                                ? 'bg-zinc-50/50 border-zinc-200/50 opacity-60 dark:bg-zinc-900/40 dark:border-zinc-800/50 cursor-not-allowed' 
                                                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer group/row'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                            {/* File type icon */}
                                            <motion.div
                                                
                                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                                className={`w-11 h-11 rounded-[12px] flex items-center justify-center border shrink-0 shadow-sm relative transition-colors duration-200 ${
                                                    isLocked
                                                        ? 'border-zinc-200/40 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 dark:text-zinc-500'
                                                        : 'border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-950/30 text-blue-500 group-hover/row:border-blue-200 dark:group-hover/row:border-blue-800/50 group-hover/row:bg-blue-100 dark:group-hover/row:bg-blue-900/40'
                                                }`}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                </svg>
                                            </motion.div>
                                            <div className="min-w-0 flex-1 text-left flex flex-col items-start justify-center">
                                                <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-snug tracking-tight transition-colors group-hover/row:text-blue-700 dark:group-hover/row:text-blue-400 truncate pr-1 w-full" title={file.name}>
                                                    {file.name}
                                                </p>
                                                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-normal mt-0.5 truncate w-full">
                                                    Click to view reference
                                                </p>
                                            </div>
                                        </div>
                                        <motion.button
                                            type="button"
                                            
                                            
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors duration-200 shrink-0 ${
                                                isLocked
                                                    ? 'bg-zinc-50 border-zinc-200 text-zinc-400 dark:bg-zinc-800/40 dark:border-zinc-700 dark:text-zinc-500'
                                                    : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:bg-zinc-800/40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-blue-950/30 dark:hover:border-blue-900/40 dark:hover:text-blue-400'
                                            }`}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                        </motion.button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Rubric Section */}
                    {task.rubricEnabled && task.rubricCriteria && task.rubricCriteria.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <div className="flex-1 min-w-0 px-1 mb-2 mt-1">
                                <h3 className="m-0 mb-[3px] text-[17px] font-extrabold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
                                    <div className="w-[6px] h-[16px] rounded-[3px] bg-blue-500" />
                                    Grading Rubric
                                </h3>
                                <p className="m-0 text-[12.5px] text-slate-500 dark:text-slate-400 font-normal pl-[14px]">
                                    Policies and grading criteria for this activity
                                </p>
                            </div>
                            <div className="flex flex-col gap-2">
                                {task.rubricCriteria.map((criterion, rIdx) => (
                                    <motion.div
                                        key={criterion.id || rIdx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: rIdx * 0.05, duration: 0.2 }}
                                        
                                        
                                        className={`relative flex flex-col p-4 transition-all duration-150 ${!isLocked ? 'hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99]' : ''} rounded-2xl border transition-colors duration-200 ${
                                            isLocked 
                                                ? 'bg-zinc-50/50 border-zinc-200/50 opacity-60 dark:bg-zinc-900/40 dark:border-zinc-800/50 cursor-not-allowed' 
                                                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700/60 group/rubric cursor-default'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center mb-1.5 gap-4">
                                            <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 group-hover/rubric:text-emerald-700 dark:group-hover/rubric:text-emerald-400 transition-colors">
                                                {criterion.name}
                                            </span>
                                            <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors ${
                                                isLocked 
                                                    ? 'bg-zinc-100 text-zinc-500 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' 
                                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30 group-hover/rubric:bg-emerald-100 dark:group-hover/rubric:bg-emerald-900/50'
                                            }`}>
                                                {criterion.points} pts
                                            </div>
                                        </div>
                                        {criterion.description && (
                                            <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed group-hover/rubric:text-slate-600 dark:group-hover/rubric:text-slate-300 transition-colors">
                                                {criterion.description}
                                            </p>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty Resources State */}
                    {(!task.attachments || task.attachments.length === 0) && (!task.rubricEnabled || !task.rubricCriteria || task.rubricCriteria.length === 0) && (
                        <div className="flex-1 flex flex-col items-center justify-center py-10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/10 text-center p-4">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-350 dark:text-zinc-650 mb-2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                            <p className="text-[13px] font-bold text-zinc-500 dark:text-zinc-400">No additional attachments or criteria</p>
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5 leading-normal">
                                Click the "Instructions & Rubrics" button to view full textual instructions.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default TaskCard;
