/**
 * GoalDetailModal
 * Detailed view/edit modal for a single goal.
 * Extracted from GoalsContent.tsx during Phase 8.3
 */
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    goalTypeConfig,
    type GoalWithProgress,
} from '../../../../../services/goalsService';
import GoalIcon from '../components/GoalIcon';
import { getPriorityInfo, formatTimeRemaining } from '../shared';
// import { ModalTooltip } from '../../PathsContent/components/PathProgressRing';

export interface GoalDetailModalProps {
    goal: GoalWithProgress | null;
    isOpen: boolean;
    onClose: () => void;
    onComplete: (goalId: string) => void;
}

const GoalDetailModal: React.FC<GoalDetailModalProps> = ({
    goal,
    isOpen,
    onClose,
    onComplete,
}) => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    const colors = {
        bg: isDarkMode ? '#0f172a' : '#ffffff',
        cardBg: isDarkMode ? '#1e293b' : '#f8fafc',
        border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        textPrimary: isDarkMode ? '#f1f5f9' : '#0f172a',
        textSecondary: isDarkMode ? '#94a3b8' : '#475569',
        textMuted: isDarkMode ? '#94a3b8' : '#334155',
        accent: '#3b82f6',
    };



    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!goal) return null;

    const config = goalTypeConfig[goal.type];
    const priorityInfo = getPriorityInfo(goal.priority);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 9998,
                        }}
                    />

                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        pointerEvents: 'none',
                        padding: '20px',
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            style={{
                                width: '100%',
                                maxWidth: '480px',
                                maxHeight: '85vh',
                                background: colors.bg,
                                borderRadius: '20px',
                                boxShadow: isDarkMode
                                    ? '0 24px 48px rgba(0, 0, 0, 0.4)'
                                    : '0 24px 48px rgba(0, 0, 0, 0.15)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                pointerEvents: 'auto',
                            }}
                        >
                            {/* Header */}
                            <motion.div 
                                style={{ padding: '12px 16px' }}
                                className="relative z-10 shrink-0 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-t-[20px]"
                            >
                                {/* Student Tools Style Header Card */}
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
                                    className={`relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[20px] sm:rounded-[24px] flex items-center group transition-all duration-300 hover:shadow-md hover:border-slate-300/80 dark:hover:border-slate-700/50 text-left p-[12px_16px] gap-[12px] mb-0`}
                                >
                                    {/* SaaS Background Accents */}
                                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" style={{ backgroundColor: `${config.color}15` }} aria-hidden="true" />
                                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" style={{ backgroundColor: `${config.color}10` }} aria-hidden="true" />

                                    <motion.div
                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                        className={`flex items-center justify-center flex-shrink-0 shadow-sm relative z-10 w-[40px] h-[40px] rounded-[12px]`}
                                        style={{
                                            background: `linear-gradient(135deg, ${config.color}20 0%, ${config.color}10 100%)`,
                                            border: `1px solid ${config.color}30`,
                                            color: config.color
                                        }}
                                    >
                                        <div className="sm:hidden flex items-center justify-center"><GoalIcon type={goal.type} color={config.color} size={20} /></div>
                                        <div className="hidden sm:flex items-center justify-center"><GoalIcon type={goal.type} color={config.color} size={24} /></div>
                                    </motion.div>

                                    <div className="relative z-10 flex-1 min-w-0 pr-2 sm:pr-4">
                                        <h2 
                                            className={`font-bold text-zinc-900 dark:text-zinc-100 tracking-tight m-0 mb-0.5 sm:mb-1 truncate transition-all duration-300 text-[16px]`}
                                        >
                                            {goal.title}
                                        </h2>
                                        
                                        {/* Description hidden in compact mode */}

                                        <div 
                                            className={`flex flex-wrap items-center overflow-hidden transition-all duration-300 mt-[2px] gap-[6px] max-h-[24px]`}
                                        >
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-500/10 text-[11px] sm:text-[12px] font-medium whitespace-nowrap" style={{ color: priorityInfo.color, backgroundColor: `${priorityInfo.color}15` }}>
                                                {priorityInfo.label} Priority
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-[11px] sm:text-[12px] font-medium whitespace-nowrap" style={{ color: config.color, backgroundColor: `${config.color}15` }}>
                                                {config.label}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative z-20 self-start sm:self-center">
                                        <motion.button
                                            onClick={onClose}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="flex-shrink-0 flex items-center justify-center rounded-lg sm:rounded-xl border border-zinc-200/80 bg-white/80 backdrop-blur-md p-2 text-zinc-500 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700/80 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                            aria-label="Close modal"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </motion.button>
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* Progress Section */}
                            <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
                                {/* Overall Progress */}
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth="2">
                                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                            </svg>
                                            <span style={{ fontSize: '13px', fontWeight: 500, color: colors.textPrimary }}>Overall Progress</span>
                                        </div>
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: config.color }}>{goal.progress_percentage}%</span>
                                    </div>
                                    <div className="w-full h-3 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.15)] border border-black/5 dark:border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${goal.progress_percentage}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="h-full rounded-full relative"
                                            style={{
                                                background: goal.progress_percentage === 100 
                                                    ? 'linear-gradient(90deg, #10b981, #34d399)' 
                                                    : `linear-gradient(90deg, ${config.color}, ${config.color}cc)`,
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Stats Row */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="flex items-center justify-between gap-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 shadow-sm rounded-[20px] p-4 mb-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default"
                                >
                                    {/* Column 1 */}
                                    <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 px-1 sm:px-2">
                                        <div className="text-slate-400 dark:text-slate-500 shrink-0">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col text-left min-w-0">
                                            <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-tight mb-1">
                                                Progress
                                            </div>
                                            <div className="text-[14px] sm:text-[15px] font-bold leading-none truncate" style={{ color: config.color }}>
                                                {goal.type === 'study_time' && goal.unit === 'hours' 
                                                    ? `${Math.floor(goal.current_value)}h ${Math.round((goal.current_value % 1) * 60)}m / ${goal.target_value}h`
                                                    : `${goal.current_value}/${goal.target_value}`}
                                            </div>
                                            {!(goal.type === 'study_time' && goal.unit === 'hours') && (
                                                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-none">
                                                    {goal.unit}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Divider 1 */}
                                    <div className="w-[1px] h-8 bg-slate-200/60 dark:bg-slate-700/60" />

                                    {/* Column 2 */}
                                    <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 px-1 sm:px-2">
                                        <div className="text-slate-400 dark:text-slate-500 shrink-0">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col text-left min-w-0">
                                            <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-tight mb-1">
                                                Time Left
                                            </div>
                                            <div className="text-[14px] sm:text-[15px] font-bold text-slate-800 dark:text-slate-200 leading-none truncate" style={{ color: goal.is_overdue ? '#ef4444' : undefined }}>
                                                {formatTimeRemaining(goal.days_remaining)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Divider 2 */}
                                    <div className="w-[1px] h-8 bg-slate-200/60 dark:bg-slate-700/60" />

                                    {/* Column 3 */}
                                    <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 px-1 sm:px-2">
                                        <div className="text-slate-400 dark:text-slate-500 shrink-0">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                <polyline points="22 4 12 14.01 9 11.01" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col text-left min-w-0">
                                            <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-tight mb-1">
                                                Completion
                                            </div>
                                            <div className="text-[14px] sm:text-[15px] font-bold leading-none truncate" style={{ color: goal.progress_percentage === 100 ? '#10b981' : config.color }}>
                                                {goal.progress_percentage}%
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Status Badge */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className={`bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm rounded-[20px] p-4 flex flex-row items-center gap-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default mb-4`}
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                        animate={goal.status === 'active' ? { scale: [1, 1.05, 1] } : {}}
                                        transition={{ 
                                            duration: goal.status === 'active' ? 2 : undefined, 
                                            repeat: goal.status === 'active' ? Infinity : undefined, 
                                            type: "spring", stiffness: 400, damping: 15 
                                        }}
                                        className={`w-14 h-14 rounded-[16px] border flex items-center justify-center flex-shrink-0 shadow-sm relative transition-transform duration-300 ${
                                            goal.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400'
                                            : goal.status === 'paused' ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800/50 text-amber-600 dark:text-amber-400'
                                            : 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800/50 text-blue-600 dark:text-blue-400'
                                        }`}
                                    >
                                        {goal.status === 'completed' ? (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                <polyline points="22 4 12 14.01 9 11.01" />
                                            </svg>
                                        ) : goal.status === 'paused' ? (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10" />
                                                <rect x="9" y="9" width="2" height="6" fill="currentColor" />
                                                <rect x="13" y="9" width="2" height="6" fill="currentColor" />
                                            </svg>
                                        ) : (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10" />
                                                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                                            </svg>
                                        )}
                                    </motion.div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <h2 className="text-[15px] sm:text-[16px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-1.5 transition-colors">
                                            {goal.status === 'completed' ? 'Goal Achieved! 🎉' : goal.status === 'paused' ? 'Goal Paused' : 'In Progress'}
                                        </h2>
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] sm:text-[13px] font-semibold border shadow-sm w-fit ${
                                            goal.status === 'completed' 
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                                : goal.status === 'paused'
                                                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/80'
                                        }`}>
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                {goal.status === 'completed' ? (
                                                    <><path strokeLinecap="round" strokeLinejoin="round" d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline strokeLinecap="round" strokeLinejoin="round" points="22 4 12 14.01 9 11.01" /></>
                                                ) : goal.status === 'paused' ? (
                                                    <><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></>
                                                ) : (
                                                    <><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></>
                                                )}
                                            </svg>
                                            {goal.status === 'completed' 
                                                ? `Completed on ${new Date(goal.completed_at!).toLocaleDateString()}`
                                                : goal.status === 'paused'
                                                ? 'Resume to continue tracking'
                                                : goal.type === 'study_time' && goal.unit === 'hours'
                                                ? (() => {
                                                    const remaining = goal.target_value - goal.current_value;
                                                    const hours = Math.floor(remaining);
                                                    const minutes = Math.round((remaining % 1) * 60);
                                                    return `${hours}h ${minutes}m remaining`;
                                                })()
                                                : `${goal.target_value - goal.current_value} ${goal.unit} remaining`}
                                        </div>
                                    </div>
                                </motion.div>



                                {/* Quick Stats */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="grid grid-cols-2 gap-3"
                                >
                                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-[12px] p-3 sm:p-3.5 transition-all hover:shadow-sm">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                            <span className="text-[11px] sm:text-[12px] font-medium text-slate-500 dark:text-slate-400">Started</span>
                                        </div>
                                        <div className="text-[13px] sm:text-[14px] font-bold text-slate-900 dark:text-slate-100">
                                            {new Date(goal.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-[12px] p-3 sm:p-3.5 transition-all hover:shadow-sm">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <svg className="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            <span className="text-[11px] sm:text-[12px] font-medium text-slate-500 dark:text-slate-400">Daily Avg</span>
                                        </div>
                                        <div className="text-[13px] sm:text-[14px] font-bold text-slate-900 dark:text-slate-100">
                                            {goal.type === 'study_time' && goal.unit === 'hours' 
                                                ? (() => {
                                                    const avgHours = goal.current_value / Math.max(1, Math.ceil((Date.now() - new Date(goal.start_date).getTime()) / (1000 * 60 * 60 * 24)));
                                                    const hours = Math.floor(avgHours);
                                                    const minutes = Math.round((avgHours % 1) * 60);
                                                    return `${hours}h ${minutes}m/day`;
                                                })()
                                                : `${(goal.current_value / Math.max(1, Math.ceil((Date.now() - new Date(goal.start_date).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(1)} ${goal.unit}/day`}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Footer Actions */}
                            {goal.status !== 'completed' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    style={{
                                        padding: '16px 24px',
                                        borderTop: `1px solid ${colors.border}`,
                                    }}
                                >
                                    {/* Mark Complete Button */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.55 }}
                                    >
                                        <button
                                            onClick={() => { onComplete(goal.id); onClose(); }}
                                            className="w-full flex items-center justify-center gap-1.5 font-bold py-2.5 px-4 rounded-[14px] transition-colors shadow-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 focus:outline-none"
                                        >
                                        <motion.div
                                            animate={{ scale: [1, 1.15, 1] }}
                                            transition={{ duration: 1.5, delay: 0.8, repeat: Infinity }}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                <polyline points="22 4 12 14.01 9 11.01" />
                                            </svg>
                                        </motion.div>
                                        Mark Complete
                                    </button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};


// Create Goal Modal

export { GoalDetailModal };
export default GoalDetailModal;
