/**
 * Focus Mode Page - Dedicated Study Session Interface
 * Minimalistic professional design matching PathsContent/GoalsContent style
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { fetchGroupMessages, subscribeToMessages, type ChatMessage } from '../../services/chatService';
import { fetchGroups, type GroupWithMembers } from '../../services/groupsService';
import { getStudyTimeData, getStreakData, addStudyTime } from '../../services/studyTimeService';

// Types
interface Resource {
    id: string;
    type: 'link' | 'file' | 'code' | 'note' | 'flashcard';
    title: string;
    content: string;
    url?: string;
    language?: string;
    createdAt: Date;
    sharedBy?: string;
}

// StudySession interface - reserved for future tracking feature
// interface StudySession {
//     startTime: Date;
//     duration: number;
//     focusScore: number;
//     breaks: number;
// }

type FilterTab = 'all' | 'links' | 'files' | 'code' | 'notes';
// ToolTab reserved for future sidebar tools
// type ToolTab = 'timer' | 'flashcards' | 'notes' | 'whiteboard';

// Skeleton Loading Component
const FocusSkeleton: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    const colors = {
        cardBg: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        skeleton: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        shimmer: isDarkMode
            ? 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.02) 100%)'
            : 'linear-gradient(90deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.02) 100%)',
    };

    const SkeletonBox: React.FC<{ width?: string; height?: string; borderRadius?: string; style?: React.CSSProperties }> = ({
        width = '100%', height = '16px', borderRadius = '6px', style
    }) => (
        <motion.div
            initial={{ backgroundPosition: '-200% 0' }}
            animate={{ backgroundPosition: '200% 0' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{
                width, height, borderRadius,
                background: colors.skeleton,
                backgroundImage: colors.shimmer,
                backgroundSize: '200% 100%',
                ...style,
            }}
        />
    );

    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header Skeleton */}
            <div style={{ marginBottom: '28px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 22px',
                    borderRadius: '14px', background: colors.cardBg, border: `1px solid ${colors.border}`,
                }}>
                    <SkeletonBox width="46px" height="46px" borderRadius="12px" />
                    <div style={{ flex: 1 }}>
                        <SkeletonBox width="180px" height="24px" style={{ marginBottom: '8px' }} />
                        <SkeletonBox width="300px" height="14px" />
                    </div>
                </div>
            </div>

            {/* Content Skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
                <div>
                    <SkeletonBox width="100%" height="400px" borderRadius="16px" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <SkeletonBox width="100%" height="200px" borderRadius="16px" />
                    <SkeletonBox width="100%" height="180px" borderRadius="16px" />
                </div>
            </div>
        </div>
    );
};

// Resource Icon Component
const ResourceIcon: React.FC<{ type: Resource['type']; color: string; size?: number }> = ({ type, color, size = 20 }) => {
    const icons: Record<Resource['type'], React.ReactNode> = {
        link: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
        ),
        file: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
            </svg>
        ),
        code: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
            </svg>
        ),
        note: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ),
        flashcard: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
            </svg>
        ),
    };
    return <div style={{ color }}>{icons[type]}</div>;
};

// Filter Tabs Component
const FilterTabs: React.FC<{
    activeFilter: FilterTab;
    setActiveFilter: (filter: FilterTab) => void;
    isDarkMode: boolean;
    colors: { accent: string; textSecondary: string };
    resourceCounts: Record<FilterTab, number>;
}> = ({ activeFilter, setActiveFilter, isDarkMode, colors, resourceCounts }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 5, width: 60 });

    const tabs: { id: FilterTab; label: string; icon: React.ReactNode }[] = [
        {
            id: 'all', label: 'All', icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
            )
        },
        {
            id: 'links', label: 'Links', icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
            )
        },
        {
            id: 'files', label: 'Files', icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                </svg>
            )
        },
        {
            id: 'code', label: 'Code', icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                </svg>
            )
        },
        {
            id: 'notes', label: 'Notes', icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
            )
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
            transition={{ delay: 0.2, duration: 0.4 }}
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
                layoutId="activeFilterIndicator"
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
                transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8,
                }}
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
                    {resourceCounts[tab.id] > 0 && (
                        <motion.span
                            key={`${tab.id}-${resourceCounts[tab.id]}`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                            style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '1px 5px',
                                borderRadius: '6px',
                                background: activeFilter === tab.id
                                    ? colors.accent
                                    : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                                color: activeFilter === tab.id ? '#fff' : colors.textSecondary,
                            }}
                        >
                            {resourceCounts[tab.id]}
                        </motion.span>
                    )}
                </motion.button>
            ))}
        </motion.div>
    );
};

// Pomodoro Timer Component - Compact Professional Design
const PomodoroTimer: React.FC<{
    isDarkMode: boolean;
    colors: any;
    onSessionComplete: (duration: number) => void;
}> = ({ isDarkMode, colors, onSessionComplete }) => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [mode, setMode] = useState<'focus' | 'break'>('focus');
    const [sessions, setSessions] = useState(0);
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(t => t - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsRunning(false);
            if (mode === 'focus') {
                setSessions(s => s + 1);
                onSessionComplete(25 * 60);
                setMode('break');
                setTimeLeft(5 * 60);
            } else {
                setMode('focus');
                setTimeLeft(25 * 60);
            }
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft, mode, onSessionComplete]);

    const handleReset = () => {
        setIsRunning(false);
        setIsResetting(true);
        setTimeout(() => {
            setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
            setIsResetting(false);
        }, 400);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return { mins: mins.toString().padStart(2, '0'), secs: secs.toString().padStart(2, '0') };
    };

    const totalTime = mode === 'focus' ? 25 * 60 : 5 * 60;
    const progress = isResetting ? 0 : ((totalTime - timeLeft) / totalTime) * 100;
    const time = formatTime(timeLeft);

    // Compact circular progress ring
    const size = 110;
    const strokeWidth = 5;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                padding: '14px',
                borderRadius: '14px',
                background: isDarkMode ? '#1e293b' : '#ffffff',
                border: `1px solid ${colors.border}`,
            }}
        >
            {/* Compact Header */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '12px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                    <div>
                        <div style={{ 
                            fontSize: '12px', 
                            fontWeight: 600, 
                            color: colors.textPrimary,
                        }}>
                            {mode === 'focus' ? 'Focus' : 'Break'}
                        </div>
                        <div style={{ 
                            fontSize: '10px', 
                            color: colors.textMuted,
                        }}>
                            {sessions} session{sessions !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                {/* Compact Mode Toggle */}
                <div style={{
                    display: 'flex',
                    gap: '2px',
                    padding: '2px',
                    borderRadius: '6px',
                    background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                }}>
                    <button
                        onClick={() => { if (!isRunning) { setMode('focus'); setTimeLeft(25 * 60); } }}
                        style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            border: 'none',
                            background: mode === 'focus' ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                            color: mode === 'focus' ? '#3b82f6' : colors.textMuted,
                            fontSize: '10px',
                            fontWeight: 500,
                            cursor: isRunning ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        Focus
                    </button>
                    <button
                        onClick={() => { if (!isRunning) { setMode('break'); setTimeLeft(5 * 60); } }}
                        style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            border: 'none',
                            background: mode === 'break' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                            color: mode === 'break' ? '#10b981' : colors.textMuted,
                            fontSize: '10px',
                            fontWeight: 500,
                            cursor: isRunning ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        Break
                    </button>
                </div>
            </div>

            {/* Compact Timer Display */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                marginBottom: '12px',
            }}>
                <motion.div 
                    style={{ position: 'relative', width: size, height: size }}
                    animate={isResetting ? { rotate: [0, -5, 0] } : {}}
                    transition={{ duration: 0.2 }}
                >
                    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                            strokeWidth={strokeWidth}
                        />
                        <motion.circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={mode === 'focus' ? '#3b82f6' : '#10b981'}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            animate={{ strokeDashoffset: circumference * (1 - progress / 100) }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            style={{ filter: `drop-shadow(0 0 4px ${mode === 'focus' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(16, 185, 129, 0.25)'})` }}
                        />
                    </svg>
                    
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '1px' }}>
                            <span style={{
                                fontSize: '24px',
                                fontWeight: 700,
                                color: mode === 'focus' ? '#3b82f6' : '#10b981',
                                fontVariantNumeric: 'tabular-nums',
                                letterSpacing: '-1px',
                            }}>
                                {time.mins}
                            </span>
                            <span style={{
                                fontSize: '18px',
                                fontWeight: 600,
                                color: mode === 'focus' ? '#3b82f6' : '#10b981',
                                opacity: 0.5,
                            }}>:</span>
                            <span style={{
                                fontSize: '24px',
                                fontWeight: 700,
                                color: mode === 'focus' ? '#3b82f6' : '#10b981',
                                fontVariantNumeric: 'tabular-nums',
                                letterSpacing: '-1px',
                            }}>
                                {time.secs}
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Compact Control Buttons */}
            <div style={{ display: 'flex', gap: '6px' }}>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsRunning(!isRunning)}
                    style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isRunning
                            ? 'rgba(239, 68, 68, 0.1)'
                            : 'rgba(59, 130, 246, 0.1)',
                        color: isRunning ? '#ef4444' : '#3b82f6',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease',
                    }}
                >
                    {isRunning ? (
                        <>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="4" width="4" height="16" rx="1" />
                                <rect x="14" y="4" width="4" height="16" rx="1" />
                            </svg>
                            Pause
                        </>
                    ) : (
                        <>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                            {timeLeft === totalTime ? 'Start' : 'Resume'}
                        </>
                    )}
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReset}
                    disabled={isResetting}
                    style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: `1px solid ${colors.border}`,
                        background: 'transparent',
                        color: colors.textSecondary,
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: isResetting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                        opacity: isResetting ? 0.6 : 1,
                    }}
                >
                    <motion.svg 
                        width="10" 
                        height="10" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        animate={isResetting ? { rotate: -360 } : { rotate: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                    </motion.svg>
                    Reset
                </motion.button>
            </div>
        </motion.div>
    );
};

