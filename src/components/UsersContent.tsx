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
    type UserRole,
    type TeacherCourse,
    type OfficeHours,
    type UserSortOption,
} from '../services/usersService';

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
const UserAvatar: React.FC<{ 
    user: UserAccount; 
    size?: number; 
    showOnlineStatus?: boolean;
    reducedMotion?: boolean;
}> = ({ 
    user, 
    size = 44,
    showOnlineStatus = true,
    reducedMotion = false,
}) => {
    const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
    const roleInfo = getRoleInfo(user.role);
    
    return (
        <div style={{ position: 'relative', flexShrink: 0 }} role="img" aria-label={`${user.full_name}'s avatar`}>
            <motion.div
                whileHover={reducedMotion ? {} : { scale: 1.05 }}
                style={{
                    width: size,
                    height: size,
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${roleInfo.color}20 0%, ${roleInfo.color}10 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: size * 0.35,
                    fontWeight: 600,
                    color: roleInfo.color,
                    cursor: 'pointer',
                }}
            >
                {user.profile_image ? (
                    <img 
                        src={user.profile_image} 
                        alt={user.full_name}
                        style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }}
                    />
                ) : initials}
            </motion.div>
            {/* Online Status Indicator */}
            {showOnlineStatus && (
                <motion.div
                    initial={reducedMotion ? { scale: 1 } : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 25 }}
                    style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        width: size * 0.28,
                        height: size * 0.28,
                        borderRadius: '50%',
                        background: user.is_online ? '#10b981' : '#94a3b8',
                        border: '2px solid white',
                        boxShadow: user.is_online ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none',
                    }}
                    role="status"
                    aria-label={user.is_online ? 'Online' : 'Offline'}
                    title={user.is_online ? 'Online' : 'Offline'}
                />
            )}
        </div>
    );
};


// Role Icon Component
const RoleIcon: React.FC<{ role: UserRole; size?: number }> = ({ role, size = 14 }) => {
    const roleInfo = getRoleInfo(role);
    
    const icons: Record<UserRole, React.ReactNode> = {
        student: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
        ),
        teacher: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
        admin: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
        dean: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        ),
    };
    
    return <div style={{ color: roleInfo.color, display: 'flex', alignItems: 'center' }}>{icons[role]}</div>;
};

// Filter Tabs Component (matching PathsContent style)
type FilterTab = UserFilter;

const FilterTabs: React.FC<{
    activeFilter: FilterTab;
    setActiveFilter: (filter: FilterTab) => void;
    isDarkMode: boolean;
    stats: UserStats;
    colors: { accent: string; textSecondary: string; textMuted: string };
}> = ({ activeFilter, setActiveFilter, isDarkMode, stats, colors }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 5, width: 60 });
    
    const tabs: { id: FilterTab; label: string; count: number }[] = [
        { id: 'all', label: 'All', count: stats.totalUsers },
        { id: 'student', label: 'Students', count: stats.students },
        { id: 'teacher', label: 'Teachers', count: stats.teachers },
        { id: 'admin', label: 'Admins', count: stats.admins },
    ];

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const activeIndex = tabs.findIndex(t => t.id === activeFilter);
        const buttons = container.querySelectorAll<HTMLButtonElement>('button[data-filter-tab]');
        
        if (buttons[activeIndex]) {
            const button = buttons[activeIndex];
            const containerRect = container.getBoundingClientRect();
            const buttonRect = button.getBoundingClientRect();
            setIndicatorStyle({
                left: buttonRect.left - containerRect.left,
                width: buttonRect.width,
            });
        }
    }, [activeFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!containerRef.current) return;
            const container = containerRef.current;
            const activeIndex = tabs.findIndex(t => t.id === activeFilter);
            const buttons = container.querySelectorAll<HTMLButtonElement>('button[data-filter-tab]');
            if (buttons[activeIndex]) {
                const button = buttons[activeIndex];
                const containerRect = container.getBoundingClientRect();
                const buttonRect = button.getBoundingClientRect();
                setIndicatorStyle({
                    left: buttonRect.left - containerRect.left,
                    width: buttonRect.width,
                });
            }
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    return (
        <motion.div 
            ref={containerRef}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            style={{
                display: 'flex',
                gap: '4px',
                padding: '4px',
                borderRadius: '12px',
                background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                position: 'relative',
            }}
        >
            <motion.div
                style={{
                    position: 'absolute',
                    top: '4px',
                    bottom: '4px',
                    borderRadius: '8px',
                    background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                    border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                    zIndex: 0,
                }}
                initial={false}
                animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
            
            {tabs.map((tab) => (
                <motion.button
                    key={tab.id}
                    data-filter-tab={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: activeFilter === tab.id ? colors.accent : colors.textSecondary,
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 1,
                        transition: 'color 0.2s ease',
                    }}
                >
                    {tab.label}
                    <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        background: activeFilter === tab.id 
                            ? 'rgba(59, 130, 246, 0.2)' 
                            : isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    }}>
                        {tab.count}
                    </span>
                </motion.button>
            ))}
        </motion.div>
    );
};


// Custom Tooltip Component for Quick Actions
const ActionTooltip: React.FC<{
    label: string;
    children: React.ReactNode;
}> = ({ label, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    return (
        <div 
            style={{ position: 'relative', display: 'inline-flex' }}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: '6px',
                        zIndex: 100,
                        pointerEvents: 'none',
                    }}>
                        <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                                padding: '5px 10px',
                                background: '#ffffff',
                                color: '#3b82f6',
                                fontSize: '11px',
                                fontWeight: 500,
                                borderRadius: '6px',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            }}
                        >
                            {label}
                            {/* Tooltip Arrow */}
                            <div style={{
                                position: 'absolute',
                                bottom: '-4px',
                                left: '50%',
                                transform: 'translateX(-50%) rotate(45deg)',
                                width: '8px',
                                height: '8px',
                                background: '#ffffff',
                                boxShadow: '2px 2px 4px rgba(0,0,0,0.05)',
                            }} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Quick Action Button Component
const QuickActionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: (e: React.MouseEvent) => void;
    isActive?: boolean;
    activeColor?: string;
    isDarkMode: boolean;
    delay?: number;
}> = ({ icon, label, onClick, isActive, activeColor = '#3b82f6', isDarkMode, delay = 0 }) => {
    return (
        <ActionTooltip label={label}>
            <motion.button
                initial={{ opacity: 0, scale: 0.8, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 8 }}
                transition={{ delay, duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClick}
                style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive 
                        ? `${activeColor}15` 
                        : isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    color: isActive ? activeColor : isDarkMode ? '#94a3b8' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                }}
            >
                {icon}
            </motion.button>
        </ActionTooltip>
    );
};

// Quick Action Icons
const EmailIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);

const ScheduleIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const HeartIcon: React.FC<{ filled?: boolean }> = ({ filled }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
);

// User Card Component (matching PathsContent card style)
const UserCard: React.FC<{
    user: UserAccount;
    index: number;
    isDarkMode: boolean;
    colors: {
        cardBg: string;
        border: string;
        textPrimary: string;
        textSecondary: string;
        textMuted: string;
    };
    onClick?: (user: UserAccount) => void;
    favorites?: string[];
    onToggleFavorite?: (userId: string) => void;
    reducedMotion?: boolean;
    isMobile?: boolean;
}> = ({ user, index, isDarkMode, colors, onClick, favorites = [], onToggleFavorite, reducedMotion = false, isMobile = false }) => {
    const roleInfo = getRoleInfo(user.role);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [courseCount, setCourseCount] = useState<number>(0);
    const isFavorite = favorites.includes(user.id);
    const cardRef = useRef<HTMLDivElement>(null);
    
    // Check if this is the current logged-in user (hide quick actions for self)
    const isCurrentUser = user.id === 'demo-user-1' || 
                          user.email.toLowerCase().includes('deasis') ||
                          user.student_id === '02000543210';
    
    // Show quick actions only for other users (not yourself)
    const showQuickActions = !isCurrentUser;

    // Load course count for teachers
    useEffect(() => {
        if (user.role === 'teacher') {
            getTeacherCourses(user.full_name).then(courses => {
                setCourseCount(courses.length);
            });
        }
    }, [user.role, user.full_name]);

    const handleEmailClick = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        window.location.href = `mailto:${user.email}`;
    };

    const handleScheduleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        onClick?.(user);
    };

    const handleFavoriteClick = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        onToggleFavorite?.(user.id);
    };

    // Keyboard handler for card
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.(user);
        }
    };

    // Show actions on hover OR focus for keyboard users, OR always on mobile
    const showActions = isMobile || isHovered || isFocused;

    return (
        <motion.div
            ref={cardRef}
            tabIndex={0}
            role="button"
            aria-label={`View profile of ${user.full_name}, ${roleInfo.label}${user.is_online ? ', Online' : ', Offline'}`}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.95 }}
            transition={reducedMotion ? { duration: 0.01 } : { delay: index * 0.03, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            whileHover={reducedMotion ? {} : { 
                y: -3, 
                scale: 1.01,
                boxShadow: isDarkMode 
                    ? '0 12px 32px rgba(0,0,0,0.3)' 
                    : '0 12px 32px rgba(0,0,0,0.08)',
                transition: { duration: 0.2 }
            }}
            whileTap={reducedMotion ? {} : { scale: 0.98 }}
            onClick={() => onClick?.(user)}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
                background: colors.cardBg,
                borderRadius: '16px',
                border: `1px solid ${isFocused ? '#3b82f6' : colors.border}`,
                padding: '16px',
                cursor: 'pointer',
                transition: reducedMotion ? 'none' : 'all 0.2s ease',
                position: 'relative',
                outline: 'none',
                boxShadow: isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : undefined,
            }}
        >
            {/* Card Content */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <UserAvatar user={user} size={44} reducedMotion={reducedMotion} />
                
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Name Row with Quick Actions */}
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        gap: '8px', 
                        marginBottom: '4px',
                        minHeight: '28px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                            <h3 style={{
                                margin: 0,
                                fontSize: '14px',
                                fontWeight: 600,
                                color: colors.textPrimary,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {user.full_name}
                            </h3>
                            {!user.is_active && (
                                <span style={{
                                    fontSize: '9px',
                                    padding: '2px 5px',
                                    borderRadius: '4px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    fontWeight: 600,
                                    flexShrink: 0,
                                }}>
                                    Inactive
                                </span>
                            )}
                        </div>
                        
                        {/* Quick Actions - Only show for other users, not yourself (hidden on mobile - use bottom bar instead) */}
                        {showQuickActions && !isMobile && (
                            <div 
                                role="group"
                                aria-label="Quick actions"
                                style={{ 
                                    display: 'flex', 
                                    gap: '4px', 
                                    flexShrink: 0,
                                    opacity: showActions ? 1 : 0,
                                    transform: showActions ? 'translateX(0)' : 'translateX(8px)',
                                    transition: reducedMotion ? 'opacity 0.01s' : 'all 0.2s ease',
                                    pointerEvents: showActions ? 'auto' : 'none',
                                }}
                            >
                                <ActionTooltip label="Send Email">
                                    <motion.button
                                        aria-label={`Send email to ${user.full_name}`}
                                        whileHover={reducedMotion ? {} : { scale: 1.1 }}
                                        whileTap={reducedMotion ? {} : { scale: 0.9 }}
                                        onClick={handleEmailClick}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleEmailClick(e); }}
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                            color: isDarkMode ? '#94a3b8' : '#64748b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <EmailIcon />
                                    </motion.button>
                                </ActionTooltip>
                                <ActionTooltip label="View Details">
                                    <motion.button
                                        aria-label={`View details of ${user.full_name}`}
                                        whileHover={reducedMotion ? {} : { scale: 1.1 }}
                                        whileTap={reducedMotion ? {} : { scale: 0.9 }}
                                        onClick={handleScheduleClick}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleScheduleClick(e); }}
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                            color: isDarkMode ? '#94a3b8' : '#64748b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <ScheduleIcon />
                                    </motion.button>
                                </ActionTooltip>
                                <ActionTooltip label={isFavorite ? "Remove from Favorites" : "Add to Favorites"}>
                                    <motion.button
                                        aria-label={isFavorite ? `Remove ${user.full_name} from favorites` : `Add ${user.full_name} to favorites`}
                                        aria-pressed={isFavorite}
                                        whileHover={reducedMotion ? {} : { scale: 1.1 }}
                                        whileTap={reducedMotion ? {} : { scale: 0.9 }}
                                        onClick={handleFavoriteClick}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleFavoriteClick(e); }}
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            background: isFavorite ? 'rgba(239, 68, 68, 0.1)' : isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                            color: isFavorite ? '#ef4444' : isDarkMode ? '#94a3b8' : '#64748b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <HeartIcon filled={isFavorite} />
                                    </motion.button>
                                </ActionTooltip>
                            </div>
                        )}
                        
                        {/* Favorite indicator when not hovered/focused (only for other users, hidden on mobile) */}
                        {showQuickActions && isFavorite && !showActions && !isMobile && (
                            <div style={{ color: '#ef4444', flexShrink: 0 }} aria-hidden="true">
                                <HeartIcon filled />
                            </div>
                        )}
                    </div>
                    
                    {/* Email & Last Seen */}
                    <div style={{ marginBottom: '10px' }}>
                        <p style={{
                            margin: 0,
                            fontSize: '12px',
                            color: colors.textSecondary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginBottom: '2px',
                        }}>
                            {user.email}
                        </p>
                        <p style={{
                            margin: 0,
                            fontSize: '10px',
                            color: user.is_online ? '#10b981' : colors.textMuted,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                        }}>
                            <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: user.is_online ? '#10b981' : '#94a3b8',
                                flexShrink: 0,
                            }} />
                            {getLastSeenText(user.last_active, user.is_online || false)}
                        </p>
                    </div>
                    
                    {/* Role & Section Tags */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: roleInfo.bgColor,
                            fontSize: '11px',
                            fontWeight: 500,
                            color: roleInfo.color,
                        }}>
                            <RoleIcon role={user.role} size={11} />
                            {roleInfo.label}
                        </span>
                        
                        {user.section && (
                            <span style={{
                                fontSize: '11px',
                                color: colors.textMuted,
                                padding: '3px 7px',
                                borderRadius: '5px',
                                background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                            }}>
                                {user.section}
                            </span>
                        )}
                        
                        {/* Quick Stats */}
                        {user.role === 'teacher' && courseCount > 0 && (
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '10px',
                                color: '#10b981',
                                padding: '3px 7px',
                                borderRadius: '5px',
                                background: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                                fontWeight: 500,
                            }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                </svg>
                                {courseCount} course{courseCount !== 1 ? 's' : ''}
                            </span>
                        )}
                        
                        {user.role === 'student' && user.year_level && (
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '10px',
                                color: '#3b82f6',
                                padding: '3px 7px',
                                borderRadius: '5px',
                                background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                                fontWeight: 500,
                            }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                                </svg>
                                {user.year_level}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Mobile Quick Actions Bar - Always visible on mobile for easy touch access */}
            {isMobile && showQuickActions && (
                <div 
                    role="group"
                    aria-label="Quick actions"
                    style={{
                        display: 'flex',
                        gap: '8px',
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: `1px solid ${colors.border}`,
                    }}
                >
                    <motion.button
                        aria-label={`Send email to ${user.full_name}`}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleEmailClick}
                        style={{
                            flex: 1,
                            height: '40px',
                            borderRadius: '10px',
                            border: 'none',
                            background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                            color: '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 500,
                        }}
                    >
                        <EmailIcon />
                        Email
                    </motion.button>
                    <motion.button
                        aria-label={`View details of ${user.full_name}`}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleScheduleClick}
                        style={{
                            flex: 1,
                            height: '40px',
                            borderRadius: '10px',
                            border: 'none',
                            background: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                            color: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 500,
                        }}
                    >
                        <ScheduleIcon />
                        Details
                    </motion.button>
                    <motion.button
                        aria-label={isFavorite ? `Remove ${user.full_name} from favorites` : `Add ${user.full_name} to favorites`}
                        aria-pressed={isFavorite}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleFavoriteClick}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            border: 'none',
                            background: isFavorite 
                                ? 'rgba(239, 68, 68, 0.1)' 
                                : isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                            color: isFavorite ? '#ef4444' : colors.textMuted,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                        }}
                    >
                        <HeartIcon filled={isFavorite} />
                    </motion.button>
                </div>
            )}
        </motion.div>
    );
};


