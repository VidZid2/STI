/**
 * SessionHistory
 * Weekly focus trends chart.
 * Extracted from FocusModePage.tsx during Phase 8.5
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import type { FocusModeColors } from '../FocusModePage';
import type { StudyTimeData } from '../../../../../services/studyTimeService';

// Session History Component - Shows weekly focus trends
const SessionHistory: React.FC<{
    isDarkMode: boolean;
    colors: FocusModeColors;
}> = ({ isDarkMode, colors }) => {
    const [studyData, setStudyData] = useState<StudyTimeData | null>(null);

    useEffect(() => {
        const data = getStudyTimeData();
        setStudyData(data);
    }, []);

    // Get last 7 days of data
    const weekData = useMemo(() => {
        if (!studyData?.dailyHistory) return [];

        const now = new Date();
        const last7Days: { day: string; minutes: number; date: string }[] = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

            const entry = studyData.dailyHistory.find(d => d.date === dateStr);
            last7Days.push({
                day: dayName,
                minutes: entry?.minutes || 0,
                date: dateStr,
            });
        }

        return last7Days;
    }, [studyData]);

    const maxMinutes = Math.max(...weekData.map(d => d.minutes), 60); // Min 60 for scale
    const totalWeekMinutes = weekData.reduce((sum, d) => sum + d.minutes, 0);
    const avgMinutes = Math.round(totalWeekMinutes / 7);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 25 }}
            style={{
                padding: '14px',
                borderRadius: '14px',
                background: isDarkMode ? '#1e293b' : '#ffffff',
                border: `1px solid ${colors.border}`,
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%)',
                        border: '1px solid rgba(59, 130, 246, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#3b82f6',
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 3v18h18" />
                            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                        </svg>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: colors.textPrimary }}>
                            Weekly Trend
                        </div>
                        <div style={{ fontSize: '10px', color: colors.textMuted }}>
                            Avg: {avgMinutes}m/day
                        </div>
                    </div>
                </div>
                <div style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#3b82f6',
                }}>
                    {Math.floor(totalWeekMinutes / 60)}h {totalWeekMinutes % 60}m
                </div>
            </div>

            {/* Bar Chart */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                height: '60px',
                gap: '6px',
                padding: '0 4px',
            }}>
                {weekData.map((day, index) => {
                    const height = maxMinutes > 0 ? (day.minutes / maxMinutes) * 100 : 0;
                    const isToday = index === weekData.length - 1;

                    return (
                        <motion.div
                            key={day.date}
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(height, 4)}%` }}
                            transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                                flex: 1,
                                minHeight: '4px',
                                borderRadius: '4px 4px 2px 2px',
                                background: isToday
                                    ? 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)'
                                    : (day.minutes > 0
                                        ? (isDarkMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)')
                                        : (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')),
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'background 0.2s ease',
                            }}
                            whileHover={{
                                background: isToday
                                    ? 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)'
                                    : 'rgba(59, 130, 246, 0.5)',
                            }}
                            title={`${day.day}: ${day.minutes}m`}
                        />
                    );
                })}
            </div>

            {/* Day Labels */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '6px',
                padding: '0 4px',
            }}>
                {weekData.map((day, index) => (
                    <span
                        key={day.date}
                        style={{
                            flex: 1,
                            textAlign: 'center',
                            fontSize: '9px',
                            fontWeight: index === weekData.length - 1 ? 600 : 500,
                            color: index === weekData.length - 1 ? '#3b82f6' : colors.textMuted,
                            textTransform: 'uppercase',
                        }}
                    >
                        {day.day}
                    </span>
                ))}
            </div>
        </motion.div>
    );
};


export { SessionHistory };
