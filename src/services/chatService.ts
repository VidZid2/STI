/**
 * Chat Service - Group Chat functionality with Supabase
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface ChatMessage {
    id: string;
    group_id: string;
    user_id: string;
    user_name: string;
    user_avatar?: string;
    content: string;
    message_type: 'text' | 'image' | 'file' | 'system';
    created_at: string;
    updated_at?: string;
    is_edited: boolean;
    reply_to?: string;
    reactions?: Record<string, string[]>; // emoji -> user_ids
}

export interface ChatParticipant {
    user_id: string;
    user_name: string;
    user_avatar?: string;
    is_online: boolean;
    is_typing: boolean;
    last_seen: string;
}

// Fetch messages for a group
export const fetchGroupMessages = async (
    groupId: string,
    limit: number = 50,
    before?: string
): Promise<ChatMessage[]> => {
    if (!isSupabaseConfigured()) {
        return getMockMessages(groupId);
    }

    try {
        let query = supabase!
            .from('group_messages')
            .select('*')
            .eq('group_id', groupId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (before) {
            query = query.lt('created_at', before);
        }

        const { data, error } = await query;

        if (error) throw error;
        return (data || []).reverse();
    } catch (error) {
        console.error('Error fetching messages:', error);
        return getMockMessages(groupId);
    }
};

// Send a message
export const sendMessage = async (
    groupId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text',
    replyTo?: string
): Promise<ChatMessage | null> => {
    if (!isSupabaseConfigured()) {
        // Return mock message for demo
        return {
            id: `msg-${Date.now()}`,
            group_id: groupId,
            user_id: userId,
            user_name: userName,
            user_avatar: userAvatar,
            content,
            message_type: messageType,
            created_at: new Date().toISOString(),
            is_edited: false,
            reply_to: replyTo,
        };
    }

    try {
        const { data, error } = await supabase!
            .from('group_messages')
            .insert({
                group_id: groupId,
                user_id: userId,
                user_name: userName,
                user_avatar: userAvatar,
                content,
                message_type: messageType,
                reply_to: replyTo,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error sending message:', error);
        return null;
    }
};

// Edit a message
export const editMessage = async (
    messageId: string,
    newContent: string
): Promise<boolean> => {
    if (!isSupabaseConfigured()) return true;

    try {
        const { error } = await supabase!
            .from('group_messages')
            .update({ content: newContent, is_edited: true, updated_at: new Date().toISOString() })
            .eq('id', messageId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error editing message:', error);
        return false;
    }
};

// Delete a message
export const deleteMessage = async (messageId: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) return true;

    try {
        const { error } = await supabase!
            .from('group_messages')
            .delete()
            .eq('id', messageId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting message:', error);
        return false;
    }
};

// Add reaction to message
export const addReaction = async (
    messageId: string,
    emoji: string,
    userId: string
): Promise<boolean> => {
    if (!isSupabaseConfigured()) return true;

    try {
        // Get current reactions
        const { data: message } = await supabase!
            .from('group_messages')
            .select('reactions')
            .eq('id', messageId)
            .single();

        const reactions = message?.reactions || {};
        if (!reactions[emoji]) {
            reactions[emoji] = [];
        }
        if (!reactions[emoji].includes(userId)) {
            reactions[emoji].push(userId);
        }

        const { error } = await supabase!
            .from('group_messages')
            .update({ reactions })
            .eq('id', messageId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error adding reaction:', error);
        return false;
    }
};

// Subscribe to new messages
export const subscribeToMessages = (
    groupId: string,
    onMessage: (message: ChatMessage) => void
) => {
    if (!isSupabaseConfigured()) return () => {};

    const channel = supabase!
        .channel(`group-messages-${groupId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'group_messages',
                filter: `group_id=eq.${groupId}`,
            },
            (payload) => {
                onMessage(payload.new as ChatMessage);
            }
        )
        .subscribe();

    return () => {
        supabase!.removeChannel(channel);
    };
};

// Update typing status
export const updateTypingStatus = async (
    groupId: string,
    userId: string,
    isTyping: boolean
): Promise<void> => {
    if (!isSupabaseConfigured()) return;

    try {
        await supabase!
            .from('group_members')
            .update({ is_typing: isTyping })
            .eq('group_id', groupId)
            .eq('user_id', userId);
    } catch (error) {
        console.error('Error updating typing status:', error);
    }
};

// Mock messages for demo
const getMockMessages = (groupId: string): ChatMessage[] => {
    const now = new Date();
    return [
        {
            id: 'msg-1',
            group_id: groupId,
            user_id: 'user-1',
            user_name: 'Sarah Chen',
            content: 'Hey everyone! Ready for the study session? 📚',
            message_type: 'text',
            created_at: new Date(now.getTime() - 3600000).toISOString(),
            is_edited: false,
        },
        {
            id: 'msg-2',
            group_id: groupId,
            user_id: 'user-2',
            user_name: 'Mike Johnson',
            content: 'Yes! I have some questions about Chapter 5.',
            message_type: 'text',
            created_at: new Date(now.getTime() - 3000000).toISOString(),
            is_edited: false,
        },
        {
            id: 'msg-3',
            group_id: groupId,
            user_id: 'user-1',
            user_name: 'Sarah Chen',
            content: 'Sure, let me share my notes. The key concepts are really important for the exam.',
            message_type: 'text',
            created_at: new Date(now.getTime() - 2400000).toISOString(),
            is_edited: false,
        },
        {
            id: 'msg-4',
            group_id: groupId,
            user_id: 'user-3',
            user_name: 'Emma Wilson',
            content: 'Thanks Sarah! This is really helpful 🙏',
            message_type: 'text',
            created_at: new Date(now.getTime() - 1800000).toISOString(),
            is_edited: false,
        },
    ];
};

// Format message time
export const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};
