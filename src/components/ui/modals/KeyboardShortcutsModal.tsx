/**
 * Keyboard Shortcuts Modal - Minimalistic Design
 * Displays all available keyboard shortcuts organized by category
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'motion/react';

const EASE_OUT = [0.32, 0.72, 0, 1] as const;
// @ts-ignore
const SPRING_PANEL = { type: 'spring', bounce: 0, duration: 0.4 } as const;

interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Search Spinner Component
const SearchSpinner: React.FC = () => (
    <div style={{
        width: '18px',
        height: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    }}>
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            style={{
                animation: 'keyboardShortcutsSpin 1s linear infinite',
            }}
        >
            <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="rgba(59, 130, 246, 0.2)"
                strokeWidth="3"
            />
            <path
                d="M12 2a10 10 0 0 1 10 10"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
        <style>{`
            @keyframes keyboardShortcutsSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

// Skeleton Component for shortcuts - upgraded for high-clarity gray-only visual thickness matching premium cards
const ShortcutSkeleton: React.FC = () => (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[20px] p-4 flex items-center gap-4 shadow-sm relative overflow-hidden">
        {/* Left icon skeleton - prominent thick gray rounded box */}
        <div 
            className="w-12 h-12 rounded-[14px] bg-zinc-200/80 dark:bg-zinc-800/80 flex-shrink-0"
            style={{
                animation: 'keyboardShortcutsPulse 1.5s ease-in-out infinite',
            }}
        />
        
        {/* Title & Description skeleton - thicker prominent gray bar blocks for elite UX */}
        <div className="flex-1 min-w-0 pr-2 space-y-2 text-left">
            <div 
                className="h-5 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-md w-32 md:w-44" 
                style={{
                    animation: 'keyboardShortcutsPulse 1.5s ease-in-out infinite',
                    animationDelay: '0.1s',
                }}
            />
            <div 
                className="h-3.5 bg-zinc-200/50 dark:bg-zinc-800/40 rounded-md w-48 md:w-72" 
                style={{
                    animation: 'keyboardShortcutsPulse 1.5s ease-in-out infinite',
                    animationDelay: '0.2s',
                }}
            />
        </div>
        
        {/* Keys skeleton - accurate grey keyboard badges */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
            <div 
                className="w-10 h-7 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-[5px]" 
                style={{
                    animation: 'keyboardShortcutsPulse 1.5s ease-in-out infinite',
                    animationDelay: '0.3s',
                }}
            />
            <span className="text-zinc-300 dark:text-zinc-700 text-[12px] font-semibold px-0.5 animate-pulse">+</span>
            <div 
                className="w-10 h-7 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-[5px]" 
                style={{
                    animation: 'keyboardShortcutsPulse 1.5s ease-in-out infinite',
                    animationDelay: '0.4s',
                }}
            />
        </div>
    </div>
);

// Pulse animation style - High visibility gray-only pulse
const pulseStyle = `
    @keyframes keyboardShortcutsPulse {
        0%, 100% { opacity: 0.95; }
        50% { opacity: 0.35; }
    }
`;

interface Shortcut {
    name: string;
    keys: string[];
    description: string;
    icon: React.ReactNode;
}

interface ShortcutCategory {
    id: string;
    name: string;
    icon: React.ReactNode;
    shortcuts: Shortcut[];
}

const BLUE = '#3b82f6';

// SVG Icons for categories
const NavigationIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
);

const EditingIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const ToolsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
);

const GeneralIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
);


const SearchIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
    </svg>
);

