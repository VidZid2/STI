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

// Course Item Component with proper hover state
const CourseItem: React.FC<{
    course: Course;
    index: number;
    onClick?: (id: string) => void;
    isActive?: boolean;
}> = ({ course, index, onClick, isActive }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const displayTitle = useMemo(
        () => course.title.replace(' - SY2526-1T', ''),
        [course.title]
    );
    
    const timeLeft = useMemo(() => getTimeLeftForCourse(course.id), [course.id]);

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            onClick={() => onClick?.(course.id)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: isActive 
                    ? 'rgba(59, 130, 246, 0.08)' 
                    : isHovered 
                        ? 'rgba(0, 0, 0, 0.03)' 
                        : 'transparent',
                border: isActive 
                    ? '1px solid rgba(59, 130, 246, 0.2)' 
                    : '1px solid transparent',
            }}
        >
            {/* Course Image */}
            <div
                style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    position: 'relative',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
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
            </div>

            {/* Course Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p
                    style={{
                        margin: 0,
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#18181b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {displayTitle}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                    <span style={{ fontSize: '11px', color: '#71717a' }}>
                        {course.progress}% • {course.subtitle.split(' · ')[0]}
                    </span>
                    {course.progress < 100 && (
                        <span style={{ 
                            fontSize: '10px', 
                            color: '#a1a1aa', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '3px' 
                        }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {timeLeft} left
                        </span>
                    )}
                </div>
            </div>

            {/* Progress */}
            <div style={{ flexShrink: 0 }}>
                {course.progress === 100 ? (
                    <div
                        style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                ) : (
                    <span
                        style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: isActive ? '#3b82f6' : '#3b82f6',
                        }}
                    >
                        {course.progress}%
                    </span>
                )}
            </div>
        </motion.div>
    );
};

// Continue Learning Card Component
const ContinueLearningCard: React.FC<{
    course: Course;
    onCourseClick?: (id: string) => void;
}> = ({ course, onCourseClick }) => {
    const [isHovered, setIsHovered] = useState(false);
    const displayTitle = course.title.replace(' - SY2526-1T', '');
    
    return (
        <div
            style={{
                margin: '12px',
                padding: '14px',
                background: 'rgba(59, 130, 246, 0.04)',
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.1)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span style={{ 
                    fontSize: '10px', 
                    fontWeight: 600, 
                    color: '#3b82f6', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em' 
                }}>
                    Continue Learning
                </span>
            </div>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#18181b' }}>
                {displayTitle}
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#71717a' }}>
                {course.subtitle.split(' · ')[0]}
            </p>
            <button
                onClick={() => onCourseClick?.(course.id)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    marginTop: '12px',
                    width: '100%',
                    padding: '10px',
                    border: 'none',
                    borderRadius: '10px',
                    background: '#3b82f6',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isHovered ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                }}
            >
                Resume
            </button>
        </div>
    );
};

// Skeleton Loading
const CourseSkeleton: React.FC = () => (
    <div style={{ padding: '8px 12px' }}>
        {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0' }}>
                <div 
                    style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '10px', 
                        background: '#f4f4f5',
                        animation: 'pulse 1.5s ease-in-out infinite',
                    }} 
                />
                <div style={{ flex: 1 }}>
                    <div 
                        style={{ 
                            height: '14px', 
                            width: '70%', 
                            background: '#f4f4f5', 
                            borderRadius: '4px',
                            marginBottom: '6px',
                            animation: 'pulse 1.5s ease-in-out infinite',
                        }} 
                    />
                    <div 
                        style={{ 
                            height: '10px', 
                            width: '50%', 
                            background: '#f4f4f5', 
                            borderRadius: '4px',
                            animation: 'pulse 1.5s ease-in-out infinite',
                        }} 
                    />
                </div>
            </div>
        ))}
    </div>
);

// View All Button Component
const ViewAllButton: React.FC = () => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
        <button
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                width: '100%',
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                background: isHovered ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                color: '#3b82f6',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
            }}
        >
            View All Courses
        </button>
    );
};

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
    const closeTimeoutRef = useRef<number | null>(null);

    // Calculate stats
    const completedCount = courses.filter(c => c.progress === 100).length;
    const inProgressCourses = courses.filter(c => c.progress < 100);
    const mostRecentCourse = inProgressCourses[0];

    // Simulate loading
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            const timer = setTimeout(() => setIsLoading(false), 300);
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
                    initial={{ opacity: 0, x: -8, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -8, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                    style={{
                        position: 'fixed',
                        top: position.top,
                        left: position.left,
                        width: '300px',
                        background: '#ffffff',
                        borderRadius: '16px',
                        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                        overflow: 'hidden',
                        zIndex: 10000,
                    }}
                >
                    {/* Header */}
                    <div style={{ 
                        padding: '14px 16px', 
                        borderBottom: '1px solid #f4f4f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <span style={{ 
                            fontSize: '12px', 
                            fontWeight: 600, 
                            color: '#52525b', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.05em' 
                        }}>
                            My Courses
                        </span>
                        <span style={{ 
                            fontSize: '11px', 
                            color: '#a1a1aa',
                            padding: '2px 8px',
                            background: '#f4f4f5',
                            borderRadius: '10px',
                        }}>
                            {completedCount}/{courses.length} done
                        </span>
                    </div>

                    {/* Continue Learning Card */}
                    {mostRecentCourse && !isLoading && (
                        <ContinueLearningCard 
                            course={mostRecentCourse} 
                            onCourseClick={onCourseClick} 
                        />
                    )}

                    {/* Course List */}
                    <div style={{ 
                        maxHeight: '240px', 
                        overflowY: 'auto', 
                        padding: '4px 8px',
                    }}>
                        {isLoading ? (
                            <CourseSkeleton />
                        ) : (
                            courses.map((course, index) => (
                                <CourseItem
                                    key={course.id}
                                    course={course}
                                    index={index}
                                    onClick={onCourseClick}
                                    isActive={currentCourseId === course.id}
                                />
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: '10px 12px',
                        borderTop: '1px solid #f4f4f5',
                    }}>
                        <ViewAllButton />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default React.memo(SidebarCoursesDropdown);
