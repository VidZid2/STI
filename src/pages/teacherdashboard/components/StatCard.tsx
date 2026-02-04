/**
 * StatCard Component
 * Phase 2: Extracted stat card for dashboard statistics display
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, ANIMATION } from '../constants';
import type { StatCardProps } from '../types';

const StatCard: React.FC<StatCardProps> = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    color, 
    index 
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
                delay: index * 0.1, 
                duration: ANIMATION.duration.slow, 
                ease: ANIMATION.ease.smooth 
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            role="article"
            aria-label={`${title}: ${value}`}
            style={{
                background: COLORS.surface,
                borderRadius: BORDER_RADIUS.xxxl,
                padding: SPACING.xxl,
                border: `1px solid ${isHovered ? `${color}40` : COLORS.border}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isHovered ? `0 8px 24px ${color}15` : 'none',
                transform: isHovered ? 'translateY(-2px)' : 'none',
            }}
        >
            {/* Icon Container */}
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: BORDER_RADIUS.xxl,
                background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: color,
                marginBottom: SPACING.lg,
            }}>
                {icon}
            </div>

            {/* Value */}
            <div style={{ 
                fontSize: FONT_SIZE.xxxl, 
                fontWeight: FONT_WEIGHT.bold, 
                color: COLORS.textPrimary, 
                marginBottom: SPACING.xs 
            }}>
                {value}
            </div>

            {/* Title */}
            <div style={{ 
                fontSize: FONT_SIZE.base, 
                fontWeight: FONT_WEIGHT.medium, 
                color: COLORS.textSecondary 
            }}>
                {title}
            </div>

            {/* Subtitle */}
            <div style={{ 
                fontSize: FONT_SIZE.sm, 
                color: COLORS.textMuted, 
                marginTop: SPACING.xs 
            }}>
                {subtitle}
            </div>
        </motion.div>
    );
};

export default StatCard;
