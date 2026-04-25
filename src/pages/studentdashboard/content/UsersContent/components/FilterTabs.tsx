/**
 * FilterTabs
 * Filter tabs for UsersContent (All / Student / Teacher / Admin).
 * Extracted from UsersContent.tsx during Phase 8.4
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

type FilterTab = 'all' | 'student' | 'teacher' | 'admin' | 'dean';
interface UserStats { totalUsers: number; students: number; teachers: number; admins: number; }

const FilterTabs: React.FC<{
    activeFilter: FilterTab;
    setActiveFilter: (filter: FilterTab) => void;
    stats: UserStats;
    colors: { accent: string; textSecondary: string; textMuted: string };
}> = ({ activeFilter, setActiveFilter, stats, colors }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 5, width: 60 });
    
    const tabs: { id: FilterTab; label: string; count: number }[] = [
        { id: 'all', label: 'All', count: stats.totalUsers },
        { id: 'student', label: 'Students', count: stats.students },
        { id: 'teacher', label: 'Teachers', count: stats.teachers },
        { id: 'admin', label: 'Admins', count: stats.admins },
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
            setIndicatorStyle({
                left: buttonRect.left - containerRect.left,
                width: buttonRect.width,
            });
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
                setIndicatorStyle({
                    left: buttonRect.left - containerRect.left,
                    width: buttonRect.width,
                });
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
                display: 'flex',
                gap: '4px',
                padding: '4px',
                borderRadius: '12px',
                background: 'var(--bg-hover)',
                position: 'relative',
            }}
        >
            <motion.div
                style={{
                    position: 'absolute',
                    top: '4px',
                    bottom: '4px',
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: `1px solid ${'rgba(59, 130, 246, 0.3)'}`,
                    zIndex: 0,
                }}
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
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: activeFilter === tab.id ? 'var(--accent-color)' : 'var(--text-secondary)',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 1,
                        transition: 'color 0.2s ease',
                    }}
                >
                    {tab.label}
                    <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        background: activeFilter === tab.id 
                            ? 'rgba(59, 130, 246, 0.2)' 
                            : 'var(--border-light)',
                    }}>
                        {tab.count}
                    </span>
                </motion.button>
            ))}
        </motion.div>
    );
};


// ActionTooltip — extracted to ./components/ActionTooltip.tsx


export { FilterTabs };
