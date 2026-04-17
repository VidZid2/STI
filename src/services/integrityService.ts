import { supabase } from '../lib/supabase';
import { logAuditEvent, getActorInfo } from './adminService';

export interface AnomalyFlag {
    id: string;
    type: 'timing' | 'similarity' | 'score';
    severity: 'low' | 'medium' | 'high';
    student_a_id: string;
    student_a_name: string;
    student_b_id: string;
    student_b_name: string;
    task_id: string;
    task_title: string;
    detail: string;
    status: 'pending' | 'reviewed' | 'dismissed';
    created_at: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Basic char-frequency similarity (0–1). Fast, no external deps. */
const charFreqSimilarity = (a: string, b: string): number => {
    const s1 = a.slice(0, 500).toLowerCase();
    const s2 = b.slice(0, 500).toLowerCase();
    if (!s1 || !s2) return 0;
    const freq: Record<string, [number, number]> = {};
    for (const c of s1) freq[c] = [( freq[c]?.[0] ?? 0) + 1, freq[c]?.[1] ?? 0];
    for (const c of s2) freq[c] = [freq[c]?.[0] ?? 0, (freq[c]?.[1] ?? 0) + 1];
    let dot = 0, magA = 0, magB = 0;
    for (const [a, b] of Object.values(freq)) {
        dot += a * b; magA += a * a; magB += b * b;
    }
    return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
};

// ─── Fetch persisted flags ───────────────────────────────────────────────────

export const fetchAnomalies = async (): Promise<AnomalyFlag[]> => {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('integrity_flags')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
        if (error) throw error;
        return (data as AnomalyFlag[]) || [];
    } catch (err) {
        console.error('[IntegrityService] Failed to fetch flags:', err);
        return [];
    }
};

// ─── Review / dismiss ────────────────────────────────────────────────────────

export const reviewAnomaly = async (
    id: string,
    verdict: 'reviewed' | 'dismissed'
): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { error } = await supabase
            .from('integrity_flags')
            .update({ status: verdict })
            .eq('id', id);
        if (error) throw error;
        const actor = await getActorInfo();
        await logAuditEvent(
            'report',
            actor.name,
            actor.role,
            `Integrity flag ${id.slice(0, 8)} marked as ${verdict}`
        );
        return true;
    } catch (err) {
        console.error('[IntegrityService] Failed to update flag:', err);
        return false;
    }
};

// ─── Detection scan ──────────────────────────────────────────────────────────

interface RawSubmission {
    id: string;
    task_id: string;
    student_id: string;
    student_name: string;
    text_content: string | null;
    ai_score: number | null;
    submitted_at: string;
}

interface RawTask { id: string; title: string; }

export const runAnomalyScan = async (): Promise<{ inserted: number; flags: AnomalyFlag[] }> => {
    if (!supabase) return { inserted: 0, flags: [] };

    // 1. Fetch last 200 submissions with text content
    const { data: subs, error: subErr } = await supabase
        .from('student_submissions')
        .select('id, task_id, student_id, student_name, text_content, ai_score, submitted_at')
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false })
        .limit(200);

    if (subErr || !subs) return { inserted: 0, flags: [] };

    // 2. Fetch task titles for the task_ids we have
    const taskIds = [...new Set((subs as RawSubmission[]).map(s => s.task_id))];
    const { data: tasks } = await supabase
        .from('course_tasks')
        .select('id, title')
        .in('id', taskIds);

    const taskMap: Record<string, string> = {};
    (tasks as RawTask[] || []).forEach(t => { taskMap[t.id] = t.title; });

    // 3. Group by task_id
    const byTask: Record<string, RawSubmission[]> = {};
    (subs as RawSubmission[]).forEach(s => {
        if (!byTask[s.task_id]) byTask[s.task_id] = [];
        byTask[s.task_id].push(s);
    });

    const newFlags: Omit<AnomalyFlag, 'id' | 'created_at'>[] = [];

    for (const [taskId, group] of Object.entries(byTask)) {
        const taskTitle = taskMap[taskId] || `Task ${taskId.slice(0, 8)}`;

        // Compare every pair within the group
        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                const a = group[i];
                const b = group[j];
                if (a.student_id === b.student_id) continue; // same student, skip

                // ── Timing anomaly: submitted within 60 seconds ──
                const timeDiff = Math.abs(
                    new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
                );
                if (timeDiff <= 60000) {
                    newFlags.push({
                        type: 'timing',
                        severity: timeDiff <= 10000 ? 'high' : 'medium',
                        student_a_id: a.student_id,
                        student_a_name: a.student_name,
                        student_b_id: b.student_id,
                        student_b_name: b.student_name,
                        task_id: taskId,
                        task_title: taskTitle,
                        detail: `Submitted ${Math.round(timeDiff / 1000)}s apart on "${taskTitle}"`,
                        status: 'pending',
                    });
                }

                // ── Score anomaly: identical AI scores ──
                if (
                    a.ai_score !== null &&
                    b.ai_score !== null &&
                    a.ai_score === b.ai_score
                ) {
                    newFlags.push({
                        type: 'score',
                        severity: 'medium',
                        student_a_id: a.student_id,
                        student_a_name: a.student_name,
                        student_b_id: b.student_id,
                        student_b_name: b.student_name,
                        task_id: taskId,
                        task_title: taskTitle,
                        detail: `Both received identical AI score of ${a.ai_score} on "${taskTitle}"`,
                        status: 'pending',
                    });
                }

                // ── Similarity anomaly: text content >85% similar ──
                if (a.text_content && b.text_content) {
                    const sim = charFreqSimilarity(a.text_content, b.text_content);
                    if (sim >= 0.85) {
                        newFlags.push({
                            type: 'similarity',
                            severity: sim >= 0.95 ? 'high' : 'medium',
                            student_a_id: a.student_id,
                            student_a_name: a.student_name,
                            student_b_id: b.student_id,
                            student_b_name: b.student_name,
                            task_id: taskId,
                            task_title: taskTitle,
                            detail: `${Math.round(sim * 100)}% text similarity detected on "${taskTitle}"`,
                            status: 'pending',
                        });
                    }
                }
            }
        }
    }

    if (newFlags.length === 0) return { inserted: 0, flags: [] };

    // 4. Deduplicate: fetch existing flags for same student pairs + task
    const { data: existing } = await supabase
        .from('integrity_flags')
        .select('student_a_id, student_b_id, task_id, type');

    const existingSet = new Set(
        (existing || []).map((f: any) => `${f.type}|${f.task_id}|${[f.student_a_id, f.student_b_id].sort().join('|')}`)
    );

    const toInsert = newFlags.filter(f => {
        const key = `${f.type}|${f.task_id}|${[f.student_a_id, f.student_b_id].sort().join('|')}`;
        return !existingSet.has(key);
    });

    if (toInsert.length === 0) return { inserted: 0, flags: [] };

    const { data: inserted, error: insertErr } = await supabase
        .from('integrity_flags')
        .insert(toInsert)
        .select();

    if (insertErr) {
        console.error('[IntegrityService] Insert failed:', insertErr);
        return { inserted: 0, flags: [] };
    }

    // Log to audit
    const actor = await getActorInfo();
    await logAuditEvent(
        'report',
        actor.name,
        actor.role,
        `Integrity scan completed — ${toInsert.length} new flag(s) detected`
    );

    return { inserted: toInsert.length, flags: (inserted as AnomalyFlag[]) || [] };
};
