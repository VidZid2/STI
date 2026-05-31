import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { User } from '../../../services/authService';

interface WelcomeBannerProps {
    user: User | null;
    isMobile: boolean; // Retained to conditionally skip Tooltips, but layouts use MD breakpoint
    getStatValue: (key: string) => string | number;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ user, isMobile, getStatValue }) => {
    const [hoveredStat, setHoveredStat] = useState<string | null>(null);

    const statsData = [
        { label: 'Students', value: getStatValue('students'), color: '#3b82f6', bgColor: 'var(--accent-bg)', borderColor: '#3b82f6', tooltip: 'Total active students enrolled in your courses' },
        { label: 'Courses', value: getStatValue('courses'), color: 'var(--color-success)', bgColor: 'rgba(16, 185, 129, 0.08)', borderColor: 'var(--color-success)', tooltip: 'Number of courses you are currently teaching' },
        { label: 'Pending', value: getStatValue('pending'), color: 'var(--color-warning)', bgColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'var(--color-warning)', tooltip: 'Submissions awaiting your review and grading' },
        { label: 'Average', value: getStatValue('average'), color: 'var(--color-purple)', bgColor: 'rgba(139, 92, 246, 0.08)', borderColor: 'var(--color-purple)', tooltip: 'Average grade across all graded submissions' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="welcome-header-greeting mb-6"
        >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 md:px-[22px] md:py-[18px] pb-6 rounded-[14px] bg-surface/80 backdrop-blur-md border border-black/5 dark:border-white/10 flex-wrap overflow-visible">
                
                {/* Icon + Title Row */}
                <div className="flex items-center gap-4 w-full md:w-auto md:flex-1">
                    {/* Icon */}
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="w-10 h-10 md:w-[46px] md:h-[46px] rounded-xl flex items-center justify-center shrink-0"
                        style={{
                            background: 'linear-gradient(135deg, var(--accent-bg) 0%, transparent 100%)',
                        }}
                    >
                        <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            <path d="M8 7h8M8 11h8M8 15h5" />
                        </svg>
                    </motion.div>
 
                    {/* Title & Subtitle */}
                    <div className="flex-1 min-w-0">
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex items-center gap-2 mb-1 flex-wrap"
                        >
                            <h1 className="m-0 text-base md:text-xl font-semibold text-slate-900 dark:text-white">
                                {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {user?.first_name || 'Teacher'}!
                            </h1>
                            <span className="px-2 py-[3px] rounded-md bg-blue-500/10 text-[11px] font-semibold text-blue-500">
                                Teacher
                            </span>
                        </motion.div>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.15 }}
                            className="m-0 text-xs md:text-[13px] text-slate-500 dark:text-slate-400"
                        >
                            {new Date().toLocaleDateString('en-US', { weekday: isMobile ? 'short' : 'long', year: 'numeric', month: isMobile ? 'short' : 'long', day: 'numeric' })}
                        </motion.p>
                    </div>
                </div>

                {/* Quick Stats - Responsive grid for mobile */}
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="stats-grid-container relative grid grid-cols-4 md:flex w-full md:w-auto gap-2 md:gap-[10px]"
                >
                    {statsData.map((stat, i) => {
                        // Tooltip alignment based on card position
                        const isFirst = i === 0;
                        const isLast = i === statsData.length - 1;
                        const isMiddle = !isFirst && !isLast;

                        // Use inline style for positioning since Framer Motion's y animation
                        // overrides CSS transform (including Tailwind's -translate-x-1/2)
                        const tooltipStyle: React.CSSProperties = isFirst
                            ? { left: 0 }
                            : isLast
                            ? { right: 0 }
                            : { left: '50%' };

                        const arrowPosClass = isFirst
                            ? 'left-6'
                            : isLast
                            ? 'right-6'
                            : 'left-1/2';

                        return (
                        <motion.div
                            key={stat.label}
                            className={`quick-stat-card quick-stat-card--${stat.label.toLowerCase()} relative flex flex-col items-center p-2 pt-1.5 md:py-2.5 md:px-4 rounded-[10px] cursor-default md:min-w-[72px]`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: 0.25 + i * 0.05, duration: 0.3 } }}
                            whileHover={isMobile ? {} : { y: -2, scale: 1.02, transition: { duration: 0.15, ease: 'easeOut' } }}
                            transition={{ duration: 0.15, ease: 'easeOut', delay: 0 }}
                            onMouseEnter={() => !isMobile && setHoveredStat(stat.label)}
                            onMouseLeave={() => setHoveredStat(null)}
                            style={{ background: stat.bgColor, border: `1px solid ${stat.borderColor}33` }}
                        >
                            <span 
                                className="text-sm md:text-lg font-bold leading-none mb-0.5" 
                                style={{ color: stat.color }}
                            >
                                {stat.value}
                            </span>
                            <span className="text-[9px] md:text-[10px] font-medium text-slate-400 uppercase tracking-[0.3px]">
                                {stat.label}
                            </span>

                            {/* Tooltip — below this card, aligned by position */}
                            <AnimatePresence>
                                {hoveredStat === stat.label && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 4, x: isMiddle ? '-50%' : 0 }}
                                        animate={{ opacity: 1, y: 0, x: isMiddle ? '-50%' : 0 }}
                                        exit={{ opacity: 0, y: 2, x: isMiddle ? '-50%' : 0 }}
                                        transition={{ duration: 0.15, ease: 'easeOut' }}
                                        className="absolute z-[1000] top-full mt-2 pointer-events-none"
                                        style={tooltipStyle}
                                    >
                                        <div className="quick-stat-tooltip bg-surface rounded-[10px] py-2.5 px-3.5 whitespace-nowrap relative"
                                            style={{
                                                border: `1.5px solid ${stat.color}40`,
                                                boxShadow: `0 4px 20px ${stat.color}25, 0 2px 8px rgba(0,0,0,0.08)`,
                                            }}>
                                            {/* Tooltip Arrow */}
                                            <div className={`quick-stat-tooltip-arrow absolute -top-1.5 rotate-45 w-2.5 h-2.5 bg-surface ${arrowPosClass}`}
                                                style={{
                                                    borderLeft: `1.5px solid ${stat.color}40`,
                                                    borderTop: `1.5px solid ${stat.color}40`,
                                                }} 
                                            />

                                            {/* Tooltip Content */}
                                            <div className="text-[13px] font-semibold mb-0.5" style={{ color: stat.color }}>
                                                {stat.value} {stat.label.toLowerCase()}
                                            </div>
                                            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                                                {stat.tooltip}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </motion.div>
    );
};
