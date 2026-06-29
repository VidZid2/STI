/**
 * ProgressHistoryChart
 * Visualizes goal progress over time.
 * Extracted from GoalsContent.tsx during Phase 8.3
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { getAggregatedProgressHistory, getRealTimeProgress } from '../../../../../services/goalsService';
import { BarChart } from '../../../../../components/charts/bar-chart';
import { Bar } from '../../../../../components/charts/bar';
import { ChartTooltip } from '../../../../../components/charts/tooltip/chart-tooltip';
import { Grid } from '../../../../../components/charts/grid';
import { BarXAxis } from '../../../../../components/charts/bar-x-axis';

const ProgressHistoryChart: React.FC<{ goals?: any[] }> = ({ goals = [] }) => {
    const [historyData, setHistoryData] = useState<{ date: string; completed: number; active: number; totalProgress: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const goalsRef = useRef(goals);
    const hasLoadedRef = useRef(false);

    useEffect(() => {
        goalsRef.current = goals;
    }, [goals]);

    useEffect(() => {
        const loadHistory = async () => {
            if (!hasLoadedRef.current) {
                setIsLoading(true);
            }
            const data = await getAggregatedProgressHistory(30);
            setHistoryData(data);
            setIsLoading(false);
            hasLoadedRef.current = true;
        };
        loadHistory();
        const interval = setInterval(loadHistory, 30000);
        return () => clearInterval(interval);
    }, []);

    const currentStats = useMemo(() => {
        const activeGoals = goals.filter(g => g.status === 'active');
        const completedGoals = goals.filter(g => g.status === 'completed');
        
        const realTimeProgressValues = activeGoals.map(goal => {
            const realProgress = getRealTimeProgress(goal);
            return goal.target_value > 0 ? Math.min(Math.round((realProgress / goal.target_value) * 100), 100) : 0;
        });
        
        const completedProgressValues = completedGoals.map(() => 100);
        const allProgressValues = [...realTimeProgressValues, ...completedProgressValues];
        const avgProgress = allProgressValues.length > 0
            ? Math.round(allProgressValues.reduce((sum, p) => sum + p, 0) / allProgressValues.length)
            : 0;
        
        return {
            totalProgress: avgProgress,
            active: activeGoals.length,
            completed: completedGoals.length
        };
    }, [goals]);

    const chartData = useMemo(() => {
        if (historyData.length === 0) return historyData;
        const today = new Date().toISOString().split('T')[0];
        return historyData.map((entry, index) => {
            let updatedEntry = entry;
            if (index === historyData.length - 1 && entry.date === today) {
                updatedEntry = { ...entry, ...currentStats };
            }
            const dateObj = new Date(entry.date);
            const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return {
                ...updatedEntry,
                date: formattedDate
            };
        });
    }, [historyData, currentStats]);

// @ts-ignore
    const formatDateLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 shadow-sm rounded-[20px] p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default overflow-hidden flex flex-col"
        >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 group">
                <div className="flex items-start gap-3 min-w-0">
                    <motion.div 
                        whileHover={{ scale: 1.05, rotate: -5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className="w-14 h-14 rounded-[16px] bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center flex-shrink-0 shadow-sm relative transition-transform duration-300 text-blue-600 dark:text-blue-400"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M3 3v18h18" />
                            <path d="m19 9-5 5-4-4-3 3" />
                        </svg>
                    </motion.div>
                    <div className="flex flex-col min-w-0 pt-0.5">
                        <h2 className="text-[16px] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight mb-1.5">Progress Overview</h2>
                        <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 leading-tight">Your learning journey</p>
                    </div>
                </div>
                
                {/* 30 Days Badge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="text-[11px] font-bold uppercase tracking-wider">30 Days</span>
                </div>
            </div>

            {/* Chart Content */}
            <div className="w-full flex flex-col min-h-0">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-[200px]">
                                    <motion.svg width="28" height="28" viewBox="0 0 24 24" fill="none" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                        <circle cx="12" cy="12" r="10" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="3" />
                                        <path d="M12 2a10 10 0 0 1 10 10" className="stroke-blue-500" strokeWidth="3" strokeLinecap="round" />
                                    </motion.svg>
                                </div>
                            ) : chartData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[140px] text-slate-400 dark:text-slate-500">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-50">
                                        <path d="M3 3v18h18" />
                                        <path d="m19 9-5 5-4-4-3 3" />
                                    </svg>
                                    <span className="text-[13px] font-medium">No progress data yet</span>
                                </div>
                            ) : (
                                <>


                                    {/* Main Chart Area */}

                                    <div className="relative h-[180px] sm:h-[220px] mt-2">
                                        {/* Chart Container */}
                                        <div className="relative h-full w-full bg-slate-50/50 dark:bg-slate-800/50 rounded-[16px] border border-slate-100 dark:border-slate-700/50 overflow-visible py-4 pb-12">
                                            {chartData.length > 0 && (
                                                <BarChart 
                                                    data={chartData} 
                                                    xDataKey="date" 
                                                    margin={{ top: 0, right: 12, bottom: 40, left: 12 }}
                                                    aspectRatio="auto"
                                                    className="h-full w-full"
                                                    barGap={0.4}
                                                >
                                                    <Grid horizontal={true} strokeDasharray="4,4" fadeHorizontal={true} />
                                                    <Bar dataKey="totalProgress" fill="#3b82f6" />
                                                    <BarXAxis showAllLabels={false} maxLabels={7} />
                                                    <ChartTooltip 
                                                        showDots={false}
                                                        rows={(point) => [{
                                                            color: '#3b82f6',
                                                            label: 'Progress',
                                                            value: `${point.totalProgress}%`
                                                        }]}
                                                    />
                                                </BarChart>
                                            )}
                                        </div>
                                    </div>

                                </>
                            )}
                        </div>
        </motion.div>
    );
};

export { ProgressHistoryChart };
