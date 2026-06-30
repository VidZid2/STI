/**
 * Goals Content - Learning Goals Management Page
 * Matches PathsContent design with minimalistic professional styling
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    fetchGoals,
    createGoal,
    updateGoalProgress,
    updateGoalStatus,
    deleteGoal,
    getGoalStats,
    goalTypeConfig,
    syncAllGoalsProgress,
    getRealTimeProgress,
    // getSuggestedGoals, // Available for future use
} from '../../../../services/goalsService';
import type { GoalWithProgress, GoalPriority } from '../../../../services/goalsService';
import { useNotifications } from '../../../../contexts/NotificationContext';
import GoalIcon from './components/GoalIcon';

import { FilterTabs } from './components/FilterTabs';
import { ProgressHistoryChart } from './components/ProgressHistoryChart';
import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar';
import { triggerGlobalToast } from '../../components/DailyInspirationToast';
import GoalDetailModal from './modals/GoalDetailModal';
import CreateGoalModal from './modals/CreateGoalModal';
import AchievementsModal from './modals/AchievementsModal';
import { EmptyState } from '../CourseViewPage/components/SharedComponents';

type NewGoalData = any;

// Goal Icon Component — extracted to ./components/GoalIcon.tsx

// Action Button Tooltip Component — extracted to ./components/ActionTooltip.tsx

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
    index: number;
}> = ({ progress, color, index }) => {
    const isDarkMode = document.documentElement.classList.contains('dark');
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

// FilterTabs — moved to ./components/FilterTabs.tsx
// GoalDetailModal — moved to ./modals/GoalDetailModal.tsx
// CreateGoalModal — moved to ./modals/CreateGoalModal.tsx
// ProgressHistoryChart — moved to ./components/ProgressHistoryChart.tsx
// CelebrationAnimation — moved to ./components/CelebrationAnimation.tsx
// AchievementsModal — moved to ./modals/AchievementsModal.tsx

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
    const [mobileHistoryPage, setMobileHistoryPage] = useState(0);
    const [goalsPage, setGoalsPage] = useState(0);

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

    const loadGoals = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        // First fetch goals, then sync with real-time data
        const fetchedGoals = await fetchGoals();
        // Sync active goals with real progress from study time, streak, etc.
        const syncedGoals = fetchedGoals.length > 0 ? await syncAllGoalsProgress() : [];
        const fetchedStats = await getGoalStats();
        setGoals(syncedGoals.length > 0 ? syncedGoals : fetchedGoals);
        setStats(fetchedStats);
        if (showLoading) setIsLoading(false);
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
                                '🎉 Goal Achieved!',
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

    // Goals pagination
    const goalsPerPage = 1;
    const totalGoalsPages = Math.ceil(filteredGoals.length / goalsPerPage);
    const paginatedGoals = filteredGoals.slice(goalsPage * goalsPerPage, (goalsPage + 1) * goalsPerPage);

    // Reset goals page when filter or search changes
    useEffect(() => {
        setGoalsPage(0);
    }, [activeFilter, searchQuery]);

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

    const handleCreate = async (goalData: NewGoalData) => {
        const newGoal = await createGoal(goalData);
        if (newGoal) {
            setGoals(prev => [newGoal, ...prev]);
            loadGoals(false);
        }
    };


    const handleComplete = async (id: string) => {
        const goal = goals.find(g => g.id === id);
        // Mark as completed in tracking set FIRST to prevent duplicate notifications
        setCompletedGoalIds(prev => new Set(prev).add(id));
        
        const updated = await updateGoalStatus(id, 'completed');
        if (updated) {
            setGoals(prev => prev.map(g => g.id === id ? updated : g));
            // Trigger global toast notification
            triggerGlobalToast('goal_completed', { title: goal?.title || 'Goal' });
            // Show notification only if enabled and only once
            if (goal?.metadata?.notifications_enabled) {
                addNotification(
                    '🎉 Goal Achieved!',
                    `Congratulations! You've completed "${goal.title}"`,
                    'system'
                );
            }
            loadGoals(false);
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
            loadGoals(false);
        }
        setDeleteConfirmId(null);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto min-h-screen pb-24"
        >
            {/* Header Section - Modernized to match PathsContent */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mt-4 md:mt-0 mb-7"
            >
                <motion.div 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="relative flex flex-col gap-3 sm:gap-4 p-5 sm:p-7 -mx-4 sm:-mx-6 lg:mx-0 rounded-[20px] sm:rounded-[24px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm group transition-all duration-300 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700"
                >
                    {/* Top Row: Title & Action */}
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 min-w-0 w-full sm:w-auto">
                            {/* Circular Progress Module */}
                            <div className="relative flex-shrink-0 mb-1 sm:mb-0">
                                {/* The Circle */}
                                <div className="relative w-[72px] h-[72px] sm:w-[84px] sm:h-[84px]">
                                    {stats.total > 0 ? (
                                        <AnimatedCircularProgressBar
                                            max={100}
                                            min={0}
                                            value={Math.round((stats.completed / stats.total) * 100)}
                                            gaugePrimaryColor="rgb(59, 130, 246)"
                                            gaugeSecondaryColor={isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"}
                                            className="w-full h-full text-blue-500"
                                            hideText={true}
                                        >
                                            {/* Inner Icon Container */}
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                                                whileHover={{ scale: 1.05, rotate: -5, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
                                                className="absolute flex items-center justify-center shadow-sm transition-all duration-500 inset-0 m-auto w-[44px] h-[44px] sm:w-[52px] sm:h-[52px] rounded-full bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20"
                                            >
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-600 dark:text-blue-400 transition-all duration-500 sm:w-7 sm:h-7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <circle cx="12" cy="12" r="6" />
                                                    <circle cx="12" cy="12" r="2" />
                                                </svg>
                                            </motion.div>
                                        </AnimatedCircularProgressBar>
                                    ) : (
                                        <div className="w-full h-full relative">
                                            {/* Inner Icon Container (Empty State) */}
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                                                whileHover={{ scale: 1.05, rotate: -5, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
                                                className="absolute flex items-center justify-center shadow-sm transition-all duration-500 inset-0 m-auto w-[56px] h-[56px] sm:w-[60px] sm:h-[60px] rounded-[16px] sm:rounded-[20px] bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100 dark:from-blue-500/10 dark:to-blue-500/5 dark:border-blue-500/20"
                                            >
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-600 dark:text-blue-400 transition-all duration-500 w-8 h-8 sm:w-10 sm:h-10" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <circle cx="12" cy="12" r="6" />
                                                    <circle cx="12" cy="12" r="2" />
                                                </svg>
                                            </motion.div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Overlapping Custom Badge */}
                                {stats.total > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, x: "-50%", scale: 0.8 }}
                                        animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
                                        transition={{ duration: 0.4, delay: 0.4, type: "spring", stiffness: 300, damping: 20 }}
                                        className="absolute -bottom-1.5 sm:-bottom-2 left-1/2 px-1.5 sm:px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border-[2px] sm:border-[2.5px] border-white dark:border-slate-800 shadow-sm flex items-center justify-center whitespace-nowrap z-10 min-w-[36px] sm:min-w-[40px]"
                                    >
                                        <span className="text-[11px] sm:text-[13px] font-bold text-slate-700 dark:text-slate-200 leading-none" style={{ paddingTop: '1px' }}>
                                            {Math.round((stats.completed / stats.total) * 100)}%
                                        </span>
                                    </motion.div>
                                )}
                            </div>
                            
                            {/* Title & Description */}
                            <div className="min-w-0 flex flex-col justify-center items-center sm:items-start py-1">
                                <div className="flex items-center justify-center sm:justify-start gap-3 mb-2 sm:mb-3 flex-wrap">
                                    <h1 className="text-xl sm:text-[26px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                                        Learning Goals
                                    </h1>
                                </div>
                                <p className="text-sm sm:text-[14.5px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl text-center sm:text-left">
                                    Track your progress and achieve your learning milestones. Set clear objectives and monitor your daily progression.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Detailed Metrics */}
                    <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-2 sm:mt-0">
                        {/* Metric 1 */}
                        <motion.div 
                            className="flex flex-col p-3 sm:p-4 rounded-[16px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <circle cx="12" cy="12" r="6" />
                                        <circle cx="12" cy="12" r="2" />
                                    </svg>
                                </div>
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Goals</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{stats.total}</span>
                                <span className="text-xs font-medium text-slate-500">Created</span>
                            </div>
                        </motion.div>

                        {/* Metric 2 */}
                        <motion.div 
                            className="flex flex-col p-3 sm:p-4 rounded-[16px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </div>
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Active Focus</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{stats.active}</span>
                                <span className="text-xs font-medium text-slate-500">In Progress</span>
                            </div>
                        </motion.div>

                        {/* Metric 3 */}
                        <motion.div 
                            className="flex flex-col p-3 sm:p-4 rounded-[16px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 col-span-2 md:col-span-1"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Achievements</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{stats.completed}</span>
                                <span className="text-xs font-medium text-slate-500">Completed</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Search and Filter Bar Moved Inside Header */}

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative z-30 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 shadow-sm rounded-[20px] p-3 sm:p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-5 mt-4 sm:mt-5 w-full transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                    >
                {/* Search Input with Suggestions */}
                <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="relative flex-1 min-w-[220px] group/search"
                >
                    <svg className="absolute left-3.5 top-0 bottom-0 my-auto w-4 h-4 text-slate-400 z-10 transition-colors duration-200 group-focus-within/search:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-11 pr-20 py-2 text-sm font-semibold focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all duration-300 text-slate-900 placeholder-slate-400 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/10"
                    />
                    
                    <div className="absolute right-3 top-0 bottom-0 flex items-center justify-center z-10 w-6">
                        <AnimatePresence mode="wait">
                            {isSearching ? (
                                <motion.div
                                    key="spinner"
                                    initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                    className="w-6 h-6 flex items-center justify-center"
                                >
                                    <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                </motion.div>
                            ) : searchQuery ? (
                                <motion.button
                                    key="clear"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={() => {
                                        setSearchQuery('');
                                        setShowSuggestions(false);
                                        searchInputRef.current?.focus();
                                    }}
                                    className="!w-5 !h-5 !min-w-[20px] !min-h-[20px] !p-0 flex items-center justify-center rounded-[6px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </motion.button>
                            ) : (
                                <motion.kbd
                                    key="hint"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500 dark:shadow-none pointer-events-none"
                                >
                                    /
                                </motion.kbd>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    {/* Search Suggestions Dropdown */}
                    <AnimatePresence>
                        {showSuggestions && searchSuggestions.length > 0 && searchQuery && (
                            <motion.div
                                ref={suggestionsRef}
                                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 dark:bg-slate-800 dark:border-slate-700 dark:shadow-none z-50 overflow-hidden"
                            >
                                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Suggestions</span>
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">↑↓ navigate • Enter select</span>
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 sm:hidden">Tap to select</span>
                                </div>
                                <div className="flex flex-col">
                                    {searchSuggestions.map((goal, index) => {
                                        const isSelected = selectedSuggestionIndex === index;
                                        return (
                                            <motion.div
                                                key={goal.id}
                                                onClick={() => {
                                                    setSearchQuery(goal.title);
                                                    setShowSuggestions(false);
                                                }}
                                                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors border-l-2 ${
                                                    isSelected 
                                                        ? 'bg-blue-50/50 dark:bg-blue-500/10 border-blue-500' 
                                                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                }`}
                                                onMouseEnter={() => setSelectedSuggestionIndex(index)}
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                    isSelected 
                                                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' 
                                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                        <polyline points="22 4 12 14.01 9 11.01" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                                        {goal.title}
                                                    </div>
                                                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                        <span>{goal.progress_percentage}% complete</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                                        <span className="capitalize">{goal.status}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full lg:w-auto lg:ml-auto">
                    <FilterTabs activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

                    {/* Action Buttons */}
                    <div className="flex flex-1 sm:flex-none items-center gap-2">
                        {/* Achievements Button */}
                        <motion.button
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ 
                                default: { duration: 0.15, ease: 'easeOut' },
                                opacity: { delay: 0.35, duration: 0.3 },
                                x: { delay: 0.35, duration: 0.3 }
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsAchievementsModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 font-bold py-2 px-3 sm:py-2.5 sm:px-4 rounded-[12px] sm:rounded-[14px] transition-colors shadow-sm bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 focus:outline-none text-[12px] sm:text-[13px] whitespace-nowrap"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-[18px] sm:h-[18px]">
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
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 font-bold py-2 px-3 sm:py-2.5 sm:px-4 rounded-[12px] sm:rounded-[14px] transition-colors shadow-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 focus:outline-none text-[12px] sm:text-[13px] whitespace-nowrap"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-[18px] sm:h-[18px]">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            New Goal
                        </motion.button>
                    </div>
                </div>
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Main Layout Grid */}
            <div className="flex flex-col xl:flex-row gap-6 xl:items-stretch w-full">
                
                {/* Left Side: Goals Grid */}
                <div className="flex-1 min-w-0 order-2 xl:order-1 w-full flex flex-col">
                    {/* Goals Grid */}
                    <AnimatePresence mode="popLayout">
                {isLoading || isSearching ? (
                    // Loading Skeleton
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
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
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="col-span-full -mx-4 sm:-mx-6 lg:mx-0 flex-1 flex flex-col"
                    >
                        <EmptyState
                            icon={
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
                                </svg>
                            }
                            title={searchQuery ? `No goals match "${searchQuery}"` : "No goals yet"}
                            description={searchQuery ? 'Try a different search term' : 'Create your first goal to start tracking'}
                            className="py-16 flex-1 h-full"
                            action={searchQuery ? {
                                label: 'Clear search',
                                onClick: () => {
                                    setSearchQuery('');
                                    if (searchInputRef.current) searchInputRef.current.focus();
                                }
                            } : {
                                label: 'Create Goal',
                                onClick: () => setIsCreateModalOpen(true)
                            }}
                        />
                    </motion.div>
                ) : (
                    // Goals Cards Grid
                    <div className="-mx-4 sm:-mx-6 lg:mx-0 flex-1 flex flex-col">
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 shadow-sm rounded-[20px] p-4 transition-all duration-300 hover:shadow-md cursor-default overflow-hidden flex flex-col h-full">
                                <motion.div layout className="grid gap-[24px] min-h-[180px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))' }}>
                                    <AnimatePresence mode="wait">
                                        {paginatedGoals.map((goal) => {
                                            const config = goalTypeConfig[goal.type];
                                            const priorityInfo = getPriorityInfo(goal.priority);
                                            return (
                                                <motion.div
                                                    key={goal.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
                                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                                    exit={{ opacity: 0, y: -10, filter: 'blur(5px)', transition: { duration: 0.15 } }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                    onClick={() => setSelectedGoal(goal)}
                                            className={`relative flex flex-col p-[24px] rounded-[24px] cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 bg-slate-50/50 dark:bg-slate-900/50 border group/goalcard ${
                                                goal.status === 'completed' 
                                                    ? 'border-emerald-500/40 dark:border-emerald-500/30' 
                                                    : 'border-slate-200 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-700'
                                            }`}
                                        >

                                    {/* Action Buttons floating top right */}
                                    <div className="absolute top-5 right-5 flex items-center gap-2 z-20">
                                        {goal.status !== 'completed' && (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handlePause(goal.id, e); }}
                                                className={`flex items-center justify-center w-11 h-11 rounded-[14px] transition-colors focus:outline-none shrink-0 ${
                                                    goal.status === 'paused'
                                                        ? 'bg-blue-50 text-blue-500 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'
                                                        : 'bg-[#fff8e6] text-amber-500 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50'
                                                }`}
                                            >
                                                {goal.status === 'paused' ? (
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                                ) : (
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                                                )}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(goal.id, e); }}
                                            className="flex items-center justify-center w-11 h-11 rounded-[14px] bg-slate-50 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:bg-slate-800/50 dark:text-slate-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 focus:outline-none shrink-0"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* New Header Layout */}
                                    <div className="flex items-start gap-3 mb-3 relative z-10 pr-[80px]">
                                        <motion.div
                                            whileHover={{ scale: 1.05, rotate: 5 }}
                                            className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
                                            style={{
                                                background: `linear-gradient(135deg, ${config.color}22, ${config.color}11)`,
                                                border: `1px solid ${config.color}33`,
                                            }}
                                        >
                                            <GoalIcon type={goal.type} color={config.color} size={22} />
                                        </motion.div>
                                        
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <h3 className="text-[16px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight truncate mb-1.5"
                                                style={{ textDecoration: goal.status === 'completed' ? 'line-through' : 'none', opacity: goal.status === 'completed' ? 0.7 : 1 }}>
                                                {goal.title}
                                            </h3>
                                            
                                            {/* Badges immediately under title */}
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span style={{ color: priorityInfo.color, background: `${priorityInfo.color}15`, border: `1px solid ${priorityInfo.color}33` }} 
                                                      className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                                    {priorityInfo.label}
                                                </span>
                                                {goal.days_remaining !== undefined && goal.status !== 'completed' && (
                                                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${
                                                        goal.is_overdue 
                                                            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400' 
                                                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-500 dark:text-slate-400'
                                                    }`}>
                                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                                        <span className="text-[9.5px] font-bold uppercase tracking-wider">{formatTimeRemaining(goal.days_remaining)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description and Metadata */}
                                    <div className="mb-5 flex flex-col gap-1.5 relative z-10">
                                        {goal.metadata?.course_title && (
                                            <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 dark:text-slate-400 truncate">
                                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                                {goal.metadata.course_title}
                                            </div>
                                        )}
                                        {goal.description && (
                                            <p className="m-0 text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 mt-1">
                                                {goal.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Unified Stats & Progress Section - PathsContent Style */}
                                    <div className="mt-auto flex flex-col gap-4 relative z-10 w-full">
                                        


                                        {/* Circular Progress & Status */}
                                        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 w-full pt-4 border-t border-slate-200 dark:border-slate-600/60">
                                            <div className="flex items-center gap-3 min-w-0 w-full lg:w-auto">
                                                <div className="relative shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-100 dark:border-slate-700/50 shadow-sm p-1 group-hover/goalcard:shadow-md transition-shadow">
                                                    <AnimatedCircularProgressBar
                                                        max={100}
                                                        min={0}
                                                        value={goal.progress_percentage}
                                                        gaugePrimaryColor={goal.status === 'completed' ? '#10b981' : config.color}
                                                        gaugeSecondaryColor={isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
                                                        className="h-10 w-10 sm:h-11 sm:w-11 text-[10px] text-slate-800 dark:text-slate-200 font-bold"
                                                    />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[13px] sm:text-[14px] font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                                                        {goal.status === 'completed' ? 'Goal Reached!' : goal.status === 'paused' ? 'Paused' : 'In Progress'}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-[10.5px] font-bold text-slate-600 dark:text-slate-300">
                                                            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            {goal.type === 'study_time' && goal.unit === 'hours' ? (
                                                                <>{Math.floor(goal.current_value)}h {Math.round((goal.current_value % 1) * 60)}m / {goal.target_value}h</>
                                                            ) : (
                                                                <>{goal.current_value} / {goal.target_value} {goal.unit}</>
                                                            )} completed
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={(e) => { e.stopPropagation(); setSelectedGoal(goal); }}
                                                className={`flex w-full lg:flex-1 items-center justify-center gap-2 rounded-[14px] py-2.5 px-4 font-bold transition-colors shadow-sm focus:outline-none ${
                                                    goal.status === 'completed' 
                                                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/50 dark:hover:bg-emerald-900/70 dark:text-emerald-300' 
                                                        : goal.status === 'paused'
                                                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/50 dark:hover:bg-amber-900/70 dark:text-amber-300'
                                                        : 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 dark:text-blue-300'
                                                }`}
                                            >
                                                View Details
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                            </AnimatePresence>
                        </motion.div>

                            {/* Pagination Controls - inside card */}
                            {filteredGoals.length > 0 && (
                                <div className="pt-4 mt-auto">
                                    <div className="flex items-center justify-between w-full gap-2 bg-slate-50/50 dark:bg-slate-900/50 p-1.5 rounded-[14px] border border-slate-100 dark:border-slate-700/50 transition-all duration-300">
                                        <button 
                                            type="button"
                                            onClick={() => setGoalsPage(prev => Math.max(0, prev - 1))} 
                                            disabled={goalsPage === 0}
                                            className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all shadow-sm cursor-pointer border ${
                                                goalsPage === 0
                                                    ? 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800/40 text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-500 hover:text-blue-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 hover:border-blue-300 dark:hover:border-blue-500'
                                            }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                        </button>
                                        <span className="text-[13px] text-slate-500 dark:text-slate-400 text-center tracking-wide flex-1 font-medium">
                                            Page <span className="text-blue-600 dark:text-blue-400 font-bold mx-0.5 text-[14px]">{goalsPage + 1}</span> <span className="text-slate-300 dark:text-slate-600 font-medium mx-1">/</span> {totalGoalsPages}
                                        </span>
                                        <button 
                                            type="button"
                                            onClick={() => setGoalsPage(prev => Math.min(totalGoalsPages - 1, prev + 1))} 
                                            disabled={goalsPage === totalGoalsPages - 1}
                                            className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all shadow-sm cursor-pointer border ${
                                                goalsPage === totalGoalsPages - 1
                                                    ? 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800/40 text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-500 hover:text-blue-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 hover:border-blue-300 dark:hover:border-blue-500'
                                            }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                    </AnimatePresence>
                </div>
                
                {/* Right Side: Progress History Chart */}
                <div className="flex-1 min-w-0 w-full order-1 xl:order-2 xl:sticky xl:top-6 flex flex-col">
                    <div className="hidden xl:block -mx-4 sm:-mx-6 lg:mx-0 flex-1 flex flex-col">
                        <ProgressHistoryChart goals={filteredGoals} />
                    </div>
                    
                    {/* Mobile-Friendly Progress Summary */}
                    <div className="block xl:hidden mb-6 -mx-4 sm:-mx-6 lg:mx-0">
                        <div className="bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200/60 dark:border-slate-700/50 p-5 sm:p-6 shadow-sm">
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-12 h-12 rounded-[14px] bg-blue-50/80 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 3v18h18" />
                                        <path d="m19 9-5 5-4-4-3 3" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-[16px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">Progress Overview</h3>
                                    <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Your learning journey</p>
                                </div>
                            </div>


                            {/* Recent History List */}
                            <div className="mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-700/50">
                                <h4 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4">Recent Activity</h4>
                                <div className="flex flex-col gap-3">
                                    {(() => {
                                        const sortedGoals = goals.slice().sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
                                        const itemsPerPage = 3;
                                        const totalPages = Math.ceil(sortedGoals.length / itemsPerPage);
                                        const paginatedGoals = sortedGoals.slice(mobileHistoryPage * itemsPerPage, (mobileHistoryPage + 1) * itemsPerPage);

                                        if (sortedGoals.length === 0) {
                                            return (
                                                <div className="text-center py-4">
                                                    <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">No recent activity yet</p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <>
                                                <AnimatePresence mode="wait">
                                                    <motion.div
                                                        key={mobileHistoryPage}
                                                        initial={{ opacity: 0, x: 10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -10 }}
                                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                                        className="flex flex-col gap-3"
                                                    >
                                                        {paginatedGoals.map((goal) => (
                                                            <div key={goal.id} className="bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-[16px] p-3 flex items-center justify-between shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer group">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0 border bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50 transition-colors group-hover:border-blue-300 dark:group-hover:border-blue-700">
                                                                        <GoalIcon type={goal.type} color="currentColor" size={20} />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1 text-left flex flex-col justify-center">
                                                                        <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest leading-none mb-1 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-300">
                                                                            {goal.type.replace('_', ' ')}
                                                                        </p>
                                                                        <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-snug truncate w-full transition-colors group-hover:text-blue-700 dark:group-hover:text-blue-400">
                                                                            {goal.title}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                                                    <div className="flex flex-col items-end gap-1.5">
                                                                        <div className="flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-700 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 bg-slate-50 dark:bg-slate-800/50 transition-colors group-hover:border-blue-200/80 dark:group-hover:border-blue-800/50 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/20">
                                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 transition-colors group-hover:text-blue-500 dark:group-hover:text-blue-400 hidden sm:block">
                                                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                                                <line x1="3" y1="10" x2="21" y2="10" />
                                                                            </svg>
                                                                            <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                                                {new Date(goal.updated_at || goal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                            </span>
                                                                        </div>
                                                                        {(new Date().getTime() - new Date(goal.updated_at || goal.created_at).getTime()) > 30 * 24 * 60 * 60 * 1000 && (
                                                                            <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-[4px]">
                                                                                Archived
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    {/* Delete / Hide Button */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(goal.id, e); }}
                                                                        className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100/50 text-slate-400 transition-all hover:bg-red-100 hover:text-red-500 dark:bg-slate-800/50 dark:hover:bg-red-900/30 dark:hover:text-red-400 focus:outline-none"
                                                                        title="Delete from History"
                                                                    >
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </motion.div>
                                                </AnimatePresence>

                                                {/* Pagination Controls */}
                                                {totalPages > 1 && (
                                                    <div className="w-full pt-2.5 mt-1">
                                                        <div className="flex items-center justify-between w-full gap-2 bg-white dark:bg-slate-800/80 p-1.5 rounded-[14px] border border-slate-200/80 dark:border-slate-700/60 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500">
                                                            <button 
                                                                type="button"
                                                                onClick={() => setMobileHistoryPage(prev => Math.max(0, prev - 1))} 
                                                                disabled={mobileHistoryPage === 0}
                                                                className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all shadow-sm cursor-pointer border ${
                                                                    mobileHistoryPage === 0
                                                                        ? 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-700/40 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 hover:text-blue-600 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 hover:border-blue-300 dark:hover:border-blue-500'
                                                                }`}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                                            </button>
                                                            <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 text-center tracking-wide flex-1">
                                                                Page {mobileHistoryPage + 1} <span className="text-slate-400 dark:text-slate-500 font-medium mx-0.5">/</span> {totalPages}
                                                            </span>
                                                            <button 
                                                                type="button"
                                                                onClick={() => setMobileHistoryPage(prev => Math.min(totalPages - 1, prev + 1))} 
                                                                disabled={mobileHistoryPage === totalPages - 1}
                                                                className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all shadow-sm cursor-pointer border ${
                                                                    mobileHistoryPage === totalPages - 1
                                                                        ? 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-700/40 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 hover:text-blue-600 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 hover:border-blue-300 dark:hover:border-blue-500'
                                                                }`}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CreateGoalModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreate}
            />
            <GoalDetailModal
                goal={selectedGoal}
                isOpen={!!selectedGoal}
                onClose={() => setSelectedGoal(null)}
                onComplete={handleComplete}
            />
            <AchievementsModal
                isOpen={isAchievementsModalOpen}
                onClose={() => setIsAchievementsModalOpen(false)}
                goals={goals}
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
                                <div className="flex flex-col gap-2.5 mt-2">
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleConfirmDelete}
                                        className="w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-[14px] transition-colors shadow-sm bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 focus:outline-none"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>
                                        Delete Goal
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setDeleteConfirmId(null)}
                                        className="w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-[14px] transition-colors shadow-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
                                    >
                                        Cancel
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
