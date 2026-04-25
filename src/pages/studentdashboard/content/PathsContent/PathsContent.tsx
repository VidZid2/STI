/**
 * Paths Content - Learning Paths Main Page
 * Displays all available learning paths with filtering and enrollment
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';

import {
    getPathsWithProgress,
    enrollInPath,
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
import { getCurrentUser } from '../../../../services/authService';
import { PathIcon, type FilterTab } from './components/PathIcon';
import { ProgressRingWithTooltip } from './components/PathProgressRing';
import { FilterTabs } from './components/PathFilterTabs';
import { PathDetailModal } from './modals/PathDetailModal';
import { PathCertificateModal } from './modals/PathCertificateModal';

interface PathsContentProps {
    onPathSelect?: (pathId: string) => void;
}

// PathIcon — moved to ./components/PathIcon.tsx
// ProgressRingWithTooltip + ModalTooltip — moved to ./components/PathProgressRing.tsx
// FilterTabs — moved to ./components/PathFilterTabs.tsx
// PathDetailModal — moved to ./modals/PathDetailModal.tsx
// PathCertificateModal — moved to ./modals/PathCertificateModal.tsx

const PathsContent: React.FC<PathsContentProps> = ({ onPathSelect: _onPathSelect }) => {
    const [paths, setPaths] = useState<PathWithProgress[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPath, setSelectedPath] = useState<PathWithProgress | null>(null);
    const [certificatePath, setCertificatePath] = useState<PathWithProgress | null>(null);
    const [courseProgress, setCourseProgress] = useState<Record<string, { progress: number }>>({});
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const [sortBy, setSortBy] = useState<'name' | 'progress' | 'difficulty'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [recommendations, setRecommendations] = useState<PathRecommendation[]>([]);
    const [showRecommendations, setShowRecommendations] = useState(true);
    const studentId = getCurrentUser()?.id || 'demo-student-1';

    // Load paths
    useEffect(() => {
        setIsLoading(true);
        getPathsWithProgress(studentId).then((data) => {
            setPaths(data);
            setIsLoading(false);
        });
    }, [studentId]);

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
                    const recs = await getPathRecommendations(studentId, stats.course_progress, enrolledPaths);
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

    // Handle enrollment
    const handleEnroll = async (pathId: string) => {
        const result = await enrollInPath(pathId, studentId);
        if (result) {
            // Refresh paths
            const updated = await getPathsWithProgress(studentId);
            setPaths(updated);
        }
    };

    // Colors based on theme
    const colors = {
        bg: 'var(--bg-primary)',
        cardBg: 'var(--bg-secondary)',
        border: 'var(--border-light)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        textMuted: 'var(--text-muted)',
        accent: 'var(--brand-blue)',
    };

    return (
        <div className="p-6 max-w-[1200px] mx-auto min-h-screen">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mb-7"
            >
                <motion.div 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-4 py-[18px] px-[22px] rounded-[14px] bg-dashboard-surface border border-dashboard-border shadow-lg"
                >
                    {/* Icon */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ scale: 1.08, transition: { duration: 0.2 } }}
                        className="w-[46px] h-[46px] rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <path d="m9 11 3 3L22 4" />
                        </svg>
                    </motion.div>
                    
                    {/* Title & Description */}
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        className="flex-1"
                    >
                        <div className="flex items-center gap-2.5 mb-1">
                            <h1 className="m-0 text-[20px] font-semibold text-dashboard-text tracking-[-0.3px]">
                                Learning Paths
                            </h1>
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.25, duration: 0.3 }}
                                className="text-[10px] font-semibold text-blue-500 bg-blue-500/10 px-2 py-[3px] rounded-md uppercase tracking-[0.4px]"
                            >
                                {stats.totalPaths} Path{stats.totalPaths !== 1 ? 's' : ''}
                            </motion.span>
                        </div>
                        <p className="m-0 text-[13px] text-dashboard-text-secondary font-normal">
                            Structured journeys to master new skills step by step
                        </p>
                    </motion.div>

                    {/* Quick Stats Cards */}
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="flex items-stretch gap-2.5"
                    >
                        {[
                            {
                                label: 'Total Paths',
                                value: stats.totalPaths,
                                description: 'Available',
                                color: '#3b82f6',
                                bgColor: 'rgba(59, 130, 246, 0.1)',
                                icon: (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                    </svg>
                                ),
                            },
                            {
                                label: 'Enrolled',
                                value: stats.enrolledPaths,
                                description: 'Joined',
                                color: '#8b5cf6',
                                bgColor: 'rgba(139, 92, 246, 0.1)',
                                icon: (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                ),
                            },
                            {
                                label: 'In Progress',
                                value: stats.inProgressPaths,
                                description: 'Active',
                                color: '#f59e0b',
                                bgColor: 'rgba(245, 158, 11, 0.1)',
                                icon: (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                ),
                            },
                            {
                                label: 'Completed',
                                value: stats.completedPaths,
                                description: 'Done',
                                color: '#10b981',
                                bgColor: 'rgba(16, 185, 129, 0.1)',
                                icon: (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                ),
                            },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 + i * 0.05, duration: 0.3 }}
                                whileHover={{ 
                                    y: -2, 
                                    scale: 1.02,
                                    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } 
                                }}
                                className="flex flex-col items-center py-2.5 px-4 rounded-[10px] cursor-default min-w-[72px]"
                                style={{ background: stat.bgColor }}
                                title={`${stat.label}: ${stat.value} paths`}
                            >
                                <div 
                                    className="mb-1 flex items-center justify-center"
                                    style={{ color: stat.color }}
                                >
                                    {stat.icon}
                                </div>
                                <span 
                                    className="text-[18px] font-bold leading-none mb-[2px]"
                                    style={{ color: stat.color }}
                                >
                                    {stat.value}
                                </span>
                                <span className="text-[10px] font-medium text-dashboard-muted uppercase tracking-[0.3px]">
                                    {stat.description}
                                </span>
                            </motion.div>
                        ))}
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
                        className="overflow-hidden"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.4 }}
                            className="py-4 px-5 rounded-[14px] border border-purple-500/10"
                            style={{ background: 'var(--shimmer-bg)' }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-[14px]">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 15 }}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            background: 'rgba(139, 92, 246, 0.1)',
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
                                        <h3 className="m-0 text-[14px] font-semibold text-dashboard-text">
                                            Recommended for You
                                        </h3>
                                        <p className="m-0 text-[11px] text-dashboard-muted">
                                            Based on your interests and progress
                                        </p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowRecommendations(false)}
                                    className="w-7 h-7 rounded-lg border-none bg-dashboard-hover text-dashboard-muted cursor-pointer flex items-center justify-center"
                                    title="Dismiss recommendations"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </motion.button>
                            </div>

                            {/* Recommendation Cards */}
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
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
                                            className="p-[14px] rounded-xl bg-dashboard-surface border border-dashboard-border cursor-pointer shadow-lg"
                                        >
                                            {/* Path Icon & Title */}
                                            <div className="flex items-start gap-2.5 mb-2.5">
                                                <motion.div
                                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                                    className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                                                    style={{ background: `${rec.path.color}15` }}
                                                >
                                                    <PathIcon icon={rec.path.icon} color={rec.path.color} size={18} />
                                                </motion.div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="m-0 text-[13px] font-semibold text-dashboard-text leading-[1.3] truncate">
                                                        {rec.path.title}
                                                    </h4>
                                                    <span 
                                                        className="text-[10px] font-medium py-[2px] px-1.5 rounded inline-block mt-1"
                                                        style={{ color: difficultyInfo.color, background: `${difficultyInfo.color}12` }}
                                                    >
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
                                                background: 'rgba(139, 92, 246, 0.1)',
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
                                            <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-dashboard-border">
                                                <span className="flex items-center gap-1 text-[11px] text-dashboard-muted">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                                        <path d="M3 9h18M9 21V9" />
                                                    </svg>
                                                    {rec.path.courses.length} courses
                                                </span>
                                                <span className="flex items-center gap-1 text-[11px] text-dashboard-muted">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <polyline points="12 6 12 12 16 14" />
                                                    </svg>
                                                    {formatEstimatedTime(rec.path.estimated_hours)}
                                                </span>
                                                {rec.path.enrolled_count > 0 && (
                                                    <span className="flex items-center gap-1 text-[11px] text-dashboard-muted">
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

            {/* Search and Filter */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '24px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                }}
            >
                {/* Search with Suggestions */}
                <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="flex-1 min-w-[220px] relative"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={'var(--text-muted)'} strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 z-[1]">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
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
                        className="w-full py-3 pr-[70px] pl-[42px] rounded-xl border border-dashboard-border bg-dashboard-surface text-dashboard-text text-[13px] font-normal outline-none transition-all duration-300 ease-out focus:ring-2 focus:ring-blue-500/20"
                    />
                    {/* Keyboard hint */}
                    {!searchQuery && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                            <span className="text-[10px] text-dashboard-muted py-0.5 px-1.5 rounded bg-dashboard-hover font-mono">/</span>
                        </div>
                    )}
                    {/* Clear button */}
                    {searchQuery && !isSearching && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-dashboard-hover border-none rounded-md w-5 h-5 flex items-center justify-center cursor-pointer"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={'var(--text-muted)'} strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </motion.button>
                    )}
                    {/* Loading Spinner */}
                    <AnimatePresence>
                        {isSearching && (
                            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                                <motion.svg width="16" height="16" viewBox="0 0 16 16" fill="none" animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}>
                                    <circle cx="8" cy="8" r="6" stroke={'rgba(59, 130, 246, 0.1)'} strokeWidth="2" fill="none" />
                                    <circle cx="8" cy="8" r="6" stroke={'var(--accent-color)'} strokeWidth="2" strokeLinecap="round" strokeDasharray="28" strokeDashoffset="21" fill="none" />
                                </motion.svg>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    {/* Search Suggestions Dropdown */}
                    <AnimatePresence>
                        {showSuggestions && searchSuggestions.length > 0 && searchQuery && (
                            <motion.div
                                ref={suggestionsRef}
                                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full left-0 right-0 mt-1.5 bg-dashboard-surface border border-dashboard-border rounded-[10px] shadow-lg z-[100] overflow-hidden"
                            >
                                <div className="py-1.5 px-2.5 border-b border-dashboard-border flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-[0.5px]">Suggestions</span>
                                    <span className="text-[9px] text-dashboard-muted">↑↓ navigate • Enter select</span>
                                </div>
                                {searchSuggestions.map((path, index) => (
                                    <motion.div
                                        key={path.id}
                                        onClick={() => {
                                            setSearchQuery(path.title);
                                            setShowSuggestions(false);
                                        }}
                                        className="py-2 px-3 cursor-pointer flex items-center gap-2.5"
                                        style={{
                                            background: selectedSuggestionIndex === index ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                            borderLeft: selectedSuggestionIndex === index ? `2px solid var(--accent-color)` : '2px solid transparent'
                                        }}
                                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                                    >
                                        <div style={{ 
                                            width: '32px', 
                                            height: '32px', 
                                            borderRadius: '8px', 
                                            background: `${path.color}15`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0 
                                        }}>
                                            <PathIcon icon={path.icon} color={path.color} size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[12px] font-medium text-dashboard-text truncate">{path.title}</div>
                                            <div className="text-[10px] text-dashboard-muted">{path.courses.length} courses • {path.difficulty}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Filter Tabs - Minimalistic with Icons */}
                <FilterTabs 
                    activeFilter={activeFilter} 
                    setActiveFilter={setActiveFilter} colors={colors}
                />

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
                            className="flex items-center gap-1.5 py-2 px-3 rounded-[10px] border border-purple-500/10 bg-purple-500/10 text-purple-500 text-[12px] font-medium cursor-pointer whitespace-nowrap overflow-hidden"
                            title="Show path recommendations"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                            <span>Recommendations</span>
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Sort Dropdown */}
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    style={{ position: 'relative' }}
                    layout
                >
                    <motion.button
                        layout
                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        animate={{
                            borderColor: showSortDropdown ? 'var(--accent-color)' : 'var(--border-color)',
                            backgroundColor: showSortDropdown 
                                ? ('rgba(59, 130, 246, 0.1)')
                                : 'var(--dashboard-surface)',
                            color: showSortDropdown ? 'var(--accent-color)' : 'var(--text-secondary)',
                        }}
                        transition={{ 
                            layout: { type: 'spring', stiffness: 500, damping: 30 },
                            default: { duration: 0.2 }
                        }}
                        className="flex items-center gap-1.5 py-2 px-3 rounded-[10px] border border-solid text-[12px] font-medium cursor-pointer"
                    >
                        {/* Sort Icon */}
                        <motion.svg 
                            layout
                            width="14" 
                            height="14" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <path d="M3 6h18M6 12h12M9 18h6" />
                        </motion.svg>
                        <motion.span
                            layout
                            key={sortBy}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.15 }}
                            className="min-w-[55px] text-left"
                        >
                            {sortBy === 'name' ? 'Name' : sortBy === 'progress' ? 'Progress' : 'Difficulty'}
                        </motion.span>
                        {/* Arrow Icon */}
                        <motion.svg 
                            layout
                            width="12" 
                            height="12" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                            animate={{ rotate: showSortDropdown ? 180 : 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                            <path d="M6 9l6 6 6-6" />
                        </motion.svg>
                    </motion.button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {showSortDropdown && (
                            <>
                                {/* Backdrop to close dropdown */}
                                <div
                                    onClick={() => setShowSortDropdown(false)}
                                    style={{
                                        position: 'fixed',
                                        inset: 0,
                                        zIndex: 99,
                                    }}
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    className="absolute top-[calc(100%+6px)] right-0 min-w-[160px] bg-dashboard-surface rounded-xl border border-dashboard-border shadow-lg p-1.5 z-[100] overflow-hidden"
                                >
                                    {/* Sort Options */}
                                    {[
                                        { id: 'name', label: 'Name', icon: (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 6h16M4 12h10M4 18h4" />
                                            </svg>
                                        )},
                                        { id: 'progress', label: 'Progress', icon: (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                            </svg>
                                        )},
                                        { id: 'difficulty', label: 'Difficulty', icon: (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                            </svg>
                                        )},
                                    ].map((option) => (
                                        <motion.button
                                            key={option.id}
                                            onClick={() => {
                                                if (sortBy === option.id) {
                                                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                } else {
                                                    setSortBy(option.id as 'name' | 'progress' | 'difficulty');
                                                    setSortOrder('asc');
                                                }
                                                setShowSortDropdown(false);
                                            }}
                                            whileHover={{ backgroundColor: 'var(--bg-hover)' }}
                                            className="flex items-center gap-2.5 w-full py-2.5 px-3 rounded-lg border-none cursor-pointer text-left text-[13px]"
                                            style={{
                                                background: sortBy === option.id 
                                                    ? ('rgba(59, 130, 246, 0.1)')
                                                    : 'transparent',
                                                color: sortBy === option.id ? 'var(--accent-color)' : 'var(--text-primary)',
                                                fontWeight: sortBy === option.id ? 500 : 400,
                                            }}
                                        >
                                            <span style={{ color: sortBy === option.id ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
                                                {option.icon}
                                            </span>
                                            <span className="flex-1">{option.label}</span>
                                            {sortBy === option.id && (
                                                <motion.svg
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke={'var(--accent-color)'}
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    {sortOrder === 'asc' ? (
                                                        <path d="M12 19V5M5 12l7-7 7 7" />
                                                    ) : (
                                                        <path d="M12 5v14M5 12l7 7 7-7" />
                                                    )}
                                                </motion.svg>
                                            )}
                                        </motion.button>
                                    ))}

                                    {/* Divider */}
                                    <div className="h-px bg-dashboard-border my-1.5" />

                                    {/* Order Toggle */}
                                    <motion.button
                                        onClick={() => {
                                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                            setShowSortDropdown(false);
                                        }}
                                        whileHover={{ backgroundColor: 'var(--bg-hover)' }}
                                        className="flex items-center gap-2.5 w-full py-2.5 px-3 rounded-lg border-none bg-transparent text-dashboard-muted text-[13px] font-normal cursor-pointer text-left"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
                                        </svg>
                                        <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                                    </motion.button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>


            {/* Paths Grid */}
            <LayoutGroup>
                <motion.div
                    layout
                    className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4"
                >
                    <AnimatePresence mode="popLayout">
                        {isLoading || isSearching ? (
                            // Loading/Search skeletons
                            [...Array(isSearching ? 3 : 4)].map((_, i) => (
                                <motion.div
                                    key={`skeleton-${i}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ delay: i * 0.05, duration: 0.3 }}
                                    className="p-5 rounded-2xl bg-dashboard-surface border border-dashboard-border overflow-hidden relative"
                                >
                                    {/* Shimmer effect overlay */}
                                    <motion.div
                                        animate={{
                                            x: ['-100%', '100%'],
                                        }}
                                        transition={{
                                            duration: 1.2,
                                            repeat: Infinity,
                                            ease: 'linear',
                                            delay: i * 0.1,
                                        }}
                                        className="absolute inset-0 pointer-events-none"
                                        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)' }}
                                    />
                                    <div className="flex gap-3 mb-4">
                                        <motion.div 
                                            animate={{ opacity: [0.5, 0.8, 0.5] }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                            className="w-12 h-12 rounded-xl bg-dashboard-hover" 
                                        />
                                        <div className="flex-1">
                                            <motion.div 
                                                animate={{ opacity: [0.5, 0.8, 0.5] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                                                className="h-4 w-[70%] rounded bg-dashboard-hover mb-2" 
                                            />
                                            <motion.div 
                                                animate={{ opacity: [0.5, 0.8, 0.5] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                                                className="h-3 w-1/2 rounded bg-dashboard-hover" 
                                            />
                                        </div>
                                    </div>
                                    {/* Additional skeleton rows for search */}
                                    <motion.div 
                                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                                        style={{
                                            height: '10px',
                                            width: '90%',
                                            borderRadius: '3px',
                                            background: 'var(--bg-hover)',
                                            marginBottom: '8px',
                                        }} 
                                    />
                                    <motion.div 
                                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                                        style={{
                                            height: '10px',
                                            width: '60%',
                                            borderRadius: '3px',
                                            background: 'var(--bg-hover)',
                                        }} 
                                    />
                                </motion.div>
                            ))
                        ) : filteredPaths.length === 0 ? (
                            // Empty state
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-[1/-1] py-12 px-6 text-center"
                            >
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={'var(--accent-color)'} strokeWidth="1.5">
                                        <path d="M3 3v18h18" />
                                        <path d="m19 9-5 5-4-4-3 3" />
                                    </svg>
                                </div>
                                <p className="m-0 text-[14px] font-medium text-dashboard-text">
                                    No paths found
                                </p>
                                <p className="mt-2 mb-0 text-[13px] text-dashboard-muted">
                                    {searchQuery ? 'Try a different search term' : 'Check back later for new paths'}
                                </p>
                            </motion.div>
                        ) : (
                            // Path cards
                            filteredPaths.map((path, index) => {
                                const difficultyInfo = getDifficultyInfo(path.difficulty);
                                const progress = path.progress?.progress_percentage || 0;
                                const isEnrolled = !!path.progress;

                                return (
                                    <motion.div
                                        key={path.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ 
                                            delay: index * 0.05,
                                            type: 'spring',
                                            stiffness: 400,
                                            damping: 25,
                                        }}
                                        whileHover={{ 
                                            y: -6,
                                            transition: { 
                                                type: 'spring', 
                                                stiffness: 400, 
                                                damping: 20,
                                                mass: 0.8,
                                            }
                                        }}
                                        className="path-card dashboard-interactive-card p-5 rounded-2xl bg-dashboard-surface cursor-pointer shadow-lg outline-none"
                                        style={{
                                            border: `1px solid ${isEnrolled ? `${path.color}30` : 'var(--border-light)'}`,
                                        }}
                                        tabIndex={0}
                                        role="button"
                                        aria-label={`${path.title} — ${path.difficulty} difficulty, ${progress}% complete`}
                                        onClick={() => handlePathClick(path)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePathClick(path); } }}
                                    >
                                        {/* Header */}
                                        <div className="flex gap-3 mb-3">
                                            <motion.div
                                                className="path-icon-container"
                                                whileHover={{ scale: 1.08 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                                style={{ background: `${path.color}15` }}
                                            >
                                                <PathIcon icon={path.icon} color={path.color} size={24} />
                                            </motion.div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="m-0 text-[15px] font-semibold text-dashboard-text leading-[1.3]">
                                                    {path.title}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: 600,
                                                        color: difficultyInfo.color,
                                                        padding: '3px 8px',
                                                        borderRadius: '4px',
                                                        background: `${difficultyInfo.color}15`,
                                                    }}>
                                                        {difficultyInfo.label}
                                                    </span>
                                                    <span style={{ 
                                                        fontSize: '11px', 
                                                        color: 'var(--text-muted)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                    }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <polyline points="12 6 12 12 16 14" />
                                                        </svg>
                                                        {formatEstimatedTime(getPathEstimatedHours(path))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="mt-0 mx-0 mb-3.5 text-[13px] text-dashboard-secondary leading-[1.5] line-clamp-2">
                                            {path.description}
                                        </p>

                                        {/* Quick Stats Row */}
                                        <motion.div 
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 + 0.1, duration: 0.3 }}
                                            className="flex gap-2 mb-3.5 p-3 rounded-[10px] bg-dashboard-hover"
                                        >
                                            <div className="flex-1 text-center">
                                                <div className="text-[18px] font-bold leading-none" style={{ color: path.color }}>
                                                    {path.courses.length}
                                                </div>
                                                <div className="text-[9px] text-dashboard-muted mt-1 uppercase tracking-[0.5px]">
                                                    Courses
                                                </div>
                                            </div>
                                            <div className="w-px bg-dashboard-border my-1" />
                                            <div className="flex-1 text-center">
                                                <div className="text-[18px] font-bold leading-none" style={{ color: path.color }}>
                                                    {getPathTotalModules(path)}
                                                </div>
                                                <div className="text-[9px] text-dashboard-muted mt-1 uppercase tracking-[0.5px]">
                                                    Modules
                                                </div>
                                            </div>
                                            <div style={{ width: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                                            <div style={{ flex: 1, textAlign: 'center' }}>
                                                <div style={{ 
                                                    fontSize: '18px', 
                                                    fontWeight: 700, 
                                                    color: '#10b981',
                                                    lineHeight: 1,
                                                }}>
                                                    {path.enrolled_count}
                                                </div>
                                                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Enrolled
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Courses included */}
                                        <div className="mb-4 p-2.5 rounded-lg bg-dashboard-hover">
                                            <div className="text-[10px] font-semibold text-dashboard-text mb-2 uppercase tracking-[0.5px] flex items-center gap-1.5">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                </svg>
                                                Courses Included
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {getPathCourses(path).slice(0, 4).map((course) => (
                                                    <motion.div
                                                        key={course.id}
                                                        className="course-chip flex items-center gap-1.5 py-[5px] px-2.5 rounded-md bg-dashboard-hover text-[11px] text-dashboard-text"
                                                    >
                                                        <img 
                                                            src={course.image} 
                                                            alt="" 
                                                            className="w-5 h-5 rounded object-cover"
                                                        />
                                                        <span className="font-medium">{course.shortTitle}</span>
                                                        <span className="text-[9px] text-dashboard-muted py-[1px] px-1 rounded-[3px] bg-dashboard-hover">
                                                            {course.modules}m
                                                        </span>
                                                    </motion.div>
                                                ))}
                                                {path.courses.length > 4 && (
                                                    <motion.div 
                                                        className="course-chip flex items-center gap-1 py-[5px] px-2.5 rounded-md text-[11px] font-medium"
                                                        whileHover={{ scale: 1.05 }}
                                                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                                        style={{ background: `${path.color}15`, color: path.color }}
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <path d="M12 8v8M8 12h8" />
                                                        </svg>
                                                        {path.courses.length - 4} more
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress Visualization or Enroll */}
                                        {isEnrolled ? (
                                            <div>
                                                {/* Progress Header with Circular Ring */}
                                                <div className="flex items-center gap-3.5 mb-3">
                                                    {/* Circular Progress Ring with Hover Tooltip */}
                                                    <ProgressRingWithTooltip
                                                        progress={progress}
                                                        pathColor={path.color} index={index}
                                                    />

                                                    {/* Progress Info */}
                                                    <div 
                                                        className="flex-1"
                                                        title={`Progress: ${progress}% - ${path.completed_courses_count} of ${path.total_courses} courses completed`}
                                                    >
                                                        <div className="text-[13px] font-semibold text-dashboard-text mb-1">
                                                            {progress === 100 ? 'Completed!' : progress === 0 ? 'Not Started' : 'In Progress'}
                                                        </div>
                                                        <div className="text-[12px] text-dashboard-text font-medium">
                                                            {path.completed_courses_count} of {path.total_courses} courses done
                                                        </div>
                                                    </div>

                                                    {/* Status Icon / Certificate Badge */}
                                                    {progress === 100 ? (
                                                        <motion.div
                                                            initial={{ scale: 0, rotate: -180 }}
                                                            animate={{ scale: 1, rotate: 0 }}
                                                            transition={{ delay: index * 0.05 + 0.4, type: 'spring', stiffness: 300 }}
                                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                                            className="w-9 h-9 rounded-[10px] flex items-center justify-center cursor-pointer shadow-[0_4px_12px_rgba(245,158,11,0.3)] bg-gradient-to-br from-amber-500 to-amber-600"
                                                            title="Certificate Earned! Click to view"
                                                        >
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="8" r="6" />
                                                                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                                                            </svg>
                                                        </motion.div>
                                                    ) : (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ delay: index * 0.05 + 0.4, type: 'spring', stiffness: 400 }}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                                                        style={{
                                                            background: progress > 0 ? `${path.color}15` : 'var(--bg-hover)'
                                                        }}
                                                    >
                                                        {progress > 0 ? (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={path.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <polyline points="12 6 12 12 16 14" />
                                                            </svg>
                                                        ) : (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={'var(--text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <path d="M12 8v4M12 16h.01" />
                                                            </svg>
                                                        )}
                                                    </motion.div>
                                                    )}
                                                </div>

                                                {/* Estimated Time Remaining */}
                                                {progress < 100 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 + 0.25, duration: 0.3 }}
                                                        className="flex items-center gap-2 py-2 px-3 rounded-lg bg-blue-500/10 border border-blue-500/10 mb-3"
                                                    >
                                                        {/* Clock Icon */}
                                                        <motion.div
                                                            animate={{ rotate: [0, 10, -10, 0] }}
                                                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                                            className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <polyline points="12 6 12 12 16 14" />
                                                            </svg>
                                                        </motion.div>
                                                        
                                                        {/* Time Info */}
                                                        <div className="flex-1">
                                                            <div className="text-[10px] text-dashboard-muted mb-0.5 uppercase tracking-[0.3px]">
                                                                Est. Time Remaining
                                                            </div>
                                                            <motion.div 
                                                                key={progress}
                                                                initial={{ opacity: 0, y: 5 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="text-[14px] font-semibold text-blue-500 flex items-center gap-1.5"
                                                            >
                                                                {formatEstimatedTime(Math.round(getPathEstimatedHours(path) * (1 - progress / 100)))}
                                                                <span className="text-[10px] font-normal text-dashboard-muted">
                                                                    ({path.total_courses - path.completed_courses_count} courses left)
                                                                </span>
                                                            </motion.div>
                                                        </div>

                                                        {/* Progress Mini Bar */}
                                                        <div style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            position: 'relative',
                                                        }}>
                                                            <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
                                                                <circle
                                                                    cx="20"
                                                                    cy="20"
                                                                    r="16"
                                                                    fill="none"
                                                                    stroke={'rgba(59, 130, 246, 0.1)'}
                                                                    strokeWidth="3"
                                                                />
                                                                <motion.circle
                                                                    cx="20"
                                                                    cy="20"
                                                                    r="16"
                                                                    fill="none"
                                                                    stroke="#3b82f6"
                                                                    strokeWidth="3"
                                                                    strokeLinecap="round"
                                                                    strokeDasharray={2 * Math.PI * 16}
                                                                    initial={{ strokeDashoffset: 2 * Math.PI * 16 }}
                                                                    animate={{ strokeDashoffset: 2 * Math.PI * 16 * (1 - progress / 100) }}
                                                                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                                                />
                                                            </svg>
                                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-bold text-blue-500">
                                                                {progress}%
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}

                                                {/* Course Milestone Tracker */}
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 + 0.3, duration: 0.4 }}
                                                    className="p-2.5 rounded-[10px] bg-dashboard-hover"
                                                >
                                                    <div 
                                                        className="text-[10px] font-semibold text-dashboard-text mb-2.5 uppercase tracking-[0.5px] flex items-center gap-1.5"
                                                        title="Track your progress through each course in this learning path"
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                            <path d="m9 11 3 3L22 4" />
                                                        </svg>
                                                        Course Progress
                                                    </div>
                                                    
                                                    {/* Milestone dots */}
                                                    <div className="flex items-center gap-1 relative">
                                                        {getPathCourses(path).map((course, courseIndex) => {
                                                            const isCompleted = path.progress?.completed_courses?.includes(course.id) || false;
                                                            const isCurrent = path.progress?.current_course_id === course.id;
                                                            
                                                            return (
                                                                <React.Fragment key={course.id}>
                                                                    <motion.div
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        transition={{ delay: index * 0.05 + 0.4 + courseIndex * 0.05, type: 'spring', stiffness: 400 }}
                                                                        title={`${course.shortTitle}: ${isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Not Started'}`}
                                                                        className={`rounded-full flex items-center justify-center shrink-0 ${isCurrent ? 'w-6 h-6' : 'w-[18px] h-[18px]'}`}
                                                                        style={{
                                                                            background: isCompleted ? '#10b981' : isCurrent ? path.color : 'var(--bg-hover)',
                                                                            border: isCurrent ? `2px solid ${path.color}40` : 'none',
                                                                            boxShadow: isCurrent ? `0 0 0 3px ${path.color}20` : 'none',
                                                                        }}
                                                                    >
                                                                        {isCompleted ? (
                                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                                <polyline points="20 6 9 17 4 12" />
                                                                            </svg>
                                                                        ) : isCurrent ? (
                                                                            <motion.div
                                                                                animate={{ scale: [1, 1.2, 1] }}
                                                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                                                className="w-1.5 h-1.5 rounded-full bg-white"
                                                                            />
                                                                        ) : null}
                                                                    </motion.div>
                                                                    {/* Connector line */}
                                                                    {courseIndex < path.courses.length - 1 && (
                                                                        <div className="flex-1 h-[2px] min-w-[8px]" style={{ background: isCompleted ? '#10b981' : 'var(--bg-hover)' }} />
                                                                    )}
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            </div>
                                        ) : (
                                            <motion.button
                                                className="enroll-btn w-full p-3 rounded-[10px] border-none text-white text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                transition={{ type: 'tween', duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEnroll(path.id);
                                                }}
                                                style={{
                                                    background: `linear-gradient(135deg, ${path.color} 0%, ${path.color}cc 100%)`,
                                                }}
                                            >
                                                <svg 
                                                    width="16" 
                                                    height="16" 
                                                    viewBox="0 0 24 24" 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    strokeWidth="2.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M5 12h14" />
                                                    <path d="m12 5 7 7-7 7" />
                                                </svg>
                                                Start Learning
                                            </motion.button>
                                        )}
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </motion.div>
            </LayoutGroup>

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
                    box-shadow: var(--shadow-lg) !important;
                    border-color: ${'var(--bg-hover)'} !important;
                }
                
                .path-icon-container {
                    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                                background 0.2s ease;
                }
                
                .path-card:hover .path-icon-container {
                    background: ${'rgba(59, 130, 246, 0.1)'};
                }
                
                .path-card:hover .course-chip {
                    transform: translateY(-1px);
                }
                
                .course-chip {
                    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                                background 0.15s ease;
                }
                
                .course-chip:hover {
                    background: ${'var(--bg-hover)'} !important;
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
                    box-shadow: var(--shadow-lg) !important;
                    border-color: ${'var(--bg-hover)'} !important;
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
                onClose={() => setSelectedPath(null)} courseProgress={courseProgress}
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
                onClose={() => setCertificatePath(null)} completedAt={certificatePath?.progress?.completed_at || undefined}
            />
        </div>
    );
};

export default PathsContent;
