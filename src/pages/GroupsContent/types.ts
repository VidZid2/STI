/**
 * GroupsContent Types
 * TypeScript type definitions for the groups content component
 */

import type {
    GroupWithMembers,
    GroupStats,
    GroupFilter,
    GroupSortOption,
    GroupCategory,
} from '../../services/groupsService';

// Re-export for convenience
export type {
    GroupWithMembers,
    GroupStats,
    GroupFilter,
    GroupSortOption,
    GroupCategory,
};

// Component props
export interface GroupsContentProps {
    onGroupSelect?: (groupId: string) => void;
}

// View mode
export type GroupViewMode = 'grid' | 'list';

// Group card state
export interface GroupCardState {
    isExpanded: boolean;
    isJoining: boolean;
    showMembers: boolean;
}

// Stats display
export interface GroupStatsDisplay {
    totalGroups: number;
    myGroups: number;
    totalMembers: number;
    activeNow: number;
}

// Create group form data
export interface CreateGroupFormData {
    name: string;
    description: string;
    category: GroupCategory;
    isPrivate: boolean;
    maxMembers: number;
    courseId?: string;
}

// Member display
export interface GroupMemberDisplay {
    id: string;
    name: string;
    avatar: string;
    role: 'admin' | 'moderator' | 'member';
    isOnline: boolean;
    lastActive: string;
}

// Search state
export interface GroupSearchState {
    query: string;
    filter: GroupFilter;
    sortBy: GroupSortOption;
    category: GroupCategory | 'all';
}

// Skeleton colors for dark/light mode
export interface SkeletonColors {
    cardBg: string;
    border: string;
    skeleton: string;
    shimmer: string;
}
