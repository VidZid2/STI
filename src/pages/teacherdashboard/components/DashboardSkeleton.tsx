/**
 * DashboardSkeleton Component
 * Phase 2: Extracted skeleton loading component for better organization
 */

import React from 'react';
import { motion } from 'motion/react';

const SkeletonBox: React.FC<{ width?: string; height?: string; className?: string }> = ({
    width = '100%', height = '16px', className = '',
}) => (
    <motion.div
        initial={{ backgroundPosition: '-200% 0' }}
        animate={{ backgroundPosition: '200% 0' }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className={`rounded-lg ${className}`}
        style={{
            width, height,
            background: 'var(--border-subtle)',
            backgroundImage: 'linear-gradient(90deg, var(--border-subtle) 0%, var(--border-strong) 50%, var(--border-subtle) 100%)',
            backgroundSize: '200% 100%',
        }}
    />
);

const DashboardSkeleton: React.FC = () => (
    <div className="p-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8">
            <SkeletonBox width="200px" height="32px" />
            <div className="mt-2"><SkeletonBox width="300px" height="16px" /></div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-5 mb-8">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-2xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                    <SkeletonBox width="40px" height="40px" className="rounded-xl" />
                    <div className="mt-4"><SkeletonBox width="60%" height="24px" /></div>
                    <div className="mt-2"><SkeletonBox width="40%" height="14px" /></div>
                </div>
            ))}
        </div>

        {/* Quick Actions + Activity */}
        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1.5fr' }}>
            {[
                { items: 4, height: '60px' },
                { items: 4, height: '56px' },
            ].map((panel, pi) => (
                <div key={pi} className="rounded-2xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-4 mb-5">
                        <SkeletonBox width="36px" height="36px" className="rounded-lg" />
                        <SkeletonBox width="120px" height="20px" />
                    </div>
                    {Array.from({ length: panel.items }).map((_, i) => (
                        <div key={i} className="mb-3">
                            <SkeletonBox height={panel.height} className="rounded-xl" />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    </div>
);

export default DashboardSkeleton;
