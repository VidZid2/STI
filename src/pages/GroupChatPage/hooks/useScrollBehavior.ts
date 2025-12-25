/**
 * useScrollBehavior Hook
 * Handles scroll-to-bottom, new message indicators, and unread tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChatMessage } from '../../../services/chatService';

export interface UseScrollBehaviorOptions {
    messages: ChatMessage[];
    messagesEndRef: React.RefObject<HTMLDivElement>;
}

export interface UseScrollBehaviorReturn {
    showScrollButton: boolean;
    newMessageCount: number;
    messagesContainerRef: React.RefObject<HTMLDivElement | null>;
    lastReadMessageIndex: number | null;
    unreadCount: number;
    handleScroll: () => void;
    scrollToBottom: () => void;
}

export function useScrollBehavior({
    messages,
    messagesEndRef,
}: UseScrollBehaviorOptions): UseScrollBehaviorReturn {
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [newMessageCount, setNewMessageCount] = useState(0);
    const [lastReadMessageIndex, setLastReadMessageIndex] = useState<number | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom on new messages (only if already at bottom)
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            if (isAtBottom) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            } else {
                setNewMessageCount(prev => prev + 1);
            }
        } else {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, messagesEndRef]);

    // Track unread messages
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

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setShowScrollButton(false);
        setNewMessageCount(0);
    }, [messagesEndRef]);

    return {
        showScrollButton,
        newMessageCount,
        messagesContainerRef,
        lastReadMessageIndex,
        unreadCount,
        handleScroll,
        scrollToBottom,
    };
}
