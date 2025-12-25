/**
 * Schedule Session Modal Component
 * Allows users to schedule study sessions in the chat
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import type { ModalColors } from './types';

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (title: string, date: string, time: string) => void;
    colors: ModalColors;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, onSend, colors }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

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
                    📅 Schedule Study Session
                </h3>
                <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                        Session Title
                    </label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Chapter 5 Review"
                        style={{
                            width: '100%', padding: '10px 12px', borderRadius: '10px',
                            border: `1px solid ${colors.border}`, background: colors.cardBg,
                            fontSize: '14px', outline: 'none', color: colors.textPrimary,
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                            Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 12px', borderRadius: '10px',
                                border: `1px solid ${colors.border}`, background: colors.cardBg,
                                fontSize: '14px', outline: 'none', color: colors.textPrimary,
                            }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                            Time
                        </label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 12px', borderRadius: '10px',
                                border: `1px solid ${colors.border}`, background: colors.cardBg,
                                fontSize: '14px', outline: 'none', color: colors.textPrimary,
                            }}
                        />
                    </div>
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
                            if (title.trim() && date && time) {
                                onSend(title, date, time);
                                setTitle(''); setDate(''); setTime(''); onClose();
                            }
                        }}
                        style={{
                            padding: '10px 16px', borderRadius: '10px', border: 'none',
                            background: colors.accent, cursor: 'pointer',
                            fontSize: '13px', fontWeight: 500, color: '#fff',
                        }}
                    >
                        Schedule
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};
