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
} from '../../services/pathsService';

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
            transition={{ delay: index * 0.05, duration: 0.2 }}
            onClick={() => onClick?.(path.id)}
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
            }}
            whileHover={{ backgroundColor: colors.hoverBg }}
        >
            {/* Path Icon */}
            <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 + 0.1, type: 'spring' }}
                style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: `${path.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <PathIcon icon={path.icon} color={path.color} size={18} />
            </motion.div>

            {/* Path Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    margin: 0,
                    fontSize: '12px',
                    fontWeight: 600,
                    color: colors.textPrimary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}>
                    {path.title}
                </p>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    marginTop: '3px',
                    flexWrap: 'wrap',
                }}>
                    <span style={{ 
                        fontSize: '9px', 
                        fontWeight: 500,
                        color: difficultyInfo.color,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: `${difficultyInfo.color}15`,
                    }}>
                        {difficultyInfo.label}
                    </span>
                    <span style={{ fontSize: '10px', color: colors.textMuted }}>
                        {path.completed_courses_count}/{path.total_courses} courses • {getPathTotalModules(path)} modules
                    </span>
                </div>
                {/* Course thumbnails */}
                <div style={{ 
                    display: 'flex', 
                    gap: '3px', 
                    marginTop: '6px',
                }}>
                    {getPathCourses(path).slice(0, 4).map((course, i) => (
                        <img
                            key={course.id}
                            src={course.image}
                            alt={course.shortTitle}
                            title={course.title}
                            style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '4px',
                                objectFit: 'cover',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                                opacity: i < (path.progress?.completed_courses.length || 0) ? 1 : 0.5,
                            }}
                        />
                    ))}
                    {path.courses.length > 4 && (
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            background: `${path.color}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '8px',
                            fontWeight: 600,
                            color: path.color,
                        }}>
                            +{path.courses.length - 4}
                        </div>
                    )}
                </div>
                
                {/* Progress bar */}
                <div style={{
                    marginTop: '6px',
                    height: '4px',
                    borderRadius: '2px',
                    background: colors.progressBarBg,
                    overflow: 'hidden',
                }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 + 0.2 }}
                        style={{
                            height: '100%',
                            borderRadius: '2px',
                            background: progress === 100 ? '#10b981' : path.color,
                        }}
                    />
                </div>
            </div>

            {/* Progress percentage */}
            <div style={{ 
                flexShrink: 0, 
                display: 'flex', 
                alignItems: 'center',
                paddingTop: '2px',
            }}>
                {progress === 100 ? (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, delay: index * 0.05 }}
                        style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </motion.div>
                ) : (
                    <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: path.color,
                    }}>
                        {progress}%
                    </span>
                )}
            </div>
        </motion.div>
    );
});

PathItem.displayName = 'PathItem';

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

    const colors = getColors(isDarkMode);
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
                    initial={{ opacity: 0, x: -8, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -8, scale: 0.96 }}
                    transition={{ type: 'spring', bounce: 0.1, duration: 0.25 }}
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                    style={{
                        position: 'fixed',
                        top: position.top,
                        left: position.left,
                        width: '280px',
                        background: colors.dropdownBg,
                        borderRadius: '12px',
                        boxShadow: colors.boxShadow,
                        overflow: 'hidden',
                        zIndex: 10000,
                    }}
                >
                    {/* Header */}
                    <div style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.headerBorder}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: colors.headerText, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Learning Paths
                            </span>
                            <span style={{ fontSize: '10px', color: colors.textMuted }}>
                                {stats.inProgressPaths} active
                            </span>
                        </div>
                    </div>

                    {/* Continue Learning Card */}
                    {activePath && !isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            style={{
                                margin: '10px',
                                padding: '12px',
                                background: colors.cardBg,
                                borderRadius: '10px',
                                border: `1px solid ${colors.cardBorder}`,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.textAccent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                                <span style={{ fontSize: '9px', fontWeight: 600, color: colors.textAccent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Continue Path
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: `${activePath.color}20`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <PathIcon icon={activePath.icon} color={activePath.color} size={16} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: colors.textPrimary }}>
                                        {activePath.title}
                                    </p>
                                    <p style={{ margin: '2px 0 0', fontSize: '10px', color: colors.textSecondary }}>
                                        {activePath.progress?.progress_percentage || 0}% complete
                                    </p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onPathClick?.(activePath.id)}
                                style={{
                                    marginTop: '10px',
                                    width: '100%',
                                    padding: '7px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    background: activePath.color,
                                    color: 'white',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                }}
                            >
                                Resume Learning
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Empty state */}
                    {!isLoading && paths.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                                padding: '24px 16px',
                                textAlign: 'center',
                            }}
                        >
                            <div style={{
                                width: '48px',
                                height: '48px',
                                margin: '0 auto 12px',
                                borderRadius: '12px',
                                background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.textAccent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 3v18h18" />
                                    <path d="m19 9-5 5-4-4-3 3" />
                                </svg>
                            </div>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: 500, color: colors.textPrimary }}>
                                No paths enrolled yet
                            </p>
                            <p style={{ margin: '4px 0 0', fontSize: '11px', color: colors.textMuted }}>
                                Start a learning journey today
                            </p>
                        </motion.div>
                    )}

                    {/* Path List */}
                    {paths.length > 0 && (
                        <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '4px 6px' }}>
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
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        style={{
                            padding: '10px 14px',
                            borderTop: `1px solid ${colors.headerBorder}`,
                        }}
                    >
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={onViewAllClick}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: 'none',
                                borderRadius: '8px',
                                background: 'transparent',
                                color: colors.textAccent,
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'background 0.15s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = colors.footerHoverBg)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 3v18h18" />
                                <path d="m19 9-5 5-4-4-3 3" />
                            </svg>
                            Explore All Paths
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default React.memo(SidebarPathsDropdown);
