import * as React from 'react';
import { motion } from 'motion/react';
import type { AchievementStats } from '../types';

interface AchievementsWidgetProps {
    achievements: AchievementStats;
    compactMode: boolean;
    onClose: () => void;
}

export const AchievementsWidget = React.memo<AchievementsWidgetProps>(({
    achievements,
    compactMode,
    onClose,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            className={`bg-white rounded-xl border border-zinc-100/80 overflow-hidden ${compactMode ? 'shadow-none' : 'shadow-sm'}`}
            id="achievements-widget"
        >
            {/* Header */}
            <div className={`flex items-center justify-between ${compactMode ? 'px-3 py-2' : 'px-4 py-3'}`}>
                <div className="flex items-center gap-2">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.3 }}
                        className={`rounded-lg bg-gradient-to-br from-amber-50 to-yellow-100/50 flex items-center justify-center ${compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}
                    >
                        <span className={compactMode ? 'text-sm' : 'text-base'}>🏆</span>
                    </motion.div>
                    <span className={`font-medium text-zinc-700 ${compactMode ? 'text-xs' : 'text-sm'}`}>Achievements</span>
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className={`px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 font-medium ${compactMode ? 'text-[8px]' : 'text-[9px]'}`}
                    >
                        {achievements.unlocked}/{achievements.total}
                    </motion.span>
                </div>
                <motion.button
                    whileHover={{ scale: 1.15, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onClose()}
                    className={`flex items-center justify-center rounded-md text-zinc-300 hover:text-red-400 transition-${compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                >
                    <svg className={compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </motion.button>
            </div>

            {/* Progress Bar */}
            <div className={`${compactMode ? 'px-3 pb-2' : 'px-4 pb-3'}`}>
                <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-zinc-500 ${compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                        Progress
                    </span>
                    <span className={`font-semibold text-amber-600 ${compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                        {achievements.percentage}%
                    </span>
                </div>
                <div className={`w-full rounded-full overflow-hidden bg-zinc-100 ${compactMode ? 'h-1.5' : 'h-2'}`}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${achievements.percentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"
                    />
                </div>
            </div>

            {/* Recent Achievements */}
            <div className={`border-t border-zinc-100 ${compactMode ? 'px-3 py-2' : 'px-4 py-3'}`}>
                <p className={`text-zinc-400 mb-2 ${compactMode ? 'text-[8px]' : 'text-[9px]'}`}>
                    {achievements.recent.length > 0 ? 'Recent unlocks' : 'Start earning achievements!'}
                </p>

                {achievements.recent.length > 0 ? (
                    <div className="space-y-1.5">
                        {achievements.recent.map((achievement, index) => (
                            <motion.div
                                key={achievement.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                className={`flex items-center gap-2 rounded-lg ${achievement.rarity === 'legendary' ? 'bg-amber-50/50' :
                                        achievement.rarity === 'epic' ? 'bg-purple-50/50' :
                                            achievement.rarity === 'rare' ? 'bg-blue-50/50' : 'bg-zinc-50/50'
                                    } ${compactMode ? 'p-1.5' : 'p-2'}`}
                            >
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.4 + index * 0.1 }}
                                    className={compactMode ? 'text-base' : 'text-lg'}
                                >
                                    {achievement.icon}
                                </motion.span>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-medium text-zinc-700 truncate ${compactMode ? 'text-[10px]' : 'text-xs'}`}>
                                        {achievement.name}
                                    </p>
                                    <p className={`capitalize ${achievement.rarity === 'legendary' ? 'text-amber-500' :
                                            achievement.rarity === 'epic' ? 'text-purple-500' :
                                                achievement.rarity === 'rare' ? 'text-blue-500' : 'text-zinc-400'
                                        } ${compactMode ? 'text-[8px]' : 'text-[9px]'}`}>
                                        {achievement.rarity}
                                    </p>
                                </div>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.5 + index * 0.1 }}
                                >
                                    <svg className={`text-emerald-500 ${compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </motion.div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center py-2"
                    >
                        <motion.div
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-2xl mb-1"
                        >
                            🎯
                        </motion.div>
                        <p className={`text-zinc-400 text-center ${compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                            Complete tasks to unlock badges!
                        </p>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
});

AchievementsWidget.displayName = 'AchievementsWidget';

export default AchievementsWidget;
