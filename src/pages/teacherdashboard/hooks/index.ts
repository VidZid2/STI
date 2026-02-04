/**
 * TeacherDashboard Hooks Index
 * Phase 2 & 3: Barrel exports for all custom hooks
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

// Re-export existing hooks
export * from './useGradingData';
