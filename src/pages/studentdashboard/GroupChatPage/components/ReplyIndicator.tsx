/**
 * ReplyIndicator Component
 * Shows the message being replied to with cancel option
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ReplyInfo } from '../types';
import { Tooltip } from './Tooltip';

interface ReplyIndicatorProps {
    replyingTo: ReplyInfo | null;
    onCancel: () => void;
    isDarkMode: boolean;
    colors: {
        border: string;
        textMuted: string;
        textSecondary: string;
    };
}

export const ReplyIndicator: React.FC<ReplyIndicatorProps> = ({
    replyingTo,
    onCancel,
    isDarkMode,
    colors,
}) => {
    return (
        <AnimatePresence>
            {replyingTo && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{
                        background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                        borderTop: `1px solid ${colors.border}`,
                        padding: '8px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        overflow: 'hidden',
                    }}
                >
                    {/* Reply icon */}
                    <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '8px',
                        background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 14 4 9 9 4" />
                            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                        </svg>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '2px',
                        }}>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 500,
                                color: colors.textMuted,
                            }}>
                                Replying to
                            </span>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: isDarkMode ? '#e5e7eb' : '#374151',
                            }}>
                                {replyingTo.userName}
                            </span>
                        </div>
                        <p style={{
                            margin: 0,
                            fontSize: '12px',
                            color: colors.textSecondary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.4,
                        }}>
                            {replyingTo.content}
                        </p>
                    </div>

                    {/* Close button */}
                    <Tooltip text="Cancel reply" placement="above">
                        <motion.button
                            whileHover={{ scale: 1.1, background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onCancel}
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: '8px',
                                border: 'none',
                                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isDarkMode ? '#9ca3af' : '#6b7280',
                                transition: 'all 0.2s ease',
                                flexShrink: 0,
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </motion.button>
                    </Tooltip>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
