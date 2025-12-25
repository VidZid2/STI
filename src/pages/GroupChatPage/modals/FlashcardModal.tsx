/**
 * Flashcard Modal Component
 * Allows users to create and share flashcards in the chat
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
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

    if (!isOpen) return null;

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
                    📚 Share Flashcard
                </h3>
                <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                        Front (Question)
                    </label>
                    <textarea
                        value={front}
                        onChange={(e) => setFront(e.target.value)}
                        placeholder="What is the capital of France?"
                        style={{
                            width: '100%', padding: '10px 12px', borderRadius: '10px',
                            border: `1px solid ${colors.border}`, background: colors.cardBg,
                            fontSize: '14px', resize: 'none', outline: 'none', minHeight: '60px',
                            color: colors.textPrimary, fontFamily: 'inherit',
                        }}
                    />
                </div>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                        Back (Answer)
                    </label>
                    <textarea
                        value={back}
                        onChange={(e) => setBack(e.target.value)}
                        placeholder="Paris"
                        style={{
                            width: '100%', padding: '10px 12px', borderRadius: '10px',
                            border: `1px solid ${colors.border}`, background: colors.cardBg,
                            fontSize: '14px', resize: 'none', outline: 'none', minHeight: '60px',
                            color: colors.textPrimary, fontFamily: 'inherit',
                        }}
                    />
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
                        onClick={() => { if (front.trim() && back.trim()) { onSend(front, back); setFront(''); setBack(''); onClose(); } }}
                        disabled={!front.trim() || !back.trim()}
                        style={{
                            padding: '10px 16px', borderRadius: '10px', border: 'none',
                            background: front.trim() && back.trim() ? colors.accent : 'rgba(0,0,0,0.1)',
                            cursor: front.trim() && back.trim() ? 'pointer' : 'not-allowed',
                            fontSize: '13px', fontWeight: 500, color: '#fff',
                        }}
                    >
                        Share Flashcard
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};
