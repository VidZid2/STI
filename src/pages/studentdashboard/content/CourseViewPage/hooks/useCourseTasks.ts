/**
 * useCourseTasks
 * Fetches and manages course task data from Supabase for a given course.
 * Extracted from CourseViewPage.tsx during Phase 8.1 (useCourseTasks hook)
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../../lib/supabase';
import { getCurrentUser } from '../../../../../services/authService';
import type { CourseTask, TaskCategory } from '../data/demoCourses';

interface UseCourseTasksReturn {
    tasks: CourseTask[];
    isLoading: boolean;
    refetch: () => Promise<void>;
}

export function useCourseTasks(courseId: string): UseCourseTasksReturn {
    const [tasks, setTasks] = useState<CourseTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTasks = useCallback(async () => {
        if (!supabase) {
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);

            const currentUser = getCurrentUser();
            const studentSection = currentUser?.section || 'BSIT101A';

            const { data: rawTasks, error } = await supabase
                .from('course_tasks')
                .select('id, title, type, due_date, points, status, section, description, instructions, allow_late_submission, late_penalty, max_attempts, rubric_enabled, rubric_criteria, prerequisite_assignment_id, attachments')
                .eq('course_id', courseId)
                .eq('section', studentSection)
                .eq('status', 'published')
                .order('due_date', { ascending: true });

            if (error || !rawTasks) {
                setIsLoading(false);
                return;
            }

            // Fetch student submissions for these tasks
            let submissionsMap: Record<string, { score: number | null; status: string; count: number }> = {};
            if (rawTasks.length > 0 && currentUser?.id) {
                const taskIds = rawTasks.map(t => t.id);
                const studentIdForQuery = currentUser.student_id || currentUser.id;
                const { data: subs } = await supabase
                    .from('student_submissions')
                    .select('task_id, score, status')
                    .eq('student_id', studentIdForQuery)
                    .in('task_id', taskIds);

                if (subs) {
                    subs.forEach(sub => {
                        const existing = submissionsMap[sub.task_id];
                        if (existing) {
                            existing.count += 1;
                            if (sub.score !== null) {
                                existing.score = sub.score;
                                existing.status = sub.status;
                            }
                        } else {
                            submissionsMap[sub.task_id] = { score: sub.score, status: sub.status, count: 1 };
                        }
                    });
                }
            }

            const categoryMap: Record<string, TaskCategory> = {
                assignment: 'assignment',
                quiz: 'quiz',
                performance: 'performance',
                practical: 'practical',
                journal: 'journal',
            };

            const now = new Date();
            const mapped = rawTasks.map((task) => {
                const submission = submissionsMap[task.id];
                const dueDate = new Date(task.due_date);
                const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                let dueLabel = '';
                if (diffDays < 0) {
                    dueLabel = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
                } else if (diffDays === 0) {
                    dueLabel = 'Due Today';
                } else if (diffDays === 1) {
                    dueLabel = 'Due Tomorrow';
                } else if (diffDays <= 7) {
                    dueLabel = `Due in ${diffDays} days`;
                } else {
                    dueLabel = `Due ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                }

                return {
                    id: task.id,
                    title: task.title,
                    due: dueLabel,
                    status: submission?.status || (diffDays < 0 ? 'overdue' : 'pending'),
                    score: submission?.score ?? null,
                    category: categoryMap[task.type] || ('assignment' as TaskCategory),
                    points: task.points || 100,
                    dueDate: task.due_date,
                    description: task.description,
                    instructions: task.instructions,
                    allowLateSubmission: task.allow_late_submission || false,
                    latePenalty: task.late_penalty || 0,
                    maxAttempts: task.max_attempts || 1,
                    rubricEnabled: task.rubric_enabled || false,
                    rubricCriteria: task.rubric_criteria || [],
                    prerequisiteAssignmentId: task.prerequisite_assignment_id || null,
                    attachments: task.attachments || [],
                    submissionCount: submission?.count || 0,
                    _diffDays: diffDays,
                } satisfies CourseTask;
            }).map((t: CourseTask) => {
                // Auto-lock tasks overdue by more than 15 days with no submission
                if (t.status === 'overdue' && (t._diffDays ?? 0) <= -15) {
                    return { ...t, status: 'locked' };
                }
                return t;
            });

            setTasks(mapped);
        } catch {
            // Silently fall through — UI shows empty state
        } finally {
            setIsLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Realtime grade updates
    useEffect(() => {
        if (!supabase) return;
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        const studentId = currentUser.student_id || currentUser.id;
        const channel = supabase
            .channel(`student_grade_updates_${courseId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'student_submissions',
                    filter: `student_id=eq.${studentId}`,
                },
                (payload) => {
                    const updated = payload.new as { task_id: string; score: number | null; status: string };
                    setTasks(prev => prev.map(t =>
                        t.id === updated.task_id
                            ? { ...t, score: updated.score, status: updated.status }
                            : t
                    ));
                }
            )
            .subscribe();

        return () => { supabase?.removeChannel(channel); };
    }, [courseId]);

    return { tasks, isLoading, refetch: fetchTasks };
}