// Keyboard shortcuts data
const shortcutCategories: ShortcutCategory[] = [
    {
        id: 'general',
        name: 'General',
        icon: <GeneralIcon />,
        shortcuts: [
            { 
                name: 'Command Palette', 
                keys: ['Ctrl', 'K'], 
                description: 'Access global actions, search, and navigation controls.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                )
            },
            { 
                name: 'Help Menu', 
                keys: ['Ctrl', '/'], 
                description: 'View standard keyboard shortcuts and system documentation.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                )
            },
            { 
                name: 'Settings', 
                keys: ['Ctrl', ','], 
                description: 'Customize application preferences, appearance, and options.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                )
            },
            { 
                name: 'Close / Cancel', 
                keys: ['Esc'], 
                description: 'Dismiss active dialogs, modal overlays, or current action.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                )
            },
            { 
                name: 'Fullscreen Mode', 
                keys: ['F11'], 
                description: 'Switch the application layout to fill the entire screen display.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                )
            },
        ],
    },
    {
        id: 'navigation',
        name: 'Navigation',
        icon: <NavigationIcon />,
        shortcuts: [
            { 
                name: 'Navigate Home', 
                keys: ['Ctrl', 'H'], 
                description: 'Jump directly back to the main website home page.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                )
            },
            { 
                name: 'Dashboard Overview', 
                keys: ['Ctrl', 'D'], 
                description: 'Switch workspace view to your customized portal dashboard.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="9" />
                        <rect x="14" y="3" width="7" height="5" />
                        <rect x="14" y="12" width="7" height="9" />
                        <rect x="3" y="16" width="7" height="5" />
                    </svg>
                )
            },
            { 
                name: 'Study Tools Menu', 
                keys: ['Ctrl', 'T'], 
                description: 'Open the comprehensive suite of academic writing utilities.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                )
            },
            { 
                name: 'Academic Progress', 
                keys: ['Ctrl', 'P'], 
                description: 'Track academic metrics, course grades, and task history details.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                )
            },
            { 
                name: 'Go Back History', 
                keys: ['Alt', '←'], 
                description: 'Navigate backwards to the previously visited tab or screen.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                )
            },
            { 
                name: 'Go Forward History', 
                keys: ['Alt', '→'], 
                description: 'Move forward in your page history to the next active view.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                )
            },
        ],
    },
    {
        id: 'editing',
        name: 'Editing',
        icon: <EditingIcon />,
        shortcuts: [
            { 
                name: 'Undo Modification', 
                keys: ['Ctrl', 'Z'], 
                description: 'Revert the latest text changes or actions in the text workspace.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 7v6h6" />
                        <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                    </svg>
                )
            },
            { 
                name: 'Redo Modification', 
                keys: ['Ctrl', 'Y'], 
                description: 'Re-apply the previously undone editing step or change.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 7v6h-6" />
                        <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
                    </svg>
                )
            },
            { 
                name: 'Copy Selected', 
                keys: ['Ctrl', 'C'], 
                description: 'Copy chosen texts, elements, or drafts to system clipboard.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                )
            },
            { 
                name: 'Paste Clipboard', 
                keys: ['Ctrl', 'V'], 
                description: 'Insert copied items or writing from clipboard at cursor point.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    </svg>
                )
            },
            { 
                name: 'Cut Selection', 
                keys: ['Ctrl', 'X'], 
                description: 'Extract selected content and store it on system clipboard.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="6" cy="6" r="3" />
                        <circle cx="6" cy="18" r="3" />
                        <line x1="20" y1="4" x2="8.12" y2="15.88" />
                        <line x1="14.47" y1="14.48" x2="20" y2="20" />
                        <line x1="8.12" y1="8.12" x2="12" y2="12" />
                    </svg>
                )
            },
            { 
                name: 'Select All Items', 
                keys: ['Ctrl', 'A'], 
                description: 'Select all text blocks and inputs in active editable container.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 4" />
                    </svg>
                )
            },
            { 
                name: 'Save Workspace', 
                keys: ['Ctrl', 'S'], 
                description: 'Manually commit active writing drafts and progress details.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                    </svg>
                )
            },
        ],
    },
    {
        id: 'tools',
        name: 'Tools',
        icon: <ToolsIcon />,
        shortcuts: [
            { 
                name: 'Grammar Checker', 
                keys: ['Ctrl', 'G'], 
                description: 'Analyze active writing for complex grammar and spelling issues.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 11 12 14 22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                )
            },
            { 
                name: 'AI Paraphraser', 
                keys: ['Ctrl', 'Shift', 'P'], 
                description: 'Rephrase sentences dynamically to improve tone and structure.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                    </svg>
                )
            },
            { 
                name: 'Citation Generator', 
                keys: ['Ctrl', 'Shift', 'C'], 
                description: 'Generate structured academic bibliography citations immediately.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                )
            },
            { 
                name: 'AI Text Summarizer', 
                keys: ['Ctrl', 'Shift', 'S'], 
                description: 'Condense long academic materials into outline summaries.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                )
            },
            { 
                name: 'Advanced Word Counter', 
                keys: ['Ctrl', 'Shift', 'W'], 
                description: 'Verify word limits, sentence length, and reading score metrics.',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="9" y1="9" x2="15" y2="9" />
                        <line x1="9" y1="13" x2="15" y2="13" />
                        <line x1="9" y1="17" x2="13" y2="17" />
                    </svg>
                )
            },
        ],
    },
];

