/**
 * Study Time Tracking Service
 * Tracks real-time study hours, course progress, and learning statistics
 * 
 * Now with Supabase database sync! Data is saved both locally and to the cloud.
 */

import { 
    saveStudyTimeToDb, 
    saveStreakToDb, 
    saveCourseProgressToDb,
    initializeDatabase,
} from './databaseService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEYS = {
    STUDY_TIME: 'study-time-data',
    COURSE_PROGRESS: 'course-progress-data',
    STREAK_DATA: 'streak-data',
    SESSION_START: 'session-start-time',
    DB_INITIALIZED: 'db-initialized',
    STREAK_MIGRATED_V2: 'streak-migrated-v2', // Migration flag for accurate tracking
    DEMO_MODE: 'demo-mode-active', // Flag to skip database sync when demo data is loaded
};

export interface StudyTimeData {
    totalMinutes: number;
    monthlyMinutes: number;
    weeklyMinutes: number;
    dailyMinutes: number;
    lastUpdated: string;
    courseMinutes: Record<string, number>;
    dailyHistory: { date: string; minutes: number }[];
}

export interface StreakData {
    currentStreak: number;
    bestStreak: number;
    lastActiveDate: string;
    streakHistory: { date: string; active: boolean }[];
}

export interface CourseProgressData {
    [courseId: string]: {
        progress: number;
        completedModules: number;
        totalModules: number;
        lastAccessed: string;
        timeSpent: number; // in minutes
    };
}

// Default course data matching the actual courses - starts at 0%
const DEFAULT_COURSE_PROGRESS: CourseProgressData = {
    'cp1': { progress: 0, completedModules: 0, totalModules: 8, lastAccessed: new Date().toISOString(), timeSpent: 0 },
    'euth1': { progress: 0, completedModules: 0, totalModules: 6, lastAccessed: new Date().toISOString(), timeSpent: 0 },
    'itc': { progress: 0, completedModules: 0, totalModules: 10, lastAccessed: new Date().toISOString(), timeSpent: 0 },
    'nstp1': { progress: 0, completedModules: 0, totalModules: 8, lastAccessed: new Date().toISOString(), timeSpent: 0 },
    'pe1': { progress: 0, completedModules: 0, totalModules: 12, lastAccessed: new Date().toISOString(), timeSpent: 0 },
    'ppc': { progress: 0, completedModules: 0, totalModules: 8, lastAccessed: new Date().toISOString(), timeSpent: 0 },
    'purcom': { progress: 0, completedModules: 0, totalModules: 10, lastAccessed: new Date().toISOString(), timeSpent: 0 },
    'tcw': { progress: 0, completedModules: 0, totalModules: 9, lastAccessed: new Date().toISOString(), timeSpent: 0 },
    'uts': { progress: 0, completedModules: 0, totalModules: 8, lastAccessed: new Date().toISOString(), timeSpent: 0 },
};

// Initialize default study time data - starts at 0
const getDefaultStudyTimeData = (): StudyTimeData => {
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (6 - i));
        return {
            date: date.toISOString().split('T')[0],
            minutes: 0,
        };
    });
    
    return {
        totalMinutes: 0,
        monthlyMinutes: 0,
        weeklyMinutes: 0,
        dailyMinutes: 0,
        lastUpdated: now.toISOString(),
        courseMinutes: {
            'cp1': 0,
            'itc': 0,
            'purcom': 0,
            'euth1': 0,
            'uts': 0,
            'pe1': 0,
            'ppc': 0,
            'tcw': 0,
            'nstp1': 0,
        },
        dailyHistory: last7Days,
    };
};

// Initialize default streak data - starts fresh at day 1
const getDefaultStreakData = (): StreakData => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Generate last 7 days with only today as active
    const last7Days: { date: string; active: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days.push({ 
            date: dateStr, 
            active: i === 0 // Only today is active
        });
    }
    
    return {
        currentStreak: 1, // Start at day 1
        bestStreak: 1,
        lastActiveDate: today,
        streakHistory: last7Days,
    };
};

// Get study time data from localStorage
export const getStudyTimeData = (): StudyTimeData => {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.STUDY_TIME);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Ensure all required fields exist (handle corrupted/old data)
            const defaultData = getDefaultStudyTimeData();
            return {
                totalMinutes: parsed.totalMinutes ?? defaultData.totalMinutes,
                monthlyMinutes: parsed.monthlyMinutes ?? defaultData.monthlyMinutes,
                weeklyMinutes: parsed.weeklyMinutes ?? defaultData.weeklyMinutes,
                dailyMinutes: parsed.dailyMinutes ?? defaultData.dailyMinutes,
                lastUpdated: parsed.lastUpdated ?? defaultData.lastUpdated,
                courseMinutes: parsed.courseMinutes ?? defaultData.courseMinutes,
                dailyHistory: parsed.dailyHistory ?? defaultData.dailyHistory,
            };
        }
    } catch (e) {
        console.error('Failed to load study time data:', e);
    }
    const defaultData = getDefaultStudyTimeData();
    localStorage.setItem(STORAGE_KEYS.STUDY_TIME, JSON.stringify(defaultData));
    return defaultData;
};

// Get streak data from localStorage (with validation)
export const getStreakData = (): StreakData => {
    // Check if we need to migrate to accurate tracking (one-time reset)
    const migrated = localStorage.getItem(STORAGE_KEYS.STREAK_MIGRATED_V2);
    if (!migrated) {
        // First time with accurate tracking - reset to fresh start
        console.log('[Streak] Migrating to accurate date tracking...');
        localStorage.setItem(STORAGE_KEYS.STREAK_MIGRATED_V2, 'true');
        const freshData = getDefaultStreakData();
        localStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify(freshData));
        return freshData;
    }
    
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.STREAK_DATA);
        if (saved) {
            const data = JSON.parse(saved) as StreakData;
            // Validate and fix the streak history to ensure accurate dates
            const validatedData = validateStreakHistory(data);
            // Save the validated data back
            localStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify(validatedData));
            return validatedData;
        }
    } catch (e) {
        console.error('Failed to load streak data:', e);
    }
    const defaultData = getDefaultStreakData();
    localStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify(defaultData));
    return defaultData;
};

// Get course progress data from localStorage
export const getCourseProgressData = (): CourseProgressData => {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.COURSE_PROGRESS);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Ensure all 9 default courses exist (merge with defaults)
            if (Object.keys(parsed).length === 0) {
                // Empty object from database - use defaults
                localStorage.setItem(STORAGE_KEYS.COURSE_PROGRESS, JSON.stringify(DEFAULT_COURSE_PROGRESS));
                return DEFAULT_COURSE_PROGRESS;
            }
            // Merge with defaults to ensure all courses exist
            const merged = { ...DEFAULT_COURSE_PROGRESS };
            Object.keys(parsed).forEach(courseId => {
                merged[courseId] = parsed[courseId];
            });
            // Save merged data back if it was incomplete
            if (Object.keys(parsed).length < Object.keys(DEFAULT_COURSE_PROGRESS).length) {
                localStorage.setItem(STORAGE_KEYS.COURSE_PROGRESS, JSON.stringify(merged));
            }
            return merged;
        }
    } catch (e) {
        console.error('Failed to load course progress data:', e);
    }
    localStorage.setItem(STORAGE_KEYS.COURSE_PROGRESS, JSON.stringify(DEFAULT_COURSE_PROGRESS));
    return DEFAULT_COURSE_PROGRESS;
};

