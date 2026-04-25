/**
 * UserCard + UserListItem + QuickActionButton + HeartIcon
 * Extracted from UsersContent.tsx during Phase 8.4
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getRoleInfo, getTeacherCourses, type UserAccount } from '../../../../../services/usersService';
import { getLastSeenText } from '../utils';
import UserAvatar from './UserAvatar';
import RoleIcon from './RoleIcon';
import ActionTooltip from './ActionTooltip';

// Quick Action Button Component
const QuickActionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: (e: React.MouseEvent) => void;
    isActive?: boolean;
    activeColor?: string;
    delay?: number;
}> = ({ icon, label, onClick, isActive, activeColor = '#3b82f6', delay = 0 }) => {
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
                        : 'var(--bg-hover)',
                    color: isActive ? activeColor : 'var(--text-secondary)',
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
}> = ({ user, index, colors, onClick, favorites = [], onToggleFavorite, reducedMotion = false, isMobile = false }) => {
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
                boxShadow: 'var(--shadow-lg)',
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
                background: 'var(--dashboard-surface)',
                borderRadius: '16px',
                border: `1px solid ${isFocused ? '#3b82f6' : 'var(--border-color)'}`,
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
                                color: 'var(--text-primary)',
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
                                            background: 'var(--bg-hover)',
                                            color: 'var(--text-secondary)',
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
                                            background: 'var(--bg-hover)',
                                            color: 'var(--text-secondary)',
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
                                            background: isFavorite ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-hover)',
                                            color: isFavorite ? '#ef4444' : 'var(--text-secondary)',
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
                            color: 'var(--text-secondary)',
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
                            color: user.is_online ? '#10b981' : 'var(--text-muted)',
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
                                color: 'var(--text-muted)',
                                padding: '3px 7px',
                                borderRadius: '5px',
                                background: 'var(--bg-hover)',
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
                                background: 'rgba(16, 185, 129, 0.1)',
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
                                background: 'rgba(59, 130, 246, 0.1)',
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
                        borderTop: `1px solid var(--border-color)`,
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
                            background: 'rgba(59, 130, 246, 0.1)',
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
                            background: 'rgba(16, 185, 129, 0.1)',
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
                                : 'var(--bg-hover)',
                            color: isFavorite ? '#ef4444' : 'var(--text-muted)',
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
}> = ({ user, index, colors, onClick, favorites = [], onToggleFavorite, reducedMotion = false, isMobile = false }) => {
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
                background: 'var(--bg-hover)',
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
                border: `1px solid ${isFocused ? '#3b82f6' : 'var(--border-color)'}`,
                background: 'var(--dashboard-surface)',
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
                            color: 'var(--text-primary)',
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
                        color: 'var(--text-secondary)',
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
                        color: 'var(--text-muted)',
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
                            color: user.is_online ? '#10b981' : 'var(--text-muted)',
                            fontWeight: 500,
                        }}>
                            {user.is_online ? 'Online' : 'Offline'}
                        </span>
                    </div>
                    {!user.is_online && user.last_active && (
                        <span style={{
                            fontSize: '9px',
                            color: 'var(--text-muted)',
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
                            
                            delay={reducedMotion ? 0 : 0}
                        />
                        <QuickActionButton
                            icon={<ScheduleIcon />}
                            label="View Schedule"
                            onClick={handleScheduleClick}
                            
                            delay={reducedMotion ? 0 : 0.03}
                        />
                        <QuickActionButton
                            icon={<HeartIcon filled={isFavorite} />}
                            label={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                            onClick={handleFavoriteClick}
                            isActive={isFavorite}
                            activeColor="#ef4444"
                            
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
                        stroke={'var(--text-muted)'}
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



export { UserCard, UserListItem };
