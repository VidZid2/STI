/**
 * AchievementsModal
 * Displays earned achievements and badges.
 * Extracted from GoalsContent.tsx during Phase 8.3
 */
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useModalAccessibility } from '../../../hooks/useModalAccessibility';
import MilestoneIcon from '../components/MilestoneIcon';
import type { MilestoneIconType } from '../components/MilestoneIcon';
import type { GoalWithProgress } from '../../../../../services/goalsService';

// GoalMilestone type for achievements data
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

// Achievements Modal Component - Minimalistic Design
const AchievementsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    goals: GoalWithProgress[];
}> = ({ isOpen, onClose, goals }) => {
    const { modalRef, modalProps } = useModalAccessibility(isOpen, onClose, 'achievements-title');
    const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
    
    const = {
        bg: 'var(--bg-primary)',
        cardBg: 'var(--bg-secondary)',
        border: 'var(--border-light)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        textMuted: 'var(--text-muted)' };

    const milestoneStatus = useMemo(() => {
        const totalCreated = goals.length;
        const totalCompleted = goals.filter(g => g.status === 'completed').length;

        return GOAL_MILESTONES.map(milestone => {
            let current = 0;
            let unlocked = false;

            if (milestone.type === 'created') {
                current = totalCreated;
                unlocked = totalCreated >= milestone.requirement;
            } else if (milestone.type === 'completed') {
                current = totalCompleted;
                unlocked = totalCompleted >= milestone.requirement;
            }

            return {
                ...milestone,
                current,
                unlocked,
                progress: Math.min(100, (current / milestone.requirement) * 100) };
        });
    }, [goals]);

    const unlockedCount = milestoneStatus.filter(m => m.unlocked).length;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        padding: '20px' }}
                >
                    <motion.div
                        ref={modalRef}
                        {...modalProps}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: '440px',
                            background: 'var(--dashboard-surface)',
                            borderRadius: '20px',
                            border: `1px solid var(--border-color)`,
                            boxShadow: 'var(--shadow-lg)',
                            overflow: 'hidden' }}
                    >
                        {/* Header - Clean & Simple */}
                        <div style={{
                            padding: '24px 24px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between' }}>
                            <div>
                                <h2 style={{ 
                                    margin: 0, 
                                    fontSize: '18px', 
                                    fontWeight: 600, 
                                    color: 'var(--text-primary)',
                                    letterSpacing: '-0.3px' }}>
                                    Achievements
                                </h2>
                                <p style={{ 
                                    margin: '4px 0 0', 
                                    fontSize: '13px', 
                                    color: 'var(--text-muted)' }}>
                                    {unlockedCount} of {milestoneStatus.length} unlocked
                                </p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05, backgroundColor: 'var(--bg-hover)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'var(--bg-hover)',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background 0.15s ease' }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </motion.button>
                        </div>

                        {/* Badges List - Minimalistic */}
                        <div style={{
                            padding: '0 24px 24px',
                            maxHeight: '400px',
                            overflowY: 'auto' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {milestoneStatus.map((milestone, index) => (
                                    <motion.div
                                        key={milestone.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.25, delay: index * 0.03 }}
                                        whileHover={{ backgroundColor: 'var(--bg-hover)' }}
                                        onClick={() => setSelectedBadge(selectedBadge === milestone.id ? null : milestone.id)}
                                        style={{
                                            padding: '14px 16px',
                                            borderRadius: '14px',
                                            background: milestone.unlocked 
                                                ? 'var(--bg-hover)'
                                                : 'transparent',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s ease' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            {/* Icon */}
                                            <motion.div
                                                animate={milestone.unlocked && selectedBadge === milestone.id ? { 
                                                    scale: [1, 1.15, 1],
                                                    rotate: [0, -5, 5, 0] } : {}}
                                                transition={{ duration: 0.4 }}
                                                style={{
                                                    width: '44px',
                                                    height: '44px',
                                                    borderRadius: '12px',
                                                    background: milestone.unlocked 
                                                        ? `linear-gradient(135deg, ${milestone.color}18, ${milestone.color}08)`
                                                        : 'var(--bg-hover)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: milestone.unlocked ? milestone.color : 'var(--text-muted)',
                                                    flexShrink: 0,
                                                    position: 'relative',
                                                    overflow: 'hidden' }}
                                            >
                                                <MilestoneIcon icon={milestone.icon} size={20} />
                                                {milestone.unlocked && (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        style={{
                                                            position: 'absolute',
                                                            inset: 0,
                                                            background: `radial-gradient(circle at center, ${milestone.color}15 0%, transparent 70%)` }}
                                                    />
                                                )}
                                            </motion.div>

                                            {/* Content */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '8px',
                                                    marginBottom: '4px' }}>
                                                    <span style={{ 
                                                        fontSize: '14px', 
                                                        fontWeight: 600, 
                                                        color: milestone.unlocked ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                                        {milestone.name}
                                                    </span>
                                                    {milestone.unlocked && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981" stroke="none">
                                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                            </svg>
                                                        </motion.div>
                                                    )}
                                                </div>
                                                <div style={{ 
                                                    fontSize: '12px', 
                                                    color: 'var(--text-muted)' }}>
                                                    {milestone.description}
                                                </div>
                                            </div>

                                            {/* Progress indicator */}
                                            <div style={{ 
                                                textAlign: 'right',
                                                flexShrink: 0 }}>
                                                <div style={{ 
                                                    fontSize: '14px', 
                                                    fontWeight: 600, 
                                                    color: milestone.unlocked ? milestone.color : 'var(--text-muted)' }}>
                                                    {milestone.current}/{milestone.requirement}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expandable progress bar */}
                                        <AnimatePresence>
                                            {selectedBadge === milestone.id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    style={{ overflow: 'hidden' }}
                                                >
                                                    <div style={{ paddingTop: '12px', paddingLeft: '58px' }}>
                                                        <div style={{
                                                            height: '6px',
                                                            background: 'var(--bg-hover)',
                                                            borderRadius: '3px',
                                                            overflow: 'hidden' }}>
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${milestone.progress}%` }}
                                                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                                                style={{
                                                                    height: '100%',
                                                                    background: milestone.color,
                                                                    borderRadius: '3px' }}
                                                            />
                                                        </div>
                                                        <div style={{ 
                                                            fontSize: '11px', 
                                                            color: 'var(--text-muted)',
                                                            marginTop: '6px' }}>
                                                            {Math.round(milestone.progress)}% complete
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};



export { AchievementsModal };
export default AchievementsModal;
