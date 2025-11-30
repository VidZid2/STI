/**
 * Study Time Tracking Service
 * Tracks real-time study hours, course progress, and learning statistics
 */

const STORAGE_KEYS = {
    STUDY_TIME: 'study-time-data',
    COURSE_PROGRESS: 'course-progress-data',
    STREAK_DATA: 'streak-data',
    SESSION_START: 'session-start-time',
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

// Default course data matching the actual courses
const DEFAULT_COURSE_PROGRESS: CourseProgressData = {
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

// Initialize default study time data
const getDefaultStudyTimeData = (): StudyTimeData => {
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (6 - i));
        return {
            date: date.toISOString().split('T')[0],
            minutes: Math.floor(Math.random() * 60) + 30 + (i * 10), // Increasing trend
        };
    });
    
    const totalFromHistory = last7Days.reduce((sum, d) => sum + d.minutes, 0);
    
    return {
        totalMinutes: 2280, // ~38 hours total
        monthlyMinutes: 2280,
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
};

// Initialize default streak data
const getDefaultStreakData = (): StreakData => {
    const now = new Date();
    const history = Array.from({ length: 14 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (13 - i));
        return {
            date: date.toISOString().split('T')[0],
            active: i >= 2, // Last 12 days active
        };
    });
    
    return {
        currentStreak: 12,
        bestStreak: 15,
        lastActiveDate: now.toISOString().split('T')[0],
        streakHistory: history,
    };
};

// Get study time data from localStorage
export const getStudyTimeData = (): StudyTimeData => {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.STUDY_TIME);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Failed to load study time data:', e);
    }
    const defaultData = getDefaultStudyTimeData();
    localStorage.setItem(STORAGE_KEYS.STUDY_TIME, JSON.stringify(defaultData));
    return defaultData;
};

// Get streak data from localStorage
export const getStreakData = (): StreakData => {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.STREAK_DATA);
        if (saved) {
            return JSON.parse(saved);
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
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Failed to load course progress data:', e);
    }
    localStorage.setItem(STORAGE_KEYS.COURSE_PROGRESS, JSON.stringify(DEFAULT_COURSE_PROGRESS));
    return DEFAULT_COURSE_PROGRESS;
};

// Save study time data
export const saveStudyTimeData = (data: StudyTimeData): void => {
    localStorage.setItem(STORAGE_KEYS.STUDY_TIME, JSON.stringify(data));
};

// Save streak data
export const saveStreakData = (data: StreakData): void => {
    localStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify(data));
};

// Save course progress data
export const saveCourseProgressData = (data: CourseProgressData): void => {
    localStorage.setItem(STORAGE_KEYS.COURSE_PROGRESS, JSON.stringify(data));
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

// Update streak based on activity
export const updateStreak = (): void => {
    const data = getStreakData();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (data.lastActiveDate === today) {
        // Already active today
        return;
    }
    
    if (data.lastActiveDate === yesterday) {
        // Continuing streak
        data.currentStreak += 1;
        if (data.currentStreak > data.bestStreak) {
            data.bestStreak = data.currentStreak;
        }
    } else if (data.lastActiveDate !== today) {
        // Streak broken, start new
        data.currentStreak = 1;
    }
    
    data.lastActiveDate = today;
    
    // Update history
    const todayEntry = data.streakHistory.find(h => h.date === today);
    if (todayEntry) {
        todayEntry.active = true;
    } else {
        data.streakHistory.push({ date: today, active: true });
        if (data.streakHistory.length > 30) {
            data.streakHistory = data.streakHistory.slice(-30);
        }
    }
    
    saveStreakData(data);
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

// Get in-progress courses count
export const getInProgressCoursesCount = (): number => {
    const courseData = getCourseProgressData();
    return Object.values(courseData).filter(c => c.progress < 100).length;
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
    const daysWithActivity = data.dailyHistory.filter(d => d.minutes > 0).length || 1;
    const avgMinutes = Math.round(data.weeklyMinutes / Math.min(daysWithActivity, 7));
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

// Initialize tracking on app load
export const initializeTracking = (): void => {
    // Ensure data exists
    getStudyTimeData();
    getStreakData();
    getCourseProgressData();
    
    // Start session tracking
    startStudySession();
    
    // Update streak for today
    updateStreak();
    
    // Set up periodic save (every minute)
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
    formatMinutesToHours,
    getStudyTimeHours,
    getDailyAverageHours,
    getTimeLeftForCourse,
    initializeTracking,
};
