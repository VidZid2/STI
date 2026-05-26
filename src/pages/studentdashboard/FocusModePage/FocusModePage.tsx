/**
 * Focus Mode Page - Dedicated Study Session Interface
 * Minimalistic professional design matching PathsContent/GoalsContent style
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { fetchGroupMessages, subscribeToMessages, type ChatMessage } from '../../../services/chatService';
import { fetchGroups, type GroupWithMembers } from '../../../services/groupsService';
import { getStudyTimeData, getStreakData, addStudyTime } from '../../../services/studyTimeService';

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
// Timer Duration Options
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

// Color palette passed down to sub-components
export interface FocusModeColors {
    bg: string;
    cardBg: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
}

export type { FilterTab };
export type { Resource };

// ToolTab reserved for future sidebar tools
// type ToolTab = 'timer' | 'flashcards' | 'notes' | 'whiteboard';

// Components — extracted to ./components/
import { FocusSkeleton, FilterTabs, ResourceCard } from './components/ResourceCard';
import { PomodoroTimer } from './components/PomodoroTimer';
import { SessionStats } from './components/SessionStats';
import { MotivationalQuote } from './components/MotivationalQuote';
import { AmbientSounds } from './components/AmbientSounds';
import { SessionGoal } from './components/SessionGoal';
import { SessionHistory } from './components/SessionHistory';
import { BreakSuggestions } from './components/BreakSuggestions';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { DistractionBlocker } from './components/DistractionBlocker';
// KeyboardShortcuts — moved to ./components/KeyboardShortcuts.tsx
// DistractionBlocker — moved to ./components/DistractionBlocker.tsx

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
                        if (msg.content.includes('**Flashcard**') || msg.content.includes('??')) {
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
        if (msg.content.includes('**Flashcard**') || msg.content.includes('??')) {
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
        return <FocusSkeleton />;
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
                        <PomodoroTimer onSessionComplete={handleSessionComplete}
                            onStateChange={(state) => {
                                setIsTimerRunning(state.isRunning);
                                setTimerMode(state.mode);
                                setTimerTimeLeft(state.timeLeft);
                            }}
                            controlsRef={timerControlsRef}
                        />
                        <SessionStats totalFocusTime={totalFocusTime}
                            sessionsCompleted={sessionsCompleted}
                            currentStreak={currentStreak}
                        />
                        <SessionHistory />
                        <SessionGoal sessionGoal={sessionGoal}
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
                                    setActiveFilter={setActiveFilter} resourceCounts={resourceCounts}
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
                                                    resource={resource} index={index}
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
                        <AmbientSounds activeSound={activeSound}
                            onSoundChange={setActiveSound}
                        />
                        <AnimatePresence mode="wait">
                            {timerMode === 'break' ? (
                                <BreakSuggestions
                                    key="break-suggestions"
                                    
                                    
                                    isBreakMode={true}
                                />
                            ) : (
                                <MotivationalQuote
                                    key="motivational-quote"
                                    
                                    
                                    isBreakMode={false}
                                />
                            )}
                        </AnimatePresence>
                        <KeyboardShortcuts
                            
                            
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FocusModePage;
