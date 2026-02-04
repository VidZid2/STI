/**
 * QuickActionButton Component
 * Phase 2 & 3: Extracted quick action button with keyboard navigation support
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, ANIMATION } from '../constants';
import type { QuickActionButtonProps } from '../types';
import { ChevronRightIcon } from '../icons';

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ 
    label, 
    icon, 
    color, 
    onClick, 
    index, 
    isPrimary = false, 
    disabled = false, 
    ariaLabel 
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Keyboard handler for accessibility
    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (!disabled) {
                onClick();
            }
        }
    }, [disabled, onClick]);

    // Combined hover/focus state for visual feedback
    const isActive = isHovered || isFocused;

    // Primary button variant (compact, centered)
    if (isPrimary) {
        return (
            <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                whileHover={{ scale: 1.02, boxShadow: `0 6px 20px ${color}40` }}
                whileTap={{ scale: 0.98 }}
                onClick={onClick}
                disabled={disabled}
                aria-label={ariaLabel || label}
                role="button"
                tabIndex={disabled ? -1 : 0}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: SPACING.sm,
                    padding: `${SPACING.md} ${SPACING.xl}`,
                    borderRadius: BORDER_RADIUS.xl,
                    border: `1px solid ${color}30`,
                    background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    width: '100%',
                    color: color,
                    fontSize: FONT_SIZE.md,
                    fontWeight: FONT_WEIGHT.semibold,
                    opacity: disabled ? 0.5 : 1,
                    outline: isFocused ? `2px solid ${color}` : 'none',
                    outlineOffset: '2px',
                }}
            >
                <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                }}>
                    {icon}
                </div>
                {label}
            </motion.button>
        );
    }

    // Secondary button variant (card-style with arrow)
    return (
        <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel || label}
            role="button"
            tabIndex={disabled ? -1 : 0}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.md,
                padding: `${SPACING.lg} ${SPACING.lg}`,
                borderRadius: BORDER_RADIUS.xxl,
                border: `1px solid ${isActive ? `${color}40` : COLORS.border}`,
                background: isActive ? `${color}06` : COLORS.surface,
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                width: '100%',
                boxShadow: isActive ? `0 8px 24px ${color}12` : 'none',
                transform: isActive ? 'translateY(-2px)' : 'none',
                opacity: disabled ? 0.5 : 1,
                outline: isFocused ? `2px solid ${color}` : 'none',
                outlineOffset: '2px',
            }}
        >
            {/* Icon Container */}
            <motion.div 
                animate={{ scale: isActive ? 1.05 : 1 }}
                transition={ANIMATION.ease.spring}
                style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: BORDER_RADIUS.xl,
                    background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
                    border: `1px solid ${color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color,
                    flexShrink: 0,
                }}
            >
                {icon}
            </motion.div>

            {/* Label */}
            <div style={{ flex: 1, textAlign: 'left' }}>
                <span style={{ 
                    fontSize: FONT_SIZE.base, 
                    fontWeight: FONT_WEIGHT.semibold, 
                    color: COLORS.textPrimary, 
                    letterSpacing: '-0.2px' 
                }}>
                    {label}
                </span>
            </div>

            {/* Arrow Indicator */}
            <motion.div
                animate={{ 
                    x: isActive ? 4 : 0, 
                    opacity: isActive ? 1 : 0.5 
                }}
                transition={{ duration: ANIMATION.duration.fast }}
                style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: BORDER_RADIUS.md,
                    background: isActive ? `${color}10` : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isActive ? color : COLORS.textMuted,
                }}
            >
                <ChevronRightIcon />
            </motion.div>
        </motion.button>
    );
};

export default QuickActionButton;
