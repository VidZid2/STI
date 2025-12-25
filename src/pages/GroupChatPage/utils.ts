/**
 * GroupChatPage Utilities
 * Helper functions for the group chat feature
 */

import type { ChatMessage } from '../../services/chatService';

// Calculate level from XP
export const calculateLevel = (xp: number): number => Math.floor(xp / 100) + 1;

// Calculate XP remaining to next level
export const xpToNextLevel = (xp: number): number => 100 - (xp % 100);

// Format timestamp for message display
export const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

// Format date for date separators
export const formatDateSeparator = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset time for comparison
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    
    if (dateOnly.getTime() === todayOnly.getTime()) {
        return 'Today';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    }
};

// Check if we should show date separator before a message
export const shouldShowDateSeparator = (
    currentMsg: ChatMessage, 
    prevMsg: ChatMessage | undefined
): boolean => {
    if (!prevMsg) return true; // Always show for first message
    
    const currentDate = new Date(currentMsg.created_at);
    const prevDate = new Date(prevMsg.created_at);
    
    // Compare dates (ignoring time)
    return currentDate.toDateString() !== prevDate.toDateString();
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Format duration for voice notes
export const formatDuration = (seconds: number): string => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
};

// Format date for group info
export const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Format time as relative (e.g., "Just now", "5m ago", "2h ago")
export const formatTimeRelative = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
