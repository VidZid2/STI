/**
 * useCalendar Hook
 * Handles calendar state and data generation
 */

import { useState, useMemo, useCallback } from 'react';
import type { CalendarData } from '../types';
import type { Deadline } from '../../../services/deadlinesService';

interface UseCalendarReturn {
    calendarView: 'mini' | 'full';
    setCalendarView: (view: 'mini' | 'full') => void;
    calendarMonth: Date;
    setCalendarMonth: (date: Date) => void;
    calendarData: CalendarData;
    getDeadlinesForDate: (date: Date) => Deadline[];
    hasDeadlines: (date: Date) => boolean;
    goToPrevMonth: () => void;
    goToNextMonth: () => void;
    goToToday: () => void;
}

export const useCalendar = (upcomingDeadlines: Deadline[]): UseCalendarReturn => {
    const [calendarView, setCalendarView] = useState<'mini' | 'full'>('mini');
    const [calendarMonth, setCalendarMonth] = useState(() => new Date());

    // Get calendar data for current month
    const calendarData = useMemo((): CalendarData => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPadding = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const days: CalendarData['days'] = [];

        // Previous month padding
        const prevMonth = new Date(year, month, 0);
        for (let i = startPadding - 1; i >= 0; i--) {
            days.push({
                day: prevMonth.getDate() - i,
                isCurrentMonth: false,
                isToday: false,
                date: new Date(year, month - 1, prevMonth.getDate() - i)
            });
        }

        // Current month
        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            days.push({
                day: i,
                isCurrentMonth: true,
                isToday: date.toDateString() === today.toDateString(),
                date
            });
        }

        // Next month padding (fill to 42 days for 6 rows)
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({
                day: i,
                isCurrentMonth: false,
                isToday: false,
                date: new Date(year, month + 1, i)
            });
        }

        return {
            days,
            monthName: calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        };
    }, [calendarMonth]);

    // Get deadlines for a specific date
    const getDeadlinesForDate = useCallback((date: Date) => {
        return upcomingDeadlines.filter(d => {
            const deadlineDate = new Date(d.dueDate);
            return deadlineDate.toDateString() === date.toDateString();
        });
    }, [upcomingDeadlines]);

    // Check if date has deadlines
    const hasDeadlines = useCallback((date: Date) => {
        return getDeadlinesForDate(date).length > 0;
    }, [getDeadlinesForDate]);

    const goToPrevMonth = () => {
        setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCalendarMonth(new Date());
    };

    return {
        calendarView,
        setCalendarView,
        calendarMonth,
        setCalendarMonth,
        calendarData,
        getDeadlinesForDate,
        hasDeadlines,
        goToPrevMonth,
        goToNextMonth,
        goToToday,
    };
};

export default useCalendar;
