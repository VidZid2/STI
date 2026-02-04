/**
 * Daily Streak Modal - Playful celebration modal for daily check-ins
 * Shows animated flame and streak count when user logs in for the day
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { getStreakData, getStreakTier, type StreakData } from '../../services/studyTimeService';

interface DailyStreakModalProps {
    isOpen: boolean;
    onClose: () => void;
    streakData?: StreakData;
}

// Animated Flame SVG Component
const AnimatedFlame: React.FC<{ size?: number; delay?: number }> = ({ size = 120, delay = 0 }) => {
    return (
        <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 15,
                delay: delay + 0.2 
            }}
        >
            <motion.svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                animate={{
                    scale: [1, 1.05, 1],
                    y: [0, -3, 0],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            >
                {/* Outer glow */}
                <defs>
                    <filter id="flame-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <linearGradient id="flame-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="50%" stopColor="#fb923c" />
                        <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                    <linearGradient id="flame-inner-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#ea580c" />
                        <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                </defs>
                
                {/* Main flame body */}
                <motion.path
                    d="M50 10 
                       C65 25, 80 35, 80 55 
                       C80 75, 65 90, 50 90 
                       C35 90, 20 75, 20 55 
                       C20 35, 35 25, 50 10Z"
                    fill="url(#flame-gradient)"
                    filter="url(#flame-glow)"
                    animate={{
                        d: [
                            "M50 10 C65 25, 80 35, 80 55 C80 75, 65 90, 50 90 C35 90, 20 75, 20 55 C20 35, 35 25, 50 10Z",
                            "M50 8 C68 22, 82 32, 82 55 C82 78, 65 92, 50 92 C35 92, 18 78, 18 55 C18 32, 32 22, 50 8Z",
                            "M50 10 C65 25, 80 35, 80 55 C80 75, 65 90, 50 90 C35 90, 20 75, 20 55 C20 35, 35 25, 50 10Z",
                        ],
                    }}
                    transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
                
                {/* Inner flame */}
                <motion.path
                    d="M50 30 
                       C58 40, 65 48, 65 60 
                       C65 72, 58 80, 50 80 
                       C42 80, 35 72, 35 60 
                       C35 48, 42 40, 50 30Z"
                    fill="url(#flame-inner-gradient)"
                    animate={{
                        d: [
                            "M50 30 C58 40, 65 48, 65 60 C65 72, 58 80, 50 80 C42 80, 35 72, 35 60 C35 48, 42 40, 50 30Z",
                            "M50 28 C60 38, 67 46, 67 60 C67 74, 58 82, 50 82 C42 82, 33 74, 33 60 C33 46, 40 38, 50 28Z",
                            "M50 30 C58 40, 65 48, 65 60 C65 72, 58 80, 50 80 C42 80, 35 72, 35 60 C35 48, 42 40, 50 30Z",
                        ],
                        opacity: [0.9, 1, 0.9],
                    }}
                    transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 0.1,
                    }}
                />
                
                {/* Core flame (brightest) */}
                <motion.ellipse
                    cx="50"
                    cy="65"
                    rx="10"
                    ry="15"
                    fill="#fef3c7"
                    animate={{
                        ry: [15, 18, 15],
                        opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            </motion.svg>
        </motion.div>
    );
};

// Sparkle particle component
const Sparkle: React.FC<{ delay: number; x: number; y: number }> = ({ delay, x, y }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0, x, y }}
        animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            y: [y, y - 30],
        }}
        transition={{
            duration: 1.5,
            delay,
            repeat: Infinity,
            repeatDelay: 1,
        }}
        style={{
            position: 'absolute',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
            boxShadow: '0 0 8px rgba(251, 191, 36, 0.6)',
        }}
    />
);

