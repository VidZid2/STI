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
import { Carousel, CarouselContent, CarouselItem, useCarousel } from "@/components/ui/carousel";

// Custom Carousel Controls for Users Content
function CarouselControls() {
    const { index, setIndex, itemsCount } = useCarousel();
    
    if (itemsCount <= 1) return null;
    
    return (
        <div className="flex justify-center items-center mt-4">
            <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-1.5 rounded-[16px] border border-slate-200 dark:border-slate-700 shadow-sm relative z-10 overflow-visible">
                <button
                    onClick={() => { if (index > 0) setIndex(index - 1); }}
                    disabled={index === 0}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
                        index === 0 
                            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' 
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 min-w-[80px] text-center">
                    Page {index + 1} / {itemsCount}
                </span>
                
                <button
                    onClick={() => { if (index < itemsCount - 1) setIndex(index + 1); }}
                    disabled={index === itemsCount - 1}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
                        index === itemsCount - 1
                            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' 
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
            </div>
        </div>
    );
}

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


    // NEW UI STATE VARIABLES
    const [viewRole, setViewRole] = useState<'student' | 'teacher'>('student');
    const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');

    // Filter the users list based on role and status
    const displayUsers = users.filter(u => {
        if (viewRole === 'student' && u.role !== 'student') return false;
        if (viewRole === 'teacher' && u.role !== 'teacher') return false;
        
        if (statusFilter === 'online' && !u.is_online) return false;
        if (statusFilter === 'offline' && u.is_online) return false;
        
        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const fullName = (u.full_name || '').toLowerCase();
            if (!fullName.includes(q)) return false;
        }
        
        return true;
    });

    const itemsPerPage = 10;
    
    const chunks = [];
    for (let i = 0; i < displayUsers.length; i += itemsPerPage) {
        chunks.push(displayUsers.slice(i, i + itemsPerPage));
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto min-h-screen pb-24">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 lg:p-8 flex flex-col gap-6 relative overflow-hidden"
            >
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-4">
                        {/* Title Icon with Toggle Functionality */}
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setViewRole(prev => prev === 'student' ? 'teacher' : 'student')}
                            className={`relative w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 shadow-sm border transition-colors duration-300 ${
                                viewRole === 'student'
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100/50 dark:border-blue-800/30'
                                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100/50 dark:border-amber-800/30'
                            }`}
                        >
                            <AnimatePresence mode="wait">
                                {viewRole === 'student' ? (
                                    <motion.svg
                                        key="student-icon"
                                        initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                        exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                                        transition={{ duration: 0.3 }}
                                        width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                                    >
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </motion.svg>
                                ) : (
                                    <motion.svg
                                        key="teacher-icon"
                                        initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                        exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                                        transition={{ duration: 0.3 }}
                                        width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                    >
                                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                                        <path d="M9 10h6"/>
                                        <path d="M12 7v6"/>
                                    </motion.svg>
                                )}
                            </AnimatePresence>

                            {/* Badge */}
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center transition-colors duration-300 shadow-sm ${
                                viewRole === 'student' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                            }`}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M8 3 4 7l4 4"/>
                                    <path d="M4 7h16"/>
                                    <path d="m16 21 4-4-4-4"/>
                                    <path d="M20 17H4"/>
                                </svg>
                            </div>
                        </motion.button>
                        <div>
                            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5 block transition-colors duration-300">
                                {viewRole === 'student' ? 'CURRENT SECTION' : 'FACULTY'}
                            </span>
                            <h1 className="text-[16px] font-bold text-slate-800 dark:text-slate-200 leading-tight transition-colors duration-300">
                                {viewRole === 'student' ? 'BSIT101-A' : 'Instructors'}
                            </h1>
                        </div>
                    </div>

                    <motion.div layout className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        {/* Status Filters - Styled like CourseViewPage */}
                        <motion.div layout className="w-full md:w-auto overflow-hidden">
                            <motion.span layout className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block md:hidden">USER STATUS</motion.span>
                            <motion.div layout className="flex items-center p-1 sm:p-1.5 rounded-[12px] sm:rounded-[16px] bg-slate-50/80 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-700/50 w-full md:w-auto overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {[
                                    { id: 'all', label: 'All', count: viewRole === 'student' ? stats.students : stats.teachers, icon: (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                    ) },
                                    { id: 'online', label: 'Online', count: viewRole === 'student' ? users.filter(u => u.role === 'student' && u.is_online).length : users.filter(u => u.role === 'teacher' && u.is_online).length, icon: (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M8 12l2 2 4-4" />
                                        </svg>
                                    ) },
                                    { id: 'offline', label: 'Offline', count: viewRole === 'student' ? users.filter(u => u.role === 'student' && !u.is_online).length : users.filter(u => u.role === 'teacher' && !u.is_online).length, icon: (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                        </svg>
                                    ) }
                                ].map(tab => (
                                    <motion.button
                                        key={tab.id}
                                        layout
                                        onClick={() => setStatusFilter(tab.id as any)}
                                        className={`relative flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-[10px] sm:rounded-[12px] text-[12px] sm:text-[13px] font-bold transition-colors duration-200 outline-none flex-1 md:flex-none whitespace-nowrap min-w-min ${
                                            statusFilter === tab.id
                                                ? (viewRole === 'student' ? 'text-blue-700 dark:text-blue-400' : 'text-amber-700 dark:text-amber-400')
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        {statusFilter === tab.id && (
                                            <motion.div
                                                layoutId="userFilterTabIndicator"
                                                className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-[10px] sm:rounded-[12px] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] border border-slate-200/60 dark:border-zinc-600/50"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <motion.div layout className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                                            {tab.icon && (
                                                <motion.span layout className={`${statusFilter === tab.id ? 'opacity-100' : 'opacity-70'}`}>
                                                    {tab.icon}
                                                </motion.span>
                                            )}
                                            <motion.span layout>{tab.label}</motion.span>
                                            <motion.span layout className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold ${
                                                statusFilter === tab.id
                                                    ? (viewRole === 'student' ? 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400')
                                                    : 'bg-slate-200/50 dark:bg-zinc-700/50 text-slate-500 dark:text-slate-400'
                                            }`}>
                                                <AnimatePresence mode="popLayout" initial={false}>
                                                    <motion.span
                                                        key={tab.count}
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                                                        className="block"
                                                    >
                                                        {tab.count}
                                                    </motion.span>
                                                </AnimatePresence>
                                            </motion.span>
                                        </motion.div>
                                    </motion.button>
                                ))}
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Grid Content with Carousel */}
                <AnimatePresence mode="wait">
                    {displayUsers.length > 0 ? (
                        <motion.div
                            key={`carousel-${viewRole}-${statusFilter}-${searchQuery}`}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="w-full"
                        >
                            <Carousel className="w-full">
                                <CarouselContent>
                                    {chunks.map((chunk, pageIndex) => (
                                        <CarouselItem key={pageIndex}>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 min-h-[400px] content-start overflow-visible p-1">
                                                <AnimatePresence mode="popLayout">
                                                    {chunk.map((user, index) => (
                                                        <UserCard
                                                            key={user.id}
                                                            user={user}
                                                            index={index}
                                                            onClick={handleUserClick}
                                                            favorites={favorites}
                                                            onToggleFavorite={handleToggleFavorite}
                                                            reducedMotion={reducedMotion}
                                                            isMobile={isMobile}
                                                        />
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselControls />
                            </Carousel>
                        </motion.div>
                    ) : (
                        !isLoading && (
                            <motion.div
                                key={`empty-${viewRole}-${statusFilter}-${searchQuery}`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className="w-full flex justify-center py-20"
                            >
                                <EmptyState
                                    icon={
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-600">
                                            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
                                        </svg>
                                    }
                                    title="No users found"
                                    description={`There are no ${viewRole}s matching your current filters.`}
                                    action={{
                                        label: 'Clear filters',
                                        onClick: () => { setStatusFilter('all'); setSearchQuery(''); }
                                    }}
                                />
                            </motion.div>
                        )
                    )}
                </AnimatePresence>
            </motion.div>

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
