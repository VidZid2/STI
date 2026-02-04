/**
 * MessageBubble Component
 * Renders individual chat messages with all features:
 * - Avatar with level badge and online status
 * - Message content with code blocks and @mentions
 * - GIF display, link previews, file attachments
 * - Reactions, thread indicators, read receipts
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ChatMessage, MessageType } from '../../../../services/chatService';
import type { MemberStats, MessageReaction, ChatColors } from '../types';
import { STUDY_REACTIONS } from '../constants';
import { formatTime } from '../utils';
import { FilePreviewCard } from './FilePreviewCard';
import { LinkPreviewCard, extractUrls } from './LinkPreviewCard';
import { CodeBlock, extractCodeBlocks } from './CodeBlock';
import { Tooltip } from './Tooltip';
import { MessageActions } from './MessageActions';

interface MessageBubbleProps {
    message: ChatMessage;
    messages: ChatMessage[]; // All messages for thread/read receipt calculations
    isOwn: boolean;
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
    showAvatar: boolean;
    showUserName: boolean;

    // User Context
    userLevel: number;
    userStreak: number;
    memberRole?: string;
    memberStats?: MemberStats; // Not used yet but kept for future
    isOnline: boolean;
    profile: any;

    // UI State
    isHovered: boolean;
    isHighlighted: boolean;
    isEditing: boolean;
    editingContent: string;
    showReactionsFor: string | null;
    isPinned: boolean;
    isBookmarked: boolean;
    helpfulData?: { count: number; voted: boolean };
    messageType?: MessageType;
    reactions: MessageReaction[];
    messageReadBy?: Record<string, { id: string; name: string; avatar?: string }[]>; // Not used yet but kept for future
    showReadReceipts?: boolean; // Not used yet but kept for future

    // Theme
    isDarkMode: boolean;
    colors: ChatColors;

    // Actions
    onHover: (id: string | null) => void;
    onReactionToggle: (id: string | null) => void;
    onReactionAdd: (messageId: string, emoji: string) => void;
    onThreadOpen: (message: ChatMessage) => void;
    onToggleBookmark: (messageId: string) => void;
    onTogglePin: (messageId: string) => void;
    onStartEdit: (message: ChatMessage) => void;
    onEditChange: (content: string) => void;
    onEditSave: () => void;
    onEditCancel: () => void;
    onDeleteConfirm: (messageId: string) => void;
    onToggleHelpful: (messageId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    messages,
    isOwn,
    isFirstInGroup,
    isLastInGroup,
    showAvatar,
    showUserName,
    userLevel,
    userStreak,
    memberRole,
    isOnline,
    profile,
    isHovered,
    isHighlighted,
    isEditing,
    editingContent,
    showReactionsFor,
    isPinned,
    isBookmarked,
    helpfulData,
    messageType,
    reactions,
    // showReadReceipts, // Not used yet
    isDarkMode,
    colors,
    onHover,
    onReactionToggle,
    onReactionAdd,
    onThreadOpen,
    onToggleBookmark,
    onTogglePin,
    onStartEdit,
    onEditChange,
    onEditSave,
    onEditCancel,
    onDeleteConfirm,
    onToggleHelpful,
}) => {
    // Message Type configuration
    const msgType = messageType || 'general';
    const typeConfig: Record<MessageType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
        urgent: {
            label: 'Urgent',
            color: isOwn ? 'rgba(255,255,255,0.95)' : '#ef4444',
            bg: isOwn ? 'rgba(255,255,255,0.2)' : 'rgba(239, 68, 68, 0.12)',
            icon: (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            ),
        },
        question: {
            label: 'Question',
            color: isOwn ? 'rgba(255,255,255,0.9)' : '#f59e0b',
            bg: isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(245, 158, 11, 0.1)',
            icon: (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            ),
        },
        answer: {
            label: 'Answer',
            color: isOwn ? 'rgba(255,255,255,0.9)' : '#22c55e',
            bg: isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(34, 197, 94, 0.1)',
            icon: (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            ),
        },
        resource: {
            label: 'Resource',
            color: isOwn ? 'rgba(255,255,255,0.9)' : '#3b82f6',
            bg: isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(59, 130, 246, 0.1)',
            icon: (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
            ),
        },
        general: { label: '', color: '', bg: '', icon: null },
    };

    const config = typeConfig[msgType];
    const marginTop = isFirstInGroup ? 12 : 2;

    // Calculate border radius based on message grouping
    const getBorderRadius = () => {
        if (isOwn) {
            // Own messages: tail on right
            if (isFirstInGroup && isLastInGroup) return '16px 16px 4px 16px';
            if (isFirstInGroup) return '16px 16px 4px 16px';
            if (isLastInGroup) return '16px 4px 4px 16px';
            return '16px 4px 4px 16px';
        } else {
            // Others' messages: tail on left
            if (isFirstInGroup && isLastInGroup) return '16px 16px 16px 4px';
            if (isFirstInGroup) return '16px 16px 16px 4px';
            if (isLastInGroup) return '4px 16px 16px 4px';
            return '4px 16px 16px 4px';
        }
    };

    // Render message content with code blocks and @mention highlighting
    const renderMessageContent = () => {
        const { parts: codeParts, hasCode } = extractCodeBlocks(message.content);

        return codeParts.map((part, partIndex) => {
            if (part.type === 'code') {
                return (
                    <CodeBlock
                        key={`code-${partIndex}`}
                        code={part.content}
                        language={part.language}
                        isOwn={isOwn}
                        isDarkMode={isDarkMode}
                    />
                );
            }

            // Render text with @mention highlighting
            const content = part.content;
            const mentionRegex = /@(\w+)/g;
            const textParts: React.ReactNode[] = [];
            let lastIndex = 0;
            let match;
            let key = 0;

            while ((match = mentionRegex.exec(content)) !== null) {
                if (match.index > lastIndex) {
                    textParts.push(content.slice(lastIndex, match.index));
                }
                const mentionName = match[1];
                const isSelfMention = profile?.full_name?.toLowerCase().includes(mentionName.toLowerCase());
                textParts.push(
                    <span
                        key={key++}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            background: isOwn
                                ? 'rgba(255,255,255,0.2)'
                                : (isSelfMention ? 'rgba(59, 130, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)'),
                            color: isOwn
                                ? 'rgba(255,255,255,0.95)'
                                : (isSelfMention ? '#3b82f6' : '#8b5cf6'),
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                        title={`View ${mentionName}'s profile`}
                    >
                        @{mentionName}
                    </span>
                );
                lastIndex = match.index + match[0].length;
            }
            if (lastIndex < content.length) {
                textParts.push(content.slice(lastIndex));
            }

            return (
                <p key={`text-${partIndex}`} style={{
                    margin: hasCode && partIndex > 0 ? '8px 0 0 0' : 0,
                    fontSize: '14px',
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                }}>
                    {textParts.length > 0 ? textParts : content}
                </p>
            );
        });
    };

    // Get reply count and unique authors for thread indicator
    const replyCount = messages.filter(m => m.reply_to === message.id).length;
    const replyMessages = messages.filter(m => m.reply_to === message.id);
    const uniqueAuthors = [...new Set(replyMessages.map(m => m.user_name))].slice(0, 4);

    return (
        <motion.div
            id={`message-${message.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{
                opacity: 1,
                y: 0,
                boxShadow: isHighlighted
                    ? `0 0 0 2px ${colors.accent}, 0 4px 20px ${colors.accent}30`
                    : 'none',
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
                display: 'flex',
                flexDirection: isOwn ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: '8px',
                position: 'relative',
                marginTop,
                borderRadius: '12px',
                padding: isHighlighted ? '4px' : '0',
                margin: isHighlighted ? '-4px' : '0',
            }}
        >
            {/* Avatar with Level Badge and Online Status */}
            {!isOwn && (
                <div
                    style={{
                        position: 'relative',
                        flexShrink: 0,
                        width: 36,
                        height: 36,
                        visibility: showAvatar ? 'visible' : 'hidden',
                    }}
                    title={`Level ${userLevel}`}
                >
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
                        {message.user_avatar ? (
                            <img
                                src={message.user_avatar}
                                alt=""
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                            />
                        ) : (
                            message.user_name.charAt(0).toUpperCase()
                        )}
                    </div>
                    {/* Level Badge */}
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
                        Lv.{userLevel}
                    </div>
                    {/* Online Status Dot */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: isOnline ? '#22c55e' : '#9ca3af',
                        border: `2px solid ${colors.cardBg}`,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    }} />
                </div>
            )}

            <div style={{ maxWidth: '70%', width: 'fit-content', position: 'relative' }}
                onMouseEnter={() => onHover(message.id)}
                onMouseLeave={() => { onHover(null); onReactionToggle(null); }}
            >
                {/* Message Bubble */}
                <div
                    style={{
                        padding: '10px 14px',
                        borderRadius: getBorderRadius(),
                        background: isOwn
                            ? `linear-gradient(135deg, ${colors.accent} 0%, #2563eb 100%)`
                            : colors.cardBg,
                        color: isOwn ? '#fff' : colors.textPrimary,
                        boxShadow: isOwn
                            ? `0 2px 8px ${colors.accent}30`
                            : `0 1px 3px ${colors.border}`,
                        cursor: 'default',
                        position: 'relative',
                        border: isPinned
                            ? '2px solid #ef4444'
                            : (isBookmarked ? `2px solid ${colors.accent}` : 'none'),
                    }}
                >
                    {/* Bookmark Indicator */}
                    {isBookmarked && (
                        <div
                            style={{
                                position: 'absolute',
                                top: -1,
                                right: 8,
                                color: colors.accent,
                            }}
                            title="Bookmarked"
                        >
                            <svg width="12" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                    )}

                    {/* User Name with Badges */}
                    {showUserName && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '5px',
                            margin: '0 0 4px 0',
                        }}>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: colors.accent,
                            }}>
                                {message.user_name}
                            </span>
                            {/* Study Streak Badge */}
                            {userStreak > 0 && (
                                <span
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        fontSize: '9px',
                                        color: '#f97316',
                                        padding: '2px 5px',
                                        borderRadius: '4px',
                                        background: isDarkMode ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.1)',
                                        fontWeight: 500,
                                    }}
                                    title={`${userStreak} day study streak!`}
                                >
                                    🔥 {userStreak}d
                                </span>
                            )}
                            {/* Role Badge */}
                            {(memberRole === 'owner' || memberRole === 'admin') && (
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '9px',
                                    color: memberRole === 'owner' ? '#f59e0b' : '#8b5cf6',
                                    padding: '2px 5px',
                                    borderRadius: '4px',
                                    background: memberRole === 'owner'
                                        ? (isDarkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)')
                                        : (isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)'),
                                    fontWeight: 500,
                                }}>
                                    ⭐ {memberRole === 'owner' ? 'Owner' : 'Admin'}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Message Type Indicator - AI Powered */}
                    {msgType !== 'general' && config && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginBottom: '4px',
                        }}>
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '9px',
                                    color: config.color,
                                    padding: '2px 5px',
                                    borderRadius: '4px',
                                    background: config.bg,
                                    fontWeight: 500,
                                }}
                                title={`AI classified as ${config.label}`}
                            >
                                {config.icon}
                                {config.label}
                            </span>
                        </div>
                    )}

                    {/* Message Content - Edit Mode or Display Mode */}
                    {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <textarea
                                value={editingContent}
                                onChange={(e) => onEditChange(e.target.value)}
                                autoFocus
                                style={{
                                    width: '100%',
                                    minHeight: '60px',
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    border: `1px solid ${isOwn ? 'rgba(255,255,255,0.3)' : colors.border}`,
                                    background: isOwn ? 'rgba(255,255,255,0.1)' : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'),
                                    color: isOwn ? '#fff' : colors.textPrimary,
                                    fontSize: '14px',
                                    lineHeight: 1.5,
                                    resize: 'none',
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        onEditSave();
                                    }
                                    if (e.key === 'Escape') {
                                        onEditCancel();
                                    }
                                }}
                            />
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onEditCancel}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: isOwn ? 'rgba(255,255,255,0.15)' : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                                        color: isOwn ? 'rgba(255,255,255,0.9)' : colors.textSecondary,
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onEditSave}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: isOwn ? 'rgba(255,255,255,0.25)' : colors.accent,
                                        color: '#fff',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Save
                                </motion.button>
                            </div>
                        </div>
                    ) : (
                        !message.content.startsWith('[GIF]') && renderMessageContent()
                    )}

                    {/* GIF Display */}
                    {message.content.startsWith('[GIF]') && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                borderRadius: '12px',
                                overflow: 'hidden',
                                maxWidth: '280px',
                                marginTop: '4px',
                            }}
                        >
                            <img
                                src={message.content.replace('[GIF] ', '')}
                                alt="GIF"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    display: 'block',
                                    borderRadius: '12px',
                                }}
                                loading="lazy"
                            />
                        </motion.div>
                    )}

                    {/* Link Previews */}
                    {(() => {
                        const urls = extractUrls(message.content);
                        if (urls.length === 0) return null;
                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {urls.slice(0, 3).map((url, idx) => (
                                    <LinkPreviewCard
                                        key={`${message.id}-link-${idx}`}
                                        url={url}
                                        isOwn={isOwn}
                                        isDarkMode={isDarkMode}
                                        colors={colors}
                                    />
                                ))}
                            </div>
                        );
                    })()}

                    {/* File/Image Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            marginTop: '4px',
                        }}>
                            {message.attachments.map((attachment) => (
                                <FilePreviewCard
                                    key={attachment.id}
                                    attachment={attachment}
                                    isOwn={isOwn}
                                    isDarkMode={isDarkMode}
                                    colors={colors}
                                />
                            ))}
                        </div>
                    )}

                    {/* Message Actions */}
                    <MessageActions
                        message={message}
                        isOwn={isOwn}
                        isHovered={isHovered}
                        isDarkMode={isDarkMode}
                        colors={colors}
                        timestamp={formatTime(message.created_at)}
                        isEdited={message.is_edited || false}
                        isBookmarked={isBookmarked}
                        isPinned={isPinned}
                        helpfulData={helpfulData}
                        showReactionsFor={showReactionsFor}
                        onToggleReactions={onReactionToggle}
                        onOpenThread={onThreadOpen}
                        onToggleBookmark={onToggleBookmark}
                        onTogglePin={onTogglePin}
                        onStartEdit={onStartEdit}
                        onDeleteConfirm={onDeleteConfirm}
                        onToggleHelpful={onToggleHelpful}
                    />
                </div>

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
                                    onClick={() => onReactionAdd(message.id, reaction.emoji)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        padding: '2px 6px',
                                        borderRadius: '10px',
                                        border: `1px solid ${colors.border}`,
                                        background: reaction.users.includes(profile?.id)
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

                {/* Reply Thread Indicator */}
                {replyCount > 0 && (
                    <motion.button
                        initial={false}
                        whileHover={{ scale: 1.02, background: isDarkMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)', borderColor: '#3b82f6' }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        onClick={() => onThreadOpen(message)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '6px',
                            padding: '6px 12px',
                            borderRadius: '10px',
                            border: `1.5px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                            background: isDarkMode ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.03)',
                            cursor: 'pointer',
                            width: 'fit-content',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {/* Thread icon */}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            <path d="M8 9h8" />
                            <path d="M8 13h6" />
                        </svg>
                        {/* Stacked avatars */}
                        <div style={{ display: 'flex', marginRight: '-4px' }}>
                            {uniqueAuthors.map((author, idx) => (
                                <motion.div
                                    key={author}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: '6px',
                                        background: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                                        border: `1.5px solid ${colors.cardBg}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '9px',
                                        fontWeight: 600,
                                        color: '#3b82f6',
                                        marginLeft: idx > 0 ? '-6px' : 0,
                                        zIndex: uniqueAuthors.length - idx,
                                    }}
                                >
                                    {author.charAt(0)}
                                </motion.div>
                            ))}
                        </div>
                        {/* Reply count and text */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#3b82f6',
                            }}>
                                {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                            </span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </div>
                    </motion.button>
                )}

                {/* Read Receipts - TODO: Extract to ReadReceipts component */}
                {/* For now, read receipts are handled in the main GroupChatPage */}

                {/* Study reactions picker */}
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
                                        onClick={() => onReactionAdd(message.id, reaction.emoji)}
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
                                            fontSize: '18px',
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
        </motion.div>
    );
};
