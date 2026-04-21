/**
 * ProgressHistoryChart
 * Visualizes goal progress over time.
 * Extracted from GoalsContent.tsx during Phase 8.3
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { getAggregatedProgressHistory } from '../../../../../services/goalsService';

// Progress History Chart Component
const ProgressHistoryChart: React.FC<{
    isDarkMode: boolean;
    colors: {
        bg: string;
        cardBg: string;
        border: string;
        textPrimary: string;
        textSecondary: string;
        textMuted: string;
        accent: string;
    };
    goals: GoalWithProgress[];
}> = ({ isDarkMode, colors, goals }) => {
    const [historyData, setHistoryData] = useState<{ date: string; completed: number; active: number; totalProgress: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const goalsRef = useRef(goals);
    const hasLoadedRef = useRef(false);

    // Keep goalsRef updated
    useEffect(() => {
        goalsRef.current = goals;
    }, [goals]);

    // Initial load - only runs once
    useEffect(() => {
        const loadHistory = async () => {
            if (!hasLoadedRef.current) {
                setIsLoading(true);
            }
            const data = await getAggregatedProgressHistory(7);
            setHistoryData(data);
            setIsLoading(false);
            hasLoadedRef.current = true;
        };
        loadHistory();
        
        // Refresh every 30 seconds
        const interval = setInterval(loadHistory, 30000);
        return () => clearInterval(interval);
    }, []);

    // Calculate real-time stats from current goals (no loading state needed)
    const currentStats = useMemo(() => {
        const activeGoals = goals.filter(g => g.status === 'active');
        const completedGoals = goals.filter(g => g.status === 'completed');
        
        // Get real-time progress for each active goal
        const realTimeProgressValues = activeGoals.map(goal => {
            const realProgress = getRealTimeProgress(goal);
            const progressPercent = goal.target_value > 0 
                ? Math.min(Math.round((realProgress / goal.target_value) * 100), 100)
                : 0;
            return progressPercent;
        });
        
        // Include completed goals (100% each)
        const completedProgressValues = completedGoals.map(() => 100);
        
        // Calculate average progress across all goals
        const allProgressValues = [...realTimeProgressValues, ...completedProgressValues];
        const avgProgress = allProgressValues.length > 0
            ? Math.round(allProgressValues.reduce((sum, p) => sum + p, 0) / allProgressValues.length)
            : 0;
        
        return {
            totalProgress: avgProgress,
            active: activeGoals.length,
            completed: completedGoals.length,
        };
    }, [goals]);

    // Merge historical data with current real-time stats for today
    const chartData = useMemo(() => {
        if (historyData.length === 0) return historyData;
        
        const today = new Date().toISOString().split('T')[0];
        return historyData.map((entry, index) => {
            // Update today's entry with real-time data
            if (index === historyData.length - 1 && entry.date === today) {
                return {
                    ...entry,
                    ...currentStats,
                };
            }
            return entry;
        });
    }, [historyData, currentStats]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{
                marginBottom: '20px',
                padding: '16px 20px',
                borderRadius: '14px',
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
            }}
        >
            {/* Header */}
            <div 
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: isExpanded ? '16px' : '0',
                    cursor: 'pointer',
                }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <motion.div
                        animate={{ rotate: isExpanded ? 0 : -90 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#3b82f6',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 3v18h18" />
                            <path d="m19 9-5 5-4-4-3 3" />
                        </svg>
                    </motion.div>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
                            Progress History
                        </div>
                        <div style={{ fontSize: '11px', color: colors.textMuted }}>
                            Last 7 days overview
                        </div>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ color: colors.textMuted }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        {isLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px' }}>
                                <motion.svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                >
                                    <circle cx="12" cy="12" r="10" stroke={colors.border} strokeWidth="2.5" />
                                    <path d="M12 2a10 10 0 0 1 10 10" stroke={colors.accent} strokeWidth="2.5" strokeLinecap="round" />
                                </motion.svg>
                            </div>
                        ) : chartData.length === 0 ? (
                            <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                height: '120px',
                                color: colors.textMuted,
                                fontSize: '12px',
                            }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '8px', opacity: 0.5 }}>
                                    <path d="M3 3v18h18" />
                                    <path d="m19 9-5 5-4-4-3 3" />
                                </svg>
                                No progress data yet
                            </div>
                        ) : (
                            <>
                                {/* Mini Line Chart */}
                                <div style={{ position: 'relative', height: '80px', marginBottom: '12px', paddingLeft: '28px' }}>
                                    {/* Y-axis labels */}
                                    <div style={{ 
                                        position: 'absolute', 
                                        left: 0, 
                                        top: 0, 
                                        bottom: 0, 
                                        width: '24px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        paddingTop: '2px',
                                        paddingBottom: '2px',
                                    }}>
                                        {[100, 50, 0].map((val) => (
                                            <span key={val} style={{ 
                                                fontSize: '9px', 
                                                color: colors.textMuted,
                                                textAlign: 'right',
                                                lineHeight: 1,
                                            }}>
                                                {val}
                                            </span>
                                        ))}
                                    </div>
                                    
                                    {/* Chart area */}
                                    <div style={{ 
                                        position: 'relative', 
                                        height: '100%',
                                        background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                    }}>
                                        {/* Grid lines */}
                                        <div style={{ 
                                            position: 'absolute', 
                                            inset: 0, 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            justifyContent: 'space-between',
                                            padding: '0 8px',
                                        }}>
                                            {[0, 1, 2].map((i) => (
                                                <div key={i} style={{ 
                                                    borderBottom: `1px dashed ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
                                                }} />
                                            ))}
                                        </div>
                                        
                                        {/* SVG Chart */}
                                        <svg 
                                            width="100%" 
                                            height="100%" 
                                            viewBox="0 0 100 100" 
                                            preserveAspectRatio="xMidYMid meet"
                                            style={{ position: 'absolute', left: 0, top: 0 }}
                                        >
                                            {/* Gradient fill */}
                                            <defs>
                                                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            
                                            {/* Area fill */}
                                            {chartData.length > 1 && (
                                                <motion.path
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.5, delay: 0.2 }}
                                                    d={(() => {
                                                        const padding = 8;
                                                        const width = 100 - padding * 2;
                                                        const height = 100 - padding * 2;
                                                        const points = chartData.map((d, i) => {
                                                            const x = padding + (i / Math.max(1, chartData.length - 1)) * width;
                                                            const y = padding + (1 - d.totalProgress / 100) * height;
                                                            return { x, y };
                                                        });
                                                        return `M ${points[0].x} ${points[0].y} ${points.map(p => `L ${p.x} ${p.y}`).join(' ')} L ${points[points.length - 1].x} ${padding + height} L ${points[0].x} ${padding + height} Z`;
                                                    })()}
                                                    fill="url(#progressGradient)"
                                                />
                                            )}
                                            
                                            {/* Line */}
                                            {chartData.length > 1 && (
                                                <motion.path
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: 1 }}
                                                    transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                                                    d={(() => {
                                                        const padding = 8;
                                                        const width = 100 - padding * 2;
                                                        const height = 100 - padding * 2;
                                                        const points = chartData.map((d, i) => {
                                                            const x = padding + (i / Math.max(1, chartData.length - 1)) * width;
                                                            const y = padding + (1 - d.totalProgress / 100) * height;
                                                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                                                        });
                                                        return points.join(' ');
                                                    })()}
                                                    fill="none"
                                                    stroke="#3b82f6"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    vectorEffect="non-scaling-stroke"
                                                />
                                            )}
                                            
                                            {/* Data points */}
                                            {chartData.map((d, i) => {
                                                const padding = 8;
                                                const width = 100 - padding * 2;
                                                const height = 100 - padding * 2;
                                                const x = padding + (i / Math.max(1, chartData.length - 1)) * width;
                                                const y = padding + (1 - d.totalProgress / 100) * height;
                                                return (
                                                    <motion.circle
                                                        key={i}
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                                                        cx={x}
                                                        cy={y}
                                                        r="3"
                                                        fill="#fff"
                                                        stroke="#3b82f6"
                                                        strokeWidth="1.5"
                                                        vectorEffect="non-scaling-stroke"
                                                    />
                                                );
                                            })}
                                        </svg>
                                    </div>
                                </div>

                                {/* Day labels */}
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    paddingLeft: '0',
                                    marginBottom: '12px',
                                }}>
                                    {chartData.map((d, i) => (
                                        <motion.span
                                            key={i}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: 0.4 + i * 0.03 }}
                                            style={{ 
                                                fontSize: '10px', 
                                                color: colors.textMuted,
                                                fontWeight: 500,
                                            }}
                                        >
                                            {formatDate(d.date)}
                                        </motion.span>
                                    ))}
                                </div>

                                {/* Stats Row */}
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(3, 1fr)', 
                                    gap: '10px',
                                    padding: '10px',
                                    borderRadius: '10px',
                                    background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                }}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.5 }}
                                        style={{ textAlign: 'center' }}
                                    >
                                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6' }}>
                                            {currentStats.totalProgress}%
                                        </div>
                                        <div style={{ fontSize: '10px', color: colors.textMuted, fontWeight: 500 }}>
                                            Current Progress
                                        </div>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.55 }}
                                        style={{ textAlign: 'center' }}
                                    >
                                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>
                                            {currentStats.completed}
                                        </div>
                                        <div style={{ fontSize: '10px', color: colors.textMuted, fontWeight: 500 }}>
                                            Goals Completed
                                        </div>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.6 }}
                                        style={{ textAlign: 'center' }}
                                    >
                                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b' }}>
                                            {currentStats.active}
                                        </div>
                                        <div style={{ fontSize: '10px', color: colors.textMuted, fontWeight: 500 }}>
                                            Active Goals
                                        </div>
                                    </motion.div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Milestone Badge Icon Component — extracted to ./components/MilestoneIcon.tsx
// GoalMilestone type used locally for GOAL_MILESTONES data
interface GoalMilestone {
    id: string;
    name: string;
    description: string;
    icon: MilestoneIconType;
    color: string;
    requirement: number;
    type: 'created' | 'completed' | 'streak' | 'perfect';
}

const GOAL_MILESTONES: GoalMilestone[] = [
    { id: 'first-goal', name: 'First Goal', description: 'Create your first goal', icon: 'target', color: '#3b82f6', requirement: 1, type: 'created' },
    { id: 'goal-setter', name: 'Goal Setter', description: 'Create 5 goals', icon: 'star', color: '#8b5cf6', requirement: 5, type: 'created' },
    { id: 'ambitious', name: 'Ambitious', description: 'Create 10 goals', icon: 'rocket', color: '#ec4899', requirement: 10, type: 'created' },
    { id: 'first-win', name: 'First Win', description: 'Complete your first goal', icon: 'trophy', color: '#10b981', requirement: 1, type: 'completed' },
    { id: 'achiever', name: 'Achiever', description: 'Complete 5 goals', icon: 'medal', color: '#f59e0b', requirement: 5, type: 'completed' },
    { id: 'champion', name: 'Champion', description: 'Complete 10 goals', icon: 'crown', color: '#eab308', requirement: 10, type: 'completed' },
    { id: 'legend', name: 'Legend', description: 'Complete 25 goals', icon: 'gem', color: '#06b6d4', requirement: 25, type: 'completed' },
];


export { ProgressHistoryChart };
