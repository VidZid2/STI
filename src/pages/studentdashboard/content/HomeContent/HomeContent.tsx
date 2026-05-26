import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CourseCard, ReorderableCourseGrid } from '../../../../components/shared';
import { NumberTicker } from '../../../../components/ui/primitives/number-ticker';
import { getSettings, getProfile, getImages } from '../../../../services/profileService';
import { useNotifications } from '../../../../contexts/NotificationContext';
import {
    getStudyTimeData,
    getStreakData,
    getCourseProgressData,
    
    
    
    
    
    getStudyTimeHours,
    initializeTracking,
    getXPData,
    getXPProgress,
    type StudyTimeData,
    type StreakData,
    type CourseProgressData } from '../../../../services/studyTimeService';
import { getUpcomingDeadlines } from '../../../../services/deadlinesService';
import BroadcastBanner from '../../../../components/shared/BroadcastBanner';
import { ProgressRing, RoleBadge, HomeSkeleton } from './components/HomeShared';
import { NewsSlideshow } from './components/NewsSlideshow';
import { AchievementToast } from './components/AchievementToast';
import HoverTooltip from '../../components/HoverTooltip';

// Animation variants for staggered children - optimized for performance
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.03, // Reduced from 0.1 for faster perceived load
            delayChildren: 0
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.2,
            ease: 'easeOut' as const
        }
    }
};

// cardVariants available for future use if needed
const _cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.2,
            ease: 'easeOut'
        }
    }
};
void _cardVariants;

interface HomeContentProps {
    onShowWelcomeModal: () => void;
}

const BOOKMARKS_STORAGE_KEY = 'course-bookmarks';
const COURSE_ORDER_STORAGE_KEY = 'course-order';
const VIEW_MODE_STORAGE_KEY = 'courses-view-mode';
const SORT_MODE_STORAGE_KEY = 'courses-sort-mode';

type CourseSortMode = 'default' | 'least-progress' | 'most-progress' | 'bookmarked' | 'major-first';

