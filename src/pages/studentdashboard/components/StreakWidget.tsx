/**
 * StreakWidget Component
 * Dynamic colors based on streak tier with dark mode support
 */

import React from 'react';
import { motion } from 'motion/react';
import { Flame, Droplet, Sparkles } from 'lucide-react';
import { getStreakData, getStreakTier, updateStreak } from '../../../services/studyTimeService';

interface StreakWidgetProps {
    compact?: boolean;
    compactMode?: boolean;
    isInline?: boolean;
}

export const StreakWidget: React.FC<StreakWidgetProps> = ({ compact = false, compactMode = false, isInline = false }) => {
    const isCompact = compact || compactMode;
    const [streakData, setStreakData] = React.useState(() => getStreakData());
    const [isDarkMode, setIsDarkMode] = React.useState(false);

    // Check for dark mode
    React.useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.body.classList.contains('dark-mode'));
        };
        checkDarkMode();

        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    // Update streak on mount
    React.useEffect(() => {
        updateStreak();
        setStreakData(getStreakData());
    }, []);

    const tier = getStreakTier(streakData.currentStreak);

    // Get message based on streak
    const getMessage = () => {
        if (streakData.currentStreak >= 10) {
            return "You're on fire! Legendary streak!";
        } else if (streakData.currentStreak >= 3) {
            return "Keep it up! Log in tomorrow to continue.";
        } else {
            return "Great start! Keep logging in daily.";
        }
    };

    // Dark mode aware colors
    const getColors = () => {
        if (isDarkMode) {
            if (tier.tier === 'legendary') {
                return {
                    bgGradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
                    borderColor: 'rgba(251, 191, 36, 0.5)',
                    textColor: '#fbbf24',
                    subTextColor: 'rgba(251, 191, 36, 0.8)',
                    badgeBg: 'rgba(251, 191, 36, 0.3)',
                };
            } else if (tier.tier === 'warming') {
                return {
                    bgGradient: 'linear-gradient(to right, rgba(251, 191, 36, 0.15), rgba(249, 115, 22, 0.15))',
                    borderColor: 'rgba(251, 191, 36, 0.5)',
                    textColor: '#fbbf24',
                    subTextColor: 'rgba(251, 191, 36, 0.7)',
                    badgeBg: 'rgba(251, 191, 36, 0.3)',
                };
            } else {
                return {
                    bgGradient: 'linear-gradient(to right, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.15))',
                    borderColor: 'rgba(59, 130, 246, 0.4)',
                    textColor: '#60a5fa',
                    subTextColor: 'rgba(96, 165, 250, 0.8)',
                    badgeBg: 'rgba(59, 130, 246, 0.3)',
                };
            }
        }
        return {
            bgGradient: tier.bgGradient,
            borderColor: tier.borderColor,
            textColor: tier.textColor,
            subTextColor: tier.subTextColor,
            badgeBg: tier.tier === 'legendary' || tier.tier === 'warming'
                ? 'rgba(251, 191, 36, 0.3)'
                : 'rgba(59, 130, 246, 0.2)',
        };
    };

    const colors = getColors();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: 0.03 }}
            className={`${isInline ? '' : 'mx-1'} mt-3 bg-white dark:bg-slate-800 border shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md cursor-pointer group ${isCompact ? 'p-3 rounded-[20px]' : 'p-4 rounded-[24px]'}`}
            style={{ borderColor: colors.borderColor }}
        >
            <div className={`flex items-center ${isCompact ? 'gap-3' : 'gap-4'}`}>
                <div 
                    className={`rounded-[14px] flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105 ${isCompact ? 'w-10 h-10' : 'w-12 h-12'}`}
                    style={{
                        backgroundColor: colors.badgeBg,
                        border: `1px solid ${colors.borderColor}`
                    }}
                >
                    <motion.div
                        animate={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                        className={`flex items-center justify-center relative ${isCompact ? 'w-6 h-6' : 'w-7 h-7'}`}
                    >
                        {streakData.currentStreak >= 10 ? (
                            <>
                                <Flame className="w-full h-full text-orange-500" fill="currentColor" strokeWidth={1.5} />
                                <motion.div 
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }} 
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -bottom-1 -right-1"
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" fill="currentColor" />
                                </motion.div>
                            </>
                        ) : streakData.currentStreak >= 3 ? (
                            <Flame className="w-full h-full text-orange-500" fill="currentColor" strokeWidth={1.5} />
                        ) : (
                            <Droplet className="w-[85%] h-[85%] text-blue-500" fill="currentColor" strokeWidth={1.5} />
                        )}
                    </motion.div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none ${isCompact ? 'text-[13px]' : 'text-[15px]'}`}>
                            {streakData.currentStreak} Day Streak!
                        </span>
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.5 }}
                            className={`px-2 py-0.5 rounded-[8px] font-bold leading-none ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}
                            style={{
                                backgroundColor: colors.badgeBg,
                                color: colors.textColor,
                                border: `1px solid ${colors.borderColor}`
                            }}
                        >
                            +{tier.xpBonus} XP
                        </motion.span>
                    </div>
                    <p className={`text-slate-500 dark:text-slate-400 font-semibold truncate ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
                        {getMessage()}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default StreakWidget;
