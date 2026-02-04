/**
 * ComingSoonModal Component
 * Phase 2 & 3: Reusable coming soon placeholder modal with keyboard support
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT } from '../constants';
import { useFocusTrap, useModalKeyboard } from '../hooks/useKeyboardNavigation';

interface ComingSoonModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    icon?: React.ReactNode;
    color?: string;
}

const ComingSoonModal: React.FC<ComingSoonModalProps> = ({ 
    isOpen, 
    onClose, 
    title = 'Coming Soon',
    description = 'This feature is currently under development.',
    icon,
    color = COLORS.purple,
}) => {
    // Keyboard support
    useModalKeyboard({ isOpen, onClose });
    const focusTrapRef = useFocusTrap(isOpen);

    // Default icon if none provided
    const defaultIcon = (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="coming-soon-title"
                    aria-describedby="coming-soon-description"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                >
                    <motion.div
                        ref={focusTrapRef}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: COLORS.surface,
                            borderRadius: BORDER_RADIUS.full,
                            padding: SPACING.xxxl,
                            maxWidth: '400px',
                            textAlign: 'center',
                        }}
                    >
                        {/* Icon */}
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: `${color}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            color: color,
                        }}>
                            {icon || defaultIcon}
                        </div>

                        {/* Title */}
                        <h2 
                            id="coming-soon-title"
                            style={{ 
                                fontSize: FONT_SIZE.xxl, 
                                fontWeight: FONT_WEIGHT.semibold, 
                                color: COLORS.textPrimary, 
                                margin: '0 0 8px' 
                            }}
                        >
                            {title}
                        </h2>

                        {/* Description */}
                        <p 
                            id="coming-soon-description"
                            style={{ 
                                fontSize: FONT_SIZE.base, 
                                color: COLORS.textSecondary, 
                                margin: '0 0 20px' 
                            }}
                        >
                            {description}
                        </p>

                        {/* Close Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClose}
                            style={{
                                padding: '12px 24px',
                                borderRadius: BORDER_RADIUS.lg,
                                border: 'none',
                                background: color,
                                color: '#fff',
                                fontSize: FONT_SIZE.base,
                                fontWeight: FONT_WEIGHT.semibold,
                                cursor: 'pointer',
                            }}
                        >
                            Got it
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ComingSoonModal;