// Color theme mappings for premium SaaS cards coordinated by category
const categoryColorMap: Record<string, {
    border: string;
    bg: string;
    iconBg: string;
    iconBorder: string;
    iconText: string;
    hoverBorder: string;
    accent: string;
}> = {
    general: {
        border: 'border-zinc-200/80 dark:border-zinc-800/80',
        bg: 'bg-white dark:bg-zinc-900',
        iconBg: 'bg-blue-50 dark:bg-blue-500/10',
        iconBorder: 'border-blue-100 dark:border-blue-500/20',
        iconText: 'text-blue-600 dark:text-blue-400',
        hoverBorder: 'hover:border-blue-200/80 dark:hover:border-blue-800/50',
        accent: 'bg-blue-500/5 dark:bg-blue-500/5'
    },
    navigation: {
        border: 'border-zinc-200/80 dark:border-zinc-800/80',
        bg: 'bg-white dark:bg-zinc-900',
        iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
        iconBorder: 'border-indigo-100 dark:border-indigo-500/20',
        iconText: 'text-indigo-600 dark:text-indigo-400',
        hoverBorder: 'hover:border-indigo-200/80 dark:hover:border-indigo-800/50',
        accent: 'bg-indigo-500/5 dark:bg-indigo-500/5'
    },
    editing: {
        border: 'border-zinc-200/80 dark:border-zinc-800/80',
        bg: 'bg-white dark:bg-zinc-900',
        iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
        iconBorder: 'border-emerald-100 dark:border-emerald-500/20',
        iconText: 'text-emerald-600 dark:text-emerald-400',
        hoverBorder: 'hover:border-emerald-200/80 dark:hover:border-emerald-800/50',
        accent: 'bg-emerald-500/5 dark:bg-emerald-500/5'
    },
    tools: {
        border: 'border-zinc-200/80 dark:border-zinc-800/80',
        bg: 'bg-white dark:bg-zinc-900',
        iconBg: 'bg-amber-50 dark:bg-amber-500/10',
        iconBorder: 'border-amber-100 dark:border-amber-500/20',
        iconText: 'text-amber-600 dark:text-amber-400',
        hoverBorder: 'hover:border-amber-200/80 dark:hover:border-amber-800/50',
        accent: 'bg-amber-500/5 dark:bg-amber-500/5'
    }
};

