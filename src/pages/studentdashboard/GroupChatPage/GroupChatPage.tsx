/**
 * Group Chat Page - Refactored with extracted components
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import {
    fetchGroupMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    subscribeToMessages,
    classifyMessage,
    uploadAttachments,
    type ChatMessage,
    type MessageType,
} from '../../../services/chatService';
import { saveAttachmentsAsResources } from '../../../services/resourceService';
import { getProfile, getImages } from '../../../services/profileService';
import { fetchGroups, type GroupWithMembers } from '../../../services/groupsService';

// Import types, constants, and utilities from extracted modules
import type {
    MessageReaction,
    ReplyInfo,
    UserBadge,
    MemberStats,
} from './types';
import {
    BADGES,
    XP_REWARDS,
} from './constants';
import {
    calculateLevel,
} from './utils';

// Import modal components (regular imports - lazy loading caused issues with AnimatePresence)
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
    GroupInfoModal,
} from './modals';

// Import UI components from extracted modules
import {
    GifPicker,
    type GifResult,
    XPNotification,
    StudyToolsMenu,

    type MentionUser,
    ChatHeader,
    SearchPanel,
    DeleteConfirmModal,
    EnhancedEmojiPicker,
    PinnedMessagesPanel,
    MessageInputArea,
    ChatEmptyState,
    TypingIndicator,
    ScrollToBottomButton,
    ReplyIndicator,
    MentionNotificationPreview,
    PresenceIndicator,
    PendingAttachmentsPreview,
    MessageItem,
} from './components';

// Import custom hooks
import { useMentions, usePresence } from './hooks';

const GroupChatPage: React.FC = () => {
    const { groupId } = useParams<{ groupId: string }>();

    // Core data state
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [groupInfo, setGroupInfo] = useState<GroupWithMembers | null>(null);

    // Pagination state (Messenger-style)
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const MESSAGES_PER_PAGE = 50;

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const gifButtonRef = useRef<HTMLButtonElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Consolidated modal state - only one modal can be open at a time
    type ModalType = 'none' | 'studyTools' | 'flashcard' | 'poll' | 'schedule' | 'pin' |
        'whiteboard' | 'voiceNote' | 'fileShare' | 'courseMaterial' |
        'leaderboard' | 'groupInfo' | 'thread';
    const [activeModal, setActiveModal] = useState<ModalType>('none');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Consolidated UI panel state - only one panel can be open at a time
    type PanelType = 'none' | 'emoji' | 'gif' | 'search' | 'pinned';
    const [activePanel, setActivePanel] = useState<PanelType>('none');

    // Consolidated editing state
    const [editingState, setEditingState] = useState<{
        messageId: string | null;
        content: string;
    }>({ messageId: null, content: '' });

    // Consolidated emoji picker state
    const [emojiPickerState, setEmojiPickerState] = useState({
        category: 'recent',
        search: '',
    });

    // Pending attachments state
    const [pendingAttachments, setPendingAttachments] = useState<{
        id: string;
        file: File;
        name: string;
        type: string;
        size: number;
        preview?: string;
    }[]>([]);

    // Thread view state (separate because it holds data, not just visibility)
    const [threadViewMessage, setThreadViewMessage] = useState<ChatMessage | null>(null);

    // Message enhancements state
    const [messageReactions, setMessageReactions] = useState<Record<string, MessageReaction[]>>({});
    const [replyingTo, setReplyingTo] = useState<ReplyInfo | null>(null);
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
    const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null);
    const [bookmarkedMessages, setBookmarkedMessages] = useState<Set<string>>(new Set());
    const [pinnedMessages, setPinnedMessages] = useState<Set<string>>(new Set());
    const [helpfulVotes, setHelpfulVotes] = useState<Record<string, { count: number; voted: boolean }>>({});

    // AI Message Classification state
    const [messageClassifications, setMessageClassifications] = useState<Record<string, MessageType>>({});

    // Gamification state
    const [userXP, setUserXP] = useState(245);
    const [userStreak, _setUserStreak] = useState(5);
    void _setUserStreak;
    const [xpNotification, setXpNotification] = useState<{ amount: number; reason: string } | null>(null);

    // Typing indicator state
    const [typingUsers, setTypingUsers] = useState<{ id: string; name: string; avatar?: string }[]>([]);

    // Scroll/Unread state
    const [scrollState, setScrollState] = useState({
        showButton: false,
        newMessageCount: 0,
        lastReadIndex: null as number | null,
        unreadCount: 0,
    });

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

    // Read receipts state
    const [showReadReceipts, setShowReadReceipts] = useState(true);


    // Pre-compute message counts per user (only changes when messages array length changes)
    const messageCountByUser = useMemo(() => {
        const counts: Record<string, number> = {};
        messages.forEach(msg => {
            counts[msg.user_id] = (counts[msg.user_id] || 0) + 1;
        });
        return counts;
    }, [messages.length]); // Only recalculate when message count changes, not content

    // Build member stats from real group members
    const memberStats = useMemo<MemberStats[]>(() => {
        if (!groupInfo?.members) return [];

        return groupInfo.members.map((member, index) => {
            const msgCount = messageCountByUser[member.user_id] || 0;
            const isCurrentUser = member.user_id === profile?.studentId;
            const xp = msgCount * 10;
            const level = calculateLevel(xp);

            const badges: UserBadge[] = [];
            if (msgCount >= 50) badges.push(BADGES.contributor);
            if (msgCount >= 20) badges.push(BADGES.helper);
            if (index === 0) badges.push(BADGES.earlyBird);

            return {
                odId: member.user_id,
                odName: isCurrentUser ? 'You' : member.user_name,
                streak: Math.floor(msgCount / 5),
                xp,
                level,
                badges,
                messagesCount: msgCount,
                helpfulCount: Math.floor(msgCount / 4),
            };
        }).sort((a, b) => b.xp - a.xp);
    }, [groupInfo?.members, messageCountByUser, profile?.studentId]);

    // Build mention users list from group members
    const mentionUsers = useMemo<MentionUser[]>(() => {
        if (!groupInfo?.members) return [];

        const expertiseMap: Record<string, string[]> = {};
        const SUBJECTS = ['math', 'science', 'programming', 'writing', 'language', 'history', 'business', 'art'];

        groupInfo.members.forEach(member => {
            const hash = member.user_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const numExpertise = (hash % 3) + 1;
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
                const stats = memberStats.find(s => s.odId === member.user_id);
                const availability: 'available' | 'studying' | 'busy' | 'offline' =
                    !member.is_online ? 'offline' :
                        Math.random() > 0.7 ? 'studying' : 'available';

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

    // Extract mentioned users from current message
    const mentionedUsersInMessage = useMemo(() => {
        if (!newMessage) return [];
        const mentionRegex = /@(\w+)/g;
        const mentions: string[] = [];
        let match;
        while ((match = mentionRegex.exec(newMessage)) !== null) {
            mentions.push(match[1].toLowerCase());
        }
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
    } = useMentions({
        users: mentionUsers,
        onMention: (_user) => {
        },
    });

    // Presence hook
    const presenceUser = profile ? {
        id: profile.id || profile.studentId,
        name: profile.full_name || 'Anonymous',
        avatar: profile.avatar_url,
    } : null;

    const { viewers } = usePresence({
        groupId,
        user: presenceUser,
        enabled: !!profile && !!groupId,
    });

    // Award XP function
    const awardXP = useCallback((amount: number, reason: string) => {
        setUserXP(prev => prev + amount);
        setXpNotification({ amount, reason });
    }, []);

    const isDarkMode = false;

    const colors = useMemo(() => ({
        bg: 'var(--bg-primary)',
        cardBg: 'var(--bg-primary)',
        border: 'rgba(255,255,255,0.08)',
        textPrimary: 'var(--bg-hover)',
        textSecondary: 'var(--bg-hover)',
        textMuted: 'var(--bg-hover)',
        accent: '#3b82f6',
    }), [isDarkMode]);

    // Pre-compute thread info for all messages (O(n) instead of O(n²))
    const threadInfo = useMemo(() => {
        const replyCountMap: Record<string, number> = {};
        const replyAuthorsMap: Record<string, Set<string>> = {};

        // Single pass through messages
        for (const msg of messages) {
            if (msg.reply_to) {
                replyCountMap[msg.reply_to] = (replyCountMap[msg.reply_to] || 0) + 1;
                if (!replyAuthorsMap[msg.reply_to]) {
                    replyAuthorsMap[msg.reply_to] = new Set();
                }
                replyAuthorsMap[msg.reply_to].add(msg.user_name);
            }
        }

        // Convert Sets to arrays (limited to 4)
        const uniqueAuthorsMap: Record<string, string[]> = {};
        for (const [msgId, authors] of Object.entries(replyAuthorsMap)) {
            uniqueAuthorsMap[msgId] = [...authors].slice(0, 4);
        }

        return { replyCountMap, uniqueAuthorsMap };
    }, [messages]);

    // Pre-compute member lookup map for O(1) access
    const memberLookup = useMemo(() => {
        const memberMap: Record<string, NonNullable<typeof groupInfo>['members'][0] | undefined> = {};
        const statsMap: Record<string, typeof memberStats[0] | undefined> = {};

        groupInfo?.members?.forEach(m => {
            memberMap[m.user_id] = m;
        });

        memberStats.forEach(m => {
            statsMap[m.odId] = m;
        });

        return { memberMap, statsMap };
    }, [groupInfo?.members, memberStats]);


    // Load profile and messages
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const userProfile = await getProfile();
                const userImages = await getImages();

                const formattedProfile = {
                    ...userProfile,
                    id: userProfile.studentId || `user-${Date.now()}`,
                    full_name: `${userProfile.firstName} ${userProfile.lastName}`,
                    avatar_url: userImages.profileImage
                };

                setProfile(formattedProfile);

                if (groupId) {
                    const msgs = await fetchGroupMessages(groupId, MESSAGES_PER_PAGE);
                    setMessages(msgs);
                    setHasMoreMessages(msgs.length >= MESSAGES_PER_PAGE);

                    const groups = await fetchGroups();
                    const group = groups.find(g => g.id === groupId);
                    if (group) {
                        setGroupInfo(group);
                    }
                }
            } catch (error) {
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [groupId]);

    // Load more messages (pagination - scroll up to load older)
    const loadMoreMessages = useCallback(async () => {
        if (!groupId || isLoadingMore || !hasMoreMessages || messages.length === 0) return;

        setIsLoadingMore(true);
        const container = messagesContainerRef.current;
        const scrollHeightBefore = container?.scrollHeight || 0;

        try {
            const oldestMessage = messages[0];
            const olderMessages = await fetchGroupMessages(
                groupId,
                MESSAGES_PER_PAGE,
                oldestMessage.created_at
            );

            if (olderMessages.length < MESSAGES_PER_PAGE) {
                setHasMoreMessages(false);
            }

            if (olderMessages.length > 0) {
                setMessages(prev => [...olderMessages, ...prev]);

                // Maintain scroll position after prepending messages
                requestAnimationFrame(() => {
                    if (container) {
                        const scrollHeightAfter = container.scrollHeight;
                        container.scrollTop = scrollHeightAfter - scrollHeightBefore;
                    }
                });
            }
        } catch (error) {
        } finally {
            setIsLoadingMore(false);
        }
    }, [groupId, isLoadingMore, hasMoreMessages, messages]);

    // Subscribe to new messages
    useEffect(() => {
        if (!groupId) return;

        const unsubscribe = subscribeToMessages(groupId, async (newMsg) => {
            setMessages((prev) => {
                if (prev.some(msg => msg.id === newMsg.id)) {
                    return prev;
                }
                return [...prev, newMsg];
            });

            if (!messageClassifications[newMsg.id]) {
                const result = await classifyMessage(newMsg.content);
                if (result.success && result.type !== 'general') {
                    setMessageClassifications(prev => ({ ...prev, [newMsg.id]: result.type }));
                }
            }
        });

        return unsubscribe;
    }, [groupId, messageClassifications]);

    // AI Message Classification - debounced to avoid excessive API calls
    useEffect(() => {
        // Only classify new messages (those without classification)
        const unclassifiedMessages = messages.filter(msg => !messageClassifications[msg.id]);
        if (unclassifiedMessages.length === 0) return;

        // Debounce classification to batch requests
        const timeoutId = setTimeout(async () => {
            // Only classify the last few unclassified messages to avoid overwhelming the API
            const messagesToClassify = unclassifiedMessages.slice(-5);

            for (const msg of messagesToClassify) {
                // Double-check it's still unclassified
                if (!messageClassifications[msg.id]) {
                    const result = await classifyMessage(msg.content);
                    if (result.success && result.type !== 'general') {
                        setMessageClassifications(prev => ({ ...prev, [msg.id]: result.type }));
                    }
                }
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [messages.length]); // Only trigger on new messages, not on every render

    // Scroll to bottom on new messages
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            if (isAtBottom) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            } else {
                setScrollState(prev => ({ ...prev, newMessageCount: prev.newMessageCount + 1 }));
            }
        } else {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Handle scroll - includes infinite scroll up for loading more
    // Debounced to reduce unnecessary state updates during fast scrolling
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const isNearTop = container.scrollTop < 100;

        // Load more messages immediately (has its own guards)
        if (isNearTop && hasMoreMessages && !isLoadingMore) {
            loadMoreMessages();
        }

        // Debounce UI state updates (16ms ≈ 60fps)
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
            const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

            setScrollState(prev => {
                // Only update if values actually changed
                const newShowButton = !isAtBottom;
                const newMessageCount = isAtBottom ? 0 : prev.newMessageCount;

                if (prev.showButton === newShowButton && prev.newMessageCount === newMessageCount) {
                    return prev; // No change, avoid re-render
                }

                return {
                    ...prev,
                    showButton: newShowButton,
                    newMessageCount,
                };
            });
        }, 16);
    }, [hasMoreMessages, isLoadingMore, loadMoreMessages]);

    // Scroll to bottom function
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setScrollState(prev => ({ ...prev, showButton: false, newMessageCount: 0 }));
    }, []);

    // Track unread messages
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            if (isAtBottom) {
                setScrollState(prev => ({ ...prev, lastReadIndex: null, unreadCount: 0 }));
            }
        }
    }, [messages.length]);

    // Clear typing users
    useEffect(() => {
        setTypingUsers([]);
    }, [groupId]);


    // Handle send message
    const handleSend = useCallback(async () => {
        const hasContent = newMessage.trim() || pendingAttachments.length > 0;
        if (!hasContent || !groupId || !profile || isSending) return;

        setIsSending(true);
        let content = newMessage.trim();

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
        } else if (pendingAttachments.length > 0) {
            xpAmount = XP_REWARDS.shareResource;
            xpReason = 'Shared file';
        }

        if (replyingTo) {
            content = `↩️ @${replyingTo.userName}: "${replyingTo.content}"\n\n${content}`;
        }

        const attachments = pendingAttachments.map(att => ({
            id: att.id,
            name: att.name,
            type: att.type,
            size: att.size,
            url: att.preview || '',
            thumbnail_url: att.preview,
        }));

        const messageType = pendingAttachments.some(a => a.type.startsWith('image/'))
            ? 'image'
            : pendingAttachments.length > 0
                ? 'file'
                : 'text';

        const optimisticId = `optimistic-${Date.now()}`;
        const optimisticMessage: ChatMessage = {
            id: optimisticId,
            group_id: groupId,
            user_id: profile.id || profile.studentId,
            user_name: profile.full_name || 'Anonymous',
            user_avatar: profile.avatar_url,
            content,
            message_type: messageType,
            created_at: new Date().toISOString(),
            is_edited: false,
            reply_to: replyingTo?.messageId,
            attachments: attachments.length > 0 ? attachments : undefined,
        };

        setNewMessage('');
        setReplyingTo(null);
        setPendingAttachments([]);
        setMessages((prev) => [...prev, optimisticMessage]);
        awardXP(xpAmount, xpReason);
        setIsSending(false);
        inputRef.current?.focus();

        (async () => {
            try {
                const uploadedAttachments = attachments.length > 0
                    ? await uploadAttachments(groupId, attachments)
                    : [];

                const sentMessage = await sendMessage(
                    groupId,
                    profile.id || profile.studentId,
                    profile.full_name || 'Anonymous',
                    profile.avatar_url,
                    content,
                    messageType,
                    replyingTo?.messageId,
                    uploadedAttachments.length > 0 ? uploadedAttachments : undefined
                );

                if (sentMessage) {
                    setMessages((prev) => prev.map(msg =>
                        msg.id === optimisticId ? sentMessage : msg
                    ));

                    if (uploadedAttachments.length > 0) {
                        saveAttachmentsAsResources(
                            groupId,
                            sentMessage.id,
                            profile.id || profile.studentId,
                            profile.full_name || 'Anonymous',
                            uploadedAttachments
                        ).catch(() => {});
                    }
                }
            } catch (err) {
            }
        })();
    }, [newMessage, groupId, profile, isSending, replyingTo, pendingAttachments, awardXP]);

    // Handle key press
    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    // Handle adding reaction to message
    const handleReaction = useCallback((messageId: string, emoji: string) => {
        setMessageReactions(prev => {
            const existing = prev[messageId] || [];
            const reactionIndex = existing.findIndex(r => r.emoji === emoji);

            if (reactionIndex >= 0) {
                const reaction = existing[reactionIndex];
                const userId = profile?.id || 'anonymous';
                if (reaction.users.includes(userId)) {
                    const newUsers = reaction.users.filter(u => u !== userId);
                    if (newUsers.length === 0) {
                        return { ...prev, [messageId]: existing.filter((_, i) => i !== reactionIndex) };
                    }
                    const newReactions = [...existing];
                    newReactions[reactionIndex] = { ...reaction, users: newUsers };
                    return { ...prev, [messageId]: newReactions };
                } else {
                    const newReactions = [...existing];
                    newReactions[reactionIndex] = { ...reaction, users: [...reaction.users, userId] };
                    return { ...prev, [messageId]: newReactions };
                }
            } else {
                return { ...prev, [messageId]: [...existing, { emoji, users: [profile?.id || 'anonymous'] }] };
            }
        });
        setShowReactionsFor(null);
    }, [profile?.id]);

    // Handle edit message
    const handleStartEdit = useCallback((message: ChatMessage) => {
        setEditingState({ messageId: message.id, content: message.content });
    }, []);

    const handleSaveEdit = useCallback(async () => {
        if (!editingState.messageId || !editingState.content.trim()) return;

        const success = await editMessage(editingState.messageId, editingState.content.trim());
        if (success) {
            setMessages(prev => prev.map(msg =>
                msg.id === editingState.messageId
                    ? { ...msg, content: editingState.content.trim(), is_edited: true }
                    : msg
            ));
        }
        setEditingState({ messageId: null, content: '' });
    }, [editingState.messageId, editingState.content]);

    const handleCancelEdit = useCallback(() => {
        setEditingState({ messageId: null, content: '' });
    }, []);

    // Handle delete message
    const handleDeleteMessage = useCallback(async (messageId: string) => {
        const success = await deleteMessage(messageId);
        if (success) {
            setMessages(prev => prev.filter(msg => msg.id !== messageId));
        }
        setDeleteConfirmId(null);
    }, []);

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
        setActivePanel('none');

        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        setTimeout(() => setHighlightedMessageId(null), 2000);
    }, []);

    // Memoized handlers for MessageItem to prevent re-renders
    const handleMessageLeave = useCallback(() => {
        setHoveredMessageId(null);
        setShowReactionsFor(null);
    }, []);

    const handleToggleBookmark = useCallback((id: string) => {
        setBookmarkedMessages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    }, []);

    const handleTogglePin = useCallback((id: string) => {
        setPinnedMessages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    }, []);

    const handleRequestDelete = useCallback((id: string) => {
        setDeleteConfirmId(id);
    }, []);

    const handleToggleHelpful = useCallback((id: string) => {
        setHelpfulVotes(prev => {
            const current = prev[id] || { count: 0, voted: false };
            return {
                ...prev,
                [id]: {
                    count: current.voted ? current.count - 1 : current.count + 1,
                    voted: !current.voted
                }
            };
        });
    }, []);

    const handleSetEditingContent = useCallback((content: string) => {
        setEditingState(prev => ({ ...prev, content }));
    }, []);


    // Loading state
    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div
                    style={{
                        width: 40,
                        height: 40,
                        border: `3px solid var(--border-color)`,
                        borderTopColor: 'var(--accent-color)',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }}
                />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{
            height: '100vh',
            background: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
        }}>
            {/* Header */}
            <ChatHeader
                groupInfo={groupInfo}
                groupId={groupId}
                userXP={userXP}
                userStreak={userStreak}
                showSearchPanel={activePanel === 'search'}
                onSearchToggle={() => {
                    setActivePanel(activePanel === 'search' ? 'none' : 'search');
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
                onLeaderboardOpen={() => setActiveModal('leaderboard')}
                onGroupInfoOpen={() => setActiveModal('groupInfo')}
                presenceIndicator={
                    <PresenceIndicator
                        viewers={viewers}
                        currentUserId={profile?.id || profile?.studentId || ''}
                    />
                }
            />

            {/* Search Panel */}
            <SearchPanel
                showSearchPanel={activePanel === 'search'}
                searchQuery={searchQuery}
                searchResults={searchResults}
                searchInputRef={searchInputRef}
                onSearch={handleSearch}
                onClose={() => {
                    setActivePanel('none');
                    setSearchQuery('');
                    setSearchResults([]);
                }}
                onClearSearch={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    searchInputRef.current?.focus();
                }}
                onJumpToMessage={handleJumpToMessage}
            />

            {/* Pinned Messages Panel */}
            <PinnedMessagesPanel
                pinnedMessages={pinnedMessages}
                messages={messages}
                memberStats={memberStats}
                groupMembers={groupInfo?.members}
                isExpanded={activePanel === 'pinned'}
                onToggleExpand={() => setActivePanel(activePanel === 'pinned' ? 'none' : 'pinned')}
                onUnpin={(messageId) => {
                    setPinnedMessages((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(messageId);
                        return newSet;
                    });
                }}
                onJumpToMessage={(messageId) => {
                    const element = document.getElementById(`message-${messageId}`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setHighlightedMessageId(messageId);
                        setTimeout(() => setHighlightedMessageId(null), 2000);
                    }
                }}
            />

            {/* Messages Area */}
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
                    willChange: 'scroll-position',
                    overscrollBehavior: 'contain',
                }}
            >
                {/* Load More Indicator */}
                {hasMoreMessages && (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            padding: '12px',
                            marginBottom: '8px',
                        }}
                    >
                        {isLoadingMore ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                                <div
                                    style={{
                                        width: 16,
                                        height: 16,
                                        border: `2px solid var(--border-color)`,
                                        borderTopColor: 'var(--accent-color)',
                                        borderRadius: '50%',
                                        animation: 'spin 0.8s linear infinite',
                                    }}
                                />
                                <span style={{ fontSize: '12px' }}>Loading older messages...</span>
                            </div>
                        ) : (
                            <button
                                onClick={loadMoreMessages}
                                style={{
                                    padding: '8px 16px',
                                    fontSize: '12px',
                                    color: 'var(--accent-color)',
                                    background: 'transparent',
                                    border: `1px solid var(--border-color)`,
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                ↑ Load older messages
                            </button>
                        )}
                    </div>
                )}

                {/* No More Messages Indicator */}
                {!hasMoreMessages && messages.length > 0 && (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: '12px',
                            marginBottom: '8px',
                            color: 'var(--text-muted)',
                            fontSize: '12px',
                        }}
                    >
                        — Beginning of conversation —
                    </div>
                )}

                {/* Empty State */}
                <AnimatePresence>
                    {messages.length === 0 && !isLoading && <ChatEmptyState />}
                </AnimatePresence>

                {/* Messages - removed AnimatePresence for better performance */}
                {messages.map((message, index) => {
                    const prevMessage = messages[index - 1];
                    const nextMessage = messages[index + 1];
                    const memberInfo = memberLookup.memberMap[message.user_id];
                    const memberStats_user = memberLookup.statsMap[message.user_id];

                    // Use pre-computed thread info (O(1) lookup)
                    const replyCount = threadInfo.replyCountMap[message.id] || 0;
                    const uniqueAuthors = threadInfo.uniqueAuthorsMap[message.id] || [];

                    return (
                        <MessageItem
                            key={message.id}
                            message={message}
                            prevMessage={prevMessage}
                            nextMessage={nextMessage}
                            currentUserId={profile?.id || profile?.studentId || ''}
                            currentUserName={profile?.full_name || ''}
                            memberIsOnline={memberInfo?.is_online ?? false}
                            memberRole={memberInfo?.role as 'owner' | 'admin' | 'member' | undefined}
                            memberLevel={memberStats_user?.level || 1}
                            memberStreak={memberStats_user?.streak || 0}
                            memberStats={memberStats_user}
                            reactions={messageReactions[message.id] || []}
                            isHovered={hoveredMessageId === message.id}
                            isHighlighted={highlightedMessageId === message.id}
                            isBookmarked={bookmarkedMessages.has(message.id)}
                            isPinned={pinnedMessages.has(message.id)}
                            isEditing={editingState.messageId === message.id}
                            editingContent={editingState.content}
                            messageType={messageClassifications[message.id]}
                            helpfulVote={helpfulVotes[message.id]}
                            showReactionsFor={showReactionsFor === message.id}
                            replyCount={replyCount}
                            uniqueAuthors={uniqueAuthors}
                            showUnreadIndicator={scrollState.lastReadIndex !== null && index === scrollState.lastReadIndex && scrollState.unreadCount > 0}
                            unreadCount={scrollState.unreadCount}
                            onHover={setHoveredMessageId}
                            onLeave={handleMessageLeave}
                            onReaction={handleReaction}
                            onToggleReactions={setShowReactionsFor}
                            onOpenThread={setThreadViewMessage}
                            onToggleBookmark={handleToggleBookmark}
                            onTogglePin={handleTogglePin}
                            onEdit={handleStartEdit}
                            onDelete={handleRequestDelete}
                            onToggleHelpful={handleToggleHelpful}
                            onSetEditingContent={handleSetEditingContent}
                            onSaveEdit={handleSaveEdit}
                            onCancelEdit={handleCancelEdit}
                        />
                    );
                })}
                <div ref={messagesEndRef} />

                <AnimatePresence>
                    {typingUsers.length > 0 && (
                        <TypingIndicator
                            typingUsers={typingUsers}
                            textMutedColor={'var(--text-muted)'}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Scroll to Bottom Button */}
            <AnimatePresence>
                {scrollState.showButton && (
                    <ScrollToBottomButton
                        newMessageCount={scrollState.newMessageCount}
                        onScrollToBottom={scrollToBottom}
                    />
                )}
            </AnimatePresence>


            {/* Bottom Fixed Container */}
            <div style={{
                flexShrink: 0,
                zIndex: 100,
                background: 'var(--dashboard-surface)',
                borderTop: `1px solid var(--border-color)`,
            }}>
                <ReplyIndicator
                    replyingTo={replyingTo}
                    onCancel={() => setReplyingTo(null)}
                />

                <MentionNotificationPreview
                    mentionedUsers={mentionedUsersInMessage}
                />

                <PendingAttachmentsPreview
                    attachments={pendingAttachments}
                    onClearAll={() => setPendingAttachments([])}
                    onRemove={(id) => setPendingAttachments(prev => prev.filter(a => a.id !== id))}
                    formatFileSize={(bytes) => {
                        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
                    }}
                />

                <MessageInputArea
                    newMessage={newMessage}
                    replyingTo={replyingTo}
                    hasMentionedUsers={mentionedUsersInMessage.length > 0}
                    hasAttachments={pendingAttachments.length > 0}
                    mentionUsers={mentionUsers}
                    mentionQuery={mentionQuery}
                    isMentionsOpen={isMentionsOpen}
                    showEmojiPicker={activePanel === 'emoji'}
                    showGifPicker={activePanel === 'gif'}
                    isSending={isSending}
                    inputRef={inputRef}
                    gifButtonRef={gifButtonRef}
                    onMessageChange={setNewMessage}
                    onMentionInputChange={handleMentionInputChange}
                    onKeyDown={(e) => {
                        if (isMentionsOpen && (e.key === 'Enter' || e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                            return;
                        }
                        handleKeyPress(e);
                    }}
                    onMentionSelect={handleMentionSelect}
                    onCloseMentions={closeMentions}
                    onStudyToolsClick={() => setActiveModal('studyTools')}
                    onAttachClick={() => setActiveModal('fileShare')}
                    onEmojiToggle={() => setActivePanel(activePanel === 'emoji' ? 'none' : 'emoji')}
                    onGifToggle={() => setActivePanel(activePanel === 'gif' ? 'none' : 'gif')}
                    onVoiceNoteClick={() => setActiveModal('voiceNote')}
                    onSend={handleSend}
                />
            </div>

            {/* GIF Picker */}
            <GifPicker
                isOpen={activePanel === 'gif'}
                onClose={() => setActivePanel('none')}
                onSelect={(gif: GifResult) => {
                    if (gif.url) {
                        const gifMessage = `[GIF] ${gif.url}`;
                        setNewMessage(gifMessage);
                        setTimeout(() => {
                            const sendBtn = document.querySelector('[data-send-button]') as HTMLButtonElement;
                            if (sendBtn) sendBtn.click();
                        }, 100);
                    }
                }}
                anchorRef={gifButtonRef}
            />

            {/* Enhanced Emoji Picker */}
            <EnhancedEmojiPicker
                isOpen={activePanel === 'emoji'}
                emojiSearch={emojiPickerState.search}
                emojiPickerCategory={emojiPickerState.category}
                onEmojiSearchChange={(search) => setEmojiPickerState(prev => ({ ...prev, search }))}
                onCategoryChange={(category) => setEmojiPickerState(prev => ({ ...prev, category }))}
                onEmojiSelect={(emoji) => {
                    setNewMessage((prev) => prev + emoji);
                    inputRef.current?.focus();
                }}
                onClose={() => {
                    setActivePanel('none');
                    setEmojiPickerState(prev => ({ ...prev, search: '' }));
                }}
            />

            {/* Study Tools Menu */}
            <AnimatePresence>
                {activeModal === 'studyTools' && (
                    <StudyToolsMenu
                        isOpen={activeModal === 'studyTools'}
                        onClose={() => setActiveModal('none')}
                        onSelectTool={(tool) => {
                            if (tool === 'flashcard') setActiveModal('flashcard');
                            else if (tool === 'poll') setActiveModal('poll');
                            else if (tool === 'schedule') setActiveModal('schedule');
                            else if (tool === 'pin') setActiveModal('pin');
                            else if (tool === 'whiteboard') setActiveModal('whiteboard');
                            else if (tool === 'voicenote') setActiveModal('voiceNote');
                            else if (tool === 'file') setActiveModal('fileShare');
                            else if (tool === 'material') setActiveModal('courseMaterial');
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Modals */}
            <AnimatePresence>
                {activeModal === 'flashcard' && (
                    <FlashcardModal
                        isOpen={activeModal === 'flashcard'}
                        onClose={() => setActiveModal('none')}
                        onSend={(front, back) => {
                            const flashcardMsg = `📚 **Flashcard**\n\n**Q:** ${front}\n\n**A:** ${back}`;
                            setNewMessage(flashcardMsg);
                            inputRef.current?.focus();
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {activeModal === 'poll' && (
                    <PollModal
                        isOpen={activeModal === 'poll'}
                        onClose={() => setActiveModal('none')}
                        onSend={(question, options) => {
                            const pollMsg = `📊 **Poll**\n\n${question}\n\n${options.map((o, i) => `${['🅰️', '🅱️', '🅲', '🅳', '🅴'][i]} ${o}`).join('\n')}`;
                            setNewMessage(pollMsg);
                            inputRef.current?.focus();
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {activeModal === 'schedule' && (
                    <ScheduleModal
                        isOpen={activeModal === 'schedule'}
                        onClose={() => setActiveModal('none')}
                        onSend={(title, date, time) => {
                            const scheduleMsg = `📅 **Study Session**\n\n**${title}**\n🗓️ ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}\n⏰ ${time}`;
                            setNewMessage(scheduleMsg);
                            inputRef.current?.focus();
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {activeModal === 'pin' && (
                    <PinResourceModal
                        isOpen={activeModal === 'pin'}
                        onClose={() => setActiveModal('none')}
                        onSend={(title, url, description) => {
                            let pinMsg = `📌 **Pinned Resource**\n\n**${title}**`;
                            if (url) pinMsg += `\n🔗 ${url}`;
                            if (description) pinMsg += `\n\n${description}`;
                            setNewMessage(pinMsg);
                            inputRef.current?.focus();
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {activeModal === 'whiteboard' && (
                    <WhiteboardModal
                        isOpen={activeModal === 'whiteboard'}
                        onClose={() => setActiveModal('none')}
                        onSend={(dataUrl) => {
                            const whiteboardMsg = `🎨 **Whiteboard Drawing**\n\n[Drawing shared - click to view]\n\n🔎 ${dataUrl.substring(0, 50)}...`;
                            setNewMessage(whiteboardMsg);
                            inputRef.current?.focus();
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {activeModal === 'voiceNote' && (
                    <VoiceNoteModal
                        isOpen={activeModal === 'voiceNote'}
                        onClose={() => setActiveModal('none')}
                        onSend={(duration, transcript) => {
                            let voiceMsg = `🎤 **Voice Note** (${duration})`;
                            if (transcript) voiceMsg += `\n\n"${transcript}"`;
                            setNewMessage(voiceMsg);
                            inputRef.current?.focus();
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {activeModal === 'fileShare' && (
                    <FileShareModal
                        isOpen={activeModal === 'fileShare'}
                        onClose={() => setActiveModal('none')}
                        onSend={(fileName, fileType, fileSize, _preview, files) => {
                            if (files && files.length > 0) {
                                const newAttachments = files.map((f, idx) => ({
                                    id: `${Date.now()}-${idx}`,
                                    file: f.file || new File([], f.name),
                                    name: f.name,
                                    type: f.type,
                                    size: f.size,
                                    preview: f.preview,
                                }));
                                setPendingAttachments(prev => [...prev, ...newAttachments]);
                            } else {
                                const icon = fileType.includes('pdf') ? '📄' :
                                    fileType.includes('image') ? '🖼️' :
                                        fileType.includes('video') ? '🎬' : '📎';
                                const fileMsg = `${icon} **Shared File**\n\n**${fileName}**\n📦 ${fileSize}`;
                                setNewMessage(fileMsg);
                            }

                            setActiveModal('none');
                            inputRef.current?.focus();
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {activeModal === 'courseMaterial' && (
                    <CourseMaterialModal
                        isOpen={activeModal === 'courseMaterial'}
                        onClose={() => setActiveModal('none')}
                        onSend={(title, url, type) => {
                            const icons: Record<string, string> = {
                                lecture: '🎥', notes: '📝', slides: '📊',
                                textbook: '📖', assignment: '📋', other: '🔗'
                            };
                            const materialMsg = `${icons[type] || '🔗'} **Course Material**\n\n**${title}**\n🔗 ${url}`;
                            setNewMessage(materialMsg);
                            inputRef.current?.focus();
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {activeModal === 'leaderboard' && (
                    <LeaderboardModal
                        isOpen={activeModal === 'leaderboard'}
                        onClose={() => setActiveModal('none')}
                        members={memberStats}
                        currentUserId="current"
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {activeModal === 'groupInfo' && (
                    <GroupInfoModal
                        isOpen={activeModal === 'groupInfo'}
                        onClose={() => setActiveModal('none')}
                        groupInfo={groupInfo}
                        messageCount={messages.length}
                        profile={profile}
                        showReadReceipts={showReadReceipts}
                        onReadReceiptsChange={setShowReadReceipts}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {threadViewMessage && (
                    <ThreadModal
                        isOpen={!!threadViewMessage}
                        onClose={() => setThreadViewMessage(null)}
                        parentMessage={threadViewMessage}
                        allMessages={messages}
                        currentUserId={profile?.studentId || profile?.id || ''}
                        onSendReply={(content) => {
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
            <DeleteConfirmModal
                isOpen={!!deleteConfirmId}
                onCancel={() => setDeleteConfirmId(null)}
                onConfirm={() => handleDeleteMessage(deleteConfirmId!)}
            />
        </div>
    );
};

export default GroupChatPage;
