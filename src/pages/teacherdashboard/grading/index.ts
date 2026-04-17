/**
 * GradeSubmissionsModal - Grading Module Barrel Export
 * Phase 1E: Central export point for all grading-related modules
 */

// Constants
export {
    GRADING_COLORS,
    GRADING_SPACING,
    GRADING_RADIUS,
    GRADING_FONT_SIZE,
    GRADING_FONT_WEIGHT,
    GRADE_COLORS,
    GRADE_LABELS,
    QUICK_SCORES,
    KEYBOARD_SHORTCUTS,
    AI_FEEDBACK_SUGGESTIONS,
    STATUS_CONFIG,
    SIMILARITY_THRESHOLDS,
    MODAL_DIMENSIONS,
} from './constants';

// Types
export type {
    TaskType,
    Task,
    SubmissionStatus,
    Attachment,
    GradeHistory,
    Submission,
    Course,
    RubricCriteria,
    DraftGrade,
    ViewMode,
    FilterStatus,
    SortOption,
    GradeSubmissionsModalProps,
    SubmissionCardProps,
    GradingPanelProps,
    StatsBarProps,
    FilePreviewPanelProps,
    GradeHistoryPanelProps,
    GradingTimerProps,
    BatchGradeModalProps,
    CustomDropdownProps,
    DropdownOption,
    GradingStats,
    GradeDistribution,
    OutlierType,
    OutlierIndicator,
    BatchAIProgress,
    KeyboardShortcut,
} from './types';

// Mock Data — DEMO_RUBRIC intentionally not re-exported.
// RubricSection now uses task.rubric directly; no demo fallback in production.

// Utilities
export {
    formatDate,
    formatTime,
    formatSeconds,
    getStatusColor,
    getStatusLabel,
    getSimilarityColor,
    hasSimilarityWarning,
    getScoreColor,
    calculatePercentage,
    getLetterGrade,
    getAIFeedbackSuggestion,
    getSmartPriority,
    getOutlierIndicator,
    getTaskTypeLabel,
    getStudentInitials,
    isPdfFile,
    isDocFile,
    getFileCategory,
} from './utils';
