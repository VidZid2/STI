/**
 * CalendarWidget Component
 * Full calendar with mini/full views, month navigation, and upcoming deadlines
 * Visibility key: calendar-widget
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { CalendarData } from '../types';
import type { Deadline } from '../../../services/deadlinesService';

interface CalendarWidgetProps {
    calendarData: CalendarData;
    calendarView: 'mini' | 'full';
    setCalendarView: (view: 'mini' | 'full') => void;
    calendarMonth: Date;
    setCalendarMonth: (date: Date) => void;
    hasDeadlines: (date: Date) => boolean;
    upcomingDeadlines: Deadline[];
    getDeadlineTypeColor: (type: Deadline['type']) => string;
    compactMode?: boolean;
    onClose: () => void;
}

export const CalendarWidget = React.memo<CalendarWidgetProps>(({
    calendarData,
    calendarView,
    setCalendarView,
    calendarMonth,
    setCalendarMonth,
    hasDeadlines,
    upcomingDeadlines,
    getDeadlineTypeColor,
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
            id="calendar-widget"
        >
            <div className={`flex items-center justify-between ${compactMode ? 'px-3 py-2' : 'px-4 py-3'}`}>
                <div className="flex items-center gap-2">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`rounded-lg bg-gradient-to-br from-violet-50 to-violet-100/50 flex items-center justify-center ${compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}
                    >
                        <svg className={`text-violet-500 ${compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </motion.div>
                    <span className={`font-medium text-zinc-700 ${compactMode ? 'text-xs' : 'text-sm'}`}>Calendar</span>
                </div>
                <motion.button
                    whileHover={{ scale: 1.15, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onClose()}
                    className={`flex items-center justify-center rounded-md text-zinc-300 hover:text-red-400 transition-${compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                >
                    <svg className={compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </motion.button>
            </div>
            <div className={compactMode ? 'p-2' : 'p-3'}>
                {/* Mini Calendar Month Navigation */}
                <div className={`flex items-center justify-between ${compactMode ? 'mb-2' : 'mb-3'}`}>
                    <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.05)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                        className={`flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 ${compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                    >
                        <svg className={compactMode ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </motion.button>
                    <span className={`font-medium text-zinc-600 ${compactMode ? 'text-[10px]' : 'text-xs'}`}>
                        {calendarData.monthName}
                    </span>
                    <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.05)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                        className={`flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 ${compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                    >
                        <svg className={compactMode ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </motion.button>
                </div>
                {/* Mini Calendar Day Headers */}
                <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className={`font-medium text-zinc-400 ${compactMode ? 'text-[8px] py-0.5' : 'text-[9px] py-1'}`}>{day}</div>
                    ))}
                </div>
                {/* Mini Calendar Grid - Using dynamic calendarData */}
                <div className="grid grid-cols-7 gap-1 text-center">
                    {calendarData.days.slice(0, 35).map((dayData, i) => {
                        const dayDeadlines = hasDeadlines(dayData.date);
                        return (
                            <motion.div
                                key={i}
                                whileHover={!dayData.isCurrentMonth ? {} : { scale: 1.08, color: dayData.isToday ? 'rgb(255, 255, 255)' : 'rgb(59, 130, 246)' }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
                                className={`relative rounded-md cursor-pointer ${compactMode ? 'text-[9px] py-1' : 'text-[11px] py-1.5'} ${!dayData.isCurrentMonth
                                        ? 'text-zinc-300 cursor-default'
                                        : dayData.isToday
                                            ? 'bg-blue-500 text-white font-semibold shadow-md shadow-blue-200/50'
                                            : 'text-zinc-700 font-medium'
                                    }`}
                            >
                                {dayData.day}
                                {/* Deadline indicator dot */}
                                {dayDeadlines && dayData.isCurrentMonth && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className={`absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full ${dayData.isToday ? 'bg-white' : 'bg-orange-500'
                                            } ${compactMode ? 'w-1 h-1' : 'w-1.5 h-1.5'}`}
                                    />
                                )}
                            </motion.div>
                        );
                    })}
                </div>
                <motion.button
                    whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCalendarView(calendarView === 'mini' ? 'full' : 'mini')}
                    className={`flex items-center justify-center gap-1.5 w-full border-t border-zinc-50 text-blue-500 transition-${compactMode ? 'mt-2 py-2 text-[9px]' : 'mt-3 py-2.5 text-xs'}`}
                >
                    {calendarView === 'mini' ? 'Full calendar' : 'Mini view'}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={calendarView === 'mini' ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
                    </svg>
                </motion.button>
            </div>

            {/* Full Calendar View with Deadlines */}
            <AnimatePresence>
                {calendarView === 'full' && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden border-t border-zinc-100"
                    >
                        <div className={`${compactMode ? 'p-2' : 'p-3'}`}>
                            {/* Month Navigation */}
                            <div className={`flex items-center justify-between ${compactMode ? 'mb-2' : 'mb-3'}`}>
                                <motion.button
                                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.05)' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                                    className={`flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 ${compactMode ? 'w-6 h-6' : 'w-7 h-7'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </motion.button>
                                <span className={`font-semibold text-zinc-700 ${compactMode ? 'text-xs' : 'text-sm'}`}>
                                    {calendarData.monthName}
                                </span>
                                <motion.button
                                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.05)' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                                    className={`flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 ${compactMode ? 'w-6 h-6' : 'w-7 h-7'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </motion.button>
                            </div>

                            {/* Day Headers */}
                            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                                    <div key={i} className={`font-semibold text-zinc-500 ${compactMode ? 'text-[9px] py-1' : 'text-[10px] py-1.5'}`}>
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1">
                                {calendarData.days.map((dayData, i) => {
                                    const dayDeadlines = hasDeadlines(dayData.date);
                                    return (
                                        <motion.div
                                            key={i}
                                            whileHover={dayData.isCurrentMonth ? { scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 0.1)' } : {}}
                                            className={`relative rounded-lg text-center cursor-pointer ${compactMode ? 'py-1.5' : 'py-2'} ${!dayData.isCurrentMonth
                                                    ? 'text-zinc-300'
                                                    : dayData.isToday
                                                        ? 'bg-blue-500 text-white font-bold shadow-md'
                                                        : 'text-zinc-700 font-medium hover:bg-zinc-50'
                                                }`}
                                        >
                                            <span className={compactMode ? 'text-[10px]' : 'text-xs'}>
                                                {dayData.day}
                                            </span>
                                            {dayDeadlines && dayData.isCurrentMonth && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-full ${dayData.isToday ? 'bg-white' : 'bg-orange-500'
                                                        } ${compactMode ? 'w-1 h-1' : 'w-1.5 h-1.5'}`}
                                                />
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Upcoming Deadlines Section */}
                            <div className={`mt-3 pt-3 border-t border-zinc-100`}>
                                <div className={`flex items-center gap-2 mb-2`}>
                                    <svg className={`text-orange-500 ${compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className={`font-semibold text-zinc-700 ${compactMode ? 'text-[10px]' : 'text-xs'}`}>
                                        Upcoming Deadlines
                                    </span>
                                </div>
                                {upcomingDeadlines.length === 0 ? (
                                    <p className={`text-zinc-400 text-center py-2 ${compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                                        No upcoming deadlines
                                    </p>
                                ) : (
                                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                        {upcomingDeadlines.slice(0, 5).map((deadline, idx) => {
                                            const dueDate = new Date(deadline.dueDate);
                                            const typeColor = getDeadlineTypeColor(deadline.type);
                                            return (
                                                <motion.div
                                                    key={deadline.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className={`flex items-center gap-2 rounded-lg bg-zinc-50 ${compactMode ? 'p-1.5' : 'p-2'}`}
                                                >
                                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${typeColor}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-medium text-zinc-700 truncate ${compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                                                            {deadline.title}
                                                        </p>
                                                        <p className={`text-zinc-400 ${compactMode ? 'text-[8px]' : 'text-[9px]'}`}>
                                                            {deadline.courseName}
                                                        </p>
                                                    </div>
                                                    <span className={`text-zinc-500 flex-shrink-0 ${compactMode ? 'text-[8px]' : 'text-[9px]'}`}>
                                                        {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

CalendarWidget.displayName = 'CalendarWidget';

export default CalendarWidget;
