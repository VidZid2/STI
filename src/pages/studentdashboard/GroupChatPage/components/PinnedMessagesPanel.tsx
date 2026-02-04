/**
 * PinnedMessagesPanel Component
 * Collapsible panel showing pinned messages
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ChatMessage } from '../../../../services/chatService';
import type { ChatColors, MemberStats } from '../types';
import { formatTime } from '../utils';

interface PinnedMessagesPanelProps {
    pinnedMessages: Set<string>;
    messages: ChatMessage[];
    memberStats: MemberStats[];
    groupMembers?: Array<{
        user_id: string;
        user_name: string;
        user_avatar?: string;
        is_online?: boolean;
    }>;
    isExpanded: boolean;
    isDarkMode: boolean;
    colors: ChatColors;
    onToggleExpand: () => void;
    onUnpin: (messageId: string) => void;
    onJumpToMessage: (messageId: string) => void;
}

export const PinnedMessagesPanel: React.FC<PinnedMessagesPanelProps> = ({
    pinnedMessages,
    messages,
    memberStats,
    groupMembers,
    isExpanded,
    isDarkMode,
    colors,
    onToggleExpand,
    onUnpin,
    onJumpToMessage,
}) => {
    if (pinnedMessages.size === 0) return null;

    const pinnedMessagesList = messages.filter((msg) => pinnedMessages.has(msg.id));

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{
                    overflow: 'hidden',
                    borderBottom: `1px solid ${colors.border}`,
                    background: isDarkMode ? 'rgba(239, 68, 68, 0.02)' : '#fff',
                }}
            >
                <div style={{ padding: '8px 20px' }}>
                    {/* Header */}
                    <div
                        onClick={onToggleExpand}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="#ef4444"
                                stroke="#ef4444"
                                strokeWidth="2"
                            >
                                <path d="M12 17v5" />
                                <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1z" />
                                <path d="M8 5V3" />
                                <path d="M16 5V3" />
                            </svg>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444' }}>
                                {pinnedMessages.size} Pinned{' '}
                                {pinnedMessages.size === 1 ? 'Message' : 'Messages'}
                            </span>
                        </div>
                        <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={colors.textMuted}
                                strokeWidth="2"
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </motion.div>
                    </div>

                    {/* Pinned Messages List */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px',
                                        marginTop: '8px',
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                    }}
                                >
                                    {pinnedMessagesList.map((msg) => {
                                        const memberInfo = groupMembers?.find(
                                            (m) => m.user_id === msg.user_id
                                        );
                                        const pinnedMemberStats = memberStats.find(
                                            (m) => m.odId === msg.user_id
                                        );
                                        const pinnedUserLevel = pinnedMemberStats?.level || 1;
                                        const pinnedIsOnline = memberInfo?.is_online ?? false;

                                        return (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5 }}
                                                whileHover={{
                                                    background: isDarkMode
                                                        ? 'rgba(255,255,255,0.03)'
                                                        : 'rgba(0,0,0,0.02)',
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '8px 10px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                }}
                                                onClick={() => onJumpToMessage(msg.id)}
                                            >
                                                {/* Avatar with Level Badge and Online Status */}
                                                <div
                                                    style={{
                                                        position: 'relative',
                                                        flexShrink: 0,
                                                        width: 32,
                                                        height: 38,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: '50%',
                                                            background: `linear-gradient(135deg, ${colors.accent}30 0%, ${colors.accent}10 100%)`,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            color: colors.accent,
                                                            overflow: 'hidden',
                                                            border: `2px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                                                        }}
                                                    >
                                                        {memberInfo?.user_avatar ? (
                                                            <img
                                                                src={memberInfo.user_avatar}
                                                                alt=""
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    borderRadius: '50%',
                                                                    objectFit: 'cover',
                                                                }}
                                                            />
                                                        ) : (
                                                            msg.user_name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div
                                                        style={{
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
                                                            border: `2px solid ${colors.cardBg}`,
                                                            lineHeight: 1.2,
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        Lv.{pinnedUserLevel}
                                                    </div>
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            right: -2,
                                                            width: 9,
                                                            height: 9,
                                                            borderRadius: '50%',
                                                            background: pinnedIsOnline ? '#22c55e' : '#9ca3af',
                                                            border: `2px solid ${colors.cardBg}`,
                                                        }}
                                                    />
                                                </div>

                                                {/* Content */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                color: colors.textPrimary,
                                                            }}
                                                        >
                                                            {msg.user_name}
                                                        </span>
                                                        <span
                                                            style={{
                                                                fontSize: '10px',
                                                                color: colors.textMuted,
                                                            }}
                                                        >
                                                            {formatTime(msg.created_at)}
                                                        </span>
                                                    </div>
                                                    <p
                                                        style={{
                                                            margin: 0,
                                                            fontSize: '12px',
                                                            color: colors.textSecondary,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </p>
                                                </div>

                                                {/* Unpin button */}
                                                <motion.button
                                                    whileHover={{ scale: 1.1, color: '#ef4444' }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onUnpin(msg.id);
                                                    }}
                                                    style={{
                                                        width: 20,
                                                        height: 20,
                                                        borderRadius: '4px',
                                                        border: 'none',
                                                        background: 'transparent',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: colors.textMuted,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <svg
                                                        width="12"
                                                        height="12"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                    >
                                                        <line x1="18" y1="6" x2="6" y2="18" />
                                                        <line x1="6" y1="6" x2="18" y2="18" />
                                                    </svg>
                                                </motion.button>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
