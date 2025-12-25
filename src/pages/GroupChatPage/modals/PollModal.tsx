/**
 * Poll Modal Component
 * Allows users to create and share polls in the chat
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
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

    if (!isOpen) return null;

    const addOption = () => setOptions([...options, '']);
    const updateOption = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };
    const removeOption = (index: number) => {
        if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
    };

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)', zIndex: 1001,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
            }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: colors.cardBg, borderRadius: '16px', padding: '24px',
                    width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                }}
            >
                <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600, color: colors.textPrimary }}>
                    📊 Create Poll
                </h3>
                <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                        Question
                    </label>
                    <input
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Which topic should we review?"
                        style={{
                            width: '100%', padding: '10px 12px', borderRadius: '10px',
                            border: `1px solid ${colors.border}`, background: colors.cardBg,
                            fontSize: '14px', outline: 'none', color: colors.textPrimary,
                        }}
                    />
                </div>
                <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                        Options
                    </label>
                    {options.map((opt, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <input
                                value={opt}
                                onChange={(e) => updateOption(i, e.target.value)}
                                placeholder={`Option ${i + 1}`}
                                style={{
                                    flex: 1, padding: '10px 12px', borderRadius: '10px',
                                    border: `1px solid ${colors.border}`, background: colors.cardBg,
                                    fontSize: '14px', outline: 'none', color: colors.textPrimary,
                                }}
                            />
                            {options.length > 2 && (
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => removeOption(i)}
                                    style={{
                                        width: 36, height: 36, borderRadius: '10px', border: 'none',
                                        background: 'rgba(239,68,68,0.1)', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#ef4444',
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </motion.button>
                            )}
                        </div>
                    ))}
                    {options.length < 5 && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={addOption}
                            style={{
                                width: '100%', padding: '8px', borderRadius: '10px',
                                border: `1px dashed ${colors.border}`, background: 'transparent',
                                cursor: 'pointer', fontSize: '13px', color: colors.accent,
                            }}
                        >
                            + Add Option
                        </motion.button>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        style={{
                            padding: '10px 16px', borderRadius: '10px', border: `1px solid ${colors.border}`,
                            background: 'transparent', cursor: 'pointer', fontSize: '13px',
                            fontWeight: 500, color: colors.textSecondary,
                        }}
                    >
                        Cancel
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            const validOptions = options.filter(o => o.trim());
                            if (question.trim() && validOptions.length >= 2) {
                                onSend(question, validOptions);
                                setQuestion(''); setOptions(['', '']); onClose();
                            }
                        }}
                        style={{
                            padding: '10px 16px', borderRadius: '10px', border: 'none',
                            background: colors.accent, cursor: 'pointer',
                            fontSize: '13px', fontWeight: 500, color: '#fff',
                        }}
                    >
                        Create Poll
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};
