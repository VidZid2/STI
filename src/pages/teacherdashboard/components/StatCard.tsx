/**
 * StatCard Component
 * Phase 2: Extracted stat card for dashboard statistics display
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ANIMATION } from '../constants';
import type { StatCardProps } from '../types';

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    color,
    index,
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: index * 0.1,
                duration: ANIMATION.duration.slow,
                ease: ANIMATION.ease.smooth,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            role="article"
            aria-label={`${title}: ${value}`}
            className="rounded-2xl p-6 cursor-pointer transition-all"
            style={{
                background: 'var(--bg-surface)',
                border: `1px solid ${isHovered ? `${color}40` : 'var(--border-subtle)'}`,
                boxShadow: isHovered ? `0 8px 24px ${color}15` : 'none',
                transform: isHovered ? 'translateY(-2px)' : 'none',
            }}
        >
            {/* Icon */}
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-2.5"
                style={{
                    background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
                    color,
                }}
            >
                {icon}
            </div>

            {/* Value */}
            <div className="text-[18px] font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                {value}
            </div>

            {/* Title */}
            <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {title}
            </div>

            {/* Subtitle */}
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {subtitle}
            </div>
        </motion.div>
    );
};

export default StatCard;
