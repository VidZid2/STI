/**
 * Focus Mode Page - Dedicated Study Session Interface
 * Minimalistic professional design matching PathsContent/GoalsContent style
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { fetchGroupMessages, subscribeToMessages, type ChatMessage } from '../../../services/chatService';
import { fetchGroups, type GroupWithMembers } from '../../../services/groupsService';
import { getStudyTimeData, getStreakData, addStudyTime, type StudyTimeData } from '../../../services/studyTimeService';

// Custom Volume Slider Styles (injected once)
const volumeSliderStyles = `
  .focus-volume-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 3px;
    outline: none;
    cursor: pointer;
  }
  .focus-volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .focus-volume-slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 3px 10px rgba(59, 130, 246, 0.5);
  }
  .focus-volume-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .focus-volume-slider::-moz-range-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 3px 10px rgba(59, 130, 246, 0.5);
  }
  .focus-volume-slider::-ms-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
  }
`;

// Inject styles once
if (typeof document !== 'undefined' && !document.getElementById('focus-volume-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'focus-volume-styles';
    styleEl.textContent = volumeSliderStyles;
    document.head.appendChild(styleEl);
}

// Break Suggestions Data
const BREAK_SUGGESTIONS = [
    { icon: '👁️', title: 'Eye Rest', description: 'Look at something 20ft away for 20 seconds', duration: '20s' },
    { icon: '🧘', title: 'Stretch', description: 'Stand up and stretch your arms and back', duration: '1m' },
    { icon: '💧', title: 'Hydrate', description: 'Drink a glass of water', duration: '30s' },
    { icon: '🚶', title: 'Walk', description: 'Take a short walk around the room', duration: '2m' },
    { icon: '🌬️', title: 'Breathe', description: 'Take 5 deep breaths slowly', duration: '1m' },
    { icon: '🙆', title: 'Neck Roll', description: 'Gently roll your neck in circles', duration: '30s' },
];

// Timer Duration Options
const FOCUS_DURATIONS = [15, 25, 30, 45, 60, 90];
const BREAK_DURATIONS = [5, 10, 15, 20];

// Types
interface Resource {
    id: string;
    type: 'link' | 'file' | 'code' | 'note' | 'flashcard' | 'image';
    title: string;
    content: string;
    url?: string;
    previewUrl?: string; // For image thumbnails
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

type FilterTab = 'all' | 'links' | 'files' | 'images' | 'code' | 'notes';
// ToolTab reserved for future sidebar tools
// type ToolTab = 'timer' | 'flashcards' | 'notes' | 'whiteboard';

// Skeleton Loading Component
const FocusSkeleton: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    const colors = {
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
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
        <div style={{
            height: '100vh',
            background: colors.bg,
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            <div style={{ maxWidth: '1600px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
                {/* Header Skeleton */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 18px',
                    borderRadius: '14px',
                    background: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <SkeletonBox width="36px" height="36px" borderRadius="10px" />
                        <SkeletonBox width="40px" height="40px" borderRadius="12px" />
                        <div>
                            <SkeletonBox width="120px" height="18px" style={{ marginBottom: '6px' }} />
                            <SkeletonBox width="160px" height="12px" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <SkeletonBox width="100px" height="28px" borderRadius="8px" />
                        <SkeletonBox width="70px" height="32px" borderRadius="8px" />
                    </div>
                </div>

                {/* Main Content - 3 Column Layout */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '280px 1fr 300px',
                    gap: '16px',
                    flex: 1,
                    minHeight: 0,
                }}>
                    {/* Left Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Timer Skeleton */}
                        <div style={{
                            padding: '14px',
                            borderRadius: '14px',
                            background: colors.cardBg,
                            border: `1px solid ${colors.border}`,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <SkeletonBox width="28px" height="28px" borderRadius="8px" />
                                    <div>
                                        <SkeletonBox width="50px" height="12px" style={{ marginBottom: '4px' }} />
                                        <SkeletonBox width="70px" height="10px" />
                                    </div>
                                </div>
                                <SkeletonBox width="90px" height="24px" borderRadius="6px" />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                                <SkeletonBox width="110px" height="110px" borderRadius="50%" />
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <SkeletonBox width="100%" height="32px" borderRadius="8px" />
                                <SkeletonBox width="70px" height="32px" borderRadius="8px" />
                            </div>
                        </div>

                        {/* Stats Skeleton */}
                        <div style={{
                            padding: '14px',
                            borderRadius: '14px',
                            background: colors.cardBg,
                            border: `1px solid ${colors.border}`,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <SkeletonBox width="28px" height="28px" borderRadius="8px" />
                                <SkeletonBox width="100px" height="12px" />
                            </div>
                            <SkeletonBox width="100%" height="5px" borderRadius="3px" style={{ marginBottom: '12px' }} />
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <SkeletonBox width="100%" height="60px" borderRadius="8px" />
                                <SkeletonBox width="100%" height="60px" borderRadius="8px" />
                                <SkeletonBox width="100%" height="60px" borderRadius="8px" />
                            </div>
                        </div>

                        {/* Weekly Trend Skeleton */}
                        <div style={{
                            padding: '14px',
                            borderRadius: '14px',
                            background: colors.cardBg,
                            border: `1px solid ${colors.border}`,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <SkeletonBox width="28px" height="28px" borderRadius="8px" />
                                    <div>
                                        <SkeletonBox width="80px" height="12px" style={{ marginBottom: '4px' }} />
                                        <SkeletonBox width="60px" height="10px" />
                                    </div>
                                </div>
                                <SkeletonBox width="60px" height="22px" borderRadius="6px" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '60px', gap: '6px' }}>
                                {[30, 50, 20, 70, 40, 60, 45].map((h, i) => (
                                    <SkeletonBox key={i} width="100%" height={`${h}%`} borderRadius="4px" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Center Column - Resources */}
                    <div style={{
                        padding: '16px',
                        borderRadius: '14px',
                        background: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <SkeletonBox width="120px" height="16px" />
                            <SkeletonBox width="200px" height="32px" borderRadius="12px" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                            {[1, 2, 3, 4].map((i) => (
                                <SkeletonBox key={i} width="100%" height="90px" borderRadius="14px" />
                            ))}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Ambient Sounds Skeleton */}
                        <div style={{
                            padding: '16px',
                            borderRadius: '14px',
                            background: colors.cardBg,
                            border: `1px solid ${colors.border}`,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                                <SkeletonBox width="32px" height="32px" borderRadius="10px" />
                                <div>
                                    <SkeletonBox width="100px" height="13px" style={{ marginBottom: '4px' }} />
                                    <SkeletonBox width="70px" height="11px" />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <SkeletonBox key={i} width="100%" height="56px" borderRadius="10px" />
                                ))}
                            </div>
                        </div>

                        {/* Quote Skeleton */}
                        <div style={{
                            padding: '20px',
                            borderRadius: '16px',
                            background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                            border: `1px solid rgba(59, 130, 246, 0.2)`,
                        }}>
                            <SkeletonBox width="24px" height="24px" borderRadius="4px" style={{ marginBottom: '16px' }} />
                            <SkeletonBox width="100%" height="14px" style={{ marginBottom: '8px' }} />
                            <SkeletonBox width="90%" height="14px" style={{ marginBottom: '12px' }} />
                            <SkeletonBox width="100px" height="12px" />
                        </div>

                        {/* Shortcuts Skeleton */}
                        <div style={{
                            padding: '14px 16px',
                            borderRadius: '14px',
                            background: colors.cardBg,
                            border: `1px solid ${colors.border}`,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <SkeletonBox width="28px" height="28px" borderRadius="8px" />
                                <SkeletonBox width="70px" height="12px" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <SkeletonBox width="40px" height="20px" borderRadius="5px" />
                                        <SkeletonBox width="60px" height="10px" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
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
        image: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
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
            id: 'images', label: 'Images', icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
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
const TIMER_SETTINGS_KEY = 'focus-timer-settings';

const PomodoroTimer: React.FC<{
    isDarkMode: boolean;
    colors: any;
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
                timerCompleteAudioRef.current.play().catch(err =>
            } else {
                const audio = new Audio('/sounds/timer-complete.mp3');
                audio.volume = 0.7;
                timerCompleteAudioRef.current = audio;
                audio.play().catch(err =>
            }
        } catch (err) {
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
                                : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                            cursor: isRunning ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: showSettings ? '#3b82f6' : colors.textMuted,
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
                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    }}>
                        <button
                            onClick={() => { if (!isRunning) { setMode('focus'); setTimeLeft(focusDuration * 60); } }}
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
                            onClick={() => { if (!isRunning) { setMode('break'); setTimeLeft(breakDuration * 60); } }}
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
                            background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(59, 130, 246, 0.03)',
                            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(59, 130, 246, 0.1)'}`,
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
                                                    : `1px solid ${colors.border}`,
                                                background: focusDuration === dur
                                                    ? 'rgba(59, 130, 246, 0.12)'
                                                    : 'transparent',
                                                color: focusDuration === dur ? '#3b82f6' : colors.textSecondary,
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
                                                    : `1px solid ${colors.border}`,
                                                background: breakDuration === dur
                                                    ? 'rgba(16, 185, 129, 0.12)'
                                                    : 'transparent',
                                                color: breakDuration === dur ? '#10b981' : colors.textSecondary,
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

// Motivational Quote Component
const MotivationalQuote: React.FC<{
    isDarkMode: boolean;
    colors: any;
    isBreakMode: boolean;
}> = ({ isBreakMode }) => {
    const [quote, setQuote] = useState(STUDY_QUOTES[0]);
    const [isChanging, setIsChanging] = useState(false);

    const getRandomQuote = useCallback(() => {
        const newQuote = STUDY_QUOTES[Math.floor(Math.random() * STUDY_QUOTES.length)];
        setIsChanging(true);
        setTimeout(() => {
            setQuote(newQuote);
            setIsChanging(false);
        }, 200);
    }, []);

    useEffect(() => {
        getRandomQuote();
    }, [isBreakMode]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 25 }}
            style={{
                padding: '20px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Yellow quote marks */}
            <div style={{
                position: 'absolute',
                top: 16,
                left: 16,
                color: '#fbbf24',
                fontSize: '32px',
                fontWeight: 900,
                lineHeight: 1,
                fontFamily: 'Georgia, serif',
            }}>
                "
            </div>

            {/* Close/Refresh button */}
            <motion.button
                whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.2)' }}
                whileTap={{ scale: 0.95 }}
                onClick={getRandomQuote}
                style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    border: 'none',
                    background: 'rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.8)',
                    transition: 'all 0.2s ease',
                }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                </svg>
            </motion.button>

            {/* Quote content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={quote.text}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: isChanging ? 0 : 1, y: isChanging ? 5 : 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    style={{ marginTop: '28px' }}
                >
                    <p style={{
                        margin: 0,
                        fontSize: '14px',
                        fontStyle: 'italic',
                        color: '#ffffff',
                        lineHeight: 1.6,
                        marginBottom: '12px',
                        fontWeight: 500,
                    }}>
                        "{quote.text}"
                    </p>
                    <p style={{
                        margin: 0,
                        fontSize: '12px',
                        color: '#fbbf24',
                        fontWeight: 600,
                    }}>
                        — {quote.author}
                    </p>
                </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <div style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
            }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" />
                    <path d="M12 20v2" />
                    <path d="m4.93 4.93 1.41 1.41" />
                    <path d="m17.66 17.66 1.41 1.41" />
                    <path d="M2 12h2" />
                    <path d="M20 12h2" />
                    <path d="m6.34 17.66-1.41 1.41" />
                    <path d="m19.07 4.93-1.41 1.41" />
                </svg>
                <span style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.8)',
                    fontWeight: 500,
                }}>
                    Daily inspiration
                </span>
            </div>
        </motion.div>
    );
};

// Ambient Sounds Data - Add your MP3 files to public/sounds/ folder
const AMBIENT_SOUNDS = [
    {
        id: 'lofi',
        name: 'Lo-Fi',
        color: '#8b5cf6',
        url: '/sounds/lofi.mp3',
    },
    {
        id: 'rain',
        name: 'Rain',
        color: '#3b82f6',
        url: '/sounds/rain.mp3',
    },
    {
        id: 'cafe',
        name: 'Café',
        color: '#f59e0b',
        url: '/sounds/cafe.mp3',
    },
    {
        id: 'nature',
        name: 'Nature',
        color: '#10b981',
        url: '/sounds/nature.mp3',
    },
    {
        id: 'fire',
        name: 'Fire',
        color: '#ef4444',
        url: '/sounds/fire.mp3',
    },
    {
        id: 'waves',
        name: 'Waves',
        color: '#06b6d4',
        url: '/sounds/waves.mp3',
    },
];

// Sound Icon Component
const SoundIcon: React.FC<{ id: string; color: string; size?: number }> = ({ id, color, size = 18 }) => {
    const icons: Record<string, React.ReactNode> = {
        lofi: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
            </svg>
        ),
        rain: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M16 14v6" />
                <path d="M8 14v6" />
                <path d="M12 16v6" />
            </svg>
        ),
        cafe: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                <line x1="6" y1="2" x2="6" y2="4" />
                <line x1="10" y1="2" x2="10" y2="4" />
                <line x1="14" y1="2" x2="14" y2="4" />
            </svg>
        ),
        nature: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
        ),
        fire: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
        ),
        waves: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            </svg>
        ),
    };
    return <>{icons[id] || icons.lofi}</>;
};

// Ambient Sounds Component
const AmbientSounds: React.FC<{
    isDarkMode: boolean;
    colors: any;
    activeSound?: string | null;
    onSoundChange?: (soundId: string | null) => void;
}> = ({ isDarkMode, colors, activeSound: externalActiveSound, onSoundChange }) => {
    const [internalActiveSound, setInternalActiveSound] = useState<string | null>(null);
    const [volume, setVolume] = useState(70);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const activeSound = externalActiveSound !== undefined ? externalActiveSound : internalActiveSound;
    const setActiveSound = onSoundChange || setInternalActiveSound;

    // Handle volume changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume / 100;
        }
    }, [volume]);

    const toggleSound = (soundId: string) => {
        if (activeSound === soundId) {
            // Stop current sound
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                audioRef.current = null;
            }
            setActiveSound(null);
        } else {
            // Stop previous sound
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }

            // Find the sound URL
            const sound = AMBIENT_SOUNDS.find(s => s.id === soundId);
            if (sound) {
                const audio = new Audio(sound.url);
                audio.loop = true;
                audio.volume = volume / 100;
                audio.play().catch(err =>
                audioRef.current = audio;
                setActiveSound(soundId);
            }
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
            style={{
                padding: '16px',
                borderRadius: '14px',
                background: isDarkMode ? '#1e293b' : '#ffffff',
                border: `1px solid ${colors.border}`,
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '14px',
            }}>
                <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3b82f6',
                }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </svg>
                </div>
                <div>
                    <div style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: colors.textPrimary,
                    }}>
                        Ambient Sounds
                    </div>
                    <div style={{
                        fontSize: '11px',
                        color: colors.textMuted,
                    }}>
                        {activeSound ? 'Playing...' : 'Select to play'}
                    </div>
                </div>
                {activeSound && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                            marginLeft: 'auto',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#10b981',
                        }}
                    />
                )}
            </div>

            {/* Sound Grid - 3x2 layout */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
            }}>
                {AMBIENT_SOUNDS.map((sound) => {
                    const isActive = activeSound === sound.id;
                    return (
                        <motion.button
                            key={sound.id}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleSound(sound.id)}
                            style={{
                                padding: '12px 8px',
                                borderRadius: '10px',
                                border: isActive
                                    ? `2px solid ${sound.color}40`
                                    : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                                background: isActive
                                    ? `${sound.color}10`
                                    : (isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease',
                                boxShadow: isActive ? `0 4px 12px ${sound.color}20` : 'none',
                            }}
                        >
                            <SoundIcon id={sound.id} color={isActive ? sound.color : colors.textMuted} size={20} />
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: isActive ? sound.color : colors.textSecondary,
                            }}>
                                {sound.name}
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Volume Slider */}
            <AnimatePresence>
                {activeSound && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ marginTop: '14px', overflow: 'hidden' }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            </svg>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume}
                                onChange={(e) => setVolume(Number(e.target.value))}
                                className="focus-volume-slider"
                                style={{
                                    flex: 1,
                                    height: '6px',
                                    borderRadius: '3px',
                                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} ${volume}%, ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} 100%)`,
                                }}
                            />
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: colors.textMuted,
                                minWidth: '28px',
                                textAlign: 'right',
                            }}>
                                {volume}%
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Session Goal Component
const SessionGoal: React.FC<{
    isDarkMode: boolean;
    colors: any;
    sessionGoal: number;
    setSessionGoal: (goal: number) => void;
    currentProgress: number;
}> = ({ isDarkMode, colors, sessionGoal, setSessionGoal, currentProgress }) => {
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
                background: isDarkMode ? '#1e293b' : '#ffffff',
                border: `1px solid ${colors.border}`,
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.06) 100%)',
                        border: '1px solid rgba(245, 158, 11, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#f59e0b',
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="6" />
                            <circle cx="12" cy="12" r="2" />
                        </svg>
                    </div>
                    <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: colors.textPrimary,
                    }}>
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
                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        cursor: 'pointer',
                        fontSize: '10px',
                        fontWeight: 500,
                        color: colors.textMuted,
                    }}
                >
                    {isEditing ? 'Done' : 'Edit'}
                </motion.button>
            </div>

            {/* Goal Display */}
            <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '4px',
                marginBottom: '10px',
            }}>
                <span style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#f59e0b',
                }}>
                    {sessionGoal}
                </span>
                <span style={{
                    fontSize: '12px',
                    color: colors.textMuted,
                }}>
                    min target
                </span>
            </div>

            {/* Progress Bar */}
            <div style={{
                height: '6px',
                borderRadius: '3px',
                background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                overflow: 'hidden',
                marginBottom: '8px',
            }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{
                        height: '100%',
                        borderRadius: '3px',
                        background: progressPercent >= 100
                            ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                            : 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
                    }}
                />
            </div>

            <div style={{
                fontSize: '11px',
                color: colors.textMuted,
            }}>
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
                            flexWrap: 'wrap',
                        }}>
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
                                            : `1px solid ${colors.border}`,
                                        background: sessionGoal === goal
                                            ? 'rgba(245, 158, 11, 0.1)'
                                            : 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        color: sessionGoal === goal ? '#f59e0b' : colors.textSecondary,
                                        transition: 'all 0.15s ease',
                                    }}
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

// Session History Component - Shows weekly focus trends
const SessionHistory: React.FC<{
    isDarkMode: boolean;
    colors: any;
}> = ({ isDarkMode, colors }) => {
    const [studyData, setStudyData] = useState<StudyTimeData | null>(null);

    useEffect(() => {
        const data = getStudyTimeData();
        setStudyData(data);
    }, []);

    // Get last 7 days of data
    const weekData = useMemo(() => {
        if (!studyData?.dailyHistory) return [];

        const now = new Date();
        const last7Days: { day: string; minutes: number; date: string }[] = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

            const entry = studyData.dailyHistory.find(d => d.date === dateStr);
            last7Days.push({
                day: dayName,
                minutes: entry?.minutes || 0,
                date: dateStr,
            });
        }

        return last7Days;
    }, [studyData]);

    const maxMinutes = Math.max(...weekData.map(d => d.minutes), 60); // Min 60 for scale
    const totalWeekMinutes = weekData.reduce((sum, d) => sum + d.minutes, 0);
    const avgMinutes = Math.round(totalWeekMinutes / 7);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 25 }}
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
                justifyContent: 'space-between',
                marginBottom: '12px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%)',
                        border: '1px solid rgba(59, 130, 246, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#3b82f6',
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 3v18h18" />
                            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                        </svg>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: colors.textPrimary }}>
                            Weekly Trend
                        </div>
                        <div style={{ fontSize: '10px', color: colors.textMuted }}>
                            Avg: {avgMinutes}m/day
                        </div>
                    </div>
                </div>
                <div style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#3b82f6',
                }}>
                    {Math.floor(totalWeekMinutes / 60)}h {totalWeekMinutes % 60}m
                </div>
            </div>

            {/* Bar Chart */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                height: '60px',
                gap: '6px',
                padding: '0 4px',
            }}>
                {weekData.map((day, index) => {
                    const height = maxMinutes > 0 ? (day.minutes / maxMinutes) * 100 : 0;
                    const isToday = index === weekData.length - 1;

                    return (
                        <motion.div
                            key={day.date}
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(height, 4)}%` }}
                            transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                                flex: 1,
                                minHeight: '4px',
                                borderRadius: '4px 4px 2px 2px',
                                background: isToday
                                    ? 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)'
                                    : (day.minutes > 0
                                        ? (isDarkMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)')
                                        : (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')),
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'background 0.2s ease',
                            }}
                            whileHover={{
                                background: isToday
                                    ? 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)'
                                    : 'rgba(59, 130, 246, 0.5)',
                            }}
                            title={`${day.day}: ${day.minutes}m`}
                        />
                    );
                })}
            </div>

            {/* Day Labels */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '6px',
                padding: '0 4px',
            }}>
                {weekData.map((day, index) => (
                    <span
                        key={day.date}
                        style={{
                            flex: 1,
                            textAlign: 'center',
                            fontSize: '9px',
                            fontWeight: index === weekData.length - 1 ? 600 : 500,
                            color: index === weekData.length - 1 ? '#3b82f6' : colors.textMuted,
                            textTransform: 'uppercase',
                        }}
                    >
                        {day.day}
                    </span>
                ))}
            </div>
        </motion.div>
    );
};

