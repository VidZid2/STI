/**
 * TeacherDashboard Hooks Index
 * Phase 2, 3 & 4: Barrel exports for all custom hooks
 */

// Main dashboard hook
export { useTeacherDashboard, default } from './useTeacherDashboard';

// Keyboard navigation (Phase 3B)
export { 
    useKeyboardNavigation, 
    useModalKeyboard, 
    useFocusTrap 
} from './useKeyboardNavigation';

// Responsive design hook
export { useResponsive } from './useResponsive';

// Phase 4: Theme detection
export { useThemeDetection } from './useThemeDetection';

// Phase 4: Dashboard data (Supabase queries + notifications)
export { useDashboardData } from './useDashboardData';

// Re-export existing hooks
// useGradingData removed (Phase 17) — was dead code, queried non-existent grading_tasks table