// Realistic 3D Keyboard Key Component - Uiverse.io style, compact sizing
const KeyBadge: React.FC<{ keyName: string; index: number; isDarkMode?: boolean; interactive?: boolean }> = ({ 
    keyName, 
    index, 
    isDarkMode = false,
    interactive = false 
}) => {
    const [isPressed, setIsPressed] = React.useState(false);
    
    const keyBg = isDarkMode 
        ? 'linear-gradient(180deg, #3f3f3f 0%, #2a2a2a 100%)'
        : 'linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%)';
    const keyBorder = isDarkMode ? '#4a4a4a' : '#d1d5db';
    const keyShadowColor = isDarkMode ? '#1a1a1a' : '#9ca3af';
    const keyText = isDarkMode ? '#e5e5e5' : '#3f3f3f';
    
    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onMouseDown={() => interactive && setIsPressed(true)}
            onMouseUp={() => interactive && setIsPressed(false)}
            onMouseLeave={() => interactive && setIsPressed(false)}
            onTouchStart={() => interactive && setIsPressed(true)}
            onTouchEnd={() => interactive && setIsPressed(false)}
            style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: keyName.length > 3 ? '44px' : '30px',
                height: '28px',
                padding: '0 8px',
                borderRadius: '5px',
                background: keyBg,
                border: `1px solid ${keyBorder}`,
                boxShadow: isPressed 
                    ? `0 0 0 0 ${keyShadowColor}`
                    : `0 3px 0 1px ${keyShadowColor}`,
                fontSize: '10.5px',
                fontWeight: 600,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: keyText,
                textTransform: keyName.length === 1 ? 'uppercase' : 'none',
                cursor: interactive ? 'pointer' : 'default',
                transform: isPressed 
                    ? 'perspective(100px) rotateX(15deg) translateY(3px)' 
                    : 'perspective(100px) rotateX(15deg) translateY(0)',
                transition: 'all 120ms ease',
                outline: 'none',
                transformStyle: 'preserve-3d',
            }}
        >
            <span style={{
                position: 'absolute',
                top: '1px',
                left: '1px',
                right: '1px',
                height: '35%',
                borderRadius: '3px 3px 50% 50%',
                background: isDarkMode 
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, transparent 100%)',
                pointerEvents: 'none',
            }} />
            <span style={{ position: 'relative', zIndex: 1 }}>{keyName}</span>
        </motion.button>
    );
};

