/**
 * ThreadIndicator Component
 * Shows "X replies" button below messages that have thread replies
 */

import React from 'react';
import { motion } from 'motion/react';
import type { ChatColors } from '../types';

interface ThreadIndicatorProps {
    replyCount: number;
    uniqueAuthors: string[];
    isDarkMode: boolean;
    colors: ChatColors;
    onClick: () => void;
}

export const ThreadIndicator = React.memo<ThreadIndicatorProps>(({
    replyCount,
    uniqueAuthors,
    isDarkMode,
    colors,
    onClick,
}) => {
    if (replyCount === 0) return null;

    return (
        <motion.button
            initial={false}
            whileHover={{
                scale: 1.02,
                background: isDarkMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)',
                borderColor: '#3b82f6',
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '6px',
                padding: '6px 12px',
                borderRadius: '10px',
                border: `1.5px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                background: isDarkMode ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.03)',
                cursor: 'pointer',
                width: 'fit-content',
                transition: 'all 0.2s ease',
            }}
        >
            {/* Thread icon */}
            <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <path d="M8 9h8" />
                <path d="M8 13h6" />
            </svg>

            {/* Stacked avatars */}
            <div style={{ display: 'flex', marginRight: '-4px' }}>
                {uniqueAuthors.map((author, idx) => (
                    <motion.div
                        key={author}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        style={{
                            width: 20,
                            height: 20,
                            borderRadius: '6px',
                            background: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                            border: `1.5px solid ${colors.cardBg}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9px',
                            fontWeight: 600,
                            color: '#3b82f6',
                            marginLeft: idx > 0 ? '-6px' : 0,
                            zIndex: uniqueAuthors.length - idx,
                        }}
                    >
                        {author.charAt(0)}
                    </motion.div>
                ))}
            </div>

            {/* Reply count and text */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                    style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#3b82f6',
                    }}
                >
                    {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                </span>
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </div>
        </motion.button>
    );
});
