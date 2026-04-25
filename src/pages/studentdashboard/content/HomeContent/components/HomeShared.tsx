/**
 * HomeShared - ProgressRing, WhatsNewButton, ConfettiBurst, RoleBadge, HomeSkeleton
 * Shared UI components for HomeContent.
 * Extracted from HomeContent.tsx during Phase 8.8
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

// Circular Progress Ring Component
const ProgressRing: React.FC<{ progress: number; size?: number; strokeWidth?: number }> = ({ 
    progress, 
    size = 72, 
    strokeWidth = 4 
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;
    
    return (
        <svg width={size} height={size} className="progress-ring">
            <circle
                className="progress-ring-bg"
                strokeWidth={strokeWidth}
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
            />
            <motion.circle
                className="progress-ring-fill"
                strokeWidth={strokeWidth}
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.2, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                    strokeDasharray: circumference,
                    transform: 'rotate(-90deg)',
                    transformOrigin: '50% 50%'
                }}
            />
        </svg>
    );
};


// What's New Button with Portal Tooltip
const WhatsNewButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            setTooltipPos({
                top: rect.bottom + 8,
                left: rect.left + rect.width / 2 });
        }
        setIsHovered(true);
    };

    return (
        <div ref={wrapperRef} style={{ display: 'inline-block' }}>
            <motion.button
                className="btn-minimal"
                onClick={onClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setIsHovered(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                    background: '#3b82f6',
                    color: '#fbbf24',
                    border: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px' }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                What's New
            </motion.button>
            {createPortal(
                <AnimatePresence>
                    {isHovered && (
                        <div
                            style={{
                                position: 'fixed',
                                top: tooltipPos.top,
                                left: tooltipPos.left,
                                transform: 'translateX(-50%)',
                                zIndex: 9999 }}
                        >
                            <motion.div
                                className="whats-new-tooltip-portal"
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center' }}
                            >
                                <div className="whats-new-tooltip-arrow" />
                                <div className="whats-new-tooltip-content">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="16" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                    <span className="whats-new-tooltip-title">Latest Updates</span>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};


// Confetti Burst Component for Milestone Celebrations
const ConfettiBurst: React.FC<{ color: string; isActive: boolean }> = ({ color, isActive }) => {
    const particles = Array.from({ length: 8 }, (_, i) => i);
    const = [color, '#f59e0b', '#10b981', '#3b82f6', '#ec4899'];
    
    return (
        <AnimatePresence>
            {isActive && (
                <motion.div 
                    className="confetti-burst"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {particles.map((i) => {
                        const angle = (i / particles.length) * 360;
                        const distance = 20 + Math.random() * 15;
                        const size = 4 + Math.random() * 3;
                        const particleColor = [i % .length];
                        
                        return (
                            <motion.div
                                key={i}
                                className="confetti-particle"
                                style={{
                                    width: size,
                                    height: size,
                                    backgroundColor: particleColor,
                                    borderRadius: Math.random() > 0.5 ? '50%' : '2px' }}
                                initial={{ 
                                    x: 0, 
                                    y: 0, 
                                    scale: 0,
                                    rotate: 0,
                                    opacity: 1 
                                }}
                                animate={{ 
                                    x: Math.cos(angle * Math.PI / 180) * distance,
                                    y: Math.sin(angle * Math.PI / 180) * distance,
                                    scale: [0, 1.2, 0.8],
                                    rotate: Math.random() * 360,
                                    opacity: [1, 1, 0]
                                }}
                                transition={{ 
                                    duration: 0.6,
                                    ease: [0.25, 0.46, 0.45, 0.94],
                                    delay: i * 0.02
                                }}
                            />
                        );
                    })}
                </motion.div>
            )}
        </AnimatePresence>
    );
};


// Minimalistic Role Badges Component
const ROLES = [
    { name: 'Tester', color: '#a855f7' },
    { name: 'Admin', color: '#ef4444' },
    { name: 'Teacher', color: '#22c55e' },
    { name: 'Student', color: '#3b82f6' },
] as const;

const RoleBadge: React.FC = () => {
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}
        >
            {ROLES.map((role, index) => (
                <motion.span
                    key={role.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                        delay: 0.5 + index * 0.06, 
                        duration: 0.25,
                        ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    onHoverStart={() => setHoveredIndex(index)}
                    onHoverEnd={() => setHoveredIndex(null)}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 10px',
                        fontSize: '11px',
                        fontWeight: 500,
                        letterSpacing: '0.01em',
                        borderRadius: '6px',
                        backgroundColor: hoveredIndex === index ? `${role.color}15` : 'transparent',
                        color: role.color,
                        cursor: 'default',
                        transition: 'background-color 0.2s ease, transform 0.2s ease',
                        transform: hoveredIndex === index ? 'translateY(-1px)' : 'translateY(0)' }}
                >
                    <span
                        style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: role.color,
                            opacity: hoveredIndex === index ? 1 : 0.7,
                            transition: 'opacity 0.2s ease' }}
                    />
                    {role.name}
                </motion.span>
            ))}
        </motion.div>
    );
};


// Skeleton Loading Component with dark mode support
const HomeSkeleton: React.FC = () => {
    const [isDark, setIsDark] = useState(() => 
        typeof document !== 'undefined' && document.body.classList.contains('dark-mode')
    );
    
    useEffect(() => {
        const checkDarkMode = () => setIsDark(document.body.classList.contains('dark-mode'));
        checkDarkMode();
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);
    
    // Dark mode aware const cardBg = isDark ? 'rgba(30, 41, 59, 0.8)' : '#f4f4f5';
    const shimmerBg = isDark ? 'rgba(51, 65, 85, 0.6)' : undefined;
    const shimmerClass = isDark ? '' : 'bg-zinc-200';
    const containerClass = isDark ? '' : 'bg-zinc-100';
    
    return (
        <div className="home-content">
            {/* Welcome Hero Skeleton */}
            <motion.section className="welcome-hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="welcome-cards-row">
                    <motion.div 
                        className="welcome-main-card"
                        style={{ background: cardBg, minHeight: '200px' }}
                    >
                        <div className="welcome-content">
                            <div className="welcome-left">
                                <motion.div 
                                    className={`w-[72px] h-[72px] rounded-full ${shimmerClass}`}
                                    style={isDark ? { backgroundColor: shimmerBg } : undefined}
                                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                                <div className="welcome-text-group-minimal" style={{ marginLeft: '16px' }}>
                                    <motion.div className={`h-4 w-24 ${shimmerClass} rounded mb-2`} style={isDark ? { backgroundColor: shimmerBg } : undefined} animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                                    <motion.div className={`h-8 w-48 ${shimmerClass} rounded mb-3`} style={isDark ? { backgroundColor: shimmerBg } : undefined} animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }} />
                                    <div className="flex gap-2 mb-3">
                                        {[0, 1, 2, 3].map(i => (
                                            <motion.div key={i} className={`h-5 w-16 ${shimmerClass} rounded-full`} style={isDark ? { backgroundColor: shimmerBg } : undefined} animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }} />
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        {[0, 1, 2, 3].map(i => (
                                            <motion.div key={i} className={`h-8 w-24 ${shimmerClass} rounded-lg`} style={isDark ? { backgroundColor: shimmerBg } : undefined} animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div className="news-slideshow" style={{ background: cardBg, minHeight: '200px', borderRadius: '16px' }}>
                        <div className="p-4 space-y-3">
                            <motion.div className={`h-4 w-24 ${shimmerClass} rounded`} style={isDark ? { backgroundColor: shimmerBg } : undefined} animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                            <motion.div className={`h-32 w-full ${shimmerClass} rounded-lg`} style={isDark ? { backgroundColor: shimmerBg } : undefined} animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }} />
                            <motion.div className={`h-4 w-3/4 ${shimmerClass} rounded`} style={isDark ? { backgroundColor: shimmerBg } : undefined} animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} />
                        </div>
                    </motion.div>
                </div>
                {/* Stats Row Skeleton */}
                <div className="stats-row-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '16px' }}>
                    {[0, 1, 2, 3].map(i => (
                        <motion.div key={i} className={`${containerClass} rounded-2xl p-5 space-y-4`} style={isDark ? { backgroundColor: cardBg } : undefined} animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}>
                            <div className="flex justify-between">
                                <motion.div className={`w-10 h-10 ${shimmerClass} rounded-xl`} style={isDark ? { backgroundColor: shimmerBg } : undefined} />
                                <motion.div className={`w-16 h-5 ${shimmerClass} rounded-full`} style={isDark ? { backgroundColor: shimmerBg } : undefined} />
                            </div>
                            <motion.div className={`h-8 w-20 ${shimmerClass} rounded`} style={isDark ? { backgroundColor: shimmerBg } : undefined} />
                            <div className="flex gap-4">
                                <motion.div className={`h-12 w-16 ${shimmerClass} rounded-lg`} style={isDark ? { backgroundColor: shimmerBg } : undefined} />
                                <motion.div className={`h-12 w-16 ${shimmerClass} rounded-lg`} style={isDark ? { backgroundColor: shimmerBg } : undefined} />
                            </div>
                            <motion.div className={`h-2 w-full ${shimmerClass} rounded-full`} style={isDark ? { backgroundColor: shimmerBg } : undefined} />
                        </motion.div>
                    ))}
                </div>
            </motion.section>
            {/* Quick Access Skeleton */}
            <motion.section className="quick-access-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <div className="flex items-center gap-2 mb-4">
                    <motion.div className={`h-5 w-28 ${shimmerClass} rounded`} style={isDark ? { backgroundColor: shimmerBg } : undefined} animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    <motion.div className={`h-5 w-20 ${containerClass} rounded-full`} style={isDark ? { backgroundColor: cardBg } : undefined} animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                </div>
                <div className="grid grid-cols-5 gap-3">
                    {[...Array(10)].map((_, i) => (
                        <motion.div key={i} className={`${containerClass} rounded-xl p-4 space-y-3`} style={isDark ? { backgroundColor: cardBg } : undefined} animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }}>
                            <motion.div className={`w-10 h-10 ${shimmerClass} rounded-xl`} style={isDark ? { backgroundColor: shimmerBg } : undefined} />
                            <motion.div className={`h-3 w-20 ${shimmerClass} rounded`} style={isDark ? { backgroundColor: shimmerBg } : undefined} />
                            <motion.div className={`h-2 w-16 ${shimmerClass} rounded`} style={isDark ? { backgroundColor: shimmerBg } : undefined} />
                        </motion.div>
                    ))}
                </div>
            </motion.section>
            {/* Courses Skeleton */}
            <motion.section className="courses-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <motion.div className={`h-6 w-32 ${shimmerClass} rounded`} style={isDark ? { backgroundColor: shimmerBg } : undefined} animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                        <motion.div className={`h-5 w-20 ${containerClass} rounded-full`} style={isDark ? { backgroundColor: cardBg } : undefined} animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    </div>
                    <div className="flex gap-2">
                        <motion.div className={`h-9 w-9 ${shimmerClass} rounded-lg`} style={isDark ? { backgroundColor: shimmerBg } : undefined} animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                        <motion.div className={`h-9 w-9 ${shimmerClass} rounded-lg`} style={isDark ? { backgroundColor: shimmerBg } : undefined} animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    </div>
                </div>
                <div className="flex gap-4 overflow-hidden">
                    {[0, 1, 2, 3].map(i => (
                        <motion.div key={i} className={`flex-shrink-0 w-[280px] ${containerClass} rounded-2xl overflow-hidden`} style={isDark ? { backgroundColor: cardBg } : undefined} animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}>
                            <motion.div className={`h-40 ${shimmerClass}`} style={isDark ? { backgroundColor: shimmerBg } : undefined} />
                            <div className="p-4 space-y-3">
                                <motion.div className={`h-4 w-3/4 ${shimmerClass} rounded`} style={isDark ? { backgroundColor: shimmerBg } : undefined} />
                                <motion.div className={`h-3 w-1/2 ${shimmerClass} rounded`} style={isDark ? { backgroundColor: shimmerBg } : undefined} />
                                <div className="flex gap-2 mt-4">
                                    <motion.div className={`h-8 w-20 ${shimmerClass} rounded-lg`} style={isDark ? { backgroundColor: shimmerBg } : undefined} />
                                    <motion.div className={`h-8 w-16 ${shimmerClass} rounded-lg`} style={isDark ? { backgroundColor: shimmerBg } : undefined} />
                                </div>
                                <motion.div className={`h-2 w-full ${shimmerClass} rounded-full mt-4`} style={isDark ? { backgroundColor: shimmerBg } : undefined} />
                                <motion.div className={`h-10 w-full ${shimmerClass} rounded-xl mt-2`} style={isDark ? { backgroundColor: shimmerBg } : undefined} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.section>
        </div>
    );
};


export { ProgressRing, WhatsNewButton, ConfettiBurst, RoleBadge, HomeSkeleton };
