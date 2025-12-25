/**
 * useMessageSearch Hook
 * Handles message search functionality
 */

import { useState, useCallback, useRef } from 'react';
import type { ChatMessage } from '../../../services/chatService';

export interface UseMessageSearchReturn {
    showSearchPanel: boolean;
    setShowSearchPanel: React.Dispatch<React.SetStateAction<boolean>>;
    searchQuery: string;
    searchResults: ChatMessage[];
    highlightedMessageId: string | null;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    handleSearch: (query: string) => void;
    handleJumpToMessage: (messageId: string) => void;
    clearSearch: () => void;
}

export function useMessageSearch(messages: ChatMessage[]): UseMessageSearchReturn {
    const [showSearchPanel, setShowSearchPanel] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

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
        
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        setTimeout(() => setHighlightedMessageId(null), 2000);
    }, []);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
        setSearchResults([]);
        setHighlightedMessageId(null);
    }, []);

    return {
        showSearchPanel,
        setShowSearchPanel,
        searchQuery,
        searchResults,
        highlightedMessageId,
        searchInputRef,
        handleSearch,
        handleJumpToMessage,
        clearSearch,
    };
}
