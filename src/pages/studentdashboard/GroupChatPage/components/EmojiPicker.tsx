/**
 * EmojiPicker Component
 * A searchable emoji picker with categories and quick access emojis
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EMOJI_CATEGORIES, QUICK_EMOJIS } from '../constants';

interface EmojiPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (emoji: string) => void;
    isDarkMode: boolean;
    colors: {
        cardBg: string;
        border: string;
        textPrimary: string;
        textMuted: string;
        accent: string;
    };
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
    isOpen,
    onClose,
    onSelect,
    isDarkMode,
    colors,
}) => {
    const [emojiSearch, setEmojiSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('recent');

    const handleEmojiClick = (emoji: string) => {
        onSelect(emoji);
        onClose();
        setEmojiSearch('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    style={{
                        position: 'fixed',
                        bottom: 90,
                        right: 20,
                        background: 'var(--dashboard-surface)',
                        borderRadius: '16px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        border: `1px solid var(--border-color)`,
                        zIndex: 1000,
                        width: '320px',
                        overflow: 'hidden',
                    }}
                >
                    {/* Header with Search */}
                    <div style={{
                        padding: '12px',
                        borderBottom: `1px solid var(--border-color)`,
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            background: 'var(--dashboard-surface)',
                            border: `1px solid var(--border-color)`,
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={'var(--text-muted)'} strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                value={emojiSearch}
                                onChange={(e) => setEmojiSearch(e.target.value)}
                                placeholder="Search emojis..."
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'var(--text-primary)',
                                    fontSize: '13px',
                                    outline: 'none',
                                }}
                            />
                            {emojiSearch && (
                                <motion.button
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setEmojiSearch('')}
                                    style={{
                                        width: 18,
                                        height: 18,
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: 'var(--bg-hover)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--text-muted)',
                                    }}
                                >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </motion.button>
                            )}
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <div style={{
                        display: 'flex',
                        gap: '2px',
                        padding: '8px 12px',
                        borderBottom: `1px solid var(--border-color)`,
                        overflowX: 'auto',
                    }}>
                        {EMOJI_CATEGORIES.map((category) => (
                            <motion.button
                                key={category.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setSelectedCategory(category.id);
                                    setEmojiSearch('');
                                }}
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: selectedCategory === category.id
                                        ? `var(--accent-color)20`
                                        : 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                                title={category.name}
                            >
                                {category.icon}
                            </motion.button>
                        ))}
                    </div>

                    {/* Emoji Grid */}
                    <div style={{
                        padding: '8px 12px',
                        height: '200px',
                        overflowY: 'auto',
                    }}>
                        {/* Category Label */}
                        <div style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            color: 'var(--text-muted)',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}>
                            {emojiSearch
                                ? 'Search Results'
                                : EMOJI_CATEGORIES.find(c => c.id === selectedCategory)?.name
                            }
                        </div>

                        {/* Emojis */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(8, 1fr)',
                            gap: '4px',
                        }}>
                            {(() => {
                                let emojisToShow: string[] = [];

                                if (emojiSearch) {
                                    // Search across all categories - show all unique emojis
                                    EMOJI_CATEGORIES.forEach(cat => {
                                        cat.emojis.forEach(emoji => {
                                            if (!emojisToShow.includes(emoji)) {
                                                emojisToShow.push(emoji);
                                            }
                                        });
                                    });
                                    // Filter to first 40 for performance
                                    emojisToShow = emojisToShow.slice(0, 40);
                                } else {
                                    const category = EMOJI_CATEGORIES.find(c => c.id === selectedCategory);
                                    emojisToShow = category?.emojis || [];
                                }

                                if (emojisToShow.length === 0) {
                                    return (
                                        <div style={{
                                            gridColumn: '1 / -1',
                                            padding: '20px',
                                            textAlign: 'center',
                                            color: 'var(--text-muted)',
                                            fontSize: '13px',
                                        }}>
                                            No emojis found
                                        </div>
                                    );
                                }

                                return emojisToShow.map((emoji, idx) => (
                                    <motion.button
                                        key={`${emoji}-${idx}`}
                                        whileHover={{ scale: 1.2, background: 'rgba(255,255,255,0.1)' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleEmojiClick(emoji)}
                                        style={{
                                            width: '100%',
                                            aspectRatio: '1',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {emoji}
                                    </motion.button>
                                ));
                            })()}
                        </div>
                    </div>

                    {/* Quick Access Footer */}
                    <div style={{
                        padding: '8px 12px',
                        borderTop: `1px solid var(--border-color)`,
                        display: 'flex',
                        gap: '4px',
                        justifyContent: 'center',
                    }}>
                        {QUICK_EMOJIS.map((emoji) => (
                            <motion.button
                                key={emoji}
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEmojiClick(emoji)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'var(--dashboard-surface)',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {emoji}
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
