/**
 * Help Center Modal - Comprehensive Help Resources
 * Knowledge base, guides, status, and community links
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
        padding: '16px',
        borderRadius: '22px',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
        background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#ffffff',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
    }}>
        {/* Icon Squircle placeholder */}
        <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            flexShrink: 0,
            animation: 'helpCenterPulse 1.5s ease-in-out infinite',
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title Line */}
            <div style={{
                width: '60%',
                height: '14px',
                borderRadius: '6px',
                background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                marginBottom: '8px',
                animation: 'helpCenterPulse 1.5s ease-in-out infinite',
            }} />
            {/* Description Line */}
            <div style={{
                width: '85%',
                height: '11px',
                borderRadius: '4px',
                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                animation: 'helpCenterPulse 1.5s ease-in-out infinite',
                animationDelay: '0.15s',
            }} />
        </div>
    </div>
);

const ArticleSkeleton: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <div style={{
        padding: '14px',
        borderRadius: '18px',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
        background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#ffffff',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
    }}>
        {/* Icon Squircle placeholder */}
        <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            flexShrink: 0,
            animation: 'helpCenterPulse 1.5s ease-in-out infinite',
        }} />
        
        {/* Text Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title Line */}
            <div style={{
                width: '65%',
                height: '13px',
                borderRadius: '6px',
                background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                marginBottom: '8px',
                animation: 'helpCenterPulse 1.5s ease-in-out infinite',
            }} />
            {/* Subtext Line */}
            <div style={{
                width: '35%',
                height: '10px',
                borderRadius: '4px',
                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                animation: 'helpCenterPulse 1.5s ease-in-out infinite',
                animationDelay: '0.15s',
            }} />
        </div>

        {/* Arrow placeholder */}
        <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '4px',
            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            marginRight: '4px',
            animation: 'helpCenterPulse 1.5s ease-in-out infinite',
            animationDelay: '0.2s',
        }} />
    </div>
);

