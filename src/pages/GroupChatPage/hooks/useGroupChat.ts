/**
 * useGroupChat Hook
 * Core chat state management - messages, profile, group info
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    fetchGroupMessages,
    sendMessage,
    subscribeToMessages,
    classifyMessage,
    type ChatMessage,
    type MessageType,
} from '../../../services/chatService';
import { getProfile } from '../../../services/profileService';
import { fetchGroups, type GroupWithMembers } from '../../../services/groupsService';
import { XP_REWARDS } from '../constants';
import type { ReplyInfo } from '../types';

export interface UseGroupChatOptions {
    groupId: string | undefined;
    onXPAwarded?: (amount: number, reason: string) => void;
}

export interface UseGroupChatReturn {
    messages: ChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    newMessage: string;
    setNewMessage: React.Dispatch<React.SetStateAction<string>>;
    isLoading: boolean;
    isSending: boolean;
    profile: any;
    groupInfo: GroupWithMembers | null;
    messageClassifications: Record<string, MessageType>;
    replyingTo: ReplyInfo | null;
    setReplyingTo: React.Dispatch<React.SetStateAction<ReplyInfo | null>>;
    handleSend: () => Promise<void>;
    handleKeyPress: (e: React.KeyboardEvent) => void;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function useGroupChat({ groupId, onXPAwarded }: UseGroupChatOptions): UseGroupChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [groupInfo, setGroupInfo] = useState<GroupWithMembers | null>(null);
    const [messageClassifications, setMessageClassifications] = useState<Record<string, MessageType>>({});
    const [replyingTo, setReplyingTo] = useState<ReplyInfo | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

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
            setMessages((prev) => [...prev, newMsg]);

            if (!messageClassifications[newMsg.id]) {
                const result = await classifyMessage(newMsg.content);
                if (result.success && result.type !== 'general') {
                    setMessageClassifications(prev => ({ ...prev, [newMsg.id]: result.type }));
                }
            }
        });

        return unsubscribe;
    }, [groupId, messageClassifications]);

    // AI Message Classification
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
    }, [messages, messageClassifications]);

    // Handle send message
    const handleSend = useCallback(async () => {
        if (!newMessage.trim() || !groupId || !profile || isSending) return;

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
        }

        if (replyingTo) {
            content = `↩️ @${replyingTo.userName}: "${replyingTo.content}"\n\n${content}`;
        }

        setNewMessage('');
        setReplyingTo(null);

        const sentMessage = await sendMessage(
            groupId,
            profile.id,
            profile.full_name || 'Anonymous',
            profile.avatar_url,
            content
        );

        if (sentMessage) {
            setMessages((prev) => [...prev, sentMessage]);
            onXPAwarded?.(xpAmount, xpReason);
        }

        setIsSending(false);
        inputRef.current?.focus();
    }, [newMessage, groupId, profile, isSending, replyingTo, onXPAwarded]);

    // Handle key press
    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    return {
        messages,
        setMessages,
        newMessage,
        setNewMessage,
        isLoading,
        isSending,
        profile,
        groupInfo,
        messageClassifications,
        replyingTo,
        setReplyingTo,
        handleSend,
        handleKeyPress,
        messagesEndRef,
        inputRef,
    };
}
