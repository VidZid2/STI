/**
 * Course Material Modal Component
 * Allows users to link and share course materials in the chat
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import type { ModalColors } from './types';

interface CourseMaterialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (title: string, url: string, type: string) => void;
    colors: ModalColors;
}

const materialTypes = [
    { id: 'lecture', icon: '🎥', label: 'Lecture' },
    { id: 'notes', icon: '📝', label: 'Notes' },
    { id: 'slides', icon: '📊', label: 'Slides' },
    { id: 'textbook', icon: '📖', label: 'Textbook' },
    { id: 'assignment', icon: '📋', label: 'Assignment' },
    { id: 'other', icon: '🔗', label: 'Other' },
];

export const CourseMaterialModal: React.FC<CourseMaterialModalProps> = ({ isOpen, onClose, onSend, colors }) => {
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [type, setType] = useState('lecture');

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
                    🔗 Link Course Material
                </h3>
                <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                        Material Type
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {materialTypes.map((m) => (
                            <motion.button
                                key={m.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setType(m.id)}
                                style={{
                                    padding: '6px 10px', borderRadius: '8px',
                                    border: type === m.id ? `2px solid ${colors.accent}` : `1px solid ${colors.border}`,
                                    background: type === m.id ? `${colors.accent}10` : 'transparent',
                                    cursor: 'pointer', fontSize: '12px',
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    color: colors.textPrimary,
                                }}
                            >
                                <span>{m.icon}</span> {m.label}
                            </motion.button>
                        ))}
                    </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                        Title
                    </label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Week 5 Lecture - Data Structures"
                        style={{
                            width: '100%', padding: '10px 12px', borderRadius: '10px',
                            border: `1px solid ${colors.border}`, background: colors.cardBg,
                            fontSize: '14px', outline: 'none', color: colors.textPrimary,
                        }}
                    />
                </div>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                        URL
                    </label>
                    <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..."
                        style={{
                            width: '100%', padding: '10px 12px', borderRadius: '10px',
                            border: `1px solid ${colors.border}`, background: colors.cardBg,
                            fontSize: '14px', outline: 'none', color: colors.textPrimary,
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
                        onClick={() => {
                            if (title.trim() && url.trim()) {
                                onSend(title, url, type);
                                setTitle(''); setUrl(''); setType('lecture'); onClose();
                            }
                        }}
                        disabled={!title.trim() || !url.trim()}
                        style={{
                            padding: '10px 16px', borderRadius: '10px', border: 'none',
                            background: title.trim() && url.trim() ? colors.accent : 'rgba(0,0,0,0.1)',
                            cursor: title.trim() && url.trim() ? 'pointer' : 'not-allowed',
                            fontSize: '13px', fontWeight: 500, color: '#fff',
                        }}
                    >
                        Share Material
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};
