/**
 * Database Service for Study Statistics
 * 
 * Syncs study time, streak, and course progress data to Supabase.
 * Falls back to localStorage when Supabase is not configured.
 * 
 * Database Tables Required (create in Supabase SQL Editor):
 * 
 * -- Student study statistics table
 * CREATE TABLE student_stats (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   student_id TEXT NOT NULL UNIQUE,
 *   study_time_data JSONB DEFAULT '{}',
 *   streak_data JSONB DEFAULT '{}',
 *   course_progress JSONB DEFAULT '{}',
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * -- Enable Row Level Security (optional but recommended)
 * ALTER TABLE student_stats ENABLE ROW LEVEL SECURITY;
 * 
 * -- Allow all operations for now (for demo purposes)
 * CREATE POLICY "Allow all" ON student_stats FOR ALL USING (true);
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { StudyTimeData, StreakData, CourseProgressData } from './studyTimeService';

const TABLE_NAME = 'student_stats';

// Get or create student ID (persisted in localStorage)
export const getStudentId = (): string => {
    let studentId = localStorage.getItem('student_id');
    if (!studentId) {
        // Generate a unique student ID
        studentId = `student_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        localStorage.setItem('student_id', studentId);
    }
    return studentId;
};

// Set a custom student ID (e.g., from login)
export const setStudentId = (id: string): void => {
    localStorage.setItem('student_id', id);
};

interface StudentStats {
    study_time_data: StudyTimeData;
    streak_data: StreakData;
    course_progress: CourseProgressData;
}

/**
 * Fetch student stats from database
 */
export const fetchStudentStats = async (): Promise<StudentStats | null> => {
    if (!isSupabaseConfigured() || !supabase) {
        console.log('[DB] Supabase not configured, using localStorage');
        return null;
    }

    try {
        const studentId = getStudentId();
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('study_time_data, streak_data, course_progress')
            .eq('student_id', studentId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No record found - this is okay for new students
                console.log('[DB] No existing record for student, will create on first save');
                return null;
            }
            console.error('[DB] Error fetching stats:', error);
            return null;
        }

        console.log('[DB] Successfully fetched stats from database');
        return data as StudentStats;
    } catch (err) {
        console.error('[DB] Failed to fetch stats:', err);
        return null;
    }
};


/**
 * Save student stats to database (upsert - insert or update)
 */
export const saveStudentStats = async (stats: Partial<StudentStats>): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) {
        return false;
    }

    try {
        const studentId = getStudentId();
        const { error } = await supabase
            .from(TABLE_NAME)
            .upsert({
                student_id: studentId,
                ...stats,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'student_id',
            });

        if (error) {
            console.error('[DB] Error saving stats:', error);
            return false;
        }

        console.log('[DB] Successfully saved stats to database');
        return true;
    } catch (err) {
        console.error('[DB] Failed to save stats:', err);
        return false;
    }
};

/**
 * Save study time data to database
 */
export const saveStudyTimeToDb = async (data: StudyTimeData): Promise<boolean> => {
    return saveStudentStats({ study_time_data: data });
};

/**
 * Save streak data to database
 */
export const saveStreakToDb = async (data: StreakData): Promise<boolean> => {
    return saveStudentStats({ streak_data: data });
};

/**
 * Save course progress to database
 */
export const saveCourseProgressToDb = async (data: CourseProgressData): Promise<boolean> => {
    return saveStudentStats({ course_progress: data });
};

/**
 * Sync all local data to database
 */
export const syncToDatabase = async (
    studyTime: StudyTimeData,
    streak: StreakData,
    courseProgress: CourseProgressData
): Promise<boolean> => {
    return saveStudentStats({
        study_time_data: studyTime,
        streak_data: streak,
        course_progress: courseProgress,
    });
};

/**
 * Initialize database - fetch existing data or prepare for new student
 */
