/**
 * StudyInsightsWidget Component
 * Displays weekly study time bar chart with stats
 * Visibility key: mastery-widget
 */

import * as React from 'react';
import { motion } from 'motion/react';
import type { StudyInsights } from '../types';

interface StudyInsightsWidgetProps {
    studyInsights: StudyInsights;
    formatMinutesToHours: (minutes: number) => string;
    compactMode?: boolean;
    onClose: () => void;
}

export const StudyInsightsWidget = React.memo<StudyInsightsWidgetProps>(({
    studyInsights,
    formatMinutesToHours,
    compactMode = false,
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
            id="mastery-widget"
        >
            <div className={`flex items-center justify-between ${compactMode ? 'px-3 py-2' : 'px-4 py-3'}`}>
                <div className="flex items-center gap-2">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`rounded-lg bg-gradient-to-br from-cyan-50 to-blue-100/50 flex items-center justify-center ${compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}
                    >
                        <svg className={`text-cyan-500 ${compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </motion.div>
                    <span className={`font-medium text-zinc-700 ${compactMode ? 'text-xs' : 'text-sm'}`}>Study Insights</span>
                    {studyInsights.trend !== 'stable' && (
                        <span className={`px-1.5 py-0.5 rounded-full ${studyInsights.trend === 'up' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                            } ${compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                            {studyInsights.trend === 'up' ? '↑' : '↓'} {Math.abs(studyInsights.trendPercent)}%
                        </span>
                    )}
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

            {/* Mini Bar Chart */}
            <div className={`${compactMode ? 'px-3 pb-3' : 'px-4 pb-4'}`}>
                {/* Chart Area */}
                <div className={`flex items-end justify-between gap-1 ${compactMode ? 'h-12 mb-2' : 'h-16 mb-3'}`}>
                    {studyInsights.dailyData.map((day: any, index: number) => {
                        const maxMinutes = Math.max(...studyInsights.dailyData.map((d: any) => d.minutes), 1);
                        const heightPercent = (day.minutes / maxMinutes) * 100;
                        const isToday = index === studyInsights.dailyData.length - 1;

                        return (
                            <motion.div
                                key={day.date}
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.max(heightPercent, 8)}%` }}
                                transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                                className={`flex-1 rounded-t-sm ${isToday
                                        ? 'bg-gradient-to-t from-cyan-500 to-blue-400'
                                        : day.minutes > 0
                                            ? 'bg-gradient-to-t from-cyan-200 to-cyan-100'
                                            : 'bg-zinc-100'
                                    }`}
                                style={{ minHeight: '4px' }}
                            />
                        );
                    })}
                </div>

                {/* Day Labels */}
                <div className="flex justify-between gap-1 mb-3">
                    {studyInsights.dailyData.map((day: any, index: number) => {
                        const isToday = index === studyInsights.dailyData.length - 1;
                        return (
                            <span
                                key={day.date}
                                className={`flex-1 text-center ${isToday ? 'text-cyan-600 font-medium' : 'text-zinc-400'
                                    } ${compactMode ? 'text-[8px]' : 'text-[9px]'}`}
                            >
                                {day.dayName}
                            </span>
                        );
                    })}
                </div>

                {/* Stats Row */}
                <div className={`flex items-center justify-between pt-2 border-t border-zinc-100 ${compactMode ? 'gap-2' : 'gap-3'}`}>
                    <div className="flex-1 text-center">
                        <p className={`font-semibold text-zinc-700 ${compactMode ? 'text-[11px]' : 'text-xs'}`}>
                            {formatMinutesToHours(studyInsights.totalWeekMinutes)}
                        </p>
                        <p className={`text-zinc-400 ${compactMode ? 'text-[8px]' : 'text-[9px]'}`}>This Week</p>
                    </div>
                    <div className="w-px h-6 bg-zinc-100" />
                    <div className="flex-1 text-center">
                        <p className={`font-semibold text-zinc-700 ${compactMode ? 'text-[11px]' : 'text-xs'}`}>
                            {formatMinutesToHours(studyInsights.avgDailyMinutes)}
                        </p>
                        <p className={`text-zinc-400 ${compactMode ? 'text-[8px]' : 'text-[9px]'}`}>Daily Avg</p>
                    </div>
                    {studyInsights.bestDay && (
                        <>
                            <div className="w-px h-6 bg-zinc-100" />
                            <div className="flex-1 text-center">
                                <p className={`font-semibold text-cyan-600 ${compactMode ? 'text-[11px]' : 'text-xs'}`}>
                                    {studyInsights.bestDay.name}
                                </p>
                                <p className={`text-zinc-400 ${compactMode ? 'text-[8px]' : 'text-[9px]'}`}>Best Day</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
});

StudyInsightsWidget.displayName = 'StudyInsightsWidget';

export default StudyInsightsWidget;
