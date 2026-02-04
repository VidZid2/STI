/**
 * ScrollToBottomButton Component
 * Floating button to scroll to the latest messages, shows new message count
 */

import React from 'react';
import { motion } from 'motion/react';
import type { ChatColors } from '../types';

interface ScrollToBottomButtonProps {
    newMessageCount: number;
    onScrollToBottom: () => void;
    isDarkMode: boolean;
    colors: ChatColors;
}

export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({
    newMessageCount,
    onScrollToBottom,
    isDarkMode,
    colors,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.1 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{
                position: 'absolute',
                bottom: 90,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                zIndex: 50,
                pointerEvents: 'none',
            }}
        >
            <motion.button
                whileHover={{ scale: 1.02, transition: { duration: 0.1 } }}
                whileTap={{ scale: 0.98, transition: { duration: 0.05 } }}
                onClick={onScrollToBottom}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: newMessageCount > 0 ? '8px 16px' : '8px 12px',
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: '12px',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                    boxShadow: isDarkMode
                        ? '0 4px 16px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)'
                        : '0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    transition: 'all 0.2s ease',
                }}
            >
                {/* Arrow Icon */}
                <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '8px',
                    background: newMessageCount > 0
                        ? (isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)')
                        : (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={newMessageCount > 0 ? colors.accent : colors.textSecondary}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 5v14M19 12l-7 7-7-7" />
                    </svg>
                </div>

                {/* Text Content */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: newMessageCount > 0 ? colors.accent : colors.textPrimary,
                        lineHeight: 1.2,
                    }}>
                        {newMessageCount > 0 ? `${newMessageCount} new message${newMessageCount > 1 ? 's' : ''}` : 'Jump to latest'}
                    </span>
                    {newMessageCount > 0 && (
                        <span style={{
                            fontSize: '10px',
                            fontWeight: 500,
                            color: colors.textMuted,
                            lineHeight: 1.2,
                        }}>
                            Click to scroll down
                        </span>
                    )}
                </div>

                {/* New Message Badge */}
                {newMessageCount > 0 && (
                    <div style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: colors.accent,
                        boxShadow: `0 0 8px ${colors.accent}60`,
                        animation: 'pulse 2s ease-in-out infinite',
                    }} />
                )}
            </motion.button>
        </motion.div>
    );
};
