/**
 * ProgressHistoryChart
 * Visualizes goal progress over time.
 * Extracted from GoalsContent.tsx during Phase 8.3
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getAggregatedProgressHistory, getRealTimeProgress } from '../../../../../services/goalsService';
import { BarChart, Bar, ChartTooltip, Grid, BarXAxis } from '../../../../../components/ui/bar-chart';

const ProgressHistoryChart: React.FC<{ goals?: any[] }> = ({ goals = [] }) => {
    const [historyData, setHistoryData] = useState<{ date: string; completed: number; active: number; totalProgress: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
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
            const data = await getAggregatedProgressHistory(90);
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
            if (index === historyData.length - 1 && entry.date === today) {
                return { ...entry, ...currentStats };
            }
            return entry;
        });
    }, [historyData, currentStats]);

    const formatDateLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-6 rounded-[20px] sm:rounded-[24px] border border-slate-200/60 dark:border-slate-700/50 bg-white dark:bg-slate-800/90 shadow-sm overflow-hidden"
        >
            {/* Header */}
            <div 
                className="flex items-center justify-between p-5 sm:p-6 cursor-pointer group"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <motion.div
                        animate={{ 
                            rotate: isExpanded ? 0 : -90,
                            backgroundColor: isExpanded ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)'
                        }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="w-12 h-12 rounded-[14px] flex items-center justify-center text-blue-600 dark:text-blue-400"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 3v18h18" />
                            <path d="m19 9-5 5-4-4-3 3" />
                        </svg>
                    </motion.div>
                    <div>
                        <h3 className="text-[16px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">Progress History</h3>
                        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Last 7 days overview</p>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-all"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </motion.div>
            </div>

            {/* Expandable Chart Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 sm:px-6 pb-6 pt-2">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-[200px]">
                                    <motion.svg width="28" height="28" viewBox="0 0 24 24" fill="none" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                        <circle cx="12" cy="12" r="10" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="3" />
                                        <path d="M12 2a10 10 0 0 1 10 10" className="stroke-blue-500" strokeWidth="3" strokeLinecap="round" />
                                    </motion.svg>
                                </div>
                            ) : chartData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[200px] text-slate-400 dark:text-slate-500">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-50">
                                        <path d="M3 3v18h18" />
                                        <path d="m19 9-5 5-4-4-3 3" />
                                    </svg>
                                    <span className="text-[13px] font-medium">No progress data yet</span>
                                </div>
                            ) : (
                                <>
                                    {/* Main Chart Area */}
                                    <div className="relative h-[160px] sm:h-[180px] mb-4 pl-8">
                                        {/* Chart Container */}
                                        <div className="relative h-full w-full bg-slate-50/50 dark:bg-slate-800/50 rounded-[16px] border border-slate-100 dark:border-slate-700/50 overflow-visible py-4 pb-10">
                                            {chartData.length > 0 && (
                                                <BarChart 
                                                    data={chartData} 
                                                    xDataKey="date" 
                                                    margin={{ top: 0, right: 8, bottom: 32, left: 8 }}
                                                    aspectRatio="auto"
                                                    className="h-full w-full"
                                                    barGap={0.1}
                                                >
                                                    <Grid horizontal={true} strokeDasharray="4,4" fadeHorizontal={true} />
                                                    <Bar dataKey="totalProgress" fill="#3b82f6" />
                                                    <BarXAxis showAllLabels={false} maxLabels={7} tickFormat={formatDateLabel} />
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

                                    {/* Stats Row */}
                                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                                        {/* Stat 1 */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: 0.5 }}
                                            className="bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100/50 dark:border-blue-500/20 rounded-[16px] p-3 sm:p-4 text-center"
                                        >
                                            <div className="text-[20px] sm:text-[24px] font-black text-blue-600 dark:text-blue-400 tracking-tight leading-none mb-1">
                                                {currentStats.totalProgress}%
                                            </div>
                                            <div className="text-[11px] sm:text-[12px] font-bold text-blue-500/70 dark:text-blue-400/70 uppercase tracking-wide">
                                                Overall Progress
                                            </div>
                                        </motion.div>
                                        
                                        {/* Stat 2 */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: 0.55 }}
                                            className="bg-emerald-50/50 dark:bg-emerald-500/10 border border-emerald-100/50 dark:border-emerald-500/20 rounded-[16px] p-3 sm:p-4 text-center"
                                        >
                                            <div className="text-[20px] sm:text-[24px] font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none mb-1">
                                                {currentStats.completed}
                                            </div>
                                            <div className="text-[11px] sm:text-[12px] font-bold text-emerald-500/70 dark:text-emerald-400/70 uppercase tracking-wide">
                                                Goals Completed
                                            </div>
                                        </motion.div>
                                        
                                        {/* Stat 3 */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: 0.6 }}
                                            className="bg-amber-50/50 dark:bg-amber-500/10 border border-amber-100/50 dark:border-amber-500/20 rounded-[16px] p-3 sm:p-4 text-center"
                                        >
                                            <div className="text-[20px] sm:text-[24px] font-black text-amber-600 dark:text-amber-400 tracking-tight leading-none mb-1">
                                                {currentStats.active}
                                            </div>
                                            <div className="text-[11px] sm:text-[12px] font-bold text-amber-500/70 dark:text-amber-400/70 uppercase tracking-wide">
                                                Active Goals
                                            </div>
                                        </motion.div>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export { ProgressHistoryChart };
