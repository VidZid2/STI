/**
 * ResourceCard + ResourceIcon + FilterTabs + FocusSkeleton
 * Resource management components for FocusModePage.
 * Extracted from FocusModePage.tsx during Phase 8.5
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import type { Resource, FilterTab } from '../FocusModePage';

// Resource type configuration (extracted for standalone use)
const RESOURCE_TYPE_CONFIG: Record<string, { icon: string; label: string; color: string; bgGradient?: string; actionLabel?: string }> = {
    link: { icon: '🔗', label: 'Link', color: '#3b82f6' },
    file: { icon: '📄', label: 'File', color: '#8b5cf6' },
    image: { icon: '🖼️', label: 'Image', color: '#10b981' },
    code: { icon: '💻', label: 'Code', color: '#f59e0b' },
    note: { icon: '📝', label: 'Note', color: '#ef4444' },
};

// Skeleton Loading Component
const FocusSkeleton: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    const colors = {
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
        cardBg: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        skeleton: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        shimmer: isDarkMode
            ? 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.02) 100%)'
            : 'linear-gradient(90deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.02) 100%)',
    };

    const SkeletonBox: React.FC<{ width?: string; height?: string; borderRadius?: string; style?: React.CSSProperties }> = ({
        width = '100%', height = '16px', borderRadius = '6px', style
    }) => (
        <motion.div
            initial={{ backgroundPosition: '-200% 0' }}
            animate={{ backgroundPosition: '200% 0' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{
                width, height, borderRadius,
                background: colors.skeleton,
                backgroundImage: colors.shimmer,
                backgroundSize: '200% 100%',
                ...style,
            }}
        />
    );

    return (
        <div style={{
            height: '100vh',
            background: 'var(--bg-primary)',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            <div style={{ maxWidth: '1600px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
                {/* Header Skeleton */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 18px',
                    borderRadius: '14px',
                    background: 'var(--dashboard-surface)',
                    border: `1px solid ${'var(--border-color)'}`,
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <SkeletonBox width="36px" height="36px" borderRadius="10px" />
                        <SkeletonBox width="40px" height="40px" borderRadius="12px" />
                        <div>
                            <SkeletonBox width="120px" height="18px" style={{ marginBottom: '6px' }} />
                            <SkeletonBox width="160px" height="12px" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <SkeletonBox width="100px" height="28px" borderRadius="8px" />
                        <SkeletonBox width="70px" height="32px" borderRadius="8px" />
                    </div>
                </div>

                {/* Main Content - 3 Column Layout */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '280px 1fr 300px',
                    gap: '16px',
                    flex: 1,
                    minHeight: 0,
                }}>
                    {/* Left Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Timer Skeleton */}
                        <div style={{
                            padding: '14px',
                            borderRadius: '14px',
                            background: 'var(--dashboard-surface)',
                            border: `1px solid ${'var(--border-color)'}`,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <SkeletonBox width="28px" height="28px" borderRadius="8px" />
                                    <div>
                                        <SkeletonBox width="50px" height="12px" style={{ marginBottom: '4px' }} />
                                        <SkeletonBox width="70px" height="10px" />
                                    </div>
                                </div>
                                <SkeletonBox width="90px" height="24px" borderRadius="6px" />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                                <SkeletonBox width="110px" height="110px" borderRadius="50%" />
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <SkeletonBox width="100%" height="32px" borderRadius="8px" />
                                <SkeletonBox width="70px" height="32px" borderRadius="8px" />
                            </div>
                        </div>

                        {/* Stats Skeleton */}
                        <div style={{
                            padding: '14px',
                            borderRadius: '14px',
                            background: 'var(--dashboard-surface)',
                            border: `1px solid ${'var(--border-color)'}`,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <SkeletonBox width="28px" height="28px" borderRadius="8px" />
                                <SkeletonBox width="100px" height="12px" />
                            </div>
                            <SkeletonBox width="100%" height="5px" borderRadius="3px" style={{ marginBottom: '12px' }} />
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <SkeletonBox width="100%" height="60px" borderRadius="8px" />
                                <SkeletonBox width="100%" height="60px" borderRadius="8px" />
                                <SkeletonBox width="100%" height="60px" borderRadius="8px" />
                            </div>
                        </div>

                        {/* Weekly Trend Skeleton */}
                        <div style={{
                            padding: '14px',
                            borderRadius: '14px',
                            background: 'var(--dashboard-surface)',
                            border: `1px solid ${'var(--border-color)'}`,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <SkeletonBox width="28px" height="28px" borderRadius="8px" />
                                    <div>
                                        <SkeletonBox width="80px" height="12px" style={{ marginBottom: '4px' }} />
                                        <SkeletonBox width="60px" height="10px" />
                                    </div>
                                </div>
                                <SkeletonBox width="60px" height="22px" borderRadius="6px" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '60px', gap: '6px' }}>
                                {[30, 50, 20, 70, 40, 60, 45].map((h, i) => (
                                    <SkeletonBox key={i} width="100%" height={`${h}%`} borderRadius="4px" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Center Column - Resources */}
                    <div style={{
                        padding: '16px',
                        borderRadius: '14px',
                        background: 'var(--dashboard-surface)',
                        border: `1px solid ${'var(--border-color)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <SkeletonBox width="120px" height="16px" />
                            <SkeletonBox width="200px" height="32px" borderRadius="12px" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                            {[1, 2, 3, 4].map((i) => (
                                <SkeletonBox key={i} width="100%" height="90px" borderRadius="14px" />
                            ))}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Ambient Sounds Skeleton */}
                        <div style={{
                            padding: '16px',
                            borderRadius: '14px',
                            background: 'var(--dashboard-surface)',
                            border: `1px solid ${'var(--border-color)'}`,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                                <SkeletonBox width="32px" height="32px" borderRadius="10px" />
                                <div>
                                    <SkeletonBox width="100px" height="13px" style={{ marginBottom: '4px' }} />
                                    <SkeletonBox width="70px" height="11px" />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <SkeletonBox key={i} width="100%" height="56px" borderRadius="10px" />
                                ))}
                            </div>
                        </div>

                        {/* Quote Skeleton */}
                        <div style={{
                            padding: '20px',
                            borderRadius: '16px',
                            background: document.documentElement.classList.contains('dark') ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                            border: `1px solid rgba(59, 130, 246, 0.2)`,
                        }}>
                            <SkeletonBox width="24px" height="24px" borderRadius="4px" style={{ marginBottom: '16px' }} />
                            <SkeletonBox width="100%" height="14px" style={{ marginBottom: '8px' }} />
                            <SkeletonBox width="90%" height="14px" style={{ marginBottom: '12px' }} />
                            <SkeletonBox width="100px" height="12px" />
                        </div>

                        {/* Shortcuts Skeleton */}
                        <div style={{
                            padding: '14px 16px',
                            borderRadius: '14px',
                            background: 'var(--dashboard-surface)',
                            border: `1px solid ${'var(--border-color)'}`,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <SkeletonBox width="28px" height="28px" borderRadius="8px" />
                                <SkeletonBox width="70px" height="12px" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <SkeletonBox width="40px" height="20px" borderRadius="5px" />
                                        <SkeletonBox width="60px" height="10px" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// Resource Icon Component
const ResourceIcon: React.FC<{ type: Resource['type']; color: string; size?: number }> = ({ type, color, size = 20 }) => {
    const icons: Record<Resource['type'], React.ReactNode> = {
        link: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
        ),
        file: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
            </svg>
        ),
        image: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
            </svg>
        ),
        code: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
            </svg>
        ),
        note: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ),
        flashcard: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
            </svg>
        ),
    };
    return <div style={{ color }}>{icons[type]}</div>;
};


// Filter Tabs Component
const FilterTabs: React.FC<{
    activeFilter: FilterTab;
    setActiveFilter: (filter: FilterTab) => void;
    isDarkMode: boolean;
    colors: { accent: string; textSecondary: string };
    resourceCounts: Record<FilterTab, number>;
}> = ({ activeFilter, setActiveFilter, resourceCounts }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 5, width: 60 });

    const tabs: { id: FilterTab; label: string; icon: React.ReactNode }[] = [
        {
            id: 'all', label: 'All', icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
            )
        },
        {
            id: 'links', label: 'Links', icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
            )
        },
        {
            id: 'images', label: 'Images', icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                </svg>
            )
        },
        {
            id: 'files', label: 'Files', icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                </svg>
            )
        },
        {
            id: 'code', label: 'Code', icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                </svg>
            )
        },
        {
            id: 'notes', label: 'Notes', icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
            )
        },
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
            transition={{ delay: 0.2, duration: 0.4 }}
            style={{
                display: 'flex',
                gap: '4px',
                padding: '4px',
                borderRadius: '12px',
                background: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                position: 'relative',
            }}
        >
            <motion.div
                layoutId="activeFilterIndicator"
                style={{
                    position: 'absolute',
                    top: '4px',
                    bottom: '4px',
                    borderRadius: '8px',
                    background: document.documentElement.classList.contains('dark') ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                    border: `1px solid ${document.documentElement.classList.contains('dark') ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                    zIndex: 0,
                }}
                initial={false}
                animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
                transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8,
                }}
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
                    {tab.icon}
                    {tab.label}
                    {resourceCounts[tab.id] > 0 && (
                        <motion.span
                            key={`${tab.id}-${resourceCounts[tab.id]}`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                            style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '1px 5px',
                                borderRadius: '6px',
                                background: activeFilter === tab.id
                                    ? 'var(--accent-color)'
                                    : (document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                                color: activeFilter === tab.id ? '#fff' : 'var(--text-secondary)',
                            }}
                        >
                            {resourceCounts[tab.id]}
                        </motion.span>
                    )}
                </motion.button>
            ))}
        </motion.div>
    );
};


