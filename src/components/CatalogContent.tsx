/**
 * Catalog Content - Course Catalog Browser
 * Minimalistic professional design matching PathsContent/GoalsContent/UsersContent
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup, useMotionValue, useSpring, useInView } from 'motion/react';
import { createPortal } from 'react-dom';
import {
    getCatalogCourses,
    getCatalogStats,
    filterCoursesByCategory,
    sortCourses,
    searchCourses,
    enrollInCourse,
    categoryInfo,
    addToRecentlyViewed,
    getBookmarkedCourses,
    getRecentlyViewedCourses,
    toggleBookmark,
    type CatalogCourse,
    type CatalogStats,
    type CourseCategory,
    type SortOption,
} from '../services/catalogService';

// Animated Number Component (inline to avoid import issues)
const AnimatedNumber: React.FC<{ value: number; delay?: number; className?: string }> = ({ value, delay = 0, className }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, { damping: 60, stiffness: 100 });
    const isInView = useInView(ref, { once: true, margin: '0px' });

    useEffect(() => {
        if (isInView) {
            const timer = setTimeout(() => motionValue.set(value), delay * 1000);
            return () => clearTimeout(timer);
        }
    }, [motionValue, isInView, delay, value]);

    useEffect(() => {
        return springValue.on('change', (latest) => {
            if (ref.current) {
                ref.current.textContent = Math.round(latest).toString();
            }
        });
    }, [springValue]);

    return <span ref={ref} className={className} style={{ display: 'inline-block', fontVariantNumeric: 'tabular-nums' }}>0</span>;
};

// Category Icon Component
const CategoryIcon: React.FC<{ category: string; size?: number }> = ({ category, size = 20 }) => {
    const icons: Record<string, React.ReactNode> = {
        major: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
            </svg>
        ),
        ge: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
        ),
        pe: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
            </svg>
        ),
        nstp: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
        all: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
    };
    return <>{icons[category] || icons.all}</>;
};



// Skeleton Shimmer Animation
const shimmerAnimation = {
    initial: { backgroundPosition: '-200% 0' },
    animate: { backgroundPosition: '200% 0' },
};

// Skeleton Loading Component
const CatalogSkeleton: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    const colors = {
        cardBg: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        skeleton: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        shimmer: isDarkMode 
            ? 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.02) 100%)'
            : 'linear-gradient(90deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.02) 100%)',
    };

    const SkeletonBox: React.FC<{ width?: string; height?: string; borderRadius?: string; style?: React.CSSProperties }> = ({ 
        width = '100%', height = '16px', borderRadius = '6px', style 
    }) => (
        <motion.div
            initial="initial"
            animate="animate"
            variants={shimmerAnimation}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{
                width,
                height,
                borderRadius,
                background: colors.skeleton,
                backgroundImage: colors.shimmer,
                backgroundSize: '200% 100%',
                ...style,
            }}
        />
    );

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
            {/* Header Skeleton */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{ marginBottom: '28px' }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '18px 22px',
                    borderRadius: '14px',
                    background: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                }}>
                    {/* Icon Skeleton */}
                    <SkeletonBox width="46px" height="46px" borderRadius="12px" />
                    
                    {/* Title Skeleton */}
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <SkeletonBox width="140px" height="24px" borderRadius="6px" />
                            <SkeletonBox width="70px" height="20px" borderRadius="6px" />
                        </div>
                        <SkeletonBox width="280px" height="14px" borderRadius="4px" />
                    </div>
                    
                    {/* Stats Skeleton */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '10px 16px',
                                borderRadius: '10px',
                                background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                minWidth: '72px',
                            }}>
                                <SkeletonBox width="16px" height="16px" borderRadius="4px" style={{ marginBottom: '6px' }} />
                                <SkeletonBox width="24px" height="20px" borderRadius="4px" style={{ marginBottom: '4px' }} />
                                <SkeletonBox width="40px" height="10px" borderRadius="3px" />
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Search and Filter Skeleton */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}
            >
                <SkeletonBox width="300px" height="44px" borderRadius="12px" style={{ flex: 1, minWidth: '220px' }} />
                <div style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '12px', background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <SkeletonBox key={i} width="60px" height="32px" borderRadius="8px" />
                    ))}
                </div>
                <SkeletonBox width="140px" height="36px" borderRadius="10px" />
            </motion.div>

            {/* Course Cards Skeleton */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}
            >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                        style={{
                            background: colors.cardBg,
                            borderRadius: '16px',
                            border: `1px solid ${colors.border}`,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Image Skeleton */}
                        <SkeletonBox width="100%" height="140px" borderRadius="0" />
                        
                        {/* Content Skeleton */}
                        <div style={{ padding: '14px 16px' }}>
                            <SkeletonBox width="85%" height="16px" borderRadius="4px" style={{ marginBottom: '6px' }} />
                            <SkeletonBox width="60%" height="12px" borderRadius="3px" style={{ marginBottom: '14px' }} />
                            
                            {/* Instructor Skeleton */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                <SkeletonBox width="24px" height="24px" borderRadius="8px" />
                                <SkeletonBox width="120px" height="12px" borderRadius="3px" />
                            </div>
                            
                            {/* Stats Skeleton */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                paddingTop: '12px',
                                borderTop: `1px solid ${colors.border}`,
                            }}>
                                <SkeletonBox width="80px" height="12px" borderRadius="3px" />
                                <SkeletonBox width="40px" height="12px" borderRadius="3px" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

// Filter Tabs Component
const FilterTabs: React.FC<{
    activeFilter: CourseCategory | 'favorites';
    setActiveFilter: (filter: CourseCategory | 'favorites') => void;
    isDarkMode: boolean;
    stats: CatalogStats;
    colors: { accent: string; textSecondary: string };
    favoritesCount: number;
}> = ({ activeFilter, setActiveFilter, isDarkMode, stats, colors, favoritesCount }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 5, width: 60 });
    
    const tabs: { id: CourseCategory | 'favorites'; label: string; count: number; icon?: React.ReactNode }[] = [
        { id: 'all', label: 'All', count: stats.totalCourses },
        { id: 'favorites', label: 'Favorites', count: favoritesCount, icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill={activeFilter === 'favorites' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
        )},
        { id: 'major', label: 'Major', count: stats.majorCourses },
        { id: 'ge', label: 'GE', count: stats.geCourses },
        { id: 'pe', label: 'PE', count: stats.peCourses },
        { id: 'nstp', label: 'NSTP', count: stats.nstpCourses },
    ];

    useEffect(() => {
        if (!containerRef.current) return;
        const activeIndex = tabs.findIndex(t => t.id === activeFilter);
        const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button[data-filter-tab]');
        if (buttons[activeIndex]) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const buttonRect = buttons[activeIndex].getBoundingClientRect();
            setIndicatorStyle({ left: buttonRect.left - containerRect.left, width: buttonRect.width });
        }
    }, [activeFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!containerRef.current) return;
            const activeIndex = tabs.findIndex(t => t.id === activeFilter);
            const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button[data-filter-tab]');
            if (buttons[activeIndex]) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const buttonRect = buttons[activeIndex].getBoundingClientRect();
                setIndicatorStyle({ left: buttonRect.left - containerRect.left, width: buttonRect.width });
            }
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    return (
        <motion.div 
            ref={containerRef} 
            role="tablist"
            aria-label="Filter courses by category"
            initial={{ opacity: 0, x: 10 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.35, duration: 0.4 }}
            style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '12px', background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', position: 'relative' }}
        >
            <motion.div 
                aria-hidden="true"
                style={{ position: 'absolute', top: '4px', bottom: '4px', borderRadius: '8px', background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)', border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`, zIndex: 0 }}
                initial={false} 
                animate={{ left: indicatorStyle.left, width: indicatorStyle.width }} 
                transition={{ type: 'spring', stiffness: 500, damping: 35 }} 
            />
            {tabs.map((tab) => (
                <motion.button 
                    key={tab.id} 
                    role="tab"
                    aria-selected={activeFilter === tab.id}
                    aria-controls="course-grid"
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
                        outline: 'none',
                    }}
                >
                    {tab.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{tab.icon}</span>}
                    {tab.label}
                    <span aria-label={`${tab.count} courses`} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '10px', background: activeFilter === tab.id ? 'rgba(59, 130, 246, 0.2)' : isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                        {tab.count}
                    </span>
                </motion.button>
            ))}
        </motion.div>
    );
};


