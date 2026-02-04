/**
 * DeleteConfirmModal Component
 * Confirmation dialog when deleting a message
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ChatColors } from '../types';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    colors: ChatColors;
    onCancel: () => void;
    onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    isOpen,
    colors,
    onCancel,
    onConfirm,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onCancel}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: colors.cardBg,
                            borderRadius: '16px',
                            padding: '20px',
                            width: '100%',
                            maxWidth: '320px',
                            border: `1px solid ${colors.border}`,
                            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        }}
                    >
                        {/* Icon */}
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: '12px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                            }}
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                        </div>

                        {/* Title */}
                        <h3
                            style={{
                                margin: '0 0 8px',
                                fontSize: '16px',
                                fontWeight: 600,
                                color: colors.textPrimary,
                                textAlign: 'center',
                            }}
                        >
                            Delete Message?
                        </h3>

                        {/* Description */}
                        <p
                            style={{
                                margin: '0 0 20px',
                                fontSize: '13px',
                                color: colors.textSecondary,
                                textAlign: 'center',
                                lineHeight: 1.5,
                            }}
                        >
                            This action cannot be undone. The message will be permanently removed.
                        </p>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onCancel}
                                style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    borderRadius: '10px',
                                    border: `1px solid ${colors.border}`,
                                    background: 'transparent',
                                    color: colors.textPrimary,
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02, background: '#dc2626' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onConfirm}
                                style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: '#ef4444',
                                    color: '#fff',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                }}
                            >
                                Delete
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