// Resource Card Component - Minimalistic Professional Design
const ResourceCard: React.FC<{
    resource: Resource;
    index: number;
}> = ({ resource, index }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showCopied, setShowCopied] = useState(false);
    const config = RESOURCE_TYPE_CONFIG[resource.type];

    // Handle card click based on resource type
    const handleClick = useCallback(() => {
        if (resource.type === 'link' && resource.url) {
            window.open(resource.url, '_blank', 'noopener,noreferrer');
        } else if (resource.type === 'file' && resource.url) {
            window.open(resource.url, '_blank', 'noopener,noreferrer');
        } else if (resource.type === 'code') {
            navigator.clipboard.writeText(resource.content);
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
        }
    }, [resource]);

    // Format date
    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
                delay: index * 0.03,
                layout: { type: 'spring', stiffness: 400, damping: 30 }
            }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={handleClick}
            style={{
                position: 'relative',
                borderRadius: '14px',
                background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
                border: `1px solid ${isHovered ? `${config.color}${document.documentElement.classList.contains('dark') ? '50' : '40'}` : 'var(--border-color)'}`,
                cursor: 'pointer',
                overflow: 'hidden',
                boxShadow: isHovered
                    ? document.documentElement.classList.contains('dark')
                        ? `0 8px 24px ${config.color}25, 0 4px 12px rgba(0,0,0,0.3)`
                        : `0 8px 24px ${config.color}15, 0 4px 8px rgba(0,0,0,0.04)`
                    : document.documentElement.classList.contains('dark')
                        ? '0 2px 4px rgba(0,0,0,0.2)'
                        : '0 1px 3px rgba(0,0,0,0.02)',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'border-color 0.2s ease, box-shadow 0.3s ease, transform 0.2s ease',
            }}
        >
            {/* Type indicator bar */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: config.bgGradient,
                opacity: isHovered ? 1 : 0.6,
                transition: 'opacity 0.2s ease',
            }} />

            <div style={{ padding: '16px 18px' }}>
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '12px' }}>
                    {/* Icon Container */}
                    <motion.div
                        animate={{ scale: isHovered ? 1.05 : 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: '12px',
                            background: config.bgGradient,
                            border: `1px solid ${config.color}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <ResourceIcon type={resource.type} color={config.color} size={20} />
                    </motion.div>

                    {/* Title and Meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: '4px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            letterSpacing: '-0.2px',
                        }}>
                            {resource.title}
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap',
                        }}>
                            {/* Type Badge */}
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: document.documentElement.classList.contains('dark') ? `${config.color}20` : `${config.color}12`,
                                color: config.color,
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px',
                            }}>
                                {config.label}
                            </span>
                            {/* Date */}
                            <span style={{
                                fontSize: '11px',
                                color: 'var(--text-muted)',
                            }}>
                                {formatDate(resource.createdAt)}
                            </span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: config.bgGradient,
                            border: `1px solid ${config.color}25`,
                            color: config.color,
                            fontSize: '11px',
                            fontWeight: 600,
                        }}
                    >
                        {showCopied ? (
                            <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Copied!
                            </>
                        ) : (
                            <>
                                {resource.type === 'link' && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                        <polyline points="15 3 21 3 21 9" />
                                        <line x1="10" y1="14" x2="21" y2="3" />
                                    </svg>
                                )}
                                {resource.type === 'file' && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                )}
                                {resource.type === 'code' && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                )}
                                {resource.type === 'note' && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                                {resource.type === 'flashcard' && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                )}
                                {resource.type === 'image' && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <polyline points="21 15 16 10 5 21" />
                                    </svg>
                                )}
                                {config.actionLabel}
                            </>
                        )}
                    </motion.div>
                </div>

                {/* Content Preview */}
                {resource.type === 'image' && (resource.previewUrl || resource.url) ? (
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        style={{
                            borderRadius: '10px',
                            overflow: 'hidden',
                            background: document.documentElement.classList.contains('dark') ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                            border: `1px solid ${document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
                        }}
                    >
                        <img
                            src={resource.previewUrl || resource.url}
                            alt={resource.title}
                            style={{
                                width: '100%',
                                height: '120px',
                                objectFit: 'cover',
                                display: 'block',
                            }}
                            onError={(e) => {
                                // Hide broken images
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </motion.div>
                ) : resource.type === 'code' ? (
                    <div style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: document.documentElement.classList.contains('dark') ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
                        border: `1px solid ${document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                        fontSize: '11px',
                        color: document.documentElement.classList.contains('dark') ? '#a5f3fc' : '#0f766e',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        maxHeight: '60px',
                        overflow: 'hidden',
                    }}>
                        {resource.content.substring(0, 120)}{resource.content.length > 120 ? '...' : ''}
                    </div>
                ) : (
                    <div style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}>
                        {resource.content.length > 100
                            ? resource.content.substring(0, 100) + '...'
                            : resource.content}
                    </div>
                )}

                {/* Footer - Shared By */}
                {resource.sharedBy && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: `1px solid ${document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}>
                            <div style={{
                                width: 20,
                                height: 20,
                                borderRadius: '6px',
                                background: `${config.color}15`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 500,
                                color: 'var(--text-muted)',
                            }}>
                                {resource.sharedBy}
                            </span>
                        </div>

                        {/* Language badge for code */}
                        {resource.type === 'code' && resource.language && (
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 500,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                color: 'var(--text-muted)',
                            }}>
                                {resource.language}
                            </span>
                        )}

                        {/* URL preview for links */}
                        {resource.type === 'link' && resource.url && (
                            <span style={{
                                fontSize: '10px',
                                color: 'var(--text-muted)',
                                maxWidth: '120px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}>
                                {(() => {
                                    try {
                                        return new URL(resource.url).hostname.replace('www.', '');
                                    } catch {
                                        return resource.url;
                                    }
                                })()}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};


export { FocusSkeleton, ResourceIcon, FilterTabs, ResourceCard };
