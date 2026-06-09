/**
 * QuickStatsBar
 * Displays course stats (grade, attendance, deadline, progress) in compact badge style.
 * Mobile-first redesign matching HomeContent patterns (slate palette, pill badges, touch feedback).
 */
import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface StatData {
    label: string;
    value: string;
    subValue: string | null;
    description: string;
    iconColor: string;
    bg: string;
    border: string;
    icon: React.ReactNode;
    progressBar?: { value: number; color: string };
}

const StatBadge: React.FC<{ stat: StatData; index: number }> = ({ stat, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2.5 p-2.5 sm:p-3 bg-white dark:bg-slate-800 rounded-[14px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default group/tag min-w-0"
        >
            {/* Icon */}
            <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 border transition-transform duration-300 group-hover/tag:scale-110 ${stat.bg} ${stat.border}`}>
                <div style={{ color: stat.iconColor }} className="w-4 h-4">
                    {stat.icon}
                </div>
            </div>

            {/* Text */}
            <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5 leading-none whitespace-nowrap" style={{ color: `${stat.iconColor}99` }}>
                    {stat.label}
                </span>
                <div className="flex items-baseline gap-1">
                    <span className="text-[13px] sm:text-sm font-black text-slate-900 dark:text-slate-100 leading-none whitespace-nowrap">
                        {stat.value}
                    </span>
                    {stat.subValue && (
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">{stat.subValue}</span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

interface QuickStatsBarProps {
    courseId: string;
    progress: number;
}

export const QuickStatsBar: React.FC<QuickStatsBarProps> = ({ courseId: _courseId, progress }) => {
    void _courseId;
    const [isExpanded, setIsExpanded] = useState(true);

    const stats = {
        grade: 0,
        attendance: 0,
        nextDeadline: { title: 'No assignments yet', days: 0 },
        unreadNews: 0,
    };

    const getGradeLetter = (grade: number) => {
        if (grade >= 90) return 'A';
        if (grade >= 85) return 'B+';
        if (grade >= 80) return 'B';
        if (grade >= 75) return 'C+';
        if (grade >= 70) return 'C';
        return 'C';
    };

    const gradeLetter = getGradeLetter(stats.grade);

    const statCards: StatData[] = [
        {
            label: 'Current Grade',
            value: gradeLetter,
            subValue: `${stats.grade}%`,
            description: stats.grade === 0 ? 'No grades recorded yet. Complete assignments to see your standing.' : 'Based on submitted and graded coursework.',
            iconColor: '#3b82f6',
            bg: 'bg-blue-50 dark:bg-blue-900/50',
            border: 'border-blue-100/50 dark:border-blue-800/50',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            ),
        },
        {
            label: 'Attendance',
            value: `${stats.attendance}%`,
            subValue: null,
            description: stats.attendance === 0 ? 'No attendance data yet. Records update after each session.' : `${stats.attendance}% of total classes attended this term.`,
            iconColor: '#8b5cf6',
            bg: 'bg-violet-50 dark:bg-violet-900/50',
            border: 'border-violet-100/50 dark:border-violet-800/50',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
        },
        {
            label: 'Next Deadline',
            value: stats.nextDeadline.days === 0 ? 'None' : `${stats.nextDeadline.days}`,
            subValue: stats.nextDeadline.days === 0 ? null : 'days left',
            description: stats.nextDeadline.days === 0 ? 'No upcoming deadlines. You\'re all caught up for now.' : `"${stats.nextDeadline.title}" is due soon.`,
            iconColor: stats.nextDeadline.days === 0 ? '#64748b' : stats.nextDeadline.days <= 2 ? '#ef4444' : '#f59e0b',
            bg: stats.nextDeadline.days === 0 ? 'bg-slate-100 dark:bg-slate-700/50' : 'bg-amber-50 dark:bg-amber-900/50',
            border: stats.nextDeadline.days === 0 ? 'border-slate-200/50 dark:border-slate-600/50' : 'border-amber-100/50 dark:border-amber-800/50',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            ),
        },
        {
            label: 'Course Progress',
            value: `${progress}%`,
            subValue: null,
            description: progress === 0 ? 'No modules completed yet. Start learning to track progress.' : progress === 100 ? 'All modules completed! Great work.' : `${progress}% of course modules finished.`,
            iconColor: progress === 100 ? '#10b981' : '#3b82f6',
            bg: progress === 100 ? 'bg-emerald-50 dark:bg-emerald-900/50' : 'bg-blue-50 dark:bg-blue-900/50',
            border: progress === 100 ? 'border-emerald-100/50 dark:border-emerald-800/50' : 'border-blue-100/50 dark:border-blue-800/50',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            ),
            progressBar: {
                value: progress,
                color: progress === 100 ? '#10b981' : '#3b82f6',
            },
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.995 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
            className="mx-2 sm:mx-6 mb-4 sm:mb-6 relative overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-5 lg:p-6 pb-4 sm:pb-6 flex flex-col group transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600"
        >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-blue-500/5 rounded-full blur-[80px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[180px] h-[180px] bg-indigo-500/5 rounded-full blur-[60px] -translate-x-1/3 translate-y-1/3 pointer-events-none" />

            {/* Header Row (Clickable) */}
            <div
                className="flex items-center justify-between gap-3 cursor-pointer relative z-10 w-full"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3 sm:gap-4">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: -5 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center flex-shrink-0 shadow-sm"
                    >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M3 3v18h18" />
                            <path d="M7 16l4-4 4 4 5-6" />
                        </svg>
                    </motion.div>
                    <div>
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                            Overall Progress
                        </h2>
                        <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                            Grades, attendance & modules
                        </p>
                    </div>
                </div>

                {/* Expand Icon */}
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-600 flex-shrink-0"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
                </motion.div>
            </div>

            {/* Progress Bar — Always visible under header */}
            <div className="mt-3 sm:mt-4 relative z-10 w-full">
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{progress}% Complete</span>
                </div>
                <div className="w-full h-2 sm:h-2.5 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.1)] border border-black/5 dark:border-white/5">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(progress, 2)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                    />
                </div>
            </div>

            {/* Expanded Content (Stat Badges Grid) */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="relative z-10 w-full"
                    >
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 pt-3 pb-1 border-t border-slate-100 dark:border-slate-700/50">
                            {statCards.map((stat, i) => (
                                <StatBadge key={stat.label} stat={stat} index={i} />
                            ))}
                        </div>

                        {/* Desktop-only: description for the expanded section */}
                        <div className="hidden sm:block mt-3 px-1">
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 leading-relaxed">
                                {statCards[0].description}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default QuickStatsBar;
