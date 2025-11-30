import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getTimeLeftForCourse } from '../../services/studyTimeService';

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
}

// Skeleton Loading Component
function Skeleton({ style }: { style?: React.CSSProperties }) {
    return (
        <motion.div
            style={{
                backgroundColor: '#e4e4e7',
                borderRadius: '4px',
                ...style,
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
    );
}

// Course Skeleton
function CourseSkeleton() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px' }}>
                    <Skeleton style={{ width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <Skeleton style={{ height: '12px', width: '75%' }} />
                        <Skeleton style={{ height: '10px', width: '50%' }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

// Course item matching ToolbarExpandable style
const CourseItem = React.memo<{
    course: Course;
    index: number;
    onClick?: (id: string) => void;
}>(({ course, index, onClick }) => {
    const displayTitle = useMemo(
        () => course.title.replace(' - SY2526-1T', ''),
        [course.title]
    );
    
    const timeLeft = useMemo(() => getTimeLeftForCourse(course.id), [course.id]);

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
                transition: 'background 0.15s ease',
            }}
            whileHover={{ backgroundColor: 'rgba(244, 244, 245, 0.8)' }}
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
                        background: 'rgba(0,0,0,0.2)',
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
                        color: '#18181b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {displayTitle}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ fontSize: '10px', color: '#71717a' }}>
                        {course.progress}% • {course.subtitle.split(' · ')[0]}
                    </span>
                    {course.progress < 100 && (
                        <span style={{ fontSize: '9px', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {timeLeft} left
                        </span>
                    )}
                </div>
            </div>

            {/* Progress indicator */}
            <div style={{ flexShrink: 0 }}>
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
                            color: '#3b82f6',
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
}) => {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const closeTimeoutRef = useRef<number | null>(null);

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
                        background: '#ffffff',
                        borderRadius: '12px',
                        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                        overflow: 'hidden',
                        zIndex: 10000,
                    }}
                >
                    {/* Header */}
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid #f4f4f5' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                My Courses
                            </span>
                            <span style={{ fontSize: '11px', color: '#a1a1aa' }}>
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
                                background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
                                borderRadius: '8px',
                                border: '1px solid #e0f2fe',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                                <span style={{ fontSize: '9px', fontWeight: 600, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Continue Learning
                                </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: 500, color: '#18181b' }}>
                                {mostRecentCourse.title.replace(' - SY2526-1T', '')}
                            </p>
                            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#71717a' }}>
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
                            <CourseSkeleton />
                        ) : (
                            courses.map((course, index) => (
                                <CourseItem
                                    key={course.id}
                                    course={course}
                                    index={index}
                                    onClick={onCourseClick}
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
                            borderTop: '1px solid #f4f4f5',
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
                                color: '#3b82f6',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
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
