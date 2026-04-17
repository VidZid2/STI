/**
 * Goals Content - Learning Goals Management Page
 * Matches PathsContent design with minimalistic professional styling
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import {
    fetchGoals,
    createGoal,
    updateGoalStatus,
    updateGoalProgress,
    deleteGoal,
    getGoalStats,
    goalTypeConfig,
    syncAllGoalsProgress,
    getRealTimeProgress,
    getCurrentAbsoluteValue,
    getAggregatedProgressHistory,
    // getSuggestedGoals, // Available for future use
    type GoalWithProgress,
    type GoalType,
    type GoalPriority,
    type GoalStatus,
} from '../../../../services/goalsService';
import { COURSES_DATA } from '../../../../services/pathsService';
import { useNotifications } from '../../../../contexts/NotificationContext';
import { GoalDetailModal, CreateGoalModal, AchievementsModal } from './modals';

// Goal Icon Component
const GoalIcon: React.FC<{ type: GoalType; color: string; size?: number }> = ({ type, color, size = 24 }) => {
    const icons: Record<GoalType, React.ReactNode> = {
        study_time: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </svg>
        ),
        course_completion: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
        ),
        streak: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
        ),
        grade: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        ),
    };
    return <div style={{ color }}>{icons[type]}</div>;
};

// Action Button Tooltip Component
const ActionTooltip: React.FC<{
    children: React.ReactNode;
    label: string;
    color: string;
}> = ({ children, label, color }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            style={{ 
                position: 'relative', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {children}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 2, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '2px',
                            display: 'flex',
                            justifyContent: 'center',
                            pointerEvents: 'none',
                            zIndex: 50,
                        }}
                    >
                        <div style={{
                            position: 'relative',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: '#ffffff',
                            color: color,
                            border: `1px solid ${color}`,
                            fontSize: '11px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        }}>
                            {label}
                            {/* Arrow */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '-6px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: 0,
                                    height: 0,
                                    borderLeft: '6px solid transparent',
                                    borderRight: '6px solid transparent',
                                    borderBottom: `6px solid ${color}`,
                                }}
                            />
                            {/* Inner arrow for white fill */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: 0,
                                    height: 0,
                                    borderLeft: '5px solid transparent',
                                    borderRight: '5px solid transparent',
                                    borderBottom: '5px solid #ffffff',
                                }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Filter tabs type
type FilterTab = 'all' | 'active' | 'completed';

// Priority info helper
const getPriorityInfo = (priority: GoalPriority) => {
    const info = {
        low: { label: 'Low', color: '#94a3b8' },
        medium: { label: 'Medium', color: '#f59e0b' },
        high: { label: 'High', color: '#ef4444' },
    };
    return info[priority];
};

// Format time remaining
const formatTimeRemaining = (days?: number): string => {
    if (days === undefined) return 'No deadline';
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day left';
    if (days < 7) return `${days} days left`;
    if (days < 30) return `${Math.floor(days / 7)} weeks left`;
    return `${Math.floor(days / 30)} months left`;
};

// Progress Ring Component (matching PathsContent style)
// @ts-ignore - Reserved for future use
const _ProgressRingWithTooltip: React.FC<{
    progress: number;
    color: string;
    isDarkMode: boolean;
    index: number;
}> = ({ progress, color, isDarkMode, index }) => {
    const [isHovered, setIsHovered] = useState(false);

    const getDescription = () => {
        if (progress === 100) return 'Complete!';
        if (progress >= 75) return 'Almost there';
        if (progress >= 50) return 'Halfway done';
        if (progress >= 25) return 'Good start';
        if (progress > 0) return 'Just started';
        return 'Not started';
    };

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.2, duration: 0.4 }}
            style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0, cursor: 'pointer' }}
            whileHover={{ scale: 1.08 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, x: 8, scale: 0.85 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 4, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        style={{
                            position: 'absolute',
                            top: '20%',
                            right: '100%',
                            transform: 'translateY(-50%)',
                            marginRight: '10px',
                            padding: '4px 8px',
                            background: '#ffffff',
                            borderRadius: '6px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                            zIndex: 50,
                        }}
                    >
                        <span style={{ fontSize: '11px', fontWeight: 500, color: '#3b82f6' }}>
                            {getDescription()}
                        </span>
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            right: '-5px',
                            transform: 'translateY(-50%) rotate(45deg)',
                            width: '8px',
                            height: '8px',
                            background: '#ffffff',
                            borderRight: '1px solid rgba(59, 130, 246, 0.2)',
                            borderTop: '1px solid rgba(59, 130, 246, 0.2)',
                        }} />
                    </motion.div>
                )}
            </AnimatePresence>
            
            <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                    cx="26"
                    cy="26"
                    r="22"
                    fill="none"
                    stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}
                    strokeWidth="4"
                />
                <motion.circle
                    cx="26"
                    cy="26"
                    r="22"
                    fill="none"
                    stroke={progress === 100 ? '#10b981' : color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 22}
                    initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - progress / 100) }}
                    transition={{ duration: 0.8, delay: index * 0.05 + 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
            </svg>
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '12px',
                fontWeight: 700,
                color: progress === 100 ? '#10b981' : color,
            }}>
                {progress}%
            </div>
        </motion.div>
    );
};

