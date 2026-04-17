/**
 * Student Dashboard Type Definitions
 * Created during Phase 0: Baseline & Safety Verification
 * 
 * Purpose: Ensure type safety for routing and prevent string literal bugs
 * during component extraction phases.
 */

/**
 * Valid view types for the Student Dashboard
 * These correspond to the main navigation tabs and content areas
 */
export type DashboardView = 
  | 'home'      // Dashboard overview with widgets
  | 'tools'     // Academic tools (grammar checker, plagiarism, etc.)
  | 'course'    // Individual course view (requires selectedCourse)
  | 'paths'     // Learning paths and course recommendations
  | 'goals'     // Goal tracking and progress
  | 'users'     // User management
  | 'catalog'   // Course catalog browser
  | 'groups';   // Group collaboration and chat

/**
 * Type guard to check if a string is a valid DashboardView
 */
export function isDashboardView(value: string): value is DashboardView {
  return [
    'home',
    'tools',
    'course',
    'paths',
    'goals',
    'users',
    'catalog',
    'groups'
  ].includes(value);
}

/**
 * Course interface for sidebar navigation and course view
 * Matches the structure used in getSidebarCoursesWithProgress()
 */
export interface DashboardCourse {
  id: string;
  title: string;
  progress: number;
  color: string;
  // Add other course properties as needed during extraction
}
