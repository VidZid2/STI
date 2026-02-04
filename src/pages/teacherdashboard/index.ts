/**
 * TeacherDashboard Module Exports
 * Clean barrel exports for the Teacher Dashboard feature
 * 
 * Phase 1: Constants, Types, Icons
 * Phase 2: Components, Hooks
 * Phase 3: Styles, Keyboard Navigation, Teacher Service
 * Phase 4: Accessibility, Input Scores Modal, Documentation
 */

// ============================================
// MAIN COMPONENT
// ============================================
export { default } from './TeacherDashboard';
export { default as TeacherDashboard } from './TeacherDashboard';

// ============================================
// MODAL COMPONENTS
// ============================================
export { default as CreateAssignmentModal } from './CreateAssignmentModal';
export { default as StudentListModal } from './StudentListModal';
export { default as GradeSubmissionsModal } from './GradeSubmissionsModal';
export { default as InputScoresModal } from './InputScoresModal';

// ============================================
// UI COMPONENTS (Phase 2)
// ============================================
export { 
    DashboardSkeleton,
    StatCard,
    QuickActionButton,
    ErrorDisplay,
    ActivityItem,
    DashboardHeader,
    ComingSoonModal,
} from './components';

// ============================================
// HOOKS (Phase 2 & 3)
// ============================================
export { 
    useTeacherDashboard,
    useKeyboardNavigation,
    useModalKeyboard,
    useFocusTrap,
} from './hooks';

// ============================================
// UTILITIES (Phase 4A)
// ============================================
export {
    // Color contrast
    getLuminance,
    getContrastRatio,
    meetsContrastAA,
    meetsContrastAAA,
    // ARIA helpers
    getLiveRegionProps,
    getButtonAriaProps,
    getModalAriaProps,
    getListAriaProps,
    getListItemAriaProps,
    // Screen reader
    initAnnouncer,
    announce,
    announceLoading,
    announceError,
    announceSuccess,
    // Focus management
    getFocusableElements,
    focusFirst,
    focusLast,
    createFocusManager,
    // Motion
    prefersReducedMotion,
    getAnimationDuration,
} from './utils';

// ============================================
// TYPES
// ============================================
export type { 
    TeacherStats, 
    TeacherUser, 
    StatCardProps, 
    QuickActionButtonProps,
    ActivityItemProps,
    DashboardState,
    ModalState,
} from './types';

// ============================================
// CONSTANTS
// ============================================
export { 
    COLORS, 
    SPACING, 
    BORDER_RADIUS, 
    FONT_SIZE, 
    FONT_WEIGHT,
    ANIMATION,
    RECENT_ACTIVITY,
    QUICK_ACTIONS,
    STAT_DEFINITIONS,
} from './constants';

// ============================================
// STYLES (Phase 3A)
// ============================================
export {
    LAYOUT,
    CARD,
    BUTTON,
    ICON_CONTAINER,
    TEXT,
    HEADER,
    BANNER,
    ACTIVITY,
    SKELETON,
    getColorClasses,
    cn,
} from './styles';

// ============================================
// ICONS
// ============================================
export * from './icons';
