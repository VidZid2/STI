/**
 * CatalogContent Types
 * TypeScript type definitions for the catalog content component
 */

import type {
    CatalogCourse,
    CatalogStats,
    CourseCategory,
    SortOption,
} from '../../services/catalogService';

// Re-export types from catalogService for convenience
export type {
    CatalogCourse,
    CatalogStats,
    CourseCategory,
    SortOption,
};

// Component-specific types
export interface AnimatedNumberProps {
    value: number;
    delay?: number;
    className?: string;
}

export interface CategoryIconProps {
    category: string;
    size?: number;
}

export interface CourseCardProps {
    course: CatalogCourse;
    isDarkMode: boolean;
    onEnroll: (courseId: string) => void;
    onBookmark: (courseId: string) => void;
    onView: (course: CatalogCourse) => void;
    isBookmarked: boolean;
}

export interface CourseDetailModalProps {
    course: CatalogCourse | null;
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
    onEnroll: (courseId: string) => void;
    onBookmark: (courseId: string) => void;
    isBookmarked: boolean;
}

export interface FilterState {
    category: CourseCategory | 'all';
    sortBy: SortOption;
    searchQuery: string;
}
