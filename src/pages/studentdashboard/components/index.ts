/**
 * Components Module
 * Re-exports all dashboard components
 */

// Notification components
export { NotificationIcon } from './NotificationIcon';
export { NotificationItem } from './NotificationItem';
export { SmallTypeIcon } from './SmallTypeIcon';
export { GroupedNotification } from './GroupedNotification';
export { DailyInspirationToast, triggerGlobalToast } from './DailyInspirationToast';

// Widget components
export { StreakWidget } from './StreakWidget';

// Dashboard UI components
export { default as DashboardIntro } from './DashboardIntro';
export { default as DashboardTutorial } from './DashboardTutorial';

// Phase 1.4: Extracted layout components
export { default as DashboardHeader } from './DashboardHeader';
export { default as DashboardSidebar } from './DashboardSidebar';
