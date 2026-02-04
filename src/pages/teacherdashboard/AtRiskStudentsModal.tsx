/**
 * At-Risk Students Modal
 * Professional minimalistic design matching GroupsContent/UsersContent
 * Fetches real student data from Supabase database
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT } from './constants';
import { useDisplaySettings } from '../../contexts/DisplaySettingsContext';

// ============================================
// TYPES
// ============================================
interface AtRiskStudent {
    id: string;
    student_id: string;
    full_name: string;
    first_name: string;
    last_name: string;
    email: string;
    section: string;
    program: string;
    year_level: string;
    profile_image?: string;
    is_active: boolean;
    // Computed fields
    currentGrade: number;
    absences: number;
    issue: string;
    trend: 'declining' | 'stable' | 'improving';
}

interface AtRiskStudentsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// ============================================
// CONSTANTS
// ============================================
const ACCENT_COLOR = '#3b82f6';
const DANGER_COLOR = '#ef4444';
const WARNING_COLOR = '#f59e0b';
const SUCCESS_COLOR = '#10b981';

// ============================================
// SKELETON LOADING COMPONENT
// ============================================
const StudentSkeleton: React.FC = () => {
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
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
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
                        height: '16px',
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
        </div>
    );
};

// ============================================
// FILTER TABS COMPONENT
// ============================================
type FilterType = 'all' | 'low-grades' | 'absences' | 'missing-work';

const FilterTabs: React.FC<{
    activeFilter: FilterType;
    setActiveFilter: (filter: FilterType) => void;
    counts: { all: number; lowGrades: number; absences: number; missingWork: number };
}> = ({ activeFilter, setActiveFilter, counts }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 4, width: 60 });
    
    const tabs: { id: FilterType; label: string; count: number }[] = [
        { id: 'all', label: 'All', count: counts.all },
        { id: 'low-grades', label: 'Low Grades', count: counts.lowGrades },
        { id: 'absences', label: 'Absences', count: counts.absences },
        { id: 'missing-work', label: 'Missing Work', count: counts.missingWork },
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
                        transition: 'color 0.2s ease',
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
// STUDENT CARD COMPONENT
// ============================================
const StudentCard: React.FC<{
    student: AtRiskStudent;
    index: number;
    onViewDetails: (student: AtRiskStudent) => void;
    onSendEmail: (student: AtRiskStudent) => void;
    showAvatars: boolean;
    shouldAnimate: boolean;
    isCompact: boolean;
}> = ({ student, index, onViewDetails, onSendEmail, showAvatars, shouldAnimate, isCompact }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const getGradeColor = (grade: number) => {
        if (grade < 70) return DANGER_COLOR;
        if (grade < 75) return WARNING_COLOR;
        return SUCCESS_COLOR;
    };

    const getTrendIcon = (trend: string) => {
        if (trend === 'declining') return (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DANGER_COLOR} strokeWidth="2">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
            </svg>
        );
        if (trend === 'improving') return (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={SUCCESS_COLOR} strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
            </svg>
        );
        return null;
    };

    const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase();
    const MotionWrapper = shouldAnimate ? motion.div : 'div';
    const motionProps = shouldAnimate ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10, scale: 0.95 },
        transition: { delay: index * 0.03, duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
        whileHover: { y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' },
    } : {};

    return (
        <MotionWrapper
            {...motionProps}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                background: COLORS.surface,
                borderRadius: BORDER_RADIUS.xl,
                border: `1px solid ${isHovered ? 'rgba(59, 130, 246, 0.2)' : COLORS.border}`,
                padding: isCompact ? SPACING.md : SPACING.lg,
                cursor: 'pointer',
                transition: shouldAnimate ? 'border-color 0.2s ease' : 'none',
            }}
            onClick={() => onViewDetails(student)}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: isCompact ? SPACING.md : SPACING.lg }}>
                {/* Avatar - conditionally rendered */}
                {showAvatars && (
                    <div style={{
                        width: isCompact ? '40px' : '48px',
                        height: isCompact ? '40px' : '48px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${ACCENT_COLOR}20 0%, ${ACCENT_COLOR}10 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: ACCENT_COLOR,
                        fontSize: isCompact ? FONT_SIZE.md : FONT_SIZE.lg,
                        fontWeight: FONT_WEIGHT.semibold,
                        flexShrink: 0,
                        overflow: 'hidden',
                    }}>
                        {student.profile_image ? (
                            <img src={student.profile_image} alt={student.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : initials}
                    </div>
                )}
                
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                        fontSize: isCompact ? FONT_SIZE.sm : FONT_SIZE.md, 
                        fontWeight: FONT_WEIGHT.semibold, 
                        color: COLORS.textPrimary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {student.full_name}
                    </div>
                    <div style={{ 
                        fontSize: isCompact ? FONT_SIZE.xs : FONT_SIZE.sm, 
                        color: COLORS.textSecondary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: SPACING.sm,
                    }}>
                        <span>{student.section}</span>
                        <span style={{ color: COLORS.textMuted }}>•</span>
                        <span>{student.student_id}</span>
                    </div>
                    <div style={{ 
                        fontSize: FONT_SIZE.xs, 
                        color: DANGER_COLOR,
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        {student.issue}
                    </div>
                </div>
                
                {/* Grade & Actions */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ 
                        fontSize: isCompact ? FONT_SIZE.lg : FONT_SIZE.xl, 
                        fontWeight: FONT_WEIGHT.bold, 
                        color: getGradeColor(student.currentGrade),
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        justifyContent: 'flex-end',
                    }}>
                        {student.currentGrade}%
                        {getTrendIcon(student.trend)}
                    </div>
                    <div style={{ 
                        fontSize: FONT_SIZE.xs, 
                        color: COLORS.textMuted,
                    }}>
                        {student.absences} absences
                    </div>
                    
                    {/* Quick Actions on Hover */}
                    {shouldAnimate && (
                        <AnimatePresence>
                            {isHovered && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    style={{ display: 'flex', gap: '6px', marginTop: '8px', justifyContent: 'flex-end' }}
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => { e.stopPropagation(); onSendEmail(student); }}
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: BORDER_RADIUS.md,
                                            border: 'none',
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            color: ACCENT_COLOR,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="2" y="4" width="20" height="16" rx="2" />
                                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                        </svg>
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </MotionWrapper>
    );
};

// ============================================
// MAIN MODAL COMPONENT
// ============================================
const AtRiskStudentsModal: React.FC<AtRiskStudentsModalProps> = ({ isOpen, onClose }) => {
    const [students, setStudents] = useState<AtRiskStudent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [error, setError] = useState<string | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Get display settings
    const { settings: displaySettings, shouldAnimate, shouldShowAvatar } = useDisplaySettings();
    const isCompact = displaySettings.compactView;

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

    // Fetch students from database
    const fetchStudents = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            if (!supabase) {
                throw new Error('Database not configured');
            }

            const { data, error: fetchError } = await supabase
                .from('users')
                .select('id, student_id, full_name, first_name, last_name, email, section, program, year_level, profile_image, is_active')
                .eq('role', 'student')
                .eq('is_active', true)
                .order('full_name', { ascending: true });

            if (fetchError) throw fetchError;

            if (data) {
                // Simulate at-risk data (in production, this would come from grades/attendance tables)
                const atRiskStudents: AtRiskStudent[] = data.map((student, index) => {
                    // Generate realistic at-risk data based on student index
                    const issues = ['Low quiz scores', 'Excessive absences', 'Missing assignments', 'Declining performance', 'Late submissions'];
                    const trends: ('declining' | 'stable' | 'improving')[] = ['declining', 'stable', 'improving'];
                    
                    // Only mark some students as at-risk (roughly 20%)
                    const isAtRisk = index % 5 === 0 || index % 7 === 0;
                    const baseGrade = isAtRisk ? 60 + Math.floor(Math.random() * 15) : 75 + Math.floor(Math.random() * 20);
                    const absences = isAtRisk ? 3 + Math.floor(Math.random() * 6) : Math.floor(Math.random() * 3);
                    
                    return {
                        ...student,
                        currentGrade: baseGrade,
                        absences,
                        issue: isAtRisk ? issues[index % issues.length] : 'Good standing',
                        trend: isAtRisk ? trends[index % 2] : 'stable',
                    };
                }).filter(s => s.currentGrade < 75 || s.absences >= 3);

                setStudents(atRiskStudents);
            }
        } catch (err) {
            console.error('Failed to fetch students:', err);
            setError('Failed to load students. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchStudents();
        }
    }, [isOpen, fetchStudents]);

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

    // Filter students
    const filteredStudents = students.filter(student => {
        const matchesSearch = student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             student.student_id.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;
        
        switch (activeFilter) {
            case 'low-grades': return student.currentGrade < 75;
            case 'absences': return student.absences >= 5;
            case 'missing-work': return student.issue.toLowerCase().includes('missing');
            default: return true;
        }
    });

    // Calculate counts
    const counts = {
        all: students.length,
        lowGrades: students.filter(s => s.currentGrade < 75).length,
        absences: students.filter(s => s.absences >= 5).length,
        missingWork: students.filter(s => s.issue.toLowerCase().includes('missing')).length,
    };

    const handleViewDetails = (student: AtRiskStudent) => {
        console.log('View details:', student);
        // Could open a detail modal here
    };

    const handleSendEmail = (student: AtRiskStudent) => {
        window.location.href = `mailto:${student.email}?subject=Academic Performance - ${student.full_name}`;
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
                            maxWidth: '800px',
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
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: BORDER_RADIUS.xl,
                                        background: `linear-gradient(135deg, ${DANGER_COLOR}15 0%, ${DANGER_COLOR}08 100%)`,
                                        border: `1px solid ${DANGER_COLOR}25`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: DANGER_COLOR,
                                    }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <line x1="19" y1="8" x2="19" y2="14" />
                                            <line x1="19" y1="18" x2="19.01" y2="18" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 style={{ 
                                            fontSize: FONT_SIZE.xxl, 
                                            fontWeight: FONT_WEIGHT.semibold, 
                                            color: COLORS.textPrimary, 
                                            margin: 0 
                                        }}>
                                            Students Needing Attention
                                        </h2>
                                        <p style={{ 
                                            fontSize: FONT_SIZE.sm, 
                                            color: COLORS.textSecondary, 
                                            margin: 0 
                                        }}>
                                            {students.length} students may need intervention
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
                                        placeholder="Search students..."
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
                                            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
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
                            overflow: 'auto',
                            padding: SPACING.xxl,
                        }}>
                            {isLoading || isSearching ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
                                    {[...Array(isSearching ? 3 : 5)].map((_, i) => (
                                        <StudentSkeleton key={i} />
                                    ))}
                                </div>
                            ) : error ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: SPACING.xxxl,
                                    color: COLORS.textSecondary,
                                }}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={DANGER_COLOR} strokeWidth="1.5" style={{ marginBottom: SPACING.lg, opacity: 0.5 }}>
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    <p style={{ margin: 0, marginBottom: SPACING.md }}>{error}</p>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={fetchStudents}
                                        style={{
                                            padding: `${SPACING.sm} ${SPACING.lg}`,
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
                            ) : filteredStudents.length === 0 ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: SPACING.xxxl,
                                    color: COLORS.textSecondary,
                                }}>
                                    {/* Icon Container */}
                                    <div style={{
                                        width: '72px',
                                        height: '72px',
                                        borderRadius: '50%',
                                        background: searchQuery ? 'rgba(59, 130, 246, 0.08)' : `${SUCCESS_COLOR}10`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: SPACING.lg,
                                    }}>
                                        {searchQuery ? (
                                            /* Search not found icon */
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                                                <circle cx="11" cy="11" r="8" />
                                                <path d="m21 21-4.35-4.35" />
                                                <path d="M8 8l6 6M14 8l-6 6" />
                                            </svg>
                                        ) : (
                                            /* All good checkmark icon */
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={SUCCESS_COLOR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                <polyline points="22 4 12 14.01 9 11.01" />
                                            </svg>
                                        )}
                                    </div>
                                    <p style={{ margin: 0, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.medium, color: COLORS.textPrimary }}>
                                        {searchQuery ? 'No students found' : 'All students are doing well!'}
                                    </p>
                                    <p style={{ margin: `${SPACING.sm} 0 0 0`, fontSize: FONT_SIZE.sm, textAlign: 'center' }}>
                                        {searchQuery ? 'Try a different search term' : 'No students need immediate attention'}
                                    </p>
                                </div>
                            ) : (
                                <motion.div 
                                    layout
                                    style={{ display: 'flex', flexDirection: 'column', gap: isCompact ? SPACING.sm : SPACING.md }}
                                >
                                    <AnimatePresence mode="popLayout">
                                        {filteredStudents.map((student, index) => (
                                            <StudentCard
                                                key={student.id}
                                                student={student}
                                                index={index}
                                                onViewDetails={handleViewDetails}
                                                onSendEmail={handleSendEmail}
                                                showAvatars={shouldShowAvatar}
                                                shouldAnimate={shouldAnimate}
                                                isCompact={isCompact}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
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
                            <div style={{ fontSize: FONT_SIZE.sm, color: COLORS.textSecondary }}>
                                Showing {filteredStudents.length} of {students.length} students
                            </div>
                            
                            <div style={{ display: 'flex', gap: SPACING.md }}>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onClose}
                                    style={{
                                        padding: `${SPACING.md} ${SPACING.xl}`,
                                        background: 'transparent',
                                        color: COLORS.textSecondary,
                                        border: `1px solid ${COLORS.border}`,
                                        borderRadius: BORDER_RADIUS.lg,
                                        fontSize: FONT_SIZE.sm,
                                        fontWeight: FONT_WEIGHT.medium,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Close
                                </motion.button>
                                
                                {/* Export Button - matching Groups page "+ New Group" style */}
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: `0 8px 20px ${ACCENT_COLOR}30` }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: SPACING.sm,
                                        padding: `${SPACING.md} ${SPACING.xl}`,
                                        background: `linear-gradient(135deg, ${ACCENT_COLOR} 0%, #2563eb 100%)`,
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: BORDER_RADIUS.lg,
                                        fontSize: FONT_SIZE.sm,
                                        fontWeight: FONT_WEIGHT.medium,
                                        cursor: 'pointer',
                                        boxShadow: `0 4px 12px ${ACCENT_COLOR}25`,
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    Export Report
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AtRiskStudentsModal;
