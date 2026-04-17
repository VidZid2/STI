/**
 * Teacher Service
 * Phase 3C: Service layer for teacher dashboard data operations
 * 
 * Provides:
 * - Stats fetching (students, courses, submissions, grades)
 * - Activity feed
 * - Course management
 * - Student management
 * - Assignment creation (including batch create)
 */

import { supabase } from '../lib/supabase';

// ============================================
// TYPES
// ============================================
export interface TeacherStats {
    totalStudents: number;
    totalCourses: number;
    pendingSubmissions: number;
    averageGrade: number;
}

export interface ActivityItem {
    id: string;
    action: string;
    student: string;
    course: string;
    time: string;
    timestamp: Date;
    type: 'submission' | 'deadline' | 'quiz' | 'enrollment' | 'grade';
    metadata?: Record<string, unknown>;
}

export interface TeacherCourse {
    id: string;
    title: string;
    shortTitle: string;
    studentCount: number;
    pendingSubmissions: number;
    averageGrade: number;
}

export interface StudentSummary {
    id: string;
    name: string;
    email: string;
    section: string;
    averageGrade: number;
    submissionCount: number;
    lastActive: Date;
}

export interface CreateAssignmentData {
    title: string;
    description: string;
    course: string;
    section: string;
    sections: string[]; // For batch create
    type: 'assignment' | 'quiz' | 'project' | 'exam' | 'journal' | 'performance' | 'practical';
    dueDate: string;
    dueTime: string;
    points: number;
    instructions: string;
    allowLateSubmission: boolean;
    latePenalty: number;
    maxAttempts: number;
    rubricEnabled: boolean;
    rubricCriteria: Array<{
        id: string;
        name: string;
        description: string;
        points: number;
        levels: Array<{ label: string; points: number; description: string }>;
    }>;
    notifyStudents: boolean;
    schedulePublish: boolean;
    publishDate: string;
    publishTime: string;
    prerequisiteEnabled: boolean;
    prerequisiteAssignment: string;
    saveAsTemplate: boolean;
    templateName: string;
}

// ============================================
// DEFAULT VALUES (zeros - no demo data)
// ============================================
const DEFAULT_STATS: TeacherStats = {
    totalStudents: 0,
    totalCourses: 0,
    pendingSubmissions: 0,
    averageGrade: 0,
};

// ============================================
// HELPER FUNCTIONS
// ============================================
const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Fetch teacher dashboard statistics from real database
 */
export const getTeacherStats = async (_teacherId?: string): Promise<TeacherStats> => {
    try {
        if (!supabase) return DEFAULT_STATS;

        const { count: studentCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'student')
            .eq('is_active', true);

        const { count: courseCount } = await supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

        const { count: pendingCount } = await supabase
            .from('student_submissions')
            .select('*', { count: 'exact', head: true })
            .in('status', ['pending', 'submitted']);

        const { data: gradedSubmissions } = await supabase
            .from('student_submissions')
            .select('score')
            .eq('status', 'graded')
            .not('score', 'is', null);

        let averageGrade = 0;
        if (gradedSubmissions && gradedSubmissions.length > 0) {
            const total = gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0);
            averageGrade = Math.round((total / gradedSubmissions.length) * 10) / 10;
        }

        return {
            totalStudents: studentCount || 0,
            totalCourses: courseCount || 0,
            pendingSubmissions: pendingCount || 0,
            averageGrade,
        };
    } catch {
        return DEFAULT_STATS;
    }
};

/**
 * Fetch recent activity feed from real database
 */
export const getRecentActivity = async (limit = 10): Promise<ActivityItem[]> => {
    try {
        if (!supabase) return [];

        const { data: submissions } = await supabase
            .from('student_submissions')
            .select('id, student_id, student_name, task_id, status, submitted_at, score')
            .order('submitted_at', { ascending: false })
            .limit(limit);

        if (!submissions || submissions.length === 0) return [];

        const taskIds = [...new Set(submissions.map(s => s.task_id))];
        const { data: tasks } = await supabase
            .from('course_tasks')
            .select('id, course_id, title')
            .in('id', taskIds);

        const taskMap = new Map(tasks?.map(t => [t.id, t]) || []);

        return submissions.map((sub, index) => {
            const task = taskMap.get(sub.task_id);
            let action = 'New submission';
            let type: ActivityItem['type'] = 'submission';

            if (sub.status === 'graded') { action = 'Submission graded'; type = 'grade'; }
            else if (sub.status === 'late') { action = 'Late submission'; }

            return {
                id: sub.id || String(index),
                action,
                student: sub.student_name || 'Unknown Student',
                course: task?.course_id?.toUpperCase() || 'Course',
                time: formatTimeAgo(new Date(sub.submitted_at)),
                timestamp: new Date(sub.submitted_at),
                type,
            };
        });
    } catch {
        return [];
    }
};

/**
 * Fetch teacher's courses with stats
 */
