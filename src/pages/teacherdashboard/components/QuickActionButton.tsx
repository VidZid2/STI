/**
 * QuickActionButton Component
 * Phase 2 & 3: Extracted quick action button with keyboard navigation support
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { ANIMATION } from '../constants';
import type { QuickActionButtonProps } from '../types';
import { ChevronRightIcon } from '../icons';

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
    label, icon, color, onClick, index, isPrimary = false, disabled = false, ariaLabel,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const isActive = isHovered || isFocused;

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
            event.preventDefault();
            onClick();
        }
    }, [disabled, onClick]);

    const sharedMotionProps = {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 0.3 + index * 0.05 },
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
        onFocus: () => setIsFocused(true),
        onBlur: () => setIsFocused(false),
        onKeyDown: handleKeyDown,
        onClick,
        disabled,
        'aria-label': ariaLabel || label,
        role: 'button' as const,
        tabIndex: disabled ? -1 : 0,
    };

    if (isPrimary) {
        return (
            <motion.button
                {...sharedMotionProps}
                whileHover={{ scale: 1.02, boxShadow: `0 6px 20px ${color}40` }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 w-full font-semibold"
                style={{
                    padding: '8px 20px',
                    borderRadius: '10px',
                    border: `1px solid ${color}30`,
                    background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    color,
                    fontSize: '11px',
                    opacity: disabled ? 0.5 : 1,
                    outline: isFocused ? `2px solid ${color}` : 'none',
                    outlineOffset: '2px',
                }}
            >
                <div className="w-5 h-5 flex items-center justify-center">{icon}</div>
                {label}
            </motion.button>
        );
    }

    return (
        <motion.button
            {...sharedMotionProps}
            className="flex items-center gap-2 w-full"
            style={{
                padding: '10px',
                borderRadius: '12px',
                border: `1px solid ${isActive ? `${color}40` : 'var(--border-subtle)'}`,
                background: isActive ? `${color}06` : 'var(--bg-surface)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                boxShadow: isActive ? `0 8px 24px ${color}12` : 'none',
                transform: isActive ? 'translateY(-2px)' : 'none',
                opacity: disabled ? 0.5 : 1,
                outline: isFocused ? `2px solid ${color}` : 'none',
                outlineOffset: '2px',
                transition: 'all 0.2s ease',
            }}
        >
            {/* Icon */}
            <motion.div
                animate={{ scale: isActive ? 1.05 : 1 }}
                transition={ANIMATION.ease.spring}
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{
                    background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
                    border: `1px solid ${color}20`,
                    color,
                }}
            >
                {icon}
            </motion.div>

            {/* Label */}
            <div className="flex-1 text-left">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>{label}</span>
            </div>

            {/* Arrow */}
            <motion.div
                animate={{ x: isActive ? 4 : 0, opacity: isActive ? 1 : 0.5 }}
                transition={{ duration: ANIMATION.duration.fast }}
                className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{
                    background: isActive ? `${color}10` : 'transparent',
                    color: isActive ? color : 'var(--text-muted)',
                }}
            >
                <ChevronRightIcon />
            </motion.div>
        </motion.button>
    );
};

export default QuickActionButton;
