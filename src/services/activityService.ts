/**
 * Activity Service for Recent Activity Tracking
 * 
 * Tracks and retrieves recent user activity (course access, materials viewed, etc.)
 * Syncs to Supabase when configured, falls back to localStorage.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getStudentId } from './databaseService';

export interface ActivityItem {
    id: string;
    type: 'course_access' | 'material_view' | 'assignment_submit' | 'quiz_complete' | 'module_complete';
    title: string;
    subtitle?: string;
    courseId?: string;
    courseName?: string;
    timestamp: string;
    icon?: string;
}

const STORAGE_KEY = 'recent_activity';
const MAX_ACTIVITIES = 20; // Store up to 20, display 5

/**
 * Get recent activities from storage/database
 */
export const getRecentActivities = async (limit: number = 5): Promise<ActivityItem[]> => {
    // Try Supabase first
    if (isSupabaseConfigured() && supabase) {
        try {
            const studentId = getStudentId();
            const { data, error } = await supabase
                .from('student_stats')
                .select('recent_activity')
                .eq('student_id', studentId)
                .single();

            if (!error && data?.recent_activity) {
                const activities = data.recent_activity as ActivityItem[];
                return activities.slice(0, limit);
            }
        } catch (err) {
            console.log('[Activity] Supabase fetch failed, using localStorage');
        }
    }

    // Fallback to localStorage
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const activities = JSON.parse(saved) as ActivityItem[];
            return activities.slice(0, limit);
        }
    } catch {
        console.log('[Activity] Failed to load from localStorage');
    }

    return [];
};

/**
 * Log a new activity
 */
export const logActivity = async (activity: Omit<ActivityItem, 'id' | 'timestamp'>): Promise<void> => {
    const newActivity: ActivityItem = {
        ...activity,
        id: `activity_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
    };

    // Get existing activities
    let activities: ActivityItem[] = [];
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            activities = JSON.parse(saved);
        }
    } catch {
        activities = [];
    }

    // Add new activity at the beginning, limit total
    activities = [newActivity, ...activities].slice(0, MAX_ACTIVITIES);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));

    // Sync to Supabase if configured
    if (isSupabaseConfigured() && supabase) {
        try {
            const studentId = getStudentId();
            await supabase
                .from('student_stats')
                .upsert({
                    student_id: studentId,
                    recent_activity: activities,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'student_id',
                });
        } catch (err) {
            console.log('[Activity] Failed to sync to Supabase:', err);
        }
    }
};

/**
 * Log course access activity
 */
export const logCourseAccess = async (courseId: string, courseName: string): Promise<void> => {
    await logActivity({
        type: 'course_access',
        title: courseName,
        subtitle: 'Opened course',
        courseId,
        courseName,
    });
};

/**
 * Log material view activity
 */
export const logMaterialView = async (materialTitle: string, courseId: string, courseName: string): Promise<void> => {
    await logActivity({
        type: 'material_view',
        title: materialTitle,
        subtitle: courseName,
        courseId,
        courseName,
    });
};

/**
 * Log module completion activity
 */
export const logModuleComplete = async (moduleTitle: string, courseId: string, courseName: string): Promise<void> => {
    await logActivity({
        type: 'module_complete',
        title: moduleTitle,
        subtitle: `Completed in ${courseName}`,
        courseId,
        courseName,
    });
};

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Get activity type icon name
 */
export const getActivityIcon = (type: ActivityItem['type']): string => {
    switch (type) {
        case 'course_access': return 'book';
        case 'material_view': return 'document';
        case 'assignment_submit': return 'clipboard';
        case 'quiz_complete': return 'check';
        case 'module_complete': return 'trophy';
        default: return 'activity';
    }
};

/**
 * Clear all activities (for testing/reset)
 */
export const clearActivities = async (): Promise<void> => {
    localStorage.removeItem(STORAGE_KEY);
    
    if (isSupabaseConfigured() && supabase) {
        try {
            const studentId = getStudentId();
            await supabase
                .from('student_stats')
                .update({ recent_activity: [] })
                .eq('student_id', studentId);
        } catch (err) {
            console.log('[Activity] Failed to clear from Supabase:', err);
        }
    }
};

export default {
    getRecentActivities,
    logActivity,
    logCourseAccess,
    logMaterialView,
    logModuleComplete,
    formatRelativeTime,
    getActivityIcon,
    clearActivities,
};
