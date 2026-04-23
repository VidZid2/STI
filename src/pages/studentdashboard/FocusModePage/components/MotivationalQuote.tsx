/**
 * MotivationalQuote
 * Rotating motivational quotes for focus/break mode.
 * Extracted from FocusModePage.tsx during Phase 8.5
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { FocusModeColors } from '../FocusModePage';

// Motivational Quote Component
const MotivationalQuote: React.FC<{
    isDarkMode: boolean;
    colors: FocusModeColors;
    isBreakMode: boolean;
}> = ({ isBreakMode }) => {
    const [quote, setQuote] = useState(STUDY_QUOTES[0]);
    const [isChanging, setIsChanging] = useState(false);

    const getRandomQuote = useCallback(() => {
        const newQuote = STUDY_QUOTES[Math.floor(Math.random() * STUDY_QUOTES.length)];
        setIsChanging(true);
        setTimeout(() => {
            setQuote(newQuote);
            setIsChanging(false);
        }, 200);
    }, []);

    useEffect(() => {
        getRandomQuote();
    }, [isBreakMode]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 25 }}
            style={{
                padding: '20px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Yellow quote marks */}
            <div style={{
                position: 'absolute',
                top: 16,
                left: 16,
                color: '#fbbf24',
                fontSize: '32px',
                fontWeight: 900,
                lineHeight: 1,
                fontFamily: 'Georgia, serif',
            }}>
                "
            </div>

            {/* Close/Refresh button */}
            <motion.button
                whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.2)' }}
                whileTap={{ scale: 0.95 }}
                onClick={getRandomQuote}
                style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    border: 'none',
                    background: 'rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.8)',
                    transition: 'all 0.2s ease',
                }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                </svg>
            </motion.button>

            {/* Quote content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={quote.text}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: isChanging ? 0 : 1, y: isChanging ? 5 : 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    style={{ marginTop: '28px' }}
                >
                    <p style={{
                        margin: 0,
                        fontSize: '14px',
                        fontStyle: 'italic',
                        color: '#ffffff',
                        lineHeight: 1.6,
                        marginBottom: '12px',
                        fontWeight: 500,
                    }}>
                        "{quote.text}"
                    </p>
                    <p style={{
                        margin: 0,
                        fontSize: '12px',
                        color: '#fbbf24',
                        fontWeight: 600,
                    }}>
                        � {quote.author}
                    </p>
                </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <div style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
            }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" />
                    <path d="M12 20v2" />
                    <path d="m4.93 4.93 1.41 1.41" />
                    <path d="m17.66 17.66 1.41 1.41" />
                    <path d="M2 12h2" />
                    <path d="M20 12h2" />
                    <path d="m6.34 17.66-1.41 1.41" />
                    <path d="m19.07 4.93-1.41 1.41" />
                </svg>
                <span style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.8)',
                    fontWeight: 500,
                }}>
                    Daily inspiration
                </span>
            </div>
        </motion.div>
    );
};

// Ambient Sounds Data - Add your MP3 files to public/sounds/ folder
const AMBIENT_SOUNDS = [
    {
        id: 'lofi',
        name: 'Lo-Fi',
        color: '#8b5cf6',
        url: '/sounds/lofi.mp3',
    },
    {
        id: 'rain',
        name: 'Rain',
        color: '#3b82f6',
        url: '/sounds/rain.mp3',
    },
    {
        id: 'cafe',
        name: 'Caf�',
        color: '#f59e0b',
        url: '/sounds/cafe.mp3',
    },
    {
        id: 'nature',
        name: 'Nature',
        color: '#10b981',
        url: '/sounds/nature.mp3',
    },
    {
        id: 'fire',
        name: 'Fire',
        color: '#ef4444',
        url: '/sounds/fire.mp3',
    },
    {
        id: 'waves',
        name: 'Waves',
        color: '#06b6d4',
        url: '/sounds/waves.mp3',
    },
];


export { MotivationalQuote };