// Save study time data (local + database)
export const saveStudyTimeData = (data: StudyTimeData): void => {
    localStorage.setItem(STORAGE_KEYS.STUDY_TIME, JSON.stringify(data));
    // Async save to database (non-blocking)
    saveStudyTimeToDb(data).catch(console.error);
};

// Save streak data (local + database)
export const saveStreakData = (data: StreakData): void => {
    localStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify(data));
    // Async save to database (non-blocking)
    saveStreakToDb(data).catch(console.error);
};

// Reset streak data to start fresh (for testing or manual reset)
export const resetStreakData = (): StreakData => {
    const defaultData = getDefaultStreakData();
    localStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify(defaultData));
    return defaultData;
};

// Validate and fix streak history to ensure accurate dates
// NOTE: This function should NOT modify lastActiveDate or currentStreak - 
// that's the job of updateStreak(). This only validates/fixes the history array.
const validateStreakHistory = (data: StreakData): StreakData => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Handle missing or invalid data - return fresh defaults
    if (!data || !data.lastActiveDate) {
        return getDefaultStreakData();
    }
    
    // Ensure streakHistory is an array (might be undefined from database)
    const streakHistory = Array.isArray(data.streakHistory) ? data.streakHistory : [];
    
    // Check if this is old fake data (migration check)
    // If lastActiveDate is way in the past or data looks suspicious, reset
    const lastActiveDate = new Date(data.lastActiveDate);
    const daysSinceLastActive = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If more than 1 day has passed (not yesterday, not today), streak should be reset
    const shouldResetStreak = daysSinceLastActive > 1;
    
    // Generate accurate last 7 days
    const last7Days: { date: string; active: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Only keep active status for dates that were actually tracked
        // and only if the streak hasn't been broken
        let isActive = false;
        if (!shouldResetStreak && streakHistory.length > 0) {
            const existingEntry = streakHistory.find(h => h.date === dateStr);
            isActive = existingEntry?.active || false;
        }
        
        // If lastActiveDate is today, mark today as active
        if (dateStr === today && data.lastActiveDate === today) {
            isActive = true;
        }
        
        last7Days.push({ date: dateStr, active: isActive });
    }
    
    // Only reset streak if it's been broken (more than 1 day since last active)
    // Don't modify streak if user was active yesterday or today - let updateStreak handle that
    let currentStreak = data.currentStreak || 0;
    if (shouldResetStreak) {
        // Streak is broken - but don't set to 1 yet, let updateStreak do that when user logs in
        currentStreak = 0;
    }
    
    return {
        currentStreak: currentStreak,
        bestStreak: data.bestStreak || 0,
        lastActiveDate: data.lastActiveDate, // Don't change this - let updateStreak handle it
        streakHistory: last7Days,
    };
};

// Save course progress data (local + database)
export const saveCourseProgressData = (data: CourseProgressData): void => {
    localStorage.setItem(STORAGE_KEYS.COURSE_PROGRESS, JSON.stringify(data));
    // Async save to database (non-blocking)
    saveCourseProgressToDb(data).catch(console.error);
};

// Start a study session
export const startStudySession = (): void => {
    localStorage.setItem(STORAGE_KEYS.SESSION_START, Date.now().toString());
};

// End study session and update time
export const endStudySession = (courseId?: string): number => {
    const startTime = localStorage.getItem(STORAGE_KEYS.SESSION_START);
    if (!startTime) return 0;
    
    const sessionMinutes = Math.floor((Date.now() - parseInt(startTime)) / 60000);
    localStorage.removeItem(STORAGE_KEYS.SESSION_START);
    
    if (sessionMinutes > 0) {
        addStudyTime(sessionMinutes, courseId);
    }
    
    return sessionMinutes;
};

// Add study time manually
export const addStudyTime = (minutes: number, courseId?: string): void => {
    const data = getStudyTimeData();
    const today = new Date().toISOString().split('T')[0];
    
    data.totalMinutes += minutes;
    data.monthlyMinutes += minutes;
    data.weeklyMinutes += minutes;
    data.dailyMinutes += minutes;
    data.lastUpdated = new Date().toISOString();
    
    if (courseId) {
        data.courseMinutes[courseId] = (data.courseMinutes[courseId] || 0) + minutes;
    }
    
    // Update daily history
    const todayEntry = data.dailyHistory.find(d => d.date === today);
    if (todayEntry) {
        todayEntry.minutes += minutes;
    } else {
        data.dailyHistory.push({ date: today, minutes });
        // Keep only last 30 days
        if (data.dailyHistory.length > 30) {
            data.dailyHistory = data.dailyHistory.slice(-30);
        }
    }
    
    saveStudyTimeData(data);
    updateStreak();
};

// Update streak based on activity - tracks daily logins and awards XP
export const updateStreak = (): void => {
    const data = getStreakData();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Already logged in today - no update needed
    if (data.lastActiveDate === today) {
        return;
    }
    
    // Check if user logged in yesterday (continuing streak)
    if (data.lastActiveDate === yesterdayStr) {
        // Continuing streak - increment by 1
        data.currentStreak += 1;
        if (data.currentStreak > data.bestStreak) {
            data.bestStreak = data.currentStreak;
        }
    } else {
        // Streak broken or first login - start at day 1
        data.currentStreak = 1;
    }
    
    data.lastActiveDate = today;
    
    // Update history - mark today as active
    const todayEntry = data.streakHistory.find(h => h.date === today);
    if (todayEntry) {
        todayEntry.active = true;
    } else {
        data.streakHistory.push({ date: today, active: true });
        // Keep only last 30 days
        if (data.streakHistory.length > 30) {
            data.streakHistory = data.streakHistory.slice(-30);
        }
    }
    
    saveStreakData(data);
    
    // Award XP based on streak tier (daily login bonus)
    const tier = getStreakTier(data.currentStreak);
    addXP(tier.xpBonus);
    console.log(`[Streak] Day ${data.currentStreak} streak! Awarded ${tier.xpBonus} XP`);
};

// Get streak tier info based on current streak
export const getStreakTier = (streak: number): { 
    tier: 'starter' | 'warming' | 'blazing' | 'legendary';
    bgGradient: string;
    borderColor: string;
    textColor: string;
    subTextColor: string;
    flameEmoji: string;
    xpBonus: number;
} => {
    if (streak >= 10) {
        // Legendary tier - Yellow and Blue gradient
        return {
            tier: 'legendary',
            bgGradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
            borderColor: 'rgba(251, 191, 36, 0.4)',
            textColor: '#b45309', // amber-700
            subTextColor: 'rgba(180, 83, 9, 0.7)',
            flameEmoji: '🔥✨',
            xpBonus: 50,
        };
    } else if (streak >= 3) {
        // Warming tier - Default orange/amber
        return {
            tier: 'warming',
            bgGradient: 'linear-gradient(to right, rgba(251, 191, 36, 0.1), rgba(249, 115, 22, 0.1))',
            borderColor: 'rgba(251, 191, 36, 0.5)',
            textColor: '#92400e', // amber-800
            subTextColor: 'rgba(146, 64, 14, 0.8)',
            flameEmoji: '🔥',
            xpBonus: 15,
        };
    } else {
        // Starter tier - Blue (days 1-2)
        return {
            tier: 'starter',
            bgGradient: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))',
            borderColor: 'rgba(59, 130, 246, 0.3)',
            textColor: '#1d4ed8', // blue-700
            subTextColor: 'rgba(29, 78, 216, 0.7)',
            flameEmoji: '💧',
            xpBonus: 5,
        };
    }
};

