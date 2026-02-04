/**
 * Flashcard Modal Component
 * Minimalistic professional design matching GroupsContent/CatalogContent/GoalsContent
 * Blue accent color scheme with smooth hover effects
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import type { ModalColors } from './types';

interface FlashcardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (front: string, back: string) => void;
    colors: ModalColors;
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({ isOpen, onClose, onSend, colors }) => {
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [focusedField, setFocusedField] = useState<'front' | 'back' | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const frontInputRef = useRef<HTMLTextAreaElement>(null);
    
    // Blue accent colors (matching other pages)
    const blueAccent = '#3b82f6';
    const isDarkMode = colors.cardBg === '#1e293b' || colors.cardBg.includes('30, 41, 59');
    const blueBg = isDarkMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)';
    const blueBorder = isDarkMode ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)';
    const subtleBg = isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
    const borderColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    // Focus first input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => frontInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (front.trim() && back.trim()) {
            onSend(front.trim(), back.trim());
            setFront('');
            setBack('');
            setIsFlipped(false);
            onClose();
        }
    };

    const isValid = front.trim() && back.trim();

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 1001,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: colors.cardBg,
                            borderRadius: '20px',
                            width: '100%',
                            maxWidth: '440px',
                            boxShadow: isDarkMode 
                                ? '0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)'
                                : '0 24px 48px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '20px 24px',
                            borderBottom: `1px solid ${borderColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                        }}>
                            {/* Icon */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '12px',
                                    background: blueBg,
                                    border: `1px solid ${blueBorder}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                    <path d="M12 8v8" />
                                    <path d="M8 12h8" />
                                </svg>
                            </motion.div>
                            
                            <div style={{ flex: 1 }}>
                                <motion.h3
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 }}
                                    style={{
                                        margin: 0,
                                        fontSize: '17px',
                                        fontWeight: 600,
                                        color: colors.textPrimary,
                                        letterSpacing: '-0.01em',
                                    }}
                                >
                                    Create Flashcard
                                </motion.h3>
                                <motion.p
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    style={{
                                        margin: '4px 0 0',
                                        fontSize: '12px',
                                        color: colors.textSecondary,
                                    }}
                                >
                                    Share a study flashcard with your group
                                </motion.p>
                            </div>

                            {/* Close Button */}
                            <motion.button
                                whileHover={{ scale: 1.1, background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: subtleBg,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: colors.textSecondary,
                                    transition: 'background 0.15s ease',
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </motion.button>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '20px 24px' }}>
                            {/* Preview Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                onClick={() => setIsFlipped(!isFlipped)}
                                style={{
                                    perspective: '1000px',
                                    marginBottom: '20px',
                                    cursor: 'pointer',
                                }}
                            >
                                <motion.div
                                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    style={{
                                        position: 'relative',
                                        height: '100px',
                                        transformStyle: 'preserve-3d',
                                    }}
                                >
                                    {/* Front Side */}
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backfaceVisibility: 'hidden',
                                        background: `linear-gradient(135deg, ${blueAccent} 0%, #2563eb 100%)`,
                                        borderRadius: '14px',
                                        padding: '16px 20px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 16px rgba(59, 130, 246, 0.25)',
                                    }}>
                                        <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                                            Question
                                        </span>
                                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#fff', lineHeight: 1.4 }}>
                                            {front || 'Enter your question...'}
                                        </span>
                                        <span style={{ position: 'absolute', bottom: '10px', right: '14px', fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>
                                            Click to flip
                                        </span>
                                    </div>
                                    
                                    {/* Back Side */}
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backfaceVisibility: 'hidden',
                                        transform: 'rotateY(180deg)',
                                        background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f8fafc',
                                        border: `1px solid ${borderColor}`,
                                        borderRadius: '14px',
                                        padding: '16px 20px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                    }}>
                                        <span style={{ fontSize: '9px', fontWeight: 600, color: blueAccent, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                                            Answer
                                        </span>
                                        <span style={{ fontSize: '14px', fontWeight: 500, color: colors.textPrimary, lineHeight: 1.4 }}>
                                            {back || 'Enter your answer...'}
                                        </span>
                                        <span style={{ position: 'absolute', bottom: '10px', right: '14px', fontSize: '9px', color: colors.textMuted }}>
                                            Click to flip
                                        </span>
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* Front Input */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                style={{ marginBottom: '16px' }}
                            >
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: focusedField === 'front' ? blueAccent : colors.textSecondary,
                                    marginBottom: '8px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    transition: 'color 0.2s ease',
                                }}>
                                    <div style={{
                                        width: 4,
                                        height: 4,
                                        borderRadius: '50%',
                                        background: focusedField === 'front' ? blueAccent : colors.textMuted,
                                        transition: 'background 0.2s ease',
                                    }} />
                                    Question (Front)
                                </label>
                                <textarea
                                    ref={frontInputRef}
                                    value={front}
                                    onChange={(e) => setFront(e.target.value)}
                                    onFocus={() => setFocusedField('front')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="What is the capital of France?"
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: '12px',
                                        border: `1px solid ${focusedField === 'front' ? blueBorder : borderColor}`,
                                        background: focusedField === 'front' ? blueBg : subtleBg,
                                        fontSize: '14px',
                                        resize: 'none',
                                        outline: 'none',
                                        minHeight: '70px',
                                        color: colors.textPrimary,
                                        fontFamily: 'inherit',
                                        transition: 'border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
                                        boxShadow: focusedField === 'front' ? `0 0 0 3px ${blueBg}` : 'none',
                                    }}
                                />
                            </motion.div>

                            {/* Back Input */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                            >
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: focusedField === 'back' ? blueAccent : colors.textSecondary,
                                    marginBottom: '8px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    transition: 'color 0.2s ease',
                                }}>
                                    <div style={{
                                        width: 4,
                                        height: 4,
                                        borderRadius: '50%',
                                        background: focusedField === 'back' ? blueAccent : colors.textMuted,
                                        transition: 'background 0.2s ease',
                                    }} />
                                    Answer (Back)
                                </label>
                                <textarea
                                    value={back}
                                    onChange={(e) => setBack(e.target.value)}
                                    onFocus={() => setFocusedField('back')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Paris"
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: '12px',
                                        border: `1px solid ${focusedField === 'back' ? blueBorder : borderColor}`,
                                        background: focusedField === 'back' ? blueBg : subtleBg,
                                        fontSize: '14px',
                                        resize: 'none',
                                        outline: 'none',
                                        minHeight: '70px',
                                        color: colors.textPrimary,
                                        fontFamily: 'inherit',
                                        transition: 'border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
                                        boxShadow: focusedField === 'back' ? `0 0 0 3px ${blueBg}` : 'none',
                                    }}
                                />
                            </motion.div>
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '16px 24px 20px',
                            borderTop: `1px solid ${borderColor}`,
                            display: 'flex',
                            gap: '10px',
                            justifyContent: 'flex-end',
                            background: subtleBg,
                        }}>
                            <motion.button
                                whileHover={{ scale: 1.02, background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                style={{
                                    padding: '10px 18px',
                                    borderRadius: '10px',
                                    border: `1px solid ${borderColor}`,
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: colors.textSecondary,
                                    transition: 'background 0.15s ease',
                                }}
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                whileHover={isValid ? { scale: 1.02, boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)' } : {}}
                                whileTap={isValid ? { scale: 0.98 } : {}}
                                onClick={handleSubmit}
                                disabled={!isValid}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: isValid 
                                        ? `linear-gradient(135deg, ${blueAccent} 0%, #2563eb 100%)`
                                        : isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                    cursor: isValid ? 'pointer' : 'not-allowed',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: isValid ? '#fff' : colors.textMuted,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'background 0.2s ease, box-shadow 0.2s ease',
                                    boxShadow: isValid ? '0 2px 8px rgba(59, 130, 246, 0.25)' : 'none',
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                                Share Flashcard
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