// Shortcut row component styled exactly like premium 'Student Tools' card
const ShortcutRow: React.FC<{ 
    shortcut: Shortcut; 
    categoryId: string;
    index: number; 
    isDarkMode: boolean;
}> = ({ shortcut, categoryId, index, isDarkMode }) => {
    const colors = categoryColorMap[categoryId] || categoryColorMap.general;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            transition={{ 
                delay: index * 0.03,
                layout: { type: 'spring', damping: 25, stiffness: 200 }
            }}
            className={`relative overflow-hidden w-full bg-white dark:bg-zinc-900 border ${colors.border} rounded-[20px] p-4 flex items-center gap-4 group transition-all duration-300 shadow-sm hover:shadow-md ${colors.hoverBorder}`}
        >
            {/* SaaS Accent Glow */}
            <div className={`absolute top-0 right-0 -mr-12 -mt-12 w-28 h-28 ${colors.accent} rounded-full blur-2xl pointer-events-none transition-transform duration-700 group-hover:scale-150`} aria-hidden="true" />

            {/* Left side: Premium wrench-style Tinted Icon Box */}
            <motion.div
                whileHover={{ scale: 1.05, rotate: -5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className={`w-12 h-12 rounded-[14px] ${colors.iconBg} border ${colors.iconBorder} flex items-center justify-center flex-shrink-0 shadow-sm ${colors.iconText} relative z-10`}
            >
                {shortcut.icon}
            </motion.div>

            {/* Title & Description with premium typography and alignment */}
            <div className="relative z-10 flex-1 min-w-0 pr-2 text-left">
                <h3 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight m-0 mb-0.5 leading-snug">
                    {shortcut.name}
                </h3>
                <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed m-0 truncate md:whitespace-normal md:line-clamp-2">
                    {shortcut.description}
                </p>
            </div>

            {/* Right side: Key Badges */}
            <div className="relative z-10 flex items-center gap-1.5 flex-shrink-0">
                {shortcut.keys.map((key, i) => (
                    <React.Fragment key={i}>
                        <KeyBadge keyName={key} index={i} isDarkMode={isDarkMode} interactive />
                        {i < shortcut.keys.length - 1 && (
                            <span className="text-zinc-400 dark:text-zinc-600 text-[12px] font-semibold px-0.5">+</span>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </motion.div>
    );
};

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
    const reduce = useReducedMotion();
// @ts-ignore
    const enterY = reduce ? 0 : 40;
// @ts-ignore
    const enterScale = reduce ? 1 : 0.97;
    const [isDarkMode, setIsDarkMode] = useState(() => document.body.classList.contains('dark-mode'));
    const [activeCategory, setActiveCategory] = useState('general');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isTabChanging, setIsTabChanging] = useState(false);
    const debounceRef = useRef<number | null>(null);

    // Auto-minimizing header state
    const [isMinimized, setIsMinimized] = useState(false);
    const lastScrollY = useRef(0);
    const scrollDirection = useRef<'up' | 'down' | null>(null);
    const anchorScrollY = useRef(0);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const currentScrollY = e.currentTarget.scrollTop;
        const scrollHeight = e.currentTarget.scrollHeight;
        const clientHeight = e.currentTarget.clientHeight;
        
        // Handle iOS rubber banding / top of scroll
        if (currentScrollY <= 10) {
            setIsMinimized(false);
            lastScrollY.current = currentScrollY;
            scrollDirection.current = null;
            anchorScrollY.current = currentScrollY;
            return;
        }

        // Determine current scrolling direction
        const delta = currentScrollY - lastScrollY.current;
        const isNearBottom = scrollHeight - currentScrollY - clientHeight < 50;
        
        if (delta > 0) {
            // Scrolling down
            if (scrollDirection.current !== 'down') {
                scrollDirection.current = 'down';
                anchorScrollY.current = lastScrollY.current;
            }
            
            // If we have scrolled down by more than 30px from the anchor, minimize
            if (currentScrollY - anchorScrollY.current > 30) {
                setIsMinimized(true);
            }
        } else if (delta < 0) {
            // Scrolling up
            if (scrollDirection.current !== 'up') {
                scrollDirection.current = 'up';
                anchorScrollY.current = lastScrollY.current;
            }
            
            // If we have scrolled up by more than 30px from the anchor, expand
            // Protect against bottom bounce rubber-banding expanding the header
            if (!isNearBottom && anchorScrollY.current - currentScrollY > 30) {
                setIsMinimized(false);
            }
        }

        lastScrollY.current = currentScrollY;
    }, []);

    useEffect(() => {
        const checkDarkMode = () => setIsDarkMode(document.body.classList.contains('dark-mode'));
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setDebouncedQuery('');
            setActiveCategory('general');
            setIsSearching(false);
            setIsTabChanging(false);
            setIsMinimized(false);
        }
    }, [isOpen]);

    // Handle premium tab category change with loading transition skeletons
    const handleCategoryChange = (catId: string) => {
        if (catId === activeCategory || isTabChanging) return;
        setIsTabChanging(true);
        setActiveCategory(catId);
        setTimeout(() => {
            setIsTabChanging(false);
        }, 350); // 350ms loading skeleton animation is the optimal speed for elite SaaS UX
    };

    // Debounced search
    useEffect(() => {
        if (searchQuery) {
            setIsSearching(true);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = window.setTimeout(() => {
                setDebouncedQuery(searchQuery);
                setIsSearching(false);
            }, 400);
        } else {
            setDebouncedQuery('');
            setIsSearching(false);
        }
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchQuery]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

        // Filter shortcuts based on debounced search
    const filteredCategories = shortcutCategories.map(cat => ({
        ...cat,
        shortcuts: cat.shortcuts.filter(s => 
            s.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            s.description.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            s.keys.some(k => k.toLowerCase().includes(debouncedQuery.toLowerCase()))
        ),
    })).filter(cat => debouncedQuery === '' || cat.shortcuts.length > 0);

    const activeShortcuts = debouncedQuery 
        ? filteredCategories.flatMap(c => c.shortcuts.map(s => ({ ...s, categoryId: c.id })))
        : shortcutCategories.find(c => c.id === activeCategory)?.shortcuts.map(s => ({ ...s, categoryId: activeCategory })) || [];

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99998,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                }}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: EASE_OUT }}
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: isDarkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(12px)',
                        }}
                    />

                    {/* Modal */}
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ 
                            type: 'spring', 
                            damping: 28, 
                            stiffness: 350,
                            layout: { type: 'spring', damping: 25, stiffness: 200 }
                        }}
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '580px',
                            maxHeight: '80vh',
                            background: isDarkMode ? '#0f172a' : '#f8fafc',
                            borderRadius: '20px',
                            boxShadow: isDarkMode 
                                ? '0 25px 80px rgba(0, 0, 0, 0.6)' 
                                : '0 25px 80px rgba(0, 0, 0, 0.2)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                                                <motion.div layout="position" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, width: '100%' }}>
                            <AnimatePresence mode="popLayout" initial={false}>
                                <motion.div
                                    key="content"
                                    initial={
                                        reduce
                                            ? { opacity: 0 }
                                            : { opacity: 0, y: 8, filter: "blur(4px)" }
                                    }
                                    animate={
                                        reduce
                                            ? {
                                                opacity: 1,
                                                transition: { duration: 0.18, ease: [0.32, 0.72, 0, 1] },
                                            }
                                            : {
                                                opacity: 1,
                                                y: 0,
                                                filter: "blur(0px)",
                                                transition: { duration: 0.24, ease: [0.32, 0.72, 0, 1] },
                                            }
                                    }
                                    exit={
                                        reduce
                                            ? {
                                                opacity: 0,
                                                transition: { duration: 0.14, ease: [0.32, 0.72, 0, 1] },
                                            }
                                            : {
                                                opacity: 0,
                                                y: -8,
                                                filter: "blur(4px)",
                                                transition: { duration: 0.16, ease: [0.32, 0.72, 0, 1] },
                                            }
                                    }
                                    onAnimationComplete={(definition) => {
                                        const el = document.getElementById('settings-content-wrapper');
                                        if (el && (definition as any).opacity === 1) {
                                            el.style.filter = 'none';
                                        }
                                    }}
                                    id="settings-content-wrapper"
                                    className="pointer-events-auto"
                            style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, width: '100%' }}
                        >
                        {/* Header */}
                        <motion.div 
                            animate={{
                                padding: isMinimized ? '12px 16px' : '24px 24px 8px 24px'
                            }}
                            className="relative border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-t-[20px]"
                        >
                            {/* Student Tools Style Header Card */}
                            <motion.div 
                                animate={{ marginBottom: isMinimized ? '0px' : '24px' }}
                                className="flex items-start gap-3 sm:gap-4"
                            >
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ 
                                        opacity: 1, 
                                        y: 0,
                                        padding: isMinimized ? '12px 16px' : '24px',
                                        gap: isMinimized ? '16px' : '24px'
                                    }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
                                    className="flex-1 relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[20px] sm:rounded-[24px] flex items-center group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 text-left"
                                >
                                    {/* SaaS Background Accents */}
                                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

                                    <motion.div
                                        animate={{
                                            width: isMinimized ? 40 : 64,
                                            height: isMinimized ? 40 : 64,
                                            borderRadius: isMinimized ? 12 : 20
                                        }}
                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                        className="bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm text-blue-600 dark:text-blue-400 relative z-10"
                                    >
                                        {/* Keyboard Icon */}
                                        <div className="hidden sm:flex">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
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
                                        <div className="flex sm:hidden">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
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
                                    </motion.div>
                                    
                                    <div className="relative z-10 flex-1 min-w-0 pr-2 sm:pr-4">
                                        <motion.h2 
                                            animate={{ fontSize: isMinimized ? '16px' : '26px' }}
                                            className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight m-0 mb-0.5 sm:mb-1 truncate"
                                        >
                                            Keyboard Shortcuts
                                        </motion.h2>
                                        <motion.p 
                                            animate={{ fontSize: isMinimized ? '12px' : '14.5px' }}
                                            className="text-zinc-600 dark:text-zinc-400 leading-relaxed m-0"
                                        >
                                            Speed up your workflow
                                        </motion.p>
                                    </div>
                                    <div className="relative z-20 self-start">
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

                            <AnimatePresence>
                                {!isMinimized && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div style={{ paddingBottom: '4px' }}>
                                            {/* Search bar */}
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 }}
                                                style={{
                                                    position: 'relative',
                                                    marginBottom: '14px',
                                                }}
                                            >
                                                <div style={{
                                                    position: 'absolute',
                                                    left: '14px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    color: isDarkMode ? '#64748b' : '#94a3b8',
                                                    pointerEvents: 'none',
                                                }}>
                                                    <SearchIcon />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Search shortcuts..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px 44px 12px 44px',
                                                        borderRadius: '12px',
                                                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                                                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#ffffff',
                                                        color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                                        fontSize: '14px',
                                                        outline: 'none',
                                                        transition: 'border-color 0.2s, box-shadow 0.2s',
                                                    }}
                                                    onFocus={(e) => {
                                                        e.target.style.borderColor = BLUE;
                                                        e.target.style.boxShadow = `0 0 0 3px ${BLUE}20`;
                                                    }}
                                                    onBlur={(e) => {
                                                        e.target.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
                                                        e.target.style.boxShadow = 'none';
                                                    }}
                                                />
                                                {/* Search Spinner - Centered */}
                                                <div style={{
                                                    position: 'absolute',
                                                    right: '14px',
                                                    top: 0,
                                                    bottom: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    pointerEvents: 'none',
                                                }}>
                                                    <AnimatePresence>
                                                        {isSearching && (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.8 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0, scale: 0.8 }}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                }}
                                                            >
                                                                <SearchSpinner />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </motion.div>

                                            {/* Category tabs */}
                                            {!searchQuery && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.15 }}
                                                    style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: 'repeat(4, 1fr)',
                                                        gap: '8px',
                                                        paddingBottom: '4px',
                                                    }}
                                                >
                                                    {shortcutCategories.map((cat, i) => {
                                                        const isActive = activeCategory === cat.id;
                                                        return (
                                                            <motion.button
                                                                key={cat.id}
                                                                onClick={() => handleCategoryChange(cat.id)}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: 0.1 + i * 0.05 }}
                                                                whileHover={{ y: -2 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                className={`flex items-center gap-2.5 p-2 rounded-[12px] border transition-all shadow-sm text-left ${
                                                                    isActive 
                                                                    ? 'bg-blue-50/80 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30' 
                                                                    : 'bg-white dark:bg-zinc-900/50 border-zinc-200/80 dark:border-zinc-800/80 hover:border-blue-200 dark:hover:border-blue-800/60'
                                                                }`}
                                                            >
                                                                <div className={`p-1.5 rounded-lg border flex-shrink-0 transition-colors flex items-center justify-center ${
                                                                    isActive 
                                                                    ? 'text-blue-600 bg-white dark:bg-blue-900/40 border-blue-100 dark:border-blue-800 shadow-sm' 
                                                                    : 'text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-700/50'
                                                                }`}>
                                                                    <div>
                                                                        {cat.icon}
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col justify-center gap-0.5 min-w-0">
                                                                    <p className={`text-[8.5px] font-bold uppercase tracking-widest leading-none truncate ${
                                                                        isActive ? 'text-blue-500/80 dark:text-blue-400/80' : 'text-zinc-400 dark:text-zinc-500'
                                                                    }`}>
                                                                        Category
                                                                    </p>
                                                                    <p className={`text-[12px] font-extrabold leading-none truncate ${
                                                                        isActive ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'
                                                                    }`}>
                                                                        {cat.name}
                                                                    </p>
                                                                </div>
                                                            </motion.button>
                                                        );
                                                    })}
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Shortcuts List */}
                        <motion.div 
                            layout
                            onScroll={handleScroll}
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '16px 24px',
                            }}
                        >
                            <style>{pulseStyle}</style>
                            <LayoutGroup>
                                <AnimatePresence mode="popLayout">
                                    {isSearching || isTabChanging ? (
                                        /* Loading Skeletons */
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
                                        >
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <ShortcutSkeleton key={i} />
                                            ))}
                                        </motion.div>
                                    ) : activeShortcuts.length > 0 ? (
                                        <motion.div
                                            key={debouncedQuery || activeCategory}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ layout: { type: 'spring', damping: 25, stiffness: 200 } }}
                                            style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
                                        >
                                            {debouncedQuery && (
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    style={{
                                                        margin: '0 0 8px',
                                                        fontSize: '11px',
                                                        fontWeight: 500,
                                                        color: isDarkMode ? '#64748b' : '#94a3b8',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                    }}
                                                >
                                                    {activeShortcuts.length} result{activeShortcuts.length !== 1 ? 's' : ''} found
                                                </motion.p>
                                            )}
                                            {activeShortcuts.map((shortcut, index) => (
                                                <ShortcutRow
                                                    key={shortcut.name}
                                                    shortcut={shortcut}
                                                    categoryId={(shortcut as any).categoryId || activeCategory}
                                                    index={index}
                                                    isDarkMode={isDarkMode}
                                                 />
                                            ))}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                            className="relative overflow-hidden w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-8 flex flex-col items-center justify-center text-center group transition-all duration-300 hover:shadow-md"
                                        >
                                            {/* SaaS Accents */}
                                            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-28 h-28 bg-zinc-500/5 dark:bg-zinc-500/5 rounded-full blur-2xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                            
                                            {/* Tinted Wrench-Style Search Icon Box */}
                                            <motion.div
                                                whileHover={{ scale: 1.05, rotate: -5 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                className="w-16 h-16 rounded-[20px] bg-zinc-50 border border-zinc-200/60 dark:bg-zinc-800/30 dark:border-zinc-850/50 flex items-center justify-center flex-shrink-0 shadow-sm text-zinc-400 dark:text-zinc-500 relative z-10 mb-4"
                                            >
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="11" cy="11" r="8" />
                                                    <path d="m21 21-4.35-4.35" />
                                                </svg>
                                            </motion.div>
                                            
                                            {/* Title & Description with premium typography */}
                                            <div className="relative z-10">
                                                <h3 className="text-[17px] font-extrabold text-zinc-800 dark:text-zinc-200 tracking-tight m-0 mb-1 leading-snug">
                                                    No Shortcuts Found
                                                </h3>
                                                <p className="text-[13.5px] text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed m-0 max-w-sm">
                                                    Try a different search term or select another category tab above to view other actions.
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </LayoutGroup>
                        </motion.div>
 
                        {/* Footer tip - Upgraded to match premium 'Student Tools' dual-badge widget system */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ 
                                opacity: 1,
                                padding: isMinimized ? '8px' : '16px',
                                paddingTop: isMinimized ? '4px' : '4px'
                            }}
                            className="border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-[20px]"
                        >
                            <motion.div
                                animate={{
                                    padding: isMinimized ? '8px 12px' : '16px',
                                    gap: isMinimized ? '10px' : '16px'
                                }}
                                whileHover={{ scale: 1.01 }}
                                className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[20px] flex items-center justify-between group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 text-left"
                            >
                                {/* Left Widget: Total Shortcuts Available */}
                                <motion.div 
                                    animate={{
                                        padding: isMinimized ? '4px 8px' : '10px 14px',
                                    }}
                                    className="flex items-center gap-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[14px] transition-all duration-300 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800/60"
                                >
                                    <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col justify-center gap-0.5 min-w-0 text-left">
                                        <AnimatePresence>
                                            {!isMinimized && (
                                                <motion.p 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 0.8 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="text-[8.5px] font-bold text-blue-500/80 dark:text-blue-400/80 uppercase tracking-widest leading-none"
                                                >
                                                    Available
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                        <p className="text-[12px] font-extrabold text-zinc-800 dark:text-zinc-200 leading-none">
                                            23 Shortcuts
                                        </p>
                                    </div>
                                </motion.div>
 
                                {/* Right Widget: Close Modal Keyboard Tip */}
                                <motion.div 
                                    animate={{
                                        padding: isMinimized ? '4px 8px' : '10px 14px',
                                    }}
                                    className="flex items-center gap-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[14px] transition-all duration-300 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800/60"
                                >
                                    <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-500/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="4" width="20" height="16" rx="2" />
                                            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M18 12h.01M7 16h10" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col justify-center gap-0.5 min-w-0 text-left">
                                            <AnimatePresence>
                                                {!isMinimized && (
                                                    <motion.p 
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 0.8 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="text-[8.5px] font-bold text-emerald-500/80 dark:text-emerald-400/80 uppercase tracking-widest leading-none"
                                                    >
                                                        Dismiss
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                            <p className="text-[12px] font-extrabold text-zinc-800 dark:text-zinc-200 leading-none">
                                                Esc to Close
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 relative -top-[1.5px]">
                                            <KeyBadge keyName="Esc" index={0} isDarkMode={isDarkMode} interactive />
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                                </motion.div>
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
            </div>
        )}
    </AnimatePresence>,

        document.body

    );

};



export default KeyboardShortcutsModal;

