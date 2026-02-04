/**
 * DashboardHeader Component
 * Redesigned to match Groups/Catalog page minimalistic design
 * Professional blue theme with smooth hover effects
 * Includes: Settings, Notifications, Dark Mode toggle, User info, Logout
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { COLORS } from '../constants';
import { AnimatedThemeToggler } from '../../../components/ui/animated-theme-toggler';
import SettingsModal from '../SettingsModal';
import { useNotificationSettings, sendPushNotification } from '../../../contexts/NotificationSettingsContext';
import { useDisplaySettings } from '../../../contexts/DisplaySettingsContext';
import { useResponsive } from '../hooks';

// Notification types matching the 4 major dashboard cards
export type NotificationType = 'submission' | 'at-risk' | 'grading' | 'scores' | 'assignment';

export interface DashboardNotification {
    id: string;
    type: NotificationType;
    title: string;
    description: string;
    timestamp: Date;
    isRead: boolean;
    actionLabel?: string;
    onAction?: () => void;
}

interface DashboardHeaderProps {
    userName: string;
    userEmail: string;
    userInitial: string;
    onLogout: () => void;
    // Real notification data
    notifications?: DashboardNotification[];
    onNotificationClick?: (notification: DashboardNotification) => void;
    onViewAllNotifications?: () => void;
}

// Helper to format time ago in compact format
const formatTimeCompact = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return `${Math.floor(diffDays / 7)}w`;
};

// Get icon and color for notification type
const getNotificationStyle = (type: NotificationType) => {
    switch (type) {
        case 'submission':
            return {
                color: '#3b82f6',
                icon: (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                    </svg>
                ),
            };
        case 'at-risk':
            return {
                color: '#f59e0b',
                icon: (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                ),
            };
        case 'grading':
            return {
                color: '#10b981',
                icon: (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                ),
            };
        case 'scores':
            return {
                color: '#8b5cf6',
                icon: (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                ),
            };
        case 'assignment':
            return {
                color: '#06b6d4',
                icon: (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                ),
            };
        default:
            return {
                color: '#64748b',
                icon: (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                ),
            };
    }
};

// Icon Button Component for consistent styling
const IconButton: React.FC<{
    onClick: () => void;
    ariaLabel: string;
    title: string;
    hoverColor?: string;
    hoverBg?: string;
    hoverShadow?: string;
    isActive?: boolean;
    size?: 'sm' | 'md';
    children: React.ReactNode;
}> = ({ onClick, ariaLabel, title, hoverColor, hoverBg, hoverShadow, isActive, size = 'md', children }) => (
    <motion.button
        whileHover={{ 
            scale: 1.05,
            boxShadow: hoverShadow || '0 4px 12px rgba(59, 130, 246, 0.15)',
            background: hoverBg || 'rgba(59, 130, 246, 0.08)',
            borderColor: hoverColor ? `${hoverColor}30` : 'rgba(59, 130, 246, 0.2)',
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onClick={onClick}
        aria-label={ariaLabel}
        title={title}
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: size === 'sm' ? '30px' : '34px',
            height: size === 'sm' ? '30px' : '34px',
            borderRadius: '8px',
            border: `1px solid ${isActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0, 0, 0, 0.06)'}`,
            background: isActive ? 'rgba(59, 130, 246, 0.08)' : 'rgba(0, 0, 0, 0.02)',
            cursor: 'pointer',
            color: isActive ? '#3b82f6' : COLORS.textMuted,
            padding: 0,
        }}
    >
        {children}
    </motion.button>
);

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
    userName, 
    userEmail, 
    userInitial, 
    onLogout,
    notifications = [],
    onNotificationClick,
    onViewAllNotifications,
}) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    
    // Responsive state for mobile compatibility
    const { isMobile, isSmallMobile } = useResponsive();
    
    // Get notification and display settings
    const { isPushEnabled } = useNotificationSettings();
    const { settings: displaySettings, shouldAnimate } = useDisplaySettings();

    // Calculate unread count
    const unreadCount = useMemo(() => 
        notifications.filter(n => !n.isRead).length, 
        [notifications]
    );

    // Send push notifications for new unread notifications
    useEffect(() => {
        if (isPushEnabled && notifications.length > 0) {
            const latestUnread = notifications.find(n => !n.isRead);
            if (latestUnread) {
                // Only send push for very recent notifications (within last 30 seconds)
                const timeDiff = Date.now() - latestUnread.timestamp.getTime();
                if (timeDiff < 30000) {
                    sendPushNotification(latestUnread.title, {
                        body: latestUnread.description,
                        tag: latestUnread.id, // Prevent duplicate notifications
                    });
                }
            }
        }
    }, [notifications, isPushEnabled]);

    const MotionWrapper = shouldAnimate ? motion.header : 'header';
    const motionProps = shouldAnimate ? {
        initial: { opacity: 0, y: -10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4 },
    } : {};

    return (
        <MotionWrapper
            {...motionProps}
            style={{
                background: COLORS.surface,
                borderBottom: `1px solid ${COLORS.border}`,
                padding: isMobile ? '10px 12px' : (displaySettings.compactView ? '10px 20px' : '12px 24px'),
                position: 'sticky',
                top: 0,
                zIndex: 100,
            }}
        >
            <div style={{ 
                maxWidth: '1400px', 
                margin: '0 auto', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
            }}>
                {/* Logo & Title */}
                <div 
                    style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px' }}
                >
                    {/* Logo Icon */}
                    <div
                        style={{
                            width: isMobile ? '36px' : '40px',
                            height: isMobile ? '36px' : '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
                            border: '1px solid rgba(59, 130, 246, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'default',
                            transition: shouldAnimate ? 'transform 0.15s ease' : 'none',
                            flexShrink: 0,
                        }}
                    >
                        <svg width={isMobile ? "18" : "20"} height={isMobile ? "18" : "20"} viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            <path d="M8 7h8M8 11h8M8 15h5" />
                        </svg>
                    </div>
                    
                    {/* Title & Subtitle - Hide subtitle on small mobile */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                                fontSize: isMobile ? '14px' : '16px', 
                                fontWeight: 600, 
                                color: COLORS.textPrimary,
                                letterSpacing: '-0.01em',
                            }}>
                                {isSmallMobile ? 'Portal' : 'Teacher Portal'}
                            </span>
                            {!isSmallMobile && (
                                <span style={{
                                    padding: '2px 6px',
                                    borderRadius: '5px',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    color: '#3b82f6',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.3px',
                                }}>
                                    Teacher
                                </span>
                            )}
                        </div>
                        {!isMobile && (
                            <div style={{ 
                                fontSize: '12px', 
                                color: COLORS.textMuted,
                                marginTop: '1px',
                            }}>
                                eLMS Management System
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side - Actions & User */}
                <div 
                    style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px' }}
                >
                    {/* Dark Mode Toggle - Magic UI AnimatedThemeToggler */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                        }}
                    >
                        <AnimatedThemeToggler
                            className={`flex items-center justify-center ${isMobile ? 'w-[30px] h-[30px]' : 'w-[34px] h-[34px]'} rounded-lg border border-black/5 bg-black/[0.02] hover:bg-indigo-500/10 hover:border-indigo-500/20 transition-colors cursor-pointer text-gray-500 hover:text-indigo-500 [&_svg]:w-4 [&_svg]:h-4`}
                            duration={500}
                        />
                    </div>

                    {/* Notifications - Minimalistic Blue Design */}
                    <div style={{ position: 'relative' }}>
                        <IconButton
                            onClick={() => setShowNotifications(!showNotifications)}
                            ariaLabel="View notifications"
                            title="Notifications"
                            isActive={showNotifications}
                            size={isMobile ? 'sm' : 'md'}
                            hoverColor="#3b82f6"
                            hoverBg="rgba(59, 130, 246, 0.08)"
                            hoverShadow="0 4px 12px rgba(59, 130, 246, 0.15)"
                        >
                            <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        </IconButton>
                        
                        {/* Notification Badge - Blue themed */}
                        {unreadCount > 0 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-4px',
                                    minWidth: '14px',
                                    height: '14px',
                                    padding: '0 3px',
                                    borderRadius: '7px',
                                    background: '#3b82f6',
                                    color: '#fff',
                                    fontSize: '8px',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1.5px solid #fff',
                                    pointerEvents: 'none',
                                    boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)',
                                }}
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </motion.div>
                        )}

                        {/* Notifications Dropdown - Real Data */}
                        <AnimatePresence>
                            {showNotifications && (() => {
                                const maxVisible = 3;
                                const visibleNotifications = notifications.slice(0, maxVisible);
                                const remainingCount = notifications.length - maxVisible;

                                return (
                                <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                                    transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                                    style={{
                                        position: isMobile ? 'fixed' : 'absolute',
                                        top: isMobile ? '60px' : 'calc(100% + 8px)',
                                        right: isMobile ? '12px' : 0,
                                        left: isMobile ? '12px' : 'auto',
                                        width: isMobile ? 'auto' : '280px',
                                        maxWidth: isMobile ? 'calc(100vw - 24px)' : '280px',
                                        background: '#ffffff',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(0, 0, 0, 0.06)',
                                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                                        overflow: 'hidden',
                                        zIndex: 1000,
                                    }}
                                >
                                    {/* Compact Header */}
                                    <div style={{
                                        padding: '10px 12px',
                                        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '6px',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                                </svg>
                                            </div>
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                                                Notifications
                                            </span>
                                        </div>
                                        {unreadCount > 0 && (
                                            <span style={{
                                                padding: '2px 6px',
                                                borderRadius: '6px',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                color: '#3b82f6',
                                            }}>
                                                {unreadCount} new
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Notification Items */}
                                    <div style={{ padding: '6px' }}>
                                        {visibleNotifications.length === 0 ? (
                                            <div style={{
                                                padding: '20px 10px',
                                                textAlign: 'center',
                                                color: '#94a3b8',
                                                fontSize: '11px',
                                            }}>
                                                No notifications yet
                                            </div>
                                        ) : (
                                            visibleNotifications.map((notif, i) => {
                                                const style = getNotificationStyle(notif.type);
                                                return (
                                                    <motion.div
                                                        key={notif.id}
                                                        initial={{ opacity: 0, x: -8 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.03 + 0.05 }}
                                                        whileHover={{ background: 'rgba(59, 130, 246, 0.04)' }}
                                                        onClick={() => {
                                                            onNotificationClick?.(notif);
                                                            setShowNotifications(false);
                                                        }}
                                                        style={{
                                                            padding: '8px 10px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            cursor: 'pointer',
                                                            borderRadius: '8px',
                                                            transition: 'background 0.15s ease',
                                                        }}
                                                    >
                                                        {/* Icon */}
                                                        <div style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            borderRadius: '8px',
                                                            background: `${style.color}12`,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: style.color,
                                                            flexShrink: 0,
                                                        }}>
                                                            {style.icon}
                                                        </div>
                                                        
                                                        {/* Content */}
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ 
                                                                fontSize: '11px', 
                                                                fontWeight: 600, 
                                                                color: '#0f172a',
                                                                lineHeight: 1.2,
                                                            }}>
                                                                {notif.title}
                                                            </div>
                                                            <div style={{ 
                                                                fontSize: '10px', 
                                                                color: '#64748b',
                                                                lineHeight: 1.3,
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                            }}>
                                                                {notif.description}
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Time */}
                                                        <span style={{ 
                                                            fontSize: '9px', 
                                                            color: '#94a3b8',
                                                            fontWeight: 500,
                                                            flexShrink: 0,
                                                        }}>
                                                            {formatTimeCompact(notif.timestamp)}
                                                        </span>
                                                        
                                                        {/* Unread dot */}
                                                        {!notif.isRead && (
                                                            <div style={{
                                                                width: '6px',
                                                                height: '6px',
                                                                borderRadius: '50%',
                                                                background: '#3b82f6',
                                                                flexShrink: 0,
                                                            }} />
                                                        )}
                                                    </motion.div>
                                                );
                                            })
                                        )}
                                        
                                        {/* +X more indicator */}
                                        {remainingCount > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.15 }}
                                                style={{
                                                    padding: '6px 10px',
                                                    textAlign: 'center',
                                                    fontSize: '10px',
                                                    fontWeight: 500,
                                                    color: '#94a3b8',
                                                }}
                                            >
                                                +{remainingCount} more notification{remainingCount > 1 ? 's' : ''}
                                            </motion.div>
                                        )}
                                    </div>
                                    
                                    {/* Compact Footer */}
                                    <div style={{
                                        padding: '8px 10px',
                                        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                                    }}>
                                        <motion.button
                                            whileHover={{ 
                                                scale: 1.01,
                                                background: 'rgba(59, 130, 246, 0.12)',
                                            }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => {
                                                onViewAllNotifications?.();
                                                setShowNotifications(false);
                                            }}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '5px',
                                                padding: '6px 10px',
                                                background: 'rgba(59, 130, 246, 0.08)',
                                                color: '#3b82f6',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '11px',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                transition: 'background 0.15s ease',
                                            }}
                                        >
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                            </svg>
                                            View all
                                        </motion.button>
                                    </div>
                                </motion.div>
                                );
                            })()}
                        </AnimatePresence>
                    </div>

                    {/* Help/Tutorial Button - HIDDEN */}
                    {/* Commented out to hide tutorial button
                    {onStartTutorial && (
                        <IconButton
                            onClick={onStartTutorial}
                            ariaLabel="Start tutorial"
                            title="Start Tutorial"
                            size={isMobile ? 'sm' : 'md'}
                            hoverColor="#10b981"
                            hoverBg="rgba(16, 185, 129, 0.08)"
                            hoverShadow="0 4px 12px rgba(16, 185, 129, 0.15)"
                        >
                            <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </IconButton>
                    )}
                    */}

                    {/* Settings */}
                    <IconButton
                        onClick={() => setShowSettings(true)}
                        ariaLabel="Open settings"
                        title="Settings"
                        size={isMobile ? 'sm' : 'md'}
                        hoverColor="#8b5cf6"
                        hoverBg="rgba(139, 92, 246, 0.08)"
                        hoverShadow="0 4px 12px rgba(139, 92, 246, 0.15)"
                    >
                        <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    </IconButton>

                    {/* Divider - hide on small mobile */}
                    {!isSmallMobile && (
                    <div style={{ 
                        width: '1px', 
                        height: '24px', 
                        background: COLORS.border,
                        margin: '0 4px',
                    }} />
                    )}

                    {/* User Info Card */}
                    <motion.div 
                        whileHover={isMobile ? {} : { 
                            background: 'rgba(59, 130, 246, 0.04)',
                            borderColor: 'rgba(59, 130, 246, 0.15)',
                        }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: isMobile ? '6px' : '10px', 
                            padding: isMobile ? '4px' : '6px 12px 6px 6px', 
                            borderRadius: '10px', 
                            background: 'rgba(0, 0, 0, 0.02)',
                            border: '1px solid transparent',
                            cursor: 'default',
                        }}
                    >
                        {/* Avatar */}
                        <div style={{
                            width: isMobile ? '28px' : '32px',
                            height: isMobile ? '28px' : '32px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)',
                            border: '1px solid rgba(139, 92, 246, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#8b5cf6',
                            fontWeight: 600,
                            fontSize: isMobile ? '11px' : '13px',
                        }}>
                            {userInitial}
                        </div>
                        
                        {/* Name & Email - Hide on mobile */}
                        {!isMobile && (
                        <div>
                            <div style={{ 
                                fontSize: '13px', 
                                fontWeight: 500, 
                                color: COLORS.textPrimary,
                                lineHeight: 1.2,
                            }}>
                                {userName}
                            </div>
                            <div style={{ 
                                fontSize: '11px', 
                                color: COLORS.textMuted,
                                lineHeight: 1.2,
                            }}>
                                {userEmail}
                            </div>
                        </div>
                        )}
                    </motion.div>

                    {/* Logout Button */}
                    <IconButton
                        onClick={onLogout}
                        ariaLabel="Logout from Teacher Portal"
                        title="Logout"
                        size={isMobile ? 'sm' : 'md'}
                        hoverColor="#ef4444"
                        hoverBg="rgba(239, 68, 68, 0.08)"
                        hoverShadow="0 4px 12px rgba(239, 68, 68, 0.15)"
                    >
                        <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </IconButton>
                </div>
            </div>
            
            {/* Settings Modal */}
            <SettingsModal 
                isOpen={showSettings} 
                onClose={() => setShowSettings(false)} 
            />
        </MotionWrapper>
    );
};

export default DashboardHeader;
