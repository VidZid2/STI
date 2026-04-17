/**
 * GradeSubmissionsModal Utilities
 * Phase 1D: Extracted utility functions
 */

import { STATUS_CONFIG, SIMILARITY_THRESHOLDS, AI_FEEDBACK_SUGGESTIONS } from './constants';
import type { SubmissionStatus, Submission, Task, OutlierIndicator, OutlierType } from './types';

// ============================================
// DATE & TIME FORMATTING
// ============================================

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/**
 * Format a date string to time only
 */
export function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Format seconds to MM:SS or HH:MM:SS format
 */
export function formatSeconds(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// ============================================
// STATUS HELPERS
// ============================================

/**
 * Get the color for a submission status
 */
export function getStatusColor(status: SubmissionStatus): string {
    return STATUS_CONFIG[status]?.color || 'var(--text-secondary)';
}

/**
 * Get the display label for a submission status
 */
export function getStatusLabel(status: SubmissionStatus): string {
    return STATUS_CONFIG[status]?.label || 'Unknown';
}

// ============================================
// SIMILARITY HELPERS
// ============================================

/**
 * Get color based on similarity score
 */
export function getSimilarityColor(score: number): string {
    if (score >= SIMILARITY_THRESHOLDS.high) return 'var(--color-danger)'; // danger
    if (score >= SIMILARITY_THRESHOLDS.medium) return 'var(--color-warning)'; // warning
    if (score >= SIMILARITY_THRESHOLDS.low) return '#f97316'; // orange
    return 'var(--color-success)'; // success
}

/**
 * Check if similarity score warrants a warning
 */
export function hasSimilarityWarning(score: number | undefined): boolean {
    return score !== undefined && score > SIMILARITY_THRESHOLDS.medium;
}

// ============================================
// SCORE HELPERS
// ============================================

/**
 * Get color based on score percentage
 */
export function getScoreColor(score: number, maxPoints: number): string {
    const percent = (score / maxPoints) * 100;
    if (percent >= 90) return 'var(--color-success)'; // A
    if (percent >= 80) return '#3b82f6'; // B
    if (percent >= 70) return 'var(--color-warning)'; // C
    if (percent >= 60) return '#f97316'; // D
    return 'var(--color-danger)'; // F
}

/**
 * Calculate percentage from score and max points
 */
export function calculatePercentage(score: number, maxPoints: number): number {
    if (maxPoints === 0) return 0;
    return Math.round((score / maxPoints) * 100);
}

/**
 * Get letter grade from percentage
 */
export function getLetterGrade(percent: number): string {
    if (percent >= 90) return 'A';
    if (percent >= 80) return 'B';
    if (percent >= 70) return 'C';
    if (percent >= 60) return 'D';
    return 'F';
}

// ============================================
// AI FEEDBACK HELPERS
// ============================================

/**
 * Get AI feedback suggestion based on score percentage
 */
export function getAIFeedbackSuggestion(score: number, maxPoints?: number): string {
    // Calculate percentage - if maxPoints not provided, assume score is already a percentage
    const scorePercent = maxPoints ? (score / maxPoints) * 100 : score;
    const categories = AI_FEEDBACK_SUGGESTIONS;
    
    if (scorePercent >= categories.excellent.range[0]) {
        const suggestions = categories.excellent.suggestions;
        return suggestions[Math.floor(Math.random() * suggestions.length)];
    }
    if (scorePercent >= categories.good.range[0]) {
        const suggestions = categories.good.suggestions;
        return suggestions[Math.floor(Math.random() * suggestions.length)];
    }
    if (scorePercent >= categories.satisfactory.range[0]) {
        const suggestions = categories.satisfactory.suggestions;
        return suggestions[Math.floor(Math.random() * suggestions.length)];
    }
    const suggestions = categories.needsWork.suggestions;
    return suggestions[Math.floor(Math.random() * suggestions.length)];
}

// ============================================
// SMART PRIORITY SORTING
// ============================================

/**
 * Calculate smart priority score for sorting submissions
 * Higher score = higher priority (should be graded first)
 */
export function getSmartPriority(submission: Submission, _task?: Task | undefined): number {
    let priority = 0;
    
    // Ungraded submissions get highest base priority
    if (submission.status !== 'graded') {
        priority += 100;
    }
    
    // Late submissions need attention
    if (submission.is_late) {
        priority += 50;
    }
    
    // Flagged submissions are important
    if (submission.is_flagged) {
        priority += 40;
    }
    
    // High similarity score needs review
    if (submission.similarity_score && submission.similarity_score > SIMILARITY_THRESHOLDS.medium) {
        priority += 30;
    }
    
    // Resubmissions should be reviewed
    if (submission.status === 'resubmitted') {
        priority += 25;
    }
    
    // Earlier submissions get slight priority (FIFO)
    const submittedTime = new Date(submission.submitted_at).getTime();
    const now = Date.now();
    const daysSinceSubmission = (now - submittedTime) / (1000 * 60 * 60 * 24);
    priority += Math.min(daysSinceSubmission * 2, 20); // Max 20 points for age
    
    return priority;
}

// ============================================
// OUTLIER DETECTION
// ============================================

/**
 * Detect if a submission is an outlier and return indicator info
 */
export function getOutlierIndicator(
    score: number | undefined,
    maxPoints: number,
    similarityScore: number | undefined,
    isLate: boolean,
    _attachmentCount: number
): OutlierIndicator | null {
    // Check for plagiarism concern
    if (similarityScore && similarityScore >= SIMILARITY_THRESHOLDS.high) {
        return {
            type: 'plagiarism' as OutlierType,
            reason: `High similarity score: ${similarityScore}%`,
        };
    }
    
    // Check for exceptional performance
    if (score !== undefined && maxPoints > 0) {
        const percent = (score / maxPoints) * 100;
        if (percent >= 95) {
            return {
                type: 'exceptional' as OutlierType,
                reason: `Exceptional score: ${percent.toFixed(0)}%`,
            };
        }
        if (percent < 50) {
            return {
                type: 'struggling' as OutlierType,
                reason: `Low score: ${percent.toFixed(0)}%`,
            };
        }
    }
    
    // Check for late submission
    if (isLate) {
        return {
            type: 'late' as OutlierType,
            reason: 'Submitted after deadline',
        };
    }
    
    return null;
}

// ============================================
// TASK HELPERS
// ============================================

/**
 * Get display label for task type
 */
export function getTaskTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        assignment: 'Assignment',
        quiz: 'Quiz',
        performance: 'Performance',
        journal: 'Journal',
        other: 'Other',
    };
    return labels[type] || 'Task';
}

// ============================================
// STUDENT HELPERS
// ============================================

/**
 * Get initials from student name
 */
export function getStudentInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

// ============================================
// FILE HELPERS
// ============================================

/**
 * Check if file is a PDF
 */
export function isPdfFile(type: string): boolean {
    return type.toLowerCase().includes('pdf');
}

/**
 * Check if file is a Word document
 */
export function isDocFile(type: string): boolean {
    return type.toLowerCase().includes('doc');
}

/**
 * Get file category for icon selection
 */
export function getFileCategory(type: string): 'pdf' | 'doc' | 'image' | 'spreadsheet' | 'other' {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('pdf')) return 'pdf';
    if (lowerType.includes('doc')) return 'doc';
    if (lowerType.includes('image') || lowerType.includes('png') || lowerType.includes('jpg')) return 'image';
    if (lowerType.includes('xls') || lowerType.includes('sheet')) return 'spreadsheet';
    return 'other';
}
