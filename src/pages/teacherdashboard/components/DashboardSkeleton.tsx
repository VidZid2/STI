/**
 * DashboardSkeleton Component
 * Phase 2: Extracted skeleton loading component for better organization
 */

import React from 'react';
import { motion } from 'motion/react';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';

// ============================================
// SKELETON BOX SUB-COMPONENT
// ============================================
interface SkeletonBoxProps {
    width?: string;
    height?: string;
    borderRadius?: string;
}

const SkeletonBox: React.FC<SkeletonBoxProps> = ({ 
    width = '100%', 
    height = '16px', 
    borderRadius = BORDER_RADIUS.md 
}) => (
    <motion.div
        initial={{ backgroundPosition: '-200% 0' }}
        animate={{ backgroundPosition: '200% 0' }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        style={{
            width, 
            height, 
            borderRadius,
            background: COLORS.borderLight,
            backgroundImage: `linear-gradient(90deg, ${COLORS.borderLight} 0%, ${COLORS.border} 50%, ${COLORS.borderLight} 100%)`,
            backgroundSize: '200% 100%',
        }}
    />
);

// ============================================
// MAIN SKELETON COMPONENT
// ============================================
const DashboardSkeleton: React.FC = () => {
    return (
        <div style={{ padding: SPACING.xxxl, maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header Skeleton */}
            <div style={{ marginBottom: SPACING.xxxl }}>
                <SkeletonBox width="200px" height="32px" />
                <div style={{ marginTop: SPACING.sm }}>
                    <SkeletonBox width="300px" height="16px" />
                </div>
            </div>
            
            {/* Stats Grid Skeleton */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: SPACING.xl, 
                marginBottom: SPACING.xxxl 
            }}>
                {[1, 2, 3, 4].map(i => (
                    <div 
                        key={i} 
                        style={{ 
                            background: COLORS.surface, 
                            borderRadius: BORDER_RADIUS.xxxl, 
                            padding: SPACING.xxl, 
                            border: `1px solid ${COLORS.border}` 
                        }}
                    >
                        <SkeletonBox width="40px" height="40px" borderRadius={BORDER_RADIUS.xl} />
                        <div style={{ marginTop: SPACING.lg }}>
                            <SkeletonBox width="60%" height="24px" />
                        </div>
                        <div style={{ marginTop: SPACING.sm }}>
                            <SkeletonBox width="40%" height="14px" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions & Activity Skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: SPACING.xxl }}>
                {/* Quick Actions Skeleton */}
                <div style={{ 
                    background: COLORS.surface, 
                    borderRadius: BORDER_RADIUS.full, 
                    padding: SPACING.xxl, 
                    border: `1px solid ${COLORS.border}` 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg, marginBottom: SPACING.xl }}>
                        <SkeletonBox width="36px" height="36px" borderRadius={BORDER_RADIUS.lg} />
                        <SkeletonBox width="120px" height="20px" />
                    </div>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ marginBottom: SPACING.md }}>
                            <SkeletonBox width="100%" height="60px" borderRadius={BORDER_RADIUS.xxl} />
                        </div>
                    ))}
                </div>

                {/* Activity Skeleton */}
                <div style={{ 
                    background: COLORS.surface, 
                    borderRadius: BORDER_RADIUS.full, 
                    padding: SPACING.xxl, 
                    border: `1px solid ${COLORS.border}` 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg, marginBottom: SPACING.xl }}>
                        <SkeletonBox width="36px" height="36px" borderRadius={BORDER_RADIUS.lg} />
                        <SkeletonBox width="140px" height="20px" />
                    </div>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ marginBottom: SPACING.md }}>
                            <SkeletonBox width="100%" height="56px" borderRadius={BORDER_RADIUS.xl} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
