        /**
 * Grade Predictor Service
 * 
 * Calculates predicted grades based on course progress data.
 * Syncs with Supabase for cloud storage and historical tracking.
 * Falls back to localStorage when offline.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getCourseProgressData, type CourseProgressData } from './studyTimeService';
import { getStudentId } from './databaseService';

// Course name mappings
const COURSE_NAMES: Record<string, string> = {
    'cp1': 'Computer Programming 1',
    'euth1': 'Euthenics 1',
    'itc': 'Intro to Computing',
    'nstp1': 'NSTP 1',
    'pe1': 'PE/PATHFIT 1',
    'ppc': 'Philippine Popular Culture',
    'purcom': 'Purposive Communication',
    'tcw': 'The Contemporary World',
    'uts': 'Understanding the Self',
};

export interface GradePrediction {
    predictedGrade: number;
    letterGrade: string;
    confidence: number;
    breakdown: { name: string; progress: number; contribution: number }[];
    lastUpdated: string;
}

export interface GradePredictionHistory {
    id?: string;
    student_id: string;
    prediction: GradePrediction;
    created_at: string;
}

/**
 * Convert percentage to Philippine grading system letter grade
 */
const getLetterGrade = (percentage: number): string => {
    if (percentage >= 97) return '1.00';
    if (percentage >= 94) return '1.25';
    if (percentage >= 91) return '1.50';
    if (percentage >= 88) return '1.75';
    if (percentage >= 85) return '2.00';
    if (percentage >= 82) return '2.25';
    if (percentage >= 79) return '2.50';
    if (percentage >= 76) return '2.75';
    if (percentage >= 75) return '3.00';
    return '5.00';
};

/**
 * Calculate grade prediction from course progress data
 */
export const calculateGradePrediction = (courseData: CourseProgressData): GradePrediction => {
    const courses = Object.entries(courseData);
    
    if (courses.length === 0) {
        return {
            predictedGrade: 0,
            letterGrade: 'N/A',
            confidence: 0,
            breakdown: [],
            lastUpdated: new Date().toISOString(),
        };
    }
    
    let totalWeight = 0;
    let weightedSum = 0;
    const breakdown: { name: string; progress: number; contribution: number }[] = [];
    
    courses.forEach(([id, data]) => {
        // Weight based on total modules (more modules = more weight)
        const weight = data.totalModules;
        totalWeight += weight;
        
        // Progress contributes to grade (0-100 scale)
        // Add bonus for completion (100% progress gets slight boost)
        const progressScore = data.progress;
        const completionBonus = data.progress === 100 ? 5 : 0;
        const adjustedScore = Math.min(100, progressScore + completionBonus);
        
        weightedSum += adjustedScore * weight;
        
        breakdown.push({
            name: COURSE_NAMES[id] || id,
            progress: data.progress,
            contribution: Math.round((adjustedScore * weight) / Math.max(totalWeight, 1)),
        });
    });
    
    const predictedGrade = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    const letterGrade = getLetterGrade(predictedGrade);
    
    // Confidence based on how much progress has been made
    const avgProgress = courses.reduce((sum, [, d]) => sum + d.progress, 0) / courses.length;
    const confidence = Math.min(100, Math.round(avgProgress * 1.2));
    
    // Sort breakdown by contribution (highest first)
    breakdown.sort((a, b) => b.contribution - a.contribution);
    
    return {
        predictedGrade,
        letterGrade,
        confidence,
        breakdown: breakdown.slice(0, 3), // Top 3 contributors
        lastUpdated: new Date().toISOString(),
    };
};

/**
 * Get grade prediction - fetches from Supabase if available, otherwise calculates locally
 */
export const getGradePrediction = async (): Promise<GradePrediction> => {
    // Always calculate from current course progress data
    const courseData = getCourseProgressData();
    const prediction = calculateGradePrediction(courseData);
    
    // Try to save to Supabase in background (non-blocking)
    saveGradePredictionToDb(prediction).catch(console.error);
    
    return prediction;
};

/**
 * Get grade prediction synchronously (for React useMemo)
 */
export const getGradePredictionSync = (): GradePrediction => {
    const courseData = getCourseProgressData();
    return calculateGradePrediction(courseData);
};

/**
 * Save grade prediction to Supabase for historical tracking
 */
export const saveGradePredictionToDb = async (prediction: GradePrediction): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) {
        return false;
    }
    
    try {
        const studentId = getStudentId();
        
        // Update the student_stats table with latest prediction
        // Note: grade_prediction column may not exist in older database schemas
        const { error } = await supabase
            .from('student_stats')
            .upsert({
                student_id: studentId,
                grade_prediction: prediction,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'student_id',
            });
        
        if (error) {
            // Silently fail if column doesn't exist (PGRST204 = column not found)
            if (error.code === 'PGRST204' || error.message?.includes('grade_prediction')) {
                console.log('[GradePredictor] grade_prediction column not in database schema - skipping sync');
                return false;
            }
            console.error('[GradePredictor] Error saving to database:', error);
            return false;
        }
        
        console.log('[GradePredictor] Saved prediction to database');
        return true;
    } catch (err) {
        console.error('[GradePredictor] Failed to save prediction:', err);
        return false;
    }
};

/**
 * Fetch grade prediction from Supabase
 */
export const fetchGradePredictionFromDb = async (): Promise<GradePrediction | null> => {
    if (!isSupabaseConfigured() || !supabase) {
        return null;
    }
    
    try {
        const studentId = getStudentId();
        
        const { data, error } = await supabase
            .from('student_stats')
            .select('grade_prediction')
            .eq('student_id', studentId)
            .single();
        
        // Silently return null if column doesn't exist
        if (error) {
            if (error.code === 'PGRST204' || error.message?.includes('grade_prediction')) {
                return null;
            }
            return null;
        }
        
        if (!data?.grade_prediction) {
            return null;
        }
        
        console.log('[GradePredictor] Loaded prediction from database');
        return data.grade_prediction as GradePrediction;
    } catch (err) {
        console.error('[GradePredictor] Failed to fetch prediction:', err);
        return null;
    }
};

/**
 * Get prediction history from Supabase (if grade_prediction_history table exists)
 */
export const getGradePredictionHistory = async (limit: number = 10): Promise<GradePredictionHistory[]> => {
    if (!isSupabaseConfigured() || !supabase) {
        return [];
    }
    
    try {
        const studentId = getStudentId();
        
        const { data, error } = await supabase
            .from('grade_prediction_history')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) {
            // Table might not exist - that's okay
            console.log('[GradePredictor] History table not available');
            return [];
        }
        
        return data as GradePredictionHistory[];
    } catch (err) {
        console.error('[GradePredictor] Failed to fetch history:', err);
        return [];
    }
};

export default {
    calculateGradePrediction,
    getGradePrediction,
    getGradePredictionSync,
    saveGradePredictionToDb,
    fetchGradePredictionFromDb,
    getGradePredictionHistory,
    COURSE_NAMES,
};
