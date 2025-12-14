/**
 * Help Center Modal - Comprehensive Help Resources
 * Knowledge base, guides, status, and community links
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';

interface HelpCenterModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const BLUE = '#3b82f6';

// Search Spinner Component
const SearchSpinner: React.FC = () => (
    <div style={{
        width: '18px',
        height: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    }}>
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            style={{
                animation: 'helpCenterSpin 1s linear infinite',
            }}
        >
            <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="rgba(59, 130, 246, 0.2)"
                strokeWidth="3"
            />
            <path
                d="M12 2a10 10 0 0 1 10 10"
                fill="none"
                stroke={BLUE}
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
        <style>{`
            @keyframes helpCenterSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

// Skeleton Components
const CategorySkeleton: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <div style={{
        padding: '14px',
        borderRadius: '12px',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
        background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#ffffff',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    }}>
        <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            animation: 'helpCenterPulse 1.5s ease-in-out infinite',
        }} />
        <div style={{ flex: 1 }}>
            <div style={{
                width: '70%',
                height: '12px',
                borderRadius: '4px',
                background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                marginBottom: '6px',
                animation: 'helpCenterPulse 1.5s ease-in-out infinite',
            }} />
            <div style={{
                width: '50%',
                height: '10px',
                borderRadius: '4px',
                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                animation: 'helpCenterPulse 1.5s ease-in-out infinite',
                animationDelay: '0.2s',
            }} />
        </div>
    </div>
);

const ArticleSkeleton: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <div style={{
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
    }}>
        <div style={{ flex: 1 }}>
            <div style={{
                width: '80%',
                height: '12px',
                borderRadius: '4px',
                background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                marginBottom: '6px',
                animation: 'helpCenterPulse 1.5s ease-in-out infinite',
            }} />
            <div style={{
                width: '40%',
                height: '10px',
                borderRadius: '4px',
                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                animation: 'helpCenterPulse 1.5s ease-in-out infinite',
                animationDelay: '0.15s',
            }} />
        </div>
        <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '4px',
            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            animation: 'helpCenterPulse 1.5s ease-in-out infinite',
        }} />
    </div>
);

const QuickLinkSkeleton: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <div style={{
        flex: 1,
        padding: '12px',
        borderRadius: '10px',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
        background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#ffffff',
        textAlign: 'center',
    }}>
        <div style={{
            width: '32px',
            height: '32px',
            margin: '0 auto 8px',
            borderRadius: '8px',
            background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            animation: 'helpCenterPulse 1.5s ease-in-out infinite',
        }} />
        <div style={{
            width: '60%',
            height: '11px',
            margin: '0 auto 4px',
            borderRadius: '4px',
            background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            animation: 'helpCenterPulse 1.5s ease-in-out infinite',
            animationDelay: '0.1s',
        }} />
        <div style={{
            width: '80%',
            height: '9px',
            margin: '0 auto',
            borderRadius: '4px',
            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            animation: 'helpCenterPulse 1.5s ease-in-out infinite',
            animationDelay: '0.2s',
        }} />
    </div>
);

// Pulse animation style
const pulseStyle = `
    @keyframes helpCenterPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
    }
`;

// SVG Icons
const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
);

const SearchIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
    </svg>
);

const BookIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
);

const VideoIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
);


const RocketIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
);

const UsersIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const StatusIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
);

const ArrowIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
);

const ExternalIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);


interface ResourceCategory {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    articles: number;
    color: string;
}

interface QuickLink {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    external?: boolean;
}

const resourceCategories: ResourceCategory[] = [
    { id: 'getting-started', icon: <RocketIcon />, title: 'Getting Started', description: 'New to eLMS? Start here', articles: 12, color: '#3b82f6' },
    { id: 'courses', icon: <BookIcon />, title: 'Courses & Materials', description: 'Managing your courses', articles: 18, color: '#10b981' },
    { id: 'tools', icon: <VideoIcon />, title: 'Tools & Features', description: 'Grammar, citations & more', articles: 24, color: '#8b5cf6' },
    { id: 'account', icon: <UsersIcon />, title: 'Account & Settings', description: 'Profile, security, preferences', articles: 9, color: '#f59e0b' },
];

const quickLinks: QuickLink[] = [
    { id: 'status', icon: <StatusIcon />, title: 'System Status', description: 'All systems operational', external: true },
    { id: 'community', icon: <UsersIcon />, title: 'Community Forum', description: 'Connect with other students', external: true },
    { id: 'updates', icon: <RocketIcon />, title: 'What\'s New', description: 'Latest features & updates', external: false },
];

const popularArticles = [
    { id: 1, title: 'How to upload course materials', category: 'Courses', views: '2.4k' },
    { id: 2, title: 'Using the Grammar Checker effectively', category: 'Tools', views: '1.8k' },
    { id: 3, title: 'Understanding your study streak', category: 'Progress', views: '1.5k' },
    { id: 4, title: 'Generating citations in APA format', category: 'Tools', views: '1.2k' },
    { id: 5, title: 'Resetting your password', category: 'Account', views: '980' },
];


// Resource Category Card
const CategoryCard: React.FC<{
    category: ResourceCategory;
    index: number;
    isDarkMode: boolean;
}> = ({ category, index, isDarkMode }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    
    return (
        <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', damping: 25 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: `1px solid ${isHovered ? `${category.color}40` : isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
                background: isHovered 
                    ? isDarkMode ? `${category.color}10` : `${category.color}05`
                    : isDarkMode ? 'rgba(255,255,255,0.02)' : '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left',
                boxShadow: isHovered ? `0 4px 16px ${category.color}15` : 'none',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
            }}
        >
            <motion.div
                animate={{ scale: isHovered ? 1.08 : 1 }}
                style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: isHovered ? category.color : `${category.color}12`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isHovered ? '#ffffff' : category.color,
                    flexShrink: 0,
                    transition: 'all 0.25s ease',
                }}
            >
                {category.icon}
            </motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{
                    margin: 0,
                    fontSize: '13px',
                    fontWeight: 600,
                    color: isDarkMode ? '#f1f5f9' : '#0f172a',
                }}>
                    {category.title}
                </h4>
                <p style={{
                    margin: '2px 0 0',
                    fontSize: '11px',
                    color: isDarkMode ? '#64748b' : '#94a3b8',
                }}>
                    {category.description}
                </p>
            </div>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
            }}>
                <span style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    color: isDarkMode ? '#64748b' : '#94a3b8',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                }}>
                    {category.articles} articles
                </span>
                <motion.div
                    animate={{ x: isHovered ? 4 : 0, opacity: isHovered ? 1 : 0.5 }}
                    style={{ color: category.color }}
                >
                    <ArrowIcon />
                </motion.div>
            </div>
        </motion.button>
    );
};


const HelpCenterModal: React.FC<HelpCenterModalProps> = ({ isOpen, onClose }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => document.body.classList.contains('dark-mode'));
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const debounceRef = useRef<number | null>(null);

    useEffect(() => {
        const checkDarkMode = () => setIsDarkMode(document.body.classList.contains('dark-mode'));
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setDebouncedQuery('');
            setIsSearching(false);
        }
    }, [isOpen]);

    // Debounced search
    useEffect(() => {
        if (searchQuery) {
            setIsSearching(true);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = window.setTimeout(() => {
                setDebouncedQuery(searchQuery);
                setIsSearching(false);
            }, 400);
        } else {
            setDebouncedQuery('');
            setIsSearching(false);
        }
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchQuery]);

    // Filter results based on search
    const filteredCategories = debouncedQuery
        ? resourceCategories.filter(cat =>
            cat.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            cat.description.toLowerCase().includes(debouncedQuery.toLowerCase())
        )
        : resourceCategories;

    const filteredArticles = debouncedQuery
        ? popularArticles.filter(article =>
            article.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            article.category.toLowerCase().includes(debouncedQuery.toLowerCase())
        )
        : popularArticles;

    const filteredQuickLinks = debouncedQuery
        ? quickLinks.filter(link =>
            link.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            link.description.toLowerCase().includes(debouncedQuery.toLowerCase())
        )
        : quickLinks;

    const hasResults = filteredCategories.length > 0 || filteredArticles.length > 0 || filteredQuickLinks.length > 0;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

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
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: isDarkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(12px)',
                        }}
                    />

                    {/* Modal */}
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ 
                            type: 'spring', 
                            damping: 28, 
                            stiffness: 350,
                            layout: { type: 'spring', damping: 25, stiffness: 200 }
                        }}
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '640px',
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

                        {/* Header */}
                        <div style={{
                            padding: '20px 24px 16px',
                            borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                            background: isDarkMode ? '#1e293b' : '#ffffff',
                        }}>
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
                                            background: `linear-gradient(135deg, ${BLUE} 0%, #60a5fa 100%)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#ffffff',
                                            boxShadow: `0 4px 12px ${BLUE}40`,
                                        }}
                                    >
                                        <BookIcon />
                                    </motion.div>
                                    <div>
                                        <h2 style={{
                                            margin: 0,
                                            fontSize: '18px',
                                            fontWeight: 700,
                                            color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                        }}>
                                            Help Center
                                        </h2>
                                        <p style={{
                                            margin: '2px 0 0',
                                            fontSize: '12px',
                                            color: isDarkMode ? '#64748b' : '#94a3b8',
                                        }}>
                                            Find answers and resources
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

                            {/* Search */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                style={{ position: 'relative' }}
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
                                    placeholder="Search for help..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '11px 44px 11px 42px',
                                        borderRadius: '10px',
                                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                                        background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#ffffff',
                                        color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                        fontSize: '13px',
                                        outline: 'none',
                                        transition: 'all 0.25s ease',
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = BLUE;
                                        e.target.style.boxShadow = `0 0 0 3px ${BLUE}15`;
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                                {/* Search Spinner */}
                                <div style={{
                                    position: 'absolute',
                                    right: '14px',
                                    top: 0,
                                    bottom: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    pointerEvents: 'none',
                                }}>
                                    <AnimatePresence>
                                        {isSearching && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <SearchSpinner />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </div>


                        {/* Content */}
                        <motion.div 
                            layout
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '20px 24px',
                            }}
                        >
                            <style>{pulseStyle}</style>
                            <LayoutGroup>
                                {/* Loading Skeletons */}
                                {isSearching ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        {/* Category Skeletons */}
                                        <div style={{ marginBottom: '24px' }}>
                                            <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px',
                                                marginBottom: '12px',
                                            }}>
                                                <div style={{
                                                    width: '4px',
                                                    height: '16px',
                                                    borderRadius: '2px',
                                                    background: `linear-gradient(180deg, ${BLUE} 0%, #60a5fa 100%)`,
                                                }} />
                                                <h4 style={{
                                                    margin: 0,
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    color: isDarkMode ? '#94a3b8' : '#64748b',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.08em',
                                                }}>
                                                    Searching...
                                                </h4>
                                            </div>
                                            <div style={{ 
                                                display: 'grid', 
                                                gridTemplateColumns: 'repeat(2, 1fr)', 
                                                gap: '10px',
                                            }}>
                                                {[1, 2].map(i => (
                                                    <CategorySkeleton key={i} isDarkMode={isDarkMode} />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Article Skeletons */}
                                        <div style={{ marginBottom: '24px' }}>
                                            <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px',
                                                marginBottom: '12px',
                                            }}>
                                                <div style={{
                                                    width: '4px',
                                                    height: '16px',
                                                    borderRadius: '2px',
                                                    background: `linear-gradient(180deg, #10b981 0%, #34d399 100%)`,
                                                }} />
                                                <h4 style={{
                                                    margin: 0,
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    color: isDarkMode ? '#94a3b8' : '#64748b',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.08em',
                                                }}>
                                                    Articles
                                                </h4>
                                            </div>
                                            <div style={{ 
                                                background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#ffffff',
                                                borderRadius: '12px',
                                                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
                                                overflow: 'hidden',
                                            }}>
                                                {[1, 2, 3].map(i => (
                                                    <ArticleSkeleton key={i} isDarkMode={isDarkMode} />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Quick Link Skeletons */}
                                        <div>
                                            <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px',
                                                marginBottom: '12px',
                                            }}>
                                                <div style={{
                                                    width: '4px',
                                                    height: '16px',
                                                    borderRadius: '2px',
                                                    background: `linear-gradient(180deg, #8b5cf6 0%, #a78bfa 100%)`,
                                                }} />
                                                <h4 style={{
                                                    margin: 0,
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    color: isDarkMode ? '#94a3b8' : '#64748b',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.08em',
                                                }}>
                                                    Quick Links
                                                </h4>
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                {[1, 2, 3].map(i => (
                                                    <QuickLinkSkeleton key={i} isDarkMode={isDarkMode} />
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : !hasResults && debouncedQuery ? (
                                    /* No Results */
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            textAlign: 'center',
                                            padding: '40px 20px',
                                        }}
                                    >
                                        <div style={{
                                            width: '64px',
                                            height: '64px',
                                            margin: '0 auto 16px',
                                            borderRadius: '16px',
                                            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: isDarkMode ? '#64748b' : '#94a3b8',
                                        }}>
                                            <SearchIcon />
                                        </div>
                                        <h4 style={{
                                            margin: '0 0 8px',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            color: isDarkMode ? '#e2e8f0' : '#1e293b',
                                        }}>
                                            No results found
                                        </h4>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '12px',
                                            color: isDarkMode ? '#64748b' : '#94a3b8',
                                        }}>
                                            Try searching with different keywords
                                        </p>
                                    </motion.div>
                                ) : (
                                    /* Results */
                                    <>
                                        {/* Resource Categories */}
                                        {filteredCategories.length > 0 && (
                                            <motion.div
                                                layout="position"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                style={{ marginBottom: '24px' }}
                                            >
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '8px',
                                                    marginBottom: '12px',
                                                }}>
                                                    <div style={{
                                                        width: '4px',
                                                        height: '16px',
                                                        borderRadius: '2px',
                                                        background: `linear-gradient(180deg, ${BLUE} 0%, #60a5fa 100%)`,
                                                    }} />
                                                    <h4 style={{
                                                        margin: 0,
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        color: isDarkMode ? '#94a3b8' : '#64748b',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.08em',
                                                    }}>
                                                        {debouncedQuery ? `Categories (${filteredCategories.length})` : 'Browse by Category'}
                                                    </h4>
                                                </div>
                                                <div style={{ 
                                                    display: 'grid', 
                                                    gridTemplateColumns: 'repeat(2, 1fr)', 
                                                    gap: '10px',
                                                }}>
                                                    <AnimatePresence mode="popLayout">
                                                        {filteredCategories.map((cat, i) => (
                                                            <CategoryCard key={cat.id} category={cat} index={i} isDarkMode={isDarkMode} />
                                                        ))}
                                                    </AnimatePresence>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Popular Articles */}
                                        {filteredArticles.length > 0 && (
                                            <motion.div
                                                layout="position"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.15 }}
                                                style={{ marginBottom: '24px' }}
                                            >
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '8px',
                                                    marginBottom: '12px',
                                                }}>
                                                    <div style={{
                                                        width: '4px',
                                                        height: '16px',
                                                        borderRadius: '2px',
                                                        background: `linear-gradient(180deg, #10b981 0%, #34d399 100%)`,
                                                    }} />
                                                    <h4 style={{
                                                        margin: 0,
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        color: isDarkMode ? '#94a3b8' : '#64748b',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.08em',
                                                    }}>
                                                        {debouncedQuery ? `Articles (${filteredArticles.length})` : 'Popular Articles'}
                                                    </h4>
                                                </div>
                                                <div style={{ 
                                                    background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#ffffff',
                                                    borderRadius: '12px',
                                                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
                                                    overflow: 'hidden',
                                                }}>
                                                    <AnimatePresence mode="popLayout">
                                                        {filteredArticles.map((article, i) => (
                                                            <motion.button
                                                                key={article.id}
                                                                layout
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                exit={{ opacity: 0, x: -10 }}
                                                                transition={{ delay: 0.02 * i }}
                                                                whileHover={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(59, 130, 246, 0.04)' }}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '12px 14px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'space-between',
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    borderBottom: i < filteredArticles.length - 1 
                                                                        ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` 
                                                                        : 'none',
                                                                    cursor: 'pointer',
                                                                    textAlign: 'left',
                                                                    transition: 'background 0.2s',
                                                                }}
                                                            >
                                                                <div style={{ flex: 1 }}>
                                                                    <p style={{
                                                                        margin: 0,
                                                                        fontSize: '12px',
                                                                        fontWeight: 500,
                                                                        color: isDarkMode ? '#e2e8f0' : '#1e293b',
                                                                    }}>
                                                                        {article.title}
                                                                    </p>
                                                                    <span style={{
                                                                        fontSize: '10px',
                                                                        color: isDarkMode ? '#64748b' : '#94a3b8',
                                                                    }}>
                                                                        {article.category} • {article.views} views
                                                                    </span>
                                                                </div>
                                                                <ArrowIcon />
                                                            </motion.button>
                                                        ))}
                                                    </AnimatePresence>
                                                </div>
                                            </motion.div>
                                        )}


                                        {/* Quick Links */}
                                        {filteredQuickLinks.length > 0 && (
                                            <motion.div
                                                layout="position"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.25 }}
                                            >
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '8px',
                                                    marginBottom: '12px',
                                                }}>
                                                    <div style={{
                                                        width: '4px',
                                                        height: '16px',
                                                        borderRadius: '2px',
                                                        background: `linear-gradient(180deg, #8b5cf6 0%, #a78bfa 100%)`,
                                                    }} />
                                                    <h4 style={{
                                                        margin: 0,
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        color: isDarkMode ? '#94a3b8' : '#64748b',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.08em',
                                                    }}>
                                                        {debouncedQuery ? `Quick Links (${filteredQuickLinks.length})` : 'Quick Links'}
                                                    </h4>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <AnimatePresence mode="popLayout">
                                                        {filteredQuickLinks.map((link, i) => (
                                                            <motion.button
                                                                key={link.id}
                                                                layout
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: 10 }}
                                                                transition={{ delay: 0.05 * i }}
                                                                whileHover={{ y: -2, boxShadow: `0 4px 12px ${BLUE}15` }}
                                                                style={{
                                                                    flex: 1,
                                                                    padding: '12px',
                                                                    borderRadius: '10px',
                                                                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
                                                                    background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#ffffff',
                                                                    cursor: 'pointer',
                                                                    textAlign: 'center',
                                                                    transition: 'all 0.25s ease',
                                                                }}
                                                            >
                                                                <div style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    margin: '0 auto 8px',
                                                                    borderRadius: '8px',
                                                                    background: isDarkMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    color: BLUE,
                                                                }}>
                                                                    {link.icon}
                                                                </div>
                                                                <p style={{
                                                                    margin: 0,
                                                                    fontSize: '11px',
                                                                    fontWeight: 600,
                                                                    color: isDarkMode ? '#e2e8f0' : '#1e293b',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    gap: '4px',
                                                                }}>
                                                                    {link.title}
                                                                    {link.external && <ExternalIcon />}
                                                                </p>
                                                                <p style={{
                                                                    margin: '2px 0 0',
                                                                    fontSize: '9px',
                                                                    color: link.id === 'status' ? '#10b981' : isDarkMode ? '#64748b' : '#94a3b8',
                                                                    fontWeight: link.id === 'status' ? 500 : 400,
                                                                }}>
                                                                    {link.description}
                                                                </p>
                                                            </motion.button>
                                                        ))}
                                                    </AnimatePresence>
                                                </div>
                                            </motion.div>
                                        )}
                                    </>
                                )}
                            </LayoutGroup>
                        </motion.div>

                        {/* Footer */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.35 }}
                            style={{
                                padding: '14px 24px',
                                borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                                background: isDarkMode ? '#1e293b' : '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <p style={{
                                margin: 0,
                                fontSize: '11px',
                                color: isDarkMode ? '#64748b' : '#94a3b8',
                            }}>
                                Can't find what you need?
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: `linear-gradient(135deg, ${BLUE} 0%, #2563eb 100%)`,
                                    color: '#ffffff',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: `0 2px 8px ${BLUE}30`,
                                }}
                            >
                                Contact Support
                                <ArrowIcon />
                            </motion.button>
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default HelpCenterModal;
