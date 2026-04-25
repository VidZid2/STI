/**
 * LoadingSkeleton - Loading state skeleton for GroupChat
 * Extracted from GroupChatPage.tsx for modularity
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export const LoadingSkeleton: React.FC = () => {
    const [ setIsDarkMode] = useState(
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
    const = {
        bg: 'var(--bg-primary)',
        cardBg: 'var(--bg-primary)',
        border: 'rgba(255,255,255,0.08)',
        shimmer: 'var(--bg-hover)' };

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
            background: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden' }}>
            {/* Header Skeleton */}
            <div style={{
                background: 'var(--dashboard-surface)',
                borderBottom: `1px solid var(--border-color)`,
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px' }}>
                <motion.div
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--shimmer-bg)' }}
                />
                <motion.div
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                    style={{ width: 40, height: 40, borderRadius: '12px', background: 'var(--shimmer-bg)' }}
                />
                <div style={{ flex: 1 }}>
                    <motion.div
                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                        style={{ width: 140, height: 16, borderRadius: '6px', background: 'var(--shimmer-bg)', marginBottom: '6px' }}
                    />
                    <motion.div
                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                        style={{ width: 100, height: 12, borderRadius: '4px', background: 'var(--shimmer-bg)' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 * i }}
                            style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--shimmer-bg)' }}
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
                        style={{ width: 80, height: 24, borderRadius: '12px', background: 'var(--shimmer-bg)' }}
                    />
                </div>

                {/* Message Skeletons */}
                {MESSAGE_SKELETONS.map((msg, idx) => (
                    <div
                        key={idx}
                        style={{
                            display: 'flex',
                            justifyContent: msg.isOwn ? 'flex-end' : 'flex-start',
                            marginBottom: '16px' }}
                    >
                        <div style={{
                            display: 'flex',
                            gap: '10px',
                            maxWidth: '70%',
                            flexDirection: msg.isOwn ? 'row-reverse' : 'row' }}>
                            {/* Avatar */}
                            <motion.div
                                animate={{ opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.1 }}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '10px',
                                    background: 'var(--shimmer-bg)',
                                    flexShrink: 0 }}
                            />
                            {/* Message Bubble */}
                            <motion.div
                                animate={{ opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.1 + 0.05 }}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: msg.isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                    background: msg.isOwn
                                        ? 'rgba(59, 130, 246, 0.2)'
                                        : 'var(--shimmer-bg)',
                                    minWidth: 120 }}
                            >
                                {/* Name */}
                                <div style={{
                                    width: 80,
                                    height: 12,
                                    borderRadius: '4px',
                                    background: 'rgba(255,255,255,0.1)',
                                    marginBottom: '8px' }} />
                                {/* Content Lines */}
                                <div style={{
                                    width: msg.width,
                                    height: 14,
                                    borderRadius: '4px',
                                    background: 'rgba(255,255,255,0.08)',
                                    marginBottom: '4px' }} />
                                <div style={{
                                    width: '70%',
                                    height: 14,
                                    borderRadius: '4px',
                                    background: 'var(--bg-hover)' }} />
                            </motion.div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area Skeleton */}
            <div style={{
                background: 'var(--dashboard-surface)',
                borderTop: `1px solid var(--border-color)`,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px' }}>
                <div style={{
                    flex: 1,
                    background: 'var(--shimmer-bg)',
                    borderRadius: '16px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px' }}>
                    {[1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
                            style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--bg-hover)' }}
                        />
                    ))}
                    <motion.div
                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                        style={{ flex: 1, height: 20, borderRadius: '6px', background: 'var(--bg-hover)' }}
                    />
                    {[1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 + i * 0.1 }}
                            style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--bg-hover)' }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LoadingSkeleton;
