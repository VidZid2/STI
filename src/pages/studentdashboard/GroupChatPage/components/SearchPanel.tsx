/**
 * SearchPanel - Message search panel component for GroupChat
 * Extracted from GroupChatPage.tsx for modularity
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ChatMessage } from '../../../../services/chatService';
import { formatTime } from '../utils';

interface SearchPanelProps {
    showSearchPanel: boolean;
    searchQuery: string;
    searchResults: ChatMessage[];
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    
    
    onSearch: (query: string) => void;
    onClose: () => void;
    onClearSearch: () => void;
    onJumpToMessage: (messageId: string) => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
    showSearchPanel,
    searchQuery,
    searchResults,
    searchInputRef,
    
    
    onSearch,
    onClose,
    onClearSearch,
    onJumpToMessage }) => {
    return (
        <AnimatePresence>
            {showSearchPanel && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{
                        background: 'var(--dashboard-surface)',
                        borderBottom: `1px solid var(--border-color)`,
                        overflow: 'hidden',
                        flexShrink: 0,
                        zIndex: 99 }}
                >
                    <div style={{ padding: '12px 20px' }}>
                        {/* Search Input */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            background: 'var(--dashboard-surface)',
                            border: `1px solid var(--border-color)` }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={'var(--text-muted)'} strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => onSearch(e.target.value)}
                                placeholder="Search messages..."
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'var(--text-primary)',
                                    fontSize: '14px',
                                    outline: 'none' }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        onClose();
                                    }
                                }}
                            />
                            {searchQuery && (
                                <motion.button
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClearSearch}
                                    style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: 'var(--bg-hover)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--text-muted)' }}
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
                                    color: 'var(--text-muted)',
                                    marginBottom: '8px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px' }}>
                                    {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
                                </div>
                                <div style={{
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px' }}>
                                    {searchResults.length === 0 ? (
                                        <div style={{
                                            padding: '16px',
                                            textAlign: 'center',
                                            color: 'var(--text-muted)',
                                            fontSize: '13px' }}>
                                            No messages found
                                        </div>
                                    ) : (
                                        searchResults.map((result) => (
                                            <motion.button
                                                key={result.id}
                                                whileHover={{ scale: 1.01, background: 'var(--bg-hover)' }}
                                                whileTap={{ scale: 0.99 }}
                                                onClick={() => onJumpToMessage(result.id)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '10px',
                                                    padding: '10px 12px',
                                                    borderRadius: '10px',
                                                    border: 'none',
                                                    background: 'var(--dashboard-surface)',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    width: '100%' }}
                                            >
                                                {/* Avatar */}
                                                <div style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: '8px',
                                                    background: `linear-gradient(135deg, var(--accent-color)20 0%, var(--accent-color)10 100%)`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    color: 'var(--accent-color)',
                                                    flexShrink: 0 }}>
                                                    {result.user_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                {/* Content */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        marginBottom: '2px' }}>
                                                        <span style={{
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            color: 'var(--text-primary)' }}>
                                                            {result.user_name}
                                                        </span>
                                                        <span style={{
                                                            fontSize: '10px',
                                                            color: 'var(--text-muted)' }}>
                                                            {formatTime(result.created_at)}
                                                        </span>
                                                    </div>
                                                    <p style={{
                                                        margin: 0,
                                                        fontSize: '12px',
                                                        color: 'var(--text-secondary)',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap' }}>
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
                                                                        background: `var(--accent-color)30`,
                                                                        color: 'var(--accent-color)',
                                                                        fontWeight: 600,
                                                                        padding: '0 2px',
                                                                        borderRadius: '2px' }}>
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
                                                    stroke={'var(--text-muted)'}
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
    );
};

export default SearchPanel;
