/**
 * useAchievements Hook
 * Handles achievement loading and state
 */

import { useState, useEffect } from 'react';
import type { AchievementStats } from '../types';

interface UseAchievementsReturn {
    achievements: AchievementStats;
    refreshAchievements: () => Promise<void>;
}

export const useAchievements = (refreshTrigger: number): UseAchievementsReturn => {
    const [achievements, setAchievements] = useState<AchievementStats>({
        total: 0,
        unlocked: 0,
        percentage: 0,
        recent: []
    });

    const loadAchievements = async () => {
        try {
            const { getAchievementStats, getUnlockedAchievements } = await import('../../../services/achievementsService');
            const stats = getAchievementStats();
            const unlocked = getUnlockedAchievements();

            // Get 3 most recent unlocked achievements
            const recent = unlocked
                .filter(a => a.unlockedAt)
                .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
                .slice(0, 3)
                .map(a => ({ id: a.id, name: a.name, icon: a.icon, rarity: a.rarity }));

            setAchievements({
                total: stats.total,
                unlocked: stats.unlocked,
                percentage: stats.percentage,
                recent,
            });
        } catch (err) {
            console.error('[Achievements] Failed to load:', err);
        }
    };

    useEffect(() => {
        loadAchievements();
    }, [refreshTrigger]);

    return {
        achievements,
        refreshAchievements: loadAchievements,
    };
};

export default useAchievements;
