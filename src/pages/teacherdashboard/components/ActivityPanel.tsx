import React from 'react';
import { motion } from 'motion/react';
import { ClockIcon } from '../icons';
import type { ModalState } from '../types';

export interface ActivityItem {
    id: string;
    type: string;
    action: string;
    student: string;
    course: string;
    time: string;
    timestamp: Date;
}

interface ActivityPanelProps {
    activity: ActivityItem[];
    openModal: (modalName: keyof ModalState) => void;
}

export const ActivityPanel: React.FC<ActivityPanelProps> = ({ activity, openModal }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="activity-panel bg-white rounded-[14px] py-[18px] px-[22px] border border-black/5 mb-6"
        >
            {/* Panel Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="w-10 h-10 rounded-[10px] flex items-center justify-center text-blue-500"
                        style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)' }}
                    >
                        <ClockIcon size={20} />
                    </motion.div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-semibold text-slate-900 m-0">
                                Recent Activity
                            </h2>
                            <span className="px-1.5 py-0.5 rounded-[5px] bg-blue-500/10 text-[10px] font-semibold text-blue-500">
                                {activity.length} items
                            </span>
                        </div>
                        <p className="m-0 text-xs text-slate-500">
                            Latest submissions and updates
                        </p>
                    </div>
                </div>

                {/* View All Button */}
                <motion.button
                    className="dashboard-btn flex items-center gap-1.5 py-2 px-3 bg-blue-500/[0.08] text-blue-500 border border-blue-500/20 rounded-[10px] text-xs font-medium cursor-pointer"
                    whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    onClick={() => openModal('isActivityModalOpen')}
                >
                    View All
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </motion.button>
            </div>

            {/* Activity Items */}
            {activity.length === 0 ? (
                // Empty state
                <div className="flex flex-col items-center justify-center py-8 px-6 min-h-[160px]">
                    <div className="w-16 h-16 rounded-full border border-blue-500/20 flex items-center justify-center mb-3"
                         style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)' }}>
                        <svg className="w-7 h-7 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                    <h3 className="text-[15px] font-semibold text-slate-900 m-0 mb-1">
                        No recent activity
                    </h3>
                    <p className="text-[13px] text-slate-500 m-0 text-center">
                        Activity will appear here when students submit work
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
                    {activity.slice(0, 4).map((item, index) => {
                        const isFourth = index === 3;
                        
                        const isSub = item.type === 'submission';
                        const isGrade = item.type === 'grade';
                        const isDeadline = item.type === 'deadline';

                        const iconBgClass = isSub ? 'bg-blue-500/10' : isGrade ? 'bg-emerald-500/10' : isDeadline ? 'bg-amber-500/10' : 'bg-purple-500/10';
                        const iconColorClass = isSub ? 'text-blue-500' : isGrade ? 'text-emerald-500' : isDeadline ? 'text-amber-500' : 'text-purple-500';

                        return (
                            <motion.div
                                key={item.id || index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0, transition: { delay: 0.35 + index * 0.05 } }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                className={`items-center gap-3 p-3 md:py-[14px] md:px-4 rounded-xl bg-black/[0.015] border border-transparent cursor-pointer hover:bg-black/[0.02] md:hover:scale-[1.01] md:hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] ${isFourth ? 'hidden md:flex' : 'flex'}`}
                            >
                                {/* Activity Icon */}
                                <div className={`activity-card-icon w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${iconBgClass} ${iconColorClass}`}>
                                    {isSub ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                        </svg>
                                    ) : isGrade ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                    ) : isDeadline ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <line x1="19" y1="8" x2="19" y2="14" />
                                            <line x1="22" y1="11" x2="16" y2="11" />
                                        </svg>
                                    )}
                                </div>

                                {/* Activity Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-semibold text-slate-900 truncate">
                                        {item.action}
                                    </div>
                                    <div className="text-xs text-slate-500 truncate">
                                        {item.student} • {item.course}
                                    </div>
                                </div>

                                {/* Time */}
                                <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                                    {item.time}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
};