// User List Item Component (for list view)
const UserListItem: React.FC<{
    user: UserAccount;
    index: number;
    isDarkMode: boolean;
    colors: {
        cardBg: string;
        border: string;
        textPrimary: string;
        textSecondary: string;
        textMuted: string;
    };
    onClick?: (user: UserAccount) => void;
    favorites?: string[];
    onToggleFavorite?: (userId: string) => void;
    reducedMotion?: boolean;
    isMobile?: boolean;
}> = ({ user, index, isDarkMode, colors, onClick, favorites = [], onToggleFavorite, reducedMotion = false, isMobile = false }) => {
    const roleInfo = getRoleInfo(user.role);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const isFavorite = favorites.includes(user.id);
    // Show actions on hover OR focus for keyboard users, OR always on mobile
    const showActions = isMobile || isHovered || isFocused;

    const handleEmailClick = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        window.location.href = `mailto:${user.email}`;
    };

    const handleScheduleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        onClick?.(user);
    };

    const handleFavoriteClick = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        onToggleFavorite?.(user.id);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.(user);
        }
    };

    return (
        <motion.div
            tabIndex={0}
            role="button"
            aria-label={`View profile of ${user.full_name}, ${roleInfo.label}${user.is_online ? ', Online' : ', Offline'}`}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
            transition={reducedMotion ? { duration: 0.01 } : { delay: index * 0.02, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            whileHover={reducedMotion ? {} : { 
                background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                transition: { duration: 0.15 }
            }}
            whileTap={reducedMotion ? {} : { scale: 0.995 }}
            onClick={() => onClick?.(user)}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '14px 18px',
                borderRadius: '12px',
                border: `1px solid ${isFocused ? '#3b82f6' : colors.border}`,
                background: colors.cardBg,
                cursor: 'pointer',
                transition: reducedMotion ? 'none' : 'all 0.2s ease',
                position: 'relative',
                outline: 'none',
                boxShadow: isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : undefined,
            }}
        >
            <UserAvatar user={user} size={42} reducedMotion={reducedMotion} />
            
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '24px' }}>
                {/* Name & Email */}
                <div style={{ flex: 2, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: '14px',
                            fontWeight: 600,
                            color: colors.textPrimary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {user.full_name}
                        </h3>
                        {isFavorite && (
                            <span style={{ color: '#ef4444', display: 'flex' }}>
                                <HeartIcon filled />
                            </span>
                        )}
                        {!user.is_active && (
                            <span style={{
                                fontSize: '9px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                fontWeight: 600,
                            }}>
                                Inactive
                            </span>
                        )}
                    </div>
                    <p style={{
                        margin: 0,
                        fontSize: '12px',
                        color: colors.textSecondary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {user.email}
                    </p>
                </div>

                {/* Role Badge */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: roleInfo.bgColor,
                        fontSize: '11px',
                        fontWeight: 500,
                        color: roleInfo.color,
                    }}>
                        <RoleIcon role={user.role} size={12} />
                        {roleInfo.label}
                    </span>
                </div>

                {/* Section/Campus */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <span style={{
                        fontSize: '12px',
                        color: colors.textMuted,
                    }}>
                        {user.section || user.campus}
                    </span>
                </div>

                {/* Online Status with Last Seen */}
                <div style={{ 
                    width: isMobile ? 'auto' : '120px', 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: isMobile ? 'flex-start' : 'flex-end', 
                    gap: '2px' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: user.is_online ? '#10b981' : '#94a3b8',
                            boxShadow: user.is_online ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none',
                        }} />
                        <span style={{
                            fontSize: '11px',
                            color: user.is_online ? '#10b981' : colors.textMuted,
                            fontWeight: 500,
                        }}>
                            {user.is_online ? 'Online' : 'Offline'}
                        </span>
                    </div>
                    {!user.is_online && user.last_active && (
                        <span style={{
                            fontSize: '9px',
                            color: colors.textMuted,
                            whiteSpace: 'nowrap',
                        }}>
                            {getLastSeenText(user.last_active, false).replace('Last seen ', '')}
                        </span>
                    )}
                </div>
            </div>

            {/* Quick Actions - Hover/Focus Reveal */}
            <AnimatePresence>
                {showActions ? (
                    <motion.div
                        role="group"
                        aria-label="Quick actions"
                        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 10 }}
                        animate={reducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 10 }}
                        transition={reducedMotion ? { duration: 0.01 } : { duration: 0.15 }}
                        style={{
                            display: 'flex',
                            gap: '6px',
                            flexShrink: 0,
                        }}
                    >
                        <QuickActionButton
                            icon={<EmailIcon />}
                            label="Send Email"
                            onClick={handleEmailClick}
                            isDarkMode={isDarkMode}
                            delay={reducedMotion ? 0 : 0}
                        />
                        <QuickActionButton
                            icon={<ScheduleIcon />}
                            label="View Schedule"
                            onClick={handleScheduleClick}
                            isDarkMode={isDarkMode}
                            delay={reducedMotion ? 0 : 0.03}
                        />
                        <QuickActionButton
                            icon={<HeartIcon filled={isFavorite} />}
                            label={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                            onClick={handleFavoriteClick}
                            isActive={isFavorite}
                            activeColor="#ef4444"
                            isDarkMode={isDarkMode}
                            delay={reducedMotion ? 0 : 0.06}
                        />
                    </motion.div>
                ) : (
                    <motion.svg
                        aria-hidden="true"
                        initial={reducedMotion ? {} : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={reducedMotion ? {} : { opacity: 0 }}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={colors.textMuted}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flexShrink: 0 }}
                    >
                        <polyline points="9 18 15 12 9 6" />
                    </motion.svg>
                )}
            </AnimatePresence>
        </motion.div>
    );
};


