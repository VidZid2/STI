/**
 * MessageActions Component
 * Hover toolbar with action buttons for messages (react, thread, save, pin, edit, delete, helpful)
 */

import React from 'react';
import { motion } from 'motion/react';
import { Tooltip } from './Tooltip';
import type { ChatColors } from '../types';
import type { ChatMessage } from '../../../../services/chatService';

interface MessageActionsProps {
    message: ChatMessage;
    isOwn: boolean;
    isHovered: boolean;
    
    
    helpfulData?: { count: number; voted: boolean };
    showReactionsFor: string | null;
    onToggleReactions: (messageId: string | null) => void;
    onOpenThread: (message: ChatMessage) => void;
    onToggleBookmark: (messageId: string) => void;
    onTogglePin: (messageId: string) => void;
    onStartEdit: (message: ChatMessage) => void;
    onDeleteConfirm: (messageId: string) => void;
    onToggleHelpful: (messageId: string) => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
    message,
    isOwn,
    isHovered,
    
    
    timestamp,
    isEdited,
    isBookmarked,
    isPinned,
    helpfulData,
    showReactionsFor,
    onToggleReactions,
    onOpenThread,
    onToggleBookmark,
    onTogglePin,
    onStartEdit,
    onDeleteConfirm,
    onToggleHelpful }) => {
    const buttonBaseStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        borderRadius: '6px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        transition: 'all 0.2s ease' };

    const getButtonColor = (isActive: boolean, activeColor?: string) => {
        if (isActive && activeColor) return activeColor;
        return isOwn ? 'rgba(255,255,255,0.8)' : ('var(--bg-hover)');
    };

    return (
        <motion.div
            initial={false}
            animate={{
                height: isHovered ? 'auto' : 0,
                opacity: isHovered ? 1 : 0,
                marginTop: isHovered ? 6 : 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px' }}
        >
            {/* Left side: Timestamp */}
            <span style={{
                fontSize: '10px',
                color: isOwn ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>
                {timestamp}{isEdited && ' • edited'}
            </span>

            {/* Right side: Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {/* React */}
                <Tooltip text="Add reaction" placement="below">
                    <motion.button
                        whileHover={{
                            scale: 1.1,
                            background: isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onToggleReactions(showReactionsFor === message.id ? null : message.id)}
                        style={{
                            ...buttonBaseStyle,
                            color: getButtonColor(false) }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                            <line x1="9" y1="9" x2="9.01" y2="9" />
                            <line x1="15" y1="9" x2="15.01" y2="9" />
                        </svg>
                    </motion.button>
                </Tooltip>

                {/* Thread */}
                <Tooltip text="View Thread" placement="below">
                    <motion.button
                        whileHover={{
                            scale: 1.1,
                            background: isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(59, 130, 246, 0.1)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onOpenThread(message)}
                        style={{
                            ...buttonBaseStyle,
                            color: isOwn ? 'rgba(255,255,255,0.8)' : '#3b82f6' }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            <path d="M8 9h8" />
                            <path d="M8 13h6" />
                        </svg>
                    </motion.button>
                </Tooltip>

                {/* Save/Bookmark */}
                <Tooltip text={isBookmarked ? "Saved" : "Save message"} placement="below">
                    <motion.button
                        whileHover={{
                            scale: 1.1,
                            background: isBookmarked
                                ? (isOwn ? 'rgba(255,255,255,0.2)' : `var(--accent-color)20`)
                                : (isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)') }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onToggleBookmark(message.id)}
                        style={{
                            ...buttonBaseStyle,
                            background: isBookmarked ? (isOwn ? 'rgba(255,255,255,0.1)' : `var(--accent-color)10`) : 'transparent',
                            color: isBookmarked ? (isOwn ? '#fff' : 'var(--accent-color)') : getButtonColor(false) }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                    </motion.button>
                </Tooltip>

                {/* Pin */}
                <Tooltip text={isPinned ? "Unpin message" : "Pin message"} placement="below">
                    <motion.button
                        whileHover={{
                            scale: 1.1,
                            background: isPinned
                                ? (isOwn ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)')
                                : (isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)') }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onTogglePin(message.id)}
                        style={{
                            ...buttonBaseStyle,
                            background: isPinned ? (isOwn ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)') : 'transparent',
                            color: isPinned ? '#ef4444' : getButtonColor(false) }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 17v5" />
                            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1z" />
                            <path d="M8 5V3" />
                            <path d="M16 5V3" />
                        </svg>
                    </motion.button>
                </Tooltip>

                {/* Edit - only for own messages */}
                {isOwn && (
                    <Tooltip text="Edit" placement="below">
                        <motion.button
                            whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.15)' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onStartEdit(message)}
                            style={{
                                ...buttonBaseStyle,
                                color: 'rgba(255,255,255,0.8)' }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                        </motion.button>
                    </Tooltip>
                )}

                {/* Delete - only for own messages */}
                {isOwn && (
                    <Tooltip text="Delete" placement="below">
                        <motion.button
                            whileHover={{ scale: 1.1, background: 'rgba(239, 68, 68, 0.2)' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onDeleteConfirm(message.id)}
                            style={{
                                ...buttonBaseStyle,
                                color: 'rgba(255,255,255,0.8)' }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                        </motion.button>
                    </Tooltip>
                )}

                {/* Helpful - only for others' messages */}
                {!isOwn && (
                    <Tooltip text={helpfulData?.voted ? "You found this helpful" : "Mark as helpful"} placement="below">
                        <motion.button
                            whileHover={{
                                scale: 1.1,
                                background: helpfulData?.voted ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0,0,0,0.08)' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onToggleHelpful(message.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px',
                                height: 24,
                                padding: '0 8px',
                                borderRadius: '6px',
                                border: 'none',
                                background: helpfulData?.voted ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                                cursor: 'pointer',
                                color: helpfulData?.voted ? '#22c55e' : ('var(--bg-hover)'),
                                fontSize: '11px',
                                fontWeight: 600,
                                transition: 'all 0.2s ease' }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill={helpfulData?.voted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                            </svg>
                            {helpfulData?.count ?? 0}
                        </motion.button>
                    </Tooltip>
                )}
            </div>
        </motion.div>
    );
};