export const getTeacherCourses = async (_teacherId?: string): Promise<TeacherCourse[]> => {
    try {
        if (!supabase) return [];
        const { data: courses } = await supabase
            .from('courses').select('id, title, short_title').eq('is_active', true);
        return (courses || []).map(course => ({
            id: course.id, title: course.title, shortTitle: course.short_title,
            studentCount: 0, pendingSubmissions: 0, averageGrade: 0,
        }));
    } catch { return []; }
};

export const getCourseStudents = async (_courseId: string): Promise<StudentSummary[]> => {
    try {
        if (!supabase) return [];
        const { data: students } = await supabase
            .from('users').select('id, full_name, email, section')
            .eq('role', 'student').eq('is_active', true).limit(50);
        return (students || []).map(student => ({
            id: student.id, name: student.full_name, email: student.email,
            section: student.section || 'N/A', averageGrade: 0,
            submissionCount: 0, lastActive: new Date(),
        }));
    } catch { return []; }
};

export const getSubmissionStats = async () => {
    try {
        if (!supabase) return { total: 0, pending: 0, graded: 0, late: 0, gradingProgress: 0 };
        const { data, count } = await supabase
            .from('student_submissions').select('status, score', { count: 'exact' });
        if (!data) return { total: 0, pending: 0, graded: 0, late: 0, gradingProgress: 0 };
        const pending = data.filter(s => s.status === 'submitted' || s.status === 'pending').length;
        const graded = data.filter(s => s.status === 'graded').length;
        const late = data.filter(s => s.status === 'late').length;
        const total = count || data.length;
        return { total, pending, graded, late, gradingProgress: total > 0 ? Math.round((graded / total) * 100) : 0 };
    } catch { return { total: 0, pending: 0, graded: 0, late: 0, gradingProgress: 0 }; }
};

/**
 * Create assignment(s) - supports batch creation for multiple sections.
 * Phase 9.3 / 10: created_by uses the real authenticated teacher ID.
 */
export const createAssignment = async (
    data: CreateAssignmentData,
    teacherId?: string
): Promise<{ success: boolean; createdCount: number; errors: string[] }> => {
    try {
        if (!supabase) {
            return { success: false, createdCount: 0, errors: ['Database connection not available'] };
        }

        const errors: string[] = [];
        let createdCount = 0;

        const sectionsToCreate = data.sections.length > 0 ? data.sections : [data.section];
        const dueDateTime = new Date(`${data.dueDate}T${data.dueTime}`);

        const typeMapping: Record<string, string> = {
            'assignment': 'assignment',
            'quiz': 'quiz',
            'project': 'assignment',
            'exam': 'quiz',
            'journal': 'journal',
            'practical': 'practical',
            'performance': 'performance',
        };

        for (const section of sectionsToCreate) {
            const assignmentId = `task-${data.course}-${section}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const taskData = {
                id: assignmentId,
                course_id: data.course,
                section,
                type: typeMapping[data.type] || 'assignment',
                title: data.title,
                description: data.description,
                instructions: data.instructions,
                due_date: dueDateTime.toISOString(),
                points: data.points,
                attachments: [],
                status: data.schedulePublish && data.publishDate ? 'draft' : 'published',
                created_by: teacherId || null, // Phase 9.3: real teacher ID, never 'teacher' string
                allow_late_submission: data.allowLateSubmission,
                late_penalty: data.latePenalty || 0,
                max_attempts: data.maxAttempts || 1,
                rubric_enabled: data.rubricEnabled,
                rubric_criteria: data.rubricEnabled && data.rubricCriteria?.length > 0 ? data.rubricCriteria : [],
                notify_students: data.notifyStudents,
                prerequisite_assignment_id: data.prerequisiteEnabled && data.prerequisiteAssignment ? data.prerequisiteAssignment : null,
                schedule_publish_at: data.schedulePublish && data.publishDate && data.publishTime
                    ? new Date(`${data.publishDate}T${data.publishTime}`).toISOString()
                    : null,
            };

            const { error } = await supabase.from('course_tasks').insert(taskData);

            if (error) {
                errors.push(`Failed to create for ${section}: ${error.message}`);
            } else {
                createdCount++;
            }
        }

        return { success: createdCount > 0, createdCount, errors };
    } catch (error) {
        return { success: false, createdCount: 0, errors: [(error as Error).message] };
    }
};

/**
 * Get assignments/tasks for a course
 */
export const getCourseAssignments = async (courseId: string) => {
    try {
        if (!supabase) return [];
        const { data: tasks, error } = await supabase
            .from('course_tasks').select('*').eq('course_id', courseId).order('due_date', { ascending: true });
        if (error) return [];
        return tasks || [];
    } catch { return []; }
};

// ============================================
// EXPORT SERVICE OBJECT
// ============================================
export const teacherService = {
    getStats: getTeacherStats,
    getActivity: getRecentActivity,
    getCourses: getTeacherCourses,
    getStudents: getCourseStudents,
    getSubmissionStats,
    createAssignment,
    getCourseAssignments,
};

export default teacherService;
