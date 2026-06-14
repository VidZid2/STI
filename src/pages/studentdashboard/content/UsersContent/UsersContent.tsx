// @ts-nocheck
/**
 * Users Content - User Account Management Page
 * Minimalistic professional design matching PathsContent/GoalsContent
 * Accessibility: prefers-reduced-motion support, keyboard navigation
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import {
    fetchUsers,
    getUserStats,
    searchUsers,
    getRoleInfo,
    sortUsers,
    getClassmates,
    type UserAccount,
    type UserStats,
    type UserFilter,
    type UserSortOption,
} from '../../../../services/usersService';



import { getProfile } from '../../../../services/profileService';
import { getCurrentLevel, getXPProgress } from '../../../../services/studyTimeService';
import { AnimatedCircularProgressBar } from '../../../../components/ui/animated-circular-progress-bar';


import { FilterTabs } from './components/FilterTabs';
import { UserCard, UserListItem } from './components/UserCard';
import { UserCardSkeleton } from './components/UsersSkeleton';
import { TeacherSpotlight } from './components/TeacherSpotlight';
import { EmptyState } from '../CourseViewPage/components/SharedComponents';
import UserDetailModal from './modals/UserDetailModal';

// Custom hook for detecting reduced motion preference
const useReducedMotion = (): boolean => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
        if (typeof window === 'undefined') return false;
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        return mediaQuery.matches;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handleChange = (event: MediaQueryListEvent) => {
            setPrefersReducedMotion(event.matches);
        };
        
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return prefersReducedMotion;
};

// Custom hook for detecting mobile/touch devices
const useIsMobile = (): boolean => {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(max-width: 768px)').matches || 
               ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0);
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        const handleChange = (event: MediaQueryListEvent) => {
            setIsMobile(event.matches || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
        };
        
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return isMobile;
};

// Helper function to format time ago
const getTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
};



// Pagination constants
const USERS_PER_PAGE = 12;

// User Avatar Component with Online Status
// UserAvatar — extracted to ./components/UserAvatar.tsx
// RoleIcon — extracted to ./components/RoleIcon.tsx

// Filter Tabs Component (matching PathsContent style)
type FilterTab = UserFilter;

// FilterTabs — moved to ./components/FilterTabs.tsx
// QuickActionButton + HeartIcon + UserCard + UserListItem — moved to ./components/UserCard.tsx
// EmptyState — moved to ./components/UsersEmptyState.tsx
// SkeletonPulse + UserCardSkeleton — moved to ./components/UsersSkeleton.tsx
// TeacherSpotlightSkeleton + TeacherSpotlight — moved to ./components/TeacherSpotlight.tsx
// UserDetailModal — moved to ./modals/UserDetailModal.tsx

// Main UsersContent Component
const UsersContent: React.FC = () => {
    const myProfile = getProfile();
    const myLevel = getCurrentLevel();
    const myProgress = getXPProgress();
    
    // Accessibility: Detect reduced motion preference
    const reducedMotion = useReducedMotion();
    // Mobile detection for always-visible quick actions
    const isMobile = useIsMobile();
    
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [stats, setStats] = useState<UserStats>({
        totalUsers: 0,
        activeUsers: 0,
        onlineUsers: 0,
        students: 0,
        teachers: 0,
        admins: 0,
    });
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [searchSuggestions, setSearchSuggestions] = useState<UserAccount[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sortOption, setSortOption] = useState<UserSortOption>('name');
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const sortDropdownRef = useRef<HTMLDivElement>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [classmates, setClassmates] = useState<UserAccount[]>([]);
    const [currentClassmatesPage, setCurrentClassmatesPage] = useState(0);
    const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);
    const [classmatesPageDirection, setClassmatesPageDirection] = useState(0);
    const [classmateSearchQuery, setClassmateSearchQuery] = useState('');
    const [isClassmateSearching, setIsClassmateSearching] = useState(false);
    const [debouncedClassmateSearch, setDebouncedClassmateSearch] = useState('');
    
    useEffect(() => {
        if (!classmateSearchQuery) {
            setDebouncedClassmateSearch('');
            setIsClassmateSearching(false);
            return;
        }
        setIsClassmateSearching(true);
        const timer = setTimeout(() => {
            setDebouncedClassmateSearch(classmateSearchQuery);
            setIsClassmateSearching(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [classmateSearchQuery]);
    
    const classmatesPerPage = isMobile ? 4 : 9;
    const filteredClassmates = classmates.filter(c => {
        if (filterOnlineOnly && !c.is_online) return false;
        if (debouncedClassmateSearch) {
            const q = debouncedClassmateSearch.toLowerCase();
            const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
            return fullName.includes(q);
        }
        return true;
    });
    const totalClassmatesPages = Math.ceil(filteredClassmates.length / classmatesPerPage);
    const paginatedClassmates = filteredClassmates.slice(
        currentClassmatesPage * classmatesPerPage,
        (currentClassmatesPage + 1) * classmatesPerPage
    );
    const [favorites, setFavorites] = useState<string[]>(() => {
        // Load favorites from localStorage
        const saved = localStorage.getItem('user_favorites');
        return saved ? JSON.parse(saved) : [];
    });
    
    // Pagination state for infinite scroll
    const [displayedCount, setDisplayedCount] = useState(USERS_PER_PAGE);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    
    const handleToggleFavorite = useCallback((userId: string) => {
        setFavorites(prev => {
            const newFavorites = prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId];
            // Save to localStorage
            localStorage.setItem('user_favorites', JSON.stringify(newFavorites));
            return newFavorites;
        });
    }, []);

    // Handle user card click
    const handleUserClick = useCallback((user: UserAccount) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    }, []);

    // Handle modal close
    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedUser(null), 200); // Clear after animation
    }, []);
    
    // Dark mode detection
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return document.documentElement.classList.contains('dark') ||
               document.body.classList.contains('dark-mode');
    });

    useEffect(() => {
        const checkDarkMode = () => setIsDarkMode(document.body.classList.contains('dark-mode'));
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Load users, stats, and classmates
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [usersData, statsData, classmatesData] = await Promise.all([
                    fetchUsers(activeFilter),
                    getUserStats(),
                    getClassmates('BSIT101A'),
                ]);
                setUsers(sortUsers(usersData, sortOption));
                setStats(statsData);
                setClassmates(classmatesData);
            } catch (err) {
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [activeFilter, sortOption]);

    // Search handler with debounce and suggestions
    useEffect(() => {
        if (!searchQuery.trim()) {
            setIsSearching(false);
            setSearchSuggestions([]);
            setShowSuggestions(false);
            setSelectedSuggestionIndex(-1);
            fetchUsers(activeFilter).then(data => setUsers(sortUsers(data, sortOption)));
            return;
        }
        
        setIsSearching(true);
        const timer = setTimeout(async () => {
            const results = await searchUsers(searchQuery);
            const filtered = activeFilter === 'all' 
                ? results 
                : results.filter(u => u.role === activeFilter);
            setUsers(sortUsers(filtered, sortOption));
            // Set suggestions (limit to 5)
            setSearchSuggestions(filtered.slice(0, 5));
            setShowSuggestions(filtered.length > 0);
            setIsSearching(false);
        }, 150); // Faster for suggestions
        
        return () => clearTimeout(timer);
    }, [searchQuery, activeFilter, sortOption]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current && 
                !suggestionsRef.current.contains(event.target as Node) &&
                searchInputRef.current &&
                !searchInputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
                setSelectedSuggestionIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle keyboard navigation for suggestions
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || searchSuggestions.length === 0) return;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedSuggestionIndex(prev => 
                    prev < searchSuggestions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedSuggestionIndex(prev => 
                    prev > 0 ? prev - 1 : searchSuggestions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedSuggestionIndex >= 0) {
                    const selectedUser = searchSuggestions[selectedSuggestionIndex];
                    handleUserClick(selectedUser);
                    setShowSuggestions(false);
                    setSelectedSuggestionIndex(-1);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedSuggestionIndex(-1);
                break;
        }
    };

    // Handle suggestion click
    const handleSuggestionClick = (user: UserAccount) => {
        handleUserClick(user);
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
    };

    // Close sort dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
                setIsSortDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset displayed count when filter/search changes
    useEffect(() => {
        setDisplayedCount(USERS_PER_PAGE);
    }, [activeFilter, searchQuery, sortOption]);

    // Infinite scroll using Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && !isLoadingMore && displayedCount < users.length) {
                    setIsLoadingMore(true);
                    // Simulate loading delay for smooth UX
                    setTimeout(() => {
                        setDisplayedCount(prev => Math.min(prev + USERS_PER_PAGE, users.length));
                        setIsLoadingMore(false);
                    }, 300);
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [displayedCount, users.length, isLoadingMore]);

    // Get the users to display (paginated)
    const displayedUsers = users.slice(0, displayedCount);
    const hasMoreUsers = displayedCount < users.length;

    // Listen for profile/settings changes to update in real-time
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            // Check if the change is related to user profile, images, or settings
            if (e.key === 'user_profile' || e.key === 'user_images' || e.key === 'user_settings') {
                // Refresh users list to reflect changes
                fetchUsers(activeFilter).then(data => setUsers(sortUsers(data, sortOption)));
            }
        };

        // Listen for storage events (works across tabs)
        window.addEventListener('storage', handleStorageChange);

        // Also listen for custom event for same-tab updates
        const handleProfileUpdate = () => {
            fetchUsers(activeFilter).then(data => setUsers(sortUsers(data, sortOption)));
        };
        window.addEventListener('profileUpdated', handleProfileUpdate);
        window.addEventListener('settingsUpdated', handleProfileUpdate);
        window.addEventListener('imagesUpdated', handleProfileUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('profileUpdated', handleProfileUpdate);
            window.removeEventListener('settingsUpdated', handleProfileUpdate);
            window.removeEventListener('imagesUpdated', handleProfileUpdate);
        };
    }, [activeFilter, sortOption]);

    // Colors based on theme (matching PathsContent)
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
            {/* Header Section - Matching GoalsContent/PathsContent style */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mt-[72px] md:mt-0 mb-7"
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
                            {/* Icon Container */}
                            <div className="relative flex-shrink-0 mb-1 sm:mb-0">
                                <div className="relative w-[72px] h-[72px] sm:w-[84px] sm:h-[84px]">
                                    <div className="w-full h-full relative">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                                            whileHover={{ scale: 1.05, rotate: -5, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
                                            className="absolute flex items-center justify-center shadow-sm transition-all duration-500 inset-0 m-auto w-[56px] h-[56px] sm:w-[60px] sm:h-[60px] rounded-[16px] sm:rounded-[20px] bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100 dark:from-blue-500/10 dark:to-blue-500/5 dark:border-blue-500/20"
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-600 dark:text-blue-400 transition-all duration-500 sm:w-8 sm:h-8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                <circle cx="9" cy="7" r="4" />
                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                            </svg>
                                        </motion.div>
                                    </div>
                                </div>
                                
                                {/* Overlapping Custom Badge */}
                                {stats.totalUsers > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, x: "-50%", scale: 0.8 }}
                                        animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
                                        transition={{ duration: 0.4, delay: 0.4, type: "spring", stiffness: 300, damping: 20 }}
                                        className="absolute -bottom-1.5 sm:-bottom-2 left-1/2 px-1.5 sm:px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border-[2px] sm:border-[2.5px] border-white dark:border-slate-800 shadow-sm flex items-center justify-center whitespace-nowrap z-10 min-w-[36px] sm:min-w-[40px]"
                                    >
                                        <span className="text-[11px] sm:text-[13px] font-black text-slate-700 dark:text-slate-200 leading-none" style={{ paddingTop: '1px' }}>
                                            {stats.totalUsers}
                                        </span>
                                    </motion.div>
                                )}
                            </div>
                            
                            {/* Title & Description */}
                            <div className="min-w-0 flex flex-col justify-center items-center sm:items-start py-1">
                                <div className="flex items-center justify-center sm:justify-start gap-3 mb-2 sm:mb-3 flex-wrap">
                                    <h1 className="text-xl sm:text-[26px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                                        Community
                                    </h1>
                                </div>
                                <p className="text-sm sm:text-[14.5px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl text-center sm:text-left">
                                    Connect with your classmates and instructors
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Detailed Metrics */}
                    <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-2 sm:mt-0">
                        {[
                            {
                                label: 'Total',
                                value: stats.totalUsers,
                                description: 'Peers',
                                color: 'text-blue-600 dark:text-blue-400',
                                bgColor: 'bg-blue-50 dark:bg-blue-500/10',
                                borderColor: 'hover:border-blue-300 dark:hover:border-blue-700',
                                icon: (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                ),
                            },
                            {
                                label: 'Online',
                                value: stats.onlineUsers,
                                description: 'Online',
                                color: 'text-emerald-600 dark:text-emerald-400',
                                bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
                                borderColor: 'hover:border-emerald-300 dark:hover:border-emerald-700',
                                icon: (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                ),
                            },
                            {
                                label: 'Students',
                                value: stats.students,
                                description: 'Enrolled',
                                color: 'text-violet-600 dark:text-violet-400',
                                bgColor: 'bg-violet-50 dark:bg-violet-500/10',
                                borderColor: 'hover:border-violet-300 dark:hover:border-violet-700',
                                icon: (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                                    </svg>
                                ),
                            },
                            {
                                label: 'Teachers',
                                value: stats.teachers,
                                description: 'Faculty',
                                color: 'text-amber-600 dark:text-amber-400',
                                bgColor: 'bg-amber-50 dark:bg-amber-500/10',
                                borderColor: 'hover:border-amber-300 dark:hover:border-amber-700',
                                icon: (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                ),
                            },
                        ].map((stat, i) => (
                            <motion.div 
                                key={stat.label}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 + i * 0.05, duration: 0.3 }}
                                className={`flex flex-col p-3 sm:p-4 rounded-[16px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md ${stat.borderColor}`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`p-1.5 rounded-md ${stat.bgColor} ${stat.color}`}>
                                        {stat.icon}
                                    </div>
                                    <span className={`text-[10px] font-bold ${stat.color} uppercase tracking-wider`}>{stat.label}</span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{stat.value}</span>
                                    <span className="text-xs font-medium text-slate-500">{stat.description}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>

            {/* Main Content Split Layout */}
            <div className="flex flex-col mb-6">
                
                {/* Unified Container: Classmates & Teacher Spotlight */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.4 }}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-[20px] sm:rounded-[24px] -mx-4 sm:-mx-6 lg:mx-0 p-5 sm:p-6 flex flex-col xl:flex-row transition-all duration-300 hover:shadow-md relative overflow-hidden"
                >
                    {/* Classmates Section (Left) */}
                    <div className="flex-1 flex flex-col min-w-0 pr-0 xl:pr-6">
                        {/* Background Ambient Glow */}
                        {/* Section Header */}
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 xl:gap-0 mb-5 relative z-10">
                            <div className="flex items-center gap-3 min-w-0">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-[12px] sm:rounded-[14px] bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center flex-shrink-0 shadow-sm relative transition-transform duration-300"
                                >
                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </motion.div>
                                <div className="flex flex-col min-w-0">
                                    <h3 className="text-[15px] sm:text-[16px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight mb-0.5 transition-colors truncate">
                                        My Classmates
                                    </h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[12px] sm:text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-none truncate">
                                            BSIT101A
                                        </p>
                                        <div className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 border border-blue-200/50 dark:border-blue-700/50 text-blue-700 dark:text-blue-400 text-[10px] sm:text-[11px] font-bold tracking-wide flex items-center gap-1 shrink-0">
                                            <span>{classmates.length}</span>
                                            <span>Students</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1 flex justify-end w-full mt-3 sm:mt-0 sm:ml-8">
                                {/* Search Classmates */}
                                <div className="relative group/search w-full">
                                    <svg className="absolute left-3.5 top-0 bottom-0 my-auto w-4 h-4 text-slate-400 z-10 transition-colors duration-200 group-focus-within/search:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search classmates..."
                                        value={classmateSearchQuery}
                                        onChange={(e) => {
                                            setClassmateSearchQuery(e.target.value);
                                            setCurrentClassmatesPage(0);
                                        }}
                                        className="h-10 w-full rounded-[14px] border border-slate-200 bg-slate-50/80 pl-10 pr-[72px] py-2 text-[14px] font-semibold focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all duration-300 text-slate-900 placeholder-slate-400 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/10"
                                    />
                                    <div className="absolute right-2 top-0 bottom-0 flex items-center gap-2 z-10">
                                        <motion.div layout transition={{ type: "spring", stiffness: 400, damping: 25 }} className="relative flex items-center group/tooltip">
                                            <button 
                                                onClick={() => { setFilterOnlineOnly(!filterOnlineOnly); setCurrentClassmatesPage(0); }}
                                                className={`!min-w-0 !min-h-0 !p-0 w-[26px] h-[26px] sm:w-7 sm:h-7 flex flex-shrink-0 items-center justify-center rounded-[6px] sm:rounded-md border transition-all duration-300 cursor-pointer ${
                                                    filterOnlineOnly 
                                                        ? 'bg-blue-500 border-blue-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.4)]' 
                                                        : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-800/40'
                                                }`}
                                            >
                                                <svg className="w-[18px] h-[18px] sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                    <circle cx="8" cy="7" r="4" />
                                                    <circle cx="19" cy="8" r="2.5" className={filterOnlineOnly ? 'fill-white animate-pulse' : 'fill-blue-500 animate-pulse'} stroke="none" />
                                                </svg>
                                            </button>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 text-[10px] font-extrabold rounded-[6px] opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 shadow-sm whitespace-nowrap pointer-events-none z-50">
                                                {filterOnlineOnly ? 'Show All' : 'Online Only'}
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-slate-800 border-b border-r border-slate-200 dark:border-slate-700 rotate-45"></div>
                                            </div>
                                        </motion.div>
                                        <AnimatePresence mode="popLayout">
                                            {isClassmateSearching ? (
                                                <motion.div
                                                    layout
                                                    key="spinner"
                                                    initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                                    exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                                    className="!min-w-0 !min-h-0 !p-0 w-[26px] h-[26px] sm:w-7 sm:h-7 flex flex-shrink-0 items-center justify-center"
                                                >
                                                    <svg className="w-[18px] h-[18px] sm:w-[18px] sm:h-[18px] animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                </motion.div>
                                            ) : classmateSearchQuery ? (
                                                <motion.button 
                                                    layout
                                                    key="clear"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    onClick={() => { setClassmateSearchQuery(''); setCurrentClassmatesPage(0); }}
                                                    className="!min-w-0 !min-h-0 !p-0 w-[26px] h-[26px] sm:w-7 sm:h-7 flex flex-shrink-0 items-center justify-center rounded-[6px] sm:rounded-md bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                                >
                                                    <svg className="w-[18px] h-[18px] sm:w-[18px] sm:h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </motion.button>
                                            ) : (
                                                <motion.div 
                                                    layout
                                                    key="hint"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className="hidden sm:flex h-6 w-6 items-center justify-center rounded-[6px] border border-slate-200 bg-white text-[11px] font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                                                >
                                                    /
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Separator */}
                        <hr className="border-t border-slate-200 dark:border-slate-600 w-full mb-5 relative z-10" />

                        {/* Classmates Grid */}
                        <div className="relative z-10 w-full mb-2 overflow-hidden pb-2 -mb-2 px-1 -mx-1">
                            <AnimatePresence mode="popLayout" custom={classmatesPageDirection}>
                                <motion.div
                                    key={isClassmateSearching ? 'searching' : (paginatedClassmates.length === 0 ? 'empty' : currentClassmatesPage)}
                                    custom={classmatesPageDirection}
                                    variants={{
                                        enter: (dir: number) => ({ x: dir > 0 ? '100%' : dir < 0 ? '-100%' : 0, opacity: 0 }),
                                        center: { x: 0, opacity: 1 },
                                        exit: (dir: number) => ({ x: dir < 0 ? '100%' : dir > 0 ? '-100%' : 0, opacity: 0 })
                                    }}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ damping: 18, stiffness: 90, type: 'spring', duration: 0.2 }}
                                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 w-full"
                                >
                                {isClassmateSearching ? (
                                    Array.from({ length: classmatesPerPage }).map((_, i) => (
                                        <div 
                                            key={`skeleton-${i}`} 
                                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] rounded-[16px] p-3.5 flex items-center gap-3.5 overflow-hidden"
                                        >
                                            {/* Avatar Skeleton */}
                                            <div className="relative flex-shrink-0">
                                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-[3px] border-slate-100 dark:border-slate-700 flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/50">
                                                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-200 dark:bg-slate-600 animate-pulse" />
                                                </div>
                                                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 min-w-[32px] sm:min-w-[36px] h-[16px] sm:h-[18px] bg-slate-200 dark:bg-slate-600 rounded-md border-[2px] border-white dark:border-slate-800 animate-pulse" />
                                            </div>
                                            {/* Text Skeleton */}
                                            <div className="flex flex-col min-w-0 justify-center gap-2 flex-1 mt-0.5">
                                                <div className="h-[14px] bg-slate-200 dark:bg-slate-600 rounded-[4px] animate-pulse w-[75%]" />
                                                <div className="h-[10px] bg-slate-100 dark:bg-slate-700 rounded-[3px] animate-pulse w-[40%]" />
                                            </div>
                                        </div>
                                    ))
                                ) : paginatedClassmates.length > 0 ? (
                                    paginatedClassmates.map((classmate, index) => (
                                    <div
                                        key={classmate.id}
                                        onClick={() => handleUserClick(classmate)}
                                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] rounded-[16px] p-3.5 flex items-center gap-3.5 group transition-all duration-300 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer overflow-hidden"
                                    >
                                        {(() => {
                                        const isMe = classmate.email === myProfile.email || classmate.full_name.includes(myProfile.firstName);
                                        const userLevel = isMe ? myLevel : 1;
                                        const userProgress = isMe ? myProgress : 0;
                                        
                                        return (
                                            <div className="relative flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                                                <AnimatedCircularProgressBar
                                                    max={100}
                                                    min={0}
                                                    value={userProgress}
                                                    gaugePrimaryColor="#3b82f6"
                                                    gaugeSecondaryColor={isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(219, 234, 254, 0.6)'}
                                                    className="w-14 h-14 sm:w-16 sm:h-16"
                                                >
                                                    <div className="absolute inset-1.5 sm:inset-2 rounded-full flex items-center justify-center shadow-sm overflow-hidden z-10 bg-blue-50 dark:bg-blue-900/30">
                                                        {classmate.profile_image ? (
                                                            <img src={classmate.profile_image} alt={classmate.full_name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-[14px] sm:text-[16px] font-extrabold leading-none text-blue-600 dark:text-blue-400">
                                                                {classmate.first_name?.[0] || ''}{classmate.last_name?.[0] || ''}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 min-w-[32px] sm:min-w-[36px] h-[16px] sm:h-[18px] px-1.5 rounded-md flex items-center justify-center text-[9px] sm:text-[10px] font-bold tracking-wider shadow-sm border-[2px] z-20 transition-colors duration-300 text-white bg-blue-500 ${isDarkMode ? (classmate.is_online ? 'border-emerald-400' : 'border-slate-800') : (classmate.is_online ? 'border-emerald-500' : 'border-white')}`}>
                                                        LV.{userLevel}
                                                    </div>
                                                </AnimatedCircularProgressBar>
                                            </div>
                                        );
                                    })()}
                                        <div className="flex flex-col min-w-0 justify-center">
                                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                                {classmate.full_name}
                                            </h2>
                                            <p className={`text-[11px] font-semibold leading-none truncate ${classmate.is_online ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {classmate.is_online ? 'Online' : 'Offline'}
                                            </p>
                                        </div>
                                    </div>
                                    ))
                                ) : (
                                    <div
                                        key="empty-state"
                                        className="col-span-full"
                                    >
                                        <EmptyState
                                            icon={
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
                                                </svg>
                                            }
                                            title={classmateSearchQuery ? `No classmates match "${classmateSearchQuery}"` : "No classmates found"}
                                            description={classmateSearchQuery ? 'Try a different search term' : 'There are no classmates matching your current filters.'}
                                            action={classmateSearchQuery ? {
                                                label: 'Clear search',
                                                onClick: () => {
                                                    setClassmateSearchQuery('');
                                                }
                                            } : undefined}
                                        />
                                    </div>
                                )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Pagination Controls */}
                        {totalClassmatesPages > 1 && (
                            <div className="w-full pt-2.5 mt-auto">
                                <div className="flex items-center justify-between w-full gap-2 bg-white dark:bg-slate-900/50 p-1.5 rounded-[14px] border border-slate-200/60 dark:border-slate-700/50 shadow-sm transition-all duration-300 hover:shadow-md">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setClassmatesPageDirection(-1);
                                            setCurrentClassmatesPage(prev => Math.max(0, prev - 1));
                                        }} 
                                        disabled={currentClassmatesPage === 0}
                                        className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all shadow-sm cursor-pointer border ${
                                            currentClassmatesPage === 0
                                                ? 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/40 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500 hover:text-blue-600 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 hover:border-blue-300 dark:hover:border-blue-500'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 text-center tracking-wide flex-1">
                                        Page {currentClassmatesPage + 1} <span className="text-slate-400 dark:text-slate-500 font-medium mx-0.5">/</span> {totalClassmatesPages}
                                    </span>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setClassmatesPageDirection(1);
                                            setCurrentClassmatesPage(prev => Math.min(totalClassmatesPages - 1, prev + 1));
                                        }} 
                                        disabled={currentClassmatesPage === totalClassmatesPages - 1}
                                        className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all shadow-sm cursor-pointer border ${
                                            currentClassmatesPage === totalClassmatesPages - 1
                                                ? 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/40 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500 hover:text-blue-600 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 hover:border-blue-300 dark:hover:border-blue-500'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Vertical/Horizontal Separator */}
                    <div className="hidden xl:block w-px bg-slate-200 dark:bg-slate-700 my-2 mx-2 shrink-0" />
                    <hr className="xl:hidden border-t border-slate-200 dark:border-slate-700 w-full my-6 shrink-0" />

                    {/* Teacher Spotlight Section (Right) */}
                    <div className="w-full xl:w-[340px] shrink-0 pl-0 xl:pl-4 flex flex-col">
                        <TeacherSpotlight 
                            onTeacherClick={handleUserClick}
                        />
                    </div>
                </motion.div>
            </div>



            {/* User Detail Modal */}
            <UserDetailModal
                user={selectedUser}
                isOpen={isModalOpen}
                onClose={handleModalClose}
            />
        </div>
    );
};

export default UsersContent;