const SORT_OPTIONS: { value: CourseSortMode; label: string; icon: React.ReactNode }[] = [
    { value: 'default', label: 'Default', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m12 8 4 4-4 4M8 12h8"/></svg> },
    { value: 'least-progress', label: 'Least Progress', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg> },
    { value: 'most-progress', label: 'Most Progress', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
    { value: 'bookmarked', label: 'Bookmarked', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
    { value: 'major-first', label: 'Major First', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
];

// ProgressRing + WhatsNewButton + ConfettiBurst + RoleBadge + HomeSkeleton â€” moved to ./components/HomeShared.tsx
// NewsSlideshow â€” moved to ./components/NewsSlideshow.tsx
// AchievementToast â€” moved to ./components/AchievementToast.tsx

const HomeContent: React.FC<HomeContentProps> = ({ onShowWelcomeModal }) => {
    const { addNotification: _addNotification } = useNotifications();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [hoveredAction, setHoveredAction] = useState<string | null>(null);

    

    const [coursesPerView, setCoursesPerView] = useState(4);
    const [showAchievement, setShowAchievement] = useState(false);
    const [isStatsExpanded, setIsStatsExpanded] = useState(false);
    const statsBarRef = React.useRef<HTMLDivElement>(null);
    const [_hoveredProgressBar, _setHoveredProgressBar] = useState<string | null>(null);
    const [_celebratingMilestones, _setCelebratingMilestones] = useState<Record<string, boolean>>({});
    const [achievement, setAchievement] = useState({ title: '', description: '', icon: 'ðŸ†' });
    const [isHomeLoading, setIsHomeLoading] = useState(true);
    

    // Real-time tracking state
    const [studyTimeData, setStudyTimeData] = useState<StudyTimeData>(() => getStudyTimeData());
    const [streakData, setStreakData] = useState<StreakData>(() => getStreakData());
    const [courseProgressData, setCourseProgressData] = useState<CourseProgressData>(() => getCourseProgressData());
    
    // Computed values from real-time data
    const completedCourses = useMemo(() => Object.values(courseProgressData).filter(c => c.progress === 100).length, [courseProgressData]);
    const inProgressCourses = useMemo(() => Object.values(courseProgressData).filter(c => c.progress > 0 && c.progress < 100).length, [courseProgressData]);
    const totalEnrolledCourses = useMemo(() => Object.keys(courseProgressData).length, [courseProgressData]);
    const notStartedCourses = useMemo(() => Object.values(courseProgressData).filter(c => c.progress === 0).length, [courseProgressData]);
    const overallProgress = useMemo(() => {
        const courses = Object.values(courseProgressData);
        if (courses.length === 0) return 0;
        const total = courses.reduce((sum, c) => sum + c.progress, 0);
        return Math.round(total / courses.length);
    }, [courseProgressData]);
    const studyTimeHours = useMemo(() => getStudyTimeHours(), [studyTimeData]);
    
    // Upcoming deadlines count (within 7 days)
    const upcomingDeadlinesCount = useMemo(() => getUpcomingDeadlines(7).length, []);
    const [showOnlineStatus, setShowOnlineStatus] = useState(() => {
        const settings = getSettings();
        return settings.showOnlineStatus;
    });
    const [profileImage, setProfileImage] = useState<string | null>(() => {
        const images = getImages();
        return images.profileImage;
    });
    const [coverImage, setCoverImage] = useState<string | null>(() => {
        const images = getImages();
        return images.coverImage;
    });
    const [userFullName, setUserFullName] = useState(() => {
        const profile = getProfile();
        const middleInitial = profile.middleName ? ` ${profile.middleName.charAt(0)}.` : '';
        return `${profile.firstName}${middleInitial} ${profile.lastName}`;
    });
    const [userLevel, setUserLevel] = useState(() => getXPData().currentLevel);
    const [, setXpProgress] = useState(() => getXPProgress());
    const [viewMode, setViewMode] = useState<'carousel' | 'grid'>(() => {
        try {
            const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
            const savedMode = saved as 'carousel' | 'grid' | '3d';
            return (savedMode === '3d' ? 'carousel' : savedMode) || 'carousel';
        } catch {
            return 'carousel';
        }
    });
    const [sortMode, setSortMode] = useState<CourseSortMode>(() => {
        try {
            const saved = localStorage.getItem(SORT_MODE_STORAGE_KEY);
            return (saved as CourseSortMode) || 'default';
        } catch {
            return 'default';
        }
    });
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const sortDropdownRef = React.useRef<HTMLDivElement>(null);
    const [courseOrder, setCourseOrder] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem(COURSE_ORDER_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [bookmarks, setBookmarks] = useState<Record<string, boolean>>(() => {
        // Load bookmarks from localStorage on initial render
        try {
            const saved = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        const handleResize = () => {
            // Enforce exactly 1 card per view for a more focused, singular presentation
            setCoursesPerView(1);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    // Initial loading state
    useEffect(() => {
        const timer = setTimeout(() => setIsHomeLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    // Initialize study time tracking (with database sync)
    useEffect(() => {
        const init = async () => {
            await initializeTracking();
            // Refresh data after database sync
            setStudyTimeData(getStudyTimeData());
            setStreakData(getStreakData());
            setCourseProgressData(getCourseProgressData());
        };
        init();
        
        // Update tracking data every 30 seconds
        const trackingInterval = setInterval(() => {
            setStudyTimeData(getStudyTimeData());
            setStreakData(getStreakData());
            setCourseProgressData(getCourseProgressData());
        }, 30000);
        
        return () => clearInterval(trackingInterval);
    }, []);

    // Show achievement toast only at 5-day milestones (5, 10, 15, 20, etc.)
    useEffect(() => {
        const streak = streakData.currentStreak;
        
        // Only show at 5-day milestones
        if (streak > 0 && streak % 5 === 0) {
            // Check if we already showed this milestone today
            const lastShownMilestone = localStorage.getItem('lastStreakMilestoneShown');
            const milestoneKey = `streak-${streak}`;
            
            if (lastShownMilestone !== milestoneKey) {
                // Delay achievement toast to after initial render is complete
                const timer = setTimeout(() => {
                    setAchievement({
                        title: `${streak} Day Streak!`,
                        description: `Amazing! You've been learning consistently for ${streak} days. Keep it up!`,
                        icon: '🔥'
                    });
                    setShowAchievement(true);
                    // Mark this milestone as shown
                    localStorage.setItem('lastStreakMilestoneShown', milestoneKey);
                }, 3000);
                
                // Auto-hide after 5 seconds
                const hideTimer = setTimeout(() => {
                    setShowAchievement(false);
                }, 8000);
                
                return () => {
                    clearTimeout(timer);
                    clearTimeout(hideTimer);
                };
            }
        }
    }, [streakData.currentStreak]);

    // Listen for settings/profile changes - optimized polling
    useEffect(() => {
        const handleStorageChange = () => {
            const settings = getSettings();
            setShowOnlineStatus(settings.showOnlineStatus);
            
            const images = getImages();
            setProfileImage(images.profileImage);
            setCoverImage(images.coverImage);
            
            const profile = getProfile();
            const middleInitial = profile.middleName ? ` ${profile.middleName.charAt(0)}.` : '';
            setUserFullName(`${profile.firstName}${middleInitial} ${profile.lastName}`);
            
            setUserLevel(getXPData().currentLevel);
            setXpProgress(getXPProgress());
        };
        
        window.addEventListener('storage', handleStorageChange);
        // Reduced polling frequency for better performance (1000ms instead of 100ms)
        const interval = setInterval(handleStorageChange, 1000);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    // Save bookmarks to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    }, [bookmarks]);

    // Save view mode to localStorage
    useEffect(() => {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
    }, [viewMode]);

    // Save sort mode to localStorage
    useEffect(() => {
        localStorage.setItem(SORT_MODE_STORAGE_KEY, sortMode);
        setCurrentSlide(0); // Reset to first card when sort changes
    }, [sortMode]);

    // Close sort dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
                setIsSortDropdownOpen(false);
            }
        };
        if (isSortDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isSortDropdownOpen]);

    // Save course order to localStorage
    useEffect(() => {
        if (courseOrder.length > 0) {
            localStorage.setItem(COURSE_ORDER_STORAGE_KEY, JSON.stringify(courseOrder));
        }
    }, [courseOrder]);

    const handleBookmarkToggle = (courseTitle: string, isBookmarked: boolean) => {
        setBookmarks(prev => ({
            ...prev,
            [courseTitle]: isBookmarked
        }));
    };

    // Helper to check if course has been visited (has progress or time spent)
    const hasVisitedCourse = (courseId: string) => {
        const data = courseProgressData[courseId];
        return data && (data.progress > 0 || data.timeSpent > 0);
    };

    // Helper to calculate grade based on progress
    const getGradeFromProgress = (progress: number): { current: number; letter: string; trend: 'up' | 'down' | 'stable' } => {
        if (progress >= 90) return { current: progress, letter: 'A', trend: 'up' };
        if (progress >= 80) return { current: progress, letter: 'B', trend: 'up' };
        if (progress >= 70) return { current: progress, letter: 'C', trend: 'stable' };
        if (progress >= 60) return { current: progress, letter: 'D', trend: 'down' };
        return { current: progress, letter: 'C', trend: 'stable' };
    };

    // Course progress is loaded from courseProgressData (synced with Supabase)
    // Grade is calculated based on progress percentage
    const coursesData = [
        { id: 'cp1', shortTitle: 'CP1', title: "Computer Programming 1 - SY2526-1T", subtitle: "CITE1003 · BSIT101A", image: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=300&h=200&fit=crop&crop=center", progress: courseProgressData['cp1']?.progress || 0, modules: 1, nextLesson: "Module 1: Introduction to Programming", timeEstimate: "~25 min", lastAccessed: hasVisitedCourse('cp1') ? "Recently" : "Not started", grade: getGradeFromProgress(courseProgressData['cp1']?.progress || 0), studyStreak: hasVisitedCourse('cp1') ? streakData.currentStreak : undefined, instructor: { name: "David Clarence Del Mundo" }, category: 'major' as const },
        { id: 'euth1', shortTitle: 'EUTH1', title: "Euthenics 1 - SY2526-1T", subtitle: "STIC1002 · BSIT101A", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=200&fit=crop&crop=center", progress: courseProgressData['euth1']?.progress || 0, modules: 1, nextLesson: "Chapter 1: Introduction", timeEstimate: "~20 min", lastAccessed: hasVisitedCourse('euth1') ? "Recently" : "Not started", grade: getGradeFromProgress(courseProgressData['euth1']?.progress || 0), studyStreak: hasVisitedCourse('euth1') ? streakData.currentStreak : undefined, instructor: { name: "Claire Maurillo" }, category: 'ge' as const },
        { id: 'itc', shortTitle: 'ITC', title: "Introduction to Computing - SY2526-1T", subtitle: "CITE1004 · BSIT101A", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=200&fit=crop&crop=center", progress: courseProgressData['itc']?.progress || 0, modules: 1, nextLesson: "Module 1: What is Computing?", timeEstimate: "~30 min", lastAccessed: hasVisitedCourse('itc') ? "Recently" : "Not started", grade: getGradeFromProgress(courseProgressData['itc']?.progress || 0), studyStreak: hasVisitedCourse('itc') ? streakData.currentStreak : undefined, instructor: { name: "Psalmmiracle Mariano" }, category: 'major' as const },
        { id: 'nstp1', shortTitle: 'NSTP1', title: "National Service Training Program 1 - SY2526-1T", subtitle: "NSTP1008 · BSIT101A", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&h=200&fit=crop&crop=center", progress: courseProgressData['nstp1']?.progress || 0, modules: 1, nextLesson: "Unit 1: Introduction to NSTP", timeEstimate: "~45 min", lastAccessed: hasVisitedCourse('nstp1') ? "Recently" : "Not started", grade: getGradeFromProgress(courseProgressData['nstp1']?.progress || 0), studyStreak: hasVisitedCourse('nstp1') ? streakData.currentStreak : undefined, instructor: { name: "Dan Risty Montojo" }, category: 'nstp' as const },
        { id: 'pe1', shortTitle: 'PE1', title: "P.E./PATHFIT 1: Movement Competency Training - SY2526-1T", subtitle: "PHED1005 · BSIT101A", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=200&fit=crop&crop=center", progress: courseProgressData['pe1']?.progress || 0, modules: 1, nextLesson: "Week 1: Fitness Assessment", timeEstimate: "~35 min", lastAccessed: hasVisitedCourse('pe1') ? "Recently" : "Not started", grade: getGradeFromProgress(courseProgressData['pe1']?.progress || 0), studyStreak: hasVisitedCourse('pe1') ? streakData.currentStreak : undefined, instructor: { name: "Mark Joseph Danoy" }, category: 'pe' as const },
        { id: 'ppc', shortTitle: 'PPC', title: "Philippine Popular Culture - SY2526-1T", subtitle: "GEDC1041 · BSIT101A", image: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=300&h=200&fit=crop&crop=center", progress: courseProgressData['ppc']?.progress || 0, modules: 1, nextLesson: "Topic 1: What is Culture?", timeEstimate: "~20 min", lastAccessed: hasVisitedCourse('ppc') ? "Recently" : "Not started", grade: getGradeFromProgress(courseProgressData['ppc']?.progress || 0), studyStreak: hasVisitedCourse('ppc') ? streakData.currentStreak : undefined, instructor: { name: "Claire Maurillo" }, category: 'ge' as const },
        { id: 'purcom', shortTitle: 'PURCOM', title: "Purposive Communication - SY2526-1T", subtitle: "GEDC1016 · BSIT101A", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&h=200&fit=crop&crop=center", progress: courseProgressData['purcom']?.progress || 0, modules: 1, nextLesson: "Lesson 1: Communication Basics", timeEstimate: "~40 min", lastAccessed: hasVisitedCourse('purcom') ? "Recently" : "Not started", grade: getGradeFromProgress(courseProgressData['purcom']?.progress || 0), studyStreak: hasVisitedCourse('purcom') ? streakData.currentStreak : undefined, instructor: { name: "John Denielle San Martin" }, category: 'ge' as const },
        { id: 'tcw', shortTitle: 'TCW', title: "The Contemporary World - SY2526-1T", subtitle: "GEDC1002 · BSIT101A", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=200&fit=crop&crop=center", progress: courseProgressData['tcw']?.progress || 0, modules: 1, nextLesson: "Chapter 1: Globalization", timeEstimate: "~25 min", lastAccessed: hasVisitedCourse('tcw') ? "Recently" : "Not started", grade: getGradeFromProgress(courseProgressData['tcw']?.progress || 0), studyStreak: hasVisitedCourse('tcw') ? streakData.currentStreak : undefined, instructor: { name: "Anne Jenell Lumintigar" }, category: 'ge' as const },
        { id: 'uts', shortTitle: 'UTS', title: "Understanding the Self - SY2526-1T", subtitle: "GEDC1008 · BSIT101A", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&crop=center", progress: courseProgressData['uts']?.progress || 0, modules: 1, nextLesson: "Module 1: The Self", timeEstimate: "~30 min", lastAccessed: hasVisitedCourse('uts') ? "Recently" : "Not started", grade: getGradeFromProgress(courseProgressData['uts']?.progress || 0), studyStreak: hasVisitedCourse('uts') ? streakData.currentStreak : undefined, instructor: { name: "Jocel Lazalita" }, category: 'ge' as const },
    ];

    // Sort courses based on saved order first
    const orderSortedData = courseOrder.length > 0
        ? [...coursesData].sort((a, b) => {
            const indexA = courseOrder.indexOf(a.id);
            const indexB = courseOrder.indexOf(b.id);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        })
        : coursesData;

    // Merge course data with bookmark state
    const coursesWithBookmarks = orderSortedData.map(course => ({
        ...course,
        isBookmarked: bookmarks[course.title] ?? false
    }));

    const mostRecentCourse = useMemo(() => {
        let recentId = 'cp1';
        let maxTime = 0;
        Object.entries(courseProgressData).forEach(([id, data]) => {
            if (data && data.lastAccessed) {
                const time = new Date(data.lastAccessed).getTime();
                if (time > maxTime) {
                    maxTime = time;
                    recentId = id;
                }
            }
        });
        return coursesData.find(c => c.id === recentId) || coursesData[0];
    }, [courseProgressData]);

    // Apply active sort mode
    const courses = useMemo(() => {
        const data = [...coursesWithBookmarks];
        switch (sortMode) {
            case 'least-progress':
                return data.sort((a, b) => a.progress - b.progress);
            case 'most-progress':
                return data.sort((a, b) => b.progress - a.progress);
            case 'bookmarked':
                return data.sort((a, b) => (b.isBookmarked ? 1 : 0) - (a.isBookmarked ? 1 : 0));
            case 'major-first': {
                const categoryPriority: Record<string, number> = { major: 0, ge: 1, nstp: 2, pe: 3 };
                return data.sort((a, b) => (categoryPriority[a.category] ?? 99) - (categoryPriority[b.category] ?? 99));
            }
            default:
                return data;
        }
    }, [coursesWithBookmarks, sortMode]);

    // Handle course reorder
    const handleCourseReorder = (newOrder: { id: string }[]) => {
        setCourseOrder(newOrder.map(c => c.id));
    };

    // Handle bookmark toggle for grid view (uses id instead of title)
    const handleGridBookmarkToggle = (courseId: string, isBookmarked: boolean) => {
        const course = coursesData.find(c => c.id === courseId);
        if (course) {
            handleBookmarkToggle(course.title, isBookmarked);
        }
    };

    const maxSlide = Math.max(0, courses.length - coursesPerView);

    const slideCourses = (direction: 'prev' | 'next') => {
        if (direction === 'next' && currentSlide < maxSlide) {
            setCurrentSlide(prev => prev + 1);
        } else if (direction === 'prev' && currentSlide > 0) {
            setCurrentSlide(prev => prev - 1);
        }
    };



    // Upcoming deadlines - available for future use
    const _deadlines = [
        { day: '28', month: 'Nov', title: 'Programming Assignment 3', course: 'Computer Programming 1', urgent: true },
        { day: '30', month: 'Nov', title: 'Quiz: Chapter 5', course: 'Introduction to Computing', urgent: false },
        { day: '02', month: 'Dec', title: 'Performance Task', course: 'Purposive Communication', urgent: false },
    ];
    void _deadlines;

    // Recent activity - available for future use
    const _activities = [
        { type: 'completed', title: 'Completed Module 5', course: 'Computer Programming 1', time: '2 hours ago' },
        { type: 'submitted', title: 'Submitted Assignment 2', course: 'Introduction to Computing', time: '5 hours ago' },
        { type: 'started', title: 'Started Module 3', course: 'Euthenics 1', time: 'Yesterday' },
    ];
    void _activities;

    // Show skeleton while loading
    if (isHomeLoading) {
        return (
            <>
                <HomeSkeleton />
                {/* Achievement Toast - Always visible, fixed position */}
                <AchievementToast
                    show={showAchievement}
                    title={achievement.title}
                    description={achievement.description}
                    icon={achievement.icon}
                    onClose={() => setShowAchievement(false)}
                />
            </>
        );
    }

    return (
        <motion.div
            className="home-content"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Achievement Toast */}
            <AchievementToast
                show={showAchievement}
                title={achievement.title}
                description={achievement.description}
                icon={achievement.icon}
                onClose={() => setShowAchievement(false)}
            />

            {/* Admin Broadcast Banners â€” Real-time from Supabase */}
            <BroadcastBanner role="student" />

            {/* Welcome Hero — SaaS Command Center */}
            <motion.section
                className="welcome-hero"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                <div className="welcome-cards-row">
                {/* SaaS Welcome Hero Card */}
                <motion.div
                    className="hero-card-saas"
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: 0.1 }}
                >
                    {/* Cover Photo - Dynamic or Default GIF */}
                    <div 
                        className="hero-cover-photo" 
                        style={{ backgroundImage: `url('${coverImage || 'https://i.pinimg.com/originals/a0/62/7f/a0627fbfba05a0d63dc58bc1651817c7.gif'}')` }}
                    >
                        <div className="hero-cover-fade"></div>
                    </div>

                    {/* Top Row: Avatar + Greeting + Metrics */}
                    <div className="hero-top-row">
                        {/* Left: Avatar + Text */}
                        <div className="hero-identity">
                            <motion.div
                                className="avatar-progress-wrapper"
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <ProgressRing progress={overallProgress} size={72} strokeWidth={4} />
                                <div className={`avatar-inner-centered ${showOnlineStatus ? 'avatar-online-outline' : ''}`}>
                                    {profileImage ? (
                                        <img src={profileImage} alt="Profile" className="hero-avatar-img" />
                                    ) : (
                                        <div className="hero-avatar-letter">{userFullName.charAt(0).toUpperCase()}</div>
                                    )}
                                </div>
                                <div className="avatar-level-badge">
                                    Lv.{userLevel}
                                </div>
                            </motion.div>

                            <motion.div
                                className="hero-text"
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.25, duration: 0.4 }}
                            >
                                <motion.span
                                    className="hero-greeting"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.35 }}
                                >
                                    {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}
                                </motion.span>
                                <AnimatePresence mode="wait">
                                    <motion.h1
                                        key={userFullName}
                                        className="hero-name"
                                        initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                        exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                                        transition={{ delay: 0.35, duration: 0.4, type: 'spring', stiffness: 150, damping: 20 }}
                                    >
                                        {userFullName}
                                    </motion.h1>
                                </AnimatePresence>
                                <RoleBadge />
                            </motion.div>
                        </div>

                        {/* Right: Metrics Grid */}
                        <motion.div
                            className="hero-metrics"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35, duration: 0.4 }}
                        >
                            <div className="hero-metric-card">
                                <div className="hero-metric-icon courses">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                                </div>
                                <span className="hero-metric-num">{totalEnrolledCourses}</span>
                                <span className="hero-metric-lbl">Courses</span>
                            </div>
                            <div className="hero-metric-card">
                                <div className="hero-metric-icon progress">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                                </div>
                                <span className="hero-metric-num">{overallProgress}<span className="hero-metric-unit">%</span></span>
                                <span className="hero-metric-lbl">Progress</span>
                            </div>
                            <div className="hero-metric-card">
                                <div className="hero-metric-icon streak">
                                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>
                                </div>
                                <span className="hero-metric-num">{streakData.currentStreak}</span>
                                <span className="hero-metric-lbl">Day Streak</span>
                            </div>
                            <div className="hero-metric-card">
                                <div className="hero-metric-icon study">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                </div>
                                <span className="hero-metric-num">{studyTimeHours}<span className="hero-metric-unit">h</span></span>
                                <span className="hero-metric-lbl">Study Time</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Bottom Action Bar */}
                    <motion.div
                        className="hero-action-bar"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.35 }}
                    >
                        {/* Continue CTA */}
                        {/* Action Bar (Card + Chips) */}
                        <motion.div
                            className="hero-continue-card"
                            whileHover={{ scale: 1.002 }}
                            whileTap={{ scale: 0.998 }}
                        >
                            <div className="hero-continue-left">
                                <div className="hero-continue-icon-wrap">
                                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                </div>
                                <div className="hero-continue-text">
                                    <span className="hero-continue-label">Continue where you left off</span>
                                    <span className="hero-continue-module">{mostRecentCourse?.shortTitle || mostRecentCourse?.title.split(' - ')[0]}: {mostRecentCourse?.nextLesson || "Chapter 1"}</span>
                                </div>
                            </div>

                            <div className="hero-continue-middle">
                                <div className="hero-chip date">
                                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"/></svg>
                                    <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                </div>
                                <div className={`hero-chip ${upcomingDeadlinesCount > 0 ? 'danger' : 'success'}`}>
                                    {upcomingDeadlinesCount > 0 ? (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
                                            <span>{upcomingDeadlinesCount} due soon</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                            <span>All clear</span>
                                        </>
                                    )}
                                </div>
                                <div className="hero-chip semester">
                                    <span>SY 2025-26 · 1st Term</span>
                                </div>
                            </div>

                            <div className="hero-continue-right">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Progress Overview */}
                    <motion.div
                        className="hero-progress-section"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55, duration: 0.35 }}
                    >
                        <div className="hero-progress-header">
                            <span className="hero-progress-title">Course Progress</span>
                            <div className="hero-progress-badge">
                                <motion.span
                                    className="hero-progress-pct"
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
                                >
                                    {overallProgress}%
                                </motion.span>
                            </div>
                        </div>
                        {/* Segmented progress bar */}
                        <div className="hero-progress-segmented">
                            <motion.div
                                className="hero-seg completed"
                                initial={{ width: 0 }}
                                animate={{ width: totalEnrolledCourses > 0 ? `${(completedCourses / totalEnrolledCourses) * 100}%` : '0%' }}
                                transition={{ delay: 0.7, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                            />
                            <motion.div
                                className="hero-seg in-progress"
                                initial={{ width: 0 }}
                                animate={{ width: totalEnrolledCourses > 0 ? `${(inProgressCourses / totalEnrolledCourses) * 100}%` : '0%' }}
                                transition={{ delay: 0.85, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                            />
                            <motion.div
                                className="hero-seg not-started"
                                initial={{ width: 0 }}
                                animate={{ width: totalEnrolledCourses > 0 ? `${(notStartedCourses / totalEnrolledCourses) * 100}%` : '100%' }}
                                transition={{ delay: 1.0, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                            />
                        </div>
                        {/* Stat chips */}
                        <div className="hero-progress-chips">
                            <div className="hero-pchip completed">
                                <span className="hero-pchip-num">{completedCourses}</span>
                                <span className="hero-pchip-label">Completed</span>
                            </div>
                            <div className="hero-pchip in-progress">
                                <span className="hero-pchip-num">{inProgressCourses}</span>
                                <span className="hero-pchip-label">In Progress</span>
                            </div>
                            <div className="hero-pchip not-started">
                                <span className="hero-pchip-num">{notStartedCourses}</span>
                                <span className="hero-pchip-label">Not Started</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        className="hero-quick-actions"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.35 }}
                    >
                        <motion.button className="hero-quick-btn" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: { tab: 'tools' } }))}>
                            <div className="hero-quick-icon tools">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                            </div>
                            <span>Tools</span>
                        </motion.button>
                        <motion.button className="hero-quick-btn" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: { tab: 'goals' } }))}>
                            <div className="hero-quick-icon goals">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                            </div>
                            <span>Goals</span>
                        </motion.button>
                        <motion.button className="hero-quick-btn" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: { tab: 'paths' } }))}>
                            <div className="hero-quick-icon paths">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                            </div>
                            <span>Paths</span>
                        </motion.button>
                        <motion.button className="hero-quick-btn" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: { tab: 'groups' } }))}>
                            <div className="hero-quick-icon groups">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            </div>
                            <span>Groups</span>
                        </motion.button>
                    </motion.div>
                </motion.div>

                {/* News Slideshow */}
                <NewsSlideshow onShowChangelog={onShowWelcomeModal} />
                </div>

            {/* Courses Section - Premium SaaS Grid */}
            <motion.section 
                className="courses-section-premium"
                variants={itemVariants}
            >
                <motion.div 
                    className="courses-header-saas"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                    <div className="courses-header-left">
                        <motion.div 
                            className="courses-icon-wrapper"
                            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 20 }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                <path d="M8 7h8M8 11h6" />
                            </svg>
                        </motion.div>
                        <div className="courses-title-block">
                            <motion.h2
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.28, type: 'spring', stiffness: 200 }}
                            >
                                Your Courses
                            </motion.h2>
                            <motion.p
                                className="courses-subtitle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.35, duration: 0.4 }}
                            >
                                {completedCourses > 0 
                                    ? `${completedCourses} completed Â· ${inProgressCourses} in progress` 
                                    : 'Current semester enrollment'}
                            </motion.p>
                        </div>
                        <motion.span 
                            className="courses-count-pill"
                            initial={{ opacity: 0, scale: 0.8, x: -10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ delay: 0.32, type: 'spring', stiffness: 300 }}
                        >
                            <span className="count-num">{courses.length}</span>
                            <span className="count-text">enrolled</span>
                        </motion.span>
                    </div>

                    <div className="courses-header-right">
                        {/* Sort Dropdown */}
                        <div className="sort-dropdown-saas" ref={sortDropdownRef}>
                            <motion.button
                                className={`relative sort-trigger-btn ${sortMode !== 'default' ? 'has-sort' : ''}`}
                                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                                onMouseEnter={() => setHoveredAction('sort')}
                                onMouseLeave={() => setHoveredAction(null)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                                    <path d="M3 6h18M6 12h12M9 18h6" />
                                </svg>
                                <span className="sort-label">
                                    {SORT_OPTIONS.find(o => o.value === sortMode)?.label || 'Sort'}
                                </span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12, transition: 'transform 0.15s ease', transform: isSortDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                                <HoverTooltip visible={hoveredAction === 'sort' && !isSortDropdownOpen} title="Sort Courses" description="Arrange by progress, etc." icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><path d="M3 6h18M6 12h12M9 18h6" /></svg>} />
                            </motion.button>
                            <AnimatePresence>
                                {isSortDropdownOpen && (
                                    <motion.div
                                        className="sort-dropdown-menu"
                                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                        transition={{ duration: 0.12, ease: 'easeOut' }}
                                    >
                                        {SORT_OPTIONS.map(option => (
                                            <button
                                                key={option.value}
                                                className={`sort-option ${sortMode === option.value ? 'active' : ''}`}
                                                onClick={() => {
                                                    setSortMode(option.value);
                                                    setIsSortDropdownOpen(false);
                                                }}
                                            >
                                                <span className="sort-option-icon">{option.icon}</span>
                                                <span>{option.label}</span>
                                                {sortMode === option.value && (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, marginLeft: 'auto' }}>
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                )}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="view-mode-toggle-saas">
                            <motion.button
                                className={`relative vmt-btn ${viewMode === 'carousel' ? 'active' : ''}`}
                                onClick={() => setViewMode('carousel')}
                                onMouseEnter={() => setHoveredAction('carousel')}
                                onMouseLeave={() => setHoveredAction(null)}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="6" width="6" height="12" rx="1.5" />
                                    <rect x="9" y="4" width="6" height="16" rx="1.5" />
                                    <rect x="16" y="6" width="6" height="12" rx="1.5" />
                                </svg>
                                <HoverTooltip visible={hoveredAction === 'carousel'} title="Carousel View" description="Swipe courses horizontally" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><rect x="2" y="6" width="6" height="12" rx="1.5" /><rect x="9" y="4" width="6" height="16" rx="1.5" /><rect x="16" y="6" width="6" height="12" rx="1.5" /></svg>} />
                            </motion.button>
                            <motion.button
                                className={`relative vmt-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                onMouseEnter={() => setHoveredAction('grid')}
                                onMouseLeave={() => setHoveredAction(null)}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                                </svg>
                                <HoverTooltip visible={hoveredAction === 'grid'} title="Grid View" description="See all courses at once" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>} />
                            </motion.button>
                        </div>

                        {viewMode === 'carousel' && (
                            <div className="courses-nav-group">
                                <motion.button
                                    className="nav-btn-saas"
                                    onClick={() => slideCourses('prev')}
                                    disabled={currentSlide === 0}
                                    whileHover={{ scale: 1.06 }}
                                    whileTap={{ scale: 0.94 }}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M15 18l-6-6 6-6" />
                                    </svg>
                                </motion.button>
                                <span className="nav-counter-saas">
                                    <span className="nav-counter-current">{currentSlide + 1}</span>
                                    <span className="nav-counter-sep">/</span>
                                    <span className="nav-counter-total">{courses.length}</span>
                                </span>
                                <motion.button
                                    className="nav-btn-saas"
                                    onClick={() => slideCourses('next')}
                                    disabled={currentSlide >= maxSlide}
                                    whileHover={{ scale: 1.06 }}
                                    whileTap={{ scale: 0.94 }}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </motion.button>
                            </div>
                        )}
                    </div>
                </motion.div>

                {viewMode === 'carousel' ? (
                    <div 
                        className="courses-viewport-premium"
                        style={{ 
                            perspective: '1200px',
                            perspectiveOrigin: 'center center'
                        }}
                    >
                        <motion.div 
                            className="courses-track-premium"
                            animate={{ x: `-${currentSlide * (100 / coursesPerView)}%` }}
                            transition={{ 
                                type: 'spring', 
                                stiffness: 250, 
                                damping: 30,
                                mass: 0.8
                            }}
                            style={{ 
                                transformStyle: 'preserve-3d'
                            }}
                        >
                            {courses.map((course, index) => (
                                <motion.div
                                    key={course.id}
                                    className="course-card-wrapper-premium"
                                    style={{ 
                                        width: `${100 / coursesPerView}%`,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        transformStyle: 'preserve-3d'
                                    }}
                                >
                                    <div style={{ width: '100%', maxWidth: '600px' }}>
                                        <CourseCard 
                                            title={course.title}
                                            subtitle={course.subtitle}
                                            image={course.image}
                                            progress={course.progress}
                                            modules={course.modules}
                                            nextLesson={course.nextLesson}
                                            timeEstimate={course.timeEstimate}
                                            deadline={'deadline' in course ? (course as { deadline?: { title: string; dueDate: string; daysLeft: number } }).deadline : undefined}
                                            lastAccessed={course.lastAccessed}
                                            unreadCount={'unreadCount' in course ? (course as { unreadCount?: number }).unreadCount : undefined}
                                            grade={'grade' in course ? course.grade : undefined}
                                            isBookmarked={course.isBookmarked}
                                            onBookmarkToggle={(isBookmarked) => handleBookmarkToggle(course.title, isBookmarked)}
                                            studyStreak={course.studyStreak}
                                            instructor={'instructor' in course ? course.instructor : undefined}
                                            category={'category' in course ? course.category : undefined}
                                            index={index}
                                            onContinue={() => window.dispatchEvent(new CustomEvent('navigate-to-course', { detail: { courseId: course.id, fromView: 'home' } }))}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                ) : (
                    <ReorderableCourseGrid
                        courses={courses}
                        onReorder={handleCourseReorder}
                        onBookmarkToggle={handleGridBookmarkToggle}
                    />
                )}
            </motion.section>

            </motion.section>


                {/* Compact Stats Bar - SaaS Minimalist */}
                <motion.div 
                    className="stats-bar-compact"
                    ref={statsBarRef}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    {[
                        { 
                            id: 'courses', numValue: totalEnrolledCourses, suffix: '', label: 'Courses', 
                            icon: 'book', color: '#3b82f6',
                            sub: completedCourses > 0 ? `${completedCourses} done` : `${notStartedCourses} pending`,
                            subType: 'badge' as const,
                            detail: {
                                title: 'Course Breakdown',
                                stats: [
                                    { label: 'Completed', value: String(completedCourses), color: '#10b981' },
                                    { label: 'In Progress', value: String(inProgressCourses), color: '#f59e0b' },
                                    { label: 'Not Started', value: String(notStartedCourses), color: '#94a3b8' },
                                ],
                                progress: Math.round((completedCourses / totalEnrolledCourses) * 100) || 0,
                                sparkline: [0, 0, 0, 3, 6, 9, totalEnrolledCourses],
                            }
                        },
                        { 
                            id: 'progress', numValue: overallProgress, suffix: '%', label: 'Progress', 
                            icon: 'progress', color: '#f59e0b',
                            sub: overallProgress >= 50 ? '🔥 On track' : '🔥 Keep going',
                            subType: 'fire' as const,
                            detail: {
                                title: 'Progress by Course',
                                stats: [
                                    { label: 'Midterm Goal', value: '70%', color: '#f59e0b' },
                                    { label: 'This Week', value: '+12%', color: '#10b981' },
                                ],
                                progress: overallProgress,
                                sparkline: studyTimeData.dailyHistory.slice(-7).map((_, i) => Math.round(overallProgress * (0.7 + i * 0.05))),
                            }
                        },
                        { 
                            id: 'streak', numValue: streakData.currentStreak, suffix: '', label: 'Streak', 
                            icon: 'streak', color: '#f59e0b',
                            sub: `Best: ${streakData.bestStreak} Days`,
                            subType: 'tag' as const,
                            detail: {
                                title: 'Streak Details',
                                stats: [
                                    { label: 'Current', value: `${streakData.currentStreak}d`, color: '#f59e0b' },
                                    { label: 'Best', value: `${streakData.bestStreak} Days`, color: '#10b981' },
                                    { label: 'Goal', value: '30 Days', color: '#3b82f6' },
                                ],
                                progress: Math.round((streakData.currentStreak / 30) * 100),
                                sparkline: streakData.streakHistory.slice(-7).map((h, i) => h.active ? i + 6 : 0),
                            }
                        },
                        { 
                            id: 'time', numValue: studyTimeHours, suffix: 'h', label: 'Study', 
                            icon: 'time', color: '#3b82f6',
                            sub: (() => {
                                const totalMins = studyTimeData.weeklyMinutes / 7;
                                const hrs = Math.floor(totalMins / 60);
                                const mins = Math.round(totalMins % 60);
                                return hrs > 0 ? `${hrs}h ${mins}m/day` : `${mins}m/day`;
                            })(),
                            subType: 'tag' as const,
                            detail: {
                                title: 'Study Time Details',
                                stats: [
                                    { label: 'Daily Avg', value: (() => {
                                        const totalMins = studyTimeData.weeklyMinutes / 7;
                                        const hrs = Math.floor(totalMins / 60);
                                        const mins = Math.round(totalMins % 60);
                                        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                                    })(), color: '#3b82f6' },
                                    { label: 'This Week', value: (() => {
                                        const hrs = Math.floor(studyTimeData.weeklyMinutes / 60);
                                        const mins = studyTimeData.weeklyMinutes % 60;
                                        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                                    })(), color: '#10b981' },
                                    { label: 'Monthly Goal', value: '60h', color: '#f59e0b' },
                                ],
                                progress: Math.round((studyTimeHours / 60) * 100),
                                sparkline: studyTimeData.dailyHistory.slice(-7).map(d => Math.round(d.minutes / 60)),
                            }
                        },
                    ].map((stat, index) => {
                        const isExpanded = isStatsExpanded;
                        return (
                            <div key={stat.id} className="stats-bar-item-wrapper">
                                <motion.button
                                    className={`stats-bar-item ${isExpanded ? 'active' : ''}`}
                                    onClick={() => {
                                        const willExpand = !isStatsExpanded;
                                        setIsStatsExpanded(willExpand);
                                        if (willExpand) {
                                            // Wait for expand animation, then scroll to bottom of page
                                            setTimeout(() => {
                                                window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
                                            }, 300);
                                        }
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span className="stats-bar-icon" style={{ color: stat.color }}>
                                        {stat.icon === 'book' && (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                            </svg>
                                        )}
                                        {stat.icon === 'progress' && (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                <line x1="6" y1="20" x2="6" y2="16" /><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" />
                                            </svg>
                                        )}
                                        {stat.icon === 'streak' && (
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"/>
                                            </svg>
                                        )}
                                        {stat.icon === 'time' && (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                            </svg>
                                        )}
                                    </span>
                                    <span className="stats-bar-value">
                                        <NumberTicker 
                                            value={stat.numValue} 
                                            suffix={stat.suffix} 
                                            delay={0.05}
                                            className="stats-bar-number"
                                        />
                                    </span>
                                    <span className="stats-bar-label">{stat.label}</span>
                                    <span className={`stats-bar-sub ${stat.subType === 'badge' ? 'stats-sub-badge' : ''} ${stat.subType === 'fire' ? 'stats-sub-fire' : ''} ${stat.subType === 'tag' ? 'stats-sub-tag' : ''}`}>{stat.sub}</span>
                                    <motion.svg
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                                        className="stats-bar-chevron"
                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <path d="M6 9l6 6 6-6" />
                                    </motion.svg>
                                </motion.button>

                                {/* Expandable Detail Panel */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            className="stats-bar-detail"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                                        >
                                            <motion.div 
                                                className="stats-detail-inner"
                                                initial="hidden"
                                                animate="visible"
                                                variants={{
                                                    hidden: { opacity: 0 },
                                                    visible: {
                                                        opacity: 1,
                                                        transition: { staggerChildren: 0.05, delayChildren: 0.1 + (index * 0.1) }
                                                    }
                                                }}
                                            >
                                                <motion.div className="stats-detail-header" variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                                                    <span className="stats-detail-title">{stat.detail.title}</span>
                                                </motion.div>
                                                <motion.div className="stats-detail-grid" variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                                                    {stat.detail.stats.map((s) => (
                                                        <div key={s.label} className="stats-detail-stat">
                                                            <span className="stats-detail-stat-value" style={{ color: s.color }}>{s.value}</span>
                                                            <span className="stats-detail-stat-label">{s.label}</span>
                                                        </div>
                                                    ))}
                                                </motion.div>
                                                <motion.div className="stats-detail-progress-row" variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                                                    <div className="stats-detail-progress-bar">
                                                        <motion.div 
                                                            className="stats-detail-progress-fill"
                                                            style={{ backgroundColor: stat.color }}
                                                            initial={{ scaleX: 0 }}
                                                            animate={{ scaleX: Math.min(stat.detail.progress, 100) / 100 }}
                                                            transition={{ duration: 0.4, delay: 0.2 + (index * 0.1), ease: 'easeOut' }}
                                                        />
                                                    </div>
                                                    <span className="stats-detail-progress-pct" style={{ color: stat.color }}>{Math.min(stat.detail.progress, 100)}%</span>
                                                </motion.div>
                                                <motion.div className="stats-detail-sparkline" variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                                                    <span className="sparkline-mini-label">7-day trend</span>
                                                    <svg className="sparkline-mini" viewBox="0 0 100 24" preserveAspectRatio="none">
                                                        {(() => {
                                                            const max = Math.max(...stat.detail.sparkline, 1);
                                                            const min = Math.min(...stat.detail.sparkline);
                                                            const range = max - min || 1;
                                                            const points = stat.detail.sparkline.map((value, i) => {
                                                                const x = (i / (stat.detail.sparkline.length - 1)) * 100;
                                                                const y = 22 - ((value - min) / range) * 20;
                                                                return `${x},${y}`;
                                                            });
                                                            return (
                                                                <motion.path 
                                                                    d={`M ${points.join(' L ')}`} 
                                                                    fill="none" 
                                                                    stroke={stat.color} 
                                                                    strokeWidth="2" 
                                                                    strokeLinecap="round" 
                                                                    strokeLinejoin="round" 
                                                                    initial={{ pathLength: 0, opacity: 0 }}
                                                                    animate={{ pathLength: 1, opacity: 1 }}
                                                                    transition={{ duration: 0.8, delay: 0.3 + (index * 0.1), ease: 'easeOut' }}
                                                                />
                                                            );
                                                        })()}
                                                    </svg>
                                                </motion.div>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </motion.div>

            

        </motion.div>
    );
};

export default HomeContent;

