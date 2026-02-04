/**
 * useMentions Hook
 * Handles @mention detection, autocomplete state, and text manipulation
 */

import { useState, useCallback } from 'react';
import type { MentionUser } from '../components/MentionAutocomplete';

export interface UseMentionsOptions {
    users: MentionUser[];
    onMention?: (user: MentionUser) => void;
}

export interface UseMentionsReturn {
    // State
    isOpen: boolean;
    query: string;
    mentionedUsers: MentionUser[];
    
    // Actions
    handleInputChange: (value: string, cursorPosition: number) => void;
    handleSelect: (user: MentionUser) => { newValue: string; newCursorPosition: number };
    closeMentions: () => void;
    
    // Helpers
    formatMessageWithMentions: (content: string) => React.ReactNode[];
    extractMentions: (content: string) => string[];
}

export const useMentions = ({ users, onMention }: UseMentionsOptions): UseMentionsReturn => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
    const [currentValue, setCurrentValue] = useState('');
    const [mentionedUsers, setMentionedUsers] = useState<MentionUser[]>([]);

    // Detect @ symbol and extract query
    const handleInputChange = useCallback((value: string, cursorPosition: number) => {
        setCurrentValue(value);
        
        // Find the @ symbol before cursor
        const textBeforeCursor = value.slice(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');
        
        if (lastAtIndex === -1) {
            setIsOpen(false);
            setQuery('');
            setMentionStartIndex(null);
            return;
        }
        
        // Check if @ is at start or after a space/newline
        const charBeforeAt = lastAtIndex > 0 ? value[lastAtIndex - 1] : ' ';
        const isValidMentionStart = charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0;
        
        if (!isValidMentionStart) {
            setIsOpen(false);
            setQuery('');
            setMentionStartIndex(null);
            return;
        }
        
        // Extract query after @
        const queryText = textBeforeCursor.slice(lastAtIndex + 1);
        
        // Check if query contains space (mention ended)
        if (queryText.includes(' ') || queryText.includes('\n')) {
            setIsOpen(false);
            setQuery('');
            setMentionStartIndex(null);
            return;
        }
        
        // Valid mention in progress
        setMentionStartIndex(lastAtIndex);
        setQuery(queryText);
        setIsOpen(true);
    }, []);

    // Handle user selection from autocomplete
    const handleSelect = useCallback((user: MentionUser): { newValue: string; newCursorPosition: number } => {
        if (mentionStartIndex === null) {
            return { newValue: currentValue, newCursorPosition: currentValue.length };
        }
        
        // Replace @query with @username
        const beforeMention = currentValue.slice(0, mentionStartIndex);
        const afterMention = currentValue.slice(mentionStartIndex + query.length + 1);
        const mentionText = `@${user.name} `;
        const newValue = beforeMention + mentionText + afterMention;
        const newCursorPosition = mentionStartIndex + mentionText.length;
        
        // Track mentioned user
        setMentionedUsers(prev => {
            if (prev.find(u => u.id === user.id)) return prev;
            return [...prev, user];
        });
        
        // Callback
        onMention?.(user);
        
        // Close autocomplete
        setIsOpen(false);
        setQuery('');
        setMentionStartIndex(null);
        
        return { newValue, newCursorPosition };
    }, [mentionStartIndex, currentValue, query, onMention]);

    // Close mentions dropdown
    const closeMentions = useCallback(() => {
        setIsOpen(false);
        setQuery('');
        setMentionStartIndex(null);
    }, []);

    // Format message content with highlighted mentions
    const formatMessageWithMentions = useCallback((content: string): React.ReactNode[] => {
        // Regex to match @username (word characters and spaces until next @ or end)
        const mentionRegex = /@([A-Za-z\s]+?)(?=\s@|\s|$)/g;
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match;
        
        while ((match = mentionRegex.exec(content)) !== null) {
            // Add text before mention
            if (match.index > lastIndex) {
                parts.push(content.slice(lastIndex, match.index));
            }
            
            const mentionName = match[1].trim();
            const mentionedUser = users.find(u => 
                u.name.toLowerCase() === mentionName.toLowerCase()
            );
            
            // Add mention span
            parts.push(
                <span
                    key={`mention-${match.index}`}
                    style={{
                        color: '#3b82f6',
                        fontWeight: 500,
                        background: 'rgba(59, 130, 246, 0.1)',
                        padding: '1px 4px',
                        borderRadius: '4px',
                        cursor: mentionedUser ? 'pointer' : 'default',
                    }}
                    title={mentionedUser ? `Click to view ${mentionedUser.name}'s profile` : undefined}
                >
                    @{mentionName}
                </span>
            );
            
            lastIndex = match.index + match[0].length;
        }
        
        // Add remaining text
        if (lastIndex < content.length) {
            parts.push(content.slice(lastIndex));
        }
        
        return parts.length > 0 ? parts : [content];
    }, [users]);

    // Extract mentioned usernames from content
    const extractMentions = useCallback((content: string): string[] => {
        const mentionRegex = /@([A-Za-z\s]+?)(?=\s@|\s|$)/g;
        const mentions: string[] = [];
        let match;
        
        while ((match = mentionRegex.exec(content)) !== null) {
            mentions.push(match[1].trim());
        }
        
        return mentions;
    }, []);

    return {
        isOpen,
        query,
        mentionedUsers,
        handleInputChange,
        handleSelect,
        closeMentions,
        formatMessageWithMentions,
        extractMentions,
    };
};

export default useMentions;
