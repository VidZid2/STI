/**
 * Goals Service - Manages learning goals and milestones
 * Connects to Supabase for persistent storage
 * Integrates with study time, courses, and streak data
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
    getStudyTimeData, 
    getStreakData, 
    getCourseProgressData,
    // getCompletedCoursesCount, // Available for future use
} from './studyTimeService';
import { getGradePredictionSync } from './gradePredictorService';

// Goal types
export type GoalType = 'study_time' | 'course_completion' | 'streak' | 'grade';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'expired';
export type GoalPriority = 'low' | 'medium' | 'high';

export interface Goal {
    id: string;
    student_id: string;
    title: string;
    description?: string;
    type: GoalType;
    target_value: number;
    current_value: number;
    unit: string;
    priority: GoalPriority;
    status: GoalStatus;
    start_date: string;
    end_date?: string;
    completed_at?: string;
    created_at: string;
    updated_at: string;
    metadata?: {
        course_id?: string;
        course_title?: string;
        [key: string]: any;
    };
}

export interface GoalWithProgress extends Goal {
    progress_percentage: number;
    days_remaining?: number;
    is_overdue: boolean;
}

// Get current student ID from session
const getStudentId = (): string => {
    const userData = sessionStorage.getItem('user_data');
    if (userData) {
        const user = JSON.parse(userData);
        return user.student_id || user.id || 'demo-student';
    }
    return 'demo-student';
};

// Goal type configurations
export const goalTypeConfig: Record<GoalType, { label: string; icon: string; color: string; defaultUnit: string }> = {
    study_time: { label: 'Study Time', icon: 'clock', color: '#3b82f6', defaultUnit: 'hours' },
    course_completion: { label: 'Module Progress', icon: 'book', color: '#10b981', defaultUnit: 'modules' },
    streak: { label: 'Learning Streak', icon: 'flame', color: '#f59e0b', defaultUnit: 'days' },
    grade: { label: 'Grade Target', icon: 'star', color: '#8b5cf6', defaultUnit: '%' },
};

// Calculate progress percentage
const calculateProgress = (current: number, target: number): number => {
    if (target <= 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
};

// Calculate days remaining
const calculateDaysRemaining = (endDate?: string): number | undefined => {
    if (!endDate) return undefined;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
};

// Check if goal is overdue
const isGoalOverdue = (endDate?: string, status?: GoalStatus): boolean => {
    if (!endDate || status === 'completed') return false;
    const days = calculateDaysRemaining(endDate);
    return days !== undefined && days < 0;
};

// Transform goal to include progress info
const transformGoal = (goal: Goal): GoalWithProgress => ({
    ...goal,
    progress_percentage: calculateProgress(goal.current_value, goal.target_value),
    days_remaining: calculateDaysRemaining(goal.end_date),
    is_overdue: isGoalOverdue(goal.end_date, goal.status),
});

// Fetch all goals for current student
export const fetchGoals = async (): Promise<GoalWithProgress[]> => {
    const studentId = getStudentId();
    
    // If Supabase is not configured, return default goals
    if (!isSupabaseConfigured()) {
        return getDefaultGoals();
    }
    
    try {
        const { data, error } = await supabase!
            .from('student_goals')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching goals:', error);
            return getDefaultGoals();
        }

        if (!data || data.length === 0) {
            return getDefaultGoals();
        }

        return data.map(transformGoal);
    } catch (err) {
        console.error('Error in fetchGoals:', err);
        return getDefaultGoals();
    }
};

// Create a new goal
export const createGoal = async (goal: Omit<Goal, 'id' | 'student_id' | 'created_at' | 'updated_at'>): Promise<GoalWithProgress | null> => {
    const studentId = getStudentId();
    const id = `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newGoal: Goal = {
        ...goal,
        id,
        student_id: studentId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    // If Supabase is not configured, save to localStorage (demo mode)
    if (!isSupabaseConfigured()) {
        const localGoals = getLocalGoals();
        localGoals.unshift(newGoal);
        saveLocalGoals(localGoals);
        return transformGoal(newGoal);
    }

    try {
        const { data, error } = await supabase!
            .from('student_goals')
            .insert([newGoal])
            .select()
            .single();

        if (error) {
            console.error('Error creating goal:', error);
            return transformGoal(newGoal); // Return local goal in demo mode
        }

        return transformGoal(data);
    } catch (err) {
        console.error('Error in createGoal:', err);
        return transformGoal(newGoal);
    }
};

// Update goal progress
export const updateGoalProgress = async (goalId: string, currentValue: number): Promise<GoalWithProgress | null> => {
    // If Supabase is not configured, update in localStorage (demo mode)
    if (!isSupabaseConfigured()) {
        const localGoals = getLocalGoals();
        const goalIndex = localGoals.findIndex(g => g.id === goalId);
        if (goalIndex === -1) return null;
        
        localGoals[goalIndex].current_value = currentValue;
        localGoals[goalIndex].updated_at = new Date().toISOString();
        
        // Check if goal is completed
        if (currentValue >= localGoals[goalIndex].target_value) {
            localGoals[goalIndex].status = 'completed';
            localGoals[goalIndex].completed_at = new Date().toISOString();
        }
        
        saveLocalGoals(localGoals);
        return transformGoal(localGoals[goalIndex]);
    }
    
    try {
        const updates: Partial<Goal> = {
            current_value: currentValue,
            updated_at: new Date().toISOString(),
        };

        // Check if goal is completed
        const { data: existingGoal } = await supabase!
            .from('student_goals')
            .select('target_value')
            .eq('id', goalId)
            .single();

        if (existingGoal && currentValue >= existingGoal.target_value) {
            updates.status = 'completed';
            updates.completed_at = new Date().toISOString();
        }

        const { data, error } = await supabase!
            .from('student_goals')
            .update(updates)
            .eq('id', goalId)
            .select()
            .single();

        if (error) {
            console.error('Error updating goal:', error);
            return null;
        }

        return transformGoal(data);
    } catch (err) {
        console.error('Error in updateGoalProgress:', err);
        return null;
    }
};

// Update goal status
export const updateGoalStatus = async (goalId: string, status: GoalStatus): Promise<GoalWithProgress | null> => {
    // If Supabase is not configured, update in localStorage (demo mode)
    if (!isSupabaseConfigured()) {
        const localGoals = getLocalGoals();
        const goalIndex = localGoals.findIndex(g => g.id === goalId);
        if (goalIndex === -1) return null;
        
        localGoals[goalIndex].status = status;
        localGoals[goalIndex].updated_at = new Date().toISOString();
        
        if (status === 'completed') {
            localGoals[goalIndex].completed_at = new Date().toISOString();
        }
        
        saveLocalGoals(localGoals);
        return transformGoal(localGoals[goalIndex]);
    }
    
    try {
        const updates: Partial<Goal> = {
            status,
            updated_at: new Date().toISOString(),
        };

        if (status === 'completed') {
            updates.completed_at = new Date().toISOString();
        }

        const { data, error } = await supabase!
            .from('student_goals')
            .update(updates)
            .eq('id', goalId)
            .select()
            .single();

        if (error) {
            console.error('Error updating goal status:', error);
            return null;
        }

        return transformGoal(data);
    } catch (err) {
        console.error('Error in updateGoalStatus:', err);
        return null;
    }
};

// Delete a goal
export const deleteGoal = async (goalId: string): Promise<boolean> => {
    // If Supabase is not configured, delete from localStorage (demo mode)
    if (!isSupabaseConfigured()) {
        const localGoals = getLocalGoals();
        const filteredGoals = localGoals.filter(g => g.id !== goalId);
        saveLocalGoals(filteredGoals);
        return true;
    }
    
    try {
        const { error } = await supabase!
            .from('student_goals')
            .delete()
            .eq('id', goalId);

        if (error) {
            console.error('Error deleting goal:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Error in deleteGoal:', err);
        return false;
    }
};

// Get goal statistics
export const getGoalStats = async (): Promise<{
    total: number;
    active: number;
    completed: number;
    completionRate: number;
}> => {
    const goals = await fetchGoals();
    const total = goals.length;
    const active = goals.filter(g => g.status === 'active').length;
    const completed = goals.filter(g => g.status === 'completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, active, completed, completionRate };
};

// Local storage key for demo mode
const GOALS_STORAGE_KEY = 'elms_student_goals';

// Get goals from localStorage (demo mode)
const getLocalGoals = (): Goal[] => {
    try {
        const stored = localStorage.getItem(GOALS_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (err) {
        console.error('Error reading local goals:', err);
    }
    return [];
};

// Save goals to localStorage (demo mode)
const saveLocalGoals = (goals: Goal[]): void => {
    try {
        localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
    } catch (err) {
        console.error('Error saving local goals:', err);
    }
};

// Return goals from localStorage when Supabase is not configured
const getDefaultGoals = (): GoalWithProgress[] => {
    const studentId = getStudentId();
    const localGoals = getLocalGoals().filter(g => g.student_id === studentId);
    return localGoals.map(transformGoal);
};

// Get the current absolute value for a goal type (used for baseline calculation)
export const getCurrentAbsoluteValue = (type: GoalType, unit: string, courseId?: string): number => {
    switch (type) {
        case 'study_time': {
            const studyData = getStudyTimeData();
            if (unit === 'hours') {
                return Math.round((studyData.weeklyMinutes / 60) * 10) / 10;
            }
            return studyData.weeklyMinutes;
        }
        case 'course_completion': {
            const courseProgress = getCourseProgressData();
            if (courseId) {
                const course = courseProgress[courseId];
                return course?.completedModules || 0;
            }
            return Object.values(courseProgress).reduce((total, course) => total + (course.completedModules || 0), 0);
        }
        case 'streak': {
            const streakData = getStreakData();
            return streakData.currentStreak;
        }
        case 'grade': {
            const prediction = getGradePredictionSync();
            if (courseId) {
                const courseProgress = getCourseProgressData();
                const course = courseProgress[courseId];
                return course?.progress || 0;
            }
            return prediction.predictedGrade;
        }
        default:
            return 0;
    }
};

// Get real-time progress for a goal based on its type
// Progress is calculated from the baseline (when goal was created) to track NEW progress only
export const getRealTimeProgress = (goal: Goal): number => {
    const baseline = goal.metadata?.baseline_value ?? 0;
    
    switch (goal.type) {
        case 'study_time': {
            const studyData = getStudyTimeData();
            // Convert minutes to hours for study time goals
            let currentValue: number;
            if (goal.unit === 'hours') {
                currentValue = Math.round((studyData.weeklyMinutes / 60) * 10) / 10;
            } else {
                currentValue = studyData.weeklyMinutes;
            }
            // Return progress since goal creation (current - baseline), minimum 0
            return Math.max(0, Math.round((currentValue - baseline) * 10) / 10);
        }
        case 'course_completion': {
            const courseProgress = getCourseProgressData();
            let currentValue: number;
            // Check if this is a course-specific goal
            if (goal.metadata?.course_id) {
                const course = courseProgress[goal.metadata.course_id];
                currentValue = course?.completedModules || 0;
            } else {
                // Track total completed modules across all courses
                currentValue = Object.values(courseProgress).reduce((total, course) => total + (course.completedModules || 0), 0);
            }
            return Math.max(0, currentValue - baseline);
        }
        case 'streak': {
            const streakData = getStreakData();
            // For streak, we track from baseline (streak when goal was created)
            return Math.max(0, streakData.currentStreak - baseline);
        }
        case 'grade': {
            // Grade goals track from grade predictor based on course progress
            const prediction = getGradePredictionSync();
            let currentValue: number;
            // Check if this is a course-specific grade goal
            if (goal.metadata?.course_id) {
                const courseProgress = getCourseProgressData();
                const course = courseProgress[goal.metadata.course_id];
                currentValue = course?.progress || 0;
            } else {
                // Use overall predicted grade
                currentValue = prediction.predictedGrade;
            }
            // For grade, return progress since baseline
            return Math.max(0, Math.round((currentValue - baseline) * 10) / 10);
        }
        default:
            return goal.current_value;
    }
};

// Sync goal progress with real data from services
export const syncGoalProgress = async (goalId: string): Promise<GoalWithProgress | null> => {
    if (!isSupabaseConfigured()) return null;
    
    try {
        // Get the goal first
        const { data: goal, error: fetchError } = await supabase!
            .from('student_goals')
            .select('*')
            .eq('id', goalId)
            .single();
        
        if (fetchError || !goal) return null;
        
        // Get real-time progress
        const realProgress = getRealTimeProgress(goal);
        
        // Only update if progress changed
        if (realProgress !== goal.current_value) {
            return await updateGoalProgress(goalId, realProgress);
        }
        
        return transformGoal(goal);
    } catch (err) {
        console.error('Error syncing goal progress:', err);
        return null;
    }
};

// Sync all active goals with real data
export const syncAllGoalsProgress = async (): Promise<GoalWithProgress[]> => {
    const goals = await fetchGoals();
    const activeGoals = goals.filter(g => g.status === 'active');
    
    const syncedGoals = await Promise.all(
        activeGoals.map(async (goal) => {
            const realProgress = getRealTimeProgress(goal);
            if (realProgress !== goal.current_value) {
                const updated = await updateGoalProgress(goal.id, realProgress);
                return updated || goal;
            }
            return goal;
        })
    );
    
    // Return all goals with synced active ones
    return goals.map(g => {
        const synced = syncedGoals.find(s => s.id === g.id);
        return synced || g;
    });
};

// Get suggested goals based on current activity
export const getSuggestedGoals = (): Array<{
    title: string;
    description: string;
    type: GoalType;
    target_value: number;
    unit: string;
    priority: GoalPriority;
}> => {
    const studyData = getStudyTimeData();
    const streakData = getStreakData();
    const courseProgress = getCourseProgressData();
    
    const suggestions = [];
    
    // Suggest study time goal based on current weekly average
    const weeklyHours = Math.round(studyData.weeklyMinutes / 60);
    const suggestedStudyHours = Math.max(10, weeklyHours + 5);
    suggestions.push({
        title: `Study ${suggestedStudyHours} hours this week`,
        description: 'Dedicate focused study time to improve understanding',
        type: 'study_time' as GoalType,
        target_value: suggestedStudyHours,
        unit: 'hours',
        priority: 'high' as GoalPriority,
    });
    
    // Suggest streak goal based on current streak
    const suggestedStreak = Math.max(7, streakData.currentStreak + 3);
    suggestions.push({
        title: `Maintain ${suggestedStreak}-day streak`,
        description: 'Log in and study every day to build consistency',
        type: 'streak' as GoalType,
        target_value: suggestedStreak,
        unit: 'days',
        priority: 'medium' as GoalPriority,
    });
    
    // Suggest module completion goal
    const completedModules = Object.values(courseProgress).reduce((total, c) => total + (c.completedModules || 0), 0);
    const totalModules = Object.values(courseProgress).reduce((total, c) => total + (c.totalModules || 0), 0);
    const remainingModules = totalModules - completedModules;
    if (remainingModules > 0) {
        const suggestedModules = Math.min(5, remainingModules);
        suggestions.push({
            title: `Complete ${suggestedModules} module${suggestedModules > 1 ? 's' : ''}`,
            description: 'Finish modules from your enrolled courses',
            type: 'course_completion' as GoalType,
            target_value: completedModules + suggestedModules,
            unit: 'modules',
            priority: 'medium' as GoalPriority,
        });
    }
    
    return suggestions;
};

// =====================================================
// Progress History Functions
// =====================================================

export interface ProgressHistoryEntry {
    id: string;
    goal_id: string;
    student_id: string;
    progress_value: number;
    progress_percentage: number;
    recorded_at: string;
}

// Local storage key for progress history (demo mode)
const PROGRESS_HISTORY_STORAGE_KEY = 'elms_goal_progress_history';

// Get progress history from localStorage (demo mode)
const getLocalProgressHistory = (): ProgressHistoryEntry[] => {
    try {
        const stored = localStorage.getItem(PROGRESS_HISTORY_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (err) {
        console.error('Error reading local progress history:', err);
    }
    return [];
};

// Save progress history to localStorage (demo mode)
const saveLocalProgressHistory = (history: ProgressHistoryEntry[]): void => {
    try {
        localStorage.setItem(PROGRESS_HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
        console.error('Error saving local progress history:', err);
    }
};

// Record a progress snapshot for a goal
export const recordProgressSnapshot = async (
    goalId: string,
    progressValue: number,
    progressPercentage: number
): Promise<ProgressHistoryEntry | null> => {
    const studentId = getStudentId();
    const entry: ProgressHistoryEntry = {
        id: `ph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        goal_id: goalId,
        student_id: studentId,
        progress_value: progressValue,
        progress_percentage: progressPercentage,
        recorded_at: new Date().toISOString(),
    };

    // If Supabase is not configured, save to localStorage
    if (!isSupabaseConfigured()) {
        const history = getLocalProgressHistory();
        history.push(entry);
        // Keep only last 100 entries per goal to prevent storage bloat
        const filtered = history.filter(h => h.goal_id === goalId).slice(-100);
        const otherEntries = history.filter(h => h.goal_id !== goalId);
        saveLocalProgressHistory([...otherEntries, ...filtered]);
        return entry;
    }

    try {
        const { data, error } = await supabase!
            .from('goal_progress_history')
            .insert([entry])
            .select()
            .single();

        if (error) {
            console.error('Error recording progress snapshot:', error);
            return entry; // Return local entry as fallback
        }

        return data;
    } catch (err) {
        console.error('Error in recordProgressSnapshot:', err);
        return entry;
    }
};

// Get progress history for a specific goal
export const getProgressHistory = async (
    goalId: string,
    limit: number = 30
): Promise<ProgressHistoryEntry[]> => {
    const studentId = getStudentId();

    // If Supabase is not configured, get from localStorage
    if (!isSupabaseConfigured()) {
        const history = getLocalProgressHistory();
        return history
            .filter(h => h.goal_id === goalId && h.student_id === studentId)
            .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
            .slice(-limit);
    }

    try {
        const { data, error } = await supabase!
            .from('goal_progress_history')
            .select('*')
            .eq('goal_id', goalId)
            .eq('student_id', studentId)
            .order('recorded_at', { ascending: true })
            .limit(limit);

        if (error) {
            console.error('Error fetching progress history:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Error in getProgressHistory:', err);
        return [];
    }
};

// Get aggregated progress history for all goals (for overview chart)
export const getAggregatedProgressHistory = async (
    days: number = 7
): Promise<{ date: string; completed: number; active: number; totalProgress: number }[]> => {
    const studentId = getStudentId();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // If Supabase is not configured, generate from localStorage
    if (!isSupabaseConfigured()) {
        const goals = getLocalGoals().filter(g => g.student_id === studentId);
        const history = getLocalProgressHistory().filter(h => h.student_id === studentId);
        
        // Generate daily aggregates
        const dailyData: { date: string; completed: number; active: number; totalProgress: number }[] = [];
        
        for (let i = 0; i <= days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (days - i));
            const dateStr = date.toISOString().split('T')[0];
            
            // Count goals by status on this date
            const goalsOnDate = goals.filter(g => {
                const createdDate = new Date(g.created_at).toISOString().split('T')[0];
                return createdDate <= dateStr;
            });
            
            const completed = goalsOnDate.filter(g => {
                if (g.status !== 'completed' || !g.completed_at) return false;
                const completedDate = new Date(g.completed_at).toISOString().split('T')[0];
                return completedDate <= dateStr;
            }).length;
            
            const active = goalsOnDate.length - completed;
            
            // Calculate average progress from history entries on this date
            const dayHistory = history.filter(h => {
                const recordedDate = new Date(h.recorded_at).toISOString().split('T')[0];
                return recordedDate === dateStr;
            });
            
            const totalProgress = dayHistory.length > 0
                ? Math.round(dayHistory.reduce((sum, h) => sum + h.progress_percentage, 0) / dayHistory.length)
                : (i > 0 && dailyData[i - 1] ? dailyData[i - 1].totalProgress : 0);
            
            dailyData.push({ date: dateStr, completed, active, totalProgress });
        }
        
        return dailyData;
    }

    try {
        // For Supabase, we'd need a more complex query or function
        // For now, return similar logic using fetched data
        const goals = await fetchGoals();
        const dailyData: { date: string; completed: number; active: number; totalProgress: number }[] = [];
        
        for (let i = 0; i <= days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (days - i));
            const dateStr = date.toISOString().split('T')[0];
            
            const goalsOnDate = goals.filter(g => {
                const createdDate = new Date(g.created_at).toISOString().split('T')[0];
                return createdDate <= dateStr;
            });
            
            const completed = goalsOnDate.filter(g => {
                if (g.status !== 'completed' || !g.completed_at) return false;
                const completedDate = new Date(g.completed_at).toISOString().split('T')[0];
                return completedDate <= dateStr;
            }).length;
            
            const active = goalsOnDate.length - completed;
            const totalProgress = goalsOnDate.length > 0
                ? Math.round(goalsOnDate.reduce((sum, g) => sum + g.progress_percentage, 0) / goalsOnDate.length)
                : 0;
            
            dailyData.push({ date: dateStr, completed, active, totalProgress });
        }
        
        return dailyData;
    } catch (err) {
        console.error('Error in getAggregatedProgressHistory:', err);
        return [];
    }
};
