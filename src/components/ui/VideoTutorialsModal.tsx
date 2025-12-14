/**
 * Video Tutorials Modal - Enhanced Version
 * Search, category tabs, and embedded video player
 */

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

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
        description: 'Upload materials, organize courses, and track your learning journey.',
        duration: '5:20',
        thumbnail: 'https://placehold.co/400x225/2563eb/ffffff?text=Courses',
        category: 'Courses',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
    {
        id: 'productivity-tools',
        title: 'Using Productivity Tools',
        description: 'Master Grammar Checker, Citation Generator, Paraphraser, and more.',
        duration: '7:15',
        thumbnail: 'https://placehold.co/400x225/1d4ed8/ffffff?text=Tools',
        category: 'Tools',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
    {
        id: 'track-progress',
        title: 'Tracking Your Progress',
        description: 'Monitor streaks, achievements, and AI-powered grade predictions.',
        duration: '4:30',
        thumbnail: 'https://placehold.co/400x225/1e40af/ffffff?text=Progress',
        category: 'Progress',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
    {
        id: 'grammar-checker',
        title: 'Grammar Checker Deep Dive',
        description: 'Advanced tips for using the Grammar Checker effectively.',
        duration: '6:10',
        thumbnail: 'https://placehold.co/400x225/1e3a8a/ffffff?text=Grammar',
        category: 'Tools',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
    {
        id: 'citation-guide',
        title: 'Citation Generator Guide',
        description: 'Create perfect citations in APA, MLA, Chicago, and more formats.',
        duration: '5:45',
        thumbnail: 'https://placehold.co/400x225/3730a3/ffffff?text=Citations',
        category: 'Tools',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
];

// SVG Icons
const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
    </svg>
);

const PlayIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
    </svg>
);

const ClockIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
);

const BackIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
);

const VideoIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
    isDarkMode: boolean;
    onPlay: () => void;
}> = ({ tutorial, index, isDarkMode, onPlay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ delay: index * 0.05, type: 'spring', damping: 20 }}
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={onPlay}
        style={{
            background: isDarkMode ? '#1e293b' : '#ffffff',
            borderRadius: '14px',
            overflow: 'hidden',
            cursor: 'pointer',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            boxShadow: isDarkMode ? '0 4px 16px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.06)',
        }}
    >
        {/* Thumbnail */}
        <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
            <img
                src={tutorial.thumbnail}
                alt={tutorial.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {/* Play overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <motion.div
                    whileHover={{ scale: 1.1 }}
                    style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: BLUE,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        boxShadow: `0 4px 20px ${BLUE}60`,
                    }}
                >
                    <PlayIcon />
                </motion.div>
            </motion.div>
            {/* Duration */}
            <div style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(0,0,0,0.8)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
            }}>
                <ClockIcon />
                {tutorial.duration}
            </div>
        </div>
        {/* Content */}
        <div style={{ padding: '12px 14px' }}>
            <div style={{
                display: 'inline-block',
                padding: '3px 8px',
                borderRadius: '4px',
                background: `${BLUE}15`,
                color: BLUE,
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                marginBottom: '8px',
            }}>
                {tutorial.category}
            </div>
            <h3 style={{
                margin: '0 0 4px',
                fontSize: '14px',
                fontWeight: 600,
                color: isDarkMode ? '#f1f5f9' : '#0f172a',
                lineHeight: 1.3,
            }}>
                {tutorial.title}
            </h3>
            <p style={{
                margin: 0,
                fontSize: '12px',
                lineHeight: 1.4,
                color: isDarkMode ? '#64748b' : '#94a3b8',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
            }}>
                {tutorial.description}
            </p>
        </div>
    </motion.div>
);


