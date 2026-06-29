/**
 * Video Tutorials Modal - Enhanced Version
 * Search, category tabs, and embedded video player
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const EASE_OUT = [0.32, 0.72, 0, 1] as const;
// @ts-ignore
const SPRING_PANEL = { type: 'spring', bounce: 0, duration: 0.4 } as const;

interface VideoTutorialsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Tutorial {
    id: string;
    title: string;
    description: string;
    duration: string;
    thumbnail: string;
    category: string;
    videoUrl: string;
}

const BLUE = '#3b82f6';

const categories = ['All', 'Getting Started', 'Courses', 'Tools', 'Progress'];

const tutorials: Tutorial[] = [
    {
        id: 'dashboard-overview',
        title: 'Dashboard Overview',
        description: 'Learn how to navigate your personalized dashboard and track your progress.',
        duration: '3:45',
        thumbnail: 'https://placehold.co/400x225/3b82f6/ffffff?text=Dashboard',
        category: 'Getting Started',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
    {
        id: 'course-management',
        title: 'Managing Your Courses',
        description: 'Discover how to add, drop, and organize your enrolled courses effectively.',
        duration: '5:20',
        thumbnail: 'https://placehold.co/400x225/10b981/ffffff?text=Courses',
        category: 'Courses',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
    {
        id: 'study-tools',
        title: 'Using Study Tools',
        description: 'A comprehensive guide to utilizing the built-in grammar checker and citation generator.',
        duration: '8:15',
        thumbnail: 'https://placehold.co/400x225/8b5cf6/ffffff?text=Tools',
        category: 'Tools',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
    {
        id: 'tracking-progress',
        title: 'Tracking Your Progress',
        description: 'Understand your analytics, study streaks, and grade predictions to stay on top of your work.',
        duration: '4:30',
        thumbnail: 'https://placehold.co/400x225/f59e0b/ffffff?text=Progress',
        category: 'Progress',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    }
];

// SVG Icons
const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
    </svg>
);

const ClockIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const BackIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
);

const VideoIcon: React.FC<{ width?: number; height?: number; strokeWidth?: number }> = ({ width = 22, height = 22, strokeWidth = 2 }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
);


// Video Player Component
const VideoPlayer: React.FC<{
    tutorial: Tutorial;
    isDarkMode: boolean;
    onBack: () => void;
}> = ({ tutorial, isDarkMode, onBack }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
        {/* Player Header */}
        <div style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
        }}>
            <motion.button
                onClick={onBack}
                whileHover={{ scale: 1.05, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                whileTap={{ scale: 0.95 }}
                style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDarkMode ? '#94a3b8' : '#64748b',
                }}
            >
                <BackIcon />
            </motion.button>
            <div style={{ flex: 1 }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '15px',
                    fontWeight: 600,
                    color: isDarkMode ? '#f1f5f9' : '#0f172a',
                }}>
                    {tutorial.title}
                </h3>
                <p style={{
                    margin: '2px 0 0',
                    fontSize: '12px',
                    color: isDarkMode ? '#64748b' : '#94a3b8',
                }}>
                    {tutorial.category} • {tutorial.duration}
                </p>
            </div>
        </div>

        {/* Video iframe */}
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#000',
                    boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.15)',
                }}
            >
                <iframe
                    src={tutorial.videoUrl}
                    title={tutorial.title}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </motion.div>

            {/* Description */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                }}
            >
                <p style={{
                    margin: 0,
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: isDarkMode ? '#94a3b8' : '#64748b',
                }}>
                    {tutorial.description}
                </p>
            </motion.div>
        </div>
    </motion.div>
);


// Video Card Component
const VideoCard: React.FC<{
    tutorial: Tutorial;
    index: number;
    onPlay: () => void;
}> = ({ tutorial, index, onPlay }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ delay: index * 0.05, type: 'spring', damping: 24 }}
        whileHover={{ scale: 1.01, y: -2 }}
        whileTap={{ scale: 0.99 }}
        onClick={onPlay}
        className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-5 flex flex-col sm:flex-row items-center gap-6 group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 text-left w-full cursor-pointer"
    >
        {/* Text Content */}
        <div className="relative z-10 flex-1 min-w-0 w-full flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-3 mb-2">
                <div className="inline-block px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                    {tutorial.category}
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] font-semibold">
                    <ClockIcon />
                    {tutorial.duration}
                </div>
            </div>
            <h3 className="text-[18px] sm:text-[20px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight m-0 mb-1.5 leading-snug truncate">
                {tutorial.title}
            </h3>
            <p className="text-[13.5px] sm:text-[14px] text-zinc-600 dark:text-zinc-400 leading-relaxed m-0 line-clamp-2 pr-4">
                {tutorial.description}
            </p>
        </div>
        
        {/* Right Side Video Preview */}
        <div className="w-full sm:w-[240px] h-[140px] rounded-2xl overflow-hidden relative flex-shrink-0 shadow-sm border border-zinc-100 dark:border-zinc-800 group-hover:border-blue-200 dark:group-hover:border-blue-800/50 transition-colors">
            <img 
                src={tutorial.thumbnail} 
                alt={tutorial.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Play Icon - Student Tools Style Container */}
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className="w-12 h-12 rounded-[14px] bg-white/80 dark:bg-black/40 backdrop-blur-md border border-white/40 dark:border-white/10 flex items-center justify-center shadow-lg text-blue-600 dark:text-blue-400 group-hover:shadow-xl transition-shadow duration-300"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </motion.div>
            </div>
        </div>
    </motion.div>
);


