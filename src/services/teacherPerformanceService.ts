import { supabase } from '../lib/supabase';
import { sendNotification, logAuditEvent, getActorInfo } from './adminService';

export interface TeacherMetrics {
    teacherId: string;
    teacherName: string;
    email: string;
    totalAssignments: number;
    avgStudentGrade: number;       // 0–100
    avgTurnaroundHours: number;    // hours between task creation and first submission graded
    studentEngagementRate: number; // % of students who submitted at least once
    performanceBand: 'excellent' | 'good' | 'needs-support';
    assignmentBreakdown: { taskId: string; title: string; avgScore: number; submissionCount: number }[];
}

const band = (avg: number, engagement: number): TeacherMetrics['performanceBand'] => {
    const score = avg * 0.6 + engagement * 0.4;
    if (score >= 75) return 'excellent';
    if (score >= 50) return 'good';
    return 'needs-support';
};

export const fetchTeacherPerformance = async (): Promise<TeacherMetrics[]> => {
    if (!supabase) return [];
    try {
        // 1. All teachers (capped — no school has >500 teachers)
        const { data: teachers, error: tErr } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('role', 'teacher')
            .limit(100);
        if (tErr || !teachers) return [];

        // 2. Tasks — only the columns we need, capped
        const { data: tasks } = await supabase
            .from('course_tasks')
            .select('id, title, created_by, created_at')
            .limit(500);

        // 3. Graded submissions — only what we need, capped
        const { data: subs } = await supabase
            .from('student_submissions')
            .select('id, task_id, student_id, ai_score, graded_at, submitted_at, graded_by')
            .not('ai_score', 'is', null)
            .limit(2000);

        // 4. Total distinct students (count only, no data transfer)
        const { count: totalStudents } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'student');

        const studentCount = totalStudents || 1;

        return (teachers as { id: string; full_name: string; email: string }[]).map(teacher => {
            const myTasks = (tasks || []).filter((t: any) => t.created_by === teacher.id);
            const myTaskIds = new Set(myTasks.map((t: any) => t.id));

            const mySubs = (subs || []).filter((s: any) => myTaskIds.has(s.task_id));

            // Avg grade
            const scores = mySubs.map((s: any) => s.ai_score as number).filter(Boolean);
            const avgStudentGrade = scores.length
                ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                : 0;

            // Avg turnaround: hours between task created_at and first graded_at per task
            let turnaroundSum = 0; let turnaroundCount = 0;
            myTasks.forEach((task: any) => {
                const taskSubs = mySubs.filter((s: any) => s.task_id === task.id && s.graded_at);
                if (taskSubs.length) {
                    const firstGraded = taskSubs.reduce((a: any, b: any) =>
                        new Date(a.graded_at) < new Date(b.graded_at) ? a : b);
                    const hrs = (new Date(firstGraded.graded_at).getTime() - new Date(task.created_at).getTime()) / 3600000;
                    if (hrs > 0) { turnaroundSum += hrs; turnaroundCount++; }
                }
            });
            const avgTurnaroundHours = turnaroundCount
                ? Math.round(turnaroundSum / turnaroundCount)
                : 0;

            // Engagement: distinct students who submitted on this teacher's tasks
            const distinctStudents = new Set(mySubs.map((s: any) => s.student_id)).size;
            const studentEngagementRate = Math.round((distinctStudents / studentCount) * 100);

            // Per-task breakdown
            const assignmentBreakdown = myTasks.slice(0, 5).map((task: any) => {
                const taskSubs = mySubs.filter((s: any) => s.task_id === task.id);
                const taskScores = taskSubs.map((s: any) => s.ai_score as number).filter(Boolean);
                return {
                    taskId: task.id,
                    title: task.title,
                    avgScore: taskScores.length
                        ? Math.round(taskScores.reduce((a, b) => a + b, 0) / taskScores.length)
                        : 0,
                    submissionCount: taskSubs.length,
                };
            });

            return {
                teacherId: teacher.id,
                teacherName: teacher.full_name,
                email: teacher.email,
                totalAssignments: myTasks.length,
                avgStudentGrade,
                avgTurnaroundHours,
                studentEngagementRate,
                performanceBand: band(avgStudentGrade, studentEngagementRate),
                assignmentBreakdown,
            };
        })
        .filter(t => t.totalAssignments > 0 || t.avgStudentGrade > 0)
        .sort((a, b) => b.avgStudentGrade - a.avgStudentGrade);

    } catch (err) {
        console.error('[TeacherPerformanceService] Failed:', err);
        return [];
    }
};

export const sendEncouragement = async (teacherId: string, teacherName: string): Promise<boolean> => {
    const ok = await sendNotification(
        teacherId,
        '🌟 Recognition from Administration',
        `The administration recognizes your outstanding work and dedication this semester, ${teacherName.split(' ')[0]}. Keep up the excellent effort!`,
        'success'
    );
    if (ok) {
        const actor = await getActorInfo();
        await logAuditEvent(
            'grade',
            actor.name,
            actor.role,
            `Admin sent encouragement notification to ${teacherName}`
        );
    }
    return ok;
};

export const flagTeacherForReview = async (_teacherId: string, teacherName: string): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const actor = await getActorInfo();
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('admin_reports').insert({
            reporter_id: user?.id || 'admin',
            reporter_name: actor.name,
            category: 'academic',
            title: `Teacher Performance Review: ${teacherName}`,
            description: `Admin flagged ${teacherName} for a performance review based on analytics data.`,
            priority: 'medium',
            status: 'open',
        });
        await logAuditEvent('report', actor.name, actor.role, `Flagged ${teacherName} for performance review`);
        return true;
    } catch (err) {
        console.error('[TeacherPerformanceService] Flag failed:', err);
        return false;
    }
};
