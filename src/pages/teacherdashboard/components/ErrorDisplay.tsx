/**
 * ErrorDisplay Component
 * Phase 2: Extracted error display with retry functionality
 */

import React from 'react';
import { motion } from 'motion/react';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT } from '../constants';

interface ErrorDisplayProps {
    message: string;
    onRetry: () => void;
    title?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
    message, 
    onRetry, 
    title = 'Something went wrong' 
}) => (
    <div style={{
        minHeight: '100vh',
        background: COLORS.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    }}>
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
                background: COLORS.surface,
                borderRadius: BORDER_RADIUS.full,
                padding: SPACING.xxxl,
                textAlign: 'center',
                maxWidth: '400px',
                border: `1px solid ${COLORS.dangerBorder}`,
            }}
        >
            {/* Error Icon */}
            <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: COLORS.dangerLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: COLORS.danger,
            }}>
                <svg 
                    width="32" 
                    height="32" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            </div>

            {/* Title */}
            <h2 style={{ 
                fontSize: FONT_SIZE.xxl, 
                fontWeight: FONT_WEIGHT.semibold, 
                color: COLORS.textPrimary, 
                margin: '0 0 8px' 
            }}>
                {title}
            </h2>

            {/* Message */}
            <p style={{ 
                fontSize: FONT_SIZE.base, 
                color: COLORS.textSecondary, 
                margin: '0 0 20px' 
            }}>
                {message}
            </p>

            {/* Retry Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onRetry}
                style={{
                    padding: '12px 24px',
                    borderRadius: BORDER_RADIUS.lg,
                    border: 'none',
                    background: COLORS.primary,
                    color: '#fff',
                    fontSize: FONT_SIZE.base,
                    fontWeight: FONT_WEIGHT.semibold,
                    cursor: 'pointer',
                }}
            >
                Try Again
            </motion.button>
        </motion.div>
    </div>
);

export default ErrorDisplay;