// Empty State Component
const EmptyState: React.FC<{ isDarkMode: boolean; searchQuery: string; colors: { textPrimary: string; textSecondary: string } }> = ({ isDarkMode, searchQuery, colors }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                textAlign: 'center',
            }}
        >
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '18px',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                }}
            >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#64748b' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            </motion.div>
            <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 600,
                color: colors.textPrimary,
                marginBottom: '8px',
            }}>
                {searchQuery ? 'No users found' : 'No users yet'}
            </h3>
            <p style={{
                margin: 0,
                fontSize: '13px',
                color: colors.textSecondary,
                maxWidth: '300px',
            }}>
                {searchQuery 
                    ? `No users match "${searchQuery}". Try a different search term.`
                    : 'Users will appear here once they are added to the system.'
                }
            </p>
        </motion.div>
    );
};

// Skeleton Shimmer Animation Component
const SkeletonPulse: React.FC<{
    width?: string;
    height?: string;
    borderRadius?: string;
    isDarkMode: boolean;
    style?: React.CSSProperties;
}> = ({ width = '100%', height = '16px', borderRadius = '6px', isDarkMode, style }) => {
    return (
        <motion.div
            animate={{
                backgroundPosition: ['200% 0', '-200% 0'],
            }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
            }}
            style={{
                width,
                height,
                borderRadius,
                background: isDarkMode
                    ? 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)'
                    : 'linear-gradient(90deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.03) 100%)',
                backgroundSize: '200% 100%',
                ...style,
            }}
        />
    );
};

