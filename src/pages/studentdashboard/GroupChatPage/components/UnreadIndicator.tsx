/**
 * UnreadIndicator Component
 * Displays a separator showing the number of unread messages
 */

import React from 'react';
import { motion } from 'motion/react';

interface UnreadIndicatorProps {
    unreadCount: number;
    isDarkMode: boolean;
}

export const UnreadIndicator = React.memo<UnreadIndicatorProps>(({
    unreadCount,
    isDarkMode,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '12px 0',
            }}
        >
            {/* Left line */}
            <div style={{
                flex: 1,
                height: '1px',
                background: isDarkMode
                    ? 'linear-gradient(to left, rgba(59, 130, 246, 0.4), transparent)'
                    : 'linear-gradient(to left, rgba(59, 130, 246, 0.3), transparent)',
            }} />
            {/* Unread badge */}
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                borderRadius: '12px',
                border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
            }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                </svg>
                <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#3b82f6',
                    letterSpacing: '0.2px',
                }}>
                    {unreadCount} new {unreadCount === 1 ? 'message' : 'messages'}
                </span>
            </div>
            {/* Right line */}
            <div style={{
                flex: 1,
                height: '1px',
                background: isDarkMode
                    ? 'linear-gradient(to right, rgba(59, 130, 246, 0.4), transparent)'
                    : 'linear-gradient(to right, rgba(59, 130, 246, 0.3), transparent)',
            }} />
        </motion.div>
    );
});
