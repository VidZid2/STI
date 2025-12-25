/**
 * Paths Content - Learning Paths Main Page
 * Displays all available learning paths with filtering and enrollment
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { createPortal } from 'react-dom';
import {
    getPathsWithProgress,
    enrollInPath,
    getDifficultyInfo,
    getPathStats,
    getPathCourses,
    getPathTotalModules,
    getPathEstimatedHours,
    formatEstimatedTime,
    isCourseUnlocked,
    checkAndUnlockCourses,
    getCurrentCourse,
    getPathRecommendations,
    type PathWithProgress,
    type PathRecommendation,
} from '../../services/pathsService';
import { fetchStudentStats } from '../../services/databaseService';

interface PathsContentProps {
    onPathSelect?: (pathId: string) => void;
}

// Path icon component
const PathIcon: React.FC<{ icon: string; color: string; size?: number }> = ({ icon, color, size = 24 }) => {
    const icons: Record<string, React.ReactNode> = {
        code: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
            </svg>
        ),
        chart: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
        ),
        chat: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        ),
        user: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
        ),
        book: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
        ),
        graduation: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
        ),
        mobile: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
        ),
        shield: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
    };
    return <div style={{ color }}>{icons[icon] || icons.code}</div>;
};


// Filter tabs
type FilterTab = 'all' | 'enrolled' | 'available';

// Progress Ring with Animated Hover Tooltip
const ProgressRingWithTooltip: React.FC<{
    progress: number;
    pathColor: string;
    isDarkMode: boolean;
    index: number;
}> = ({ progress, pathColor, isDarkMode, index }) => {
    const [isHovered, setIsHovered] = useState(false);

    // Get short description based on progress
    const getDescription = () => {
        if (progress === 100) return 'Complete!';
        if (progress >= 75) return 'Almost there';
        if (progress >= 50) return 'Halfway done';
        if (progress >= 25) return 'Good start';
        if (progress > 0) return 'Just started';
        return 'Not started';
    };

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.2, duration: 0.4 }}
            style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0, cursor: 'pointer' }}
            whileHover={{ scale: 1.08 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            {/* Animated Tooltip - Left Side, Centered to Circle */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, x: 8, scale: 0.85 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 4, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        style={{
                            position: 'absolute',
                            top: '20%',
                            right: '100%',
                            transform: 'translateY(-50%)',
                            marginRight: '10px',
                            padding: '4px 8px',
                            background: '#ffffff',
                            borderRadius: '6px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                            zIndex: 50,
                        }}
                    >
                        <span style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            color: '#3b82f6',
                        }}>
                            {getDescription()}
                        </span>
                        {/* Tooltip Arrow - Right Side */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            right: '-5px',
                            transform: 'translateY(-50%) rotate(45deg)',
                            width: '8px',
                            height: '8px',
                            background: '#ffffff',
                            borderRight: '1px solid rgba(59, 130, 246, 0.2)',
                            borderTop: '1px solid rgba(59, 130, 246, 0.2)',
                        }} />
                    </motion.div>
                )}
            </AnimatePresence>
            
            <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background circle */}
                <circle
                    cx="26"
                    cy="26"
                    r="22"
                    fill="none"
                    stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}
                    strokeWidth="4"
                />
                {/* Progress circle */}
                <motion.circle
                    cx="26"
                    cy="26"
                    r="22"
                    fill="none"
                    stroke={progress === 100 ? '#10b981' : pathColor}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 22}
                    initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - progress / 100) }}
                    transition={{ duration: 0.8, delay: index * 0.05 + 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
            </svg>
            {/* Percentage in center */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '12px',
                fontWeight: 700,
                color: progress === 100 ? '#10b981' : pathColor,
            }}>
                {progress}%
            </div>
        </motion.div>
    );
};

// Hover Tooltip Component for Modal - White bg, Blue text, Small size, Properly Centered
const ModalTooltip: React.FC<{
    text: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ text, children, position = 'top' }) => {
    const [isHovered, setIsHovered] = useState(false);
    const triggerRef = React.useRef<HTMLDivElement>(null);
    const tooltipRef = React.useRef<HTMLDivElement>(null);

    // Update tooltip position on hover and during animation
    useEffect(() => {
        if (!isHovered || !triggerRef.current || !tooltipRef.current) return;
        
        const updatePos = () => {
            if (!triggerRef.current || !tooltipRef.current) return;
            const rect = triggerRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const gap = 8;
            
            let top = 0;
            let left = 0;
            
            switch (position) {
                case 'top':
                    top = rect.top - tooltipRect.height - gap;
                    left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                    break;
                case 'bottom':
                    top = rect.bottom + gap;
                    left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                    break;
                case 'left':
                    top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                    left = rect.left - tooltipRect.width - gap;
                    break;
                case 'right':
                    top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                    left = rect.right + gap;
                    break;
            }
            
            tooltipRef.current.style.top = `${top}px`;
            tooltipRef.current.style.left = `${left}px`;
        };
        
        // Initial position update
        requestAnimationFrame(updatePos);
    }, [isHovered, position]);

    const getArrowStyle = (): React.CSSProperties => {
        const base: React.CSSProperties = {
            position: 'absolute',
            width: '6px',
            height: '6px',
            background: '#ffffff',
        };
        switch (position) {
            case 'top':
                return { ...base, bottom: '-3px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', borderRight: '1px solid rgba(59, 130, 246, 0.15)', borderBottom: '1px solid rgba(59, 130, 246, 0.15)' };
            case 'bottom':
                return { ...base, top: '-3px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', borderLeft: '1px solid rgba(59, 130, 246, 0.15)', borderTop: '1px solid rgba(59, 130, 246, 0.15)' };
            case 'left':
                return { ...base, right: '-3px', top: '50%', transform: 'translateY(-50%) rotate(45deg)', borderTop: '1px solid rgba(59, 130, 246, 0.15)', borderRight: '1px solid rgba(59, 130, 246, 0.15)' };
            case 'right':
                return { ...base, left: '-3px', top: '50%', transform: 'translateY(-50%) rotate(45deg)', borderBottom: '1px solid rgba(59, 130, 246, 0.15)', borderLeft: '1px solid rgba(59, 130, 246, 0.15)' };
            default:
                return base;
        }
    };

    return (
        <div
            ref={triggerRef}
            style={{ display: 'inline-flex' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {children}
            {createPortal(
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            ref={tooltipRef}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                padding: '4px 8px',
                                background: '#ffffff',
                                borderRadius: '5px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                                border: '1px solid rgba(59, 130, 246, 0.15)',
                                whiteSpace: 'nowrap',
                                pointerEvents: 'none',
                                zIndex: 99999,
                            }}
                        >
                            <span style={{ fontSize: '10px', fontWeight: 500, color: '#3b82f6' }}>
                                {text}
                            </span>
                            <div style={getArrowStyle()} />
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

// Filter Tabs Component with proper sliding indicator
interface FilterTabsProps {
    activeFilter: FilterTab;
    setActiveFilter: (filter: FilterTab) => void;
    isDarkMode: boolean;
    colors: {
        accent: string;
        textSecondary: string;
    };
}

const FilterTabs: React.FC<FilterTabsProps> = ({ activeFilter, setActiveFilter, isDarkMode, colors }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 5, width: 60 });
    
    const tabs: { id: FilterTab; label: string; icon: React.ReactNode }[] = [
        {
            id: 'all',
            label: 'All',
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                </svg>
            ),
        },
        {
            id: 'enrolled',
            label: 'Enrolled',
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            ),
        },
        {
            id: 'available',
            label: 'Available',
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
            ),
        },
    ];

    // Update indicator position when active filter changes
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

    // Initial measurement after mount
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
            transition={{ delay: 0.35, duration: 0.4 }}
            style={{
                display: 'flex',
                gap: '4px',
                padding: '4px',
                borderRadius: '12px',
                background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                position: 'relative',
            }}
        >
            {/* Sliding Background Indicator */}
            <motion.div
                style={{
                    position: 'absolute',
                    top: '4px',
                    bottom: '4px',
                    borderRadius: '8px',
                    background: isDarkMode 
                        ? 'rgba(59, 130, 246, 0.15)' 
                        : 'rgba(59, 130, 246, 0.1)',
                    border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                    zIndex: 0,
                }}
                initial={false}
                animate={{
                    left: indicatorStyle.left,
                    width: indicatorStyle.width,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
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
                </motion.button>
            ))}
        </motion.div>
    );
};

// Path Detail Modal Component
interface PathDetailModalProps {
    path: PathWithProgress | null;
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
    courseProgress: Record<string, { progress: number }>;
    onContinueLearning: (courseId: string) => void;
    onViewCertificate?: (path: PathWithProgress) => void;
}

