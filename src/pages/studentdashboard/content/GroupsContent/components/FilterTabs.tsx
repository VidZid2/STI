/**
 * FilterTabs
 * Filter tabs for GroupsContent (All / My Groups / Public).
 * Extracted from GroupsContent.tsx during Phase 8.2
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { GroupFilter, GroupStats } from '../../../../../services/groupsService';

// Filter Tabs Component
const FilterTabs: React.FC<{
    activeFilter: GroupFilter;
    setActiveFilter: (filter: GroupFilter) => void;
    stats: GroupStats;
}> = ({ activeFilter, setActiveFilter, stats }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
    const [indicator, setIndicator] = useState({ x: 0, width: 0, ready: false });
    
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

    const measure = useCallback(() => {
        const container = containerRef.current;
        const btn = buttonRefs.current.get(activeFilter);
        if (!container || !btn) return;

        setIndicator({
            x: btn.offsetLeft,
            width: btn.offsetWidth,
            ready: true,
        });
    }, [activeFilter]);

    // Measure on filter change
    useEffect(() => {
        const id = requestAnimationFrame(measure);
        return () => cancelAnimationFrame(id);
    }, [measure]);

    // Re-measure on resize
    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        const onResize = () => {
            clearTimeout(timeout);
            timeout = setTimeout(measure, 100);
        };
        window.addEventListener('resize', onResize, { passive: true });
        return () => {
            window.removeEventListener('resize', onResize);
            clearTimeout(timeout);
        };
    }, [measure]);

    return (
        <div
            className="rounded-xl shadow-sm border bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 w-full sm:w-auto overflow-x-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
            <div ref={containerRef} className="flex gap-1 p-1 relative min-w-max">
            {/* Sliding indicator */}
            <div
                className="absolute top-1 bottom-1 left-0 rounded-lg bg-white border border-slate-200 shadow-sm dark:bg-slate-700 dark:border-slate-600 pointer-events-none"
                style={{
                    width: indicator.width,
                    transform: `translateX(${indicator.x}px)`,
                    transition: indicator.ready
                        ? 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), width 0.35s cubic-bezier(0.22, 1, 0.36, 1)'
                        : 'none',
                    willChange: 'transform, width',
                    zIndex: 0,
                }}
            />

            {tabs.map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                    <button
                        key={tab.id}
                        ref={(el) => {
                            if (el) buttonRefs.current.set(tab.id, el);
                        }}
                        data-filter-tab={tab.id}
                        onClick={() => setActiveFilter(tab.id)}
                        className={`relative z-10 flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-[13px] font-bold whitespace-nowrap sm:flex-shrink-0 select-none ${isActive
                            ? 'text-blue-600 dark:text-slate-100'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                        style={{
                            transition: 'color 0.2s ease',
                            WebkitTapHighlightColor: 'transparent',
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-slate-200/50 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400'}`}>
                            {tab.count}
                        </span>
                    </button>
                );
            })}
            </div>
        </div>
    );
};


export { FilterTabs };
