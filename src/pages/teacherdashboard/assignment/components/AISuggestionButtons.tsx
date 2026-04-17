import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getSuggestionsForCourse } from '../constants';
const AISuggestionButtons: React.FC<{ onSelect: (text: string) => void; courseName?: string }> = ({ onSelect, courseName = '' }) => {
    const [setIndex, setSetIndex] = useState(0);
    const [suggestions, setSuggestions] = useState<{ text: string; emoji: string }[]>([]);
    const perPage = 3;

    // Build suggestions when course changes
    useEffect(() => {
        const all = getSuggestionsForCourse(courseName);
        // Shuffle for variety
        const shuffled = [...all].sort(() => Math.random() - 0.5);
        setSuggestions(shuffled);
        setSetIndex(0);
    }, [courseName]);

    const totalSets = Math.max(1, Math.ceil(suggestions.length / perPage));

    useEffect(() => {
        if (suggestions.length <= perPage) return; // No need to cycle if <= 1 set
        const interval = setInterval(() => {
            setSetIndex(prev => (prev + 1) % totalSets);
        }, 5000);
        return () => clearInterval(interval);
    }, [totalSets, suggestions.length]);

    const currentItems = suggestions.slice(setIndex * perPage, setIndex * perPage + perPage);

    if (suggestions.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'stretch', minHeight: '132px' }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={setIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                    {currentItems.map((suggestion, i) => (
                        <motion.button
                            key={suggestion.text}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.08 }}
                            whileHover={{
                                scale: 1.02,
                                background: 'var(--accent-bg)',
                                x: 4,
                                borderColor: 'var(--accent-primary)',
                            }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onSelect(suggestion.text)}
                            style={{
                                padding: '10px 14px',
                                borderRadius: '12px',
                                border: '1px solid var(--border-subtle)',
                                background: 'var(--bg-surface)',
                                cursor: 'pointer',
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                                fontWeight: 500,
                                textAlign: 'left' as const,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'border-color 0.2s ease',
                            }}
                        >
                            <span style={{ fontSize: '14px', flexShrink: 0 }}>{suggestion.emoji}</span>
                            {suggestion.text}
                        </motion.button>
                    ))}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default AISuggestionButtons;
