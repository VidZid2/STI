/**
 * MotivationalQuote
 * Rotating motivational quotes for focus/break mode.
 * Extracted from FocusModePage.tsx during Phase 8.5
 * Refactored in Phase 9.5 (Styling Consistency)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Motivational Quotes Data
const STUDY_QUOTES = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Education is the passport to the future.", author: "Malcolm X" },
    { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
    { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
    { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
    { text: "Study hard what interests you the most in the most undisciplined way.", author: "Richard Feynman" },
    { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    { text: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
];

// Motivational Quote Component
const MotivationalQuote: React.FC<{ isBreakMode: boolean }> = ({ isBreakMode }) => {
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
    }, [isBreakMode, getRandomQuote]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 25 }}
            style={{
                padding: '20px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, var(--brand-blue) 0%, var(--brand-blue-hover) 100%)',
                position: 'relative',
                overflow: 'hidden' }}
        >
            {/* Yellow quote marks */}
            <div style={{
                position: 'absolute',
                top: 16,
                left: 16,
                color: 'var(--brand-gold)',
                fontSize: '32px',
                fontWeight: 900,
                lineHeight: 1,
                fontFamily: 'Georgia, serif' }}>
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
                    transition: 'all 0.2s ease' }}
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
                        fontWeight: 500 }}>
                        "{quote.text}"
                    </p>
                    <p style={{
                        margin: 0,
                        fontSize: '12px',
                        color: 'var(--brand-gold)',
                        fontWeight: 600 }}>
                        — {quote.author}
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
                gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-gold)" strokeWidth="2">
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
                    fontWeight: 500 }}>
                    Daily inspiration
                </span>
            </div>
        </motion.div>
    );
};

export { MotivationalQuote };