// Calculate overall progress from all courses
export const calculateOverallProgress = (): number => {
    const courseData = getCourseProgressData();
    const courses = Object.values(courseData);
    if (courses.length === 0) return 0;
    
    const totalProgress = courses.reduce((sum, c) => sum + c.progress, 0);
    return Math.round(totalProgress / courses.length);
};

// Get completed courses count
export const getCompletedCoursesCount = (): number => {
    const courseData = getCourseProgressData();
    return Object.values(courseData).filter(c => c.progress === 100).length;
};

// Get in-progress courses count (courses with progress > 0 but < 100)
export const getInProgressCoursesCount = (): number => {
    const courseData = getCourseProgressData();
    return Object.values(courseData).filter(c => c.progress > 0 && c.progress < 100).length;
};

// Get total enrolled courses count (all courses regardless of progress)
export const getTotalEnrolledCoursesCount = (): number => {
    const courseData = getCourseProgressData();
    return Object.keys(courseData).length;
};

// Get not started courses count (courses with 0% progress)
export const getNotStartedCoursesCount = (): number => {
    const courseData = getCourseProgressData();
    return Object.values(courseData).filter(c => c.progress === 0).length;
};

// Format minutes to hours string
export const formatMinutesToHours = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
};

// Get study time for display (in hours)
export const getStudyTimeHours = (): number => {
    const data = getStudyTimeData();
    return Math.round(data.monthlyMinutes / 60);
};

// Get daily average in hours
export const getDailyAverageHours = (): string => {
    const data = getStudyTimeData();
    // Safety check for undefined or missing dailyHistory
    const dailyHistory = data?.dailyHistory || [];
    const daysWithActivity = dailyHistory.filter(d => d.minutes > 0).length || 1;
    const weeklyMinutes = data?.weeklyMinutes || 0;
    const avgMinutes = Math.round(weeklyMinutes / Math.min(daysWithActivity, 7));
    return `${(avgMinutes / 60).toFixed(1)}h`;
};

// Get time left for course (estimated)
export const getTimeLeftForCourse = (courseId: string): string => {
    const courseData = getCourseProgressData();
    const course = courseData[courseId];
    if (!course || course.progress === 100) return '0h';
    
    const avgTimePerModule = course.timeSpent / Math.max(course.completedModules, 1);
    const remainingModules = course.totalModules - course.completedModules;
    const estimatedMinutes = Math.round(avgTimePerModule * remainingModules);
    
    return formatMinutesToHours(estimatedMinutes);
};

// Initialize tracking on app load (with database sync)
export const initializeTracking = async (): Promise<void> => {
    // Check if demo mode is active - skip database sync to preserve demo data
    const isDemoMode = localStorage.getItem(STORAGE_KEYS.DEMO_MODE) === 'true';
    
    // Try to load from database first (only if NOT in demo mode)
    if (isSupabaseConfigured() && !isDemoMode) {
        try {
            const dbData = await initializeDatabase();
            if (dbData) {
                // Merge database data with local (database takes priority, but only if data is valid)
                if (dbData.study_time_data && Object.keys(dbData.study_time_data).length > 0) {
                    localStorage.setItem(STORAGE_KEYS.STUDY_TIME, JSON.stringify(dbData.study_time_data));
                }
                if (dbData.streak_data && dbData.streak_data.lastActiveDate) {
                    localStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify(dbData.streak_data));
                }
                // Only use database course_progress if it has actual courses (not empty)
                if (dbData.course_progress && Object.keys(dbData.course_progress).length > 0) {
                    // Merge with defaults to ensure all 9 courses exist
                    const mergedProgress = { ...DEFAULT_COURSE_PROGRESS };
                    Object.keys(dbData.course_progress).forEach(courseId => {
                        if (mergedProgress[courseId]) {
                            mergedProgress[courseId] = dbData.course_progress[courseId];
                        }
                    });
                    localStorage.setItem(STORAGE_KEYS.COURSE_PROGRESS, JSON.stringify(mergedProgress));
                }
                console.log('[StudyTime] Loaded data from database');
            }
            
            // Also load XP data from database
            await initializeXP();
        } catch (err) {
            console.error('[StudyTime] Failed to load from database:', err);
        }
    } else if (isDemoMode) {
        console.log('[StudyTime] Demo mode active - skipping database sync');
    }
    
    // Ensure data exists (creates defaults if needed)
    getStudyTimeData();
    getStreakData();
    getCourseProgressData();
    getXPData(); // Ensure XP data exists

    // Award missing XP for existing streaks (one-time migration)
    if (!isDemoMode) {
        awardMissingStreakXP();
    }

    // Start session tracking
    startStudySession();

    // Update streak for today (skip in demo mode to preserve demo streak)
    if (!isDemoMode) {
        updateStreak();
    }
    
    // Set up periodic save (every minute) - skip in demo mode
    if (!isDemoMode) {
        setInterval(() => {
            const startTime = localStorage.getItem(STORAGE_KEYS.SESSION_START);
            if (startTime) {
                const sessionMinutes = Math.floor((Date.now() - parseInt(startTime)) / 60000);
                if (sessionMinutes > 0) {
                    // Update session start to now to avoid double counting
                    localStorage.setItem(STORAGE_KEYS.SESSION_START, Date.now().toString());
                    addStudyTime(1); // Add 1 minute
                }
            }
        }, 60000);
    }
};

// ============================================
// XP & Level System
// ============================================

const XP_PER_LEVEL = 100; // XP needed to level up
const XP_STORAGE_KEY = 'user-xp-data';
const XP_MIGRATED_KEY = 'xp-migrated-v2'; // Fresh start flag
const STREAK_XP_AWARDED_KEY = 'streak-xp-awarded-v1'; // Track if we've awarded XP for existing streak

export interface XPData {
    totalXP: number;
    currentLevel: number;
    xpInCurrentLevel: number;
    lastLevelUp: string | null;
}

// Calculate level from total XP
const calculateLevel = (totalXP: number): { level: number; xpInLevel: number } => {
    const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
    const xpInLevel = totalXP % XP_PER_LEVEL;
    return { level, xpInLevel };
};

// Save XP to database
const saveXPToDatabase = async (data: XPData): Promise<void> => {
    if (!isSupabaseConfigured() || !supabase) return;
    
    try {
        const studentId = localStorage.getItem('student_id');
        if (!studentId) return;
        
        await supabase
            .from('student_stats')
            .upsert({
                student_id: studentId,
                xp_data: data,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'student_id',
            });
        console.log('[XP] Saved to database');
    } catch (err) {
        console.error('[XP] Failed to save to database:', err);
    }
};

