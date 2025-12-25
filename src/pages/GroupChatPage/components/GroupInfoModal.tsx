/**
 * GroupInfoModal Component
 * Large detailed view modal for group information
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import type { GroupWithMembers } from '../../../services/groupsService';
import { reportGroup } from '../../../services/chatService';
import { TooltipPortal } from './TooltipPortal';
import { formatDate } from '../utils';

// Skeuomorphic Toggle Component
const SkeuomorphicToggle: React.FC<{
    checked: boolean;
    onChange: () => void;
    activeColor?: string;
}> = ({ checked, onChange, activeColor = '#f3b519' }) => {
    return (
        <div
            onClick={onChange}
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                borderRadius: '0.5em',
                padding: '0.125em',
                backgroundImage: 'linear-gradient(to bottom, #d5d5d5, #e8e8e8)',
                boxShadow: '0 1px 1px rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
                cursor: 'pointer',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                    borderRadius: '0.375em',
                    width: '3em',
                    height: '1.5em',
                    backgroundColor: checked ? activeColor : '#e8e8e8',
                    boxShadow: 'inset 0 0 0.0625em 0.125em rgba(255, 255, 255, 0.2), inset 0 0.0625em 0.125em rgba(0, 0, 0, 0.4)',
                    transition: 'background-color 0.4s linear',
                }}
            >
                <motion.div
                    animate={{ left: checked ? '1.5625em' : '0.0625em' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'absolute',
                        borderRadius: '0.3125em',
                        width: '1.375em',
                        height: '1.375em',
                        backgroundColor: '#e8e8e8',
                        boxShadow: 'inset 0 -0.0625em 0.0625em 0.125em rgba(0, 0, 0, 0.1), inset 0 -0.125em 0.0625em rgba(0, 0, 0, 0.2), inset 0 0.1875em 0.0625em rgba(255, 255, 255, 0.3), 0 0.125em 0.125em rgba(0, 0, 0, 0.5)',
                    }}
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, min-content)',
                            gap: '0.125em',
                            position: 'absolute',
                            margin: '0 auto',
                        }}
                    >
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    borderRadius: '50%',
                                    width: '0.125em',
                                    height: '0.125em',
                                    backgroundImage: 'radial-gradient(circle at 50% 0, #f5f5f5, #c4c4c4)',
                                }}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

// Group Info Modal Component - Large detailed view
const GroupInfoModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    groupInfo: GroupWithMembers | null;
    messageCount: number;
    colors: { cardBg: string; textPrimary: string; textSecondary: string; textMuted: string; accent: string; border: string };
    profile: { id: string; full_name?: string; email?: string } | null;
    showReadReceipts?: boolean;
    onReadReceiptsChange?: (value: boolean) => void;
}> = ({ isOpen, onClose, groupInfo, messageCount, colors, profile, showReadReceipts = true, onReadReceiptsChange }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'media' | 'settings'>('overview');
    const [, /* slideDirection */ setSlideDirection] = useState<1 | -1>(1); // For tab animation direction
    const [isMuted, setIsMuted] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState<string>('');
    const [reportDetails, setReportDetails] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [reportSubmitted, setReportSubmitted] = useState(false);
    const [reportTooltip, setReportTooltip] = useState<DOMRect | null>(null);
    const [leaveTooltip, setLeaveTooltip] = useState<DOMRect | null>(null);
    const tabs = ['overview', 'members', 'media', 'settings'] as const;

    const reportReasons = [
        { id: 'spam', label: 'Spam or misleading', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
        { id: 'harassment', label: 'Harassment or bullying', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
        { id: 'inappropriate', label: 'Inappropriate content', icon: 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' },
        { id: 'cheating', label: 'Academic dishonesty', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
        { id: 'other', label: 'Other', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    ];

    const handleTabChange = (newTab: typeof activeTab) => {
        const currentIndex = tabs.indexOf(activeTab);
        const newIndex = tabs.indexOf(newTab);
        setSlideDirection(newIndex > currentIndex ? 1 : -1);
        setActiveTab(newTab);
    };

    if (!isOpen || !groupInfo) return null;

    const isDarkMode = colors.cardBg !== '#ffffff';
    const categoryConfig: Record<string, { label: string; color: string }> = {
        study: { label: 'Study Group', color: '#3b82f6' },
        project: { label: 'Project Team', color: '#8b5cf6' },
        review: { label: 'Review Session', color: '#10b981' },
        discussion: { label: 'Discussion', color: '#f59e0b' },
    };
    const category = categoryConfig[groupInfo.category] || categoryConfig.study;

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)', zIndex: 1001,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
            }}
        >
            <motion.div
                layout
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{
                    type: 'spring',
                    damping: 28,
                    stiffness: 350,
                    layout: { type: 'spring', damping: 25, stiffness: 200 }
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: colors.cardBg,
                    borderRadius: '20px',
                    width: '100%',
                    maxWidth: '520px',
                    boxShadow: isDarkMode
                        ? '0 25px 50px rgba(0,0,0,0.5)'
                        : '0 25px 50px rgba(0,0,0,0.15)',
                    border: `1px solid ${colors.border}`,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Header with Group Avatar */}
                <div style={{
                    padding: '24px 24px 20px',
                    borderBottom: `1px solid ${colors.border}`,
                    background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                }}>
                    {/* Close Button */}
                    <motion.button
                        whileHover={{ background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: colors.textMuted,
                            transition: 'background 0.15s ease',
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </motion.button>

                    {/* Group Icon & Name */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={{
                            width: 72,
                            height: 72,
                            borderRadius: '18px',
                            background: groupInfo.avatar ? 'transparent' : `linear-gradient(135deg, ${category.color}20 0%, ${category.color}10 100%)`,
                            border: `2px solid ${category.color}30`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            overflow: 'hidden',
                        }}>
                            {groupInfo.avatar ? (
                                <img
                                    src={groupInfo.avatar}
                                    alt={groupInfo.name}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                    }}
                                />
                            ) : (
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={category.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    {groupInfo.category === 'study' && (
                                        <>
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                            <path d="M8 7h8M8 11h6" />
                                        </>
                                    )}
                                    {groupInfo.category === 'project' && (
                                        <>
                                            <polyline points="16 18 22 12 16 6" />
                                            <polyline points="8 6 2 12 8 18" />
                                            <line x1="12" y1="2" x2="12" y2="22" opacity="0.3" />
                                        </>
                                    )}
                                    {groupInfo.category === 'review' && (
                                        <>
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </>
                                    )}
                                    {groupInfo.category === 'discussion' && (
                                        <>
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                            <path d="M8 9h8M8 13h6" />
                                        </>
                                    )}
                                    {!['study', 'project', 'review', 'discussion'].includes(groupInfo.category) && (
                                        <>
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </>
                                    )}
                                </svg>
                            )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h2 style={{
                                margin: '0 0 6px 0',
                                fontSize: '20px',
                                fontWeight: 700,
                                color: colors.textPrimary,
                                lineHeight: 1.3,
                            }}>
                                {groupInfo.name}
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: category.color,
                                    background: `${category.color}15`,
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.3px',
                                }}>
                                    {category.label}
                                </span>
                                {groupInfo.is_private && (
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        color: colors.textMuted,
                                        background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                    }}>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                        Private
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation with Sliding Indicator */}
                <div style={{
                    display: 'flex',
                    gap: '4px',
                    padding: '12px 24px',
                    borderBottom: `1px solid ${colors.border}`,
                    position: 'relative',
                }}>
                    {/* Sliding Background Indicator */}
                    <motion.div
                        layout
                        layoutId="groupInfoTabIndicator"
                        style={{
                            position: 'absolute',
                            top: '12px',
                            height: 'calc(100% - 24px)',
                            borderRadius: '10px',
                            background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                            zIndex: 0,
                        }}
                        initial={false}
                        animate={{
                            left: `calc(24px + ${tabs.indexOf(activeTab)} * (100% - 48px - 12px) / 4 + ${tabs.indexOf(activeTab)} * 4px)`,
                            width: `calc((100% - 48px - 12px) / 4)`,
                        }}
                        transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 30,
                        }}
                    />
                    {tabs.map((tab) => (
                        <motion.button
                            key={tab}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleTabChange(tab)}
                            style={{
                                flex: 1,
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'transparent',
                                color: activeTab === tab ? colors.accent : colors.textMuted,
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'color 0.2s ease',
                                textTransform: 'capitalize',
                                position: 'relative',
                                zIndex: 1,
                            }}
                        >
                            {tab}
                        </motion.button>
                    ))}
                </div>

                {/* Tab Content with Height Animation */}
                <div style={{
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    position: 'relative',
                }}>
                    <AnimatePresence mode="wait" initial={false}>
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{
                                    opacity: { duration: 0.2 },
                                    height: { type: 'spring', damping: 25, stiffness: 200 }
                                }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div style={{ padding: '20px 24px' }}>
                                    {/* Description */}
                                    {groupInfo.description && (
                                        <div style={{ marginBottom: '20px' }}>
                                            <h4 style={{
                                                margin: '0 0 8px 0',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                color: colors.textMuted,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                            }}>
                                                Description
                                            </h4>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '14px',
                                                color: colors.textSecondary,
                                                lineHeight: 1.6,
                                            }}>
                                                {groupInfo.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Stats Grid */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '12px',
                                        marginBottom: '20px',
                                    }}>
                                        {[
                                            { label: 'Members', value: groupInfo.member_count, icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', color: '#3b82f6' },
                                            { label: 'Online Now', value: groupInfo.online_count, icon: 'M22 12h-4l-3 9L9 3l-3 9H2', color: '#22c55e' },
                                            { label: 'Messages', value: messageCount, icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', color: '#8b5cf6' },
                                            { label: 'Max Members', value: groupInfo.max_members, icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', color: '#f59e0b' },
                                        ].map((stat, i) => (
                                            <div key={i} style={{
                                                padding: '16px',
                                                borderRadius: '14px',
                                                background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                                border: `1px solid ${colors.border}`,
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    marginBottom: '8px',
                                                }}>
                                                    <div style={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: '8px',
                                                        background: `${stat.color}15`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={stat.color} strokeWidth="2">
                                                            <path d={stat.icon} />
                                                        </svg>
                                                    </div>
                                                    <span style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 500 }}>
                                                        {stat.label}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '24px', fontWeight: 700, color: colors.textPrimary }}>
                                                    {stat.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Group Details */}
                                    <div style={{
                                        padding: '16px',
                                        borderRadius: '14px',
                                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                        border: `1px solid ${colors.border}`,
                                    }}>
                                        <h4 style={{
                                            margin: '0 0 12px 0',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: colors.textMuted,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                        }}>
                                            Details
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {groupInfo.course_name && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '13px', color: colors.textMuted }}>Course</span>
                                                    <span style={{ fontSize: '13px', color: colors.textPrimary, fontWeight: 500 }}>{groupInfo.course_name}</span>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '13px', color: colors.textMuted }}>Created</span>
                                                <span style={{ fontSize: '13px', color: colors.textPrimary, fontWeight: 500 }}>{formatDate(groupInfo.created_at)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '13px', color: colors.textMuted }}>Your Role</span>
                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    color: groupInfo.user_role === 'owner' ? '#f59e0b' : groupInfo.user_role === 'admin' ? '#8b5cf6' : colors.accent,
                                                    background: groupInfo.user_role === 'owner' ? 'rgba(245, 158, 11, 0.1)' : groupInfo.user_role === 'admin' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    textTransform: 'capitalize',
                                                }}>
                                                    {groupInfo.user_role || 'Member'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Members Tab */}
                        {activeTab === 'members' && (
                            <motion.div
                                key="members"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{
                                    opacity: { duration: 0.2 },
                                    height: { type: 'spring', damping: 25, stiffness: 200 }
                                }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div style={{ padding: '20px 24px' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '16px',
                                    }}>
                                        <span style={{ fontSize: '13px', color: colors.textMuted }}>
                                            {groupInfo.member_count} members • {groupInfo.online_count} online
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {groupInfo.members.map((member) => (
                                            <div key={member.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '12px 14px',
                                                borderRadius: '12px',
                                                background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                                border: `1px solid ${colors.border}`,
                                            }}>
                                                {/* Avatar with Level Badge and Online Status */}
                                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                                    {/* Avatar Circle */}
                                                    <div style={{
                                                        width: 42,
                                                        height: 42,
                                                        borderRadius: '50%',
                                                        background: `linear-gradient(135deg, ${colors.accent}30 0%, ${colors.accent}10 100%)`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '15px',
                                                        fontWeight: 600,
                                                        color: colors.accent,
                                                        overflow: 'hidden',
                                                        border: `2px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                                                    }}>
                                                        {member.user_avatar ? (
                                                            <img
                                                                src={member.user_avatar}
                                                                alt=""
                                                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            member.user_name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    {/* Level Badge - Blue minimalistic */}
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: -5,
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        background: '#3b82f6',
                                                        color: 'white',
                                                        fontSize: '9px',
                                                        fontWeight: 700,
                                                        padding: '2px 6px',
                                                        borderRadius: '8px',
                                                        border: `2px solid ${colors.cardBg}`,
                                                        lineHeight: 1.2,
                                                        whiteSpace: 'nowrap',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                                    }}>
                                                        Lv.{(member.user_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 10) + 1}
                                                    </div>
                                                    {/* Online Status Dot */}
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        right: 0,
                                                        width: 12,
                                                        height: 12,
                                                        borderRadius: '50%',
                                                        background: member.is_online ? '#22c55e' : '#9ca3af',
                                                        border: `2px solid ${colors.cardBg}`,
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                                    }} />
                                                </div>

                                                {/* Info */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        marginBottom: '2px',
                                                    }}>
                                                        <span style={{
                                                            fontSize: '14px',
                                                            fontWeight: 500,
                                                            color: colors.textPrimary,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}>
                                                            {member.user_name}
                                                        </span>
                                                        {member.role !== 'member' && (
                                                            <span style={{
                                                                fontSize: '9px',
                                                                fontWeight: 600,
                                                                color: member.role === 'owner' ? '#f59e0b' : '#8b5cf6',
                                                                background: member.role === 'owner' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                textTransform: 'uppercase',
                                                            }}>
                                                                {member.role}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span style={{ fontSize: '12px', color: colors.textMuted }}>
                                                        {member.is_online ? 'Online' : `Joined ${formatDate(member.joined_at)}`}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Media Tab */}
                        {activeTab === 'media' && (
                            <motion.div
                                key="media"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{
                                    opacity: { duration: 0.2 },
                                    height: { type: 'spring', damping: 25, stiffness: 200 }
                                }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '40px 20px',
                                    color: colors.textMuted,
                                }}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4, marginBottom: '16px' }}>
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <polyline points="21 15 16 10 5 21" />
                                    </svg>
                                    <p style={{ fontSize: '14px', margin: '0 0 4px 0', fontWeight: 500 }}>No shared media yet</p>
                                    <p style={{ fontSize: '12px', margin: 0, opacity: 0.7 }}>Photos and files shared in this group will appear here</p>
                                </div>
                            </motion.div>
                        )}

                        {/* Settings Tab */}
                        {activeTab === 'settings' && (
                            <motion.div
                                key="settings"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{
                                    opacity: { duration: 0.2 },
                                    height: { type: 'spring', damping: 25, stiffness: 200 }
                                }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div style={{ padding: '20px 24px' }}>
                                    {/* Notifications Toggle */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                        border: `1px solid ${colors.border}`,
                                        marginBottom: '12px',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <motion.div
                                                animate={{
                                                    background: isMuted
                                                        ? (isDarkMode ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.1)')
                                                        : (isDarkMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.1)'),
                                                }}
                                                transition={{ duration: 0.3 }}
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: '10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <AnimatePresence mode="wait">
                                                    <motion.svg
                                                        key={isMuted ? 'muted' : 'unmuted'}
                                                        initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                                                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                                        exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                                                        transition={{ duration: 0.25, ease: 'easeOut' }}
                                                        width="18"
                                                        height="18"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke={isMuted ? '#ef4444' : colors.accent}
                                                        strokeWidth="2"
                                                    >
                                                        {isMuted ? (
                                                            <>
                                                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                                                <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
                                                                <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
                                                                <path d="M18 8a6 6 0 0 0-9.33-5" />
                                                                <line x1="1" y1="1" x2="23" y2="23" />
                                                            </>
                                                        ) : (
                                                            <>
                                                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                                            </>
                                                        )}
                                                    </motion.svg>
                                                </AnimatePresence>
                                            </motion.div>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: colors.textPrimary }}>
                                                    Mute Notifications
                                                </p>
                                                <AnimatePresence mode="wait">
                                                    <motion.p
                                                        key={isMuted ? 'muted-text' : 'unmuted-text'}
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -5 }}
                                                        transition={{ duration: 0.2 }}
                                                        style={{ margin: 0, fontSize: '12px', color: colors.textMuted }}
                                                    >
                                                        {isMuted ? 'Notifications are muted' : 'Get notified of new messages'}
                                                    </motion.p>
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                        <SkeuomorphicToggle
                                            checked={isMuted}
                                            onChange={() => setIsMuted(!isMuted)}
                                            activeColor="#ef4444"
                                        />
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                        border: `1px solid ${colors.border}`,
                                        marginBottom: '12px',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <motion.div
                                                animate={{
                                                    background: showReadReceipts
                                                        ? (isDarkMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.1)')
                                                        : (isDarkMode ? 'rgba(107, 114, 128, 0.12)' : 'rgba(107, 114, 128, 0.1)'),
                                                }}
                                                transition={{ duration: 0.3 }}
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: '10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <AnimatePresence mode="wait">
                                                    <motion.svg
                                                        key={showReadReceipts ? 'eye-open' : 'eye-closed'}
                                                        initial={{ opacity: 0, scale: 0.5 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.5 }}
                                                        transition={{ duration: 0.25, ease: 'easeOut' }}
                                                        width="18"
                                                        height="18"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke={showReadReceipts ? colors.accent : '#6b7280'}
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        {showReadReceipts ? (
                                                            <>
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                <circle cx="12" cy="12" r="3" />
                                                            </>
                                                        ) : (
                                                            <>
                                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                                                                <line x1="1" y1="1" x2="23" y2="23" />
                                                            </>
                                                        )}
                                                    </motion.svg>
                                                </AnimatePresence>
                                            </motion.div>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: colors.textPrimary }}>
                                                    Read Receipts
                                                </p>
                                                <AnimatePresence mode="wait">
                                                    <motion.p
                                                        key={showReadReceipts ? 'receipts-on' : 'receipts-off'}
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -5 }}
                                                        transition={{ duration: 0.2 }}
                                                        style={{ margin: 0, fontSize: '12px', color: colors.textMuted }}
                                                    >
                                                        {showReadReceipts ? 'Show who read your messages' : 'Read receipts are hidden'}
                                                    </motion.p>
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                        <SkeuomorphicToggle
                                            checked={showReadReceipts}
                                            onChange={() => onReadReceiptsChange?.(!showReadReceipts)}
                                            activeColor="#3b82f6"
                                        />
                                    </div>

                                    {/* Report Group */}
                                    <div style={{ position: 'relative' }}>
                                        <motion.button
                                            whileHover={{ background: isDarkMode ? 'rgba(251, 191, 36, 0.12)' : 'rgba(251, 191, 36, 0.08)' }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setShowReportModal(true)}
                                            onMouseEnter={(e) => setReportTooltip(e.currentTarget.getBoundingClientRect())}
                                            onMouseLeave={() => setReportTooltip(null)}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '14px 16px',
                                                borderRadius: '12px',
                                                background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                                border: `1px solid ${colors.border}`,
                                                marginBottom: '12px',
                                                cursor: 'pointer',
                                                transition: 'background 0.15s ease',
                                            }}
                                        >
                                            <div style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: '10px',
                                                background: isDarkMode ? 'rgba(251, 191, 36, 0.12)' : 'rgba(251, 191, 36, 0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                                    <line x1="4" y1="22" x2="4" y2="15" />
                                                </svg>
                                            </div>
                                            <div style={{ flex: 1, textAlign: 'left' }}>
                                                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: colors.textPrimary }}>
                                                    Report Group
                                                </p>
                                                <p style={{ margin: 0, fontSize: '12px', color: colors.textMuted }}>
                                                    Report inappropriate content or behavior
                                                </p>
                                            </div>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2">
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        </motion.button>
                                        <AnimatePresence>
                                            {reportTooltip && (
                                                <TooltipPortal
                                                    text="Report this group to teachers"
                                                    buttonRect={reportTooltip}
                                                    placement="right"
                                                    textColor="#1f2937"
                                                    icon={
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                                            <line x1="4" y1="22" x2="4" y2="15" />
                                                        </svg>
                                                    }
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Report Group Modal */}
                                    <AnimatePresence>
                                        {showReportModal && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.15 }}
                                                onClick={() => {
                                                    if (!isSubmittingReport) {
                                                        setShowReportModal(false);
                                                        setReportReason('');
                                                        setReportDetails('');
                                                        setReportSubmitted(false);
                                                    }
                                                }}
                                                style={{
                                                    position: 'fixed',
                                                    inset: 0,
                                                    background: 'rgba(0,0,0,0.5)',
                                                    backdropFilter: 'blur(4px)',
                                                    zIndex: 1002,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: '20px',
                                                }}
                                            >
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{
                                                        background: colors.cardBg,
                                                        borderRadius: '16px',
                                                        width: '100%',
                                                        maxWidth: '420px',
                                                        maxHeight: '85vh',
                                                        boxShadow: isDarkMode
                                                            ? '0 20px 40px rgba(0,0,0,0.4)'
                                                            : '0 20px 40px rgba(0,0,0,0.15)',
                                                        border: `1px solid ${colors.border}`,
                                                        overflow: 'hidden',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                    }}
                                                >
                                                    {reportSubmitted ? (
                                                        /* Success State */
                                                        <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                transition={{ type: 'spring', delay: 0.1 }}
                                                                style={{
                                                                    width: 64,
                                                                    height: 64,
                                                                    borderRadius: '16px',
                                                                    background: isDarkMode ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.08)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    margin: '0 auto 20px',
                                                                }}
                                                            >
                                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                                    <polyline points="22 4 12 14.01 9 11.01" />
                                                                </svg>
                                                            </motion.div>
                                                            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: colors.textPrimary }}>
                                                                Report Submitted
                                                            </h3>
                                                            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: colors.textSecondary, lineHeight: 1.5 }}>
                                                                Thank you for helping keep our community safe. Our team will review your report and take appropriate action.
                                                            </p>
                                                            <motion.button
                                                                whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}
                                                                whileTap={{ scale: 0.98 }}
                                                                onClick={() => {
                                                                    setShowReportModal(false);
                                                                    setReportReason('');
                                                                    setReportDetails('');
                                                                    setReportSubmitted(false);
                                                                }}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
                                                                    color: '#3b82f6',
                                                                    border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                                                                    borderRadius: '10px',
                                                                    fontSize: '14px',
                                                                    fontWeight: 600,
                                                                    cursor: 'pointer',
                                                                }}
                                                            >
                                                                Done
                                                            </motion.button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {/* Header */}
                                                            <div style={{
                                                                padding: '20px 24px 16px',
                                                                borderBottom: `1px solid ${colors.border}`,
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                        <div style={{
                                                                            width: 40,
                                                                            height: 40,
                                                                            borderRadius: '10px',
                                                                            background: isDarkMode ? 'rgba(251, 191, 36, 0.12)' : 'rgba(251, 191, 36, 0.1)',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                        }}>
                                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                                                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                                                                <line x1="4" y1="22" x2="4" y2="15" />
                                                                            </svg>
                                                                        </div>
                                                                        <div>
                                                                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: colors.textPrimary }}>
                                                                                Report Group
                                                                            </h3>
                                                                            <p style={{ margin: 0, fontSize: '12px', color: colors.textMuted }}>
                                                                                {groupInfo.name}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <motion.button
                                                                        whileHover={{ background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        onClick={() => {
                                                                            setShowReportModal(false);
                                                                            setReportReason('');
                                                                            setReportDetails('');
                                                                        }}
                                                                        style={{
                                                                            width: 32,
                                                                            height: 32,
                                                                            borderRadius: '8px',
                                                                            border: 'none',
                                                                            background: 'transparent',
                                                                            cursor: 'pointer',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            color: colors.textMuted,
                                                                        }}
                                                                    >
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                            <line x1="18" y1="6" x2="6" y2="18" />
                                                                            <line x1="6" y1="6" x2="18" y2="18" />
                                                                        </svg>
                                                                    </motion.button>
                                                                </div>
                                                            </div>

                                                            {/* Content */}
                                                            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                                                                {/* Reason Selection */}
                                                                <p style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
                                                                    Why are you reporting this group?
                                                                </p>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                                                                    {reportReasons.map((reason) => (
                                                                        <motion.button
                                                                            key={reason.id}
                                                                            whileHover={{ background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
                                                                            whileTap={{ scale: 0.99 }}
                                                                            onClick={() => setReportReason(reason.id)}
                                                                            style={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '12px',
                                                                                padding: '12px 14px',
                                                                                borderRadius: '10px',
                                                                                background: reportReason === reason.id
                                                                                    ? (isDarkMode ? 'rgba(251, 191, 36, 0.12)' : 'rgba(251, 191, 36, 0.08)')
                                                                                    : (isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                                                                                border: `1px solid ${reportReason === reason.id
                                                                                    ? (isDarkMode ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 191, 36, 0.25)')
                                                                                    : colors.border}`,
                                                                                cursor: 'pointer',
                                                                                transition: 'all 0.15s ease',
                                                                                textAlign: 'left',
                                                                            }}
                                                                        >
                                                                            <div style={{
                                                                                width: 20,
                                                                                height: 20,
                                                                                borderRadius: '50%',
                                                                                border: `2px solid ${reportReason === reason.id ? '#f59e0b' : colors.textMuted}`,
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                flexShrink: 0,
                                                                            }}>
                                                                                {reportReason === reason.id && (
                                                                                    <motion.div
                                                                                        initial={{ scale: 0 }}
                                                                                        animate={{ scale: 1 }}
                                                                                        style={{
                                                                                            width: 10,
                                                                                            height: 10,
                                                                                            borderRadius: '50%',
                                                                                            background: '#f59e0b',
                                                                                        }}
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={reportReason === reason.id ? '#f59e0b' : colors.textMuted} strokeWidth="1.5">
                                                                                <path d={reason.icon} />
                                                                            </svg>
                                                                            <span style={{
                                                                                fontSize: '13px',
                                                                                fontWeight: 500,
                                                                                color: reportReason === reason.id ? '#f59e0b' : colors.textPrimary,
                                                                            }}>
                                                                                {reason.label}
                                                                            </span>
                                                                        </motion.button>
                                                                    ))}
                                                                </div>

                                                                {/* Additional Details */}
                                                                <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
                                                                    Additional details <span style={{ fontWeight: 400, color: colors.textMuted }}>(optional)</span>
                                                                </p>
                                                                <textarea
                                                                    value={reportDetails}
                                                                    onChange={(e) => setReportDetails(e.target.value)}
                                                                    placeholder="Provide more context about the issue..."
                                                                    style={{
                                                                        width: '100%',
                                                                        minHeight: '80px',
                                                                        padding: '12px 14px',
                                                                        borderRadius: '10px',
                                                                        border: `1px solid ${colors.border}`,
                                                                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                                                        color: colors.textPrimary,
                                                                        fontSize: '13px',
                                                                        resize: 'vertical',
                                                                        outline: 'none',
                                                                        fontFamily: 'inherit',
                                                                    }}
                                                                    onFocus={(e) => {
                                                                        e.target.style.borderColor = '#f59e0b';
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        e.target.style.borderColor = colors.border;
                                                                    }}
                                                                />
                                                            </div>

                                                            {/* Footer */}
                                                            <div style={{
                                                                padding: '16px 24px',
                                                                borderTop: `1px solid ${colors.border}`,
                                                                display: 'flex',
                                                                gap: '10px',
                                                            }}>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    onClick={() => {
                                                                        setShowReportModal(false);
                                                                        setReportReason('');
                                                                        setReportDetails('');
                                                                    }}
                                                                    style={{
                                                                        flex: 1,
                                                                        padding: '12px 16px',
                                                                        background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
                                                                        color: '#3b82f6',
                                                                        border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                                                                        borderRadius: '10px',
                                                                        fontSize: '14px',
                                                                        fontWeight: 600,
                                                                        cursor: 'pointer',
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </motion.button>
                                                                <motion.button
                                                                    whileHover={reportReason ? { scale: 1.02, boxShadow: '0 4px 12px rgba(251, 191, 36, 0.25)' } : {}}
                                                                    whileTap={reportReason ? { scale: 0.98 } : {}}
                                                                    disabled={!reportReason || isSubmittingReport}
                                                                    onClick={async () => {
                                                                        if (!reportReason) return;
                                                                        setIsSubmittingReport(true);

                                                                        // Send report to Supabase for teachers/admin dashboard
                                                                        const result = await reportGroup({
                                                                            group_id: groupInfo.id,
                                                                            group_name: groupInfo.name,
                                                                            reporter_id: profile?.id || 'anonymous',
                                                                            reporter_name: profile?.full_name || 'Anonymous User',
                                                                            reporter_email: profile?.email,
                                                                            reason: reportReason as 'spam' | 'harassment' | 'inappropriate' | 'cheating' | 'other',
                                                                            details: reportDetails || undefined,
                                                                        });

                                                                        if (result.success) {
                                                                            setIsSubmittingReport(false);
                                                                            setReportSubmitted(true);
                                                                        } else {
                                                                            console.error('Failed to submit report:', result.error);
                                                                            setIsSubmittingReport(false);
                                                                            // Could show error toast here
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        flex: 1,
                                                                        padding: '12px 16px',
                                                                        background: reportReason
                                                                            ? (isDarkMode ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.08)')
                                                                            : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                                                                        color: reportReason ? '#f59e0b' : colors.textMuted,
                                                                        border: `1px solid ${reportReason
                                                                            ? (isDarkMode ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 191, 36, 0.2)')
                                                                            : colors.border}`,
                                                                        borderRadius: '10px',
                                                                        fontSize: '14px',
                                                                        fontWeight: 600,
                                                                        cursor: reportReason ? 'pointer' : 'not-allowed',
                                                                        opacity: reportReason ? 1 : 0.6,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        gap: '6px',
                                                                    }}
                                                                >
                                                                    {isSubmittingReport ? (
                                                                        <motion.div
                                                                            animate={{ rotate: 360 }}
                                                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                                            style={{ width: 16, height: 16 }}
                                                                        >
                                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                <path d="M21 12a9 9 0 11-6.219-8.56" />
                                                                            </svg>
                                                                        </motion.div>
                                                                    ) : (
                                                                        <>
                                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                                                                <line x1="4" y1="22" x2="4" y2="15" />
                                                                            </svg>
                                                                            Submit Report
                                                                        </>
                                                                    )}
                                                                </motion.button>
                                                            </div>
                                                        </>
                                                    )}
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Leave Group */}
                                    <div style={{ position: 'relative' }}>
                                        <motion.button
                                            whileHover={{ background: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setShowLeaveConfirm(true)}
                                            onMouseEnter={(e) => setLeaveTooltip(e.currentTarget.getBoundingClientRect())}
                                            onMouseLeave={() => setLeaveTooltip(null)}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '14px 16px',
                                                borderRadius: '12px',
                                                background: isDarkMode ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.05)',
                                                border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)'}`,
                                                cursor: 'pointer',
                                                transition: 'background 0.15s ease',
                                            }}
                                        >
                                            <div style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: '10px',
                                                background: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                                    <polyline points="16 17 21 12 16 7" />
                                                    <line x1="21" y1="12" x2="9" y2="12" />
                                                </svg>
                                            </div>
                                            <div style={{ flex: 1, textAlign: 'left' }}>
                                                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#ef4444' }}>
                                                    Leave Group
                                                </p>
                                                <p style={{ margin: 0, fontSize: '12px', color: colors.textMuted }}>
                                                    You can rejoin anytime if the group is public
                                                </p>
                                            </div>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2">
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        </motion.button>
                                        <AnimatePresence>
                                            {leaveTooltip && (
                                                <TooltipPortal
                                                    text={groupInfo.is_private ? "You'll need an invite to rejoin" : "You can rejoin this public group anytime"}
                                                    buttonRect={leaveTooltip}
                                                    placement="right"
                                                    textColor="#1f2937"
                                                    icon={
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                                            <polyline points="16 17 21 12 16 7" />
                                                            <line x1="21" y1="12" x2="9" y2="12" />
                                                        </svg>
                                                    }
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Leave Group Confirmation Modal */}
                                    <AnimatePresence>
                                        {showLeaveConfirm && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.15 }}
                                                onClick={() => setShowLeaveConfirm(false)}
                                                style={{
                                                    position: 'fixed',
                                                    inset: 0,
                                                    background: 'rgba(0,0,0,0.5)',
                                                    backdropFilter: 'blur(4px)',
                                                    zIndex: 1002,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: '20px',
                                                }}
                                            >
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{
                                                        background: colors.cardBg,
                                                        borderRadius: '16px',
                                                        width: '100%',
                                                        maxWidth: '360px',
                                                        boxShadow: isDarkMode
                                                            ? '0 20px 40px rgba(0,0,0,0.4)'
                                                            : '0 20px 40px rgba(0,0,0,0.15)',
                                                        border: `1px solid ${colors.border}`,
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    {/* Warning Icon & Title */}
                                                    <div style={{
                                                        padding: '24px 24px 16px',
                                                        textAlign: 'center',
                                                    }}>
                                                        <div style={{
                                                            width: 56,
                                                            height: 56,
                                                            borderRadius: '14px',
                                                            background: isDarkMode ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            margin: '0 auto 16px',
                                                        }}>
                                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                                                <line x1="12" y1="9" x2="12" y2="13" />
                                                                <line x1="12" y1="17" x2="12.01" y2="17" />
                                                            </svg>
                                                        </div>
                                                        <h3 style={{
                                                            margin: '0 0 8px 0',
                                                            fontSize: '18px',
                                                            fontWeight: 600,
                                                            color: colors.textPrimary,
                                                        }}>
                                                            Leave Group?
                                                        </h3>
                                                        <p style={{
                                                            margin: 0,
                                                            fontSize: '14px',
                                                            color: colors.textSecondary,
                                                            lineHeight: 1.5,
                                                        }}>
                                                            Are you sure you want to leave <strong style={{ color: colors.textPrimary }}>{groupInfo.name}</strong>?
                                                            {groupInfo.is_private
                                                                ? " You'll need an invite to rejoin this private group."
                                                                : " You can rejoin anytime since this is a public group."
                                                            }
                                                        </p>
                                                    </div>

                                                    {/* Actions */}
                                                    <div style={{
                                                        padding: '16px 24px 24px',
                                                        display: 'flex',
                                                        gap: '10px',
                                                    }}>
                                                        {/* Cancel Button - Same style as New Group button */}
                                                        <motion.button
                                                            whileHover={{
                                                                scale: 1.02,
                                                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                                                            }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => setShowLeaveConfirm(false)}
                                                            style={{
                                                                flex: 1,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '6px',
                                                                padding: '12px 16px',
                                                                background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
                                                                color: '#3b82f6',
                                                                border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                                                                borderRadius: '10px',
                                                                fontSize: '14px',
                                                                fontWeight: 600,
                                                                cursor: 'pointer',
                                                                transition: 'all 0.15s ease',
                                                            }}
                                                        >
                                                            Cancel
                                                        </motion.button>

                                                        {/* Leave Button - Red variant */}
                                                        <motion.button
                                                            whileHover={{
                                                                scale: 1.02,
                                                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                                                            }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => {
                                                                // TODO: Implement leave group logic
                                                                setShowLeaveConfirm(false);
                                                                onClose();
                                                            }}
                                                            style={{
                                                                flex: 1,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '6px',
                                                                padding: '12px 16px',
                                                                background: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
                                                                color: '#ef4444',
                                                                border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
                                                                borderRadius: '10px',
                                                                fontSize: '14px',
                                                                fontWeight: 600,
                                                                cursor: 'pointer',
                                                                transition: 'all 0.15s ease',
                                                            }}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                                                <polyline points="16 17 21 12 16 7" />
                                                                <line x1="21" y1="12" x2="9" y2="12" />
                                                            </svg>
                                                            Leave
                                                        </motion.button>
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer - Simple Done Button */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: `1px solid ${colors.border}`,
                }}>
                    <motion.button
                        whileHover={{ background: isDarkMode ? 'rgba(59, 130, 246, 0.9)' : 'rgba(59, 130, 246, 0.9)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: 'none',
                            background: colors.accent,
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background 0.15s ease',
                        }}
                    >
                        Done
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};

export { GroupInfoModal };