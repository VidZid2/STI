/**
 * Keyboard Shortcuts Modal - Minimalistic Design
 * Displays all available keyboard shortcuts organized by category
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';

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

// Skeleton Component for shortcuts
const ShortcutSkeleton: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderRadius: '8px',
        background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
    }}>
        <div style={{
            width: '60%',
            height: '14px',
            borderRadius: '4px',
            background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            animation: 'keyboardShortcutsPulse 1.5s ease-in-out infinite',
        }} />
        <div style={{ display: 'flex', gap: '4px' }}>
            <div style={{
                width: '32px',
                height: '26px',
                borderRadius: '6px',
                background: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                animation: 'keyboardShortcutsPulse 1.5s ease-in-out infinite',
                animationDelay: '0.1s',
            }} />
            <div style={{
                width: '32px',
                height: '26px',
                borderRadius: '6px',
                background: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                animation: 'keyboardShortcutsPulse 1.5s ease-in-out infinite',
                animationDelay: '0.2s',
            }} />
        </div>
    </div>
);

// Pulse animation style
const pulseStyle = `
    @keyframes keyboardShortcutsPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
    }
`;

interface Shortcut {
    keys: string[];
    description: string;
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

const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6L6 18M6 6l12 12" />
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
            { keys: ['Ctrl', 'K'], description: 'Open command palette' },
            { keys: ['Ctrl', '/'], description: 'Toggle help menu' },
            { keys: ['Ctrl', ','], description: 'Open settings' },
            { keys: ['Esc'], description: 'Close modal / Cancel' },
            { keys: ['F11'], description: 'Toggle fullscreen' },
        ],
    },
    {
        id: 'navigation',
        name: 'Navigation',
        icon: <NavigationIcon />,
        shortcuts: [
            { keys: ['Ctrl', 'H'], description: 'Go to Home' },
            { keys: ['Ctrl', 'D'], description: 'Go to Dashboard' },
            { keys: ['Ctrl', 'T'], description: 'Go to Tools' },
            { keys: ['Ctrl', 'P'], description: 'Go to Progress' },
            { keys: ['Alt', '←'], description: 'Go back' },
            { keys: ['Alt', '→'], description: 'Go forward' },
        ],
    },
    {
        id: 'editing',
        name: 'Editing',
        icon: <EditingIcon />,
        shortcuts: [
            { keys: ['Ctrl', 'Z'], description: 'Undo' },
            { keys: ['Ctrl', 'Y'], description: 'Redo' },
            { keys: ['Ctrl', 'C'], description: 'Copy' },
            { keys: ['Ctrl', 'V'], description: 'Paste' },
            { keys: ['Ctrl', 'X'], description: 'Cut' },
            { keys: ['Ctrl', 'A'], description: 'Select all' },
            { keys: ['Ctrl', 'S'], description: 'Save' },
        ],
    },
    {
        id: 'tools',
        name: 'Tools',
        icon: <ToolsIcon />,
        shortcuts: [
            { keys: ['Ctrl', 'G'], description: 'Open Grammar Checker' },
            { keys: ['Ctrl', 'Shift', 'P'], description: 'Open Paraphraser' },
            { keys: ['Ctrl', 'Shift', 'C'], description: 'Open Citation Generator' },
            { keys: ['Ctrl', 'Shift', 'S'], description: 'Open Summarizer' },
            { keys: ['Ctrl', 'Shift', 'W'], description: 'Open Word Counter' },
        ],
    },
];

// Realistic 3D Keyboard Key Component - Uiverse.io style
const KeyBadge: React.FC<{ keyName: string; index: number; isDarkMode?: boolean; interactive?: boolean }> = ({ 
    keyName, 
    index, 
    isDarkMode = false,
    interactive = false 
}) => {
    const [isPressed, setIsPressed] = React.useState(false);
    
    // Colors based on theme - matching the reference style
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
                minWidth: keyName.length > 3 ? '52px' : '34px',
                height: '34px',
                padding: '0 10px',
                borderRadius: '5px',
                background: keyBg,
                border: `1px solid ${keyBorder}`,
                // Key shadow effect - 0.3em depth when not pressed, 0 when pressed
                boxShadow: isPressed 
                    ? `0 0 0 0 ${keyShadowColor}`
                    : `0 5px 0 1px ${keyShadowColor}`,
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: keyText,
                textTransform: keyName.length === 1 ? 'uppercase' : 'none',
                cursor: interactive ? 'pointer' : 'default',
                // 3D perspective with rotateX and smooth translateY on press
                transform: isPressed 
                    ? 'perspective(100px) rotateX(25deg) translateY(5px)' 
                    : 'perspective(100px) rotateX(25deg) translateY(0)',
                // Smooth 150ms transition for all properties
                transition: 'all 150ms ease',
                outline: 'none',
                transformStyle: 'preserve-3d',
            }}
        >
            {/* Key surface top highlight */}
            <span style={{
                position: 'absolute',
                top: '1px',
                left: '2px',
                right: '2px',
                height: '35%',
                borderRadius: '4px 4px 50% 50%',
                background: isDarkMode 
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, transparent 100%)',
                pointerEvents: 'none',
            }} />
            {/* Key text */}
            <span style={{ position: 'relative', zIndex: 1 }}>{keyName}</span>
        </motion.button>
    );
};

