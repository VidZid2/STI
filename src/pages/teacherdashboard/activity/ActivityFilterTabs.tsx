import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { COLORS, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT } from '../constants';

const ACCENT_COLOR = '#3b82f6';

export type ActivityFilterType = 'all' | 'submissions' | 'graded' | 'late' | 'pending';

interface ActivityFilterTabsProps {
    activeFilter: ActivityFilterType;
    setActiveFilter: (filter: ActivityFilterType) => void;
    counts: { all: number; submissions: number; graded: number; late: number; pending: number };
}

const ActivityFilterTabs: React.FC<ActivityFilterTabsProps> = ({ activeFilter, setActiveFilter, counts }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 4, width: 60 });

    const tabs: { id: ActivityFilterType; label: string; count: number }[] = [
        { id: 'all', label: 'All', count: counts.all },
        { id: 'submissions', label: 'Submitted', count: counts.submissions },
        { id: 'graded', label: 'Graded', count: counts.graded },
        { id: 'late', label: 'Late', count: counts.late },
        { id: 'pending', label: 'Pending', count: counts.pending },
    ];

    useEffect(() => {
        if (!containerRef.current) return;
        const activeIndex = tabs.findIndex(t => t.id === activeFilter);
        const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button[data-filter-tab]');
        if (buttons[activeIndex]) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const buttonRect = buttons[activeIndex].getBoundingClientRect();
            setIndicatorStyle({ left: buttonRect.left - containerRect.left, width: buttonRect.width });
        }
    }, [activeFilter]);

    return (
        <div
            ref={containerRef}
            role="tablist"
            aria-label="Filter activities"
            className="activity-filter-tabs"
            style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: BORDER_RADIUS.xl, background: 'rgba(0,0,0,0.02)', position: 'relative', overflowX: 'auto' }}
        >
            <motion.div
                className="activity-filter-indicator"
                style={{ position: 'absolute', top: '4px', bottom: '4px', borderRadius: BORDER_RADIUS.lg, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', zIndex: 0 }}
                initial={false}
                animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
            {tabs.map((tab) => (
                <motion.button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeFilter === tab.id}
                    aria-label={`${tab.label} (${tab.count})`}
                    data-filter-tab={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: BORDER_RADIUS.lg, border: 'none', background: 'transparent', color: activeFilter === tab.id ? ACCENT_COLOR : COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium, cursor: 'pointer', position: 'relative', zIndex: 1, whiteSpace: 'nowrap' }}
                >
                    {tab.label}
                    <span
                        aria-hidden="true"
                        className={`activity-filter-badge${activeFilter === tab.id ? ' activity-filter-badge--active' : ''}`}
                        style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '10px', background: activeFilter === tab.id ? 'rgba(59,130,246,0.2)' : 'rgba(0,0,0,0.05)' }}
                    >
                        {tab.count}
                    </span>
                </motion.button>
            ))}
        </div>
    );
};

export default ActivityFilterTabs;
