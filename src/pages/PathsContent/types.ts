/**
 * PathsContent Types
 * TypeScript type definitions for the paths content component
 */

import type { PathWithProgress, PathRecommendation } from '../../services/pathsService';

// Re-export for convenience
export type { PathWithProgress, PathRecommendation };

// Component props
export interface PathsContentProps {
    onPathSelect?: (pathId: string) => void;
}

// Path icon types
export interface PathIconProps {
    icon: string;
    color: string;
    size?: number;
}

// Filter options
export type PathFilter = 'all' | 'enrolled' | 'recommended' | 'completed';

// Difficulty levels
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

// Sort options
export type PathSortOption = 'popular' | 'newest' | 'progress' | 'difficulty';

// View mode
export type PathViewMode = 'grid' | 'list';

// Path card state
export interface PathCardState {
    isExpanded: boolean;
    isEnrolling: boolean;
    showCourses: boolean;
}

// Stats display
export interface PathStatsDisplay {
    totalPaths: number;
    enrolledPaths: number;
    completedPaths: number;
    totalHours: number;
}
