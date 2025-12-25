/**
 * GroupedNotification Component
 * Shows when 3+ notifications - expandable grouped view
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SmallTypeIcon } from './SmallTypeIcon';
import type { GroupedNotificationProps } from '../types';

export const GroupedNotification: React.FC<GroupedNotificationProps> = ({ notifications, onClearAll, onViewAll }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const getTypeSummary = () => {
        const types: Record<string, number> = {};
        notifications.forEach(n => {
            types[n.type] = (types[n.type] || 0) + 1;
        });
        return Object.entries(types).map(([type, count]) =>
            `${count} ${type}${count > 1 ? 's' : ''}`
        ).join(', ');
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -100, scale: 0.9 }}
            animate={{
                opacity: 1,
                x: 0,
                scale: 1,
                transition: { type: 'spring', stiffness: 400, damping: 28 }
            }}
            exit={{
                opacity: 0,
                x: -80,
                scale: 0.9,
                transition: { duration: 0.2 }
            }}
            className="bg-white rounded-xl shadow-sm overflow-hidden border border-zinc-200/60"
        >
            {/* Header */}
            <motion.div
                className="flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer hover:bg-zinc-50/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
                whileHover={{ backgroundColor: 'rgba(244, 244, 245, 0.5)' }}
                whileTap={{ scale: 0.99 }}
            >
                <motion.div
                    className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
                >
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                        <path
                            d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
                            stroke="#3b82f6"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M13.73 21a2 2 0 01-3.46 0"
                            stroke="#3b82f6"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                        />
                    </svg>
                </motion.div>
                <div className="flex-1 min-w-0">
                    <motion.p
                        className="text-[13px] font-semibold text-zinc-800"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        {notifications.length} notifications
                    </motion.p>
                    <motion.p
                        className="text-[11px] text-zinc-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                    >
                        {getTypeSummary()}
                    </motion.p>
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="text-zinc-400"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </motion.div>
            </motion.div>

            {/* Expanded List */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-zinc-100 max-h-40 overflow-y-auto">
                            {notifications.map((notif, index) => (
                                <motion.div
                                    key={notif.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03, type: 'spring', stiffness: 300 }}
                                    className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-zinc-50/50 transition-colors border-b border-zinc-50 last:border-b-0"
                                >
                                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                                        <SmallTypeIcon title={notif.title} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-medium text-zinc-700 leading-tight">{notif.title}</p>
                                        <p className="text-[10px] text-zinc-400 line-clamp-1">{notif.message}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex border-t border-zinc-100">
                            <motion.button
                                onClick={onViewAll}
                                whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.08)' }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 py-2 text-[11px] font-medium text-blue-600 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View All
                            </motion.button>
                            <div className="w-px bg-zinc-100" />
                            <motion.button
                                onClick={onClearAll}
                                whileHover={{ backgroundColor: 'rgba(244, 244, 245, 0.8)' }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 py-2 text-[11px] font-medium text-zinc-500 hover:text-zinc-700 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Clear All
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default GroupedNotification;
