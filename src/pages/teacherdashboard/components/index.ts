/**
 * TeacherDashboard Components Index
 * Phase 2: Barrel exports for all extracted components
 */

export { default as DashboardSkeleton } from './DashboardSkeleton';
export { default as StatCard } from './StatCard';
export { default as QuickActionButton } from './QuickActionButton';
export { default as ErrorDisplay } from './ErrorDisplay';
export { default as ActivityItem } from './ActivityItem';
export { default as DashboardHeader } from './DashboardHeader';
export { default as ComingSoonModal } from './ComingSoonModal';
export { ResponsiveModal, useResponsiveModalStyles } from './ResponsiveModal';
export { default as TeacherDashboardIntro } from './DashboardIntro';
export { default as TeacherDashboardTutorial } from './TeacherDashboardTutorial';

// Export notification types
export type { DashboardNotification, NotificationType } from './DashboardHeader';
export type { ResponsiveModalProps } from './ResponsiveModal';
