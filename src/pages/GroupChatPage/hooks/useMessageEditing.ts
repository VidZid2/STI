/**
 * useMessageEditing Hook
 * Handles message editing and deletion
 */

import { useState, useCallback } from 'react';
import { editMessage, deleteMessage, type ChatMessage } from '../../../services/chatService';

export interface UseMessageEditingOptions {
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export interface UseMessageEditingReturn {
    editingMessageId: string | null;
    editingContent: string;
    showDeleteConfirm: string | null;
    setShowDeleteConfirm: React.Dispatch<React.SetStateAction<string | null>>;
    handleStartEdit: (message: ChatMessage) => void;
    handleSaveEdit: () => Promise<void>;
    handleCancelEdit: () => void;
    handleDeleteMessage: (messageId: string) => Promise<void>;
}

export function useMessageEditing({ setMessages }: UseMessageEditingOptions): UseMessageEditingReturn {
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    const handleStartEdit = useCallback((message: ChatMessage) => {
        setEditingMessageId(message.id);
        setEditingContent(message.content);
    }, []);

    const handleSaveEdit = useCallback(async () => {
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
    }, [editingMessageId, editingContent, setMessages]);

    const handleCancelEdit = useCallback(() => {
        setEditingMessageId(null);
        setEditingContent('');
    }, []);

    const handleDeleteMessage = useCallback(async (messageId: string) => {
        const success = await deleteMessage(messageId);
        if (success) {
            setMessages(prev => prev.filter(msg => msg.id !== messageId));
        }
        setShowDeleteConfirm(null);
    }, [setMessages]);

    return {
        editingMessageId,
        editingContent,
        showDeleteConfirm,
        setShowDeleteConfirm,
        handleStartEdit,
        handleSaveEdit,
        handleCancelEdit,
        handleDeleteMessage,
    };
}
