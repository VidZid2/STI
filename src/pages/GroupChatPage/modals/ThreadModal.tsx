/**
 * Thread Modal Component
 * Displays message thread with replies - Minimalistic Professional Design
 */

import React, { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import type { ModalColors } from './types';
import type { ThreadReply } from '../types';
import type { ChatMessage } from '../../../services/chatService';
import { formatTimeRelative } from '../utils';

interface ThreadModalProps {
    isOpen: boolean;
    onClose: () => void;
    parentMessage: ChatMessage | null;
    allMessages: ChatMessage[];
    colors: ModalColors;
    currentUserId: string;
    onSendReply: (content: string) => void;
}

export const ThreadModal: React.FC<ThreadModalProps> = ({ 
    isOpen, onClose, parentMessage, allMessages, colors, currentUserId, onSendReply 
}) => {
    const [replyContent, setReplyContent] = useState('');
    const [hoveredReply, setHoveredReply] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const repliesEndRef = useRef<HTMLDivElement>(null);
    
    if (!isOpen || !parentMessage) return null;
    
    const isDarkMode = colors.cardBg !== '#ffffff';
    
    const replies: ThreadReply[] = useMemo(() => {
        if (!parentMessage) return [];
        return allMessages
            .filter(m => m.reply_to === parentMessage.id)
            .map(m => ({
                id: m.id,
                user_id: m.user_id,
                user_name: m.user_name,
                user_avatar: m.user_avatar,
                content: m.content,
                created_at: m.created_at,
                reactions: m.reactions,
            }))
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }, [parentMessage, allMessages]);
    
    const handleSendReply = async () => {
        if (!replyContent.trim() || isSending) return;
        setIsSending(true);
        onSendReply(replyContent.trim());
        setReplyContent('');
        setTimeout(() => repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
        setIsSending(false);
    };
    
    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(8px)', zIndex: 1001,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: colors.cardBg, borderRadius: '14px',
                    width: '100%', maxWidth: '480px', maxHeight: '85vh',
                    boxShadow: isDarkMode ? '0 25px 50px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.1)',
                    border: '1.5px solid #3b82f6', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <motion.div whileHover={{ scale: 1.05 }} style={{
                            width: 34, height: 34, borderRadius: '10px',
                            border: '1.5px solid #3b82f6',
                            background: isDarkMode ? 'rgba(30, 41, 59, 1)' : '#ffffff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                <path d="M8 9h8" /><path d="M8 13h6" />
                            </svg>
                        </motion.div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>Thread</h3>
                            <p style={{ margin: 0, fontSize: '11px', color: colors.textMuted }}>
                                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                            </p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        style={{
                            width: 30, height: 30, borderRadius: '8px',
                            border: '1.5px solid #3b82f6',
                            background: isDarkMode ? 'rgba(30, 41, 59, 1)' : '#ffffff',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#3b82f6',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </motion.button>
                </div>
                
                {/* Parent Message */}
                <div style={{
                    padding: '14px 18px',
                    borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                    background: isDarkMode ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.03)',
                }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <motion.div whileHover={{ scale: 1.05 }} style={{
                            width: 36, height: 36, borderRadius: '10px',
                            background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                            border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', fontWeight: 600, color: '#3b82f6', flexShrink: 0,
                        }}>
                            {parentMessage.user_name.charAt(0).toUpperCase()}
                        </motion.div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>{parentMessage.user_name}</span>
                                <span style={{ fontSize: '11px', color: colors.textMuted }}>{formatTimeRelative(parentMessage.created_at)}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary, lineHeight: 1.5, wordBreak: 'break-word' }}>
                                {parentMessage.content}
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Replies List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px', minHeight: '150px', maxHeight: '300px' }}>
                    <AnimatePresence>
                        {replies.map((reply, index) => {
                            const isOwn = reply.user_id === currentUserId;
                            const isHovered = hoveredReply === reply.id;
                            return (
                                <motion.div
                                    key={reply.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ delay: index * 0.03, duration: 0.2 }}
                                    onHoverStart={() => setHoveredReply(reply.id)}
                                    onHoverEnd={() => setHoveredReply(null)}
                                    style={{
                                        display: 'flex', gap: '10px', padding: '10px 12px', marginBottom: '6px', borderRadius: '10px',
                                        background: isHovered ? (isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)') : 'transparent',
                                        border: isOwn ? `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'}` : '1px solid transparent',
                                    }}
                                >
                                    <motion.div whileHover={{ scale: 1.05 }} style={{
                                        width: 32, height: 32, borderRadius: '9px',
                                        background: isOwn ? (isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)') : (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                                        border: `1px solid ${isOwn ? (isDarkMode ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)') : 'transparent'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '12px', fontWeight: 600, color: isOwn ? '#3b82f6' : colors.textSecondary, flexShrink: 0,
                                    }}>
                                        {reply.user_name.charAt(0).toUpperCase()}
                                    </motion.div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 500, color: isOwn ? '#3b82f6' : colors.textPrimary }}>
                                                {isOwn ? 'You' : reply.user_name}
                                            </span>
                                            <span style={{ fontSize: '10px', color: colors.textMuted }}>{formatTimeRelative(reply.created_at)}</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '12.5px', color: colors.textSecondary, lineHeight: 1.45, wordBreak: 'break-word' }}>
                                            {reply.content}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    {replies.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '32px 20px', color: colors.textMuted }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: '12px', border: '1.5px solid #3b82f6',
                                background: isDarkMode ? 'rgba(30, 41, 59, 1)' : '#ffffff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px',
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>
                            <p style={{ fontSize: '12px', margin: 0, fontWeight: 500 }}>No replies yet</p>
                            <p style={{ fontSize: '11px', margin: '4px 0 0' }}>Be the first to reply</p>
                        </motion.div>
                    )}
                    <div ref={repliesEndRef} />
                </div>
                
                {/* Reply Input */}
                <div style={{
                    padding: '14px 18px',
                    borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                    background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                        <textarea
                            ref={inputRef}
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                            placeholder="Reply to thread..."
                            rows={1}
                            style={{
                                flex: 1, padding: '10px 14px', borderRadius: '10px',
                                border: '1.5px solid #3b82f6',
                                background: isDarkMode ? 'rgba(30, 41, 59, 1)' : '#ffffff',
                                color: colors.textPrimary, fontSize: '13px', resize: 'none', outline: 'none',
                                fontFamily: 'inherit', lineHeight: 1.4, minHeight: '40px', maxHeight: '100px',
                            }}
                        />
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSendReply}
                            disabled={!replyContent.trim() || isSending}
                            style={{
                                width: 40, height: 40, borderRadius: '10px', border: 'none',
                                background: replyContent.trim() ? '#3b82f6' : (isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'),
                                color: replyContent.trim() ? '#ffffff' : '#3b82f6',
                                cursor: replyContent.trim() ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}
                        >
                            {isSending ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </svg>
                                </motion.div>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            )}
                        </motion.button>
                    </div>
                    <p style={{ margin: '8px 0 0', fontSize: '10px', color: colors.textMuted, textAlign: 'center' }}>
                        Press Enter to send • Shift+Enter for new line
                    </p>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};
