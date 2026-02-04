/**
 * Activity Modal
 * Professional minimalistic design matching GroupsContent/AtRiskStudentsModal
 * Fetches real activity data from Supabase database (student_submissions)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT } from './constants';

// ============================================
// TYPES
// ============================================
interface ActivityItem {
    id: string;
    action: string;
    student: string;
    studentId: string;
    course: string;
    taskTitle: string;
    time: string;
    timestamp: Date;
    type: 'submission' | 'grade' | 'late' | 'pending';
    score?: number;
    status: string;
}

interface ActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// ============================================
// CONSTANTS
// ============================================
const ACCENT_COLOR = '#3b82f6';
const SUCCESS_COLOR = '#10b981';
const WARNING_COLOR = '#f59e0b';
const DANGER_COLOR = '#ef4444';

// ============================================
// HELPER FUNCTIONS
// ============================================
const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ============================================
// SKELETON LOADING COMPONENT
// ============================================
const ActivitySkeleton: React.FC = () => {
    const shimmer = 'linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 100%)';
    
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.lg,
            padding: SPACING.lg,
            borderRadius: BORDER_RADIUS.xl,
            background: 'rgba(0,0,0,0.02)',
        }}>
            <motion.div
                animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.06)',
                    backgroundImage: shimmer,
                    backgroundSize: '200% 100%',
                }}
            />
            <div style={{ flex: 1 }}>
                <motion.div
                    animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    style={{
                        width: '60%',
                        height: '14px',
                        borderRadius: '4px',
                        background: 'rgba(0,0,0,0.06)',
                        backgroundImage: shimmer,
                        backgroundSize: '200% 100%',
                        marginBottom: '8px',
                    }}
                />
                <motion.div
                    animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    style={{
                        width: '40%',
                        height: '12px',
                        borderRadius: '4px',
                        background: 'rgba(0,0,0,0.06)',
                        backgroundImage: shimmer,
                        backgroundSize: '200% 100%',
                    }}
                />
            </div>
            <motion.div
                animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                style={{
                    width: '60px',
                    height: '12px',
                    borderRadius: '4px',
                    background: 'rgba(0,0,0,0.06)',
                    backgroundImage: shimmer,
                    backgroundSize: '200% 100%',
                }}
            />
        </div>
    );
};

// ============================================
// FILTER TABS COMPONENT
// ============================================
type FilterType = 'all' | 'submissions' | 'graded' | 'late' | 'pending';

const FilterTabs: React.FC<{
    activeFilter: FilterType;
    setActiveFilter: (filter: FilterType) => void;
    counts: { all: number; submissions: number; graded: number; late: number; pending: number };
}> = ({ activeFilter, setActiveFilter, counts }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 4, width: 60 });
    
    const tabs: { id: FilterType; label: string; count: number }[] = [
        { id: 'all', label: 'All', count: counts.all },
        { id: 'submissions', label: 'Submitted', count: counts.submissions },
        { id: 'graded', label: 'Graded', count: counts.graded },
        { id: 'late', label: 'Late', count: counts.late },
        { id: 'pending', label: 'Pending', count: counts.pending },
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

    return (
        <div 
            ref={containerRef}
            style={{
                display: 'flex',
                gap: '4px',
                padding: '4px',
                borderRadius: BORDER_RADIUS.xl,
                background: 'rgba(0,0,0,0.02)',
                position: 'relative',
                overflowX: 'auto',
            }}
        >
            <motion.div
                style={{
                    position: 'absolute',
                    top: '4px',
                    bottom: '4px',
                    borderRadius: BORDER_RADIUS.lg,
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    zIndex: 0,
                }}
                initial={false}
                animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
            {tabs.map((tab) => (
                <motion.button
                    key={tab.id}
                    data-filter-tab={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: BORDER_RADIUS.lg,
                        border: 'none',
                        background: 'transparent',
                        color: activeFilter === tab.id ? ACCENT_COLOR : COLORS.textSecondary,
                        fontSize: FONT_SIZE.sm,
                        fontWeight: FONT_WEIGHT.medium,
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 1,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {tab.label}
                    <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        background: activeFilter === tab.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0,0,0,0.05)',
                    }}>
                        {tab.count}
                    </span>
                </motion.button>
            ))}
        </div>
    );
};


// ============================================
// ACTIVITY CARD COMPONENT
// ============================================
const ActivityCard: React.FC<{
    activity: ActivityItem;
    index: number;
}> = ({ activity, index }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const getTypeColor = (type: string) => {
        switch (type) {
            case 'submission': return ACCENT_COLOR;
            case 'grade': return SUCCESS_COLOR;
            case 'late': return DANGER_COLOR;
            case 'pending': return WARNING_COLOR;
            default: return ACCENT_COLOR;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'submission':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                    </svg>
                );
            case 'grade':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                );
            case 'late':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                );
            case 'pending':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                );
            default:
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                    </svg>
                );
        }
    };

    const typeColor = getTypeColor(activity.type);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ delay: index * 0.02, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            style={{
                background: COLORS.surface,
                borderRadius: BORDER_RADIUS.xl,
                border: `1px solid ${isHovered ? `${typeColor}30` : COLORS.border}`,
                padding: SPACING.lg,
                cursor: 'pointer',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg }}>
                {/* Type Icon */}
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: `${typeColor}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: typeColor,
                    flexShrink: 0,
                }}>
                    {getTypeIcon(activity.type)}
                </div>
                
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                        fontSize: FONT_SIZE.md, 
                        fontWeight: FONT_WEIGHT.semibold, 
                        color: COLORS.textPrimary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: '2px',
                    }}>
                        {activity.action}
                    </div>
                    <div style={{ 
                        fontSize: FONT_SIZE.sm, 
                        color: COLORS.textSecondary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: SPACING.sm,
                        flexWrap: 'wrap',
                    }}>
                        <span style={{ fontWeight: 500 }}>{activity.student}</span>
                        <span style={{ color: COLORS.textMuted }}>•</span>
                        <span>{activity.course}</span>
                        {activity.taskTitle && (
                            <>
                                <span style={{ color: COLORS.textMuted }}>•</span>
                                <span style={{ 
                                    maxWidth: '150px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}>
                                    {activity.taskTitle}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                
                {/* Score & Time */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {activity.score !== undefined && activity.type === 'grade' && (
                        <div style={{ 
                            fontSize: FONT_SIZE.lg, 
                            fontWeight: FONT_WEIGHT.bold, 
                            color: activity.score >= 75 ? SUCCESS_COLOR : activity.score >= 60 ? WARNING_COLOR : DANGER_COLOR,
                            marginBottom: '2px',
                        }}>
                            {activity.score}%
                        </div>
                    )}
                    <div style={{ 
                        fontSize: FONT_SIZE.xs, 
                        color: COLORS.textMuted,
                    }}>
                        {activity.time}
                    </div>
                    
                    {/* Status Badge */}
                    <div style={{
                        marginTop: '6px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: `${typeColor}10`,
                        border: `1px solid ${typeColor}25`,
                        color: typeColor,
                        fontSize: '10px',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                    }}>
                        {activity.status}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};


// ============================================
// MAIN MODAL COMPONENT
// ============================================
const ActivityModal: React.FC<ActivityModalProps> = ({ isOpen, onClose }) => {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [error, setError] = useState<string | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Handle search with debounce for loading indicator
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        if (value) {
            setIsSearching(true);
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = setTimeout(() => setIsSearching(false), 300);
        } else {
            setIsSearching(false);
        }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, []);

    // Fetch activities from database
    const fetchActivities = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            if (!supabase) {
                throw new Error('Database not configured');
            }

            // Fetch submissions with task details
            const { data: submissions, error: fetchError } = await supabase
                .from('student_submissions')
                .select('id, student_id, student_name, task_id, status, submitted_at, score')
                .order('submitted_at', { ascending: false })
                .limit(100);

            if (fetchError) throw fetchError;

            if (submissions && submissions.length > 0) {
                // Get task details for course info
                const taskIds = [...new Set(submissions.map(s => s.task_id))];
                const { data: tasks } = await supabase
                    .from('course_tasks')
                    .select('id, course_id, title')
                    .in('id', taskIds);

                const taskMap = new Map(tasks?.map(t => [t.id, t]) || []);

                const activityData: ActivityItem[] = submissions.map((sub) => {
                    const task = taskMap.get(sub.task_id);
                    let action = 'New submission';
                    let type: ActivityItem['type'] = 'submission';
                    
                    if (sub.status === 'graded') {
                        action = 'Submission graded';
                        type = 'grade';
                    } else if (sub.status === 'late') {
                        action = 'Late submission';
                        type = 'late';
                    } else if (sub.status === 'pending') {
                        action = 'Pending review';
                        type = 'pending';
                    }

                    return {
                        id: sub.id,
                        action,
                        student: sub.student_name || 'Unknown Student',
                        studentId: sub.student_id,
                        course: task?.course_id?.toUpperCase() || 'Course',
                        taskTitle: task?.title || '',
                        time: formatTimeAgo(new Date(sub.submitted_at)),
                        timestamp: new Date(sub.submitted_at),
                        type,
                        score: sub.score,
                        status: sub.status,
                    };
                });

                setActivities(activityData);
            } else {
                setActivities([]);
            }
        } catch (err) {
            console.error('Failed to fetch activities:', err);
            setError('Failed to load activities. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchActivities();
        }
    }, [isOpen, fetchActivities]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Filter activities
    const filteredActivities = activities.filter(activity => {
        const matchesSearch = activity.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             activity.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             activity.taskTitle.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;
        
        switch (activeFilter) {
            case 'submissions': return activity.type === 'submission';
            case 'graded': return activity.type === 'grade';
            case 'late': return activity.type === 'late';
            case 'pending': return activity.type === 'pending';
            default: return true;
        }
    });

    // Calculate counts
    const counts = {
        all: activities.length,
        submissions: activities.filter(a => a.type === 'submission').length,
        graded: activities.filter(a => a.type === 'grade').length,
        late: activities.filter(a => a.type === 'late').length,
        pending: activities.filter(a => a.type === 'pending').length,
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: SPACING.xl,
                    }}
                >
                    <motion.div
                        ref={modalRef}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: '900px',
                            maxHeight: '85vh',
                            background: COLORS.background,
                            borderRadius: BORDER_RADIUS.full,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: SPACING.xxl,
                            borderBottom: `1px solid ${COLORS.border}`,
                            background: COLORS.surface,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg }}>
                                    <motion.div
                                        whileHover={{ scale: 1.05, rotate: 5 }}
                                        transition={{ duration: 0.15, ease: 'easeOut' }}
                                        style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: BORDER_RADIUS.xl,
                                            background: `linear-gradient(135deg, ${ACCENT_COLOR}15 0%, ${ACCENT_COLOR}08 100%)`,
                                            border: `1px solid ${ACCENT_COLOR}25`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: ACCENT_COLOR,
                                        }}
                                    >
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                    </motion.div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h2 style={{ 
                                                fontSize: FONT_SIZE.xxl, 
                                                fontWeight: FONT_WEIGHT.semibold, 
                                                color: COLORS.textPrimary, 
                                                margin: 0 
                                            }}>
                                                All Activity
                                            </h2>
                                            <span style={{
                                                padding: '3px 8px',
                                                borderRadius: '6px',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: ACCENT_COLOR,
                                            }}>
                                                {activities.length} items
                                            </span>
                                        </div>
                                        <p style={{ 
                                            fontSize: FONT_SIZE.sm, 
                                            color: COLORS.textSecondary, 
                                            margin: 0 
                                        }}>
                                            Recent submissions and grading activity
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Close Button */}
                                <motion.button
                                    whileHover={{ scale: 1.1, background: 'rgba(0,0,0,0.08)' }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onClose}
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: BORDER_RADIUS.lg,
                                        border: 'none',
                                        background: 'rgba(0,0,0,0.04)',
                                        color: COLORS.textSecondary,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </motion.button>
                            </div>
                            
                            {/* Search & Filters */}
                            <div style={{ display: 'flex', gap: SPACING.md, flexWrap: 'wrap', alignItems: 'center' }}>
                                {/* Search Input */}
                                <div style={{
                                    flex: 1,
                                    minWidth: '200px',
                                    position: 'relative',
                                }}>
                                    {/* Search Icon Container */}
                                    <div style={{ 
                                        position: 'absolute', 
                                        left: '12px', 
                                        top: 0, 
                                        bottom: 0, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        pointerEvents: 'none', 
                                        zIndex: 1 
                                    }}>
                                        <svg 
                                            width="16" 
                                            height="16" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke={COLORS.textMuted}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{ display: 'block' }}
                                        >
                                            <circle cx="11" cy="11" r="8" />
                                            <path d="m21 21-4.35-4.35" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by student, course, or task..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 40px 10px 40px',
                                            borderRadius: BORDER_RADIUS.xl,
                                            border: `1px solid ${COLORS.border}`,
                                            background: COLORS.surface,
                                            fontSize: FONT_SIZE.sm,
                                            color: COLORS.textPrimary,
                                            outline: 'none',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = ACCENT_COLOR;
                                            e.target.style.boxShadow = `0 0 0 3px ${ACCENT_COLOR}15`;
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = COLORS.border;
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                    {/* Loading Spinner */}
                                    <AnimatePresence>
                                        {isSearching && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.5 }} 
                                                animate={{ opacity: 1, scale: 1 }} 
                                                exit={{ opacity: 0, scale: 0.5 }} 
                                                transition={{ duration: 0.15 }}
                                                style={{ position: 'absolute', right: '12px', top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <motion.svg 
                                                    width="16" 
                                                    height="16" 
                                                    viewBox="0 0 16 16" 
                                                    fill="none" 
                                                    style={{ display: 'block' }} 
                                                    animate={{ rotate: 360 }} 
                                                    transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                                                >
                                                    <circle cx="8" cy="8" r="6" stroke="rgba(59, 130, 246, 0.15)" strokeWidth="2" fill="none" />
                                                    <circle cx="8" cy="8" r="6" stroke={ACCENT_COLOR} strokeWidth="2" strokeLinecap="round" strokeDasharray="28" strokeDashoffset="21" fill="none" />
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
                                                style={{ 
                                                    position: 'absolute', 
                                                    right: '10px', 
                                                    top: 0,
                                                    bottom: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <motion.button 
                                                    onClick={() => setSearchQuery('')}
                                                    aria-label="Clear search"
                                                    title="Clear search"
                                                    style={{ 
                                                        background: 'rgba(0,0,0,0.06)', 
                                                        border: 'none', 
                                                        borderRadius: '6px', 
                                                        width: '20px', 
                                                        height: '20px', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center', 
                                                        cursor: 'pointer', 
                                                        padding: 0,
                                                    }}
                                                    whileHover={{ scale: 1.1 }} 
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                                                        <path d="M18 6L6 18M6 6l12 12" />
                                                    </svg>
                                                </motion.button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                
                                {/* Filter Tabs */}
                                <FilterTabs 
                                    activeFilter={activeFilter} 
                                    setActiveFilter={setActiveFilter}
                                    counts={counts}
                                />
                            </div>
                        </div>
                        
                        {/* Content */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: SPACING.xxl,
                        }}>
                            {isLoading || isSearching ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
                                    {[...Array(isSearching ? 3 : 6)].map((_, i) => (
                                        <ActivitySkeleton key={i} />
                                    ))}
                                </div>
                            ) : error ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: SPACING.xxxl,
                                    textAlign: 'center',
                                }}>
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '50%',
                                        background: `${DANGER_COLOR}10`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: SPACING.lg,
                                    }}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={DANGER_COLOR} strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                    </div>
                                    <p style={{ color: COLORS.textSecondary, marginBottom: SPACING.lg }}>{error}</p>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={fetchActivities}
                                        style={{
                                            padding: '8px 16px',
                                            background: ACCENT_COLOR,
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: BORDER_RADIUS.lg,
                                            fontSize: FONT_SIZE.sm,
                                            fontWeight: FONT_WEIGHT.medium,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Try Again
                                    </motion.button>
                                </div>
                            ) : filteredActivities.length === 0 ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: SPACING.xxxl,
                                    textAlign: 'center',
                                }}>
                                    <div style={{
                                        width: '72px',
                                        height: '72px',
                                        borderRadius: '50%',
                                        background: `linear-gradient(135deg, ${ACCENT_COLOR}15 0%, ${ACCENT_COLOR}05 100%)`,
                                        border: `1px solid ${ACCENT_COLOR}20`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: SPACING.lg,
                                    }}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={ACCENT_COLOR} strokeWidth="1.5">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                    </div>
                                    <h3 style={{ 
                                        fontSize: FONT_SIZE.lg, 
                                        fontWeight: FONT_WEIGHT.semibold, 
                                        color: COLORS.textPrimary,
                                        margin: 0,
                                        marginBottom: SPACING.xs,
                                    }}>
                                        {searchQuery ? 'No matching activity' : 'No activity yet'}
                                    </h3>
                                    <p style={{ 
                                        fontSize: FONT_SIZE.sm, 
                                        color: COLORS.textSecondary,
                                        margin: 0,
                                    }}>
                                        {searchQuery 
                                            ? 'Try adjusting your search or filters' 
                                            : 'Activity will appear here when students submit work'}
                                    </p>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
                                        {filteredActivities.map((activity, index) => (
                                            <ActivityCard 
                                                key={activity.id} 
                                                activity={activity} 
                                                index={index} 
                                            />
                                        ))}
                                    </div>
                                </AnimatePresence>
                            )}
                        </div>
                        
                        {/* Footer */}
                        <div style={{
                            padding: `${SPACING.lg} ${SPACING.xxl}`,
                            borderTop: `1px solid ${COLORS.border}`,
                            background: COLORS.surface,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <span style={{ fontSize: FONT_SIZE.sm, color: COLORS.textSecondary }}>
                                Showing {filteredActivities.length} of {activities.length} activities
                            </span>
                            
                            <motion.button
                                whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={fetchActivities}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 12px',
                                    background: 'rgba(59, 130, 246, 0.08)',
                                    color: ACCENT_COLOR,
                                    border: `1px solid rgba(59, 130, 246, 0.2)`,
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M23 4v6h-6" />
                                    <path d="M1 20v-6h6" />
                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                </svg>
                                Refresh
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ActivityModal;
