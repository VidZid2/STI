/**
 * Groups Content - Study Groups Management Page
 * Minimalistic professional design matching PathsContent/GoalsContent/UsersContent
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import {
    fetchGroups,
    getGroupStats,
    filterGroupsByMembership,
    sortGroups,
    searchGroups,
    joinGroup,
    leaveGroup,
    createGroup,
    togglePinGroup,
    groupCategoryConfig,
    updateOnlineStatus,
    subscribeToAllGroupMembers,
    type GroupWithMembers,
    type GroupStats,
    type GroupFilter,
    type GroupSortOption,
} from '../../../../services/groupsService';
import GroupIcon from './components/GroupIcon';
import GroupDetailModal from './modals/GroupDetailModal';
import InviteModal from './modals/InviteModal';
import CreateGroupModal from './modals/CreateGroupModal';
import JoinGroupModal from './modals/JoinGroupModal';
import { GroupCard } from './components/GroupCard';
import { GroupsSkeleton } from './components/GroupsSkeleton';
import { FilterTabs } from './components/FilterTabs';
import { getSettings } from '../../../../services/profileService';
import { EmptyState } from '../CourseViewPage/components/SharedComponents';

// Custom hook for detecting reduced motion preference
const useReducedMotion = (): boolean => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return prefersReducedMotion;
};

// GroupsSkeleton — moved to ./components/GroupsSkeleton.tsx
// FilterTabs — moved to ./components/FilterTabs.tsx
// MemberAvatarStack, TooltipPortal, ActionButtonWithTooltip, PinnedBadgeWithTooltip, GroupCard — moved to ./components/GroupCard.tsx

// Main GroupsContent Component
const GroupsContent: React.FC = () => {

    const [groups, setGroups] = useState<GroupWithMembers[]>([]);
    const [stats, setStats] = useState<GroupStats>({ totalGroups: 0, myGroups: 0, publicGroups: 0, totalMembers: 0, onlineMembers: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<GroupFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<GroupSortOption>('recent');
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [hoveredSortOption, setHoveredSortOption] = useState<string | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<GroupWithMembers | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteGroup, setInviteGroup] = useState<GroupWithMembers | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchSuggestions, setSearchSuggestions] = useState<GroupWithMembers[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const reducedMotion = useReducedMotion();

    // Detect dark mode from body class (synced with dashboard)
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof document !== 'undefined') {
            return document.body.classList.contains('dark-mode');
        }
        return false;
    });

    // Listen for dark mode changes
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.body.classList.contains('dark-mode'));
        };
        
        // Initial check
        checkDarkMode();
        
        // Observe body class changes
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        
        return () => observer.disconnect();
    }, []);

    const colors = {
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
        cardBg: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        textPrimary: isDarkMode ? '#f1f5f9' : '#0f172a',
        textSecondary: isDarkMode ? '#94a3b8' : '#475569',
        textMuted: isDarkMode ? '#64748b' : '#94a3b8',
        accent: '#3b82f6',
    };

    // Load groups
    // Load groups and set online status
    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        const loadGroups = async () => {
            setIsLoading(true);
            try {
                // First update online status
                const settings = getSettings();
                await updateOnlineStatus(settings.showOnlineStatus);

                // Then fetch groups (which will include updated online status)
                const [groupsData, statsData] = await Promise.all([
                    fetchGroups(),
                    getGroupStats(),
                ]);
                setGroups(groupsData);
                setStats(statsData);

                // Subscribe to real-time member changes
                unsubscribe = subscribeToAllGroupMembers(async () => {
                    const updatedGroups = await fetchGroups();
                    setGroups(updatedGroups);
                });
            } catch (error) {
            } finally {
                setIsLoading(false);
            }
        };
        loadGroups();

        // Update status when window focus changes
        const handleVisibilityChange = async () => {
            const currentSettings = getSettings();
            if (currentSettings.showOnlineStatus) {
                await updateOnlineStatus(!document.hidden);
                const groupsData = await fetchGroups();
                setGroups(groupsData);
            }
        };

        // Set offline when leaving page
        const handleBeforeUnload = () => {
            updateOnlineStatus(false);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (unsubscribe) unsubscribe();
            updateOnlineStatus(false);
        };
    }, []);



    // Filter and sort groups
    const filteredGroups = useMemo(() => {
        let result = [...groups];
        result = filterGroupsByMembership(result, activeFilter);
        result = searchGroups(result, searchQuery);
        result = sortGroups(result, sortBy);
        return result;
    }, [groups, activeFilter, searchQuery, sortBy]);

    // Handle join/leave
    const handleJoin = async (groupId: string) => {
        const success = await joinGroup(groupId);
        if (success) {
            setGroups(prev => prev.map(g => 
                g.id === groupId ? { ...g, is_member: true, user_role: 'member', member_count: g.member_count + 1 } : g
            ));
            setStats(prev => ({ ...prev, myGroups: prev.myGroups + 1 }));
        }
    };

    const handleJoinSuccess = useCallback(async (_groupId: string) => {
        // Re-fetch groups to make sure we have the new group in the list
        const updatedGroups = await fetchGroups();
        setGroups(updatedGroups);
        const newStats = await getGroupStats();
        setStats(newStats);
    }, []);

    const handleLeave = useCallback(async (groupId: string) => {
        const success = await leaveGroup(groupId);
        if (success) {
            setGroups(prev => prev.map(g => 
                g.id === groupId ? { ...g, is_member: false, user_role: undefined, member_count: g.member_count - 1 } : g
            ));
            setStats(prev => ({ ...prev, myGroups: prev.myGroups - 1 }));
        }
    }, []);

    const handlePin = useCallback(async (groupId: string, isPinned: boolean) => {
        const success = await togglePinGroup(groupId, isPinned);
        if (success) {
            setGroups(prev => prev.map(g => 
                g.id === groupId ? { ...g, is_pinned: isPinned } : g
            ));
        }
    }, []);

    const handleInvite = useCallback((group: GroupWithMembers) => {
        setInviteGroup(group);
        setIsInviteModalOpen(true);
    }, []);

    // Keyboard shortcuts: / to focus search, Esc to clear
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input/textarea or modal is open
            const target = e.target as HTMLElement;
            const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
            
            // "/" to focus search (only when not typing)
            if (e.key === '/' && !isTyping && !isModalOpen) {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            
            // "Escape" to clear search and blur (when search is focused)
            if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
                e.preventDefault();
                if (searchQuery) {
                    setSearchQuery('');
                    setShowSuggestions(false);
                    setSelectedSuggestionIndex(-1);
                } else {
                    searchInputRef.current?.blur();
                }
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [searchQuery, isModalOpen]);

    // Search suggestions - debounced with loading state
    useEffect(() => {
        if (!searchQuery.trim()) {
            setIsSearching(false);
            setSearchSuggestions([]);
            setShowSuggestions(false);
            setSelectedSuggestionIndex(-1);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(() => {
            const results = searchGroups(groups, searchQuery);
            setSearchSuggestions(results.slice(0, 5));
            setShowSuggestions(results.length > 0);
            setIsSearching(false);
        }, 150);

        return () => clearTimeout(timer);
    }, [searchQuery, groups]);

    // Click outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                searchInputRef.current &&
                !searchInputRef.current.contains(event.target as Node) &&
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node)
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
                setSelectedSuggestionIndex(prev => prev < searchSuggestions.length - 1 ? prev + 1 : 0);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : searchSuggestions.length - 1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedSuggestionIndex >= 0) {
                    const selected = searchSuggestions[selectedSuggestionIndex];
                    handleSuggestionClick(selected);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedSuggestionIndex(-1);
                break;
        }
    };

    // Handle suggestion click
    const handleSuggestionClick = (group: GroupWithMembers) => {
        setSelectedGroup(group);
        setIsModalOpen(true);
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
    };

    if (isLoading) {
        return <GroupsSkeleton isDarkMode={isDarkMode} />;
    }

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
                {/* Background ambient glow effect for SaaS feel */}
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none hidden sm:block" />
                <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-emerald-500/5 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/3 pointer-events-none hidden sm:block" />

                {/* Top Row: Title & Action */}
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 min-w-0 w-full sm:w-auto">
                        {/* Icon Container with Gradient Bounding Box */}
                        <div className="relative flex-shrink-0 mb-2 sm:mb-0">
                            <div className="relative w-[72px] h-[72px] sm:w-[84px] sm:h-[84px]">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                                    whileHover={{ scale: 1.05, rotate: -5, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
                                    className="absolute flex items-center justify-center shadow-sm transition-all duration-500 inset-0 m-auto w-[60px] h-[60px] sm:w-[68px] sm:h-[68px] rounded-[18px] sm:rounded-[20px] bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100 dark:from-blue-500/10 dark:to-blue-500/5 dark:border-blue-500/20"
                                >
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-600 dark:text-blue-400 transition-all duration-500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </motion.div>
                            </div>
                            
                            {/* Overlapping Custom Badge */}
                            {stats.totalGroups > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, x: "-50%", scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
                                    transition={{ duration: 0.4, delay: 0.4, type: "spring", stiffness: 300, damping: 20 }}
                                    className="absolute -bottom-2 left-1/2 px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border-[2.5px] border-white dark:border-slate-800 shadow-sm flex items-center justify-center whitespace-nowrap z-10 min-w-[40px]"
                                >
                                    <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200 leading-none" style={{ paddingTop: '1px' }}>
                                        {stats.totalGroups}
                                    </span>
                                </motion.div>
                            )}
                        </div>

                        {/* Text Content */}
                        <div className="flex flex-col justify-center min-w-0 flex-1 pt-1 sm:pt-2">
                            <motion.h1 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                                className="text-2xl sm:text-[28px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-2"
                            >
                                Project Workspaces
                            </motion.h1>
                            <motion.p 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                className="text-sm sm:text-[15px] font-medium text-slate-500 dark:text-slate-400 max-w-[400px] leading-snug"
                            >
                                Manage project tasks, share files, and track progress together.
                            </motion.p>
                        </div>
                    </div>
                    </div>
                    
                    {/* Bottom Row: Detailed Metrics */}
                    <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-4">
                        {/* Metric 1 */}
                        <motion.div 
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.3 }}
                            className="flex flex-col p-3 sm:p-4 rounded-[16px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    <GroupIcon icon="grid" size={14} color="currentColor" />
                                </div>
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Groups</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 leading-none">{stats.totalGroups}</span>
                                <span className="text-xs font-medium text-slate-500">Available</span>
                            </div>
                        </motion.div>

                        {/* Metric 2 */}
                        <motion.div 
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.3 }}
                            className="flex flex-col p-3 sm:p-4 rounded-[16px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-md bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                    <GroupIcon icon="check" size={14} color="currentColor" />
                                </div>
                                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">My Groups</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 leading-none">{stats.myGroups}</span>
                                <span className="text-xs font-medium text-slate-500">Joined</span>
                            </div>
                        </motion.div>

                        {/* Metric 3 */}
                        <motion.div 
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.3 }}
                            className="flex flex-col p-3 sm:p-4 rounded-[16px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <GroupIcon icon="users" size={14} color="currentColor" />
                                </div>
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Public</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 leading-none">{stats.publicGroups}</span>
                                <span className="text-xs font-medium text-slate-500">Open</span>
                            </div>
                        </motion.div>

                        {/* Metric 4 */}
                        <motion.div 
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.3 }}
                            className="flex flex-col p-3 sm:p-4 rounded-[16px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <GroupIcon icon="chat" size={14} color="currentColor" />
                                </div>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Online</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 leading-none">{stats.onlineMembers}</span>
                                <span className="text-xs font-medium text-slate-500">Active</span>
                            </div>
                        </motion.div>
                    </div>

            {/* Search and Filters */}
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                    layout: { type: 'spring', stiffness: 400, damping: 30 },
                    delay: 0.25, 
                    duration: 0.4, 
                    ease: [0.22, 1, 0.36, 1] 
                }}
                style={{
                    display: 'flex', gap: '12px', marginTop: '12px',
                    flexWrap: 'wrap', alignItems: 'center',
                }}
            >
                {/* Search Input - matching PathsContent design */}
                <motion.div 
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                        layout: { type: 'spring', stiffness: 400, damping: 30 },
                        opacity: { delay: 0.3, duration: 0.4 },
                        x: { delay: 0.3, duration: 0.4 }
                    }}
                    className="relative flex-1 min-w-[220px] group/search"
                >
                    <svg className="absolute left-3.5 top-0 bottom-0 my-auto w-4 h-4 text-slate-400 z-10 transition-colors duration-200 group-focus-within/search:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={searchInputRef}
                        type="text"
                        role="combobox"
                        aria-label="Search groups"
                        aria-expanded={showSuggestions}
                        aria-controls={showSuggestions ? "search-suggestions" : undefined}
                        aria-autocomplete="list"
                        placeholder="Search groups..."
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
                        {showSuggestions && searchSuggestions.length > 0 && (
                            <motion.div
                                ref={suggestionsRef}
                                id="search-suggestions"
                                role="listbox"
                                aria-label="Search suggestions"
                                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    marginTop: '4px',
                                    background: colors.cardBg,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '10px',
                                    boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                                    zIndex: 50,
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Suggestions Header */}
                                <div style={{
                                    padding: '6px 10px',
                                    borderBottom: `1px solid ${colors.border}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                    <span style={{ fontSize: '9px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Suggestions
                                    </span>
                                    <span style={{ fontSize: '9px', color: colors.textMuted }}>
                                        ↑↓ · Enter
                                    </span>
                                </div>
                                
                                {/* Suggestion Items */}
                                {searchSuggestions.map((group, index) => {
                                    const catConfig = groupCategoryConfig[group.category];
                                    const isSelected = index === selectedSuggestionIndex;
                                    
                                    return (
                                        <motion.div
                                            key={group.id}
                                            role="option"
                                            aria-selected={isSelected}
                                            id={`suggestion-${group.id}`}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.02, duration: 0.1 }}
                                            onClick={() => handleSuggestionClick(group)}
                                            onMouseEnter={() => setSelectedSuggestionIndex(index)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '6px 10px',
                                                cursor: 'pointer',
                                                background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                                                borderLeft: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
                                                transition: 'all 0.1s ease',
                                            }}
                                        >
                                            {/* Group Icon */}
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                background: group.avatar ? 'transparent' : `linear-gradient(135deg, ${group.color}20 0%, ${group.color}10 100%)`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                overflow: 'hidden',
                                            }}>
                                                {group.avatar ? (
                                                    <img 
                                                        src={group.avatar} 
                                                        alt={group.name} 
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                    />
                                                ) : (
                                                    <GroupIcon icon={group.icon} color={group.color} size={16} />
                                                )}
                                            </div>
                                            
                                            {/* Group Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 500, color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {group.name}
                                                    </span>
                                                    {group.is_member && (
                                                        <span style={{ fontSize: '8px', fontWeight: 600, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '1px 4px', borderRadius: '3px' }}>
                                                            Joined
                                                        </span>
                                                    )}
                                                    {group.is_private && (
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '10px', color: catConfig.color, fontWeight: 500 }}>{catConfig.label}</span>
                                                    {group.course_name && (
                                                        <span style={{ 
                                                            display: 'inline-flex', alignItems: 'center', gap: '3px',
                                                            fontSize: '9px', padding: '1px 5px', borderRadius: '3px',
                                                            background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', fontWeight: 500,
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px',
                                                        }}>
                                                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                            </svg>
                                                            {group.course_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Members Count */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                    <circle cx="9" cy="7" r="4" />
                                                </svg>
                                                <span style={{ fontSize: '10px', fontWeight: 500, color: colors.textMuted }}>{group.member_count}</span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Filter & Sort Container */}
                <motion.div layout transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto relative">
                    {/* Filter Tabs */}
                    <div className="w-full sm:w-auto">
                        <FilterTabs
                            activeFilter={activeFilter}
                            setActiveFilter={setActiveFilter}
                            stats={stats}
                        />
                    </div>

                    {/* Sort Dropdown - Matching CatalogContent design */}
                    <motion.div 
                        layout="position"
                        initial={{ opacity: 0, x: 10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ 
                            layout: { type: 'spring', stiffness: 400, damping: 30 },
                            opacity: { delay: 0.4, duration: 0.4 }, 
                            x: { delay: 0.4, duration: 0.4 } 
                        }} 
                        className="relative w-full sm:w-auto z-[100]"
                    >
                        <motion.button 
                            onClick={() => setShowSortDropdown(!showSortDropdown)} 
                            whileHover={{ scale: 1.02 }} 
                            whileTap={{ scale: 0.97 }}
                            aria-label={`Sort by: ${sortBy === 'recent' ? 'Most Recent' : sortBy === 'members' ? 'Most Members' : sortBy === 'activity' ? 'Most Active' : 'Name A-Z'}. Click to change.`}
                            aria-expanded={showSortDropdown}
                            aria-haspopup="listbox"
                            className={`flex w-full sm:w-auto items-center justify-center gap-2 h-10 px-4 rounded-[14px] font-bold text-[13px] transition-all duration-200 border shadow-sm ${
                                showSortDropdown 
                                    ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400' 
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-600'
                            }`}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M6 12h12M9 18h6" /></svg>
                            <span>{sortBy === 'recent' ? 'Most Recent' : sortBy === 'members' ? 'Most Members' : sortBy === 'activity' ? 'Most Active' : 'Name A-Z'}</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: showSortDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </motion.button>
                        <AnimatePresence>
                            {showSortDropdown && (
                                <>
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSortDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                                    <motion.div
                                        role="menu"
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
                                        className="absolute top-full right-0 mt-2 p-1.5 sm:p-2 rounded-[16px] sm:rounded-[18px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-[200] w-[220px] sm:w-[240px] overflow-hidden flex flex-col gap-0.5"
                                        onMouseLeave={() => setHoveredSortOption(null)}
                                    >
                                        {/* Ambient Glow */}
                                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                                        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-20 h-20 bg-blue-400/5 rounded-full blur-2xl pointer-events-none" />

                                        <div className="relative z-10 flex flex-col gap-0.5">
                                            {[
                                                { id: 'recent', label: 'Most Recent', description: 'Newest groups first', icon: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" /> },
                                                { id: 'members', label: 'Most Members', description: 'Largest communities', icon: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></> },
                                                { id: 'activity', label: 'Most Active', description: 'By recent activity', icon: <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" /> },
                                                { id: 'name', label: 'Name A-Z', description: 'Alphabetical order', icon: <path d="M4 6h16M4 12h10M4 18h4" strokeLinecap="round" strokeLinejoin="round" /> }
                                            ].map((option, index) => (
                                                <div key={option.id} className="relative" onMouseEnter={() => setHoveredSortOption(option.id)}>
                                                    {hoveredSortOption === option.id && (
                                                        <motion.div
                                                            layoutId="sortHover"
                                                            className="absolute inset-0 bg-blue-50 dark:bg-blue-500/20 rounded-[12px] pointer-events-none z-0"
                                                            transition={{ type: 'spring', stiffness: 600, damping: 38 }}
                                                        />
                                                    )}
                                                    <motion.button
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.05, duration: 0.2, type: 'spring', stiffness: 300, damping: 24 }}
                                                        onClick={() => {
                                                            setSortBy(option.id as GroupSortOption);
                                                            setShowSortDropdown(false);
                                                        }}
                                                        whileTap={{ scale: 0.97 }}
                                                        className="w-full text-left p-1.5 sm:p-2 rounded-[12px] flex items-center gap-2.5 sm:gap-3 group relative z-10"
                                                    >
                                                    <div
                                                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 shadow-sm hover:scale-105 hover:-rotate-[5deg] relative z-10 ${sortBy === option.id ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800' : 'bg-blue-50 border border-blue-100 dark:bg-blue-900/30 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50'}`}
                                                        style={{ transition: 'transform 0.2s cubic-bezier(0.22,1,0.36,1), background-color 0.2s ease' }}
                                                    >
                                                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4">
                                                            <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                {option.icon}
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0 relative z-10">
                                                        <h3 className={`text-[11px] sm:text-[12px] font-bold truncate ${sortBy === option.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>{option.label}</h3>
                                                        <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{option.description}</p>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300 relative z-10 ${sortBy === option.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500' : 'bg-transparent text-transparent group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-500'}`}>
                                                        {sortBy === option.id ? (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                                                            </svg>
                                                        ) : (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    </motion.button>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Create Group Button - Matching GoalsContent design */}
                    <motion.button
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                            default: { duration: 0.15, ease: 'easeOut' },
                            opacity: { delay: 0.4, duration: 0.3 },
                            x: { delay: 0.4, duration: 0.3 }
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 font-bold py-2 px-3 sm:py-2.5 sm:px-4 rounded-[12px] sm:rounded-[14px] transition-colors shadow-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 focus:outline-none text-[12px] sm:text-[13px] whitespace-nowrap"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-[18px] sm:h-[18px]">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        New Project
                    </motion.button>

                    <div className="hidden sm:block w-[1px] h-[24px] bg-slate-200 dark:bg-slate-700 mx-1" />

                    <motion.button
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                            default: { duration: 0.15, ease: 'easeOut' },
                            opacity: { delay: 0.4, duration: 0.3 },
                            x: { delay: 0.4, duration: 0.3 }
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsJoinModalOpen(true)}
                        title="Join Project"
                        className="flex-shrink-0 flex items-center justify-center w-[38px] h-[38px] sm:w-[42px] sm:h-[42px] rounded-[12px] sm:rounded-[14px] transition-colors shadow-sm border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-[20px] sm:h-[20px]">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                    </motion.button>
                </div>
            </motion.div>
            </motion.div>
            </motion.div>

            {/* Groups Grid */}
            <LayoutGroup>
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 -mx-4 sm:mx-0"
                >
                    <AnimatePresence mode="wait">
                        {filteredGroups.length > 0 ? (
                            filteredGroups.map((group, index) => (
                                <GroupCard
                                    key={group.id}
                                    group={group}
                                    index={index}

                                    isDarkMode={isDarkMode}
                                    onClick={(g) => { setSelectedGroup(g); setIsModalOpen(true); }}
                                    onJoin={handleJoin}
                                    onLeave={handleLeave}
                                    onPin={handlePin}
                                    onInvite={handleInvite}
                                    reducedMotion={reducedMotion}
                                    isLoading={isSearching}
                                />
                            ))
                        ) : (
                            <motion.div
                                key="empty-state"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="col-span-full sm:-mx-6 lg:mx-0 text-center px-4 sm:px-0"
                            >
                                <EmptyState
                                    icon={
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                                        </svg>
                                    }
                                    title={searchQuery ? `No groups match "${searchQuery}"` : "No groups found"}
                                    description={searchQuery ? 'Try a different search term' : 'No groups match your current filters'}
                                    className="py-16"
                                    action={searchQuery ? {
                                        label: 'Clear search',
                                        onClick: () => setSearchQuery('')
                                    } : undefined}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </LayoutGroup>

            {/* Group Detail Modal */}
            <GroupDetailModal
                group={selectedGroup}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onJoin={handleJoin}
                onLeave={handleLeave}
            />

            {/* Create Group Modal */}
            <CreateGroupModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreateGroup={async (groupData) => {
                    const newGroup = await createGroup({
                        name: groupData.name,
                        description: groupData.description,
                        icon: groupData.icon,
                        color: groupData.color,
                        avatar: groupData.avatar,
                        category: groupData.category,
                        course_name: groupData.courseName,
                        max_members: groupData.maxMembers,
                        is_private: groupData.isPrivate,
                        created_by: 'current-user',
                    });
                    if (newGroup) {
                        // Refresh groups list
                        const [groupsData, statsData] = await Promise.all([
                            fetchGroups(),
                            getGroupStats(),
                        ]);
                        setGroups(groupsData);
                        setStats(statsData);
                    }
                }}
            />

            {/* Join Group Modal */}
            <JoinGroupModal
                isOpen={isJoinModalOpen}
                onClose={() => setIsJoinModalOpen(false)}
                onJoinSuccess={handleJoinSuccess}
            />

            {/* Invite Modal */}
            <InviteModal
                group={inviteGroup}
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
            />
        </div>
    );
};

export default GroupsContent;
