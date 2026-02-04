/**
 * Grading Service - Handles teacher grading operations with Supabase
 * 
 * Phase 1: Basic CRUD operations for submissions and grading
 * - Fetch submissions by course/task
 * - Grade submissions (save score + feedback)
 * - Update submission status
 * 
 * Uses existing tables: course_tasks, student_submissions
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ============================================
// Types
// ============================================

export interface Submission {
    id: string;
    task_id: string;
    student_id: string;
    student_name: string;
    section: string;
    text_content?: string;
    attachments: SubmissionAttachment[];
    status: 'pending' | 'submitted' | 'graded' | 'late' | 'resubmitted';
    score: number | null;
    feedback: string | null;
    submitted_at: string;
    graded_at: string | null;
    graded_by: string | null;
    is_late?: boolean;
    is_flagged?: boolean;
    similarity_score?: number;
    rubric_scores?: Record<string, number>;
    grade_history?: GradeHistory[];
}

export interface SubmissionAttachment {
    name: string;
    url: string;
    type: string;
    size?: number;
}

export interface GradeHistory {
    score: number;
    feedback: string;
    graded_at: string;
    graded_by: string;
    version: number;
}

export interface Task {
    id: string;
    course_id: string;
    type: 'assignment' | 'performance' | 'quiz' | 'practical' | 'journal';
    title: string;
    description: string;
    due_date: string;
    points: number;
    status: string;
}

export interface GradeInput {
    submissionId: string;
    score: number;
    feedback: string;
    gradedBy: string;
    rubricScores?: Record<string, number>;
}

// ============================================
// Fetch Operations
// ============================================

/**
 * Fetch all tasks for grading (published tasks with submissions)
 */
export const fetchTasksForGrading = async (courseId?: string): Promise<Task[]> => {
    if (!isSupabaseConfigured() || !supabase) {
        console.log('[GradingService] Supabase not configured, returning empty');
        return [];
    }

    try {
        let query = supabase
            .from('course_tasks')
            .select('*')
            .eq('status', 'published')
            .order('due_date', { ascending: false });

        if (courseId && courseId !== 'all') {
            query = query.eq('course_id', courseId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[GradingService] Error fetching tasks:', error);
            return [];
        }

        return (data || []).map(row => ({
            id: row.id,
            course_id: row.course_id,
            type: row.type,
            title: row.title,
            description: row.description || '',
            due_date: row.due_date,
            points: row.points,
            status: row.status,
        }));
    } catch (err) {
        console.error('[GradingService] Failed to fetch tasks:', err);
        return [];
    }
};

/**
 * Fetch submissions for a specific task
 */
export const fetchSubmissionsForTask = async (taskId: string): Promise<Submission[]> => {
    if (!isSupabaseConfigured() || !supabase) {
        console.log('[GradingService] Supabase not configured');
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('student_submissions')
            .select('*')
            .eq('task_id', taskId)
            .order('submitted_at', { ascending: false });

        if (error) {
            console.error('[GradingService] Error fetching submissions:', error);
            return [];
        }

        return (data || []).map(mapDbToSubmission);
    } catch (err) {
        console.error('[GradingService] Failed to fetch submissions:', err);
        return [];
    }
};

/**
 * Fetch all submissions across all tasks (for a course or all courses)
 */
export const fetchAllSubmissions = async (courseId?: string): Promise<Submission[]> => {
    if (!isSupabaseConfigured() || !supabase) {
        console.log('[GradingService] Supabase not configured');
        return [];
    }

    try {
        // First get task IDs for the course if specified
        let taskIds: string[] = [];

        if (courseId && courseId !== 'all') {
            const { data: tasks } = await supabase
                .from('course_tasks')
                .select('id')
                .eq('course_id', courseId);

            taskIds = (tasks || []).map(t => t.id);

            if (taskIds.length === 0) {
                return [];
            }
        }

        // Fetch submissions
        let query = supabase
            .from('student_submissions')
            .select('*')
            .order('submitted_at', { ascending: false });

        if (taskIds.length > 0) {
            query = query.in('task_id', taskIds);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[GradingService] Error fetching submissions:', error);
            return [];
        }

        return (data || []).map(mapDbToSubmission);
    } catch (err) {
        console.error('[GradingService] Failed to fetch submissions:', err);
        return [];
    }
};

// ============================================
// Grade Operations
// ============================================

/**
 * Grade a single submission
 */
export const gradeSubmission = async (input: GradeInput): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) {
        console.error('[GradingService] Supabase not configured');
        return false;
    }

    try {
        // First, get the current submission to preserve grade history
        const { data: current } = await supabase
            .from('student_submissions')
            .select('score, feedback, graded_at, grade_history, graded_by')
            .eq('id', input.submissionId)
            .single();

        // Build grade history
        let gradeHistory: GradeHistory[] = current?.grade_history || [];
        if (current?.score !== null && current?.graded_at) {
            gradeHistory.push({
                score: current.score,
                feedback: current.feedback || '',
                graded_at: current.graded_at,
                graded_by: current.graded_by || 'unknown',
                version: gradeHistory.length + 1,
            });
        }

        // Update the submission
        const { error } = await supabase
            .from('student_submissions')
            .update({
                score: input.score,
                feedback: input.feedback,
                status: 'graded',
                graded_at: new Date().toISOString(),
                graded_by: input.gradedBy,
                rubric_scores: input.rubricScores || null,
                grade_history: gradeHistory.length > 0 ? gradeHistory : null,
            })
            .eq('id', input.submissionId);

        if (error) {
            console.error('[GradingService] Error grading submission:', error);
            return false;
        }

        console.log(`[GradingService] Graded submission ${input.submissionId}: ${input.score} points`);
        return true;
    } catch (err) {
        console.error('[GradingService] Failed to grade submission:', err);
        return false;
    }
};

