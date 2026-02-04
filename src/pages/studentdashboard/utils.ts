/**
 * DashboardPage Utilities
 * Helper functions for the dashboard
 */

import { getCourseProgressData } from '../../services/studyTimeService';
import { SIDEBAR_COURSES_BASE, MOTIVATIONAL_QUOTES, DEFAULT_LOCATION, WEATHER_REFRESH_INTERVAL } from './constants';
import type { SidebarCourse, CalendarData, WeatherData } from './types';

// Re-export constants for hooks
export { DEFAULT_LOCATION, WEATHER_REFRESH_INTERVAL };

/**
 * Get courses with dynamic progress from service
 */
export const getSidebarCoursesWithProgress = (): SidebarCourse[] => {
    const progressData = getCourseProgressData();
    return SIDEBAR_COURSES_BASE.map(course => ({
        ...course,
        progress: progressData[course.id]?.progress || 0
    }));
};

/**
 * Get today's motivational quote based on day of year
 */
export const getTodaysQuote = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
};

/**
 * Generate calendar data for a given month
 */
export const getCalendarData = (calendarMonth: Date): CalendarData => {
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
};

/**
 * Map weather code to condition and icon
 */
export const mapWeatherCode = (weatherCode: number): { condition: string; icon: WeatherData['icon'] } => {
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 18;

    if (weatherCode === 0) {
        return {
            condition: isNight ? 'Clear Night' : 'Sunny',
            icon: isNight ? 'night' : 'sunny'
        };
    } else if (weatherCode <= 3) {
        return { condition: 'Partly Cloudy', icon: 'partly-cloudy' };
    } else if (weatherCode <= 48) {
        return { condition: 'Cloudy', icon: 'cloudy' };
    } else if (weatherCode <= 67) {
        return { condition: 'Rainy', icon: 'rainy' };
    } else if (weatherCode <= 77) {
        return { condition: 'Snowy', icon: 'cloudy' };
    } else if (weatherCode <= 99) {
        return { condition: 'Stormy', icon: 'stormy' };
    }

    return { condition: 'Clear', icon: 'sunny' };
};

/**
 * Calculate grade letter from percentage
 */
export const getLetterGrade = (predictedGrade: number): string => {
    if (predictedGrade >= 97) return '1.00';
    if (predictedGrade >= 94) return '1.25';
    if (predictedGrade >= 91) return '1.50';
    if (predictedGrade >= 88) return '1.75';
    if (predictedGrade >= 85) return '2.00';
    if (predictedGrade >= 82) return '2.25';
    if (predictedGrade >= 79) return '2.50';
    if (predictedGrade >= 76) return '2.75';
    if (predictedGrade >= 75) return '3.00';
    return '5.00';
};

/**
 * Get progress bar color based on percentage
 */
export const getProgressColor = (progress: number): { bar: string; bg: string } => {
    if (progress >= 80) return { bar: 'bg-emerald-500', bg: 'bg-emerald-100' };
    if (progress >= 50) return { bar: 'bg-blue-500', bg: 'bg-blue-100' };
    if (progress >= 20) return { bar: 'bg-amber-500', bg: 'bg-amber-100' };
    return { bar: 'bg-zinc-300', bg: 'bg-zinc-100' };
};

/**
 * Get grade color based on percentage
 */
export const getGradeColor = (grade: number): string => {
    if (grade >= 85) return 'text-emerald-600';
    if (grade >= 75) return 'text-blue-600';
    if (grade >= 60) return 'text-amber-600';
    return 'text-red-500';
};

/**
 * Get rarity color for achievements
 */
export const getRarityColor = (rarity: string): string => {
    switch (rarity) {
        case 'legendary': return 'text-amber-500';
        case 'epic': return 'text-purple-500';
        case 'rare': return 'text-blue-500';
        default: return 'text-zinc-400';
    }
};

/**
 * Get rarity background for achievements
 */
export const getRarityBg = (rarity: string): string => {
    switch (rarity) {
        case 'legendary': return 'bg-amber-50/50';
        case 'epic': return 'bg-purple-50/50';
        case 'rare': return 'bg-blue-50/50';
        default: return 'bg-zinc-50/50';
    }
};
