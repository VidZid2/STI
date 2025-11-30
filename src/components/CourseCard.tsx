import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useState, useRef, useEffect } from 'react';

interface QuickAction {
    id: string;
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
}

interface DeadlineInfo {
    title: string;
    dueDate: string;
    daysLeft: number;
}

interface GradeInfo {
    current: number;
    letter: string;
    trend?: 'up' | 'down' | 'stable';
}

interface InstructorInfo {
    name: string;
    avatar?: string;
}

type CourseCategory = 'major' | 'ge' | 'elective' | 'nstp' | 'pe';

interface CourseCardProps {
    title: string;
    subtitle?: string;
    image: string;
    progress: number;
    modules: number;
    index?: number;
    nextLesson?: string;
    timeEstimate?: string;
    deadline?: DeadlineInfo;
    lastAccessed?: string;
    unreadCount?: number;
    grade?: GradeInfo;
    isBookmarked?: boolean;
    onBookmarkToggle?: (bookmarked: boolean) => void;
    studyStreak?: number;
    instructor?: InstructorInfo;
    category?: CourseCategory;
}

const CourseCard = ({
    title,
    subtitle,
    image,
    progress,
    modules,
    index = 0,
    nextLesson,
    timeEstimate,
    deadline,
    lastAccessed,
    unreadCount,
    grade,
    isBookmarked: initialBookmarked = false,
    onBookmarkToggle,
    studyStreak,
    instructor,
    category
}: CourseCardProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [bookmarked, setBookmarked] = useState(initialBookmarked);
    const [bookmarkHovered, setBookmarkHovered] = useState(false);
    const [quickActionsOpen, setQuickActionsOpen] = useState(false);
    const [progressHovered, setProgressHovered] = useState(false);
    const [instructorHovered, setInstructorHovered] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const quickActionsRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    // Check for 100% completion celebration
    const isCompleted = progress === 100;

    // Category labels and colors
    const categoryConfig: Record<CourseCategory, { label: string; color: string; bgColor: string }> = {
        major: { label: 'Major', color: '#2563eb', bgColor: 'rgba(37, 99, 235, 0.1)' },
        ge: { label: 'Minor', color: '#ca8a04', bgColor: 'rgba(202, 138, 4, 0.1)' },
        elective: { label: 'Elective', color: '#059669', bgColor: 'rgba(5, 150, 105, 0.1)' },
        nstp: { label: 'Minor', color: '#ca8a04', bgColor: 'rgba(202, 138, 4, 0.1)' },
        pe: { label: 'Minor', color: '#ca8a04', bgColor: 'rgba(202, 138, 4, 0.1)' },
    };

    // Close quick actions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
                setQuickActionsOpen(false);
            }
        };

        if (quickActionsOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [quickActionsOpen]);

    // Professional minimalistic SVG icons with clean design
    const quickActions: QuickAction[] = [
        {
            id: 'syllabus',
            label: 'View Syllabus',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12h6M9 16h6M13 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8l-5-5z" />
                    <path d="M13 3v5h5" />
                </svg>
            ),
        },
        {
            id: 'materials',
            label: 'Download Materials',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
                    <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                </svg>
            ),
        },
        {
            id: 'instructor',
            label: 'Contact Instructor',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 6l-10 7L2 6" />
                </svg>
            ),
        },
        {
            id: 'grades',
            label: 'View Grades',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18" />
                    <path d="M7 16l4-4 4 4 5-6" />
                </svg>
            ),
        },
    ];

    const handleQuickAction = (actionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        console.log(`Quick action: ${actionId} for course: ${title}`);
        setQuickActionsOpen(false);
    };

    const handleBookmarkClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newState = !bookmarked;
        setBookmarked(newState);
        onBookmarkToggle?.(newState);
    };

    const getDeadlineUrgency = (daysLeft: number) => {
        if (daysLeft <= 1) return 'critical';
        if (daysLeft <= 3) return 'warning';
        return 'normal';
    };

    const getGradeStatus = (gradeValue: number) => {
        if (gradeValue >= 90) return 'excellent';
        if (gradeValue >= 80) return 'good';
        if (gradeValue >= 70) return 'average';
        return 'needs-improvement';
    };

    const urgency = deadline ? getDeadlineUrgency(deadline.daysLeft) : null;
    const gradeStatus = grade ? getGradeStatus(grade.current) : null;

    const animationDelay = prefersReducedMotion ? 0 : Math.min(index * 0.03, 0.15); // Cap delay at 150ms

    return (
        <motion.div
            className="course-card-premium"
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: animationDelay, ease: 'easeOut' }}
            whileHover={prefersReducedMotion ? undefined : { y: -4, transition: { duration: 0.15, ease: 'easeOut' } }}
        >
            {/* Bookmark Toggle with Tooltip - simplified animations */}
            <div className="bookmark-wrapper">
                <motion.button
                    className={`bookmark-toggle ${bookmarked ? 'active' : ''}`}
                    onClick={handleBookmarkClick}
                    onMouseEnter={() => setBookmarkHovered(true)}
                    onMouseLeave={() => setBookmarkHovered(false)}
                    animate={{
                        opacity: isHovered || bookmarked ? 1 : 0,
                        scale: isHovered || bookmarked ? 1 : 0.9
                    }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        background: bookmarked
                            ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                            : 'rgba(255, 255, 255, 0.95)'
                    }}
                >
                    <svg
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        style={{
                            fill: bookmarked ? '#fbbf24' : 'none',
                            stroke: bookmarked ? '#fbbf24' : '#9ca3af'
                        }}
                    >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                </motion.button>

                {/* Tooltip - CSS transition instead of motion */}
                <div
                    className="bookmark-tooltip"
                    style={{
                        opacity: bookmarkHovered ? 1 : 0,
                        transform: bookmarkHovered ? 'translateY(0)' : 'translateY(4px)',
                        transition: 'opacity 0.15s ease, transform 0.15s ease',
                        pointerEvents: bookmarkHovered ? 'auto' : 'none'
                    }}
                >
                    {bookmarked ? 'Remove from priorities' : 'Add to priorities'}
                </div>
            </div>

            {/* Image Section - optimized with CSS transitions */}
            <div className="card-image-container">
                <div
                    className="card-image-wrapper"
                    style={{
                        transform: !prefersReducedMotion && isHovered ? 'scale(1.03)' : 'scale(1)',
                        transition: 'transform 0.2s ease-out'
                    }}
                >
                    {imageError ? (
                        <div className="image-error-fallback">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                            </svg>
                            <span>Image unavailable</span>
                        </div>
                    ) : (
                        <>
                            <img
                                src={image}
                                alt={title}
                                loading="lazy"
                                style={{
                                    opacity: imageLoaded ? 1 : 0,
                                    transition: 'opacity 0.2s ease-out'
                                }}
                                onLoad={() => setImageLoaded(true)}
                                onError={() => setImageError(true)}
                            />
                            {!imageLoaded && (
                                <div className="image-skeleton image-skeleton-enhanced">
                                    <div className="skeleton-gradient-bg" />
                                    <div className="skeleton-shimmer-enhanced" />
                                </div>
                            )}
                        </>
                    )}
                </div>


                {/* Instructor Avatar - simplified */}
                {instructor && (
                    <div
                        className="instructor-avatar-wrapper"
                        onMouseEnter={() => setInstructorHovered(true)}
                        onMouseLeave={() => setInstructorHovered(false)}
                    >
                        <div className="instructor-avatar">
                            {instructor.avatar ? (
                                <img src={instructor.avatar} alt={instructor.name} />
                            ) : (
                                <div className="instructor-avatar-fallback">
                                    {instructor.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Instructor Tooltip - CSS only */}
                        <div
                            className="instructor-tooltip"
                            style={{
                                opacity: instructorHovered ? 1 : 0,
                                transform: instructorHovered ? 'translateY(0)' : 'translateY(4px)',
                                transition: 'opacity 0.15s ease, transform 0.15s ease',
                                pointerEvents: instructorHovered ? 'auto' : 'none'
                            }}
                        >
                            <span className="instructor-tooltip-label">Instructor</span>
                            <span className="instructor-tooltip-name">{instructor.name}</span>
                        </div>
                    </div>
                )}

                {/* Category Tag - no animation */}
                {category && (
                    <div
                        className="course-category-tag"
                        style={{
                            backgroundColor: categoryConfig[category].bgColor,
                            color: categoryConfig[category].color,
                            borderColor: categoryConfig[category].color
                        }}
                    >
                        {categoryConfig[category].label}
                    </div>
                )}

                {/* Completion Celebration Overlay */}
                <AnimatePresence>
                    {isCompleted && showCelebration && (
                        <motion.div
                            className="completion-celebration"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Confetti particles */}
                            {[...Array(12)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="confetti-particle"
                                    style={{
                                        left: `${10 + Math.random() * 80}%`,
                                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]
                                    }}
                                    initial={{ y: 0, opacity: 1, scale: 1 }}
                                    animate={{
                                        y: [0, -60, 100],
                                        opacity: [1, 1, 0],
                                        scale: [1, 1.2, 0.5],
                                        rotate: [0, 180, 360]
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        delay: i * 0.05,
                                        ease: 'easeOut'
                                    }}
                                />
                            ))}
                            {/* Checkmark */}
                            <motion.div
                                className="completion-checkmark"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Card Body */}
            <div className="card-body-premium">
                {/* Title Section - Fixed */}
                <div className="card-title-section">
                    <div className="card-title-row">
                        <h3 className="card-title-premium">{title}</h3>
                        {unreadCount && unreadCount > 0 && (
                            <motion.div
                                className="unread-badge"
                                initial={{ opacity: 0, scale: 0, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{
                                    delay: 0.25 + index * 0.06,
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 15
                                }}
                                whileHover={{ scale: 1.1 }}
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="unread-icon">
                                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                                </svg>
                                <span className="unread-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
                            </motion.div>
                        )}
                    </div>
                    <div className="card-meta-row">
                        {subtitle && <p className="card-subtitle-premium">{subtitle}</p>}
                        {lastAccessed && (
                            <motion.span
                                className="last-accessed"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.15 + index * 0.06 }}
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="last-accessed-icon">
                                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                                </svg>
                                {lastAccessed}
                            </motion.span>
                        )}
                    </div>
                </div>

                {/* Content Section - Fixed Height */}
                <div className="card-content-section">
                    {deadline ? (
                        <motion.div
                            className="deadline-preview"
                            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: animationDelay + 0.2, duration: prefersReducedMotion ? 0.1 : 0.3 }}
                        >
                            <div className="deadline-preview-header">
                                <motion.div
                                    className={`deadline-preview-icon ${urgency}`}
                                    animate={prefersReducedMotion ? undefined : { scale: isHovered ? 1.1 : 1 }}
                                    transition={{ type: 'spring', stiffness: 400 }}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                </motion.div>
                                <span className="deadline-label">Deadline</span>
                                <motion.span
                                    className={`deadline-time-badge ${urgency}`}
                                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: animationDelay + 0.3 }}
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="deadline-time-icon">
                                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                                    </svg>
                                    {deadline.daysLeft === 0 ? 'Due Today' : deadline.daysLeft === 1 ? 'Due Tomorrow' : `${deadline.daysLeft} days`}
                                </motion.span>
                            </div>
                            <motion.p
                                className="deadline-preview-title"
                                animate={prefersReducedMotion ? undefined : { x: isHovered ? 4 : 0 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                {deadline.title}
                            </motion.p>
                        </motion.div>
                    ) : nextLesson ? (
                        <motion.div
                            className="next-lesson-preview"
                            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: animationDelay + 0.2, duration: prefersReducedMotion ? 0.1 : 0.3 }}
                        >
                            <div className="next-lesson-header">
                                <motion.div
                                    className="next-lesson-icon"
                                    animate={prefersReducedMotion ? undefined : { scale: isHovered ? 1.1 : 1 }}
                                    transition={{ type: 'spring', stiffness: 400 }}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 8v4l3 3" />
                                        <circle cx="12" cy="12" r="9" />
                                    </svg>
                                </motion.div>
                                <span className="next-label">Up Next</span>
                                {timeEstimate && (
                                    <motion.span
                                        className="time-estimate"
                                        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: animationDelay + 0.3 }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="time-icon">
                                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                                        </svg>
                                        {timeEstimate}
                                    </motion.span>
                                )}
                            </div>
                            <motion.p
                                className="next-lesson-title"
                                animate={prefersReducedMotion ? undefined : { x: isHovered ? 4 : 0 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                {nextLesson}
                            </motion.p>
                        </motion.div>
                    ) : (
                        <div className="empty-content-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                <line x1="12" y1="6" x2="12" y2="10" />
                                <line x1="12" y1="14" x2="12.01" y2="14" />
                            </svg>
                            <span>No upcoming tasks</span>
                        </div>
                    )}
                </div>

                {/* Grade & Streak Section */}
                {((studyStreak !== undefined && studyStreak > 0) || grade) && (
                    <div className="card-stats-section">
                        <div className="stats-row">
                            {/* Study Streak Display */}
                            {studyStreak !== undefined && studyStreak > 0 && (
                                <motion.div
                                    className="study-streak-display"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.25 + index * 0.06, type: 'spring', stiffness: 400, damping: 20 }}
                                >
                                    <div className="streak-content">
                                        {studyStreak >= 10 ? (
                                            <lord-icon
                                                src="https://cdn.lordicon.com/puebsmel.json"
                                                trigger="loop"
                                                state="loop-cycle"
                                                colors="primary:#fbbf24,secondary:#3b82f6"
                                                class="streak-lord-icon"
                                                style={{ width: '24px', height: '24px' }}
                                            />
                                        ) : (
                                            <lord-icon
                                                src="https://cdn.lordicon.com/uphsjyqc.json"
                                                trigger="hover"
                                                colors="primary:#3b82f6,secondary:#fbbf24"
                                                class="streak-lord-icon"
                                                style={{ width: '24px', height: '24px' }}
                                            />
                                        )}
                                        <motion.span
                                            className="streak-number"
                                            initial={{ y: 5, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.35 + index * 0.06, duration: 0.3 }}
                                        >
                                            {studyStreak}
                                        </motion.span>
                                    </div>
                                    <span className="streak-label">Day Streak</span>
                                </motion.div>
                            )}

                            {/* Current Grade Display */}
                            {grade && (
                                <motion.div
                                    className={`grade-display ${gradeStatus}`}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.25 + index * 0.06, type: 'spring', stiffness: 400, damping: 20 }}
                                >
                                    <div className="grade-content">
                                        <motion.span
                                            className="grade-letter"
                                            initial={{ y: 10, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.35 + index * 0.06, duration: 0.3 }}
                                        >
                                            {grade.letter}
                                        </motion.span>
                                        <div className="grade-details">
                                            <motion.span
                                                className="grade-percentage"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.4 + index * 0.06 }}
                                            >
                                                {grade.current}%
                                            </motion.span>
                                            {grade.trend && (
                                                <motion.span
                                                    className={`grade-trend ${grade.trend}`}
                                                    initial={{ opacity: 0, x: -5 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.45 + index * 0.06 }}
                                                >
                                                    {grade.trend === 'up' && (
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <path d="M7 17l5-5 5 5M7 12l5-5 5 5" />
                                                        </svg>
                                                    )}
                                                    {grade.trend === 'down' && (
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <path d="M7 7l5 5 5-5M7 12l5 5 5-5" />
                                                        </svg>
                                                    )}
                                                    {grade.trend === 'stable' && (
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <path d="M5 12h14" />
                                                        </svg>
                                                    )}
                                                </motion.span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="grade-label">Current Grade</span>
                                </motion.div>
                            )}
                        </div>
                    </div>
                )}

                {/* Progress Section - Always at bottom, separate from stats */}
                <div className="card-progress-section">
                    <div className="card-progress-premium">
                        <div className="progress-info">
                            {isCompleted ? (
                                <motion.span
                                    className="progress-text completed"
                                    initial={{ scale: 1 }}
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 0.5, delay: 0.5 + index * 0.06 }}
                                    onClick={() => setShowCelebration(prev => !prev)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="completed-icon">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                    COMPLETED
                                </motion.span>
                            ) : (
                                <span className="progress-text">{progress}% COMPLETE</span>
                            )}
                            <span className="modules-text">{modules} modules</span>
                        </div>
                        <div
                            className="progress-bar-wrapper"
                            onMouseEnter={() => setProgressHovered(true)}
                            onMouseLeave={() => setProgressHovered(false)}
                        >
                            <div className={`progress-bar-container ${progressHovered ? 'hovered' : ''}`}>
                                <motion.div
                                    className="progress-bar-fill"
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: `${progress}%`, opacity: 1 }}
                                    transition={{
                                        width: {
                                            duration: 0.8,
                                            delay: 0.2 + index * 0.1,
                                            ease: [0.25, 0.1, 0.25, 1]
                                        },
                                        opacity: {
                                            duration: 0.3,
                                            delay: 0.1 + index * 0.1
                                        }
                                    }}
                                />
                                {/* Progress indicator dot - positioned at progress percentage */}
                                <motion.div
                                    className="progress-indicator-dot"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{
                                        opacity: progressHovered ? 1 : 0,
                                        scale: progressHovered ? 1 : 0
                                    }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 500,
                                        damping: 25
                                    }}
                                    style={{ left: `calc(${progress}% - 7px)` }}
                                />
                            </div>

                            {/* Progress Tooltip */}
                            <AnimatePresence>
                                {progressHovered && (
                                    <motion.div
                                        className="progress-tooltip"
                                        initial={{ opacity: 0, y: 8, scale: 0.9, x: '-50%' }}
                                        animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                                        exit={{ opacity: 0, y: 8, scale: 0.9, x: '-50%' }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        style={{ left: progress === 100 ? '50%' : `${progress}%` }}
                                    >
                                        <div className="progress-tooltip-content">
                                            <span className="progress-tooltip-value">{progress}%</span>
                                            <span className="progress-tooltip-label">done</span>
                                        </div>
                                        <div className="progress-tooltip-details">
                                            <span>{Math.round((progress / 100) * modules)}/{modules} modules</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Actions Section - Fixed at Bottom */}
                <div className="card-actions-premium">
                    <motion.button className="continue-btn" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <span>Continue</span>
                        <motion.svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" animate={{ x: isHovered ? 2 : 0 }} transition={{ type: 'spring', stiffness: 400 }}>
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </motion.svg>
                    </motion.button>

                    {/* Quick Actions Menu */}
                    <div className="quick-actions-wrapper" ref={quickActionsRef}>
                        <motion.button
                            className={`more-btn more-btn-outlined ${quickActionsOpen ? 'active' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setQuickActionsOpen(!quickActionsOpen);
                            }}
                            whileHover={prefersReducedMotion ? undefined : { 
                                scale: 1.1,
                                boxShadow: quickActionsOpen 
                                    ? '0 0 0 4px rgba(251, 191, 36, 0.15)' 
                                    : '0 0 0 4px rgba(59, 130, 246, 0.15)'
                            }}
                            whileTap={{ scale: 0.92 }}
                            animate={{ 
                                rotate: quickActionsOpen ? 45 : 0,
                                borderColor: quickActionsOpen ? '#fbbf24' : '#3b82f6',
                            }}
                            transition={{ 
                                type: 'spring', 
                                stiffness: 500, 
                                damping: 25,
                                mass: 0.8
                            }}
                        >
                            <motion.svg 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={false}
                                animate={{ 
                                    stroke: quickActionsOpen ? '#fbbf24' : '#3b82f6',
                                    scale: quickActionsOpen ? 1.1 : 1,
                                }}
                                transition={{ 
                                    stroke: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
                                    scale: { type: 'spring', stiffness: 600, damping: 20 }
                                }}
                            >
                                <motion.path 
                                    d="M12 5v14" 
                                    initial={false}
                                    animate={{ 
                                        pathLength: 1,
                                        opacity: 1 
                                    }}
                                />
                                <motion.path 
                                    d="M5 12h14"
                                    initial={false}
                                    animate={{ 
                                        pathLength: 1,
                                        opacity: 1 
                                    }}
                                />
                            </motion.svg>
                        </motion.button>

                        <AnimatePresence>
                            {quickActionsOpen && (
                                <motion.div
                                    className="quick-actions-dropdown quick-actions-minimal"
                                    initial={{ opacity: 0, scale: 0.95, y: 6 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 6 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 28,
                                        mass: 0.8
                                    }}
                                >
                                    {quickActions.map((action, actionIndex) => (
                                        <motion.button
                                            key={action.id}
                                            className="quick-action-item quick-action-minimal"
                                            onClick={(e) => handleQuickAction(action.id, e)}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                delay: prefersReducedMotion ? 0 : actionIndex * 0.04,
                                                type: 'spring',
                                                stiffness: 500,
                                                damping: 30
                                            }}
                                            whileHover={prefersReducedMotion ? undefined : {
                                                x: 3,
                                                transition: { type: 'spring', stiffness: 400, damping: 20 }
                                            }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <motion.span 
                                                className="quick-action-icon"
                                                whileHover={prefersReducedMotion ? undefined : { 
                                                    scale: 1.1,
                                                    transition: { type: 'spring', stiffness: 400, damping: 15 }
                                                }}
                                            >
                                                {action.icon}
                                            </motion.span>
                                            <motion.span 
                                                className="quick-action-label"
                                                initial={{ opacity: 0.8 }}
                                                whileHover={{ opacity: 1 }}
                                            >
                                                {action.label}
                                            </motion.span>
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Skeleton Loading Component
export const CourseCardSkeleton = ({ index = 0 }: { index?: number }) => {
    return (
        <motion.div
            className="course-card-skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
        >
            {/* Image Skeleton */}
            <div className="skeleton-image">
                <motion.div
                    className="skeleton-shimmer"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
            </div>

            {/* Body Skeleton */}
            <div className="skeleton-body">
                {/* Title Skeleton */}
                <div className="skeleton-title-section">
                    <motion.div
                        className="skeleton-title"
                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="skeleton-subtitle"
                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                    />
                </div>

                {/* Content Skeleton */}
                <div className="skeleton-content">
                    <motion.div
                        className="skeleton-preview-box"
                        animate={{ opacity: [0.4, 0.6, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                    />
                </div>

                {/* Stats Skeleton */}
                <div className="skeleton-stats">
                    <motion.div
                        className="skeleton-stat-box"
                        animate={{ opacity: [0.4, 0.6, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                    />
                </div>

                {/* Progress Skeleton */}
                <div className="skeleton-progress">
                    <div className="skeleton-progress-info">
                        <motion.div
                            className="skeleton-progress-text"
                            animate={{ opacity: [0.5, 0.7, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                        />
                        <motion.div
                            className="skeleton-modules-text"
                            animate={{ opacity: [0.4, 0.6, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.45 }}
                        />
                    </div>
                    <motion.div
                        className="skeleton-progress-bar"
                        animate={{ opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                    />
                </div>

                {/* Actions Skeleton */}
                <div className="skeleton-actions">
                    <motion.div
                        className="skeleton-btn-primary"
                        animate={{ opacity: [0.5, 0.7, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.55 }}
                    />
                    <motion.div
                        className="skeleton-btn-secondary"
                        animate={{ opacity: [0.4, 0.6, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                    />
                </div>
            </div>
        </motion.div>
    );
};

export default CourseCard;
