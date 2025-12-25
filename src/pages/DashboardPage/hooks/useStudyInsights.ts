/**
 * useStudyInsights Hook
 * Handles study time analytics and insights
 */

import { useState, useCallback, useEffect } from 'react';
import { getStudyTimeData } from '../../../services/studyTimeService';
import type { StudyInsights } from '../types';

interface UseStudyInsightsReturn {
    studyInsights: StudyInsights;
    refreshStudyInsights: () => void;
}

export const useStudyInsights = (refreshTrigger: number): UseStudyInsightsReturn => {
    const computeStudyInsights = useCallback((): StudyInsights => {
        const data = getStudyTimeData();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Get last 7 days with day names
        const dailyData = (data.dailyHistory || []).slice(-7).map(d => {
            const date = new Date(d.date);
            return {
                date: d.date,
                minutes: d.minutes,
                dayName: dayNames[date.getDay()]
            };
        });

        // Calculate totals
        const totalWeekMinutes = dailyData.reduce((sum, d) => sum + d.minutes, 0);
        const daysWithData = dailyData.filter(d => d.minutes > 0).length || 1;
        const avgDailyMinutes = Math.round(totalWeekMinutes / daysWithData);

        // Find best day
        const bestDayData = dailyData.reduce((best, d) =>
            d.minutes > (best?.minutes || 0) ? d : best,
            null as { date: string; minutes: number; dayName: string } | null
        );
        const bestDay = bestDayData && bestDayData.minutes > 0
            ? { name: bestDayData.dayName, minutes: bestDayData.minutes }
            : null;

        // Calculate trend (compare last 3 days vs previous 3 days)
        const recent3 = dailyData.slice(-3).reduce((sum, d) => sum + d.minutes, 0);
        const previous3 = dailyData.slice(-6, -3).reduce((sum, d) => sum + d.minutes, 0);
        const trendPercent = previous3 > 0 ? Math.round(((recent3 - previous3) / previous3) * 100) : 0;
        const trend: 'up' | 'down' | 'stable' = trendPercent > 10 ? 'up' : trendPercent < -10 ? 'down' : 'stable';

        return { dailyData, totalWeekMinutes, avgDailyMinutes, bestDay, trend, trendPercent };
    }, []);

    const [studyInsights, setStudyInsights] = useState<StudyInsights>(() => computeStudyInsights());

    const refreshStudyInsights = useCallback(() => {
        setStudyInsights(computeStudyInsights());
    }, [computeStudyInsights]);

    // Refresh when trigger changes
    useEffect(() => {
        refreshStudyInsights();
    }, [refreshTrigger, refreshStudyInsights]);

    return {
        studyInsights,
        refreshStudyInsights,
    };
};

export default useStudyInsights;
