/**
 * QuickStatsBar
 * Displays course stats in a premium Bento Box grid using Recharts.
 */
import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart } from "@/components/charts/area-chart";
import { Area } from "@/components/charts/area";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import { XAxis } from "@/components/charts/x-axis";
import { getCurrentLevel } from '../../../../../services/studyTimeService';

interface CourseStats {
    grade: number;
    attendance: number;
    totalSessions?: number;
    nextDeadline: { title: string; days: number } | null;
}

interface GradeTrendPoint {
    date: Date;
    grade: number;
}

interface QuickStatsBarProps {
    courseId: string;
    progress: number;
    stats?: CourseStats;
    gradeTrendData?: GradeTrendPoint[];
}

const defaultStats: CourseStats = {
    grade: 0,
    attendance: 0,
    totalSessions: 0,
    nextDeadline: null,
};

export const QuickStatsBar: React.FC<QuickStatsBarProps> = ({ 
    courseId: _courseId, 
    progress: _progress,
    stats: propStats,
    gradeTrendData: propGradeTrendData,
}) => {
    void _courseId;
    void _progress;
    const [isExpanded, setIsExpanded] = useState(true);
    const level = getCurrentLevel();
    const isLocked = level < 7;

    const stats = propStats ?? defaultStats;
    const gradeTrendData = propGradeTrendData ?? [];

    const getGradeLetter = (grade: number) => {
        if (grade >= 90) return 'A';
        if (grade >= 85) return 'B+';
        if (grade >= 80) return 'B';
        if (grade >= 75) return 'C+';
        if (grade >= 70) return 'C';
        return 'D';
    };

    const getGradeColorConfig = (grade: number) => {
        if (grade >= 90) return { letter: 'text-yellow-400 dark:text-yellow-300', label: 'text-emerald-500 dark:text-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-900/50', iconText: 'text-emerald-600 dark:text-emerald-400' };
        if (grade >= 85) return { letter: 'text-amber-500 dark:text-amber-400', label: 'text-blue-500 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/50', iconText: 'text-blue-600 dark:text-blue-400' };
        if (grade >= 80) return { letter: 'text-orange-500 dark:text-orange-400', label: 'text-blue-500 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/50', iconText: 'text-blue-600 dark:text-blue-400' };
        if (grade >= 70) return { letter: 'text-rose-500 dark:text-rose-400', label: 'text-amber-500 dark:text-amber-400', iconBg: 'bg-amber-100 dark:bg-amber-900/50', iconText: 'text-amber-600 dark:text-amber-400' };
        return { letter: 'text-red-500 dark:text-red-400', label: 'text-rose-500 dark:text-rose-400', iconBg: 'bg-rose-100 dark:bg-rose-900/50', iconText: 'text-rose-600 dark:text-rose-400' };
    };

    const getGPA = (grade: number) => {
        if (grade >= 98) return '1.00';
        if (grade >= 95) return '1.25';
        if (grade >= 92) return '1.50';
        if (grade >= 89) return '1.75';
        if (grade >= 86) return '2.00';
        if (grade >= 83) return '2.25';
        if (grade >= 80) return '2.50';
        if (grade >= 77) return '2.75';
        if (grade >= 75) return '3.00';
        return '5.00';
    };

    const gradeLetter = getGradeLetter(stats.grade);
    const gradeColor = getGradeColorConfig(stats.grade);


    // Circular Progress for Attendance
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (stats.attendance / 100) * circumference;

    // Attendance color tiers
    const getAttendanceColor = (pct: number) => {
        if (pct >= 70) return {
            label: 'text-amber-500 dark:text-amber-400',
            stroke: 'stroke-blue-500',
            icon: 'text-amber-400 dark:text-amber-300',
            message: 'Excellent attendance!',
        };
        if (pct >= 40) return {
            label: 'text-orange-500 dark:text-orange-400',
            stroke: 'stroke-blue-500',
            icon: 'text-orange-500 dark:text-orange-400',
            message: 'Needs improvement',
        };
        return {
            label: 'text-red-500 dark:text-red-400',
            stroke: 'stroke-blue-500',
            icon: 'text-red-500 dark:text-red-400',
            message: 'Critical — attend more sessions!',
        };
    };
    const attendanceColor = getAttendanceColor(stats.attendance);

    // Deadline urgency color tiers
    const getDeadlineColor = (days: number) => {
        if (days <= 0) return {
            label: 'text-red-500 dark:text-red-400',
            title: 'text-red-600 dark:text-red-400',
            due: 'text-red-500 dark:text-red-400',
            border: 'border-red-400 dark:border-red-500 border-2',
            iconBg: 'bg-red-50 dark:bg-red-900/30',
            iconText: 'text-red-500 dark:text-red-400',
        };
        if (days <= 3) return {
            label: 'text-amber-500 dark:text-amber-400',
            title: 'text-amber-600 dark:text-amber-400',
            due: 'text-amber-500 dark:text-amber-400',
            border: 'border-amber-400 dark:border-amber-500 border-2',
            iconBg: 'bg-amber-50 dark:bg-amber-900/30',
            iconText: 'text-amber-500 dark:text-amber-400',
        };
        return {
            label: 'text-blue-500 dark:text-blue-400',
            title: 'text-blue-600 dark:text-blue-400',
            due: 'text-blue-500 dark:text-blue-400',
            border: 'border-slate-200 dark:border-slate-700/50',
            iconBg: 'bg-blue-50 dark:bg-blue-900/30',
            iconText: 'text-blue-500 dark:text-blue-400',
        };
    };
    const deadlineColor = getDeadlineColor(stats.nextDeadline?.days ?? Infinity);

    // Header notification badge logic
    const daysLeft = stats.nextDeadline?.days;
    const showBadge = daysLeft !== undefined && daysLeft <= 3;
    const badgeBg = daysLeft !== undefined && daysLeft <= 0 
        ? 'bg-red-500 text-white border-white dark:border-slate-800' 
        : 'bg-amber-500 text-white border-white dark:border-slate-800';

    const titleColor = daysLeft !== undefined && daysLeft <= 0 
        ? 'text-red-600 dark:text-red-400' 
        : daysLeft !== undefined && daysLeft <= 3 
        ? 'text-amber-600 dark:text-amber-500' 
        : 'text-slate-900 dark:text-slate-100';

    const headerBorder = daysLeft !== undefined && daysLeft <= 0
        ? 'border-2 border-red-400 dark:border-red-500'
        : daysLeft !== undefined && daysLeft <= 3
        ? 'border-2 border-amber-400 dark:border-amber-500'
        : 'border border-slate-200 dark:border-slate-700';

    // Locked state: show grayed-out locked UI
    if (isLocked) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
                className="mb-4 sm:mb-6 relative overflow-hidden bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-5 lg:p-6 flex items-center gap-3 sm:gap-4 select-none cursor-not-allowed"
            >
                {/* Grayed Icon */}
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-slate-200 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600/50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M3 3v18h18" />
                        <path d="M7 16l4-4 4 4 5-6" />
                    </svg>
                    {/* Lock badge */}
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-[20px] h-[20px] sm:w-[22px] sm:h-[22px] rounded-full border-2 border-white dark:border-slate-800 shadow-sm bg-slate-400 dark:bg-slate-600 text-white">
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-sm sm:text-base font-bold tracking-tight leading-none text-slate-400 dark:text-slate-500">
                        Analytics Dashboard
                    </h2>
                    <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 dark:text-slate-500 leading-none mt-0.5">
                        Grades, attendance & upcoming deadlines
                    </p>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex-shrink-0">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Unlock at Level 7
                </span>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
            className={`mb-4 sm:mb-6 relative overflow-hidden bg-white dark:bg-slate-800 ${headerBorder} shadow-sm rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-5 lg:p-6 pb-4 sm:pb-6 flex flex-col group transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600`}
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
                        className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center flex-shrink-0 shadow-sm"
                    >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M3 3v18h18" />
                            <path d="M7 16l4-4 4 4 5-6" />
                        </svg>

                        {/* Urgency Badge */}
                        {showBadge && (
                            <span className={`absolute -top-1.5 -right-1.5 flex items-center justify-center w-[20px] h-[20px] sm:w-[22px] sm:h-[22px] rounded-full border-2 shadow-sm ${badgeBg}`}>
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                    <path d="M12 8v4" />
                                    <path d="M12 16h.01" />
                                </svg>
                            </span>
                        )}
                    </motion.div>
                    <div>
                        <h2 className={`text-sm sm:text-base font-bold tracking-tight leading-none ${titleColor}`}>
                            Analytics Dashboard
                        </h2>
                        <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                            Grades, attendance & upcoming deadlines
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

            {/* Expanded Bento Grid */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                        className="relative z-10 w-full overflow-visible"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            
                            {/* GRADE TREND (col-span-4) */}
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                className="col-span-1 md:col-span-2 lg:col-span-4 flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 shadow-sm rounded-[20px] p-4 sm:p-5 relative transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default"
                            >
                                {stats.grade > 0 && gradeTrendData.length > 0 ? (
                                    <>
                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div>
                                                <span className={`text-[11px] font-bold uppercase tracking-[0.15em] mb-1.5 block ${gradeColor.label}`}>Current Grade</span>
                                                <div className="flex items-center gap-3">
                                                    <h3 className={`text-5xl font-bold ${gradeColor.letter} leading-none tracking-tight`}>{gradeLetter}</h3>
                                                    <span className={`px-2.5 py-1 rounded-md text-sm font-bold ${gradeColor.iconBg} ${gradeColor.iconText}`}>
                                                        {getGPA(stats.grade)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/50">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" /></svg>
                                                <span className="text-sm font-bold">+12.4%</span>
                                            </div>
                                        </div>
                                        <div className="w-full mt-4 h-[180px] lg:h-[220px] relative z-10">
                                            <AreaChart data={gradeTrendData as unknown as Record<string, unknown>[]} margin={{ top: 20, right: 20, bottom: 40, left: 20 }} aspectRatio="auto" className="absolute inset-0 w-full h-full">
                                                <Grid horizontal />
                                                <Area dataKey="grade" fill="var(--chart-line-primary)" fillOpacity={0} strokeWidth={2} showMarkers />
                                                <XAxis />
                                                <ChartTooltip 
                                                    content={({ point }) => {
                                                        const date = point.date as Date;
                                                        return (
                                                            <div className="overflow-hidden">
                                                                <div className="px-3 py-2.5">
                                                                    {date && (
                                                                        <div className="mb-2 text-left font-medium text-chart-tooltip-foreground text-xs">
                                                                            {new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(date)}
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Grade:</span>
                                                                        <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded border border-emerald-200 dark:border-emerald-800/50 w-fit">
                                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" /></svg>
                                                                            <span className="text-sm font-bold">+1.25</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }}
                                                />
                                            </AreaChart>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 relative z-10">
                                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mb-4">
                                            <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l4-4 4 4 5-6" strokeDasharray="4 4" />
                                            </svg>
                                        </div>
                                        <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">No Activity Yet</h3>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center max-w-[220px]">
                                            Complete assignments and quizzes to see your grade trend appear here
                                        </p>
                                    </div>
                                )}
                            </motion.div>

                            {/* ATTENDANCE (col-span-2) */}
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                className="col-span-1 md:col-span-1 lg:col-span-2 flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 shadow-sm rounded-[20px] p-4 sm:p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default"
                            >
                                {stats.totalSessions === 0 ? (
                                    <div className="w-full flex items-center justify-between">
                                        <div className="min-w-0 flex-1 pr-3">
                                            <span className="text-[10px] font-bold uppercase tracking-widest mb-1 block truncate text-blue-500 dark:text-blue-400">Attendance</span>
                                            <div className="flex items-baseline gap-1">
                                                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-none tracking-tight">Welcome!</h3>
                                            </div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium truncate">New semester started</p>
                                        </div>
                                        <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center shrink-0 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50">
                                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="min-w-0 flex-1 pr-3">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 block truncate ${attendanceColor.label}`}>Attendance</span>
                                            <div className="flex items-baseline gap-1">
                                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{stats.attendance}%</h3>
                                            </div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium truncate">Present across all sessions</p>
                                        </div>
                                        <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                                                <circle cx="32" cy="32" r={radius} fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="6" />
                                                <motion.circle 
                                                    cx="32" cy="32" r={radius} fill="none" 
                                                    className={attendanceColor.stroke} strokeWidth="6" strokeLinecap="round"
                                                    strokeDasharray={circumference}
                                                    initial={{ strokeDashoffset: circumference }}
                                                    animate={{ strokeDashoffset }}
                                                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                                                />
                                            </svg>
                                            <div className={`absolute inset-0 flex items-center justify-center ${attendanceColor.icon}`}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </motion.div>

                            {/* NEXT DEADLINE (col-span-2) */}
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                                className={`col-span-1 md:col-span-1 lg:col-span-2 flex items-center justify-between bg-white dark:bg-slate-800 ${stats.nextDeadline?.title ? deadlineColor.border : 'border border-slate-200 dark:border-slate-700/50'} shadow-sm rounded-[20px] p-4 sm:p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default relative overflow-hidden`}
                            >
                                {stats.nextDeadline?.title ? (
                                    <>
                                        <div className="min-w-0 flex-1 pr-3 relative z-10">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 block truncate ${deadlineColor.label}`}>Next Deadline</span>
                                            <h3 className={`text-xl font-bold leading-tight line-clamp-1 truncate ${deadlineColor.title}`}>{stats.nextDeadline.title}</h3>
                                            <p className={`text-[11px] mt-1 font-bold tracking-wide truncate ${deadlineColor.due}`}>{stats.nextDeadline.days <= 0 ? 'DUE TODAY!' : `DUE IN ${stats.nextDeadline.days} DAYS`}</p>
                                        </div>
                                        <div className={`w-12 h-12 rounded-[12px] flex flex-col items-center justify-center flex-shrink-0 shadow-sm relative z-10 ${deadlineColor.iconBg} ${deadlineColor.iconText}`}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="min-w-0 flex-1 pr-3 relative z-10">
                                            <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-1 block">All Tasks Done</span>
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">All caught up! 🎉</h3>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">No upcoming deadlines</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-[12px] bg-emerald-50 dark:bg-emerald-900/30 flex flex-col items-center justify-center text-emerald-500 dark:text-emerald-400 flex-shrink-0 shadow-sm relative z-10">
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                        </div>
                                    </>
                                )}
                            </motion.div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default QuickStatsBar;