// Load XP from database
const loadXPFromDatabase = async (): Promise<XPData | null> => {
    if (!isSupabaseConfigured() || !supabase) return null;
    
    try {
        const studentId = localStorage.getItem('student_id');
        if (!studentId) return null;
        
        const { data, error } = await supabase
            .from('student_stats')
            .select('xp_data')
            .eq('student_id', studentId)
            .single();
        
        if (error || !data?.xp_data) return null;
        
        console.log('[XP] Loaded from database');
        return data.xp_data as XPData;
    } catch (err) {
        console.error('[XP] Failed to load from database:', err);
        return null;
    }
};

// Get default XP data (fresh start at level 1)
const getDefaultXPData = (): XPData => {
    return {
        totalXP: 0,
        currentLevel: 1,
        xpInCurrentLevel: 0,
        lastLevelUp: null,
    };
};

// Get XP data from localStorage (with fresh start)
export const getXPData = (): XPData => {
    // Check if we need to start fresh
    const migrated = localStorage.getItem(XP_MIGRATED_KEY);
    if (!migrated) {
        console.log('[XP] Starting fresh at level 1');
        localStorage.setItem(XP_MIGRATED_KEY, 'true');
        const freshData = getDefaultXPData();
        localStorage.setItem(XP_STORAGE_KEY, JSON.stringify(freshData));
        // Save to database async
        saveXPToDatabase(freshData);
        return freshData;
    }
    
    try {
        const saved = localStorage.getItem(XP_STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Failed to load XP data:', e);
    }
    
    const defaultData = getDefaultXPData();
    localStorage.setItem(XP_STORAGE_KEY, JSON.stringify(defaultData));
    return defaultData;
};

// Initialize XP from database (call on app load)
export const initializeXP = async (): Promise<void> => {
    const dbData = await loadXPFromDatabase();
    if (dbData) {
        localStorage.setItem(XP_STORAGE_KEY, JSON.stringify(dbData));
        localStorage.setItem(XP_MIGRATED_KEY, 'true');
    }
};

// Save XP data (local + database)
export const saveXPData = (data: XPData): void => {
    localStorage.setItem(XP_STORAGE_KEY, JSON.stringify(data));
    // Save to database async
    saveXPToDatabase(data);
};

// Add XP and check for level up
export const addXP = (amount: number): { leveledUp: boolean; newLevel: number } => {
    const data = getXPData();
    const oldLevel = data.currentLevel;
    
    data.totalXP += amount;
    const { level, xpInLevel } = calculateLevel(data.totalXP);
    data.currentLevel = level;
    data.xpInCurrentLevel = xpInLevel;
    
    const leveledUp = level > oldLevel;
    if (leveledUp) {
        data.lastLevelUp = new Date().toISOString();
    }
    
    saveXPData(data);
    return { leveledUp, newLevel: level };
};

// Get XP progress percentage (0-100)
export const getXPProgress = (): number => {
    const data = getXPData();
    return Math.round((data.xpInCurrentLevel / XP_PER_LEVEL) * 100);
};

// Get current level
export const getCurrentLevel = (): number => {
    return getXPData().currentLevel;
};

// Check if user just leveled up (within last 5 seconds)
export const checkRecentLevelUp = (): boolean => {
    const data = getXPData();
    if (!data.lastLevelUp) return false;
    
    const levelUpTime = new Date(data.lastLevelUp).getTime();
    const now = Date.now();
    return (now - levelUpTime) < 5000; // Within 5 seconds
};

// Clear level up notification
export const clearLevelUpNotification = (): void => {
    const data = getXPData();
    data.lastLevelUp = null;
    saveXPData(data);
};

// Award XP for existing streak (one-time migration for users who had streaks before XP system was connected)
export const awardMissingStreakXP = (): void => {
    // Check if we've already done this migration
    const alreadyAwarded = localStorage.getItem(STREAK_XP_AWARDED_KEY);
    if (alreadyAwarded) return;

    const streakData = getStreakData();
    const xpData = getXPData();

    // Only award if user has a streak but 0 XP (meaning they earned streak before XP was connected)
    if (streakData.currentStreak > 0 && xpData.totalXP === 0) {
        // Calculate total XP they should have earned
        let totalXPToAward = 0;
        for (let day = 1; day <= streakData.currentStreak; day++) {
            const tier = getStreakTier(day);
            totalXPToAward += tier.xpBonus;
        }

        if (totalXPToAward > 0) {
            addXP(totalXPToAward);
            console.log(
                `[XP Migration] Awarded ${totalXPToAward} XP for ${streakData.currentStreak}-day streak`
            );
        }
    }

    // Mark migration as complete
    localStorage.setItem(STREAK_XP_AWARDED_KEY, 'true');
};

// Check if demo mode is active
export const isDemoModeActive = (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.DEMO_MODE) === 'true';
};

// Clear demo mode and restore normal operation
export const clearDemoMode = (): void => {
    localStorage.removeItem(STORAGE_KEYS.DEMO_MODE);
    console.log('[Demo] Demo mode cleared');
};

// Reset all data to defaults (clears localStorage and database)
export const resetAllData = async (): Promise<void> => {
    console.log('[StudyTime] Resetting all data...');
    
    // Clear all localStorage keys (study time service keys)
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
    localStorage.removeItem(XP_STORAGE_KEY);
    localStorage.removeItem(XP_MIGRATED_KEY);
    localStorage.removeItem(STREAK_XP_AWARDED_KEY);
    localStorage.removeItem('student_id'); // Reset student ID too
    
    // Clear demo-specific data
    localStorage.removeItem('demo-course-modules');
    localStorage.removeItem('demo-students');
    localStorage.removeItem('demo-teachers');
    localStorage.removeItem('demo-ai-grades');
    localStorage.removeItem('dashboard-deadlines');
    localStorage.removeItem('dashboard-todos');
    
    // Clear teacher mode and AI grading data for all courses
    const courseIds = ['cp1', 'euth1', 'itc', 'nstp1', 'pe1', 'ppc', 'purcom', 'tcw', 'uts'];
    courseIds.forEach(courseId => {
        localStorage.removeItem(`ai-grading-${courseId}`);
    });
    
    // Clear teacher mode session state
    sessionStorage.removeItem('teacher_mode_active');
    sessionStorage.removeItem('teacher_mode_tab');
    
    // Reset to fresh defaults
    const freshStudyTime = getDefaultStudyTimeData();
    const freshStreak = getDefaultStreakData();
    const freshCourseProgress = DEFAULT_COURSE_PROGRESS;
    const freshXP = getDefaultXPData();
    
    // Save fresh data to localStorage
    localStorage.setItem(STORAGE_KEYS.STUDY_TIME, JSON.stringify(freshStudyTime));
    localStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify(freshStreak));
    localStorage.setItem(STORAGE_KEYS.COURSE_PROGRESS, JSON.stringify(freshCourseProgress));
    localStorage.setItem(XP_STORAGE_KEY, JSON.stringify(freshXP));
    localStorage.setItem(STORAGE_KEYS.STREAK_MIGRATED_V2, 'true');
    localStorage.setItem(XP_MIGRATED_KEY, 'true');
    
    // Reset Supabase database to fresh defaults
    if (isSupabaseConfigured() && supabase) {
        try {
            const { resetDatabaseToDefaults } = await import('./databaseService');
            await resetDatabaseToDefaults();
            console.log('[StudyTime] Database reset to fresh defaults');
        } catch (err) {
            console.error('[StudyTime] Failed to reset database:', err);
        }
    }
    
    console.log('[StudyTime] All data reset successfully (localStorage + Database)');
};