// Shortcut row component
const ShortcutRow: React.FC<{ 
    shortcut: Shortcut; 
    index: number; 
    isDarkMode: boolean;
}> = ({ shortcut, index, isDarkMode }) => (
    <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ 
            delay: index * 0.03,
            layout: { type: 'spring', damping: 25, stiffness: 200 }
        }}
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: '8px',
            background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
        }}
    >
        <span style={{
            fontSize: '13px',
            color: isDarkMode ? '#cbd5e1' : '#475569',
            fontWeight: 400,
        }}>
            {shortcut.description}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {shortcut.keys.map((key, i) => (
                <React.Fragment key={i}>
                    <KeyBadge keyName={key} index={i} isDarkMode={isDarkMode} interactive />
                    {i < shortcut.keys.length - 1 && (
                        <span style={{ 
                            color: isDarkMode ? '#64748b' : '#94a3b8', 
                            fontSize: '12px',
                            fontWeight: 500,
                            margin: '0 2px',
                        }}>+</span>
                    )}
                </React.Fragment>
            ))}
        </div>
    </motion.div>
);

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => document.body.classList.contains('dark-mode'));
    const [activeCategory, setActiveCategory] = useState('general');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const debounceRef = useRef<number | null>(null);

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
        }
    }, [isOpen]);

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
            s.description.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            s.keys.some(k => k.toLowerCase().includes(debouncedQuery.toLowerCase()))
        ),
    })).filter(cat => debouncedQuery === '' || cat.shortcuts.length > 0);

    const activeShortcuts = debouncedQuery 
        ? filteredCategories.flatMap(c => c.shortcuts)
        : shortcutCategories.find(c => c.id === activeCategory)?.shortcuts || [];

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
                        {/* Header */}
                        <div style={{
                            padding: '20px 24px 16px',
                            borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                            background: isDarkMode ? '#1e293b' : '#ffffff',
                        }}>
                            {/* Title row */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', delay: 0.1 }}
                                        style={{
                                            width: '42px',
                                            height: '42px',
                                            borderRadius: '12px',
                                            background: BLUE,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#ffffff',
                                            boxShadow: `0 4px 12px ${BLUE}40`,
                                        }}
                                    >
                                        {/* Keyboard Icon */}
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                                    </motion.div>
                                    <div>
                                        <h2 style={{
                                            margin: 0,
                                            fontSize: '18px',
                                            fontWeight: 700,
                                            color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                        }}>
                                            Keyboard Shortcuts
                                        </h2>
                                        <p style={{
                                            margin: '2px 0 0',
                                            fontSize: '12px',
                                            color: isDarkMode ? '#64748b' : '#94a3b8',
                                        }}>
                                            Speed up your workflow
                                        </p>
                                    </div>
                                </div>
                                <motion.button
                                    onClick={onClose}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: isDarkMode ? '#94a3b8' : '#64748b',
                                    }}
                                >
                                    <CloseIcon />
                                </motion.button>
                            </div>

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
                                        display: 'flex',
                                        gap: '8px',
                                        overflowX: 'auto',
                                        paddingBottom: '4px',
                                    }}
                                >
                                    {shortcutCategories.map((cat, i) => {
                                        const isActive = activeCategory === cat.id;
                                        return (
                                            <motion.button
                                                key={cat.id}
                                                onClick={() => setActiveCategory(cat.id)}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.1 + i * 0.03 }}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                style={{
                                                    padding: '8px 14px',
                                                    borderRadius: '10px',
                                                    border: 'none',
                                                    background: isActive 
                                                        ? BLUE 
                                                        : isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                                    color: isActive 
                                                        ? '#ffffff' 
                                                        : isDarkMode ? '#94a3b8' : '#64748b',
                                                    fontSize: '12px',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                    whiteSpace: 'nowrap',
                                                    boxShadow: isActive ? `0 4px 12px ${BLUE}30` : 'none',
                                                    transition: 'background 0.2s, color 0.2s',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                }}
                                            >
                                                <motion.span
                                                    animate={{ 
                                                        scale: isActive ? 1.1 : 1,
                                                    }}
                                                    style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    {cat.icon}
                                                </motion.span>
                                                {cat.name}
                                            </motion.button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </div>

                        {/* Shortcuts List */}
                        <motion.div 
                            layout
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '16px 24px',
                            }}
                        >
                            <style>{pulseStyle}</style>
                            <LayoutGroup>
                                <AnimatePresence mode="popLayout">
                                    {isSearching ? (
                                        /* Loading Skeletons */
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
                                        >
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <ShortcutSkeleton key={i} isDarkMode={isDarkMode} />
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
                                                    key={shortcut.description}
                                                    shortcut={shortcut}
                                                    index={index}
                                                    isDarkMode={isDarkMode}
                                                />
                                            ))}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{
                                                textAlign: 'center',
                                                padding: '40px 20px',
                                            }}
                                        >
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                margin: '0 auto 12px',
                                                borderRadius: '12px',
                                                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: isDarkMode ? '#475569' : '#cbd5e1',
                                            }}>
                                                <SearchIcon />
                                            </div>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '14px',
                                                color: isDarkMode ? '#64748b' : '#94a3b8',
                                            }}>
                                                No shortcuts found
                                            </p>
                                            <p style={{
                                                margin: '4px 0 0',
                                                fontSize: '12px',
                                                color: isDarkMode ? '#475569' : '#cbd5e1',
                                            }}>
                                                Try a different search term
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </LayoutGroup>
                        </motion.div>

                        {/* Footer tip */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            style={{
                                padding: '12px 24px',
                                borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                                background: isDarkMode ? '#1e293b' : '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                            }}
                        >
                            <span style={{
                                fontSize: '11px',
                                color: isDarkMode ? '#64748b' : '#94a3b8',
                            }}>
                                Press
                            </span>
                            <KeyBadge keyName="Esc" index={0} isDarkMode={isDarkMode} interactive />
                            <span style={{
                                fontSize: '11px',
                                color: isDarkMode ? '#64748b' : '#94a3b8',
                            }}>
                                to close
                            </span>
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default KeyboardShortcutsModal;
