/**
 * ActivityItem Component
 * Phase 2: Extracted activity item for recent activity display
 */

import React from 'react';
import { motion } from 'motion/react';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT } from '../constants';
import type { ActivityItem as ActivityItemType } from '../constants';
import { getActivityIcon } from '../icons';

interface ActivityItemProps extends ActivityItemType {
    index: number;
    onClick?: () => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ 
    action, 
    student, 
    course, 
    time, 
    color, 
    iconType,
    index,
    onClick 
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            whileHover={{ 
                background: `${color}06`, 
                borderColor: `${color}30` 
            }}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.md,
                padding: `${SPACING.md} ${SPACING.lg}`,
                borderRadius: BORDER_RADIUS.xl,
                background: 'rgba(0,0,0,0.015)',
                border: '1px solid transparent',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
            }}
        >
            {/* Icon Container */}
            <div style={{
                width: '36px',
                height: '36px',
                borderRadius: BORDER_RADIUS.lg,
                background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
                border: `1px solid ${color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: color,
                flexShrink: 0,
            }}>
                {getActivityIcon(iconType)}
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
                <div style={{ 
                    fontSize: FONT_SIZE.md, 
                    fontWeight: FONT_WEIGHT.semibold, 
                    color: COLORS.textPrimary, 
                    marginBottom: '2px' 
                }}>
                    {action}
                </div>
                <div style={{ 
                    fontSize: FONT_SIZE.sm, 
                    color: COLORS.textSecondary 
                }}>
                    {student} • {course}
                </div>
            </div>

            {/* Time Badge */}
            <div style={{ 
                fontSize: FONT_SIZE.xs, 
                color: COLORS.textMuted,
                padding: `${SPACING.xs} ${SPACING.sm}`,
                borderRadius: BORDER_RADIUS.sm,
                background: COLORS.borderLight,
            }}>
                {time}
            </div>
        </motion.div>
    );
};

export default ActivityItem;
