/**
 * UserCard + UserListItem + QuickActionButton + HeartIcon
 * Extracted from UsersContent.tsx during Phase 8.4
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getRoleInfo, getTeacherCourses, type UserAccount } from '@/services/usersService';
import { getLastSeenText } from '../utils';
import UserAvatar from './UserAvatar';
import RoleIcon from './RoleIcon';
import ActionTooltip from './ActionTooltip';
import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar';
import Grainient from '@/components/ui/grainient';

import { getCurrentUser } from '@/services/authService';

const maskEmail = (email: string) => {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const [name, domain] = parts;
    if (name.length <= 3) return name[0] + '***@' + domain;
    return name.substring(0, 3) + '***@' + domain;
};

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
                    transition: 'all 0.15s ease' }}
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
    
    onClick?: (user: UserAccount) => void;
    favorites?: string[];
    onToggleFavorite?: (userId: string) => void;
    reducedMotion?: boolean;
    isMobile?: boolean;
}> = ({ user, index,  onClick, favorites = [], onToggleFavorite, reducedMotion = false, isMobile = false }) => {
    const roleInfo = getRoleInfo(user.role);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [courseCount, setCourseCount] = useState<number>(0);
    const isFavorite = favorites.includes(user.id);
    const cardRef = useRef<HTMLDivElement>(null);
    
    // Check if this is the current logged-in user (hide quick actions for self)
    const currentUser = getCurrentUser();
    const isCurrentUser = currentUser && (user.id === currentUser.id || user.email === currentUser.email);
    
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
            transition={reducedMotion ? { duration: 0.01 } : { delay: index * 0.02, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onClick?.(user)}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`group/card relative pt-5 pb-5 px-5 bg-white dark:bg-slate-800 rounded-[14px] border-[2px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer flex flex-col items-center w-full overflow-hidden ${isFocused ? 'border-blue-500' : 'border-slate-200 dark:border-slate-700/50'}`}
        >
            {isCurrentUser && (
                <div className="absolute inset-0 z-0">
                    <Grainient 
                        color1="#ffffff" 
                        color2="#ffffff" 
                        color3="#3b82f6" 
                    />
                </div>
            )}

            {/* Avatar Profile Section */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-3 w-full">
                <motion.div className="relative flex justify-center shrink-0 group-hover/card:scale-110 transition-transform duration-300">
                    {user.role === 'teacher' ? (
                        <div className={`w-16 h-16 shrink-0 relative z-10 rounded-full flex items-center justify-center shadow-sm overflow-hidden border-[3px] ${user.is_online ? 'border-emerald-500' : 'border-slate-200 dark:border-slate-700'}`}>
                            <div className="w-full h-full flex items-center justify-center bg-amber-50 dark:bg-amber-900/20">
                                {user.profile_image ? (
                                    <img src={user.profile_image} alt={user.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-extrabold text-[16px] text-amber-600">
                                        {user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <AnimatedCircularProgressBar
                            max={100}
                            min={0}
                            value={user.is_online ? 100 : 85}
                            gaugePrimaryColor={(user.level || 1) >= 20 ? '#eab308' : '#3b82f6'}
                            gaugeSecondaryColor="rgba(219, 234, 254, 0.6)"
                            className="w-16 h-16 shrink-0 relative z-10"
                        >
                            <div className="absolute inset-1.5 rounded-full flex items-center justify-center shadow-sm overflow-hidden z-10" style={{ background: 'rgba(219, 234, 254, 0.6)' }}>
                                {user.profile_image ? (
                                    <img src={user.profile_image} alt={user.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-extrabold text-[16px] text-blue-600">
                                        {user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            
                            {/* Level Badge */}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 flex justify-center">
                                <div 
                                    className={`min-w-[32px] h-[16px] px-1 rounded-md flex items-center justify-center text-[8.5px] font-bold tracking-wider shadow-sm border-[2px] transition-colors duration-300 ${(user.level || 1) >= 20 ? 'bg-yellow-400 text-blue-800' : 'bg-blue-500 text-white'} ${
                                        user.is_online ? 'border-emerald-500 dark:border-emerald-400' : 'border-white dark:border-slate-800'
                                    }`}
                                >
                                    <span className="ml-[0.05em]">{(user.level || 1) >= 20 ? 'MAX' : `LV.${user.level || 1}`}</span>
                                </div>
                            </div>
                        </AnimatedCircularProgressBar>
                    )}
                </motion.div>
                
                <div className="flex flex-col items-center gap-1.5 overflow-hidden w-full">
                    <p className="text-[14px] leading-tight font-bold text-slate-800 dark:text-slate-200 truncate text-center w-full">{user.full_name}</p>
                    <div className="flex w-full items-center justify-center gap-1 sm:gap-1.5 overflow-hidden">
                        {user.role === 'teacher' ? (
                            <>
                                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-[4px] text-[8px] sm:text-[8.5px] font-bold tracking-wider uppercase border border-slate-200 dark:border-slate-600 truncate min-w-0 shrink">
                                    INSTRUCTOR
                                </span>
                                <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-[4px] text-[8px] sm:text-[8.5px] font-bold tracking-wider uppercase border border-amber-100 dark:border-amber-800/50 truncate min-w-0 shrink">
                                    FACULTY
                                </span>
                            </>
                        ) : (
                            <>
                                {user.section && (
                                    <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-[4px] text-[8px] sm:text-[8.5px] font-bold tracking-wider uppercase border border-slate-200 dark:border-slate-600 truncate min-w-0 shrink">
                                        {user.section}
                                    </span>
                                )}
                                <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-[4px] text-[8px] sm:text-[8.5px] font-bold tracking-wider uppercase border border-blue-100 dark:border-blue-800/50 truncate min-w-0 shrink">
                                    1ST SEM
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};



// User List Item Component (for list view)
const UserListItem: React.FC<{
    user: UserAccount;
    index: number;
    
    onClick?: (user: UserAccount) => void;
    favorites?: string[];
    onToggleFavorite?: (userId: string) => void;
    reducedMotion?: boolean;
    isMobile?: boolean;
}> = ({ user, index,  onClick, favorites = [], onToggleFavorite, reducedMotion = false, isMobile = false }) => {
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
                boxShadow: isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : undefined }}
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
                            whiteSpace: 'nowrap' }}>
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
                                fontWeight: 600 }}>
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
                        whiteSpace: 'nowrap' }}>
                        {isCurrentUser ? user.email : maskEmail(user.email)}
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
                        color: roleInfo.color }}>
                        <RoleIcon role={user.role} size={12} />
                        {roleInfo.label}
                    </span>
                </div>

                {/* Section/Campus */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <span style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)' }}>
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
                            boxShadow: user.is_online ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none' }} />
                        <span style={{
                            fontSize: '11px',
                            color: user.is_online ? '#10b981' : 'var(--text-muted)',
                            fontWeight: 500 }}>
                            {user.is_online ? 'Online' : 'Offline'}
                        </span>
                    </div>
                    {!user.is_online && user.last_active && (
                        <span style={{
                            fontSize: '9px',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap' }}>
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
                            flexShrink: 0 }}
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
