/**
 * GroupsSkeleton
 * Loading skeleton for GroupsContent.
 * Extracted from GroupsContent.tsx during Phase 8.2
 */
import React from 'react';
import { motion } from 'motion/react';

// Skeleton Loading Component
const GroupsSkeleton: React.FC<{ }> = ({ }) => {
    const colors = {
        cardBg: 'var(--text-muted)',
        border: 'var(--bg-hover)',
        skeleton: 'var(--bg-hover)',
        shimmer: 'var(--shimmer-bg)',
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
                backgroundImage: 'var(--shimmer-bg)',
                backgroundSize: '200% 100%',
                ...style,
            }}
        />
    );

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header Skeleton */}
            <div style={{ marginBottom: '28px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 22px',
                    borderRadius: '14px', background: 'var(--dashboard-surface)', border: `1px solid var(--border-color)`,
                }}>
                    <SkeletonBox width="46px" height="46px" borderRadius="12px" />
                    <div style={{ flex: 1 }}>
                        <SkeletonBox width="140px" height="24px" style={{ marginBottom: '8px' }} />
                        <SkeletonBox width="280px" height="14px" />
                    </div>
                </div>
            </div>

            {/* Cards Skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                            background: 'var(--dashboard-surface)', borderRadius: '16px',
                            border: `1px solid var(--border-color)`, padding: '16px',
                        }}
                    >
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                            <SkeletonBox width="44px" height="44px" borderRadius="12px" />
                            <div style={{ flex: 1 }}>
                                <SkeletonBox width="70%" height="16px" style={{ marginBottom: '6px' }} />
                                <SkeletonBox width="50%" height="12px" />
                            </div>
                        </div>
                        <SkeletonBox width="100%" height="40px" style={{ marginBottom: '12px' }} />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <SkeletonBox width="60px" height="24px" borderRadius="12px" />
                            <SkeletonBox width="80px" height="24px" borderRadius="12px" />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};


export { GroupsSkeleton };
