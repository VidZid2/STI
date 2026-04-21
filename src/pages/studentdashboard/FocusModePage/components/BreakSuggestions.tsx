/**
 * BreakSuggestions
 * Break activity suggestions shown during break mode.
 * Extracted from FocusModePage.tsx during Phase 8.5
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { FocusModeColors } from '../FocusModePage';

// Break Suggestions Component
const BreakSuggestions: React.FC<{
    isDarkMode: boolean;
    colors: FocusModeColors;
    isBreakMode: boolean;
}> = ({ isDarkMode, colors, isBreakMode }) => {
    const [currentSuggestion, setCurrentSuggestion] = useState(0);

    // Rotate suggestions
    useEffect(() => {
        if (!isBreakMode) return;
        const interval = setInterval(() => {
            setCurrentSuggestion(prev => (prev + 1) % BREAK_SUGGESTIONS.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [isBreakMode]);

    const suggestion = BREAK_SUGGESTIONS[currentSuggestion];

    if (!isBreakMode) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
                padding: '16px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
            }}>
                <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                        <line x1="6" y1="1" x2="6" y2="4" />
                        <line x1="10" y1="1" x2="10" y2="4" />
                        <line x1="14" y1="1" x2="14" y2="4" />
                    </svg>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#10b981' }}>
                    Break Activity
                </div>
                <div style={{
                    marginLeft: 'auto',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#10b981',
                }}>
                    {suggestion.duration}
                </div>
            </div>

            {/* Suggestion Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSuggestion}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}
                >
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        background: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        flexShrink: 0,
                    }}>
                        {suggestion.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: colors.textPrimary,
                            marginBottom: '2px',
                        }}>
                            {suggestion.title}
                        </div>
                        <div style={{
                            fontSize: '11px',
                            color: colors.textSecondary,
                            lineHeight: 1.4,
                        }}>
                            {suggestion.description}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Progress Dots */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '12px',
            }}>
                {BREAK_SUGGESTIONS.map((_, index) => (
                    <motion.button
                        key={index}
                        onClick={() => setCurrentSuggestion(index)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        style={{
                            width: index === currentSuggestion ? 16 : 6,
                            height: 6,
                            borderRadius: '3px',
                            border: 'none',
                            background: index === currentSuggestion
                                ? '#10b981'
                                : (isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'),
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    />
                ))}
            </div>
        </motion.div>
    );
};


export { BreakSuggestions };
