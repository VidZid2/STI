/**
 * Mention Autocomplete Component
 * Smart AI-powered suggestions for @mentions in chat
 * Matches GroupsContent/UsersContent design patterns
 */

import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getSmartSuggestions, getSubjectIcon, type SmartMentionUser } from '../../../lib/mentions/smartMentionService';

export interface MentionUser {
    id: string;
    name: string;
    avatar?: string;
    role?: 'owner' | 'admin' | 'member';
    isOnline?: boolean;
    expertise?: string[];
    studyStreak?: number;
    level?: number;
    availability?: 'available' | 'studying' | 'busy' | 'offline';
    lastActive?: Date;
}

interface MentionAutocompleteProps {
    users: MentionUser[];
    query: string;
    isOpen: boolean;
    onSelect: (user: MentionUser) => void;
    onClose: () => void;
    inputRef: React.RefObject<HTMLTextAreaElement | null>;
    isDarkMode?: boolean;
    messageContext?: string; // Full message text for smart suggestions
}

// Category types for filtering
type MentionCategory = 'all' | 'buddies' | 'online' | 'experts';

// SVG icons for categories
const CategoryIcons: Record<MentionCategory, React.ReactNode> = {
    buddies: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    online: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
    ),
    experts: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
    ),
    all: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
};

const CATEGORIES: { id: MentionCategory; label: string }[] = [
    { id: 'buddies', label: 'Study Buddies' },
    { id: 'experts', label: 'Experts' },
    { id: 'online', label: 'Online Now' },
    { id: 'all', label: 'All Members' },
];

// Expertise badge styles with colors and icons
const EXPERTISE_STYLES: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    math: {
        color: '#7c3aed',
        bg: 'rgba(124, 58, 237, 0.1)',
        icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM17 14v6M14 17h6"/></svg>,
    },
    science: {
        color: '#0891b2',
        bg: 'rgba(8, 145, 178, 0.1)',
        icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 3h6v8l4 9H5l4-9V3z"/></svg>,
    },
    programming: {
        color: '#059669',
        bg: 'rgba(5, 150, 105, 0.1)',
        icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>,
    },
    writing: {
        color: '#dc2626',
        bg: 'rgba(220, 38, 38, 0.1)',
        icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>,
    },
    language: {
        color: '#2563eb',
        bg: 'rgba(37, 99, 235, 0.1)',
        icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    },
    history: {
        color: '#b45309',
        bg: 'rgba(180, 83, 9, 0.1)',
        icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
    },
    business: {
        color: '#0d9488',
        bg: 'rgba(13, 148, 136, 0.1)',
        icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/></svg>,
    },
    art: {
        color: '#db2777',
        bg: 'rgba(219, 39, 119, 0.1)',
        icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="17" r="2"/><circle cx="9" cy="18" r="2"/><path d="M12 12c-2-2.67-6-2.67-8 0 2-2.67 2-6.67 0-8 2.67 2 6.67 2 8 0-2 2.67-2 6.67 0 8z"/></svg>,
    },
};

