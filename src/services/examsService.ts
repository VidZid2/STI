/**
 * Exams Service - Manages exams and exam scores with Supabase integration
 * For InputScoresModal in TeacherDashboard
 * 
 * Features:
 * - Real Supabase integration when configured
 * - localStorage fallback for demo mode (scores persist locally)
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

// LocalStorage keys for demo mode persistence
const STORAGE_KEYS = {
    EXAM_SCORES: 'elms_exam_scores',
    EXAMS: 'elms_exams',
};

// Types
export interface Exam {
    id: string;
    course_id: string;
    title: string;
    description?: string;
    max_score: number;
    passing_score?: number;
    exam_type: 'quiz' | 'midterm' | 'final' | 'practical' | 'project';
    exam_date: string;
    term: 'prelim' | 'midterm' | 'finals';
    is_published: boolean;
    created_by?: string;
    created_at?: string;
}

export interface ExamScore {
    id?: string;
    exam_id: string;
    student_id: string;
    student_name: string;
    section: string;
    score: number | null;
    remarks?: string;
    is_absent?: boolean;
    is_excused?: boolean;
    graded_by?: string;
    graded_at?: string;
}

export interface ExamWithStats extends Exam {
    scores_count: number;
    avg_score: number | null;
}

export interface ExamHistoryItem {
    examId: string;
    examTitle: string;
    date: string;
    studentScores: { studentId: string; score: number }[];
    avgScore: number;
    completedCount: number;
}

// Demo exams fallback
const DEMO_EXAMS: Exam[] = [
    { id: 'exam-cp1-quiz1', course_id: 'cp1', title: 'Quiz 1 - Variables & Data Types', max_score: 50, exam_type: 'quiz', exam_date: '2026-01-10', term: 'prelim', is_published: true },
    { id: 'exam-cp1-quiz2', course_id: 'cp1', title: 'Quiz 2 - Control Structures', max_score: 50, exam_type: 'quiz', exam_date: '2026-01-18', term: 'prelim', is_published: true },
    { id: 'exam-cp1-midterm', course_id: 'cp1', title: 'Midterm Examination', max_score: 100, exam_type: 'midterm', exam_date: '2026-01-25', term: 'midterm', is_published: true },
    { id: 'exam-cp1-final', course_id: 'cp1', title: 'Final Examination', max_score: 100, exam_type: 'final', exam_date: '2026-02-20', term: 'finals', is_published: false },
    { id: 'exam-itc-quiz1', course_id: 'itc', title: 'Quiz 1 - Computer Basics', max_score: 30, exam_type: 'quiz', exam_date: '2026-01-08', term: 'prelim', is_published: true },
    { id: 'exam-itc-midterm', course_id: 'itc', title: 'Midterm Examination', max_score: 100, exam_type: 'midterm', exam_date: '2026-01-24', term: 'midterm', is_published: true },
    { id: 'exam-euth1-quiz1', course_id: 'euth1', title: 'Quiz 1 - Personal Development', max_score: 40, exam_type: 'quiz', exam_date: '2026-01-09', term: 'prelim', is_published: true },
    { id: 'exam-euth1-midterm', course_id: 'euth1', title: 'Midterm Examination', max_score: 100, exam_type: 'midterm', exam_date: '2026-01-26', term: 'midterm', is_published: true },
    { id: 'exam-purcom-quiz1', course_id: 'purcom', title: 'Quiz 1 - Communication Process', max_score: 50, exam_type: 'quiz', exam_date: '2026-01-11', term: 'prelim', is_published: true },
    { id: 'exam-purcom-midterm', course_id: 'purcom', title: 'Midterm Examination', max_score: 100, exam_type: 'midterm', exam_date: '2026-01-27', term: 'midterm', is_published: true },
];

// ============================================
// LocalStorage Helpers (for demo mode persistence)
// ============================================

/**
 * Helper: Get scores from localStorage (demo mode)
 */
const getLocalScores = (): Record<string, ExamScore[]> => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.EXAM_SCORES);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
};

/**
 * Helper: Save scores to localStorage (demo mode)
 */
const saveLocalScores = (examId: string, scores: ExamScore[]): void => {
    try {
        const allScores = getLocalScores();
        allScores[examId] = scores;
        localStorage.setItem(STORAGE_KEYS.EXAM_SCORES, JSON.stringify(allScores));
        console.log('[ExamScores] Saved to localStorage:', { examId, count: scores.length });
    } catch (err) {
        console.error('[ExamScores] localStorage save error:', err);
    }
};

