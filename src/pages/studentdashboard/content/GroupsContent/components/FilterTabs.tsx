/**
 * FilterTabs
 * Filter tabs for GroupsContent (All / My Groups / Public).
 * Extracted from GroupsContent.tsx during Phase 8.2
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import type { GroupFilter, GroupStats } from '../../../../services/groupsService';

// Filter Tabs Component
const FilterTabs: React.FC<{
    activeFilter: GroupFilter;
    setActiveFilter: (filter: GroupFilter) => void;
    isDarkMode: boolean;
    stats: GroupStats;
    colors: { accent: string; textSecondary: string };
}> = ({ activeFilter, setActiveFilter, isDarkMode, stats, colors }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 5, width: 60 });
    
    const tabs: { id: GroupFilter; label: string; count: number; icon: React.ReactNode }[] = [
        { id: 'all', label: 'All', count: stats.totalGroups, icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
        )},
        { id: 'my-groups', label: 'My Groups', count: stats.myGroups, icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
        )},
        { id: 'public', label: 'Public', count: stats.publicGroups, icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
        )},
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

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!containerRef.current) return;
            const activeIndex = tabs.findIndex(t => t.id === activeFilter);
            const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button[data-filter-tab]');
            if (buttons[activeIndex]) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const buttonRect = buttons[activeIndex].getBoundingClientRect();
                setIndicatorStyle({ left: buttonRect.left - containerRect.left, width: buttonRect.width });
            }
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    return (
        <motion.div 
            ref={containerRef}
            layout
            initial={{ opacity: 0, x: 10 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ 
                layout: { type: 'spring', stiffness: 400, damping: 30 },
                delay: 0.35, 
                duration: 0.4 
            }}
            style={{
                display: 'flex', gap: '4px', padding: '4px', borderRadius: '12px',
                background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', position: 'relative',
            }}
        >
            <motion.div
                layout
                style={{
                    position: 'absolute', top: '4px', bottom: '4px', borderRadius: '8px',
                    background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                    border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`, zIndex: 0,
                }}
                initial={false}
                animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
            {tabs.map((tab) => (
                <motion.button
                    layout
                    key={tab.id} 
                    data-filter-tab={tab.id} 
                    onClick={() => setActiveFilter(tab.id)}
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }}
                    transition={{ layout: { type: 'spring', stiffness: 400, damping: 30 } }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px',
                        border: 'none', background: 'transparent', color: activeFilter === tab.id ? colors.accent : colors.textSecondary,
                        fontSize: '12px', fontWeight: 500, cursor: 'pointer', position: 'relative', zIndex: 1, transition: 'color 0.2s ease',
                    }}
                >
                    {tab.icon}
                    {tab.label}
                    <span style={{
                        fontSize: '10px', padding: '2px 6px', borderRadius: '10px',
                        background: activeFilter === tab.id ? 'rgba(59, 130, 246, 0.2)' : isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    }}>
                        {tab.count}
                    </span>
                </motion.button>
            ))}
        </motion.div>
    );
};


export { FilterTabs };
