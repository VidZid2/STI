/**
 * PathDetailModal
 * Detailed path overview modal with enrollment and progress.
 * Extracted from PathsContent.tsx during Phase 8.6
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import {
    enrollInPath,
    type PathWithProgress,
} from '../../../../../services/pathsService';
import { PathIcon } from '../components/PathIcon';
import { ProgressRingWithTooltip, ModalTooltip } from '../components/PathProgressRing';

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


export { PathDetailModal };
