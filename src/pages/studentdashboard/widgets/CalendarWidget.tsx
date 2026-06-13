/**
 * CalendarWidget Component
 * Full calendar with mini/full views, month navigation, and upcoming deadlines
 * Visibility key: calendar-widget
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { CalendarData } from '../types';
import type { Deadline } from '../../../services/deadlinesService';
import { Calendar } from '../../../components/ui/calendar';
import type { DateRange } from 'react-day-picker';

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
    calendarView,
    setCalendarView,
    calendarMonth,
    setCalendarMonth,
    upcomingDeadlines,
    getDeadlineTypeColor,
    compactMode = false,
    onClose,
}) => {
    const [selectedDate, setSelectedDate] = React.useState<DateRange | undefined>({
        from: new Date(),
        to: new Date(new Date().setDate(new Date().getDate() + 4))
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            whileHover={{ y: -2 }}
            className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] overflow-hidden transition-all duration-300 hover:border-slate-350 dark:hover:border-slate-650 ${compactMode ? 'shadow-none' : 'shadow-sm hover:shadow-md'}`}
            id="calendar-widget"
        >
            <div className={`flex items-center justify-between ${compactMode ? 'px-3 py-2' : 'px-4 py-3'}`}>
                <div className="flex items-center gap-2">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`rounded-xl bg-gradient-to-br from-violet-50 to-purple-100/50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-100/30 dark:border-violet-800/30 flex items-center justify-center ${compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}
                    >
                        <svg className={`text-violet-600 dark:text-violet-400 ${compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </motion.div>
                    <span className={`font-bold text-slate-800 dark:text-slate-200 ${compactMode ? 'text-xs' : 'text-sm'}`}>Calendar</span>
                </div>
                <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onClose()}
                    className={`flex items-center justify-center rounded-md text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors ${compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                >
                    <svg className={compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </motion.button>
            </div>
            <div className={compactMode 
                ? 'px-2 pt-2 flex flex-col items-center justify-center'
                : 'px-3 pt-3 flex flex-col items-center justify-center'
            }>
                {/* New Calendar Component */}
                <Calendar
                    mode="range"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    className={compactMode ? 'scale-[0.85] origin-top -mb-6' : 'mb-3'}
                />
            </div>
                
            <motion.button
                whileTap={{ backgroundColor: "rgba(241, 245, 249, 1)" }} // equivalent to slate-100
                onClick={() => setCalendarView(calendarView === 'mini' ? 'full' : 'mini')}
                className={`flex items-center justify-center gap-1.5 w-full font-bold py-3 transition-colors bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 focus:outline-none text-[11px]`}
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                        key={calendarView}
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 2 }}
                        transition={{ duration: 0.15 }}
                    >
                        {calendarView === 'mini' ? 'Show deadlines' : 'Hide deadlines'}
                    </motion.span>
                </AnimatePresence>
                <motion.svg 
                    className="w-3 h-3" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    animate={{ rotate: calendarView === 'mini' ? 0 : -180 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </motion.svg>
            </motion.button>

            {/* Full Calendar View with Deadlines */}
            <AnimatePresence>
                {calendarView === 'full' && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className={`${compactMode ? 'px-2 pb-2 pt-0' : 'px-3 pb-3 pt-0'}`}>

                            {/* Upcoming Deadlines Section */}
                            <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className={`text-orange-500 dark:text-orange-400 ${compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className={`font-semibold text-slate-700 dark:text-slate-300 ${compactMode ? 'text-[10px]' : 'text-xs'}`}>
                                        Upcoming Deadlines
                                    </span>
                                </div>
                                {upcomingDeadlines.length === 0 ? (
                                    <p className={`text-slate-400 dark:text-slate-500 text-center py-2 ${compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                                        No upcoming deadlines
                                    </p>
                                ) : (
                                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                                        {upcomingDeadlines.slice(0, 5).map((deadline, idx) => {
                                            const dueDate = new Date(deadline.dueDate);
                                            const typeColor = getDeadlineTypeColor(deadline.type);
                                            return (
                                                <motion.div
                                                    key={deadline.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className={`flex items-center gap-2 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 ${compactMode ? 'p-1.5' : 'p-2'}`}
                                                >
                                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${typeColor}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-semibold text-slate-700 dark:text-slate-300 truncate ${compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                                                            {deadline.title}
                                                        </p>
                                                        <p className={`text-slate-400 dark:text-slate-500 truncate ${compactMode ? 'text-[8px]' : 'text-[9px]'}`}>
                                                            {deadline.courseName}
                                                        </p>
                                                    </div>
                                                    <span className={`text-slate-500 dark:text-slate-400 flex-shrink-0 ${compactMode ? 'text-[8px]' : 'text-[9px]'}`}>
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