// Course Card Component - Minimalistic Blue Design inspired by Home CourseCard
const CourseCard: React.FC<{
    course: CatalogCourse;
    index: number;
    isDarkMode: boolean;
    colors: { cardBg: string; border: string; textPrimary: string; textSecondary: string; textMuted: string };
    onClick: (course: CatalogCourse) => void;
    isBookmarked: boolean;
    onToggleBookmark: (courseId: string) => void;
}> = ({ course, index, isDarkMode, colors, onClick, isBookmarked, onToggleBookmark }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [instructorHovered, setInstructorHovered] = useState(false);
    const [bookmarkHovered, setBookmarkHovered] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });
    const cardRef = useRef<HTMLDivElement>(null);
    const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Blue color scheme
    const blueAccent = '#3b82f6';
    const blueBg = isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)';
    const blueBorder = isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)';

    // Show preview after a delay on hover
    useEffect(() => {
        if (isHovered && !instructorHovered && !bookmarkHovered) {
            previewTimeoutRef.current = setTimeout(() => {
                if (cardRef.current) {
                    const rect = cardRef.current.getBoundingClientRect();
                    setPreviewPosition({
                        top: rect.bottom + window.scrollY + 8,
                        left: rect.left + rect.width / 2 + window.scrollX,
                    });
                }
                setShowPreview(true);
            }, 600);
        } else {
            if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
            setShowPreview(false);
        }
        return () => { if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current); };
    }, [isHovered, instructorHovered, bookmarkHovered]);
    
    return (
        <motion.div
            ref={cardRef}
            layout
            layoutId={`catalog-course-${course.id}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
                layout: { type: 'spring', stiffness: 350, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 }
            }}
            whileHover={{ y: -4, transition: { duration: 0.15, ease: 'easeOut' } }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={() => onClick(course)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(course); } }}
            role="article"
            aria-label={`${course.title} - ${course.subtitle}. ${course.modules} modules, ${course.enrolledCount} students enrolled. ${course.enrolled ? 'You are enrolled.' : ''} Instructor: ${course.instructor}`}
            tabIndex={0}
            style={{
                position: 'relative',
                background: colors.cardBg,
                borderRadius: '16px',
                border: `1px solid ${isHovered ? blueBorder : colors.border}`,
                overflow: 'visible',
                cursor: 'pointer',
                boxShadow: isHovered 
                    ? (isDarkMode ? '0 8px 30px rgba(59, 130, 246, 0.15)' : '0 8px 30px rgba(59, 130, 246, 0.1)')
                    : (isDarkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.04)'),
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                outline: 'none',
            }}
            onFocus={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
        >
            {/* Course Image */}
            <div style={{ position: 'relative', height: '140px', overflow: 'hidden' }}>
                <div style={{
                    transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                    transition: 'transform 0.2s ease-out',
                    width: '100%',
                    height: '100%',
                }}>
                    <img 
                        src={course.image} 
                        alt={course.title} 
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            opacity: imageLoaded ? 1 : 0,
                            transition: 'opacity 0.2s ease-out',
                        }}
                        onLoad={() => setImageLoaded(true)}
                    />
                    {!imageLoaded && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: isDarkMode ? '#1e293b' : '#f1f5f9',
                        }} />
                    )}
                </div>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />
                
                {/* Instructor Avatar */}
                <div
                    style={{ position: 'absolute', bottom: '10px', left: '10px' }}
                    onMouseEnter={() => setInstructorHovered(true)}
                    onMouseLeave={() => setInstructorHovered(false)}
                >
                    <motion.div
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid rgba(255,255,255,0.9)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>
                            {course.instructor.charAt(0).toUpperCase()}
                        </span>
                    </motion.div>
                    
                    {/* Instructor Tooltip */}
                    <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '0',
                        marginBottom: '8px',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: isDarkMode ? '#1e293b' : 'white',
                        border: `1px solid ${colors.border}`,
                        boxShadow: isDarkMode ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.1)',
                        opacity: instructorHovered ? 1 : 0,
                        transform: instructorHovered ? 'translateY(0)' : 'translateY(4px)',
                        transition: 'opacity 0.15s ease, transform 0.15s ease',
                        pointerEvents: instructorHovered ? 'auto' : 'none',
                        whiteSpace: 'nowrap',
                        zIndex: 10,
                    }}>
                        <div style={{ fontSize: '9px', fontWeight: 500, color: blueAccent, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Instructor</div>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: colors.textPrimary }}>{course.instructor}</div>
                    </div>
                </div>
                
                {/* Category Badge - Blue themed */}
                <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: Math.min(index * 0.03, 0.15) + 0.1 }}
                    style={{ 
                        position: 'absolute', 
                        top: '10px', 
                        right: '10px', 
                        padding: '5px 10px', 
                        borderRadius: '8px', 
                        background: 'rgba(255,255,255,0.95)', 
                        backdropFilter: 'blur(8px)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '5px',
                        border: `1px solid ${blueBorder}`,
                    }}
                >
                    <div style={{ color: blueAccent }}><CategoryIcon category={course.category} size={11} /></div>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: blueAccent }}>{categoryInfo[course.category].label}</span>
                </motion.div>

                {/* Bookmark Button */}
                <div
                    style={{ position: 'absolute', top: '10px', left: '10px' }}
                    onMouseEnter={() => setBookmarkHovered(true)}
                    onMouseLeave={() => setBookmarkHovered(false)}
                >
                    <motion.button
                        onClick={(e) => { e.stopPropagation(); onToggleBookmark(course.id); }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={isBookmarked ? 'Remove from favorites' : 'Add to favorites'}
                        style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(8px)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                    >
                        <svg 
                            width="14" 
                            height="14" 
                            viewBox="0 0 24 24" 
                            fill={isBookmarked ? blueAccent : 'none'} 
                            stroke={blueAccent} 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                    </motion.button>
                    
                    {/* Bookmark Tooltip */}
                    <AnimatePresence>
                        {bookmarkHovered && (
                            <motion.div
                                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: '0',
                                    marginTop: '6px',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    background: 'white',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    whiteSpace: 'nowrap',
                                    zIndex: 20,
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    color: blueAccent,
                                }}
                            >
                                {isBookmarked ? 'Remove from favorites' : 'Add to favorites'}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Card Body */}
            <div style={{ padding: '14px 16px' }}>
                {/* Title Section */}
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                        <h3 style={{ 
                            margin: 0, 
                            fontSize: '14px', 
                            fontWeight: 600, 
                            color: colors.textPrimary, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            flex: 1,
                        }}>
                            {course.title}
                        </h3>
                        {course.enrolled && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                transition={{ delay: Math.min(index * 0.03, 0.15) + 0.15, type: 'spring', stiffness: 400 }}
                                style={{ 
                                    padding: '3px 8px', 
                                    borderRadius: '6px', 
                                    background: blueBg,
                                    border: `1px solid ${blueBorder}`,
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '4px',
                                    flexShrink: 0,
                                }}
                            >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                <span style={{ fontSize: '9px', fontWeight: 600, color: blueAccent }}>Enrolled</span>
                            </motion.div>
                        )}
                    </div>
                    <p style={{ margin: 0, fontSize: '11px', color: colors.textMuted }}>{course.subtitle}</p>
                </div>

                {/* Stats Section - Blue themed */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: blueBg,
                    marginBottom: '12px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textPrimary }}>{course.modules}</span>
                        <span style={{ fontSize: '10px', color: colors.textMuted }}>modules</span>
                    </div>
                    <div style={{ width: '1px', height: '16px', background: colors.border }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                        </svg>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textPrimary }}>{course.enrolledCount}</span>
                    </div>
                </div>

                {/* Action Button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        border: 'none',
                        background: isHovered ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : blueBg,
                        color: isHovered ? 'white' : blueAccent,
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                    }}
                    onClick={(e) => { e.stopPropagation(); onClick(course); }}
                >
                    <span>{course.enrolled ? 'Continue' : 'View Course'}</span>
                    <motion.svg 
                        width="14" 
                        height="14" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        animate={{ x: isHovered ? 2 : 0 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                    >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </motion.svg>
                </motion.button>
            </div>

            {/* Quick Preview Tooltip - Rendered via Portal */}
            {createPortal(
                <AnimatePresence>
                    {showPreview && (
                        <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.92 }}
                            animate={{ 
                                opacity: 1, 
                                y: 0, 
                                scale: 1,
                                transition: {
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 25,
                                    mass: 0.8,
                                    opacity: { duration: 0.2, ease: 'easeOut' }
                                }
                            }}
                            exit={{ 
                                opacity: 0, 
                                y: 8, 
                                scale: 0.95,
                                transition: {
                                    duration: 0.15,
                                    ease: [0.4, 0, 1, 1]
                                }
                            }}
                            style={{
                                position: 'absolute',
                                top: previewPosition.top,
                                left: previewPosition.left,
                                transform: 'translateX(-50%)',
                                width: '280px',
                                padding: '14px',
                                borderRadius: '14px',
                                background: isDarkMode ? '#1e293b' : 'white',
                                border: `1px solid ${blueBorder}`,
                                boxShadow: isDarkMode 
                                    ? '0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(59, 130, 246, 0.1)' 
                                    : '0 12px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(59, 130, 246, 0.08)',
                                zIndex: 9999,
                                pointerEvents: 'none',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Preview Header */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                marginBottom: '10px',
                                paddingBottom: '10px',
                                borderBottom: `1px solid ${colors.border}`,
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2" aria-hidden="true">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4M12 8h.01" />
                                </svg>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: blueAccent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Quick Preview
                                </span>
                            </div>

                            {/* Description */}
                            <p style={{ 
                                margin: 0, 
                                fontSize: '12px', 
                                color: colors.textSecondary, 
                                lineHeight: 1.5,
                                marginBottom: '12px',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }}>
                                {course.description}
                            </p>

                            {/* Learning Outcomes Preview */}
                            {course.learningOutcomes.length > 0 && (
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 600, color: blueAccent, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                        What you'll learn
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {course.learningOutcomes.slice(0, 2).map((outcome, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2.5" style={{ marginTop: '3px', flexShrink: 0 }}>
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                                <span style={{ fontSize: '11px', color: colors.textMuted, lineHeight: 1.4 }}>{outcome}</span>
                                            </div>
                                        ))}
                                        {course.learningOutcomes.length > 2 && (
                                            <span style={{ fontSize: '10px', color: blueAccent, fontWeight: 500 }}>
                                                +{course.learningOutcomes.length - 2} more...
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            {course.tags.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {course.tags.slice(0, 3).map((tag) => (
                                        <span 
                                            key={tag}
                                            style={{ 
                                                padding: '3px 8px', 
                                                borderRadius: '6px', 
                                                background: blueBg,
                                                fontSize: '10px', 
                                                fontWeight: 500,
                                                color: blueAccent,
                                            }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Click hint */}
                            <div style={{ 
                                marginTop: '10px', 
                                paddingTop: '10px', 
                                borderTop: `1px solid ${colors.border}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                            }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2">
                                    <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                </svg>
                                <span style={{ fontSize: '10px', color: colors.textMuted }}>Click to view full details</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </motion.div>
    );
};


