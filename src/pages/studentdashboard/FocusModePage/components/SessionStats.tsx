/**
 * SessionStats
 * Shows today's focus progress stats.
 * Extracted from FocusModePage.tsx during Phase 8.5
 * Refactored in Phase 9.5 (Styling Consistency)
 */
import React from 'react';
import { motion } from 'motion/react';
import type { FocusModeColors } from '../FocusModePage';

// Session Stats Component - Shows today's focus progress
const SessionStats: React.FC<{
    isDarkMode: boolean;
    colors: FocusModeColors;
    totalFocusTime: number;
    sessionsCompleted: number;
    currentStreak: number;
}> = ({ isDarkMode: _isDarkMode, colors: _colors, totalFocusTime, sessionsCompleted, currentStreak }) => {
    // Calculate stats - format compactly for large numbers
    const hours = Math.floor(totalFocusTime / 3600);
    const minutes = Math.floor((totalFocusTime % 3600) / 60);
    const timeDisplay = hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;

    // Daily goal (4 pomodoro sessions = 100 minutes)
    const dailyGoalMinutes = 100;
    const currentMinutes = Math.floor(totalFocusTime / 60);
    const progressPercent = Math.min((currentMinutes / dailyGoalMinutes) * 100, 100);

    const stats = [
        {
            id: 'time',
            label: 'Time',
            value: totalFocusTime > 0 ? timeDisplay : '0m',
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            ),
        },
        {
            id: 'sessions',
            label: 'Sessions',
            value: sessionsCompleted.toString(),
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            ),
        },
        {
            id: 'streak',
            label: 'Streak',
            value: `${currentStreak}d`,
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
            ),
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}
            className="dashboard-card"
            style={{ padding: '14px' }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
            }}>
                <div
                    style={{
                        width: 28,
                        height: 28,
                        borderRadius: '8px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--brand-blue)',
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                </div>
                <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                }}>
                    Today's Progress
                </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '12px' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px',
                }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Daily Goal</span>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--brand-blue)' }}>
                        {currentMinutes}/{dailyGoalMinutes}m
                    </span>
                </div>
                <div style={{
                    height: '5px',
                    borderRadius: '3px',
                    background: 'var(--bg-hover)',
                    overflow: 'hidden',
                }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            height: '100%',
                            borderRadius: '3px',
                            background: progressPercent >= 100
                                ? 'linear-gradient(90deg, var(--success) 0%, #34d399 100%)'
                                : 'linear-gradient(90deg, var(--brand-blue) 0%, var(--brand-blue-hover) 100%)',
                        }}
                    />
                </div>
            </div>

            {/* Stats Grid - Compact horizontal layout */}
            <div style={{ display: 'flex', gap: '6px' }}>
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + index * 0.05 }}
                        style={{
                            flex: 1,
                            padding: '8px 4px',
                            borderRadius: '8px',
                            background: 'var(--bg-tertiary)',
                            border: `1px solid var(--border-light)`,
                            textAlign: 'center',
                            minWidth: 0,
                        }}
                    >
                        <div style={{
                            color: 'var(--brand-blue)',
                            marginBottom: '4px',
                            display: 'flex',
                            justifyContent: 'center',
                        }}>
                            {stat.icon}
                        </div>
                        <div style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            marginBottom: '1px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}>
                            {stat.value}
                        </div>
                        <div style={{
                            fontSize: '9px',
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.2px',
                        }}>
                            {stat.label}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export { SessionStats };