const QuickLinkSkeleton: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <div style={{
        flex: 1,
        padding: '16px 16px 20px',
        borderRadius: '20px',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
        background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
    }}>
        {/* Top-left Icon Placeholder */}
        <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            marginBottom: '14px',
            animation: 'helpCenterPulse 1.5s ease-in-out infinite',
        }} />
        {/* Title Line */}
        <div style={{
            width: '65%',
            height: '12px',
            borderRadius: '5px',
            background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            marginBottom: '8px',
            animation: 'helpCenterPulse 1.5s ease-in-out infinite',
            animationDelay: '0.1s',
        }} />
        {/* Description Line */}
        <div style={{
            width: '90%',
            height: '9px',
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
// CloseIcon removed as it was unused

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
            className="group relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[22px] p-3 sm:p-4 flex items-center gap-3 sm:gap-4 text-left transition-all duration-300 w-full"
            style={{
                borderColor: isHovered ? `${category.color}50` : undefined,
                boxShadow: isHovered ? `0 8px 20px ${category.color}12` : '0 1px 2px rgba(0,0,0,0.05)',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
            }}
        >
            {/* SaaS Background Accents */}
            <div 
                className="absolute top-0 right-0 -mr-10 -mt-10 w-24 h-24 rounded-full blur-2xl pointer-events-none transition-transform duration-700 opacity-0 group-hover:opacity-100 group-hover:scale-150" 
                style={{ backgroundColor: `${category.color}15` }}
                aria-hidden="true" 
            />
            <div 
                className="absolute bottom-0 left-0 -ml-10 -mb-10 w-20 h-20 rounded-full blur-2xl pointer-events-none transition-transform duration-700 opacity-0 group-hover:opacity-100 group-hover:scale-150" 
                style={{ backgroundColor: `${category.color}10` }}
                aria-hidden="true" 
            />

            <motion.div
                animate={isHovered ? { scale: 1.05, rotate: -5 } : { scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="w-12 h-12 rounded-[16px] flex items-center justify-center flex-shrink-0 shadow-sm relative z-10"
                style={{
                    backgroundColor: isDarkMode ? `${category.color}15` : `${category.color}10`,
                    border: `1px solid ${category.color}30`,
                    color: category.color
                }}
            >
                <div style={{ transform: 'scale(1.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {category.icon}
                </div>
            </motion.div>
            
            <div className="relative z-10 flex-1 min-w-0">
                <h4 className="m-0 text-[15px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug mb-0.5">
                    {category.title}
                </h4>
                <p className="m-0 text-[12.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                    {category.description}
                </p>
            </div>
        </motion.button>
    );
};


// Popular Article Card Component
const ArticleCard: React.FC<{
    article: {
        id: number;
        title: string;
        category: string;
        views: string;
    };
    index: number;
    isDarkMode: boolean;
}> = ({ article, index, isDarkMode }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    
    // category-specific color
    const color = (() => {
        switch (article.category.toLowerCase()) {
            case 'courses': return '#10b981'; // emerald
            case 'tools': return '#8b5cf6'; // violet
            case 'progress': return '#ef4444'; // red/rose
            case 'account': return '#f59e0b'; // amber
            default: return '#3b82f6'; // blue
        }
    })();

    // category-specific icon
    const icon = (() => {
        switch (article.category.toLowerCase()) {
            case 'courses':
                return <BookIcon />;
            case 'tools':
                return (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                );
            case 'progress':
                return <RocketIcon />;
            case 'account':
                return (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                );
            default:
                return (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                    </svg>
                );
        }
    })();

    return (
        <motion.button
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ delay: 0.03 * index, type: 'spring', damping: 25 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[18px] p-3 sm:p-3.5 flex items-center gap-3 sm:gap-4 text-left transition-all duration-300 w-full"
            style={{
                borderColor: isHovered ? `${color}50` : undefined,
                boxShadow: isHovered ? `0 6px 18px ${color}10` : '0 1px 2px rgba(0,0,0,0.05)',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                cursor: 'pointer',
            }}
        >
            {/* SaaS Background Accents */}
            <div 
                className="absolute top-0 right-0 -mr-8 -mt-8 w-20 h-20 rounded-full blur-xl pointer-events-none transition-transform duration-700 opacity-0 group-hover:opacity-100 group-hover:scale-150" 
                style={{ backgroundColor: `${color}10` }}
                aria-hidden="true" 
            />

            {/* Premium Icon Container */}
            <motion.div
                animate={isHovered ? { scale: 1.05, rotate: -5 } : { scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0 shadow-sm relative z-10"
                style={{
                    backgroundColor: isDarkMode ? `${color}15` : `${color}10`,
                    border: `1px solid ${color}30`,
                    color: color
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon}
                </div>
            </motion.div>

            {/* Text area */}
            <div className="relative z-10 flex-1 min-w-0 pr-2">
                <h4 className="m-0 text-[14px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug mb-0.5">
                    {article.title}
                </h4>
                <p className="m-0 text-[11.5px] text-zinc-500 dark:text-zinc-400 font-normal leading-none">
                    {article.category} • {article.views} views
                </p>
            </div>

            {/* Sliding Arrow icon */}
            <div className="relative z-10 flex-shrink-0 mr-1">
                <motion.div
                    animate={{ x: isHovered ? 3 : 0, opacity: isHovered ? 1 : 0.4 }}
                    style={{ color: color }}
                >
                    <ArrowIcon />
                </motion.div>
            </div>
        </motion.button>
    );
};


// Quick Link Card Component
const QuickLinkCard: React.FC<{
    link: QuickLink;
    index: number;
    isDarkMode: boolean;
}> = ({ link, index, isDarkMode }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    
    // Custom SaaS Theme Colors
    const theme = (() => {
        switch (link.id) {
            case 'status':
                return { color: '#10b981' }; // Emerald green
            case 'community':
                return { color: '#3b82f6' }; // SaaS blue
            case 'updates':
                return { color: '#8b5cf6' }; // Purple/Violet
            default:
                return { color: '#64748b' };
        }
    })();

    const { color } = theme;

    return (
        <motion.button
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ delay: index * 0.05, type: 'spring', damping: 25 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[20px] p-4 pb-5 flex flex-col items-start text-left transition-all duration-300 w-full"
            style={{
                borderColor: isHovered ? `${color}50` : undefined,
                boxShadow: isHovered ? `0 8px 24px ${color}12` : '0 1px 2px rgba(0,0,0,0.05)',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                cursor: 'pointer',
            }}
        >
            {/* SaaS Background Accents */}
            <div 
                className="absolute top-0 right-0 -mr-10 -mt-10 w-24 h-24 rounded-full blur-2xl pointer-events-none transition-transform duration-700 opacity-0 group-hover:opacity-100 group-hover:scale-150" 
                style={{ backgroundColor: `${color}15` }}
                aria-hidden="true" 
            />

            {/* Premium Icon Container */}
            <motion.div
                animate={isHovered ? { scale: 1.05, rotate: -5 } : { scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0 shadow-sm relative z-10 mb-3"
                style={{
                    backgroundColor: isDarkMode ? `${color}15` : `${color}10`,
                    border: `1px solid ${color}30`,
                    color: color
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {link.icon}
                </div>
            </motion.div>

            {/* Text Area */}
            <div className="relative z-10 w-full">
                <p className="m-0 text-[13px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug mb-1 flex items-center gap-1.5">
                    {link.title}
                    {link.external && (
                        <span style={{ opacity: isHovered ? 1 : 0.5, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center' }}>
                            <ExternalIcon />
                        </span>
                    )}
                </p>
                <p className="m-0 text-[11px] leading-normal font-normal text-zinc-500 dark:text-zinc-400">
                    {link.description}
                </p>
            </div>
        </motion.button>
    );
};


// Footer Call-To-Action Banner Component
const FooterCTABanner: React.FC<{ isDarkMode: boolean; isMinimized: boolean }> = ({ isDarkMode: _, isMinimized }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    
    return (
        <motion.div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            animate={{
                padding: isMinimized ? '8px 12px' : '16px 20px',
                gap: isMinimized ? '10px' : '16.5px'
            }}
            whileHover={{ scale: 1.01 }}
            className="group relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[22px] flex flex-col sm:flex-row items-center sm:items-center w-full text-center sm:text-left transition-all duration-300"
            style={{
                borderColor: isHovered ? `${BLUE}50` : undefined,
                boxShadow: isHovered ? `0 8px 24px ${BLUE}12` : '0 1px 2px rgba(0,0,0,0.05)',
                transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
            }}
        >
            {/* SaaS Background Accents */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-24 h-24 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

            {/* Premium Icon Container */}
            <motion.div
                animate={{
                    width: isMinimized ? 36 : 48,
                    height: isMinimized ? 36 : 48,
                    borderRadius: isMinimized ? 12 : 16,
                    scale: isHovered ? 1.05 : 1,
                    rotate: isHovered ? -5 : 0
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm text-blue-600 dark:text-blue-400 relative z-10"
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                </svg>
            </motion.div>

            {/* Text Area */}
            <div className="relative z-10 flex-1 min-w-0 pr-2">
                <motion.h4 
                    animate={{ fontSize: isMinimized ? '14.5px' : '15px' }}
                    className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight m-0"
                    style={{ marginBottom: isMinimized ? '0px' : '2px' }}
                >
                    Still need help?
                </motion.h4>
                <AnimatePresence>
                    {!isMinimized && (
                        <motion.p 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="m-0 text-[12px] text-zinc-500 dark:text-zinc-400 leading-normal font-normal"
                        >
                            Can't find what you need? Contact support.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Support CTA Button */}
            <motion.button
                animate={{
                    padding: isMinimized ? '6px 12px' : '10px 20px',
                    fontSize: isMinimized ? '12px' : '12.5px'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative z-10 flex-shrink-0 flex items-center gap-2 rounded-[12px] bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 transition-all duration-300"
            >
                Contact Support
                <motion.div
                    animate={{ x: isHovered ? 3 : 0 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    <ArrowIcon />
                </motion.div>
            </motion.button>
        </motion.div>
    );
};


// Elegant Section Header Component
const SectionHeader: React.FC<{
    title: string;
    description: string;
    badgeText?: string;
    color: string;
    isDarkMode: boolean;
}> = ({ title, description, badgeText, color, isDarkMode }) => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            marginTop: '12px',
            width: '100%',
            padding: '0 4px',
        }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Section Title */}
                <h3 style={{
                    margin: '0 0 3px',
                    fontSize: '17px',
                    fontWeight: 800,
                    color: isDarkMode ? '#f8fafc' : '#0f172a',
                    letterSpacing: '-0.02em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    {/* Small squircle accent block */}
                    <div style={{
                        width: '6px',
                        height: '16px',
                        borderRadius: '3px',
                        backgroundColor: color,
                    }} />
                    {title}
                </h3>
                {/* Description */}
                <p style={{
                    margin: 0,
                    fontSize: '12.5px',
                    color: isDarkMode ? '#94a3b8' : '#64748b',
                    fontWeight: 400,
                    paddingLeft: '14px', // aligned with the title text
                }}>
                    {description}
                </p>
            </div>

            {badgeText && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '10px',
                    background: isDarkMode ? `${color}15` : `${color}10`,
                    border: `1px solid ${color}20`,
                    color: color,
                    fontSize: '11px',
                    fontWeight: 600,
                    flexShrink: 0,
                }}>
                    {badgeText}
                </div>
            )}
        </div>
    );
};


const HelpCenterModal: React.FC<HelpCenterModalProps> = ({ isOpen, onClose }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => document.body.classList.contains('dark-mode'));
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const debounceRef = useRef<number | null>(null);

    // Auto-minimizing scroll state
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
            setIsMinimized(false);
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
                        <motion.div 
                            animate={{
                                padding: isMinimized ? '12px 16px' : '24px 24px 8px 24px'
                            }}
                            className="relative border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-t-[20px]"
                        >
                            <motion.div 
                                animate={{ marginBottom: isMinimized ? '0px' : '16px' }}
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
                                        <svg 
                                            width={isMinimized ? "20" : "30"} 
                                            height={isMinimized ? "20" : "30"} 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                        >
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                        </svg>
                                    </motion.div>
                                    
                                    <div className="relative z-10 flex-1 min-w-0 pr-2 sm:pr-4">
                                        <motion.h2 
                                            animate={{ fontSize: isMinimized ? '16px' : '26px' }}
                                            className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight m-0 mb-0.5 sm:mb-1 truncate"
                                        >
                                            Help Center
                                        </motion.h2>
                                        <motion.p 
                                            animate={{ fontSize: isMinimized ? '12px' : '14.5px' }}
                                            className="text-zinc-600 dark:text-zinc-400 leading-relaxed m-0 truncate"
                                        >
                                            Find answers and resources
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
                                            {/* Search */}
                                            <div style={{ position: 'relative' }}>
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
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>


                        {/* Content */}
                        <div 
                            onScroll={handleScroll}
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
                                            <SectionHeader 
                                                title="Searching..." 
                                                description="Scanning help center database" 
                                                badgeText="Loading"
                                                color={BLUE}
                                                isDarkMode={isDarkMode}
                                            />
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
                                            <SectionHeader 
                                                title="Articles" 
                                                description="Retrieving related articles" 
                                                badgeText="Loading"
                                                color="#10b981"
                                                isDarkMode={isDarkMode}
                                            />
                                            <div style={{ 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                gap: '10px',
                                            }}>
                                                {[1, 2, 3].map(i => (
                                                    <ArticleSkeleton key={i} isDarkMode={isDarkMode} />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Quick Link Skeletons */}
                                        <div>
                                            <SectionHeader 
                                                title="Quick Links" 
                                                description="Gathering integration resources" 
                                                badgeText="Loading"
                                                color="#8b5cf6"
                                                isDarkMode={isDarkMode}
                                            />
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
                                        initial={{ opacity: 0, scale: 0.98, y: 8 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        className="group relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-8 text-center w-full"
                                        style={{
                                            padding: '40px 32px',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                                        }}
                                    >
                                        {/* SaaS Background Accents */}
                                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-zinc-500/5 dark:bg-zinc-500/3 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
                                        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-24 h-24 bg-zinc-400/5 dark:bg-zinc-400/3 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

                                        {/* Premium Icon Squircle Container */}
                                        <div style={{
                                            width: '68px',
                                            height: '68px',
                                            margin: '0 auto 20px',
                                            borderRadius: '20px',
                                            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
                                            background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(244,244,245,0.6)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.015)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: isDarkMode ? '#94a3b8' : '#71717a',
                                        }}>
                                            <div style={{ transform: 'scale(1.35)' }}>
                                                <SearchIcon />
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <h3 className="m-0 text-[18px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-2">
                                            No results found
                                        </h3>

                                        {/* Description */}
                                        <p className="m-0 text-[13px] text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed max-w-[280px] mx-auto">
                                            Try searching with different keywords or check your spelling.
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
                                                <SectionHeader 
                                                    title={debouncedQuery ? `Categories` : 'Browse by Category'} 
                                                    description="Explore guides and documentation by topic" 
                                                    badgeText={debouncedQuery ? `${filteredCategories.length} Topics` : '4 Topics'}
                                                    color={BLUE}
                                                    isDarkMode={isDarkMode}
                                                />
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                                <SectionHeader 
                                                    title={debouncedQuery ? `Articles` : 'Popular Articles'} 
                                                    description="Most read guides and helpful solutions" 
                                                    badgeText={debouncedQuery ? `${filteredArticles.length} Articles` : '5 Articles'}
                                                    color="#10b981"
                                                    isDarkMode={isDarkMode}
                                                />
                                                <div style={{ 
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '10px',
                                                }}>
                                                    <AnimatePresence mode="popLayout">
                                                        {filteredArticles.map((article, i) => (
                                                            <ArticleCard 
                                                                key={article.id} 
                                                                article={article} 
                                                                index={i} 
                                                                isDarkMode={isDarkMode} 
                                                            />
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
                                                <SectionHeader 
                                                    title={debouncedQuery ? `Quick Links` : 'Quick Links'} 
                                                    description="Helpful resources and external integrations" 
                                                    badgeText={debouncedQuery ? `${filteredQuickLinks.length} Links` : '3 Links'}
                                                    color="#8b5cf6"
                                                    isDarkMode={isDarkMode}
                                                />
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <AnimatePresence mode="popLayout">
                                                        {filteredQuickLinks.map((link, i) => (
                                                            <QuickLinkCard 
                                                                key={link.id} 
                                                                link={link} 
                                                                index={i} 
                                                                isDarkMode={isDarkMode} 
                                                            />
                                                        ))}
                                                    </AnimatePresence>
                                                </div>
                                            </motion.div>
                                        )}
                                    </>
                                )}
                            </LayoutGroup>
                        </div>

                        {/* Footer */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ 
                                opacity: 1,
                                padding: isMinimized ? '8px 16px' : '18px 24px',
                                paddingTop: isMinimized ? '6px' : '18px',
                                paddingBottom: isMinimized ? '6px' : '18px',
                            }}
                            transition={{ delay: 0.35 }}
                            className="border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-[20px]"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <FooterCTABanner isDarkMode={isDarkMode} isMinimized={isMinimized} />
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default HelpCenterModal;
