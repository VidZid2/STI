/**
 * HomeContent Types
 * TypeScript type definitions for the home content component
 */

import type { StudyTimeData, StreakData, CourseProgressData } from '../../services/studyTimeService';

// Re-export for convenience
export type { StudyTimeData, StreakData, CourseProgressData };

// Course display types
export interface CourseWithProgress {
    id: string;
    title: string;
    code: string;
    instructor: string;
    progress: number;
    color: string;
    icon: string;
    lastAccessed?: string;
    totalModules?: number;
    completedModules?: number;
}

// Stats card types
export interface StatCardData {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
}

// View mode for courses
export type CourseViewMode = 'grid' | 'list';

// Filter options
export type CourseFilter = 'all' | 'in-progress' | 'completed' | 'not-started';

// Sort options
export type CourseSortOption = 'recent' | 'progress' | 'name' | 'deadline';

// Home content state
export interface HomeContentState {
    viewMode: CourseViewMode;
    filter: CourseFilter;
    sortBy: CourseSortOption;
    searchQuery: string;
}

// Animation variants
export interface AnimationVariants {
    hidden: object;
    visible: object;
}
