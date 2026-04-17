/**
 * ActivityItem Component
 * Phase 2: Extracted activity item for recent activity display
 */

import React from 'react';
import { motion } from 'motion/react';
import type { ActivityItem as ActivityItemType } from '../constants';
import { getActivityIcon } from '../icons';

interface ActivityItemProps extends ActivityItemType {
    index: number;
    onClick?: () => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({
    action, student, course, time, color, iconType, index, onClick,
}) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 + index * 0.05 }}
        whileHover={{ background: `${color}06`, borderColor: `${color}30` }}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
        style={{
            background: 'rgba(0,0,0,0.015)',
            border: '1px solid transparent',
            cursor: onClick ? 'pointer' : 'default',
        }}
    >
        {/* Icon */}
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
                background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
                border: `1px solid ${color}20`,
                color,
            }}>
            {getActivityIcon(iconType)}
        </div>

        {/* Content */}
        <div className="flex-1">
            <div className="text-[11px] font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{action}</div>
            <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{student} • {course}</div>
        </div>

        {/* Time */}
        <div className="text-[10px] px-2 py-0.5 rounded-md" style={{ color: 'var(--text-muted)', background: 'var(--border-subtle)' }}>
            {time}
        </div>
    </motion.div>
);

export default ActivityItem;
