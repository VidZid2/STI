/**
 * StreakWidget Component
 * Dynamic colors based on streak tier with dark mode support
 */

import React from 'react';
import { motion } from 'motion/react';
import { getStreakData, getStreakTier, updateStreak } from '../../../services/studyTimeService';

interface StreakWidgetProps {
    compact?: boolean;
}

export const StreakWidget: React.FC<StreakWidgetProps> = ({ compact = false }) => {
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
            className={`mx-3 mt-3 rounded-xl ${compact ? 'p-2' : 'p-3'}`}
            style={{
                background: colors.bgGradient,
                border: `1px solid ${colors.borderColor}`,
            }}
        >
            <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'}`}>
                <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                    className={compact ? 'text-lg' : 'text-2xl'}
                >
                    {tier.flameEmoji}
                </motion.div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span
                            className={`font-semibold ${compact ? 'text-xs' : 'text-sm'}`}
                            style={{ color: colors.textColor }}
                        >
                            {streakData.currentStreak} Day Streak!
                        </span>
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.5 }}
                            className={`px-1.5 py-0.5 rounded-full ${compact ? 'text-[8px]' : 'text-[10px]'}`}
                            style={{
                                backgroundColor: colors.badgeBg,
                                color: colors.textColor,
                            }}
                        >
                            +{tier.xpBonus} XP
                        </motion.span>
                    </div>
                    <p
                        className={compact ? 'text-[9px]' : 'text-[11px]'}
                        style={{ color: colors.subTextColor }}
                    >
                        {getMessage()}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default StreakWidget;