const VideoTutorialsModal: React.FC<VideoTutorialsModalProps> = ({ isOpen, onClose }) => {
    const reduce = useReducedMotion();
// @ts-ignore
    const enterY = reduce ? 0 : 40;
// @ts-ignore
    const enterScale = reduce ? 1 : 0.97;
    const [isDarkMode, setIsDarkMode] = useState(() => document.body.classList.contains('dark-mode'));
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [selectedVideo, setSelectedVideo] = useState<Tutorial | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auto-minimizing header state
    const [isMinimized, setIsMinimized] = useState(false);
    const lastScrollY = useRef(0);
    const scrollDirection = useRef<'up' | 'down' | null>(null);
    const anchorScrollY = useRef(0);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const currentScrollY = e.currentTarget.scrollTop;
        const scrollHeight = e.currentTarget.scrollHeight;
        const clientHeight = e.currentTarget.clientHeight;
        
        // Handle iOS rubber banding / top of scroll
        if (currentScrollY <= 10) {
            setIsMinimized(false);
            lastScrollY.current = currentScrollY;
            scrollDirection.current = null;
            anchorScrollY.current = currentScrollY;
            return;
        }

        // Determine current scrolling direction
        const delta = currentScrollY - lastScrollY.current;
        const isNearBottom = scrollHeight - currentScrollY - clientHeight < 50;
        
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
            
            // If we have scrolled up by more than 30px from the anchor, expand
            // Protect against bottom bounce rubber-banding expanding the header
            if (!isNearBottom && anchorScrollY.current - currentScrollY > 30) {
                setIsMinimized(false);
            }
        }

        lastScrollY.current = currentScrollY;
    }, []);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        if (value.trim().length > 0) {
            setIsSearching(true);
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
            searchTimerRef.current = setTimeout(() => {
                setIsSearching(false);
            }, 600);
        } else {
            setIsSearching(false);
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        }
    }, []);

    useEffect(() => {
        const checkDarkMode = () => setIsDarkMode(document.body.classList.contains('dark-mode'));
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isOpen) {
            // Reset state when modal closes
            setSearchQuery('');
            setActiveCategory('All');
            setSelectedVideo(null);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (selectedVideo) setSelectedVideo(null);
                else onClose();
            }
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedVideo, onClose]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Filter tutorials
    const filteredTutorials = useMemo(() => {
        return tutorials.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  t.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, activeCategory]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99998,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                }}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: EASE_OUT }}
                        onClick={() => selectedVideo ? setSelectedVideo(null) : onClose()}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: isDarkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(12px)',
                        }}
                    />


                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: selectedVideo ? '800px' : '760px',
                            height: selectedVideo ? 'auto' : '85vh',
                            maxHeight: '85vh',
                            background: isDarkMode ? '#0f172a' : '#f8fafc',
                            borderRadius: '20px',
                            boxShadow: isDarkMode 
                                ? '0 25px 80px rgba(0, 0, 0, 0.6)' 
                                : '0 25px 80px rgba(0, 0, 0, 0.2)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <motion.div
                            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                            animate={
                                reduce
                                    ? { opacity: 1, transition: { duration: 0.18, ease: EASE_OUT } }
                                    : { opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE_OUT } }
                            }
                            exit={
                                reduce
                                    ? { opacity: 0, transition: { duration: 0.14, ease: EASE_OUT } }
                                    : { opacity: 0, y: -8, transition: { duration: 0.16, ease: EASE_OUT } }
                            }
                            className="pointer-events-auto"
                            style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}
                        >
                        <AnimatePresence mode="wait">
                            {selectedVideo ? (
                                <VideoPlayer
                                    key="player"
                                    tutorial={selectedVideo}
                                    isDarkMode={isDarkMode}
                                    onBack={() => setSelectedVideo(null)}
                                />
                            ) : (
                                <motion.div
                                    key="list"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                                >
                                    {/* Header */}
                                    <motion.div 
                                        animate={{
                                            padding: isMinimized ? '12px 16px' : '24px 24px 8px 24px'
                                        }}
                                        className="relative border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-t-[20px]"
                                    >
                                        <motion.div 
                                            animate={{ marginBottom: isMinimized ? '0px' : '24px' }}
                                            className="flex items-start gap-3 sm:gap-4"
                                        >
                                            {/* Student Tools Style Header Card */}
                                            <motion.div 
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ 
                                                    opacity: 1, 
                                                    y: 0,
                                                    padding: isMinimized ? '12px 16px' : '24px',
                                                    gap: isMinimized ? '16px' : '24px'
                                                }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
                                                className="flex-1 relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[20px] sm:rounded-[24px] flex items-center group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 text-left"
                                            >
                                            {/* SaaS Background Accents */}
                                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

                                            <motion.div
                                                animate={{
                                                    width: isMinimized ? 40 : 64,
                                                    height: isMinimized ? 40 : 64,
                                                    borderRadius: isMinimized ? 12 : 20
                                                }}
                                                whileHover={{ scale: 1.05, rotate: -5 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                className="bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm text-blue-600 dark:text-blue-400 relative z-10"
                                            >
                                                <div className="hidden sm:flex">
                                                    <VideoIcon width={32} height={32} strokeWidth={2} />
                                                </div>
                                                <div className="flex sm:hidden">
                                                    <VideoIcon />
                                                </div>
                                            </motion.div>
                                            <div className="relative z-10 flex-1 min-w-0 pr-2 sm:pr-4">
                                                <motion.h2 
                                                    animate={{ fontSize: isMinimized ? '16px' : '26px' }}
                                                    className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight m-0 mb-0.5 sm:mb-1 truncate"
                                                >
                                                    Video Tutorials
                                                </motion.h2>
                                                <motion.p 
                                                    animate={{ fontSize: isMinimized ? '12px' : '14.5px' }}
                                                    className="text-zinc-600 dark:text-zinc-400 leading-relaxed m-0"
                                                >
                                                    {filteredTutorials.length} tutorial{filteredTutorials.length !== 1 ? 's' : ''} available
                                                </motion.p>
                                            </div>
                                            <div className="relative z-20 self-start">
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
                                            </div>
                                        </motion.div>
                                        </motion.div>

                                        <AnimatePresence>
                                            {!isMinimized && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                                    style={{ overflow: 'hidden' }}
                                                >
                                                    <div style={{ paddingBottom: '4px' }}>

                                        {/* Search bar */}
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                            style={{
                                                position: 'relative',
                                                marginBottom: '10px',
                                            }}
                                        >
                                            <div style={{
                                                position: 'absolute',
                                                left: '14px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: isDarkMode ? '#64748b' : '#94a3b8',
                                                pointerEvents: 'none',
                                            }}>
                                                <SearchIcon />
                                            </div>
                                            {/* Loading Spinner */}
                                            <AnimatePresence>
                                                {isSearching && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        right: '14px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        pointerEvents: 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}>
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.5 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.5 }}
                                                            transition={{ duration: 0.15 }}
                                                            style={{ display: 'flex' }}
                                                        >
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin">
                                                                <circle cx="12" cy="12" r="10" stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} strokeWidth="3" />
                                                                <path d="M12 2a10 10 0 0 1 10 10" stroke={BLUE} strokeWidth="3" strokeLinecap="round" />
                                                            </svg>
                                                        </motion.div>
                                                    </div>
                                                )}
                                            </AnimatePresence>
                                            <input
                                                type="text"
                                                placeholder="Search tutorials..."
                                                value={searchQuery}
                                                onChange={handleSearchChange}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 44px 10px 44px',
                                                    borderRadius: '12px',
                                                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                                                    background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#ffffff',
                                                    color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                                    fontSize: '13px',
                                                    outline: 'none',
                                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.borderColor = BLUE;
                                                    e.target.style.boxShadow = `0 0 0 3px ${BLUE}20`;
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                            />
                                        </motion.div>

                                        {/* Category tabs */}
                                        <div className="flex justify-center w-full mt-2 mb-0 px-1">
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.15 }}
                                                className={`flex items-center gap-1 p-1.5 rounded-[16px] shadow-sm border overflow-x-auto scrollbar-hide max-w-full ${
                                                    isDarkMode 
                                                        ? 'bg-zinc-800/60 border-zinc-700/80' 
                                                        : 'bg-zinc-50/80 border-zinc-200/80'
                                                }`}
                                                style={{ WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                                            >
                                                {categories.map((cat, i) => {
                                                    const isActive = activeCategory === cat;
                                                    return (
                                                        <motion.button
                                                            key={cat}
                                                            onClick={() => setActiveCategory(cat)}
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: 0.1 + i * 0.03 }}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.96 }}
                                                            className={`relative px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-xl text-[12px] sm:text-[13px] font-bold cursor-pointer whitespace-nowrap transition-colors duration-200 flex-shrink-0 ${
                                                                isActive
                                                                    ? (isDarkMode ? 'text-zinc-100' : 'text-blue-600')
                                                                    : (isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-700')
                                                            }`}
                                                            style={{ outline: 'none' }}
                                                        >
                                                            {isActive && (
                                                                <motion.div
                                                                    layoutId="videoCategoryTab"
                                                                    className={`absolute inset-0 rounded-xl shadow-sm border ${
                                                                        isDarkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-zinc-200/80'
                                                                    }`}
                                                                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                                                />
                                                            )}
                                                            <span className="relative z-10">{cat}</span>
                                                        </motion.button>
                                                    );
                                                })}
                                            </motion.div>
                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>


                                    {/* Video Grid */}
                                    <div 
                                        onScroll={handleScroll}
                                        style={{
                                            flex: 1,
                                            overflowY: 'auto',
                                            padding: '0px 24px 24px 24px',
                                        }}
                                    >
                                        <AnimatePresence mode="popLayout">
                                            {isSearching ? (
                                                /* Skeleton Loading Cards */
                                                <motion.div
                                                    key="skeletons"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1fr',
                                                        gap: '16px',
                                                    }}
                                                >
                                                    {[0, 1].map((i) => (
                                                        <div
                                                            key={i}
                                                            className="relative bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 rounded-[20px] p-4 flex items-center justify-between gap-6 w-full shadow-none"
                                                        >
                                                            {/* Text skeleton */}
                                                            <div className="flex-1 flex flex-col gap-4 py-1">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-5 w-20 rounded-md bg-zinc-200/70 dark:bg-zinc-800 animate-pulse" />
                                                                    <div className="h-5 w-12 rounded-md bg-zinc-200/70 dark:bg-zinc-800 animate-pulse" />
                                                                </div>
                                                                <div className="h-5 w-[65%] rounded-md bg-zinc-200/70 dark:bg-zinc-800 animate-pulse" />
                                                                <div className="h-4 w-[90%] rounded-md bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
                                                            </div>
                                                            {/* Thumbnail skeleton */}
                                                            <div className="w-[200px] h-[120px] rounded-2xl bg-zinc-200/70 dark:bg-zinc-800 animate-pulse flex-shrink-0" />
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            ) : filteredTutorials.length > 0 ? (
                                                <motion.div
                                                    layout
                                                    style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1fr',
                                                        gap: '16px',
                                                    }}
                                                >
                                                    {filteredTutorials.map((tutorial, index) => (
                                                        <VideoCard
                                                            key={tutorial.id}
                                                            tutorial={tutorial}
                                                            index={index}
                                                            onPlay={() => setSelectedVideo(tutorial)}
                                                        />
                                                    ))}
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                                    className="relative overflow-hidden w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-8 flex flex-col items-center justify-center text-center group transition-all duration-300 hover:shadow-md"
                                                >
                                                    {/* SaaS Accents */}
                                                    <div className="absolute top-0 right-0 -mr-12 -mt-12 w-28 h-28 bg-zinc-500/5 dark:bg-zinc-500/5 rounded-full blur-2xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                                    
                                                    {/* Tinted Wrench-Style Search Icon Box */}
                                                    <motion.div
                                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                        className="w-16 h-16 rounded-[20px] bg-zinc-50 border border-zinc-200/60 dark:bg-zinc-800/30 dark:border-zinc-850/50 flex items-center justify-center flex-shrink-0 shadow-sm text-zinc-400 dark:text-zinc-500 relative z-10 mb-4"
                                                    >
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="11" cy="11" r="8" />
                                                            <path d="m21 21-4.35-4.35" />
                                                        </svg>
                                                    </motion.div>
                                                    
                                                    {/* Title & Description with premium typography */}
                                                    <div className="relative z-10">
                                                        <h3 className="text-[17px] font-extrabold text-zinc-800 dark:text-zinc-200 tracking-tight m-0 mb-1 leading-snug">
                                                            No Tutorials Found
                                                        </h3>
                                                        <p className="text-[13.5px] text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed m-0 max-w-sm">
                                                            Try adjusting your search query or selecting a different category filter tab above.
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                    </motion.div>
            </div>
        )}
    </AnimatePresence>,
        document.body
    );
};

export default VideoTutorialsModal;