// Filter Tabs Component (matching PathsContent)
const FilterTabs: React.FC<{
    activeFilter: FilterTab;
    setActiveFilter: (filter: FilterTab) => void;
    isDarkMode: boolean;
    colors: { accent: string; textSecondary: string };
}> = ({ activeFilter, setActiveFilter, isDarkMode, colors }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 5, width: 60 });
    
    const tabs: { id: FilterTab; label: string; icon: React.ReactNode }[] = [
        {
            id: 'all',
            label: 'All',
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                </svg>
            ),
        },
        {
            id: 'active',
            label: 'Active',
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            ),
        },
        {
            id: 'completed',
            label: 'Completed',
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            ),
        },
    ];

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const activeIndex = tabs.findIndex(t => t.id === activeFilter);
        const buttons = container.querySelectorAll<HTMLButtonElement>('button[data-filter-tab]');
        
        if (buttons[activeIndex]) {
            const button = buttons[activeIndex];
            const containerRect = container.getBoundingClientRect();
            const buttonRect = button.getBoundingClientRect();
            setIndicatorStyle({
                left: buttonRect.left - containerRect.left,
                width: buttonRect.width,
            });
        }
    }, [activeFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!containerRef.current) return;
            const container = containerRef.current;
            const activeIndex = tabs.findIndex(t => t.id === activeFilter);
            const buttons = container.querySelectorAll<HTMLButtonElement>('button[data-filter-tab]');
            if (buttons[activeIndex]) {
                const button = buttons[activeIndex];
                const containerRect = container.getBoundingClientRect();
                const buttonRect = button.getBoundingClientRect();
                setIndicatorStyle({
                    left: buttonRect.left - containerRect.left,
                    width: buttonRect.width,
                });
            }
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    return (
        <motion.div 
            ref={containerRef}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            style={{
                display: 'flex',
                gap: '4px',
                padding: '4px',
                borderRadius: '12px',
                background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                position: 'relative',
            }}
        >
            <motion.div
                style={{
                    position: 'absolute',
                    top: '4px',
                    bottom: '4px',
                    borderRadius: '8px',
                    background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                    border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                    zIndex: 0,
                }}
                initial={false}
                animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
            
            {tabs.map((tab) => (
                <motion.button
                    key={tab.id}
                    data-filter-tab={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: activeFilter === tab.id ? colors.accent : colors.textSecondary,
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 1,
                        transition: 'color 0.2s ease',
                    }}
                >
                    {tab.icon}
                    {tab.label}
                </motion.button>
            ))}
        </motion.div>
    );
};


// Goal Detail Modal Component (matching PathsContent modal style)
interface GoalDetailModalProps {
    goal: GoalWithProgress | null;
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
    onComplete: (id: string) => void;
}
};


// Goal Type Icons for Modal
const GoalTypeIcons: Record<GoalType, React.ReactNode> = {
    study_time: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    course_completion: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <path d="M8 7h8" /><path d="M8 11h6" />
        </svg>
    ),
    streak: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
    ),
    grade: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    ),
};

// Priority Icons
const PriorityIcons: Record<GoalPriority, React.ReactNode> = {
    low: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19V5" /><path d="m5 12 7-7 7 7" />
        </svg>
    ),
    medium: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 12h8" /><path d="M12 8v8" />
        </svg>
    ),
    high: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3 8 4-4 4 4" /><path d="M7 4v16" />
            <path d="m13 16 4 4 4-4" /><path d="M17 20V4" />
        </svg>
    ),
};

};

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

// Goal Milestone Badge definitions
interface GoalMilestone {
    id: string;
    name: string;
    description: string;
    icon: 'target' | 'trophy' | 'star' | 'flame' | 'rocket' | 'crown' | 'medal' | 'gem';
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

// Milestone Badge Icon Component
const MilestoneIcon: React.FC<{ icon: GoalMilestone['icon']; size?: number }> = ({ icon, size = 16 }) => {
    const icons: Record<GoalMilestone['icon'], React.ReactNode> = {
        target: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
            </svg>
        ),
        trophy: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
        ),
        star: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        ),
        flame: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
        ),
        rocket: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
            </svg>
        ),
        crown: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
            </svg>
        ),
        medal: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />
                <path d="M11 12 5.12 2.2" />
                <path d="m13 12 5.88-9.8" />
                <path d="M8 7h8" />
                <circle cx="12" cy="17" r="5" />
                <path d="M12 18v-2h-.5" />
            </svg>
        ),
        gem: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12l4 6-10 13L2 9Z" />
                <path d="M11 3 8 9l4 13 4-13-3-6" />
                <path d="M2 9h20" />
            </svg>
        ),
    };
    return <>{icons[icon]}</>;
};

