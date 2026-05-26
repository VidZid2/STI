import React from 'react';
import { motion } from 'motion/react';

export const DashboardSuspenseFallback: React.FC = () => {
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
                <motion.div
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ width: 250, height: 32, borderRadius: '8px', background: 'var(--shimmer-bg)' }}
                />
                <motion.div
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                    style={{ width: 120, height: 32, borderRadius: '8px', background: 'var(--shimmer-bg)' }}
                />
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
                            <motion.div
                                animate={{ opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
                                style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--shimmer-bg)' }}
                            />
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <motion.div
                                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 + 0.1 }}
                                    style={{ width: '80%', height: 16, borderRadius: '4px', background: 'var(--shimmer-bg)' }}
                                />
                                <motion.div
                                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 + 0.2 }}
                                    style={{ width: '40%', height: 12, borderRadius: '4px', background: 'var(--shimmer-bg)' }}
                                />
                            </div>
                        </div>
                        <motion.div
                            animate={{ opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 + 0.3 }}
                            style={{ width: '100%', height: 60, borderRadius: '8px', background: 'var(--shimmer-bg)' }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
