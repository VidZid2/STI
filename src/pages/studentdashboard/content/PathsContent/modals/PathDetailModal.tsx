/**
 * PathDetailModal
 * Detailed path overview modal with enrollment and progress.
 * Extracted from PathsContent.tsx during Phase 8.6
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import {
    getPathCourses,
    getPathTotalModules,
    getPathEstimatedHours,
    formatEstimatedTime,
    getCurrentCourse,
    type PathWithProgress,
} from '../../../../../services/pathsService';
import { PathIcon } from '../components/PathIcon';
import { ModalTooltip } from '../components/PathProgressRing';
import { AnimatedCircularProgressBar } from '../../../../../components/ui/animated-circular-progress-bar';

// Path Detail Modal Component
interface PathDetailModalProps {
    path: PathWithProgress | null;
    isOpen: boolean;
    onClose: () => void;
    courseProgress: Record<string, { progress: number }>;
    onContinueLearning: (courseId: string) => void;
    onViewCertificate?: (path: PathWithProgress) => void;
}

const PathDetailModal: React.FC<PathDetailModalProps> = ({
    path,
    isOpen,
    onClose,
    courseProgress,
    onContinueLearning,
    onViewCertificate,
}) => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    
    // Auto-minimizing footer/header state
    const [isMinimized, setIsMinimized] = useState(false);
    const lastScrollY = useRef(0);
    const scrollDirection = useRef<'up' | 'down' | null>(null);
    const anchorScrollY = useRef(0);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const currentScrollY = e.currentTarget.scrollTop;
        
        // Handle iOS rubber banding / top of scroll
        if (currentScrollY <= 10) {
            setIsMinimized(false);
            lastScrollY.current = currentScrollY;
            scrollDirection.current = null;
            anchorScrollY.current = currentScrollY;
            return;
        }

        const delta = currentScrollY - lastScrollY.current;
        
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
            // Do not expand just by scrolling up. Only expand at the very top.
        }

        lastScrollY.current = currentScrollY;
    }, []);

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
                        className="p-2 sm:p-5"
                        style={{
                            position: 'fixed',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                            pointerEvents: 'none',
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            style={{
                                width: '100%',
                                maxWidth: '768px',
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
                            <motion.div 
                                animate={{
                                    padding: isMinimized ? '12px 16px' : '24px 24px 20px 24px'
                                }}
                                className="relative border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-t-[20px]"
                            >
                                {/* Student Tools Style Header Card */}
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
                                    className={`relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[20px] sm:rounded-[24px] flex items-center group transition-all duration-300 hover:shadow-md hover:border-slate-300/80 dark:hover:border-slate-700/50 text-left ${isMinimized ? 'p-[12px_16px] gap-[12px] mb-0' : 'p-[16px] sm:p-[20px] gap-[14px] sm:gap-[24px] mb-[16px] sm:mb-[20px]'}`}
                                >
                                    {/* SaaS Background Accents */}
                                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" style={{ backgroundColor: `${path.color}15` }} aria-hidden="true" />
                                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" style={{ backgroundColor: `${path.color}10` }} aria-hidden="true" />

                                    <ModalTooltip text={path.title} position="right">
                                        <motion.div
                                            whileHover={{ scale: 1.05, rotate: -5 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                            className={`flex items-center justify-center flex-shrink-0 shadow-sm relative z-10 transition-all duration-300 ${isMinimized ? 'w-[40px] h-[40px] rounded-[12px]' : 'w-[48px] h-[48px] sm:w-[64px] sm:h-[64px] rounded-[14px] sm:rounded-[20px]'}`}
                                            style={{
                                                background: `linear-gradient(135deg, ${path.color}20 0%, ${path.color}10 100%)`,
                                                border: `1px solid ${path.color}30`,
                                                color: path.color
                                            }}
                                        >
                                            <div className="sm:hidden flex items-center justify-center"><PathIcon icon={path.icon} color={path.color} size={isMinimized ? 20 : 24} /></div>
                                            <div className="hidden sm:flex items-center justify-center"><PathIcon icon={path.icon} color={path.color} size={isMinimized ? 24 : 32} /></div>
                                        </motion.div>
                                    </ModalTooltip>

                                    <div className="relative z-10 flex-1 min-w-0 pr-2 sm:pr-4">
                                        <h2 
                                            className={`font-bold text-zinc-900 dark:text-zinc-100 tracking-tight m-0 mb-0.5 sm:mb-1 truncate transition-all duration-300 ${isMinimized ? 'text-[16px]' : 'text-[18px] sm:text-[24px]'}`}
                                        >
                                            {path.title}
                                        </h2>
                                        <div 
                                            className={`flex flex-wrap items-center overflow-hidden transition-all duration-300 ${isMinimized ? 'mt-[2px] gap-[6px] max-h-[24px]' : 'mt-[2px] sm:mt-[4px] gap-[6px] sm:gap-[8px] max-h-[28px]'}`}
                                        >
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-[11px] sm:text-[12px] font-medium whitespace-nowrap">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                </svg>
                                                {totalCourses} courses
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-[11px] sm:text-[12px] font-medium whitespace-nowrap">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="3" width="7" height="7" rx="1" />
                                                    <rect x="14" y="3" width="7" height="7" rx="1" />
                                                    <rect x="14" y="14" width="7" height="7" rx="1" />
                                                    <rect x="3" y="14" width="7" height="7" rx="1" />
                                                </svg>
                                                {totalModules} modules
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-[11px] sm:text-[12px] font-medium whitespace-nowrap">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                                {formatEstimatedTime(estimatedHours)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative z-20 self-start sm:self-center">
                                        <ModalTooltip text="Close (Esc)" position="left">
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
                                        </ModalTooltip>
                                    </div>
                                </motion.div>

                            </motion.div>

                        {/* Progress Bar */}
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60">
                            <div className="flex items-center justify-between mb-3 px-0.5">
                                <span className="text-[13px] sm:text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight">
                                    Overall Progress
                                </span>
                                <span className="text-[13px] sm:text-sm font-bold" style={{ color: pathProgress === 100 ? '#10b981' : path.color }}>
                                    {pathProgress}%
                                </span>
                            </div>
                            <div className="w-full h-3 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.15)] border border-black/5 dark:border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pathProgress}%` }}
                                    transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                    className="h-full rounded-full relative"
                                    style={{
                                        background: pathProgress === 100 ? 'linear-gradient(to right, #10b981, #34d399)' : `linear-gradient(to right, ${path.color}, ${path.color}dd)`,
                                    }}
                                />
                            </div>
                        </div>

                            {/* Course List Header */}
                            <div className="flex items-center justify-between px-6 pt-5 pb-3">
                                <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    Courses
                                </span>
                                <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500">
                                    {courses.length} total
                                </span>
                            </div>

                            <div 
                                onScroll={handleScroll}
                                className="px-2 sm:px-5 pb-4"
                                style={{
                                flex: 1,
                                overflowY: 'auto',
                                overflowX: 'hidden',
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px' }}>
                                    {courses.map((course: any, index: number) => {
                                        const progress = courseProgress[course.id]?.progress || 0;
                                        const isCompleted = progress === 100;
                                        const isUnlocked = true; // All courses temporarily unlocked
                                        const isLocked = !isUnlocked;
                                        const isCurrent = course.id === currentCourse?.id && !isCompleted && isUnlocked;

                                        return (
                                            <motion.div
                                                key={course.id}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: isLocked ? 0.6 : 1, x: 0 }}
                                                transition={{ 
                                                    delay: index * 0.04 + 0.1,
                                                    scale: { type: 'spring', stiffness: 400, damping: 25 },
                                                    y: { type: 'spring', stiffness: 400, damping: 25 },
                                                    layout: { type: 'spring', stiffness: 400, damping: 30 },
                                                }}
                                                className={`p-3 sm:p-4 mb-3 relative bg-white dark:bg-slate-800 rounded-[16px] sm:rounded-[20px] border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all duration-300 group/course flex flex-row items-center justify-between gap-3 sm:gap-5 ${isLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700'}`}
                                                style={isCurrent ? { backgroundColor: isDarkMode ? `${path.color}10` : `${path.color}05` } : {}}
                                            >
                                                {/* Left Section: Icon + Text */}
                                                <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
                                                    {/* Status Icon Wrapper */}
                                                    <div className="relative shrink-0 w-[50px] h-[50px] sm:w-[64px] sm:h-[64px] flex items-center justify-center">
                                                        <AnimatedCircularProgressBar
                                                            max={100}
                                                            min={0}
                                                            value={progress}
                                                            gaugePrimaryColor={isLocked ? (isDarkMode ? '#6b7280' : '#9ca3af') : isCompleted ? '#10b981' : isCurrent ? path.color : (isDarkMode ? '#60a5fa' : '#3b82f6')}
                                                            gaugeSecondaryColor={isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                                                            className="absolute inset-0 w-full h-full"
                                                            hideText
                                                        />
                                                        
                                                        {/* Inner SVG Container */}
                                                        <div 
                                                            className={`relative z-10 w-[34px] h-[34px] sm:w-[44px] sm:h-[44px] rounded-full flex items-center justify-center shadow-sm border transition-transform duration-300 ${!isLocked ? 'group-hover/course:scale-105 group-hover/course:-rotate-3' : ''}`}
                                                            style={{
                                                                backgroundColor: isLocked
                                                                    ? isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc'
                                                                    : isCompleted 
                                                                        ? '#ecfdf5' 
                                                                        : isCurrent 
                                                                            ? `${path.color}15` 
                                                                            : isDarkMode ? 'rgba(255,255,255,0.08)' : '#eff6ff',
                                                                borderColor: isLocked
                                                                    ? isDarkMode ? 'rgba(255,255,255,0.1)' : '#f1f5f9'
                                                                    : isCompleted
                                                                        ? '#d1fae5'
                                                                        : isCurrent
                                                                            ? `${path.color}30`
                                                                            : isDarkMode ? 'rgba(255,255,255,0.1)' : '#dbeafe',
                                                                color: isLocked ? (isDarkMode ? '#9ca3af' : '#64748b') : isCompleted ? '#10b981' : isCurrent ? path.color : (isDarkMode ? '#60a5fa' : '#3b82f6')
                                                            }}
                                                        >
                                                            {isLocked ? (
                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-[14px] sm:w-[18px] sm:h-[18px]">
                                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                                </svg>
                                                            ) : isCompleted ? (
                                                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px] sm:w-[20px] sm:h-[20px]">
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                            ) : isCurrent ? (
                                                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px] sm:w-[20px] sm:h-[20px] ml-0.5">
                                                                    <polygon points="5 3 19 12 5 21 5 3" />
                                                                </svg>
                                                            ) : (
                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-[14px] sm:w-[18px] sm:h-[18px]">
                                                                    <circle cx="12" cy="12" r="10" />
                                                                </svg>
                                                            )}
                                                        </div>

                                                        {/* Percentage Badge */}
                                                        {(!isLocked || progress > 0) && (
                                                            <div className="absolute -bottom-1.5 sm:-bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-full px-1.5 sm:px-2 py-[1px] sm:py-0.5 shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-[8px] sm:text-[10px] font-extrabold text-slate-700 dark:text-slate-200 z-20 whitespace-nowrap flex items-center justify-center leading-none">
                                                                {progress}%
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Course Info */}
                                                    <div className="flex flex-col min-w-0 py-1">
                                                        <div className="flex items-center gap-2.5 mb-1.5">
                                                            <h3 
                                                                className={`text-[15px] sm:text-[16px] font-extrabold truncate tracking-tight ${!isCurrent ? 'text-slate-900 dark:text-slate-100' : ''}`}
                                                                style={{ color: isCurrent ? path.color : undefined }}
                                                            >
                                                                {course.title}
                                                            </h3>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                                            {course.subtitle.split(' • ').map((part: string, i: number) => (
                                                                <span key={i} className="flex items-center whitespace-nowrap px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold text-[9.5px] sm:text-[11px] border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
                                                                    {part.trim()}
                                                                </span>
                                                            ))}
                                                            <span className="flex items-center whitespace-nowrap gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold text-[9.5px] sm:text-[11px] border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                                                                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                                                                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                                                                </svg>
                                                                {course.modules} module{course.modules !== 1 ? 's' : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Section: Progress / Status */}
                                                <div className="flex items-center shrink-0 gap-2 sm:gap-4 w-auto">
                                                    
                                                    
                                                    {isLocked ? (
                                                        <div className="flex items-center justify-center gap-0 sm:gap-1.5 text-[11.5px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 w-[34px] sm:w-auto h-[34px] sm:h-[38px] px-0 sm:px-3 rounded-[10px] sm:rounded-[12px] border border-slate-200/50 dark:border-slate-700/50 shadow-sm shrink-0">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-[12px] sm:h-[12px]">
                                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                            </svg>
                                                            <span className="hidden sm:inline">Locked</span>
                                                        </div>
                                                    ) : (
                                                        <div className="h-[34px] sm:h-[38px] w-auto relative shrink-0">
                                                            <button
                                                                className="w-[34px] sm:w-auto h-full flex items-center justify-center gap-0 sm:gap-2 px-0 sm:px-3 bg-white dark:bg-slate-800 rounded-[10px] sm:rounded-[12px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group/btn"
                                                            >
                                                                <div 
                                                                    className="w-[18px] h-[18px] sm:w-6 sm:h-6 rounded-[5px] sm:rounded-[8px] flex items-center justify-center group-hover/btn:scale-110 transition-transform duration-300 shrink-0"
                                                                    style={{
                                                                        backgroundColor: isCompleted ? '#ecfdf5' : isCurrent ? `${path.color}15` : '#f1f5f9',
                                                                        color: isCompleted ? '#10b981' : isCurrent ? path.color : '#64748b'
                                                                    }}
                                                                >
                                                                    {isCompleted ? (
                                                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                                                                    ) : isCurrent ? (
                                                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                                    ) : (
                                                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                                                    )}
                                                                </div>
                                                                <span className="hidden sm:inline text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight sm:tracking-wider whitespace-nowrap">
                                                                    {isCompleted ? '100% COMPLETE' : isCurrent ? 'IN PROGRESS' : 'START COURSE'}
                                                                </span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>

                        {/* Footer with Continue Button or View Certificate */}
                        <motion.div 
                            animate={{
                                padding: isMinimized ? '12px 16px' : '16px 24px',
                            }}
                            style={{
                                borderTop: `1px solid ${colors.border}`,
                                display: 'flex',
                                flexDirection: 'row',
                                gap: isMinimized ? '8px' : '12px',
                            }}
                        >
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="flex-1 flex items-center justify-center gap-1.5 font-bold py-2.5 px-3 rounded-[14px] transition-colors shadow-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                Close
                            </motion.button>

                            {pathProgress === 100 && onViewCertificate ? (
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onViewCertificate(path)}
                                    className="flex-[2] flex items-center justify-center gap-1.5 font-bold py-2.5 px-3 rounded-[14px] transition-colors shadow-sm focus:outline-none"
                                    style={{
                                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                        color: '#ffffff',
                                    }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="8" r="6" />
                                        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                                    </svg>
                                    View Certificate
                                </motion.button>
                            ) : currentCourse && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onContinueLearning(currentCourse.id)}
                                    className="flex-[2] flex items-center justify-center gap-1.5 font-bold py-2.5 px-3 rounded-[14px] transition-colors shadow-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 focus:outline-none"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                    Continue Learning
                                </motion.button>
                            )}
                        </motion.div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export { PathDetailModal };