// ============================================
// Exam Functions
// ============================================

/**
 * Fetch all exams for a specific course
 */
export const getExamsByCourse = async (courseId: string): Promise<Exam[]> => {
    if (!isSupabaseConfigured() || !supabase) {
        return DEMO_EXAMS.filter(e => e.course_id === courseId);
    }

    try {
        const { data, error } = await supabase
            .from('exams')
            .select('*')
            .eq('course_id', courseId)
            .order('exam_date', { ascending: true });

        if (error) {
            console.error('[Exams] Fetch error:', error);
            return DEMO_EXAMS.filter(e => e.course_id === courseId);
        }

        if (data && data.length > 0) {
            return data;
        }

        return DEMO_EXAMS.filter(e => e.course_id === courseId);
    } catch (err) {
        console.error('[Exams] Fetch error:', err);
        return DEMO_EXAMS.filter(e => e.course_id === courseId);
    }
};

/**
 * Fetch a single exam by ID
 */
export const getExamById = async (examId: string): Promise<Exam | null> => {
    if (!isSupabaseConfigured() || !supabase) {
        return DEMO_EXAMS.find(e => e.id === examId) || null;
    }

    try {
        const { data, error } = await supabase
            .from('exams')
            .select('*')
            .eq('id', examId)
            .single();

        if (error) {
            console.error('[Exams] Fetch single error:', error);
            return DEMO_EXAMS.find(e => e.id === examId) || null;
        }

        return data;
    } catch (err) {
        console.error('[Exams] Fetch single error:', err);
        return DEMO_EXAMS.find(e => e.id === examId) || null;
    }
};

/**
 * Fetch existing scores for an exam
 * Uses Supabase when configured, localStorage as fallback
 */
export const getExamScores = async (examId: string): Promise<ExamScore[]> => {
    // Try localStorage first (for demo mode or as cache)
    const localScores = getLocalScores();
    const localExamScores = localScores[examId] || [];

    if (!isSupabaseConfigured() || !supabase) {
        console.log('[ExamScores] Demo mode - loading from localStorage:', { examId, count: localExamScores.length });
        return localExamScores;
    }

    try {
        const { data, error } = await supabase
            .from('exam_scores')
            .select('*')
            .eq('exam_id', examId)
            .order('student_name', { ascending: true });

        if (error) {
            console.error('[ExamScores] Fetch error:', error);
            // Fallback to localStorage on error
            return localExamScores;
        }

        return data || localExamScores;
    } catch (err) {
        console.error('[ExamScores] Fetch error:', err);
        return localExamScores;
    }
};

/**
 * Save or update exam scores (upsert)
 * Uses Supabase when configured, localStorage as fallback for demo mode
 */
export const saveExamScores = async (
    examId: string,
    scores: { 
        studentId: string; 
        studentName: string; 
        score: number | null; 
        remarks?: string;
        isAbsent?: boolean;
        isExcused?: boolean;
    }[],
    gradedBy: string = 'TEACHER001'
): Promise<{ success: boolean; error?: string; savedCount: number }> => {
    // Include scores that have a value OR are marked as absent
    const scoresToSave = scores
        .filter(s => s.score !== null || s.isAbsent)
        .map(s => ({
            exam_id: examId,
            student_id: s.studentId,
            student_name: s.studentName,
            section: 'BSIT101A',
            score: s.score,
            remarks: s.remarks || undefined,
            is_absent: s.isAbsent || false,
            is_excused: s.isExcused || false,
            graded_by: gradedBy,
            graded_at: new Date().toISOString(),
        }));

    if (scoresToSave.length === 0) {
        return { success: true, savedCount: 0 };
    }

    // If Supabase is not configured, use localStorage fallback
    if (!isSupabaseConfigured() || !supabase) {
        console.log('[ExamScores] Demo mode - saving to localStorage');
        saveLocalScores(examId, scoresToSave);
        return { success: true, savedCount: scoresToSave.length };
    }

    // Save to Supabase
    try {
        const { error } = await supabase
            .from('exam_scores')
            .upsert(scoresToSave, {
                onConflict: 'exam_id,student_id',
                ignoreDuplicates: false,
            });

        if (error) {
            console.error('[ExamScores] Supabase save error:', error);
            // Fallback to localStorage on Supabase error
            saveLocalScores(examId, scoresToSave);
            return { success: true, savedCount: scoresToSave.length };
        }

        console.log('[ExamScores] Saved to Supabase:', { examId, count: scoresToSave.length });
        return { success: true, savedCount: scoresToSave.length };
    } catch (err) {
        console.error('[ExamScores] Save error:', err);
        // Fallback to localStorage on error
        saveLocalScores(examId, scoresToSave);
        return { success: true, savedCount: scoresToSave.length };
    }
};

