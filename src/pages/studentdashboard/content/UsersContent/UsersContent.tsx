/**
 * Users Content - User Account Management Page
 * Minimalistic professional design matching PathsContent/GoalsContent
 * Accessibility: prefers-reduced-motion support, keyboard navigation
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { createPortal } from 'react-dom';
import {
    fetchUsers,
    getUserStats,
    searchUsers,
    getRoleInfo,
    getTeacherCourses,
    getTeacherOfficeHours,
    sortUsers,
    getClassmates,
    type UserAccount,
    type UserStats,
    type UserFilter,
    type TeacherCourse,
    type OfficeHours,
    type UserSortOption,
} from '../../../../services/usersService';
import UserAvatar from './components/UserAvatar';
import RoleIcon from './components/RoleIcon';
import ActionTooltip from './components/ActionTooltip';
import { FilterTabs } from './components/FilterTabs';
import { UserCard, UserListItem } from './components/UserCard';
import { UserCardSkeleton, SkeletonPulse } from './components/UsersSkeleton';
import { TeacherSpotlight, TeacherSpotlightSkeleton } from './components/TeacherSpotlight';
import { EmptyState } from './components/UsersEmptyState';
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

// Helper function to format "Last seen" timestamp for user presence
const getLastSeenText = (lastActive: string | undefined, isOnline: boolean): string => {
    if (isOnline) return 'Online now';
    if (!lastActive) return 'Offline';
    
    const lastActiveDate = new Date(lastActive);
    const now = new Date();
    const diffMs = now.getTime() - lastActiveDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) return 'Last seen just now';
    if (diffMinutes < 60) return `Last seen ${diffMinutes}m ago`;
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    if (diffDays === 1) return 'Last seen yesterday';
    if (diffDays < 7) return `Last seen ${diffDays}d ago`;
    if (diffDays < 30) return `Last seen ${Math.floor(diffDays / 7)}w ago`;
    return `Last seen ${Math.floor(diffDays / 30)}mo ago`;
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
    const [showAllClassmates, setShowAllClassmates] = useState(false);
    const [favorites, setFavorites] = useState<string[]>(() => {
        // Load favorites from localStorage
        const saved = localStorage.getItem('user_favorites');
        return saved ? JSON.parse(saved) : [];
    });
    
    // Pagination state for infinite scroll
    const [displayedCount, setDisplayedCount] = useState(USERS_PER_PAGE);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    
    // Recently viewed users (stored as user IDs with timestamps)
    const [recentlyViewed, setRecentlyViewed] = useState<{ id: string; timestamp: number }[]>(() => {
        const saved = localStorage.getItem('recently_viewed_users');
        return saved ? JSON.parse(saved) : [];
    });

    // Add user to recently viewed
    const addToRecentlyViewed = useCallback((userId: string) => {
        setRecentlyViewed(prev => {
            // Remove if already exists
            const filtered = prev.filter(item => item.id !== userId);
            // Add to beginning with current timestamp
            const updated = [{ id: userId, timestamp: Date.now() }, ...filtered].slice(0, 10); // Keep max 10
            // Save to localStorage
            localStorage.setItem('recently_viewed_users', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // Clear recently viewed
    const clearRecentlyViewed = useCallback(() => {
        setRecentlyViewed([]);
        localStorage.removeItem('recently_viewed_users');
    }, []);

    // Toggle favorite handler
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
        // Add to recently viewed (don't track yourself)
        const isCurrentUser = user.id === 'demo-user-1' || 
                              user.email.toLowerCase().includes('deasis') ||
                              user.student_id === '02000543210';
        if (!isCurrentUser) {
            addToRecentlyViewed(user.id);
        }
    }, [addToRecentlyViewed]);

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
        <div style={{ 
            padding: '24px', 
            maxWidth: '1200px', 
            margin: '0 auto',
            minHeight: '100vh',
        }}>
            {/* Header Section - Matching PathsContent style */}
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
                        flexWrap: 'wrap',
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
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </motion.div>
                    
                    {/* Title & Description */}
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        style={{ flex: 1, minWidth: '200px' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <h1 style={{ 
                                margin: 0, 
                                fontSize: '20px', 
                                fontWeight: 600, 
                                color: colors.textPrimary,
                                letterSpacing: '-0.3px',
                            }}>
                                Users
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
                                {stats.totalUsers} User{stats.totalUsers !== 1 ? 's' : ''}
                            </motion.span>
                        </div>
                        <p style={{ 
                            margin: 0, 
                            fontSize: '13px', 
                            color: colors.textSecondary,
                            fontWeight: 400,
                        }}>
                            Manage user accounts and permissions
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
                            flexWrap: 'wrap',
                        }}
                    >
                        {[
                            {
                                label: 'Total',
                                value: stats.totalUsers,
                                description: 'Users',
                                color: '#3b82f6',
                                bgColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.06)',
                                icon: (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                                color: '#10b981',
                                bgColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.06)',
                                icon: (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                ),
                            },
                            {
                                label: 'Students',
                                value: stats.students,
                                description: 'Enrolled',
                                color: '#8b5cf6',
                                bgColor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.06)',
                                icon: (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                                    </svg>
                                ),
                            },
                            {
                                label: 'Teachers',
                                value: stats.teachers,
                                description: 'Faculty',
                                color: '#f59e0b',
                                bgColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.06)',
                                icon: (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                                title={`${stat.label}: ${stat.value}`}
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

            {/* Classmates Section */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                style={{
                    marginBottom: '24px',
                    padding: '18px',
                    borderRadius: '14px',
                    background: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                }}
            >
                {/* Section Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: isDarkMode ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </motion.div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: colors.textPrimary }}>
                                My Classmates
                            </h3>
                            <p style={{ margin: 0, fontSize: '12px', color: colors.textSecondary }}>
                                BSIT101A · {classmates.length} students
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                            fontSize: '11px',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            fontWeight: 500,
                        }}>
                            {classmates.filter(c => c.is_online).length} Online
                        </span>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowAllClassmates(!showAllClassmates)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: `1px solid ${colors.border}`,
                                background: 'transparent',
                                color: colors.textSecondary,
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            {showAllClassmates ? 'Show Less' : 'View All'}
                            <motion.svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                animate={{ rotate: showAllClassmates ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </motion.svg>
                        </motion.button>
                    </div>
                </div>

                {/* Classmates Grid */}
                <motion.div
                    initial={false}
                    animate={{ height: showAllClassmates ? 'auto' : '140px' }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden', position: 'relative' }}
                >
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: '10px',
                    }}>
                        {classmates.slice(0, showAllClassmates ? classmates.length : 8).map((classmate, index) => (
                            <motion.div
                                key={classmate.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.02, duration: 0.2 }}
                                whileHover={{ 
                                    scale: 1.02,
                                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                                }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleUserClick(classmate)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px 12px',
                                    borderRadius: '10px',
                                    border: `1px solid ${colors.border}`,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        background: `linear-gradient(135deg, #8b5cf620 0%, #8b5cf610 100%)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: '#8b5cf6',
                                    }}>
                                        {classmate.profile_image ? (
                                            <img src={classmate.profile_image} alt={classmate.full_name} style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover' }} />
                                        ) : `${classmate.first_name?.[0] || ''}${classmate.last_name?.[0] || ''}`}
                                    </div>
                                    <div style={{
                                        position: 'absolute',
                                        bottom: -1,
                                        right: -1,
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        background: classmate.is_online ? '#10b981' : '#94a3b8',
                                        border: '2px solid white',
                                        boxShadow: classmate.is_online ? '0 0 6px rgba(16, 185, 129, 0.5)' : 'none',
                                    }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: colors.textPrimary,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {classmate.full_name}
                                    </p>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '10px',
                                        color: classmate.is_online ? '#10b981' : colors.textMuted,
                                    }}>
                                        {classmate.is_online ? 'Online' : 'Offline'}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    
                    {/* Gradient Fade */}
                    {!showAllClassmates && classmates.length > 8 && (
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '40px',
                            background: `linear-gradient(transparent, ${colors.cardBg})`,
                            pointerEvents: 'none',
                        }} />
                    )}
                </motion.div>
            </motion.div>

            {/* Teacher Spotlight Section */}
            <TeacherSpotlight 
                isDarkMode={isDarkMode} 
                colors={colors} 
                onTeacherClick={handleUserClick}
            />

            {/* Recently Viewed Section */}
            <LayoutGroup>
            <AnimatePresence mode="wait">
                {recentlyViewed.length > 0 && (
                    <motion.div
                        key="recently-viewed-section"
                        layout
                        initial={{ opacity: 0, y: 20, scale: 0.98, height: 0 }}
                        animate={{ opacity: 1, y: 0, scale: 1, height: 'auto' }}
                        exit={{ 
                            opacity: 0, 
                            y: -10, 
                            scale: 0.98, 
                            height: 0,
                            marginBottom: 0,
                            padding: 0,
                            transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } 
                        }}
                        transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            marginBottom: '24px',
                            padding: '16px 18px',
                            borderRadius: '14px',
                            background: colors.cardBg,
                            border: `1px solid ${colors.border}`,
                            overflow: 'hidden',
                        }}
                    >
                    {/* Section Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '9px',
                                    background: isDarkMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                            </motion.div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>
                                    Recently Viewed
                                </h3>
                                <p style={{ margin: 0, fontSize: '11px', color: colors.textSecondary }}>
                                    {recentlyViewed.length} profile{recentlyViewed.length !== 1 ? 's' : ''} viewed
                                </p>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={clearRecentlyViewed}
                            style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                background: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                                color: '#ef4444',
                                fontSize: '11px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Clear
                        </motion.button>
                    </div>

                    {/* Recently Viewed Users */}
                    <div style={{
                        display: 'flex',
                        gap: '10px',
                        overflowX: 'auto',
                        paddingBottom: '4px',
                        scrollbarWidth: 'thin',
                    }}>
                        <AnimatePresence mode="popLayout">
                            {recentlyViewed.map((item, index) => {
                                const user = users.find(u => u.id === item.id) || classmates.find(u => u.id === item.id);
                                if (!user) return null;
                                
                                const roleInfo = getRoleInfo(user.role);
                                const timeAgo = getTimeAgo(item.timestamp);
                                
                                return (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.8, x: -20 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.8, x: 20, transition: { duration: 0.2 } }}
                                        transition={{ delay: index * 0.03, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleUserClick(user)}
                                        style={{
                                            flexShrink: 0,
                                            width: '140px',
                                            padding: '12px',
                                            borderRadius: '10px',
                                            border: `1px solid ${colors.border}`,
                                            background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                        }}
                                    >
                                    {/* Avatar */}
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '12px',
                                        background: `linear-gradient(135deg, ${roleInfo.color}20 0%, ${roleInfo.color}10 100%)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '15px',
                                        fontWeight: 600,
                                        color: roleInfo.color,
                                        margin: '0 auto 8px',
                                        position: 'relative',
                                    }}>
                                        {user.profile_image ? (
                                            <img 
                                                src={user.profile_image} 
                                                alt={user.full_name}
                                                style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`
                                        )}
                                        {/* Online indicator */}
                                        <div style={{
                                            position: 'absolute',
                                            bottom: -2,
                                            right: -2,
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: user.is_online ? '#10b981' : '#94a3b8',
                                            border: '2px solid white',
                                        }} />
                                    </div>
                                    
                                    {/* Name */}
                                    <p style={{
                                        margin: '0 0 2px',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: colors.textPrimary,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {user.full_name.split(' ')[0]}
                                    </p>
                                    
                                    {/* Time ago */}
                                    <p style={{
                                        margin: 0,
                                        fontSize: '10px',
                                        color: colors.textMuted,
                                    }}>
                                        {timeAgo}
                                    </p>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
            </LayoutGroup>

            {/* Search and Filter Bar */}
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                    delay: 0.3, 
                    duration: 0.4,
                    layout: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
                }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                }}
            >
                {/* Search Input */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                    style={{
                        position: 'relative',
                        flex: '1',
                        minWidth: '200px',
                    }}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={isDarkMode ? '#64748b' : '#94a3b8'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                            position: 'absolute',
                            left: '14px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                        }}
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        ref={searchInputRef}
                        type="search"
                        role="combobox"
                        aria-label="Search users"
                        aria-expanded={showSuggestions && searchSuggestions.length > 0}
                        aria-controls="search-suggestions"
                        aria-autocomplete="list"
                        aria-activedescendant={selectedSuggestionIndex >= 0 ? `suggestion-${selectedSuggestionIndex}` : undefined}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        onFocus={() => {
                            if (searchSuggestions.length > 0) setShowSuggestions(true);
                        }}
                        placeholder="Search users..."
                        style={{
                            width: '100%',
                            padding: '11px 42px 11px 42px',
                            borderRadius: '12px',
                            border: `1px solid ${colors.border}`,
                            background: colors.cardBg,
                            color: colors.textPrimary,
                            fontSize: '13px',
                            outline: 'none',
                            transition: reducedMotion ? 'none' : 'all 0.2s ease',
                        }}
                    />
                    
                    {/* Search Suggestions Dropdown */}
                    <AnimatePresence>
                        {showSuggestions && searchSuggestions.length > 0 && (
                            <motion.div
                                ref={suggestionsRef}
                                id="search-suggestions"
                                role="listbox"
                                aria-label="Search suggestions"
                                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
                                animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
                                transition={reducedMotion ? { duration: 0.01 } : { duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    marginTop: '6px',
                                    background: colors.cardBg,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '12px',
                                    boxShadow: isDarkMode 
                                        ? '0 8px 24px rgba(0,0,0,0.4)' 
                                        : '0 8px 24px rgba(0,0,0,0.1)',
                                    zIndex: 50,
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Suggestions Header */}
                                <div style={{
                                    padding: '8px 12px',
                                    borderBottom: `1px solid ${colors.border}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                    <span style={{
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        color: colors.textMuted,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                    }}>
                                        Suggestions
                                    </span>
                                    <span style={{
                                        fontSize: '10px',
                                        color: colors.textMuted,
                                    }}>
                                        ↑↓ Navigate · Enter Select
                                    </span>
                                </div>
                                
                                {/* Suggestion Items */}
                                {searchSuggestions.map((user, index) => {
                                    const roleInfo = getRoleInfo(user.role);
                                    const isSelected = index === selectedSuggestionIndex;
                                    
                                    return (
                                        <motion.div
                                            key={user.id}
                                            id={`suggestion-${index}`}
                                            role="option"
                                            aria-selected={isSelected}
                                            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -10 }}
                                            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                                            transition={reducedMotion ? { duration: 0.01 } : { delay: index * 0.03, duration: 0.15 }}
                                            onClick={() => handleSuggestionClick(user)}
                                            onMouseEnter={() => setSelectedSuggestionIndex(index)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '10px 12px',
                                                cursor: 'pointer',
                                                background: isSelected 
                                                    ? isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'
                                                    : 'transparent',
                                                borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
                                                transition: reducedMotion ? 'none' : 'all 0.1s ease',
                                            }}
                                        >
                                            {/* Avatar */}
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '10px',
                                                background: `linear-gradient(135deg, ${roleInfo.color}20 0%, ${roleInfo.color}10 100%)`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                color: roleInfo.color,
                                                flexShrink: 0,
                                                position: 'relative',
                                            }}>
                                                {user.profile_image ? (
                                                    <img 
                                                        src={user.profile_image} 
                                                        alt={user.full_name}
                                                        style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`
                                                )}
                                                {/* Online indicator */}
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: -1,
                                                    right: -1,
                                                    width: '10px',
                                                    height: '10px',
                                                    borderRadius: '50%',
                                                    background: user.is_online ? '#10b981' : '#94a3b8',
                                                    border: '2px solid white',
                                                }} />
                                            </div>
                                            
                                            {/* User Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{
                                                        fontSize: '13px',
                                                        fontWeight: 500,
                                                        color: colors.textPrimary,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        {user.full_name}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '9px',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        background: roleInfo.bgColor,
                                                        color: roleInfo.color,
                                                        fontWeight: 600,
                                                        flexShrink: 0,
                                                    }}>
                                                        {roleInfo.label}
                                                    </span>
                                                </div>
                                                <span style={{
                                                    fontSize: '11px',
                                                    color: colors.textMuted,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    display: 'block',
                                                }}>
                                                    {user.email}
                                                </span>
                                            </div>
                                            
                                            {/* Arrow */}
                                            <svg 
                                                width="14" 
                                                height="14" 
                                                viewBox="0 0 24 24" 
                                                fill="none" 
                                                stroke={isSelected ? '#3b82f6' : colors.textMuted}
                                                strokeWidth="2" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                                style={{ flexShrink: 0, opacity: isSelected ? 1 : 0.5 }}
                                            >
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        </motion.div>
                                    );
                                })}
                                
                                {/* View All Results */}
                                <div style={{
                                    padding: '8px 12px',
                                    borderTop: `1px solid ${colors.border}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                }}>
                                    <span style={{
                                        fontSize: '11px',
                                        color: '#3b82f6',
                                        fontWeight: 500,
                                    }}>
                                        Press Enter to view all results
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {/* Loading Spinner */}
                    <AnimatePresence>
                        {isSearching && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15 }}
                                style={{
                                    position: 'absolute',
                                    right: '14px',
                                    top: 0,
                                    bottom: 0,
                                    pointerEvents: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <motion.svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    style={{ display: 'block' }}
                                >
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </motion.svg>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Sort Dropdown */}
                <motion.div
                    ref={sortDropdownRef}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                    style={{ position: 'relative' }}
                >
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: `1px solid ${colors.border}`,
                            background: colors.cardBg,
                            color: colors.textSecondary,
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 5h10" />
                            <path d="M11 9h7" />
                            <path d="M11 13h4" />
                            <path d="m3 17 3 3 3-3" />
                            <path d="M6 18V4" />
                        </svg>
                        {sortOption === 'name' ? 'Name' : sortOption === 'role' ? 'Role' : 'Recent'}
                        <motion.svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            animate={{ rotate: isSortDropdownOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <polyline points="6 9 12 15 18 9" />
                        </motion.svg>
                    </motion.button>

                    {/* Sort Dropdown Menu */}
                    <AnimatePresence>
                        {isSortDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 6px)',
                                    right: 0,
                                    minWidth: '160px',
                                    background: colors.cardBg,
                                    borderRadius: '12px',
                                    border: `1px solid ${colors.border}`,
                                    boxShadow: isDarkMode
                                        ? '0 8px 24px rgba(0, 0, 0, 0.4)'
                                        : '0 8px 24px rgba(0, 0, 0, 0.1)',
                                    padding: '6px',
                                    zIndex: 100,
                                }}
                            >
                                {[
                                    { id: 'name' as UserSortOption, label: 'Sort by Name', icon: (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18" />
                                            <path d="M7 12h10" />
                                            <path d="M10 18h4" />
                                        </svg>
                                    )},
                                    { id: 'role' as UserSortOption, label: 'Sort by Role', icon: (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                    )},
                                    { id: 'recent' as UserSortOption, label: 'Recently Active', icon: (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                    )},
                                ].map((option) => (
                                    <motion.button
                                        key={option.id}
                                        whileHover={{ background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            setSortOption(option.id);
                                            setIsSortDropdownOpen(false);
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: sortOption === option.id
                                                ? isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'
                                                : 'transparent',
                                            color: sortOption === option.id ? '#3b82f6' : colors.textSecondary,
                                            fontSize: '12px',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                        }}
                                    >
                                        {option.icon}
                                        {option.label}
                                        {sortOption === option.id && (
                                            <motion.svg
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="#3b82f6"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                style={{ marginLeft: 'auto' }}
                                            >
                                                <polyline points="20 6 9 17 4 12" />
                                            </motion.svg>
                                        )}
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* View Toggle */}
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                    style={{
                        display: 'flex',
                        gap: '2px',
                        padding: '3px',
                        borderRadius: '10px',
                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    }}
                >
                    <motion.button
                        aria-label="Grid view"
                        aria-pressed={viewMode === 'grid'}
                        whileHover={reducedMotion ? {} : { scale: 1.05 }}
                        whileTap={reducedMotion ? {} : { scale: 0.95 }}
                        onClick={() => setViewMode('grid')}
                        style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            border: 'none',
                            background: viewMode === 'grid'
                                ? isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'
                                : 'transparent',
                            color: viewMode === 'grid' ? '#3b82f6' : colors.textMuted,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: reducedMotion ? 'none' : 'all 0.2s ease',
                        }}
                        title="Grid View"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                        </svg>
                    </motion.button>
                    <motion.button
                        aria-label="List view"
                        aria-pressed={viewMode === 'list'}
                        whileHover={reducedMotion ? {} : { scale: 1.05 }}
                        whileTap={reducedMotion ? {} : { scale: 0.95 }}
                        onClick={() => setViewMode('list')}
                        style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            border: 'none',
                            background: viewMode === 'list'
                                ? isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'
                                : 'transparent',
                            color: viewMode === 'list' ? '#3b82f6' : colors.textMuted,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: reducedMotion ? 'none' : 'all 0.2s ease',
                        }}
                        title="List View"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="8" y1="6" x2="21" y2="6" />
                            <line x1="8" y1="12" x2="21" y2="12" />
                            <line x1="8" y1="18" x2="21" y2="18" />
                            <line x1="3" y1="6" x2="3.01" y2="6" />
                            <line x1="3" y1="12" x2="3.01" y2="12" />
                            <line x1="3" y1="18" x2="3.01" y2="18" />
                        </svg>
                    </motion.button>
                </motion.div>

                {/* Filter Tabs */}
                <FilterTabs
                    activeFilter={activeFilter}
                    setActiveFilter={setActiveFilter}
                    isDarkMode={isDarkMode}
                    stats={stats}
                    colors={colors}
                />
            </motion.div>

            {/* Users Grid */}
            <section aria-label="Users list" aria-busy={isLoading || isSearching}>
            <AnimatePresence mode="wait">
                {(isLoading || isSearching) ? (
                    <motion.div
                        key="loading"
                        aria-label="Loading users"
                        initial={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: '14px',
                        }}
                    >
                        {[...Array(8)].map((_, i) => (
                            <UserCardSkeleton key={i} index={i} isDarkMode={isDarkMode} colors={colors} />
                        ))}
                    </motion.div>
                ) : users.length === 0 ? (
                    <EmptyState isDarkMode={isDarkMode} searchQuery={searchQuery} colors={colors} />
                ) : viewMode === 'grid' ? (
                    <motion.div
                        key="users-grid"
                        role="list"
                        aria-label={`Showing ${displayedUsers.length} of ${users.length} users in grid view`}
                        initial={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: '12px',
                        }}
                    >
                        <AnimatePresence>
                            {displayedUsers.map((user, index) => (
                                <UserCard
                                    key={user.id}
                                    user={user}
                                    index={index}
                                    isDarkMode={isDarkMode}
                                    colors={colors}
                                    onClick={handleUserClick}
                                    favorites={favorites}
                                    onToggleFavorite={handleToggleFavorite}
                                    reducedMotion={reducedMotion}
                                    isMobile={isMobile}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <motion.div
                        key="users-list"
                        initial={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                        }}
                    >
                        {/* List Header - Hide on mobile for cleaner look */}
                        {!isMobile && (
                            <motion.div
                                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                                animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '10px 18px 10px 76px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: colors.textMuted,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}
                            >
                                <span style={{ flex: 2 }}>User</span>
                                <span style={{ flex: 1, textAlign: 'center' }}>Role</span>
                                <span style={{ flex: 1, textAlign: 'center' }}>Section</span>
                                <span style={{ width: '80px', textAlign: 'right' }}>Status</span>
                                <span style={{ width: '16px' }} aria-hidden="true" />
                            </motion.div>
                        )}
                        <AnimatePresence>
                            {displayedUsers.map((user, index) => (
                                <UserListItem
                                    key={user.id}
                                    user={user}
                                    index={index}
                                    isDarkMode={isDarkMode}
                                    colors={colors}
                                    onClick={handleUserClick}
                                    favorites={favorites}
                                    onToggleFavorite={handleToggleFavorite}
                                    reducedMotion={reducedMotion}
                                    isMobile={isMobile}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Load More / Infinite Scroll Trigger */}
            {!isLoading && !isSearching && hasMoreUsers && (
                <div 
                    ref={loadMoreRef}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '24px',
                        gap: '12px',
                    }}
                >
                    {isLoadingMore ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: colors.textMuted,
                                fontSize: '13px',
                            }}
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    border: '2px solid',
                                    borderColor: `${colors.accent} transparent transparent transparent`,
                                    borderRadius: '50%',
                                }}
                            />
                            Loading more...
                        </motion.div>
                    ) : (
                        <motion.button
                            whileHover={reducedMotion ? {} : { scale: 1.02 }}
                            whileTap={reducedMotion ? {} : { scale: 0.98 }}
                            onClick={() => setDisplayedCount(prev => Math.min(prev + USERS_PER_PAGE, users.length))}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '10px',
                                border: `1px solid ${colors.border}`,
                                background: colors.cardBg,
                                color: colors.textSecondary,
                                fontSize: '13px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                            Load more ({users.length - displayedCount} remaining)
                        </motion.button>
                    )}
                </div>
            )}
            
            {/* Showing count indicator */}
            {!isLoading && !isSearching && users.length > 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '16px',
                    fontSize: '12px',
                    color: colors.textMuted,
                }}>
                    Showing {displayedUsers.length} of {users.length} users
                </div>
            )}
            </section>

            {/* User Detail Modal */}
            <UserDetailModal
                user={selectedUser}
                isOpen={isModalOpen}
                onClose={handleModalClose}
                isDarkMode={isDarkMode}
            />
        </div>
    );
};

export default UsersContent;
