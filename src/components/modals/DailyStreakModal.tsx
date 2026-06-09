/**
 * Daily Streak Modal - SaaS-style minimal celebration for daily check-ins
 * Clean, professional design with subtle animations
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { getStreakData, getStreakTier, type StreakData } from '../../services/studyTimeService';
import { cn } from '../../lib/utils';
import { Flame, Trophy, Clock, Target } from 'lucide-react';

interface DailyStreakModalProps {
    isOpen: boolean;
    onClose: () => void;
    streakData?: StreakData;
}

// Student Tools Style Icon Container
const StreakBadge: React.FC<{ streak: number }> = ({ streak }) => {
    const getTierStyle = () => {
        if (streak >= 90) return {
            bg: 'bg-cyan-50 dark:bg-cyan-500/10',
            border: 'border-cyan-100 dark:border-cyan-500/20',
            iconColor: 'text-cyan-600 dark:text-cyan-400',
        };
        if (streak >= 30) return {
            bg: 'bg-amber-50 dark:bg-amber-500/10',
            border: 'border-amber-100 dark:border-amber-500/20',
            iconColor: 'text-amber-600 dark:text-amber-400',
        };
        if (streak >= 10) return {
            bg: 'bg-zinc-100 dark:bg-zinc-800',
            border: 'border-zinc-200 dark:border-zinc-700',
            iconColor: 'text-zinc-600 dark:text-zinc-400',
        };
        return {
            bg: 'bg-orange-50 dark:bg-orange-500/10',
            border: 'border-orange-100 dark:border-orange-500/20',
            iconColor: 'text-orange-600 dark:text-orange-400',
        };
    };

    const style = getTierStyle();

    return (
        <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.05, rotate: -5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
            className={cn(
                'w-12 h-12 sm:w-16 sm:h-16 rounded-[16px] sm:rounded-[20px] flex items-center justify-center flex-shrink-0 shadow-sm border transition-colors',
                style.bg,
                style.border
            )}
        >
            <Flame className={cn("w-6 h-6 sm:w-8 sm:h-8", style.iconColor)} strokeWidth={2} />
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

                    {/* Modal Container */}
                    <div className='fixed inset-0 z-[99999] flex items-end justify-center pb-4 px-4 sm:p-0 sm:items-end sm:justify-end sm:inset-auto sm:bottom-6 sm:right-6 pointer-events-none'>
                        <motion.div
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={0.7}
                            onDragEnd={(_, info) => {
                                if (info.offset.y > 60 || info.velocity.y > 400) {
                                    onClose();
                                }
                            }}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{
                                type: 'spring',
                                stiffness: 400,
                                damping: 30,
                                mass: 1,
                            }}
                            className={cn(
                                'relative w-full sm:w-[420px] max-w-[420px] rounded-[24px] overflow-hidden border pointer-events-auto shadow-2xl flex flex-col',
                                isDarkMode 
                                    ? 'bg-zinc-900 border-zinc-800/80 shadow-[0_16px_48px_rgba(0,0,0,0.5)]' 
                                    : 'bg-white border-zinc-200/80 shadow-[0_16px_48px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02)]'
                            )}
                        >
                            {/* Desktop Close button (Fixed) */}
                            <motion.button
                                onClick={onClose}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className={cn(
                                    'hidden sm:flex absolute top-5 sm:top-8 right-4 sm:right-7 z-[60] items-center justify-center rounded-xl border p-2 shadow-sm transition-colors',
                                    isDarkMode 
                                        ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700' 
                                        : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'
                                )}
                                aria-label="Close Modal"
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </motion.button>

                            {/* Content */}
                            <div 
                                className='relative rounded-[24px] pt-5 sm:pt-8 px-4 sm:px-7 pb-4 sm:pb-6 flex flex-col gap-4 sm:gap-6 overflow-y-auto overflow-x-hidden max-h-[85vh] sm:max-h-[80vh] max-md:[&::-webkit-scrollbar]:hidden max-md:[-ms-overflow-style:none] max-md:[scrollbar-width:none] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:mt-4 [&::-webkit-scrollbar-track]:mb-4'
                            >
                                {/* Mobile Close button (Scrolls with content) */}
                                <motion.button
                                    onClick={onClose}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={cn(
                                        'sm:hidden absolute top-3 right-3 z-[60] w-6 h-6 flex items-center justify-center rounded-md border p-0 shadow-sm transition-colors',
                                        isDarkMode
                                            ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                            : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'
                                    )}
                                    aria-label="Close Modal"
                                >
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </motion.button>
                                
                                {/* Header Group: Student Tools Style (Horizontal) */}
                                <div className="flex items-start gap-2.5 sm:gap-5 w-full pt-1 sm:pt-2 shrink-0">
                                    {/* Icon Container */}
                                    <StreakBadge streak={streakData.currentStreak} />

                                    {/* Title and Description */}
                                    <motion.div
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.25 }}
                                        className="flex flex-col flex-1"
                                    >
                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
                                            <h1 className={cn(
                                                'text-[18px] sm:text-[22px] font-bold tracking-tight leading-none',
                                                isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
                                            )}>
                                                {streakData.currentStreak} Day Streak
                                            </h1>
                                            {/* Tier Badge styled like the "Local-first" badge */}
                                            <div className={cn(
                                                'px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border',
                                                isDarkMode ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-zinc-50 border-zinc-200'
                                            )}>
                                                <span style={{ color: tierColor }}>{tierLabel}</span>
                                            </div>
                                        </div>
                                        <p className={cn(
                                            'text-[12px] sm:text-[13.5px] leading-relaxed font-medium',
                                            isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
                                        )}>
                                            {getMessage()}
                                        </p>
                                    </motion.div>
                                </div>

                                {/* Student Tools Style List Cards (Vertical Stack) */}
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className='w-full flex flex-col gap-2 sm:gap-2.5 mt-1 sm:mt-2 shrink-0'
                                >
                                    {[
                                        { label: 'XP Earned', value: `+${tier.xpBonus}`, desc: 'For maintaining streak', colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-900/20', borderClass: 'border-blue-100 dark:border-blue-800/50', icon: <Target className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} /> },
                                        { label: 'Best Streak', value: `${streakData.bestStreak} Days`, desc: 'Your all-time record', colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-900/20', borderClass: 'border-amber-100 dark:border-amber-800/50', icon: <Trophy className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} /> },
                                        ...(daysToNextMilestone > 0 ? [{ label: 'Next Tier', value: `${daysToNextMilestone} Days`, desc: 'Until your next milestone', colorClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-900/20', borderClass: 'border-emerald-100 dark:border-emerald-800/50', icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} /> }] : []),
                                    ].map((stat, i) => (
                                        <div
                                            key={stat.label}
                                            className={cn(
                                                'flex items-center gap-2 sm:gap-4 p-2 sm:p-4 rounded-[14px] sm:rounded-[20px] border transition-all duration-300 hover:shadow-sm group cursor-default',
                                                isDarkMode 
                                                    ? 'bg-zinc-800/40 border-zinc-700/80 hover:border-zinc-600' 
                                                    : 'bg-white border-zinc-200/80 hover:border-blue-200/80 hover:shadow-md'
                                            )}
                                        >
                                            {/* Study Tools style SVG Container with hover animation */}
                                            <motion.div
                                                whileHover={{ scale: 1.08, rotate: -5 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                className={cn('w-8 h-8 sm:w-12 sm:h-12 rounded-[10px] sm:rounded-[16px] flex items-center justify-center flex-shrink-0 border shadow-sm', stat.colorClass, stat.bgClass, stat.borderClass)}
                                            >
                                                {stat.icon}
                                            </motion.div>
                                            
                                            <div className='flex flex-col flex-1 min-w-0'>
                                                <div className={cn('text-[8px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate', stat.colorClass)}>
                                                    STEP {i + 1} • {stat.label}
                                                </div>
                                                <div className={cn('text-[12px] sm:text-[16px] font-bold leading-tight tracking-tight truncate', isDarkMode ? 'text-zinc-100' : 'text-zinc-900')}>
                                                    {stat.value}
                                                </div>
                                                <div className={cn('text-[10px] sm:text-[12.5px] mt-0.5 truncate', isDarkMode ? 'text-zinc-400' : 'text-zinc-500')}>
                                                    {stat.desc}
                                                </div>
                                            </div>

                                            {/* Chevron matching the tools list (hidden on ultra-small mobile) */}
                                            <div className={cn("hidden sm:block transition-colors", isDarkMode ? "text-zinc-600 group-hover:text-zinc-400" : "text-zinc-300 group-hover:text-blue-400")}>
                                                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="9 18 15 12 9 6" />
                                                </svg>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>

                                {/* Solid Emerald CTA Button (Matches Paraphrase) */}
                                <motion.button
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.55, duration: 0.3 }}
                                    whileHover={{ y: -1, boxShadow: '0 8px 20px rgba(16, 185, 129, 0.35)' }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={onClose}
                                    className={cn(
                                        'w-full flex items-center justify-center gap-1.5 py-2.5 sm:py-3 rounded-xl text-[13px] sm:text-[14px] font-bold transition-all duration-300 shadow-md shrink-0',
                                        isDarkMode 
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50' 
                                            : 'bg-emerald-500 hover:bg-emerald-600 text-white border border-transparent'
                                    )}
                                >
                                    Continue
                                    <svg className='w-4 h-4' viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </motion.button>
                            </div>

                            {/* Progress bar at bottom */}
                            <div className={cn('h-1.5 w-full shrink-0', isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100')}>
                                <motion.div
                                    initial={{ width: '100%' }}
                                    animate={{ width: '0%' }}
                                    transition={{ duration: 5, ease: 'linear' }}
                                    className='h-full'
                                    style={{
                                        background: tierColor,
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
