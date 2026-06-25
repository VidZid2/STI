/**
 * Student Dashboard Type Definitions
 * Created during Phase 0: Baseline & Safety Verification
 * 
 * Purpose: Ensure type safety for routing and prevent string literal bugs
 * during component extraction phases.
 */

/**
 * Valid view types for the Student Dashboard
 * These correspond to the main navigation tabs and content areas
 */
export type DashboardView = 
  | 'home'      // Dashboard overview with widgets
  | 'tools'     // Academic tools (grammar checker, plagiarism, etc.)
  | 'course'    // Individual course view (requires selectedCourse)
  | 'paths'     // Learning paths and course recommendations
  | 'goals'     // Goal tracking and progress
  | 'users'     // User management
  | 'catalog'   // Course catalog browser
  | 'groups';   // Group collaboration and chat

/**
 * Type guard to check if a string is a valid DashboardView
 */
export function isDashboardView(value: string): value is DashboardView {
  return [
    'home',
    'tools',
    'course',
    'paths',
    'goals',
    'users',
    'catalog',
    'groups'
  ].includes(value);
}

/**
 * Course interface for sidebar navigation and course view
 * Matches the structure used in getSidebarCoursesWithProgress()
 */
export interface DashboardCourse {
  id: string;
  title: string;
  progress: number;
  color?: string;
  subtitle: string;
  image: string;
}

export interface SidebarCourse extends DashboardCourse {
  description?: string;
}

export interface CalendarData {
  days: {
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    date: Date;
  }[];
  monthName: string;
}

export interface WeatherData {
  condition: string;
  icon: 'sunny' | 'partly-cloudy' | 'cloudy' | 'rainy' | 'stormy' | 'night';
  temperature: number;
  location: string;
  humidity: number;
  windSpeed: number;
}

export type WidgetVisibility = Record<string, boolean>;

export interface AchievementStats {
  total: number;
  unlocked: number;
  percentage: number;
  recent: {
    id: string;
    name: string;
    icon: string;
    rarity: string;
  }[];
}

export interface GradePrediction {
    predictedGrade: number;
    letterGrade: string;
    confidence: number;
    breakdown: { name: string; progress: number; contribution: number }[];
}

export interface StudyInsights {
    dailyData: { date: string; minutes: number; dayName: string }[];
    totalWeekMinutes: number;
    avgDailyMinutes: number;
    bestDay: { name: string; minutes: number } | null;
    trend: 'up' | 'down' | 'stable';
    trendPercent: number;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}