// Progress dots component
const ProgressDots: React.FC<{ currentStreak: number; maxDots?: number }> = ({ 
    currentStreak, 
    maxDots = 7 
}) => {
    const activeDots = Math.min(currentStreak, maxDots);
    
    return (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {Array.from({ length: maxDots }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 15,
                        delay: 0.5 + i * 0.08,
                    }}
                    style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: i < activeDots 
                            ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                            : 'rgba(148, 163, 184, 0.3)',
                        boxShadow: i < activeDots 
                            ? '0 2px 8px rgba(59, 130, 246, 0.4)'
                            : 'none',
                    }}
                />
            ))}
        </div>
    );
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

    if (!streakData) return null;

    const tier = getStreakTier(streakData.currentStreak);
    const streakLabel = streakData.currentStreak === 1 
        ? 'Day 1 streak!' 
        : `${streakData.currentStreak} day streak!`;

    const colors = {
        bg: isDarkMode ? '#0f172a' : '#ffffff',
        cardBg: isDarkMode ? '#1e293b' : '#ffffff',
        textPrimary: isDarkMode ? '#f1f5f9' : '#1e293b',
        textSecondary: isDarkMode ? '#94a3b8' : '#64748b',
        border: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(8px)',
                            zIndex: 99998,
                        }}
                    />

                    {/* Modal */}
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 99999,
                            pointerEvents: 'none',
                            padding: '20px',
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{
                                type: 'spring',
                                stiffness: 400,
                                damping: 25,
                            }}
                            style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: '380px',
                                background: colors.cardBg,
                                borderRadius: '24px',
                                boxShadow: isDarkMode
                                    ? '0 24px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)'
                                    : '0 24px 48px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                                overflow: 'hidden',
                                pointerEvents: 'auto',
                            }}
                        >
                            {/* Gradient background accent */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '180px',
                                    background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.15) 0%, rgba(249, 115, 22, 0.08) 50%, transparent 100%)',
                                    pointerEvents: 'none',
                                }}
                            />

                            {/* Sparkles */}
                            <Sparkle delay={0.3} x={60} y={80} />
                            <Sparkle delay={0.6} x={280} y={90} />
                            <Sparkle delay={0.9} x={100} y={120} />
                            <Sparkle delay={1.2} x={250} y={100} />

                            {/* Content */}
                            <div style={{ 
                                position: 'relative', 
                                padding: '32px 24px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '20px',
                            }}>
                                {/* Close button */}
                                <motion.button
                                    whileHover={{ scale: 1.1, background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onClose}
                                    style={{
                                        position: 'absolute',
                                        top: '16px',
                                        right: '16px',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: colors.textSecondary,
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </motion.button>

                                {/* Animated Flame */}
                                <AnimatedFlame size={120} />

                                {/* Streak Count */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'baseline',
                                        gap: '8px',
                                    }}
                                >
                                    <motion.span
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        style={{
                                            fontSize: '56px',
                                            fontWeight: 800,
                                            background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            letterSpacing: '-2px',
                                        }}
                                    >
                                        {streakData.currentStreak}
                                    </motion.span>
                                    <span style={{
                                        fontSize: '20px',
                                        fontWeight: 600,
                                        color: '#f97316',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                    }}>
                                        DAY
                                    </span>
                                </motion.div>

                                {/* Progress Dots */}
                                <ProgressDots currentStreak={streakData.currentStreak} />

                                {/* Streak Label */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    style={{
                                        fontSize: '22px',
                                        fontWeight: 700,
                                        color: '#3b82f6',
                                        textAlign: 'center',
                                    }}
                                >
                                    {streakLabel}
                                </motion.div>

                                {/* XP Bonus */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5, type: 'spring' }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 20px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.06) 100%)',
                                        border: '1px solid rgba(16, 185, 129, 0.2)',
                                    }}
                                >
                                    <motion.span
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                                        style={{ fontSize: '18px' }}
                                    >
                                        ⭐
                                    </motion.span>
                                    <span style={{
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#10b981',
                                    }}>
                                        +{tier.xpBonus} XP Bonus
                                    </span>
                                </motion.div>

                                {/* Motivational message */}
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    style={{
                                        fontSize: '14px',
                                        color: colors.textSecondary,
                                        textAlign: 'center',
                                        margin: 0,
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {streakData.currentStreak === 1 
                                        ? "Great start! Come back tomorrow to keep it going! 🚀"
                                        : streakData.currentStreak < 7
                                        ? `${7 - streakData.currentStreak} more days to unlock weekly bonus! 🎯`
                                        : "You're on fire! Keep the momentum going! 🔥"}
                                </motion.p>

                                {/* Continue Button */}
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 }}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onClose}
                                    style={{
                                        width: '100%',
                                        padding: '14px 24px',
                                        borderRadius: '14px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                        color: '#ffffff',
                                        fontSize: '15px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                        marginTop: '8px',
                                    }}
                                >
                                    Let's Go! 🎉
                                </motion.button>
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
