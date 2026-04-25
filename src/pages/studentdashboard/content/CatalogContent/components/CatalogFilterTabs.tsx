/**
 * CatalogFilterTabs
 * Filter tabs for CatalogContent.
 * Extracted from CatalogContent.tsx during Phase 8.7
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import type { CourseCategory, CatalogStats } from '../../../../../services/catalogService';

// Filter Tabs Component
const FilterTabs: React.FC<{
    activeFilter: CourseCategory | 'favorites';
    setActiveFilter: (filter: CourseCategory | 'favorites') => void;
    stats: CatalogStats;
    colors: { accent: string; textSecondary: string };
    favoritesCount: number;
}> = ({ activeFilter, setActiveFilter, stats, colors, favoritesCount }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 5, width: 60 });
    
    const tabs: { id: CourseCategory | 'favorites'; label: string; count: number; icon?: React.ReactNode }[] = [
        { id: 'all', label: 'All', count: stats.totalCourses },
        { id: 'favorites', label: 'Favorites', count: favoritesCount, icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill={activeFilter === 'favorites' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
        )},
        { id: 'major', label: 'Major', count: stats.majorCourses },
        { id: 'ge', label: 'GE', count: stats.geCourses },
        { id: 'pe', label: 'PE', count: stats.peCourses },
        { id: 'nstp', label: 'NSTP', count: stats.nstpCourses },
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
            role="tablist"
            aria-label="Filter courses by category"
            initial={{ opacity: 0, x: 10 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.35, duration: 0.4 }}
            style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '12px', background: 'var(--bg-hover)', position: 'relative' }}
        >
            <motion.div 
                aria-hidden="true"
                style={{ position: 'absolute', top: '4px', bottom: '4px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', border: `1px solid ${'rgba(59, 130, 246, 0.1)'}`, zIndex: 0 }}
                initial={false} 
                animate={{ left: indicatorStyle.left, width: indicatorStyle.width }} 
                transition={{ type: 'spring', stiffness: 500, damping: 35 }} 
            />
            {tabs.map((tab) => (
                <motion.button 
                    key={tab.id} 
                    role="tab"
                    aria-selected={activeFilter === tab.id}
                    aria-controls="course-grid"
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
                        outline: 'none',
                    }}
                >
                    {tab.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{tab.icon}</span>}
                    {tab.label}
                    <span aria-label={`${tab.count} courses`} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '10px', background: activeFilter === tab.id ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-hover)' }}>
                        {tab.count}
                    </span>
                </motion.button>
            ))}
        </motion.div>
    );
};



export { FilterTabs };
