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
    status: 'pending' | 'submitted' | 'graded' | 'late' | 'resubmitted' | 'ai-checked';
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
 * Fetch all tasks for grading (published tasks with submissions).
 *
 * Phase 9.2 — Data-level access control:
 * If teacherId is provided, only returns tasks for courses the teacher is
 * assigned to (via the `course_enrollments` table with role='teacher').
 * Falls back to all published tasks when teacherId is absent (demo/admin mode).
 */
export const fetchTasksForGrading = async (courseId?: string, teacherId?: string): Promise<Task[]> => {
    if (!isSupabaseConfigured() || !supabase) {
        return [];
    }

    try {
        // Resolve the set of course IDs this teacher is allowed to see
        let allowedCourseIds: string[] | null = null;

        if (teacherId) {
            const { data: enrollments } = await supabase
                .from('course_enrollments')
                .select('course_id')
                .eq('user_id', teacherId)
                .eq('role', 'teacher');

            if (enrollments && enrollments.length > 0) {
                allowedCourseIds = enrollments.map((e: { course_id: string }) => e.course_id);
            } else {
                // Teacher has no assigned courses — return empty rather than all
                return [];
            }
        }

        let query = supabase
            .from('course_tasks')
            .select('id, course_id, type, title, description, due_date, points, status')
            .eq('status', 'published')
            .order('due_date', { ascending: false });

        // Scope to a specific course if requested
        if (courseId && courseId !== 'all') {
            query = query.eq('course_id', courseId);
        } else if (allowedCourseIds) {
            // Scope to teacher's assigned courses
            query = query.in('course_id', allowedCourseIds);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
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
        throw new Error(`[GradingService] Failed to fetch tasks: ${err}`);
    }
};

/**
 * Fetch submissions for a specific task
 */
export const fetchSubmissionsForTask = async (taskId: string): Promise<Submission[]> => {
    if (!isSupabaseConfigured() || !supabase) {
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('student_submissions')
            .select('id, task_id, student_id, student_name, section, text_content, attachments, status, score, feedback, submitted_at, graded_at, graded_by, is_late, is_flagged, similarity_score, rubric_scores, grade_history')
            .eq('task_id', taskId)
            .order('submitted_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(mapDbToSubmission);
    } catch (err) {
        throw new Error(`[GradingService] Failed to fetch submissions for task: ${err}`);
    }
};

/**
 * Fetch all submissions across all tasks (for a course or all courses).
 *
 * Phase 9.2 — Data-level access control:
 * If teacherId is provided, submissions are scoped to tasks belonging to
 * courses the teacher is assigned to. Never returns submissions outside
 * the teacher's scope.
 */
export const fetchAllSubmissions = async (courseId?: string, teacherId?: string): Promise<Submission[]> => {
    if (!isSupabaseConfigured() || !supabase) {
        return [];
    }

    try {
        // Resolve allowed task IDs based on teacher scope
        let taskIds: string[] = [];

        if (courseId && courseId !== 'all') {
            // Specific course requested — verify teacher has access if teacherId given
            if (teacherId) {
                const { data: enrollment } = await supabase
                    .from('course_enrollments')
                    .select('course_id')
                    .eq('user_id', teacherId)
                    .eq('course_id', courseId)
                    .eq('role', 'teacher')
                    .maybeSingle();

                if (!enrollment) return []; // Teacher not assigned to this course
            }

            const { data: tasks } = await supabase
                .from('course_tasks')
                .select('id')
                .eq('course_id', courseId);

            taskIds = (tasks || []).map((t: { id: string }) => t.id);
            if (taskIds.length === 0) return [];

        } else if (teacherId) {
            // All courses — scope to teacher's assigned courses
            const { data: enrollments } = await supabase
                .from('course_enrollments')
                .select('course_id')
                .eq('user_id', teacherId)
                .eq('role', 'teacher');

            const assignedCourseIds = (enrollments || []).map((e: { course_id: string }) => e.course_id);
            if (assignedCourseIds.length === 0) return [];

            const { data: tasks } = await supabase
                .from('course_tasks')
                .select('id')
                .in('course_id', assignedCourseIds);

            taskIds = (tasks || []).map((t: { id: string }) => t.id);
            if (taskIds.length === 0) return [];
        }

        let query = supabase
            .from('student_submissions')
            .select('id, task_id, student_id, student_name, section, text_content, attachments, status, score, feedback, submitted_at, graded_at, graded_by, is_late, is_flagged, similarity_score, rubric_scores, grade_history')
            .order('submitted_at', { ascending: false });

        if (taskIds.length > 0) {
            query = query.in('task_id', taskIds);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return (data || []).map(mapDbToSubmission);
    } catch (err) {
        throw new Error(`[GradingService] Failed to fetch submissions: ${err}`);
    }
};

// ============================================
// Grade Operations
// ============================================

/**
 * Grade a single submission.
 *
 * Phase 9.3 — gradedBy must be the authenticated user's real ID.
 */
export const gradeSubmission = async (input: GradeInput): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) {
        return false;
    }

    try {
        // Get current submission to preserve grade history
        const { data: current } = await supabase
            .from('student_submissions')
            .select('score, feedback, graded_at, grade_history, graded_by')
            .eq('id', input.submissionId)
            .single();

        // Build grade history — always preserve previous grade if one exists
        const gradeHistory: GradeHistory[] = current?.grade_history || [];
        if (current?.score !== null && current?.graded_at) {
            gradeHistory.push({
                score: current.score,
                feedback: current.feedback || '',
                graded_at: current.graded_at,
                graded_by: current.graded_by || 'unknown',
                version: gradeHistory.length + 1,
            });
        }

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

        if (error) throw error;

        return true;
    } catch (err) {
        throw new Error(`[GradingService] Failed to grade submission: ${err}`);
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
        try {
            await gradeSubmission({ submissionId: id, score, feedback, gradedBy });
            success++;
        } catch {
            failed++;
        }
    }

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
        const { data: current } = await supabase
            .from('student_submissions')
            .select('is_flagged')
            .eq('id', submissionId)
            .single();

        const { error } = await supabase
            .from('student_submissions')
            .update({ is_flagged: !(current?.is_flagged || false) })
            .eq('id', submissionId);

        if (error) throw error;

        return true;
    } catch (err) {
        throw new Error(`[GradingService] Failed to toggle flag: ${err}`);
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
    } catch {
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
