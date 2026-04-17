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
export { default as ModalBackdrop } from './ModalBackdrop';
export { default as ModalCloseButton } from './ModalCloseButton';
export { default as ModalSearchInput } from './ModalSearchInput';
export { default as ModalContainer } from './ModalContainer';

// Export notification types./_deprecated/TeacherDashboardTutorial
export type { DashboardNotification, NotificationType } from './DashboardHeader';
export type { ResponsiveModalProps } from './ResponsiveModal';

// Panels
export * from './WelcomeBanner';
export * from './SchedulePanel';
export * from './UrgentTasksPanel';
export * from './QuickActionsPanel';
export * from './AtRiskPanel';
export * from './ActivityPanel';

export type { ScheduleItem } from './SchedulePanel';
export type { TaskItem } from './UrgentTasksPanel';
export type { AtRiskStudentData } from './AtRiskPanel';
