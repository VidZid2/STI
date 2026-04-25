/**
 * ChatHeader - Top header component for GroupChat
 * Extracted from GroupChatPage.tsx for modularity
 */

import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from './Tooltip';
import { calculateLevel, xpToNextLevel } from '../utils';
import type { GroupWithMembers } from '../../../../services/groupsService';

interface ChatHeaderProps {
    groupInfo: GroupWithMembers | null;
    groupId: string | undefined;
    userXP: number;
    userStreak: number;
    isDarkMode: boolean;
    colors: {
        bg: string;
        cardBg: string;
        border: string;
        textPrimary: string;
        textSecondary: string;
        textMuted: string;
        accent: string;
    };
    showSearchPanel: boolean;
    onSearchToggle: () => void;
    onLeaderboardOpen: () => void;
    onGroupInfoOpen: () => void;
    presenceIndicator?: React.ReactNode;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    groupInfo,
    groupId,
    userXP,
    userStreak,
    isDarkMode,
    colors,
    showSearchPanel,
    onSearchToggle,
    onLeaderboardOpen,
    onGroupInfoOpen,
    presenceIndicator,
}) => {
    const navigate = useNavigate();

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{
                background: 'var(--dashboard-surface)',
                borderBottom: `1px solid var(--border-color)`,
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexShrink: 0,
                zIndex: 100,
            }}
        >
            <Tooltip text="Back to Groups">
                <motion.button
                    whileHover={{ scale: 1.05, background: 'var(--bg-hover)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/dashboard')}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        border: `1.5px solid ${'var(--bg-hover)'}`,
                        background: 'var(--bg-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#3b82f6',
                        transition: 'background 0.15s ease',
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </motion.button>
            </Tooltip>

            <div style={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: groupInfo?.avatar
                    ? 'transparent'
                    : `linear-gradient(135deg, ${groupInfo?.color || 'var(--accent-color)'}20 0%, ${groupInfo?.color || 'var(--accent-color)'}10 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
            }}>
                {groupInfo?.avatar ? (
                    <img
                        src={groupInfo.avatar}
                        alt={groupInfo.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={groupInfo?.color || 'var(--accent-color)'} strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Row 1: Group Name + Visibility Badge */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    marginBottom: '3px',
                }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.3,
                    }}>
                        {groupInfo?.name || 'Group Chat'}
                    </h1>
                    {presenceIndicator}
                </div>
                {/* Row 2: Member Count + Online Count */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    lineHeight: 1,
                }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                    </svg>
                    <span>{groupInfo?.member_count || 0} members</span>
                    <span style={{ 
                        margin: '0 2px',
                        color: 'var(--text-muted)',
                    }}>•</span>
                    <span style={{ color: '#22c55e', fontWeight: 500 }}>
                        {groupInfo?.online_count || 0} online
                    </span>
                </div>
            </div>

            {/* XP & Level Display - Compact Minimalistic */}
            <Tooltip text={`${xpToNextLevel(userXP)} XP to Level ${calculateLevel(userXP) + 1}`} placement="below">
                <motion.div
                    whileHover={{ scale: 1.03, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)' }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 10px',
                        borderRadius: '10px',
                        background: 'var(--bg-primary)',
                        border: `1.5px solid #3b82f6`,
                        cursor: 'pointer',
                    }}
                >
                    {/* Streak - Compact with Better Flame */}
                    <motion.div
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <motion.div
                            animate={{
                                y: [0, -1.5, 0],
                                scale: [1, 1.05, 1],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: 'easeInOut'
                            }}
                            style={{
                                width: 26,
                                height: 26,
                                borderRadius: '7px',
                                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.18) 0%, rgba(249, 115, 22, 0.12) 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: 'var(--shadow-md)',
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M20 15C20 19.2545 17.3819 21.1215 15.3588 21.751C14.9274 21.8853 14.6438 21.3823 14.9019 21.0115C15.7823 19.7462 16.8 17.8159 16.8 16C16.8 14.0494 15.1559 11.7465 13.8721 10.3261C13.5786 10.0014 13.0667 10.2163 13.0507 10.6537C12.9976 12.1029 12.7689 14.0418 11.7828 15.5614C11.6241 15.806 11.2872 15.8262 11.1063 15.5975C10.7982 15.2079 10.4901 14.7265 10.182 14.3462C10.016 14.1414 9.71604 14.1386 9.52461 14.3198C8.77825 15.0265 7.73333 16.1286 7.73333 17.5C7.73333 18.4893 8.20479 19.7206 8.69077 20.6741C8.91147 21.1071 8.50204 21.615 8.08142 21.3715C6.24558 20.3088 4 18.1069 4 15C4 11.8536 8.31029 7.49484 9.95605 3.37694C10.2157 2.72714 11.0161 2.42181 11.5727 2.84585C14.9439 5.41391 20 10.3781 20 15Z"
                                    stroke="#f97316"
                                    strokeWidth="1.5"
                                    fill="url(#streakFlameGradientHeader)"
                                />
                                <defs>
                                    <linearGradient id="streakFlameGradientHeader" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#fdba74" stopOpacity="0.6" />
                                        <stop offset="1" stopColor="#f97316" stopOpacity="0.3" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </motion.div>
                        <motion.span
                            style={{
                                fontSize: '14px',
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            {userStreak}
                        </motion.span>
                    </motion.div>

                    <div style={{ width: 1, height: 16, background: 'var(--bg-hover)', borderRadius: '1px' }} />

                    {/* Level Badge - Compact */}
                    <motion.span
                        whileHover={{ scale: 1.05 }}
                        style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#3b82f6',
                            background: 'var(--dashboard-surface)',
                            padding: '2px 6px',
                            borderRadius: '5px',
                        }}
                    >
                        Lv.{calculateLevel(userXP)}
                    </motion.span>

                    {/* XP Progress Bar - Compact */}
                    <div style={{
                        width: 40,
                        height: 4,
                        borderRadius: '2px',
                        background: 'rgba(255,255,255,0.1)',
                        overflow: 'hidden',
                    }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(userXP % 100)}%` }}
                            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                            style={{
                                height: '100%',
                                background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                                borderRadius: '2px',
                            }}
                        />
                    </div>
                </motion.div>
            </Tooltip>

            <div style={{ display: 'flex', gap: '6px' }}>
                {/* Leaderboard Button - Minimalistic */}
                <Tooltip text="Leaderboard">
                    <motion.button
                        whileHover={{ scale: 1.05, background: 'var(--bg-hover)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onLeaderboardOpen}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            border: `1.5px solid #3b82f6`,
                            background: 'var(--bg-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#3b82f6',
                            transition: 'background 0.15s ease',
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M15 21H9V12.6C9 12.2686 9.26863 12 9.6 12H14.4C14.7314 12 15 12.2686 15 12.6V21Z" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M20.4 21H15V18.1C15 17.7686 15.2686 17.5 15.6 17.5H20.4C20.7314 17.5 21 17.7686 21 18.1V20.4C21 20.7314 20.7314 21 20.4 21Z" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 21V16.1C9 15.7686 8.73137 15.5 8.4 15.5H3.6C3.26863 15.5 3 15.7686 3 16.1V20.4C3 20.7314 3.26863 21 3.6 21H9Z" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M10.8056 5.11325L11.7147 3.1856C11.8314 2.93813 12.1686 2.93813 12.2853 3.1856L13.1944 5.11325L15.2275 5.42427C15.4884 5.46418 15.5923 5.79977 15.4035 5.99229L13.9326 7.4917L14.2797 9.60999C14.3243 9.88202 14.0515 10.0895 13.8181 9.96099L12 8.96031L10.1819 9.96099C9.94851 10.0895 9.67568 9.88202 9.72026 9.60999L10.0674 7.4917L8.59651 5.99229C8.40766 5.79977 8.51163 5.46418 8.77248 5.42427L10.8056 5.11325Z" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(59, 130, 246, 0.15)" />
                        </svg>
                    </motion.button>
                </Tooltip>
                <Tooltip text="Group Info">
                    <motion.button
                        whileHover={{ scale: 1.05, background: 'var(--bg-hover)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onGroupInfoOpen}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            border: `1.5px solid #3b82f6`,
                            background: 'var(--bg-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#3b82f6',
                            transition: 'background 0.15s ease',
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 11V16M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21ZM12.0498 8V8.1L11.9502 8.1002V8H12.0498Z" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </motion.button>
                </Tooltip>
                <Tooltip text="Search Messages">
                    <motion.button
                        whileHover={{ scale: 1.05, background: 'var(--bg-hover)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onSearchToggle}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            border: `1.5px solid #3b82f6`,
                            background: showSearchPanel
                                ? ('var(--dashboard-surface)')
                                : ('var(--bg-primary)'),
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#3b82f6',
                            transition: 'background 0.15s ease',
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="M21 21l-4.35-4.35" />
                        </svg>
                    </motion.button>
                </Tooltip>
                <Tooltip text="Focus Mode">
                    <motion.button
                        whileHover={{ scale: 1.05, background: 'rgba(139, 92, 246, 0.1)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(`/focus/${groupId}`)}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            border: `1.5px solid #8b5cf6`,
                            background: 'var(--bg-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#8b5cf6',
                            transition: 'background 0.15s ease',
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="4" />
                            <line x1="12" y1="2" x2="12" y2="4" />
                            <line x1="12" y1="20" x2="12" y2="22" />
                            <line x1="2" y1="12" x2="4" y2="12" />
                            <line x1="20" y1="12" x2="22" y2="12" />
                        </svg>
                    </motion.button>
                </Tooltip>
            </div>
        </motion.header>
    );
};

export default ChatHeader;