// Session Stats Component - Shows today's focus progress
const SessionStats: React.FC<{
    isDarkMode: boolean;
    colors: any;
    totalFocusTime: number;
    sessionsCompleted: number;
    currentStreak: number;
}> = ({ isDarkMode, colors, totalFocusTime, sessionsCompleted, currentStreak }) => {
    // Calculate stats
    const hours = Math.floor(totalFocusTime / 3600);
    const minutes = Math.floor((totalFocusTime % 3600) / 60);
    const timeDisplay = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    
    // Daily goal (4 pomodoro sessions = 100 minutes)
    const dailyGoalMinutes = 100;
    const currentMinutes = Math.floor(totalFocusTime / 60);
    const progressPercent = Math.min((currentMinutes / dailyGoalMinutes) * 100, 100);

    const stats = [
        {
            id: 'time',
            label: 'Focus Time',
            value: totalFocusTime > 0 ? timeDisplay : '0m',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            ),
        },
        {
            id: 'streak',
            label: 'Streak',
            value: `${currentStreak} day${currentStreak !== 1 ? 's' : ''}`,
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                padding: '18px',
                borderRadius: '16px',
                background: isDarkMode ? '#1e293b' : '#ffffff',
                border: `1px solid ${colors.border}`,
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
            }}>
                <div
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%)',
                        border: '1px solid rgba(59, 130, 246, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#3b82f6',
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                </div>
                <div>
                    <div style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: colors.textPrimary,
                        letterSpacing: '-0.2px',
                    }}>
                        Today's Progress
                    </div>
                    <div style={{
                        fontSize: '11px',
                        color: colors.textMuted,
                        marginTop: '1px',
                    }}>
                        Keep up the momentum!
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '16px' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                }}>
                    <span style={{ fontSize: '11px', color: colors.textMuted }}>Daily Goal</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#3b82f6' }}>
                        {currentMinutes}/{dailyGoalMinutes}m
                    </span>
                </div>
                <div style={{
                    height: '6px',
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

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + index * 0.05 }}
                        style={{
                            padding: '12px 8px',
                            borderRadius: '10px',
                            background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(59, 130, 246, 0.04)',
                            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(59, 130, 246, 0.08)'}`,
                            textAlign: 'center',
                        }}
                    >
                        <div style={{
                            color: '#3b82f6',
                            marginBottom: '6px',
                            display: 'flex',
                            justifyContent: 'center',
                        }}>
                            {stat.icon}
                        </div>
                        <div style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: colors.textPrimary,
                            marginBottom: '2px',
                        }}>
                            {stat.value}
                        </div>
                        <div style={{
                            fontSize: '10px',
                            color: colors.textMuted,
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px',
                        }}>
                            {stat.label}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

