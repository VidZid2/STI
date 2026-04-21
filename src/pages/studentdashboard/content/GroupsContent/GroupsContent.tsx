/**
 * Groups Content - Study Groups Management Page
 * Minimalistic professional design matching PathsContent/GoalsContent/UsersContent
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { createPortal } from 'react-dom';
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
    getRoleInfo,
    formatLastActive,
    updateOnlineStatus,
    subscribeToAllGroupMembers,
    type GroupWithMembers,
    type GroupStats,
    type GroupFilter,
    type GroupSortOption,
    type GroupCategory,
} from '../../../../services/groupsService';
import GroupIcon from './components/GroupIcon';
import GroupDetailModal from './modals/GroupDetailModal';
import InviteModal from './modals/InviteModal';
import CreateGroupModal from './modals/CreateGroupModal';
import { GroupCard } from './components/GroupCard';
import { GroupsSkeleton } from './components/GroupsSkeleton';
import { FilterTabs } from './components/FilterTabs';
import { supabase, isSupabaseConfigured } from '../../../../lib/supabase';
import { getProfile, getSettings } from '../../../../services/profileService';

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
    const navigate = useNavigate();
    const [groups, setGroups] = useState<GroupWithMembers[]>([]);
    const [stats, setStats] = useState<GroupStats>({ totalGroups: 0, myGroups: 0, publicGroups: 0, totalMembers: 0, onlineMembers: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<GroupFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<GroupSortOption>('recent');
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<GroupWithMembers | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
    const handleJoin = useCallback(async (groupId: string) => {
        const success = await joinGroup(groupId);
        if (success) {
            setGroups(prev => prev.map(g => 
                g.id === groupId ? { ...g, is_member: true, user_role: 'member', member_count: g.member_count + 1 } : g
            ));
            setStats(prev => ({ ...prev, myGroups: prev.myGroups + 1 }));
        }
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

    const handleOpenChat = useCallback((groupId: string) => {
        navigate(`/chat/${groupId}`);
    }, [navigate]);

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
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ marginBottom: '28px' }}
            >
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 22px',
                    borderRadius: '14px', background: colors.cardBg, border: `1px solid ${colors.border}`,
                    flexWrap: 'wrap',
                }}>
                    {/* Icon */}
                    <motion.div
                        whileHover={reducedMotion ? {} : { scale: 1.05, rotate: 5 }}
                        style={{
                            width: '46px', height: '46px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </motion.div>

                    {/* Title */}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}
                        >
                            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: colors.textPrimary }}>
                                Study Groups
                            </h1>
                            <span style={{
                                padding: '3px 8px', borderRadius: '6px',
                                background: 'rgba(59, 130, 246, 0.1)', fontSize: '11px',
                                fontWeight: 600, color: '#3b82f6',
                            }}>
                                {stats.totalGroups} groups
                            </span>
                        </motion.div>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.15 }}
                            style={{ margin: 0, fontSize: '13px', color: colors.textSecondary }}
                        >
                            Collaborate with classmates and join study sessions
                        </motion.p>
                    </div>

                    {/* Quick Stats Cards - Matching CatalogContent design */}
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        style={{ display: 'flex', alignItems: 'stretch', gap: '10px' }}
                    >
                        {[
                            { label: 'Total', value: stats.totalGroups, description: 'Groups', color: '#3b82f6', bgColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.06)', icon: 'grid' },
                            { label: 'My Groups', value: stats.myGroups, description: 'Joined', color: '#8b5cf6', bgColor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.06)', icon: 'check' },
                            { label: 'Public', value: stats.publicGroups, description: 'Open', color: '#f59e0b', bgColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.06)', icon: 'users' },
                            { label: 'Online', value: stats.onlineMembers, description: 'Active', color: '#10b981', bgColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.06)', icon: 'chat' },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 + i * 0.05, duration: 0.3 }}
                                whileHover={reducedMotion ? {} : { y: -2, scale: 1.02, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    padding: '10px 16px', borderRadius: '10px', background: stat.bgColor,
                                    cursor: 'default', minWidth: '72px',
                                }}
                                title={`${stat.label}: ${stat.value}`}
                            >
                                <div style={{ color: stat.color, marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <GroupIcon icon={stat.icon} color={stat.color} size={16} />
                                </div>
                                <span style={{ fontSize: '18px', fontWeight: 700, color: stat.color, lineHeight: 1, marginBottom: '2px' }}>
                                    {stat.value}
                                </span>
                                <span style={{ fontSize: '10px', fontWeight: 500, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                    {stat.description}
                                </span>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </motion.div>

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
                    display: 'flex', gap: '12px', marginBottom: '24px',
                    flexWrap: 'wrap', alignItems: 'center',
                }}
            >
                {/* Search Input - matching CatalogContent design */}
                <motion.div
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                        layout: { type: 'spring', stiffness: 400, damping: 30 },
                        opacity: { delay: 0.3, duration: 0.4 },
                        x: { delay: 0.3, duration: 0.4 }
                    }}
                    style={{
                        flex: 1, minWidth: '220px', position: 'relative',
                    }}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={colors.textMuted}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                            position: 'absolute',
                            left: '14px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                            zIndex: 1,
                        }}
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        ref={searchInputRef}
                        type="text"
                        role="combobox"
                        aria-label="Search groups"
                        aria-expanded={showSuggestions}
                        aria-controls={showSuggestions ? "search-suggestions" : undefined}
                        aria-autocomplete="list"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        onFocus={(e) => {
                            e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                            if (searchSuggestions.length > 0) setShowSuggestions(true);
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = colors.border;
                            e.target.style.boxShadow = 'none';
                        }}
                        placeholder="Search groups..."
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
                    {/* Loading Spinner */}
                    <AnimatePresence>
                        {isSearching && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.5 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                exit={{ opacity: 0, scale: 0.5 }} 
                                transition={{ duration: 0.2 }}
                                style={{ position: 'absolute', right: '14px', top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '100%' }}
                            >
                                <motion.svg 
                                    width="16" 
                                    height="16" 
                                    viewBox="0 0 16 16" 
                                    fill="none" 
                                    style={{ display: 'block' }} 
                                    animate={{ rotate: 360 }} 
                                    transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                                >
                                    <circle cx="8" cy="8" r="6" stroke={isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'} strokeWidth="2" fill="none" />
                                    <circle cx="8" cy="8" r="6" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeDasharray="28" strokeDashoffset="21" fill="none" />
                                </motion.svg>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {/* Clear Search Button */}
                    <AnimatePresence>
                        {searchQuery && !isSearching && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15 }}
                                style={{ position: 'absolute', right: '12px', top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <motion.button 
                                    onClick={() => setSearchQuery('')}
                                    aria-label="Clear search (Esc)"
                                    title="Clear search (Esc)"
                                    style={{ 
                                        background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', 
                                        border: 'none', 
                                        borderRadius: '6px', 
                                        width: '20px', 
                                        height: '20px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        cursor: 'pointer', 
                                        padding: 0 
                                    }}
                                    whileHover={{ scale: 1.1 }} 
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} aria-hidden="true">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {/* Keyboard Shortcut Hint */}
                    <AnimatePresence>
                        {!searchQuery && !isSearching && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15 }}
                                style={{ 
                                    position: 'absolute', 
                                    right: '12px', 
                                    top: 0, 
                                    bottom: 0, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    pointerEvents: 'none',
                                }}
                            >
                                <div 
                                    style={{ 
                                        padding: '4px 8px', 
                                        borderRadius: '6px', 
                                        background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', 
                                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                                        fontSize: '11px', 
                                        fontWeight: 500, 
                                        color: colors.textMuted,
                                        fontFamily: 'monospace',
                                    }}
                                    title="Press / to search"
                                >
                                    /
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

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

                {/* Filter Tabs */}
                <FilterTabs
                    activeFilter={activeFilter}
                    setActiveFilter={setActiveFilter}
                    isDarkMode={isDarkMode}
                    stats={stats}
                    colors={colors}
                />

                {/* Sort Dropdown - Matching CatalogContent design */}
                <motion.div 
                    layout
                    initial={{ opacity: 0, x: 10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ 
                        layout: { type: 'spring', stiffness: 400, damping: 30 },
                        opacity: { delay: 0.4, duration: 0.4 }, 
                        x: { delay: 0.4, duration: 0.4 } 
                    }} 
                    style={{ position: 'relative' }}
                >
                    <motion.button 
                        onClick={() => setShowSortDropdown(!showSortDropdown)} 
                        whileHover={{ scale: 1.02 }} 
                        whileTap={{ scale: 0.98 }}
                        aria-label={`Sort by: ${sortBy === 'recent' ? 'Most Recent' : sortBy === 'members' ? 'Most Members' : sortBy === 'activity' ? 'Most Active' : 'Name A-Z'}. Click to change.`}
                        aria-expanded={showSortDropdown}
                        aria-haspopup="listbox"
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '10px', 
                            border: `1px solid ${showSortDropdown ? colors.accent : colors.border}`,
                            background: showSortDropdown ? (isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)') : colors.cardBg,
                            color: showSortDropdown ? colors.accent : colors.textSecondary,
                            fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                            transition: 'border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease'
                        }}
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
                                    role="listbox"
                                    aria-label="Sort options"
                                    initial={{ opacity: 0, y: -8, scale: 0.95 }} 
                                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                                    exit={{ opacity: 0, y: -8, scale: 0.95 }} 
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    style={{ position: 'absolute', top: '100%', right: 0, marginTop: '6px', padding: '6px', borderRadius: '12px', background: colors.cardBg, border: `1px solid ${colors.border}`, boxShadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '160px' }}
                                >
                                    {([
                                        { value: 'recent', label: 'Most Recent' },
                                        { value: 'members', label: 'Most Members' },
                                        { value: 'activity', label: 'Most Active' },
                                        { value: 'name', label: 'Name A-Z' },
                                    ] as { value: GroupSortOption; label: string }[]).map((option) => (
                                        <motion.button 
                                            key={option.value} 
                                            role="option"
                                            aria-selected={sortBy === option.value}
                                            onClick={() => { setSortBy(option.value); setShowSortDropdown(false); }} 
                                            whileHover={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                                            style={{ 
                                                width: '100%', padding: '10px 12px', borderRadius: '8px', border: 'none', 
                                                background: sortBy === option.value ? (isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.06)') : 'transparent', 
                                                color: sortBy === option.value ? colors.accent : colors.textSecondary, 
                                                fontSize: '12px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
                                            }}
                                        >
                                            {option.label}
                                            {sortBy === option.value && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>}
                                        </motion.button>
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Create Group Button - Matching GoalsContent design */}
                <motion.button
                    layout
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                        layout: { type: 'spring', stiffness: 400, damping: 30 },
                        default: { duration: 0.15, ease: 'easeOut' },
                        opacity: { delay: 0.4, duration: 0.3 },
                        x: { delay: 0.4, duration: 0.3 }
                    }}
                    whileHover={{ 
                        scale: 1.02,
                        boxShadow: '0 6px 20px rgba(59, 130, 246, 0.25)',
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsCreateModalOpen(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
                        color: '#3b82f6',
                        border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New Group
                </motion.button>
            </motion.div>

            {/* Groups Grid */}
            <LayoutGroup>
                <motion.div
                    layout
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '16px',
                    }}
                >
                    <AnimatePresence mode="popLayout">
                        {filteredGroups.length > 0 ? (
                            filteredGroups.map((group, index) => (
                                <GroupCard
                                    key={group.id}
                                    group={group}
                                    index={index}
                                    isDarkMode={isDarkMode}
                                    colors={colors}
                                    onClick={(g) => { setSelectedGroup(g); setIsModalOpen(true); }}
                                    onJoin={handleJoin}
                                    onLeave={handleLeave}
                                    onPin={handlePin}
                                    onInvite={handleInvite}
                                    reducedMotion={reducedMotion}
                                />
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{
                                    gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center',
                                    background: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`,
                                }}
                            >
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '16px', margin: '0 auto 16px',
                                    background: 'rgba(59, 130, 246, 0.1)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                                    </svg>
                                </div>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: colors.textPrimary }}>
                                    No groups found
                                </h3>
                                <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary }}>
                                    {searchQuery ? 'Try a different search term' : 'No groups match your current filters'}
                                </p>
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
                isDarkMode={isDarkMode}
                onJoin={handleJoin}
                onLeave={handleLeave}
                onOpenChat={handleOpenChat}
            />

            {/* Create Group Modal */}
            <CreateGroupModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                isDarkMode={isDarkMode}
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

            {/* Invite Modal */}
            <InviteModal
                group={inviteGroup}
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                isDarkMode={isDarkMode}
            />
        </div>
    );
};

export default GroupsContent;
