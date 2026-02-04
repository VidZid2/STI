/**
 * Poll Modal Component
 * Minimalistic professional design matching GroupsContent/CatalogContent/GoalsContent
 * Blue accent color scheme with smooth hover effects
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import type { ModalColors } from './types';

interface PollModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (question: string, options: string[]) => void;
    colors: ModalColors;
}

export const PollModal: React.FC<PollModalProps> = ({ isOpen, onClose, onSend, colors }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const questionInputRef = useRef<HTMLInputElement>(null);

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
            setTimeout(() => questionInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const addOption = () => {
        if (options.length < 6) {
            setOptions([...options, '']);
        }
    };

    const updateOption = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const removeOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = () => {
        const validOptions = options.filter(o => o.trim());
        if (question.trim() && validOptions.length >= 2) {
            onSend(question.trim(), validOptions);
            setQuestion('');
            setOptions(['', '']);
            onClose();
        }
    };

    const validOptions = options.filter(o => o.trim());
    const isValid = question.trim() && validOptions.length >= 2;

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
                                    <path d="M18 20V10" />
                                    <path d="M12 20V4" />
                                    <path d="M6 20v-6" />
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
                                    Create Poll
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
                                    Get your group's opinion on a topic
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
                        <div style={{ padding: '20px 24px', maxHeight: '400px', overflowY: 'auto' }}>
                            {/* Question Input */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                style={{ marginBottom: '20px' }}
                            >
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: focusedField === 'question' ? blueAccent : colors.textSecondary,
                                    marginBottom: '8px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    transition: 'color 0.2s ease',
                                }}>
                                    <div style={{
                                        width: 4,
                                        height: 4,
                                        borderRadius: '50%',
                                        background: focusedField === 'question' ? blueAccent : colors.textMuted,
                                        transition: 'background 0.2s ease',
                                    }} />
                                    Question
                                </label>
                                <input
                                    ref={questionInputRef}
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    onFocus={() => setFocusedField('question')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Which topic should we review?"
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: '12px',
                                        border: `1px solid ${focusedField === 'question' ? blueBorder : borderColor}`,
                                        background: focusedField === 'question' ? blueBg : subtleBg,
                                        fontSize: '14px',
                                        outline: 'none',
                                        color: colors.textPrimary,
                                        fontFamily: 'inherit',
                                        transition: 'border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
                                        boxShadow: focusedField === 'question' ? `0 0 0 3px ${blueBg}` : 'none',
                                    }}
                                />
                            </motion.div>

                            {/* Options */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: colors.textSecondary,
                                    marginBottom: '10px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}>
                                    <div style={{
                                        width: 4,
                                        height: 4,
                                        borderRadius: '50%',
                                        background: colors.textMuted,
                                    }} />
                                    Options
                                    <span style={{
                                        marginLeft: 'auto',
                                        fontSize: '10px',
                                        fontWeight: 500,
                                        color: colors.textMuted,
                                        textTransform: 'none',
                                        letterSpacing: 'normal',
                                    }}>
                                        {validOptions.length}/6 filled
                                    </span>
                                </label>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {options.map((opt, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.35 + i * 0.05 }}
                                            style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                                        >
                                            {/* Option Number Badge */}
                                            <div style={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: '8px',
                                                background: opt.trim() ? blueBg : subtleBg,
                                                border: `1px solid ${opt.trim() ? blueBorder : borderColor}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: opt.trim() ? blueAccent : colors.textMuted,
                                                flexShrink: 0,
                                                transition: 'all 0.2s ease',
                                            }}>
                                                {i + 1}
                                            </div>

                                            <input
                                                value={opt}
                                                onChange={(e) => updateOption(i, e.target.value)}
                                                onFocus={() => setFocusedField(`option-${i}`)}
                                                onBlur={() => setFocusedField(null)}
                                                placeholder={`Option ${i + 1}`}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px 14px',
                                                    borderRadius: '10px',
                                                    border: `1px solid ${focusedField === `option-${i}` ? blueBorder : borderColor}`,
                                                    background: focusedField === `option-${i}` ? blueBg : subtleBg,
                                                    fontSize: '13px',
                                                    outline: 'none',
                                                    color: colors.textPrimary,
                                                    fontFamily: 'inherit',
                                                    transition: 'border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
                                                    boxShadow: focusedField === `option-${i}` ? `0 0 0 3px ${blueBg}` : 'none',
                                                }}
                                            />

                                            {options.length > 2 && (
                                                <motion.button
                                                    whileHover={{ scale: 1.1, background: 'rgba(239,68,68,0.15)' }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => removeOption(i)}
                                                    style={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: '10px',
                                                        border: 'none',
                                                        background: isDarkMode ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#ef4444',
                                                        flexShrink: 0,
                                                        transition: 'background 0.15s ease',
                                                    }}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M18 6L6 18M6 6l12 12" />
                                                    </svg>
                                                </motion.button>
                                            )}
                                        </motion.div>
                                    ))}

                                    {/* Add Option Button */}
                                    {options.length < 6 && (
                                        <motion.button
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                            whileHover={{ scale: 1.01, borderColor: blueBorder, background: blueBg }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={addOption}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '12px',
                                                border: `1.5px dashed ${borderColor}`,
                                                background: 'transparent',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: 500,
                                                color: blueAccent,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="12" y1="5" x2="12" y2="19" />
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                            Add Option
                                        </motion.button>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '16px 24px 20px',
                            borderTop: `1px solid ${borderColor}`,
                            display: 'flex',
                            gap: '10px',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: subtleBg,
                        }}>
                            {/* Validation hint */}
                            <div style={{
                                fontSize: '11px',
                                color: isValid ? '#10b981' : colors.textMuted,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}>
                                {isValid ? (
                                    <>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                        Ready to create
                                    </>
                                ) : (
                                    <>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                        Need question + 2 options
                                    </>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
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
                                        <path d="M18 20V10" />
                                        <path d="M12 20V4" />
                                        <path d="M6 20v-6" />
                                    </svg>
                                    Create Poll
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
