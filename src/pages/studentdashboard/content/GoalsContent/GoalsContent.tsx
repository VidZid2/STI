/**
 * Goals Content - Learning Goals Management Page
 * Matches PathsContent design with minimalistic professional styling
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
    type Goal,
    type GoalWithProgress,
} from '../../../../services/goalsService';
import { useNotifications } from '../../../../contexts/NotificationContext';
import GoalIcon from './components/GoalIcon';
import ActionTooltip from './components/ActionTooltip';
import { FilterTabs } from './components/FilterTabs';
import { ProgressHistoryChart } from './components/ProgressHistoryChart';
import { CelebrationAnimation } from './components/CelebrationAnimation';
import GoalDetailModal from './modals/GoalDetailModal';
import CreateGoalModal from './modals/CreateGoalModal';
import AchievementsModal from './modals/AchievementsModal';

// Goal Icon Component — extracted to ./components/GoalIcon.tsx

// Action Button Tooltip Component — extracted to ./components/ActionTooltip.tsx

// Filter tabs type
type FilterTab = 'all' | 'active' | 'completed';

import { getPriorityInfo, formatTimeRemaining } from './shared';

// Progress Ring Component (matching PathsContent style)
// @ts-ignore - Reserved for future use
const _ProgressRingWithTooltip: React.FC<{
    progress: number;
    color: string;
    index: number;
}> = ({ progress, color, index }) => {
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
                    stroke={'var(--bg-hover)'}
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
    const [celebrationGoal, setCelebrationGoal] = useState<{ id: string; title: string } | null>(null);
    const { addNotification } = useNotifications();

    // Detect dark mode from body class (synced with dashboard)

    const colors = {
        bg: 'var(--bg-primary)',
        cardBg: 'var(--bg-secondary)',
        border: 'var(--border-light)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        textMuted: 'var(--text-muted)',
        accent: 'var(--brand-blue)',
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

    const handleCreate = async (goalData: Omit<Goal, 'id' | 'student_id' | 'created_at' | 'updated_at'>) => {
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
                    '🎉 Goal Achieved!',
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
                background: 'var(--bg-primary)',
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
                    background: 'var(--dashboard-surface)',
                    border: `1px solid var(--border-color)`,
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
                            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
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
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
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
                            <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{stat.desc}</span>
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={'var(--text-muted)'} strokeWidth="2" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>
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
                            border: `1px solid var(--border-color)`,
                            background: 'var(--dashboard-surface)',
                            fontSize: '13px',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                    {/* Keyboard hint */}
                    {!searchQuery && (
                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px', pointerEvents: 'none' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-hover)', fontFamily: 'monospace' }}>/</span>
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
                                style={{ background: 'var(--bg-hover)', border: 'none', borderRadius: '4px', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={'var(--text-muted)'} strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </motion.button>
                        </div>
                    )}
                    {/* Loading Spinner */}
                    <AnimatePresence>
                        {isSearching && (
                            <div style={{ position: 'absolute', right: '12px', top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }}>
                                    <motion.svg width="16" height="16" viewBox="0 0 24 24" fill="none" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                                        <circle cx="12" cy="12" r="10" stroke={'var(--border-color)'} strokeWidth="2.5" />
                                        <path d="M12 2a10 10 0 0 1 10 10" stroke={'var(--accent-color)'} strokeWidth="2.5" strokeLinecap="round" />
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
                                    background: 'var(--dashboard-surface)',
                                    border: `1px solid var(--border-color)`,
                                    borderRadius: '10px',
                                    boxShadow: 'var(--shadow-md)',
                                    zIndex: 100,
                                    overflow: 'hidden',
                                }}
                            >
                                <div style={{ padding: '6px 10px', borderBottom: `1px solid var(--border-color)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Suggestions</span>
                                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>↑↓ navigate • Enter select</span>
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
                                            background: selectedSuggestionIndex === index ? ('rgba(59, 130, 246, 0.08)') : 'transparent',
                                            borderLeft: selectedSuggestionIndex === index ? `2px solid var(--accent-color)` : '2px solid transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                        }}
                                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                                    >
                                        <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={'var(--accent-color)'} strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.title}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{goal.progress_percentage}% complete • {goal.status}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <FilterTabs activeFilter={activeFilter} setActiveFilter={setActiveFilter} colors={colors} />

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
                            background: 'rgba(245, 158, 11, 0.08)',
                            color: '#f59e0b',
                            border: `1px solid ${'rgba(245, 158, 11, 0.2)'}`,
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
                            background: 'rgba(59, 130, 246, 0.08)',
                            color: '#3b82f6',
                            border: `1px solid ${'rgba(59, 130, 246, 0.2)'}`,
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
            <ProgressHistoryChart colors={colors} goals={goals} />

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
                                        background: 'var(--dashboard-surface)',
                                        border: `1px solid var(--border-color)`,
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
                            background: 'var(--dashboard-surface)',
                            borderRadius: '16px',
                            border: `1px solid var(--border-color)`,
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
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                            {searchQuery ? 'No goals found' : 'No goals yet'}
                        </p>
                        <p style={{ margin: '8px 0 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
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
                                    className="dashboard-interactive-card"
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`${goal.title} — ${goal.status}, ${goal.progress_percentage}% complete`}
                                    onClick={() => setSelectedGoal(goal)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedGoal(goal); } }}
                                    style={{
                                        padding: '20px',
                                        borderRadius: '16px',
                                        background: 'var(--dashboard-surface)',
                                        border: `1px solid ${goal.status === 'completed' ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                        outline: 'none',
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
                                                color: 'var(--text-primary)',
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
                                                    <span style={{ fontSize: '11px', color: goal.is_overdue ? '#ef4444' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                                            color: 'var(--text-secondary)',
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
                                            background: 'var(--bg-hover)',
                                        }}
                                    >
                                        <div style={{ flex: 1, textAlign: 'center' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 700, color: config.color, lineHeight: 1 }}>
                                                {goal.type === 'study_time' && goal.unit === 'hours' 
                                                    ? `${Math.floor(goal.current_value)}h ${Math.round((goal.current_value % 1) * 60)}m`
                                                    : goal.current_value}
                                            </div>
                                            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase' }}>
                                                Current
                                            </div>
                                        </div>
                                        <div style={{ width: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                                        <div style={{ flex: 1, textAlign: 'center' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 700, color: config.color, lineHeight: 1 }}>
                                                {goal.type === 'study_time' && goal.unit === 'hours' 
                                                    ? `${goal.target_value}h`
                                                    : goal.target_value}
                                            </div>
                                            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase' }}>
                                                Target
                                            </div>
                                        </div>
                                        <div style={{ width: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                                        <div style={{ flex: 1, textAlign: 'center' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 700, color: goal.progress_percentage === 100 ? '#10b981' : config.color, lineHeight: 1 }}>
                                                {goal.progress_percentage}%
                                            </div>
                                            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase' }}>
                                                Progress
                                            </div>
                                        </div>
                                    </motion.div>


                                    {/* Progress Bar */}
                                    <div style={{ marginBottom: '14px' }}>
                                        <div style={{
                                            height: '6px',
                                            background: 'var(--bg-hover)',
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
                                                background: 'var(--bg-hover)',
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
                                                        color: 'var(--text-secondary)',
                                                        fontWeight: 400,
                                                    }}>
                                                        of
                                                    </span>
                                                    <span style={{ 
                                                        fontSize: '12px', 
                                                        fontWeight: 600, 
                                                        color: 'var(--text-primary)',
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
                                                        color: 'var(--text-secondary)',
                                                        fontWeight: 400,
                                                    }}>
                                                        of
                                                    </span>
                                                    <span style={{ 
                                                        fontSize: '12px', 
                                                        fontWeight: 600, 
                                                        color: 'var(--text-primary)',
                                                    }}>
                                                        {goal.target_value}
                                                    </span>
                                                    <span style={{ 
                                                        fontSize: '10px', 
                                                        color: 'var(--text-secondary)',
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
                                    background: 'var(--dashboard-surface)',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    width: '100%',
                                    maxWidth: '360px',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                                    border: `1px solid var(--border-color)`,
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
                                    color: 'var(--text-primary)',
                                    textAlign: 'center',
                                }}>
                                    Delete Goal?
                                </h3>

                                {/* Message */}
                                <p style={{
                                    margin: '0 0 20px',
                                    fontSize: '13px',
                                    color: 'var(--text-secondary)',
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
                                            border: `1px solid var(--border-color)`,
                                            background: 'var(--dashboard-surface)',
                                            color: 'var(--text-primary)',
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
