/**
 * Paths Content - Learning Paths Main Page
 * Displays all available learning paths with filtering and enrollment
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { createPortal } from 'react-dom';
import {
    getPathsWithProgress,
    enrollInPath,
    getDifficultyInfo,
    getPathStats,
    getPathCourses,
    getPathTotalModules,
    getPathEstimatedHours,
    formatEstimatedTime,
    isCourseUnlocked,
    checkAndUnlockCourses,
    getCurrentCourse,
    getPathRecommendations,
    type PathWithProgress,
    type PathRecommendation,
} from '../../../../services/pathsService';
import { fetchStudentStats } from '../../../../services/databaseService';
import { PathIcon } from './components/PathIcon';
import { ProgressRingWithTooltip, ModalTooltip } from './components/PathProgressRing';
import { FilterTabs } from './components/PathFilterTabs';
import { PathDetailModal } from './modals/PathDetailModal';
import { PathCertificateModal } from './modals/PathCertificateModal';
import { PathCard } from './components/PathCard';

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

    // Handle enrollment
    const handleEnroll = async (pathId: string) => {
        const result = await enrollInPath(pathId, 'demo-student');
        if (result) {
            // Refresh paths
            const updated = await getPathsWithProgress('demo-student');
            setPaths(updated);
        }
    };

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
        <div style={{ 
            padding: '24px', 
            maxWidth: '1200px', 
            margin: '0 auto',
            minHeight: '100vh',
        }}>
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ marginBottom: '28px' }}
            >
                <motion.div 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '16px',
                        padding: '18px 22px',
                        borderRadius: '14px',
                        background: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                        boxShadow: isDarkMode 
                            ? '0 2px 12px rgba(0,0,0,0.15)' 
                            : '0 2px 12px rgba(0,0,0,0.04)',
                    }}
                >
                    {/* Icon */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ scale: 1.08, transition: { duration: 0.2 } }}
                        style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '12px',
                            background: isDarkMode 
                                ? 'rgba(59, 130, 246, 0.12)'
                                : 'rgba(59, 130, 246, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
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
                        style={{ flex: 1 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <h1 style={{ 
                                margin: 0, 
                                fontSize: '20px', 
                                fontWeight: 600, 
                                color: colors.textPrimary,
                                letterSpacing: '-0.3px',
                            }}>
                                Learning Paths
                            </h1>
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.25, duration: 0.3 }}
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    color: '#3b82f6',
                                    background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.4px',
                                }}
                            >
                                {stats.totalPaths} Path{stats.totalPaths !== 1 ? 's' : ''}
                            </motion.span>
                        </div>
                        <p style={{ 
                            margin: 0, 
                            fontSize: '13px', 
                            color: colors.textSecondary,
                            fontWeight: 400,
                        }}>
                            Structured journeys to master new skills step by step
                        </p>
                    </motion.div>

                    {/* Quick Stats Cards */}
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            display: 'flex',
                            alignItems: 'stretch',
                            gap: '10px',
                        }}
                    >
                        {[
                            {
                                label: 'Total Paths',
                                value: stats.totalPaths,
                                description: 'Available',
                                color: '#3b82f6',
                                bgColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.06)',
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
                                bgColor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.06)',
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
                                bgColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.06)',
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
                                bgColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.06)',
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
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    padding: '10px 16px',
                                    borderRadius: '10px',
                                    background: stat.bgColor,
                                    cursor: 'default',
                                    minWidth: '72px',
                                }}
                                title={`${stat.label}: ${stat.value} paths`}
                            >
                                <div style={{ 
                                    color: stat.color, 
                                    marginBottom: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    {stat.icon}
                                </div>
                                <span style={{ 
                                    fontSize: '18px', 
                                    fontWeight: 700, 
                                    color: stat.color,
                                    lineHeight: 1,
                                    marginBottom: '2px',
                                }}>
                                    {stat.value}
                                </span>
                                <span style={{ 
                                    fontSize: '10px', 
                                    fontWeight: 500, 
                                    color: colors.textMuted,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.3px',
                                }}>
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
                    style={{ flex: 1, minWidth: '220px', position: 'relative' }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>
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
                        style={{
                            width: '100%',
                            padding: '12px 70px 12px 42px',
                            borderRadius: '12px',
                            border: `1px solid ${colors.border}`,
                            background: colors.cardBg,
                            color: colors.textPrimary,
                            fontSize: '13px',
                            fontWeight: 400,
                            outline: 'none',
                            transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                        }}
                    />
                    {/* Keyboard hint */}
                    {!searchQuery && (
                        <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px', pointerEvents: 'none' }}>
                            <span style={{ fontSize: '10px', color: colors.textMuted, padding: '2px 6px', borderRadius: '4px', background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', fontFamily: 'monospace' }}>/</span>
                        </div>
                    )}
                    {/* Clear button */}
                    {searchQuery && !isSearching && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}
                            style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '6px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </motion.button>
                    )}
                    {/* Loading Spinner */}
                    <AnimatePresence>
                        {isSearching && (
                            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                                <motion.svg width="16" height="16" viewBox="0 0 16 16" fill="none" animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}>
                                    <circle cx="8" cy="8" r="6" stroke={isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'} strokeWidth="2" fill="none" />
                                    <circle cx="8" cy="8" r="6" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeDasharray="28" strokeDashoffset="21" fill="none" />
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
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    marginTop: '6px',
                                    background: colors.cardBg,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '10px',
                                    boxShadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.12)',
                                    zIndex: 100,
                                    overflow: 'hidden',
                                }}
                            >
                                <div style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Suggestions</span>
                                    <span style={{ fontSize: '9px', color: colors.textMuted }}>↑↓ navigate • Enter select</span>
                                </div>
                                {searchSuggestions.map((path, index) => (
                                    <motion.div
                                        key={path.id}
                                        onClick={() => {
                                            setSearchQuery(path.title);
                                            setShowSuggestions(false);
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            background: selectedSuggestionIndex === index ? (isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)') : 'transparent',
                                            borderLeft: selectedSuggestionIndex === index ? `2px solid ${colors.accent}` : '2px solid transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
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
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '12px', fontWeight: 500, color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{path.title}</div>
                                            <div style={{ fontSize: '10px', color: colors.textMuted }}>{path.courses.length} courses • {path.difficulty}</div>
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
                    setActiveFilter={setActiveFilter} 
                    isDarkMode={isDarkMode}
                    colors={colors}
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
                            borderColor: showSortDropdown ? colors.accent : colors.border,
                            backgroundColor: showSortDropdown 
                                ? (isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)')
                                : colors.cardBg,
                            color: showSortDropdown ? colors.accent : colors.textSecondary,
                        }}
                        transition={{ 
                            layout: { type: 'spring', stiffness: 500, damping: 30 },
                            default: { duration: 0.2 }
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: '1px solid',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}
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
                            style={{ minWidth: '55px', textAlign: 'left' }}
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
                                    style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 6px)',
                                        right: 0,
                                        minWidth: '160px',
                                        background: isDarkMode ? '#1e293b' : '#ffffff',
                                        borderRadius: '12px',
                                        border: `1px solid ${colors.border}`,
                                        boxShadow: isDarkMode 
                                            ? '0 8px 24px rgba(0, 0, 0, 0.4)' 
                                            : '0 8px 24px rgba(0, 0, 0, 0.12)',
                                        padding: '6px',
                                        zIndex: 100,
                                        overflow: 'hidden',
                                    }}
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
                                            whileHover={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                width: '100%',
                                                padding: '10px 12px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: sortBy === option.id 
                                                    ? (isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)')
                                                    : 'transparent',
                                                color: sortBy === option.id ? colors.accent : colors.textPrimary,
                                                fontSize: '13px',
                                                fontWeight: sortBy === option.id ? 500 : 400,
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                            }}
                                        >
                                            <span style={{ color: sortBy === option.id ? colors.accent : colors.textSecondary }}>
                                                {option.icon}
                                            </span>
                                            <span style={{ flex: 1 }}>{option.label}</span>
                                            {sortBy === option.id && (
                                                <motion.svg
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke={colors.accent}
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
                                    <div style={{
                                        height: '1px',
                                        background: colors.border,
                                        margin: '6px 0',
                                    }} />

                                    {/* Order Toggle */}
                                    <motion.button
                                        onClick={() => {
                                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                            setShowSortDropdown(false);
                                        }}
                                        whileHover={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: 'transparent',
                                            color: colors.textSecondary,
                                            fontSize: '13px',
                                            fontWeight: 400,
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                        }}
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
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '16px',
                    }}
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
                                    style={{
                                        padding: '20px',
                                        borderRadius: '16px',
                                        background: colors.cardBg,
                                        border: `1px solid ${colors.border}`,
                                        overflow: 'hidden',
                                        position: 'relative',
                                    }}
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
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: `linear-gradient(90deg, transparent 0%, ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)'} 50%, transparent 100%)`,
                                            pointerEvents: 'none',
                                        }}
                                    />
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                        <motion.div 
                                            animate={{ opacity: [0.5, 0.8, 0.5] }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                            style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '12px',
                                                background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                            }} 
                                        />
                                        <div style={{ flex: 1 }}>
                                            <motion.div 
                                                animate={{ opacity: [0.5, 0.8, 0.5] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                                                style={{
                                                    height: '16px',
                                                    width: '70%',
                                                    borderRadius: '4px',
                                                    background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                                    marginBottom: '8px',
                                                }} 
                                            />
                                            <motion.div 
                                                animate={{ opacity: [0.5, 0.8, 0.5] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                                                style={{
                                                    height: '12px',
                                                    width: '50%',
                                                    borderRadius: '4px',
                                                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                                }} 
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
                                            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
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
                                            background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                                        }} 
                                    />
                                </motion.div>
                            ))
                        ) : filteredPaths.length === 0 ? (
                            // Empty state
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{
                                    gridColumn: '1 / -1',
                                    padding: '48px 24px',
                                    textAlign: 'center',
                                }}
                            >
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    margin: '0 auto 16px',
                                    borderRadius: '16px',
                                    background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="1.5">
                                        <path d="M3 3v18h18" />
                                        <path d="m19 9-5 5-4-4-3 3" />
                                    </svg>
                                </div>
                                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: colors.textPrimary }}>
                                    No paths found
                                </p>
                                <p style={{ margin: '8px 0 0', fontSize: '13px', color: colors.textMuted }}>
                                    {searchQuery ? 'Try a different search term' : 'Check back later for new paths'}
                                </p>
                            </motion.div>
                        ) : (
                            // Path cards
                filteredPaths.map((path, index) => (
                    <PathCard
                        key={path.id}
                        path={path}
                        index={index}
                        isDarkMode={isDarkMode}
                        colors={colors}
                        onPathSelect={onPathSelect}
                    />
                ))
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
                isDarkMode={isDarkMode}
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
                isDarkMode={isDarkMode}
                completedAt={certificatePath?.progress?.completed_at || undefined}
            />
        </div>
    );
};

export default PathsContent;
