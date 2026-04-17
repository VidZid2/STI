import React from 'react';
import { motion } from 'motion/react';
import { BoltIcon, CalendarIcon } from '../icons';

export interface TaskItem {
    id: string;
    type: 'grading' | 'deadline' | 'meeting';
    title: string;
    description: string;
    dueDate: string;
    priority: 'high' | 'medium' | 'low';
    count?: number;
}

interface UrgentTasksPanelProps {
    isLoadingSchedule: boolean;
    urgentTasks: TaskItem[];
}

export const UrgentTasksPanel: React.FC<UrgentTasksPanelProps> = ({ isLoadingSchedule, urgentTasks }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="tasks-panel bg-white rounded-[20px] p-6 border border-black/5"
        >
            <div className="flex items-center gap-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500"
                    style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.04) 100%)' }}>
                    <BoltIcon size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 m-0">
                        Pending Tasks
                    </h2>
                    <p className="text-sm text-slate-500 m-0">
                        {isLoadingSchedule ? 'Loading...' : `${urgentTasks.filter(t => t.priority === 'high').length} high priority items`}
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {isLoadingSchedule ? (
                    // Loading skeleton
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-xl">
                            <div className="w-10 h-10 rounded-lg bg-black/5" />
                            <div className="flex-1">
                                <div className="w-1/2 h-3.5 bg-black/5 rounded mb-1.5" />
                                <div className="w-[70%] h-3 bg-black/5 rounded" />
                            </div>
                            <div className="w-[70px] h-6 bg-black/5 rounded-md" />
                        </div>
                    ))
                ) : urgentTasks.length === 0 ? (
                    // Empty state
                    <div className="flex flex-col items-center justify-center py-8 px-6 min-h-[200px]">
                        <div className="w-[72px] h-[72px] rounded-full border border-emerald-500/20 flex items-center justify-center mb-4"
                             style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)' }}>
                            <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                                <circle cx="18" cy="18" r="14" stroke="#10b981" strokeWidth="2" fill="none" />
                                <path d="M12 18L16 22L24 14" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                <path d="M28 6L28.5 8L30.5 8.5L28.5 9L28 11L27.5 9L25.5 8.5L27.5 8L28 6Z" fill="#10b981" opacity="0.6" />
                                <path d="M7 25L7.4 26.6L9 27L7.4 27.4L7 29L6.6 27.4L5 27L6.6 26.6L7 25Z" fill="#10b981" opacity="0.4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">
                            All caught up!
                        </h3>
                        <p className="text-sm text-slate-500 text-center">
                            No pending tasks at the moment
                        </p>
                    </div>
                ) : (
                    urgentTasks.map((task, index) => {
                        const isToday = task.dueDate.toLowerCase().includes('today');
                        const isSoon = task.dueDate.toLowerCase().includes('2 day') || task.dueDate.toLowerCase().includes('tomorrow');
                        
                        // Using raw hex codes to match shadow values perfectly from inline styles,
                        // and standard tailwind classes for the static properties to stay uniform.
                        const urgencyHexColor = isToday ? 'var(--color-danger)' : isSoon ? 'var(--color-warning)' : '#3b82f6';
                        
                        const colorClass = isToday ? 'text-red-500' : isSoon ? 'text-amber-500' : 'text-blue-500';
                        const bgSubtleClass = isToday ? 'bg-red-500/[0.04]' : isSoon ? 'bg-amber-500/[0.04]' : 'bg-blue-500/[0.04]';
                        const bgLightClass = isToday ? 'bg-red-500/15' : isSoon ? 'bg-amber-500/15' : 'bg-blue-500/15';
                        const borderClass = isToday ? 'border-red-500/20' : isSoon ? 'border-amber-500/20' : 'border-blue-500/20';
                        const badgeBorderClass = isToday ? 'border-red-500' : isSoon ? 'border-amber-500' : 'border-blue-500';
                        const badgeBgClass = isToday ? 'bg-red-500' : isSoon ? 'bg-amber-500' : 'bg-blue-500';

                        return (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0, transition: { delay: 0.2 + index * 0.05 } }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                whileHover={{ scale: 1.01, boxShadow: `0 4px 12px ${urgencyHexColor}20` }}
                                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer border relative transition-all ${bgSubtleClass} ${borderClass}`}
                            >
                                {/* Priority Indicator */}
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 relative ${bgLightClass} ${colorClass}`}>
                                    {task.type === 'grading' ? (
                                        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <line x1="16" y1="13" x2="8" y2="13" />
                                            <line x1="16" y1="17" x2="8" y2="17" />
                                        </svg>
                                    ) : task.type === 'deadline' ? (
                                        <CalendarIcon size={18} />
                                    ) : (
                                        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                    )}
                                    {task.count && task.count > 0 && (
                                        <div className={`absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full text-white text-[10px] font-bold flex items-center justify-center ${badgeBgClass}`}>
                                            {task.count}
                                        </div>
                                    )}
                                </div>

                                {/* Task Info */}
                                <div className="flex-1">
                                    <div className="text-[13px] font-semibold text-slate-900">
                                        {task.title}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                        {task.description}
                                    </div>
                                </div>

                                {/* Due Date Badge */}
                                <div className={`px-3 py-1 rounded-lg bg-transparent border-[1.5px] text-xs font-semibold whitespace-nowrap ${colorClass} ${badgeBorderClass}`}>
                                    {task.dueDate}
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </motion.div>
    );
};