// Course List Item Component - For List View
const CourseListItem: React.FC<{
    course: CatalogCourse;
    index: number;
    isDarkMode: boolean;
    colors: { cardBg: string; border: string; textPrimary: string; textSecondary: string; textMuted: string };
    onClick: (course: CatalogCourse) => void;
    isBookmarked: boolean;
    onToggleBookmark: (courseId: string) => void;
}> = ({ course, index, isDarkMode, colors, onClick, isBookmarked, onToggleBookmark }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });
    const listItemRef = useRef<HTMLDivElement>(null);
    const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const blueAccent = '#3b82f6';
    const blueBg = isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)';
    const blueBorder = isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)';

    // Show preview after a delay on hover
    useEffect(() => {
        if (isHovered) {
            previewTimeoutRef.current = setTimeout(() => {
                if (listItemRef.current) {
                    const rect = listItemRef.current.getBoundingClientRect();
                    setPreviewPosition({
                        top: rect.bottom + window.scrollY + 8,
                        left: rect.left + 80 + window.scrollX,
                    });
                }
                setShowPreview(true);
            }, 600);
        } else {
            if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
            setShowPreview(false);
        }
        return () => { if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current); };
    }, [isHovered]);

    return (
        <motion.div
            ref={listItemRef}
            layout
            layoutId={`catalog-list-${course.id}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ delay: Math.min(index * 0.03, 0.15), duration: 0.2 }}
            whileHover={{ x: 4, transition: { duration: 0.15 } }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={() => onClick(course)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(course); } }}
            role="article"
            aria-label={`${course.title} - ${course.subtitle}. ${course.modules} modules, ${course.enrolledCount} students.`}
            tabIndex={0}
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '14px 18px',
                borderRadius: '14px',
                background: colors.cardBg,
                border: `1px solid ${isHovered ? blueBorder : colors.border}`,
                cursor: 'pointer',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                boxShadow: isHovered 
                    ? (isDarkMode ? '0 4px 16px rgba(59, 130, 246, 0.1)' : '0 4px 16px rgba(59, 130, 246, 0.08)')
                    : 'none',
            }}
        >
            {/* Course Image */}
            <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '12px',
                overflow: 'hidden',
                flexShrink: 0,
                position: 'relative',
            }}>
                <img 
                    src={course.image} 
                    alt={course.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                {/* Bookmark Button */}
                <motion.button
                    onClick={(e) => { e.stopPropagation(); onToggleBookmark(course.id); }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={isBookmarked ? 'Remove from favorites' : 'Add to favorites'}
                    style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'rgba(255,255,255,0.95)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill={isBookmarked ? blueAccent : 'none'} stroke={blueAccent} strokeWidth="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                </motion.button>
            </div>

            {/* Course Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ 
                        margin: 0, 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: colors.textPrimary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {course.title}
                    </h3>
                    {course.enrolled && (
                        <span style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: blueBg,
                            border: `1px solid ${blueBorder}`,
                            fontSize: '9px',
                            fontWeight: 600,
                            color: blueAccent,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                        }}>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                            Enrolled
                        </span>
                    )}
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: colors.textMuted, marginBottom: '6px' }}>{course.subtitle}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11px', color: blueAccent, fontWeight: 500 }}>{categoryInfo[course.category].label}</span>
                    <span style={{ fontSize: '11px', color: colors.textMuted }}>•</span>
                    <span style={{ fontSize: '11px', color: colors.textMuted }}>{course.instructor}</span>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: colors.textPrimary }}>{course.modules}</span>
                    <span style={{ fontSize: '10px', color: colors.textMuted }}>modules</span>
                </div>
                <div style={{ width: '1px', height: '20px', background: colors.border }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: colors.textPrimary }}>{course.enrolledCount}</span>
                </div>
            </div>

            {/* Action Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => { e.stopPropagation(); onClick(course); }}
                style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isHovered ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : blueBg,
                    color: isHovered ? 'white' : blueAccent,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                }}
            >
                {course.enrolled ? 'Continue' : 'View'}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
            </motion.button>

            {/* Quick Preview Tooltip for List View - Rendered via Portal */}
            {createPortal(
                <AnimatePresence>
                    {showPreview && (
                        <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.92 }}
                            animate={{ 
                                opacity: 1, 
                                y: 0, 
                                scale: 1,
                                transition: {
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 25,
                                    mass: 0.8,
                                    opacity: { duration: 0.2, ease: 'easeOut' }
                                }
                            }}
                            exit={{ 
                                opacity: 0, 
                                y: 8, 
                                scale: 0.95,
                                transition: {
                                    duration: 0.15,
                                    ease: [0.4, 0, 1, 1]
                                }
                            }}
                            style={{
                                position: 'absolute',
                                top: previewPosition.top,
                                left: previewPosition.left,
                                width: '320px',
                                padding: '14px',
                                borderRadius: '14px',
                                background: isDarkMode ? '#1e293b' : 'white',
                                border: `1px solid ${blueBorder}`,
                                boxShadow: isDarkMode 
                                    ? '0 12px 32px rgba(0,0,0,0.4)' 
                                    : '0 12px 32px rgba(0,0,0,0.12)',
                                zIndex: 9999,
                                pointerEvents: 'none',
                            }}
                        >
                            {/* Preview Header */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                marginBottom: '10px',
                                paddingBottom: '10px',
                                borderBottom: `1px solid ${colors.border}`,
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4M12 8h.01" />
                                </svg>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: blueAccent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Quick Preview
                                </span>
                            </div>

                            {/* Description */}
                            <p style={{ 
                                margin: 0, 
                                fontSize: '12px', 
                                color: colors.textSecondary, 
                                lineHeight: 1.5,
                                marginBottom: '12px',
                            }}>
                                {course.description}
                            </p>

                            {/* Tags */}
                            {course.tags.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {course.tags.map((tag) => (
                                        <span 
                                            key={tag}
                                            style={{ 
                                                padding: '3px 8px', 
                                                borderRadius: '6px', 
                                                background: blueBg,
                                                fontSize: '10px', 
                                                fontWeight: 500,
                                                color: blueAccent,
                                            }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </motion.div>
    );
};


// Course Detail Modal - Minimalistic Blue Design (matching Users/Goals modals)
const CourseDetailModal: React.FC<{
    course: CatalogCourse | null;
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
    onEnroll: (courseId: string) => void;
}> = ({ course, isOpen, onClose, isDarkMode, onEnroll }) => {
    const blueAccent = '#3b82f6';
    const blueBg = isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)';
    const blueBorder = isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)';
    
    const colors = {
        bg: isDarkMode ? '#0f172a' : '#ffffff',
        cardBg: isDarkMode ? '#1e293b' : '#f8fafc',
        border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        textPrimary: isDarkMode ? '#f1f5f9' : '#0f172a',
        textSecondary: isDarkMode ? '#94a3b8' : '#475569',
        textMuted: isDarkMode ? '#64748b' : '#94a3b8',
        accent: blueAccent,
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!course) return null;

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
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', zIndex: 9998 }} 
                    />
                    
                    {/* Modal Container */}
                    <div 
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="course-modal-title"
                        aria-describedby="course-modal-description"
                        style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, pointerEvents: 'none', padding: '20px' }}
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            style={{ 
                                width: '100%', 
                                maxWidth: '480px', 
                                maxHeight: '85vh', 
                                background: colors.bg, 
                                borderRadius: '20px', 
                                boxShadow: isDarkMode ? '0 24px 48px rgba(0, 0, 0, 0.4)' : '0 24px 48px rgba(0, 0, 0, 0.15)', 
                                overflow: 'hidden', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                pointerEvents: 'auto' 
                            }}
                        >
                            {/* Course Image */}
                            <div style={{ position: 'relative', height: '140px', overflow: 'hidden', flexShrink: 0 }}>
                                <img 
                                    src={course.image} 
                                    alt={course.title} 
                                    style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'cover',
                                    }} 
                                />
                                <div style={{ 
                                    position: 'absolute', 
                                    inset: 0, 
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)' 
                                }} />
                                
                                {/* Close Button on Image */}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onClose}
                                    aria-label="Close course details"
                                    style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: 'rgba(255,255,255,0.9)',
                                        backdropFilter: 'blur(8px)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#64748b',
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </motion.button>

                                {/* Category Badge on Image */}
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 }}
                                    style={{
                                        position: 'absolute',
                                        bottom: '12px',
                                        left: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '5px 10px',
                                        borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.95)',
                                        backdropFilter: 'blur(8px)',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: blueAccent,
                                    }}
                                >
                                    <CategoryIcon category={course.category} size={12} />
                                    {categoryInfo[course.category].label}
                                </motion.div>

                                {/* Enrolled Badge on Image */}
                                {course.enrolled && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                        style={{
                                            position: 'absolute',
                                            bottom: '12px',
                                            right: '16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '5px 10px',
                                            borderRadius: '8px',
                                            background: 'rgba(255,255,255,0.95)',
                                            backdropFilter: 'blur(8px)',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: blueAccent,
                                        }}
                                    >
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Enrolled
                                    </motion.div>
                                )}
                            </div>

                            {/* Header */}
                            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${colors.border}` }}>
                                <h2 id="course-modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: colors.textPrimary, marginBottom: '4px' }}>
                                    {course.title}
                                </h2>
                                <p id="course-modal-description" style={{ margin: 0, fontSize: '12px', color: colors.textMuted }}>
                                    {course.subtitle}
                                </p>
                            </div>

                            {/* Content */}
                            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                                {/* Stats Row - Blue themed */}
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '8px', 
                                    marginBottom: '20px' 
                                }}>
                                    {[
                                        { value: course.modules, label: 'Modules', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> },
                                        { value: course.enrolledCount, label: 'Students', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg> },
                                        { value: `~${course.modules * 2}h`, label: 'Duration', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
                                    ].map((stat, i) => (
                                        <motion.div
                                            key={stat.label}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.15 + i * 0.05 }}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                borderRadius: '12px',
                                                background: blueBg,
                                                border: `1px solid ${blueBorder}`,
                                                textAlign: 'center',
                                            }}
                                        >
                                            <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
                                            <div style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary }}>{stat.value}</div>
                                            <div style={{ fontSize: '10px', color: colors.textMuted }}>{stat.label}</div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Instructor - Blue themed */}
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '12px', 
                                        padding: '12px 14px',
                                        borderRadius: '12px',
                                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                        marginBottom: '20px',
                                    }}
                                >
                                    <div style={{ 
                                        width: '40px', 
                                        height: '40px', 
                                        borderRadius: '12px', 
                                        background: `linear-gradient(135deg, ${blueAccent} 0%, #2563eb 100%)`,
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                    }}>
                                        {course.instructor.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 500, color: colors.textPrimary }}>{course.instructor}</div>
                                        <div style={{ fontSize: '11px', color: blueAccent }}>Instructor</div>
                                    </div>
                                </motion.div>

                                {/* Description */}
                                <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: blueAccent, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        About this course
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary, lineHeight: 1.6 }}>
                                        {course.description}
                                    </p>
                                </div>

                                {/* Learning Outcomes - Blue checkmarks */}
                                <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: blueAccent, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        What you'll learn
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {course.learningOutcomes.map((outcome, i) => (
                                            <motion.div 
                                                key={i} 
                                                initial={{ opacity: 0, x: -10 }} 
                                                animate={{ opacity: 1, x: 0 }} 
                                                transition={{ delay: 0.35 + i * 0.05 }} 
                                                style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}
                                            >
                                                <div style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    borderRadius: '6px',
                                                    background: blueBg,
                                                    border: `1px solid ${blueBorder}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    marginTop: '1px',
                                                }}>
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="3">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                </div>
                                                <span style={{ fontSize: '12px', color: colors.textSecondary, lineHeight: 1.5 }}>{outcome}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tags - Blue themed */}
                                {course.tags.length > 0 && (
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: blueAccent, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Topics
                                        </h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {course.tags.map((tag, i) => (
                                                <motion.span 
                                                    key={tag} 
                                                    initial={{ opacity: 0, scale: 0.8 }} 
                                                    animate={{ opacity: 1, scale: 1 }} 
                                                    transition={{ delay: 0.4 + i * 0.03 }}
                                                    style={{ 
                                                        padding: '5px 10px', 
                                                        borderRadius: '8px', 
                                                        background: blueBg,
                                                        border: `1px solid ${blueBorder}`,
                                                        fontSize: '11px', 
                                                        fontWeight: 500,
                                                        color: blueAccent,
                                                    }}
                                                >
                                                    {tag}
                                                </motion.span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer - Blue button */}
                            <div style={{ padding: '16px 24px', borderTop: `1px solid ${colors.border}` }}>
                                <motion.button 
                                    whileHover={{ scale: 1.02 }} 
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => course.enrolled ? onClose() : onEnroll(course.id)}
                                    style={{ 
                                        width: '100%',
                                        padding: '12px', 
                                        borderRadius: '12px', 
                                        border: 'none', 
                                        background: `linear-gradient(135deg, ${blueAccent} 0%, #2563eb 100%)`,
                                        color: 'white', 
                                        fontSize: '14px', 
                                        fontWeight: 600, 
                                        cursor: 'pointer', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        gap: '8px',
                                        boxShadow: `0 4px 12px ${blueAccent}30`,
                                    }}
                                >
                                    {course.enrolled ? (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                            Continue Learning
                                        </>
                                    ) : (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                            Enroll Now
                                        </>
                                    )}
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


// Main CatalogContent Component - Matching PathsContent layout exactly
const CatalogContent: React.FC = () => {
    const [courses, setCourses] = useState<CatalogCourse[]>([]);
    const [stats, setStats] = useState<CatalogStats>({ totalCourses: 0, enrolledCourses: 0, majorCourses: 0, geCourses: 0, peCourses: 0, nstpCourses: 0, totalStudents: 0 });
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<CourseCategory | 'favorites'>('all');
    const [sortBy, setSortBy] = useState<SortOption>('recent');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourse, setSelectedCourse] = useState<CatalogCourse | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchSuggestions, setSearchSuggestions] = useState<CatalogCourse[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const [bookmarks, setBookmarks] = useState<string[]>([]);
    const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
    const [recentlyViewedExpanded, setRecentlyViewedExpanded] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [displayCount, setDisplayCount] = useState(8); // Pagination: courses to display
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    
    const [isDarkMode, setIsDarkMode] = useState(() => document.body.classList.contains('dark-mode'));

    useEffect(() => {
        const checkDarkMode = () => setIsDarkMode(document.body.classList.contains('dark-mode'));
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const colors = {
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
        cardBg: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        textPrimary: isDarkMode ? '#f1f5f9' : '#0f172a',
        textSecondary: isDarkMode ? '#94a3b8' : '#64748b',
        textMuted: isDarkMode ? '#94a3b8' : '#475569',
        accent: '#3b82f6',
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const [coursesData, statsData] = await Promise.all([getCatalogCourses(), getCatalogStats()]);
            setCourses(coursesData);
            setStats(statsData);
            setBookmarks(getBookmarkedCourses());
            setRecentlyViewed(getRecentlyViewedCourses());
            setLoading(false);
        };
        loadData();
    }, []);

    // Handle bookmark toggle
    const handleToggleBookmark = (courseId: string) => {
        toggleBookmark(courseId);
        setBookmarks(getBookmarkedCourses());
    };

    // Search with suggestions
    useEffect(() => {
        if (!searchQuery.trim()) {
            setIsSearching(false);
            setSearchSuggestions([]);
            setShowSuggestions(false);
            setSelectedSuggestionIndex(-1);
            return;
        }
        
        setIsSearching(true);
        const timer = setTimeout(() => {
            const results = searchCourses(courses, searchQuery);
            setSearchSuggestions(results.slice(0, 5));
            setShowSuggestions(results.length > 0);
            setIsSearching(false);
        }, 150);
        
        return () => clearTimeout(timer);
    }, [searchQuery, courses]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current && 
                !suggestionsRef.current.contains(event.target as Node) &&
                searchInputRef.current &&
                !searchInputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
                setSelectedSuggestionIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard shortcuts: / to focus search, Esc to clear
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input/textarea or modal is open
            const target = e.target as HTMLElement;
            const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
            
            // "/" to focus search (only when not typing)
            if (e.key === '/' && !isTyping && !isModalOpen) {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            
            // "Escape" to clear search and blur (when search is focused)
            if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
                e.preventDefault();
                if (searchQuery) {
                    setSearchQuery('');
                    setShowSuggestions(false);
                    setSelectedSuggestionIndex(-1);
                } else {
                    searchInputRef.current?.blur();
                }
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [searchQuery, isModalOpen]);

    // Handle keyboard navigation for suggestions
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || searchSuggestions.length === 0) return;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedSuggestionIndex(prev => prev < searchSuggestions.length - 1 ? prev + 1 : 0);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : searchSuggestions.length - 1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedSuggestionIndex >= 0) {
                    const selected = searchSuggestions[selectedSuggestionIndex];
                    handleCourseClick(selected);
                    setShowSuggestions(false);
                    setSelectedSuggestionIndex(-1);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedSuggestionIndex(-1);
                break;
        }
    };

    // Handle suggestion click
    const handleSuggestionClick = (course: CatalogCourse) => {
        handleCourseClick(course);
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
    };

    const filteredCourses = useMemo(() => {
        let result = courses;
        
        // Handle favorites filter separately
        if (activeFilter === 'favorites') {
            result = courses.filter(course => bookmarks.includes(course.id));
        } else {
            result = filterCoursesByCategory(courses, activeFilter);
        }
        
        result = searchCourses(result, searchQuery);
        result = sortCourses(result, sortBy);
        return result;
    }, [courses, activeFilter, searchQuery, sortBy, bookmarks]);

    // Paginated courses - only show displayCount items
    const paginatedCourses = useMemo(() => {
        return filteredCourses.slice(0, displayCount);
    }, [filteredCourses, displayCount]);

    const hasMoreCourses = filteredCourses.length > displayCount;
    const remainingCourses = filteredCourses.length - displayCount;

    // Reset pagination when filters change
    useEffect(() => {
        setDisplayCount(8);
    }, [activeFilter, searchQuery, sortBy]);

    // Load more courses handler
    const handleLoadMore = () => {
        setIsLoadingMore(true);
        // Simulate loading delay for smooth UX
        setTimeout(() => {
            setDisplayCount(prev => Math.min(prev + 8, filteredCourses.length));
            setIsLoadingMore(false);
        }, 300);
    };

    const handleCourseClick = (course: CatalogCourse) => { 
        addToRecentlyViewed(course.id); // Track recently viewed
        setRecentlyViewed(getRecentlyViewedCourses()); // Update state
        setSelectedCourse(course); 
        setIsModalOpen(true); 
    };
    const handleEnroll = async (courseId: string) => { await enrollInCourse(courseId); const updated = await getCatalogCourses(); setCourses(updated); setIsModalOpen(false); };

    // Show skeleton while loading
    if (loading) {
        return <CatalogSkeleton isDarkMode={isDarkMode} />;
    }

    return (
        <main 
            role="main" 
            aria-label="Course Catalog"
            style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}
        >
            {/* Header Section - Matching PathsContent exactly */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} style={{ marginBottom: '28px' }}>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                    style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 22px', borderRadius: '14px', background: colors.cardBg, border: `1px solid ${colors.border}`, boxShadow: isDarkMode ? '0 2px 12px rgba(0,0,0,0.15)' : '0 2px 12px rgba(0,0,0,0.04)' }}>
                    {/* Icon */}
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} whileHover={{ scale: 1.08, transition: { duration: 0.2 } }}
                        style={{ width: '46px', height: '46px', borderRadius: '12px', background: isDarkMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
                        </svg>
                    </motion.div>

                    {/* Title & Description */}
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: colors.textPrimary, letterSpacing: '-0.3px' }}>Course Catalog</h1>
                            <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25, duration: 0.3 }}
                                style={{ fontSize: '10px', fontWeight: 600, color: '#3b82f6', background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                {stats.totalCourses} Course{stats.totalCourses !== 1 ? 's' : ''}
                            </motion.span>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary, fontWeight: 400 }}>Explore and discover courses to enhance your learning journey</p>
                    </motion.div>

                    {/* Quick Stats Cards */}
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} style={{ display: 'flex', alignItems: 'stretch', gap: '10px' }}>
                        {[
                            { label: 'Total', value: stats.totalCourses, description: 'Courses', color: '#3b82f6', bgColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.06)', icon: 'all' },
                            { label: 'Students', value: stats.totalStudents, description: 'Enrolled', color: '#10b981', bgColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.06)', icon: 'students' },
                            { label: 'Major', value: stats.majorCourses, description: 'Subjects', color: '#8b5cf6', bgColor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.06)', icon: 'major' },
                            { label: 'GE', value: stats.geCourses, description: 'General', color: '#f59e0b', bgColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.06)', icon: 'ge' },
                        ].map((stat, i) => (
                            <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.05, duration: 0.3 }} whileHover={{ y: -2, scale: 1.02, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 16px', borderRadius: '10px', background: stat.bgColor, cursor: 'default', minWidth: '72px' }} title={`${stat.label}: ${stat.value}`}>
                                <div style={{ color: stat.color, marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {stat.icon === 'students' ? (
                                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                    ) : (
                                        <CategoryIcon category={stat.icon} size={16} />
                                    )}
                                </div>
                                <span style={{ fontSize: '18px', fontWeight: 700, color: stat.color, lineHeight: 1, marginBottom: '2px' }}>
                                    <AnimatedNumber value={stat.value} delay={0.3 + i * 0.1} />
                                </span>
                                <span style={{ fontSize: '10px', fontWeight: 500, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{stat.description}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </motion.div>


            {/* Search and Filter - Matching PathsContent */}
            <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ 
                    layout: { type: 'spring', stiffness: 400, damping: 30 },
                    delay: 0.25, 
                    duration: 0.4, 
                    ease: [0.22, 1, 0.36, 1] 
                }}
                style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}
            >
                {/* Search */}
                <motion.div 
                    layout
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ 
                        layout: { type: 'spring', stiffness: 400, damping: 30 },
                        opacity: { delay: 0.3, duration: 0.4 },
                        x: { delay: 0.3, duration: 0.4 }
                    }} 
                    style={{ flex: 1, minWidth: '220px', position: 'relative' }}
                >
                    <div style={{ position: 'absolute', left: '14px', top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 1 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                    </div>
                    <input 
                        ref={searchInputRef}
                        type="text"
                        id="course-search"
                        name="course-search"
                        aria-label="Search courses"
                        aria-describedby="search-instructions"
                        aria-expanded={showSuggestions}
                        aria-controls={showSuggestions ? "search-suggestions" : undefined}
                        aria-autocomplete="list"
                        role="combobox"
                        placeholder="Search courses, instructors, or topics..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        onFocus={() => { if (searchSuggestions.length > 0) setShowSuggestions(true); }}
                        style={{ width: '100%', padding: '12px 40px 12px 42px', borderRadius: '12px', border: `1px solid ${colors.border}`, background: colors.cardBg, color: colors.textPrimary, fontSize: '13px', fontWeight: 400, outline: 'none', transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)' }}
                    />
                    <span id="search-instructions" className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
                        Use arrow keys to navigate suggestions, Enter to select, Escape to close
                    </span>
                    <AnimatePresence>
                        {isSearching && (
                            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }}
                                style={{ position: 'absolute', right: '14px', top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '100%' }}>
                                <motion.svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: 'block' }} animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}>
                                    <circle cx="8" cy="8" r="6" stroke={isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'} strokeWidth="2" fill="none" />
                                    <circle cx="8" cy="8" r="6" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeDasharray="28" strokeDashoffset="21" fill="none" />
                                </motion.svg>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {/* Clear Search Button */}
                    <AnimatePresence>
                        {searchQuery && !isSearching && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15 }}
                                style={{ position: 'absolute', right: '12px', top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <motion.button 
                                    onClick={() => setSearchQuery('')}
                                    aria-label="Clear search (Esc)"
                                    title="Clear search (Esc)"
                                    style={{ background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '6px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                                    whileHover={{ scale: 1.1 }} 
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {/* Keyboard Shortcut Hint */}
                    <AnimatePresence>
                        {!searchQuery && !isSearching && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15 }}
                                style={{ 
                                    position: 'absolute', 
                                    right: '12px', 
                                    top: 0, 
                                    bottom: 0, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    pointerEvents: 'none',
                                }}
                            >
                                <div 
                                    style={{ 
                                        padding: '4px 8px', 
                                        borderRadius: '6px', 
                                        background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', 
                                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                                        fontSize: '11px', 
                                        fontWeight: 500, 
                                        color: colors.textMuted,
                                        fontFamily: 'monospace',
                                    }}
                                    title="Press / to search"
                                >
                                    /
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {/* Search Suggestions Dropdown */}
                    <AnimatePresence>
                        {showSuggestions && searchSuggestions.length > 0 && (
                            <motion.div
                                ref={suggestionsRef}
                                id="search-suggestions"
                                role="listbox"
                                aria-label="Search suggestions"
                                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    marginTop: '4px',
                                    background: colors.cardBg,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '10px',
                                    boxShadow: isDarkMode ? '0 6px 20px rgba(0,0,0,0.4)' : '0 6px 20px rgba(0,0,0,0.1)',
                                    zIndex: 50,
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Suggestions Header */}
                                <div style={{
                                    padding: '6px 10px',
                                    borderBottom: `1px solid ${colors.border}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                    <span style={{ fontSize: '9px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Suggestions
                                    </span>
                                    <span style={{ fontSize: '9px', color: colors.textMuted }}>
                                        ↑↓ · Enter
                                    </span>
                                </div>
                                
                                {/* Suggestion Items */}
                                {searchSuggestions.map((course, index) => {
                                    const catInfo = categoryInfo[course.category];
                                    const isSelected = index === selectedSuggestionIndex;
                                    
                                    return (
                                        <motion.div
                                            key={course.id}
                                            role="option"
                                            aria-selected={isSelected}
                                            id={`suggestion-${course.id}`}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.02, duration: 0.1 }}
                                            onClick={() => handleSuggestionClick(course)}
                                            onMouseEnter={() => setSelectedSuggestionIndex(index)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '6px 10px',
                                                cursor: 'pointer',
                                                background: isSelected ? (isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)') : 'transparent',
                                                borderLeft: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
                                                transition: 'all 0.1s ease',
                                            }}
                                        >
                                            {/* Course Image */}
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '6px',
                                                overflow: 'hidden',
                                                flexShrink: 0,
                                            }}>
                                                <img src={course.image} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            
                                            {/* Course Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 500, color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {course.title}
                                                    </span>
                                                    {course.enrolled && (
                                                        <span style={{ fontSize: '8px', fontWeight: 600, color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '1px 4px', borderRadius: '3px' }}>
                                                            Enrolled
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 500 }}>{catInfo.label}</span>
                                                    <span style={{ fontSize: '10px', color: colors.textMuted }}>•</span>
                                                    <span style={{ fontSize: '10px', color: colors.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.instructor}</span>
                                                </div>
                                            </div>
                                            
                                            {/* Modules - Compact */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                </svg>
                                                <span style={{ fontSize: '10px', fontWeight: 500, color: colors.textMuted }}>{course.modules}</span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Filter Tabs */}
                <motion.div layout transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
                    <FilterTabs activeFilter={activeFilter} setActiveFilter={setActiveFilter} isDarkMode={isDarkMode} stats={stats} colors={colors} favoritesCount={bookmarks.length} />
                </motion.div>


                {/* View Toggle */}
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.38, duration: 0.4 }}
                    style={{
                        display: 'flex',
                        gap: '2px',
                        padding: '3px',
                        borderRadius: '10px',
                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    }}
                >
                    <motion.button
                        aria-label="Grid view"
                        aria-pressed={viewMode === 'grid'}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setViewMode('grid')}
                        style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            border: 'none',
                            background: viewMode === 'grid'
                                ? isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'
                                : 'transparent',
                            color: viewMode === 'grid' ? '#3b82f6' : colors.textMuted,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                        }}
                        title="Grid View"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                        </svg>
                    </motion.button>
                    <motion.button
                        aria-label="List view"
                        aria-pressed={viewMode === 'list'}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setViewMode('list')}
                        style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            border: 'none',
                            background: viewMode === 'list'
                                ? isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'
                                : 'transparent',
                            color: viewMode === 'list' ? '#3b82f6' : colors.textMuted,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                        }}
                        title="List View"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="8" y1="6" x2="21" y2="6" />
                            <line x1="8" y1="12" x2="21" y2="12" />
                            <line x1="8" y1="18" x2="21" y2="18" />
                            <line x1="3" y1="6" x2="3.01" y2="6" />
                            <line x1="3" y1="12" x2="3.01" y2="12" />
                            <line x1="3" y1="18" x2="3.01" y2="18" />
                        </svg>
                    </motion.button>
                </motion.div>

                {/* Sort Dropdown */}
                <motion.div 
                    initial={{ opacity: 0, x: 10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ 
                        opacity: { delay: 0.4, duration: 0.4 },
                        x: { delay: 0.4, duration: 0.4 }
                    }} 
                    style={{ position: 'relative' }}
                >
                    <motion.button 
                        onClick={() => setShowSortDropdown(!showSortDropdown)} 
                        whileHover={{ scale: 1.02 }} 
                        whileTap={{ scale: 0.98 }}
                        aria-label={`Sort by: ${sortBy === 'recent' ? 'Recently Viewed' : 'Alphabetical'}. Click to change.`}
                        aria-expanded={showSortDropdown}
                        aria-haspopup="listbox"
                        aria-controls={showSortDropdown ? "sort-options" : undefined}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            padding: '8px 12px', 
                            borderRadius: '10px', 
                            border: `1px solid ${showSortDropdown ? colors.accent : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')}`,
                            background: showSortDropdown ? (isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)') : colors.cardBg,
                            color: showSortDropdown ? colors.accent : colors.textSecondary,
                            fontSize: '12px', 
                            fontWeight: 500, 
                            cursor: 'pointer',
                            transition: 'border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease'
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M6 12h12M9 18h6" /></svg>
                        <span>
                            {sortBy === 'recent' ? 'Recently Viewed' : 'Alphabetical'}
                        </span>
                        <svg 
                            width="12" 
                            height="12" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                            style={{ 
                                transform: showSortDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease'
                            }}
                        >
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </motion.button>
                    <AnimatePresence>
                        {showSortDropdown && (
                            <>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSortDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                                <motion.div 
                                    id="sort-options"
                                    role="listbox"
                                    aria-label="Sort options"
                                    initial={{ opacity: 0, y: -8, scale: 0.95 }} 
                                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                                    exit={{ opacity: 0, y: -8, scale: 0.95 }} 
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    style={{ position: 'absolute', top: '100%', right: 0, marginTop: '6px', padding: '6px', borderRadius: '12px', background: colors.cardBg, border: `1px solid ${colors.border}`, boxShadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '160px' }}
                                >
                                    {(['recent', 'title'] as SortOption[]).map((option) => (
                                        <motion.button 
                                            key={option} 
                                            role="option"
                                            aria-selected={sortBy === option}
                                            onClick={() => { setSortBy(option); setShowSortDropdown(false); }} 
                                            whileHover={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: 'none', background: sortBy === option ? (isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.06)') : 'transparent', color: sortBy === option ? colors.accent : colors.textSecondary, fontSize: '12px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                        >
                                            {option === 'recent' ? 'Recently Viewed' : 'Alphabetical'}
                                            {sortBy === option && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>}
                                        </motion.button>
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>

            {/* Results Count Indicator */}
            <AnimatePresence mode="wait">
                {(searchQuery || activeFilter !== 'all') && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '16px',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: isDarkMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.04)',
                            border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'}`,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                                Showing <span style={{ fontWeight: 600, color: colors.accent }}>{filteredCourses.length}</span> of <span style={{ fontWeight: 600, color: colors.textPrimary }}>{stats.totalCourses}</span> courses
                                {activeFilter === 'favorites' && <span style={{ color: colors.textMuted }}> in Favorites</span>}
                                {activeFilter !== 'all' && activeFilter !== 'favorites' && <span style={{ color: colors.textMuted }}> in {categoryInfo[activeFilter].label}</span>}
                                {searchQuery && <span style={{ color: colors.textMuted }}> matching "{searchQuery}"</span>}
                            </span>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                color: colors.textMuted,
                                fontSize: '11px',
                                fontWeight: 500,
                                cursor: 'pointer',
                            }}
                        >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                            Clear filters
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Area with coordinated layout animations */}
            <LayoutGroup id="catalog-main-content">
                {/* Recently Viewed Section - Card Design matching Users page */}
                <AnimatePresence mode="popLayout">
                    {recentlyViewed.length > 0 && activeFilter === 'all' && !searchQuery && (
                        <motion.div
                            key="recently-viewed-section"
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ 
                                opacity: 0, 
                                scale: 0.96,
                                transition: { 
                                    duration: 0.25,
                                    ease: [0.4, 0, 1, 1]
                                } 
                            }}
                            transition={{ 
                                delay: 0.3, 
                                duration: 0.4, 
                                ease: [0.22, 1, 0.36, 1],
                                layout: {
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 35,
                                    mass: 0.6
                                }
                            }}
                        style={{
                            marginBottom: '24px',
                            padding: '16px 18px',
                            borderRadius: '14px',
                            background: colors.cardBg,
                            border: `1px solid ${colors.border}`,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Section Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                    style={{
                                        width: '34px',
                                        height: '34px',
                                        borderRadius: '9px',
                                        background: isDarkMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </motion.div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>
                                        Recently Viewed
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '11px', color: colors.textSecondary }}>
                                        {recentlyViewed.length} course{recentlyViewed.length !== 1 ? 's' : ''} viewed
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {recentlyViewed.length > 4 && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setRecentlyViewedExpanded(!recentlyViewedExpanded)}
                                        style={{
                                            padding: '5px 10px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                                            color: '#3b82f6',
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }}
                                    >
                                        {recentlyViewedExpanded ? (
                                            <>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="18 15 12 9 6 15" />
                                                </svg>
                                                Show Less
                                            </>
                                        ) : (
                                            <>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                                +{recentlyViewed.length - 4} More
                                            </>
                                        )}
                                    </motion.button>
                                )}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        localStorage.removeItem('catalog-recently-viewed');
                                        setRecentlyViewed([]);
                                    }}
                                    style={{
                                        padding: '5px 10px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                                        color: '#ef4444',
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                    }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                    Clear
                                </motion.button>
                            </div>
                        </div>

                        {/* Recently Viewed Courses - Grid Layout */}
                        <LayoutGroup>
                            <motion.div 
                                layout="position"
                                initial={false}
                                animate={{ 
                                    opacity: 1,
                                    height: 'auto',
                                }}
                                transition={{ 
                                    layout: { 
                                        type: 'spring', 
                                        stiffness: 350, 
                                        damping: 35,
                                        mass: 0.8
                                    },
                                    height: {
                                        type: 'spring',
                                        stiffness: 350,
                                        damping: 35,
                                        mass: 0.8
                                    }
                                }}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                                    gap: '10px',
                                    overflow: 'hidden',
                                }}
                            >
                                <AnimatePresence mode="popLayout">
                                {recentlyViewed.slice(0, recentlyViewedExpanded ? recentlyViewed.length : 4).map((courseId, index) => {
                                    const course = courses.find(c => c.id === courseId);
                                    if (!course) return null;
                                    
                                    // Calculate if this is a newly revealed card (index >= 4)
                                    const isExpandedCard = index >= 4;
                                    
                                    return (
                                        <motion.div
                                            key={course.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.85, y: isExpandedCard ? 20 : 0 }}
                                            animate={{ 
                                                opacity: 1, 
                                                scale: 1, 
                                                y: 0,
                                                transition: {
                                                    type: 'spring',
                                                    stiffness: 400,
                                                    damping: 25,
                                                    delay: isExpandedCard ? (index - 4) * 0.04 : index * 0.02
                                                }
                                            }}
                                            exit={{ 
                                                opacity: 0, 
                                                scale: 0.85, 
                                                y: -10,
                                                transition: { 
                                                    duration: 0.2,
                                                    ease: [0.4, 0, 1, 1]
                                                } 
                                            }}
                                            transition={{ 
                                                layout: { 
                                                    type: 'spring', 
                                                    stiffness: 400, 
                                                    damping: 30 
                                                }
                                            }}
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleCourseClick(course)}
                                            style={{
                                                padding: '10px',
                                                borderRadius: '12px',
                                                border: `1px solid ${colors.border}`,
                                                background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                            }}
                                        >
                                            {/* Course Image */}
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '10px',
                                                overflow: 'hidden',
                                                flexShrink: 0,
                                            }}>
                                                <img 
                                                    src={course.image} 
                                                    alt={course.title}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                            
                                            {/* Course Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                {/* Course Title */}
                                                <div style={{ 
                                                    fontSize: '12px', 
                                                    fontWeight: 600, 
                                                    color: colors.textPrimary,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    marginBottom: '4px',
                                                }}>
                                                    {course.title}
                                                </div>
                                                
                                                {/* Category Badge & Modules */}
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '6px',
                                                    marginBottom: '2px',
                                                }}>
                                                    <span style={{ 
                                                        fontSize: '9px', 
                                                        fontWeight: 600, 
                                                        color: '#3b82f6',
                                                        background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                    }}>
                                                        {categoryInfo[course.category].label}
                                                    </span>
                                                    <span style={{ fontSize: '10px', color: colors.textMuted }}>
                                                        {course.modules} modules
                                                    </span>
                                                </div>
                                                
                                                {/* Instructor */}
                                                <div style={{ 
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '10px', 
                                                    color: colors.textMuted,
                                                }}>
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                        <circle cx="12" cy="7" r="4" />
                                                    </svg>
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {course.instructor}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {/* Arrow */}
                                            <div style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '6px',
                                                background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                                    <path d="M9 18l6-6-6-6" />
                                                </svg>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                </AnimatePresence>
                            </motion.div>
                        </LayoutGroup>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Course Grid */}
            {filteredCourses.length === 0 ? (
                <motion.div 
                    layout="position"
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }}
                    transition={{
                        layout: {
                            type: 'spring',
                            stiffness: 400,
                            damping: 35,
                            mass: 0.6
                        }
                    }}
                    style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '60px 24px',
                        borderRadius: '16px',
                        background: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                    }}
                >
                    {/* Empty State Icon */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '20px',
                            background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px',
                        }}
                    >
                        {activeFilter === 'favorites' ? (
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                        ) : (
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                                <path d="M11 8v6M8 11h6" />
                            </svg>
                        )}
                    </motion.div>
                    
                    {/* Title */}
                    <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        style={{
                            margin: 0,
                            fontSize: '16px',
                            fontWeight: 600,
                            color: colors.textPrimary,
                            marginBottom: '8px',
                        }}
                    >
                        {activeFilter === 'favorites' ? 'No favorites yet' : 'No courses found'}
                    </motion.h3>
                    
                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{
                            margin: 0,
                            fontSize: '13px',
                            color: colors.textMuted,
                            textAlign: 'center',
                            maxWidth: '320px',
                            lineHeight: 1.5,
                            marginBottom: '20px',
                        }}
                    >
                        {activeFilter === 'favorites'
                            ? 'Bookmark courses to add them to your favorites for quick access.'
                            : searchQuery 
                                ? `We couldn't find any courses matching "${searchQuery}". Try adjusting your search or filters.`
                                : 'No courses available in this category. Try selecting a different filter.'}
                    </motion.p>
                    
                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        style={{ display: 'flex', gap: '10px' }}
                    >
                        {searchQuery && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSearchQuery('')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '10px 16px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: colors.accent,
                                    color: 'white',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                                Clear Search
                            </motion.button>
                        )}
                        {activeFilter !== 'all' && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setActiveFilter('all')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '10px 16px',
                                    borderRadius: '10px',
                                    border: `1px solid ${colors.border}`,
                                    background: 'transparent',
                                    color: colors.textSecondary,
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7" rx="1" />
                                    <rect x="14" y="3" width="7" height="7" rx="1" />
                                    <rect x="14" y="14" width="7" height="7" rx="1" />
                                    <rect x="3" y="14" width="7" height="7" rx="1" />
                                </svg>
                                View All Courses
                            </motion.button>
                        )}
                    </motion.div>
                </motion.div>
            ) : viewMode === 'grid' ? (
                <motion.div 
                    layout="position"
                    id="course-grid"
                    role="region"
                    aria-label={`Course catalog showing ${filteredCourses.length} courses in grid view`}
                    aria-live="polite"
                    initial={false}
                    transition={{
                        layout: {
                            type: 'spring',
                            stiffness: 400,
                            damping: 35,
                            mass: 0.6
                        }
                    }}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}
                >
                    <AnimatePresence mode="popLayout">
                        {paginatedCourses.map((course, index) => (
                            <CourseCard 
                                key={course.id} 
                                course={course} 
                                index={index} 
                                isDarkMode={isDarkMode} 
                                colors={colors} 
                                onClick={handleCourseClick}
                                isBookmarked={bookmarks.includes(course.id)}
                                onToggleBookmark={handleToggleBookmark}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <motion.div 
                    layout="position"
                    id="course-list"
                    role="region"
                    aria-label={`Course catalog showing ${filteredCourses.length} courses in list view`}
                    aria-live="polite"
                    initial={false}
                    transition={{
                        layout: {
                            type: 'spring',
                            stiffness: 400,
                            damping: 35,
                            mass: 0.6
                        }
                    }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                >
                    <AnimatePresence mode="popLayout">
                        {paginatedCourses.map((course, index) => (
                            <CourseListItem 
                                key={course.id} 
                                course={course} 
                                index={index} 
                                isDarkMode={isDarkMode} 
                                colors={colors} 
                                onClick={handleCourseClick}
                                isBookmarked={bookmarks.includes(course.id)}
                                onToggleBookmark={handleToggleBookmark}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Load More Button - Matching Users page design */}
            {hasMoreCourses && filteredCourses.length > 0 && (
                <div
                    ref={loadMoreRef}
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: '24px',
                        paddingBottom: '16px',
                    }}
                >
                    {isLoadingMore ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                                padding: '10px 24px',
                                fontSize: '13px',
                                color: colors.textSecondary,
                            }}
                        >
                            Loading more...
                        </motion.div>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleLoadMore}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '10px',
                                border: `1px solid ${colors.border}`,
                                background: colors.cardBg,
                                color: colors.textSecondary,
                                fontSize: '13px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                            Load more ({remainingCourses} remaining)
                        </motion.button>
                    )}
                </div>
            )}

            {/* Showing count indicator */}
            {filteredCourses.length > 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '16px',
                    fontSize: '12px',
                    color: colors.textMuted,
                }}>
                    Showing {paginatedCourses.length} of {filteredCourses.length} courses
                </div>
            )}
            </LayoutGroup>

            {/* Course Detail Modal */}
            <CourseDetailModal course={selectedCourse} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} isDarkMode={isDarkMode} onEnroll={handleEnroll} />
        </main>
    );
};

export default CatalogContent;