export const MentionAutocomplete: React.FC<MentionAutocompleteProps> = ({
    users,
    query,
    isOpen,
    onSelect,
    onClose,
    inputRef,
    isDarkMode = false,
    messageContext = '',
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [position, setPosition] = useState<{ bottom: number; left: number; width: number } | null>(null);
    const [smartUsers, setSmartUsers] = useState<MentionUser[]>([]);
    const [detectedSubjects, setDetectedSubjects] = useState<string[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState<MentionCategory>('buddies');
    const [measuredHeight, setMeasuredHeight] = useState<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const aiDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const tabsContainerRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // Colors matching the app's design system
    const colors = {
        bg: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
        borderLight: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        textPrimary: isDarkMode ? '#f1f5f9' : '#1e293b',
        textSecondary: isDarkMode ? '#94a3b8' : '#64748b',
        textMuted: isDarkMode ? '#64748b' : '#94a3b8',
        accent: '#3b82f6',
        hoverBg: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
        selectedBg: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
    };

    // Smart filtering with AI suggestions
    useEffect(() => {
        if (!isOpen) return;
        
        // Clear previous debounce
        if (aiDebounceRef.current) {
            clearTimeout(aiDebounceRef.current);
        }
        
        // First: Quick local filter by name
        const nameFiltered = users.filter(user =>
            user.name.toLowerCase().includes(query.toLowerCase())
        );
        
        // If we have message context, use smart suggestions
        if (messageContext && messageContext.length > 5) {
            setIsAiLoading(true);
            
            // Debounce AI call
            aiDebounceRef.current = setTimeout(async () => {
                try {
                    const result = await getSmartSuggestions(
                        users as SmartMentionUser[],
                        messageContext,
                        { useAI: true, maxResults: 6 }
                    );
                    
                    // Merge: prioritize smart suggestions, then name matches
                    const smartIds = new Set(result.users.map(u => u.id));
                    const merged = [
                        ...result.users,
                        ...nameFiltered.filter(u => !smartIds.has(u.id)),
                    ].slice(0, 6);
                    
                    setSmartUsers(merged);
                    setDetectedSubjects(result.detectedSubjects);
                } catch (error) {
                    console.error('[MentionAutocomplete] Smart suggestion error:', error);
                    setSmartUsers(nameFiltered.slice(0, 6));
                } finally {
                    setIsAiLoading(false);
                }
            }, 300);
        } else {
            setSmartUsers(nameFiltered.slice(0, 6));
            setDetectedSubjects([]);
            setIsAiLoading(false);
        }
        
        return () => {
            if (aiDebounceRef.current) {
                clearTimeout(aiDebounceRef.current);
            }
        };
    }, [isOpen, query, messageContext, users]);

    // Filter users by category
    const filteredUsers = useMemo(() => {
        // First filter by name query
        let filtered = users.filter(user =>
            user.name.toLowerCase().includes(query.toLowerCase())
        );
        
        // Then apply category filter
        switch (activeCategory) {
            case 'buddies':
                // Use AI-sorted study buddies if available
                if (smartUsers.length > 0) {
                    const smartIds = new Set(smartUsers.map(u => u.id));
                    // Prioritize smart suggestions, then others
                    filtered = [
                        ...smartUsers.filter(u => u.name.toLowerCase().includes(query.toLowerCase())),
                        ...filtered.filter(u => !smartIds.has(u.id)),
                    ];
                }
                break;
            case 'online':
                filtered = filtered.filter(user => user.isOnline);
                break;
            case 'experts':
                filtered = filtered.filter(user => 
                    user.expertise && user.expertise.length > 0
                ).sort((a, b) => (b.expertise?.length || 0) - (a.expertise?.length || 0));
                break;
            case 'all':
            default:
                // No additional filtering
                break;
        }
        
        return filtered.slice(0, 8); // Show up to 8 users
    }, [smartUsers, users, query, activeCategory]);

    // Measure content height for smooth animation
    useLayoutEffect(() => {
        if (contentRef.current && isOpen) {
            const measure = () => {
                if (contentRef.current) {
                    setMeasuredHeight(contentRef.current.offsetHeight);
                }
            };
            // Measure immediately and after a frame
            measure();
            requestAnimationFrame(measure);
        }
    }, [filteredUsers, activeCategory, isOpen, isAiLoading]);

    // Reset selected index when query or category changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query, activeCategory]);
    
    // Reset to smart category when dropdown opens
    useEffect(() => {
        if (isOpen) {
            setActiveCategory('buddies');
        }
    }, [isOpen]);

    // Calculate position - appears above the input footer
    useEffect(() => {
        if (!isOpen || !inputRef.current) return;

        const textarea = inputRef.current;
        // Find the main input container (the rounded container with padding)
        const inputContainer = textarea.closest('div[style*="borderRadius"]') as HTMLElement;
        
        if (inputContainer) {
            const containerRect = inputContainer.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            
            // Position above the input container
            setPosition({
                bottom: viewportHeight - containerRect.top + 8,
                left: containerRect.left,
                width: containerRect.width,
            });
        } else {
            // Fallback to textarea position
            const rect = textarea.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            setPosition({
                bottom: viewportHeight - rect.top + 8,
                left: rect.left - 60,
                width: Math.min(340, rect.width + 120),
            });
        }
    }, [isOpen, inputRef, query]);

    // Scroll selected item into view
    useEffect(() => {
        if (itemRefs.current[selectedIndex]) {
            itemRefs.current[selectedIndex]?.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth',
            });
        }
    }, [selectedIndex]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => 
                        prev < filteredUsers.length - 1 ? prev + 1 : 0
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => 
                        prev > 0 ? prev - 1 : filteredUsers.length - 1
                    );
                    break;
                case 'Enter':
                case 'Tab':
                    e.preventDefault();
                    if (filteredUsers[selectedIndex]) {
                        onSelect(filteredUsers[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, filteredUsers, onSelect, onClose]);

    // Get role badge color
    const getRoleBadge = (role?: string) => {
        switch (role) {
            case 'owner':
                return { label: 'Owner', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
            case 'admin':
                return { label: 'Admin', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' };
            default:
                return null;
        }
    };

    // If no users at all in the group, don't show
    if (users.length === 0) return null;

    // Check if we should show the modal
    const shouldShow = isOpen && position;

    return createPortal(
        <>
        <style>{`
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .mention-user-card:hover { transform: scale(1.015) !important; }
        `}</style>
        <AnimatePresence mode="wait">
            {shouldShow && (
            <motion.div
                key="mention-modal"
                ref={containerRef}
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    height: measuredHeight || 'auto',
                }}
                exit={{ 
                    opacity: 0, 
                    y: 15, 
                    scale: 0.96,
                    transition: {
                        type: 'spring',
                        damping: 25,
                        stiffness: 300,
                        opacity: { duration: 0.15 }
                    }
                }}
                transition={{ 
                    type: 'spring',
                    damping: 26,
                    stiffness: 280,
                    mass: 0.9,
                    height: {
                        type: 'spring',
                        damping: 28,
                        stiffness: 180,
                    }
                }}
                style={{
                    position: 'fixed',
                    bottom: position.bottom,
                    left: position.left,
                    width: position.width,
                    maxWidth: '380px',
                    minWidth: '280px',
                    background: colors.bg,
                    borderRadius: '16px',
                    border: `1.5px solid ${colors.accent}`,
                    boxShadow: isDarkMode 
                        ? '0 -12px 40px rgba(0,0,0,0.35), 0 -4px 16px rgba(59, 130, 246, 0.15)' 
                        : '0 -12px 40px rgba(0,0,0,0.1), 0 -4px 16px rgba(59, 130, 246, 0.1)',
                    overflow: 'hidden',
                    zIndex: 9999,
                }}
            >
                {/* Content wrapper for measurement */}
                <div ref={contentRef}>
                {/* Header */}
                <motion.div 
                    layout
                    transition={{ layout: { type: 'spring', damping: 25, stiffness: 300 } }}
                    style={{
                        padding: '12px 16px',
                        borderBottom: `1px solid ${colors.borderLight}`,
                        background: isDarkMode ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.03)',
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                    }}>
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.05 }}
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: '8px',
                                background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                                border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {isAiLoading ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2">
                                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                    </svg>
                                </motion.div>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2">
                                    <circle cx="12" cy="12" r="4" />
                                    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
                                </svg>
                            )}
                        </motion.div>
                        <span style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: colors.accent,
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px',
                        }}>
                            {detectedSubjects.length > 0 ? 'Smart Suggestions' : 'Mention someone'}
                        </span>
                        <motion.span 
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            style={{
                                marginLeft: 'auto',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: colors.accent,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                            }}
                        >
                            {filteredUsers.length}
                        </motion.span>
                    </div>
                    
                    {/* Detected subjects */}
                    {detectedSubjects.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginTop: '8px',
                                flexWrap: 'wrap',
                            }}
                        >
                            <span style={{ fontSize: '10px', color: colors.textMuted }}>
                                Looking for:
                            </span>
                            {detectedSubjects.map(subject => (
                                <span
                                    key={subject}
                                    style={{
                                        fontSize: '10px',
                                        fontWeight: 500,
                                        color: '#10b981',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                    }}
                                >
                                    {getSubjectIcon(subject)} {subject}
                                </span>
                            ))}
                        </motion.div>
                    )}
                </motion.div>

                {/* Category Tabs */}
                <motion.div 
                    layout
                    transition={{ layout: { type: 'spring', damping: 25, stiffness: 300 } }}
                    ref={tabsContainerRef}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 14px',
                        borderBottom: `1px solid ${colors.borderLight}`,
                        background: isDarkMode ? 'rgba(0,0,0,0.15)' : '#f8fafc',
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    }}
                    className="hide-scrollbar"
                >
                    {CATEGORIES.map((category, tabIndex) => {
                        const isActive = activeCategory === category.id;
                        const count = category.id === 'online' 
                            ? users.filter(u => u.isOnline).length
                            : category.id === 'experts'
                            ? users.filter(u => u.expertise && u.expertise.length > 0).length
                            : category.id === 'buddies' && smartUsers.length > 0
                            ? smartUsers.length
                            : users.length;
                        
                        // Category-specific colors
                        const categoryColors = {
                            buddies: { active: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
                            experts: { active: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
                            online: { active: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
                            all: { active: colors.accent, bg: 'rgba(59, 130, 246, 0.1)' },
                        };
                        const catColor = categoryColors[category.id];
                        
                        return (
                            <motion.button
                                key={category.id}
                                ref={el => { tabRefs.current[tabIndex] = el; }}
                                onClick={() => {
                                    setActiveCategory(category.id);
                                    setSelectedIndex(0);
                                    // Auto-scroll to show the selected tab
                                    setTimeout(() => {
                                        const tab = tabRefs.current[tabIndex];
                                        if (tab && tabsContainerRef.current) {
                                            tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                                        }
                                    }, 10);
                                }}
                                whileHover={{ 
                                    scale: 1.02,
                                    boxShadow: `0 4px 12px ${catColor.active}30`,
                                }}
                                whileTap={{ scale: 0.98 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 25,
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 12px',
                                    borderRadius: '10px',
                                    border: isActive 
                                        ? `2px solid ${catColor.active}` 
                                        : `1.5px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                                    background: isActive 
                                        ? catColor.bg
                                        : isDarkMode ? 'rgba(255,255,255,0.03)' : '#ffffff',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s ease, border 0.2s ease',
                                    flexShrink: 0,
                                    boxShadow: isActive 
                                        ? `0 2px 8px ${catColor.active}25`
                                        : '0 1px 3px rgba(0,0,0,0.05)',
                                }}
                            >
                                {/* SVG Icon */}
                                <span style={{ 
                                    color: isActive ? catColor.active : isDarkMode ? '#94a3b8' : '#475569',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'color 0.15s ease',
                                }}>
                                    {CategoryIcons[category.id]}
                                </span>
                                <span style={{
                                    fontSize: '12px',
                                    fontWeight: isActive ? 700 : 600,
                                    color: isActive ? catColor.active : isDarkMode ? '#e2e8f0' : '#1e293b',
                                    transition: 'color 0.15s ease',
                                }}>
                                    {category.label}
                                </span>
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: isActive ? '#ffffff' : isDarkMode ? '#cbd5e1' : '#475569',
                                    background: isActive 
                                        ? catColor.active
                                        : isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                    padding: '2px 7px',
                                    borderRadius: '6px',
                                    minWidth: '22px',
                                    textAlign: 'center',
                                }}>
                                    {count}
                                </span>
                            </motion.button>
                        );
                    })}
                </motion.div>

                {/* User List */}
                <motion.div 
                    layout
                    transition={{ 
                        layout: { type: 'spring', damping: 25, stiffness: 300 }
                    }}
                    style={{
                        maxHeight: '220px',
                        overflowY: 'auto',
                        padding: '8px',
                    }}
                >
                    {/* Empty state */}
                    {filteredUsers.length === 0 && (
                        <motion.div
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                                padding: '20px',
                                textAlign: 'center',
                            }}
                        >
                            <div style={{
                                fontSize: '24px',
                                marginBottom: '8px',
                            }}>
                                {activeCategory === 'online' ? '😴' : activeCategory === 'experts' ? '🎓' : '🔍'}
                            </div>
                            <p style={{
                                fontSize: '12px',
                                color: colors.textMuted,
                                margin: 0,
                            }}>
                                {activeCategory === 'online' 
                                    ? 'No members online right now'
                                    : activeCategory === 'experts'
                                    ? 'No experts found'
                                    : 'No members found'}
                            </p>
                            <button
                                onClick={() => setActiveCategory('all')}
                                style={{
                                    marginTop: '8px',
                                    fontSize: '11px',
                                    color: colors.accent,
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                }}
                            >
                                View all members
                            </button>
                        </motion.div>
                    )}
                    
                    {filteredUsers.map((user, index) => {
                        const isSelected = index === selectedIndex;
                        const roleBadge = getRoleBadge(user.role);

                        return (
                            <motion.button
                                key={user.id}
                                ref={el => { itemRefs.current[index] = el; }}
                                layout
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ 
                                    delay: index * 0.02, 
                                    duration: 0.15,
                                    layout: { type: 'spring', damping: 25, stiffness: 300 },
                                }}
                                onClick={() => onSelect(user)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                whileTap={{ scale: 0.98 }}
                                className="mention-user-card"
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '8px 12px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    marginBottom: '1px',
                                    background: isSelected 
                                        ? isDarkMode ? 'rgba(59, 130, 246, 0.12)' : '#eff6ff'
                                        : 'transparent',
                                    transform: 'scale(1)',
                                    transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease',
                                }}
                            >
                                {/* Avatar with Level Badge and Online Status - matching chat bubble */}
                                <div style={{ position: 'relative', flexShrink: 0, width: 36, height: 42 }}>
                                    {/* Avatar Circle */}
                                    <div
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: '50%',
                                            background: `linear-gradient(135deg, ${colors.accent}30 0%, ${colors.accent}10 100%)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: colors.accent,
                                            overflow: 'hidden',
                                            border: `2px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                                        }}
                                    >
                                        {user.avatar ? (
                                            <img 
                                                src={user.avatar} 
                                                alt={user.name}
                                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            user.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    {/* Level Badge */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: '#3b82f6',
                                        color: 'white',
                                        fontSize: '8px',
                                        fontWeight: 700,
                                        padding: '1px 5px',
                                        borderRadius: '6px',
                                        border: `2px solid ${colors.bg}`,
                                        lineHeight: 1.2,
                                        whiteSpace: 'nowrap',
                                    }}>
                                        Lv.{user.level || 1}
                                    </div>
                                    {/* Online Status Dot */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            right: -2,
                                            width: 10,
                                            height: 10,
                                            borderRadius: '50%',
                                            background: user.isOnline ? '#22c55e' : '#9ca3af',
                                            border: `2px solid ${colors.bg}`,
                                        }}
                                    />
                                </div>

                                {/* User Info - Compact */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {/* Name + Role + Badges in one row */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        flexWrap: 'wrap',
                                    }}>
                                        <span style={{
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: isSelected ? colors.accent : isDarkMode ? '#f1f5f9' : '#0f172a',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {user.name}
                                        </span>
                                        {roleBadge && (
                                            <span style={{
                                                fontSize: '9px',
                                                fontWeight: 700,
                                                color: '#ffffff',
                                                background: roleBadge.color,
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                textTransform: 'uppercase',
                                            }}>
                                                {roleBadge.label}
                                            </span>
                                        )}
                                        {/* Expertise badges - always colorful */}
                                        {user.expertise && user.expertise.length > 0 && (
                                            user.expertise.slice(0, 3).map(exp => {
                                                const style = EXPERTISE_STYLES[exp] || { 
                                                    color: '#64748b', 
                                                    bg: '#f1f5f9',
                                                    icon: null 
                                                };
                                                const isMatch = detectedSubjects.includes(exp);
                                                return (
                                                    <span
                                                        key={exp}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '3px',
                                                            fontSize: '10px',
                                                            fontWeight: 600,
                                                            color: style.color,
                                                            background: style.bg,
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            textTransform: 'capitalize',
                                                            border: isMatch ? `1.5px solid ${style.color}` : `1px solid ${style.color}30`,
                                                        }}
                                                    >
                                                        <span style={{ display: 'flex', width: 10, height: 10 }}>
                                                            {style.icon}
                                                        </span>
                                                        {exp}
                                                    </span>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {/* Selection arrow */}
                                <div style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '8px',
                                    background: isSelected ? colors.accent : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'background 0.15s ease',
                                }}>
                                    <svg 
                                        width="14" 
                                        height="14" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke={isSelected ? '#fff' : isDarkMode ? '#475569' : '#94a3b8'} 
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </div>
                            </motion.button>
                        );
                    })}
                </motion.div>

                {/* Footer hint */}
                <motion.div 
                    layout
                    transition={{ layout: { type: 'spring', damping: 25, stiffness: 300 } }}
                    style={{
                        padding: '8px 14px',
                        borderTop: `1px solid ${colors.borderLight}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                    }}
                >
                    <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10px',
                        color: colors.textMuted,
                    }}>
                        <kbd style={{
                            padding: '2px 5px',
                            borderRadius: '4px',
                            background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            fontSize: '9px',
                            fontFamily: 'inherit',
                        }}>↑↓</kbd>
                        navigate
                    </span>
                    <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10px',
                        color: colors.textMuted,
                    }}>
                        <kbd style={{
                            padding: '2px 5px',
                            borderRadius: '4px',
                            background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            fontSize: '9px',
                            fontFamily: 'inherit',
                        }}>↵</kbd>
                        select
                    </span>
                    <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10px',
                        color: colors.textMuted,
                    }}>
                        <kbd style={{
                            padding: '2px 5px',
                            borderRadius: '4px',
                            background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            fontSize: '9px',
                            fontFamily: 'inherit',
                        }}>esc</kbd>
                        close
                    </span>
                </motion.div>
                </div>
            </motion.div>
            )}
        </AnimatePresence>
        </>,
        document.body
    );
};

export default MentionAutocomplete;
