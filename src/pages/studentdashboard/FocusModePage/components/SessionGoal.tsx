/**
 * SessionGoal
 * Session goal setter component.
 * Extracted from FocusModePage.tsx during Phase 8.5
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { FocusModeColors } from '../FocusModePage';

// Session Goal Component
const SessionGoal: React.FC<{
    
    
    setSessionGoal: (goal: number) => void;
    currentProgress: number;
}> = ({   sessionGoal, setSessionGoal, currentProgress }) => {
    const [isEditing, setIsEditing] = useState(false);
    const progressPercent = Math.min((currentProgress / sessionGoal) * 100, 100);
    const goalOptions = [15, 25, 45, 60, 90, 120];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 25 }}
            style={{
                padding: '16px',
                borderRadius: '14px',
                background: 'var(--bg-primary)',
                border: `1px solid var(--border-color)` }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px' }}>
                    <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.06) 100%)',
                        border: '1px solid rgba(245, 158, 11, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#f59e0b' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="6" />
                            <circle cx="12" cy="12" r="2" />
                        </svg>
                    </div>
                    <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-primary)' }}>
                        Session Goal
                    </span>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(!isEditing)}
                    style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'var(--dashboard-surface)',
                        cursor: 'pointer',
                        fontSize: '10px',
                        fontWeight: 500,
                        color: 'var(--text-muted)' }}
                >
                    {isEditing ? 'Done' : 'Edit'}
                </motion.button>
            </div>

            {/* Goal Display */}
            <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '4px',
                marginBottom: '10px' }}>
                <span style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#f59e0b' }}>
                    {sessionGoal}
                </span>
                <span style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)' }}>
                    min target
                </span>
            </div>

            {/* Progress Bar */}
            <div style={{
                height: '6px',
                borderRadius: '3px',
                background: 'var(--bg-hover)',
                overflow: 'hidden',
                marginBottom: '8px' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{
                        height: '100%',
                        borderRadius: '3px',
                        background: progressPercent >= 100
                            ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                            : 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)' }}
                />
            </div>

            <div style={{
                fontSize: '11px',
                color: 'var(--text-muted)' }}>
                {currentProgress} of {sessionGoal} min completed
            </div>

            {/* Goal Options (shown when editing) */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ marginTop: '12px', overflow: 'hidden' }}
                    >
                        <div style={{
                            display: 'flex',
                            gap: '6px',
                            flexWrap: 'wrap' }}>
                            {goalOptions.map((goal) => (
                                <motion.button
                                    key={goal}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => {
                                        setSessionGoal(goal);
                                        setIsEditing(false);
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        border: sessionGoal === goal
                                            ? '1px solid rgba(245, 158, 11, 0.3)'
                                            : `1px solid var(--border-color)`,
                                        background: sessionGoal === goal
                                            ? 'rgba(245, 158, 11, 0.1)'
                                            : 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        color: sessionGoal === goal ? '#f59e0b' : 'var(--text-secondary)',
                                        transition: 'all 0.15s ease' }}
                                >
                                    {goal}m
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};


export { SessionGoal };
