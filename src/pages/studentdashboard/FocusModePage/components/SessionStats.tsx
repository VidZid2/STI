/**
 * SessionStats
 * Shows today's focus progress stats.
 * Extracted from FocusModePage.tsx during Phase 8.5
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { FocusModeColors } from '../FocusModePage';

// Session Stats Component - Shows today's focus progress
const SessionStats: React.FC<{
    isDarkMode: boolean;
    colors: FocusModeColors;
    totalFocusTime: number;
    sessionsCompleted: number;
    currentStreak: number;
}> = ({ isDarkMode, colors, totalFocusTime, sessionsCompleted, currentStreak }) => {
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
            style={{
                padding: '14px',
                borderRadius: '14px',
                background: isDarkMode ? '#1e293b' : '#ffffff',
                border: `1px solid ${colors.border}`,
            }}
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
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%)',
                        border: '1px solid rgba(59, 130, 246, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#3b82f6',
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
                    color: colors.textPrimary,
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
                    <span style={{ fontSize: '10px', color: colors.textMuted }}>Daily Goal</span>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#3b82f6' }}>
                        {currentMinutes}/{dailyGoalMinutes}m
                    </span>
                </div>
                <div style={{
                    height: '5px',
                    borderRadius: '3px',
                    background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
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
                                ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                                : 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
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
                            background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(59, 130, 246, 0.04)',
                            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(59, 130, 246, 0.08)'}`,
                            textAlign: 'center',
                            minWidth: 0,
                        }}
                    >
                        <div style={{
                            color: '#3b82f6',
                            marginBottom: '4px',
                            display: 'flex',
                            justifyContent: 'center',
                        }}>
                            {stat.icon}
                        </div>
                        <div style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: colors.textPrimary,
                            marginBottom: '1px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}>
                            {stat.value}
                        </div>
                        <div style={{
                            fontSize: '9px',
                            color: colors.textMuted,
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

// Motivational Quotes Data
const STUDY_QUOTES = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Education is the passport to the future.", author: "Malcolm X" },
    { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
    { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
    { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
    { text: "Study hard what interests you the most in the most undisciplined way.", author: "Richard Feynman" },
    { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    { text: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
];


export { SessionStats };