// User Card Skeleton Component
const UserCardSkeleton: React.FC<{
    index: number;
    isDarkMode: boolean;
    colors: { cardBg: string; border: string };
}> = ({ index, isDarkMode, colors }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            style={{
                background: colors.cardBg,
                borderRadius: '16px',
                border: `1px solid ${colors.border}`,
                padding: '16px',
            }}
        >
            <div style={{ display: 'flex', gap: '12px' }}>
                {/* Avatar Skeleton */}
                <SkeletonPulse 
                    width="44px" 
                    height="44px" 
                    borderRadius="12px" 
                    isDarkMode={isDarkMode}
                    style={{ flexShrink: 0 }}
                />
                
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Name Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <SkeletonPulse 
                            width="55%" 
                            height="14px" 
                            borderRadius="4px" 
                            isDarkMode={isDarkMode} 
                        />
                    </div>
                    
                    {/* Email */}
                    <SkeletonPulse 
                        width="75%" 
                        height="12px" 
                        borderRadius="4px" 
                        isDarkMode={isDarkMode}
                        style={{ marginBottom: '12px' }}
                    />
                    
                    {/* Tags Row */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <SkeletonPulse 
                            width="60px" 
                            height="22px" 
                            borderRadius="6px" 
                            isDarkMode={isDarkMode} 
                        />
                        <SkeletonPulse 
                            width="70px" 
                            height="22px" 
                            borderRadius="6px" 
                            isDarkMode={isDarkMode} 
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Classmates Section Skeleton
// @ts-ignore - Reserved for future use
const _ClassmatesSkeleton: React.FC<{
    isDarkMode: boolean;
    colors: { cardBg: string; border: string };
}> = ({ isDarkMode, colors }) => {
    return (
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
            {/* Header Skeleton */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <SkeletonPulse width="38px" height="38px" borderRadius="10px" isDarkMode={isDarkMode} />
                <div style={{ flex: 1 }}>
                    <SkeletonPulse width="120px" height="15px" borderRadius="4px" isDarkMode={isDarkMode} style={{ marginBottom: '6px' }} />
                    <SkeletonPulse width="160px" height="12px" borderRadius="4px" isDarkMode={isDarkMode} />
                </div>
            </div>
            
            {/* Grid Skeleton */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '10px',
            }}>
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: `1px solid ${colors.border}`,
                        }}
                    >
                        <SkeletonPulse width="36px" height="36px" borderRadius="10px" isDarkMode={isDarkMode} />
                        <div style={{ flex: 1 }}>
                            <SkeletonPulse width="80%" height="12px" borderRadius="4px" isDarkMode={isDarkMode} style={{ marginBottom: '4px' }} />
                            <SkeletonPulse width="50%" height="10px" borderRadius="4px" isDarkMode={isDarkMode} />
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

// Teacher Spotlight Skeleton
const TeacherSpotlightSkeleton: React.FC<{
    isDarkMode: boolean;
    colors: { cardBg: string; border: string };
}> = ({ isDarkMode, colors }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            style={{
                marginBottom: '24px',
                padding: '18px',
                borderRadius: '14px',
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <SkeletonPulse width="38px" height="38px" borderRadius="10px" isDarkMode={isDarkMode} />
                <div style={{ flex: 1 }}>
                    <SkeletonPulse width="130px" height="15px" borderRadius="4px" isDarkMode={isDarkMode} style={{ marginBottom: '6px' }} />
                    <SkeletonPulse width="180px" height="12px" borderRadius="4px" isDarkMode={isDarkMode} />
                </div>
            </div>
            
            {/* Content */}
            <div style={{ display: 'flex', gap: '16px' }}>
                {/* Teacher Card */}
                <div style={{
                    width: '200px',
                    padding: '16px',
                    borderRadius: '12px',
                    border: `1px solid ${colors.border}`,
                    textAlign: 'center',
                }}>
                    <SkeletonPulse width="64px" height="64px" borderRadius="16px" isDarkMode={isDarkMode} style={{ margin: '0 auto 12px' }} />
                    <SkeletonPulse width="80%" height="14px" borderRadius="4px" isDarkMode={isDarkMode} style={{ margin: '0 auto 8px' }} />
                    <SkeletonPulse width="50px" height="20px" borderRadius="6px" isDarkMode={isDarkMode} style={{ margin: '0 auto' }} />
                </div>
                
                {/* Courses */}
                <div style={{ flex: 1 }}>
                    <SkeletonPulse width="140px" height="11px" borderRadius="4px" isDarkMode={isDarkMode} style={{ marginBottom: '10px' }} />
                    {[...Array(2)].map((_, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: `1px solid ${colors.border}`,
                                marginBottom: '8px',
                            }}
                        >
                            <SkeletonPulse width="36px" height="36px" borderRadius="8px" isDarkMode={isDarkMode} />
                            <div style={{ flex: 1 }}>
                                <SkeletonPulse width="70%" height="13px" borderRadius="4px" isDarkMode={isDarkMode} style={{ marginBottom: '4px' }} />
                                <SkeletonPulse width="50%" height="11px" borderRadius="4px" isDarkMode={isDarkMode} />
                            </div>
                            <SkeletonPulse width="45px" height="18px" borderRadius="5px" isDarkMode={isDarkMode} />
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

// Teacher Spotlight Component - Featured carousel showing teachers this semester
interface TeacherWithCourses {
    teacher: UserAccount;
    courses: TeacherCourse[];
}

const TeacherSpotlight: React.FC<{
    isDarkMode: boolean;
    colors: {
        cardBg: string;
        border: string;
        textPrimary: string;
        textSecondary: string;
        textMuted: string;
    };
    onTeacherClick: (teacher: UserAccount) => void;
}> = ({ isDarkMode, colors, onTeacherClick }) => {
    const [teachers, setTeachers] = useState<TeacherWithCourses[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [direction, setDirection] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);

    // Load teachers and their courses
    useEffect(() => {
        const loadTeachers = async () => {
            setIsLoading(true);
            try {
                const allUsers = await fetchUsers('teacher');
                const teachersWithCourses: TeacherWithCourses[] = await Promise.all(
                    allUsers.map(async (teacher) => {
                        const courses = await getTeacherCourses(teacher.full_name);
                        return { teacher, courses };
                    })
                );
                // Filter to only teachers with courses
                setTeachers(teachersWithCourses.filter(t => t.courses.length > 0));
            } catch (err) {
                console.error('[TeacherSpotlight] Load error:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadTeachers();
    }, []);

    const handlePrev = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev === 0 ? teachers.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev === teachers.length - 1 ? 0 : prev + 1));
    };

    // Auto-advance carousel
    useEffect(() => {
        if (teachers.length <= 1) return;
        const interval = setInterval(() => {
            setDirection(1);
            setCurrentIndex((prev) => (prev === teachers.length - 1 ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(interval);
    }, [teachers.length]);

    if (isLoading) {
        return <TeacherSpotlightSkeleton isDarkMode={isDarkMode} colors={colors} />;
    }

    if (teachers.length === 0) return null;

    const currentTeacher = teachers[currentIndex];

    // Category colors
    const getCategoryColor = (category: string) => {
        const categoryColors: Record<string, string> = {
            major: '#3b82f6',
            ge: '#10b981',
            pe: '#f59e0b',
            nstp: '#8b5cf6',
        };
        return categoryColors[category] || '#64748b';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            style={{
                marginBottom: '24px',
                padding: '18px',
                borderRadius: '14px',
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                overflow: 'hidden',
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
                            background: isDarkMode ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    </motion.div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: colors.textPrimary }}>
                            Teacher Spotlight
                        </h3>
                        <p style={{ margin: 0, fontSize: '12px', color: colors.textSecondary }}>
                            Your Teachers This Semester · {teachers.length} Faculty
                        </p>
                    </div>
                </div>
                
                {/* Navigation Arrows */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handlePrev}
                        style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            border: `1px solid ${colors.border}`,
                            background: 'transparent',
                            color: colors.textSecondary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleNext}
                        style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            border: `1px solid ${colors.border}`,
                            background: 'transparent',
                            color: colors.textSecondary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </motion.button>
                </div>
            </div>

            {/* Carousel Content */}
            <div ref={carouselRef} style={{ position: 'relative', overflow: 'hidden' }}>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            display: 'flex',
                            gap: '16px',
                            alignItems: 'flex-start',
                        }}
                    >
                        {/* Teacher Card */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onTeacherClick(currentTeacher.teacher)}
                            style={{
                                flex: '0 0 auto',
                                width: '200px',
                                padding: '16px',
                                borderRadius: '12px',
                                background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                border: `1px solid ${colors.border}`,
                                cursor: 'pointer',
                                textAlign: 'center',
                            }}
                        >
                            {/* Avatar */}
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                                style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '16px',
                                    background: `linear-gradient(135deg, #f59e0b20 0%, #f59e0b10 100%)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '22px',
                                    fontWeight: 600,
                                    color: '#f59e0b',
                                    margin: '0 auto 12px',
                                    position: 'relative',
                                }}
                            >
                                {currentTeacher.teacher.profile_image ? (
                                    <img 
                                        src={currentTeacher.teacher.profile_image} 
                                        alt={currentTeacher.teacher.full_name}
                                        style={{ width: '100%', height: '100%', borderRadius: '16px', objectFit: 'cover' }}
                                    />
                                ) : (
                                    `${currentTeacher.teacher.first_name?.[0] || ''}${currentTeacher.teacher.last_name?.[0] || ''}`
                                )}
                                {/* Online indicator */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: -2,
                                    right: -2,
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '50%',
                                    background: currentTeacher.teacher.is_online ? '#10b981' : '#94a3b8',
                                    border: '3px solid white',
                                    boxShadow: currentTeacher.teacher.is_online ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none',
                                }} />
                            </motion.div>
                            
                            {/* Name */}
                            <h4 style={{
                                margin: '0 0 4px',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: colors.textPrimary,
                            }}>
                                {currentTeacher.teacher.full_name}
                            </h4>
                            
                            {/* Role Badge */}
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: 'rgba(245, 158, 11, 0.1)',
                                fontSize: '10px',
                                fontWeight: 500,
                                color: '#f59e0b',
                            }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                Faculty
                            </span>
                        </motion.div>

                        {/* Courses List */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                                margin: '0 0 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: colors.textMuted,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}>
                                Teaching This Semester
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {currentTeacher.courses.map((course, idx) => (
                                    <motion.div
                                        key={course.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 + idx * 0.05, duration: 0.3 }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '10px 14px',
                                            borderRadius: '10px',
                                            background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                            border: `1px solid ${colors.border}`,
                                        }}
                                    >
                                        {/* Course Icon */}
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '8px',
                                            background: `${getCategoryColor(course.category)}15`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={getCategoryColor(course.category)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                            </svg>
                                        </div>
                                        
                                        {/* Course Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '13px',
                                                fontWeight: 500,
                                                color: colors.textPrimary,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {course.title}
                                            </p>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '11px',
                                                color: colors.textMuted,
                                            }}>
                                                {course.subtitle} · {course.short_title}
                                            </p>
                                        </div>
                                        
                                        {/* Category Badge */}
                                        <span style={{
                                            padding: '3px 8px',
                                            borderRadius: '5px',
                                            background: `${getCategoryColor(course.category)}15`,
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            color: getCategoryColor(course.category),
                                            textTransform: 'uppercase',
                                            flexShrink: 0,
                                        }}>
                                            {course.category}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Pagination Dots */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '16px',
            }}>
                {teachers.map((_, idx) => (
                    <motion.button
                        key={idx}
                        onClick={() => {
                            setDirection(idx > currentIndex ? 1 : -1);
                            setCurrentIndex(idx);
                        }}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        style={{
                            width: idx === currentIndex ? '20px' : '8px',
                            height: '8px',
                            borderRadius: '4px',
                            border: 'none',
                            background: idx === currentIndex ? '#f59e0b' : isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    />
                ))}
            </div>
        </motion.div>
    );
};

// User Detail Modal Component
interface UserDetailModalProps {
    user: UserAccount | null;
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, isOpen, onClose, isDarkMode }) => {
    const [courses, setCourses] = useState<TeacherCourse[]>([]);
    const [officeHours, setOfficeHours] = useState<OfficeHours[]>([]);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isLoadingCourses, setIsLoadingCourses] = useState(false);

    const colors = {
        bg: isDarkMode ? '#0f172a' : '#ffffff',
        cardBg: isDarkMode ? '#1e293b' : '#f8fafc',
        border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        textPrimary: isDarkMode ? '#f1f5f9' : '#0f172a',
        textSecondary: isDarkMode ? '#94a3b8' : '#64748b',
        textMuted: isDarkMode ? '#64748b' : '#94a3b8',
    };

    // Load courses and office hours when modal opens
    useEffect(() => {
        if (isOpen && user && user.role === 'teacher') {
            setIsLoadingCourses(true);
            getTeacherCourses(user.full_name).then(data => {
                setCourses(data);
                setIsLoadingCourses(false);
            });
            setOfficeHours(getTeacherOfficeHours(user.full_name));
        }
    }, [isOpen, user]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Copy to clipboard
    const copyToClipboard = useCallback((text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    }, []);

    if (!user) return null;

    const roleInfo = getRoleInfo(user.role);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 9998,
                        }}
                    />

                    {/* Modal */}
                    <div 
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="user-modal-title"
                        style={{
                            position: 'fixed',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                            pointerEvents: 'none',
                            padding: '20px',
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            style={{
                                width: '100%',
                                maxWidth: '480px',
                                maxHeight: '85vh',
                                background: colors.bg,
                                borderRadius: '20px',
                                boxShadow: isDarkMode
                                    ? '0 24px 48px rgba(0, 0, 0, 0.4)'
                                    : '0 24px 48px rgba(0, 0, 0, 0.15)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                pointerEvents: 'auto',
                            }}
                        >
                            {/* Header */}
                            <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${colors.border}` }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                    {/* Avatar */}
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                                        style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '16px',
                                            background: `linear-gradient(135deg, ${roleInfo.color}20 0%, ${roleInfo.color}10 100%)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '24px',
                                            fontWeight: 600,
                                            color: roleInfo.color,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {user.profile_image ? (
                                            <img src={user.profile_image} alt={user.full_name} style={{ width: '100%', height: '100%', borderRadius: '16px', objectFit: 'cover' }} />
                                        ) : `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()}
                                    </motion.div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h2 id="user-modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: colors.textPrimary, marginBottom: '4px' }}>
                                            {user.full_name}
                                        </h2>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                background: roleInfo.bgColor,
                                                fontSize: '12px',
                                                fontWeight: 500,
                                                color: roleInfo.color,
                                            }}>
                                                <RoleIcon role={user.role} size={12} />
                                                {roleInfo.label}
                                            </span>
                                            {/* Online/Last Seen Status */}
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                fontSize: '11px',
                                                color: user.is_online ? '#10b981' : colors.textMuted,
                                            }}>
                                                <span style={{ 
                                                    width: '6px', 
                                                    height: '6px', 
                                                    borderRadius: '50%', 
                                                    background: user.is_online ? '#10b981' : '#94a3b8',
                                                    boxShadow: user.is_online ? '0 0 6px rgba(16, 185, 129, 0.5)' : 'none',
                                                }} />
                                                {getLastSeenText(user.last_active, user.is_online || false)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Close Button */}
                                    <motion.button
                                        aria-label="Close modal"
                                        whileHover={{ scale: 1.1, background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={onClose}
                                        style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: colors.textSecondary,
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </motion.button>
                                </div>
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                                {/* Contact Info */}
                                <div style={{ marginBottom: '20px' }}>
                                    <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Contact Information
                                    </h3>
                                    
                                    {/* Email */}
                                    <motion.div
                                        whileHover={{ background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                                        onClick={() => copyToClipboard(user.email, 'email')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            marginBottom: '8px',
                                            border: `1px solid ${colors.border}`,
                                        }}
                                    >
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '10px',
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                <polyline points="22,6 12,13 2,6" />
                                            </svg>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '2px' }}>Email</div>
                                            <div style={{ fontSize: '13px', color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {user.email}
                                            </div>
                                        </div>
                                        <motion.div
                                            initial={false}
                                            animate={{ scale: copiedField === 'email' ? [1, 1.2, 1] : 1 }}
                                            style={{ color: copiedField === 'email' ? '#10b981' : colors.textMuted }}
                                        >
                                            {copiedField === 'email' ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                </svg>
                                            )}
                                        </motion.div>
                                    </motion.div>

                                    {/* Campus */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: `1px solid ${colors.border}`,
                                    }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '10px',
                                            background: 'rgba(139, 92, 246, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                                <polyline points="9 22 9 12 15 12 15 22" />
                                            </svg>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '2px' }}>Campus</div>
                                            <div style={{ fontSize: '13px', color: colors.textPrimary }}>STI College {user.campus}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Courses (for teachers) */}
                                {user.role === 'teacher' && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Courses Teaching
                                        </h3>
                                        {isLoadingCourses ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {[...Array(2)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            padding: '12px',
                                                            borderRadius: '12px',
                                                            border: `1px solid ${colors.border}`,
                                                        }}
                                                    >
                                                        <SkeletonPulse width="36px" height="36px" borderRadius="10px" isDarkMode={isDarkMode} />
                                                        <div style={{ flex: 1 }}>
                                                            <SkeletonPulse width="70%" height="13px" borderRadius="4px" isDarkMode={isDarkMode} style={{ marginBottom: '4px' }} />
                                                            <SkeletonPulse width="50%" height="11px" borderRadius="4px" isDarkMode={isDarkMode} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : courses.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {courses.map((course, index) => (
                                                    <motion.div
                                                        key={course.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            padding: '12px',
                                                            borderRadius: '12px',
                                                            border: `1px solid ${colors.border}`,
                                                            background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '10px',
                                                            background: 'rgba(16, 185, 129, 0.1)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}>
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                            </svg>
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '13px', fontWeight: 500, color: colors.textPrimary }}>{course.title}</div>
                                                            <div style={{ fontSize: '11px', color: colors.textMuted }}>{course.subtitle}</div>
                                                        </div>
                                                        <span style={{
                                                            fontSize: '10px',
                                                            fontWeight: 600,
                                                            padding: '3px 8px',
                                                            borderRadius: '6px',
                                                            background: course.category === 'major' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                                                            color: course.category === 'major' ? '#3b82f6' : '#8b5cf6',
                                                            textTransform: 'uppercase',
                                                        }}>
                                                            {course.short_title}
                                                        </span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ padding: '20px', textAlign: 'center', color: colors.textMuted, fontSize: '13px' }}>
                                                No courses assigned
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Office Hours (for teachers) */}
                                {user.role === 'teacher' && officeHours.length > 0 && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Office Hours
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {officeHours.map((hours, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        padding: '10px 12px',
                                                        borderRadius: '10px',
                                                        background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                                                        border: `1px solid ${colors.border}`,
                                                    }}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <polyline points="12 6 12 12 16 14" />
                                                    </svg>
                                                    <span style={{ fontSize: '12px', fontWeight: 500, color: colors.textPrimary, minWidth: '80px' }}>{hours.day}</span>
                                                    <span style={{ fontSize: '12px', color: colors.textSecondary }}>{hours.time}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Student Info */}
                                {user.role === 'student' && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Academic Information
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            {user.program && (
                                                <div style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${colors.border}` }}>
                                                    <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '4px' }}>Program</div>
                                                    <div style={{ fontSize: '13px', fontWeight: 500, color: colors.textPrimary }}>{user.program}</div>
                                                </div>
                                            )}
                                            {user.year_level && (
                                                <div style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${colors.border}` }}>
                                                    <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '4px' }}>Year Level</div>
                                                    <div style={{ fontSize: '13px', fontWeight: 500, color: colors.textPrimary }}>{user.year_level}</div>
                                                </div>
                                            )}
                                            {user.section && (
                                                <div style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${colors.border}` }}>
                                                    <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '4px' }}>Section</div>
                                                    <div style={{ fontSize: '13px', fontWeight: 500, color: colors.textPrimary }}>{user.section}</div>
                                                </div>
                                            )}
                                            <div style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${colors.border}` }}>
                                                <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '4px' }}>Student ID</div>
                                                <div style={{ fontSize: '13px', fontWeight: 500, color: colors.textPrimary }}>{user.student_id}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div style={{ padding: '16px 24px', borderTop: `1px solid ${colors.border}`, display: 'flex', gap: '12px' }}>
                                <motion.button
                                    whileHover={{ scale: 1.02, background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onClose}
                                    style={{
                                        flex: 1,
                                        padding: '12px 20px',
                                        borderRadius: '10px',
                                        border: `1px solid ${colors.border}`,
                                        background: 'transparent',
                                        color: colors.textSecondary,
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Close
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => window.location.href = `mailto:${user.email}`}
                                    style={{
                                        flex: 2,
                                        padding: '12px 20px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: '#3b82f6',
                                        color: '#ffffff',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                    Send Message
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

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
                console.error('[Users] Load error:', err);
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
