/**
 * TypingIndicator Component
 * Displays animated typing indicator showing who is currently typing
 */

import React from 'react';
import { motion } from 'motion/react';

interface TypingUser {
    id: string;
    name: string;
    avatar?: string;
}

interface TypingIndicatorProps {
    typingUsers: TypingUser[];
    
    textMutedColor: string;
}

export const TypingIndicator = React.memo<TypingIndicatorProps>(({
    typingUsers,
    
    textMutedColor }) => {
    if (typingUsers.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.1 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            aria-live="polite"
            aria-atomic="true"
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 0',
                marginLeft: '4px' }}
        >
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '20px',
                border: `1px solid ${'rgba(255,255,255,0.06)'}` }}>
                {/* Animated dots - using CSS animation for better performance */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px' }}>
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{
                                y: [0, -2, 0],
                                opacity: [0.4, 1, 0.4] }}
                            transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.12,
                                ease: 'easeInOut' }}
                            style={{
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                background: textMutedColor }}
                        />
                    ))}
                </div>
                {/* Typing text */}
                <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: textMutedColor,
                    letterSpacing: '0.3px' }}>
                    {typingUsers.length === 1
                        ? `${typingUsers[0].name} is typing`
                        : typingUsers.length === 2
                            ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing`
                            : `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing`
                    }
                </span>
            </div>
        </motion.div>
    );
});
