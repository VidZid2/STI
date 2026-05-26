/**
 * Daily Streak Modal - SaaS-style minimal celebration for daily check-ins
 * Clean, professional design with subtle animations
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { getStreakData, getStreakTier, type StreakData } from '../../services/studyTimeService';

interface DailyStreakModalProps {
    isOpen: boolean;
    onClose: () => void;
    streakData?: StreakData;
}

// Minimal streak icon — clean circle with number
const StreakBadge: React.FC<{ streak: number }> = ({ streak }) => {
    const getTierStyle = () => {
        if (streak >= 90) return {
            bg: 'linear-gradient(135deg, #e0f7ff, #b9f2ff)',
            border: 'rgba(125, 211, 252, 0.3)',
            emoji: '💎',
        };
        if (streak >= 30) return {
            bg: 'linear-gradient(135deg, #fef3c7, #fde68a)',
            border: 'rgba(251, 191, 36, 0.3)',
            emoji: '👑',
        };
        if (streak >= 10) return {
            bg: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
            border: 'rgba(148, 163, 184, 0.3)',
            emoji: '⚡',
        };
        return {
            bg: 'linear-gradient(135deg, #fed7aa, #fdba74)',
            border: 'rgba(251, 146, 60, 0.3)',
            emoji: '🔥',
        };
    };

    const style = getTierStyle();

    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
            style={{
                width: 56,
                height: 56,
                borderRadius: '16px',
                background: style.bg,
                border: `1px solid ${style.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
            }}
        >
            {style.emoji}
        </motion.div>
    );
};

// Tier label
const getTierLabel = (streak: number): string => {
    if (streak >= 90) return 'DIAMOND';
    if (streak >= 30) return 'GOLD';
    if (streak >= 10) return 'SILVER';
    return 'BRONZE';
};

const getTierColor = (streak: number): string => {
    if (streak >= 90) return '#0ea5e9';
    if (streak >= 30) return '#d97706';
    if (streak >= 10) return '#64748b';
    return '#ea580c';
};

export const DailyStreakModal: React.FC<DailyStreakModalProps> = ({
    isOpen,
    onClose,
    streakData: propStreakData,
}) => {
    const [streakData, setStreakData] = useState<StreakData | null>(propStreakData || null);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        if (isOpen && !propStreakData) {
            setStreakData(getStreakData());
        } else if (propStreakData) {
            setStreakData(propStreakData);
        }
    }, [isOpen, propStreakData]);

    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.body.classList.contains('dark-mode'));
        };
        checkDarkMode();
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Auto-close after 5 seconds
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Motivational message — tier-aware
    const getMessage = useCallback(() => {
        if (!streakData) return '';
        const s = streakData.currentStreak;
        if (s >= 90) return "Diamond-tier dedication. You're legendary.";
        if (s >= 30) return "Gold status unlocked. Absolutely elite.";
        if (s >= 10) return "Silver tier! Your consistency is paying off.";
        if (s >= 7) return "One full week! The habit is forming.";
        if (s >= 3) return "Momentum is building. Stay consistent.";
        if (s === 2) return "Day 2 — the habit starts here.";
        return "Welcome back. Every streak starts with day one.";
    }, [streakData]);

    if (!streakData) return null;

    const tier = getStreakTier(streakData.currentStreak);
    const tierLabel = getTierLabel(streakData.currentStreak);
    const tierColor = getTierColor(streakData.currentStreak);
    const daysToNextMilestone = streakData.currentStreak < 7 
        ? 7 - streakData.currentStreak
        : streakData.currentStreak < 10
        ? 10 - streakData.currentStreak
        : streakData.currentStreak < 30
        ? 30 - streakData.currentStreak
        : streakData.currentStreak < 90
        ? 90 - streakData.currentStreak
        : 0;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 99998,
                            pointerEvents: 'none',
                        }}
                    />

                    {/* Modal — bottom-right toast */}
                    <div
                        style={{
                            position: 'fixed',
                            bottom: '24px',
                            right: '24px',
                            zIndex: 99999,
                        }}
                    >
                        <motion.div
                            initial={{ y: '120%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '120%' }}
                            transition={{
                                y: {
                                    type: 'spring',
                                    stiffness: 120,
                                    damping: 18,
                                    mass: 1.6,
                                },
                            }}
                            style={{
                                width: '320px',
                                background: isDarkMode ? '#1e293b' : '#ffffff',
                                borderRadius: '16px',
                                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                                boxShadow: isDarkMode
                                    ? '0 16px 48px rgba(0, 0, 0, 0.5)'
                                    : '0 16px 48px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0,0,0,0.03)',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Content */}
                            <div style={{ 
                                position: 'relative', 
                                padding: '28px 24px 20px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '12px',
                            }}>
                                {/* Close button */}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                    style={{
                                        position: 'absolute',
                                        top: '14px',
                                        right: '14px',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: isDarkMode ? '#475569' : '#cbd5e1',
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </motion.button>

                                {/* Tier Badge */}
                                <StreakBadge streak={streakData.currentStreak} />

                                {/* Streak Count */}
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    style={{ textAlign: 'center' }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'baseline',
                                        justifyContent: 'center',
                                        gap: '4px',
                                    }}>
                                        <span style={{
                                            fontSize: '40px',
                                            fontWeight: 800,
                                            color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                            letterSpacing: '-2px',
                                            lineHeight: 1,
                                        }}>
                                            {streakData.currentStreak}
                                        </span>
                                        <span style={{
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            color: isDarkMode ? '#475569' : '#94a3b8',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1.5px',
                                        }}>
                                            {streakData.currentStreak === 1 ? 'day' : 'days'}
                                        </span>
                                    </div>

                                    {/* Tier Label */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.35 }}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            marginTop: '6px',
                                            padding: '3px 10px',
                                            borderRadius: '6px',
                                            background: isDarkMode
                                                ? `${tierColor}18`
                                                : `${tierColor}10`,
                                            border: `1px solid ${tierColor}25`,
                                        }}
                                    >
                                        <span style={{
                                            fontSize: '9px',
                                            fontWeight: 800,
                                            letterSpacing: '2px',
                                            color: tierColor,
                                        }}>
                                            {tierLabel} TIER
                                        </span>
                                    </motion.div>
                                </motion.div>

                                {/* Stats Row */}
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        gap: '6px',
                                    }}
                                >
                                    {[
                                        { label: 'XP Earned', value: `+${tier.xpBonus}`, color: '#3b82f6', icon: (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                                        )},
                                        { label: 'Best', value: `${streakData.bestStreak}d`, color: '#f59e0b', icon: (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
                                        )},
                                        ...(daysToNextMilestone > 0 ? [{ label: 'Next Tier', value: `${daysToNextMilestone}d`, color: '#10b981', icon: (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                        )}] : []),
                                    ].map((stat) => (
                                        <div
                                            key={stat.label}
                                            style={{
                                                flex: 1,
                                                padding: '10px 6px',
                                                borderRadius: '10px',
                                                background: `${stat.color}08`,
                                                textAlign: 'center',
                                            }}
                                        >
                                            <div style={{ color: stat.color, marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
                                            <div style={{
                                                fontSize: '15px',
                                                fontWeight: 700,
                                                color: stat.color,
                                                lineHeight: 1,
                                            }}>
                                                {stat.value}
                                            </div>
                                            <div style={{
                                                fontSize: '8px',
                                                fontWeight: 600,
                                                letterSpacing: '0.5px',
                                                textTransform: 'uppercase' as const,
                                                color: isDarkMode ? '#475569' : '#94a3b8',
                                                marginTop: '3px',
                                            }}>
                                                {stat.label}
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>

                                {/* Motivational Message */}
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    style={{
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: isDarkMode ? '#94a3b8' : '#64748b',
                                        textAlign: 'center',
                                        margin: 0,
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {getMessage()}
                                </motion.p>

                                {/* CTA Button — matches Goals "New Goal" style */}
                                <motion.button
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.55, duration: 0.3 }}
                                    onClick={onClose}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        padding: '10px 20px',
                                        borderRadius: '10px',
                                        border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                                        background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
                                        color: '#3b82f6',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        marginTop: '4px',
                                        transition: 'all 0.15s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.02)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.25)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                    onMouseDown={(e) => {
                                        e.currentTarget.style.transform = 'scale(0.98)';
                                    }}
                                    onMouseUp={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.02)';
                                    }}
                                >
                                    Continue
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </motion.button>
                            </div>

                            {/* Progress bar at bottom */}
                            <div style={{
                                height: '3px',
                                background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                            }}>
                                <motion.div
                                    initial={{ width: '100%' }}
                                    animate={{ width: '0%' }}
                                    transition={{ duration: 5, ease: 'linear' }}
                                    style={{
                                        height: '100%',
                                        background: tierColor,
                                        opacity: 0.6,
                                        borderRadius: '0 2px 2px 0',
                                    }}
                                />
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default DailyStreakModal;
