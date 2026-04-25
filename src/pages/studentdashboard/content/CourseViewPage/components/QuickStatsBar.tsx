/**
 * QuickStatsBar
 * Displays course stats (grade, attendance, deadline, progress) as large cards.
 * Extracted from CourseViewPage.tsx during Phase 8.1
 */
import * as React from 'react';
import { useState } from 'react';
import { motion } from 'motion/react';

interface StatData {
    label: string;
    value: string;
    subValue: string | null;
    description: string;
    color: string;
    bgColor: string;
    borderColor: string;
    iconColor: string;
    icon: React.ReactNode;
}

const StatCard: React.FC<{ stat: StatData; index: number }> = ({ stat, index }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{
                opacity: 1,
                y: isHovered ? -4 : 0,
                scale: isHovered ? 1.02 : 1 }}
            transition={{
                opacity: { delay: 0.25 + index * 0.08, duration: 0.4 },
                y: isHovered ? { duration: 0.1 } : { delay: 0.25 + index * 0.08, duration: 0.4 },
                scale: { duration: 0.1 } }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                background: stat.bgColor,
                borderColor: stat.borderColor,
                boxShadow: isHovered ? '0 8px 25px rgba(0,0,0,0.1)' : 'none' }}
            className="flex flex-col items-center p-5 rounded-2xl cursor-default border"
        >
            <div
                className="mb-3 p-3 rounded-xl transition-transform duration-100"
                style={{
                    background: `${stat.iconColor}15`,
                    color: stat.iconColor,
                    transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)' }}
            >
                {stat.icon}
            </div>
            <div className="flex items-baseline gap-1.5 mb-1">
                <motion.span
                    className="text-3xl font-bold"
                    style={{ color: stat.color }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.08, type: 'spring', stiffness: 300 }}
                >
                    {stat.value}
                </motion.span>
                {stat.subValue && (
                    <span className="text-sm font-medium text-zinc-600">{stat.subValue}</span>
                )}
            </div>
            <span className="text-xs font-semibold text-zinc-800 mb-0.5">{stat.label}</span>
            <span className="text-[10px] text-zinc-500 text-center">{stat.description}</span>
        </motion.div>
    );
};

interface QuickStatsBarProps {
    courseId: string;
    progress: number;
}

export const QuickStatsBar: React.FC<QuickStatsBarProps> = ({ courseId: _courseId, progress }) => {
    void _courseId;

    const stats = {
        grade: 0,
        attendance: 0,
        nextDeadline: { title: 'No assignments yet', days: 0 },
        unreadNews: 0 };

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
            description: 'Your current standing',
            color: stats.grade === 0 ? '#1e293b' : '#3b82f6',
            bgColor: stats.grade === 0 ? 'rgba(148, 163, 184, 0.06)' : 'rgba(59, 130, 246, 0.06)',
            borderColor: stats.grade === 0 ? 'rgba(148, 163, 184, 0.15)' : 'rgba(59, 130, 246, 0.15)',
            iconColor: stats.grade === 0 ? '#64748b' : '#3b82f6',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            ) },
        {
            label: 'Attendance',
            value: `${stats.attendance}%`,
            subValue: null,
            description: 'Classes attended',
            color: stats.attendance === 0 ? '#1e293b' : '#8b5cf6',
            bgColor: stats.attendance === 0 ? 'rgba(148, 163, 184, 0.06)' : 'rgba(139, 92, 246, 0.06)',
            borderColor: stats.attendance === 0 ? 'rgba(148, 163, 184, 0.15)' : 'rgba(139, 92, 246, 0.15)',
            iconColor: stats.attendance === 0 ? '#64748b' : '#8b5cf6',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ) },
        {
            label: 'Next Deadline',
            value: stats.nextDeadline.days === 0 ? '-' : `${stats.nextDeadline.days}`,
            subValue: stats.nextDeadline.days === 0 ? null : 'days left',
            description: stats.nextDeadline.days === 0 ? 'No upcoming deadlines' : stats.nextDeadline.title,
            color: stats.nextDeadline.days === 0 ? '#1e293b' : stats.nextDeadline.days <= 2 ? '#ef4444' : '#f59e0b',
            bgColor: stats.nextDeadline.days === 0 ? 'rgba(148, 163, 184, 0.06)' : stats.nextDeadline.days <= 2 ? 'rgba(239, 68, 68, 0.06)' : 'rgba(245, 158, 11, 0.06)',
            borderColor: stats.nextDeadline.days === 0 ? 'rgba(148, 163, 184, 0.15)' : stats.nextDeadline.days <= 2 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            iconColor: stats.nextDeadline.days === 0 ? '#64748b' : stats.nextDeadline.days <= 2 ? '#ef4444' : '#f59e0b',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            ) },
        {
            label: 'Course Progress',
            value: `${progress}%`,
            subValue: null,
            description: 'Modules completed',
            color: progress === 100 ? '#10b981' : '#3b82f6',
            bgColor: progress === 100 ? 'rgba(16, 185, 129, 0.06)' : 'rgba(59, 130, 246, 0.06)',
            borderColor: progress === 100 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
            iconColor: progress === 100 ? '#10b981' : '#3b82f6',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            ) },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="px-6 py-4"
        >
            <div className="p-4 rounded-2xl bg-white border border-zinc-100 shadow-sm">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="mb-4"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-zinc-600">Overall Course Progress</span>
                        <span className="text-xs font-bold text-blue-600">{progress}% Complete</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-blue-400'}`}
                        />
                    </div>
                </motion.div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {statCards.map((stat, i) => (
                        <StatCard key={stat.label} stat={stat} index={i} />
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default QuickStatsBar;