// Break Suggestions Component
const BreakSuggestions: React.FC<{
    isDarkMode: boolean;
    colors: any;
    isBreakMode: boolean;
}> = ({ isDarkMode, colors, isBreakMode }) => {
    const [currentSuggestion, setCurrentSuggestion] = useState(0);

    // Rotate suggestions
    useEffect(() => {
        if (!isBreakMode) return;
        const interval = setInterval(() => {
            setCurrentSuggestion(prev => (prev + 1) % BREAK_SUGGESTIONS.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [isBreakMode]);

    const suggestion = BREAK_SUGGESTIONS[currentSuggestion];

    if (!isBreakMode) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
                padding: '16px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
            }}>
                <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                        <line x1="6" y1="1" x2="6" y2="4" />
                        <line x1="10" y1="1" x2="10" y2="4" />
                        <line x1="14" y1="1" x2="14" y2="4" />
                    </svg>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#10b981' }}>
                    Break Activity
                </div>
                <div style={{
                    marginLeft: 'auto',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#10b981',
                }}>
                    {suggestion.duration}
                </div>
            </div>

            {/* Suggestion Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSuggestion}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}
                >
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        background: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        flexShrink: 0,
                    }}>
                        {suggestion.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: colors.textPrimary,
                            marginBottom: '2px',
                        }}>
                            {suggestion.title}
                        </div>
                        <div style={{
                            fontSize: '11px',
                            color: colors.textSecondary,
                            lineHeight: 1.4,
                        }}>
                            {suggestion.description}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Progress Dots */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '12px',
            }}>
                {BREAK_SUGGESTIONS.map((_, index) => (
                    <motion.button
                        key={index}
                        onClick={() => setCurrentSuggestion(index)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        style={{
                            width: index === currentSuggestion ? 16 : 6,
                            height: 6,
                            borderRadius: '3px',
                            border: 'none',
                            background: index === currentSuggestion
                                ? '#10b981'
                                : (isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'),
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    />
                ))}
            </div>
        </motion.div>
    );
};

// Keyboard Shortcuts Display Component
const KeyboardShortcuts: React.FC<{
    isDarkMode: boolean;
    colors: any;
}> = ({ isDarkMode, colors }) => {
    const shortcuts = [
        { key: 'Space', action: 'Start/Pause' },
        { key: 'R', action: 'Reset Timer' },
        { key: 'M', action: 'Toggle Sound' },
        { key: 'Esc', action: 'Exit Focus' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
            style={{
                padding: '14px 16px',
                borderRadius: '14px',
                background: isDarkMode ? '#1e293b' : '#ffffff',
                border: `1px solid ${colors.border}`,
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
            }}>
                <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3b82f6',
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M6 8h.001" />
                        <path d="M10 8h.001" />
                        <path d="M14 8h.001" />
                        <path d="M18 8h.001" />
                        <path d="M8 12h.001" />
                        <path d="M12 12h.001" />
                        <path d="M16 12h.001" />
                        <path d="M7 16h10" />
                    </svg>
                </div>
                <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: colors.textPrimary,
                }}>
                    Shortcuts
                </span>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
            }}>
                {shortcuts.map((shortcut) => (
                    <div
                        key={shortcut.key}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <span style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            fontSize: '10px',
                            fontWeight: 600,
                            color: colors.textSecondary,
                            fontFamily: 'ui-monospace, monospace',
                        }}>
                            {shortcut.key}
                        </span>
                        <span style={{
                            fontSize: '10px',
                            color: colors.textMuted,
                        }}>
                            {shortcut.action}
                        </span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

// Distraction Blocker Overlay Component
const DistractionBlocker: React.FC<{
    isActive: boolean;
    isDarkMode: boolean;
    timeLeft: string;
    mode: 'focus' | 'break';
    onExit: () => void;
}> = ({ isActive, timeLeft, mode, onExit, isDarkMode }) => {
    const [isHovered, setIsHovered] = useState(false);

    const accentColor = mode === 'focus' ? '#3b82f6' : '#10b981';

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    initial={{ y: 100, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 100, opacity: 0, scale: 0.9 }}
                    transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 30,
                        mass: 0.8,
                    }}
                    onHoverStart={() => setIsHovered(true)}
                    onHoverEnd={() => setIsHovered(false)}
                    style={{
                        position: 'fixed',
                        bottom: 24,
                        left: 0,
                        right: 0,
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        width: 'fit-content',
                        zIndex: 1000,
                        padding: '14px 24px',
                        borderRadius: '16px',
                        background: isDarkMode ? '#1e293b' : '#ffffff',
                        backdropFilter: 'blur(20px)',
                        boxShadow: isHovered
                            ? `0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px ${accentColor}30`
                            : '0 10px 30px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px',
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                        transition: 'box-shadow 0.3s ease',
                    }}
                >
                    {/* Status text with icon */}
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: accentColor,
                            letterSpacing: '-0.2px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        {mode === 'focus' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <circle cx="12" cy="12" r="6" />
                                <circle cx="12" cy="12" r="2" fill="currentColor" />
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                                <line x1="6" y1="1" x2="6" y2="4" />
                                <line x1="10" y1="1" x2="10" y2="4" />
                                <line x1="14" y1="1" x2="14" y2="4" />
                            </svg>
                        )}
                        {mode === 'focus' ? 'Focus Mode' : 'Break Time'}
                    </motion.span>

                    {/* Divider */}
                    <div style={{
                        width: 1,
                        height: 20,
                        background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                    }} />

                    {/* Timer display */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15, type: 'spring', stiffness: 400 }}
                        style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            color: accentColor,
                            fontVariantNumeric: 'tabular-nums',
                            letterSpacing: '-0.5px',
                            padding: '6px 16px',
                            borderRadius: '10px',
                            background: `${accentColor}12`,
                            border: `1px solid ${accentColor}20`,
                        }}
                    >
                        {timeLeft}
                    </motion.div>

                    {/* Divider */}
                    <div style={{
                        width: 1,
                        height: 20,
                        background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                    }} />

                    {/* Exit button */}
                    <motion.button
                        whileHover={{ scale: 1.05, background: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        onClick={onExit}
                        style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                            background: 'transparent',
                            color: isDarkMode ? '#f87171' : '#ef4444',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Exit
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
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
    image: {
        color: '#22c55e',
        bgGradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.04) 100%)',
        label: 'Image',
        actionLabel: 'View',
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
                border: `1px solid ${isHovered ? `${config.color}${isDarkMode ? '50' : '40'}` : colors.border}`,
                cursor: 'pointer',
                overflow: 'hidden',
                boxShadow: isHovered
                    ? isDarkMode
                        ? `0 8px 24px ${config.color}25, 0 4px 12px rgba(0,0,0,0.3)`
                        : `0 8px 24px ${config.color}15, 0 4px 8px rgba(0,0,0,0.04)`
                    : isDarkMode
                        ? '0 2px 4px rgba(0,0,0,0.2)'
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
                                background: isDarkMode ? `${config.color}20` : `${config.color}12`,
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
                                {resource.type === 'image' && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <polyline points="21 15 16 10 5 21" />
                                    </svg>
                                )}
                                {config.actionLabel}
                            </>
                        )}
                    </motion.div>
                </div>

                {/* Content Preview */}
                {resource.type === 'image' && (resource.previewUrl || resource.url) ? (
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        style={{
                            borderRadius: '10px',
                            overflow: 'hidden',
                            background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
                        }}
                    >
                        <img
                            src={resource.previewUrl || resource.url}
                            alt={resource.title}
                            style={{
                                width: '100%',
                                height: '120px',
                                objectFit: 'cover',
                                display: 'block',
                            }}
                            onError={(e) => {
                                // Hide broken images
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </motion.div>
                ) : resource.type === 'code' ? (
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

    // Premium features state
    const [sessionGoal, setSessionGoal] = useState(25); // Default 25 min goal
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
    const [timerTimeLeft, setTimerTimeLeft] = useState(25 * 60);
    const [activeSound, setActiveSound] = useState<string | null>(null);
    const [showDistractionBlocker, setShowDistractionBlocker] = useState(false);

    // Refs for keyboard shortcuts
    const timerControlsRef = useRef<{
        toggleTimer: () => void;
        resetTimer: () => void;
    } | null>(null);

    // Dark mode detection - reads from localStorage and listens for changes
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkModeEnabled');
        return saved === 'true' || document.body.classList.contains('dark-mode');
    });

    // Listen for dark mode changes
    useEffect(() => {
        const checkDarkMode = () => {
            const saved = localStorage.getItem('darkModeEnabled');
            setIsDarkMode(saved === 'true' || document.body.classList.contains('dark-mode'));
        };

        // Check on mount
        checkDarkMode();

        // Listen for storage changes (from other tabs/windows)
        window.addEventListener('storage', checkDarkMode);

        // Listen for class changes on body (for same-tab changes)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    checkDarkMode();
                }
            });
        });
        observer.observe(document.body, { attributes: true });

        // Also check periodically for localStorage changes in same tab
        const interval = setInterval(checkDarkMode, 500);

        return () => {
            window.removeEventListener('storage', checkDarkMode);
            observer.disconnect();
            clearInterval(interval);
        };
    }, []);

    // Keyboard shortcuts handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (e.code === 'Space') {
                e.preventDefault();
                timerControlsRef.current?.toggleTimer();
            } else if (e.key === 'r' || e.key === 'R') {
                timerControlsRef.current?.resetTimer();
            } else if (e.key === 'm' || e.key === 'M') {
                // Toggle sound - cycle through or turn off
                setActiveSound(prev => prev ? null : 'lofi');
            } else if (e.key === 'Escape') {
                navigate(-1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

    // Show distraction blocker when timer is running
    useEffect(() => {
        setShowDistractionBlocker(isTimerRunning);
    }, [isTimerRunning]);

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

                        // Extract files and images from attachments
                        if (msg.attachments && msg.attachments.length > 0) {
                            msg.attachments.forEach(att => {
                                // Check if it's an image
                                const isImage = att.type?.startsWith('image/') ||
                                    /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(att.name || '');

                                if (isImage) {
                                    extractedResources.push({
                                        id: `image-${resourceId++}`,
                                        type: 'image',
                                        title: att.name || 'Shared Image',
                                        content: 'Image attachment',
                                        url: att.url,
                                        previewUrl: att.thumbnail_url || att.url,
                                        createdAt: new Date(msg.created_at),
                                        sharedBy: msg.user_name,
                                    });
                                } else {
                                    extractedResources.push({
                                        id: `file-${resourceId++}`,
                                        type: 'file',
                                        title: att.name || 'Shared File',
                                        content: att.type || 'File',
                                        url: att.url,
                                        createdAt: new Date(msg.created_at),
                                        sharedBy: msg.user_name,
                                    });
                                }
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
                    // No groupId - show demo resources for testing
                    setResources([
                        {
                            id: 'demo-link-1',
                            type: 'link',
                            title: 'React Documentation',
                            content: 'Official React documentation for learning hooks and components',
                            url: 'https://react.dev',
                            createdAt: new Date(),
                            sharedBy: 'Teacher',
                        },
                        {
                            id: 'demo-link-2',
                            type: 'link',
                            title: 'MDN Web Docs - JavaScript',
                            content: 'Comprehensive JavaScript reference and tutorials',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
                            createdAt: new Date(),
                            sharedBy: 'Teacher',
                        },
                        {
                            id: 'demo-code-1',
                            type: 'code',
                            title: 'Array Methods Example',
                            content: 'const numbers = [1, 2, 3, 4, 5];\nconst doubled = numbers.map(n => n * 2);',
                            language: 'javascript',
                            createdAt: new Date(Date.now() - 86400000),
                            sharedBy: 'Student A',
                        },
                        {
                            id: 'demo-file-1',
                            type: 'file',
                            title: 'Chapter 5 Notes.pdf',
                            content: 'PDF Document - 2.4 MB',
                            url: '#',
                            createdAt: new Date(Date.now() - 172800000),
                            sharedBy: 'Student B',
                        },
                        {
                            id: 'demo-note-1',
                            type: 'note',
                            title: 'Study Summary - Week 3',
                            content: 'Key concepts covered this week: State management, useEffect hook, and component lifecycle...',
                            createdAt: new Date(Date.now() - 259200000),
                            sharedBy: 'Student C',
                        },
                    ]);
                }
            } catch (error) {
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

        // Extract files and images from attachments
        if (msg.attachments && msg.attachments.length > 0) {
            msg.attachments.forEach((att, idx) => {
                // Check if it's an image
                const isImage = att.type?.startsWith('image/') ||
                    /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(att.name || '');

                if (isImage) {
                    extractedResources.push({
                        id: `image-${msg.id}-${idx}-${timestamp}`,
                        type: 'image',
                        title: att.name || 'Shared Image',
                        content: 'Image attachment',
                        url: att.url,
                        previewUrl: att.thumbnail_url || att.url,
                        createdAt: new Date(msg.created_at),
                        sharedBy: msg.user_name,
                    });
                } else {
                    extractedResources.push({
                        id: `file-${msg.id}-${idx}-${timestamp}`,
                        type: 'file',
                        title: att.name || 'Shared File',
                        content: att.type || 'File',
                        url: att.url,
                        createdAt: new Date(msg.created_at),
                        sharedBy: msg.user_name,
                    });
                }
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
            images: 'image',
            code: 'code',
            notes: 'note',
        };
        return resources.filter(r => r.type === typeMap[activeFilter]);
    }, [resources, activeFilter]);

    const resourceCounts = useMemo(() => ({
        all: resources.length,
        links: resources.filter(r => r.type === 'link').length,
        files: resources.filter(r => r.type === 'file').length,
        images: resources.filter(r => r.type === 'image').length,
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
            height: '100vh',
            background: colors.bg,
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            {/* Distraction Blocker Overlay */}
            <DistractionBlocker
                isActive={showDistractionBlocker}
                isDarkMode={isDarkMode}
                timeLeft={`${Math.floor(timerTimeLeft / 60).toString().padStart(2, '0')}:${(timerTimeLeft % 60).toString().padStart(2, '0')}`}
                mode={timerMode}
                onExit={() => navigate(-1)}
            />

            <div style={{ maxWidth: '1600px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
                {/* Compact Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 18px',
                        borderRadius: '14px',
                        background: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                        flexShrink: 0,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(-1)}
                            style={{
                                width: 36,
                                height: 36,
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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
                            </svg>
                        </motion.button>
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <circle cx="12" cy="12" r="4" />
                            </svg>
                        </div>
                        <div>
                            <h1 style={{
                                margin: 0,
                                fontSize: '18px',
                                fontWeight: 700,
                                color: colors.textPrimary,
                                letterSpacing: '-0.3px',
                            }}>
                                Focus Mode
                            </h1>
                            <p style={{
                                margin: 0,
                                fontSize: '12px',
                                color: colors.textMuted,
                            }}>
                                {groupInfo?.name || 'Distraction-free study'}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                        }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#3b82f6' }}>
                                {Math.floor(totalFocusTime / 60)}m today
                            </span>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(-1)}
                            style={{
                                padding: '8px 14px',
                                borderRadius: '8px',
                                border: `1px solid ${colors.border}`,
                                background: 'transparent',
                                color: colors.textSecondary,
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                            }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            Exit
                        </motion.button>
                    </div>
                </motion.div>

                {/* Main Content - 3 Column Layout */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '280px 1fr 300px',
                    gap: '16px',
                    flex: 1,
                    minHeight: 0,
                }}>
                    {/* Left Column - Timer & Stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'auto' }}>
                        <PomodoroTimer
                            isDarkMode={isDarkMode}
                            colors={colors}
                            onSessionComplete={handleSessionComplete}
                            onStateChange={(state) => {
                                setIsTimerRunning(state.isRunning);
                                setTimerMode(state.mode);
                                setTimerTimeLeft(state.timeLeft);
                            }}
                            controlsRef={timerControlsRef}
                        />
                        <SessionStats
                            isDarkMode={isDarkMode}
                            colors={colors}
                            totalFocusTime={totalFocusTime}
                            sessionsCompleted={sessionsCompleted}
                            currentStreak={currentStreak}
                        />
                        <SessionHistory
                            isDarkMode={isDarkMode}
                            colors={colors}
                        />
                        <SessionGoal
                            isDarkMode={isDarkMode}
                            colors={colors}
                            sessionGoal={sessionGoal}
                            setSessionGoal={setSessionGoal}
                            currentProgress={Math.floor(totalFocusTime / 60)}
                        />
                    </div>

                    {/* Center Column - Resources (scrollable) */}
                    <LayoutGroup>
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                layout: { type: 'spring', stiffness: 300, damping: 30 },
                                opacity: { duration: 0.3 },
                            }}
                            style={{
                                padding: '16px',
                                borderRadius: '14px',
                                background: colors.cardBg,
                                border: `1px solid ${colors.border}`,
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                height: '100%',
                            }}
                        >
                            {/* Header */}
                            <motion.div
                                layout="position"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '12px',
                                    flexShrink: 0,
                                }}
                            >
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: colors.textPrimary,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                    </svg>
                                    Study Resources
                                </div>
                                <FilterTabs
                                    activeFilter={activeFilter}
                                    setActiveFilter={setActiveFilter}
                                    isDarkMode={isDarkMode}
                                    colors={colors}
                                    resourceCounts={resourceCounts}
                                />
                            </motion.div>

                            {/* Resources List - Scrollable */}
                            <motion.div
                                layout
                                style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    overflowX: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    paddingRight: '4px',
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
                                                    delay: index * 0.02,
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
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '40px 20px',
                                            }}
                                        >
                                            <div style={{
                                                width: 70,
                                                height: 70,
                                                borderRadius: '16px',
                                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%)',
                                                border: '1px solid rgba(59, 130, 246, 0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginBottom: '14px',
                                            }}>
                                                <lord-icon
                                                    src="https://cdn.lordicon.com/hjrbjhnq.json"
                                                    trigger="in"
                                                    delay="200"
                                                    state="in-book"
                                                    colors="primary:#3b82f6,secondary:#60a5fa"
                                                    style={{ width: '40px', height: '40px' }}
                                                />
                                            </div>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                color: colors.textSecondary,
                                            }}>
                                                {activeFilter === 'all'
                                                    ? (groupId ? 'No resources yet' : 'No group selected')
                                                    : `No ${activeFilter} found`}
                                            </p>
                                            <p style={{
                                                margin: '6px 0 0',
                                                fontSize: '12px',
                                                color: colors.textMuted,
                                                textAlign: 'center',
                                                maxWidth: '240px',
                                            }}>
                                                {activeFilter === 'all'
                                                    ? 'Share resources in your group chat'
                                                    : `Try sharing some ${activeFilter}`}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </motion.div>
                    </LayoutGroup>

                    {/* Right Column - Features */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'auto' }}>
                        <AmbientSounds
                            isDarkMode={isDarkMode}
                            colors={colors}
                            activeSound={activeSound}
                            onSoundChange={setActiveSound}
                        />
                        <AnimatePresence mode="wait">
                            {timerMode === 'break' ? (
                                <BreakSuggestions
                                    key="break-suggestions"
                                    isDarkMode={isDarkMode}
                                    colors={colors}
                                    isBreakMode={true}
                                />
                            ) : (
                                <MotivationalQuote
                                    key="motivational-quote"
                                    isDarkMode={isDarkMode}
                                    colors={colors}
                                    isBreakMode={false}
                                />
                            )}
                        </AnimatePresence>
                        <KeyboardShortcuts
                            isDarkMode={isDarkMode}
                            colors={colors}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FocusModePage;