// Resource Type Configuration - Professional color schemes
const RESOURCE_TYPE_CONFIG: Record<Resource['type'], {
    color: string;
    bgGradient: string;
    label: string;
    actionLabel: string;
}> = {
    link: {
        color: '#3b82f6',
        bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.04) 100%)',
        label: 'Link',
        actionLabel: 'Open',
    },
    file: {
        color: '#f59e0b',
        bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.04) 100%)',
        label: 'File',
        actionLabel: 'Download',
    },
    code: {
        color: '#10b981',
        bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)',
        label: 'Code',
        actionLabel: 'Copy',
    },
    note: {
        color: '#8b5cf6',
        bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0.04) 100%)',
        label: 'Note',
        actionLabel: 'View',
    },
    flashcard: {
        color: '#ec4899',
        bgGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(236, 72, 153, 0.04) 100%)',
        label: 'Flashcard',
        actionLabel: 'Study',
    },
};

// Resource Card Component - Minimalistic Professional Design
const ResourceCard: React.FC<{
    resource: Resource;
    isDarkMode: boolean;
    colors: any;
    index: number;
}> = ({ resource, isDarkMode, colors, index }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showCopied, setShowCopied] = useState(false);
    const config = RESOURCE_TYPE_CONFIG[resource.type];

    // Handle card click based on resource type
    const handleClick = useCallback(() => {
        if (resource.type === 'link' && resource.url) {
            window.open(resource.url, '_blank', 'noopener,noreferrer');
        } else if (resource.type === 'file' && resource.url) {
            window.open(resource.url, '_blank', 'noopener,noreferrer');
        } else if (resource.type === 'code') {
            navigator.clipboard.writeText(resource.content);
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
        }
    }, [resource]);

    // Format date
    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
                delay: index * 0.03,
                layout: { type: 'spring', stiffness: 400, damping: 30 }
            }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={handleClick}
            style={{
                position: 'relative',
                borderRadius: '14px',
                background: isDarkMode ? '#1e293b' : '#ffffff',
                border: `1px solid ${isHovered ? `${config.color}40` : colors.border}`,
                cursor: 'pointer',
                overflow: 'hidden',
                boxShadow: isHovered 
                    ? `0 8px 24px ${config.color}15, 0 4px 8px rgba(0,0,0,0.04)`
                    : '0 1px 3px rgba(0,0,0,0.02)',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'border-color 0.2s ease, box-shadow 0.3s ease, transform 0.2s ease',
            }}
        >
            {/* Type indicator bar */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: config.bgGradient,
                opacity: isHovered ? 1 : 0.6,
                transition: 'opacity 0.2s ease',
            }} />

            <div style={{ padding: '16px 18px' }}>
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '12px' }}>
                    {/* Icon Container */}
                    <motion.div
                        animate={{ scale: isHovered ? 1.05 : 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: '12px',
                            background: config.bgGradient,
                            border: `1px solid ${config.color}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <ResourceIcon type={resource.type} color={config.color} size={20} />
                    </motion.div>

                    {/* Title and Meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: colors.textPrimary,
                            marginBottom: '4px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            letterSpacing: '-0.2px',
                        }}>
                            {resource.title}
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap',
                        }}>
                            {/* Type Badge */}
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: `${config.color}12`,
                                color: config.color,
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px',
                            }}>
                                {config.label}
                            </span>
                            {/* Date */}
                            <span style={{
                                fontSize: '11px',
                                color: colors.textMuted,
                            }}>
                                {formatDate(resource.createdAt)}
                            </span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: config.bgGradient,
                            border: `1px solid ${config.color}25`,
                            color: config.color,
                            fontSize: '11px',
                            fontWeight: 600,
                        }}
                    >
                        {showCopied ? (
                            <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Copied!
                            </>
                        ) : (
                            <>
                                {resource.type === 'link' && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                        <polyline points="15 3 21 3 21 9" />
                                        <line x1="10" y1="14" x2="21" y2="3" />
                                    </svg>
                                )}
                                {resource.type === 'file' && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                )}
                                {resource.type === 'code' && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                )}
                                {resource.type === 'note' && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                                {resource.type === 'flashcard' && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                )}
                                {config.actionLabel}
                            </>
                        )}
                    </motion.div>
                </div>

                {/* Content Preview */}
                {resource.type === 'code' ? (
                    <div style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                        fontSize: '11px',
                        color: isDarkMode ? '#a5f3fc' : '#0f766e',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        maxHeight: '60px',
                        overflow: 'hidden',
                    }}>
                        {resource.content.substring(0, 120)}{resource.content.length > 120 ? '...' : ''}
                    </div>
                ) : (
                    <div style={{
                        fontSize: '12px',
                        color: colors.textSecondary,
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}>
                        {resource.content.length > 100 
                            ? resource.content.substring(0, 100) + '...' 
                            : resource.content}
                    </div>
                )}

                {/* Footer - Shared By */}
                {resource.sharedBy && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}>
                            <div style={{
                                width: 20,
                                height: 20,
                                borderRadius: '6px',
                                background: `${config.color}15`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 500,
                                color: colors.textMuted,
                            }}>
                                {resource.sharedBy}
                            </span>
                        </div>

                        {/* Language badge for code */}
                        {resource.type === 'code' && resource.language && (
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 500,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                color: colors.textMuted,
                            }}>
                                {resource.language}
                            </span>
                        )}

                        {/* URL preview for links */}
                        {resource.type === 'link' && resource.url && (
                            <span style={{
                                fontSize: '10px',
                                color: colors.textMuted,
                                maxWidth: '120px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}>
                                {(() => {
                                    try {
                                        return new URL(resource.url).hostname.replace('www.', '');
                                    } catch {
                                        return resource.url;
                                    }
                                })()}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// Main Component
const FocusModePage: React.FC = () => {
    const navigate = useNavigate();
    const { groupId } = useParams<{ groupId?: string }>();
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

    // Initialize with empty resources - will be populated from group chat messages
    const [resources, setResources] = useState<Resource[]>([]);
    const [totalFocusTime, setTotalFocusTime] = useState(0);
    const [sessionsCompleted, setSessionsCompleted] = useState(0);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [groupInfo, setGroupInfo] = useState<GroupWithMembers | null>(null);
    const isDarkMode = false;

    // Load initial data from database on mount
    useEffect(() => {
        const studyData = getStudyTimeData();
        const streakData = getStreakData();
        
        // Set today's focus time (convert minutes to seconds for display)
        setTotalFocusTime(studyData.dailyMinutes * 60);
        setCurrentStreak(streakData.currentStreak);
    }, []);

    const colors = {
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
        cardBg: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        textPrimary: isDarkMode ? '#f1f5f9' : '#1e293b',
        textSecondary: isDarkMode ? '#94a3b8' : '#64748b',
        textMuted: isDarkMode ? '#64748b' : '#94a3b8',
        accent: '#3b82f6',
    };

    // Helper function to extract URLs from text
    const extractUrls = (text: string): string[] => {
        const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
        return text.match(urlRegex) || [];
    };

    // Helper function to extract code blocks from text
    const extractCodeBlocks = (text: string): { hasCode: boolean; language?: string; code?: string } => {
        const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
        const match = codeBlockRegex.exec(text);
        if (match) {
            return { hasCode: true, language: match[1] || 'text', code: match[2] };
        }
        return { hasCode: false };
    };

    // Fetch real data from group chat
    useEffect(() => {
        const loadResources = async () => {
            setIsLoading(true);
            try {
                // Fetch group info
                if (groupId) {
                    const groups = await fetchGroups();
                    const group = groups.find(g => g.id === groupId);
                    if (group) {
                        setGroupInfo(group);
                    }

                    // Fetch messages
                    const messages = await fetchGroupMessages(groupId, 100);

                    // Extract resources from messages
                    const extractedResources: Resource[] = [];
                    let resourceId = 1;

                    messages.forEach((msg: ChatMessage) => {
                        // Extract links
                        const urls = extractUrls(msg.content);
                        urls.forEach(url => {
                            // Get domain for title
                            let title = 'Shared Link';
                            try {
                                const urlObj = new URL(url);
                                title = urlObj.hostname.replace('www.', '');
                            } catch { /* ignore */ }

                            extractedResources.push({
                                id: `link-${resourceId++}`,
                                type: 'link',
                                title,
                                content: url,
                                url,
                                createdAt: new Date(msg.created_at),
                                sharedBy: msg.user_name,
                            });
                        });

                        // Extract code blocks
                        const codeInfo = extractCodeBlocks(msg.content);
                        if (codeInfo.hasCode && codeInfo.code) {
                            extractedResources.push({
                                id: `code-${resourceId++}`,
                                type: 'code',
                                title: `Code Snippet (${codeInfo.language || 'text'})`,
                                content: codeInfo.code.substring(0, 100) + (codeInfo.code.length > 100 ? '...' : ''),
                                language: codeInfo.language,
                                createdAt: new Date(msg.created_at),
                                sharedBy: msg.user_name,
                            });
                        }

                        // Extract files from attachments
                        if (msg.attachments && msg.attachments.length > 0) {
                            msg.attachments.forEach(att => {
                                extractedResources.push({
                                    id: `file-${resourceId++}`,
                                    type: 'file',
                                    title: att.name || 'Shared File',
                                    content: att.type || 'File',
                                    url: att.url,
                                    createdAt: new Date(msg.created_at),
                                    sharedBy: msg.user_name,
                                });
                            });
                        }

                        // Check for flashcard content
                        if (msg.content.includes('**Flashcard**') || msg.content.includes('📚')) {
                            const lines = msg.content.split('\n');
                            const title = lines.find(l => l.includes('**'))?.replace(/\*\*/g, '').trim() || 'Flashcard';
                            extractedResources.push({
                                id: `flashcard-${resourceId++}`,
                                type: 'flashcard',
                                title,
                                content: msg.content.substring(0, 100) + '...',
                                createdAt: new Date(msg.created_at),
                                sharedBy: msg.user_name,
                            });
                        }

                        // Check for note/summary content (longer messages without code/links)
                        if (msg.content.length > 200 && !codeInfo.hasCode && urls.length === 0 && !msg.content.includes('**Flashcard**')) {
                            extractedResources.push({
                                id: `note-${resourceId++}`,
                                type: 'note',
                                title: 'Study Note',
                                content: msg.content.substring(0, 100) + '...',
                                createdAt: new Date(msg.created_at),
                                sharedBy: msg.user_name,
                            });
                        }
                    });

                    // Set extracted resources (empty if none found)
                    setResources(extractedResources);
                } else {
                    // No groupId - keep resources empty
                    setResources([]);
                }
            } catch (error) {
                console.error('Error loading resources:', error);
                // Keep resources empty on error
                setResources([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadResources();
    }, [groupId]);

    // Helper function to extract resource from a single message
    const extractResourceFromMessage = useCallback((msg: ChatMessage): Resource[] => {
        const extractedResources: Resource[] = [];
        const timestamp = Date.now();

        // Extract links
        const urls = extractUrls(msg.content);
        urls.forEach((url, idx) => {
            let title = 'Shared Link';
            try {
                const urlObj = new URL(url);
                title = urlObj.hostname.replace('www.', '');
            } catch { /* ignore */ }

            extractedResources.push({
                id: `link-${msg.id}-${idx}-${timestamp}`,
                type: 'link',
                title,
                content: url,
                url,
                createdAt: new Date(msg.created_at),
                sharedBy: msg.user_name,
            });
        });

        // Extract code blocks
        const codeInfo = extractCodeBlocks(msg.content);
        if (codeInfo.hasCode && codeInfo.code) {
            extractedResources.push({
                id: `code-${msg.id}-${timestamp}`,
                type: 'code',
                title: `Code Snippet (${codeInfo.language || 'text'})`,
                content: codeInfo.code.substring(0, 100) + (codeInfo.code.length > 100 ? '...' : ''),
                language: codeInfo.language,
                createdAt: new Date(msg.created_at),
                sharedBy: msg.user_name,
            });
        }

        // Extract files from attachments
        if (msg.attachments && msg.attachments.length > 0) {
            msg.attachments.forEach((att, idx) => {
                extractedResources.push({
                    id: `file-${msg.id}-${idx}-${timestamp}`,
                    type: 'file',
                    title: att.name || 'Shared File',
                    content: att.type || 'File',
                    url: att.url,
                    createdAt: new Date(msg.created_at),
                    sharedBy: msg.user_name,
                });
            });
        }

        // Check for flashcard content
        if (msg.content.includes('**Flashcard**') || msg.content.includes('📚')) {
            const lines = msg.content.split('\n');
            const title = lines.find(l => l.includes('**'))?.replace(/\*\*/g, '').trim() || 'Flashcard';
            extractedResources.push({
                id: `flashcard-${msg.id}-${timestamp}`,
                type: 'flashcard',
                title,
                content: msg.content.substring(0, 100) + '...',
                createdAt: new Date(msg.created_at),
                sharedBy: msg.user_name,
            });
        }

        // Check for note/summary content
        if (msg.content.length > 200 && !codeInfo.hasCode && urls.length === 0 && !msg.content.includes('**Flashcard**')) {
            extractedResources.push({
                id: `note-${msg.id}-${timestamp}`,
                type: 'note',
                title: 'Study Note',
                content: msg.content.substring(0, 100) + '...',
                createdAt: new Date(msg.created_at),
                sharedBy: msg.user_name,
            });
        }

        return extractedResources;
    }, []);

    // Real-time subscription for new messages
    useEffect(() => {
        if (!groupId) return;

        // Subscribe to new messages in real-time
        const unsubscribe = subscribeToMessages(groupId, (newMessage) => {
            // Extract resources from the new message
            const newResources = extractResourceFromMessage(newMessage);
            
            if (newResources.length > 0) {
                setResources(prev => [...prev, ...newResources]);
            }
        });

        // Cleanup subscription on unmount or groupId change
        return () => {
            unsubscribe();
        };
    }, [groupId, extractResourceFromMessage]);

    const filteredResources = useMemo(() => {
        if (activeFilter === 'all') return resources;
        const typeMap: Record<FilterTab, Resource['type'] | undefined> = {
            all: undefined,
            links: 'link',
            files: 'file',
            code: 'code',
            notes: 'note',
        };
        return resources.filter(r => r.type === typeMap[activeFilter]);
    }, [resources, activeFilter]);

    const resourceCounts = useMemo(() => ({
        all: resources.length,
        links: resources.filter(r => r.type === 'link').length,
        files: resources.filter(r => r.type === 'file').length,
        code: resources.filter(r => r.type === 'code').length,
        notes: resources.filter(r => r.type === 'note' || r.type === 'flashcard').length,
    }), [resources]);

    const handleSessionComplete = useCallback((duration: number) => {
        // Update local state
        setTotalFocusTime(t => t + duration);
        setSessionsCompleted(s => s + 1);
        
        // Save to database (duration is in seconds, addStudyTime expects minutes)
        const durationMinutes = Math.floor(duration / 60);
        if (durationMinutes > 0) {
            addStudyTime(durationMinutes);
            
            // Refresh streak data after saving
            const streakData = getStreakData();
            setCurrentStreak(streakData.currentStreak);
        }
    }, []);

    if (isLoading) {
        return <FocusSkeleton isDarkMode={isDarkMode} />;
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: colors.bg,
            padding: '24px',
        }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '18px 22px',
                        borderRadius: '16px',
                        background: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                        marginBottom: '24px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(-1)}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: '10px',
                                border: `1px solid ${colors.border}`,
                                background: 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: colors.textSecondary,
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
                            </svg>
                        </motion.button>
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <circle cx="12" cy="12" r="4" />
                                <line x1="12" y1="2" x2="12" y2="4" />
                                <line x1="12" y1="20" x2="12" y2="22" />
                                <line x1="2" y1="12" x2="4" y2="12" />
                                <line x1="20" y1="12" x2="22" y2="12" />
                            </svg>
                        </div>
                        <div>
                            <h1 style={{
                                margin: 0,
                                fontSize: '20px',
                                fontWeight: 700,
                                color: colors.textPrimary,
                                letterSpacing: '-0.3px',
                            }}>
                                Focus Mode
                            </h1>
                            <p style={{
                                margin: '2px 0 0',
                                fontSize: '13px',
                                color: colors.textMuted,
                            }}>
                                Distraction-free study environment
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Stats */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6' }}>
                                {Math.floor(totalFocusTime / 60)}m focused today
                            </span>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(-1)}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: `1px solid ${colors.border}`,
                                background: 'transparent',
                                color: colors.textSecondary,
                                fontSize: '13px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            Exit Focus
                        </motion.button>
                    </div>
                </motion.div>

                {/* Main Content */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
                    {/* Resources Section - wrapped in LayoutGroup for smooth height animations */}
                    <LayoutGroup>
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                layout: {
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 30,
                                },
                                opacity: { duration: 0.3 },
                                y: { type: 'spring', stiffness: 300, damping: 30 }
                            }}
                            style={{
                                padding: '20px',
                                borderRadius: '16px',
                                background: colors.cardBg,
                                border: `1px solid ${colors.border}`,
                            }}
                        >
                            {/* Header - completely excluded from layout animations */}
                            <motion.div
                                layout="position"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '16px',
                                }}
                            >
                                {/* Title */}
                                <div
                                    style={{
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        color: colors.textPrimary,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        flexShrink: 0,
                                    }}
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#3b82f6"
                                        strokeWidth="2"
                                    >
                                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                    </svg>
                                    Study Resources {groupInfo?.name && `- ${groupInfo.name}`}
                                </div>

                                {/* Filter tabs */}
                                <div style={{ flexShrink: 0 }}>
                                    <FilterTabs
                                        activeFilter={activeFilter}
                                        setActiveFilter={setActiveFilter}
                                        isDarkMode={isDarkMode}
                                        colors={colors}
                                        resourceCounts={resourceCounts}
                                    />
                                </div>
                            </motion.div>

                            {/* Resources List - with smooth height animation */}
                            <motion.div
                                layout
                                transition={{
                                    layout: {
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 30,
                                    }
                                }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                    overflow: 'hidden',
                                }}
                            >
                                <AnimatePresence mode="popLayout" initial={false}>
                                    {filteredResources.length > 0 ? (
                                        filteredResources.map((resource, index) => (
                                            <motion.div
                                                key={resource.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 400,
                                                    damping: 30,
                                                    delay: index * 0.03,
                                                    layout: {
                                                        type: 'spring',
                                                        stiffness: 300,
                                                        damping: 30,
                                                    }
                                                }}
                                            >
                                                <ResourceCard
                                                    resource={resource}
                                                    isDarkMode={isDarkMode}
                                                    colors={colors}
                                                    index={index}
                                                />
                                            </motion.div>
                                        ))
                                    ) : (
                                        <motion.div
                                            key={`empty-${activeFilter}`}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 300,
                                                damping: 30,
                                            }}
                                            style={{
                                                padding: '30px 20px',
                                                textAlign: 'center',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                width: '100%',
                                            }}
                                        >
                                            {/* Lord Icon Container */}
                                            <div style={{
                                                width: 80,
                                                height: 80,
                                                borderRadius: '18px',
                                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%)',
                                                border: '1px solid rgba(59, 130, 246, 0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginBottom: '16px',
                                            }}>
                                                {/* Lord Icon - Study Resources Animation */}
                                                <lord-icon
                                                    src="https://cdn.lordicon.com/hjrbjhnq.json"
                                                    trigger="in"
                                                    delay="200"
                                                    state="in-book"
                                                    colors="primary:#3b82f6,secondary:#60a5fa"
                                                    style={{ width: '50px', height: '50px' }}
                                                />
                                            </div>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '15px',
                                                fontWeight: 600,
                                                color: colors.textSecondary,
                                                letterSpacing: '-0.2px',
                                            }}>
                                                {activeFilter === 'all' 
                                                    ? (groupId ? 'No resources shared yet' : 'No group selected')
                                                    : `No ${activeFilter} found`}
                                            </p>
                                            <p style={{
                                                margin: '8px 0 0',
                                                fontSize: '13px',
                                                color: colors.textMuted,
                                                maxWidth: '280px',
                                                lineHeight: '1.5',
                                            }}>
                                                {activeFilter === 'all'
                                                    ? (groupId 
                                                        ? 'Share links, code, files, or notes in your group chat to see them here'
                                                        : 'Enter Focus Mode from a group chat to see shared resources')
                                                    : `Try sharing some ${activeFilter} in your group chat`}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </motion.div>
                    </LayoutGroup>

                    {/* Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <PomodoroTimer
                            isDarkMode={isDarkMode}
                            colors={colors}
                            onSessionComplete={handleSessionComplete}
                        />
                        <SessionStats
                            isDarkMode={isDarkMode}
                            colors={colors}
                            totalFocusTime={totalFocusTime}
                            sessionsCompleted={sessionsCompleted}
                            currentStreak={currentStreak}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FocusModePage;
