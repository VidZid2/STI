/**
 * Paths Content - Learning Paths Main Page
 * Displays all available learning paths with filtering and enrollment
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Clock3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
    getPathsWithProgress,
    getDifficultyInfo,
    getPathStats,
    getPathCourses,
    getPathTotalModules,
    getPathEstimatedHours,
    formatEstimatedTime,
    checkAndUnlockCourses,
    getPathRecommendations,
    type PathWithProgress,
    type PathRecommendation,
} from '../../../../services/pathsService';
import { fetchStudentStats } from '../../../../services/databaseService';
import { PathIcon } from './components/PathIcon';
import { FilterTabs } from './components/PathFilterTabs';
import { PathDetailModal } from './modals/PathDetailModal';
import { PathCertificateModal } from './modals/PathCertificateModal';
import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar';
import { Avatar } from '../../../../components/ui/avatar';
import { EmptyState } from '../CourseViewPage/components/SharedComponents';

type FilterTab = 'all' | 'enrolled' | 'available';

interface PathsContentProps {
    onPathSelect?: (pathId: string) => void;
}

// PathIcon — moved to ./components/PathIcon.tsx
// ProgressRingWithTooltip + ModalTooltip — moved to ./components/PathProgressRing.tsx
// FilterTabs — moved to ./components/PathFilterTabs.tsx
// PathDetailModal — moved to ./modals/PathDetailModal.tsx
// PathCertificateModal — moved to ./modals/PathCertificateModal.tsx

const ScrollableCourseList: React.FC<{ path: PathWithProgress }> = ({ path }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 4;
    
    const courses = getPathCourses(path);
    const totalPages = Math.ceil(courses.length / ITEMS_PER_PAGE);
    
    const currentCourses = courses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="relative flex w-full flex-col h-full z-10">
            <div className="flex flex-col gap-2.5 pb-2 min-h-[238px]">
                {currentCourses.map((course) => (
                    <div key={course.id} className="flex shrink-0 items-center gap-3 rounded-xl bg-zinc-50/80 px-3 py-2.5 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700/50 transition-colors hover:bg-white dark:hover:bg-zinc-800 hover:border-blue-200 dark:hover:border-blue-800/50 group-hover:border-blue-100 dark:group-hover:border-blue-800/30 shadow-sm hover:shadow-md">
                        <img src={course.image} alt="" className="h-7 w-7 rounded-md object-cover shadow-sm border border-zinc-200/50 dark:border-zinc-700/50" />
                        <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-200 truncate">{course.shortTitle || course.title}</span>
                        <span className="ml-auto shrink-0 rounded-md bg-white px-2 py-1 text-[10px] font-bold text-zinc-500 shadow-sm dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800">{course.modules}m</span>
                    </div>
                ))}
            </div>
            
            {totalPages > 1 && (
                <div className="mt-2 flex justify-center w-full">
                    <div className="flex items-center justify-between w-full gap-2 bg-white dark:bg-zinc-900 p-1 rounded-[12px] border border-zinc-200/60 dark:border-zinc-700/50 shadow-sm transition-all duration-300 hover:shadow-md">
                        <motion.button 
                            type="button"
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            whileHover={currentPage > 1 ? { scale: 1.05 } : {}}
                            whileTap={currentPage > 1 ? { scale: 0.95 } : {}}
                            className={`w-8 h-7 rounded-[8px] flex items-center justify-center transition-colors duration-150 shadow-sm cursor-pointer border ${
                                currentPage === 1
                                    ? 'bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-800/40 text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                                    : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 hover:border-blue-300 dark:hover:border-blue-500'
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        </motion.button>
                        <span className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300 text-center tracking-wide flex-1">
                            Page {currentPage} <span className="text-zinc-400 dark:text-zinc-500 font-medium mx-0.5">/</span> {totalPages}
                        </span>
                        <motion.button 
                            type="button"
                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            whileHover={currentPage < totalPages ? { scale: 1.05 } : {}}
                            whileTap={currentPage < totalPages ? { scale: 0.95 } : {}}
                            className={`w-8 h-7 rounded-[8px] flex items-center justify-center transition-colors duration-150 shadow-sm cursor-pointer border ${
                                currentPage === totalPages
                                    ? 'bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-800/40 text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                                    : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 hover:border-blue-300 dark:hover:border-blue-500'
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </motion.button>
                    </div>
                </div>
            )}
        </div>
    );
};

const PathsContent: React.FC<PathsContentProps> = ({ onPathSelect: _onPathSelect }) => {
    const [paths, setPaths] = useState<PathWithProgress[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPath, setSelectedPath] = useState<PathWithProgress | null>(null);
    const [certificatePath, setCertificatePath] = useState<PathWithProgress | null>(null);
    const [courseProgress, setCourseProgress] = useState<Record<string, { progress: number }>>({});
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const [sortBy, setSortBy] = useState<'name' | 'progress' | 'difficulty'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [recommendations, setRecommendations] = useState<PathRecommendation[]>([]);
    const [showRecommendations, setShowRecommendations] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 1;
    const [isDarkMode, setIsDarkMode] = useState(() => 
        document.body.classList.contains('dark-mode')
    );

    // Debounced search effect
    useEffect(() => {
        if (searchQuery) {
            setIsSearching(true);
            const timer = setTimeout(() => {
                setIsSearching(false);
            }, 400);
            return () => clearTimeout(timer);
        } else {
            setIsSearching(false);
        }
    }, [searchQuery]);

    // Check for dark mode changes
    useEffect(() => {
        const checkDarkMode = () => setIsDarkMode(document.body.classList.contains('dark-mode'));
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Load paths
    useEffect(() => {
        setIsLoading(true);
        getPathsWithProgress('demo-student').then((data) => {
            setPaths(data);
            setIsLoading(false);
        });
    }, []);

    // Load course progress from Supabase and check for unlocks
    useEffect(() => {
        const loadCourseProgress = async () => {
            try {
                const stats = await fetchStudentStats();
                if (stats?.course_progress) {
                    setCourseProgress(stats.course_progress);
                    
                    // Check and unlock courses based on progress
                    paths.forEach(path => {
                        const newlyUnlocked = checkAndUnlockCourses(path, stats.course_progress);
                        if (newlyUnlocked.length > 0) {
                        }
                    });
                    
                    // Load path recommendations based on user interests
                    const enrolledPaths = paths.filter(p => p.progress);
                    const recs = await getPathRecommendations('demo-student', stats.course_progress, enrolledPaths);
                    setRecommendations(recs);
                }
            } catch (err) {
            }
        };
        loadCourseProgress();
    }, [paths]);

    // Handle path card click - open detail modal
    const handlePathClick = useCallback((path: PathWithProgress) => {
        setSelectedPath(path);
    }, []);

    // Handle continue learning - navigate to course
    const handleContinueLearning = useCallback((courseId: string) => {
        // Close modal and trigger navigation
        setSelectedPath(null);
        // Dispatch custom event for course navigation with source view
        const event = new CustomEvent('navigate-to-course', { 
            detail: { courseId, fromView: 'paths' } 
        });
        window.dispatchEvent(event);
    }, []);

    // Filter and sort paths
    const filteredPaths = useMemo(() => {
        let result = [...paths];
        
        // Filter by tab
        if (activeFilter === 'enrolled') {
            result = result.filter(p => p.progress);
        } else if (activeFilter === 'available') {
            result = result.filter(p => !p.progress);
        }
        
        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p => 
                p.title.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query)
            );
        }
        
        // Sort paths
        result.sort((a, b) => {
            let comparison = 0;
            
            switch (sortBy) {
                case 'name':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'progress':
                    const progressA = a.progress?.progress_percentage || 0;
                    const progressB = b.progress?.progress_percentage || 0;
                    comparison = progressA - progressB;
                    break;
                case 'difficulty':
                    const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
                    comparison = (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0);
                    break;
            }
            
            return sortOrder === 'asc' ? comparison : -comparison;
        });
        
        return result;
    }, [paths, activeFilter, searchQuery, sortBy, sortOrder]);

    const stats = useMemo(() => getPathStats(paths), [paths]);

    // Search suggestions - show matching paths as user types
    const searchSuggestions = useMemo(() => {
        if (!searchQuery || searchQuery.length < 1) return [];
        const query = searchQuery.toLowerCase();
        return paths
            .filter(p => 
                p.title.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query)
            )
            .slice(0, 5);
    }, [paths, searchQuery]);

    // Handle keyboard navigation in suggestions
    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setShowSuggestions(false);
            setSearchQuery('');
            searchInputRef.current?.blur();
        } else if (e.key === 'ArrowDown' && showSuggestions && searchSuggestions.length > 0) {
            e.preventDefault();
            setSelectedSuggestionIndex(prev => 
                prev < searchSuggestions.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === 'ArrowUp' && showSuggestions && searchSuggestions.length > 0) {
            e.preventDefault();
            setSelectedSuggestionIndex(prev => 
                prev > 0 ? prev - 1 : searchSuggestions.length - 1
            );
        } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0 && searchSuggestions[selectedSuggestionIndex]) {
            e.preventDefault();
            const selected = searchSuggestions[selectedSuggestionIndex];
            setSearchQuery(selected.title);
            setShowSuggestions(false);
            setSelectedSuggestionIndex(-1);
        }
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
                searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard shortcut "/" to focus search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Colors based on theme
    const colors = {
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
        cardBg: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        textPrimary: isDarkMode ? '#f1f5f9' : '#0f172a',
        textSecondary: isDarkMode ? '#94a3b8' : '#64748b',
        textMuted: isDarkMode ? '#94a3b8' : '#475569',
        accent: '#3b82f6',
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto min-h-screen pb-24">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mt-4 md:mt-0 mb-7"
            >
                <motion.div 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="relative flex flex-col gap-3 sm:gap-4 p-5 sm:p-7 -mx-4 sm:-mx-6 lg:mx-0 rounded-[20px] sm:rounded-[24px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm group transition-all duration-300 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700"
                >

                    {/* Top Row: Title & Action */}
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 min-w-0 w-full sm:w-auto">
                            {/* Circular Progress Module */}
                            <div className="relative flex-shrink-0 mb-1 sm:mb-0">
                                {/* The Circle */}
                                <div className="relative w-[72px] h-[72px] sm:w-[84px] sm:h-[84px]">
                                    <AnimatedCircularProgressBar
                                        max={100}
                                        min={0}
                                        value={stats.enrolledPaths > 0 ? Math.round((stats.completedPaths / stats.enrolledPaths) * 100) : 0}
                                        gaugePrimaryColor="rgb(59, 130, 246)"
                                        gaugeSecondaryColor={isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"}
                                        className="w-full h-full text-blue-500"
                                        hideText={true}
                                    >
                                        {/* Inner Icon Container */}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                                            whileHover={{ scale: 1.05, rotate: -5, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
                                            className="absolute inset-[14px] sm:inset-[16px] rounded-full bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center shadow-sm m-auto"
                                        >
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-600 dark:text-blue-400 sm:w-7 sm:h-7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                <path d="m9 11 3 3L22 4" />
                                            </svg>
                                        </motion.div>
                                    </AnimatedCircularProgressBar>
                                </div>
                                
                                {/* Overlapping Custom Badge */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, x: "-50%", scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
                                    transition={{ duration: 0.4, delay: 0.4, type: "spring", stiffness: 300, damping: 20 }}
                                    className="absolute -bottom-1.5 sm:-bottom-2 left-1/2 px-1.5 sm:px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border-[2px] sm:border-[2.5px] border-white dark:border-slate-800 shadow-sm flex items-center justify-center whitespace-nowrap z-10 min-w-[36px] sm:min-w-[40px]"
                                >
                                    <span className="text-[11px] sm:text-[13px] font-black text-slate-700 dark:text-slate-200 leading-none" style={{ paddingTop: '1px' }}>
                                        {stats.enrolledPaths > 0 ? Math.round((stats.completedPaths / stats.enrolledPaths) * 100) : 0}%
                                    </span>
                                </motion.div>
                            </div>
                            
                            {/* Title & Description */}
                            <div className="min-w-0 flex flex-col justify-center items-center sm:items-start py-1">
                                <div className="flex items-center justify-center sm:justify-start gap-3 mb-2 sm:mb-3 flex-wrap">
                                    <h1 className="text-xl sm:text-[26px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                                        Learning Paths
                                    </h1>
                                </div>
                                <p className="text-sm sm:text-[14.5px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                                    Structured journeys to master new skills. Track your overall progression and milestones across all enrolled paths below.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar Replaced by Circular Progress */}

                    {/* Bottom Row: Detailed Metrics */}
                    <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        {/* Metric 1 */}
                        <motion.div 
                            className="flex flex-col p-3 sm:p-4 rounded-[16px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                    </svg>
                                </div>
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Catalog</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{stats.totalPaths}</span>
                                <span className="text-xs font-medium text-slate-500">Available</span>
                            </div>
                        </motion.div>

                        {/* Metric 2 */}
                        <motion.div 
                            className="flex flex-col p-3 sm:p-4 rounded-[16px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-md bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>
                                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Commitment</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{stats.enrolledPaths}</span>
                                <span className="text-xs font-medium text-slate-500">Enrolled</span>
                            </div>
                        </motion.div>

                        {/* Metric 3 */}
                        <motion.div 
                            className="flex flex-col p-3 sm:p-4 rounded-[16px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </div>
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Active Focus</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{stats.inProgressPaths}</span>
                                <span className="text-xs font-medium text-slate-500">In Progress</span>
                            </div>
                        </motion.div>

                        {/* Metric 4 */}
                        <motion.div 
                            className="flex flex-col p-3 sm:p-4 rounded-[16px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Milestones</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{stats.completedPaths}</span>
                                <span className="text-xs font-medium text-slate-500">Completed</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Footer Text Container */}
                    <motion.div layout="position" transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.8 }} className="relative z-[60] flex flex-col lg:flex-row items-start lg:items-center justify-between mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[12px] sm:rounded-[16px] px-3 sm:px-4 py-3 sm:py-3.5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 group cursor-default gap-3 lg:gap-0" style={{ transition: 'box-shadow 0.3s ease, border-color 0.3s ease' }}>
                        <div className="flex items-start lg:items-center gap-3 w-full lg:w-auto">
                            <div className="hidden sm:flex p-1.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-500 transition-colors group-hover:text-blue-600 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 mt-1 lg:mt-0">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                                {stats.enrolledPaths === 0 
                                    ? "You haven't joined any paths yet. Explore the catalog to start learning!"
                                    : `You are currently focusing on ${stats.inProgressPaths} path${stats.inProgressPaths !== 1 ? 's' : ''}. Keep going to reach your next milestone!`
                                }
                            </p>
                        </div>
                        
                        <motion.div layout="position" transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.8 }} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto lg:ml-auto lg:mr-2 relative">
                            {/* Filter Tabs - Minimalistic with Icons */}
                            <div className="w-full sm:w-auto">
                                <FilterTabs 
                                    activeFilter={activeFilter} 
                                    setActiveFilter={setActiveFilter}
                                />
                            </div>
                            {/* Sort Dropdown */}
                            <motion.div layout="position" transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.8 }} className="w-full sm:w-auto z-[100]">
                                <motion.button
                                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    aria-haspopup="true"
                                    aria-expanded={showSortDropdown}
                                    className={`flex w-full sm:w-auto items-center justify-center gap-2 h-10 px-4 rounded-[14px] font-bold text-[13px] transition-all duration-200 border shadow-sm ${
                                        showSortDropdown 
                                            ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400' 
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-600'
                                    }`}
                                >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                            </svg>
                            <span>
                                {sortBy === 'name' ? 'Name' : sortBy === 'progress' ? 'Progress' : 'Difficulty'}
                            </span>
                            <motion.svg 
                                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                animate={{ rotate: showSortDropdown ? 180 : 0 }}
                                transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </motion.svg>
                        </motion.button>

                        <AnimatePresence>
                            {showSortDropdown && (
                                <>
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        onClick={() => setShowSortDropdown(false)}
                                        className="fixed inset-0 z-40"
                                    />
                                    <motion.div
                                        role="menu"
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
                                        className="absolute top-full left-0 right-0 mt-2 p-1.5 sm:p-2 rounded-[16px] sm:rounded-[18px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-[200] w-full overflow-hidden flex flex-col gap-0.5"
                                    >
                                        {/* Ambient Glow */}
                                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                                        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-20 h-20 bg-blue-400/5 rounded-full blur-2xl pointer-events-none" />

                                        <div className="relative z-10 flex flex-col gap-0.5">
                                            {[
                                                { id: 'name', label: 'Name', description: 'Alphabetical order', icon: <path d="M4 6h16M4 12h10M4 18h4" strokeLinecap="round" strokeLinejoin="round" /> },
                                                { id: 'progress', label: 'Progress', description: 'By completion percentage', icon: <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" /> },
                                                { id: 'difficulty', label: 'Difficulty', description: 'By path difficulty', icon: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeLinecap="round" strokeLinejoin="round" /> }
                                            ].map((option, index) => (
                                                <motion.button
                                                    key={option.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05, duration: 0.2, type: 'spring', stiffness: 300, damping: 24 }}
                                                    onClick={() => {
                                                        if (sortBy === option.id) {
                                                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                        } else {
                                                            setSortBy(option.id as 'name' | 'progress' | 'difficulty');
                                                            setSortOrder('asc');
                                                        }
                                                        setShowSortDropdown(false);
                                                    }}
                                                    whileTap={{ scale: 0.97 }}
                                                    className="w-full text-left p-1.5 sm:p-2 rounded-[12px] flex items-center gap-2.5 sm:gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 group border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50"
                                                    style={{ transition: 'background-color 0.2s ease, border-color 0.2s ease' }}
                                                >
                                                    <div
                                                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 shadow-sm hover:scale-105 hover:-rotate-[5deg] ${sortBy === option.id ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800' : 'bg-blue-50 border border-blue-100 dark:bg-blue-900/30 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50'}`}
                                                        style={{ transition: 'transform 0.2s cubic-bezier(0.22,1,0.36,1), background-color 0.2s ease' }}
                                                    >
                                                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4">
                                                            <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                {option.icon}
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className={`text-[11px] sm:text-[12px] font-bold truncate ${sortBy === option.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>{option.label}</h3>
                                                        <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{option.description}</p>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${sortBy === option.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500' : 'bg-transparent text-transparent group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-500'}`}>
                                                        {sortBy === option.id ? (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                {sortOrder === 'asc' ? <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/> : <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round"/>}
                                                            </svg>
                                                        ) : (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </motion.button>
                                            ))}
                                            
                                            {/* Divider */}
                                            <div className="h-[1px] bg-slate-200 dark:bg-slate-700 my-1 mx-2" />

                                            {/* Order Toggle */}
                                            <motion.button
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2, duration: 0.2, type: 'spring', stiffness: 300, damping: 24 }}
                                                onClick={() => {
                                                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                    setShowSortDropdown(false);
                                                }}
                                                whileTap={{ scale: 0.97 }}
                                                className="w-full text-left p-1.5 sm:p-2 rounded-[12px] flex items-center gap-2.5 sm:gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 group border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50"
                                                style={{ transition: 'background-color 0.2s ease, border-color 0.2s ease' }}
                                            >
                                                <div
                                                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex items-center justify-center flex-shrink-0 shadow-sm text-slate-600 dark:text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 hover:scale-105 hover:-rotate-[5deg]"
                                                    style={{ transition: 'transform 0.2s cubic-bezier(0.22,1,0.36,1), background-color 0.2s ease' }}
                                                >
                                                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4">
                                                        <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-[11px] sm:text-[12px] font-bold text-slate-900 dark:text-slate-100 truncate">Toggle Order</h3>
                                                    <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{sortOrder === 'asc' ? 'Currently Ascending' : 'Currently Descending'}</p>
                                                </div>
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </motion.div>
                        </motion.div>
                        
                        {stats.completedPaths > 0 && (
                            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full flex-shrink-0">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>{stats.completedPaths}</span>
                            </div>
                        )}
                    </motion.div>

                    {/* Search and Filter */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-50 flex flex-wrap items-center gap-3 mt-3"
            >
                {/* Search with Suggestions */}
                <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="relative flex-1 min-w-[220px] group/search"
                >
                    <svg className="absolute left-3.5 top-0 bottom-0 my-auto w-4 h-4 text-slate-400 z-10 transition-colors duration-200 group-focus-within/search:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search learning paths..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowSuggestions(true);
                            setSelectedSuggestionIndex(-1);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onKeyDown={handleSearchKeyDown}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-11 pr-20 py-2 text-sm font-semibold focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all duration-300 text-slate-900 placeholder-slate-400 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/10"
                    />
                    
                    <div className="absolute right-3 top-0 bottom-0 flex items-center justify-center z-10 w-6">
                        <AnimatePresence mode="wait">
                            {isSearching ? (
                                <motion.div
                                    key="spinner"
                                    initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                    className="w-6 h-6 flex items-center justify-center"
                                >
                                    <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                </motion.div>
                            ) : searchQuery ? (
                                <motion.button
                                    key="clear"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={() => {
                                        setSearchQuery('');
                                        setShowSuggestions(false);
                                        searchInputRef.current?.focus();
                                    }}
                                    className="!w-5 !h-5 !min-w-[20px] !min-h-[20px] !p-0 flex items-center justify-center rounded-[6px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </motion.button>
                            ) : (
                                <motion.kbd
                                    key="hint"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500 dark:shadow-none pointer-events-none"
                                >
                                    /
                                </motion.kbd>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    {/* Search Suggestions Dropdown */}
                    <AnimatePresence>
                        {showSuggestions && searchSuggestions.length > 0 && searchQuery && (
                            <motion.div
                                ref={suggestionsRef}
                                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 dark:bg-slate-800 dark:border-slate-700 dark:shadow-none z-50 overflow-hidden"
                            >
                                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Suggestions</span>
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">↑↓ navigate • Enter select</span>
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 sm:hidden">Tap to select</span>
                                </div>
                                <div className="flex flex-col">
                                    {searchSuggestions.map((path, index) => {
                                        const isSelected = selectedSuggestionIndex === index;
                                        return (
                                            <motion.div
                                                key={path.id}
                                                onClick={() => {
                                                    setSearchQuery(path.title);
                                                    setShowSuggestions(false);
                                                }}
                                                className={`px-3 py-2 cursor-pointer flex items-center gap-3 transition-colors border-l-2 ${isSelected ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500' : 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent'}`}
                                                onMouseEnter={() => setSelectedSuggestionIndex(index)}
                                            >
                                                <div 
                                                    className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: `${path.color}15` }}
                                                >
                                                    <PathIcon icon={path.icon} color={path.color} size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">
                                                        {path.title}
                                                    </div>
                                                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                        {path.courses.length} courses • {path.difficulty}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Show Recommendations Button - appears when hidden and there are 2+ paths */}
                <AnimatePresence>
                    {!showRecommendations && recommendations.length > 0 && paths.length >= 2 && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8, width: 0 }}
                            animate={{ opacity: 1, scale: 1, width: 'auto' }}
                            exit={{ opacity: 0, scale: 0.8, width: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            onClick={() => setShowRecommendations(true)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                borderRadius: '10px',
                                border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.25)' : 'rgba(139, 92, 246, 0.2)'}`,
                                background: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.06)',
                                color: '#8b5cf6',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                            }}
                            title="Show path recommendations"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                            <span>Recommendations</span>
                        </motion.button>
                    )}
                </AnimatePresence>
            </motion.div>


            
                </motion.div>
            </motion.div>

            {/* Path Recommendations Section - Only show when there are 2+ paths to recommend */}
            <AnimatePresence>
                {showRecommendations && recommendations.length > 0 && paths.length >= 2 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.4 }}
                            style={{
                                padding: '16px 20px',
                                borderRadius: '14px',
                                background: isDarkMode 
                                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.06) 100%)'
                                    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(59, 130, 246, 0.04) 100%)',
                                border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.12)'}`,
                            }}
                        >
                            {/* Header */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                marginBottom: '14px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 15 }}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            background: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                        </svg>
                                    </motion.div>
                                    <div>
                                        <h3 style={{ 
                                            margin: 0, 
                                            fontSize: '14px', 
                                            fontWeight: 600, 
                                            color: colors.textPrimary,
                                        }}>
                                            Recommended for You
                                        </h3>
                                        <p style={{ 
                                            margin: 0, 
                                            fontSize: '11px', 
                                            color: colors.textMuted,
                                        }}>
                                            Based on your interests and progress
                                        </p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowRecommendations(false)}
                                    style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                        color: colors.textMuted,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    title="Dismiss recommendations"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </motion.button>
                            </div>

                            {/* Recommendation Cards */}
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '12px',
                            }}>
                                {recommendations.map((rec, index) => {
                                    const difficultyInfo = getDifficultyInfo(rec.path.difficulty);
                                    return (
                                        <motion.div
                                            key={rec.path.id}
                                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ 
                                                delay: 0.15 + index * 0.08,
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 25,
                                            }}
                                            whileHover={{ 
                                                y: -4, 
                                                scale: 1.02,
                                                transition: { duration: 0.2 }
                                            }}
                                            onClick={() => {
                                                const pathWithProgress = paths.find(p => p.id === rec.path.id);
                                                if (pathWithProgress) {
                                                    handlePathClick(pathWithProgress);
                                                }
                                            }}
                                            style={{
                                                padding: '14px',
                                                borderRadius: '12px',
                                                background: colors.cardBg,
                                                border: `1px solid ${colors.border}`,
                                                cursor: 'pointer',
                                                boxShadow: isDarkMode 
                                                    ? '0 2px 8px rgba(0,0,0,0.15)' 
                                                    : '0 2px 8px rgba(0,0,0,0.04)',
                                            }}
                                        >
                                            {/* Path Icon & Title */}
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                                                <motion.div
                                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                                    style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '10px',
                                                        background: `${rec.path.color}15`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <PathIcon icon={rec.path.icon} color={rec.path.color} size={18} />
                                                </motion.div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <h4 style={{
                                                        margin: 0,
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        color: colors.textPrimary,
                                                        lineHeight: 1.3,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        {rec.path.title}
                                                    </h4>
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: 500,
                                                        color: difficultyInfo.color,
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        background: `${difficultyInfo.color}12`,
                                                        display: 'inline-block',
                                                        marginTop: '4px',
                                                    }}>
                                                        {difficultyInfo.label}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Reason Badge */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 10px',
                                                borderRadius: '8px',
                                                background: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.06)',
                                            }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    {rec.reason.includes('Includes') ? (
                                                        <>
                                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                            <polyline points="22 4 12 14.01 9 11.01" />
                                                        </>
                                                    ) : rec.reason.includes('started') ? (
                                                        <>
                                                            <circle cx="12" cy="12" r="10" />
                                                            <path d="M8 12l2 2 4-4" />
                                                        </>
                                                    ) : (
                                                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                                    )}
                                                </svg>
                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: 500,
                                                    color: '#8b5cf6',
                                                }}>
                                                    {rec.reason}
                                                </span>
                                            </div>

                                            {/* Quick Stats */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                marginTop: '10px',
                                                paddingTop: '10px',
                                                borderTop: `1px solid ${colors.border}`,
                                            }}>
                                                <span style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '11px',
                                                    color: colors.textMuted,
                                                }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                                        <path d="M3 9h18M9 21V9" />
                                                    </svg>
                                                    {rec.path.courses.length} courses
                                                </span>
                                                <span style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '11px',
                                                    color: colors.textMuted,
                                                }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <polyline points="12 6 12 12 16 14" />
                                                    </svg>
                                                    {formatEstimatedTime(rec.path.estimated_hours)}
                                                </span>
                                                {rec.path.enrolled_count > 0 && (
                                                    <span style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '11px',
                                                        color: colors.textMuted,
                                                    }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                            <circle cx="9" cy="7" r="4" />
                                                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                        </svg>
                                                        {rec.path.enrolled_count}
                                                    </span>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Paths Grid */}
            <div className="grid grid-cols-1 gap-4 sm:gap-5">
                <AnimatePresence mode="wait">
                    {isLoading || isSearching ? null : filteredPaths.length === 0 ? (
                        // Empty state
                            <motion.div
                                key="empty-state"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="col-span-full -mx-4 sm:-mx-6 lg:mx-0 bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm text-center"
                            >
                                <EmptyState
                                    icon={
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 3v18h18" />
                                            <path d="m19 9-5 5-4-4-3 3" />
                                        </svg>
                                    }
                                    title={searchQuery ? `No paths match "${searchQuery}"` : "No paths found"}
                                    description={searchQuery ? 'Try a different search term' : 'Check back later for new paths'}
                                    className="py-16"
                                    action={searchQuery ? {
                                        label: 'Clear search',
                                        onClick: () => setSearchQuery('')
                                    } : undefined}
                                />
                            </motion.div>
                        ) : (
                            // Path cards
                            filteredPaths.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((path, index) => {
                                const difficultyInfo = getDifficultyInfo(path.difficulty);
                                const progress = path.progress?.progress_percentage || 0;
                                const isEnrolled = !!path.progress;

                                return (
                                    <motion.div
                                        key={path.id}
                                        className="group relative flex w-auto lg:w-full flex-col xl:flex-row items-stretch overflow-hidden -mx-4 sm:-mx-6 lg:mx-0 rounded-[24px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 text-left shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 sm:p-6 gap-6"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05, type: 'spring', stiffness: 420, damping: 28 }}
                                    >
                                        {/* Section 1: Info (Icon, Title, Desc, Quick Stats) */}
                                        <div className="relative z-10 flex w-full xl:w-[38%] flex-col gap-4">
                                            <div className="flex w-full items-start justify-between gap-4">
                                                <div
                                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border transition-all duration-300 sm:h-12 sm:w-12 bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 group-hover:scale-105 group-hover:rotate-3"
                                                    aria-hidden="true"
                                                >
                                                    <div className="scale-110">
                                                        <PathIcon icon={path.icon} color="currentColor" size={24} />
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center justify-end gap-2">
                                                    <span className="inline-flex h-[24px] items-center gap-1.5 rounded-full border px-2.5 text-[10.5px] font-extrabold uppercase leading-none tracking-wide shadow-sm border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800/60 dark:bg-orange-900/30 dark:text-orange-400">
                                                        <span className="truncate">{difficultyInfo.label}</span>
                                                    </span>
                                                    <span className="inline-flex h-[24px] items-center gap-1.5 rounded-md px-2 text-[10.5px] font-bold uppercase leading-none tracking-wide bg-slate-100/80 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                                                        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                                        <span className="truncate">{formatEstimatedTime(getPathEstimatedHours(path))}</span>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col">
                                                <h3 className="max-w-full whitespace-normal text-[17px] font-bold leading-snug tracking-tighter text-zinc-900 dark:text-zinc-100 sm:text-lg transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                    {path.title}
                                                </h3>
                                                
                                                {/* Separator line */}
                                                <div className="my-2.5 w-full border-t border-zinc-100 dark:border-zinc-700/50"></div>
                                                
                                                <div className="flex w-full items-center justify-between rounded-full p-0.5 gap-2 border border-zinc-200 dark:border-zinc-700/50 shadow-sm shadow-black/5 bg-white dark:bg-zinc-800/50 mt-1">
                                                    <div className="flex items-center gap-2 overflow-hidden pl-0.5 shrink-1">
                                                        <div className="flex -space-x-1 shrink-0">
                                                            {(() => {
                                                                const uniqueInstructors = Array.from(new Set(getPathCourses(path).map(c => c.instructor).filter(Boolean)));
                                                                return uniqueInstructors.map((instructor, i) => {
                                                                    const colors = [
                                                                        'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', 
                                                                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', 
                                                                        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300', 
                                                                        'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                                                                    ];
                                                                    const colorClass = colors[i % colors.length];
                                                                    const initials = instructor.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                                                                    return (
                                                                        <Avatar key={i} className={`size-7 rounded-full border-2 border-white dark:border-zinc-900 hover:z-10 transition-transform hover:scale-105 shadow-sm cursor-pointer ${colorClass}`} title={instructor}>
                                                                            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold">
                                                                                {initials}
                                                                            </div>
                                                                        </Avatar>
                                                                    );
                                                                });
                                                            })()}
                                                        </div>
                                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate pr-1">
                                                            {(() => {
                                                                const uniqueInstructors = Array.from(new Set(getPathCourses(path).map(c => c.instructor).filter(Boolean)));
                                                                if (uniqueInstructors.length === 0) return null;
                                                                const firstNames = uniqueInstructors.slice(0, 2).map(n => n.split(' ')[0]);
                                                                const othersCount = uniqueInstructors.length - 2;
                                                                
                                                                return (
                                                                    <>
                                                                        With <span className="font-semibold text-zinc-700 dark:text-zinc-300">{firstNames.join(', ')}</span>
                                                                        {othersCount > 0 && ` & ${othersCount} others`}
                                                                    </>
                                                                );
                                                            })()}
                                                        </p>
                                                    </div>
                                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 me-2.5 shrink-0">
                                                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{Array.from(new Set(getPathCourses(path).map(c => c.instructor).filter(Boolean))).length} Expert</span> Instructors
                                                    </p>
                                                </div>
                                                
                                                {/* Path Description to complete the vertical space */}
                                                <div className="mt-4 pb-4 border-b border-zinc-100 dark:border-zinc-700/50 mb-1">
                                                    <p 
                                                        className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-400 pr-2"
                                                        dangerouslySetInnerHTML={{ __html: path.description }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-auto pt-2 grid w-full grid-cols-3 gap-2">
                                                <div className="flex flex-col items-center justify-center rounded-xl bg-zinc-50/80 px-2 py-3 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/50 transition-all duration-300 group-hover:bg-white dark:group-hover:bg-zinc-800/80 group-hover:shadow-sm">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                                        <span className="text-[16px] font-black text-zinc-900 dark:text-zinc-100 leading-none">{path.courses.length}</span>
                                                    </div>
                                                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500">Courses</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center rounded-xl bg-zinc-50/80 px-2 py-3 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/50 transition-all duration-300 group-hover:bg-white dark:group-hover:bg-zinc-800/80 group-hover:shadow-sm">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                                        <span className="text-[16px] font-black text-zinc-900 dark:text-zinc-100 leading-none">{getPathTotalModules(path)}</span>
                                                    </div>
                                                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500">Modules</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center rounded-xl bg-emerald-50/50 px-2 py-3 dark:bg-emerald-500/10 border border-emerald-100/50 dark:border-emerald-800/30 transition-all duration-300 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/20 group-hover:shadow-sm">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                                        <span className="text-[16px] font-black text-emerald-600 dark:text-emerald-400 leading-none">{path.enrolled_count}</span>
                                                    </div>
                                                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-600/80 dark:text-emerald-400/80">Enrolled</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Vertical Divider for Desktop */}
                                        <div className="hidden xl:block w-px bg-zinc-200/50 dark:bg-zinc-700/50 mx-2" />

                                        {/* Section 2: Courses Included */}
                                        <div className="relative z-10 flex w-full xl:w-[26%] flex-col">
                                            <span className="mb-3 flex shrink-0 items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-zinc-600 dark:text-zinc-400">
                                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                </svg>
                                                Courses Included
                                                <span className="ml-auto rounded-full bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-500">{path.courses.length}</span>
                                            </span>
                                            <ScrollableCourseList path={path} />
                                        </div>

                                        {/* Vertical Divider for Desktop */}
                                        <div className="hidden xl:block w-px bg-zinc-200/50 dark:bg-zinc-700/50 mx-2" />

                                        {/* Section 3: Progress & Action */}
                                        <div className="relative z-10 flex w-full xl:w-[36%] flex-col justify-between">
                                            {/* Conditional Progress Visualization */}
                                            {isEnrolled ? (
                                                <div className="w-full flex flex-col flex-1 mb-4 bg-white dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/50 rounded-[16px] p-5 xl:p-3.5 shadow-sm">
                                                    {/* Progress Header */}
                                                    <div className="flex flex-wrap items-center justify-between gap-3 w-full pb-4 xl:pb-3 border-b border-zinc-100 dark:border-zinc-700/50">
                                                        <div className="flex items-center gap-3 xl:gap-3 min-w-0 flex-1">
                                                            <div className="relative shrink-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 rounded-full border border-zinc-100 dark:border-zinc-700/50 shadow-sm p-1">
                                                                <AnimatedCircularProgressBar
                                                                    max={100}
                                                                    min={0}
                                                                    value={Math.round(progress)}
                                                                    gaugePrimaryColor="rgb(59 130 246)"
                                                                    gaugeSecondaryColor="rgba(0, 0, 0, 0.05)"
                                                                    className="h-10 w-10 sm:h-12 sm:w-12 text-[10px] text-blue-600 dark:text-blue-400 font-extrabold"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-[14px] sm:text-[15px] font-black text-slate-900 dark:text-slate-100 tracking-tight truncate">
                                                                    {progress === 100 ? 'Completed!' : progress === 0 ? 'Not Started' : 'In Progress'}
                                                                </span>
                                                                <span className="text-[11.5px] sm:text-[12px] font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                                                    {path.completed_courses_count} of {path.total_courses} done
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {progress < 100 && (
                                                            <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1.5 xl:px-2 xl:py-1 border border-blue-100 dark:border-blue-800/50">
                                                                <div className="flex h-5 w-5 xl:h-4 xl:w-4 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-800/50">
                                                                    <Clock3 className="h-3 w-3 xl:h-2.5 xl:w-2.5 text-blue-600 dark:text-blue-400" />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[7.5px] xl:text-[7px] font-bold uppercase tracking-widest text-blue-400 dark:text-blue-500">Remaining</span>
                                                                    <span className="text-[10px] xl:text-[9px] font-bold text-blue-700 dark:text-blue-300 leading-none mt-0.5">
                                                                        {formatEstimatedTime(Math.round(getPathEstimatedHours(path) * (1 - progress / 100)))}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Description Area */}
                                                    <div className="py-4 xl:py-2.5 flex-1 flex flex-col justify-center w-full">
                                                        <div className="flex items-start gap-3 sm:gap-4 xl:gap-3 w-full">
                                                            <div className="w-10 h-10 sm:w-11 sm:h-11 mt-0.5 rounded-[12px] sm:rounded-[14px] bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center flex-shrink-0 shadow-sm text-blue-600 dark:text-blue-400">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h7"/></svg>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h2 className="text-[13px] sm:text-[14px] xl:text-[12.5px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-1.5 truncate">
                                                                    Description
                                                                </h2>
                                                                <p 
                                                                    className="text-[11px] sm:text-[12px] xl:text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed"
                                                                    dangerouslySetInnerHTML={{ 
                                                                        __html: path.id === 'path-full-semester' 
                                                                            ? 'Core courses for your <span class="text-blue-600 dark:text-blue-400 font-bold">1st semester</span> in <span class="text-blue-600 dark:text-blue-400 font-bold">BSIT</span>. Build your foundation in <span class="text-blue-600 dark:text-blue-400 font-bold">programming</span>, <span class="text-blue-600 dark:text-blue-400 font-bold">IT concepts</span>, and <span class="text-blue-600 dark:text-blue-400 font-bold">communication</span>.' 
                                                                            : path.description 
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Course Milestone Tracker */}
                                                    <div className="mt-auto pt-4 xl:pt-2.5 border-t border-zinc-100 dark:border-zinc-700/50 w-full">
                                                        <div className="mb-3 xl:mb-2 flex items-center justify-between text-[10px] xl:text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                                                            <span className="flex items-center gap-1.5 xl:gap-1">
                                                                <svg className="h-3.5 w-3.5 xl:h-3 xl:w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 11 3 3L22 4"/></svg>
                                                                Course Progress
                                                            </span>
                                                            <span className="text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20 px-2 py-1 xl:px-1.5 xl:py-0.5 rounded-[6px] text-[9px] xl:text-[8px] font-extrabold">{path.courses.length} Steps</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 relative w-full">
                                                            {getPathCourses(path).map((course, courseIndex) => {
                                                                const isCompleted = path.progress?.completed_courses?.includes(course.id) || false;
                                                                const isCurrent = path.progress?.current_course_id === course.id;
                                                                
                                                                return (
                                                                    <React.Fragment key={course.id}>
                                                                        <div 
                                                                            className={`flex shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                                                                                isCompleted ? 'h-5 w-5 xl:h-4 xl:w-4 bg-emerald-500 text-white' :
                                                                                isCurrent ? 'h-6 w-6 xl:h-5 xl:w-5 bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.15)] ring-2 ring-white dark:ring-zinc-900' :
                                                                                'h-4 w-4 xl:h-3.5 xl:w-3.5 bg-zinc-100 border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700'
                                                                            }`}
                                                                        >
                                                                            {isCompleted ? (
                                                                                <svg className="h-3 w-3 xl:h-2.5 xl:w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 6L9 17l-5-5"/></svg>
                                                                            ) : isCurrent ? (
                                                                                <div className="h-2 w-2 xl:h-1.5 xl:w-1.5 rounded-full bg-white animate-pulse" />
                                                                            ) : null}
                                                                        </div>
                                                                        {courseIndex < path.courses.length - 1 && (
                                                                            <div className={`flex-1 h-1 xl:h-[3px] rounded-full min-w-[4px] ${isCompleted ? 'bg-emerald-500' : 'bg-zinc-100 dark:bg-zinc-800'}`} />
                                                                        )}
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex w-full flex-1 flex-col items-center justify-center mb-4 rounded-[16px] bg-white dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/50 border-dashed p-4 shadow-sm group-hover:border-blue-200 dark:group-hover:border-blue-800/50 transition-colors">
                                                    <div className="mb-3 rounded-full bg-blue-50 dark:bg-blue-900/20 p-2.5 text-blue-500 group-hover:scale-110 group-hover:bg-blue-100 transition-all duration-300">
                                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-[14px] font-black text-zinc-800 dark:text-zinc-200">Ready to start?</span>
                                                    <span className="text-center text-[11.5px] font-medium text-zinc-500 mt-1 max-w-[80%]">Enroll to track your progress and earn certificates.</span>
                                                </div>
                                            )}

                                            <div className="mt-4 md:mt-auto pt-4 md:pt-0 w-full">
                                                <button
                                                    type="button"
                                                    onClick={() => handlePathClick(path)}
                                                    className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 ${
                                                    isEnrolled 
                                                        ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:shadow-blue-500/20 dark:bg-blue-500 dark:hover:bg-blue-600' 
                                                        : 'bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-md dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100'
                                                }`}>
                                                    <span>{isEnrolled ? (progress === 100 ? 'View Certificate' : 'Continue Learning') : 'Enroll in Path'}</span>
                                                    <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>

                {/* Pagination Controls */}
                {!isLoading && !isSearching && filteredPaths.length > ITEMS_PER_PAGE && (
                    <div className="mt-8 flex justify-center w-full">
                        <div className="w-full sm:max-w-[250px] mx-auto">
                            <div className="flex items-center justify-between w-full gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-[14px] border border-zinc-200/60 dark:border-zinc-700/50 shadow-sm transition-all duration-300 hover:shadow-md">
                                <motion.button 
                                    type="button"
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                    whileHover={currentPage > 1 ? { scale: 1.05 } : {}}
                                    whileTap={currentPage > 1 ? { scale: 0.95 } : {}}
                                    className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors duration-150 shadow-sm cursor-pointer border ${
                                        currentPage === 1
                                            ? 'bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-800/40 text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                                            : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 hover:border-blue-300 dark:hover:border-blue-500'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                </motion.button>
                                <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300 text-center tracking-wide flex-1">
                                    Page {currentPage} <span className="text-zinc-400 dark:text-zinc-500 font-medium mx-0.5">/</span> {Math.ceil(filteredPaths.length / ITEMS_PER_PAGE)}
                                </span>
                                <motion.button 
                                    type="button"
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(filteredPaths.length / ITEMS_PER_PAGE)))}
                                    disabled={currentPage === Math.ceil(filteredPaths.length / ITEMS_PER_PAGE)}
                                    whileHover={currentPage < Math.ceil(filteredPaths.length / ITEMS_PER_PAGE) ? { scale: 1.05 } : {}}
                                    whileTap={currentPage < Math.ceil(filteredPaths.length / ITEMS_PER_PAGE) ? { scale: 0.95 } : {}}
                                    className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors duration-150 shadow-sm cursor-pointer border ${
                                        currentPage === Math.ceil(filteredPaths.length / ITEMS_PER_PAGE)
                                            ? 'bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-800/40 text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                                            : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 hover:border-blue-300 dark:hover:border-blue-500'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </motion.button>
                            </div>
                        </div>
                    </div>
                )}

            {/* Pulse animation keyframes + Path card hover styles */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .path-card {
                    transition: box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1), 
                                border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .path-card:hover {
                    box-shadow: ${isDarkMode 
                        ? '0 12px 32px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.2)' 
                        : '0 12px 32px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)'} !important;
                    border-color: ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} !important;
                }
                
                .path-icon-container {
                    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                                background 0.2s ease;
                }
                
                .path-card:hover .path-icon-container {
                    background: ${isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'};
                }
                
                .path-card:hover .course-chip {
                    transform: translateY(-1px);
                }
                
                .course-chip {
                    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                                background 0.15s ease;
                }
                
                .course-chip:hover {
                    background: ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'} !important;
                }
                
                .enroll-btn {
                    transition: box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1),
                                filter 0.15s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .enroll-btn:hover {
                    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.35);
                    filter: brightness(1.08);
                }
                
                .enroll-btn:active {
                    filter: brightness(0.95);
                }
                
                .stat-card {
                    transition: box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                                border-color 0.2s ease,
                                transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .stat-card:hover {
                    box-shadow: ${isDarkMode 
                        ? '0 8px 24px rgba(0,0,0,0.3)' 
                        : '0 8px 24px rgba(0,0,0,0.08)'} !important;
                    border-color: ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} !important;
                }
                
                @media (max-width: 768px) {
                    .stat-card {
                        padding: 12px 14px !important;
                    }
                }
            `}</style>

            {/* Path Detail Modal */}
            <PathDetailModal
                path={selectedPath}
                isOpen={!!selectedPath}
                onClose={() => setSelectedPath(null)}
                courseProgress={courseProgress}
                onContinueLearning={handleContinueLearning}
                onViewCertificate={(path) => {
                    setSelectedPath(null);
                    setCertificatePath(path);
                }}
            />

            {/* Path Certificate Modal */}
            <PathCertificateModal
                path={certificatePath}
                isOpen={!!certificatePath}
                onClose={() => setCertificatePath(null)}
                completedAt={certificatePath?.progress?.completed_at || undefined}
            />
        </div>
    );
};

export default PathsContent;
