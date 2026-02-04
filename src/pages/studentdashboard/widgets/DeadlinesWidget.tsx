/**
 * DeadlinesWidget Component
 * Displays upcoming deadlines
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Deadline } from '../../../services/deadlinesService';
import { formatDaysUntil, getDeadlineTypeColor } from '../../../services/deadlinesService';

interface DeadlinesWidgetProps {
    deadlines: Deadline[];
    compactMode?: boolean;
    onViewAll?: () => void;
}

export const DeadlinesWidget: React.FC<DeadlinesWidgetProps> = ({
    deadlines,
    compactMode = false,
    onViewAll,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 }}
            className={`mx-3 mt-3 bg-white rounded-xl border border-zinc-100 overflow-hidden ${compactMode ? 'compact-widget' : ''}`}
        >
            <div className={`flex items-center justify-between border-b border-zinc-50 ${compactMode ? 'px-3 py-2' : 'px-4 py-3'}`}>
                <div className="flex items-center gap-2.5">
                    <div className={`rounded-lg bg-orange-50 flex items-center justify-center ${compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}>
                        <svg className={`text-orange-500 ${compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className={`font-medium text-zinc-800 ${compactMode ? 'text-xs' : 'text-sm'}`}>Upcoming</span>
                    {deadlines.length > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 ${compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                            {deadlines.length}
                        </span>
                    )}
                </div>
                <span className={`text-zinc-400 ${compactMode ? 'text-[10px]' : 'text-xs'}`}>Next 7 days</span>
            </div>

            <div className={`space-y-1 ${compactMode ? 'p-2' : 'p-3 space-y-2'}`}>
                {deadlines.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className={`flex flex-col items-center justify-center ${compactMode ? 'py-4' : 'py-6'}`}
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                            className={`rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100/80 flex items-center justify-center mb-3 ${compactMode ? 'w-10 h-10' : 'w-12 h-12'}`}
                        >
                            <motion.svg
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className={`text-emerald-500 ${compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </motion.svg>
                        </motion.div>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className={`font-medium text-zinc-600 ${compactMode ? 'text-[11px]' : 'text-xs'}`}
                        >
                            You're all caught up!
                        </motion.p>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className={`text-zinc-400 mt-0.5 ${compactMode ? 'text-[9px]' : 'text-[10px]'}`}
                        >
                            No deadlines in the next 7 days
                        </motion.p>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {deadlines.slice(0, 3).map((deadline, index) => {
                            const dueInfo = formatDaysUntil(deadline.dueDate);
                            const typeColor = getDeadlineTypeColor(deadline.type);
                            return (
                                <motion.div
                                    key={deadline.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ x: 4 }}
                                    className={`flex items-center gap-3 rounded-lg hover:bg-zinc-50 cursor-pointer transition-colors ${compactMode ? 'p-1.5' : 'p-2'}`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${typeColor}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium text-zinc-700 truncate ${compactMode ? 'text-[10px]' : 'text-xs'}`}>
                                            {deadline.title}
                                        </p>
                                        <p className={`text-zinc-400 ${compactMode ? 'text-[8px]' : 'text-[10px]'}`}>
                                            {deadline.courseName}
                                        </p>
                                    </div>
                                    <span className={`font-medium ${dueInfo.color} ${compactMode ? 'text-[8px]' : 'text-[10px]'}`}>
                                        {dueInfo.text}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>

            <a
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    onViewAll?.();
                }}
                className={`flex items-center justify-center gap-1.5 border-t border-zinc-50 text-blue-500 hover:bg-blue-50/50 transition-colors ${compactMode ? 'py-2 text-[10px]' : 'py-2.5 text-xs'}`}
            >
                View all deadlines
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </a>
        </motion.div>
    );
};

export default DeadlinesWidget;
