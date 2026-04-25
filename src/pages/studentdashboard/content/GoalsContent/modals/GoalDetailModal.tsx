/**
 * GoalDetailModal
 * Detailed view/edit modal for a single goal.
 * Extracted from GoalsContent.tsx during Phase 8.3
 */
import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useModalAccessibility } from '../../../hooks/useModalAccessibility';
import { goalTypeConfig, type GoalWithProgress } from '../../../../../services/goalsService';
import GoalIcon from '../components/GoalIcon';
import { getPriorityInfo, formatTimeRemaining } from '../shared';

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
    onComplete }) => {
    const { modalRef, modalProps } = useModalAccessibility(isOpen, onClose, 'goal-detail-title');

    const = {
        bg: 'var(--bg-primary)',
        cardBg: 'var(--bg-secondary)',
        border: 'var(--border-light)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        textMuted: 'var(--text-muted)',
        accent: 'var(--brand-blue)' };

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
                            zIndex: 9998 }}
                    />

                    <div
                        ref={modalRef}
                        {...modalProps}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                            pointerEvents: 'none',
                            padding: '20px' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            style={{
                                width: '100%',
                                maxWidth: '480px',
                                maxHeight: '85vh',
                                background: 'var(--bg-primary)',
                                borderRadius: '20px',
                                boxShadow: 'var(--shadow-lg)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                pointerEvents: 'auto' }}
                        >
                            {/* Header */}
                            <div style={{ padding: '20px 24px', borderBottom: `1px solid var(--border-color)` }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        style={{
                                            width: '52px',
                                            height: '52px',
                                            borderRadius: '14px',
                                            background: `linear-gradient(135deg, ${config.color}20 0%, ${config.color}10 100%)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            cursor: 'pointer',
                                            boxShadow: `0 4px 12px ${config.color}20` }}
                                    >
                                        <GoalIcon type={goal.type} color={config.color} size={26} />
                                    </motion.div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h2 style={{
                                            margin: 0,
                                            fontSize: '18px',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                            marginBottom: '6px' }}>
                                            {goal.title}
                                        </h2>
                                        {goal.description && (
                                            <p style={{
                                                margin: 0,
                                                fontSize: '13px',
                                                color: 'var(--text-secondary)',
                                                marginBottom: '8px' }}>
                                                {goal.description}
                                            </p>
                                        )}
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <motion.span
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.2 }}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '3px 8px',
                                                    borderRadius: '6px',
                                                    background: `${priorityInfo.color}15`,
                                                    fontSize: '11px',
                                                    fontWeight: 500,
                                                    color: priorityInfo.color }}
                                            >
                                                {priorityInfo.label} Priority
                                            </motion.span>
                                            <motion.span
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.25 }}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '3px 8px',
                                                    borderRadius: '6px',
                                                    background: `${config.color}15`,
                                                    fontSize: '11px',
                                                    fontWeight: 500,
                                                    color: config.color }}
                                            >
                                                {config.label}
                                            </motion.span>
                                        </div>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.1, background: 'var(--bg-hover)' }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={onClose}
                                        style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: 'var(--bg-hover)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--text-secondary)' }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </motion.button>
                                </div>

                                {/* Stats Row */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    style={{
                                        display: 'flex',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        background: 'var(--bg-hover)' }}
                                >
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                            </svg>
                                            Progress
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: 700, color: config.color }}>
                                            {goal.type === 'study_time' && goal.unit === 'hours' 
                                                ? `${Math.floor(goal.current_value)}h ${Math.round((goal.current_value % 1) * 60)}m / ${goal.target_value}h`
                                                : `${goal.current_value}/${goal.target_value}`}
                                        </div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                            {goal.type === 'study_time' && goal.unit === 'hours' ? '' : goal.unit}
                                        </div>
                                    </div>
                                    <div style={{ width: '1px', background: 'var(--border-color)' }} />
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            Time Left
                                        </div>
                                        <div style={{ 
                                            fontSize: '14px', 
                                            fontWeight: 600, 
                                            color: goal.is_overdue ? '#ef4444' : 'var(--text-primary)' 
                                        }}>
                                            {formatTimeRemaining(goal.days_remaining)}
                                        </div>
                                    </div>
                                    <div style={{ width: '1px', background: 'var(--border-color)' }} />
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                <polyline points="22 4 12 14.01 9 11.01" />
                                            </svg>
                                            Completion
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: 700, color: goal.progress_percentage === 100 ? '#10b981' : config.color }}>
                                            {goal.progress_percentage}%
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Progress Section */}
                            <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
                                {/* Overall Progress */}
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth="2">
                                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                            </svg>
                                            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Overall Progress</span>
                                        </div>
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: config.color }}>{goal.progress_percentage}%</span>
                                    </div>
                                    <div style={{
                                        height: '10px',
                                        background: 'var(--bg-hover)',
                                        borderRadius: '5px',
                                        overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${goal.progress_percentage}%` }}
                                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                            style={{
                                                height: '100%',
                                                background: goal.progress_percentage === 100 
                                                    ? 'linear-gradient(90deg, #10b981, #34d399)' 
                                                    : `linear-gradient(90deg, ${config.color}, ${config.color}cc)`,
                                                borderRadius: '5px' }}
                                        />
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    style={{
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        background: goal.status === 'completed' 
                                            ? 'rgba(16, 185, 129, 0.08)' 
                                            : goal.status === 'paused'
                                            ? 'rgba(245, 158, 11, 0.08)'
                                            : 'rgba(59, 130, 246, 0.08)',
                                        border: `1px solid ${goal.status === 'completed' 
                                            ? 'rgba(16, 185, 129, 0.15)' 
                                            : goal.status === 'paused'
                                            ? 'rgba(245, 158, 11, 0.15)'
                                            : 'rgba(59, 130, 246, 0.15)'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        marginBottom: '16px' }}
                                >
                                    <motion.div
                                        animate={goal.status === 'active' ? { scale: [1, 1.1, 1] } : {}}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '10px',
                                            background: goal.status === 'completed' 
                                                ? 'rgba(16, 185, 129, 0.15)' 
                                                : goal.status === 'paused'
                                                ? 'rgba(245, 158, 11, 0.15)'
                                                : 'rgba(59, 130, 246, 0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: goal.status === 'completed' ? '#10b981' : goal.status === 'paused' ? '#f59e0b' : '#3b82f6' }}
                                    >
                                        {goal.status === 'completed' ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                <polyline points="22 4 12 14.01 9 11.01" />
                                            </svg>
                                        ) : goal.status === 'paused' ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <rect x="9" y="9" width="2" height="6" fill="currentColor" />
                                                <rect x="13" y="9" width="2" height="6" fill="currentColor" />
                                            </svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                                            </svg>
                                        )}
                                    </motion.div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {goal.status === 'completed' ? 'Goal Achieved! 🎉' : goal.status === 'paused' ? 'Goal Paused' : 'In Progress'}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
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

                                {/* Milestones Section */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    style={{ marginBottom: '16px' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '6px',
                                            background: `${config.color}10`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth="2">
                                                <path d="M12 20V10" />
                                                <path d="M18 20V4" />
                                                <path d="M6 20v-4" />
                                            </svg>
                                        </div>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Milestones</span>
                                    </div>
                                    
                                    {/* Progress Track */}
                                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                                        {/* Background Track */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '12px',
                                            right: '12px',
                                            height: '3px',
                                            background: 'var(--bg-hover)',
                                            borderRadius: '2px',
                                            transform: 'translateY(-50%)',
                                            zIndex: 0 }} />
                                        {/* Progress Track */}
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                                            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                            style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '12px',
                                                height: '3px',
                                                background: `linear-gradient(90deg, ${config.color}, ${config.color}cc)`,
                                                borderRadius: '2px',
                                                transform: 'translateY(-50%)',
                                                zIndex: 1 }}
                                        />
                                        
                                        {/* Milestone Points */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                                            {[25, 50, 75, 100].map((milestone, index) => {
                                                const isAchieved = goal.progress_percentage >= milestone;
                                                const isCurrent = goal.progress_percentage >= milestone - 25 && goal.progress_percentage < milestone;
                                                return (
                                                    <motion.div
                                                        key={milestone}
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        transition={{ 
                                                            delay: 0.4 + index * 0.1,
                                                            type: 'spring',
                                                            stiffness: 400,
                                                            damping: 20
                                                        }}
                                                        whileHover={{ scale: 1.1 }}
                                                        style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            cursor: 'pointer' }}
                                                    >
                                                        <motion.div
                                                            animate={isCurrent ? { 
                                                                boxShadow: [`0 0 0 0 ${config.color}40`, `0 0 0 8px ${config.color}00`]
                                                            } : {}}
                                                            transition={{ duration: 1.5, repeat: isCurrent ? Infinity : 0 }}
                                                            style={{
                                                                width: '28px',
                                                                height: '28px',
                                                                borderRadius: '50%',
                                                                background: isAchieved 
                                                                    ? `linear-gradient(135deg, ${config.color}, ${config.color}dd)`
                                                                    : 'var(--bg-secondary)',
                                                                border: isAchieved 
                                                                    ? 'none' 
                                                                    : `2px solid ${isCurrent ? config.color : 'var(--border-color)'}`,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                boxShadow: isAchieved 
                                                                    ? `0 2px 8px ${config.color}40`
                                                                    : '0 1px 3px rgba(0,0,0,0.08)' }}
                                                        >
                                                            {isAchieved ? (
                                                                <motion.svg 
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    transition={{ delay: 0.5 + index * 0.1, type: 'spring' }}
                                                                    width="14" 
                                                                    height="14" 
                                                                    viewBox="0 0 24 24" 
                                                                    fill="none" 
                                                                    stroke="#ffffff" 
                                                                    strokeWidth="3"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                >
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </motion.svg>
                                                            ) : (
                                                                <span style={{ 
                                                                    fontSize: '10px', 
                                                                    fontWeight: 600, 
                                                                    color: isCurrent ? config.color : 'var(--text-muted)' 
                                                                }}>
                                                                    {milestone}
                                                                </span>
                                                            )}
                                                        </motion.div>
                                                        <span style={{ 
                                                            fontSize: '11px', 
                                                            fontWeight: isAchieved ? 600 : 500, 
                                                            color: isAchieved ? config.color : 'var(--text-muted)' }}>
                                                            {milestone}%
                                                        </span>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Quick Stats */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '10px' }}
                                >
                                    <div style={{
                                        padding: '12px',
                                        borderRadius: '10px',
                                        background: 'var(--bg-hover)',
                                        border: `1px solid var(--border-color)` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Started</span>
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {new Date(goal.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '12px',
                                        borderRadius: '10px',
                                        background: 'var(--bg-hover)',
                                        border: `1px solid var(--border-color)` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Daily Avg</span>
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
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
                                        borderTop: `1px solid var(--border-color)` }}
                                >
                                    {/* Mark Complete Button */}
                                    <motion.button
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.55 }}
                                        whileHover={{ 
                                            scale: 1.02, 
                                            boxShadow: `0 8px 28px ${config.color}45` }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => { onComplete(goal.id); onClose(); }}
                                        style={{
                                            width: '100%',
                                            padding: '14px 24px',
                                            borderRadius: '12px',
                                            border: 'none',
                                            background: `linear-gradient(135deg, ${config.color}, ${config.color}dd)`,
                                            color: '#ffffff',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '10px',
                                            boxShadow: `0 4px 16px ${config.color}35`,
                                            transition: 'all 0.2s ease' }}
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
                                    </motion.button>
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
