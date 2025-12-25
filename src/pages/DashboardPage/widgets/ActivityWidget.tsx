/**
 * ActivityWidget Component
 * Displays recent activity list
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ActivityItem } from '../../../services/activityService';
import { formatRelativeTime } from '../../../services/activityService';

interface ActivityWidgetProps {
    activities: ActivityItem[];
    compactMode?: boolean;
    onClose: () => void;
}

const ActivityIcon: React.FC<{ type: ActivityItem['type']; compact: boolean }> = ({ type, compact }) => {
    const iconSize = compact ? 'w-3 h-3' : 'w-3.5 h-3.5';
    
    switch (type) {
        case 'course_access':
            return (
                <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            );
        case 'material_view':
            return (
                <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            );
        case 'module_complete':
            return (
                <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        default:
            return (
                <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
            );
    }
};

const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
        case 'course_access':
            return 'bg-blue-50 text-blue-500';
        case 'material_view':
            return 'bg-amber-50 text-amber-500';
        case 'module_complete':
            return 'bg-emerald-50 text-emerald-500';
        default:
            return 'bg-violet-50 text-violet-500';
    }
};

export const ActivityWidget: React.FC<ActivityWidgetProps> = ({
    activities,
    compactMode = false,
    onClose,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            className={`bg-white rounded-xl border border-zinc-100/80 overflow-hidden ${compactMode ? 'shadow-none' : 'shadow-sm'}`}
            id="activity-widget"
        >
            <div className={`flex items-center justify-between ${compactMode ? 'px-3 py-2' : 'px-4 py-3'}`}>
                <div className="flex items-center gap-2">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`rounded-lg bg-gradient-to-br from-violet-50 to-purple-100/50 flex items-center justify-center ${compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}
                    >
                        <svg className={`text-violet-500 ${compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </motion.div>
                    <span className={`font-medium text-zinc-700 ${compactMode ? 'text-xs' : 'text-sm'}`}>Recent Activity</span>
                    {activities.length > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 ${compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                            {activities.length}
                        </span>
                    )}
                </div>
                <motion.button
                    whileHover={{ scale: 1.15, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className={`flex items-center justify-center rounded-md text-zinc-300 hover:text-red-400 transition-colors ${compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                >
                    <svg className={compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </motion.button>
            </div>

            {/* Activity List */}
            <div className={compactMode ? 'px-3 pb-3' : 'px-4 pb-4'}>
                {activities.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col items-center justify-center ${compactMode ? 'py-4' : 'py-6'}`}
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            className={`rounded-full bg-gradient-to-br from-violet-50 to-purple-100/80 flex items-center justify-center mb-3 ${compactMode ? 'w-10 h-10' : 'w-12 h-12'}`}
                        >
                            <svg className={`text-violet-400 ${compactMode ? 'w-5 h-5' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </motion.div>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className={`font-medium text-zinc-600 ${compactMode ? 'text-[11px]' : 'text-xs'}`}
                        >
                            No recent activity
                        </motion.p>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className={`text-zinc-400 mt-0.5 ${compactMode ? 'text-[9px]' : 'text-[10px]'}`}
                        >
                            Start exploring courses
                        </motion.p>
                    </motion.div>
                ) : (
                    <div className="space-y-1">
                        <AnimatePresence mode="popLayout">
                            {activities.slice(0, 5).map((activity, index) => (
                                <motion.div
                                    key={activity.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ x: 4, backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
                                    className={`flex items-center gap-2.5 rounded-lg cursor-pointer transition-colors ${compactMode ? 'p-1.5' : 'p-2'}`}
                                >
                                    <div className={`flex-shrink-0 rounded-md flex items-center justify-center ${getActivityColor(activity.type)} ${compactMode ? 'w-6 h-6' : 'w-7 h-7'}`}>
                                        <ActivityIcon type={activity.type} compact={compactMode} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium text-zinc-700 truncate ${compactMode ? 'text-[10px]' : 'text-xs'}`}>
                                            {activity.title}
                                        </p>
                                        {activity.subtitle && (
                                            <p className={`text-zinc-400 truncate ${compactMode ? 'text-[8px]' : 'text-[10px]'}`}>
                                                {activity.subtitle}
                                            </p>
                                        )}
                                    </div>
                                    <span className={`flex-shrink-0 text-zinc-400 ${compactMode ? 'text-[8px]' : 'text-[10px]'}`}>
                                        {formatRelativeTime(activity.timestamp)}
                                    </span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ActivityWidget;
