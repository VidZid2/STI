/**
 * At-Risk Students Service
 * Phase 5: Replaces fake Math.random() data with real Supabase queries.
 *
 * At-risk criteria:
 *  - avg ai_score < 75 across their submissions (low grades)
 *  - 3+ submissions with status = 'late' (excessive late work)
 *  - 3+ tasks with no submission at all (missing work)
 */

import { supabase } from '../lib/supabase';
import type { AtRiskStudent } from '../pages/teacherdashboard/atrisk';

interface RawStudent {
    id: string;
    student_id: string;
    full_name: string;
    first_name: string;
    last_name: string;
    email: string;
    section: string;
    program: string;
    year_level: string;
    profile_image?: string;
    is_active: boolean;
}

interface SubmissionRow {
    student_id: string;
    ai_score: number | null;
    status: string;
    submitted_at: string;
}

export const fetchAtRiskStudents = async (): Promise<AtRiskStudent[]> => {
    if (!supabase) return [];

    try {
        // 1. Fetch all active students
        const { data: students, error: studentsError } = await supabase
            .from('users')
            .select('id, student_id, full_name, first_name, last_name, email, section, program, year_level, profile_image, is_active')
            .eq('role', 'student')
            .eq('is_active', true)
            .order('full_name', { ascending: true })
            .limit(200);

        if (studentsError || !students) throw studentsError;

        // 2. Fetch all submissions (only what we need)
        const { data: submissions } = await supabase
            .from('student_submissions')
            .select('student_id, ai_score, status, submitted_at')
            .limit(2000);

        const subs: SubmissionRow[] = (submissions || []) as SubmissionRow[];

        // 3. Fetch total published task count (for missing-work detection)
        const { count: totalTasks } = await supabase
            .from('course_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published');

        const taskCount = totalTasks || 0;

        // 4. Compute per-student metrics
        const atRiskStudents: AtRiskStudent[] = [];

        for (const student of students as RawStudent[]) {
            const studentSubs = subs.filter(s => s.student_id === student.student_id);

            // Avg grade from AI-scored submissions
            const scoredSubs = studentSubs.filter(s => s.ai_score !== null);
            const avgGrade = scoredSubs.length > 0
                ? Math.round(scoredSubs.reduce((sum, s) => sum + (s.ai_score ?? 0), 0) / scoredSubs.length)
                : 0;

            // Late submission count
            const lateCount = studentSubs.filter(s => s.status === 'late').length;

            // Missing work: tasks with no submission
            const submittedCount = studentSubs.length;
            const missingCount = Math.max(0, taskCount - submittedCount);

            // Determine if at-risk
            const hasLowGrades = avgGrade > 0 && avgGrade < 75;
            const hasExcessiveAbsences = lateCount >= 3;
            const hasMissingWork = missingCount >= 3;

            if (!hasLowGrades && !hasExcessiveAbsences && !hasMissingWork) continue;

            // Determine primary issue
            let issue = 'Needs attention';
            if (hasLowGrades) issue = `Low average score (${avgGrade}%)`;
            else if (hasMissingWork) issue = `${missingCount} missing assignment${missingCount > 1 ? 's' : ''}`;
            else if (hasExcessiveAbsences) issue = `${lateCount} late submission${lateCount > 1 ? 's' : ''}`;

            // Trend: compare last 3 vs previous 3 scored submissions
            let trend: 'declining' | 'stable' | 'improving' = 'stable';
            if (scoredSubs.length >= 6) {
                const sorted = [...scoredSubs].sort((a, b) =>
                    new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
                );
                const recent = sorted.slice(-3).reduce((s, x) => s + (x.ai_score ?? 0), 0) / 3;
                const older = sorted.slice(-6, -3).reduce((s, x) => s + (x.ai_score ?? 0), 0) / 3;
                if (recent < older - 5) trend = 'declining';
                else if (recent > older + 5) trend = 'improving';
            }

            atRiskStudents.push({
                ...student,
                currentGrade: avgGrade || 60, // fallback if no scored subs
                absences: lateCount,
                issue,
                trend,
            });
        }

        return atRiskStudents;
    } catch {
        return [];
    }
};
