/**
 * TeacherSpotlight + TeacherSpotlightSkeleton
 * Extracted from UsersContent.tsx during Phase 8.4
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getRoleInfo } from '../../../../../services/usersService';
import UserAvatar from './UserAvatar';

// Teacher Spotlight Skeleton

const TeacherSpotlightSkeleton: React.FC<{
    isDarkMode: boolean;
    colors: { cardBg: string; border: string };
}> = ({ isDarkMode, colors }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            style={{
                marginBottom: '24px',
                padding: '18px',
                borderRadius: '14px',
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <SkeletonPulse width="38px" height="38px" borderRadius="10px" isDarkMode={isDarkMode} />
                <div style={{ flex: 1 }}>
                    <SkeletonPulse width="130px" height="15px" borderRadius="4px" isDarkMode={isDarkMode} style={{ marginBottom: '6px' }} />
                    <SkeletonPulse width="180px" height="12px" borderRadius="4px" isDarkMode={isDarkMode} />
                </div>
            </div>
            
            {/* Content */}
            <div style={{ display: 'flex', gap: '16px' }}>
                {/* Teacher Card */}
                <div style={{
                    width: '200px',
                    padding: '16px',
                    borderRadius: '12px',
                    border: `1px solid ${colors.border}`,
                    textAlign: 'center',
                }}>
                    <SkeletonPulse width="64px" height="64px" borderRadius="16px" isDarkMode={isDarkMode} style={{ margin: '0 auto 12px' }} />
                    <SkeletonPulse width="80%" height="14px" borderRadius="4px" isDarkMode={isDarkMode} style={{ margin: '0 auto 8px' }} />
                    <SkeletonPulse width="50px" height="20px" borderRadius="6px" isDarkMode={isDarkMode} style={{ margin: '0 auto' }} />
                </div>
                
                {/* Courses */}
                <div style={{ flex: 1 }}>
                    <SkeletonPulse width="140px" height="11px" borderRadius="4px" isDarkMode={isDarkMode} style={{ marginBottom: '10px' }} />
                    {[...Array(2)].map((_, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: `1px solid ${colors.border}`,
                                marginBottom: '8px',
                            }}
                        >
                            <SkeletonPulse width="36px" height="36px" borderRadius="8px" isDarkMode={isDarkMode} />
                            <div style={{ flex: 1 }}>
                                <SkeletonPulse width="70%" height="13px" borderRadius="4px" isDarkMode={isDarkMode} style={{ marginBottom: '4px' }} />
                                <SkeletonPulse width="50%" height="11px" borderRadius="4px" isDarkMode={isDarkMode} />
                            </div>
                            <SkeletonPulse width="45px" height="18px" borderRadius="5px" isDarkMode={isDarkMode} />
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

// Teacher Spotlight Component - Featured carousel showing teachers this semester
interface TeacherWithCourses {
    teacher: UserAccount;
    courses: TeacherCourse[];
}

const TeacherSpotlight: React.FC<{
    isDarkMode: boolean;
    colors: {
        cardBg: string;
        border: string;
        textPrimary: string;
        textSecondary: string;
        textMuted: string;
    };
    onTeacherClick: (teacher: UserAccount) => void;
}> = ({ isDarkMode, colors, onTeacherClick }) => {
    const [teachers, setTeachers] = useState<TeacherWithCourses[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [direction, setDirection] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);

    // Load teachers and their courses
    useEffect(() => {
        const loadTeachers = async () => {
            setIsLoading(true);
            try {
                const allUsers = await fetchUsers('teacher');
                const teachersWithCourses: TeacherWithCourses[] = await Promise.all(
                    allUsers.map(async (teacher) => {
                        const courses = await getTeacherCourses(teacher.full_name);
                        return { teacher, courses };
                    })
                );
                // Filter to only teachers with courses
                setTeachers(teachersWithCourses.filter(t => t.courses.length > 0));
            } catch (err) {
            } finally {
                setIsLoading(false);
            }
        };
        loadTeachers();
    }, []);

    const handlePrev = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev === 0 ? teachers.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev === teachers.length - 1 ? 0 : prev + 1));
    };

    // Auto-advance carousel
    useEffect(() => {
        if (teachers.length <= 1) return;
        const interval = setInterval(() => {
            setDirection(1);
            setCurrentIndex((prev) => (prev === teachers.length - 1 ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(interval);
    }, [teachers.length]);

    if (isLoading) {
        return <TeacherSpotlightSkeleton isDarkMode={isDarkMode} colors={colors} />;
    }

    if (teachers.length === 0) return null;

    const currentTeacher = teachers[currentIndex];

    // Category colors
    const getCategoryColor = (category: string) => {
        const categoryColors: Record<string, string> = {
            major: '#3b82f6',
            ge: '#10b981',
            pe: '#f59e0b',
            nstp: '#8b5cf6',
        };
        return categoryColors[category] || '#64748b';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            style={{
                marginBottom: '24px',
                padding: '18px',
                borderRadius: '14px',
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                overflow: 'hidden',
            }}
        >
            {/* Section Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: isDarkMode ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    </motion.div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: colors.textPrimary }}>
                            Teacher Spotlight
                        </h3>
                        <p style={{ margin: 0, fontSize: '12px', color: colors.textSecondary }}>
                            Your Teachers This Semester · {teachers.length} Faculty
                        </p>
                    </div>
                </div>
                
                {/* Navigation Arrows */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handlePrev}
                        style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            border: `1px solid ${colors.border}`,
                            background: 'transparent',
                            color: colors.textSecondary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleNext}
                        style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            border: `1px solid ${colors.border}`,
                            background: 'transparent',
                            color: colors.textSecondary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </motion.button>
                </div>
            </div>

            {/* Carousel Content */}
            <div ref={carouselRef} style={{ position: 'relative', overflow: 'hidden' }}>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            display: 'flex',
                            gap: '16px',
                            alignItems: 'flex-start',
                        }}
                    >
                        {/* Teacher Card */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onTeacherClick(currentTeacher.teacher)}
                            style={{
                                flex: '0 0 auto',
                                width: '200px',
                                padding: '16px',
                                borderRadius: '12px',
                                background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                border: `1px solid ${colors.border}`,
                                cursor: 'pointer',
                                textAlign: 'center',
                            }}
                        >
                            {/* Avatar */}
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                                style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '16px',
                                    background: `linear-gradient(135deg, #f59e0b20 0%, #f59e0b10 100%)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '22px',
                                    fontWeight: 600,
                                    color: '#f59e0b',
                                    margin: '0 auto 12px',
                                    position: 'relative',
                                }}
                            >
                                {currentTeacher.teacher.profile_image ? (
                                    <img 
                                        src={currentTeacher.teacher.profile_image} 
                                        alt={currentTeacher.teacher.full_name}
                                        style={{ width: '100%', height: '100%', borderRadius: '16px', objectFit: 'cover' }}
                                    />
                                ) : (
                                    `${currentTeacher.teacher.first_name?.[0] || ''}${currentTeacher.teacher.last_name?.[0] || ''}`
                                )}
                                {/* Online indicator */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: -2,
                                    right: -2,
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '50%',
                                    background: currentTeacher.teacher.is_online ? '#10b981' : '#94a3b8',
                                    border: '3px solid white',
                                    boxShadow: currentTeacher.teacher.is_online ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none',
                                }} />
                            </motion.div>
                            
                            {/* Name */}
                            <h4 style={{
                                margin: '0 0 4px',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: colors.textPrimary,
                            }}>
                                {currentTeacher.teacher.full_name}
                            </h4>
                            
                            {/* Role Badge */}
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: 'rgba(245, 158, 11, 0.1)',
                                fontSize: '10px',
                                fontWeight: 500,
                                color: '#f59e0b',
                            }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                Faculty
                            </span>
                        </motion.div>

                        {/* Courses List */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                                margin: '0 0 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: colors.textMuted,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}>
                                Teaching This Semester
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {currentTeacher.courses.map((course, idx) => (
                                    <motion.div
                                        key={course.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 + idx * 0.05, duration: 0.3 }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '10px 14px',
                                            borderRadius: '10px',
                                            background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                            border: `1px solid ${colors.border}`,
                                        }}
                                    >
                                        {/* Course Icon */}
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '8px',
                                            background: `${getCategoryColor(course.category)}15`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={getCategoryColor(course.category)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                            </svg>
                                        </div>
                                        
                                        {/* Course Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '13px',
                                                fontWeight: 500,
                                                color: colors.textPrimary,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {course.title}
                                            </p>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '11px',
                                                color: colors.textMuted,
                                            }}>
                                                {course.subtitle} · {course.short_title}
                                            </p>
                                        </div>
                                        
                                        {/* Category Badge */}
                                        <span style={{
                                            padding: '3px 8px',
                                            borderRadius: '5px',
                                            background: `${getCategoryColor(course.category)}15`,
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            color: getCategoryColor(course.category),
                                            textTransform: 'uppercase',
                                            flexShrink: 0,
                                        }}>
                                            {course.category}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Pagination Dots */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '16px',
            }}>
                {teachers.map((_, idx) => (
                    <motion.button
                        key={idx}
                        onClick={() => {
                            setDirection(idx > currentIndex ? 1 : -1);
                            setCurrentIndex(idx);
                        }}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        style={{
                            width: idx === currentIndex ? '20px' : '8px',
                            height: '8px',
                            borderRadius: '4px',
                            border: 'none',
                            background: idx === currentIndex ? '#f59e0b' : isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    />
                ))}
            </div>
        </motion.div>
    );
};

// User Detail Modal Component
interface UserDetailModalProps {
    user: UserAccount | null;
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
}


export { TeacherSpotlight, TeacherSpotlightSkeleton };
