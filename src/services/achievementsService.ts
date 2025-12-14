/**
 * Achievements Service
 * 
 * Tracks and calculates student achievements/badges based on existing data.
 * Uses streak, course progress, and study time data - no additional database needed.
 */

import { getStreakData, getCourseProgressData, getStudyTimeData } from './studyTimeService';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string; // Emoji
    category: 'streak' | 'progress' | 'study' | 'special';
    unlocked: boolean;
    unlockedAt?: string;
    progress?: number; // 0-100 for partially completed
    requirement: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>[] = [
    // Streak Achievements
    {
        id: 'first-login',
        name: 'First Steps',
        description: 'Log in to the platform for the first time',
        icon: '👋',
        category: 'streak',
        requirement: '1 day streak',
        rarity: 'common',
    },
    {
        id: 'streak-3',
        name: 'Getting Started',
        description: 'Maintain a 3-day login streak',
        icon: '🔥',
        category: 'streak',
        requirement: '3 day streak',
        rarity: 'common',
    },
    {
        id: 'streak-7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day login streak',
        icon: '⚡',
        category: 'streak',
        requirement: '7 day streak',
        rarity: 'rare',
    },
    {
        id: 'streak-14',
        name: 'Dedicated Learner',
        description: 'Maintain a 14-day login streak',
        icon: '💪',
        category: 'streak',
        requirement: '14 day streak',
        rarity: 'epic',
    },
    {
        id: 'streak-30',
        name: 'Unstoppable',
        description: 'Maintain a 30-day login streak',
        icon: '👑',
        category: 'streak',
        requirement: '30 day streak',
        rarity: 'legendary',
    },
    
    // Progress Achievements
    {
        id: 'first-course',
        name: 'Course Explorer',
        description: 'Start your first course',
        icon: '📚',
        category: 'progress',
        requirement: 'Start 1 course',
        rarity: 'common',
    },
    {
        id: 'course-25',
        name: 'Making Progress',
        description: 'Reach 25% progress in any course',
        icon: '📈',
        category: 'progress',
        requirement: '25% in any course',
        rarity: 'common',
    },
    {
        id: 'course-50',
        name: 'Halfway There',
        description: 'Reach 50% progress in any course',
        icon: '🎯',
        category: 'progress',
        requirement: '50% in any course',
        rarity: 'rare',
    },
    {
        id: 'course-complete',
        name: 'Course Champion',
        description: 'Complete your first course (100%)',
        icon: '🏆',
        category: 'progress',
        requirement: 'Complete 1 course',
        rarity: 'epic',
    },
    {
        id: 'all-courses-50',
        name: 'Well Rounded',
        description: 'Reach 50% in all enrolled courses',
        icon: '🌟',
        category: 'progress',
        requirement: '50% in all courses',
        rarity: 'legendary',
    },
    
    // Study Time Achievements
    {
        id: 'study-30min',
        name: 'Quick Study',
        description: 'Study for 30 minutes total',
        icon: '⏱️',
        category: 'study',
        requirement: '30 minutes study time',
        rarity: 'common',
    },
    {
        id: 'study-1hr',
        name: 'Hour of Power',
        description: 'Study for 1 hour total',
        icon: '📖',
        category: 'study',
        requirement: '1 hour study time',
        rarity: 'common',
    },
    {
        id: 'study-5hr',
        name: 'Bookworm',
        description: 'Study for 5 hours total',
        icon: '🐛',
        category: 'study',
        requirement: '5 hours study time',
        rarity: 'rare',
    },
    {
        id: 'study-10hr',
        name: 'Knowledge Seeker',
        description: 'Study for 10 hours total',
        icon: '🧠',
        category: 'study',
        requirement: '10 hours study time',
        rarity: 'epic',
    },
    {
        id: 'study-50hr',
        name: 'Scholar',
        description: 'Study for 50 hours total',
        icon: '🎓',
        category: 'study',
        requirement: '50 hours study time',
        rarity: 'legendary',
    },
    
    // Special Achievements
    {
        id: 'early-bird',
        name: 'Early Bird',
        description: 'Log in before 8 AM',
        icon: '🌅',
        category: 'special',
        requirement: 'Login before 8 AM',
        rarity: 'rare',
    },
    {
        id: 'night-owl',
        name: 'Night Owl',
        description: 'Study after 10 PM',
        icon: '🦉',
        category: 'special',
        requirement: 'Study after 10 PM',
        rarity: 'rare',
    },
    {
        id: 'perfect-week',
        name: 'Perfect Week',
        description: 'Study every day for a week',
        icon: '✨',
        category: 'special',
        requirement: '7 days with study time',
        rarity: 'epic',
    },
];

/**
 * Check and calculate all achievements based on current data
 */
