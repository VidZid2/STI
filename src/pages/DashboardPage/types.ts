/**
 * DashboardPage Types
 * Centralized type definitions for the dashboard
 */

// Notification types
export interface ToastNotification {
    id: number;
    title: string;
    message: string;
    type: 'assignment' | 'grade' | 'announcement' | 'system' | 'warning';
}

export interface NotificationItemProps {
    notification: ToastNotification;
    onClose: (id: number) => void;
}

export interface GroupedNotificationProps {
    notifications: ToastNotification[];
    onClearAll: () => void;
    onViewAll: () => void;
}

// Course types
export interface SidebarCourse {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    progress: number;
}

export interface SelectedCourse {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    progress: number;
}

// Weather types
export interface WeatherData {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    location: string;
    icon: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'night' | 'partly-cloudy';
}

// Calendar types
export interface CalendarDay {
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    date: Date;
}

export interface CalendarData {
    days: CalendarDay[];
    monthName: string;
}

// Todo types
export interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    createdAt: string;
}

// Study insights types
export interface StudyInsights {
    dailyData: { date: string; minutes: number; dayName: string }[];
    totalWeekMinutes: number;
    avgDailyMinutes: number;
    bestDay: { name: string; minutes: number } | null;
    trend: 'up' | 'down' | 'stable';
    trendPercent: number;
}

// Grade predictor types
export interface GradePrediction {
    predictedGrade: number;
    letterGrade: string;
    confidence: number;
    breakdown: { name: string; progress: number; contribution: number }[];
    lastUpdated?: string;
}

// Achievement types
export interface Achievement {
    id: string;
    name: string;
    icon: string;
    rarity: string;
}

export interface AchievementStats {
    total: number;
    unlocked: number;
    percentage: number;
    recent: Achievement[];
}

// Widget visibility types
export interface WidgetVisibility {
    'mastery-widget': boolean;
    'calendar-widget': boolean;
    'todo-widget': boolean;
    'announcements-widget': boolean;
    'activity-widget': boolean;
    'courses-widget': boolean;
    'quote-widget': boolean;
    'weather-widget': boolean;
    'grade-predictor-widget': boolean;
    'achievements-widget': boolean;
    [key: string]: boolean;
}

// View types
export type DashboardView = 'home' | 'tools' | 'course' | 'paths' | 'goals' | 'users' | 'catalog' | 'groups';
export type PreviousView = 'home' | 'tools' | 'paths' | 'goals' | 'users' | 'catalog';
