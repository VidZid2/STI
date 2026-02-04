/**
 * DateSeparator Component
 * Displays a minimalistic date separator line between messages from different days
 */

import React from 'react';
import { motion } from 'motion/react';
import { formatDateSeparator } from '../utils';

interface DateSeparatorProps {
    date: string;
    isDarkMode: boolean;
    textMutedColor: string;
}

export const DateSeparator: React.FC<DateSeparatorProps> = ({
    date,
    isDarkMode,
    textMutedColor,
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
                padding: '20px 0 12px 0',
            }}
        >
            {/* Left line */}
            <div style={{
                flex: 1,
                height: '1px',
                background: isDarkMode
                    ? 'linear-gradient(to left, rgba(255,255,255,0.08), transparent)'
                    : 'linear-gradient(to left, rgba(0,0,0,0.06), transparent)',
            }} />
            {/* Date text */}
            <span style={{
                fontSize: '11px',
                fontWeight: 500,
                color: textMutedColor,
                letterSpacing: '0.2px',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
            }}>
                {formatDateSeparator(date)}
            </span>
            {/* Right line */}
            <div style={{
                flex: 1,
                height: '1px',
                background: isDarkMode
                    ? 'linear-gradient(to right, rgba(255,255,255,0.08), transparent)'
                    : 'linear-gradient(to right, rgba(0,0,0,0.06), transparent)',
            }} />
        </motion.div>
    );
};
