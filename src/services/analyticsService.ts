import { supabase } from '../lib/supabase';

export type DateRange = '7d' | '30d' | '90d' | 'all';

export interface EnrollmentPoint { date: string; students: number; teachers: number; }
export interface SubmissionByDay  { day: string; count: number; }
export interface GradeRange       { range: string; count: number; }
export interface TeacherWorkload  { name: string; assignments: number; submissions: number; }
export interface HeatmapCell      { hour: number; day: number; count: number; }

export interface AnalyticsKPIs {
    avgGrade: number;
    completionRate: number;
    avgResponseHours: number;
    activeRatio: number;
}

export interface AnalyticsData {
    enrollmentTrend: EnrollmentPoint[];
    submissionsByDay: SubmissionByDay[];
    gradeDistribution: GradeRange[];
    teacherWorkload: TeacherWorkload[];
    activityHeatmap: HeatmapCell[];
    kpis: AnalyticsKPIs;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const sinceDate = (range: DateRange): string | null => {
    if (range === 'all') return null;
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    return new Date(Date.now() - days * 86400000).toISOString();
};

export const fetchAnalytics = async (range: DateRange): Promise<AnalyticsData> => {
    const empty: AnalyticsData = {
        enrollmentTrend: [], submissionsByDay: [], gradeDistribution: [],
        teacherWorkload: [], activityHeatmap: [], kpis: { avgGrade: 0, completionRate: 0, avgResponseHours: 0, activeRatio: 0 },
    };
    if (!supabase) return empty;

    const since = sinceDate(range);

    try {
        // ── 1. Enrollment trend ──────────────────────────────────────────────
        let userQuery = supabase.from('users').select('role, created_at').in('role', ['student', 'teacher']);
        if (since) userQuery = userQuery.gte('created_at', since);
        const { data: users } = await userQuery;

        const enrollMap: Record<string, { students: number; teachers: number }> = {};
        (users || []).forEach((u: { role: string; created_at: string }) => {
            const date = u.created_at.slice(0, 10);
            if (!enrollMap[date]) enrollMap[date] = { students: 0, teachers: 0 };
            if (u.role === 'student') enrollMap[date].students++;
            else enrollMap[date].teachers++;
        });
        const enrollmentTrend: EnrollmentPoint[] = Object.entries(enrollMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, v]) => ({ date, ...v }));

        // ── 2. Submissions by day-of-week ────────────────────────────────────
        let subQuery = supabase.from('student_submissions').select('submitted_at');
        if (since) subQuery = subQuery.gte('submitted_at', since);
        const { data: subs } = await subQuery;

        const dayCount: Record<number, number> = { 0:0,1:0,2:0,3:0,4:0,5:0,6:0 };
        (subs || []).forEach((s: { submitted_at: string }) => {
            const dow = new Date(s.submitted_at).getDay();
            dayCount[dow]++;
        });
        const submissionsByDay: SubmissionByDay[] = DAY_NAMES.map((day, i) => ({ day, count: dayCount[i] }));

        // ── 3. Grade distribution ────────────────────────────────────────────
        const { data: graded } = await supabase
            .from('student_submissions')
            .select('ai_score')
            .not('ai_score', 'is', null);

        const buckets: Record<string, number> = {
            '90–100': 0, '80–89': 0, '70–79': 0, '60–69': 0, '<60': 0,
        };
        (graded || []).forEach((s: { ai_score: number }) => {
            const g = s.ai_score;
            if (g >= 90) buckets['90–100']++;
            else if (g >= 80) buckets['80–89']++;
            else if (g >= 70) buckets['70–79']++;
            else if (g >= 60) buckets['60–69']++;
            else buckets['<60']++;
        });
        const gradeDistribution: GradeRange[] = Object.entries(buckets).map(([range, count]) => ({ range, count }));

        // ── 4. Teacher workload ──────────────────────────────────────────────
        const { data: teachers } = await supabase
            .from('users')
            .select('id, full_name')
            .eq('role', 'teacher');

        const { data: tasks } = await supabase
            .from('course_tasks')
            .select('id, created_by');

        const { data: allSubs } = await supabase
            .from('student_submissions')
            .select('id, graded_by');

        const teacherWorkload: TeacherWorkload[] = (teachers || []).map((t: { id: string; full_name: string }) => {
            const assignments = (tasks || []).filter((tk: { created_by: string }) => tk.created_by === t.id).length;
            const submissions = (allSubs || []).filter((s: { graded_by: string }) => s.graded_by === t.id).length;
            return { name: t.full_name?.split(' ').slice(-1)[0] || t.full_name, assignments, submissions };
        }).filter(t => t.assignments > 0 || t.submissions > 0)
          .sort((a, b) => (b.assignments + b.submissions) - (a.assignments + a.submissions))
          .slice(0, 8);

        // ── 5. Activity heatmap (last_login by hour × day-of-week) ──────────
        const { data: logins } = await supabase
            .from('users')
            .select('last_login')
            .not('last_login', 'is', null);

        const heatMap: Record<string, number> = {};
        (logins || []).forEach((u: { last_login: string }) => {
            const d = new Date(u.last_login);
            const key = `${d.getDay()}-${d.getHours()}`;
            heatMap[key] = (heatMap[key] || 0) + 1;
        });
        const activityHeatmap: HeatmapCell[] = [];
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                activityHeatmap.push({ day, hour, count: heatMap[`${day}-${hour}`] || 0 });
            }
        }

        // ── 6. KPIs ──────────────────────────────────────────────────────────
        const scores = (graded || []).map((s: { ai_score: number }) => s.ai_score);
        const avgGrade = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;

        const { count: totalSubs } = await supabase
            .from('student_submissions')
            .select('*', { count: 'exact', head: true });
        const { count: gradedCount } = await supabase
            .from('student_submissions')
            .select('*', { count: 'exact', head: true })
            .not('ai_score', 'is', null);
        const completionRate = totalSubs ? Math.round(((gradedCount || 0) / totalSubs) * 100) : 0;

        const { count: totalUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const { count: activeUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gte('last_login', weekAgo);
        const activeRatio = totalUsers ? Math.round(((activeUsers || 0) / totalUsers) * 100) : 0;

        return {
            enrollmentTrend,
            submissionsByDay,
            gradeDistribution,
            teacherWorkload,
            activityHeatmap,
            kpis: { avgGrade, completionRate, avgResponseHours: 0, activeRatio },
        };
    } catch (err) {
        console.error('[AnalyticsService] Failed:', err);
        return empty;
    }
};
