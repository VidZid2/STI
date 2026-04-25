/**
 * PomodoroTimer
 * Compact professional Pomodoro/focus timer.
 * Extracted from FocusModePage.tsx during Phase 8.5
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { FocusModeColors } from '../FocusModePage';

// Timer Duration Options
const FOCUS_DURATIONS = [15, 25, 30, 45, 60, 90];
const BREAK_DURATIONS = [5, 10, 15, 20];

// Pomodoro Timer Component - Compact Professional Design
const TIMER_SETTINGS_KEY = 'focus-timer-settings';

const PomodoroTimer: React.FC<{
    isDarkMode: boolean;
    colors: FocusModeColors;
    onSessionComplete: (duration: number) => void;
    onStateChange?: (state: { isRunning: boolean; mode: 'focus' | 'break'; timeLeft: number }) => void;
    controlsRef?: React.MutableRefObject<{ toggleTimer: () => void; resetTimer: () => void } | null>;
}> = ({ isDarkMode, colors, onSessionComplete, onStateChange, controlsRef }) => {
    // Load saved settings from localStorage
    const getSavedSettings = () => {
        try {
            const saved = localStorage.getItem(TIMER_SETTINGS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    focusDuration: parsed.focusDuration || 25,
                    breakDuration: parsed.breakDuration || 5,
                };
            }
        } catch (e) {
        }
        return { focusDuration: 25, breakDuration: 5 };
    };

    const savedSettings = getSavedSettings();
    const [focusDuration, setFocusDuration] = useState(savedSettings.focusDuration);
    const [breakDuration, setBreakDuration] = useState(savedSettings.breakDuration);
    const [timeLeft, setTimeLeft] = useState(savedSettings.focusDuration * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [mode, setMode] = useState<'focus' | 'break'>('focus');
    const [sessions, setSessions] = useState(0);
    const [isResetting, setIsResetting] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const timerCompleteAudioRef = useRef<HTMLAudioElement | null>(null);

    // Save settings to localStorage when they change
    useEffect(() => {
        localStorage.setItem(TIMER_SETTINGS_KEY, JSON.stringify({
            focusDuration,
            breakDuration,
        }));
    }, [focusDuration, breakDuration]);

    // Play completion sound
    const playCompletionSound = useCallback(() => {
        try {
            if (timerCompleteAudioRef.current) {
                timerCompleteAudioRef.current.currentTime = 0;
                timerCompleteAudioRef.current.play().catch(() => {});
            } else {
                const audio = new Audio('/sounds/timer-complete.mp3');
                audio.volume = 0.7;
                timerCompleteAudioRef.current = audio;
                audio.play().catch(() => {});
            }
        } catch {
        }
    }, []);

    // Expose controls to parent via ref
    useEffect(() => {
        if (controlsRef) {
            controlsRef.current = {
                toggleTimer: () => setIsRunning(prev => !prev),
                resetTimer: () => handleReset(),
            };
        }
    }, [controlsRef]);

    // Notify parent of state changes
    useEffect(() => {
        onStateChange?.({ isRunning, mode, timeLeft });
    }, [isRunning, mode, timeLeft, onStateChange]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(t => t - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsRunning(false);
            // Play completion sound
            playCompletionSound();

            if (mode === 'focus') {
                setSessions(s => s + 1);
                onSessionComplete(focusDuration * 60);
                setMode('break');
                setTimeLeft(breakDuration * 60);
            } else {
                setMode('focus');
                setTimeLeft(focusDuration * 60);
            }
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft, mode, onSessionComplete, focusDuration, breakDuration, playCompletionSound]);

    const handleReset = () => {
        setIsRunning(false);
        setIsResetting(true);
        setTimeout(() => {
            setTimeLeft(mode === 'focus' ? focusDuration * 60 : breakDuration * 60);
            setIsResetting(false);
        }, 400);
    };

    const handleDurationChange = (newDuration: number, type: 'focus' | 'break') => {
        if (type === 'focus') {
            setFocusDuration(newDuration);
            if (mode === 'focus' && !isRunning) {
                setTimeLeft(newDuration * 60);
            }
        } else {
            setBreakDuration(newDuration);
            if (mode === 'break' && !isRunning) {
                setTimeLeft(newDuration * 60);
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return { mins: mins.toString().padStart(2, '0'), secs: secs.toString().padStart(2, '0') };
    };

    const totalTime = mode === 'focus' ? focusDuration * 60 : breakDuration * 60;
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
                background: 'var(--bg-primary)',
                border: `1px solid var(--border-color)`,
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
                            color: 'var(--text-primary)',
                        }}>
                            {mode === 'focus' ? 'Focus' : 'Break'}
                        </div>
                        <div style={{
                            fontSize: '10px',
                            color: 'var(--text-muted)',
                        }}>
                            {sessions} session{sessions !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Settings Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowSettings(!showSettings)}
                        disabled={isRunning}
                        style={{
                            width: 26,
                            height: 26,
                            borderRadius: '6px',
                            border: 'none',
                            background: showSettings
                                ? 'rgba(59, 130, 246, 0.12)'
                                : ('var(--dashboard-surface)'),
                            cursor: isRunning ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: showSettings ? '#3b82f6' : 'var(--text-muted)',
                            opacity: isRunning ? 0.5 : 1,
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    </motion.button>

                    {/* Compact Mode Toggle */}
                    <div style={{
                        display: 'flex',
                        gap: '2px',
                        padding: '2px',
                        borderRadius: '6px',
                        background: 'var(--dashboard-surface)',
                    }}>
                        <button
                            onClick={() => { if (!isRunning) { setMode('focus'); setTimeLeft(focusDuration * 60); } }}
                            style={{
                                padding: '3px 8px',
                                borderRadius: '5px',
                                border: 'none',
                                background: mode === 'focus' ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                                color: mode === 'focus' ? '#3b82f6' : 'var(--text-muted)',
                                fontSize: '10px',
                                fontWeight: 500,
                                cursor: isRunning ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            Focus
                        </button>
                        <button
                            onClick={() => { if (!isRunning) { setMode('break'); setTimeLeft(breakDuration * 60); } }}
                            style={{
                                padding: '3px 8px',
                                borderRadius: '5px',
                                border: 'none',
                                background: mode === 'break' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                                color: mode === 'break' ? '#10b981' : 'var(--text-muted)',
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
            </div>

            {/* Duration Settings Panel */}
            <AnimatePresence>
                {showSettings && !isRunning && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden', marginBottom: '12px' }}
                    >
                        <div style={{
                            padding: '12px',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.03)',
                            border: `1px solid ${'rgba(255,255,255,0.06)'}`,
                        }}>
                            {/* Focus Duration */}
                            <div style={{ marginBottom: '10px' }}>
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    color: '#3b82f6',
                                    marginBottom: '6px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.3px',
                                }}>
                                    Focus Duration
                                </div>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    {FOCUS_DURATIONS.map((dur) => (
                                        <motion.button
                                            key={dur}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleDurationChange(dur, 'focus')}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                border: focusDuration === dur
                                                    ? '1px solid rgba(59, 130, 246, 0.4)'
                                                    : `1px solid var(--border-color)`,
                                                background: focusDuration === dur
                                                    ? 'rgba(59, 130, 246, 0.12)'
                                                    : 'transparent',
                                                color: focusDuration === dur ? '#3b82f6' : 'var(--text-secondary)',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            {dur}m
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Break Duration */}
                            <div>
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    color: '#10b981',
                                    marginBottom: '6px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.3px',
                                }}>
                                    Break Duration
                                </div>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    {BREAK_DURATIONS.map((dur) => (
                                        <motion.button
                                            key={dur}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleDurationChange(dur, 'break')}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                border: breakDuration === dur
                                                    ? '1px solid rgba(16, 185, 129, 0.4)'
                                                    : `1px solid var(--border-color)`,
                                                background: breakDuration === dur
                                                    ? 'rgba(16, 185, 129, 0.12)'
                                                    : 'transparent',
                                                color: breakDuration === dur ? '#10b981' : 'var(--text-secondary)',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            {dur}m
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Compact Timer Display */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '12px',
            }}>
                <motion.div
                    style={{ position: 'relative', width: size, height: size }}
                    animate={isResetting ? {
                        rotate: [0, -8, 0],
                        scale: [1, 0.95, 1],
                    } : {}}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={'var(--bg-hover)'}
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
                            animate={{
                                strokeDashoffset: circumference * (1 - progress / 100),
                                opacity: isResetting ? [1, 0.5, 1] : 1,
                            }}
                            transition={isResetting ? {
                                strokeDashoffset: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                                opacity: { duration: 0.4, ease: 'easeInOut' },
                            } : {
                                duration: 0.3,
                                ease: 'easeOut',
                            }}
                            style={{ filter: `drop-shadow(0 0 4px ${mode === 'focus' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(16, 185, 129, 0.25)'})` }}
                        />
                    </svg>

                    <motion.div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                        }}
                        animate={isResetting ? {
                            opacity: [1, 0.6, 1],
                        } : {}}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                    >
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
                    </motion.div>
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
                        border: `1px solid var(--border-color)`,
                        background: 'transparent',
                        color: 'var(--text-secondary)',
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


export { PomodoroTimer };
