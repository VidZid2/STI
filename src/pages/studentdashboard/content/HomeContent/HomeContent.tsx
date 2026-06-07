import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Clock3, Flame, GraduationCap, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { SIDEBAR_COURSES_BASE } from '../../constants';
import { COURSE_DATA } from '../CourseViewPage/data/demoCourses';
import { getBookmarks, toggleBookmarkSync, getBookmarksSync } from '../../../../services/bookmarkService';
import { getStreakData, type StreakData, getCurrentLevel, getXPProgress } from '../../../../services/studyTimeService';
import { getProfile, getImages, getSettings } from '../../../../services/profileService';

interface HomeContentProps {
    onShowWelcomeModal?: () => void;
}

const HomeContent: React.FC<HomeContentProps> = ({ onShowWelcomeModal }) => {
    const [isStatsExpanded, setIsStatsExpanded] = useState(false);
    const [isNewsExpanded, setIsNewsExpanded] = useState(false);
    const [currentCourseIndex, setCurrentCourseIndex] = useState(0);
    // Bookmark state — initialise from localStorage cache immediately (no flash)
    const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => getBookmarksSync());
    const [streakData] = useState<StreakData>(getStreakData());
    
    // Profile Data Integration
    const [profile] = useState(() => getProfile());
    const [profileImage] = useState(() => getImages().profileImage);
    const [showOnlineStatus, setShowOnlineStatus] = useState(() => getSettings().showOnlineStatus);
    const [level] = useState(() => getCurrentLevel());
    const [xpProgress] = useState(() => getXPProgress());
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const handleSettingsUpdated = () => {
            setShowOnlineStatus(getSettings().showOnlineStatus);
        };
        window.addEventListener('settingsUpdated', handleSettingsUpdated);
        return () => window.removeEventListener('settingsUpdated', handleSettingsUpdated);
    }, []);

    useEffect(() => {
        const checkDarkMode = () => setIsDarkMode(document.body.classList.contains('dark-mode'));
        checkDarkMode();
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const getNextMilestone = () => {
        const s = streakData.currentStreak;
        if (s < 7) return 7;
        if (s < 14) return 14;
        if (s < 30) return 30;
        return 30;
    };

    const getStreakProgress = () => {
        const s = streakData.currentStreak;
        if (s < 7) return s / 7;
        if (s < 14) return (s - 7) / 7;
        if (s < 30) return (s - 14) / 16;
        return 1;
    };

    // Hydrate from Supabase on mount (replaces localStorage cache if online)
    useEffect(() => {
        getBookmarks().then(ids => setBookmarkedIds(ids));
    }, []);

    const allCourses = SIDEBAR_COURSES_BASE;

    // Pinned courses float to the top; the rest follow in original order
    const sortedCourses = [
        ...allCourses.filter(c => bookmarkedIds.includes(c.id)),
        ...allCourses.filter(c => !bookmarkedIds.includes(c.id)),
    ];

    // Clamp index whenever sort order changes
    const safeIndex = Math.min(currentCourseIndex, sortedCourses.length - 1);
    const currentCourse = sortedCourses[safeIndex];
    const courseData = COURSE_DATA[currentCourse.id];
    const instructorName = courseData?.instructor?.name || 'Instructor';
    const instructorInitial = instructorName.charAt(0).toUpperCase();

    // --- Dynamic Database Connections ---
    // Overall Progress calculations
    const totalModulesAcrossAllCourses = allCourses.reduce((acc, course) => acc + (COURSE_DATA[course.id]?.modules?.length || 0), 0);
    const totalCompletedAcrossAllCourses = allCourses.reduce((acc, course) => acc + (COURSE_DATA[course.id]?.modules?.filter(m => m.status === 'completed').length || 0), 0);
    const totalNotStartedAcrossAllCourses = totalModulesAcrossAllCourses - totalCompletedAcrossAllCourses;

    // Current Course calculations
    const currentCourseModules = courseData?.modules?.length || 1;
    const currentCompletedModules = courseData?.modules?.filter(m => m.status === 'completed').length || 0;
    const currentProgressPercentage = Math.round((currentCompletedModules / currentCourseModules) * 100);
    const currentModulesRemaining = currentCourseModules - currentCompletedModules;
    
    let currentCourseStatus = 'Not started';
    if (currentCompletedModules === currentCourseModules && currentCourseModules > 0) {
        currentCourseStatus = 'Completed';
    } else if (currentCompletedModules > 0 || courseData?.modules?.some(m => m.status === 'in-progress')) {
        currentCourseStatus = 'In progress';
    }

    const nextModule = courseData?.modules?.find(m => m.status !== 'completed');
    const upNextTitle = nextModule ? nextModule.title : 'Course Completed';
    // ------------------------------------

    // Course type tag based on course id
    const getCourseTag = (id: string) => {
        const majorCourses = ['cp1', 'itc'];
        const geCourses = ['ppc', 'purcom', 'tcw', 'uts'];
        if (majorCourses.includes(id)) return { label: 'MAJOR', color: 'bg-blue-600 text-white' };
        if (geCourses.includes(id)) return { label: 'GEN ED', color: 'bg-violet-600 text-white' };
        if (id === 'nstp1') return { label: 'NSTP', color: 'bg-amber-600 text-white' };
        if (id === 'pe1') return { label: 'PE', color: 'bg-emerald-600 text-white' };
        if (id === 'euth1') return { label: 'EUTHENICS', color: 'bg-rose-600 text-white' };
        return { label: 'COURSE', color: 'bg-slate-600 text-white' };
    };

    const courseTag = getCourseTag(currentCourse.id);

    const handlePrevCourse = () => setCurrentCourseIndex(prev => prev === 0 ? sortedCourses.length - 1 : prev - 1);
    const handleNextCourse = () => setCurrentCourseIndex(prev => prev === sortedCourses.length - 1 ? 0 : prev + 1);

    const handleToggleBookmark = (courseId: string) => {
        // Optimistic update first so button reacts instantly
        const isCurrentlyBookmarked = bookmarkedIds.includes(courseId);
        const updated = isCurrentlyBookmarked
            ? bookmarkedIds.filter(id => id !== courseId)
            : [courseId, ...bookmarkedIds];
        setBookmarkedIds(updated);
        // Persist to localStorage + Supabase (fire-and-forget)
        toggleBookmarkSync(courseId);
    };
    const isCurrentCourseBookmarked = bookmarkedIds.includes(currentCourse.id);

    const handleContinueCourse = () => {
        const event = new CustomEvent('navigate-to-course', {
            detail: { courseId: currentCourse.id, fromView: 'home' }
        });
        window.dispatchEvent(event);
    };

    return (
        <div className="w-full h-full p-4 pb-28 sm:p-6 sm:pb-8 lg:p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
            {/* Welcome Modal Card (SaaS Style) */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative overflow-hidden bg-white/60 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-300 rounded-[28px] p-6 lg:p-8 flex flex-col gap-7 group"
            >
                {/* Background ambient glow effect for SaaS feel */}
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[80px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

                {/* --- Top Section: Profile Card --- */}
                <div className="flex flex-col relative w-full mb-0">
                    {/* Good Morning / User Profile Card (Study Tools UI/UX) */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-[24px] p-5 flex flex-col group transition-all duration-300 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 w-full overflow-hidden">
                        
                        {/* Header (Clickable for Dropdown) */}
                        <div 
                            className="flex flex-row items-center justify-between gap-4 cursor-pointer w-full"
                            onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                        >
                            {/* Left: Avatar & Text */}
                            <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                    className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 relative transition-transform duration-300"
                                >
                                    {/* Circular Level Gauge & Online Status Ring */}
                                    <svg 
                                        className="absolute -inset-[6px] w-[68px] h-[68px] pointer-events-none z-0" 
                                        viewBox="0 0 68 68"
                                        style={{ transform: 'rotate(-90deg)' }}
                                    >
                                        {/* Background track */}
                                        <circle
                                            cx="34"
                                            cy="34"
                                            r="30"
                                            fill="none"
                                            stroke={isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(219, 234, 254, 0.6)'}
                                            strokeWidth="4"
                                        />
                                        {/* Progress track */}
                                        <motion.circle
                                            cx="34"
                                            cy="34"
                                            r="30"
                                            fill="none"
                                            stroke="#3b82f6"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            pathLength="100"
                                            strokeDasharray="100"
                                            initial={{ strokeDashoffset: 100 }}
                                            animate={{ strokeDashoffset: Math.max(0, 100 - xpProgress) }}
                                            transition={{ duration: 1.2, ease: "easeOut" }}
                                        />
                                    </svg>

                                    {/* Avatar Background */}
                                    <div 
                                        className="w-full h-full rounded-full flex items-center justify-center shadow-sm overflow-hidden relative z-10"
                                        style={{ 
                                            background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(219, 234, 254, 0.6)'
                                        }}
                                    >
                                        {profileImage ? (
                                            <img src={profileImage} alt="Profile" className='w-full h-full object-cover' />
                                        ) : (
                                            <div className={`w-full h-full flex items-center justify-center font-extrabold text-[18px] ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                                {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Level Badge overlapping bottom center */}
                                    <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 min-w-[36px] h-[18px] px-1.5 rounded-md flex items-center justify-center text-[10px] font-bold tracking-wider shadow-sm border-[2px] z-20 bg-blue-500 text-white transition-colors duration-300 ${isDarkMode ? (showOnlineStatus ? 'border-emerald-400' : 'border-slate-800') : (showOnlineStatus ? 'border-emerald-500' : 'border-white')}`}>
                                        LV.{level}
                                    </div>
                                </motion.div>
                                <div className="text-left flex flex-col justify-center min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1 sm:mb-1.5 flex-wrap">
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none transition-colors truncate">
                                            {profile.firstName} {profile.lastName}
                                        </h2>
                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Good Morning
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-[1.4] max-w-xl line-clamp-2 sm:line-clamp-none">
                                        Your learning overview is ready. Track active courses, module progress, and study momentum from one clean dashboard.
                                    </p>
                                </div>
                            </div>

                            {/* Right: Expand Icon */}
                            <div className="flex items-center justify-end flex-shrink-0">
                                <motion.div 
                                    animate={{ rotate: isStatsExpanded ? 180 : 0 }}
                                    className="w-10 h-10 rounded-[14px] bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 flex-shrink-0"
                                    aria-hidden="true"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                                </motion.div>
                            </div>
                        </div>

                        {/* Expanded Stats (Tags UI) */}
                        <AnimatePresence>
                            {isStatsExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                    animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
                                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    className="relative z-10 overflow-hidden w-full flex flex-col"
                                >
                                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 pb-4 px-1 -mx-1 border-t border-slate-100 dark:border-slate-700/50">
                                        {/* Card 1: Streak */}
                                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-[24px] p-5 lg:p-6 flex flex-col group transition-all duration-300 hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 w-full overflow-hidden cursor-default">
                                            <div className="flex flex-col h-full gap-4 w-full flex-grow">
                                                {/* Day Streak (Study Tools Style) */}
                                                <div className="p-4 relative overflow-hidden bg-white dark:bg-slate-800 rounded-[14px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default group/day">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-orange-100/60 dark:bg-orange-500/15 group-hover/day:scale-110 transition-transform duration-300">
                                                            <Flame className="w-5 h-5 text-orange-500 dark:text-orange-400" strokeWidth={2.5} />
                                                        </div>
                                                        <div className="flex-1 min-w-0 text-left">
                                                            <div className="text-[13px] font-bold leading-tight whitespace-nowrap text-slate-900 dark:text-slate-100">
                                                                {streakData.currentStreak} Day{streakData.currentStreak !== 1 ? 's' : ''} Streak
                                                            </div>
                                                            <div className="text-[10.5px] font-medium mt-0.5 leading-tight whitespace-nowrap truncate text-slate-500 dark:text-slate-400">
                                                                Complete modules daily to maintain your streak.
                                                            </div>
                                                        </div>
                                                        <div className="px-2.5 py-1 rounded-md text-[11px] font-bold shadow-sm shrink-0 bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300">
                                                            {streakData.lastActiveDate === new Date().toISOString().split('T')[0] ? 'Active' : 'Inactive'}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="h-2 w-full rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.15)] border border-black/5 dark:border-white/5">
                                                        <motion.div
                                                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 relative"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.round(getStreakProgress() * 100)}%` }}
                                                            transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Weekly Progress (Study Tools Style) */}
                                                <div className="p-4 relative overflow-hidden bg-white dark:bg-slate-800 rounded-[14px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 mt-auto cursor-default group/week">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-blue-100/60 dark:bg-blue-500/15 group-hover/week:scale-110 transition-transform duration-300">
                                                            <Target className="w-5 h-5 text-blue-500 dark:text-blue-400" strokeWidth={2.5} />
                                                        </div>
                                                        <div className="flex-1 min-w-0 text-left">
                                                            <div className="text-[13px] font-bold leading-tight whitespace-nowrap text-slate-900 dark:text-slate-100">
                                                                Weekly Progress
                                                            </div>
                                                            <div className="text-[10.5px] font-medium mt-0.5 leading-tight whitespace-nowrap truncate text-slate-500 dark:text-slate-400">
                                                                Hitting your next milestone
                                                            </div>
                                                        </div>
                                                        <div className="px-2.5 py-1 rounded-md text-[11px] font-bold shadow-sm shrink-0 bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300">
                                                            {streakData.currentStreak} / {getNextMilestone()}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="h-2 w-full rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.15)] border border-black/5 dark:border-white/5">
                                                        <motion.div
                                                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 relative"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.round(getStreakProgress() * 100)}%` }}
                                                            transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card 2: Study Time */}
                                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-[24px] p-5 lg:p-6 flex flex-col group transition-all duration-300 hover:shadow-md hover:border-purple-200 dark:hover:border-purple-800 w-full overflow-hidden cursor-default">
                                            <div className="flex flex-col h-full gap-5 w-full flex-grow">
                                                {/* Top Section */}
                                                <div className="flex items-start gap-4 w-full">
                                                    <motion.div 
                                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                                        className="w-[56px] h-[56px] rounded-[18px] bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0 mt-1"
                                                    >
                                                        <Clock3 className="w-7 h-7 text-purple-600 dark:text-purple-400" strokeWidth={2.5} />
                                                    </motion.div>
                                                    <div className="flex flex-col text-left w-full">
                                                        <h2 className="text-[19px] sm:text-[21px] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight mb-1.5">
                                                            4.5 Hours Learned
                                                        </h2>
                                                        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-[1.5] mb-4">
                                                            Total time spent actively learning.
                                                        </p>
                                                        <div className="w-full h-3 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.15)] border border-black/5 dark:border-white/5">
                                                            <motion.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: "45%" }}
                                                                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                                                className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Bottom Section */}
                                                <div className="flex flex-row items-center gap-3 w-full pt-4 border-t border-slate-50 dark:border-slate-700/50 mt-auto">
                                                    <div className="flex flex-1 items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-800 rounded-[14px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default group/badge">
                                                        <div className="w-8 h-8 rounded-[10px] bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 group-hover/badge:scale-110 transition-transform duration-300">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        </div>
                                                        <div className="flex flex-col text-left justify-center">
                                                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">AVERAGE</span>
                                                            <span className="text-[13px] font-extrabold text-slate-900 dark:text-slate-100 leading-none">High</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-1 items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-800 rounded-[14px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default group/badge">
                                                        <div className="w-8 h-8 rounded-[10px] bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover/badge:scale-110 transition-transform duration-300">
                                                            <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
                                                        </div>
                                                        <div className="flex flex-col text-left justify-center">
                                                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">WEEKLY TARGET</span>
                                                            <span className="text-[13px] font-extrabold text-slate-900 dark:text-slate-100 leading-none">4.5 / 10 Hrs</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card 3: Completed */}
                                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-[24px] p-5 lg:p-6 flex flex-col group transition-all duration-300 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 w-full overflow-hidden cursor-default">
                                            <div className="flex flex-col h-full gap-5 w-full flex-grow">
                                                {/* Top Section */}
                                                <div className="flex items-start gap-4 w-full">
                                                    <motion.div 
                                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                                        className="w-[56px] h-[56px] rounded-[18px] bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 mt-1"
                                                    >
                                                        <GraduationCap className="w-7 h-7 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                                                    </motion.div>
                                                    <div className="flex flex-col text-left w-full">
                                                        <h2 className="text-[19px] sm:text-[21px] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight mb-1.5">
                                                            {totalCompletedAcrossAllCourses} Modules Done
                                                        </h2>
                                                        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-[1.5] mb-4">
                                                            Total modules successfully finished.
                                                        </p>
                                                        <div className="w-full h-3 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.15)] border border-black/5 dark:border-white/5">
                                                            <motion.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${Math.round((totalCompletedAcrossAllCourses / (totalCompletedAcrossAllCourses + totalNotStartedAcrossAllCourses || 1)) * 100)}%` }}
                                                                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                                                                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Bottom Section */}
                                                <div className="flex flex-row items-center gap-3 w-full pt-4 border-t border-slate-50 dark:border-slate-700/50 mt-auto">
                                                    <div className="flex flex-1 items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-800 rounded-[14px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default group/badge">
                                                        <div className="w-8 h-8 rounded-[10px] bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover/badge:scale-110 transition-transform duration-300">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                                        </div>
                                                        <div className="flex flex-col text-left justify-center">
                                                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">OVERALL</span>
                                                            <span className="text-[13px] font-extrabold text-slate-900 dark:text-slate-100 leading-none">Progress</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-1 items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-800 rounded-[14px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default group/badge">
                                                        <div className="w-8 h-8 rounded-[10px] bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover/badge:scale-110 transition-transform duration-300">
                                                            <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
                                                        </div>
                                                        <div className="flex flex-col text-left justify-center">
                                                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">CURRICULUM</span>
                                                            <span className="text-[13px] font-extrabold text-slate-900 dark:text-slate-100 leading-none">{totalCompletedAcrossAllCourses} / {totalCompletedAcrossAllCourses + totalNotStartedAcrossAllCourses}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card 4: Remaining */}
                                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-[24px] p-5 lg:p-6 flex flex-col group transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 w-full overflow-hidden cursor-default">
                                            <div className="flex flex-col h-full gap-5 w-full flex-grow">
                                                {/* Top Section */}
                                                <div className="flex items-start gap-4 w-full">
                                                    <motion.div 
                                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                                        className="w-[56px] h-[56px] rounded-[18px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-1"
                                                    >
                                                        <BookOpen className="w-7 h-7 text-slate-600 dark:text-slate-300" strokeWidth={2.5} />
                                                    </motion.div>
                                                    <div className="flex flex-col text-left w-full">
                                                        <h2 className="text-[19px] sm:text-[21px] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight mb-1.5">
                                                            {totalNotStartedAcrossAllCourses} Modules Left
                                                        </h2>
                                                        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-[1.5] mb-4">
                                                            Modules remaining in your curriculum.
                                                        </p>
                                                        <div className="w-full h-3 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.15)] border border-black/5 dark:border-white/5">
                                                            <motion.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${100 - Math.round((totalCompletedAcrossAllCourses / (totalCompletedAcrossAllCourses + totalNotStartedAcrossAllCourses || 1)) * 100)}%` }}
                                                                transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                                                                className="h-full bg-slate-400 dark:bg-slate-500 rounded-full"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Bottom Section */}
                                                <div className="flex flex-row items-center gap-3 w-full pt-4 border-t border-slate-50 dark:border-slate-700/50 mt-auto">
                                                    <div className="flex flex-1 items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-800 rounded-[14px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default group/badge">
                                                        <div className="w-8 h-8 rounded-[10px] bg-slate-200/50 dark:bg-slate-700/50 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0 group-hover/badge:scale-110 transition-transform duration-300">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                                        </div>
                                                        <div className="flex flex-col text-left justify-center">
                                                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">PENDING</span>
                                                            <span className="text-[13px] font-extrabold text-slate-900 dark:text-slate-100 leading-none">Tasks</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-1 items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-800 rounded-[14px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default group/badge">
                                                        <div className="w-8 h-8 rounded-[10px] bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0 group-hover/badge:scale-110 transition-transform duration-300">
                                                            <TrendingDown className="w-4 h-4" strokeWidth={2.5} />
                                                        </div>
                                                        <div className="flex flex-col text-left justify-center">
                                                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">WORKLOAD</span>
                                                            <span className="text-[13px] font-extrabold text-slate-900 dark:text-slate-100 leading-none">{totalNotStartedAcrossAllCourses} Left</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                {/* --- Middle Section: Continue Where You Left Off --- */}
                <div className="flex flex-col gap-6 relative z-10 w-full">
                    {/* Top: STI Campus News Card */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-[24px] p-5 flex flex-col group transition-all duration-300 hover:shadow-md hover:border-yellow-300 dark:hover:border-yellow-700 w-full overflow-hidden">
                        
                        {/* Header (Always Visible, Minimized State imitating Student Tools) */}
                        <div 
                            className="flex flex-row items-center justify-between gap-4 cursor-pointer w-full"
                            onClick={() => setIsNewsExpanded(!isNewsExpanded)}
                        >
                            {/* Left: Icon & Text */}
                            <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
                                <motion.div 
                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                    className="w-14 h-14 rounded-[20px] bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-100 dark:border-yellow-800/50 flex items-center justify-center flex-shrink-0 shadow-sm relative transition-transform duration-300"
                                >
                                    <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10l6 6v10a2 2 0 0 1-2 2z"/><polyline points="15 4 15 10 21 10"/><path d="M8 12h8"/><path d="M8 16h8"/></svg>
                                </motion.div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-1.5 transition-colors truncate">
                                        STI Campus News
                                    </h2>
                                    <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-none truncate">
                                        Click to view the latest announcements
                                    </p>
                                </div>
                            </div>

                            {/* Right: Tags & Expand Icon */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                                {/* Tag 1 (Matches AVAILABLE 11 Tools) */}
                                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-[12px] border border-yellow-100 dark:border-yellow-800/30">
                                    <div className="w-6 h-6 rounded-[8px] bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-yellow-600/70 dark:text-yellow-400/70 uppercase leading-none mb-0.5">AVAILABLE</span>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-none">3 Updates</span>
                                    </div>
                                </div>

                                {/* Tag 2 (Matches DATA Local-first) */}
                                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-[12px] border border-emerald-100 dark:border-emerald-800/30">
                                    <div className="w-6 h-6 rounded-[8px] bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase leading-none mb-0.5">LATEST</span>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-none">Overhaul</span>
                                    </div>
                                </div>

                                {/* Expand Toggle Button */}
                                <motion.div 
                                    animate={{ rotate: isNewsExpanded ? 180 : 0 }}
                                    className="w-10 h-10 rounded-[14px] bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                                </motion.div>
                            </div>
                        </div>

                        {/* Expanded Content (Slideshow) */}
                        <AnimatePresence>
                            {isNewsExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                    animate={{ height: "auto", opacity: 1, marginTop: 24 }}
                                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="overflow-hidden w-full flex flex-col gap-6"
                                >
                                    {/* Large Slide 1: STI Overhaul */}
                                    <div className="w-full flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-800/50 p-4 sm:p-6 rounded-[20px] border border-slate-100 dark:border-slate-700/50">
                                        {/* Large Left Text */}
                                        <div className="flex flex-col gap-3">
                                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                                                The Great STI Overhaul
                                            </h3>
                                            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-md">
                                                We've completely redesigned the campus experience. Check out what's new for the upcoming semester and explore the upgraded facilities and technology.
                                            </p>
                                        </div>

                                        {/* Large Right Picture & Button */}
                                        <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full xl:w-auto">
                                            {/* Large Picture Placeholder */}
                                            <div className="flex w-full sm:w-64 h-20 sm:h-auto min-h-[5rem] sm:min-h-[6rem] bg-slate-100 dark:bg-slate-700 rounded-[16px] border border-slate-200 dark:border-slate-600 items-center justify-center shadow-inner relative group-hover:border-yellow-200 dark:group-hover:border-yellow-800/50 transition-colors">
                                                <svg className="w-10 h-10 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                            </div>
                                            
                                            {/* Large Update Button */}
                                            <motion.button 
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={onShowWelcomeModal}
                                                className="w-full sm:w-auto h-20 sm:h-auto min-h-[5rem] sm:min-h-[6rem] px-8 bg-yellow-100 dark:bg-yellow-900/40 hover:bg-yellow-200 dark:hover:bg-yellow-800/60 text-yellow-700 dark:text-yellow-400 font-bold rounded-[16px] transition-colors text-base sm:text-lg shadow-sm flex flex-col items-center justify-center gap-2 border border-yellow-200 dark:border-yellow-800/50 cursor-pointer"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                                <span>View Full Details</span>
                                            </motion.button>
                                        </div>
                                    </div>

                                    {/* Slideshow Indicators */}
                                    <div className="w-full flex items-center justify-center gap-2 pb-2">
                                        <div className="w-6 h-1.5 rounded-full bg-yellow-400 dark:bg-yellow-500 transition-all shadow-sm"></div>
                                        <div className="w-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 transition-all cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600"></div>
                                        <div className="w-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 transition-all cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600"></div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <hr className="border-slate-200/60 dark:border-slate-700/60 relative z-10" />

                {/* --- Bottom Section: Overall Progress (Redesigned as Study Tools + Carousel) --- */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 relative z-10 w-full max-w-6xl mx-auto items-start">
                    
                    {/* LEFT COLUMN (Desktop): Control Panel & Continue Learning */}
                    <div className="flex flex-col gap-6 w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 sticky top-6">
                        
                        {/* Overall Progress Panel */}
                        <div className="order-3 lg:order-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-[24px] p-5 sm:p-6 flex flex-col gap-5 w-full transition-all duration-300 hover:shadow-md group/header">
                        {/* Top: Icon, Text */}
                        <div className="flex items-start sm:items-center gap-4 sm:gap-5 w-full">
                            <motion.div 
                                whileHover={{ scale: 1.05, rotate: -5 }}
                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] sm:rounded-[20px] bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center flex-shrink-0 shadow-sm relative transition-transform duration-300"
                            >
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            </motion.div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight mb-1 transition-colors">
                                    Overall Progress
                                </h2>
                                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed truncate sm:whitespace-normal">
                                    Track your completion across all modules
                                </p>
                            </div>
                        </div>

                        {/* Middle: Separator */}
                        <hr className="border-t border-slate-100 dark:border-slate-700/50 w-full" />

                        {/* Bottom: Stretched Tags */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                            {/* Completed Tag - Flex-1 */}
                            <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 rounded-[14px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default group/tag flex-1 w-full">
                                <div className="w-8 h-8 rounded-[10px] bg-emerald-50 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover/tag:scale-110 transition-transform duration-300 flex-shrink-0">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider mb-0.5 leading-none whitespace-nowrap">COMPLETED</span>
                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none whitespace-nowrap">{totalCompletedAcrossAllCourses} Modules</span>
                                </div>
                            </div>
                            
                            {/* Not Started Tag - Flex-1 */}
                            <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 rounded-[14px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default group/tag flex-1 w-full">
                                <div className="w-8 h-8 rounded-[10px] bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover/tag:scale-110 transition-transform duration-300 flex-shrink-0">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5 leading-none whitespace-nowrap">NOT STARTED</span>
                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none whitespace-nowrap">{totalNotStartedAcrossAllCourses} Modules</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Footer: Premium Carousel Controls (Moved to Bottom) */}
                        <div className="w-full pt-2 mt-1 border-t border-slate-100 dark:border-slate-700/50">
                            <div className="flex items-center justify-between w-full gap-2 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-[14px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md">
                                <button onClick={handlePrevCourse} className="w-10 h-10 rounded-[10px] flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:text-indigo-400 dark:hover:bg-slate-700 transition-all shadow-sm cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 text-center tracking-wide flex-1">{safeIndex + 1} <span className="text-slate-400 font-medium mx-0.5">/</span> {sortedCourses.length}</span>
                                <button onClick={handleNextCourse} className="w-10 h-10 rounded-[10px] flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:text-indigo-400 dark:hover:bg-slate-700 transition-all shadow-sm cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                        </div>

                        {/* Continue Learning (Redesigned as Vertical Card) */}
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: 'spring' as const, stiffness: 300, damping: 24 }}
                            className="order-2 lg:order-2 relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm rounded-[24px] p-5 flex flex-col items-start gap-5 group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 cursor-pointer w-full"
                        >
                            {/* SaaS Background Accents */}
                            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                            
                            {/* Top: Icon & Core Info */}
                            <div className="flex items-center gap-4 relative z-10 w-full">
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                    transition={{ type: 'spring' as const, stiffness: 400, damping: 15 }}
                                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] sm:rounded-[20px] bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm"
                                >
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                </motion.div>

                                <div className="flex flex-col flex-1 min-w-0">
                                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1 truncate">
                                        Continue Learning
                                    </h1>
                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium line-clamp-2">
                                        CP1: Module 1: Introduction to Programming
                                    </p>
                                </div>
                            </div>

                            {/* Divider / Separator */}
                            <div className="w-full h-[1px] bg-slate-200/80 dark:bg-slate-800 relative z-10 my-0.5" />

                            {/* Bottom: Action Button */}
                            <div className="flex w-full mt-1 relative z-10">
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full flex items-center justify-center bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 font-bold py-2.5 px-4 rounded-[14px] transition-colors shadow-sm"
                                >
                                    Continue
                                </motion.button>
                            </div>
                        </motion.div>

                        {/* 4 Action Buttons (Redesigned as Control Center Tiles) */}
                        <div className="order-1 lg:order-3 grid grid-cols-2 gap-3 w-full">
                            {/* Tools */}
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] rounded-[16px] p-3.5 flex items-center gap-3.5 group transition-all duration-300 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer overflow-hidden">
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                    className="w-11 h-11 rounded-[12px] bg-blue-50 dark:bg-blue-900/30 border border-blue-100/50 dark:border-blue-800/50 flex items-center justify-center flex-shrink-0 shadow-sm relative transition-transform duration-300"
                                >
                                    <svg className="w-[22px] h-[22px] text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                                </motion.div>
                                <div className="flex flex-col min-w-0 justify-center">
                                    <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                        Tools
                                    </h2>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-none truncate">
                                        Resources
                                    </p>
                                </div>
                            </div>

                            {/* Goals */}
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] rounded-[16px] p-3.5 flex items-center gap-3.5 group transition-all duration-300 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 cursor-pointer overflow-hidden">
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                    className="w-11 h-11 rounded-[12px] bg-purple-50 dark:bg-purple-900/30 border border-purple-100/50 dark:border-purple-800/50 flex items-center justify-center flex-shrink-0 shadow-sm relative transition-transform duration-300"
                                >
                                    <svg className="w-[22px] h-[22px] text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                                </motion.div>
                                <div className="flex flex-col min-w-0 justify-center">
                                    <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                                        Goals
                                    </h2>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-none truncate">
                                        Targets
                                    </p>
                                </div>
                            </div>

                            {/* Paths */}
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] rounded-[16px] p-3.5 flex items-center gap-3.5 group transition-all duration-300 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 cursor-pointer overflow-hidden">
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                    className="w-11 h-11 rounded-[12px] bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100/50 dark:border-emerald-800/50 flex items-center justify-center flex-shrink-0 shadow-sm relative transition-transform duration-300"
                                >
                                    <svg className="w-[22px] h-[22px] text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                                </motion.div>
                                <div className="flex flex-col min-w-0 justify-center">
                                    <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                                        Paths
                                    </h2>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-none truncate">
                                        Curriculum
                                    </p>
                                </div>
                            </div>

                            {/* Groups */}
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] rounded-[16px] p-3.5 flex items-center gap-3.5 group transition-all duration-300 hover:shadow-md hover:border-orange-300 dark:hover:border-orange-700 cursor-pointer overflow-hidden">
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                    className="w-11 h-11 rounded-[12px] bg-orange-50 dark:bg-orange-900/30 border border-orange-100/50 dark:border-orange-800/50 flex items-center justify-center flex-shrink-0 shadow-sm relative transition-transform duration-300"
                                >
                                    <svg className="w-[22px] h-[22px] text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                </motion.div>
                                <div className="flex flex-col min-w-0 justify-center">
                                    <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                                        Groups
                                    </h2>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-none truncate">
                                        Join peers
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (Desktop): Carousel Container — Dynamic Course Card */}
                    <div className="w-full flex-1 flex justify-center pb-2 min-w-0">

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentCourse.id}
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -40 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                className="w-full max-w-4xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[24px] shadow-sm overflow-hidden flex flex-col group/card hover:shadow-md transition-shadow duration-300"
                            >
                                {/* Top Banner Image */}
                                <div className="h-32 sm:h-36 w-full bg-slate-900 relative overflow-hidden">
                                    <img
                                        src={currentCourse.image}
                                        alt={currentCourse.title}
                                        className="w-full h-full object-cover opacity-80"
                                    />
                                    {/* Instructor Profile Picture with Tooltip */}
                                    <div className="absolute bottom-4 left-4 z-10 group/instructor">
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-[3px] border-white dark:border-slate-800 bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg hover:scale-105 transition-transform duration-300 cursor-default">
                                            {instructorInitial}
                                        </div>
                                        {/* Tooltip */}
                                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 opacity-0 scale-95 group-hover/instructor:opacity-100 group-hover/instructor:scale-100 transition-all duration-200 ease-out pointer-events-none">
                                            {/* Tooltip Arrow (points left) */}
                                            <div className="absolute left-[-5px] top-1/2 -translate-y-1/2">
                                                <div className="w-2.5 h-2.5 bg-white/95 dark:bg-slate-900/95 border-l border-b border-slate-200/60 dark:border-slate-700/50 rotate-45" />
                                            </div>
                                            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/50 shadow-md rounded-[12px] px-3.5 py-2 flex items-center gap-2.5 whitespace-nowrap">
                                                <div className="w-6 h-6 rounded-[8px] bg-blue-50 dark:bg-blue-900/40 border border-blue-100/50 dark:border-blue-800/50 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400 font-bold text-[11px]">
                                                    {instructorInitial}
                                                </div>
                                                <div className="flex flex-col justify-center">
                                                    <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] leading-none mb-0.5">
                                                        Instructor
                                                    </span>
                                                    <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100 leading-none">
                                                        {instructorName}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Floating Course Type Tag (Study Tools Style) */}
                                    <div className="absolute bottom-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-white/20 dark:border-slate-700/50 shadow-sm rounded-[14px] p-1.5 pr-4 flex items-center gap-3 group/tag hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                                        {/* SVG Icon Container */}
                                        <div className="w-8 h-8 rounded-[10px] bg-blue-50 dark:bg-blue-900/40 border border-blue-100/50 dark:border-blue-800/50 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400 group-hover/tag:scale-110 transition-transform duration-300">
                                            <GraduationCap className="w-4 h-4" strokeWidth={2.5} />
                                        </div>
                                        {/* Text Container */}
                                        <div className="flex flex-col justify-center">
                                            <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] leading-none mb-1">
                                                Course Type
                                            </span>
                                            <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100 leading-none">
                                                {courseTag.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="p-5 pb-8 flex flex-col gap-4 relative z-0 bg-white dark:bg-slate-800">
                                    {/* Course Header — Study Tools Style */}
                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-[24px] p-4 flex flex-col group transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 w-full overflow-hidden cursor-default">
                                        <div className="flex flex-col gap-4 sm:gap-5 w-full">
                                            {/* Top: Icon, Text & Actions */}
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 w-full">
                                                <div className="flex items-center gap-5 w-full sm:w-auto">
                                                    <motion.div
                                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                                        className="w-14 h-14 rounded-[20px] bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center flex-shrink-0 shadow-sm relative transition-transform duration-300"
                                                    >
                                                        <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                                                    </motion.div>
                                                    <div className="flex flex-col flex-1">
                                                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-1.5 transition-colors">
                                                            {currentCourse.title}
                                                        </h2>
                                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-none flex items-center gap-1.5 flex-wrap">
                                                            <span>{currentCourse.subtitle?.replace('·', '-')}</span>
                                                            {isCurrentCourseBookmarked && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold leading-none select-none">
                                                                    <svg className="w-2.5 h-2.5 fill-current flex-shrink-0" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                                                                    Pinned
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Right: Actions */}
                                                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                                    {/* Bookmark Button (Icon Only, Minimalist) */}
                                                    <motion.button 
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleToggleBookmark(currentCourse.id);
                                                        }}
                                                        className={`w-14 h-14 flex items-center justify-center rounded-[20px] cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md flex-shrink-0 border ${
                                                            isCurrentCourseBookmarked 
                                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800/50 dark:text-indigo-400' 
                                                                : 'bg-slate-50 border-slate-200/80 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:bg-slate-800/50 dark:border-slate-700/80 dark:text-slate-500 dark:hover:bg-slate-700/50 dark:hover:text-indigo-400'
                                                        }`}
                                                        aria-label={isCurrentCourseBookmarked ? "Remove bookmark" : "Bookmark course"}
                                                    >
                                                        <svg 
                                                            className={`w-6 h-6 transition-colors duration-300 ${isCurrentCourseBookmarked ? 'fill-indigo-600/20 dark:fill-indigo-400/20' : ''}`} 
                                                            fill="none" 
                                                            stroke="currentColor" 
                                                            strokeWidth="2.5" 
                                                            strokeLinecap="round" 
                                                            strokeLinejoin="round" 
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                                                        </svg>
                                                    </motion.button>
                                                </div>
                                            </div>
                                            
                                            {/* Bottom: Tags */}
                                            <div className="flex flex-col sm:flex-row w-full gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                                {/* Status Tag */}
                                                <div className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-800 rounded-[14px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default group/tag flex-1 w-full">
                                                    <div className="w-8 h-8 rounded-[10px] bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover/tag:scale-110 transition-transform duration-300 flex-shrink-0">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                                    </div>
                                                    <div className="flex flex-col flex-1 min-w-0">
                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5 whitespace-nowrap">STATUS</span>
                                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none whitespace-nowrap">{currentCourseStatus}</span>
                                                    </div>
                                                </div>
                                                
                                                {/* UP NEXT Tag */}
                                                <div className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-800 rounded-[14px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default group/tag flex-1 w-full">
                                                    <div className="w-8 h-8 rounded-[10px] bg-blue-50 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover/tag:scale-110 transition-transform duration-300 flex-shrink-0">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                    </div>
                                                    <div className="flex flex-col flex-1 min-w-0">
                                                        <span className="text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider mb-0.5 whitespace-nowrap">UP NEXT</span>
                                                        <span className="text-sm font-bold text-blue-800 dark:text-blue-200 leading-none truncate">{upNextTitle}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* GRADE & PROGRESS — Study Tools Style */}
                                    <div className="flex flex-col gap-4">
                                        {/* Current Grade Card */}
                                        <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm rounded-[24px] p-4 flex flex-col gap-4 group/grade transition-all duration-300 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 cursor-default">
                                            {/* Top Row: Nested Card Container */}
                                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 shadow-sm rounded-[20px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default">
                                                <div className="flex items-center gap-4 w-full">
                                                    <motion.div
                                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                                        className="w-14 h-14 rounded-[16px] bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center flex-shrink-0 shadow-sm relative transition-transform duration-300"
                                                    >
                                                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                                    </motion.div>
                                                    <div>
                                                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-1.5 transition-colors">
                                                            Current Grade
                                                        </h2>
                                                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                                            No submissions yet. Complete modules to update.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress Bar Section */}
                                            <div className="flex flex-col gap-2.5">
                                                <div className="flex justify-between items-center gap-3">
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-[12px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default group/tag">
                                                        <div className="w-6 h-6 rounded-[8px] bg-blue-50 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover/tag:scale-110 transition-transform duration-300">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{currentProgressPercentage}% Complete</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-[12px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default group/tag">
                                                        <div className="w-6 h-6 rounded-[8px] bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover/tag:scale-110 transition-transform duration-300">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wider">{currentModulesRemaining} modules remaining</span>
                                                    </div>
                                                </div>
                                                <div className="w-full h-3 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.15)] border border-black/5 dark:border-white/5">
                                                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${currentProgressPercentage}%` }} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Continue Action Card */}
                                        <div 
                                            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 shadow-sm rounded-[24px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group/action transition-all duration-300 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer"
                                            onClick={handleContinueCourse}
                                        >
                                            <div className="flex items-center gap-5 w-full sm:w-auto">
                                                <motion.div
                                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                                    className="w-14 h-14 rounded-[20px] bg-blue-100 dark:bg-blue-900/50 border border-blue-200/60 dark:border-blue-800/50 flex items-center justify-center flex-shrink-0 shadow-sm relative transition-transform duration-300"
                                                >
                                                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                                </motion.div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-1.5 transition-colors">
                                                        Continue
                                                    </h2>
                                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-none">
                                                        Resume where you left off
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-[12px] border border-blue-200/60 dark:border-blue-800/40">
                                                    <div className="w-6 h-6 rounded-[8px] bg-blue-200 dark:bg-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase leading-none mb-0.5">EST. TIME</span>
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-none">{currentModulesRemaining > 0 ? '~25 min' : 'Completed'}</span>
                                                    </div>
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="px-5 h-10 rounded-[14px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm cursor-pointer transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleContinueCourse();
                                                    }}
                                                >
                                                    Continue
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default HomeContent;