// Demo data for showcase purposes (temporary, clears on refresh)
const DEMO_COURSE_PROGRESS: CourseProgressData = {
    'cp1': { progress: 75, completedModules: 6, totalModules: 8, lastAccessed: new Date().toISOString(), timeSpent: 720 },
    'euth1': { progress: 100, completedModules: 6, totalModules: 6, lastAccessed: new Date(Date.now() - 86400000).toISOString(), timeSpent: 360 },
    'itc': { progress: 45, completedModules: 4, totalModules: 10, lastAccessed: new Date(Date.now() - 259200000).toISOString(), timeSpent: 480 },
    'nstp1': { progress: 30, completedModules: 2, totalModules: 8, lastAccessed: new Date(Date.now() - 604800000).toISOString(), timeSpent: 180 },
    'pe1': { progress: 50, completedModules: 6, totalModules: 12, lastAccessed: new Date(Date.now() - 18000000).toISOString(), timeSpent: 300 },
    'ppc': { progress: 40, completedModules: 3, totalModules: 8, lastAccessed: new Date(Date.now() - 1209600000).toISOString(), timeSpent: 240 },
    'purcom': { progress: 65, completedModules: 6, totalModules: 10, lastAccessed: new Date(Date.now() - 345600000).toISOString(), timeSpent: 420 },
    'tcw': { progress: 35, completedModules: 3, totalModules: 9, lastAccessed: new Date(Date.now() - 518400000).toISOString(), timeSpent: 210 },
    'uts': { progress: 55, completedModules: 4, totalModules: 8, lastAccessed: new Date(Date.now() - 3600000).toISOString(), timeSpent: 330 },
};