/**
 * Get exam history for "Copy from Previous Exam" feature
 * Returns exams from the same course that have scores
 * Uses localStorage in demo mode
 */
export const getExamHistory = async (courseId: string, excludeExamId?: string): Promise<ExamHistoryItem[]> => {
    // Get local scores for demo mode
    const localScores = getLocalScores();
    
    if (!isSupabaseConfigured() || !supabase) {
        // Build history from localStorage in demo mode
        const courseExams = DEMO_EXAMS.filter(e => e.course_id === courseId && e.id !== excludeExamId);
        const historyItems: ExamHistoryItem[] = [];
        
        for (const exam of courseExams) {
            const examScores = localScores[exam.id];
            if (!examScores || examScores.length === 0) continue;
            
            const validScores = examScores.filter(s => s.score !== null);
            if (validScores.length === 0) continue;
            
            const avgScore = validScores.reduce((sum, s) => sum + (s.score || 0), 0) / validScores.length;
            
            historyItems.push({
                examId: exam.id,
                examTitle: exam.title,
                date: exam.exam_date,
                studentScores: validScores.map(s => ({
                    studentId: s.student_id,
                    score: s.score || 0,
                })),
                avgScore: Math.round(avgScore * 10) / 10,
                completedCount: validScores.length,
            });
        }
        
        return historyItems;
    }

    try {
        // First get all exams for the course
        const { data: exams, error: examsError } = await supabase
            .from('exams')
            .select('id, title, exam_date')
            .eq('course_id', courseId)
            .eq('is_published', true)
            .order('exam_date', { ascending: false });

        if (examsError || !exams) {
            console.error('[ExamHistory] Fetch exams error:', examsError);
            return [];
        }

        // Filter out the current exam
        const filteredExams = excludeExamId 
            ? exams.filter(e => e.id !== excludeExamId)
            : exams;

        // Get scores for each exam
        const historyItems: ExamHistoryItem[] = [];

        for (const exam of filteredExams) {
            const { data: scores, error: scoresError } = await supabase
                .from('exam_scores')
                .select('student_id, score')
                .eq('exam_id', exam.id)
                .not('score', 'is', null);

            if (scoresError || !scores || scores.length === 0) {
                continue; // Skip exams with no scores
            }

            const validScores = scores.filter(s => s.score !== null);
            const avgScore = validScores.length > 0
                ? validScores.reduce((sum, s) => sum + (s.score || 0), 0) / validScores.length
                : 0;

            historyItems.push({
                examId: exam.id,
                examTitle: exam.title,
                date: exam.exam_date,
                studentScores: validScores.map(s => ({
                    studentId: s.student_id,
                    score: s.score || 0,
                })),
                avgScore: Math.round(avgScore * 10) / 10,
                completedCount: validScores.length,
            });
        }

        return historyItems;
    } catch (err) {
        console.error('[ExamHistory] Fetch error:', err);
        return [];
    }
};

/**
 * Get exam statistics
 */
export const getExamStatistics = async (examId: string): Promise<{
    totalStudents: number;
    gradedCount: number;
    avgScore: number;
    highestScore: number;
    lowestScore: number;
    passingCount: number;
} | null> => {
    if (!isSupabaseConfigured() || !supabase) {
        return null;
    }

    try {
        const { data: scores, error } = await supabase
            .from('exam_scores')
            .select('score')
            .eq('exam_id', examId)
            .not('score', 'is', null);

        if (error || !scores) {
            return null;
        }

        const validScores = scores.map(s => s.score).filter((s): s is number => s !== null);
        
        if (validScores.length === 0) {
            return {
                totalStudents: 0,
                gradedCount: 0,
                avgScore: 0,
                highestScore: 0,
                lowestScore: 0,
                passingCount: 0,
            };
        }

        const exam = await getExamById(examId);
        const passingScore = exam?.passing_score || 60;

        return {
            totalStudents: scores.length,
            gradedCount: validScores.length,
            avgScore: Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10,
            highestScore: Math.max(...validScores),
            lowestScore: Math.min(...validScores),
            passingCount: validScores.filter(s => s >= passingScore).length,
        };
    } catch (err) {
        console.error('[ExamStats] Fetch error:', err);
        return null;
    }
};