/**
 * Batch grade multiple submissions with the same score/feedback
 */
export const batchGradeSubmissions = async (
    submissionIds: string[],
    score: number,
    feedback: string,
    gradedBy: string
): Promise<{ success: number; failed: number }> => {
    let success = 0;
    let failed = 0;

    for (const id of submissionIds) {
        const result = await gradeSubmission({
            submissionId: id,
            score,
            feedback,
            gradedBy,
        });

        if (result) {
            success++;
        } else {
            failed++;
        }
    }

    console.log(`[GradingService] Batch graded: ${success} success, ${failed} failed`);
    return { success, failed };
};

/**
 * Toggle flag status on a submission
 */
export const toggleSubmissionFlag = async (submissionId: string): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) {
        return false;
    }

    try {
        // Get current flag status
        const { data: current } = await supabase
            .from('student_submissions')
            .select('is_flagged')
            .eq('id', submissionId)
            .single();

        const newFlagStatus = !(current?.is_flagged || false);

        const { error } = await supabase
            .from('student_submissions')
            .update({ is_flagged: newFlagStatus })
            .eq('id', submissionId);

        if (error) {
            console.error('[GradingService] Error toggling flag:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('[GradingService] Failed to toggle flag:', err);
        return false;
    }
};

// ============================================
// Statistics
// ============================================

/**
 * Get grading statistics for a task
 */
export const getTaskGradingStats = async (taskId: string): Promise<{
    total: number;
    graded: number;
    pending: number;
    late: number;
    average: number;
    highest: number;
    lowest: number;
}> => {
    if (!isSupabaseConfigured() || !supabase) {
        return { total: 0, graded: 0, pending: 0, late: 0, average: 0, highest: 0, lowest: 0 };
    }

    try {
        const { data, error } = await supabase
            .from('student_submissions')
            .select('status, score, is_late')
            .eq('task_id', taskId);

        if (error || !data) {
            return { total: 0, graded: 0, pending: 0, late: 0, average: 0, highest: 0, lowest: 0 };
        }

        const total = data.length;
        const graded = data.filter(s => s.status === 'graded').length;
        const pending = data.filter(s => s.status !== 'graded').length;
        const late = data.filter(s => s.is_late || s.status === 'late').length;

        const scores = data.filter(s => s.score !== null).map(s => s.score as number);
        const average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const highest = scores.length > 0 ? Math.max(...scores) : 0;
        const lowest = scores.length > 0 ? Math.min(...scores) : 0;

        return { total, graded, pending, late, average, highest, lowest };
    } catch (err) {
        console.error('[GradingService] Failed to get stats:', err);
        return { total: 0, graded: 0, pending: 0, late: 0, average: 0, highest: 0, lowest: 0 };
    }
};

// ============================================
// Helper Functions
// ============================================

/**
 * Map database row to Submission type
 */
const mapDbToSubmission = (row: Record<string, unknown>): Submission => {
    return {
        id: row.id as string,
        task_id: row.task_id as string,
        student_id: row.student_id as string,
        student_name: row.student_name as string,
        section: (row.section as string) || 'BSIT101A', // Default section
        text_content: row.text_content as string | undefined,
        attachments: (row.attachments as SubmissionAttachment[]) || [],
        status: mapStatus(row.status as string, row.is_late as boolean),
        score: row.score as number | null,
        feedback: row.feedback as string | null,
        submitted_at: row.submitted_at as string,
        graded_at: row.graded_at as string | null,
        graded_by: row.graded_by as string | null,
        is_late: row.is_late as boolean || false,
        is_flagged: row.is_flagged as boolean || false,
        similarity_score: row.similarity_score as number | undefined,
        rubric_scores: row.rubric_scores as Record<string, number> | undefined,
        grade_history: row.grade_history as GradeHistory[] | undefined,
    };
};

/**
 * Map status with late consideration
 */
const mapStatus = (status: string, isLate?: boolean): Submission['status'] => {
    if (isLate && status !== 'graded') {
        return 'late';
    }

    switch (status) {
        case 'pending':
        case 'submitted':
        case 'graded':
        case 'late':
        case 'resubmitted':
            return status;
        default:
            return 'submitted';
    }
};

// ============================================
// Export
// ============================================

export default {
    fetchTasksForGrading,
    fetchSubmissionsForTask,
    fetchAllSubmissions,
    gradeSubmission,
    batchGradeSubmissions,
    toggleSubmissionFlag,
    getTaskGradingStats,
};
