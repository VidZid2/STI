/**
 * Group Chat Page - Minimalistic real-time chat interface
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import {
    fetchGroupMessages,
    sendMessage,
    subscribeToMessages,
    // formatMessageTime, // Available for future use
    type ChatMessage,
} from '../services/chatService';
import { getProfile } from '../services/profileService';
import { fetchGroups, type GroupWithMembers } from '../services/groupsService';

// Tooltip Portal Component - renders tooltip at correct position
const TooltipPortal: React.FC<{
    text: string;
    buttonRect: DOMRect | null;
    placement?: 'above' | 'below';
}> = ({ text, buttonRect, placement = 'below' }) => {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ top: number; left: number; arrowLeft: number } | null>(null);

    useEffect(() => {
        setPosition(null);
        if (buttonRect) {
            requestAnimationFrame(() => {
                if (tooltipRef.current) {
                    const tooltipRect = tooltipRef.current.getBoundingClientRect();
                    const buttonCenterX = buttonRect.left + buttonRect.width / 2;
                    let left = buttonCenterX - tooltipRect.width / 2;
                    let arrowLeft = tooltipRect.width / 2;
                    
                    // Prevent tooltip from going off-screen on the left
                    const minLeft = 8;
                    if (left < minLeft) {
                        arrowLeft = buttonCenterX - minLeft;
                        left = minLeft;
                    }
                    
                    // Prevent tooltip from going off-screen on the right
                    const maxRight = window.innerWidth - 8;
                    if (left + tooltipRect.width > maxRight) {
                        const newLeft = maxRight - tooltipRect.width;
                        arrowLeft = buttonCenterX - newLeft;
                        left = newLeft;
                    }
                    
                    // Calculate top position based on placement
                    const top = placement === 'above' 
                        ? buttonRect.top - tooltipRect.height - 8
                        : buttonRect.bottom + 8;
                    
                    setPosition({
                        top,
                        left,
                        arrowLeft,
                    });
                }
            });
        }
    }, [buttonRect, placement]);

    if (!buttonRect) return null;

    const isAbove = placement === 'above';

    return createPortal(
        <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: isAbove ? 6 : -6, scale: 0.95 }}
            animate={{ opacity: position ? 1 : 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isAbove ? 6 : -6, scale: 0.95 }}
            transition={{ 
                duration: 0.2, 
                ease: [0.4, 0, 0.2, 1]
            }}
            style={{
                position: 'fixed',
                top: position?.top ?? -9999,
                left: position?.left ?? -9999,
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                color: '#3b82f6',
                fontSize: '11px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                zIndex: 99999,
                pointerEvents: 'none',
            }}
        >
            {/* Arrow outline - slightly larger, positioned behind */}
            <div style={{
                position: 'absolute',
                ...(isAbove ? { bottom: -6 } : { top: -6 }),
                left: position?.arrowLeft ?? '50%',
                transform: 'translateX(-50%)',
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                ...(isAbove 
                    ? { borderTop: '5px solid rgba(0, 0, 0, 0.08)' }
                    : { borderBottom: '5px solid rgba(0, 0, 0, 0.08)' }
                ),
            }} />
            {/* Arrow fill - on top */}
            <div style={{
                position: 'absolute',
                ...(isAbove ? { bottom: -4 } : { top: -4 }),
                left: position?.arrowLeft ?? '50%',
                transform: 'translateX(-50%)',
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                ...(isAbove 
                    ? { borderTop: '4px solid rgba(255, 255, 255, 0.95)' }
                    : { borderBottom: '4px solid rgba(255, 255, 255, 0.95)' }
                ),
            }} />
            {text}
        </motion.div>,
        document.body
    );
};

// Tooltip Component - wraps children and shows tooltip on hover
const Tooltip: React.FC<{
    text: string;
    children: React.ReactNode;
    placement?: 'above' | 'below';
}> = ({ text, children, placement = 'below' }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

    const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
        // Get the actual button element (first child) for accurate positioning
        const button = e.currentTarget.querySelector('button') || e.currentTarget.firstElementChild as HTMLElement;
        if (button) {
            setButtonRect(button.getBoundingClientRect());
        } else {
            setButtonRect(e.currentTarget.getBoundingClientRect());
        }
        setShowTooltip(true);
    };

    const handleMouseLeave = () => {
        setShowTooltip(false);
        setButtonRect(null);
    };

    return (
        <>
            <span onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                {children}
            </span>
            <AnimatePresence>
                {showTooltip && <TooltipPortal text={text} buttonRect={buttonRect} placement={placement} />}
            </AnimatePresence>
        </>
    );
};

