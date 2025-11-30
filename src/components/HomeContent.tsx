import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import CourseCard from './CourseCard';
import ReorderableCourseGrid from './ReorderableCourseGrid';
import { NumberTicker } from './ui/number-ticker';
import { getSettings, getProfile, getImages } from '../services/profileService';
import {
    getStudyTimeData,
    getStreakData,
    getCourseProgressData,
    calculateOverallProgress,
    getCompletedCoursesCount,
    getInProgressCoursesCount,
    getStudyTimeHours,
    getDailyAverageHours,
    initializeTracking,
    type StudyTimeData,
    type StreakData,
    type CourseProgressData,
} from '../services/studyTimeService';

// Animation variants for staggered children - optimized for performance
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.03, // Reduced from 0.1 for faster perceived load
            delayChildren: 0
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.2,
            ease: 'easeOut' as const
        }
    }
};

// cardVariants available for future use if needed
const _cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.2,
            ease: 'easeOut'
        }
    }
};
void _cardVariants;

interface HomeContentProps {
    onShowWelcomeModal: () => void;
}

const BOOKMARKS_STORAGE_KEY = 'course-bookmarks';
const COURSE_ORDER_STORAGE_KEY = 'course-order';
const VIEW_MODE_STORAGE_KEY = 'courses-view-mode';

// Circular Progress Ring Component
const ProgressRing: React.FC<{ progress: number; size?: number; strokeWidth?: number }> = ({ 
    progress, 
    size = 72, 
    strokeWidth = 4 
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;
    
    return (
        <svg width={size} height={size} className="progress-ring">
            <circle
                className="progress-ring-bg"
                strokeWidth={strokeWidth}
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
            />
            <motion.circle
                className="progress-ring-fill"
                strokeWidth={strokeWidth}
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.2, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                    strokeDasharray: circumference,
                    transform: 'rotate(-90deg)',
                    transformOrigin: '50% 50%'
                }}
            />
        </svg>
    );
};