// Celebration Animation Component - Minimalistic Blue Theme
const CelebrationAnimation: React.FC<{
    isVisible: boolean;
    onComplete: () => void;
    goalTitle?: string;
}> = ({ isVisible, onComplete, goalTitle }) => {
    const blueAccent = '#3b82f6';
    const blueBg = 'rgba(59, 130, 246, 0.08)';
    const blueBorder = 'rgba(59, 130, 246, 0.15)';
    
    // Subtle confetti particles - blue theme
    const particles = useMemo(() => {
        const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1d4ed8'];
        return Array.from({ length: 30 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            delay: Math.random() * 0.3,
            duration: 2.5 + Math.random() * 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 4 + Math.random() * 6,
            rotation: Math.random() * 360,
            type: Math.random() > 0.6 ? 'circle' : 'rect',
        }));
    }, []);

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onComplete, 4000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onComplete]);

    return createPortal(
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={onComplete}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 10001,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    {/* Subtle confetti */}
                    {particles.map((particle) => (
                        <motion.div
                            key={particle.id}
                            initial={{ 
                                x: `${particle.x}vw`,
                                y: '-5vh',
                                rotate: 0,
                                opacity: 0.8,
                            }}
                            animate={{ 
                                y: '105vh',
                                rotate: particle.rotation + 540,
                                opacity: [0.8, 0.6, 0],
                            }}
                            transition={{
                                duration: particle.duration,
                                delay: particle.delay,
                                ease: 'easeOut',
                            }}
                            style={{
                                position: 'absolute',
                                width: particle.size,
                                height: particle.type === 'rect' ? particle.size * 0.5 : particle.size,
                                background: particle.color,
                                borderRadius: particle.type === 'circle' ? '50%' : '1px',
                                pointerEvents: 'none',
                            }}
                        />
                    ))}

                    {/* Center card */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#ffffff',
                            borderRadius: '20px',
                            padding: '32px 40px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '20px',
                            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                            maxWidth: '340px',
                            textAlign: 'center',
                        }}
                    >
                        {/* Icon */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 25 }}
                            style={{
                                width: 72,
                                height: 72,
                                borderRadius: '18px',
                                background: `linear-gradient(135deg, ${blueAccent} 0%, #2563eb 100%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.35)',
                            }}
                        >
                            <motion.div
                                animate={{ 
                                    scale: [1, 1.1, 1],
                                }}
                                transition={{ 
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            >
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </motion.div>
                        </motion.div>

                        {/* Title */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                        >
                            <h3 style={{
                                margin: 0,
                                fontSize: '22px',
                                fontWeight: 700,
                                color: '#0f172a',
                                letterSpacing: '-0.02em',
                                marginBottom: '6px',
                            }}>
                                Goal Completed!
                            </h3>
                            {goalTitle && (
                                <p style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    color: '#64748b',
                                    lineHeight: 1.5,
                                }}>
                                    {goalTitle}
                                </p>
                            )}
                        </motion.div>

                        {/* Progress indicator */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.35 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                background: blueBg,
                                border: `1px solid ${blueBorder}`,
                                borderRadius: '12px',
                            }}
                        >
                            <div style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: '#10b981',
                            }} />
                            <span style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: blueAccent,
                            }}>
                                100% Complete
                            </span>
                        </motion.div>

                        {/* Dismiss button */}
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.45 }}
                            whileHover={{ scale: 1.02, boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onComplete}
                            style={{
                                padding: '12px 28px',
                                borderRadius: '12px',
                                border: 'none',
                                background: `linear-gradient(135deg, ${blueAccent} 0%, #2563eb 100%)`,
                                color: '#fff',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
                                marginTop: '4px',
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                            Dismiss
                        </motion.button>

                        {/* Subtle ring animation */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: [1, 1.3, 1.5], opacity: [0.3, 0.1, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                            style={{
                                position: 'absolute',
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                border: `2px solid ${blueAccent}`,
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -80%)',
                                pointerEvents: 'none',
                            }}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

};


// Main Goals Content Component
const GoalsContent: React.FC = () => {
    const [goals, setGoals] = useState<GoalWithProgress[]>([]);
    const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, completionRate: 0 });
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<GoalWithProgress | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [completedGoalIds, setCompletedGoalIds] = useState<Set<string>>(new Set());
    const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
    const [celebrationGoal, setCelebrationGoal] = useState<{ id: string; title: string } | null>(null);
    const { addNotification } = useNotifications();

    // Detect dark mode from body class (synced with dashboard)
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof document !== 'undefined') {
            return document.body.classList.contains('dark-mode');
        }
        return false;
    });

    // Listen for dark mode changes
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.body.classList.contains('dark-mode'));
        };
        
        // Initial check
        checkDarkMode();
        
        // Observe body class changes
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        
        return () => observer.disconnect();
    }, []);

    const colors = {
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
        cardBg: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        textPrimary: isDarkMode ? '#f1f5f9' : '#0f172a',
        textSecondary: isDarkMode ? '#94a3b8' : '#475569',
        textMuted: isDarkMode ? '#64748b' : '#64748b',
        accent: '#3b82f6',
    };

    const loadGoals = useCallback(async () => {
        setIsLoading(true);
        // First fetch goals, then sync with real-time data
        const fetchedGoals = await fetchGoals();
        // Sync active goals with real progress from study time, streak, etc.
        const syncedGoals = fetchedGoals.length > 0 ? await syncAllGoalsProgress() : [];
        const fetchedStats = await getGoalStats();
        setGoals(syncedGoals.length > 0 ? syncedGoals : fetchedGoals);
        setStats(fetchedStats);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadGoals();
    }, [loadGoals]);

    // Real-time UI sync - update display every 1 second
    useEffect(() => {
        const uiSyncInterval = setInterval(() => {
            setGoals(prevGoals => {
                const newlyCompleted: GoalWithProgress[] = [];
                const updatedGoals = prevGoals.map(goal => {
                    if (goal.status !== 'active') return goal;
                    const realProgress = getRealTimeProgress(goal);
                    if (realProgress !== goal.current_value) {
                        const updatedGoal = {
                            ...goal,
                            current_value: realProgress,
                            progress_percentage: Math.min(Math.round((realProgress / goal.target_value) * 100), 100),
                        };
                        if (realProgress >= goal.target_value && goal.status === 'active') {
                            updatedGoal.status = 'completed';
                            updatedGoal.completed_at = new Date().toISOString();
                            newlyCompleted.push(updatedGoal);
                        }
                        return updatedGoal;
                    }
                    return goal;
                });
                
                // Trigger notifications for newly completed goals (only if notifications enabled)
                newlyCompleted.forEach(goal => {
                    if (!completedGoalIds.has(goal.id)) {
                        setCompletedGoalIds(prev => new Set(prev).add(goal.id));
                        // Only show notification if user enabled Daily Reminders for this goal
                        if (goal.metadata?.notifications_enabled) {
                            addNotification(
                                'ðŸŽ‰ Goal Achieved!',
                                `Congratulations! You've completed "${goal.title}"`,
                                'system'
                            );
                        }
                        // Also update in database
                        updateGoalStatus(goal.id, 'completed');
                    }
                });
                
                return updatedGoals;
            });
        }, 1000); // Every 1 second for smooth UI updates

        return () => clearInterval(uiSyncInterval);
    }, [completedGoalIds, addNotification]);

    // Database sync - persist progress every 30 seconds
    useEffect(() => {
        const dbSyncInterval = setInterval(() => {
            goals.forEach(goal => {
                if (goal.status !== 'active') return;
                const realProgress = getRealTimeProgress(goal);
                if (realProgress !== goal.current_value) {
                    updateGoalProgress(goal.id, realProgress);
                }
            });
        }, 30000); // Every 30 seconds for database persistence

        return () => clearInterval(dbSyncInterval);
    }, [goals]);

    // Search debounce effect
    useEffect(() => {
        if (searchQuery) {
            setIsSearching(true);
            const timer = setTimeout(() => {
                setIsSearching(false);
            }, 400);
            return () => clearTimeout(timer);
        } else {
            setIsSearching(false);
        }
    }, [searchQuery]);

    const filteredGoals = useMemo(() => {
        let result = [...goals];
        
        if (activeFilter === 'active') {
            result = result.filter(g => g.status === 'active' || g.status === 'paused');
        } else if (activeFilter === 'completed') {
            result = result.filter(g => g.status === 'completed');
        }
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(g => 
                g.title.toLowerCase().includes(query) ||
                g.description?.toLowerCase().includes(query)
            );
        }
        
        return result;
    }, [goals, activeFilter, searchQuery]);

    // Search suggestions - show matching goals as user types
    const searchSuggestions = useMemo(() => {
        if (!searchQuery || searchQuery.length < 1) return [];
        const query = searchQuery.toLowerCase();
        return goals
            .filter(g => 
                g.title.toLowerCase().includes(query) ||
                g.description?.toLowerCase().includes(query)
            )
            .slice(0, 5);
    }, [goals, searchQuery]);

    // Handle keyboard navigation in suggestions
    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setShowSuggestions(false);
            setSearchQuery('');
            searchInputRef.current?.blur();
        } else if (e.key === 'ArrowDown' && showSuggestions && searchSuggestions.length > 0) {
            e.preventDefault();
            setSelectedSuggestionIndex(prev => 
                prev < searchSuggestions.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === 'ArrowUp' && showSuggestions && searchSuggestions.length > 0) {
            e.preventDefault();
            setSelectedSuggestionIndex(prev => 
                prev > 0 ? prev - 1 : searchSuggestions.length - 1
            );
        } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0 && searchSuggestions[selectedSuggestionIndex]) {
            e.preventDefault();
            const selected = searchSuggestions[selectedSuggestionIndex];
            setSearchQuery(selected.title);
            setShowSuggestions(false);
            setSelectedSuggestionIndex(-1);
        }
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
                searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard shortcut "/" to focus search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleCreate = async (goalData: any) => {
        const newGoal = await createGoal(goalData);
        if (newGoal) {
            setGoals(prev => [newGoal, ...prev]);
            loadGoals();
        }
    };


    const handleComplete = async (id: string) => {
        const goal = goals.find(g => g.id === id);
        // Mark as completed in tracking set FIRST to prevent duplicate notifications
        setCompletedGoalIds(prev => new Set(prev).add(id));
        
        const updated = await updateGoalStatus(id, 'completed');
        if (updated) {
            setGoals(prev => prev.map(g => g.id === id ? updated : g));
            // Trigger celebration animation
            setCelebrationGoal({ id, title: goal?.title || 'Goal' });
            // Show notification only if enabled and only once
            if (goal?.metadata?.notifications_enabled) {
                addNotification(
                    'ðŸŽ‰ Goal Achieved!',
                    `Congratulations! You've completed "${goal.title}"`,
                    'system'
                );
            }
            loadGoals();
        }
    };

    const handlePause = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const goal = goals.find(g => g.id === id);
        if (!goal) return;
        const newStatus = goal.status === 'paused' ? 'active' : 'paused';
        const updated = await updateGoalStatus(id, newStatus);
        if (updated) {
            setGoals(prev => prev.map(g => g.id === id ? updated : g));
        }
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirmId(id);
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirmId) return;
        const success = await deleteGoal(deleteConfirmId);
        if (success) {
            setGoals(prev => prev.filter(g => g.id !== deleteConfirmId));
            loadGoals();
        }
        setDeleteConfirmId(null);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                padding: '24px 32px',
                minHeight: '100%',
                background: colors.bg,
            }}
        >
            {/* Header Section - Matching PathsContent */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '24px',
                    padding: '20px 24px',
                    borderRadius: '16px',
                    background: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                }}
            >

                {/* Left side - Title and description */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#3b82f6',
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="6" />
                            <circle cx="12" cy="12" r="2" />
                        </svg>
                    </motion.div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: colors.textPrimary }}>
                                Learning Goals
                            </h1>
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.25 }}
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    color: '#3b82f6',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {stats.total} Goal{stats.total !== 1 ? 's' : ''}
                            </motion.span>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary }}>
                            Track your progress and achieve your learning milestones
                        </p>
                    </div>
                </motion.div>


                {/* Right side - Stats Cards */}
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    style={{ display: 'flex', alignItems: 'stretch', gap: '10px' }}
                >
                    {[
                        { label: 'Total', value: stats.total, desc: 'GOALS', color: '#3b82f6', icon: (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
                            </svg>
                        )},
                        { label: 'Active', value: stats.active, desc: 'IN PROGRESS', color: '#f59e0b', icon: (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                            </svg>
                        )},
                        { label: 'Done', value: stats.completed, desc: 'COMPLETED', color: '#10b981', icon: (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        )},
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 + i * 0.05 }}
                            whileHover={{ y: -2, scale: 1.02 }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '10px 16px',
                                borderRadius: '10px',
                                background: `${stat.color}10`,
                                minWidth: '72px',
                            }}
                        >
                            <div style={{ color: stat.color, marginBottom: '4px' }}>{stat.icon}</div>
                            <span style={{ fontSize: '18px', fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</span>
                            <span style={{ fontSize: '10px', fontWeight: 500, color: colors.textMuted, textTransform: 'uppercase' }}>{stat.desc}</span>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>


            {/* Search and Filter Bar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '24px',
                    flexWrap: 'wrap',
                }}
            >
                {/* Search Input with Suggestions */}
                <motion.div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search goals..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowSuggestions(true);
                            setSelectedSuggestionIndex(-1);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onKeyDown={handleSearchKeyDown}
                        style={{
                            width: '100%',
                            padding: '10px 70px 10px 42px',
                            borderRadius: '10px',
                            border: `1px solid ${colors.border}`,
                            background: colors.cardBg,
                            fontSize: '13px',
                            color: colors.textPrimary,
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                    {/* Keyboard hint */}
                    {!searchQuery && (
                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px', pointerEvents: 'none' }}>
                            <span style={{ fontSize: '10px', color: colors.textMuted, padding: '2px 6px', borderRadius: '4px', background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', fontFamily: 'monospace' }}>/</span>
                        </div>
                    )}
                    {/* Clear button */}
                    {searchQuery && !isSearching && (
                        <div style={{ position: 'absolute', right: '12px', top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}
                                style={{ background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '4px', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </motion.button>
                        </div>
                    )}
                    {/* Loading Spinner */}
                    <AnimatePresence>
                        {isSearching && (
                            <div style={{ position: 'absolute', right: '12px', top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }}>
                                    <motion.svg width="16" height="16" viewBox="0 0 24 24" fill="none" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                                        <circle cx="12" cy="12" r="10" stroke={colors.border} strokeWidth="2.5" />
                                        <path d="M12 2a10 10 0 0 1 10 10" stroke={colors.accent} strokeWidth="2.5" strokeLinecap="round" />
                                    </motion.svg>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                    
                    {/* Search Suggestions Dropdown */}
                    <AnimatePresence>
                        {showSuggestions && searchSuggestions.length > 0 && searchQuery && (
                            <motion.div
                                ref={suggestionsRef}
                                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                                transition={{ duration: 0.15 }}
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    marginTop: '6px',
                                    background: colors.cardBg,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '10px',
                                    boxShadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.12)',
                                    zIndex: 100,
                                    overflow: 'hidden',
                                }}
                            >
                                <div style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Suggestions</span>
                                    <span style={{ fontSize: '9px', color: colors.textMuted }}>â†‘â†“ navigate â€¢ Enter select</span>
                                </div>
                                {searchSuggestions.map((goal, index) => (
                                    <motion.div
                                        key={goal.id}
                                        onClick={() => {
                                            setSearchQuery(goal.title);
                                            setShowSuggestions(false);
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            background: selectedSuggestionIndex === index ? (isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)') : 'transparent',
                                            borderLeft: selectedSuggestionIndex === index ? `2px solid ${colors.accent}` : '2px solid transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                        }}
                                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                                    >
                                        <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '12px', fontWeight: 500, color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.title}</div>
                                            <div style={{ fontSize: '10px', color: colors.textMuted }}>{goal.progress_percentage}% complete â€¢ {goal.status}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <FilterTabs activeFilter={activeFilter} setActiveFilter={setActiveFilter} isDarkMode={isDarkMode} colors={colors} />

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Achievements Button */}
                    <motion.button
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                            default: { duration: 0.15, ease: 'easeOut' },
                            opacity: { delay: 0.35, duration: 0.3 },
                            x: { delay: 0.35, duration: 0.3 }
                        }}
                        whileHover={{ 
                            scale: 1.02,
                            boxShadow: '0 6px 20px rgba(245, 158, 11, 0.25)',
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsAchievementsModalOpen(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            background: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)',
                            color: '#f59e0b',
                            border: `1px solid ${isDarkMode ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)'}`,
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                            <path d="M4 22h16" />
                            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                        </svg>
                        Achievements
                    </motion.button>

                    {/* New Goal Button */}
                    <motion.button
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                            default: { duration: 0.15, ease: 'easeOut' },
                            opacity: { delay: 0.4, duration: 0.3 },
                            x: { delay: 0.4, duration: 0.3 }
                        }}
                        whileHover={{ 
                            scale: 1.02,
                            boxShadow: '0 6px 20px rgba(59, 130, 246, 0.25)',
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsCreateModalOpen(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
                            color: '#3b82f6',
                            border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        New Goal
                    </motion.button>
                </div>
            </motion.div>

            {/* Progress History Chart */}
            <ProgressHistoryChart isDarkMode={isDarkMode} colors={colors} goals={goals} />

            {/* Goals Grid */}
            <AnimatePresence mode="popLayout">
                {isLoading || isSearching ? (
                    // Loading Skeleton
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Search indicator */}
                        {isSearching && searchQuery && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '16px',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    background: 'rgba(59, 130, 246, 0.05)',
                                    border: '1px solid rgba(59, 130, 246, 0.1)',
                                }}
                            >
                                <motion.svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                >
                                    <circle cx="12" cy="12" r="10" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="3" />
                                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                                </motion.svg>
                                <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 500 }}>
                                    Searching for "{searchQuery}"...
                                </span>
                            </motion.div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                            {[1, 2, 3].map((i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{
                                        padding: '20px',
                                        borderRadius: '16px',
                                        background: colors.cardBg,
                                        border: `1px solid ${colors.border}`,
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                        <motion.div animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0,0,0,0.06)' }} />
                                        <div style={{ flex: 1 }}>
                                            <motion.div animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ height: '16px', width: '70%', borderRadius: '4px', background: 'rgba(0,0,0,0.06)', marginBottom: '8px' }} />
                                            <motion.div animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }} style={{ height: '12px', width: '50%', borderRadius: '4px', background: 'rgba(0,0,0,0.04)' }} />
                                        </div>
                                    </div>
                                    {/* Additional skeleton elements */}
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                        <motion.div animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} style={{ height: '20px', width: '60px', borderRadius: '6px', background: 'rgba(0,0,0,0.04)' }} />
                                        <motion.div animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} style={{ height: '20px', width: '80px', borderRadius: '6px', background: 'rgba(0,0,0,0.04)' }} />
                                    </div>
                                    <motion.div animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} style={{ height: '6px', width: '100%', borderRadius: '3px', background: 'rgba(0,0,0,0.06)' }} />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ) : filteredGoals.length === 0 ? (
                    // Empty State
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            padding: '48px 24px',
                            textAlign: 'center',
                            background: colors.cardBg,
                            borderRadius: '16px',
                            border: `1px solid ${colors.border}`,
                        }}
                    >
                        <div style={{
                            width: '64px',
                            height: '64px',
                            margin: '0 auto 16px',
                            borderRadius: '16px',
                            background: 'rgba(59, 130, 246, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
                            </svg>
                        </div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: colors.textPrimary }}>
                            {searchQuery ? 'No goals found' : 'No goals yet'}
                        </p>
                        <p style={{ margin: '8px 0 16px', fontSize: '13px', color: colors.textMuted }}>
                            {searchQuery ? 'Try a different search term' : 'Create your first goal to start tracking'}
                        </p>
                        {!searchQuery && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsCreateModalOpen(true)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 24px',
                                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Create Goal
                            </motion.button>
                        )}
                    </motion.div>
                ) : (
                    // Goals Cards Grid
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                        {filteredGoals.map((goal, index) => {
                            const config = goalTypeConfig[goal.type];
                            const priorityInfo = getPriorityInfo(goal.priority);
                            return (
                                <motion.div
                                    key={goal.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05, type: 'spring', stiffness: 400, damping: 25 }}
                                    whileHover={{ y: -6 }}
                                    onClick={() => setSelectedGoal(goal)}
                                    style={{
                                        padding: '20px',
                                        borderRadius: '16px',
                                        background: colors.cardBg,
                                        border: `1px solid ${goal.status === 'completed' ? 'rgba(16, 185, 129, 0.3)' : colors.border}`,
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                    }}
                                >
                                    {/* Header */}
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                        <motion.div
                                            whileHover={{ scale: 1.08 }}
                                            style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '12px',
                                                background: `${config.color}15`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <GoalIcon type={goal.type} color={config.color} size={24} />
                                        </motion.div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3 style={{
                                                margin: 0,
                                                fontSize: '15px',
                                                fontWeight: 600,
                                                color: colors.textPrimary,
                                                textDecoration: goal.status === 'completed' ? 'line-through' : 'none',
                                                opacity: goal.status === 'completed' ? 0.7 : 1,
                                                paddingRight: goal.status !== 'completed' ? '70px' : '36px',
                                            }}>
                                                {goal.title}
                                            </h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                                                <span style={{
                                                    fontSize: '10px',
                                                    fontWeight: 600,
                                                    color: priorityInfo.color,
                                                    padding: '3px 8px',
                                                    borderRadius: '4px',
                                                    background: `${priorityInfo.color}15`,
                                                }}>
                                                    {priorityInfo.label}
                                                </span>
                                                {goal.days_remaining !== undefined && goal.status !== 'completed' && (
                                                    <span style={{ fontSize: '11px', color: goal.is_overdue ? '#ef4444' : colors.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                                        </svg>
                                                        {formatTimeRemaining(goal.days_remaining)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Action Buttons - Top Right */}
                                        <div style={{ 
                                            display: 'flex', 
                                            gap: '6px',
                                            flexShrink: 0,
                                        }}>
                                            {/* Pause/Resume Button - Only for non-completed goals */}
                                            {goal.status !== 'completed' && (
                                                <ActionTooltip 
                                                    label={goal.status === 'paused' ? 'Resume' : 'Pause'} 
                                                    color={goal.status === 'paused' ? '#3b82f6' : '#f59e0b'}
                                                >
                                                    <motion.button
                                                        whileHover={{ scale: 1.1, backgroundColor: goal.status === 'paused' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)' }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={(e) => handlePause(goal.id, e)}
                                                        style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            borderRadius: '8px',
                                                            border: 'none',
                                                            background: goal.status === 'paused' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                            color: goal.status === 'paused' ? '#3b82f6' : '#f59e0b',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.15s ease',
                                                        }}
                                                    >
                                                        {goal.status === 'paused' ? (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <polygon points="5 3 19 12 5 21 5 3" />
                                                            </svg>
                                                        ) : (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <rect x="6" y="4" width="4" height="16" />
                                                                <rect x="14" y="4" width="4" height="16" />
                                                            </svg>
                                                        )}
                                                    </motion.button>
                                                </ActionTooltip>
                                            )}
                                            {/* Delete Button - Always visible */}
                                            <ActionTooltip label="Delete" color="#ef4444">
                                                    <motion.button
                                                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={(e) => handleDeleteClick(goal.id, e)}
                                                        style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            borderRadius: '8px',
                                                            border: 'none',
                                                            background: 'rgba(239, 68, 68, 0.1)',
                                                            color: '#ef4444',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.15s ease',
                                                        }}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                        </svg>
                                                    </motion.button>
                                                </ActionTooltip>
                                        </div>
                                    </div>


                                    {/* Description */}
                                    {goal.description && (
                                        <p style={{
                                            margin: '0 0 14px',
                                            fontSize: '13px',
                                            color: colors.textSecondary,
                                            lineHeight: 1.5,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}>
                                            {goal.description}
                                        </p>
                                    )}

                                    {/* Stats Row */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 + 0.1 }}
                                        style={{
                                            display: 'flex',
                                            gap: '8px',
                                            marginBottom: '14px',
                                            padding: '12px',
                                            borderRadius: '10px',
                                            background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                        }}
                                    >
                                        <div style={{ flex: 1, textAlign: 'center' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 700, color: config.color, lineHeight: 1 }}>
                                                {goal.type === 'study_time' && goal.unit === 'hours' 
                                                    ? `${Math.floor(goal.current_value)}h ${Math.round((goal.current_value % 1) * 60)}m`
                                                    : goal.current_value}
                                            </div>
                                            <div style={{ fontSize: '9px', color: colors.textMuted, marginTop: '4px', textTransform: 'uppercase' }}>
                                                Current
                                            </div>
                                        </div>
                                        <div style={{ width: '1px', background: colors.border, margin: '4px 0' }} />
                                        <div style={{ flex: 1, textAlign: 'center' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 700, color: config.color, lineHeight: 1 }}>
                                                {goal.type === 'study_time' && goal.unit === 'hours' 
                                                    ? `${goal.target_value}h`
                                                    : goal.target_value}
                                            </div>
                                            <div style={{ fontSize: '9px', color: colors.textMuted, marginTop: '4px', textTransform: 'uppercase' }}>
                                                Target
                                            </div>
                                        </div>
                                        <div style={{ width: '1px', background: colors.border, margin: '4px 0' }} />
                                        <div style={{ flex: 1, textAlign: 'center' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 700, color: goal.progress_percentage === 100 ? '#10b981' : config.color, lineHeight: 1 }}>
                                                {goal.progress_percentage}%
                                            </div>
                                            <div style={{ fontSize: '9px', color: colors.textMuted, marginTop: '4px', textTransform: 'uppercase' }}>
                                                Progress
                                            </div>
                                        </div>
                                    </motion.div>


                                    {/* Progress Bar */}
                                    <div style={{ marginBottom: '14px' }}>
                                        <div style={{
                                            height: '6px',
                                            background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                                            borderRadius: '3px',
                                            overflow: 'hidden',
                                        }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${goal.progress_percentage}%` }}
                                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                                style={{
                                                    height: '100%',
                                                    background: goal.progress_percentage === 100 
                                                        ? 'linear-gradient(90deg, #10b981, #34d399)' 
                                                        : `linear-gradient(90deg, ${config.color}, ${config.color}cc)`,
                                                    borderRadius: '3px',
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Status Badge - Hoverable Button */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}>
                                        <motion.button
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ 
                                                default: { duration: 0.15, ease: 'easeOut' },
                                                opacity: { delay: index * 0.05 + 0.2, duration: 0.3 },
                                                x: { delay: index * 0.05 + 0.2, duration: 0.3 }
                                            }}
                                            whileHover={{ 
                                                scale: 1.05,
                                                boxShadow: goal.status === 'completed' 
                                                    ? '0 4px 12px rgba(16, 185, 129, 0.25)' 
                                                    : goal.status === 'paused' 
                                                    ? '0 4px 12px rgba(245, 158, 11, 0.25)' 
                                                    : '0 4px 12px rgba(59, 130, 246, 0.25)',
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedGoal(goal);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: goal.status === 'completed' 
                                                    ? 'rgba(16, 185, 129, 0.1)' 
                                                    : goal.status === 'paused' 
                                                    ? 'rgba(245, 158, 11, 0.1)' 
                                                    : 'rgba(59, 130, 246, 0.1)',
                                                color: goal.status === 'completed' ? '#10b981' : goal.status === 'paused' ? '#f59e0b' : '#3b82f6',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            <motion.div
                                                animate={goal.status === 'active' ? { 
                                                    scale: [1, 1.2, 1],
                                                } : {}}
                                                transition={{ 
                                                    duration: 1.5, 
                                                    repeat: goal.status === 'active' ? Infinity : 0,
                                                    ease: 'easeInOut'
                                                }}
                                            >
                                                {goal.status === 'completed' ? (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                                ) : goal.status === 'paused' ? (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                                                ) : (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                                )}
                                            </motion.div>
                                            {goal.status === 'completed' ? 'Completed' : goal.status === 'paused' ? 'Paused' : 'In Progress'}
                                        </motion.button>
                                        <motion.div 
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 + 0.25 }}
                                            style={{ 
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '5px 10px',
                                                borderRadius: '8px',
                                                background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                            }}
                                        >
                                            {goal.type === 'study_time' && goal.unit === 'hours' ? (
                                                // Show hours and minutes for study time goals
                                                <>
                                                    <span style={{ 
                                                        fontSize: '12px', 
                                                        fontWeight: 700, 
                                                        color: config.color,
                                                    }}>
                                                        {Math.floor(goal.current_value)}h {Math.round((goal.current_value % 1) * 60)}m
                                                    </span>
                                                    <span style={{ 
                                                        fontSize: '11px', 
                                                        color: colors.textSecondary,
                                                        fontWeight: 400,
                                                    }}>
                                                        of
                                                    </span>
                                                    <span style={{ 
                                                        fontSize: '12px', 
                                                        fontWeight: 600, 
                                                        color: colors.textPrimary,
                                                    }}>
                                                        {goal.target_value}h
                                                    </span>
                                                </>
                                            ) : (
                                                // Default display for other goal types
                                                <>
                                                    <span style={{ 
                                                        fontSize: '12px', 
                                                        fontWeight: 700, 
                                                        color: config.color,
                                                    }}>
                                                        {goal.current_value}
                                                    </span>
                                                    <span style={{ 
                                                        fontSize: '11px', 
                                                        color: colors.textSecondary,
                                                        fontWeight: 400,
                                                    }}>
                                                        of
                                                    </span>
                                                    <span style={{ 
                                                        fontSize: '12px', 
                                                        fontWeight: 600, 
                                                        color: colors.textPrimary,
                                                    }}>
                                                        {goal.target_value}
                                                    </span>
                                                    <span style={{ 
                                                        fontSize: '10px', 
                                                        color: colors.textSecondary,
                                                        fontWeight: 500,
                                                    }}>
                                                        {goal.unit}
                                                    </span>
                                                </>
                                            )}
                                        </motion.div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <CreateGoalModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreate}
                isDarkMode={isDarkMode}
            />
            <GoalDetailModal
                goal={selectedGoal}
                isOpen={!!selectedGoal}
                onClose={() => setSelectedGoal(null)}
                isDarkMode={isDarkMode}
                onComplete={handleComplete}
            />
            <AchievementsModal
                isOpen={isAchievementsModalOpen}
                onClose={() => setIsAchievementsModalOpen(false)}
                isDarkMode={isDarkMode}
                goals={goals}
            />

            {/* Celebration Animation */}
            <CelebrationAnimation
                isVisible={!!celebrationGoal}
                onComplete={() => setCelebrationGoal(null)}
                goalTitle={celebrationGoal?.title}
            />

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmId && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteConfirmId(null)}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0,0,0,0.4)',
                                backdropFilter: 'blur(4px)',
                                zIndex: 9998,
                            }}
                        />
                        <div
                            style={{
                                position: 'fixed',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 9999,
                                pointerEvents: 'none',
                            }}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                style={{
                                    background: colors.cardBg,
                                    borderRadius: '16px',
                                    padding: '24px',
                                    width: '100%',
                                    maxWidth: '360px',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                                    border: `1px solid ${colors.border}`,
                                    pointerEvents: 'auto',
                                }}
                            >
                                {/* Icon */}
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    marginBottom: '16px' 
                                }}>
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '12px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </motion.div>
                                </div>

                                {/* Title */}
                                <h3 style={{
                                    margin: '0 0 8px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    color: colors.textPrimary,
                                    textAlign: 'center',
                                }}>
                                    Delete Goal?
                                </h3>

                                {/* Message */}
                                <p style={{
                                    margin: '0 0 20px',
                                    fontSize: '13px',
                                    color: colors.textSecondary,
                                    textAlign: 'center',
                                    lineHeight: 1.5,
                                }}>
                                    Are you sure you want to delete this goal? This action cannot be undone.
                                </p>

                                {/* Buttons */}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setDeleteConfirmId(null)}
                                        style={{
                                            flex: 1,
                                            padding: '10px 16px',
                                            borderRadius: '10px',
                                            border: `1px solid ${colors.border}`,
                                            background: colors.cardBg,
                                            color: colors.textPrimary,
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02, boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleConfirmDelete}
                                        style={{
                                            flex: 1,
                                            padding: '10px 16px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: '#ef4444',
                                            color: '#ffffff',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        Delete
                                    </motion.button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default GoalsContent;
