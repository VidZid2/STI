import React from 'react';
import { motion } from 'motion/react';
import { CalendarIcon, CheckCircleIcon, PlayCircleIcon, ClockIcon, MapPinIcon } from '../icons';

export interface ScheduleItem {
    id: string;
    subject: string;
    section: string;
    room: string;
    startTime: string;
    endTime: string;
    status: 'upcoming' | 'ongoing' | 'completed';
    studentsPresent?: number;
    totalStudents?: number;
}

interface SchedulePanelProps {
    isLoadingSchedule: boolean;
    todaysSchedule: ScheduleItem[];
}

export const SchedulePanel: React.FC<SchedulePanelProps> = ({ isLoadingSchedule, todaysSchedule }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="schedule-panel bg-white rounded-[20px] p-6 border border-black/5"
        >
            <div className="flex items-center gap-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500"
                    style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.04) 100%)' }}>
                    <CalendarIcon size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 m-0">
                        Today's Schedule
                    </h2>
                    <p className="text-sm text-slate-500 m-0">
                        {isLoadingSchedule ? 'Loading...' : `${todaysSchedule.length} classes today`}
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {isLoadingSchedule ? (
                    // Loading skeleton
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-xl">
                            <div className="w-9 h-9 rounded-lg bg-black/5" />
                            <div className="flex-1">
                                <div className="w-[60%] h-3.5 bg-black/5 rounded mb-1.5" />
                                <div className="w-[40%] h-3 bg-black/5 rounded" />
                            </div>
                            <div className="w-20 h-3.5 bg-black/5 rounded" />
                        </div>
                    ))
                ) : todaysSchedule.length === 0 ? (
                    // Empty state
                    <div className="flex flex-col items-center justify-center py-8 px-6 min-h-[200px]">
                        <div className="w-[72px] h-[72px] rounded-full border border-blue-500/20 flex items-center justify-center mb-4"
                             style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)' }}>
                            <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                                <rect x="6" y="10" width="24" height="20" rx="3" stroke="#3b82f6" strokeWidth="2" fill="none" />
                                <path d="M12 6V12" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
                                <path d="M24 6V12" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
                                <path d="M6 16H30" stroke="#3b82f6" strokeWidth="2" />
                                <circle cx="18" cy="23" r="3" stroke="#3b82f6" strokeWidth="1.5" fill="none" />
                                <path d="M18 18V19M18 27V28M13 23H14M22 23H23M14.5 19.5L15.2 20.2M20.8 25.8L21.5 26.5M21.5 19.5L20.8 20.2M15.2 25.8L14.5 26.5" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">
                            Free day!
                        </h3>
                        <p className="text-sm text-slate-500 text-center">
                            No classes scheduled for today
                        </p>
                    </div>
                ) : (
                    todaysSchedule.map((schedule, index) => {
                        const isOngoing = schedule.status === 'ongoing';
                        const isCompleted = schedule.status === 'completed';

                        return (
                            <motion.div
                                key={schedule.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0, transition: { delay: 0.15 + index * 0.05 } }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                whileHover={{ background: isOngoing ? 'rgba(59, 130, 246, 0.08)' : 'rgba(0,0,0,0.02)' }}
                                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer ${
                                    isOngoing ? 'bg-blue-500/[0.06] border border-blue-500/20' : 'bg-transparent border border-transparent'
                                }`}
                            >
                                {/* Status Indicator */}
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                    isCompleted ? 'bg-emerald-500/15 text-emerald-500' :
                                    isOngoing ? 'bg-blue-500/15 text-blue-500' :
                                    'bg-black/5 text-slate-400'
                                }`}>
                                    {isCompleted ? <CheckCircleIcon size={18} /> :
                                     isOngoing ? <PlayCircleIcon size={18} /> :
                                     <ClockIcon size={16} />}
                                </div>

                                {/* Schedule Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-semibold text-slate-900 truncate">
                                        {schedule.subject}
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                        <span>{schedule.section}</span>
                                        <span className="text-slate-400">•</span>
                                        <span className="flex items-center gap-1">
                                            <MapPinIcon size={12} />
                                            {schedule.room}
                                        </span>
                                    </div>
                                </div>

                                {/* Time & Status */}
                                <div className="text-right shrink-0">
                                    <div className={`text-xs font-medium ${isOngoing ? 'text-blue-500' : 'text-slate-900'}`}>
                                        {schedule.startTime} - {schedule.endTime}
                                    </div>
                                    {isOngoing && (
                                        <div className="text-[11px] font-medium text-blue-500 mt-0.5">
                                            🔴 LIVE NOW
                                        </div>
                                    )}
                                    {isCompleted && schedule.studentsPresent && (
                                        <div className="text-[11px] text-emerald-500 mt-0.5">
                                            {schedule.studentsPresent}/{schedule.totalStudents} present
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </motion.div>
    );
};
