import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export const DashboardSuspenseFallback: React.FC = () => {
    // Optimization: avoid running expensive framer-motion animations while intro curtain is covering the screen
    const [isIntroActive, setIsIntroActive] = useState(() => document.body.classList.contains('intro-active'));

    useEffect(() => {
        if (!isIntroActive) return;
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class' && !document.body.classList.contains('intro-active')) {
                    setIsIntroActive(false);
                }
            });
        });
        
        observer.observe(document.body, { attributes: true });
        return () => observer.disconnect();
    }, [isIntroActive]);

    const renderSkeletonBox = (width: string | number, height: string | number, borderRadius: string, delay: number = 0) => {
        const baseStyle = { width, height, borderRadius, background: 'var(--shimmer-bg)' };
        
        if (isIntroActive) {
            return <div style={{ ...baseStyle, opacity: 0.5 }} />;
        }
        
        return (
            <motion.div
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay }}
                style={baseStyle}
            />
        );
    };

    return (
        <div style={{
            flex: 1,
            height: '100%',
            minHeight: '400px',
            background: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            padding: '24px',
            overflow: 'hidden' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {renderSkeletonBox(250, 32, '8px', 0)}
                {renderSkeletonBox(120, 32, '8px', 0.2)}
            </div>

            {/* Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} style={{
                        background: 'var(--dashboard-surface)',
                        borderRadius: '16px',
                        border: `1px solid var(--border-color)`,
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            {renderSkeletonBox(48, 48, '12px', i * 0.1)}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {renderSkeletonBox('80%', 16, '4px', i * 0.1 + 0.1)}
                                {renderSkeletonBox('40%', 12, '4px', i * 0.1 + 0.2)}
                            </div>
                        </div>
                        {renderSkeletonBox('100%', 60, '8px', i * 0.1 + 0.3)}
                    </div>
                ))}
            </div>
        </div>
    );
};