// Quick Stats Badge Component - available for future use
const _QuickStatBadge: React.FC<{ count: number; label: string; type: 'urgent' | 'info' }> = ({ count, label, type }) => (
    <motion.div 
        className={`quick-stat-badge ${type}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
        whileHover={{ scale: 1.05 }}
    >
        <span className="badge-count">{count}</span>
        <span className="badge-label">{label}</span>
    </motion.div>
);
void _QuickStatBadge;

// Animated Flame Component for Streak
// Using CSS animations for better performance on infinite animations
const _AnimatedFlame: React.FC<{ isActive?: boolean }> = ({ isActive = true }) => (
    <div className={`flame-container ${isActive ? 'flame-active' : ''}`}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="flame-icon">
            <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"/>
        </svg>
        <div className="flame-glow" />
    </div>
);
void _AnimatedFlame;

// Confetti Burst Component for Milestone Celebrations
const ConfettiBurst: React.FC<{ color: string; isActive: boolean }> = ({ color, isActive }) => {
    const particles = Array.from({ length: 8 }, (_, i) => i);
    const colors = [color, '#f59e0b', '#10b981', '#3b82f6', '#ec4899'];
    
    return (
        <AnimatePresence>
            {isActive && (
                <motion.div 
                    className="confetti-burst"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {particles.map((i) => {
                        const angle = (i / particles.length) * 360;
                        const distance = 20 + Math.random() * 15;
                        const size = 4 + Math.random() * 3;
                        const particleColor = colors[i % colors.length];
                        
                        return (
                            <motion.div
                                key={i}
                                className="confetti-particle"
                                style={{
                                    width: size,
                                    height: size,
                                    backgroundColor: particleColor,
                                    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                                }}
                                initial={{ 
                                    x: 0, 
                                    y: 0, 
                                    scale: 0,
                                    rotate: 0,
                                    opacity: 1 
                                }}
                                animate={{ 
                                    x: Math.cos(angle * Math.PI / 180) * distance,
                                    y: Math.sin(angle * Math.PI / 180) * distance,
                                    scale: [0, 1.2, 0.8],
                                    rotate: Math.random() * 360,
                                    opacity: [1, 1, 0]
                                }}
                                transition={{ 
                                    duration: 0.6,
                                    ease: [0.25, 0.46, 0.45, 0.94],
                                    delay: i * 0.02
                                }}
                            />
                        );
                    })}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// News Slideshow Component
const NewsSlideshow: React.FC = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const newsItems = [
        {
            id: 1,
            title: 'New Course Available',
            description: 'Web Development Fundamentals now open for enrollment',
            image: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=200&fit=crop',
            tag: 'Course',
            tagColor: '#3b82f6',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
            )
        },
        {
            id: 2,
            title: 'Midterm Schedule Released',
            description: 'Check your exam dates for the upcoming midterms',
            image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=200&fit=crop',
            tag: 'Important',
            tagColor: '#ef4444',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            )
        },
        {
            id: 3,
            title: 'Campus Event This Friday',
            description: 'Join us for the annual tech symposium',
            image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop',
            tag: 'Event',
            tagColor: '#f59e0b',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            )
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % newsItems.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [newsItems.length]);

    const goToNext = () => setCurrentSlide((prev) => (prev + 1) % newsItems.length);
    const goToPrev = () => setCurrentSlide((prev) => (prev - 1 + newsItems.length) % newsItems.length);

    return (
        <motion.div
            className="news-slideshow"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
        >
            <div className="news-header">
                <motion.div
                    className="news-title-wrapper"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <motion.svg
                        className="news-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        initial={{ rotate: -10, scale: 0.8 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                    >
                        <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
                        <line x1="9" y1="9" x2="13" y2="9" />
                        <line x1="9" y1="13" x2="13" y2="13" />
                    </motion.svg>
                    <span className="news-title">What's New</span>
                </motion.div>
                <div className="news-nav">
                    <motion.button
                        className="news-nav-btn"
                        onClick={goToPrev}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </motion.button>
                    <div className="news-dots">
                        {newsItems.map((_, index) => (
                            <motion.button
                                key={index}
                                className={`news-dot ${index === currentSlide ? 'active' : ''}`}
                                onClick={() => setCurrentSlide(index)}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                animate={index === currentSlide ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ duration: 0.3 }}
                            />
                        ))}
                    </div>
                    <motion.button
                        className="news-nav-btn"
                        onClick={goToNext}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </motion.button>
                </div>
            </div>
            <div className="news-content">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        className="news-slide"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        <div className="news-image-container">
                            <motion.img
                                src={newsItems[currentSlide].image}
                                alt={newsItems[currentSlide].title}
                                className="news-image"
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.5 }}
                            />
                            <motion.span
                                className="news-tag"
                                style={{ backgroundColor: newsItems[currentSlide].tagColor }}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <span className="news-tag-icon">{newsItems[currentSlide].icon}</span>
                                {newsItems[currentSlide].tag}
                            </motion.span>
                        </div>
                        <motion.div
                            className="news-text"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                        >
                            <h4 className="news-slide-title">{newsItems[currentSlide].title}</h4>
                            <p className="news-slide-desc">{newsItems[currentSlide].description}</p>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

// Achievement Toast Component - Bottom Left Position
const AchievementToast: React.FC<{
    show: boolean;
    title: string;
    description: string;
    icon: string;
    onClose: () => void;
}> = ({ show, title, description, icon, onClose }) => (
    <AnimatePresence>
        {show && (
            <motion.div
                className="achievement-toast"
                style={{
                    position: 'fixed',
                    bottom: '100px',
                    left: '20px',
                    top: 'auto',
                    zIndex: 10000,
                }}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
                <motion.div 
                    className="achievement-icon"
                    initial={{ rotate: -20, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                >
                    {icon}
                </motion.div>
                <div className="achievement-content">
                    <motion.span 
                        className="achievement-label"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        Achievement Unlocked!
                    </motion.span>
                    <motion.h4 
                        className="achievement-title"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 }}
                    >
                        {title}
                    </motion.h4>
                    <motion.p 
                        className="achievement-desc"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        {description}
                    </motion.p>
                </div>
                <motion.button
                    className="achievement-close"
                    onClick={onClose}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    ✕
                </motion.button>
                <motion.div
                    className="achievement-progress"
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: 5, ease: 'linear' }}
                />
            </motion.div>
        )}
    </AnimatePresence>
);

// Animated Role Badges Component - Side by side
const ROLES = [
    { name: 'Tester', bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' },
    { name: 'Admin', bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
    { name: 'Teacher', bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' },
    { name: 'Student', bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
] as const;

const RoleBadge: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}
        >
            {ROLES.map((role, index) => (
                <motion.span
                    key={role.name}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                        delay: 0.5 + index * 0.08, 
                        duration: 0.3, 
                        type: 'spring', 
                        stiffness: 300, 
                        damping: 20 
                    }}
                    whileHover={{ scale: 1.05, y: -1 }}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                        borderRadius: '10px',
                        backgroundColor: role.bg,
                        color: role.text,
                        border: `1px solid ${role.border}`,
                        cursor: 'default',
                    }}
                >
                    <motion.span
                        style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            backgroundColor: role.text,
                        }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.3 }}
                    />
                    {role.name}
                </motion.span>
            ))}
        </motion.div>
    );
};

// Skeleton Loading Component
const HomeSkeleton: React.FC = () => (
    <div className="home-content">
        {/* Welcome Hero Skeleton */}
        <motion.section className="welcome-hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="welcome-cards-row">
                <motion.div 
                    className="welcome-main-card"
                    style={{ background: '#f4f4f5', minHeight: '200px' }}
                >
                    <div className="welcome-content">
                        <div className="welcome-left">
                            <motion.div 
                                className="w-[72px] h-[72px] rounded-full bg-zinc-200"
                                animate={{ opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <div className="welcome-text-group-minimal" style={{ marginLeft: '16px' }}>
                                <motion.div className="h-4 w-24 bg-zinc-200 rounded mb-2" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                                <motion.div className="h-8 w-48 bg-zinc-200 rounded mb-3" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }} />
                                <div className="flex gap-2 mb-3">
                                    {[0, 1, 2, 3].map(i => (
                                        <motion.div key={i} className="h-5 w-16 bg-zinc-200 rounded-full" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }} />
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    {[0, 1, 2, 3].map(i => (
                                        <motion.div key={i} className="h-8 w-24 bg-zinc-200 rounded-lg" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
                <motion.div className="news-slideshow" style={{ background: '#f4f4f5', minHeight: '200px', borderRadius: '16px' }}>
                    <div className="p-4 space-y-3">
                        <motion.div className="h-4 w-24 bg-zinc-200 rounded" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                        <motion.div className="h-32 w-full bg-zinc-200 rounded-lg" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }} />
                        <motion.div className="h-4 w-3/4 bg-zinc-200 rounded" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} />
                    </div>
                </motion.div>
            </div>
            {/* Stats Row Skeleton */}
            <div className="stats-row-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '16px' }}>
                {[0, 1, 2, 3].map(i => (
                    <motion.div key={i} className="bg-zinc-100 rounded-2xl p-5 space-y-4" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}>
                        <div className="flex justify-between">
                            <motion.div className="w-10 h-10 bg-zinc-200 rounded-xl" />
                            <motion.div className="w-16 h-5 bg-zinc-200 rounded-full" />
                        </div>
                        <motion.div className="h-8 w-20 bg-zinc-200 rounded" />
                        <div className="flex gap-4">
                            <motion.div className="h-12 w-16 bg-zinc-200 rounded-lg" />
                            <motion.div className="h-12 w-16 bg-zinc-200 rounded-lg" />
                        </div>
                        <motion.div className="h-2 w-full bg-zinc-200 rounded-full" />
                    </motion.div>
                ))}
            </div>
        </motion.section>
        {/* Quick Access Skeleton */}
        <motion.section className="quick-access-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-4">
                <motion.div className="h-5 w-28 bg-zinc-200 rounded" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                <motion.div className="h-5 w-20 bg-zinc-100 rounded-full" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
            </div>
            <div className="grid grid-cols-5 gap-3">
                {[...Array(10)].map((_, i) => (
                    <motion.div key={i} className="bg-zinc-100 rounded-xl p-4 space-y-3" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }}>
                        <motion.div className="w-10 h-10 bg-zinc-200 rounded-xl" />
                        <motion.div className="h-3 w-20 bg-zinc-200 rounded" />
                        <motion.div className="h-2 w-16 bg-zinc-200 rounded" />
                    </motion.div>
                ))}
            </div>
        </motion.section>
        {/* Courses Skeleton */}
        <motion.section className="courses-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <motion.div className="h-6 w-32 bg-zinc-200 rounded" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    <motion.div className="h-5 w-20 bg-zinc-100 rounded-full" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                </div>
                <div className="flex gap-2">
                    <motion.div className="h-9 w-9 bg-zinc-200 rounded-lg" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    <motion.div className="h-9 w-9 bg-zinc-200 rounded-lg" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                </div>
            </div>
            <div className="flex gap-4 overflow-hidden">
                {[0, 1, 2, 3].map(i => (
                    <motion.div key={i} className="flex-shrink-0 w-[280px] bg-zinc-100 rounded-2xl overflow-hidden" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}>
                        <motion.div className="h-40 bg-zinc-200" />
                        <div className="p-4 space-y-3">
                            <motion.div className="h-4 w-3/4 bg-zinc-200 rounded" />
                            <motion.div className="h-3 w-1/2 bg-zinc-200 rounded" />
                            <div className="flex gap-2 mt-4">
                                <motion.div className="h-8 w-20 bg-zinc-200 rounded-lg" />
                                <motion.div className="h-8 w-16 bg-zinc-200 rounded-lg" />
                            </div>
                            <motion.div className="h-2 w-full bg-zinc-200 rounded-full mt-4" />
                            <motion.div className="h-10 w-full bg-zinc-200 rounded-xl mt-2" />
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.section>
    </div>
);

const HomeContent: React.FC<HomeContentProps> = ({ onShowWelcomeModal }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [coursesPerView, setCoursesPerView] = useState(4);
    const [showAchievement, setShowAchievement] = useState(false);
    const [expandedStatCard, setExpandedStatCard] = useState<string | null>(null);
    const [hoveredProgressBar, setHoveredProgressBar] = useState<string | null>(null);
    const [celebratingMilestones, setCelebratingMilestones] = useState<Record<string, boolean>>({});
    const [achievement, setAchievement] = useState({ title: '', description: '', icon: '🏆' });
    const [isHomeLoading, setIsHomeLoading] = useState(true);
    
    // Real-time tracking state
    const [studyTimeData, setStudyTimeData] = useState<StudyTimeData>(() => getStudyTimeData());
    const [streakData, setStreakData] = useState<StreakData>(() => getStreakData());
    const [courseProgressData, setCourseProgressData] = useState<CourseProgressData>(() => getCourseProgressData());
    
    // Computed values from real-time data
    const overallProgress = useMemo(() => calculateOverallProgress(), [courseProgressData]);
    const completedCourses = useMemo(() => getCompletedCoursesCount(), [courseProgressData]);
    const inProgressCourses = useMemo(() => getInProgressCoursesCount(), [courseProgressData]);
    const studyTimeHours = useMemo(() => getStudyTimeHours(), [studyTimeData]);
    const dailyAverage = useMemo(() => getDailyAverageHours(), [studyTimeData]);
    const [showOnlineStatus, setShowOnlineStatus] = useState(() => {
        const settings = getSettings();
        return settings.showOnlineStatus;
    });
    const [profileImage, setProfileImage] = useState<string | null>(() => {
        const images = getImages();
        return images.profileImage;
    });
    const [coverImage, setCoverImage] = useState<string | null>(() => {
        const images = getImages();
        return images.coverImage;
    });
    const [userFullName, setUserFullName] = useState(() => {
        const profile = getProfile();
        const middleInitial = profile.middleName ? ` ${profile.middleName.charAt(0)}.` : '';
        return `${profile.firstName}${middleInitial} ${profile.lastName}`;
    });
    const [viewMode, setViewMode] = useState<'carousel' | 'grid'>(() => {
        try {
            const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
            return (saved as 'carousel' | 'grid') || 'carousel';
        } catch {
            return 'carousel';
        }
    });
    const [courseOrder, setCourseOrder] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem(COURSE_ORDER_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [bookmarks, setBookmarks] = useState<Record<string, boolean>>(() => {
        // Load bookmarks from localStorage on initial render
        try {
            const saved = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 640) setCoursesPerView(1);
            else if (window.innerWidth <= 900) setCoursesPerView(2);
            else if (window.innerWidth <= 1200) setCoursesPerView(3);
            else setCoursesPerView(4);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initial loading state
    useEffect(() => {
        const timer = setTimeout(() => setIsHomeLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    // Initialize study time tracking
    useEffect(() => {
        initializeTracking();
        
        // Update tracking data every 30 seconds
        const trackingInterval = setInterval(() => {
            setStudyTimeData(getStudyTimeData());
            setStreakData(getStreakData());
            setCourseProgressData(getCourseProgressData());
        }, 30000);
        
        return () => clearInterval(trackingInterval);
    }, []);

    // Show achievement toast on milestone (demo: show after delay to not block initial render)
    useEffect(() => {
        // Delay achievement toast to after initial render is complete
        const timer = setTimeout(() => {
            setAchievement({
                title: `${streakData.currentStreak} Day Streak!`,
                description: `You've been learning consistently for ${streakData.currentStreak} days. Keep it up!`,
                icon: '🔥'
            });
            setShowAchievement(true);
        }, 3000); // Increased delay to let dashboard render first
        
        // Auto-hide after 5 seconds
        const hideTimer = setTimeout(() => {
            setShowAchievement(false);
        }, 8000);
        
        return () => {
            clearTimeout(timer);
            clearTimeout(hideTimer);
        };
    }, [streakData.currentStreak]);

    // Listen for settings/profile changes - optimized polling
    useEffect(() => {
        const handleStorageChange = () => {
            const settings = getSettings();
            setShowOnlineStatus(settings.showOnlineStatus);
            
            const images = getImages();
            setProfileImage(images.profileImage);
            setCoverImage(images.coverImage);
            
            const profile = getProfile();
            const middleInitial = profile.middleName ? ` ${profile.middleName.charAt(0)}.` : '';
            setUserFullName(`${profile.firstName}${middleInitial} ${profile.lastName}`);
        };
        
        window.addEventListener('storage', handleStorageChange);
        // Reduced polling frequency for better performance (1000ms instead of 100ms)
        const interval = setInterval(handleStorageChange, 1000);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    // Save bookmarks to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    }, [bookmarks]);

    // Save view mode to localStorage
    useEffect(() => {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
    }, [viewMode]);

    // Save course order to localStorage
    useEffect(() => {
        if (courseOrder.length > 0) {
            localStorage.setItem(COURSE_ORDER_STORAGE_KEY, JSON.stringify(courseOrder));
        }
    }, [courseOrder]);

    const handleBookmarkToggle = (courseTitle: string, isBookmarked: boolean) => {
        setBookmarks(prev => ({
            ...prev,
            [courseTitle]: isBookmarked
        }));
    };

    const coursesData = [
        { id: 'cp1', title: "Computer Programming 1 - SY2526-1T", subtitle: "CITE1003 · BSIT101A", image: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=300&h=200&fit=crop&crop=center", progress: 75, modules: 8, nextLesson: "Module 6: Functions and Methods", timeEstimate: "~25 min", deadline: { title: "Programming Assignment 3", dueDate: "Nov 28, 2025", daysLeft: 1 }, lastAccessed: "2 hours ago", unreadCount: 3, grade: { current: 92, letter: 'A', trend: 'up' as const }, studyStreak: 12, instructor: { name: "David Clarence Del Mundo" }, category: 'major' as const },
        { id: 'euth1', title: "Euthenics 1 - SY2526-1T", subtitle: "STIC1002 · BSIT101A", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=200&fit=crop&crop=center", progress: 100, modules: 6, nextLesson: "Chapter 4: Home Management", timeEstimate: "~20 min", lastAccessed: "Yesterday", unreadCount: 1, grade: { current: 88, letter: 'B+', trend: 'stable' as const }, studyStreak: 5, instructor: { name: "Claire Maurillo" }, category: 'ge' as const },
        { id: 'itc', title: "Introduction to Computing - SY2526-1T", subtitle: "CITE1004 · BSIT101A", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=200&fit=crop&crop=center", progress: 45, modules: 10, nextLesson: "Module 5: Computer Networks", timeEstimate: "~30 min", deadline: { title: "Quiz: Chapter 5", dueDate: "Nov 30, 2025", daysLeft: 3 }, lastAccessed: "3 days ago", unreadCount: 5, grade: { current: 85, letter: 'B', trend: 'up' as const }, instructor: { name: "Psalmmiracle Mariano" }, category: 'major' as const },
        { id: 'nstp1', title: "National Service Training Program 1 - SY2526-1T", subtitle: "NSTP1008 · BSIT101A", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&h=200&fit=crop&crop=center", progress: 30, modules: 8, nextLesson: "Unit 3: Community Service", timeEstimate: "~45 min", lastAccessed: "1 week ago", unreadCount: 12, grade: { current: 78, letter: 'C+', trend: 'down' as const }, instructor: { name: "Dan Risty Montojo" }, category: 'nstp' as const },
        { id: 'pe1', title: "P.E./PATHFIT 1: Movement Competency Training - SY2526-1T", subtitle: "PHED1005 · BSIT101A", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=200&fit=crop&crop=center", progress: 50, modules: 12, nextLesson: "Week 7: Flexibility Training", timeEstimate: "~35 min", lastAccessed: "5 hours ago", grade: { current: 95, letter: 'A', trend: 'stable' as const }, studyStreak: 8, instructor: { name: "Mark Joseph Danoy" }, category: 'pe' as const },
        { id: 'ppc', title: "Philippine Popular Culture - SY2526-1T", subtitle: "GEDC1041 · BSIT101A", image: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=300&h=200&fit=crop&crop=center", progress: 40, modules: 8, nextLesson: "Topic 4: Filipino Music Evolution", timeEstimate: "~20 min", lastAccessed: "2 weeks ago", unreadCount: 2, grade: { current: 82, letter: 'B-', trend: 'up' as const }, instructor: { name: "Claire Maurillo" }, category: 'ge' as const },
        { id: 'purcom', title: "Purposive Communication - SY2526-1T", subtitle: "GEDC1016 · BSIT101A", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&h=200&fit=crop&crop=center", progress: 65, modules: 10, nextLesson: "Lesson 7: Academic Writing", timeEstimate: "~40 min", deadline: { title: "Performance Task", dueDate: "Dec 2, 2025", daysLeft: 5 }, lastAccessed: "4 days ago", grade: { current: 90, letter: 'A-', trend: 'up' as const }, studyStreak: 3, instructor: { name: "John Denielle San Martin" }, category: 'ge' as const },
        { id: 'tcw', title: "The Contemporary World - SY2526-1T", subtitle: "GEDC1002 · BSIT101A", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=200&fit=crop&crop=center", progress: 35, modules: 9, nextLesson: "Chapter 4: Global Economy", timeEstimate: "~25 min", lastAccessed: "6 days ago", unreadCount: 1, grade: { current: 75, letter: 'C', trend: 'stable' as const }, instructor: { name: "Claire Maurillo" }, category: 'ge' as const },
        { id: 'uts', title: "Understanding the Self - SY2526-1T", subtitle: "GEDC1008 · BSIT101A", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&crop=center", progress: 55, modules: 8, nextLesson: "Module 5: The Physical Self", timeEstimate: "~30 min", lastAccessed: "Today", grade: { current: 87, letter: 'B+', trend: 'up' as const }, studyStreak: 2, instructor: { name: "Claire Maurillo" }, category: 'ge' as const },
    ];

    // Sort courses based on saved order, then merge with bookmark state
    const sortedCoursesData = courseOrder.length > 0
        ? [...coursesData].sort((a, b) => {
            const indexA = courseOrder.indexOf(a.id);
            const indexB = courseOrder.indexOf(b.id);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        })
        : coursesData;

    // Merge course data with bookmark state
    const courses = sortedCoursesData.map(course => ({
        ...course,
        isBookmarked: bookmarks[course.title] ?? false
    }));

    // Handle course reorder
    const handleCourseReorder = (newOrder: { id: string }[]) => {
        setCourseOrder(newOrder.map(c => c.id));
    };

    // Handle bookmark toggle for grid view (uses id instead of title)
    const handleGridBookmarkToggle = (courseId: string, isBookmarked: boolean) => {
        const course = coursesData.find(c => c.id === courseId);
        if (course) {
            handleBookmarkToggle(course.title, isBookmarked);
        }
    };

    const maxSlide = Math.max(0, courses.length - coursesPerView);

    const slideCourses = (direction: 'prev' | 'next') => {
        if (direction === 'next' && currentSlide < maxSlide) {
            setCurrentSlide(prev => prev + 1);
        } else if (direction === 'prev' && currentSlide > 0) {
            setCurrentSlide(prev => prev - 1);
        }
    };

    // Quick action items - 10 student convenience features (Horizontal stripes)
    // Row 1 (items 1-5): All Blue
    // Row 2 (items 6-10): All Yellow
    const quickActions = [
        { icon: 'play', label: 'Continue Learning', description: 'Resume your last course', color: '#3b82f6' },
        { icon: 'assignment', label: 'Assignments', description: '3 pending tasks', color: '#3b82f6' },
        { icon: 'calendar', label: 'Schedule', description: 'View your timetable', color: '#3b82f6' },
        { icon: 'chat', label: 'Discussion', description: '5 new messages', color: '#3b82f6' },
        { icon: 'grades', label: 'Grades', description: 'Check your progress', color: '#3b82f6' },
        { icon: 'resources', label: 'Resources', description: 'Study materials', color: '#f59e0b' },
        { icon: 'notes', label: 'My Notes', description: 'Quick access', color: '#f59e0b' },
        { icon: 'announcements', label: 'Announcements', description: '2 new updates', color: '#f59e0b' },
        { icon: 'help', label: 'Help Center', description: 'Get support', color: '#f59e0b' },
        { icon: 'tools', label: 'Tools', description: 'Grammar & more', color: '#f59e0b' },
    ];

    // Upcoming deadlines - available for future use
    const _deadlines = [
        { day: '28', month: 'Nov', title: 'Programming Assignment 3', course: 'Computer Programming 1', urgent: true },
        { day: '30', month: 'Nov', title: 'Quiz: Chapter 5', course: 'Introduction to Computing', urgent: false },
        { day: '02', month: 'Dec', title: 'Performance Task', course: 'Purposive Communication', urgent: false },
    ];
    void _deadlines;

    // Recent activity - available for future use
    const _activities = [
        { type: 'completed', title: 'Completed Module 5', course: 'Computer Programming 1', time: '2 hours ago' },
        { type: 'submitted', title: 'Submitted Assignment 2', course: 'Introduction to Computing', time: '5 hours ago' },
        { type: 'started', title: 'Started Module 3', course: 'Euthenics 1', time: 'Yesterday' },
    ];
    void _activities;

    // Show skeleton while loading
    if (isHomeLoading) {
        return (
            <>
                <HomeSkeleton />
                {/* Achievement Toast - Always visible, fixed position */}
                <AchievementToast
                    show={showAchievement}
                    title={achievement.title}
                    description={achievement.description}
                    icon={achievement.icon}
                    onClose={() => setShowAchievement(false)}
                />
            </>
        );
    }

    return (
        <motion.div
            className="home-content"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Achievement Toast */}
            <AchievementToast
                show={showAchievement}
                title={achievement.title}
                description={achievement.description}
                icon={achievement.icon}
                onClose={() => setShowAchievement(false)}
            />
            {/* Welcome Hero - Blue & Yellow Theme with InView Animations */}
            <motion.section
                className="welcome-hero"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                <div className="welcome-cards-row">
                {/* Main Welcome Card */}
                <motion.div
                    className="welcome-main-card"
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    {/* Cover Photo Background with Fade */}
                    {coverImage && (
                        <div className="welcome-card-cover-bg">
                            <img src={coverImage} alt="" className="welcome-card-cover-img" />
                            <div className="welcome-card-cover-fade" />
                        </div>
                    )}
                    <div className="welcome-content">
                        <div className="welcome-left">
                            {/* Avatar with Progress Ring */}
                            <motion.div 
                                className="avatar-progress-wrapper"
                                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <ProgressRing progress={overallProgress} size={72} strokeWidth={4} />
                                {profileImage ? (
                                    <img 
                                        src={profileImage} 
                                        alt="Profile" 
                                        className="avatar-inner-centered avatar-image"
                                    />
                                ) : (
                                    <div className="avatar-inner-centered">{userFullName.charAt(0).toUpperCase()}</div>
                                )}
                                <AnimatePresence>
                                    {showOnlineStatus && (
                                        <motion.div 
                                            className="avatar-status"
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                        />
                                    )}
                                </AnimatePresence>
                                <motion.span 
                                    className="progress-percent"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.5 }}
                                >
                                    {overallProgress}%
                                </motion.span>
                            </motion.div>
                            
                            <motion.div 
                                className="welcome-text-group-minimal"
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <motion.span 
                                    className="greeting-minimal"
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.4 }}
                                >
                                    {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'},
                                </motion.span>
                                <AnimatePresence mode="wait">
                                    <motion.h1 
                                        key={userFullName}
                                        className="welcome-name-minimal"
                                        initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                        exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                                        transition={{ duration: 0.4, type: 'spring', stiffness: 150, damping: 20 }}
                                    >
                                        {userFullName}
                                    </motion.h1>
                                </AnimatePresence>

                                {/* Animated Role Badge */}
                                <RoleBadge />
                                
                                <motion.div 
                                    className="context-minimal"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6, duration: 0.4 }}
                                >
                                    <span className="context-label">Continue with</span>
                                    <motion.span 
                                        className="context-module"
                                        whileHover={{ x: 4 }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                    >
                                        Module 6: Functions
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14M12 5l7 7-7 7"/>
                                        </svg>
                                    </motion.span>
                                </motion.div>

                                {/* All Badges Row */}
                                <motion.div
                                    className="badges-row-minimal"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7, duration: 0.4 }}
                                >
                                    <motion.div 
                                        className="badge-minimal streak"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.75, duration: 0.3, type: 'spring', stiffness: 200 }}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <motion.span 
                                            className="badge-number"
                                            animate={{ scale: [1, 1.05, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                        >
                                            12
                                        </motion.span>
                                        <span className="badge-label">day streak</span>
                                    </motion.div>

                                    <motion.div 
                                        className="badge-minimal date"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.8, duration: 0.3, type: 'spring', stiffness: 200 }}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"/>
                                        </svg>
                                        <span className="badge-label">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                    </motion.div>

                                    <motion.div 
                                        className="badge-minimal deadline"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.85, duration: 0.3, type: 'spring', stiffness: 200 }}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                                        </svg>
                                        <span className="badge-label">2 due soon</span>
                                    </motion.div>

                                    <motion.div 
                                        className="badge-minimal messages"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.9, duration: 0.3, type: 'spring', stiffness: 200 }}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                                        </svg>
                                        <span className="badge-label">5 new</span>
                                    </motion.div>
                                </motion.div>

                            </motion.div>
                        </div>
                        
                        {/* Action Buttons - Far Right Bottom */}
                        <motion.div
                            className="welcome-buttons-far-right"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.95, duration: 0.4 }}
                        >
                            <motion.button
                                className="btn-minimal secondary"
                                onClick={onShowWelcomeModal}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                What's New
                            </motion.button>
                            <motion.button
                                className="btn-minimal primary"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                Continue
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>

                {/* News Slideshow - separate card on the right */}
                <NewsSlideshow />
                </div>

                {/* Stats Row - Course Card Style Design */}
                <motion.div 
                    className="stats-row-cards"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    {[
                        { 
                            numValue: completedCourses + inProgressCourses, suffix: '', label: 'Enrolled Courses', 
                            icon: 'book', color: '#3b82f6', lightBg: '#eff6ff',
                            tag: 'ACTIVE', tagColor: '#3b82f6',
                            detail1: { icon: 'check', value: String(completedCourses), label: 'Completed' },
                            detail2: { icon: 'clock', value: String(inProgressCourses), label: 'In Progress' },
                            progress: Math.round((completedCourses / (completedCourses + inProgressCourses)) * 100) || 0, progressLabel: 'COMPLETION', modules: `${completedCourses + inProgressCourses} courses`,
                            comparison: { value: `+${completedCourses + inProgressCourses}`, period: 'new this term', isPositive: true },
                            sparkline: [0, 0, 0, 3, 6, 9, completedCourses + inProgressCourses],
                            tooltipMessage: `You have ${completedCourses + inProgressCourses} courses this semester. ${completedCourses} completed, ${inProgressCourses} in progress!`,
                            expandedContent: {
                                title: 'Course Breakdown',
                                items: Object.entries(courseProgressData).map(([id, data]) => ({
                                    name: id === 'cp1' ? 'Computer Programming 1' : id === 'euth1' ? 'Euthenics 1' : id === 'itc' ? 'Introduction to Computing' : id === 'nstp1' ? 'NSTP 1' : id === 'pe1' ? 'P.E./PATHFIT 1' : id === 'ppc' ? 'Philippine Popular Culture' : id === 'purcom' ? 'Purposive Communication' : id === 'tcw' ? 'The Contemporary World' : 'Understanding the Self',
                                    progress: data.progress,
                                    status: data.progress === 100 ? 'completed' : 'in-progress'
                                })).sort((a, b) => b.progress - a.progress)
                            }
                        },
                        { 
                            numValue: overallProgress, suffix: '%', label: 'Overall Progress', 
                            icon: 'progress', color: '#f59e0b', lightBg: '#fffbeb',
                            tag: overallProgress >= 50 ? 'ON TRACK' : 'KEEP GOING', tagColor: '#f59e0b',
                            detail1: { icon: 'target', value: '70%', label: 'Midterm Goal' },
                            detail2: { icon: 'trending', value: '+12%', label: 'This Week' },
                            progress: overallProgress, progressLabel: 'PROGRESS', modules: 'All courses',
                            comparison: { value: '+12%', period: 'vs last week', isPositive: true },
                            sparkline: studyTimeData.dailyHistory.slice(-7).map((_, i) => Math.round(overallProgress * (0.7 + i * 0.05))),
                            tooltipMessage: overallProgress >= 50 ? "Great progress! You're on track for midterms!" : "Keep pushing! You're making progress!",
                            expandedContent: {
                                title: 'Progress by Course',
                                items: Object.entries(courseProgressData).slice(0, 5).map(([id, data]) => ({
                                    name: id === 'cp1' ? 'Computer Programming 1' : id === 'euth1' ? 'Euthenics 1' : id === 'itc' ? 'Introduction to Computing' : id === 'purcom' ? 'Purposive Communication' : 'Understanding the Self',
                                    progress: data.progress,
                                    status: data.progress === 100 ? 'completed' : 'in-progress'
                                })).sort((a, b) => b.progress - a.progress)
                            }
                        },
                        { 
                            numValue: streakData.currentStreak, suffix: '', label: 'Day Streak', 
                            icon: 'streak', color: '#f59e0b', lightBg: '#fffbeb',
                            tag: streakData.currentStreak >= 7 ? 'ON FIRE' : 'BUILDING', tagColor: '#f59e0b',
                            detail1: { icon: 'trophy', value: String(streakData.bestStreak), label: 'Best' },
                            detail2: { icon: 'calendar', value: '30', label: 'Goal' },
                            progress: Math.round((streakData.currentStreak / 30) * 100), progressLabel: 'TO GOAL', modules: 'Daily login',
                            comparison: { value: `+${Math.max(0, streakData.currentStreak - 7)}`, period: 'vs last streak', isPositive: true },
                            sparkline: streakData.streakHistory.slice(-7).map((h, i) => h.active ? i + 6 : 0),
                            tooltipMessage: `${30 - streakData.currentStreak} more days to reach your 30-day goal!`,
                            expandedContent: {
                                title: 'Streak History',
                                items: [
                                    { name: 'Current Streak', progress: streakData.currentStreak, status: 'active' },
                                    { name: 'Best Streak', progress: streakData.bestStreak, status: 'record' },
                                    { name: 'Last Week', progress: streakData.streakHistory.slice(-7).filter(h => h.active).length, status: 'completed' },
                                    { name: 'This Month Total', progress: streakData.streakHistory.filter(h => h.active).length, status: 'info' },
                                ]
                            }
                        },
                        { 
                            numValue: studyTimeHours, suffix: 'h', label: 'Study Time', 
                            icon: 'time', color: '#3b82f6', lightBg: '#eff6ff',
                            tag: 'THIS MONTH', tagColor: '#3b82f6',
                            detail1: { icon: 'avg', value: dailyAverage, label: 'Daily Avg' },
                            detail2: { icon: 'trending', value: `+${Math.round(studyTimeData.weeklyMinutes / 60)}h`, label: 'This Week' },
                            progress: Math.round((studyTimeHours / 60) * 100), progressLabel: 'MONTHLY GOAL', modules: '60h target',
                            comparison: { value: `+${Math.round(studyTimeData.weeklyMinutes / 60)}h`, period: 'this week', isPositive: true },
                            sparkline: studyTimeData.dailyHistory.slice(-7).map(d => Math.round(d.minutes / 60)),
                            tooltipMessage: `${60 - studyTimeHours}h left to hit your 60h monthly target! Keep going!`,
                            expandedContent: {
                                title: 'Time by Course',
                                items: Object.entries(studyTimeData.courseMinutes)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 5)
                                    .map(([id, minutes]) => ({
                                        name: id === 'cp1' ? 'Computer Programming 1' : id === 'itc' ? 'Introduction to Computing' : id === 'purcom' ? 'Purposive Communication' : id === 'euth1' ? 'Euthenics 1' : id === 'uts' ? 'Understanding the Self' : id,
                                        progress: Math.round(minutes / 60),
                                        status: 'hours'
                                    }))
                            }
                        },
                    ].map((stat, index) => {
                        const isExpanded = expandedStatCard === stat.label;
                        return (
                        <motion.div
                            key={stat.label}
                            className={`stat-card-course ${isExpanded ? 'expanded' : ''}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.02, ease: 'easeOut' }}
                            onClick={() => setExpandedStatCard(isExpanded ? null : stat.label)}
                            style={{ 
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out'
                            }}
                        >
                            {/* Header with icon and tag */}
                            <div className="stat-card-header">
                                <div 
                                    className="stat-card-icon"
                                    style={{ backgroundColor: stat.lightBg, color: stat.color }}
                                >
                                    {stat.icon === 'book' && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                        </svg>
                                    )}
                                    {stat.icon === 'progress' && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                            <line x1="6" y1="20" x2="6" y2="16" />
                                            <line x1="12" y1="20" x2="12" y2="10" />
                                            <line x1="18" y1="20" x2="18" y2="4" />
                                        </svg>
                                    )}
                                    {stat.icon === 'streak' && (
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"/>
                                        </svg>
                                    )}
                                    {stat.icon === 'time' && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                    )}
                                </div>
                                <span 
                                    className="stat-card-tag"
                                    style={{ backgroundColor: stat.tagColor }}
                                >
                                    {stat.tag}
                                </span>
                            </div>

                            {/* Title and value */}
                            <div className="stat-card-title-section">
                                <div className="stat-card-value-row">
                                    <NumberTicker 
                                        value={stat.numValue}
                                        suffix={stat.suffix}
                                        delay={0.05 + index * 0.02}
                                        className="stat-card-number"
                                    />
                                    <span className="stat-card-label">{stat.label}</span>
                                </div>
                            </div>

                            {/* Details row - horizontal layout */}
                            <div className="stat-card-details">
                                <div className="stat-detail-box">
                                    <span className="stat-detail-icon" style={{ color: stat.color }}>
                                        {stat.detail1.icon === 'check' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                                        {stat.detail1.icon === 'target' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>}
                                        {stat.detail1.icon === 'trophy' && <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C9.38 2 7.25 4.13 7.25 6.75c0 .74.18 1.44.5 2.07L4 12.57V14h2v6h3v-4h6v4h3v-6h2v-1.43l-3.75-3.75c.32-.63.5-1.33.5-2.07C16.75 4.13 14.62 2 12 2z"/></svg>}
                                        {stat.detail1.icon === 'avg' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 9l-5 5-4-4-3 3"/></svg>}
                                    </span>
                                    <span className="stat-detail-value">{stat.detail1.value}</span>
                                    <span className="stat-detail-label">{stat.detail1.label}</span>
                                </div>
                                <div className="stat-detail-box">
                                    <span className="stat-detail-icon" style={{ color: stat.color }}>
                                        {stat.detail2.icon === 'clock' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                                        {stat.detail2.icon === 'trending' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
                                        {stat.detail2.icon === 'calendar' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
                                    </span>
                                    <span className="stat-detail-value">{stat.detail2.value}</span>
                                    <span className="stat-detail-label">{stat.detail2.label}</span>
                                </div>
                            </div>

                            {/* Sparkline Chart */}
                            <div className="stat-sparkline-section">
                                <div className="sparkline-header">
                                    <span className="sparkline-label">7-Day Trend</span>
                                    <span className="sparkline-value" style={{ color: stat.color }}>
                                        {stat.comparison.isPositive ? '↑' : '↓'} {stat.comparison.value}
                                    </span>
                                </div>
                                <div className="sparkline-bars">
                                    {stat.sparkline.map((value, i) => {
                                        const max = Math.max(...stat.sparkline);
                                        const height = (value / max) * 100;
                                        const isLast = i === stat.sparkline.length - 1;
                                        return (
                                            <div
                                                key={i}
                                                className={`sparkline-bar ${isLast ? 'current' : ''}`}
                                                style={{ 
                                                    backgroundColor: isLast ? stat.color : `${stat.color}40`,
                                                    height: `${height}%`
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Progress section with ring and milestones */}
                            <div className="stat-card-progress-section">
                                <div className="stat-progress-row">
                                    {/* Circular Progress Ring */}
                                    <div className="stat-progress-ring-container">
                                        <svg className="stat-progress-ring" viewBox="0 0 36 36">
                                            <circle
                                                cx="18"
                                                cy="18"
                                                r="15"
                                                fill="none"
                                                stroke="#f3f4f6"
                                                strokeWidth="3"
                                            />
                                            <circle
                                                cx="18"
                                                cy="18"
                                                r="15"
                                                fill="none"
                                                stroke={stat.color}
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeDasharray={`${2 * Math.PI * 15}`}
                                                strokeDashoffset={2 * Math.PI * 15 * (1 - stat.progress / 100)}
                                                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.5s ease-out' }}
                                            />
                                        </svg>
                                        <span className="stat-ring-value" style={{ color: stat.color }}>{stat.progress}%</span>
                                    </div>

                                    {/* Progress bar with milestones */}
                                    <div className="stat-progress-bar-section">
                                        <div className="stat-progress-header">
                                            <span className="stat-progress-label" style={{ color: stat.color }}>{stat.progressLabel}</span>
                                            <span className="stat-progress-modules">{stat.modules}</span>
                                        </div>
                                        <div 
                                            className="stat-card-progress-bar-wrapper"
                                            onMouseEnter={() => setHoveredProgressBar(stat.label)}
                                            onMouseLeave={() => setHoveredProgressBar(null)}
                                        >
                                            {/* Smooth Framer Motion Tooltip */}
                                            <AnimatePresence>
                                                {hoveredProgressBar === stat.label && (
                                                    <motion.div
                                                        className="stat-progress-tooltip"
                                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                                        transition={{ 
                                                            duration: 0.2,
                                                            ease: [0.25, 0.46, 0.45, 0.94]
                                                        }}
                                                        style={{ borderColor: `${stat.color}30` }}
                                                    >
                                                        <motion.div 
                                                            className="tooltip-icon"
                                                            style={{ backgroundColor: stat.lightBg, color: stat.color }}
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                                                        >
                                                            {stat.comparison.isPositive ? '🎯' : '📊'}
                                                        </motion.div>
                                                        <span className="tooltip-message">{stat.tooltipMessage}</span>
                                                        <motion.div 
                                                            className="tooltip-arrow"
                                                            style={{ borderTopColor: 'white' }}
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            <div className="stat-card-progress-bar">
                                                <motion.div 
                                                    className="stat-card-progress-fill"
                                                    style={{ backgroundColor: stat.color }}
                                                    initial={{ scaleX: 0 }}
                                                    whileInView={{ scaleX: stat.progress / 100 }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 0.4, delay: 0.15 + index * 0.05, ease: 'easeOut' }}
                                                />
                                            </div>
                                            {/* Milestone markers */}
                                            <div className="stat-milestones">
                                                {[25, 50, 75].map((milestone) => {
                                                    const milestoneKey = `${stat.label}-${milestone}`;
                                                    const isReached = stat.progress >= milestone;
                                                    
                                                    return (
                                                        <motion.div
                                                            key={milestone}
                                                            className={`stat-milestone ${isReached ? 'reached' : ''}`}
                                                            style={{ left: `${milestone}%`, borderColor: isReached ? stat.color : '#d1d5db' }}
                                                            initial={{ scale: 0 }}
                                                            whileInView={{ scale: 1 }}
                                                            viewport={{ once: true }}
                                                            transition={{ duration: 0.2, delay: 0.3 + index * 0.05 + milestone * 0.002 }}
                                                            onAnimationComplete={() => {
                                                                if (isReached && !celebratingMilestones[milestoneKey]) {
                                                                    setCelebratingMilestones(prev => ({ ...prev, [milestoneKey]: true }));
                                                                    setTimeout(() => {
                                                                        setCelebratingMilestones(prev => ({ ...prev, [milestoneKey]: false }));
                                                                    }, 800);
                                                                }
                                                            }}
                                                        >
                                                            {isReached && (
                                                                <>
                                                                    <motion.svg 
                                                                        viewBox="0 0 12 12" 
                                                                        className="milestone-check"
                                                                        initial={{ scale: 0 }}
                                                                        whileInView={{ scale: 1 }}
                                                                        viewport={{ once: true }}
                                                                        transition={{ duration: 0.15, delay: 0.35 + index * 0.05 + milestone * 0.002 }}
                                                                    >
                                                                        <path d="M10 3L4.5 8.5L2 6" fill="none" stroke={stat.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                                    </motion.svg>
                                                                    <ConfettiBurst 
                                                                        color={stat.color} 
                                                                        isActive={celebratingMilestones[milestoneKey] || false} 
                                                                    />
                                                                </>
                                                            )}
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Comparison footer */}
                            <div className="stat-card-footer">
                                <span className={`stat-card-comparison ${stat.comparison.isPositive ? 'positive' : 'negative'}`}>
                                    {stat.comparison.isPositive ? (
                                        <svg viewBox="0 0 12 12" className="comparison-icon"><path d="M6 2L10 7H2L6 2Z" fill="currentColor"/></svg>
                                    ) : (
                                        <svg viewBox="0 0 12 12" className="comparison-icon"><path d="M6 10L2 5H10L6 10Z" fill="currentColor"/></svg>
                                    )}
                                    {stat.comparison.value}
                                </span>
                                <span className="stat-card-period">{stat.comparison.period}</span>
                                <motion.button 
                                    className="stat-card-expand-btn"
                                    animate={{ rotate: isExpanded ? 45 : 0 }}
                                    transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedStatCard(isExpanded ? null : stat.label);
                                    }}
                                    style={{ backgroundColor: isExpanded ? stat.color : stat.lightBg, color: isExpanded ? 'white' : stat.color }}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                </motion.button>
                            </div>

                            {/* Floating Popup Menu */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        className="stat-card-popup"
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                        transition={{ 
                                            duration: 0.2,
                                            ease: [0.25, 0.46, 0.45, 0.94]
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="popup-header">
                                            <span className="popup-title">{stat.expandedContent.title}</span>
                                        </div>
                                        <div className="popup-items">
                                            {stat.expandedContent.items.map((item, itemIndex) => (
                                                <motion.div
                                                    key={item.name}
                                                    className="popup-item"
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ 
                                                        delay: 0.05 + itemIndex * 0.03,
                                                        duration: 0.2
                                                    }}
                                                >
                                                    <span className="popup-item-icon" style={{ 
                                                        backgroundColor: item.status === 'completed' || item.status === 'record' ? '#ecfdf5' : 
                                                                        item.status === 'in-progress' || item.status === 'active' ? stat.lightBg : 
                                                                        '#f3f4f6',
                                                        color: item.status === 'completed' || item.status === 'record' ? '#10b981' : 
                                                               item.status === 'in-progress' || item.status === 'active' ? stat.color : 
                                                               '#6b7280'
                                                    }}>
                                                        {item.status === 'completed' || item.status === 'record' ? (
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        ) : item.status === 'hours' ? (
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <polyline points="12 6 12 12 16 14" />
                                                            </svg>
                                                        ) : item.status === 'info' ? (
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                                <line x1="3" y1="10" x2="21" y2="10" />
                                                            </svg>
                                                        ) : (
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                            </svg>
                                                        )}
                                                    </span>
                                                    <div className="popup-item-content">
                                                        <span className="popup-item-name">{item.name}</span>
                                                        <div className="popup-item-progress-row">
                                                            <div className="popup-progress-bar">
                                                                <motion.div 
                                                                    className="popup-progress-fill"
                                                                    style={{ 
                                                                        backgroundColor: item.status === 'completed' || item.status === 'record' ? '#10b981' : stat.color 
                                                                    }}
                                                                    initial={{ scaleX: 0 }}
                                                                    animate={{ scaleX: item.progress / 100 }}
                                                                    transition={{ 
                                                                        delay: 0.1 + itemIndex * 0.05,
                                                                        duration: 0.4,
                                                                        ease: [0.25, 0.46, 0.45, 0.94]
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="popup-item-value" style={{ 
                                                                color: item.status === 'completed' || item.status === 'record' ? '#10b981' : stat.color 
                                                            }}>
                                                                {item.status === 'hours' ? `${item.progress}h` : 
                                                                 item.status === 'info' ? `${item.progress}d` : 
                                                                 `${item.progress}%`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                    })}
                </motion.div>

            </motion.section>


            {/* Quick Actions - Premium Grid with InView Animations */}
            <motion.section 
                className="quick-actions-premium"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5 }}
            >
                <motion.div 
                    className="section-header-clean"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    <h2>Quick Access</h2>
                    <span className="section-badge">{quickActions.length} shortcuts</span>
                </motion.div>
                <div className="quick-grid">
                    {quickActions.map((action, index) => (
                        <motion.button
                            key={action.label}
                            className="quick-card"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ 
                                default: { type: 'spring', stiffness: 500, damping: 25 },
                                opacity: { duration: 0.3, delay: 0.15 + index * 0.05 }
                            }}
                            whileHover={{ 
                                y: -6, 
                                boxShadow: '0 20px 40px rgba(59, 130, 246, 0.12)'
                            }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <div className="quick-card-icon" style={{ backgroundColor: `${action.color}15`, color: action.color }}>
                                {action.icon === 'play' && <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
                                {action.icon === 'assignment' && <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>}
                                {action.icon === 'calendar' && <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z" /></svg>}
                                {action.icon === 'chat' && <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>}
                                {action.icon === 'grades' && <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>}
                                {action.icon === 'resources' && <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" /></svg>}
                                {action.icon === 'notes' && <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H4.99c-1.11 0-1.98.89-1.98 2L3 19c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19v10z" /></svg>}
                                {action.icon === 'announcements' && <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4z" /></svg>}
                                {action.icon === 'help' && <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" /></svg>}
                                {action.icon === 'tools' && <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" /></svg>}
                            </div>
                            <span className="quick-card-label">{action.label}</span>
                            <span className="quick-card-desc">{action.description}</span>
                        </motion.button>
                    ))}
                </div>
            </motion.section>

            {/* Courses Section - Premium Grid */}
            <motion.section 
                className="courses-section-premium"
                variants={itemVariants}
            >
                <motion.div 
                    className="section-header-premium"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                    <div className="section-title-group">
                        <motion.h2
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25, type: 'spring', stiffness: 200 }}
                        >
                            Your Courses
                        </motion.h2>
                        <motion.span 
                            className="course-count-badge"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                        >
                            <span className="count-number">{courses.length}</span>
                            <span className="count-label">enrolled</span>
                        </motion.span>
                    </div>
                    <div className="section-nav-premium">
                        {/* View Mode Toggle */}
                        <div className="view-mode-toggle">
                            <motion.button
                                className={`view-mode-btn ${viewMode === 'carousel' ? 'active' : ''}`}
                                onClick={() => setViewMode('carousel')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title="Carousel View"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="6" width="6" height="12" rx="1" />
                                    <rect x="9" y="4" width="6" height="16" rx="1" />
                                    <rect x="16" y="6" width="6" height="12" rx="1" />
                                </svg>
                            </motion.button>
                            <motion.button
                                className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title="Grid View (Reorderable)"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7" rx="1" />
                                    <rect x="14" y="3" width="7" height="7" rx="1" />
                                    <rect x="3" y="14" width="7" height="7" rx="1" />
                                    <rect x="14" y="14" width="7" height="7" rx="1" />
                                </svg>
                            </motion.button>
                        </div>

                        {viewMode === 'carousel' && (
                            <>
                                <motion.button
                                    className="nav-arrow-premium"
                                    onClick={() => slideCourses('prev')}
                                    disabled={currentSlide === 0}
                                    whileHover={{ scale: 1.08, backgroundColor: '#f3f4f6' }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M15 18l-6-6 6-6" />
                                    </svg>
                                </motion.button>
                                <div className="slide-indicators-premium">
                                    {(() => {
                                        const totalDots = Math.ceil(courses.length / coursesPerView);
                                        // Calculate which dot should be active based on scroll position
                                        // Map currentSlide (0 to maxSlide) to dot index (0 to totalDots-1)
                                        const activeIndex = maxSlide > 0 
                                            ? Math.round((currentSlide / maxSlide) * (totalDots - 1))
                                            : 0;
                                        
                                        return Array.from({ length: totalDots }).map((_, i) => {
                                            const isActive = activeIndex === i;
                                            // Calculate the slide position for this dot
                                            const targetSlide = i === totalDots - 1 
                                                ? maxSlide 
                                                : Math.round((i / (totalDots - 1)) * maxSlide);
                                            
                                            return (
                                                <motion.button
                                                    key={i}
                                                    className="indicator-dot"
                                                    onClick={() => setCurrentSlide(Math.min(targetSlide, maxSlide))}
                                                    initial={false}
                                                    animate={{
                                                        width: isActive ? 24 : 8,
                                                        backgroundColor: isActive ? '#3b82f6' : '#d1d5db',
                                                    }}
                                                    whileHover={{ scale: 1.15 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    transition={{
                                                        width: { type: 'spring', stiffness: 500, damping: 30 },
                                                        backgroundColor: { duration: 0.2 }
                                                    }}
                                                />
                                            );
                                        });
                                    })()}
                                </div>
                                <motion.button
                                    className="nav-arrow-premium"
                                    onClick={() => slideCourses('next')}
                                    disabled={currentSlide >= maxSlide}
                                    whileHover={{ scale: 1.08, backgroundColor: '#f3f4f6' }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </motion.button>
                            </>
                        )}
                    </div>
                </motion.div>

                {viewMode === 'carousel' ? (
                    <div className="courses-viewport-premium">
                        <motion.div 
                            className="courses-track-premium"
                            animate={{ x: `-${currentSlide * (100 / coursesPerView)}%` }}
                            transition={{ 
                                type: 'spring', 
                                stiffness: 250, 
                                damping: 30,
                                mass: 0.8
                            }}
                        >
                            {courses.map((course, index) => (
                                <motion.div
                                    key={course.id}
                                    className="course-card-wrapper-premium"
                                    style={{ width: `${100 / coursesPerView}%` }}
                                >
                                    <CourseCard 
                                        title={course.title}
                                        subtitle={course.subtitle}
                                        image={course.image}
                                        progress={course.progress}
                                        modules={course.modules}
                                        nextLesson={course.nextLesson}
                                        timeEstimate={course.timeEstimate}
                                        deadline={'deadline' in course ? course.deadline : undefined}
                                        lastAccessed={course.lastAccessed}
                                        unreadCount={'unreadCount' in course ? course.unreadCount : undefined}
                                        grade={'grade' in course ? course.grade : undefined}
                                        isBookmarked={course.isBookmarked}
                                        onBookmarkToggle={(isBookmarked) => handleBookmarkToggle(course.title, isBookmarked)}
                                        studyStreak={course.studyStreak}
                                        instructor={'instructor' in course ? course.instructor : undefined}
                                        category={'category' in course ? course.category : undefined}
                                        index={index} 
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                ) : (
                    <ReorderableCourseGrid
                        courses={courses}
                        onReorder={handleCourseReorder}
                        onBookmarkToggle={handleGridBookmarkToggle}
                    />
                )}
            </motion.section>

            {/* Under Construction Section */}
            <motion.div 
                className="under-construction-section"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3rem 2rem',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderRadius: '20px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center',
                    gap: '1rem'
                }}
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                >
                    <lord-icon
                        src="https://cdn.lordicon.com/mudwpdhy.json"
                        trigger="hover"
                        style={{ width: '150px', height: '150px' }}
                    />
                </motion.div>
                <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: '#1e293b',
                        margin: 0
                    }}
                >
                    Nothing to see here
                </motion.h3>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    style={{
                        fontSize: '0.95rem',
                        color: '#64748b',
                        margin: 0
                    }}
                >
                    Under construction
                </motion.p>
            </motion.div>
        </motion.div>
    );
};

export default HomeContent;
