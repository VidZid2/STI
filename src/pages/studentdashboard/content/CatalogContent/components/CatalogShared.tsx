/**
 * CatalogShared - AnimatedNumber, CategoryIcon, CatalogSkeleton
 * Extracted from CatalogContent.tsx during Phase 8.7
 */
import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { useMotionValue, useSpring, useInView } from 'motion/react';

// Animated Number Component (inline to avoid import issues)
const AnimatedNumber: React.FC<{ value: number; delay?: number; className?: string }> = ({ value, delay = 0, className }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, { damping: 60, stiffness: 100 });
    const isInView = useInView(ref, { once: true, margin: '0px' });

    useEffect(() => {
        if (isInView) {
            const timer = setTimeout(() => motionValue.set(value), delay * 1000);
            return () => clearTimeout(timer);
        }
    }, [motionValue, isInView, delay, value]);

    useEffect(() => {
        return springValue.on('change', (latest) => {
            if (ref.current) {
                ref.current.textContent = Math.round(latest).toString();
            }
        });
    }, [springValue]);

    return <span ref={ref} className={className} style={{ display: 'inline-block', fontVariantNumeric: 'tabular-nums' }}>0</span>;
};


// Category Icon Component
const CategoryIcon: React.FC<{ category: string; size?: number }> = ({ category, size = 20 }) => {
    const icons: Record<string, React.ReactNode> = {
        major: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
            </svg>
        ),
        ge: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
        ),
        pe: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
            </svg>
        ),
        nstp: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
        all: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
    };
    return <>{icons[category] || icons.all}</>;
};



// Skeleton Shimmer Animation
const shimmerAnimation = {
    initial: { backgroundPosition: '-200% 0' },
    animate: { backgroundPosition: '200% 0' },
};


// Skeleton Loading Component
const CatalogSkeleton: React.FC<{ }> = ({ }) => {
    const colors = {
        cardBg: 'var(--bg-secondary)',
        border: 'var(--border-light)',
        skeleton: 'var(--border-light)',
        shimmer: 'var(--shimmer-bg)',
    };

    const SkeletonBox: React.FC<{ width?: string; height?: string; borderRadius?: string; style?: React.CSSProperties }> = ({ 
        width = '100%', height = '16px', borderRadius = '6px', style 
    }) => (
        <motion.div
            initial="initial"
            animate="animate"
            variants={shimmerAnimation}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{
                width,
                height,
                borderRadius,
                background: colors.skeleton,
                backgroundImage: 'var(--shimmer-bg)',
                backgroundSize: '200% 100%',
                ...style,
            }}
        />
    );

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
            {/* Header Skeleton */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{ marginBottom: '28px' }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '18px 22px',
                    borderRadius: '14px',
                    background: 'var(--dashboard-surface)',
                    border: `1px solid var(--border-color)`,
                }}>
                    {/* Icon Skeleton */}
                    <SkeletonBox width="46px" height="46px" borderRadius="12px" />
                    
                    {/* Title Skeleton */}
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <SkeletonBox width="140px" height="24px" borderRadius="6px" />
                            <SkeletonBox width="70px" height="20px" borderRadius="6px" />
                        </div>
                        <SkeletonBox width="280px" height="14px" borderRadius="4px" />
                    </div>
                    
                    {/* Stats Skeleton */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '10px 16px',
                                borderRadius: '10px',
                                background: 'var(--bg-hover)',
                                minWidth: '72px',
                            }}>
                                <SkeletonBox width="16px" height="16px" borderRadius="4px" style={{ marginBottom: '6px' }} />
                                <SkeletonBox width="24px" height="20px" borderRadius="4px" style={{ marginBottom: '4px' }} />
                                <SkeletonBox width="40px" height="10px" borderRadius="3px" />
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Search and Filter Skeleton */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}
            >
                <SkeletonBox width="300px" height="44px" borderRadius="12px" style={{ flex: 1, minWidth: '220px' }} />
                <div style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '12px', background: 'var(--bg-hover)' }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <SkeletonBox key={i} width="60px" height="32px" borderRadius="8px" />
                    ))}
                </div>
                <SkeletonBox width="140px" height="36px" borderRadius="10px" />
            </motion.div>

            {/* Course Cards Skeleton */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}
            >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                        style={{
                            background: 'var(--dashboard-surface)',
                            borderRadius: '16px',
                            border: `1px solid var(--border-color)`,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Image Skeleton */}
                        <SkeletonBox width="100%" height="140px" borderRadius="0" />
                        
                        {/* Content Skeleton */}
                        <div style={{ padding: '14px 16px' }}>
                            <SkeletonBox width="85%" height="16px" borderRadius="4px" style={{ marginBottom: '6px' }} />
                            <SkeletonBox width="60%" height="12px" borderRadius="3px" style={{ marginBottom: '14px' }} />
                            
                            {/* Instructor Skeleton */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                <SkeletonBox width="24px" height="24px" borderRadius="8px" />
                                <SkeletonBox width="120px" height="12px" borderRadius="3px" />
                            </div>
                            
                            {/* Stats Skeleton */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                paddingTop: '12px',
                                borderTop: `1px solid var(--border-color)`,
                            }}>
                                <SkeletonBox width="80px" height="12px" borderRadius="3px" />
                                <SkeletonBox width="40px" height="12px" borderRadius="3px" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};


export { AnimatedNumber, CategoryIcon, CatalogSkeleton };
