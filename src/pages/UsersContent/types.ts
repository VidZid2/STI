/**
 * UsersContent Types
 * TypeScript type definitions for the users content component
 */

import type {
    UserAccount,
    UserStats,
    UserFilter,
    UserRole,
    TeacherCourse,
    OfficeHours,
    UserSortOption,
} from '../../services/usersService';

// Re-export for convenience
export type {
    UserAccount,
    UserStats,
    UserFilter,
    UserRole,
    TeacherCourse,
    OfficeHours,
    UserSortOption,
};

// Component props
export interface UsersContentProps {
    onUserSelect?: (userId: string) => void;
}

// View mode
export type UserViewMode = 'grid' | 'list';

// User card state
export interface UserCardState {
    isExpanded: boolean;
    showDetails: boolean;
    isLoading: boolean;
}

// Stats display
export interface UserStatsDisplay {
    totalUsers: number;
    activeUsers: number;
    teachers: number;
    students: number;
}

// Search state
export interface UserSearchState {
    query: string;
    filter: UserFilter;
    sortBy: UserSortOption;
    isSearching: boolean;
}
