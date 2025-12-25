/**
 * GoalsContent Types
 * TypeScript type definitions for the goals content component
 */

import type {
    GoalWithProgress,
    GoalType,
    GoalPriority,
    GoalStatus,
} from '../../services/goalsService';

// Re-export for convenience
export type { GoalWithProgress, GoalType, GoalPriority, GoalStatus };

// Component props
export interface GoalsContentProps {
    onGoalSelect?: (goalId: string) => void;
}

// Goal icon props
export interface GoalIconProps {
    type: GoalType;
    color: string;
    size?: number;
}

// View mode
export type GoalViewMode = 'grid' | 'list';

// Filter options
export type GoalFilter = 'all' | 'active' | 'completed' | 'overdue';

// Sort options
export type GoalSortOption = 'deadline' | 'priority' | 'progress' | 'created';

// Goal card state
export interface GoalCardState {
    isExpanded: boolean;
    isEditing: boolean;
    showProgress: boolean;
}

// Stats display
export interface GoalStatsDisplay {
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    overdueGoals: number;
    completionRate: number;
}

// Create goal form data
export interface CreateGoalFormData {
    title: string;
    description: string;
    type: GoalType;
    targetValue: number;
    deadline: string;
    priority: GoalPriority;
    courseId?: string;
}

// Progress history entry
export interface ProgressHistoryEntry {
    date: string;
    value: number;
    percentage: number;
}
