/**
 * useMessageReactions Hook
 * Handles message reactions, replies, bookmarks, and helpful votes
 */

import { useState, useCallback } from 'react';
import type { ChatMessage } from '../../../services/chatService';
import type { MessageReaction, ReplyInfo } from '../types';

export interface UseMessageReactionsOptions {
    profileId?: string;
    inputRef?: React.RefObject<HTMLTextAreaElement>;
    setReplyingTo?: React.Dispatch<React.SetStateAction<ReplyInfo | null>>;
}

export interface UseMessageReactionsReturn {
    messageReactions: Record<string, MessageReaction[]>;
    hoveredMessageId: string | null;
    setHoveredMessageId: React.Dispatch<React.SetStateAction<string | null>>;
    showReactionsFor: string | null;
    setShowReactionsFor: React.Dispatch<React.SetStateAction<string | null>>;
    bookmarkedMessages: Set<string>;
    helpfulVotes: Record<string, { count: number; voted: boolean }>;
    handleReaction: (messageId: string, emoji: string) => void;
    handleReply: (message: ChatMessage) => void;
    toggleBookmark: (messageId: string) => void;
    toggleHelpful: (messageId: string) => void;
}

export function useMessageReactions({
    profileId,
    inputRef,
    setReplyingTo,
}: UseMessageReactionsOptions): UseMessageReactionsReturn {
    const [messageReactions, setMessageReactions] = useState<Record<string, MessageReaction[]>>({});
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
    const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null);
    const [bookmarkedMessages, setBookmarkedMessages] = useState<Set<string>>(new Set());
    const [helpfulVotes, setHelpfulVotes] = useState<Record<string, { count: number; voted: boolean }>>({});

    const handleReaction = useCallback((messageId: string, emoji: string) => {
        setMessageReactions(prev => {
            const existing = prev[messageId] || [];
            const reactionIndex = existing.findIndex(r => r.emoji === emoji);
            const userId = profileId || 'anonymous';
            
            if (reactionIndex >= 0) {
                const reaction = existing[reactionIndex];
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
                return { ...prev, [messageId]: [...existing, { emoji, users: [userId] }] };
            }
        });
        setShowReactionsFor(null);
    }, [profileId]);

    const handleReply = useCallback((message: ChatMessage) => {
        setReplyingTo?.({
            messageId: message.id,
            userName: message.user_name,
            content: message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content,
        });
        inputRef?.current?.focus();
    }, [inputRef, setReplyingTo]);

    const toggleBookmark = useCallback((messageId: string) => {
        setBookmarkedMessages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(messageId)) {
                newSet.delete(messageId);
            } else {
                newSet.add(messageId);
            }
            return newSet;
        });
    }, []);

    const toggleHelpful = useCallback((messageId: string) => {
        setHelpfulVotes(prev => {
            const current = prev[messageId] || { count: 0, voted: false };
            return {
                ...prev,
                [messageId]: {
                    count: current.voted ? current.count - 1 : current.count + 1,
                    voted: !current.voted,
                },
            };
        });
    }, []);

    return {
        messageReactions,
        hoveredMessageId,
        setHoveredMessageId,
        showReactionsFor,
        setShowReactionsFor,
        bookmarkedMessages,
        helpfulVotes,
        handleReaction,
        handleReply,
        toggleBookmark,
        toggleHelpful,
    };
}
