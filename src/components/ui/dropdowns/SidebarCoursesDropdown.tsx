import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getTimeLeftForCourse } from '../../../services/studyTimeService';

interface Course {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    progress: number;
}

interface SidebarCoursesDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    courses: Course[];
    onCourseClick?: (courseId: string) => void;
    anchorRef?: React.RefObject<HTMLDivElement | null>;
    currentCourseId?: string | null;
}

// Dark mode color palette
const getColors = (isDark: boolean) => ({
    // Backgrounds
    dropdownBg: isDark ? '#1e293b' : '#ffffff',
    headerBorder: isDark ? 'rgba(71, 85, 105, 0.5)' : '#f4f4f5',
    cardBg: isDark 
        ? 'linear-gradient(135deg, rgba(30, 58, 138, 0.3) 0%, rgba(6, 78, 59, 0.3) 100%)' 
        : 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
    cardBorder: isDark ? 'rgba(59, 130, 246, 0.3)' : '#e0f2fe',
    hoverBg: isDark ? 'rgba(51, 65, 85, 0.6)' : 'rgba(244, 244, 245, 0.8)',
    footerHoverBg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
    skeletonBg: isDark ? 'rgba(71, 85, 105, 0.6)' : '#e4e4e7',
    skeletonShine: isDark ? 'rgba(100, 116, 139, 0.8)' : '#d4d4d8',
    progressBarBg: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.2)',
    
    // Text colors
    textPrimary: isDark ? '#f1f5f9' : '#18181b',
    textSecondary: isDark ? '#94a3b8' : '#71717a',
    textMuted: isDark ? '#64748b' : '#a1a1aa',
    textAccent: isDark ? '#60a5fa' : '#3b82f6',
    headerText: isDark ? '#cbd5e1' : '#52525b',
    
    // Shadows
    boxShadow: isDark 
        ? '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(71, 85, 105, 0.3)' 
        : '0 4px 24px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
});

// Skeleton Loading Component
function Skeleton({ style, isDark }: { style?: React.CSSProperties; isDark?: boolean }) {
    const colors = getColors(isDark || false);
    return (
        <motion.div
            style={{
                backgroundColor: colors.skeletonBg,
                borderRadius: '4px',
                ...style,
            }}
            animate={{ 
                backgroundColor: [colors.skeletonBg, colors.skeletonShine, colors.skeletonBg] 
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
    );
}

// Course Skeleton
function CourseSkeleton({ isDark }: { isDark: boolean }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px' }}>
                    <Skeleton isDark={isDark} style={{ width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <Skeleton isDark={isDark} style={{ height: '12px', width: '75%' }} />
                        <Skeleton isDark={isDark} style={{ height: '10px', width: '50%' }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

// Course item with dark mode support
const CourseItem = React.memo<{
    course: Course;
    index: number;
    onClick?: (id: string) => void;
    isDark: boolean;
    isActive?: boolean;
}>(({ course, index, onClick, isDark, isActive }) => {
    const colors = getColors(isDark);
    const displayTitle = useMemo(
        () => course.title.replace(' - SY2526-1T', ''),
        [course.title]
    );
    
    const timeLeft = useMemo(() => getTimeLeftForCourse(course.id), [course.id]);

    // Active state colors
    const activeBg = isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)';
    const activeBorder = isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)';

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            onClick={() => onClick?.(course.id)}
            className="group"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: isActive ? activeBg : 'transparent',
                border: isActive ? `1px solid ${activeBorder}` : '1px solid transparent',
            }}
            whileHover={{ backgroundColor: isActive ? activeBg : colors.hoverBg }}
        >
            {/* Course Image */}
            <div
                style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    position: 'relative',
                }}
            >
                <img
                    src={course.image}
                    alt=""
                    loading="lazy"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                />
                {/* Progress bar overlay */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: colors.progressBarBg,
                    }}
                >
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${course.progress}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        style={{
                            height: '100%',
                            background: course.progress === 100 ? '#10b981' : '#3b82f6',
                        }}
                    />
                </div>
            </div>

            {/* Course Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p
                    style={{
                        margin: 0,
                        fontSize: '12px',
                        fontWeight: 500,
                        color: colors.textPrimary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {displayTitle}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ fontSize: '10px', color: colors.textSecondary }}>
                        {course.progress}% • {course.subtitle.split(' · ')[0]}
                    </span>
                    {course.progress < 100 && (
                        <span style={{ fontSize: '9px', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {timeLeft} left
                        </span>
                    )}
                </div>
            </div>

            {/* Progress indicator / Active indicator */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isActive && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                        style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#3b82f6',
                        }}
                    />
                )}
                {course.progress === 100 ? (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, delay: index * 0.05 }}
                        style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </motion.div>
                ) : (
                    <span
                        style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: isActive ? '#3b82f6' : colors.textAccent,
                        }}
                    >
                        {course.progress}%
                    </span>
                )}
            </div>
        </motion.div>
    );
});