// Load demo data (temporary - does NOT sync to database, clears on refresh)
export const loadDemoData = (): void => {
    console.log('[Demo] Loading demo data...');
    
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (6 - i));
        return {
            date: date.toISOString().split('T')[0],
            minutes: Math.floor(Math.random() * 60) + 30 + (i * 10),
        };
    });
    
    const totalFromHistory = last7Days.reduce((sum, d) => sum + d.minutes, 0);
    
    // Demo study time data
    const demoStudyTime: StudyTimeData = {
        totalMinutes: 2640,
        monthlyMinutes: 2640,
        weeklyMinutes: totalFromHistory,
        dailyMinutes: last7Days[6].minutes,
        lastUpdated: now.toISOString(),
        courseMinutes: {
            'cp1': 720,
            'itc': 480,
            'purcom': 420,
            'euth1': 360,
            'uts': 330,
            'pe1': 300,
            'ppc': 240,
            'tcw': 210,
            'nstp1': 180,
        },
        dailyHistory: last7Days,
    };
    
    // Demo streak data
    const streakHistory = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (6 - i));
        return { date: date.toISOString().split('T')[0], active: i >= 4 }; // Last 3 days active
    });
    
    const demoStreak: StreakData = {
        currentStreak: 12,
        bestStreak: 15,
        lastActiveDate: now.toISOString().split('T')[0],
        streakHistory,
    };
    
    // Demo XP data
    const demoXP: XPData = {
        totalXP: 450,
        currentLevel: 5,
        xpInCurrentLevel: 50,
        lastLevelUp: null,
    };
    
    // Save to localStorage only (NOT to database - temporary demo)
    localStorage.setItem(STORAGE_KEYS.STUDY_TIME, JSON.stringify(demoStudyTime));
    localStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify(demoStreak));
    localStorage.setItem(STORAGE_KEYS.COURSE_PROGRESS, JSON.stringify(DEMO_COURSE_PROGRESS));
    localStorage.setItem(XP_STORAGE_KEY, JSON.stringify(demoXP));
    
    // Also load demo deadlines
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const threeDays = new Date(now);
    threeDays.setDate(threeDays.getDate() + 3);
    const fiveDays = new Date(now);
    fiveDays.setDate(fiveDays.getDate() + 5);
    
    const demoDeadlines = [
        { id: '1', title: 'Quiz: Programming Basics', type: 'quiz', courseId: 'cp1', courseName: 'Computer Programming 1', dueDate: tomorrow.toISOString(), completed: false, createdAt: now.toISOString() },
        { id: '2', title: 'Assignment: Essay Draft', type: 'assignment', courseId: 'purcom', courseName: 'Purposive Communication', dueDate: threeDays.toISOString(), completed: false, createdAt: now.toISOString() },
        { id: '3', title: 'Performance Task', type: 'performance', courseId: 'ppc', courseName: 'Philippine Popular Culture', dueDate: fiveDays.toISOString(), completed: false, createdAt: now.toISOString() },
    ];
    localStorage.setItem('dashboard-deadlines', JSON.stringify(demoDeadlines));
    
    // Demo to-do items
    const demoTodos = [
        { id: '1', text: 'Review Chapter 5 notes', completed: true, createdAt: new Date(now.getTime() - 86400000).toISOString() },
        { id: '2', text: 'Complete programming exercise', completed: false, createdAt: new Date(now.getTime() - 43200000).toISOString() },
        { id: '3', text: 'Prepare for quiz tomorrow', completed: false, createdAt: now.toISOString() },
        { id: '4', text: 'Submit essay outline', completed: false, createdAt: now.toISOString() },
    ];
    localStorage.setItem('dashboard-todos', JSON.stringify(demoTodos));
    
    // Demo course modules with progress
    const demoCourseModules = {
        'cp1': {
            modules: [
                { id: 1, title: 'Module 1: Introduction to Programming', status: 'completed', contents: [
                    { type: 'handout-a', title: 'Course Overview', completed: true },
                    { type: 'handout-b', title: 'Getting Started Guide', completed: true },
                    { type: 'slideshow', title: 'Introduction Slides', completed: true },
                    { type: 'video', title: 'Welcome Video', completed: true },
                ]},
                { id: 2, title: 'Module 2: Variables and Data Types', status: 'completed', contents: [
                    { type: 'handout-a', title: 'Variables Explained', completed: true },
                    { type: 'handout-b', title: 'Data Types Reference', completed: true },
                    { type: 'slideshow', title: 'Variables & Types Slides', completed: true },
                    { type: 'video', title: 'Coding Demo: Variables', completed: true },
                ]},
                { id: 3, title: 'Module 3: Control Structures', status: 'completed', contents: [
                    { type: 'handout-a', title: 'If-Else Statements', completed: true },
                    { type: 'handout-b', title: 'Loops Guide', completed: true },
                    { type: 'slideshow', title: 'Control Flow Slides', completed: true },
                    { type: 'video', title: 'Loop Examples Video', completed: true },
                ]},
                { id: 4, title: 'Module 4: Functions and Methods', status: 'completed', contents: [
                    { type: 'handout-a', title: 'Functions Basics', completed: true },
                    { type: 'handout-b', title: 'Method Parameters', completed: true },
                    { type: 'slideshow', title: 'Functions Slides', completed: true },
                    { type: 'video', title: 'Function Demo', completed: true },
                ]},
                { id: 5, title: 'Module 5: Arrays and Collections', status: 'completed', contents: [
                    { type: 'handout-a', title: 'Arrays Introduction', completed: true },
                    { type: 'handout-b', title: 'List Operations', completed: true },
                    { type: 'slideshow', title: 'Collections Slides', completed: true },
                    { type: 'video', title: 'Array Demo', completed: true },
                ]},
                { id: 6, title: 'Module 6: Object-Oriented Programming', status: 'in-progress', contents: [
                    { type: 'handout-a', title: 'OOP Concepts', completed: true },
                    { type: 'handout-b', title: 'Classes and Objects', completed: true },
                    { type: 'slideshow', title: 'OOP Slides', completed: false },
                    { type: 'video', title: 'OOP Demo', completed: false },
                ]},
                { id: 7, title: 'Module 7: File Handling', status: 'locked', contents: [
                    { type: 'handout-a', title: 'File I/O Basics', completed: false },
                    { type: 'slideshow', title: 'File Operations', completed: false },
                ]},
                { id: 8, title: 'Module 8: Final Project', status: 'locked', contents: [
                    { type: 'handout-a', title: 'Project Guidelines', completed: false },
                    { type: 'video', title: 'Project Overview', completed: false },
                ]},
            ],
            tasks: [
                { id: 1, title: 'Assignment 1: Hello World Program', due: 'Nov 10, 2025', status: 'submitted', score: '95/100', category: 'assignment' },
                { id: 2, title: 'Quiz 1: Programming Basics', due: 'Nov 12, 2025', status: 'submitted', score: '88/100', category: 'quiz' },
                { id: 3, title: 'Assignment 2: Loop Exercises', due: 'Nov 20, 2025', status: 'submitted', score: '92/100', category: 'assignment' },
                { id: 4, title: 'Quiz 2: Functions', due: 'Nov 25, 2025', status: 'submitted', score: '90/100', category: 'quiz' },
                { id: 5, title: 'Performance Task 1: Calculator App', due: 'Dec 1, 2025', status: 'pending', score: null, category: 'performance' },
                { id: 6, title: 'Practical Exam: Midterm Lab', due: 'Dec 5, 2025', status: 'upcoming', score: null, category: 'practical' },
            ],
        },
        'euth1': {
            modules: [
                { id: 1, title: 'Chapter 1: Introduction to Euthenics', status: 'completed', contents: [
                    { type: 'handout-a', title: 'What is Euthenics?', completed: true },
                    { type: 'slideshow', title: 'Course Introduction', completed: true },
                    { type: 'video', title: 'Welcome to Euthenics', completed: true },
                ]},
                { id: 2, title: 'Chapter 2: Personal Development', status: 'completed', contents: [
                    { type: 'handout-a', title: 'Self-Improvement Guide', completed: true },
                    { type: 'handout-b', title: 'Goal Setting Worksheet', completed: true },
                    { type: 'slideshow', title: 'Personal Growth Slides', completed: true },
                ]},
                { id: 3, title: 'Chapter 3: Home Management', status: 'completed', contents: [
                    { type: 'handout-a', title: 'Home Organization Tips', completed: true },
                    { type: 'video', title: 'Efficient Living Spaces', completed: true },
                ]},
                { id: 4, title: 'Chapter 4: Environmental Awareness', status: 'completed', contents: [
                    { type: 'handout-a', title: 'Sustainability Basics', completed: true },
                    { type: 'slideshow', title: 'Green Living', completed: true },
                ]},
                { id: 5, title: 'Chapter 5: Health and Wellness', status: 'completed', contents: [
                    { type: 'handout-a', title: 'Healthy Lifestyle', completed: true },
                    { type: 'video', title: 'Wellness Tips', completed: true },
                ]},
                { id: 6, title: 'Chapter 6: Community Living', status: 'completed', contents: [
                    { type: 'handout-a', title: 'Social Responsibility', completed: true },
                    { type: 'slideshow', title: 'Community Engagement', completed: true },
                ]},
            ],
            tasks: [
                { id: 1, title: 'Reflection Paper 1: Personal Goals', due: 'Nov 8, 2025', status: 'submitted', score: '92/100', category: 'journal' },
                { id: 2, title: 'Quiz 1: Euthenics Fundamentals', due: 'Nov 15, 2025', status: 'submitted', score: '95/100', category: 'quiz' },
                { id: 3, title: 'Assignment 1: Home Improvement Plan', due: 'Nov 25, 2025', status: 'submitted', score: '88/100', category: 'assignment' },
            ],
        },
        'itc': {
            modules: [
                { id: 1, title: 'Module 1: What is Computing?', status: 'completed', contents: [
                    { type: 'handout-a', title: 'Computing Basics', completed: true },
                    { type: 'slideshow', title: 'History of Computing', completed: true },
                ]},
                { id: 2, title: 'Module 2: Hardware Components', status: 'completed', contents: [
                    { type: 'handout-a', title: 'CPU and Memory', completed: true },
                    { type: 'video', title: 'Inside a Computer', completed: true },
                ]},
                { id: 3, title: 'Module 3: Software Fundamentals', status: 'completed', contents: [
                    { type: 'handout-a', title: 'Operating Systems', completed: true },
                    { type: 'slideshow', title: 'Software Types', completed: true },
                ]},
                { id: 4, title: 'Module 4: Networking Basics', status: 'in-progress', contents: [
                    { type: 'handout-a', title: 'Internet Fundamentals', completed: true },
                    { type: 'video', title: 'How Networks Work', completed: false },
                ]},
                { id: 5, title: 'Module 5: Cybersecurity', status: 'locked', contents: [
                    { type: 'handout-a', title: 'Security Basics', completed: false },
                ]},
            ],
        },
        'purcom': {
            modules: [
                { id: 1, title: 'Lesson 1: Communication Basics', status: 'completed', contents: [
                    { type: 'handout-a', title: 'Communication Process', completed: true },
                    { type: 'slideshow', title: 'Effective Communication', completed: true },
                ]},
                { id: 2, title: 'Lesson 2: Written Communication', status: 'completed', contents: [
                    { type: 'handout-a', title: 'Writing Techniques', completed: true },
                    { type: 'handout-b', title: 'Grammar Guide', completed: true },
                ]},
                { id: 3, title: 'Lesson 3: Oral Communication', status: 'completed', contents: [
                    { type: 'handout-a', title: 'Public Speaking', completed: true },
                    { type: 'video', title: 'Presentation Skills', completed: true },
                ]},
                { id: 4, title: 'Lesson 4: Visual Communication', status: 'completed', contents: [
                    { type: 'handout-a', title: 'Visual Aids', completed: true },
                    { type: 'slideshow', title: 'Design Principles', completed: true },
                ]},
                { id: 5, title: 'Lesson 5: Digital Communication', status: 'completed', contents: [
                    { type: 'handout-a', title: 'Online Etiquette', completed: true },
                ]},
                { id: 6, title: 'Lesson 6: Academic Writing', status: 'in-progress', contents: [
                    { type: 'handout-a', title: 'Research Papers', completed: true },
                    { type: 'video', title: 'Citation Guide', completed: false },
                ]},
            ],
        },
        'uts': {
            modules: [
                { id: 1, title: 'Module 1: The Self', status: 'completed', contents: [
                    { type: 'handout-a', title: 'Philosophical Self', completed: true },
                    { type: 'slideshow', title: 'Who Am I?', completed: true },
                ]},
                { id: 2, title: 'Module 2: Psychological Self', status: 'completed', contents: [
                    { type: 'handout-a', title: 'Personality Theories', completed: true },
                    { type: 'video', title: 'Self-Awareness', completed: true },
                ]},
                { id: 3, title: 'Module 3: Sociological Self', status: 'completed', contents: [
                    { type: 'handout-a', title: 'Social Identity', completed: true },
                    { type: 'slideshow', title: 'Society and Self', completed: true },
                ]},
                { id: 4, title: 'Module 4: Anthropological Self', status: 'in-progress', contents: [
                    { type: 'handout-a', title: 'Cultural Identity', completed: true },
                    { type: 'video', title: 'Culture and Self', completed: false },
                ]},
            ],
        },
    };
    localStorage.setItem('demo-course-modules', JSON.stringify(demoCourseModules));
    
    // Demo students with grades and AI grading status
    const demoStudents = [
        { id: 1, name: 'Juan Dela Cruz', status: 'online', role: 'Student', email: 'j.delacruz@university.edu', grade: 92, attendance: 95, submissions: 8, aiGraded: true },
        { id: 2, name: 'Maria Santos', status: 'online', role: 'Student', email: 'm.santos@university.edu', grade: 88, attendance: 92, submissions: 7, aiGraded: true },
        { id: 3, name: 'Pedro Reyes', status: 'offline', role: 'Student', email: 'p.reyes@university.edu', grade: 78, attendance: 85, submissions: 6, aiGraded: false },
        { id: 4, name: 'Ana Garcia', status: 'online', role: 'Student', email: 'a.garcia@university.edu', grade: 95, attendance: 98, submissions: 8, aiGraded: true },
        { id: 5, name: 'Jose Rizal', status: 'offline', role: 'Student', email: 'j.rizal@university.edu', grade: 82, attendance: 88, submissions: 7, aiGraded: true },
        { id: 6, name: 'Carmen Lopez', status: 'online', role: 'Student', email: 'c.lopez@university.edu', grade: 90, attendance: 94, submissions: 8, aiGraded: true },
        { id: 7, name: 'Miguel Torres', status: 'offline', role: 'Student', email: 'm.torres@university.edu', grade: 75, attendance: 80, submissions: 5, aiGraded: false },
        { id: 8, name: 'Sofia Mendoza', status: 'online', role: 'Student', email: 's.mendoza@university.edu', grade: 94, attendance: 96, submissions: 8, aiGraded: true },
        { id: 9, name: 'Carlos Rivera', status: 'online', role: 'Student', email: 'c.rivera@university.edu', grade: 86, attendance: 90, submissions: 7, aiGraded: true },
        { id: 10, name: 'Isabella Cruz', status: 'offline', role: 'Student', email: 'i.cruz@university.edu', grade: 91, attendance: 93, submissions: 8, aiGraded: true },
        { id: 11, name: 'Diego Fernandez', status: 'online', role: 'Student', email: 'd.fernandez@university.edu', grade: 79, attendance: 82, submissions: 6, aiGraded: false },
        { id: 12, name: 'Lucia Martinez', status: 'offline', role: 'Student', email: 'l.martinez@university.edu', grade: 87, attendance: 91, submissions: 7, aiGraded: true },
    ];
    localStorage.setItem('demo-students', JSON.stringify(demoStudents));
    
    // Demo teachers/instructors
    const demoTeachers = [
        { id: 1, name: 'David Clarence Del Mundo', title: 'Senior Instructor', email: 'd.delmundo@university.edu', department: 'Computer Science', courses: ['cp1', 'itc'], status: 'online', canAIGrade: true },
        { id: 2, name: 'Claire Maurillo', title: 'Associate Professor', email: 'c.maurillo@university.edu', department: 'General Education', courses: ['euth1', 'ppc'], status: 'online', canAIGrade: true },
        { id: 7, name: 'Anne Jenell Lumintigar', title: 'Instructor', email: 'a.lumintigar@university.edu', department: 'General Education', courses: ['tcw'], status: 'online', canAIGrade: true },
        { id: 8, name: 'Jocel Lazalita', title: 'Instructor', email: 'j.lazalita@university.edu', department: 'General Education', courses: ['uts'], status: 'online', canAIGrade: true },
        { id: 3, name: 'Psalmmiracle Mariano', title: 'Instructor', email: 'p.mariano@university.edu', department: 'Computer Science', courses: ['itc'], status: 'offline', canAIGrade: true },
        { id: 4, name: 'John Denielle San Martin', title: 'Instructor', email: 'j.sanmartin@university.edu', department: 'Communication', courses: ['purcom'], status: 'online', canAIGrade: true },
        { id: 5, name: 'Dan Risty Montojo', title: 'NSTP Coordinator', email: 'd.montojo@university.edu', department: 'NSTP', courses: ['nstp1'], status: 'offline', canAIGrade: false },
        { id: 6, name: 'Mark Joseph Danoy', title: 'PE Instructor', email: 'm.danoy@university.edu', department: 'Physical Education', courses: ['pe1'], status: 'online', canAIGrade: false },
    ];
    localStorage.setItem('demo-teachers', JSON.stringify(demoTeachers));
    
    // Demo student submissions for teacher grading (per course)
    const demoSubmissions = {
        'cp1': [
            { id: 1, studentName: 'Maria Santos', studentId: 'STU001', task: 'Assignment 1: Hello World Program', submitted: '2025-11-10', status: 'graded', yearLevel: '1st Year', section: 'A', aiScore: 95 },
            { id: 2, studentName: 'Juan Dela Cruz', studentId: 'STU002', task: 'Assignment 1: Hello World Program', submitted: '2025-11-10', status: 'graded', yearLevel: '1st Year', section: 'A', aiScore: 88 },
            { id: 3, studentName: 'Ana Reyes', studentId: 'STU003', task: 'Assignment 1: Hello World Program', submitted: '2025-11-09', status: 'pending', yearLevel: '1st Year', section: 'B', aiScore: null },
            { id: 4, studentName: 'Carlos Garcia', studentId: 'STU004', task: 'Quiz 1: Programming Basics', submitted: '2025-11-12', status: 'graded', yearLevel: '1st Year', section: 'A', aiScore: 92 },
            { id: 5, studentName: 'Sofia Mendoza', studentId: 'STU005', task: 'Quiz 1: Programming Basics', submitted: '2025-11-12', status: 'graded', yearLevel: '1st Year', section: 'B', aiScore: 85 },
            { id: 6, studentName: 'Miguel Torres', studentId: 'STU006', task: 'Assignment 2: Loop Exercises', submitted: '2025-11-20', status: 'pending', yearLevel: '2nd Year', section: 'A', aiScore: null },
            { id: 7, studentName: 'Isabella Cruz', studentId: 'STU007', task: 'Assignment 2: Loop Exercises', submitted: '2025-11-19', status: 'graded', yearLevel: '2nd Year', section: 'B', aiScore: 90 },
            { id: 8, studentName: 'Diego Ramos', studentId: 'STU008', task: 'Performance Task 1: Calculator App', submitted: '2025-12-01', status: 'pending', yearLevel: '1st Year', section: 'A', aiScore: null },
        ],
        'purcom': [
            { id: 1, studentName: 'Maria Santos', studentId: 'STU001', task: 'Essay: Communication in Modern Society', submitted: '2025-11-15', status: 'graded', yearLevel: '1st Year', section: 'A', aiScore: 90 },
            { id: 2, studentName: 'Juan Dela Cruz', studentId: 'STU002', task: 'Essay: Communication in Modern Society', submitted: '2025-11-14', status: 'graded', yearLevel: '1st Year', section: 'A', aiScore: 87 },
            { id: 3, studentName: 'Ana Reyes', studentId: 'STU003', task: 'Speech Presentation', submitted: '2025-11-20', status: 'pending', yearLevel: '1st Year', section: 'B', aiScore: null },
            { id: 4, studentName: 'Carlos Garcia', studentId: 'STU004', task: 'Research Paper Draft', submitted: '2025-11-25', status: 'pending', yearLevel: '2nd Year', section: 'A', aiScore: null },
        ],
        'euth1': [
            { id: 1, studentName: 'Sofia Mendoza', studentId: 'STU005', task: 'Reflection Paper 1: Personal Goals', submitted: '2025-11-08', status: 'graded', yearLevel: '1st Year', section: 'A', aiScore: 92 },
            { id: 2, studentName: 'Miguel Torres', studentId: 'STU006', task: 'Reflection Paper 1: Personal Goals', submitted: '2025-11-07', status: 'graded', yearLevel: '1st Year', section: 'B', aiScore: 88 },
            { id: 3, studentName: 'Isabella Cruz', studentId: 'STU007', task: 'Quiz 1: Euthenics Fundamentals', submitted: '2025-11-15', status: 'graded', yearLevel: '2nd Year', section: 'A', aiScore: 95 },
        ],
        'itc': [
            { id: 1, studentName: 'Diego Ramos', studentId: 'STU008', task: 'Quiz: Hardware Components', submitted: '2025-11-18', status: 'graded', yearLevel: '1st Year', section: 'A', aiScore: 78 },
            { id: 2, studentName: 'Maria Santos', studentId: 'STU001', task: 'Assignment: Network Diagram', submitted: '2025-11-22', status: 'pending', yearLevel: '1st Year', section: 'B', aiScore: null },
        ],
    };
    
    // Save demo submissions per course
    Object.entries(demoSubmissions).forEach(([courseId, submissions]) => {
        localStorage.setItem(`ai-grading-${courseId}`, JSON.stringify(submissions));
    });
    
    // Demo AI grading results
    const demoAIGrades = {
        'cp1': {
            enabled: true,
            lastRun: new Date().toISOString(),
            gradedSubmissions: 24,
            pendingReview: 3,
            averageScore: 87,
            feedback: [
                { studentId: 1, taskId: 1, score: 95, feedback: 'Excellent work! Code is clean and well-documented.', confidence: 0.95 },
                { studentId: 2, taskId: 1, score: 88, feedback: 'Good implementation. Consider adding more comments.', confidence: 0.92 },
                { studentId: 4, taskId: 1, score: 98, feedback: 'Outstanding! Perfect implementation with excellent error handling.', confidence: 0.98 },
            ]
        },
        'purcom': {
            enabled: true,
            lastRun: new Date(Date.now() - 86400000).toISOString(),
            gradedSubmissions: 18,
            pendingReview: 5,
            averageScore: 84,
            feedback: [
                { studentId: 1, taskId: 1, score: 90, feedback: 'Well-structured essay with clear arguments.', confidence: 0.88 },
                { studentId: 6, taskId: 1, score: 92, feedback: 'Excellent use of rhetorical devices.', confidence: 0.91 },
            ]
        },
        'euth1': {
            enabled: true,
            lastRun: new Date(Date.now() - 172800000).toISOString(),
            gradedSubmissions: 30,
            pendingReview: 0,
            averageScore: 89,
            feedback: []
        }
    };
    localStorage.setItem('demo-ai-grades', JSON.stringify(demoAIGrades));
    
    // Demo Learning Paths - Additional paths for recommendations
    const demoPaths = [
        {
            id: 'path-programming-fundamentals',
            title: 'Programming Fundamentals',
            description: 'Master the basics of programming with hands-on coding exercises',
            icon: 'code',
            color: '#10b981',
            estimated_hours: 40,
            difficulty: 'beginner',
            courses: ['cp1', 'itc'],
            created_by: 'admin',
            is_public: true,
            enrolled_count: 28,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: 'path-communication-skills',
            title: 'Communication Skills',
            description: 'Develop effective written and oral communication abilities',
            icon: 'chat',
            color: '#8b5cf6',
            estimated_hours: 35,
            difficulty: 'beginner',
            courses: ['purcom', 'tcw'],
            created_by: 'admin',
            is_public: true,
            enrolled_count: 32,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: 'path-ge-essentials',
            title: 'GE Essentials',
            description: 'Complete your General Education requirements efficiently',
            icon: 'book',
            color: '#f59e0b',
            estimated_hours: 60,
            difficulty: 'intermediate',
            courses: ['euth1', 'uts', 'ppc', 'tcw'],
            created_by: 'admin',
            is_public: true,
            enrolled_count: 35,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: 'path-personal-development',
            title: 'Personal Development',
            description: 'Focus on self-improvement and wellness for academic success',
            icon: 'user',
            color: '#ec4899',
            estimated_hours: 25,
            difficulty: 'beginner',
            courses: ['euth1', 'uts', 'pe1'],
            created_by: 'admin',
            is_public: true,
            enrolled_count: 22,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
    ];
    localStorage.setItem('demo-learning-paths', JSON.stringify(demoPaths));
    
    // Set demo mode flag to prevent database sync from overwriting demo data
    localStorage.setItem(STORAGE_KEYS.DEMO_MODE, 'true');
    
    console.log('[Demo] Demo data loaded successfully! Refresh to clear.');
};

// Export for use in components
export default {
    getStudyTimeData,
    getStreakData,
    getCourseProgressData,
    saveStudyTimeData,
    saveStreakData,
    saveCourseProgressData,
    startStudySession,
    endStudySession,
    addStudyTime,
    updateStreak,
    calculateOverallProgress,
    getCompletedCoursesCount,
    getInProgressCoursesCount,
    getTotalEnrolledCoursesCount,
    getNotStartedCoursesCount,
    formatMinutesToHours,
    getStudyTimeHours,
    getDailyAverageHours,
    getTimeLeftForCourse,
    initializeTracking,
    getStreakTier,
    getXPData,
    initializeXP,
    addXP,
    getXPProgress,
    getCurrentLevel,
    checkRecentLevelUp,
    clearLevelUpNotification,
    resetAllData,
    loadDemoData,
    isDemoModeActive,
    clearDemoMode,
};
