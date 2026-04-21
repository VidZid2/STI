/**
 * UsersSkeleton components (SkeletonPulse, UserCardSkeleton)
 * Extracted from UsersContent.tsx during Phase 8.4
 */
import React from 'react';
import { motion } from 'motion/react';

// Skeleton Shimmer Animation Component
const SkeletonPulse: React.FC<{
    width?: string;
    height?: string;
    borderRadius?: string;
    isDarkMode: boolean;
    style?: React.CSSProperties;
}> = ({ width = '100%', height = '16px', borderRadius = '6px', isDarkMode, style }) => {
    return (
        <motion.div
            animate={{
                backgroundPosition: ['200% 0', '-200% 0'],
            }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
            }}
            style={{
                width,
                height,
                borderRadius,
                background: isDarkMode
                    ? 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)'
                    : 'linear-gradient(90deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.03) 100%)',
                backgroundSize: '200% 100%',
                ...style,
            }}
        />
    );
};


// User Card Skeleton Component
const UserCardSkeleton: React.FC<{
    index: number;
    isDarkMode: boolean;
    colors: { cardBg: string; border: string };
}> = ({ index, isDarkMode, colors }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            style={{
                background: colors.cardBg,
                borderRadius: '16px',
                border: `1px solid ${colors.border}`,
                padding: '16px',
            }}
        >
            <div style={{ display: 'flex', gap: '12px' }}>
                {/* Avatar Skeleton */}
                <SkeletonPulse 
                    width="44px" 
                    height="44px" 
                    borderRadius="12px" 
                    isDarkMode={isDarkMode}
                    style={{ flexShrink: 0 }}
                />
                
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Name Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <SkeletonPulse 
                            width="55%" 
                            height="14px" 
                            borderRadius="4px" 
                            isDarkMode={isDarkMode} 
                        />
                    </div>
                    
                    {/* Email */}
                    <SkeletonPulse 
                        width="75%" 
                        height="12px" 
                        borderRadius="4px" 
                        isDarkMode={isDarkMode}
                        style={{ marginBottom: '12px' }}
                    />
                    
                    {/* Tags Row */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <SkeletonPulse 
                            width="60px" 
                            height="22px" 
                            borderRadius="6px" 
                            isDarkMode={isDarkMode} 
                        />
                        <SkeletonPulse 
                            width="70px" 
                            height="22px" 
                            borderRadius="6px" 
                            isDarkMode={isDarkMode} 
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Classmates Section Skeleton
// @ts-ignore - Reserved for future use
const _ClassmatesSkeleton: React.FC<{
    isDarkMode: boolean;
    colors: { cardBg: string; border: string };
}> = ({ isDarkMode, colors }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            style={{
                marginBottom: '24px',
                padding: '18px',
                borderRadius: '14px',
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
            }}
        >
            {/* Header Skeleton */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <SkeletonPulse width="38px" height="38px" borderRadius="10px" isDarkMode={isDarkMode} />
                <div style={{ flex: 1 }}>
                    <SkeletonPulse width="120px" height="15px" borderRadius="4px" isDarkMode={isDarkMode} style={{ marginBottom: '6px' }} />
                    <SkeletonPulse width="160px" height="12px" borderRadius="4px" isDarkMode={isDarkMode} />
                </div>
            </div>
            
            {/* Grid Skeleton */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '10px',
            }}>
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: `1px solid ${colors.border}`,
                        }}
                    >
                        <SkeletonPulse width="36px" height="36px" borderRadius="10px" isDarkMode={isDarkMode} />
                        <div style={{ flex: 1 }}>
                            <SkeletonPulse width="80%" height="12px" borderRadius="4px" isDarkMode={isDarkMode} style={{ marginBottom: '4px' }} />
                            <SkeletonPulse width="50%" height="10px" borderRadius="4px" isDarkMode={isDarkMode} />
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};


export { SkeletonPulse, UserCardSkeleton };
