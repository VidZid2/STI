/**
 * GroupsSkeleton
 * Loading skeleton for GroupsContent.
 * Extracted from GroupsContent.tsx during Phase 8.2
 */
import React from 'react';
import { motion } from 'motion/react';

// Skeleton Loading Component
const GroupsSkeleton: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    const colors = {
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
        <div
            style={{
                width, height, borderRadius,
                background: colors.skeleton,
                position: 'relative',
                overflow: 'hidden',
                ...style,
            }}
        >
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                style={{
                    position: 'absolute',
                    top: 0, bottom: 0, left: 0, right: 0,
                    backgroundImage: colors.shimmer,
                }}
            />
        </div>
    );

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header Skeleton */}
            <div style={{ marginBottom: '28px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 22px',
                    borderRadius: '14px', background: colors.cardBg, border: `1px solid ${colors.border}`,
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                            background: colors.cardBg, borderRadius: '16px',
                            border: `1px solid ${colors.border}`, padding: '16px',
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
