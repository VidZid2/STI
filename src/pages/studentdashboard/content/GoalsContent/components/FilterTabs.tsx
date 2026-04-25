/**
 * FilterTabs
 * Filter tabs for GoalsContent (All / Active / Completed / Paused).
 * Extracted from GoalsContent.tsx during Phase 8.3
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

type FilterTab = 'all' | 'active' | 'completed';

// Filter Tabs Component (matching PathsContent)
const FilterTabs: React.FC<{
    activeFilter: FilterTab;
    setActiveFilter: (filter: FilterTab) => void;
    
}> = ({ activeFilter, setActiveFilter }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 5, width: 60 });
    
    const tabs: { id: FilterTab; label: string; icon: React.ReactNode }[] = [
        {
            id: 'all',
            label: 'All',
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
            ) },
        {
            id: 'active',
            label: 'Active',
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
            ) },
        {
            id: 'completed',
            label: 'Completed',
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            ) },
    ];

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const activeIndex = tabs.findIndex(t => t.id === activeFilter);
        const buttons = container.querySelectorAll<HTMLButtonElement>('button[data-filter-tab]');
        if (buttons[activeIndex]) {
            const button = buttons[activeIndex];
            const containerRect = container.getBoundingClientRect();
            const buttonRect = button.getBoundingClientRect();
            setIndicatorStyle({ left: buttonRect.left - containerRect.left, width: buttonRect.width });
        }
    }, [activeFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!containerRef.current) return;
            const container = containerRef.current;
            const activeIndex = tabs.findIndex(t => t.id === activeFilter);
            const buttons = container.querySelectorAll<HTMLButtonElement>('button[data-filter-tab]');
            if (buttons[activeIndex]) {
                const button = buttons[activeIndex];
                const containerRect = container.getBoundingClientRect();
                const buttonRect = button.getBoundingClientRect();
                setIndicatorStyle({ left: buttonRect.left - containerRect.left, width: buttonRect.width });
            }
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    return (
        <motion.div 
            ref={containerRef}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            style={{
                display: 'flex', gap: '4px', padding: '4px', borderRadius: '12px',
                background: 'var(--bg-hover)',
                position: 'relative' }}
        >
            <motion.div
                style={{
                    position: 'absolute', top: '4px', bottom: '4px', borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: `1px solid ${'rgba(59, 130, 246, 0.2)'}`,
                    zIndex: 0 }}
                initial={false}
                animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
            {tabs.map((tab) => (
                <motion.button
                    key={tab.id}
                    data-filter-tab={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px',
                        borderRadius: '8px', border: 'none', background: 'transparent',
                        color: activeFilter === tab.id ? 'var(--accent-color)' : 'var(--text-secondary)',
                        fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                        position: 'relative', zIndex: 1, transition: 'color 0.2s ease' }}
                >
                    {tab.icon}
                    {tab.label}
                </motion.button>
            ))}
        </motion.div>
    );
};

export { FilterTabs };
export type { FilterTab };
