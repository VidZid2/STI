/**
 * ErrorDisplay Component
 * Phase 2: Extracted error display with retry functionality
 */

import React from 'react';
import { motion } from 'motion/react';

interface ErrorDisplayProps {
    message: string;
    onRetry: () => void;
    title?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
    message,
    onRetry,
    title = 'Something went wrong',
}) => (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-canvas)' }}>
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-8 text-center max-w-[400px]"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--color-danger-bg)' }}
        >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            </div>
            <h2 className="text-base font-semibold m-0 mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h2>
            <p className="text-xs m-0 mb-5" style={{ color: 'var(--text-secondary)' }}>{message}</p>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onRetry}
                className="px-6 py-3 rounded-lg border-none text-xs font-semibold cursor-pointer"
                style={{ background: 'var(--accent-primary)', color: 'var(--bg-surface)' }}
            >
                Try Again
            </motion.button>
        </motion.div>
    </div>
);

export default ErrorDisplay;
