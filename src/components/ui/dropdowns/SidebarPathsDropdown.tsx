/**
 * Sidebar Paths Dropdown - Learning Paths Quick Access
 * Shows enrolled paths with progress and quick actions
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
    getEnrolledPaths, 
    getPathStats, 
    getDifficultyInfo,
    getPathCourses,
    getPathTotalModules,
    type PathWithProgress 
} from '../../../services/pathsService';

interface SidebarPathsDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    onPathClick?: (pathId: string) => void;
    onViewAllClick?: () => void;
    anchorRef?: React.RefObject<HTMLDivElement | null>;
}

// Dark mode color palette
const getColors = (isDark: boolean) => ({
    dropdownBg: isDark ? '#1e293b' : '#ffffff',
    headerBorder: isDark ? 'rgba(71, 85, 105, 0.5)' : '#f4f4f5',
    cardBg: isDark 
        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)' 
        : 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)',
    cardBorder: isDark ? 'rgba(59, 130, 246, 0.3)' : '#e0e7ff',
    hoverBg: isDark ? 'rgba(51, 65, 85, 0.6)' : 'rgba(244, 244, 245, 0.8)',
    footerHoverBg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
    skeletonBg: isDark ? 'rgba(71, 85, 105, 0.6)' : '#e4e4e7',
    skeletonShine: isDark ? 'rgba(100, 116, 139, 0.8)' : '#d4d4d8',
    progressBarBg: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.08)',
    textPrimary: isDark ? '#f1f5f9' : '#18181b',
    textSecondary: isDark ? '#94a3b8' : '#71717a',
    textMuted: isDark ? '#64748b' : '#a1a1aa',
    textAccent: isDark ? '#60a5fa' : '#3b82f6',
    headerText: isDark ? '#cbd5e1' : '#52525b',
    boxShadow: isDark 
        ? '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(71, 85, 105, 0.3)' 
        : '0 4px 24px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
});

// Path icon component
const PathIcon: React.FC<{ icon: string; color: string; size?: number }> = ({ icon, color, size = 16 }) => {
    const icons: Record<string, React.ReactNode> = {
        code: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
            </svg>
        ),
        chart: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
        ),
        mobile: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
        ),
        shield: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
        default: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
            </svg>
        ),
    };

    return (
        <div style={{ color }}>{icons[icon] || icons.default}</div>
    );
};

// Skeleton Loading Component
const Skeleton: React.FC<{ style?: React.CSSProperties; isDark?: boolean }> = ({ style, isDark }) => {
    const colors = getColors(isDark || false);
    return (
        <motion.div
            style={{
                backgroundColor: colors.skeletonBg,
                borderRadius: '4px',
                ...style,
            }}
            animate={{ 
                backgroundColor: [colors.skeletonBg, colors.skeletonShine, colors.skeletonBg] 
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
    );
};

// Path Skeleton
const PathSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px' }}>
                <Skeleton isDark={isDark} style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Skeleton isDark={isDark} style={{ height: '12px', width: '75%' }} />
                    <Skeleton isDark={isDark} style={{ height: '10px', width: '50%' }} />
                    <Skeleton isDark={isDark} style={{ height: '4px', width: '100%', borderRadius: '2px' }} />
                </div>
            </div>
        ))}
    </div>
);

// Path item component
const PathItem = React.memo<{
    path: PathWithProgress;
    index: number;
    onClick?: (id: string) => void;
    isDark: boolean;
}>(({ path, index, onClick, isDark }) => {
    const colors = getColors(isDark);
    const difficultyInfo = getDifficultyInfo(path.difficulty);
    const progress = path.progress?.progress_percentage || 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            onClick={() => onClick?.(path.id)}
            className="flex flex-col gap-2.5 p-3 rounded-[18px] cursor-pointer transition-all duration-300 border bg-white dark:bg-zinc-900/40 border-zinc-150 dark:border-zinc-800/50 hover:border-blue-200/60 dark:hover:border-blue-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 hover:shadow-md group"
            style={{ marginBottom: '8px' }}
        >
            {/* Upper Section: Icon & Info Column */}
            <div className="flex items-center gap-3.5 w-full min-w-0">
                {/* Wrench-Style Path Icon Container with Spring Hover */}
                <motion.div
                    whileHover={{ scale: 1.05, rotate: -3 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    style={{ background: `${path.color}15`, border: `1px solid ${path.color}20` }}
                    className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 shadow-sm relative overflow-hidden bg-white dark:bg-zinc-805"
                >
                    <PathIcon icon={path.icon} color={path.color} size={20} />
                </motion.div>

                {/* Path Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="text-[13.5px] font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {path.title}
                    </div>
                    
                    {/* Detail tags row */}
                    <div className="flex items-center gap-1.5 mt-1 text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-none flex-wrap font-medium">
                        <span style={{ color: difficultyInfo.color, background: `${difficultyInfo.color}15` }} className="text-[8.5px] font-black px-1.5 py-0.5 rounded-[4px] leading-none uppercase">
                            {difficultyInfo.label}
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="font-bold text-zinc-700 dark:text-zinc-350">
                            {path.completed_courses_count}/{path.total_courses} courses
                        </span>
                    </div>
                </div>

                {/* Right Progress Badge in Student Tools Star card style */}
                <div className="flex-shrink-0">
                    <div className="flex items-center gap-1.5 p-1.5 px-2 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-150 dark:border-zinc-800/50 hover:border-blue-200 dark:hover:border-blue-800/60 transition-colors group-hover:border-blue-200">
                        {progress === 100 ? (
                            <div className="text-emerald-500 bg-emerald-100 dark:bg-emerald-950/40 p-1 rounded-lg border border-emerald-200/50 flex-shrink-0">
                                <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                        ) : (
                            <div style={{ color: path.color, background: `${path.color}15`, borderColor: `${path.color}30` }} className="p-1 rounded-lg border flex-shrink-0">
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                            </div>
                        )}
                        <span className={`text-[11px] font-black leading-none ${
                            progress === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'
                        }`}>
                            {progress}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Lower Section: Thumbnails & Progress Bar */}
            <div className="w-full flex items-center justify-between gap-3 mt-0.5">
                {/* Course Thumbnails (standard stack row) */}
                <div className="flex gap-1 flex-shrink-0">
                    {getPathCourses(path).slice(0, 4).map((course, i) => (
                        <img
                            key={course.id}
                            src={course.image}
                            alt={course.shortTitle}
                            title={course.title}
                            className="w-6 h-6 rounded-[6px] object-cover border"
                            style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                opacity: i < (path.progress?.completed_courses.length || 0) ? 1 : 0.4,
                            }}
                        />
                    ))}
                    {path.courses.length > 4 && (
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            background: `${path.color}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9px',
                            fontWeight: 700,
                            color: path.color,
                        }}>
                            +{path.courses.length - 4}
                        </div>
                    )}
                </div>

                {/* Micro Progress Bar on the Right */}
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: colors.progressBarBg }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 + 0.2 }}
                        className="h-full rounded-full"
                        style={{
                            background: progress === 100 ? '#10b981' : path.color,
                        }}
                    />
                </div>
            </div>
        </motion.div>
    );
});

PathItem.displayName = 'PathItem';

// Continue Path Card Component (Re-engineered to exactly match Student Tools card layout)
const ContinuePathCard: React.FC<{
    path: PathWithProgress;
    onPathClick?: (id: string) => void;
    isDark: boolean;
}> = ({ path, onPathClick, isDark }) => {
    const difficultyInfo = getDifficultyInfo(path.difficulty);
    const progress = path.progress?.progress_percentage || 0;

    return (
        <div
            onClick={() => onPathClick?.(path.id)}
            className="mx-4 my-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[20px] flex items-center gap-3.5 group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 relative overflow-hidden cursor-pointer"
        >
            {/* SaaS Background Accents */}
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-24 h-24 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-2xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-20 h-20 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-2xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
            
            {/* Path Icon Container with spring hover animation */}
            <motion.div
                whileHover={{ scale: 1.05, rotate: -5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                style={{ background: `${path.color}15`, borderColor: `${path.color}20` }}
                className="w-12 h-12 rounded-[14px] border flex items-center justify-center flex-shrink-0 shadow-sm relative z-10 bg-white dark:bg-zinc-850"
            >
                <PathIcon icon={path.icon} color={path.color} size={20} />
            </motion.div>
            
            {/* Text Info */}
            <div className="min-w-0 flex-1 relative z-10">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none">
                        Continue Path
                    </span>
                    
                    {/* Compact, elegant inline progress badge */}
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100/60 dark:border-blue-800/30 leading-none">
                        {progress}% PROGRESS
                    </span>
                </div>
                
                <h3 className="text-[14px] font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {path.title}
                </h3>
                
                <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-none font-medium mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span style={{ color: difficultyInfo.color }} className="font-bold">
                        {difficultyInfo.label}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    <span className="font-bold text-zinc-700 dark:text-zinc-350">
                        {path.completed_courses_count}/{path.total_courses} courses
                    </span>
                </p>
            </div>
        </div>
    );
};

const SidebarPathsDropdown: React.FC<SidebarPathsDropdownProps> = ({
    isOpen,
    onClose,
    onPathClick,
    onViewAllClick,
    anchorRef,
}) => {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [paths, setPaths] = useState<PathWithProgress[]>([]);
    const [isDarkMode, setIsDarkMode] = useState(() => 
        typeof document !== 'undefined' && document.body.classList.contains('dark-mode')
    );
    const closeTimeoutRef = useRef<number | null>(null);

    // Check for dark mode changes
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.body.classList.contains('dark-mode'));
        };
        checkDarkMode();
        
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        
        return () => observer.disconnect();
    }, []);

    // Load paths when dropdown opens
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            getEnrolledPaths('demo-student').then((data) => {
                setPaths(data);
                setIsLoading(false);
            });
        }
    }, [isOpen]);

    const stats = useMemo(() => getPathStats(paths), [paths]);

    // Get the most recent active path
    const activePath = useMemo(() => {
        return paths.find(p => p.progress && !p.progress.completed_at);
    }, [paths]);

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
                    className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-900 dark:text-zinc-100 shadow-2xl rounded-[20px] overflow-hidden"
                    style={{
                        position: 'fixed',
                        top: position.top,
                        left: position.left,
                        width: '350px',
                        zIndex: 10000,
                    }}
                >
                    {/* Header - Re-engineered for SaaS Professionalism (Student Tools Style) */}
                    <div className="p-5 pb-4 border-b border-zinc-100 dark:border-zinc-800/80 relative overflow-hidden bg-white dark:bg-zinc-900">
                        {/* Background subtle accents */}
                        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                        
                        <div className="flex items-center justify-between gap-4 relative z-10">
                            {/* Left: Icon, Title & Description */}
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                    className="w-12 h-12 rounded-[14px] bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm"
                                >
                                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 3v18h18" />
                                        <path d="m19 9-5 5-4-4-3 3" />
                                    </svg>
                                </motion.div>
                                
                                <div className="min-w-0">
                                    <h2 className="text-[17px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight mb-0.5 truncate">
                                        Learning Paths
                                    </h2>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug truncate">
                                        Track your skill tracks
                                    </p>
                                </div>
                            </div>

                            {/* Right: Modern Stat Card */}
                            <div className="flex-shrink-0">
                                <div className="flex items-center gap-2.5 p-2.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-800/60 transition-colors">
                                    <div className="text-blue-500 bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg flex-shrink-0 border border-blue-200/50 dark:border-blue-800/30">
                                        <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                        </svg>
                                    </div>
                                    <div className="leading-none">
                                        <p className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-0.5">Active</p>
                                        <p className="text-[12px] font-black text-zinc-900 dark:text-zinc-100 leading-none">{stats.inProgressPaths}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Continue Learning Card */}
                    {activePath && !isLoading && (
                        <ContinuePathCard 
                            path={activePath} 
                            onPathClick={onPathClick} 
                            isDark={isDarkMode} 
                        />
                    )}

                    {/* Empty state */}
                    {!isLoading && paths.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-6 text-center"
                        >
                            <div className="w-12 h-12 mx-auto mb-3 rounded-[12px] bg-blue-500/10 dark:bg-blue-500/5 flex items-center justify-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 3v18h18" />
                                    <path d="m19 9-5 5-4-4-3 3" />
                                </svg>
                            </div>
                            <p className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100">
                                No paths enrolled yet
                            </p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                                Start a learning journey today
                            </p>
                        </motion.div>
                    )}

                    {/* Path List */}
                    {paths.length > 0 && (
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }} className="px-2.5 py-1">
                            {isLoading ? (
                                <PathSkeleton isDark={isDarkMode} />
                            ) : (
                                paths.map((path, index) => (
                                    <PathItem
                                        key={path.id}
                                        path={path}
                                        index={index}
                                        onClick={onPathClick}
                                        isDark={isDarkMode}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30">
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={onViewAllClick}
                            className="w-full py-2.5 px-4 rounded-[12px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/60 hover:border-blue-200 dark:hover:border-blue-800/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[12px] font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <span>Explore All Paths</span>
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M3 3v18h18" />
                                <path d="m19 9-5 5-4-4-3 3" />
                            </svg>
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default React.memo(SidebarPathsDropdown);
