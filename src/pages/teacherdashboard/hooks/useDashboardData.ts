/**
 * useDashboardData Hook
 * Phase 4: Extracted all Supabase data-fetching logic from TeacherDashboard.tsx
 * 
 * Consolidates:
 * - At-risk students query (was lines 134-254 in TeacherDashboard)
 * - Schedule & urgent tasks query (was lines 256-309)
 * - Notification generation (was lines 311-392)
 * 
 * No raw `.from('student_submissions')` calls remain in the UI layer.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { AtRiskStudentData } from '../components/AtRiskPanel';
import type { ScheduleItem } from '../components/SchedulePanel';
import type { TaskItem } from '../components/UrgentTasksPanel';
import type { DashboardNotification } from '../components/DashboardHeader';
import type { ActivityItem } from '../components/ActivityPanel';
import type { ModalState } from '../types';

interface DashboardDataState {
    // At-risk
    atRiskStudents: AtRiskStudentData[];
    isLoadingAtRisk: boolean;
    // Schedule & tasks
    todaysSchedule: ScheduleItem[];
    urgentTasks: TaskItem[];
    isLoadingSchedule: boolean;
    // Notifications (derived)
    notifications: DashboardNotification[];
    handleNotificationClick: (notification: DashboardNotification) => void;
    handleViewAllNotifications: () => void;
}

export const useDashboardData = (
    activity: ActivityItem[],
    openModal: (modalName: keyof ModalState) => void,
): DashboardDataState => {
    // At-risk students state
    const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudentData[]>([]);
    const [isLoadingAtRisk, setIsLoadingAtRisk] = useState(true);

    // Schedule and tasks state
    const [todaysSchedule, setTodaysSchedule] = useState<ScheduleItem[]>([]);
    const [urgentTasks, setUrgentTasks] = useState<TaskItem[]>([]);
    const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);

    // Notifications state (derived from the above)
    const [notifications, setNotifications] = useState<DashboardNotification[]>([]);

    // ============================================
    // FETCH AT-RISK STUDENTS
    // ============================================
    useEffect(() => {
        const fetchAtRiskStudents = async () => {
            setIsLoadingAtRisk(true);
            try {
                if (!supabase) {
                    setAtRiskStudents([]);
                    setIsLoadingAtRisk(false);
                    return;
                }

                const { data: lowGradeSubmissions, error: gradeError } = await supabase
                    .from('student_submissions')
                    .select(`
                        student_id,
                        score,
                        max_score,
                        users!student_submissions_student_id_fkey (
                            id,
                            full_name,
                            section,
                            program
                        ),
                        assignments (
                            title,
                            course_id,
                            courses (
                                code
                            )
                        )
                    `)
                    .eq('status', 'graded')
                    .not('score', 'is', null)
                    .order('graded_at', { ascending: false })
                    .limit(50);

                if (gradeError) {

                    setAtRiskStudents([]);
                    return;
                }

                if (lowGradeSubmissions && lowGradeSubmissions.length > 0) {
                    const studentGrades: Record<string, {
                        student: { id: string; full_name: string; section: string; program: string } | null;
                        totalScore: number;
                        totalMaxScore: number;
                        count: number;
                        subject: string;
                    }> = {};

                    lowGradeSubmissions.forEach((submission) => {
                        const users = submission.users as unknown as { id: string; full_name: string; section: string; program: string } | null;
                        const assignments = submission.assignments as unknown as { title: string; course_id: string; courses: { code: string } | null } | null;

                        if (!users || submission.score === null || submission.max_score === null) return;

                        const studentId = submission.student_id;
                        if (!studentGrades[studentId]) {
                            studentGrades[studentId] = {
                                student: users,
                                totalScore: 0,
                                totalMaxScore: 0,
                                count: 0,
                                subject: assignments?.courses?.code || 'Unknown',
                            };
                        }
                        studentGrades[studentId].totalScore += submission.score;
                        studentGrades[studentId].totalMaxScore += submission.max_score;
                        studentGrades[studentId].count += 1;
                    });

                    const atRisk: AtRiskStudentData[] = Object.entries(studentGrades)
                        .filter(([, data]) => {
                            const avgGrade = data.totalMaxScore > 0
                                ? (data.totalScore / data.totalMaxScore) * 100
                                : 0;
                            return avgGrade < 75 && data.count >= 1;
                        })
                        .slice(0, 3)
                        .map(([studentId, data]) => ({
                            id: studentId,
                            name: data.student?.full_name || 'Unknown Student',
                            section: data.student?.section || 'Unknown',
                            subject: data.subject,
                            currentGrade: Math.round((data.totalScore / data.totalMaxScore) * 100),
                            absences: 0,
                            issue: 'Low grades',
                            trend: 'declining' as const,
                        }));

                    setAtRiskStudents(atRisk);
                } else {
                    setAtRiskStudents([]);
                }
            } catch (err) {

                setAtRiskStudents([]);
            } finally {
                setIsLoadingAtRisk(false);
            }
        };

        fetchAtRiskStudents();
    }, []);

    // ============================================
    // FETCH SCHEDULE & TASKS
    // ============================================
    useEffect(() => {
        const fetchScheduleAndTasks = async () => {
            setIsLoadingSchedule(true);
            try {
                if (!supabase) {
                    setTodaysSchedule([]);
                    setUrgentTasks([]);
                    setIsLoadingSchedule(false);
                    return;
                }

                const { count: pendingCount } = await supabase
                    .from('student_submissions')
                    .select('*', { count: 'exact', head: true })
                    .in('status', ['pending', 'submitted']);

                // No dedicated schedule table yet
                setTodaysSchedule([]);

                const tasksData: TaskItem[] = [];
                if (typeof pendingCount === 'number' && pendingCount > 0) {
                    tasksData.push({
                        id: '1',
                        type: 'grading',
                        title: 'Ungraded Submissions',
                        description: `${pendingCount} submissions awaiting review`,
                        dueDate: 'Due today',
                        priority: 'high',
                        count: pendingCount,
                    });
                }

                setUrgentTasks(tasksData);
            } catch (err) {

                setTodaysSchedule([]);
                setUrgentTasks([]);
            } finally {
                setIsLoadingSchedule(false);
            }
        };

        fetchScheduleAndTasks();
    }, []);

    // ============================================
    // GENERATE NOTIFICATIONS (derived from fetched data)
    // ============================================
    useEffect(() => {
        const newNotifications: DashboardNotification[] = [];
        const now = new Date();

        // Pending submissions notification
        if (urgentTasks.length > 0) {
            const gradingTask = urgentTasks.find(t => t.type === 'grading');
            if (gradingTask && gradingTask.count && gradingTask.count > 0) {
                newNotifications.push({
                    id: 'pending-submissions',
                    type: 'submission',
                    title: 'Pending submissions',
                    description: `${gradingTask.count} submission${gradingTask.count > 1 ? 's' : ''} awaiting review`,
                    timestamp: new Date(now.getTime() - 5 * 60 * 1000),
                    isRead: false,
                    actionLabel: 'Grade now',
                    onAction: () => openModal('isGradeSubmissionsOpen'),
                });
            }
        }

        // At-risk students notification
        if (atRiskStudents.length > 0) {
            newNotifications.push({
                id: 'at-risk-students',
                type: 'at-risk',
                title: 'At-risk students',
                description: `${atRiskStudents.length} student${atRiskStudents.length > 1 ? 's' : ''} need${atRiskStudents.length === 1 ? 's' : ''} attention`,
                timestamp: new Date(now.getTime() - 30 * 60 * 1000),
                isRead: false,
                actionLabel: 'View details',
                onAction: () => openModal('isAtRiskStudentsOpen'),
            });
        }

        // Recent activity notifications
        if (activity.length > 0) {
            const recentSubmission = activity.find(a => a.type === 'submission');
            if (recentSubmission) {
                newNotifications.push({
                    id: `activity-${recentSubmission.id}`,
                    type: 'submission',
                    title: 'New submission',
                    description: `${recentSubmission.student} - ${recentSubmission.course}`,
                    timestamp: recentSubmission.timestamp,
                    isRead: false,
                    onAction: () => openModal('isGradeSubmissionsOpen'),
                });
            }

            const recentGrade = activity.find(a => a.type === 'grade');
            if (recentGrade) {
                newNotifications.push({
                    id: `activity-${recentGrade.id}`,
                    type: 'grading',
                    title: 'Grading complete',
                    description: `${recentGrade.student} - ${recentGrade.course}`,
                    timestamp: recentGrade.timestamp,
                    isRead: true,
                });
            }
        }

        newNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setNotifications(newNotifications);
    }, [urgentTasks, atRiskStudents, activity, openModal]);

    // ============================================
    // NOTIFICATION ACTIONS
    // ============================================
    const handleNotificationClick = useCallback((notification: DashboardNotification) => {
        setNotifications(prev =>
            prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        notification.onAction?.();
    }, []);

    const handleViewAllNotifications = useCallback(() => {
        openModal('isActivityModalOpen');
    }, [openModal]);

    return {
        atRiskStudents,
        isLoadingAtRisk,
        todaysSchedule,
        urgentTasks,
        isLoadingSchedule,
        notifications,
        handleNotificationClick,
        handleViewAllNotifications,
    };
};