const VideoTutorialsModal: React.FC<VideoTutorialsModalProps> = ({ isOpen, onClose }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => document.body.classList.contains('dark-mode'));
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [selectedVideo, setSelectedVideo] = useState<Tutorial | null>(null);

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
                                    <div style={{
                                        padding: '20px 24px 16px',
                                        borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                                        background: isDarkMode ? '#1e293b' : '#ffffff',
                                    }}>
                                        {/* Title row */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <motion.div
                                                    initial={{ scale: 0, rotate: -180 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    transition={{ type: 'spring', delay: 0.1 }}
                                                    style={{
                                                        width: '42px',
                                                        height: '42px',
                                                        borderRadius: '12px',
                                                        background: BLUE,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#ffffff',
                                                        boxShadow: `0 4px 12px ${BLUE}40`,
                                                    }}
                                                >
                                                    <VideoIcon />
                                                </motion.div>
                                                <div>
                                                    <h2 style={{
                                                        margin: 0,
                                                        fontSize: '18px',
                                                        fontWeight: 700,
                                                        color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                                    }}>
                                                        Video Tutorials
                                                    </h2>
                                                    <p style={{
                                                        margin: '2px 0 0',
                                                        fontSize: '12px',
                                                        color: isDarkMode ? '#64748b' : '#94a3b8',
                                                    }}>
                                                        {filteredTutorials.length} tutorial{filteredTutorials.length !== 1 ? 's' : ''} available
                                                    </p>
                                                </div>
                                            </div>
                                            <motion.button
                                                onClick={onClose}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
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
                                                <CloseIcon />
                                            </motion.button>
                                        </div>


                                        {/* Search bar */}
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                            style={{
                                                position: 'relative',
                                                marginBottom: '14px',
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
                                            <input
                                                type="text"
                                                placeholder="Search tutorials..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 14px 12px 44px',
                                                    borderRadius: '12px',
                                                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                                                    background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#ffffff',
                                                    color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                                    fontSize: '14px',
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
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.15 }}
                                            style={{
                                                display: 'flex',
                                                gap: '8px',
                                                overflowX: 'auto',
                                                paddingBottom: '4px',
                                            }}
                                        >
                                            {categories.map((cat, i) => (
                                                <motion.button
                                                    key={cat}
                                                    onClick={() => setActiveCategory(cat)}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.1 + i * 0.03 }}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    style={{
                                                        padding: '8px 16px',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        background: activeCategory === cat 
                                                            ? BLUE 
                                                            : isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                                        color: activeCategory === cat 
                                                            ? '#ffffff' 
                                                            : isDarkMode ? '#94a3b8' : '#64748b',
                                                        fontSize: '13px',
                                                        fontWeight: 500,
                                                        cursor: 'pointer',
                                                        whiteSpace: 'nowrap',
                                                        boxShadow: activeCategory === cat ? `0 4px 12px ${BLUE}30` : 'none',
                                                        transition: 'background 0.2s, color 0.2s',
                                                    }}
                                                >
                                                    {cat}
                                                </motion.button>
                                            ))}
                                        </motion.div>
                                    </div>


                                    {/* Video Grid */}
                                    <div style={{
                                        flex: 1,
                                        overflowY: 'auto',
                                        padding: '20px 24px',
                                    }}>
                                        <AnimatePresence mode="popLayout">
                                            {filteredTutorials.length > 0 ? (
                                                <motion.div
                                                    layout
                                                    style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                                        gap: '16px',
                                                    }}
                                                >
                                                    {filteredTutorials.map((tutorial, index) => (
                                                        <VideoCard
                                                            key={tutorial.id}
                                                            tutorial={tutorial}
                                                            index={index}
                                                            isDarkMode={isDarkMode}
                                                            onPlay={() => setSelectedVideo(tutorial)}
                                                        />
                                                    ))}
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    style={{
                                                        textAlign: 'center',
                                                        padding: '60px 20px',
                                                    }}
                                                >
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ type: 'spring', delay: 0.1 }}
                                                        style={{
                                                            width: '64px',
                                                            height: '64px',
                                                            margin: '0 auto 16px',
                                                            borderRadius: '16px',
                                                            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: isDarkMode ? '#475569' : '#cbd5e1',
                                                        }}
                                                    >
                                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                            <circle cx="11" cy="11" r="8" />
                                                            <path d="m21 21-4.35-4.35" />
                                                        </svg>
                                                    </motion.div>
                                                    <h3 style={{
                                                        margin: '0 0 8px',
                                                        fontSize: '16px',
                                                        fontWeight: 600,
                                                        color: isDarkMode ? '#94a3b8' : '#64748b',
                                                    }}>
                                                        No tutorials found
                                                    </h3>
                                                    <p style={{
                                                        margin: 0,
                                                        fontSize: '13px',
                                                        color: isDarkMode ? '#64748b' : '#94a3b8',
                                                    }}>
                                                        Try adjusting your search or filter
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default VideoTutorialsModal;