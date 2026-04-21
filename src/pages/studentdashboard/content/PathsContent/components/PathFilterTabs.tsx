/**
 * PathFilterTabs
 * Filter tabs for PathsContent (All / In Progress / Completed / Bookmarked).
 * Extracted from PathsContent.tsx during Phase 8.6
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

// Filter Tabs Component with proper sliding indicator
interface FilterTabsProps {
    activeFilter: FilterTab;
    setActiveFilter: (filter: FilterTab) => void;
    isDarkMode: boolean;
    colors: {
        accent: string;
        textSecondary: string;
    };
}

const FilterTabs: React.FC<FilterTabsProps> = ({ activeFilter, setActiveFilter, isDarkMode, colors }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 5, width: 60 });
    
    const tabs: { id: FilterTab; label: string; icon: React.ReactNode }[] = [
        {
            id: 'all',
            label: 'All',
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                </svg>
            ),
        },
        {
            id: 'enrolled',
            label: 'Enrolled',
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            ),
        },
        {
            id: 'available',
            label: 'Available',
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
            ),
        },
    ];

    // Update indicator position when active filter changes
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

    // Initial measurement after mount
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
                background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                position: 'relative',
            }}
        >
            {/* Sliding Background Indicator */}
            <motion.div
                style={{
                    position: 'absolute',
                    top: '4px',
                    bottom: '4px',
                    borderRadius: '8px',
                    background: isDarkMode 
                        ? 'rgba(59, 130, 246, 0.15)' 
                        : 'rgba(59, 130, 246, 0.1)',
                    border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                    zIndex: 0,
                }}
                initial={false}
                animate={{
                    left: indicatorStyle.left,
                    width: indicatorStyle.width,
                }}
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
                        color: activeFilter === tab.id ? colors.accent : colors.textSecondary,
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 1,
                        transition: 'color 0.2s ease',
                    }}
                >
                    {tab.icon}
                    {tab.label}
                </motion.button>
            ))}
        </motion.div>
    );
};


export { FilterTabs };
