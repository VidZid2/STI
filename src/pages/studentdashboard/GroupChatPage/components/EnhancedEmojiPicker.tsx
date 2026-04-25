/**
 * EnhancedEmojiPicker Component
 * Minimalistic professional design matching GroupsContent/CatalogContent/GoalsContent
 * Blue accent color scheme with smooth hover effects
 */

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EMOJI_CATEGORIES, QUICK_EMOJIS } from '../constants';
import type { ChatColors } from '../types';

interface EnhancedEmojiPickerProps {
    isOpen: boolean;
    isDarkMode: boolean;
    colors: ChatColors;
    emojiSearch: string;
    emojiPickerCategory: string;
    onEmojiSearchChange: (value: string) => void;
    onCategoryChange: (categoryId: string) => void;
    onEmojiSelect: (emoji: string) => void;
    onClose: () => void;
}

export const EnhancedEmojiPicker: React.FC<EnhancedEmojiPickerProps> = ({
    isOpen,
    isDarkMode,
    colors: _colors, // Using isDarkMode for consistent blue theme
    emojiSearch,
    emojiPickerCategory,
    onEmojiSearchChange,
    onCategoryChange,
    onEmojiSelect,
    onClose,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 4, width: 32 });
    
    // Blue accent color (matching other pages)
    const blueAccent = '#3b82f6';
    const blueBg = 'rgba(59, 130, 246, 0.1)';
    const blueBorder = 'rgba(59, 130, 246, 0.25)';

    // Update indicator position when category changes
    useEffect(() => {
        if (!containerRef.current) return;
        const activeIndex = EMOJI_CATEGORIES.findIndex(c => c.id === emojiPickerCategory);
        const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button[data-category-tab]');
        if (buttons[activeIndex]) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const buttonRect = buttons[activeIndex].getBoundingClientRect();
            const scrollLeft = containerRef.current.scrollLeft;
            setIndicatorStyle({
                left: buttonRect.left - containerRect.left + scrollLeft,
                width: buttonRect.width,
            });
            
            // Auto-scroll to keep selected item visible
            const button = buttons[activeIndex];
            const containerWidth = containerRef.current.clientWidth;
            const buttonLeft = button.offsetLeft;
            const buttonWidth = button.offsetWidth;
            
            // If button is near the right edge, scroll right
            if (buttonLeft + buttonWidth > scrollLeft + containerWidth - 20) {
                containerRef.current.scrollTo({
                    left: buttonLeft - containerWidth + buttonWidth + 40,
                    behavior: 'smooth'
                });
            }
            // If button is near the left edge, scroll left
            else if (buttonLeft < scrollLeft + 20) {
                containerRef.current.scrollTo({
                    left: Math.max(0, buttonLeft - 40),
                    behavior: 'smooth'
                });
            }
        }
    }, [emojiPickerCategory]);

    // Initial indicator position
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!containerRef.current) return;
            const activeIndex = EMOJI_CATEGORIES.findIndex(c => c.id === emojiPickerCategory);
            const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button[data-category-tab]');
            if (buttons[activeIndex]) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const buttonRect = buttons[activeIndex].getBoundingClientRect();
                const scrollLeft = containerRef.current.scrollLeft;
                setIndicatorStyle({
                    left: buttonRect.left - containerRect.left + scrollLeft,
                    width: buttonRect.width,
                });
            }
        }, 50);
        return () => clearTimeout(timer);
    }, [isOpen]);

    const handleEmojiClick = (emoji: string) => {
        onEmojiSelect(emoji);
        onClose();
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
                        background: 'var(--bg-primary)',
                        borderRadius: '16px',
                        boxShadow: isDarkMode 
                            ? '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)'
                            : '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
                        zIndex: 1000,
                        width: '340px',
                        overflow: 'hidden',
                    }}
                >
                    {/* Header with Search */}
                    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${'rgba(255,255,255,0.06)'}` }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.04)',
                                border: `1px solid ${'rgba(255,255,255,0.06)'}`,
                                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = blueBorder;
                                e.currentTarget.style.boxShadow = `0 0 0 3px ${blueBg}`;
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={blueAccent}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                value={emojiSearch}
                                onChange={(e) => onEmojiSearchChange(e.target.value)}
                                placeholder="Search emojis..."
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'var(--bg-hover)',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    outline: 'none',
                                }}
                            />
                            {emojiSearch && (
                                <motion.button
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    whileHover={{ scale: 1.1, background: `${blueAccent}20` }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => onEmojiSearchChange('')}
                                    style={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: 'var(--bg-hover)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--bg-hover)',
                                        transition: 'background 0.15s ease',
                                    }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </motion.button>
                            )}
                        </div>
                    </div>

                    {/* Category Tabs - Matching FilterTabs design from other pages */}
                    <div
                        ref={containerRef}
                        style={{
                            display: 'flex',
                            gap: '4px',
                            padding: '10px 14px',
                            borderBottom: `1px solid ${'rgba(255,255,255,0.06)'}`,
                            overflowX: 'auto',
                            overflowY: 'hidden',
                            position: 'relative',
                            background: 'var(--bg-primary)',
                            scrollbarWidth: 'none', // Firefox
                            msOverflowStyle: 'none', // IE/Edge
                        }}
                        className="hide-scrollbar"
                    >
                        {/* Hidden scrollbar style */}
                        <style>{`
                            .hide-scrollbar::-webkit-scrollbar {
                                display: none;
                            }
                        `}</style>
                        
                        {/* Sliding Indicator */}
                        <motion.div
                            style={{
                                position: 'absolute',
                                top: '10px',
                                height: '36px',
                                borderRadius: '10px',
                                background: blueBg,
                                border: `1px solid ${blueBorder}`,
                                zIndex: 0,
                            }}
                            initial={false}
                            animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                        
                        {EMOJI_CATEGORIES.map((category) => (
                            <motion.button
                                key={category.id}
                                data-category-tab={category.id}
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={() => {
                                    onCategoryChange(category.id);
                                    onEmojiSearchChange('');
                                }}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    position: 'relative',
                                    zIndex: 1,
                                    transition: 'transform 0.15s ease',
                                }}
                                title={category.name}
                            >
                                {category.icon}
                            </motion.button>
                        ))}
                    </div>

                    {/* Emoji Grid */}
                    <div style={{ padding: '12px 16px', height: '220px', overflowY: 'auto' }}>
                        {/* Category Label */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: blueAccent,
                                marginBottom: '10px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}
                        >
                            <div style={{
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                background: blueAccent,
                            }} />
                            {emojiSearch
                                ? 'Search Results'
                                : EMOJI_CATEGORIES.find((c) => c.id === emojiPickerCategory)?.name}
                        </div>

                        {/* Emojis Grid */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(8, 1fr)',
                                gap: '4px',
                            }}
                        >
                            {(() => {
                                let emojisToShow: string[] = [];

                                if (emojiSearch) {
                                    EMOJI_CATEGORIES.forEach((cat) => {
                                        cat.emojis.forEach((emoji) => {
                                            if (!emojisToShow.includes(emoji)) {
                                                emojisToShow.push(emoji);
                                            }
                                        });
                                    });
                                    emojisToShow = emojisToShow.slice(0, 40);
                                } else {
                                    const category = EMOJI_CATEGORIES.find(
                                        (c) => c.id === emojiPickerCategory
                                    );
                                    emojisToShow = category?.emojis || [];
                                }

                                if (emojisToShow.length === 0) {
                                    return (
                                        <div
                                            style={{
                                                gridColumn: '1 / -1',
                                                padding: '32px 20px',
                                                textAlign: 'center',
                                                color: 'var(--bg-hover)',
                                                fontSize: '13px',
                                                fontWeight: 500,
                                            }}
                                        >
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 8px', opacity: 0.5 }}>
                                                <circle cx="12" cy="12" r="10" />
                                                <path d="M8 15h8M9 9h.01M15 9h.01" />
                                            </svg>
                                            No emojis found
                                        </div>
                                    );
                                }

                                return emojisToShow.map((emoji, idx) => (
                                    <motion.button
                                        key={`${emoji}-${idx}`}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: Math.min(idx * 0.01, 0.2) }}
                                        whileHover={{
                                            scale: 1.25,
                                            background: blueBg,
                                        }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleEmojiClick(emoji)}
                                        style={{
                                            width: '100%',
                                            aspectRatio: '1',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '22px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'background 0.15s ease',
                                        }}
                                    >
                                        {emoji}
                                    </motion.button>
                                ));
                            })()}
                        </div>
                    </div>

                    {/* Quick Access Footer */}
                    <div
                        style={{
                            padding: '10px 16px',
                            borderTop: `1px solid ${'rgba(255,255,255,0.06)'}`,
                            background: 'var(--bg-primary)',
                            display: 'flex',
                            gap: '6px',
                            justifyContent: 'center',
                        }}
                    >
                        {QUICK_EMOJIS.map((emoji, idx) => (
                            <motion.button
                                key={emoji}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                whileHover={{ 
                                    scale: 1.15, 
                                    background: blueBg,
                                    boxShadow: `0 2px 8px ${blueAccent}20`,
                                }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEmojiClick(emoji)}
                                style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: '10px',
                                    border: `1px solid ${'rgba(255,255,255,0.06)'}`,
                                    background: 'rgba(255,255,255,0.04)',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.15s ease',
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
