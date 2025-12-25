/**
 * Group Chat Page - Minimalistic real-time chat interface
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import {
    fetchGroupMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    subscribeToMessages,
    classifyMessage,
    type ChatMessage,
    type MessageType,
} from '../../services/chatService';
import { getProfile, getImages } from '../../services/profileService';
import { fetchGroups, type GroupWithMembers } from '../../services/groupsService';

// Import types, constants, and utilities from extracted modules
import type {
    MessageReaction,
    ReplyInfo,
    UserBadge,
    MemberStats,
} from './types';
import {
    STUDY_REACTIONS,
    BADGES,
    XP_REWARDS,
    QUICK_EMOJIS,
    EMOJI_CATEGORIES,
} from './constants';
import {
    calculateLevel,
    xpToNextLevel,
    formatTime,
    formatDateSeparator,
    shouldShowDateSeparator,
} from './utils';

// Import modal components from extracted modules
import {
    FlashcardModal,
    PollModal,
    ScheduleModal,
    PinResourceModal,
    WhiteboardModal,
    VoiceNoteModal,
    FileShareModal,
    CourseMaterialModal,
    LeaderboardModal,
    ThreadModal,
} from './modals';

// Import UI components from extracted modules
import {
    FilePreviewCard,
    LinkPreviewCard,
    extractUrls,
    GifPicker,
    type GifResult,
    CodeBlock,
    extractCodeBlocks,
    XPNotification,
    Tooltip,
    StudyToolsMenu,
    GroupInfoModal,
    MentionAutocomplete,
    type MentionUser,
} from './components';

// Import custom hooks
import { useMentions } from './hooks';

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
    const [showGifPicker, setShowGifPicker] = useState(false);
    const gifButtonRef = useRef<HTMLButtonElement>(null);
    const [focusMode, setFocusMode] = useState(false);
    const [focusModeLoading, setFocusModeLoading] = useState(false);

    // Study tools state
    const [showStudyTools, setShowStudyTools] = useState(false);
    const [showFlashcardModal, setShowFlashcardModal] = useState(false);
    const [showPollModal, setShowPollModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);

    // Collaboration tools state
    const [showWhiteboardModal, setShowWhiteboardModal] = useState(false);
    const [showVoiceNoteModal, setShowVoiceNoteModal] = useState(false);
    const [showFileShareModal, setShowFileShareModal] = useState(false);
    const [showCourseMaterialModal, setShowCourseMaterialModal] = useState(false);

    // Thread view state
    const [threadViewMessage, setThreadViewMessage] = useState<ChatMessage | null>(null);

    // Message enhancements state
    const [messageReactions, setMessageReactions] = useState<Record<string, MessageReaction[]>>({});
    const [replyingTo, setReplyingTo] = useState<ReplyInfo | null>(null);
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
    const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null);
    const [bookmarkedMessages, setBookmarkedMessages] = useState<Set<string>>(new Set());
    const [pinnedMessages, setPinnedMessages] = useState<Set<string>>(new Set());
    const [showPinnedPanel, setShowPinnedPanel] = useState(false);
    const [helpfulVotes, setHelpfulVotes] = useState<Record<string, { count: number; voted: boolean }>>({});

    // Message editing state
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    // AI Message Classification state
    const [messageClassifications, setMessageClassifications] = useState<Record<string, MessageType>>({});

    // Gamification state
    const [userXP, setUserXP] = useState(245);
    const [userStreak, _setUserStreak] = useState(5); // _setUserStreak for future streak updates
    void _setUserStreak; // Suppress unused warning
    const [xpNotification, setXpNotification] = useState<{ amount: number; reason: string } | null>(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showGroupInfo, setShowGroupInfo] = useState(false);

    // Typing indicator state
    const [typingUsers, setTypingUsers] = useState<{ id: string; name: string; avatar?: string }[]>([]);

    // Unread messages state (simulated - in real app would track last read message)
    const [lastReadMessageIndex, setLastReadMessageIndex] = useState<number | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    // Scroll to bottom button state
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [newMessageCount, setNewMessageCount] = useState(0);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Search messages state
    const [showSearchPanel, setShowSearchPanel] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Read receipts state
    const [showReadReceipts, setShowReadReceipts] = useState(true);
    const [messageReadBy, setMessageReadBy] = useState<Record<string, { id: string; name: string; avatar?: string }[]>>({});

    // Build member stats from real group members
    const memberStats = useMemo<MemberStats[]>(() => {
        if (!groupInfo?.members) return [];

        // Count messages per user
        const messageCountByUser: Record<string, number> = {};
        messages.forEach(msg => {
            messageCountByUser[msg.user_id] = (messageCountByUser[msg.user_id] || 0) + 1;
        });

        return groupInfo.members.map((member, index) => {
            const msgCount = messageCountByUser[member.user_id] || 0;
            const isCurrentUser = member.user_id === profile?.studentId;
            // Calculate XP based on message count (10 XP per message)
            const xp = msgCount * 10;
            const level = calculateLevel(xp);

            // Assign badges based on activity
            const badges: UserBadge[] = [];
            if (msgCount >= 50) badges.push(BADGES.contributor);
            if (msgCount >= 20) badges.push(BADGES.helper);
            if (index === 0) badges.push(BADGES.earlyBird); // First member

            return {
                odId: member.user_id,
                odName: isCurrentUser ? 'You' : member.user_name,
                streak: Math.floor(msgCount / 5), // Estimate streak from activity
                xp,
                level,
                badges,
                messagesCount: msgCount,
                helpfulCount: Math.floor(msgCount / 4), // Estimate helpful count
            };
        }).sort((a, b) => b.xp - a.xp); // Sort by XP descending
    }, [groupInfo?.members, messages, profile?.studentId]);

    // Build mention users list from group members with smart data
    const mentionUsers = useMemo<MentionUser[]>(() => {
        if (!groupInfo?.members) return [];

        // Simulated expertise based on member stats (in real app, this would come from user profiles)
        const expertiseMap: Record<string, string[]> = {};
        const SUBJECTS = ['math', 'science', 'programming', 'writing', 'language', 'history', 'business', 'art'];

        // Assign random but consistent expertise based on user ID hash
        groupInfo.members.forEach(member => {
            const hash = member.user_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const numExpertise = (hash % 3) + 1; // 1-3 expertise areas
            const expertise: string[] = [];
            for (let i = 0; i < numExpertise; i++) {
                const subjectIndex = (hash + i * 7) % SUBJECTS.length;
                if (!expertise.includes(SUBJECTS[subjectIndex])) {
                    expertise.push(SUBJECTS[subjectIndex]);
                }
            }
            expertiseMap[member.user_id] = expertise;
        });

        return groupInfo.members
            .filter(member => member.user_id !== profile?.studentId && member.user_id !== profile?.id)
            .map(member => {
                // Find member stats for level/streak
                const stats = memberStats.find(s => s.odId === member.user_id);

                // Determine availability based on online status
                const availability: 'available' | 'studying' | 'busy' | 'offline' =
                    !member.is_online ? 'offline' :
                        Math.random() > 0.7 ? 'studying' :
                            Math.random() > 0.5 ? 'available' : 'available';

                return {
                    id: member.user_id,
                    name: member.user_name,
                    avatar: member.user_avatar,
                    role: member.role as 'owner' | 'admin' | 'member',
                    isOnline: member.is_online,
                    expertise: expertiseMap[member.user_id] || [],
                    level: stats?.level || 1,
                    studyStreak: stats?.streak || 0,
                    availability,
                };
            });
    }, [groupInfo?.members, profile?.studentId, profile?.id, memberStats]);

    // Extract mentioned users from current message for notification preview
    const mentionedUsersInMessage = useMemo(() => {
        if (!newMessage) return [];
        const mentionRegex = /@(\w+)/g;
        const mentions: string[] = [];
        let match;
        while ((match = mentionRegex.exec(newMessage)) !== null) {
            mentions.push(match[1].toLowerCase());
        }
        // Match mentions to actual users
        return mentionUsers.filter(user =>
            mentions.some(mention =>
                user.name.toLowerCase().split(' ')[0] === mention ||
                user.name.toLowerCase().replace(/\s+/g, '') === mention
            )
        );
    }, [newMessage, mentionUsers]);

    // Mentions hook
    const {
        isOpen: isMentionsOpen,
        query: mentionQuery,
        handleInputChange: handleMentionInputChange,
        handleSelect: handleMentionSelect,
        closeMentions,
        // formatMessageWithMentions, // Available for rendering mentions in messages
    } = useMentions({
        users: mentionUsers,
        onMention: (user) => {
            console.log('Mentioned user:', user.name);
        },
    });

    // Award XP function
    const awardXP = useCallback((amount: number, reason: string) => {
        setUserXP(prev => prev + amount);
        setXpNotification({ amount, reason });
    }, []);

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
                const userImages = await getImages();

                // create a safe profile object with all necessary fields
                const formattedProfile = {
                    ...userProfile,
                    id: userProfile.studentId || `user-${Date.now()}`, // Fallback ID
                    full_name: `${userProfile.firstName} ${userProfile.lastName}`,
                    avatar_url: userImages.profileImage
                };

                setProfile(formattedProfile);

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

        const unsubscribe = subscribeToMessages(groupId, async (newMsg) => {
            setMessages((prev) => {
                // Prevent duplicate messages (e.g. from optimistic update + realtime subscription)
                if (prev.some(msg => msg.id === newMsg.id)) {
                    return prev;
                }
                return [...prev, newMsg];
            });

            // Classify new message with AI
            if (!messageClassifications[newMsg.id]) {
                const result = await classifyMessage(newMsg.content);
                if (result.success && result.type !== 'general') {
                    setMessageClassifications(prev => ({ ...prev, [newMsg.id]: result.type }));
                }
            }
        });

        return unsubscribe;
    }, [groupId, messageClassifications]);

    // AI Message Classification - classify messages when loaded
    useEffect(() => {
        const classifyMessages = async () => {
            for (const msg of messages) {
                if (!messageClassifications[msg.id]) {
                    const result = await classifyMessage(msg.content);
                    if (result.success && result.type !== 'general') {
                        setMessageClassifications(prev => ({ ...prev, [msg.id]: result.type }));
                    }
                }
            }
        };

        if (messages.length > 0) {
            classifyMessages();
        }
    }, [messages]);

    // Scroll to bottom on new messages (only if already at bottom)
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            if (isAtBottom) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            } else {
                // User is scrolled up, show new message indicator
                setNewMessageCount(prev => prev + 1);
            }
        } else {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Handle scroll to detect if user scrolled up
    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current;
        if (container) {
            const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            setShowScrollButton(!isAtBottom);
            if (isAtBottom) {
                setNewMessageCount(0);
            }
        }
    }, []);

    // Scroll to bottom function
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setShowScrollButton(false);
        setNewMessageCount(0);
    }, []);

    // Track unread messages - mark as read when user scrolls to bottom
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            if (isAtBottom) {
                setLastReadMessageIndex(null);
                setUnreadCount(0);
            }
        }
    }, [messages.length]);

    // Typing indicator - would need real-time subscription to work
    // For now, typing status is cleared (no simulated data)
    useEffect(() => {
        // Clear any typing users - real implementation would subscribe to typing events
        setTypingUsers([]);
    }, [groupId]);

    // Simulate read receipts - in real app would come from database
    useEffect(() => {
        if (!groupInfo?.members || !messages.length || !profile) return;

        // Simulate that recent messages have been read by some members
        const readReceipts: Record<string, { id: string; name: string; avatar?: string }[]> = {};
        const otherMembers = groupInfo.members.filter(m =>
            m.user_id !== profile.studentId && m.user_id !== profile.id
        );

        messages.forEach((msg, index) => {
            // Only show read receipts for own messages
            if (msg.user_id === profile.studentId || msg.user_id === profile.id) {
                // Simulate: older messages read by more people, recent by fewer
                const readCount = Math.min(
                    otherMembers.length,
                    Math.max(1, Math.floor((messages.length - index) / 3) + 1)
                );

                // Select readers based on readCount
                const readers = otherMembers
                    .slice(0, readCount)
                    .map(m => ({
                        id: m.user_id,
                        name: m.user_name,
                        avatar: m.user_avatar,
                    }));

                if (readers.length > 0) {
                    readReceipts[msg.id] = readers;
                }
            }
        });

        setMessageReadBy(readReceipts);
    }, [groupInfo?.members, messages, profile]);

    // Handle send message
    const handleSend = useCallback(async () => {
        if (!newMessage.trim() || !groupId || !profile || isSending) return;

        setIsSending(true);
        let content = newMessage.trim();

        // Determine XP reward based on message type
        let xpAmount = XP_REWARDS.sendMessage;
        let xpReason = 'Message sent';

        if (content.includes('**Flashcard**')) {
            xpAmount = XP_REWARDS.shareFlashcard;
            xpReason = 'Shared flashcard';
        } else if (content.includes('**Poll**')) {
            xpAmount = XP_REWARDS.createPoll;
            xpReason = 'Created poll';
        } else if (content.includes('**Study Session**')) {
            xpAmount = XP_REWARDS.scheduleSession;
            xpReason = 'Scheduled session';
        } else if (content.includes('**Pinned Resource**') || content.includes('**Course Material**')) {
            xpAmount = XP_REWARDS.shareResource;
            xpReason = 'Shared resource';
        }

        // Add reply context if replying
        if (replyingTo) {
            content = `↩️ @${replyingTo.userName}: "${replyingTo.content}"\n\n${content}`;
        }

        setNewMessage('');
        setReplyingTo(null);

        const sentMessage = await sendMessage(
            groupId,
            profile.id || profile.studentId, // Ensure we have an ID
            profile.full_name || 'Anonymous',
            profile.avatar_url,
            content
        );

        if (sentMessage) {
            setMessages((prev) => [...prev, sentMessage]);
            // Award XP after successful send
            awardXP(xpAmount, xpReason);
        }

        setIsSending(false);
        inputRef.current?.focus();
    }, [newMessage, groupId, profile, isSending, replyingTo, awardXP]);

    // Handle key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Quick emoji reactions and emoji categories imported from constants
    // Using QUICK_EMOJIS and EMOJI_CATEGORIES from './constants'

    // Emoji picker state
    const [emojiPickerCategory, setEmojiPickerCategory] = useState('recent');
    const [emojiSearch, setEmojiSearch] = useState('');

    // Handle adding reaction to message
    const handleReaction = (messageId: string, emoji: string) => {
        setMessageReactions(prev => {
            const existing = prev[messageId] || [];
            const reactionIndex = existing.findIndex(r => r.emoji === emoji);

            if (reactionIndex >= 0) {
                // Toggle user's reaction
                const reaction = existing[reactionIndex];
                const userId = profile?.id || 'anonymous';
                if (reaction.users.includes(userId)) {
                    // Remove user from reaction
                    const newUsers = reaction.users.filter(u => u !== userId);
                    if (newUsers.length === 0) {
                        return { ...prev, [messageId]: existing.filter((_, i) => i !== reactionIndex) };
                    }
                    const newReactions = [...existing];
                    newReactions[reactionIndex] = { ...reaction, users: newUsers };
                    return { ...prev, [messageId]: newReactions };
                } else {
                    // Add user to reaction
                    const newReactions = [...existing];
                    newReactions[reactionIndex] = { ...reaction, users: [...reaction.users, userId] };
                    return { ...prev, [messageId]: newReactions };
                }
            } else {
                // Add new reaction
                return { ...prev, [messageId]: [...existing, { emoji, users: [profile?.id || 'anonymous'] }] };
            }
        });
        setShowReactionsFor(null);
    };

    // Handle edit message
    const handleStartEdit = (message: ChatMessage) => {
        setEditingMessageId(message.id);
        setEditingContent(message.content);
    };

    const handleSaveEdit = async () => {
        if (!editingMessageId || !editingContent.trim()) return;

        const success = await editMessage(editingMessageId, editingContent.trim());
        if (success) {
            setMessages(prev => prev.map(msg =>
                msg.id === editingMessageId
                    ? { ...msg, content: editingContent.trim(), is_edited: true }
                    : msg
            ));
        }
        setEditingMessageId(null);
        setEditingContent('');
    };

    const handleCancelEdit = () => {
        setEditingMessageId(null);
        setEditingContent('');
    };

    // Handle delete message
    const handleDeleteMessage = async (messageId: string) => {
        const success = await deleteMessage(messageId);
        if (success) {
            setMessages(prev => prev.filter(msg => msg.id !== messageId));
        }
        setShowDeleteConfirm(null);
    };

    // Handle search messages
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const results = messages.filter(msg =>
            msg.content.toLowerCase().includes(lowerQuery) ||
            msg.user_name.toLowerCase().includes(lowerQuery)
        );
        setSearchResults(results);
    }, [messages]);

    const handleJumpToMessage = useCallback((messageId: string) => {
        setHighlightedMessageId(messageId);
        setShowSearchPanel(false);

        // Find the message element and scroll to it
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Clear highlight after animation
        setTimeout(() => setHighlightedMessageId(null), 2000);
    }, []);

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
            height: '100vh',
            background: colors.bg,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
        }}>
            {/* Header - Fixed at top */}
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
                    flexShrink: 0,
                    zIndex: 100,
                }}
            >
                <Tooltip text="Back to Groups">
                    <motion.button
                        whileHover={{ scale: 1.05, background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/dashboard')}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            border: `1.5px solid ${isDarkMode ? '#3b82f6' : '#3b82f6'}`,
                            background: isDarkMode ? 'rgba(30, 41, 59, 1)' : '#ffffff',
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
                            background: isDarkMode ? 'rgba(30, 41, 59, 1)' : '#ffffff',
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
                                    boxShadow: isDarkMode ? 'none' : '0 2px 4px rgba(251, 191, 36, 0.15)',
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M20 15C20 19.2545 17.3819 21.1215 15.3588 21.751C14.9274 21.8853 14.6438 21.3823 14.9019 21.0115C15.7823 19.7462 16.8 17.8159 16.8 16C16.8 14.0494 15.1559 11.7465 13.8721 10.3261C13.5786 10.0014 13.0667 10.2163 13.0507 10.6537C12.9976 12.1029 12.7689 14.0418 11.7828 15.5614C11.6241 15.806 11.2872 15.8262 11.1063 15.5975C10.7982 15.2079 10.4901 14.7265 10.182 14.3462C10.016 14.1414 9.71604 14.1386 9.52461 14.3198C8.77825 15.0265 7.73333 16.1286 7.73333 17.5C7.73333 18.4893 8.20479 19.7206 8.69077 20.6741C8.91147 21.1071 8.50204 21.615 8.08142 21.3715C6.24558 20.3088 4 18.1069 4 15C4 11.8536 8.31029 7.49484 9.95605 3.37694C10.2157 2.72714 11.0161 2.42181 11.5727 2.84585C14.9439 5.41391 20 10.3781 20 15Z"
                                        stroke="#f97316"
                                        strokeWidth="1.5"
                                        fill="url(#streakFlameGradient)"
                                    />
                                    <defs>
                                        <linearGradient id="streakFlameGradient" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
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

                        <div style={{ width: 1, height: 16, background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', borderRadius: '1px' }} />

                        {/* Level Badge - Compact */}
                        <motion.span
                            whileHover={{ scale: 1.05 }}
                            style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#3b82f6',
                                background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
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
                            background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(59, 130, 246, 0.15)',
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
                            whileHover={{ scale: 1.05, background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowLeaderboard(true)}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '10px',
                                border: `1.5px solid #3b82f6`,
                                background: isDarkMode ? 'rgba(30, 41, 59, 1)' : '#ffffff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#3b82f6',
                                transition: 'background 0.15s ease',
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                {/* Center podium (1st place) */}
                                <path d="M15 21H9V12.6C9 12.2686 9.26863 12 9.6 12H14.4C14.7314 12 15 12.2686 15 12.6V21Z" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                {/* Right podium (2nd place) */}
                                <path d="M20.4 21H15V18.1C15 17.7686 15.2686 17.5 15.6 17.5H20.4C20.7314 17.5 21 17.7686 21 18.1V20.4C21 20.7314 20.7314 21 20.4 21Z" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                {/* Left podium (3rd place) */}
                                <path d="M9 21V16.1C9 15.7686 8.73137 15.5 8.4 15.5H3.6C3.26863 15.5 3 15.7686 3 16.1V20.4C3 20.7314 3.26863 21 3.6 21H9Z" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                {/* Star on top */}
                                <path d="M10.8056 5.11325L11.7147 3.1856C11.8314 2.93813 12.1686 2.93813 12.2853 3.1856L13.1944 5.11325L15.2275 5.42427C15.4884 5.46418 15.5923 5.79977 15.4035 5.99229L13.9326 7.4917L14.2797 9.60999C14.3243 9.88202 14.0515 10.0895 13.8181 9.96099L12 8.96031L10.1819 9.96099C9.94851 10.0895 9.67568 9.88202 9.72026 9.60999L10.0674 7.4917L8.59651 5.99229C8.40766 5.79977 8.51163 5.46418 8.77248 5.42427L10.8056 5.11325Z" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(59, 130, 246, 0.15)" />
                            </svg>
                        </motion.button>
                    </Tooltip>
                    <Tooltip text="Group Info">
                        <motion.button
                            whileHover={{ scale: 1.05, background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowGroupInfo(true)}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '10px',
                                border: `1.5px solid #3b82f6`,
                                background: isDarkMode ? 'rgba(30, 41, 59, 1)' : '#ffffff',
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
                            whileHover={{ scale: 1.05, background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setShowSearchPanel(!showSearchPanel);
                                setTimeout(() => searchInputRef.current?.focus(), 100);
                            }}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '10px',
                                border: `1.5px solid #3b82f6`,
                                background: showSearchPanel
                                    ? (isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)')
                                    : (isDarkMode ? 'rgba(30, 41, 59, 1)' : '#ffffff'),
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
                            whileHover={{ scale: 1.05, background: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(`/focus/${groupId}`)}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '10px',
                                border: `1.5px solid #8b5cf6`,
                                background: isDarkMode ? 'rgba(30, 41, 59, 1)' : '#ffffff',
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


            {/* Search Panel */}
            <AnimatePresence>
                {showSearchPanel && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        style={{
                            background: colors.cardBg,
                            borderBottom: `1px solid ${colors.border}`,
                            overflow: 'hidden',
                            flexShrink: 0,
                            zIndex: 99,
                        }}
                    >
                        <div style={{ padding: '12px 20px' }}>
                            {/* Search Input */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                border: `1px solid ${colors.border}`,
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Search messages..."
                                    style={{
                                        flex: 1,
                                        border: 'none',
                                        background: 'transparent',
                                        color: colors.textPrimary,
                                        fontSize: '14px',
                                        outline: 'none',
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            setShowSearchPanel(false);
                                            setSearchQuery('');
                                            setSearchResults([]);
                                        }
                                    }}
                                />
                                {searchQuery && (
                                    <motion.button
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSearchResults([]);
                                            searchInputRef.current?.focus();
                                        }}
                                        style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            border: 'none',
                                            background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: colors.textMuted,
                                        }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </motion.button>
                                )}
                            </div>

                            {/* Search Results */}
                            {searchQuery && (
                                <div style={{ marginTop: '12px' }}>
                                    <div style={{
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        color: colors.textMuted,
                                        marginBottom: '8px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                    }}>
                                        {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
                                    </div>
                                    <div style={{
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px',
                                    }}>
                                        {searchResults.length === 0 ? (
                                            <div style={{
                                                padding: '16px',
                                                textAlign: 'center',
                                                color: colors.textMuted,
                                                fontSize: '13px',
                                            }}>
                                                No messages found
                                            </div>
                                        ) : (
                                            searchResults.map((result) => (
                                                <motion.button
                                                    key={result.id}
                                                    whileHover={{ scale: 1.01, background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
                                                    whileTap={{ scale: 0.99 }}
                                                    onClick={() => handleJumpToMessage(result.id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: '10px',
                                                        padding: '10px 12px',
                                                        borderRadius: '10px',
                                                        border: 'none',
                                                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        width: '100%',
                                                    }}
                                                >
                                                    {/* Avatar */}
                                                    <div style={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: '8px',
                                                        background: `linear-gradient(135deg, ${colors.accent}20 0%, ${colors.accent}10 100%)`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        color: colors.accent,
                                                        flexShrink: 0,
                                                    }}>
                                                        {result.user_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                    </div>
                                                    {/* Content */}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            marginBottom: '2px',
                                                        }}>
                                                            <span style={{
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                color: colors.textPrimary,
                                                            }}>
                                                                {result.user_name}
                                                            </span>
                                                            <span style={{
                                                                fontSize: '10px',
                                                                color: colors.textMuted,
                                                            }}>
                                                                {formatTime(result.created_at)}
                                                            </span>
                                                        </div>
                                                        <p style={{
                                                            margin: 0,
                                                            fontSize: '12px',
                                                            color: colors.textSecondary,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}>
                                                            {/* Highlight matching text */}
                                                            {(() => {
                                                                const content = result.content;
                                                                const lowerContent = content.toLowerCase();
                                                                const lowerQuery = searchQuery.toLowerCase();
                                                                const index = lowerContent.indexOf(lowerQuery);

                                                                if (index === -1) return content.slice(0, 80);

                                                                const before = content.slice(Math.max(0, index - 20), index);
                                                                const match = content.slice(index, index + searchQuery.length);
                                                                const after = content.slice(index + searchQuery.length, index + searchQuery.length + 40);

                                                                return (
                                                                    <>
                                                                        {index > 20 && '...'}
                                                                        {before}
                                                                        <span style={{
                                                                            background: `${colors.accent}30`,
                                                                            color: colors.accent,
                                                                            fontWeight: 600,
                                                                            padding: '0 2px',
                                                                            borderRadius: '2px',
                                                                        }}>
                                                                            {match}
                                                                        </span>
                                                                        {after}
                                                                        {content.length > index + searchQuery.length + 40 && '...'}
                                                                    </>
                                                                );
                                                            })()}
                                                        </p>
                                                    </div>
                                                    {/* Jump icon */}
                                                    <svg
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke={colors.textMuted}
                                                        strokeWidth="2"
                                                        style={{ flexShrink: 0, marginTop: '4px' }}
                                                    >
                                                        <polyline points="9 18 15 12 9 6" />
                                                    </svg>
                                                </motion.button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Focus Mode Modal - Study Resources Hub */}
            <AnimatePresence>
                {focusMode && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setFocusMode(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.6)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '24px',
                        }}
                    >
                        <motion.div
                            layout="size"
                            initial={{ opacity: 0, scale: 0.96, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 24 }}
                            transition={{
                                duration: 0.3,
                                ease: [0.16, 1, 0.3, 1],
                                layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: '100%',
                                maxWidth: '1000px',
                                background: isDarkMode ? '#1e293b' : '#ffffff',
                                borderRadius: '20px',
                                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                                boxShadow: isDarkMode
                                    ? '0 25px 80px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)'
                                    : '0 25px 80px -12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0,0,0,0.03)',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Premium Header with Stats */}
                            <div style={{
                                padding: '20px 24px',
                                borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                                background: isDarkMode
                                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)'
                                    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                                        }}>
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 style={{
                                                margin: 0,
                                                fontSize: '18px',
                                                fontWeight: 700,
                                                color: colors.textPrimary,
                                                letterSpacing: '-0.3px',
                                            }}>
                                                Study Resources
                                            </h2>
                                            <p style={{
                                                margin: '2px 0 0',
                                                fontSize: '13px',
                                                color: colors.textMuted,
                                            }}>
                                                Everything shared in {groupInfo?.name || 'this group'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Quick Stats */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        {(() => {
                                            const allLinks = messages.flatMap(msg => extractUrls(msg.content));
                                            const allFiles = messages.flatMap(msg => msg.attachments || []);
                                            const allCode = messages.filter(msg => extractCodeBlocks(msg.content).hasCode);
                                            return (
                                                <>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '6px 10px',
                                                        borderRadius: '8px',
                                                        background: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                                                    }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2">
                                                            <path d="M12 17v5" />
                                                            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1z" />
                                                        </svg>
                                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444' }}>{pinnedMessages.size}</span>
                                                    </div>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '6px 10px',
                                                        borderRadius: '8px',
                                                        background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                                                    }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                                        </svg>
                                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6' }}>{allLinks.length}</span>
                                                    </div>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '6px 10px',
                                                        borderRadius: '8px',
                                                        background: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.08)',
                                                    }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                            <polyline points="16 18 22 12 16 6" />
                                                            <polyline points="8 6 2 12 8 18" />
                                                        </svg>
                                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#22c55e' }}>{allCode.length}</span>
                                                    </div>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '6px 10px',
                                                        borderRadius: '8px',
                                                        background: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.08)',
                                                    }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                            <polyline points="14 2 14 8 20 8" />
                                                        </svg>
                                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#f59e0b' }}>{allFiles.length}</span>
                                                    </div>
                                                </>
                                            );
                                        })()}

                                        <motion.button
                                            whileHover={{ scale: 1.05, background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setFocusMode(false)}
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: '10px',
                                                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                                                background: 'transparent',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: colors.textMuted,
                                                marginLeft: '8px',
                                            }}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </motion.button>
                                    </div>
                                </div>
                            </div>

                            {/* Resources Content */}
                            <motion.div
                                layout
                                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                style={{
                                    overflow: 'auto',
                                    padding: '20px',
                                    maxHeight: 'calc(90vh - 100px)',
                                }}
                            >
                                {/* Loading Skeleton */}
                                <LayoutGroup>
                                    <AnimatePresence mode="wait">
                                        {focusModeLoading ? (
                                            <motion.div
                                                key="skeleton"
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2, layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }}
                                                style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                                            >
                                                {/* Pinned Messages Skeleton */}
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                        <div style={{
                                                            width: 16,
                                                            height: 16,
                                                            borderRadius: '4px',
                                                            background: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                                                        }} />
                                                        <div style={{
                                                            width: 120,
                                                            height: 13,
                                                            borderRadius: '4px',
                                                            background: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                                                        }} />
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {[1, 2].map((i) => (
                                                            <motion.div
                                                                key={i}
                                                                animate={{
                                                                    background: isDarkMode
                                                                        ? ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']
                                                                        : ['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.03)', 'rgba(0,0,0,0.02)']
                                                                }}
                                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
                                                                style={{
                                                                    padding: '12px 14px',
                                                                    borderRadius: '10px',
                                                                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                                    <div style={{ width: 70, height: 12, borderRadius: '4px', background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }} />
                                                                    <div style={{ width: 50, height: 10, borderRadius: '4px', background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }} />
                                                                </div>
                                                                <div style={{ width: '90%', height: 11, borderRadius: '4px', background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', marginBottom: '5px' }} />
                                                                <div style={{ width: '65%', height: 11, borderRadius: '4px', background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }} />
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Links Skeleton */}
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                        <div style={{
                                                            width: 16,
                                                            height: 16,
                                                            borderRadius: '4px',
                                                            background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                                                        }} />
                                                        <div style={{
                                                            width: 100,
                                                            height: 13,
                                                            borderRadius: '4px',
                                                            background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                                                        }} />
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                                                        {[1, 2, 3].map((i) => (
                                                            <motion.div
                                                                key={i}
                                                                animate={{
                                                                    background: isDarkMode
                                                                        ? ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']
                                                                        : ['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.03)', 'rgba(0,0,0,0.02)']
                                                                }}
                                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 + i * 0.12 }}
                                                                style={{
                                                                    padding: '12px',
                                                                    borderRadius: '10px',
                                                                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                                                                }}
                                                            >
                                                                <div style={{ width: '75%', height: 12, borderRadius: '4px', background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', marginBottom: '6px' }} />
                                                                <div style={{ width: '55%', height: 10, borderRadius: '4px', background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)' }} />
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Files Skeleton - Compact Grid */}
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                        <div style={{
                                                            width: 16,
                                                            height: 16,
                                                            borderRadius: '4px',
                                                            background: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                                                        }} />
                                                        <div style={{
                                                            width: 90,
                                                            height: 13,
                                                            borderRadius: '4px',
                                                            background: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.08)',
                                                        }} />
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                                            <motion.div
                                                                key={i}
                                                                animate={{
                                                                    background: isDarkMode
                                                                        ? ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']
                                                                        : ['rgba(0,0,0,0.015)', 'rgba(0,0,0,0.025)', 'rgba(0,0,0,0.015)']
                                                                }}
                                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 + i * 0.08 }}
                                                                style={{
                                                                    padding: '10px 12px',
                                                                    borderRadius: '10px',
                                                                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '10px',
                                                                }}
                                                            >
                                                                <div style={{
                                                                    width: 32,
                                                                    height: 32,
                                                                    borderRadius: '8px',
                                                                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                                                    flexShrink: 0,
                                                                }} />
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <div style={{ width: '85%', height: 11, borderRadius: '4px', background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', marginBottom: '4px' }} />
                                                                    <div style={{ width: '50%', height: 9, borderRadius: '4px', background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)' }} />
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="content"
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.25, layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }}
                                            >
                                                {/* Pinned Messages Section */}
                                                {pinnedMessages.size > 0 && (
                                                    <div style={{ marginBottom: '24px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2">
                                                                <path d="M12 17v5" />
                                                                <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1z" />
                                                            </svg>
                                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>
                                                                Pinned Messages ({pinnedMessages.size})
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {messages.filter(msg => pinnedMessages.has(msg.id)).map(msg => (
                                                                <motion.div
                                                                    key={msg.id}
                                                                    whileHover={{ scale: 1.01 }}
                                                                    style={{
                                                                        padding: '12px 14px',
                                                                        borderRadius: '10px',
                                                                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                                                        border: `1px solid ${colors.border}`,
                                                                    }}
                                                                >
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                                        <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textPrimary }}>{msg.user_name}</span>
                                                                        <span style={{ fontSize: '10px', color: colors.textMuted }}>{formatTime(msg.created_at)}</span>
                                                                    </div>
                                                                    <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary, lineHeight: 1.5 }}>{msg.content}</p>
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Shared Links Section */}
                                                {(() => {
                                                    const allLinks = messages.flatMap(msg => extractUrls(msg.content).map(url => ({ url, msg })));
                                                    if (allLinks.length === 0) return null;
                                                    return (
                                                        <div style={{ marginBottom: '24px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                                                </svg>
                                                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}>
                                                                    Shared Links ({allLinks.length})
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                                                                {allLinks.slice(0, 12).map(({ url }, idx) => (
                                                                    <LinkPreviewCard
                                                                        key={`focus-link-${idx}`}
                                                                        url={url}
                                                                        isOwn={false}
                                                                        isDarkMode={isDarkMode}
                                                                        colors={colors}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Code Blocks Section */}
                                                {(() => {
                                                    const allCodeBlocks = messages.flatMap(msg => {
                                                        const { parts } = extractCodeBlocks(msg.content);
                                                        return parts.filter(p => p.type === 'code').map(p => ({ ...p, msg }));
                                                    });
                                                    if (allCodeBlocks.length === 0) return null;
                                                    return (
                                                        <div style={{ marginBottom: '24px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                                    <polyline points="16 18 22 12 16 6" />
                                                                    <polyline points="8 6 2 12 8 18" />
                                                                </svg>
                                                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e' }}>
                                                                    Code Snippets ({allCodeBlocks.length})
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                                {allCodeBlocks.slice(0, 10).map((block, idx) => (
                                                                    <div key={`focus-code-${idx}`}>
                                                                        <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '4px' }}>
                                                                            Shared by {block.msg.user_name}
                                                                        </div>
                                                                        <CodeBlock
                                                                            code={block.content}
                                                                            language={block.language}
                                                                            isOwn={false}
                                                                            isDarkMode={isDarkMode}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Files Section */}
                                                {(() => {
                                                    const allFiles = messages.flatMap(msg => (msg.attachments || []).map(att => ({ att, msg })));
                                                    if (allFiles.length === 0) return null;
                                                    return (
                                                        <div style={{ marginBottom: '24px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                                    <polyline points="14 2 14 8 20 8" />
                                                                </svg>
                                                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b' }}>
                                                                    Shared Files ({allFiles.length})
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                                                                {allFiles.map(({ att }, idx) => (
                                                                    <motion.div
                                                                        key={`focus-file-${idx}`}
                                                                        whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                                        style={{
                                                                            padding: '10px 12px',
                                                                            borderRadius: '10px',
                                                                            background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fafafa',
                                                                            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                                                                            cursor: 'pointer',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '10px',
                                                                        }}
                                                                        onClick={() => att.url && window.open(att.url, '_blank')}
                                                                    >
                                                                        <div style={{
                                                                            width: 32,
                                                                            height: 32,
                                                                            borderRadius: '8px',
                                                                            background: att.type?.includes('pdf') ? 'rgba(239, 68, 68, 0.1)' :
                                                                                att.type?.includes('image') ? 'rgba(59, 130, 246, 0.1)' :
                                                                                    att.type?.includes('word') || att.type?.includes('doc') ? 'rgba(59, 130, 246, 0.1)' :
                                                                                        att.type?.includes('sheet') || att.type?.includes('excel') ? 'rgba(34, 197, 94, 0.1)' :
                                                                                            att.type?.includes('presentation') || att.type?.includes('ppt') ? 'rgba(245, 158, 11, 0.1)' :
                                                                                                'rgba(107, 114, 128, 0.1)',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            flexShrink: 0,
                                                                        }}>
                                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                                                                stroke={att.type?.includes('pdf') ? '#ef4444' :
                                                                                    att.type?.includes('image') ? '#3b82f6' :
                                                                                        att.type?.includes('word') || att.type?.includes('doc') ? '#3b82f6' :
                                                                                            att.type?.includes('sheet') || att.type?.includes('excel') ? '#22c55e' :
                                                                                                att.type?.includes('presentation') || att.type?.includes('ppt') ? '#f59e0b' :
                                                                                                    '#6b7280'}
                                                                                strokeWidth="2">
                                                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                                                <polyline points="14 2 14 8 20 8" />
                                                                            </svg>
                                                                        </div>
                                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                                            <div style={{
                                                                                fontSize: '12px',
                                                                                fontWeight: 500,
                                                                                color: colors.textPrimary,
                                                                                whiteSpace: 'nowrap',
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis',
                                                                            }}>
                                                                                {att.name}
                                                                            </div>
                                                                            <div style={{ fontSize: '10px', color: colors.textMuted }}>
                                                                                {att.size ? `${(att.size / 1024).toFixed(1)} KB` : 'File'}
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Empty State */}
                                                {pinnedMessages.size === 0 &&
                                                    messages.every(msg => extractUrls(msg.content).length === 0) &&
                                                    messages.every(msg => !extractCodeBlocks(msg.content).hasCode) &&
                                                    messages.every(msg => !msg.attachments?.length) && (
                                                        <div style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            height: '300px',
                                                            color: colors.textMuted,
                                                        }}>
                                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '12px', opacity: 0.5 }}>
                                                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                                <line x1="9" y1="10" x2="15" y2="10" />
                                                            </svg>
                                                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>No resources shared yet</p>
                                                            <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Pin messages, share links, code, or files to see them here</p>
                                                        </div>
                                                    )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </LayoutGroup>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pinned Messages Panel */}
            <AnimatePresence>
                {pinnedMessages.size > 0 && (
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
                                onClick={() => setShowPinnedPanel(!showPinnedPanel)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2">
                                        <path d="M12 17v5" />
                                        <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1z" />
                                        <path d="M8 5V3" />
                                        <path d="M16 5V3" />
                                    </svg>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444' }}>
                                        {pinnedMessages.size} Pinned {pinnedMessages.size === 1 ? 'Message' : 'Messages'}
                                    </span>
                                </div>
                                <motion.div
                                    animate={{ rotate: showPinnedPanel ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2">
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </motion.div>
                            </div>

                            {/* Pinned Messages List */}
                            <AnimatePresence>
                                {showPinnedPanel && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px',
                                            marginTop: '8px',
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                        }}>
                                            {messages
                                                .filter(msg => pinnedMessages.has(msg.id))
                                                .map(msg => {
                                                    const memberInfo = groupInfo?.members?.find(m => m.user_id === msg.user_id);
                                                    return (
                                                        <motion.div
                                                            key={msg.id}
                                                            initial={{ opacity: 0, y: -5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -5 }}
                                                            whileHover={{ background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '10px',
                                                                padding: '8px 10px',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                            }}
                                                            onClick={() => {
                                                                const element = document.getElementById(`message-${msg.id}`);
                                                                if (element) {
                                                                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                    setHighlightedMessageId(msg.id);
                                                                    setTimeout(() => setHighlightedMessageId(null), 2000);
                                                                }
                                                            }}
                                                        >
                                                            {/* Avatar with Level Badge and Online Status - matching chat bubble */}
                                                            {(() => {
                                                                const pinnedMemberStats = memberStats.find(m => m.odId === msg.user_id);
                                                                const pinnedUserLevel = pinnedMemberStats?.level || 1;
                                                                const pinnedIsOnline = memberInfo?.is_online ?? false;
                                                                return (
                                                                    <div style={{ position: 'relative', flexShrink: 0, width: 32, height: 38 }}>
                                                                        {/* Avatar Circle */}
                                                                        <div style={{
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
                                                                        }}>
                                                                            {memberInfo?.user_avatar ? (
                                                                                <img src={memberInfo.user_avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                                                            ) : (
                                                                                msg.user_name.charAt(0).toUpperCase()
                                                                            )}
                                                                        </div>
                                                                        {/* Level Badge */}
                                                                        <div style={{
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
                                                                        }}>
                                                                            Lv.{pinnedUserLevel}
                                                                        </div>
                                                                        {/* Online Status Dot */}
                                                                        <div style={{
                                                                            position: 'absolute',
                                                                            top: 0,
                                                                            right: -2,
                                                                            width: 9,
                                                                            height: 9,
                                                                            borderRadius: '50%',
                                                                            background: pinnedIsOnline ? '#22c55e' : '#9ca3af',
                                                                            border: `2px solid ${colors.cardBg}`,
                                                                        }} />
                                                                    </div>
                                                                );
                                                            })()}
                                                            {/* Content - Single Line */}
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textPrimary }}>
                                                                        {msg.user_name}
                                                                    </span>
                                                                    <span style={{ fontSize: '10px', color: colors.textMuted }}>
                                                                        {formatTime(msg.created_at)}
                                                                    </span>
                                                                </div>
                                                                <p style={{
                                                                    margin: 0,
                                                                    fontSize: '12px',
                                                                    color: colors.textSecondary,
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                }}>
                                                                    {msg.content}
                                                                </p>
                                                            </div>
                                                            {/* Unpin button */}
                                                            <motion.button
                                                                whileHover={{ scale: 1.1, color: '#ef4444' }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setPinnedMessages(prev => {
                                                                        const newSet = new Set(prev);
                                                                        newSet.delete(msg.id);
                                                                        return newSet;
                                                                    });
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
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                )}
            </AnimatePresence>

            {/* Messages Area - Scrollable */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflow: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    position: 'relative',
                    scrollBehavior: 'smooth',
                }}
            >
                {/* Empty State - Be the first to message */}
                <AnimatePresence>
                    {messages.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -20 }}
                            transition={{
                                duration: 0.4,
                                ease: [0.25, 0.46, 0.45, 0.94],
                                scale: { type: 'spring', stiffness: 200, damping: 20 }
                            }}
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '40px 20px',
                                textAlign: 'center',
                            }}
                        >
                            {/* Icon Container */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '24px',
                                    background: `linear-gradient(135deg, ${colors.accent}15 0%, ${colors.accent}08 100%)`,
                                    border: `1.5px solid ${colors.accent}20`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '20px',
                                    boxShadow: `0 8px 32px ${colors.accent}10`,
                                }}
                            >
                                {/* Minimalistic Send/Chat Icon */}
                                <motion.svg
                                    initial={{ opacity: 0, rotate: -20 }}
                                    animate={{ opacity: 1, rotate: 0 }}
                                    transition={{ delay: 0.2, duration: 0.4 }}
                                    width="36"
                                    height="36"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={colors.accent}
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M22 2L11 13" />
                                    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                                </motion.svg>
                            </motion.div>

                            {/* Title */}
                            <motion.h3
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25, duration: 0.3 }}
                                style={{
                                    margin: 0,
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    color: colors.textPrimary,
                                    marginBottom: '8px',
                                }}
                            >
                                Start the conversation
                            </motion.h3>

                            {/* Subtitle */}
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35, duration: 0.3 }}
                                style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    color: colors.textMuted,
                                    maxWidth: '280px',
                                    lineHeight: 1.5,
                                }}
                            >
                                Be the first to send a message and get the discussion started!
                            </motion.p>

                            {/* Decorative dots */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.4 }}
                                style={{
                                    display: 'flex',
                                    gap: '6px',
                                    marginTop: '24px',
                                }}
                            >
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            y: [0, -4, 0],
                                            opacity: [0.4, 1, 0.4]
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            delay: i * 0.2,
                                            ease: 'easeInOut',
                                        }}
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            background: colors.accent,
                                        }}
                                    />
                                ))}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence initial={false}>
                    {messages.map((message, index) => {
                        const isOwn = message.user_id === profile?.studentId || message.user_id === profile?.id;
                        const prevMessage = messages[index - 1];
                        const nextMessage = messages[index + 1];

                        // Get member info from group members (real data)
                        const memberInfo = groupInfo?.members?.find(m => m.user_id === message.user_id);
                        const memberStats_user = memberStats.find(m => m.odId === message.user_id);
                        const userLevel = memberStats_user?.level || 1;
                        const userStreak_msg = memberStats_user?.streak || 0;
                        const isOnline = memberInfo?.is_online ?? false;
                        const memberRole = memberInfo?.role; // 'owner' | 'admin' | 'member'

                        // Date separator logic
                        const showDateSeparator = shouldShowDateSeparator(message, prevMessage);

                        // Message grouping logic (reset grouping if date changes)
                        const isFirstInGroup = !prevMessage || prevMessage.user_id !== message.user_id || showDateSeparator;
                        const isLastInGroup = !nextMessage || nextMessage.user_id !== message.user_id || shouldShowDateSeparator(nextMessage, message);
                        void (isFirstInGroup && isLastInGroup); // isMiddleInGroup can be derived if needed
                        const showAvatar = isFirstInGroup;
                        const showUserName = isFirstInGroup && !isOwn;

                        // Spacing based on grouping
                        const marginTop = isFirstInGroup ? 12 : 2;

                        const reactions = messageReactions[message.id] || [];
                        const isHovered = hoveredMessageId === message.id;

                        return (
                            <React.Fragment key={message.id}>
                                {/* Date Separator - Minimalistic line style */}
                                {showDateSeparator && (
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
                                {/* Unread Messages Indicator */}
                                {lastReadMessageIndex !== null && index === lastReadMessageIndex && unreadCount > 0 && (
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
                                            padding: '12px 0',
                                        }}
                                    >
                                        {/* Left line */}
                                        <div style={{
                                            flex: 1,
                                            height: '1px',
                                            background: isDarkMode
                                                ? 'linear-gradient(to left, rgba(59, 130, 246, 0.4), transparent)'
                                                : 'linear-gradient(to left, rgba(59, 130, 246, 0.3), transparent)',
                                        }} />
                                        {/* Unread badge */}
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '4px 12px',
                                            background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                                            borderRadius: '12px',
                                            border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                                        }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: '#3b82f6',
                                                letterSpacing: '0.2px',
                                            }}>
                                                {unreadCount} new {unreadCount === 1 ? 'message' : 'messages'}
                                            </span>
                                        </div>
                                        {/* Right line */}
                                        <div style={{
                                            flex: 1,
                                            height: '1px',
                                            background: isDarkMode
                                                ? 'linear-gradient(to right, rgba(59, 130, 246, 0.4), transparent)'
                                                : 'linear-gradient(to right, rgba(59, 130, 246, 0.3), transparent)',
                                        }} />
                                    </motion.div>
                                )}
                                {/* Message */}
                                <motion.div
                                    id={`message-${message.id}`}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        boxShadow: highlightedMessageId === message.id
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
                                        padding: highlightedMessageId === message.id ? '4px' : '0',
                                        margin: highlightedMessageId === message.id ? '-4px' : '0',
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

                                    <div style={{ maxWidth: '70%', width: 'fit-content', position: 'relative' }}>
                                        {/* Message Bubble */}
                                        <div
                                            onMouseEnter={() => setHoveredMessageId(message.id)}
                                            onMouseLeave={() => { setHoveredMessageId(null); setShowReactionsFor(null); }}
                                            style={{
                                                padding: '10px 14px',
                                                // Dynamic border radius based on message grouping
                                                borderRadius: (() => {
                                                    if (isOwn) {
                                                        // Own messages: tail on right
                                                        if (isFirstInGroup && isLastInGroup) return '16px 16px 4px 16px'; // Single message
                                                        if (isFirstInGroup) return '16px 16px 4px 16px'; // First in group
                                                        if (isLastInGroup) return '16px 4px 4px 16px'; // Last in group
                                                        return '16px 4px 4px 16px'; // Middle
                                                    } else {
                                                        // Others' messages: tail on left
                                                        if (isFirstInGroup && isLastInGroup) return '16px 16px 16px 4px'; // Single message
                                                        if (isFirstInGroup) return '16px 16px 16px 4px'; // First in group
                                                        if (isLastInGroup) return '4px 16px 16px 4px'; // Last in group
                                                        return '4px 16px 16px 4px'; // Middle
                                                    }
                                                })(),
                                                background: isOwn
                                                    ? `linear-gradient(135deg, ${colors.accent} 0%, #2563eb 100%)`
                                                    : colors.cardBg,
                                                color: isOwn ? '#fff' : colors.textPrimary,
                                                boxShadow: isOwn
                                                    ? `0 2px 8px ${colors.accent}30`
                                                    : `0 1px 3px ${colors.border}`,
                                                cursor: 'default',
                                                position: 'relative',
                                                border: pinnedMessages.has(message.id)
                                                    ? '2px solid #ef4444'
                                                    : (bookmarkedMessages.has(message.id) ? `2px solid ${colors.accent}` : 'none'),
                                            }}
                                        >
                                            {/* Bookmark Indicator */}
                                            {bookmarkedMessages.has(message.id) && (
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
                                                    {/* Study Streak Badge - only show if user has streak */}
                                                    {userStreak_msg > 0 && (
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
                                                            title={`${userStreak_msg} day study streak!`}
                                                        >
                                                            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                                                <path d="M12 23c-3.866 0-7-3.134-7-7 0-2.5 1.5-4.5 3-6.5s3-4.5 3-7.5c0 3 1.5 5.5 3 7.5s3 4 3 6.5c0 3.866-3.134 7-7 7z" />
                                                                <path d="M12 23c-1.657 0-3-1.343-3-3 0-1.5 1-2.5 2-3.5s2-2 2-3.5c0 1.5 1 2.5 2 3.5s2 2 2 3.5c0 1.657-1.343 3-3 3z" fill="#fbbf24" />
                                                            </svg>
                                                            {userStreak_msg}d
                                                        </span>
                                                    )}
                                                    {/* Year Level Badge - Using real data (all BSIT101A students are 1st Year) */}
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '3px',
                                                        fontSize: '9px',
                                                        color: '#8b5cf6',
                                                        padding: '2px 5px',
                                                        borderRadius: '4px',
                                                        background: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                                                        fontWeight: 500,
                                                    }}>
                                                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                                            <path d="M6 12v5c3 3 9 3 12 0v-5" />
                                                        </svg>
                                                        1st Year
                                                    </span>
                                                    {/* Course/Major Badge - Using real data (all are BSIT) */}
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '3px',
                                                        fontSize: '9px',
                                                        color: '#059669',
                                                        padding: '2px 5px',
                                                        borderRadius: '4px',
                                                        background: isDarkMode ? 'rgba(5, 150, 105, 0.15)' : 'rgba(5, 150, 105, 0.1)',
                                                        fontWeight: 500,
                                                    }}>
                                                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                        </svg>
                                                        BSIT
                                                    </span>
                                                    {/* Role Badge - show for owners and admins */}
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
                                                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                            </svg>
                                                            {memberRole === 'owner' ? 'Owner' : 'Admin'}
                                                        </span>
                                                    )}
                                                    {/* Helper Badge - for students who frequently help others (5+ helpful votes) */}
                                                    {(memberStats_user?.helpfulCount || 0) >= 5 && (
                                                        <span
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '3px',
                                                                fontSize: '9px',
                                                                color: '#ec4899',
                                                                padding: '2px 5px',
                                                                borderRadius: '4px',
                                                                background: isDarkMode ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.1)',
                                                                fontWeight: 500,
                                                            }}
                                                            title={`Helped ${memberStats_user?.helpfulCount} times`}
                                                        >
                                                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                                            </svg>
                                                            Helper
                                                        </span>
                                                    )}
                                                    {/* Achievement Badges - based on real user activity */}
                                                    {(() => {
                                                        const userBadges = memberStats_user?.badges || [];
                                                        // Map badges to display format
                                                        const badgeIcons: Record<string, { icon: string; label: string }> = {
                                                            'streak-3': { icon: '*', label: '3 Day Streak' },
                                                            'streak-7': { icon: '**', label: '7 Day Streak' },
                                                            'helper': { icon: '💪', label: 'Helper' },
                                                            'super-helper': { icon: '🦸', label: 'Super Helper' },
                                                            'contributor': { icon: '🏆', label: 'Top Contributor' },
                                                            'early-bird': { icon: '🌅', label: 'Early Bird' },
                                                        };
                                                        const userAchievements = userBadges
                                                            .filter((badge: UserBadge) => badgeIcons[badge.id])
                                                            .map((badge: UserBadge) => ({
                                                                id: badge.id,
                                                                icon: badgeIcons[badge.id]?.icon || badge.icon,
                                                                label: badgeIcons[badge.id]?.label || badge.label,
                                                            }));
                                                        if (userAchievements.length === 0) return null;
                                                        return (
                                                            <div style={{ display: 'inline-flex', gap: '2px', marginLeft: '2px' }}>
                                                                {userAchievements.map((achievement) => (
                                                                    <span
                                                                        key={achievement.id}
                                                                        title={achievement.label}
                                                                        style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            width: 16,
                                                                            height: 16,
                                                                            fontSize: '10px',
                                                                            borderRadius: '4px',
                                                                            background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                                                                            cursor: 'default',
                                                                        }}
                                                                    >
                                                                        {achievement.icon}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                            {/* Message Type Indicator - AI Powered */}
                                            {(() => {
                                                const msgType = messageClassifications[message.id];
                                                if (!msgType || msgType === 'general') return null;

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

                                                return (
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
                                                );
                                            })()}
                                            {/* Message Content - Edit Mode or Display Mode */}
                                            {editingMessageId === message.id ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <textarea
                                                        value={editingContent}
                                                        onChange={(e) => setEditingContent(e.target.value)}
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
                                                                handleSaveEdit();
                                                            }
                                                            if (e.key === 'Escape') {
                                                                handleCancelEdit();
                                                            }
                                                        }}
                                                    />
                                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={handleCancelEdit}
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
                                                            onClick={handleSaveEdit}
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
                                                !message.content.startsWith('[GIF]') && (
                                                    <>
                                                        {/* Render message with code blocks and @mention highlighting */}
                                                        {(() => {
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
                                                        })()}
                                                    </>
                                                )
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

                                            {/* Link Previews - for shared resources */}
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

                                            {/* Timestamp, Actions, and Helpful - visible on hover */}
                                            <motion.div
                                                initial={false}
                                                animate={{
                                                    height: isHovered ? 'auto' : 0,
                                                    opacity: isHovered ? 1 : 0,
                                                    marginTop: isHovered ? 6 : 0,
                                                }}
                                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                                style={{
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '8px',
                                                }}
                                            >
                                                {/* Left side: Timestamp */}
                                                <span style={{
                                                    fontSize: '10px',
                                                    color: isOwn ? 'rgba(255,255,255,0.6)' : colors.textMuted,
                                                }}>
                                                    {formatTime(message.created_at)}{message.is_edited && ' • edited'}
                                                </span>
                                                {/* Right side: Action buttons */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    {/* React */}
                                                    <Tooltip text="Add reaction" placement="below">
                                                        <motion.button
                                                            whileHover={{
                                                                scale: 1.1,
                                                                background: isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                                                            }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => setShowReactionsFor(showReactionsFor === message.id ? null : message.id)}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                width: 24,
                                                                height: 24,
                                                                borderRadius: '6px',
                                                                border: 'none',
                                                                background: 'transparent',
                                                                cursor: 'pointer',
                                                                color: isOwn ? 'rgba(255,255,255,0.8)' : (isDarkMode ? '#e5e7eb' : '#374151'),
                                                                transition: 'all 0.2s ease',
                                                            }}
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
                                                                background: isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(59, 130, 246, 0.1)',
                                                            }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => setThreadViewMessage(message)}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                width: 24,
                                                                height: 24,
                                                                borderRadius: '6px',
                                                                border: 'none',
                                                                background: 'transparent',
                                                                cursor: 'pointer',
                                                                color: isOwn ? 'rgba(255,255,255,0.8)' : '#3b82f6',
                                                                transition: 'all 0.2s ease',
                                                            }}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                                <path d="M8 9h8" />
                                                                <path d="M8 13h6" />
                                                            </svg>
                                                        </motion.button>
                                                    </Tooltip>
                                                    {/* Save */}
                                                    <Tooltip text={bookmarkedMessages.has(message.id) ? "Saved" : "Save message"} placement="below">
                                                        <motion.button
                                                            whileHover={{
                                                                scale: 1.1,
                                                                background: bookmarkedMessages.has(message.id)
                                                                    ? (isOwn ? 'rgba(255,255,255,0.2)' : `${colors.accent}20`)
                                                                    : (isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'),
                                                            }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => {
                                                                setBookmarkedMessages(prev => {
                                                                    const newSet = new Set(prev);
                                                                    if (newSet.has(message.id)) {
                                                                        newSet.delete(message.id);
                                                                    } else {
                                                                        newSet.add(message.id);
                                                                    }
                                                                    return newSet;
                                                                });
                                                            }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                width: 24,
                                                                height: 24,
                                                                borderRadius: '6px',
                                                                border: 'none',
                                                                background: bookmarkedMessages.has(message.id) ? (isOwn ? 'rgba(255,255,255,0.1)' : `${colors.accent}10`) : 'transparent',
                                                                cursor: 'pointer',
                                                                color: bookmarkedMessages.has(message.id) ? (isOwn ? '#fff' : colors.accent) : (isOwn ? 'rgba(255,255,255,0.8)' : (isDarkMode ? '#e5e7eb' : '#374151')),
                                                                transition: 'all 0.2s ease',
                                                            }}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill={bookmarkedMessages.has(message.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                                            </svg>
                                                        </motion.button>
                                                    </Tooltip>
                                                    {/* Pin */}
                                                    <Tooltip text={pinnedMessages.has(message.id) ? "Unpin message" : "Pin message"} placement="below">
                                                        <motion.button
                                                            whileHover={{
                                                                scale: 1.1,
                                                                background: pinnedMessages.has(message.id)
                                                                    ? (isOwn ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)')
                                                                    : (isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'),
                                                            }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => {
                                                                setPinnedMessages(prev => {
                                                                    const newSet = new Set(prev);
                                                                    if (newSet.has(message.id)) {
                                                                        newSet.delete(message.id);
                                                                    } else {
                                                                        newSet.add(message.id);
                                                                    }
                                                                    return newSet;
                                                                });
                                                            }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                width: 24,
                                                                height: 24,
                                                                borderRadius: '6px',
                                                                border: 'none',
                                                                background: pinnedMessages.has(message.id) ? (isOwn ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)') : 'transparent',
                                                                cursor: 'pointer',
                                                                color: pinnedMessages.has(message.id) ? '#ef4444' : (isOwn ? 'rgba(255,255,255,0.8)' : (isDarkMode ? '#e5e7eb' : '#374151')),
                                                                transition: 'all 0.2s ease',
                                                            }}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill={pinnedMessages.has(message.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                                                                onClick={() => handleStartEdit(message)}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    width: 24,
                                                                    height: 24,
                                                                    borderRadius: '6px',
                                                                    border: 'none',
                                                                    background: 'transparent',
                                                                    cursor: 'pointer',
                                                                    color: 'rgba(255,255,255,0.8)',
                                                                    transition: 'all 0.2s ease',
                                                                }}
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
                                                                onClick={() => setShowDeleteConfirm(message.id)}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    width: 24,
                                                                    height: 24,
                                                                    borderRadius: '6px',
                                                                    border: 'none',
                                                                    background: 'transparent',
                                                                    cursor: 'pointer',
                                                                    color: 'rgba(255,255,255,0.8)',
                                                                    transition: 'all 0.2s ease',
                                                                }}
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
                                                        <Tooltip text={helpfulVotes[message.id]?.voted ? "You found this helpful" : "Mark as helpful"} placement="below">
                                                            <motion.button
                                                                whileHover={{
                                                                    scale: 1.1,
                                                                    background: helpfulVotes[message.id]?.voted ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0,0,0,0.08)',
                                                                }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => {
                                                                    setHelpfulVotes(prev => {
                                                                        const current = prev[message.id] || { count: 0, voted: false };
                                                                        return {
                                                                            ...prev,
                                                                            [message.id]: {
                                                                                count: current.voted ? current.count - 1 : current.count + 1,
                                                                                voted: !current.voted
                                                                            }
                                                                        };
                                                                    });
                                                                }}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    gap: '3px',
                                                                    height: 24,
                                                                    padding: '0 8px',
                                                                    borderRadius: '6px',
                                                                    border: 'none',
                                                                    background: helpfulVotes[message.id]?.voted ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                                                                    cursor: 'pointer',
                                                                    color: helpfulVotes[message.id]?.voted ? '#22c55e' : (isDarkMode ? '#e5e7eb' : '#374151'),
                                                                    fontSize: '11px',
                                                                    fontWeight: 600,
                                                                    transition: 'all 0.2s ease',
                                                                }}
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill={helpfulVotes[message.id]?.voted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                                                                </svg>
                                                                {helpfulVotes[message.id]?.count ?? 0}
                                                            </motion.button>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            </motion.div>
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
                                                            onClick={() => handleReaction(message.id, reaction.emoji)}
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

                                        {/* Reply Thread Indicator - show actual reply count from messages */}
                                        {(() => {
                                            // Count actual replies to this message
                                            const replyCount = messages.filter(m => m.reply_to === message.id).length;

                                            if (replyCount === 0) return null;

                                            // Get unique reply authors
                                            const replyMessages = messages.filter(m => m.reply_to === message.id);
                                            const uniqueAuthors = [...new Set(replyMessages.map(m => m.user_name))].slice(0, 4);

                                            return (
                                                <motion.button
                                                    initial={false}
                                                    whileHover={{ scale: 1.02, background: isDarkMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)', borderColor: '#3b82f6' }}
                                                    whileTap={{ scale: 0.98 }}
                                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                                    onClick={() => setThreadViewMessage(message)}
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
                                            );
                                        })()}

                                        {/* Messenger-style seen indicator - only shows on the LAST message each person has seen */}
                                        {isOwn && (() => {
                                            const readers = showReadReceipts ? (messageReadBy[message.id] || []) : [];

                                            // Get readers for whom this IS their last seen message
                                            const readersForThisMessage = readers.filter(reader => {
                                                const messagesSeenByReader = messages.filter(msg => {
                                                    const msgReaders = messageReadBy[msg.id] || [];
                                                    return msgReaders.some(r => r.id === reader.id);
                                                });
                                                const lastSeenMessage = messagesSeenByReader[messagesSeenByReader.length - 1];
                                                return lastSeenMessage?.id === message.id;
                                            });

                                            // If no readers have this as their last seen message, show sent checkmark only for the latest own message
                                            const ownMessages = messages.filter(m => m.user_id === profile?.id);
                                            const isLatestOwnMessage = ownMessages[ownMessages.length - 1]?.id === message.id;

                                            if (readersForThisMessage.length === 0 && !isLatestOwnMessage) {
                                                return null; // Don't show anything for older messages with no readers
                                            }

                                            if (readersForThisMessage.length === 0 && isLatestOwnMessage) {
                                                // Show checkmark only on the latest message
                                                return (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: 0.1, duration: 0.2 }}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'flex-end',
                                                            marginTop: '4px',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: 14,
                                                                height: 14,
                                                                borderRadius: '50%',
                                                                background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                            title="Sent"
                                                        >
                                                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        </div>
                                                    </motion.div>
                                                );
                                            }

                                            // Show stacked avatars for all readers who have this as their last seen message (like Messenger)
                                            const maxAvatars = 5;
                                            const displayReaders = readersForThisMessage.slice(0, maxAvatars);
                                            const overflowCount = readersForThisMessage.length - maxAvatars;

                                            return (
                                                <motion.div
                                                    key={`seen-${message.id}`}
                                                    initial={{ opacity: 0, scale: 0.5, y: -10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    transition={{
                                                        type: 'spring',
                                                        stiffness: 400,
                                                        damping: 20,
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-end',
                                                        marginTop: '4px',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            flexDirection: 'row-reverse',
                                                        }}
                                                        title={`Seen by ${readersForThisMessage.map(r => r.name).join(', ')}`}
                                                    >
                                                        {/* Overflow count (+X) - only show if more than 5 */}
                                                        {overflowCount > 0 && (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                style={{
                                                                    width: 14,
                                                                    height: 14,
                                                                    borderRadius: '50%',
                                                                    background: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    marginLeft: '-4px',
                                                                    border: `1.5px solid ${colors.cardBg}`,
                                                                    zIndex: 0,
                                                                }}
                                                            >
                                                                <span style={{
                                                                    fontSize: '6px',
                                                                    fontWeight: 700,
                                                                    color: colors.textMuted,
                                                                }}>
                                                                    +{overflowCount}
                                                                </span>
                                                            </motion.div>
                                                        )}

                                                        {/* Stacked avatars - newest on right */}
                                                        {displayReaders.map((reader, idx) => (
                                                            <motion.div
                                                                key={reader.id}
                                                                initial={{ opacity: 0, scale: 0, x: 10 }}
                                                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                                                transition={{
                                                                    type: 'spring',
                                                                    stiffness: 400,
                                                                    damping: 20,
                                                                    delay: idx * 0.05,
                                                                }}
                                                                style={{
                                                                    width: 14,
                                                                    height: 14,
                                                                    borderRadius: '50%',
                                                                    overflow: 'hidden',
                                                                    background: reader.avatar
                                                                        ? 'transparent'
                                                                        : `linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)`,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    border: `1.5px solid ${colors.cardBg}`,
                                                                    marginLeft: idx > 0 ? '-4px' : 0,
                                                                    zIndex: maxAvatars - idx,
                                                                }}
                                                            >
                                                                {reader.avatar ? (
                                                                    <img
                                                                        src={reader.avatar}
                                                                        alt={reader.name}
                                                                        style={{
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            objectFit: 'cover',
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <span style={{
                                                                        fontSize: '7px',
                                                                        fontWeight: 600,
                                                                        color: '#fff',
                                                                    }}>
                                                                        {reader.name.charAt(0).toUpperCase()}
                                                                    </span>
                                                                )}
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            );
                                        })()}

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
                                                                onClick={() => handleReaction(message.id, reaction.emoji)}
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
                                </motion.div>
                            </React.Fragment>
                        );
                    })}
                </AnimatePresence>
                <div ref={messagesEndRef} />

                {/* Typing Indicator - Minimalistic Pill (matching date separator style) */}
                <AnimatePresence>
                    {typingUsers.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '8px 0',
                                marginLeft: '4px',
                            }}
                        >
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '6px 14px',
                                background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                                borderRadius: '20px',
                                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
                            }}>
                                {/* Animated dots */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                }}>
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{
                                                y: [0, -2, 0],
                                                opacity: [0.4, 1, 0.4],
                                            }}
                                            transition={{
                                                duration: 0.5,
                                                repeat: Infinity,
                                                delay: i * 0.1,
                                                ease: 'easeInOut',
                                            }}
                                            style={{
                                                width: 4,
                                                height: 4,
                                                borderRadius: '50%',
                                                background: colors.textMuted,
                                            }}
                                        />
                                    ))}
                                </div>
                                {/* Typing text */}
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: colors.textMuted,
                                    letterSpacing: '0.3px',
                                }}>
                                    {typingUsers.length === 1
                                        ? `${typingUsers[0].name} is typing`
                                        : typingUsers.length === 2
                                            ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing`
                                            : `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing`
                                    }
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            {/* Scroll to Bottom Button - Floating outside scroll area */}
            <AnimatePresence>
                {showScrollButton && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            bottom: 90,
                            left: 0,
                            right: 0,
                            display: 'flex',
                            justifyContent: 'center',
                            zIndex: 50,
                            pointerEvents: 'none',
                        }}
                    >
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={scrollToBottom}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: newMessageCount > 0 ? '8px 16px' : '8px 12px',
                                background: isDarkMode ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                borderRadius: '12px',
                                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                                boxShadow: isDarkMode
                                    ? '0 4px 16px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)'
                                    : '0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
                                cursor: 'pointer',
                                pointerEvents: 'auto',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {/* Arrow Icon */}
                            <div style={{
                                width: 24,
                                height: 24,
                                borderRadius: '8px',
                                background: newMessageCount > 0
                                    ? (isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)')
                                    : (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={newMessageCount > 0 ? colors.accent : colors.textSecondary}
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M12 5v14M19 12l-7 7-7-7" />
                                </svg>
                            </div>

                            {/* Text Content */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span style={{
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: newMessageCount > 0 ? colors.accent : colors.textPrimary,
                                    lineHeight: 1.2,
                                }}>
                                    {newMessageCount > 0 ? `${newMessageCount} new message${newMessageCount > 1 ? 's' : ''}` : 'Jump to latest'}
                                </span>
                                {newMessageCount > 0 && (
                                    <span style={{
                                        fontSize: '10px',
                                        fontWeight: 500,
                                        color: colors.textMuted,
                                        lineHeight: 1.2,
                                    }}>
                                        Click to scroll down
                                    </span>
                                )}
                            </div>

                            {/* New Message Badge */}
                            {newMessageCount > 0 && (
                                <div style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    background: colors.accent,
                                    boxShadow: `0 0 8px ${colors.accent}60`,
                                    animation: 'pulse 2s ease-in-out infinite',
                                }} />
                            )}
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Fixed Container - Reply indicator + Input Area */}
            <div style={{
                flexShrink: 0,
                zIndex: 100,
                background: colors.cardBg,
                borderTop: `1px solid ${colors.border}`,
            }}>
                {/* Reply indicator */}
                <AnimatePresence>
                    {replyingTo && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{
                                background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                borderTop: `1px solid ${colors.border}`,
                                padding: '8px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Reply icon */}
                            <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: '8px',
                                background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 14 4 9 9 4" />
                                    <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                                </svg>
                            </div>
                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    marginBottom: '2px',
                                }}>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        color: colors.textMuted,
                                    }}>
                                        Replying to
                                    </span>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: isDarkMode ? '#e5e7eb' : '#374151',
                                    }}>
                                        {replyingTo.userName}
                                    </span>
                                </div>
                                <p style={{
                                    margin: 0,
                                    fontSize: '12px',
                                    color: colors.textSecondary,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    lineHeight: 1.4,
                                }}>
                                    {replyingTo.content}
                                </p>
                            </div>
                            {/* Close button */}
                            <Tooltip text="Cancel reply" placement="above">
                                <motion.button
                                    whileHover={{ scale: 1.1, background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setReplyingTo(null)}
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                                        transition: 'all 0.2s ease',
                                        flexShrink: 0,
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </motion.button>
                            </Tooltip>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Notification Preview - Shows who will be notified */}
                <AnimatePresence>
                    {mentionedUsersInMessage.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            style={{
                                background: isDarkMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)',
                                borderTop: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'}`,
                                padding: '8px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                overflow: 'hidden',
                            }}
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            <span style={{
                                fontSize: '12px',
                                color: isDarkMode ? '#93c5fd' : '#3b82f6',
                                fontWeight: 500,
                            }}>
                                This will notify {mentionedUsersInMessage.length === 1
                                    ? <strong>{mentionedUsersInMessage[0].name}</strong>
                                    : <strong>{mentionedUsersInMessage.length} people</strong>
                                }
                            </span>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginLeft: 'auto',
                            }}>
                                {mentionedUsersInMessage.slice(0, 3).map((user, idx) => (
                                    <div
                                        key={user.id}
                                        style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: '50%',
                                            background: user.avatar ? 'transparent' : '#3b82f6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '9px',
                                            fontWeight: 700,
                                            color: '#fff',
                                            border: `2px solid ${isDarkMode ? '#1e293b' : '#fff'}`,
                                            marginLeft: idx > 0 ? '-8px' : 0,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {user.avatar ? (
                                            <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                                        )}
                                    </div>
                                ))}
                                {mentionedUsersInMessage.length > 3 && (
                                    <div
                                        style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: '50%',
                                            background: isDarkMode ? '#475569' : '#94a3b8',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '8px',
                                            fontWeight: 700,
                                            color: '#fff',
                                            border: `2px solid ${isDarkMode ? '#1e293b' : '#fff'}`,
                                            marginLeft: '-8px',
                                        }}
                                    >
                                        +{mentionedUsersInMessage.length - 3}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input Area */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    style={{
                        background: colors.cardBg,
                        borderTop: replyingTo || mentionedUsersInMessage.length > 0 ? 'none' : `1px solid ${colors.border}`,
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: '12px',
                    }}
                >
                    <div style={{
                        flex: 1,
                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        borderRadius: '16px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                    }}>
                        <Tooltip text="Study Tools" placement="above">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowStudyTools(true)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '8px',
                                    border: '1.5px solid #3b82f6',
                                    background: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#3b82f6',
                                    flexShrink: 0,
                                    boxShadow: '0 1px 3px rgba(59, 130, 246, 0.15)',
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </motion.button>
                        </Tooltip>

                        <Tooltip text="Attach File" placement="above">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '8px',
                                    border: '1.5px solid #3b82f6',
                                    background: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#3b82f6',
                                    flexShrink: 0,
                                    boxShadow: '0 1px 3px rgba(59, 130, 246, 0.15)',
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                </svg>
                            </motion.button>
                        </Tooltip>

                        {/* Divider */}
                        <div style={{
                            width: '1px',
                            height: '20px',
                            background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                            flexShrink: 0,
                        }} />

                        <div style={{ flex: 1, position: 'relative' }}>
                            <textarea
                                ref={inputRef}
                                value={newMessage}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    const cursorPosition = e.target.selectionStart || 0;
                                    setNewMessage(value);
                                    handleMentionInputChange(value, cursorPosition);
                                }}
                                onKeyDown={(e) => {
                                    // Don't trigger send if mentions dropdown is open
                                    if (isMentionsOpen && (e.key === 'Enter' || e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                                        return; // Let MentionAutocomplete handle these keys
                                    }
                                    handleKeyPress(e);
                                }}
                                placeholder="Type a message... Use @ to mention"
                                rows={1}
                                style={{
                                    width: '100%',
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

                            {/* Smart Mentions Autocomplete */}
                            <MentionAutocomplete
                                users={mentionUsers}
                                query={mentionQuery}
                                isOpen={isMentionsOpen}
                                onSelect={(user) => {
                                    const { newValue, newCursorPosition } = handleMentionSelect(user);
                                    setNewMessage(newValue);
                                    // Set cursor position after React updates
                                    setTimeout(() => {
                                        if (inputRef.current) {
                                            inputRef.current.focus();
                                            inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
                                        }
                                    }, 0);
                                }}
                                onClose={closeMentions}
                                inputRef={inputRef}
                                isDarkMode={isDarkMode}
                                messageContext={newMessage} // Pass full message for smart AI suggestions
                            />
                        </div>
                        <Tooltip text="Add Emoji" placement="above">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '8px',
                                    border: '1.5px solid #3b82f6',
                                    background: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 1px 3px rgba(59, 130, 246, 0.15)',
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                                    <line x1="9" y1="9" x2="9.01" y2="9" />
                                    <line x1="15" y1="9" x2="15.01" y2="9" />
                                </svg>
                            </motion.button>
                        </Tooltip>

                        <Tooltip text="Add GIF" placement="above">
                            <motion.button
                                ref={gifButtonRef}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowGifPicker(!showGifPicker)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '8px',
                                    border: '1.5px solid #f59e0b',
                                    background: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 1px 3px rgba(245, 158, 11, 0.15)',
                                }}
                            >
                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>GIF</span>
                            </motion.button>
                        </Tooltip>

                        <Tooltip text="Voice Note" placement="above">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowVoiceNoteModal(true)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '8px',
                                    border: '1.5px solid #8b5cf6',
                                    background: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 1px 3px rgba(139, 92, 246, 0.15)',
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                    <line x1="12" y1="19" x2="12" y2="23" />
                                    <line x1="8" y1="23" x2="16" y2="23" />
                                </svg>
                            </motion.button>
                        </Tooltip>

                        <Tooltip text={newMessage.trim() ? 'Send Message' : 'Type a message first'} placement="above">
                            <motion.button
                                data-send-button
                                whileHover={newMessage.trim() ? { scale: 1.05, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' } : {}}
                                whileTap={newMessage.trim() ? { scale: 0.95 } : {}}
                                onClick={handleSend}
                                disabled={!newMessage.trim() || isSending}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '8px',
                                    border: newMessage.trim() ? '1.5px solid #3b82f6' : '1.5px solid #d1d5db',
                                    background: newMessage.trim()
                                        ? `linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)`
                                        : 'white',
                                    cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: newMessage.trim() ? '#fff' : '#9ca3af',
                                    flexShrink: 0,
                                    transition: 'all 0.2s ease',
                                    boxShadow: newMessage.trim() ? '0 1px 3px rgba(59, 130, 246, 0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
                                }}
                            >
                                {isSending ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        style={{
                                            width: 14,
                                            height: 14,
                                            border: '2px solid rgba(255,255,255,0.3)',
                                            borderTopColor: '#fff',
                                            borderRadius: '50%',
                                        }}
                                    />
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="22" y1="2" x2="11" y2="13" />
                                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                )}
                            </motion.button>
                        </Tooltip>
                    </div>
                </motion.div>
            </div>

            {/* GIF Picker */}
            <GifPicker
                isOpen={showGifPicker}
                onClose={() => setShowGifPicker(false)}
                onSelect={(gif: GifResult) => {
                    // Send GIF as a message with the GIF URL
                    if (gif.url) {
                        const gifMessage = `[GIF] ${gif.url}`;
                        setNewMessage(gifMessage);
                        // Auto-send the GIF
                        setTimeout(() => {
                            const sendBtn = document.querySelector('[data-send-button]') as HTMLButtonElement;
                            if (sendBtn) sendBtn.click();
                        }, 100);
                    }
                }}
                anchorRef={gifButtonRef}
                isDarkMode={isDarkMode}
            />

            {/* Enhanced Emoji Picker */}
            <AnimatePresence>
                {showEmojiPicker && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        style={{
                            position: 'fixed',
                            bottom: 90,
                            right: 20,
                            background: colors.cardBg,
                            borderRadius: '16px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                            border: `1px solid ${colors.border}`,
                            zIndex: 1000,
                            width: '320px',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header with Search */}
                        <div style={{
                            padding: '12px',
                            borderBottom: `1px solid ${colors.border}`,
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                borderRadius: '10px',
                                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                border: `1px solid ${colors.border}`,
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                                <input
                                    type="text"
                                    value={emojiSearch}
                                    onChange={(e) => setEmojiSearch(e.target.value)}
                                    placeholder="Search emojis..."
                                    style={{
                                        flex: 1,
                                        border: 'none',
                                        background: 'transparent',
                                        color: colors.textPrimary,
                                        fontSize: '13px',
                                        outline: 'none',
                                    }}
                                />
                                {emojiSearch && (
                                    <motion.button
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setEmojiSearch('')}
                                        style={{
                                            width: 18,
                                            height: 18,
                                            borderRadius: '50%',
                                            border: 'none',
                                            background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: colors.textMuted,
                                        }}
                                    >
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </motion.button>
                                )}
                            </div>
                        </div>

                        {/* Category Tabs */}
                        <div style={{
                            display: 'flex',
                            gap: '2px',
                            padding: '8px 12px',
                            borderBottom: `1px solid ${colors.border}`,
                            overflowX: 'auto',
                        }}>
                            {EMOJI_CATEGORIES.map((category) => (
                                <motion.button
                                    key={category.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setEmojiPickerCategory(category.id);
                                        setEmojiSearch('');
                                    }}
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: emojiPickerCategory === category.id
                                            ? `${colors.accent}20`
                                            : 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                    title={category.name}
                                >
                                    {category.icon}
                                </motion.button>
                            ))}
                        </div>

                        {/* Emoji Grid */}
                        <div style={{
                            padding: '8px 12px',
                            height: '200px',
                            overflowY: 'auto',
                        }}>
                            {/* Category Label */}
                            <div style={{
                                fontSize: '11px',
                                fontWeight: 500,
                                color: colors.textMuted,
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}>
                                {emojiSearch
                                    ? 'Search Results'
                                    : EMOJI_CATEGORIES.find(c => c.id === emojiPickerCategory)?.name
                                }
                            </div>

                            {/* Emojis */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(8, 1fr)',
                                gap: '4px',
                            }}>
                                {(() => {
                                    let emojisToShow: string[] = [];

                                    if (emojiSearch) {
                                        // Search across all categories - show all unique emojis
                                        EMOJI_CATEGORIES.forEach(cat => {
                                            cat.emojis.forEach(emoji => {
                                                if (!emojisToShow.includes(emoji)) {
                                                    emojisToShow.push(emoji);
                                                }
                                            });
                                        });
                                        // Filter to first 40 for performance
                                        emojisToShow = emojisToShow.slice(0, 40);
                                    } else {
                                        const category = EMOJI_CATEGORIES.find(c => c.id === emojiPickerCategory);
                                        emojisToShow = category?.emojis || [];
                                    }

                                    if (emojisToShow.length === 0) {
                                        return (
                                            <div style={{
                                                gridColumn: '1 / -1',
                                                padding: '20px',
                                                textAlign: 'center',
                                                color: colors.textMuted,
                                                fontSize: '13px',
                                            }}>
                                                No emojis found
                                            </div>
                                        );
                                    }

                                    return emojisToShow.map((emoji, idx) => (
                                        <motion.button
                                            key={`${emoji}-${idx}`}
                                            whileHover={{ scale: 1.2, background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => {
                                                setNewMessage((prev) => prev + emoji);
                                                setShowEmojiPicker(false);
                                                setEmojiSearch('');
                                                inputRef.current?.focus();
                                            }}
                                            style={{
                                                width: '100%',
                                                aspectRatio: '1',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: 'transparent',
                                                cursor: 'pointer',
                                                fontSize: '20px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {emoji}
                                        </motion.button>
                                    ));
                                })()}
                            </div>
                        </div>

                        {/* Quick Access Footer */}
                        <div style={{
                            padding: '8px 12px',
                            borderTop: `1px solid ${colors.border}`,
                            display: 'flex',
                            gap: '4px',
                            justifyContent: 'center',
                        }}>
                            {QUICK_EMOJIS.map((emoji) => (
                                <motion.button
                                    key={emoji}
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        setNewMessage((prev) => prev + emoji);
                                        setShowEmojiPicker(false);
                                        inputRef.current?.focus();
                                    }}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {emoji}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Study Tools Menu */}
            <AnimatePresence>
                {showStudyTools && (
                    <StudyToolsMenu
                        isOpen={showStudyTools}
                        onClose={() => setShowStudyTools(false)}
                        onSelectTool={(tool) => {
                            if (tool === 'flashcard') setShowFlashcardModal(true);
                            else if (tool === 'poll') setShowPollModal(true);
                            else if (tool === 'schedule') setShowScheduleModal(true);
                            else if (tool === 'pin') setShowPinModal(true);
                            else if (tool === 'whiteboard') setShowWhiteboardModal(true);
                            else if (tool === 'voicenote') setShowVoiceNoteModal(true);
                            else if (tool === 'file') setShowFileShareModal(true);
                            else if (tool === 'material') setShowCourseMaterialModal(true);
                        }}
                        colors={colors}
                    />
                )}
            </AnimatePresence>

            {/* Flashcard Modal */}
            <AnimatePresence>
                {showFlashcardModal && (
                    <FlashcardModal
                        isOpen={showFlashcardModal}
                        onClose={() => setShowFlashcardModal(false)}
                        onSend={(front, back) => {
                            const flashcardMsg = `📚 **Flashcard**\n\n**Q:** ${front}\n\n**A:** ${back}`;
                            setNewMessage(flashcardMsg);
                            inputRef.current?.focus();
                        }}
                        colors={colors}
                    />
                )}
            </AnimatePresence>

            {/* Poll Modal */}
            <AnimatePresence>
                {showPollModal && (
                    <PollModal
                        isOpen={showPollModal}
                        onClose={() => setShowPollModal(false)}
                        onSend={(question, options) => {
                            const pollMsg = `📊 **Poll**\n\n${question}\n\n${options.map((o, i) => `${['🅰️', '🅱️', '🅲', '🅳', '🅴'][i]} ${o}`).join('\n')}`;
                            setNewMessage(pollMsg);
                            inputRef.current?.focus();
                        }}
                        colors={colors}
                    />
                )}
            </AnimatePresence>

            {/* Schedule Modal */}
            <AnimatePresence>
                {showScheduleModal && (
                    <ScheduleModal
                        isOpen={showScheduleModal}
                        onClose={() => setShowScheduleModal(false)}
                        onSend={(title, date, time) => {
                            const scheduleMsg = `📅 **Study Session**\n\n**${title}**\n🗓️ ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}\n⏰ ${time}`;
                            setNewMessage(scheduleMsg);
                            inputRef.current?.focus();
                        }}
                        colors={colors}
                    />
                )}
            </AnimatePresence>

            {/* Pin Resource Modal */}
            <AnimatePresence>
                {showPinModal && (
                    <PinResourceModal
                        isOpen={showPinModal}
                        onClose={() => setShowPinModal(false)}
                        onSend={(title, url, description) => {
                            let pinMsg = `📌 **Pinned Resource**\n\n**${title}**`;
                            if (url) pinMsg += `\n🔗 ${url}`;
                            if (description) pinMsg += `\n\n${description}`;
                            setNewMessage(pinMsg);
                            inputRef.current?.focus();
                        }}
                        colors={colors}
                    />
                )}
            </AnimatePresence>

            {/* Whiteboard Modal */}
            <AnimatePresence>
                {showWhiteboardModal && (
                    <WhiteboardModal
                        isOpen={showWhiteboardModal}
                        onClose={() => setShowWhiteboardModal(false)}
                        onSend={(dataUrl) => {
                            const whiteboardMsg = `🎨 **Whiteboard Drawing**\n\n[Drawing shared - click to view]\n\n📎 ${dataUrl.substring(0, 50)}...`;
                            setNewMessage(whiteboardMsg);
                            inputRef.current?.focus();
                        }}
                        colors={colors}
                    />
                )}
            </AnimatePresence>

            {/* Voice Note Modal */}
            <AnimatePresence>
                {showVoiceNoteModal && (
                    <VoiceNoteModal
                        isOpen={showVoiceNoteModal}
                        onClose={() => setShowVoiceNoteModal(false)}
                        onSend={(duration, transcript) => {
                            let voiceMsg = `🎤 **Voice Note** (${duration})`;
                            if (transcript) voiceMsg += `\n\n"${transcript}"`;
                            setNewMessage(voiceMsg);
                            inputRef.current?.focus();
                        }}
                        colors={colors}
                    />
                )}
            </AnimatePresence>

            {/* File Share Modal */}
            <AnimatePresence>
                {showFileShareModal && (
                    <FileShareModal
                        isOpen={showFileShareModal}
                        onClose={() => setShowFileShareModal(false)}
                        onSend={(fileName, fileType, fileSize) => {
                            const icon = fileType.includes('pdf') ? '📄' :
                                fileType.includes('image') ? '🖼️' :
                                    fileType.includes('video') ? '🎬' : '📎';
                            const fileMsg = `${icon} **Shared File**\n\n**${fileName}**\n📦 ${fileSize}`;
                            setNewMessage(fileMsg);
                            inputRef.current?.focus();
                        }}
                        colors={colors}
                    />
                )}
            </AnimatePresence>

            {/* Course Material Modal */}
            <AnimatePresence>
                {showCourseMaterialModal && (
                    <CourseMaterialModal
                        isOpen={showCourseMaterialModal}
                        onClose={() => setShowCourseMaterialModal(false)}
                        onSend={(title, url, type) => {
                            const icons: Record<string, string> = {
                                lecture: '🎥', notes: '📝', slides: '📊',
                                textbook: '📖', assignment: '📋', other: '🔗'
                            };
                            const materialMsg = `${icons[type] || '🔗'} **Course Material**\n\n**${title}**\n🔗 ${url}`;
                            setNewMessage(materialMsg);
                            inputRef.current?.focus();
                        }}
                        colors={colors}
                    />
                )}
            </AnimatePresence>

            {/* Leaderboard Modal */}
            <AnimatePresence>
                {showLeaderboard && (
                    <LeaderboardModal
                        isOpen={showLeaderboard}
                        onClose={() => setShowLeaderboard(false)}
                        members={memberStats}
                        currentUserId="current"
                        colors={colors}
                    />
                )}
            </AnimatePresence>

            {/* Group Info Modal */}
            <AnimatePresence>
                {showGroupInfo && (
                    <GroupInfoModal
                        isOpen={showGroupInfo}
                        onClose={() => setShowGroupInfo(false)}
                        groupInfo={groupInfo}
                        messageCount={messages.length}
                        colors={colors}
                        profile={profile}
                        showReadReceipts={showReadReceipts}
                        onReadReceiptsChange={setShowReadReceipts}
                    />
                )}
            </AnimatePresence>

            {/* Thread View Modal */}
            <AnimatePresence>
                {threadViewMessage && (
                    <ThreadModal
                        isOpen={!!threadViewMessage}
                        onClose={() => setThreadViewMessage(null)}
                        parentMessage={threadViewMessage}
                        allMessages={messages}
                        colors={colors}
                        currentUserId={profile?.studentId || profile?.id || ''}
                        onSendReply={(content) => {
                            // Send reply as a message with reply_to set
                            if (threadViewMessage && groupId && profile) {
                                sendMessage(
                                    groupId,
                                    profile.studentId || profile.id,
                                    profile.full_name || 'Anonymous',
                                    profile.avatar,
                                    content,
                                    'text',
                                    threadViewMessage.id
                                );
                                awardXP(5, 'Thread reply');
                            }
                        }}
                    />
                )}
            </AnimatePresence>

            {/* XP Notification */}
            <AnimatePresence>
                {xpNotification && (
                    <XPNotification
                        amount={xpNotification.amount}
                        reason={xpNotification.reason}
                        onComplete={() => setXpNotification(null)}
                    />
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowDeleteConfirm(null)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: colors.cardBg,
                                borderRadius: '16px',
                                padding: '20px',
                                width: '100%',
                                maxWidth: '320px',
                                border: `1px solid ${colors.border}`,
                                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                            }}
                        >
                            {/* Icon */}
                            <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: '12px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    <line x1="10" y1="11" x2="10" y2="17" />
                                    <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                            </div>
                            {/* Title */}
                            <h3 style={{
                                margin: '0 0 8px',
                                fontSize: '16px',
                                fontWeight: 600,
                                color: colors.textPrimary,
                                textAlign: 'center',
                            }}>
                                Delete Message?
                            </h3>
                            {/* Description */}
                            <p style={{
                                margin: '0 0 20px',
                                fontSize: '13px',
                                color: colors.textSecondary,
                                textAlign: 'center',
                                lineHeight: 1.5,
                            }}>
                                This action cannot be undone. The message will be permanently removed.
                            </p>
                            {/* Buttons */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowDeleteConfirm(null)}
                                    style={{
                                        flex: 1,
                                        padding: '10px 16px',
                                        borderRadius: '10px',
                                        border: `1px solid ${colors.border}`,
                                        background: 'transparent',
                                        color: colors.textPrimary,
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02, background: '#dc2626' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleDeleteMessage(showDeleteConfirm)}
                                    style={{
                                        flex: 1,
                                        padding: '10px 16px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: '#ef4444',
                                        color: '#fff',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Delete
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GroupChatPage;
