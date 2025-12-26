/**
 * MessageBubble Component - Individual chat message bubble
 * Extracted from GroupChatPage.tsx for modularity
 * 
 * This is a SIMPLIFIED version of the message bubble that serves as
 * a foundation for future refactoring. The full feature set (action buttons,
 * read receipts, file attachments, etc.) is still in GroupChatPage.tsx
 * and can be migrated incrementally.
 * 
 * Features included:
 * - Date separators
 * - Avatar and user info display  
 * - Message content (text)
 * - Basic reactions display
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ChatMessage } from '../../../services/chatService';
import type { MessageReaction, MemberStats } from '../types';
import { STUDY_REACTIONS } from '../constants';
import { formatTime, formatDateSeparator, shouldShowDateSeparator } from '../utils';
import { Tooltip } from './Tooltip';

// Simplified props interface for MessageBubble
export interface MessageBubbleProps {
    // Message data
    message: ChatMessage;
    index: number;
    messages: ChatMessage[];

    // User info
    profile: {
        studentId?: string;
        id?: string;
        name?: string;
        avatar?: string;
    } | null;

    // Group info
    groupInfo: {
        members?: Array<{
            user_id: string;
            name: string;
            avatar?: string;
            is_online?: boolean;
            role?: 'owner' | 'admin' | 'member';
        }>;
    } | null;
    memberStats: MemberStats[];

    // Theme
    isDarkMode: boolean;
    colors: {
        bg: string;
        cardBg: string;
        border: string;
        textPrimary: string;
        textSecondary: string;
        textMuted: string;
        accent: string;
        own: string;
        ownDark?: string;
    };

    // State from parent
    messageReactions: Record<string, MessageReaction[]>;
    hoveredMessageId: string | null;
    showReactionsFor: string | null;
    highlightedMessageId: string | null;

    // Callbacks
    onHover: (messageId: string | null) => void;
    onReaction: (messageId: string, emoji: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    index,
    messages,
    profile,
    groupInfo,
    memberStats,
    isDarkMode,
    colors,
    messageReactions,
    hoveredMessageId,
    showReactionsFor,
    highlightedMessageId,
    onHover,
    onReaction,
}) => {
    // Derived values
    const isOwn = message.user_id === profile?.studentId || message.user_id === profile?.id;
    const prevMessage = messages[index - 1];
    const nextMessage = messages[index + 1];

    // Get member info from group members (real data)
    const memberInfo = groupInfo?.members?.find(m => m.user_id === message.user_id);
    const memberStats_user = memberStats.find(m => m.odId === message.user_id);
    const userLevel = memberStats_user?.level || 1;
    const userStreak_msg = memberStats_user?.streak || 0;
    const isOnline = memberInfo?.is_online ?? false;
    const memberRole = memberInfo?.role;

    // Date separator logic
    const showDateSeparator_flag = shouldShowDateSeparator(message, prevMessage);

    // Message grouping logic
    const isFirstInGroup = !prevMessage || prevMessage.user_id !== message.user_id || showDateSeparator_flag;
    const isLastInGroup = !nextMessage || nextMessage.user_id !== message.user_id || shouldShowDateSeparator(nextMessage, message);
    void isLastInGroup; // Suppress unused warning
    const showAvatar = isFirstInGroup;
    const showUserName = isFirstInGroup && !isOwn;
    const marginTop = isFirstInGroup ? 12 : 2;

    const reactions = messageReactions[message.id] || [];
    const isHighlighted = highlightedMessageId === message.id;

    // Suppress unused variable warning
    void hoveredMessageId;

    return (
        <React.Fragment>
            {/* Date Separator */}
            {showDateSeparator_flag && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        padding: '20px 0 12px 0',
                    }}
                >
                    {/* Left line */}
                    <div style={{
                        flex: 1,
                        height: '1px',
                        background: isDarkMode
                            ? 'linear-gradient(to left, rgba(255,255,255,0.08), transparent)'
                            : 'linear-gradient(to left, rgba(0,0,0,0.06), transparent)',
                    }} />
                    {/* Date text */}
                    <span style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        color: colors.textMuted,
                        letterSpacing: '0.2px',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                    }}>
                        {formatDateSeparator(message.created_at)}
                    </span>
                    {/* Right line */}
                    <div style={{
                        flex: 1,
                        height: '1px',
                        background: isDarkMode
                            ? 'linear-gradient(to right, rgba(255,255,255,0.08), transparent)'
                            : 'linear-gradient(to right, rgba(0,0,0,0.06), transparent)',
                    }} />
                </motion.div>
            )}

            {/* Message Container */}
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{
                    opacity: 1,
                    y: 0,
                    backgroundColor: isHighlighted ? (isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)') : 'transparent',
                }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                    duration: 0.15,
                    ease: 'easeOut',
                    layout: { duration: 0.2 },
                    backgroundColor: { duration: 0.3 },
                }}
                onMouseEnter={() => onHover(message.id)}
                onMouseLeave={() => onHover(null)}
                style={{
                    display: 'flex',
                    flexDirection: isOwn ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: '8px',
                    marginTop,
                    padding: isHighlighted ? '8px' : '0',
                    borderRadius: isHighlighted ? '12px' : '0',
                    position: 'relative',
                }}
            >
                {/* Avatar - Only show for first message in group */}
                {showAvatar ? (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        style={{
                            position: 'relative',
                            width: 32,
                            height: 32,
                            borderRadius: '10px',
                            overflow: 'hidden',
                            background: memberInfo?.avatar
                                ? 'transparent'
                                : `linear-gradient(135deg, ${colors.accent}30 0%, ${colors.accent}10 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            border: `1.5px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}`,
                        }}
                    >
                        {memberInfo?.avatar ? (
                            <img
                                src={memberInfo.avatar}
                                alt={memberInfo.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <span style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: colors.accent,
                            }}>
                                {(memberInfo?.name || message.user_id).charAt(0).toUpperCase()}
                            </span>
                        )}
                        {/* Online indicator */}
                        {isOnline && (
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: -1,
                                    right: -1,
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    background: '#22c55e',
                                    border: `2px solid ${colors.cardBg}`,
                                }}
                            />
                        )}
                    </motion.div>
                ) : (
                    <div style={{ width: 32, flexShrink: 0 }} />
                )}

                {/* Message Content Area */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isOwn ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                    position: 'relative',
                }}>
                    {/* User Info Row */}
                    {showUserName && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '4px',
                        }}>
                            <span style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: colors.textSecondary,
                            }}>
                                {memberInfo?.name || 'Unknown User'}
                            </span>
                            {/* Role badge */}
                            {memberRole && memberRole !== 'member' && (
                                <span style={{
                                    fontSize: '9px',
                                    fontWeight: 600,
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    background: memberRole === 'owner' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                    color: memberRole === 'owner' ? '#ef4444' : '#3b82f6',
                                    textTransform: 'uppercase',
                                }}>
                                    {memberRole}
                                </span>
                            )}
                            {/* Level badge */}
                            <span style={{
                                fontSize: '9px',
                                fontWeight: 600,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                background: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                                color: '#8b5cf6',
                            }}>
                                Lv.{userLevel}
                            </span>
                            {/* Streak badge */}
                            {userStreak_msg > 0 && (
                                <span style={{
                                    fontSize: '9px',
                                    fontWeight: 600,
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    background: isDarkMode ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.1)',
                                    color: '#f59e0b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                }}>
                                    🔥 {userStreak_msg}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Message Bubble */}
                    <div style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isOwn ? 'flex-end' : 'flex-start',
                    }}>
                        <motion.div
                            style={{
                                padding: '10px 14px',
                                borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                background: isOwn
                                    ? `linear-gradient(135deg, ${colors.own} 0%, ${colors.ownDark || colors.own} 100%)`
                                    : colors.cardBg,
                                border: isOwn ? 'none' : `1px solid ${colors.border}`,
                                maxWidth: '100%',
                                wordBreak: 'break-word',
                            }}
                        >
                            {/* Text content */}
                            {message.content && (
                                <p style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    lineHeight: 1.5,
                                    color: isOwn ? '#fff' : colors.textPrimary,
                                    whiteSpace: 'pre-wrap',
                                }}>
                                    {message.content}
                                </p>
                            )}

                            {/* Timestamp */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: isOwn ? 'flex-end' : 'flex-start',
                                gap: '4px',
                                marginTop: '4px',
                            }}>
                                <span style={{
                                    fontSize: '10px',
                                    color: isOwn ? 'rgba(255,255,255,0.7)' : colors.textMuted,
                                }}>
                                    {formatTime(message.created_at)}
                                </span>
                            </div>
                        </motion.div>

                        {/* Reactions display */}
                        <AnimatePresence initial={false}>
                            {reactions.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                    style={{
                                        display: 'flex',
                                        gap: '4px',
                                        marginTop: '4px',
                                        flexWrap: 'wrap',
                                        justifyContent: isOwn ? 'flex-end' : 'flex-start',
                                    }}
                                >
                                    {reactions.map((reaction) => (
                                        <motion.button
                                            key={reaction.emoji}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{ duration: 0.15, ease: 'easeOut' }}
                                            onClick={() => onReaction(message.id, reaction.emoji)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '3px',
                                                padding: '2px 6px',
                                                borderRadius: '10px',
                                                border: `1px solid ${colors.border}`,
                                                background: reaction.users.includes(profile?.id || '')
                                                    ? `${colors.accent}15`
                                                    : colors.cardBg,
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                            }}
                                        >
                                            <span>{reaction.emoji}</span>
                                            <span style={{ fontSize: '10px', color: colors.textSecondary }}>
                                                {reaction.users.length}
                                            </span>
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Quick reactions picker */}
                        <AnimatePresence>
                            {showReactionsFor === message.id && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                    style={{
                                        position: 'absolute',
                                        top: -44,
                                        [isOwn ? 'right' : 'left']: 0,
                                        display: 'flex',
                                        gap: '4px',
                                        background: colors.cardBg,
                                        borderRadius: '12px',
                                        padding: '6px 8px',
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                        border: `1px solid ${colors.border}`,
                                        zIndex: 10,
                                    }}
                                >
                                    {STUDY_REACTIONS.map((reaction) => (
                                        <Tooltip key={reaction.emoji} text={reaction.label} placement="above">
                                            <motion.button
                                                whileHover={{ scale: 1.2, y: -2 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => onReaction(message.id, reaction.emoji)}
                                                style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    cursor: 'pointer',
                                                    fontSize: '18px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                {reaction.emoji}
                                            </motion.button>
                                        </Tooltip>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </React.Fragment>
    );
};

export default MessageBubble;