export const calculateAchievements = (): Achievement[] => {
    const streakData = getStreakData();
    const courseProgress = getCourseProgressData();
    const studyTime = getStudyTimeData();
    
    const currentHour = new Date().getHours();
    const courses = Object.values(courseProgress);
    const totalMinutes = studyTime.totalMinutes;
    
    // Load saved achievement unlock times
    const savedUnlocks = getSavedAchievementUnlocks();
    
    return ACHIEVEMENT_DEFINITIONS.map(def => {
        let unlocked = false;
        let progress = 0;
        
        switch (def.id) {
            // Streak achievements
            case 'first-login':
                unlocked = streakData.currentStreak >= 1;
                progress = Math.min(100, streakData.currentStreak * 100);
                break;
            case 'streak-3':
                unlocked = streakData.bestStreak >= 3;
                progress = Math.min(100, (streakData.currentStreak / 3) * 100);
                break;
            case 'streak-7':
                unlocked = streakData.bestStreak >= 7;
                progress = Math.min(100, (streakData.currentStreak / 7) * 100);
                break;
            case 'streak-14':
                unlocked = streakData.bestStreak >= 14;
                progress = Math.min(100, (streakData.currentStreak / 14) * 100);
                break;
            case 'streak-30':
                unlocked = streakData.bestStreak >= 30;
                progress = Math.min(100, (streakData.currentStreak / 30) * 100);
                break;
                
            // Progress achievements
            case 'first-course':
                unlocked = courses.some(c => c.progress > 0);
                progress = courses.some(c => c.progress > 0) ? 100 : 0;
                break;
            case 'course-25':
                unlocked = courses.some(c => c.progress >= 25);
                progress = Math.min(100, Math.max(...courses.map(c => c.progress), 0) * 4);
                break;
            case 'course-50':
                unlocked = courses.some(c => c.progress >= 50);
                progress = Math.min(100, Math.max(...courses.map(c => c.progress), 0) * 2);
                break;
            case 'course-complete':
                unlocked = courses.some(c => c.progress >= 100);
                progress = Math.min(100, Math.max(...courses.map(c => c.progress), 0));
                break;
            case 'all-courses-50':
                const allAbove50 = courses.length > 0 && courses.every(c => c.progress >= 50);
                unlocked = allAbove50;
                const avgProgress = courses.length > 0 
                    ? courses.reduce((sum, c) => sum + Math.min(c.progress, 50), 0) / courses.length 
                    : 0;
                progress = Math.min(100, avgProgress * 2);
                break;
                
            // Study time achievements
            case 'study-30min':
                unlocked = totalMinutes >= 30;
                progress = Math.min(100, (totalMinutes / 30) * 100);
                break;
            case 'study-1hr':
                unlocked = totalMinutes >= 60;
                progress = Math.min(100, (totalMinutes / 60) * 100);
                break;
            case 'study-5hr':
                unlocked = totalMinutes >= 300;
                progress = Math.min(100, (totalMinutes / 300) * 100);
                break;
            case 'study-10hr':
                unlocked = totalMinutes >= 600;
                progress = Math.min(100, (totalMinutes / 600) * 100);
                break;
            case 'study-50hr':
                unlocked = totalMinutes >= 3000;
                progress = Math.min(100, (totalMinutes / 3000) * 100);
                break;
                
            // Special achievements
            case 'early-bird':
                unlocked = savedUnlocks['early-bird'] !== undefined || currentHour < 8;
                progress = unlocked ? 100 : 0;
                break;
            case 'night-owl':
                unlocked = savedUnlocks['night-owl'] !== undefined || currentHour >= 22;
                progress = unlocked ? 100 : 0;
                break;
            case 'perfect-week':
                const last7Days = studyTime.dailyHistory.slice(-7);
                const daysWithStudy = last7Days.filter(d => d.minutes > 0).length;
                unlocked = daysWithStudy >= 7;
                progress = Math.min(100, (daysWithStudy / 7) * 100);
                break;
        }
        
        // Get or set unlock time
        let unlockedAt = savedUnlocks[def.id];
        if (unlocked && !unlockedAt) {
            unlockedAt = new Date().toISOString();
            saveAchievementUnlock(def.id, unlockedAt);
        }
        
        return {
            ...def,
            unlocked,
            unlockedAt,
            progress: Math.round(progress),
        };
    });
};

/**
 * Get only unlocked achievements
 */
export const getUnlockedAchievements = (): Achievement[] => {
    return calculateAchievements().filter(a => a.unlocked);
};

/**
 * Get achievement statistics
 */
export const getAchievementStats = (): {
    total: number;
    unlocked: number;
    percentage: number;
    recentUnlock?: Achievement;
} => {
    const achievements = calculateAchievements();
    const unlocked = achievements.filter(a => a.unlocked);
    
    // Find most recent unlock
    const recentUnlock = unlocked
        .filter(a => a.unlockedAt)
        .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())[0];
    
    return {
        total: achievements.length,
        unlocked: unlocked.length,
        percentage: Math.round((unlocked.length / achievements.length) * 100),
        recentUnlock,
    };
};

/**
 * Get achievements by category
 */
export const getAchievementsByCategory = (category: Achievement['category']): Achievement[] => {
    return calculateAchievements().filter(a => a.category === category);
};

// Local storage helpers for tracking unlock times
const STORAGE_KEY = 'achievement-unlocks';

const getSavedAchievementUnlocks = (): Record<string, string> => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
};

const saveAchievementUnlock = (id: string, timestamp: string): void => {
    const unlocks = getSavedAchievementUnlocks();
    unlocks[id] = timestamp;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocks));
};

/**
 * Get rarity color
 */
export const getRarityColor = (rarity: Achievement['rarity']): { bg: string; text: string; border: string } => {
    switch (rarity) {
        case 'common':
            return { bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-200' };
        case 'rare':
            return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' };
        case 'epic':
            return { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' };
        case 'legendary':
            return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' };
    }
};

export default {
    calculateAchievements,
    getUnlockedAchievements,
    getAchievementStats,
    getAchievementsByCategory,
    getRarityColor,
};
