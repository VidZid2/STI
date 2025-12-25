/**
 * QuickStatsCard Component
 * Displays quick stats overview (courses, due soon, progress)
 */

import React from 'react';
import { motion } from 'motion/react';

interface QuickStatsCardProps {
    totalCourses: number;
    upcomingDeadlinesCount: number;
    overallProgress: number;
    compactMode?: boolean;
}

export const QuickStatsCard: React.FC<QuickStatsCardProps> = ({
    totalCourses,
    upcomingDeadlinesCount,
    overallProgress,
    compactMode = false,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`mx-3 mt-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white ${compactMode ? 'p-3' : 'p-4'}`}
        >
            <div className={`flex items-center justify-between ${compactMode ? 'mb-2' : 'mb-3'}`}>
                <span className={`font-medium text-blue-100 ${compactMode ? 'text-[10px]' : 'text-xs'}`}>This Week</span>
                <motion.div
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                    className={`rounded-full bg-white/20 flex items-center justify-center cursor-pointer ${compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                >
                    <svg className={compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </motion.div>
            </div>
            <div className={`grid grid-cols-3 ${compactMode ? 'gap-2' : 'gap-3'}`}>
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-center"
                >
                    <div className={`font-bold ${compactMode ? 'text-xl' : 'text-2xl'}`}>{totalCourses}</div>
                    <div className={`text-blue-100 ${compactMode ? 'text-[8px]' : 'text-[10px]'}`}>Courses</div>
                </motion.div>
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-center border-x border-white/20"
                >
                    <div className={`font-bold ${compactMode ? 'text-xl' : 'text-2xl'}`}>{upcomingDeadlinesCount}</div>
                    <div className={`text-blue-100 ${compactMode ? 'text-[8px]' : 'text-[10px]'}`}>Due Soon</div>
                </motion.div>
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-center"
                >
                    <div className={`font-bold ${compactMode ? 'text-xl' : 'text-2xl'}`}>{overallProgress}%</div>
                    <div className={`text-blue-100 ${compactMode ? 'text-[8px]' : 'text-[10px]'}`}>Progress</div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default QuickStatsCard;