const GroupChatPage: React.FC = () => {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [groupInfo, setGroupInfo] = useState<GroupWithMembers | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const isDarkMode = false; // Can be connected to settings

    const colors = {
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
        cardBg: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        textPrimary: isDarkMode ? '#f1f5f9' : '#1e293b',
        textSecondary: isDarkMode ? '#94a3b8' : '#64748b',
        textMuted: isDarkMode ? '#64748b' : '#94a3b8',
        accent: '#3b82f6',
    };

    // Load profile and messages
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const userProfile = await getProfile();
                setProfile(userProfile);

                if (groupId) {
                    const msgs = await fetchGroupMessages(groupId);
                    setMessages(msgs);
                    
                    // Fetch actual group info
                    const groups = await fetchGroups();
                    const group = groups.find(g => g.id === groupId);
                    if (group) {
                        setGroupInfo(group);
                    }
                }
            } catch (error) {
                console.error('Error loading chat:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [groupId]);

    // Subscribe to new messages
    useEffect(() => {
        if (!groupId) return;

        const unsubscribe = subscribeToMessages(groupId, (newMsg) => {
            setMessages((prev) => [...prev, newMsg]);
        });

        return unsubscribe;
    }, [groupId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle send message
    const handleSend = useCallback(async () => {
        if (!newMessage.trim() || !groupId || !profile || isSending) return;

        setIsSending(true);
        const content = newMessage.trim();
        setNewMessage('');

        const sentMessage = await sendMessage(
            groupId,
            profile.id,
            profile.full_name || 'Anonymous',
            profile.avatar_url,
            content
        );

        if (sentMessage) {
            setMessages((prev) => [...prev, sentMessage]);
        }

        setIsSending(false);
        inputRef.current?.focus();
    }, [newMessage, groupId, profile, isSending]);

    // Handle key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Quick emoji reactions
    const quickEmojis = ['👍', '❤️', '😂', '🎉', '🔥', '👏'];

    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: colors.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{
                        width: 40,
                        height: 40,
                        border: `3px solid ${colors.border}`,
                        borderTopColor: colors.accent,
                        borderRadius: '50%',
                    }}
                />
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: colors.bg,
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{
                    background: colors.cardBg,
                    borderBottom: `1px solid ${colors.border}`,
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                }}
            >
                <Tooltip text="Back to Groups">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/dashboard')}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            border: 'none',
                            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: colors.textSecondary,
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
                        : `linear-gradient(135deg, ${groupInfo?.color || colors.accent}20 0%, ${groupInfo?.color || colors.accent}10 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                }}>
                    {groupInfo?.avatar ? (
                        <img 
                            src={groupInfo.avatar} 
                            alt={groupInfo.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={groupInfo?.color || colors.accent} strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    )}
                </div>

                <div style={{ flex: 1 }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: '15px',
                        fontWeight: 600,
                        color: colors.textPrimary,
                    }}>
                        {groupInfo?.name || 'Group Chat'}
                    </h1>
                    <p style={{
                        margin: 0,
                        fontSize: '12px',
                        color: colors.textMuted,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}>
                        <span>{groupInfo?.member_count || 0} members</span>
                        <span style={{ color: '#22c55e' }}>• {groupInfo?.online_count || 0} online</span>
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <Tooltip text="Group Info">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '10px',
                                border: 'none',
                                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: colors.textSecondary,
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4M12 8h.01" />
                            </svg>
                        </motion.button>
                    </Tooltip>
                    <Tooltip text="Search Messages">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '10px',
                                border: 'none',
                                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: colors.textSecondary,
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                        </motion.button>
                    </Tooltip>
                </div>
            </motion.header>

            {/* Messages Area */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
            }}>
                <AnimatePresence>
                    {messages.map((message, index) => {
                        const isOwn = message.user_id === profile?.id;
                        const showAvatar = index === 0 || messages[index - 1]?.user_id !== message.user_id;

                        return (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                    display: 'flex',
                                    flexDirection: isOwn ? 'row-reverse' : 'row',
                                    alignItems: 'flex-end',
                                    gap: '8px',
                                }}
                            >
                                {/* Avatar */}
                                {!isOwn && (
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '10px',
                                        background: showAvatar 
                                            ? `linear-gradient(135deg, ${colors.accent}30 0%, ${colors.accent}10 100%)`
                                            : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: colors.accent,
                                        flexShrink: 0,
                                        visibility: showAvatar ? 'visible' : 'hidden',
                                    }}>
                                        {message.user_avatar ? (
                                            <img 
                                                src={message.user_avatar} 
                                                alt="" 
                                                style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            message.user_name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                )}

                                {/* Message Bubble */}
                                <motion.div
                                    whileHover={{ scale: 1.01 }}
                                    style={{
                                        maxWidth: '70%',
                                        padding: '10px 14px',
                                        borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                        background: isOwn 
                                            ? `linear-gradient(135deg, ${colors.accent} 0%, #2563eb 100%)`
                                            : colors.cardBg,
                                        color: isOwn ? '#fff' : colors.textPrimary,
                                        boxShadow: isOwn 
                                            ? `0 2px 8px ${colors.accent}30`
                                            : `0 1px 3px ${colors.border}`,
                                        cursor: 'default',
                                    }}
                                >
                                    {!isOwn && showAvatar && (
                                        <p style={{
                                            margin: '0 0 4px 0',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: colors.accent,
                                        }}>
                                            {message.user_name}
                                        </p>
                                    )}
                                    <p style={{
                                        margin: 0,
                                        fontSize: '14px',
                                        lineHeight: 1.5,
                                        wordBreak: 'break-word',
                                    }}>
                                        {message.content}
                                    </p>
                                    {message.is_edited && (
                                        <span style={{
                                            fontSize: '10px',
                                            opacity: 0.7,
                                            marginLeft: '8px',
                                        }}>
                                            (edited)
                                        </span>
                                    )}
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{
                    background: colors.cardBg,
                    borderTop: `1px solid ${colors.border}`,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '12px',
                }}
            >
                <Tooltip text="Attach File" placement="above">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            border: 'none',
                            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: colors.textSecondary,
                            flexShrink: 0,
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                    </motion.button>
                </Tooltip>

                <div style={{
                    flex: 1,
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    borderRadius: '16px',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    <textarea
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a message..."
                        rows={1}
                        style={{
                            flex: 1,
                            border: 'none',
                            background: 'transparent',
                            color: colors.textPrimary,
                            fontSize: '14px',
                            resize: 'none',
                            outline: 'none',
                            fontFamily: 'inherit',
                            maxHeight: '120px',
                        }}
                    />
                    <Tooltip text="Add Emoji" placement="above">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            style={{
                                width: 28,
                                height: 28,
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
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
                            </svg>
                        </motion.button>
                    </Tooltip>
                </div>

                <Tooltip text={newMessage.trim() ? 'Send Message' : 'Type a message first'} placement="above">
                    <motion.button
                        whileHover={newMessage.trim() ? { scale: 1.05, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' } : {}}
                        whileTap={newMessage.trim() ? { scale: 0.95 } : {}}
                        onClick={handleSend}
                        disabled={!newMessage.trim() || isSending}
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: '14px',
                            border: 'none',
                            background: newMessage.trim() 
                                ? `linear-gradient(135deg, ${colors.accent} 0%, #2563eb 100%)`
                                : isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                            cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: newMessage.trim() ? '#fff' : colors.textMuted,
                            flexShrink: 0,
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {isSending ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                style={{
                                    width: 18,
                                    height: 18,
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    borderTopColor: '#fff',
                                    borderRadius: '50%',
                                }}
                            />
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        )}
                    </motion.button>
                </Tooltip>
            </motion.div>

            {/* Quick Emoji Picker */}
            <AnimatePresence>
                {showEmojiPicker && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        style={{
                            position: 'fixed',
                            bottom: 90,
                            right: 100,
                            background: colors.cardBg,
                            borderRadius: '12px',
                            padding: '8px',
                            display: 'flex',
                            gap: '4px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                        }}
                    >
                        {quickEmojis.map((emoji) => (
                            <motion.button
                                key={emoji}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                    setNewMessage((prev) => prev + emoji);
                                    setShowEmojiPicker(false);
                                    inputRef.current?.focus();
                                }}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '20px',
                                }}
                            >
                                {emoji}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GroupChatPage;
