/**
 * EmptyState Component
 * Displays a friendly message when there are no messages in the chat
 */

import React from 'react';
import { motion } from 'motion/react';
import type { ChatColors } from '../types';

interface EmptyStateProps {
    
}

export const EmptyState: React.FC<EmptyStateProps> = ({ }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94],
                scale: { type: 'spring', stiffness: 200, damping: 20 }
            }}
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                textAlign: 'center' }}
        >
            {/* Icon Container */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
                style={{
                    width: 80,
                    height: 80,
                    borderRadius: '24px',
                    background: `linear-gradient(135deg, var(--accent-color)15 0%, var(--accent-color)08 100%)`,
                    border: `1.5px solid var(--accent-color)20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                    boxShadow: `0 8px 32px var(--accent-color)10` }}
            >
                {/* Minimalistic Send/Chat Icon */}
                <motion.svg
                    initial={{ opacity: 0, rotate: -20 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={'var(--accent-color)'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M22 2L11 13" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </motion.svg>
            </motion.div>

            {/* Title */}
            <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '8px' }}
            >
                Start the conversation
            </motion.h3>

            {/* Subtitle */}
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.3 }}
                style={{
                    margin: 0,
                    fontSize: '14px',
                    color: 'var(--text-muted)',
                    maxWidth: '280px',
                    lineHeight: 1.5 }}
            >
                Be the first to send a message and get the discussion started!
            </motion.p>

            {/* Decorative dots */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                style={{
                    display: 'flex',
                    gap: '6px',
                    marginTop: '24px' }}
            >
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -4, 0],
                            opacity: [0.4, 1, 0.4]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: 'easeInOut' }}
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: 'var(--accent-color)' }}
                    />
                ))}
            </motion.div>
        </motion.div>
    );
};