export const initializeDatabase = async (): Promise<StudentStats | null> => {
    if (!isSupabaseConfigured()) {
        console.log('[DB] Supabase not configured - running in offline mode');
        return null;
    }
    
    console.log('[DB] Initializing database connection...');
    return fetchStudentStats();
};

/**
 * Reset database data to fresh defaults (0% progress, day 1 streak, etc.)
 * This resets the Supabase database record for the current student
 */
export const resetDatabaseToDefaults = async (): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) {
        console.log('[DB] Supabase not configured, skipping database reset');
        return false;
    }

    try {
        const studentId = getStudentId();
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        // Fresh study time data (0 hours)
        const freshStudyTime = {
            totalMinutes: 0,
            monthlyMinutes: 0,
            weeklyMinutes: 0,
            dailyMinutes: 0,
            lastUpdated: now.toISOString(),
            courseMinutes: {
                'cp1': 0, 'itc': 0, 'purcom': 0, 'euth1': 0, 'uts': 0,
                'pe1': 0, 'ppc': 0, 'tcw': 0, 'nstp1': 0,
            },
            dailyHistory: Array.from({ length: 7 }, (_, i) => {
                const date = new Date(now);
                date.setDate(date.getDate() - (6 - i));
                return { date: date.toISOString().split('T')[0], minutes: 0 };
            }),
        };
        
        // Fresh streak data (day 1)
        const freshStreak = {
            currentStreak: 1,
            bestStreak: 1,
            lastActiveDate: today,
            streakHistory: Array.from({ length: 7 }, (_, i) => {
                const date = new Date(now);
                date.setDate(date.getDate() - (6 - i));
                return { date: date.toISOString().split('T')[0], active: i === 6 };
            }),
        };
        
        // Fresh course progress (0% for all courses)
        const freshCourseProgress = {
            'cp1': { progress: 0, completedModules: 0, totalModules: 8, lastAccessed: now.toISOString(), timeSpent: 0 },
            'euth1': { progress: 0, completedModules: 0, totalModules: 6, lastAccessed: now.toISOString(), timeSpent: 0 },
            'itc': { progress: 0, completedModules: 0, totalModules: 10, lastAccessed: now.toISOString(), timeSpent: 0 },
            'nstp1': { progress: 0, completedModules: 0, totalModules: 8, lastAccessed: now.toISOString(), timeSpent: 0 },
            'pe1': { progress: 0, completedModules: 0, totalModules: 12, lastAccessed: now.toISOString(), timeSpent: 0 },
            'ppc': { progress: 0, completedModules: 0, totalModules: 8, lastAccessed: now.toISOString(), timeSpent: 0 },
            'purcom': { progress: 0, completedModules: 0, totalModules: 10, lastAccessed: now.toISOString(), timeSpent: 0 },
            'tcw': { progress: 0, completedModules: 0, totalModules: 9, lastAccessed: now.toISOString(), timeSpent: 0 },
            'uts': { progress: 0, completedModules: 0, totalModules: 8, lastAccessed: now.toISOString(), timeSpent: 0 },
        };
        
        const { error } = await supabase
            .from(TABLE_NAME)
            .upsert({
                student_id: studentId,
                study_time_data: freshStudyTime,
                streak_data: freshStreak,
                course_progress: freshCourseProgress,
                updated_at: now.toISOString(),
            }, {
                onConflict: 'student_id',
            });

        if (error) {
            console.error('[DB] Error resetting database:', error);
            return false;
        }

        console.log('[DB] Successfully reset database to fresh defaults');
        return true;
    } catch (err) {
        console.error('[DB] Failed to reset database:', err);
        return false;
    }
};

export default {
    getStudentId,
    setStudentId,
    fetchStudentStats,
    saveStudentStats,
    saveStudyTimeToDb,
    saveStreakToDb,
    saveCourseProgressToDb,
    syncToDatabase,
    initializeDatabase,
    resetDatabaseToDefaults,
    isSupabaseConfigured,
};