const PathDetailModal: React.FC<PathDetailModalProps> = ({
    path,
    isOpen,
    onClose,
    isDarkMode,
    courseProgress,
    onContinueLearning,
    onViewCertificate,
}) => {
    const [hoveredCourse, setHoveredCourse] = useState<string | null>(null);
    
    const colors = {
        bg: isDarkMode ? '#0f172a' : '#ffffff',
        cardBg: isDarkMode ? '#1e293b' : '#f8fafc',
        border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        textPrimary: isDarkMode ? '#f1f5f9' : '#0f172a',
        textSecondary: isDarkMode ? '#94a3b8' : '#475569',
        textMuted: isDarkMode ? '#94a3b8' : '#334155',
    };

    // Get courses for this path
    const courses = path ? getPathCourses(path) : [];
    
    // Find current course (first incomplete unlocked course)
    const currentCourse = path ? getCurrentCourse(path, courseProgress) : courses[0];

    // Calculate stats
    const totalModules = path ? getPathTotalModules(path) : 0;
    const estimatedHours = path ? getPathEstimatedHours(path) : 0;
    const difficultyInfo = path ? getDifficultyInfo(path.difficulty) : { label: '', color: '' };

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!path) return null;

    const pathProgress = path.progress?.progress_percentage || 0;
    const completedCount = path.completed_courses_count || 0;
    const totalCourses = path.total_courses || courses.length;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 9998,
                        }}
                    />

                    {/* Modal Container - Centered */}
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                            pointerEvents: 'none',
                            padding: '20px',
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            style={{
                                width: '100%',
                                maxWidth: '560px',
                                maxHeight: '85vh',
                                background: colors.bg,
                                borderRadius: '20px',
                                boxShadow: isDarkMode
                                    ? '0 24px 48px rgba(0, 0, 0, 0.4)'
                                    : '0 24px 48px rgba(0, 0, 0, 0.15)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                pointerEvents: 'auto',
                            }}
                        >
                            {/* Header */}
                            <div style={{
                                padding: '20px 24px',
                                borderBottom: `1px solid ${colors.border}`,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                                    {/* Path Icon with hover effect */}
                                    <ModalTooltip text={path.title} position="right">
                                        <motion.div
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                            style={{
                                                width: '52px',
                                                height: '52px',
                                                borderRadius: '14px',
                                                background: `linear-gradient(135deg, ${path.color}20 0%, ${path.color}10 100%)`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                cursor: 'pointer',
                                                boxShadow: `0 4px 12px ${path.color}20`,
                                            }}
                                        >
                                            <PathIcon icon={path.icon} color={path.color} size={26} />
                                        </motion.div>
                                    </ModalTooltip>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h2 style={{
                                            margin: 0,
                                            fontSize: '18px',
                                            fontWeight: 600,
                                            color: colors.textPrimary,
                                            marginBottom: '6px',
                                        }}>
                                            {path.title}
                                        </h2>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '13px',
                                            color: colors.textSecondary,
                                            marginBottom: '8px',
                                        }}>
                                            {path.description}
                                        </p>
                                        {/* Difficulty Badge */}
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 }}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '3px 8px',
                                                borderRadius: '6px',
                                                background: `${difficultyInfo.color}15`,
                                                fontSize: '11px',
                                                fontWeight: 500,
                                                color: difficultyInfo.color,
                                            }}
                                        >
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                            </svg>
                                            {difficultyInfo.label}
                                        </motion.span>
                                    </div>

                                    {/* Close Button */}
                                    <ModalTooltip text="Close (Esc)" position="left">
                                        <motion.button
                                            whileHover={{ scale: 1.1, background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={onClose}
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '10px',
                                                border: 'none',
                                                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: colors.textSecondary,
                                            }}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </motion.button>
                                    </ModalTooltip>
                                </div>

                                {/* Stats Row */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    style={{
                                        display: 'flex',
                                        gap: '12px',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    {/* Courses Stat */}
                                    <ModalTooltip text={`${completedCount} completed, ${totalCourses - completedCount} remaining`} position="bottom">
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 10px',
                                            borderRadius: '8px',
                                            background: colors.cardBg,
                                            cursor: 'default',
                                        }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={path.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                            </svg>
                                            <span style={{ fontSize: '12px', fontWeight: 500, color: colors.textPrimary }}>
                                                {completedCount}/{totalCourses} courses
                                            </span>
                                        </div>
                                    </ModalTooltip>

                                    {/* Modules Stat */}
                                    <ModalTooltip text={`Total modules in this path`} position="bottom">
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 10px',
                                            borderRadius: '8px',
                                            background: colors.cardBg,
                                            cursor: 'default',
                                        }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="7" height="7" />
                                                <rect x="14" y="3" width="7" height="7" />
                                                <rect x="14" y="14" width="7" height="7" />
                                                <rect x="3" y="14" width="7" height="7" />
                                            </svg>
                                            <span style={{ fontSize: '12px', fontWeight: 500, color: colors.textPrimary }}>
                                                {totalModules} modules
                                            </span>
                                        </div>
                                    </ModalTooltip>

                                    {/* Time Stat */}
                                    <ModalTooltip text={`Estimated completion time`} position="bottom">
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 10px',
                                            borderRadius: '8px',
                                            background: colors.cardBg,
                                            cursor: 'default',
                                        }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            <span style={{ fontSize: '12px', fontWeight: 500, color: colors.textPrimary }}>
                                                {formatEstimatedTime(estimatedHours)}
                                            </span>
                                        </div>
                                    </ModalTooltip>

                                    {/* Enrolled Stat */}
                                    <ModalTooltip text={`Students enrolled in this path`} position="bottom">
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 10px',
                                            borderRadius: '8px',
                                            background: colors.cardBg,
                                            cursor: 'default',
                                        }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                <circle cx="9" cy="7" r="4" />
                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                            </svg>
                                            <span style={{ fontSize: '12px', fontWeight: 500, color: colors.textPrimary }}>
                                                {path.enrolled_count} enrolled
                                            </span>
                                        </div>
                                    </ModalTooltip>
                                </motion.div>
                            </div>

                        {/* Progress Bar */}
                        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${colors.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 500, color: colors.textSecondary }}>
                                    Overall Progress
                                </span>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: path.color }}>
                                    {pathProgress}%
                                </span>
                            </div>
                            <div style={{
                                height: '6px',
                                borderRadius: '3px',
                                background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                overflow: 'hidden',
                            }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pathProgress}%` }}
                                    transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                    style={{
                                        height: '100%',
                                        background: pathProgress === 100 ? '#10b981' : path.color,
                                        borderRadius: '3px',
                                    }}
                                />
                            </div>
                        </div>

                            {/* Course List Header */}
                            <div style={{
                                padding: '12px 24px 8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Courses
                                </span>
                                <span style={{ fontSize: '11px', color: colors.textMuted }}>
                                    {courses.length} total
                                </span>
                            </div>

                            {/* Course List */}
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                padding: '12px 20px 16px',
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px' }}>
                                    {courses.map((course, index) => {
                                        const progress = courseProgress[course.id]?.progress || 0;
                                        const isCompleted = progress === 100;
                                        const isUnlocked = isCourseUnlocked(course.id, path);
                                        const isLocked = !isUnlocked;
                                        const isCurrent = course.id === currentCourse?.id && !isCompleted && isUnlocked;
                                        const isHovered = hoveredCourse === course.id;
                                        const statusText = isLocked ? 'Locked' : isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Not Started';

                                        return (
                                            <motion.div
                                                key={course.id}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ 
                                                    opacity: isLocked ? 0.6 : 1, 
                                                    x: 0,
                                                }}
                                                transition={{ 
                                                    delay: index * 0.04 + 0.1,
                                                    scale: { type: 'spring', stiffness: 400, damping: 25 },
                                                    y: { type: 'spring', stiffness: 400, damping: 25 },
                                                    layout: { type: 'spring', stiffness: 400, damping: 30 },
                                                }}
                                                onMouseEnter={() => !isLocked && setHoveredCourse(course.id)}
                                                onMouseLeave={() => setHoveredCourse(null)}
                                                whileHover={!isLocked ? { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' } : undefined}
                                                style={{
                                                    padding: '12px 14px',
                                                    borderRadius: '12px',
                                                    background: isLocked
                                                        ? isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
                                                        : isCurrent 
                                                            ? `${path.color}10` 
                                                            : colors.cardBg,
                                                    border: `1px solid ${isLocked ? 'transparent' : isCurrent ? `${path.color}30` : isHovered ? `${path.color}20` : 'transparent'}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    cursor: isLocked ? 'not-allowed' : 'pointer',
                                                    transition: 'border-color 0.2s ease',
                                                }}
                                            >
                                                {/* Status Icon with animation */}
                                                <motion.div
                                                    animate={{
                                                        scale: isHovered && !isLocked ? 1.1 : 1,
                                                        rotate: isHovered && isCurrent ? 10 : 0,
                                                    }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                                    style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '10px',
                                                        background: isLocked
                                                            ? isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'
                                                            : isCompleted 
                                                                ? 'rgba(16, 185, 129, 0.1)' 
                                                                : isCurrent 
                                                                    ? `${path.color}15` 
                                                                    : isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {isLocked ? (
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                        </svg>
                                                    ) : isCompleted ? (
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    ) : isCurrent ? (
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={path.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polygon points="5 3 19 12 5 21 5 3" />
                                                        </svg>
                                                    ) : (
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="12" cy="12" r="10" />
                                                        </svg>
                                                    )}
                                                </motion.div>

                                                {/* Course Info */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        marginBottom: '4px',
                                                    }}>
                                                        <span style={{
                                                            fontSize: '13px',
                                                            fontWeight: 600,
                                                            color: colors.textPrimary,
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                        }}>
                                                            {course.title}
                                                        </span>
                                                        {isCurrent && (
                                                            <motion.span
                                                                initial={{ opacity: 0, scale: 0.8 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                style={{
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    background: `${path.color}20`,
                                                                    fontSize: '9px',
                                                                    fontWeight: 600,
                                                                    color: path.color,
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.3px',
                                                                    flexShrink: 0,
                                                                }}
                                                            >
                                                                Current
                                                            </motion.span>
                                                        )}
                                                    </div>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        fontSize: '11px',
                                                        color: colors.textMuted,
                                                    }}>
                                                        <span>{course.subtitle}</span>
                                                        <span style={{ opacity: 0.5 }}>•</span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <rect x="3" y="3" width="7" height="7" />
                                                                <rect x="14" y="3" width="7" height="7" />
                                                                <rect x="3" y="14" width="7" height="7" />
                                                            </svg>
                                                            {course.modules} module{course.modules !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Progress with mini bar - with layout animation */}
                                                <motion.div
                                                    layout
                                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'flex-end',
                                                        gap: '4px',
                                                        minWidth: '60px',
                                                    }}
                                                >
                                                    <motion.span
                                                        layout
                                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                                        style={{
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            color: isCompleted ? '#10b981' : isCurrent ? path.color : colors.textMuted,
                                                        }}
                                                    >
                                                        {progress}%
                                                    </motion.span>
                                                    {/* Mini progress bar */}
                                                    <motion.div
                                                        layout
                                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                                        style={{
                                                            width: '48px',
                                                            height: '4px',
                                                            borderRadius: '2px',
                                                            background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${progress}%` }}
                                                            transition={{ duration: 0.5, delay: index * 0.05 + 0.2 }}
                                                            style={{
                                                                height: '100%',
                                                                background: isCompleted ? '#10b981' : isCurrent ? path.color : colors.textMuted,
                                                                borderRadius: '2px',
                                                            }}
                                                        />
                                                    </motion.div>
                                                </motion.div>

                                                {/* Hover status badge - with layout animation */}
                                                <AnimatePresence mode="popLayout">
                                                    {isHovered && !isLocked && (
                                                        <motion.div
                                                            layout
                                                            initial={{ opacity: 0, scale: 0.8, x: 10 }}
                                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                                            exit={{ opacity: 0, scale: 0.8, x: 10 }}
                                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                            style={{
                                                                padding: '4px 8px',
                                                                borderRadius: '6px',
                                                                background: isCompleted ? '#10b981' : isCurrent ? path.color : colors.textMuted,
                                                                color: '#fff',
                                                                fontSize: '10px',
                                                                fontWeight: 500,
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            {statusText}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                                {/* Locked badge - always visible for locked courses */}
                                                {isLocked && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                                            color: colors.textMuted,
                                                            fontSize: '10px',
                                                            fontWeight: 500,
                                                            whiteSpace: 'nowrap',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                        }}
                                                    >
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                        </svg>
                                                        Locked
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>

                        {/* Footer with Continue Button or View Certificate */}
                        <div style={{
                            padding: '16px 24px',
                            borderTop: `1px solid ${colors.border}`,
                            display: 'flex',
                            gap: '12px',
                        }}>
                            <motion.button
                                whileHover={{ 
                                    scale: 1.02,
                                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                                    borderColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                                }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                style={{
                                    flex: 1,
                                    padding: '12px 20px',
                                    borderRadius: '10px',
                                    border: `1px solid ${colors.border}`,
                                    background: 'transparent',
                                    color: colors.textSecondary,
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                Close
                            </motion.button>
                            {pathProgress === 100 && onViewCertificate ? (
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onViewCertificate(path)}
                                    style={{
                                        flex: 2,
                                        padding: '12px 20px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                        color: '#ffffff',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="8" r="6" />
                                        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                                    </svg>
                                    View Certificate
                                </motion.button>
                            ) : currentCourse && (
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: `0 8px 24px ${path.color}40` }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onContinueLearning(currentCourse.id)}
                                    style={{
                                        flex: 2,
                                        padding: '12px 20px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: path.color,
                                        color: '#ffffff',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                    Continue Learning
                                </motion.button>
                            )}
                        </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

// Path Certificate Modal - Shows achievement when path is completed
interface PathCertificateModalProps {
    path: PathWithProgress | null;
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
    completedAt?: string;
}

const PathCertificateModal: React.FC<PathCertificateModalProps> = ({
    path,
    isOpen,
    onClose,
    isDarkMode,
    completedAt,
}) => {
    const colors = {
        bg: isDarkMode ? '#0f172a' : '#ffffff',
        cardBg: isDarkMode ? '#1e293b' : '#f8fafc',
        border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        textPrimary: isDarkMode ? '#f1f5f9' : '#0f172a',
        textSecondary: isDarkMode ? '#94a3b8' : '#475569',
        textMuted: isDarkMode ? '#94a3b8' : '#334155',
        gold: '#f59e0b',
        goldLight: '#fef3c7',
    };

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!path) return null;

    const formattedDate = completedAt 
        ? new Date(completedAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })
        : new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(8px)',
                            zIndex: 9998,
                        }}
                    />

                    {/* Modal Container */}
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                            pointerEvents: 'none',
                            padding: '20px',
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            style={{
                                width: '100%',
                                maxWidth: '420px',
                                background: colors.bg,
                                borderRadius: '24px',
                                boxShadow: isDarkMode
                                    ? '0 32px 64px rgba(0, 0, 0, 0.5)'
                                    : '0 32px 64px rgba(0, 0, 0, 0.2)',
                                overflow: 'hidden',
                                pointerEvents: 'auto',
                                border: `1px solid ${colors.border}`,
                            }}
                        >
                            {/* Certificate Header with Confetti Effect */}
                            <div style={{
                                position: 'relative',
                                padding: '32px 24px 24px',
                                background: `linear-gradient(135deg, ${path.color}15 0%, ${colors.gold}10 100%)`,
                                borderBottom: `1px solid ${colors.border}`,
                                textAlign: 'center',
                                overflow: 'hidden',
                            }}>
                                {/* Decorative Elements */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 0.3, scale: 1 }}
                                    transition={{ delay: 0.2, duration: 0.5 }}
                                    style={{
                                        position: 'absolute',
                                        top: '-20px',
                                        left: '-20px',
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        background: `radial-gradient(circle, ${colors.gold}30 0%, transparent 70%)`,
                                    }}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 0.2, scale: 1 }}
                                    transition={{ delay: 0.3, duration: 0.5 }}
                                    style={{
                                        position: 'absolute',
                                        bottom: '-30px',
                                        right: '-30px',
                                        width: '120px',
                                        height: '120px',
                                        borderRadius: '50%',
                                        background: `radial-gradient(circle, ${path.color}30 0%, transparent 70%)`,
                                    }}
                                />

                                {/* Trophy/Badge Icon */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        margin: '0 auto 16px',
                                        borderRadius: '50%',
                                        background: `linear-gradient(135deg, ${colors.gold} 0%, #d97706 100%)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: `0 8px 24px ${colors.gold}40`,
                                    }}
                                >
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                                        <path d="M4 22h16" />
                                        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                                        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                                        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                                    </svg>
                                </motion.div>

                                {/* Congratulations Text */}
                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    style={{
                                        margin: 0,
                                        fontSize: '22px',
                                        fontWeight: 700,
                                        color: colors.textPrimary,
                                        marginBottom: '8px',
                                    }}
                                >
                                    🎉 Congratulations!
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    style={{
                                        margin: 0,
                                        fontSize: '14px',
                                        color: colors.textSecondary,
                                    }}
                                >
                                    You've completed the learning path
                                </motion.p>
                            </div>

                            {/* Certificate Content */}
                            <div style={{ padding: '24px' }}>
                                {/* Path Title */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35 }}
                                    style={{
                                        textAlign: 'center',
                                        marginBottom: '20px',
                                    }}
                                >
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '12px 20px',
                                        borderRadius: '12px',
                                        background: `${path.color}10`,
                                        border: `1px solid ${path.color}20`,
                                    }}>
                                        <PathIcon icon={path.icon} color={path.color} size={24} />
                                        <span style={{
                                            fontSize: '16px',
                                            fontWeight: 600,
                                            color: colors.textPrimary,
                                        }}>
                                            {path.title}
                                        </span>
                                    </div>
                                </motion.div>

                                {/* Achievement Stats */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: '12px',
                                        marginBottom: '20px',
                                    }}
                                >
                                    {/* Courses Completed */}
                                    <div style={{
                                        padding: '12px',
                                        borderRadius: '10px',
                                        background: colors.cardBg,
                                        textAlign: 'center',
                                    }}>
                                        <div style={{
                                            fontSize: '20px',
                                            fontWeight: 700,
                                            color: path.color,
                                            marginBottom: '4px',
                                        }}>
                                            {path.total_courses}
                                        </div>
                                        <div style={{
                                            fontSize: '10px',
                                            color: colors.textMuted,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                        }}>
                                            Courses
                                        </div>
                                    </div>

                                    {/* Modules */}
                                    <div style={{
                                        padding: '12px',
                                        borderRadius: '10px',
                                        background: colors.cardBg,
                                        textAlign: 'center',
                                    }}>
                                        <div style={{
                                            fontSize: '20px',
                                            fontWeight: 700,
                                            color: '#8b5cf6',
                                            marginBottom: '4px',
                                        }}>
                                            {getPathTotalModules(path)}
                                        </div>
                                        <div style={{
                                            fontSize: '10px',
                                            color: colors.textMuted,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                        }}>
                                            Modules
                                        </div>
                                    </div>

                                    {/* Hours */}
                                    <div style={{
                                        padding: '12px',
                                        borderRadius: '10px',
                                        background: colors.cardBg,
                                        textAlign: 'center',
                                    }}>
                                        <div style={{
                                            fontSize: '20px',
                                            fontWeight: 700,
                                            color: '#10b981',
                                            marginBottom: '4px',
                                        }}>
                                            {formatEstimatedTime(getPathEstimatedHours(path))}
                                        </div>
                                        <div style={{
                                            fontSize: '10px',
                                            color: colors.textMuted,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                        }}>
                                            Completed
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Completion Date */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.45 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        padding: '10px 16px',
                                        borderRadius: '8px',
                                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                        marginBottom: '20px',
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    <span style={{
                                        fontSize: '12px',
                                        color: colors.textSecondary,
                                    }}>
                                        Completed on {formattedDate}
                                    </span>
                                </motion.div>

                                {/* Badge Earned */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        background: `linear-gradient(135deg, ${colors.goldLight} 0%, ${colors.gold}15 100%)`,
                                        border: `1px solid ${colors.gold}30`,
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: `linear-gradient(135deg, ${colors.gold} 0%, #d97706 100%)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="8" r="6" />
                                            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div style={{
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: '#92400e',
                                            marginBottom: '2px',
                                        }}>
                                            Badge Earned!
                                        </div>
                                        <div style={{
                                            fontSize: '11px',
                                            color: '#b45309',
                                        }}>
                                            {path.title} Completion Badge
                                        </div>
                                    </div>
                                    <motion.div
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ duration: 0.5, repeat: 2, delay: 0.6 }}
                                        style={{ marginLeft: 'auto' }}
                                    >
                                        <span style={{ fontSize: '24px' }}>🏅</span>
                                    </motion.div>
                                </motion.div>
                            </div>

                            {/* Footer */}
                            <div style={{
                                padding: '16px 24px',
                                borderTop: `1px solid ${colors.border}`,
                                display: 'flex',
                                gap: '12px',
                            }}>
                                <motion.button
                                    whileHover={{ 
                                        scale: 1.02,
                                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onClose}
                                    style={{
                                        flex: 1,
                                        padding: '12px 20px',
                                        borderRadius: '10px',
                                        border: `1px solid ${colors.border}`,
                                        background: 'transparent',
                                        color: colors.textSecondary,
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Close
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: `0 8px 24px ${colors.gold}40` }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        // Could implement share functionality here
                                        onClose();
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '12px 20px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: `linear-gradient(135deg, ${colors.gold} 0%, #d97706 100%)`,
                                        color: '#ffffff',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="18" cy="5" r="3" />
                                        <circle cx="6" cy="12" r="3" />
                                        <circle cx="18" cy="19" r="3" />
                                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                    </svg>
                                    Share
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

const PathsContent: React.FC<PathsContentProps> = ({ onPathSelect: _onPathSelect }) => {
    const [paths, setPaths] = useState<PathWithProgress[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPath, setSelectedPath] = useState<PathWithProgress | null>(null);
    const [certificatePath, setCertificatePath] = useState<PathWithProgress | null>(null);
    const [courseProgress, setCourseProgress] = useState<Record<string, { progress: number }>>({});
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const [sortBy, setSortBy] = useState<'name' | 'progress' | 'difficulty'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [recommendations, setRecommendations] = useState<PathRecommendation[]>([]);
    const [showRecommendations, setShowRecommendations] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(() => 
        document.body.classList.contains('dark-mode')
    );

    // Debounced search effect
    useEffect(() => {
        if (searchQuery) {
            setIsSearching(true);
            const timer = setTimeout(() => {
                setIsSearching(false);
            }, 400);
            return () => clearTimeout(timer);
        } else {
            setIsSearching(false);
        }
    }, [searchQuery]);

    // Check for dark mode changes
    useEffect(() => {
        const checkDarkMode = () => setIsDarkMode(document.body.classList.contains('dark-mode'));
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Load paths
    useEffect(() => {
        setIsLoading(true);
        getPathsWithProgress('demo-student').then((data) => {
            setPaths(data);
            setIsLoading(false);
        });
    }, []);

    // Load course progress from Supabase and check for unlocks
    useEffect(() => {
        const loadCourseProgress = async () => {
            try {
                const stats = await fetchStudentStats();
                if (stats?.course_progress) {
                    setCourseProgress(stats.course_progress);
                    
                    // Check and unlock courses based on progress
                    paths.forEach(path => {
                        const newlyUnlocked = checkAndUnlockCourses(path, stats.course_progress);
                        if (newlyUnlocked.length > 0) {
                            console.log('[PathsContent] Newly unlocked courses:', newlyUnlocked);
                        }
                    });
                    
                    // Load path recommendations based on user interests
                    const enrolledPaths = paths.filter(p => p.progress);
                    const recs = await getPathRecommendations('demo-student', stats.course_progress, enrolledPaths);
                    setRecommendations(recs);
                }
            } catch (err) {
                console.error('[PathsContent] Error loading course progress:', err);
            }
        };
        loadCourseProgress();
    }, [paths]);

    // Handle path card click - open detail modal
    const handlePathClick = useCallback((path: PathWithProgress) => {
        setSelectedPath(path);
    }, []);

    // Handle continue learning - navigate to course
    const handleContinueLearning = useCallback((courseId: string) => {
        console.log('[PathsContent] Continue Learning clicked, courseId:', courseId);
        // Close modal and trigger navigation
        setSelectedPath(null);
        // Dispatch custom event for course navigation with source view
        const event = new CustomEvent('navigate-to-course', { 
            detail: { courseId, fromView: 'paths' } 
        });
        console.log('[PathsContent] Dispatching navigate-to-course event from paths');
        window.dispatchEvent(event);
    }, []);

    // Filter and sort paths
    const filteredPaths = useMemo(() => {
        let result = [...paths];
        
        // Filter by tab
        if (activeFilter === 'enrolled') {
            result = result.filter(p => p.progress);
        } else if (activeFilter === 'available') {
            result = result.filter(p => !p.progress);
        }
        
        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p => 
                p.title.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query)
            );
        }
        
        // Sort paths
        result.sort((a, b) => {
            let comparison = 0;
            
            switch (sortBy) {
                case 'name':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'progress':
                    const progressA = a.progress?.progress_percentage || 0;
                    const progressB = b.progress?.progress_percentage || 0;
                    comparison = progressA - progressB;
                    break;
                case 'difficulty':
                    const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
                    comparison = (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0);
                    break;
            }
            
            return sortOrder === 'asc' ? comparison : -comparison;
        });
        
        return result;
    }, [paths, activeFilter, searchQuery, sortBy, sortOrder]);

    const stats = useMemo(() => getPathStats(paths), [paths]);

    // Search suggestions - show matching paths as user types
    const searchSuggestions = useMemo(() => {
        if (!searchQuery || searchQuery.length < 1) return [];
        const query = searchQuery.toLowerCase();
        return paths
            .filter(p => 
                p.title.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query)
            )
            .slice(0, 5);
    }, [paths, searchQuery]);

    // Handle keyboard navigation in suggestions
    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setShowSuggestions(false);
            setSearchQuery('');
            searchInputRef.current?.blur();
        } else if (e.key === 'ArrowDown' && showSuggestions && searchSuggestions.length > 0) {
            e.preventDefault();
            setSelectedSuggestionIndex(prev => 
                prev < searchSuggestions.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === 'ArrowUp' && showSuggestions && searchSuggestions.length > 0) {
            e.preventDefault();
            setSelectedSuggestionIndex(prev => 
                prev > 0 ? prev - 1 : searchSuggestions.length - 1
            );
        } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0 && searchSuggestions[selectedSuggestionIndex]) {
            e.preventDefault();
            const selected = searchSuggestions[selectedSuggestionIndex];
            setSearchQuery(selected.title);
            setShowSuggestions(false);
            setSelectedSuggestionIndex(-1);
        }
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
                searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard shortcut "/" to focus search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Handle enrollment
    const handleEnroll = async (pathId: string) => {
        const result = await enrollInPath(pathId, 'demo-student');
        if (result) {
            // Refresh paths
            const updated = await getPathsWithProgress('demo-student');
            setPaths(updated);
        }
    };

    // Colors based on theme
    const colors = {
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
        cardBg: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        textPrimary: isDarkMode ? '#f1f5f9' : '#0f172a',
        textSecondary: isDarkMode ? '#94a3b8' : '#64748b',
        textMuted: isDarkMode ? '#94a3b8' : '#475569',
        accent: '#3b82f6',
    };

    return (
        <div style={{ 
            padding: '24px', 
            maxWidth: '1200px', 
            margin: '0 auto',
            minHeight: '100vh',
        }}>
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ marginBottom: '28px' }}
            >
                <motion.div 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '16px',
                        padding: '18px 22px',
                        borderRadius: '14px',
                        background: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                        boxShadow: isDarkMode 
                            ? '0 2px 12px rgba(0,0,0,0.15)' 
                            : '0 2px 12px rgba(0,0,0,0.04)',
                    }}
                >
                    {/* Icon */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ scale: 1.08, transition: { duration: 0.2 } }}
                        style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '12px',
                            background: isDarkMode 
                                ? 'rgba(59, 130, 246, 0.12)'
                                : 'rgba(59, 130, 246, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <path d="m9 11 3 3L22 4" />
                        </svg>
                    </motion.div>
                    
                    {/* Title & Description */}
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        style={{ flex: 1 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <h1 style={{ 
                                margin: 0, 
                                fontSize: '20px', 
                                fontWeight: 600, 
                                color: colors.textPrimary,
                                letterSpacing: '-0.3px',
                            }}>
                                Learning Paths
                            </h1>
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.25, duration: 0.3 }}
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    color: '#3b82f6',
                                    background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.4px',
                                }}
                            >
                                {stats.totalPaths} Path{stats.totalPaths !== 1 ? 's' : ''}
                            </motion.span>
                        </div>
                        <p style={{ 
                            margin: 0, 
                            fontSize: '13px', 
                            color: colors.textSecondary,
                            fontWeight: 400,
                        }}>
                            Structured journeys to master new skills step by step
                        </p>
                    </motion.div>

                    {/* Quick Stats Cards */}
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            display: 'flex',
                            alignItems: 'stretch',
                            gap: '10px',
                        }}
                    >
                        {[
                            {
                                label: 'Total Paths',
                                value: stats.totalPaths,
                                description: 'Available',
                                color: '#3b82f6',
                                bgColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.06)',
                                icon: (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                    </svg>
                                ),
                            },
                            {
                                label: 'Enrolled',
                                value: stats.enrolledPaths,
                                description: 'Joined',
                                color: '#8b5cf6',
                                bgColor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.06)',
                                icon: (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                ),
                            },
                            {
                                label: 'In Progress',
                                value: stats.inProgressPaths,
                                description: 'Active',
                                color: '#f59e0b',
                                bgColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.06)',
                                icon: (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                ),
                            },
                            {
                                label: 'Completed',
                                value: stats.completedPaths,
                                description: 'Done',
                                color: '#10b981',
                                bgColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.06)',
                                icon: (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                ),
                            },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 + i * 0.05, duration: 0.3 }}
                                whileHover={{ 
                                    y: -2, 
                                    scale: 1.02,
                                    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } 
                                }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    padding: '10px 16px',
                                    borderRadius: '10px',
                                    background: stat.bgColor,
                                    cursor: 'default',
                                    minWidth: '72px',
                                }}
                                title={`${stat.label}: ${stat.value} paths`}
                            >
                                <div style={{ 
                                    color: stat.color, 
                                    marginBottom: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    {stat.icon}
                                </div>
                                <span style={{ 
                                    fontSize: '18px', 
                                    fontWeight: 700, 
                                    color: stat.color,
                                    lineHeight: 1,
                                    marginBottom: '2px',
                                }}>
                                    {stat.value}
                                </span>
                                <span style={{ 
                                    fontSize: '10px', 
                                    fontWeight: 500, 
                                    color: colors.textMuted,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.3px',
                                }}>
                                    {stat.description}
                                </span>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Path Recommendations Section - Only show when there are 2+ paths to recommend */}
            <AnimatePresence>
                {showRecommendations && recommendations.length > 0 && paths.length >= 2 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.4 }}
                            style={{
                                padding: '16px 20px',
                                borderRadius: '14px',
                                background: isDarkMode 
                                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.06) 100%)'
                                    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(59, 130, 246, 0.04) 100%)',
                                border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.12)'}`,
                            }}
                        >
                            {/* Header */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                marginBottom: '14px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 15 }}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            background: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                        </svg>
                                    </motion.div>
                                    <div>
                                        <h3 style={{ 
                                            margin: 0, 
                                            fontSize: '14px', 
                                            fontWeight: 600, 
                                            color: colors.textPrimary,
                                        }}>
                                            Recommended for You
                                        </h3>
                                        <p style={{ 
                                            margin: 0, 
                                            fontSize: '11px', 
                                            color: colors.textMuted,
                                        }}>
                                            Based on your interests and progress
                                        </p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowRecommendations(false)}
                                    style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                        color: colors.textMuted,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    title="Dismiss recommendations"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </motion.button>
                            </div>

                            {/* Recommendation Cards */}
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '12px',
                            }}>
                                {recommendations.map((rec, index) => {
                                    const difficultyInfo = getDifficultyInfo(rec.path.difficulty);
                                    return (
                                        <motion.div
                                            key={rec.path.id}
                                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ 
                                                delay: 0.15 + index * 0.08,
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 25,
                                            }}
                                            whileHover={{ 
                                                y: -4, 
                                                scale: 1.02,
                                                transition: { duration: 0.2 }
                                            }}
                                            onClick={() => {
                                                const pathWithProgress = paths.find(p => p.id === rec.path.id);
                                                if (pathWithProgress) {
                                                    handlePathClick(pathWithProgress);
                                                }
                                            }}
                                            style={{
                                                padding: '14px',
                                                borderRadius: '12px',
                                                background: colors.cardBg,
                                                border: `1px solid ${colors.border}`,
                                                cursor: 'pointer',
                                                boxShadow: isDarkMode 
                                                    ? '0 2px 8px rgba(0,0,0,0.15)' 
                                                    : '0 2px 8px rgba(0,0,0,0.04)',
                                            }}
                                        >
                                            {/* Path Icon & Title */}
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                                                <motion.div
                                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                                    style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '10px',
                                                        background: `${rec.path.color}15`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <PathIcon icon={rec.path.icon} color={rec.path.color} size={18} />
                                                </motion.div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <h4 style={{
                                                        margin: 0,
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        color: colors.textPrimary,
                                                        lineHeight: 1.3,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        {rec.path.title}
                                                    </h4>
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: 500,
                                                        color: difficultyInfo.color,
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        background: `${difficultyInfo.color}12`,
                                                        display: 'inline-block',
                                                        marginTop: '4px',
                                                    }}>
                                                        {difficultyInfo.label}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Reason Badge */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 10px',
                                                borderRadius: '8px',
                                                background: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.06)',
                                            }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    {rec.reason.includes('Includes') ? (
                                                        <>
                                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                            <polyline points="22 4 12 14.01 9 11.01" />
                                                        </>
                                                    ) : rec.reason.includes('started') ? (
                                                        <>
                                                            <circle cx="12" cy="12" r="10" />
                                                            <path d="M8 12l2 2 4-4" />
                                                        </>
                                                    ) : (
                                                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                                    )}
                                                </svg>
                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: 500,
                                                    color: '#8b5cf6',
                                                }}>
                                                    {rec.reason}
                                                </span>
                                            </div>

                                            {/* Quick Stats */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                marginTop: '10px',
                                                paddingTop: '10px',
                                                borderTop: `1px solid ${colors.border}`,
                                            }}>
                                                <span style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '11px',
                                                    color: colors.textMuted,
                                                }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                                        <path d="M3 9h18M9 21V9" />
                                                    </svg>
                                                    {rec.path.courses.length} courses
                                                </span>
                                                <span style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '11px',
                                                    color: colors.textMuted,
                                                }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <polyline points="12 6 12 12 16 14" />
                                                    </svg>
                                                    {formatEstimatedTime(rec.path.estimated_hours)}
                                                </span>
                                                {rec.path.enrolled_count > 0 && (
                                                    <span style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '11px',
                                                        color: colors.textMuted,
                                                    }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                            <circle cx="9" cy="7" r="4" />
                                                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                        </svg>
                                                        {rec.path.enrolled_count}
                                                    </span>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search and Filter */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '24px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                }}
            >
                {/* Search with Suggestions */}
                <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    style={{ flex: 1, minWidth: '220px', position: 'relative' }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search learning paths..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowSuggestions(true);
                            setSelectedSuggestionIndex(-1);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onKeyDown={handleSearchKeyDown}
                        style={{
                            width: '100%',
                            padding: '12px 70px 12px 42px',
                            borderRadius: '12px',
                            border: `1px solid ${colors.border}`,
                            background: colors.cardBg,
                            color: colors.textPrimary,
                            fontSize: '13px',
                            fontWeight: 400,
                            outline: 'none',
                            transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                        }}
                    />
                    {/* Keyboard hint */}
                    {!searchQuery && (
                        <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px', pointerEvents: 'none' }}>
                            <span style={{ fontSize: '10px', color: colors.textMuted, padding: '2px 6px', borderRadius: '4px', background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', fontFamily: 'monospace' }}>/</span>
                        </div>
                    )}
                    {/* Clear button */}
                    {searchQuery && !isSearching && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}
                            style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '6px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </motion.button>
                    )}
                    {/* Loading Spinner */}
                    <AnimatePresence>
                        {isSearching && (
                            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                                <motion.svg width="16" height="16" viewBox="0 0 16 16" fill="none" animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}>
                                    <circle cx="8" cy="8" r="6" stroke={isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'} strokeWidth="2" fill="none" />
                                    <circle cx="8" cy="8" r="6" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeDasharray="28" strokeDashoffset="21" fill="none" />
                                </motion.svg>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    {/* Search Suggestions Dropdown */}
                    <AnimatePresence>
                        {showSuggestions && searchSuggestions.length > 0 && searchQuery && (
                            <motion.div
                                ref={suggestionsRef}
                                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                                transition={{ duration: 0.15 }}
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    marginTop: '6px',
                                    background: colors.cardBg,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '10px',
                                    boxShadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.12)',
                                    zIndex: 100,
                                    overflow: 'hidden',
                                }}
                            >
                                <div style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Suggestions</span>
                                    <span style={{ fontSize: '9px', color: colors.textMuted }}>↑↓ navigate • Enter select</span>
                                </div>
                                {searchSuggestions.map((path, index) => (
                                    <motion.div
                                        key={path.id}
                                        onClick={() => {
                                            setSearchQuery(path.title);
                                            setShowSuggestions(false);
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            background: selectedSuggestionIndex === index ? (isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)') : 'transparent',
                                            borderLeft: selectedSuggestionIndex === index ? `2px solid ${colors.accent}` : '2px solid transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                        }}
                                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                                    >
                                        <div style={{ 
                                            width: '32px', 
                                            height: '32px', 
                                            borderRadius: '8px', 
                                            background: `${path.color}15`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0 
                                        }}>
                                            <PathIcon icon={path.icon} color={path.color} size={18} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '12px', fontWeight: 500, color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{path.title}</div>
                                            <div style={{ fontSize: '10px', color: colors.textMuted }}>{path.courses.length} courses • {path.difficulty}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Filter Tabs - Minimalistic with Icons */}
                <FilterTabs 
                    activeFilter={activeFilter} 
                    setActiveFilter={setActiveFilter} 
                    isDarkMode={isDarkMode}
                    colors={colors}
                />

                {/* Show Recommendations Button - appears when hidden and there are 2+ paths */}
                <AnimatePresence>
                    {!showRecommendations && recommendations.length > 0 && paths.length >= 2 && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8, width: 0 }}
                            animate={{ opacity: 1, scale: 1, width: 'auto' }}
                            exit={{ opacity: 0, scale: 0.8, width: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            onClick={() => setShowRecommendations(true)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                borderRadius: '10px',
                                border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.25)' : 'rgba(139, 92, 246, 0.2)'}`,
                                background: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.06)',
                                color: '#8b5cf6',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                            }}
                            title="Show path recommendations"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                            <span>Recommendations</span>
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Sort Dropdown */}
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    style={{ position: 'relative' }}
                    layout
                >
                    <motion.button
                        layout
                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        animate={{
                            borderColor: showSortDropdown ? colors.accent : colors.border,
                            backgroundColor: showSortDropdown 
                                ? (isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)')
                                : colors.cardBg,
                            color: showSortDropdown ? colors.accent : colors.textSecondary,
                        }}
                        transition={{ 
                            layout: { type: 'spring', stiffness: 500, damping: 30 },
                            default: { duration: 0.2 }
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: '1px solid',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}
                    >
                        {/* Sort Icon */}
                        <motion.svg 
                            layout
                            width="14" 
                            height="14" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <path d="M3 6h18M6 12h12M9 18h6" />
                        </motion.svg>
                        <motion.span
                            layout
                            key={sortBy}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.15 }}
                            style={{ minWidth: '55px', textAlign: 'left' }}
                        >
                            {sortBy === 'name' ? 'Name' : sortBy === 'progress' ? 'Progress' : 'Difficulty'}
                        </motion.span>
                        {/* Arrow Icon */}
                        <motion.svg 
                            layout
                            width="12" 
                            height="12" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                            animate={{ rotate: showSortDropdown ? 180 : 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                            <path d="M6 9l6 6 6-6" />
                        </motion.svg>
                    </motion.button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {showSortDropdown && (
                            <>
                                {/* Backdrop to close dropdown */}
                                <div
                                    onClick={() => setShowSortDropdown(false)}
                                    style={{
                                        position: 'fixed',
                                        inset: 0,
                                        zIndex: 99,
                                    }}
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 6px)',
                                        right: 0,
                                        minWidth: '160px',
                                        background: isDarkMode ? '#1e293b' : '#ffffff',
                                        borderRadius: '12px',
                                        border: `1px solid ${colors.border}`,
                                        boxShadow: isDarkMode 
                                            ? '0 8px 24px rgba(0, 0, 0, 0.4)' 
                                            : '0 8px 24px rgba(0, 0, 0, 0.12)',
                                        padding: '6px',
                                        zIndex: 100,
                                        overflow: 'hidden',
                                    }}
                                >
                                    {/* Sort Options */}
                                    {[
                                        { id: 'name', label: 'Name', icon: (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 6h16M4 12h10M4 18h4" />
                                            </svg>
                                        )},
                                        { id: 'progress', label: 'Progress', icon: (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                            </svg>
                                        )},
                                        { id: 'difficulty', label: 'Difficulty', icon: (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                            </svg>
                                        )},
                                    ].map((option) => (
                                        <motion.button
                                            key={option.id}
                                            onClick={() => {
                                                if (sortBy === option.id) {
                                                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                } else {
                                                    setSortBy(option.id as 'name' | 'progress' | 'difficulty');
                                                    setSortOrder('asc');
                                                }
                                                setShowSortDropdown(false);
                                            }}
                                            whileHover={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                width: '100%',
                                                padding: '10px 12px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: sortBy === option.id 
                                                    ? (isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)')
                                                    : 'transparent',
                                                color: sortBy === option.id ? colors.accent : colors.textPrimary,
                                                fontSize: '13px',
                                                fontWeight: sortBy === option.id ? 500 : 400,
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                            }}
                                        >
                                            <span style={{ color: sortBy === option.id ? colors.accent : colors.textSecondary }}>
                                                {option.icon}
                                            </span>
                                            <span style={{ flex: 1 }}>{option.label}</span>
                                            {sortBy === option.id && (
                                                <motion.svg
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke={colors.accent}
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    {sortOrder === 'asc' ? (
                                                        <path d="M12 19V5M5 12l7-7 7 7" />
                                                    ) : (
                                                        <path d="M12 5v14M5 12l7 7 7-7" />
                                                    )}
                                                </motion.svg>
                                            )}
                                        </motion.button>
                                    ))}

                                    {/* Divider */}
                                    <div style={{
                                        height: '1px',
                                        background: colors.border,
                                        margin: '6px 0',
                                    }} />

                                    {/* Order Toggle */}
                                    <motion.button
                                        onClick={() => {
                                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                            setShowSortDropdown(false);
                                        }}
                                        whileHover={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: 'transparent',
                                            color: colors.textSecondary,
                                            fontSize: '13px',
                                            fontWeight: 400,
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
                                        </svg>
                                        <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                                    </motion.button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>


            {/* Paths Grid */}
            <LayoutGroup>
                <motion.div
                    layout
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '16px',
                    }}
                >
                    <AnimatePresence mode="popLayout">
                        {isLoading || isSearching ? (
                            // Loading/Search skeletons
                            [...Array(isSearching ? 3 : 4)].map((_, i) => (
                                <motion.div
                                    key={`skeleton-${i}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ delay: i * 0.05, duration: 0.3 }}
                                    style={{
                                        padding: '20px',
                                        borderRadius: '16px',
                                        background: colors.cardBg,
                                        border: `1px solid ${colors.border}`,
                                        overflow: 'hidden',
                                        position: 'relative',
                                    }}
                                >
                                    {/* Shimmer effect overlay */}
                                    <motion.div
                                        animate={{
                                            x: ['-100%', '100%'],
                                        }}
                                        transition={{
                                            duration: 1.2,
                                            repeat: Infinity,
                                            ease: 'linear',
                                            delay: i * 0.1,
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: `linear-gradient(90deg, transparent 0%, ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)'} 50%, transparent 100%)`,
                                            pointerEvents: 'none',
                                        }}
                                    />
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                        <motion.div 
                                            animate={{ opacity: [0.5, 0.8, 0.5] }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                            style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '12px',
                                                background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                            }} 
                                        />
                                        <div style={{ flex: 1 }}>
                                            <motion.div 
                                                animate={{ opacity: [0.5, 0.8, 0.5] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                                                style={{
                                                    height: '16px',
                                                    width: '70%',
                                                    borderRadius: '4px',
                                                    background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                                    marginBottom: '8px',
                                                }} 
                                            />
                                            <motion.div 
                                                animate={{ opacity: [0.5, 0.8, 0.5] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                                                style={{
                                                    height: '12px',
                                                    width: '50%',
                                                    borderRadius: '4px',
                                                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                                }} 
                                            />
                                        </div>
                                    </div>
                                    {/* Additional skeleton rows for search */}
                                    <motion.div 
                                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                                        style={{
                                            height: '10px',
                                            width: '90%',
                                            borderRadius: '3px',
                                            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                            marginBottom: '8px',
                                        }} 
                                    />
                                    <motion.div 
                                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                                        style={{
                                            height: '10px',
                                            width: '60%',
                                            borderRadius: '3px',
                                            background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                                        }} 
                                    />
                                </motion.div>
                            ))
                        ) : filteredPaths.length === 0 ? (
                            // Empty state
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{
                                    gridColumn: '1 / -1',
                                    padding: '48px 24px',
                                    textAlign: 'center',
                                }}
                            >
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    margin: '0 auto 16px',
                                    borderRadius: '16px',
                                    background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="1.5">
                                        <path d="M3 3v18h18" />
                                        <path d="m19 9-5 5-4-4-3 3" />
                                    </svg>
                                </div>
                                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: colors.textPrimary }}>
                                    No paths found
                                </p>
                                <p style={{ margin: '8px 0 0', fontSize: '13px', color: colors.textMuted }}>
                                    {searchQuery ? 'Try a different search term' : 'Check back later for new paths'}
                                </p>
                            </motion.div>
                        ) : (
                            // Path cards
                            filteredPaths.map((path, index) => {
                                const difficultyInfo = getDifficultyInfo(path.difficulty);
                                const progress = path.progress?.progress_percentage || 0;
                                const isEnrolled = !!path.progress;

                                return (
                                    <motion.div
                                        key={path.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ 
                                            delay: index * 0.05,
                                            type: 'spring',
                                            stiffness: 400,
                                            damping: 25,
                                        }}
                                        whileHover={{ 
                                            y: -6,
                                            transition: { 
                                                type: 'spring', 
                                                stiffness: 400, 
                                                damping: 20,
                                                mass: 0.8,
                                            }
                                        }}
                                        className="path-card"
                                        style={{
                                            padding: '20px',
                                            borderRadius: '16px',
                                            background: colors.cardBg,
                                            border: `1px solid ${isEnrolled ? `${path.color}30` : colors.border}`,
                                            cursor: 'pointer',
                                            boxShadow: isDarkMode 
                                                ? '0 2px 8px rgba(0,0,0,0.2)' 
                                                : '0 2px 8px rgba(0,0,0,0.04)',
                                        }}
                                        onClick={() => handlePathClick(path)}
                                    >
                                        {/* Header */}
                                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                            <motion.div
                                                className="path-icon-container"
                                                whileHover={{ scale: 1.08 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '12px',
                                                    background: `${path.color}15`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <PathIcon icon={path.icon} color={path.color} size={24} />
                                            </motion.div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h3 style={{
                                                    margin: 0,
                                                    fontSize: '15px',
                                                    fontWeight: 600,
                                                    color: colors.textPrimary,
                                                    lineHeight: 1.3,
                                                }}>
                                                    {path.title}
                                                </h3>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '8px', 
                                                    marginTop: '4px',
                                                    flexWrap: 'wrap',
                                                }}>
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: 600,
                                                        color: difficultyInfo.color,
                                                        padding: '3px 8px',
                                                        borderRadius: '4px',
                                                        background: `${difficultyInfo.color}15`,
                                                    }}>
                                                        {difficultyInfo.label}
                                                    </span>
                                                    <span style={{ 
                                                        fontSize: '11px', 
                                                        color: colors.textMuted,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                    }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <polyline points="12 6 12 12 16 14" />
                                                        </svg>
                                                        {formatEstimatedTime(getPathEstimatedHours(path))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p style={{
                                            margin: '0 0 14px',
                                            fontSize: '13px',
                                            color: colors.textSecondary,
                                            lineHeight: 1.5,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}>
                                            {path.description}
                                        </p>

                                        {/* Quick Stats Row */}
                                        <motion.div 
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 + 0.1, duration: 0.3 }}
                                            style={{
                                                display: 'flex',
                                                gap: '8px',
                                                marginBottom: '14px',
                                                padding: '12px',
                                                borderRadius: '10px',
                                                background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                            }}
                                        >
                                            <div style={{ flex: 1, textAlign: 'center' }}>
                                                <div style={{ 
                                                    fontSize: '18px', 
                                                    fontWeight: 700, 
                                                    color: path.color,
                                                    lineHeight: 1,
                                                }}>
                                                    {path.courses.length}
                                                </div>
                                                <div style={{ fontSize: '9px', color: colors.textMuted, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Courses
                                                </div>
                                            </div>
                                            <div style={{ width: '1px', background: colors.border, margin: '4px 0' }} />
                                            <div style={{ flex: 1, textAlign: 'center' }}>
                                                <div style={{ 
                                                    fontSize: '18px', 
                                                    fontWeight: 700, 
                                                    color: path.color,
                                                    lineHeight: 1,
                                                }}>
                                                    {getPathTotalModules(path)}
                                                </div>
                                                <div style={{ fontSize: '9px', color: colors.textMuted, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Modules
                                                </div>
                                            </div>
                                            <div style={{ width: '1px', background: colors.border, margin: '4px 0' }} />
                                            <div style={{ flex: 1, textAlign: 'center' }}>
                                                <div style={{ 
                                                    fontSize: '18px', 
                                                    fontWeight: 700, 
                                                    color: '#10b981',
                                                    lineHeight: 1,
                                                }}>
                                                    {path.enrolled_count}
                                                </div>
                                                <div style={{ fontSize: '9px', color: colors.textMuted, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Enrolled
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Courses included */}
                                        <div style={{
                                            marginBottom: '16px',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                        }}>
                                            <div style={{ 
                                                fontSize: '10px', 
                                                fontWeight: 600, 
                                                color: colors.textPrimary, 
                                                marginBottom: '8px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                            }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                </svg>
                                                Courses Included
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {getPathCourses(path).slice(0, 4).map((course) => (
                                                    <motion.div
                                                        key={course.id}
                                                        className="course-chip"
                                                        whileHover={{ scale: 1.02 }}
                                                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '5px 10px',
                                                            borderRadius: '6px',
                                                            background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                                            fontSize: '11px',
                                                            color: colors.textPrimary,
                                                        }}
                                                    >
                                                        <img 
                                                            src={course.image} 
                                                            alt="" 
                                                            style={{ 
                                                                width: '20px', 
                                                                height: '20px', 
                                                                borderRadius: '4px',
                                                                objectFit: 'cover',
                                                            }} 
                                                        />
                                                        <span style={{ fontWeight: 500 }}>{course.shortTitle}</span>
                                                        <span style={{ 
                                                            fontSize: '9px', 
                                                            color: colors.textMuted,
                                                            padding: '1px 4px',
                                                            borderRadius: '3px',
                                                            background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                                        }}>
                                                            {course.modules}m
                                                        </span>
                                                    </motion.div>
                                                ))}
                                                {path.courses.length > 4 && (
                                                    <motion.div 
                                                        className="course-chip"
                                                        whileHover={{ scale: 1.05 }}
                                                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                                        style={{
                                                            padding: '5px 10px',
                                                            borderRadius: '6px',
                                                            background: `${path.color}15`,
                                                            fontSize: '11px',
                                                            fontWeight: 500,
                                                            color: path.color,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                        }}
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <path d="M12 8v8M8 12h8" />
                                                        </svg>
                                                        {path.courses.length - 4} more
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress Visualization or Enroll */}
                                        {isEnrolled ? (
                                            <div>
                                                {/* Progress Header with Circular Ring */}
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '14px',
                                                    marginBottom: '12px',
                                                }}>
                                                    {/* Circular Progress Ring with Hover Tooltip */}
                                                    <ProgressRingWithTooltip
                                                        progress={progress}
                                                        pathColor={path.color}
                                                        isDarkMode={isDarkMode}
                                                        index={index}
                                                    />

                                                    {/* Progress Info */}
                                                    <div 
                                                        style={{ flex: 1 }}
                                                        title={`Progress: ${progress}% - ${path.completed_courses_count} of ${path.total_courses} courses completed`}
                                                    >
                                                        <div style={{ 
                                                            fontSize: '13px', 
                                                            fontWeight: 600, 
                                                            color: colors.textPrimary,
                                                            marginBottom: '4px',
                                                        }}>
                                                            {progress === 100 ? 'Completed!' : progress === 0 ? 'Not Started' : 'In Progress'}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: colors.textPrimary, fontWeight: 500 }}>
                                                            {path.completed_courses_count} of {path.total_courses} courses done
                                                        </div>
                                                    </div>

                                                    {/* Status Icon / Certificate Badge */}
                                                    {progress === 100 ? (
                                                        <motion.div
                                                            initial={{ scale: 0, rotate: -180 }}
                                                            animate={{ scale: 1, rotate: 0 }}
                                                            transition={{ delay: index * 0.05 + 0.4, type: 'spring', stiffness: 300 }}
                                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                                            style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                borderRadius: '10px',
                                                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                                                                cursor: 'pointer',
                                                            }}
                                                            title="Certificate Earned! Click to view"
                                                        >
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="8" r="6" />
                                                                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                                                            </svg>
                                                        </motion.div>
                                                    ) : (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ delay: index * 0.05 + 0.4, type: 'spring', stiffness: 400 }}
                                                        style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            borderRadius: '8px',
                                                            background: progress > 0 
                                                                    ? `${path.color}15` 
                                                                    : isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        {progress > 0 ? (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={path.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <polyline points="12 6 12 12 16 14" />
                                                            </svg>
                                                        ) : (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <path d="M12 8v4M12 16h.01" />
                                                            </svg>
                                                        )}
                                                    </motion.div>
                                                    )}
                                                </div>

                                                {/* Estimated Time Remaining */}
                                                {progress < 100 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 + 0.25, duration: 0.3 }}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            padding: '8px 12px',
                                                            borderRadius: '8px',
                                                            background: isDarkMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)',
                                                            border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'}`,
                                                            marginBottom: '12px',
                                                        }}
                                                    >
                                                        {/* Clock Icon */}
                                                        <motion.div
                                                            animate={{ rotate: [0, 10, -10, 0] }}
                                                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                                            style={{
                                                                width: '28px',
                                                                height: '28px',
                                                                borderRadius: '8px',
                                                                background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <polyline points="12 6 12 12 16 14" />
                                                            </svg>
                                                        </motion.div>
                                                        
                                                        {/* Time Info */}
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ 
                                                                fontSize: '10px', 
                                                                color: colors.textMuted, 
                                                                marginBottom: '2px',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.3px',
                                                            }}>
                                                                Est. Time Remaining
                                                            </div>
                                                            <motion.div 
                                                                key={progress}
                                                                initial={{ opacity: 0, y: 5 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                style={{ 
                                                                    fontSize: '14px', 
                                                                    fontWeight: 600, 
                                                                    color: '#3b82f6',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                }}
                                                            >
                                                                {formatEstimatedTime(Math.round(getPathEstimatedHours(path) * (1 - progress / 100)))}
                                                                <span style={{ 
                                                                    fontSize: '10px', 
                                                                    fontWeight: 400, 
                                                                    color: colors.textMuted,
                                                                }}>
                                                                    ({path.total_courses - path.completed_courses_count} courses left)
                                                                </span>
                                                            </motion.div>
                                                        </div>

                                                        {/* Progress Mini Bar */}
                                                        <div style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            position: 'relative',
                                                        }}>
                                                            <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
                                                                <circle
                                                                    cx="20"
                                                                    cy="20"
                                                                    r="16"
                                                                    fill="none"
                                                                    stroke={isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'}
                                                                    strokeWidth="3"
                                                                />
                                                                <motion.circle
                                                                    cx="20"
                                                                    cy="20"
                                                                    r="16"
                                                                    fill="none"
                                                                    stroke="#3b82f6"
                                                                    strokeWidth="3"
                                                                    strokeLinecap="round"
                                                                    strokeDasharray={2 * Math.PI * 16}
                                                                    initial={{ strokeDashoffset: 2 * Math.PI * 16 }}
                                                                    animate={{ strokeDashoffset: 2 * Math.PI * 16 * (1 - progress / 100) }}
                                                                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                                                />
                                                            </svg>
                                                            <div style={{
                                                                position: 'absolute',
                                                                top: '50%',
                                                                left: '50%',
                                                                transform: 'translate(-50%, -50%)',
                                                                fontSize: '9px',
                                                                fontWeight: 700,
                                                                color: '#3b82f6',
                                                            }}>
                                                                {progress}%
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}

                                                {/* Course Milestone Tracker */}
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 + 0.3, duration: 0.4 }}
                                                    style={{
                                                        padding: '10px',
                                                        borderRadius: '10px',
                                                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                                    }}
                                                >
                                                    <div 
                                                        style={{ 
                                                            fontSize: '10px', 
                                                            fontWeight: 600, 
                                                            color: colors.textPrimary, 
                                                            marginBottom: '10px',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.5px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                        }}
                                                        title="Track your progress through each course in this learning path"
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                            <path d="m9 11 3 3L22 4" />
                                                        </svg>
                                                        Course Progress
                                                    </div>
                                                    
                                                    {/* Milestone dots */}
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        position: 'relative',
                                                    }}>
                                                        {getPathCourses(path).map((course, courseIndex) => {
                                                            const isCompleted = path.progress?.completed_courses?.includes(course.id) || false;
                                                            const isCurrent = path.progress?.current_course_id === course.id;
                                                            
                                                            return (
                                                                <React.Fragment key={course.id}>
                                                                    <motion.div
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        transition={{ delay: index * 0.05 + 0.4 + courseIndex * 0.05, type: 'spring', stiffness: 400 }}
                                                                        title={`${course.shortTitle}: ${isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Not Started'}`}
                                                                        style={{
                                                                            width: isCurrent ? '24px' : '18px',
                                                                            height: isCurrent ? '24px' : '18px',
                                                                            borderRadius: '50%',
                                                                            background: isCompleted 
                                                                                ? '#10b981' 
                                                                                : isCurrent 
                                                                                    ? path.color 
                                                                                    : isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            flexShrink: 0,
                                                                            border: isCurrent ? `2px solid ${path.color}40` : 'none',
                                                                            boxShadow: isCurrent ? `0 0 0 3px ${path.color}20` : 'none',
                                                                        }}
                                                                    >
                                                                        {isCompleted ? (
                                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                                <polyline points="20 6 9 17 4 12" />
                                                                            </svg>
                                                                        ) : isCurrent ? (
                                                                            <motion.div
                                                                                animate={{ scale: [1, 1.2, 1] }}
                                                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                                                style={{
                                                                                    width: '6px',
                                                                                    height: '6px',
                                                                                    borderRadius: '50%',
                                                                                    background: 'white',
                                                                                }}
                                                                            />
                                                                        ) : null}
                                                                    </motion.div>
                                                                    {/* Connector line */}
                                                                    {courseIndex < path.courses.length - 1 && (
                                                                        <div style={{
                                                                            flex: 1,
                                                                            height: '2px',
                                                                            background: isCompleted 
                                                                                ? '#10b981' 
                                                                                : isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                                                            minWidth: '8px',
                                                                        }} />
                                                                    )}
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            </div>
                                        ) : (
                                            <motion.button
                                                className="enroll-btn"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                transition={{ 
                                                    type: 'tween',
                                                    duration: 0.15,
                                                    ease: [0.4, 0, 0.2, 1],
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEnroll(path.id);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    borderRadius: '10px',
                                                    border: 'none',
                                                    background: `linear-gradient(135deg, ${path.color} 0%, ${path.color}cc 100%)`,
                                                    color: '#ffffff',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                }}
                                            >
                                                <svg 
                                                    width="16" 
                                                    height="16" 
                                                    viewBox="0 0 24 24" 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    strokeWidth="2.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M5 12h14" />
                                                    <path d="m12 5 7 7-7 7" />
                                                </svg>
                                                Start Learning
                                            </motion.button>
                                        )}
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </motion.div>
            </LayoutGroup>

            {/* Pulse animation keyframes + Path card hover styles */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .path-card {
                    transition: box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1), 
                                border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .path-card:hover {
                    box-shadow: ${isDarkMode 
                        ? '0 12px 32px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.2)' 
                        : '0 12px 32px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)'} !important;
                    border-color: ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} !important;
                }
                
                .path-icon-container {
                    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                                background 0.2s ease;
                }
                
                .path-card:hover .path-icon-container {
                    background: ${isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'};
                }
                
                .path-card:hover .course-chip {
                    transform: translateY(-1px);
                }
                
                .course-chip {
                    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                                background 0.15s ease;
                }
                
                .course-chip:hover {
                    background: ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'} !important;
                }
                
                .enroll-btn {
                    transition: box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1),
                                filter 0.15s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .enroll-btn:hover {
                    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.35);
                    filter: brightness(1.08);
                }
                
                .enroll-btn:active {
                    filter: brightness(0.95);
                }
                
                .stat-card {
                    transition: box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                                border-color 0.2s ease,
                                transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .stat-card:hover {
                    box-shadow: ${isDarkMode 
                        ? '0 8px 24px rgba(0,0,0,0.3)' 
                        : '0 8px 24px rgba(0,0,0,0.08)'} !important;
                    border-color: ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} !important;
                }
                
                @media (max-width: 768px) {
                    .stat-card {
                        padding: 12px 14px !important;
                    }
                }
            `}</style>

            {/* Path Detail Modal */}
            <PathDetailModal
                path={selectedPath}
                isOpen={!!selectedPath}
                onClose={() => setSelectedPath(null)}
                isDarkMode={isDarkMode}
                courseProgress={courseProgress}
                onContinueLearning={handleContinueLearning}
                onViewCertificate={(path) => {
                    setSelectedPath(null);
                    setCertificatePath(path);
                }}
            />

            {/* Path Certificate Modal */}
            <PathCertificateModal
                path={certificatePath}
                isOpen={!!certificatePath}
                onClose={() => setCertificatePath(null)}
                isDarkMode={isDarkMode}
                completedAt={certificatePath?.progress?.completed_at || undefined}
            />
        </div>
    );
};

export default PathsContent;