CourseItem.displayName = 'CourseItem';

const SidebarCoursesDropdown: React.FC<SidebarCoursesDropdownProps> = ({
    isOpen,
    onClose,
    courses,
    onCourseClick,
    anchorRef,
    currentCourseId,
}) => {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [isLoading, setIsLoading] = useState(true);
    // Initialize dark mode state immediately from DOM
    const [isDarkMode, setIsDarkMode] = useState(() => 
        typeof document !== 'undefined' && document.body.classList.contains('dark-mode')
    );
    const closeTimeoutRef = useRef<number | null>(null);

    // Check for dark mode changes
    useEffect(() => {
        const checkDarkMode = () => {
            const isDark = document.body.classList.contains('dark-mode');
            setIsDarkMode(isDark);
        };
        
        // Check immediately
        checkDarkMode();
        
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        
        return () => observer.disconnect();
    }, []);

    // Also check when dropdown opens
    useEffect(() => {
        if (isOpen) {
            setIsDarkMode(document.body.classList.contains('dark-mode'));
        }
    }, [isOpen]);

    const colors = getColors(isDarkMode);

    // Calculate stats
    const completedCount = courses.filter(c => c.progress === 100).length;
    const inProgressCourses = courses.filter(c => c.progress < 100);
    const mostRecentCourse = inProgressCourses[0];

    // Simulate loading
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            const timer = setTimeout(() => setIsLoading(false), 400);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && anchorRef?.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            setPosition({
                top: rect.top - 20,
                left: rect.right + 12,
            });
        }
    }, [isOpen, anchorRef]);

    const scheduleClose = useCallback(() => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = window.setTimeout(onClose, 200);
    }, [onClose]);

    const cancelClose = useCallback(() => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        };
    }, []);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, x: -8, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -8, scale: 0.96 }}
                    transition={{ type: 'spring', bounce: 0.1, duration: 0.25 }}
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                    style={{
                        position: 'fixed',
                        top: position.top,
                        left: position.left,
                        width: '280px',
                        background: colors.dropdownBg,
                        borderRadius: '12px',
                        boxShadow: colors.boxShadow,
                        overflow: 'hidden',
                        zIndex: 10000,
                    }}
                >
                    {/* Header */}
                    <div style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.headerBorder}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: colors.headerText, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                My Courses
                            </span>
                            <span style={{ fontSize: '11px', color: colors.textMuted }}>
                                {completedCount}/{courses.length} done
                            </span>
                        </div>
                    </div>

                    {/* Continue Learning Card */}
                    {mostRecentCourse && !isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            style={{
                                margin: '10px',
                                padding: '10px',
                                background: colors.cardBg,
                                borderRadius: '8px',
                                border: `1px solid ${colors.cardBorder}`,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.textAccent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                                <span style={{ fontSize: '9px', fontWeight: 600, color: colors.textAccent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Continue Learning
                                </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: 500, color: colors.textPrimary }}>
                                {mostRecentCourse.title.replace(' - SY2526-1T', '')}
                            </p>
                            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: colors.textSecondary }}>
                                {mostRecentCourse.subtitle.split(' · ')[0]}
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onCourseClick?.(mostRecentCourse.id)}
                                style={{
                                    marginTop: '8px',
                                    width: '100%',
                                    padding: '6px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    background: '#3b82f6',
                                    color: 'white',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                }}
                            >
                                Resume
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Course List */}
                    <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '4px 6px' }}>
                        {isLoading ? (
                            <CourseSkeleton isDark={isDarkMode} />
                        ) : (
                            courses.map((course, index) => (
                                <CourseItem
                                    key={course.id}
                                    course={course}
                                    index={index}
                                    onClick={onCourseClick}
                                    isDark={isDarkMode}
                                    isActive={currentCourseId === course.id}
                                />
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        style={{
                            padding: '10px 14px',
                            borderTop: `1px solid ${colors.headerBorder}`,
                        }}
                    >
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: 'none',
                                borderRadius: '8px',
                                background: 'transparent',
                                color: colors.textAccent,
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = colors.footerHoverBg)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                            View All Courses
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default React.memo(SidebarCoursesDropdown);
