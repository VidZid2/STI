/**
 * GradeSubmissionsModal Constants
 * Phase 1A: Extracted design tokens and configuration
 */

// ============================================
// COLORS
// ============================================
export const GRADING_COLORS = {
    // Primary colors
    primary: '#3b82f6',
    primaryLight: 'rgba(59, 130, 246, 0.1)',
    primaryBorder: 'rgba(59, 130, 246, 0.2)',

    // Status colors
    success: 'var(--color-success)',
    successLight: 'rgba(16, 185, 129, 0.1)',
    successBorder: 'rgba(16, 185, 129, 0.2)',

    warning: 'var(--color-warning)',
    warningLight: 'rgba(245, 158, 11, 0.1)',
    warningBorder: 'rgba(245, 158, 11, 0.2)',

    danger: 'var(--color-danger)',
    dangerLight: 'rgba(239, 68, 68, 0.1)',
    dangerBorder: 'rgba(239, 68, 68, 0.2)',

    purple: 'var(--color-purple)',
    purpleLight: 'rgba(139, 92, 246, 0.1)',
    purpleBorder: 'rgba(139, 92, 246, 0.2)',

    orange: '#f97316',

    // Text colors
    textPrimary: 'var(--text-primary)',
    textSecondary: 'var(--text-secondary)',
    textMuted: 'var(--text-muted)',

    // Background colors
    background: 'var(--bg-canvas)',
    surface: 'var(--bg-surface)',

    // Border colors
    border: 'var(--border-subtle)',
    borderLight: 'rgba(0,0,0,0.04)',
    borderDark: 'rgba(0,0,0,0.1)',

    // Overlay
    overlay: 'rgba(15, 23, 42, 0.6)',
} as const;

// ============================================
// SPACING
// ============================================
export const GRADING_SPACING = {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '10px',
    xl: '12px',
    xxl: '16px',
    xxxl: '20px',
    xxxxl: '24px',
} as const;

// ============================================
// BORDER RADIUS
// ============================================
export const GRADING_RADIUS = {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '10px',
    xxl: '12px',
    xxxl: '16px',
    full: '20px',
} as const;

// ============================================
// FONT SIZES
// ============================================
export const GRADING_FONT_SIZE = {
    xs: '9px',
    sm: '10px',
    md: '11px',
    base: '12px',
    lg: '13px',
    xl: '14px',
    xxl: '16px',
    xxxl: '18px',
} as const;

// ============================================
// FONT WEIGHTS
// ============================================
export const GRADING_FONT_WEIGHT = {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
} as const;

// ============================================
// GRADE COLORS (for distribution chart)
// ============================================
export const GRADE_COLORS: Record<string, string> = {
    A: 'var(--color-success)',
    B: '#3b82f6',
    C: 'var(--color-warning)',
    D: '#f97316',
    F: 'var(--color-danger)',
};

// ============================================
// GRADE LABELS
// ============================================
export const GRADE_LABELS: Record<string, string> = {
    A: '90-100%',
    B: '80-89%',
    C: '70-79%',
    D: '60-69%',
    F: '<60%',
};

// ============================================
// QUICK SCORE PRESETS
// ============================================
export const QUICK_SCORES = [100, 95, 90, 85, 80, 75, 70, 65, 60, 50] as const;

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
export const KEYBOARD_SHORTCUTS = [
    { key: '↑/↓', action: 'Navigate' },
    { key: 'G', action: 'Grade input' },
    { key: 'F', action: 'Feedback' },
    { key: 'S', action: 'Save & next' },
    { key: 'R', action: 'Flag/Review' },
    { key: 'Esc', action: 'Close' },
] as const;

// ============================================
// AI FEEDBACK SUGGESTIONS
// ============================================
export const AI_FEEDBACK_SUGGESTIONS = {
    excellent: {
        range: [90, 100] as [number, number],
        suggestions: [
            'Outstanding work! Your submission demonstrates exceptional understanding and mastery of the concepts.',
            'Excellent job! You\'ve exceeded expectations with thorough and well-organized work.',
            'Impressive submission! Your attention to detail and quality is commendable.',
        ],
    },
    good: {
        range: [75, 89] as [number, number],
        suggestions: [
            'Good work! Your submission shows solid understanding with room for minor improvements.',
            'Well done! You\'ve demonstrated competency in the key areas.',
            'Nice job! Consider reviewing the feedback for areas to strengthen.',
        ],
    },
    satisfactory: {
        range: [60, 74] as [number, number],
        suggestions: [
            'Satisfactory work. Focus on the highlighted areas for improvement.',
            'You\'ve met the basic requirements. Review the rubric for areas to enhance.',
            'Acceptable submission. Consider the feedback to improve future work.',
        ],
    },
    needsWork: {
        range: [0, 59] as [number, number],
        suggestions: [
            'This submission needs significant improvement. Please review the requirements.',
            'Consider resubmitting after addressing the feedback provided.',
            'Review the course materials and rubric criteria for guidance.',
        ],
    },
} as const;

// ============================================
// STATUS CONFIGURATION
// ============================================
export const STATUS_CONFIG = {
    pending: {
        color: 'var(--text-muted)',
        label: 'Pending',
        bgColor: 'rgba(148, 163, 184, 0.1)',
    },
    submitted: {
        color: '#3b82f6',
        label: 'Submitted',
        bgColor: 'rgba(59, 130, 246, 0.1)',
    },
    graded: {
        color: 'var(--color-success)',
        label: 'Graded',
        bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    late: {
        color: 'var(--color-danger)',
        label: 'Late',
        bgColor: 'rgba(239, 68, 68, 0.1)',
    },
    resubmitted: {
        color: 'var(--color-purple)',
        label: 'Resubmitted',
        bgColor: 'rgba(139, 92, 246, 0.1)',
    },
    'ai-checked': {
        color: '#fbbf24',
        label: 'AI Checked',
        bgColor: 'rgba(251, 191, 36, 0.1)',
    },
} as const;

// ============================================
// SIMILARITY THRESHOLDS
// ============================================
export const SIMILARITY_THRESHOLDS = {
    low: 15,
    medium: 30,
    high: 50,
} as const;

// ============================================
// MODAL DIMENSIONS
// ============================================
export const MODAL_DIMENSIONS = {
    maxWidth: '1400px',
    maxHeight: '90vh',
    minHeight: '600px',
    sidebarWidth: '320px',
    headerHeight: '60px',
} as const;
