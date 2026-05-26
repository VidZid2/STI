/**
 * LoadingSkeleton - Loading state skeleton for GroupChat
 * Extracted from GroupChatPage.tsx for modularity
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export const LoadingSkeleton: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState(
        () => localStorage.getItem('darkModeEnabled') === 'true'
    );

    useEffect(() => {
        const syncTheme = () => {
            setIsDarkMode(
                localStorage.getItem('darkModeEnabled') === 'true' ||
                document.body.classList.contains('dark-mode')
            );
        };
        window.addEventListener('storage', syncTheme);
        window.addEventListener('themeChange', syncTheme);
        // Also watch body class mutations for in-tab theme changes
        const observer = new MutationObserver(syncTheme);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => {
            window.removeEventListener('storage', syncTheme);
            window.removeEventListener('themeChange', syncTheme);
            observer.disconnect();
        };
    }, []);
    const colors = {
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
        cardBg: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        shimmer: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    };

    const MESSAGE_SKELETONS = [
        { isOwn: false, width: '60%' },
        { isOwn: false, width: '45%' },
        { isOwn: true, width: '50%' },
        { isOwn: false, width: '70%' },
        { isOwn: true, width: '40%' },
        { isOwn: false, width: '55%' },
        { isOwn: true, width: '65%' },
    ];

    return (
        <div style={{
            height: '100vh',
            background: colors.bg,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            {/* Header Skeleton */}
            <div style={{
                background: colors.cardBg,
                borderBottom: `1px solid ${colors.border}`,
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
            }}>
                <motion.div
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ width: 36, height: 36, borderRadius: '10px', background: colors.shimmer }}
                />
                <motion.div
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                    style={{ width: 40, height: 40, borderRadius: '12px', background: colors.shimmer }}
                />
                <div style={{ flex: 1 }}>
                    <motion.div
                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                        style={{ width: 140, height: 16, borderRadius: '6px', background: colors.shimmer, marginBottom: '6px' }}
                    />
                    <motion.div
                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                        style={{ width: 100, height: 12, borderRadius: '4px', background: colors.shimmer }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 * i }}
                            style={{ width: 36, height: 36, borderRadius: '10px', background: colors.shimmer }}
                        />
                    ))}
                </div>
            </div>

            {/* Messages Area Skeleton */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'hidden' }}>
                {/* Date Separator */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <motion.div
                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ width: 80, height: 24, borderRadius: '12px', background: colors.shimmer }}
                    />
                </div>

                {/* Message Skeletons */}
                {MESSAGE_SKELETONS.map((msg, idx) => (
                    <div
                        key={idx}
                        style={{
                            display: 'flex',
                            justifyContent: msg.isOwn ? 'flex-end' : 'flex-start',
                            marginBottom: '16px',
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            gap: '10px',
                            maxWidth: '70%',
                            flexDirection: msg.isOwn ? 'row-reverse' : 'row',
                        }}>
                            {/* Avatar */}
                            <motion.div
                                animate={{ opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.1 }}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '10px',
                                    background: colors.shimmer,
                                    flexShrink: 0,
                                }}
                            />
                            {/* Message Bubble */}
                            <motion.div
                                animate={{ opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.1 + 0.05 }}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: msg.isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                    background: msg.isOwn
                                        ? (isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)')
                                        : colors.shimmer,
                                    minWidth: 120,
                                }}
                            >
                                {/* Name */}
                                <div style={{
                                    width: 80,
                                    height: 12,
                                    borderRadius: '4px',
                                    background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                                    marginBottom: '8px',
                                }} />
                                {/* Content Lines */}
                                <div style={{
                                    width: msg.width,
                                    height: 14,
                                    borderRadius: '4px',
                                    background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                    marginBottom: '4px',
                                }} />
                                <div style={{
                                    width: '70%',
                                    height: 14,
                                    borderRadius: '4px',
                                    background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                }} />
                            </motion.div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area Skeleton */}
            <div style={{
                background: colors.cardBg,
                borderTop: `1px solid ${colors.border}`,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
            }}>
                <div style={{
                    flex: 1,
                    background: colors.shimmer,
                    borderRadius: '16px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    {[1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
                            style={{ width: 32, height: 32, borderRadius: '8px', background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                        />
                    ))}
                    <motion.div
                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                        style={{ flex: 1, height: 20, borderRadius: '6px', background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
                    />
                    {[1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 + i * 0.1 }}
                            style={{ width: 32, height: 32, borderRadius: '8px', background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LoadingSkeleton;
