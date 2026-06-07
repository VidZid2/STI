/**
 * QuickStatsBar
 * Displays course stats (grade, attendance, deadline, progress) in SaaS Study Tools style.
 * Redesigned to match ToolsHeader.tsx visual language.
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
    hoverBorderColor: string;
    icon: React.ReactNode;
    progressBar?: { value: number; color: string };
}

const StatCard: React.FC<{ stat: StatData; index: number }> = ({ stat, index }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-800 rounded-[14px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default"
        >
            {/* Top Row: Icon + Label + Value */}
            <div className="flex items-center gap-3.5">
                {/* Icon Container */}
                <div
                    className="p-2.5 rounded-xl flex-shrink-0 border transition-transform duration-200"
                    style={{
                        backgroundColor: `${stat.iconColor}15`,
                        borderColor: `${stat.iconColor}25`,
                        transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)',
                    }}
                >
                    <div style={{ color: stat.iconColor }} className="w-5 h-5">
                        {stat.icon}
                    </div>
                </div>

                {/* Text Block */}
                <div className="min-w-0 flex-1">
                    <div 
                        className="inline-flex items-center px-2 py-1 rounded-md border shadow-sm mb-0.5"
                        style={{
                            backgroundColor: `${stat.iconColor}10`,
                            borderColor: `${stat.iconColor}20`,
                            color: stat.iconColor
                        }}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
                            {stat.label}
                        </span>
                    </div>
                    <div className="flex items-center mt-1.5">
                        <div className="inline-flex items-baseline gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
                            <p className="text-[15px] font-black text-slate-900 dark:text-slate-100 leading-none whitespace-nowrap">
                                {stat.value}
                            </p>
                            {stat.subValue && (
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">{stat.subValue}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Description */}
            <p className="text-[13px] font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                {stat.description}
            </p>

            {/* Optional: Inline Progress Bar (for Course Progress card) */}
            {stat.progressBar && (
                <div className="w-full">
                    <div className="h-2 bg-zinc-200/60 dark:bg-zinc-700/50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(stat.progressBar.value, 2)}%` }}
                            transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: stat.progressBar.color }}
                        />
                    </div>
                </div>
            )}
        </motion.div>
    );
};

interface QuickStatsBarProps {
    courseId: string;
    progress: number;
}

export const QuickStatsBar: React.FC<QuickStatsBarProps> = ({ courseId: _courseId, progress }) => {
    void _courseId;
    const [isExpanded, setIsExpanded] = useState(false);

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
            iconColor: stats.grade === 0 ? '#3b82f6' : '#3b82f6',
            hoverBorderColor: 'border-blue-200 dark:border-blue-800/50',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            ),
        },
        {
            label: 'Attendance',
            value: `${stats.attendance}%`,
            subValue: null,
            description: stats.attendance === 0 ? 'No attendance data yet. Records update after each session.' : `${stats.attendance}% of total classes attended this term.`,
            iconColor: stats.attendance === 0 ? '#3b82f6' : '#8b5cf6',
            hoverBorderColor: 'border-purple-200 dark:border-purple-800/50',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            iconColor: stats.nextDeadline.days === 0 ? '#3b82f6' : stats.nextDeadline.days <= 2 ? '#ef4444' : '#f59e0b',
            hoverBorderColor: stats.nextDeadline.days === 0 ? 'border-zinc-300 dark:border-zinc-600' : 'border-amber-200 dark:border-amber-800/50',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            hoverBorderColor: progress === 100 ? 'border-emerald-200 dark:border-emerald-800/50' : 'border-blue-200 dark:border-blue-800/50',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
            className="mx-6 mb-6 relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-5 lg:p-6 flex flex-col group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50"
        >
            {/* SaaS Background Accents */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 bg-indigo-400/10 dark:bg-indigo-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

            {/* Header Row (Clickable for Dropdown) */}
            <div 
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 cursor-pointer relative z-10 w-full"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-5 w-full sm:w-auto">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: -5 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        className="w-14 h-14 rounded-[20px] bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm"
                    >
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M3 3v18h18" />
                            <path d="M7 16l4-4 4 4 5-6" />
                        </svg>
                    </motion.div>
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none transition-colors">
                                Overall Course Progress
                            </h2>
                        </div>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 max-w-lg leading-[1.4]">
                            Track your grades, attendance, and completion across all modules.
                        </p>
                    </div>
                </div>

                {/* Right: Expand Icon */}
                <div className="flex items-center w-full sm:w-auto justify-end">
                    <motion.div 
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        className="w-10 h-10 rounded-[14px] bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 flex-shrink-0"
                        aria-hidden="true"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                    </motion.div>
                </div>
            </div>

            {/* Expanded Content (Stat Cards Grid) */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="relative z-10 overflow-hidden w-full flex flex-col"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-5 pb-4 px-2 -mx-2 border-t border-zinc-100 dark:border-zinc-800">
                            {statCards.map((stat, i) => (
                                <StatCard key={stat.label} stat={stat} index={i} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default QuickStatsBar;
