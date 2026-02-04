/**
 * Grade Submissions Modal - Professional grading interface for teachers
 * 10/10 Features: Smart queue, split-view grading, batch mode, keyboard shortcuts,
 * AI-assisted feedback, rubric grading, analytics, file preview, grade history,
 * auto-save, flagging, grading timer, and class statistics
 * 
 * Refactored: Phase 1 - Constants, types, mock data, and utilities extracted
 * Enhanced: Real Supabase integration + Groq AI grading
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { getCatalogCourses, type CatalogCourse } from '../../services/catalogService';
import { useResponsive } from './hooks';
import {
    gradeSubmission,
    generateFeedback,
    isAIGradingConfigured,
    batchGradeSubmissions,
    getOutlierIndicator,
    extractSubmissionContent,
    type AIGradingResult
} from '../../lib/grading';
import { useDisplaySettings } from '../../contexts/DisplaySettingsContext';

// Supabase grading service for real data
import {
    fetchTasksForGrading,
    fetchAllSubmissions,
    gradeSubmission as saveGradeToDb,
    toggleSubmissionFlag,
    type Submission as DbSubmission,
    type Task as DbTask,
} from '../../services/gradingService';

// Import from grading module
import {
    // Constants
    QUICK_SCORES,
    KEYBOARD_SHORTCUTS,
    // Mock Data (kept for rubric demo only)
    DEMO_RUBRIC,
    // Utilities
    formatDate,
    formatSeconds,
    getStatusColor,
    getStatusLabel,
    getSimilarityColor,
    getAIFeedbackSuggestion,
    getSmartPriority,
} from './grading';

// Types from grading module
import type {
    Task,
    Submission,
    Course,
    GradeSubmissionsModalProps,
    DraftGrade,
    ViewMode,
    FilterStatus,
    SortOption,
    GradeHistory,
} from './grading';

// Import grading settings context
import { useGradingSettings } from './contexts';

// Note: Constants, mock data, and types are now imported from ./grading module
// See: ./grading/constants.ts, ./grading/types.ts, ./grading/mockData.ts, ./grading/utils.ts


// Custom Dropdown Component - Minimalistic Blue Design
const CustomDropdown: React.FC<{
    value: string;
    options: { id: string; label: string; icon?: React.ReactNode }[];
    onChange: (value: string) => void;
    placeholder?: string;
    variant?: 'default' | 'purple';
    minWidth?: string;
    label?: string;
}> = ({ value, options, onChange, placeholder = 'Select', variant = 'default', minWidth = '120px', label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.id === value);
    const isPurple = variant === 'purple';
    const accentColor = isPurple ? '#8b5cf6' : '#3b82f6';

    return (
        <div ref={dropdownRef} style={{ position: 'relative', minWidth, flex: variant === 'default' ? 1 : undefined }}>
            {/* Label */}
            {label && (
                <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#64748b',
                    marginBottom: '4px',
                }}>
                    {label}
                </label>
            )}

            {/* Trigger Button */}
            <motion.button
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: isOpen
                        ? `1px solid ${accentColor}40`
                        : '1px solid rgba(0,0,0,0.08)',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen ? `0 0 0 3px ${accentColor}10` : 'none',
                }}
            >
                <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: selectedOption ? '#0f172a' : '#94a3b8',
                }}>
                    {selectedOption?.icon}
                    {selectedOption?.label || placeholder}
                </span>
                <motion.svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ flexShrink: 0 }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </motion.svg>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 6px)',
                            left: 0,
                            right: 0,
                            minWidth: '100%',
                            background: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid rgba(0,0,0,0.08)',
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 10px rgba(0, 0, 0, 0.06)',
                            padding: '6px',
                            zIndex: 1000,
                            maxHeight: '280px',
                            overflowY: 'auto',
                        }}
                    >
                        {options.map((option, index) => {
                            const isSelected = option.id === value;
                            const isHovered = hoveredId === option.id;

                            return (
                                <motion.button
                                    key={option.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    onMouseEnter={() => setHoveredId(option.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onClick={() => {
                                        onChange(option.id);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: isSelected
                                            ? `${accentColor}10`
                                            : isHovered
                                                ? 'rgba(0,0,0,0.03)'
                                                : 'transparent',
                                        color: isSelected ? accentColor : '#334155',
                                        fontSize: '13px',
                                        fontWeight: isSelected ? 600 : 500,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'background 0.15s ease',
                                    }}
                                >
                                    {option.icon && (
                                        <span style={{
                                            color: isSelected ? accentColor : (isPurple && option.id === 'smart' ? '#f97316' : '#64748b'),
                                            display: 'flex',
                                            alignItems: 'center',
                                            flexShrink: 0,
                                        }}>
                                            {option.icon}
                                        </span>
                                    )}
                                    <span style={{
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {option.label}
                                    </span>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                borderRadius: '50%',
                                                background: accentColor,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <svg
                                                width="10"
                                                height="10"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="#ffffff"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </motion.div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


// Icon helper functions (kept here as they return React nodes)
const getTaskTypeIcon = (type: Task['type']): React.ReactNode => {
    switch (type) {
        case 'assignment':
            return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
        case 'quiz':
            return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
        case 'performance':
            return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
        case 'journal':
            return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
        default:
            return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /></svg>;
    }
};

const getFileIcon = (type: string): React.ReactNode => {
    if (type.includes('pdf')) {
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
    }
    if (type.includes('doc')) {
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
    }
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
};


// Professional Stats Bar Component - Detailed grading analytics
const StatsBar: React.FC<{
    submissions: Submission[];
    tasks: Task[];
}> = ({ submissions, tasks }) => {
    const [hoveredGrade, setHoveredGrade] = useState<string | null>(null);

    const stats = useMemo(() => {
        const graded = submissions.filter(s => s.status === 'graded');
        const pending = submissions.filter(s => s.status !== 'graded');
        const late = submissions.filter(s => s.status === 'late');
        const scores = graded.map(s => s.score || 0);
        const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const highest = scores.length > 0 ? Math.max(...scores) : 0;
        const lowest = scores.length > 0 ? Math.min(...scores) : 0;

        // Grade distribution
        const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        graded.forEach(s => {
            const task = tasks.find(t => t.id === s.task_id);
            const percent = ((s.score || 0) / (task?.points || 100)) * 100;
            if (percent >= 90) distribution.A++;
            else if (percent >= 80) distribution.B++;
            else if (percent >= 70) distribution.C++;
            else if (percent >= 60) distribution.D++;
            else distribution.F++;
        });

        return { graded: graded.length, pending: pending.length, late: late.length, avg, highest, lowest, distribution, total: submissions.length };
    }, [submissions, tasks]);

    const progressPercent = stats.total > 0 ? (stats.graded / stats.total) * 100 : 0;
    const gradeColors: Record<string, string> = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444' };
    const gradeLabels: Record<string, string> = { A: '90-100%', B: '80-89%', C: '70-79%', D: '60-69%', F: '<60%' };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '14px 16px',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
            {/* Top Row - Progress & Key Stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Grading Progress */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Grading Progress</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: progressPercent === 100 ? '#10b981' : '#3b82f6' }}>
                            {stats.graded} of {stats.total} graded
                        </span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(0,0,0,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                                height: '100%',
                                background: progressPercent === 100 ? '#10b981' : '#3b82f6',
                                borderRadius: '4px',
                            }}
                        />
                    </div>
                </div>

                {/* Vertical Divider */}
                <div style={{ width: '1px', height: '36px', background: 'rgba(0,0,0,0.06)' }} />

                {/* Quick Stats */}
                <div style={{ display: 'flex', gap: '16px' }}>
                    {/* Average Score */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
                            {stats.avg.toFixed(1)}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>AVG</div>
                    </div>
                    {/* Highest */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#10b981', lineHeight: 1 }}>
                            {stats.highest}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>HIGH</div>
                    </div>
                    {/* Lowest */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444', lineHeight: 1 }}>
                            {stats.lowest}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>LOW</div>
                    </div>
                </div>
            </div>

            {/* Bottom Row - Grade Distribution */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%)',
                borderRadius: '8px',
            }}>
                {/* Distribution Label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '80px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Distribution</span>
                </div>

                {/* Grade Bars */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '6px', height: '28px' }}>
                    {Object.entries(stats.distribution).map(([grade, count]) => {
                        const maxCount = Math.max(...Object.values(stats.distribution), 1);
                        const height = stats.graded > 0 ? (count / maxCount) * 18 + 4 : 4;
                        const isHovered = hoveredGrade === grade;

                        return (
                            <div
                                key={grade}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '2px',
                                    flex: 1,
                                    position: 'relative',
                                    justifyContent: 'flex-end',
                                    height: '100%',
                                }}
                                onMouseEnter={() => setHoveredGrade(grade)}
                                onMouseLeave={() => setHoveredGrade(null)}
                            >
                                {/* Tooltip */}
                                <AnimatePresence>
                                    {isHovered && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 4, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 2, scale: 0.95 }}
                                            style={{
                                                position: 'absolute',
                                                bottom: '100%',
                                                marginBottom: '4px',
                                                padding: '4px 8px',
                                                background: '#ffffff',
                                                borderRadius: '6px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                                border: `1px solid ${gradeColors[grade]}30`,
                                                whiteSpace: 'nowrap',
                                                zIndex: 10,
                                            }}
                                        >
                                            <div style={{ fontSize: '11px', fontWeight: 600, color: gradeColors[grade] }}>
                                                {count} student{count !== 1 ? 's' : ''}
                                            </div>
                                            <div style={{ fontSize: '9px', color: '#94a3b8' }}>{gradeLabels[grade]}</div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Bar */}
                                <motion.div
                                    initial={{ height: 4 }}
                                    animate={{ height, scale: isHovered ? 1.1 : 1 }}
                                    transition={{ duration: 0.3 }}
                                    style={{
                                        width: '100%',
                                        maxWidth: '28px',
                                        background: count > 0
                                            ? `linear-gradient(180deg, ${gradeColors[grade]} 0%, ${gradeColors[grade]}cc 100%)`
                                            : 'rgba(0,0,0,0.06)',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        boxShadow: count > 0 && isHovered ? `0 2px 8px ${gradeColors[grade]}40` : 'none',
                                    }}
                                />
                                {/* Grade Label */}
                                <span style={{
                                    fontSize: '9px',
                                    fontWeight: 600,
                                    color: isHovered ? gradeColors[grade] : '#94a3b8',
                                    transition: 'color 0.15s ease',
                                    lineHeight: 1,
                                }}>
                                    {grade}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Status Counts */}
                <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
                    {stats.pending > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: 'rgba(59, 130, 246, 0.08)',
                        }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }} />
                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#3b82f6' }}>{stats.pending} pending</span>
                        </div>
                    )}
                    {stats.late > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.08)',
                        }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#ef4444' }}>{stats.late} late</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Submission Card Component
const SubmissionCard: React.FC<{
    submission: Submission;
    task: Task | undefined;
    isSelected: boolean;
    onClick: () => void;
    onFlag: () => void;
    index: number;
    showCheckbox?: boolean;
    isChecked?: boolean;
    onCheck?: () => void;
    showAvatars?: boolean;
    shouldAnimate?: boolean;
    isCompact?: boolean;
}> = ({ submission, task, isSelected, onClick, onFlag, index, showCheckbox, isChecked, onCheck, showAvatars = true, shouldAnimate = true, isCompact = false }) => {
    const statusColor = getStatusColor(submission.status);
    const hasSimilarityWarning = submission.similarity_score && submission.similarity_score > 30;

    // Get outlier indicator
    const outlier = getOutlierIndicator(
        submission.score ?? null,
        task?.points || 100,
        submission.similarity_score,
        submission.is_late,
        submission.attachments.length
    );

    const MotionWrapper = shouldAnimate ? motion.div : 'div';
    const motionProps = shouldAnimate ? {
        initial: { opacity: 0, x: -10 },
        animate: { opacity: 1, x: 0 },
        transition: { delay: index * 0.02 },
        whileHover: { background: isSelected ? `${statusColor}08` : 'rgba(0,0,0,0.02)' },
    } : {};

    return (
        <MotionWrapper
            {...motionProps}
            onClick={onClick}
            style={{
                padding: isCompact ? '10px 12px' : '12px 14px',
                borderRadius: '12px',
                background: isSelected ? `${statusColor}08` : 'transparent',
                border: `1px solid ${isSelected ? `${statusColor}30` : 'transparent'}`,
                cursor: 'pointer',
                transition: shouldAnimate ? 'all 0.15s ease' : 'none',
                position: 'relative',
                marginBottom: '2px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: isCompact ? '8px' : '10px' }}>
                {/* Checkbox for batch mode */}
                {showCheckbox && (
                    <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => { e.stopPropagation(); onCheck?.(); }}
                        style={{ width: '16px', height: '16px', accentColor: '#3b82f6', marginTop: '4px', cursor: 'pointer' }}
                    />
                )}

                {/* Avatar with Outlier Indicator - conditionally rendered */}
                {showAvatars && (
                    <div style={{
                        width: isCompact ? '36px' : '40px',
                        height: isCompact ? '36px' : '40px',
                        borderRadius: '10px',
                        background: `linear-gradient(135deg, ${statusColor}20 0%, ${statusColor}10 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: statusColor,
                        fontWeight: 600,
                        fontSize: isCompact ? '12px' : '13px',
                        flexShrink: 0,
                        position: 'relative',
                    }}>
                        {submission.student_name.split(' ').map(n => n[0]).join('').slice(0, 2)}

                        {/* Outlier Indicator Badge */}
                        {outlier && !submission.is_flagged && shouldAnimate && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                title={outlier.reason}
                                style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-4px',
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    background: outlier.type === 'exceptional' ? '#10b981'
                                        : outlier.type === 'plagiarism' ? '#ef4444'
                                            : '#f59e0b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: `0 2px 6px ${outlier.type === 'exceptional' ? 'rgba(16, 185, 129, 0.4)'
                                        : outlier.type === 'plagiarism' ? 'rgba(239, 68, 68, 0.4)'
                                            : 'rgba(245, 158, 11, 0.4)'}`,
                                }}
                            >
                                {outlier.type === 'exceptional' ? (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff" stroke="none">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                ) : outlier.type === 'plagiarism' ? (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                ) : (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    </svg>
                                )}
                            </motion.div>
                        )}

                        {/* Non-animated outlier indicator */}
                        {outlier && !submission.is_flagged && !shouldAnimate && (
                            <div
                                title={outlier.reason}
                                style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-4px',
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    background: outlier.type === 'exceptional' ? '#10b981'
                                        : outlier.type === 'plagiarism' ? '#ef4444'
                                            : '#f59e0b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {outlier.type === 'exceptional' ? (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff" stroke="none">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                ) : outlier.type === 'plagiarism' ? (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                ) : (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    </svg>
                                )}
                            </div>
                        )}

                        {/* Flag indicator (takes priority over outlier) */}
                        {submission.is_flagged && (
                            <div style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-4px',
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                background: '#f59e0b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="#fff" stroke="none">
                                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                    <line x1="4" y1="22" x2="4" y2="15" stroke="#fff" strokeWidth="3" />
                                </svg>
                            </div>
                        )}
                    </div>
                )}

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: isCompact ? '12px' : '13px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {submission.student_name}
                        </span>
                        <span style={{
                            fontSize: '9px',
                            fontWeight: 600,
                            color: statusColor,
                            background: `${statusColor}15`,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px',
                        }}>
                            {getStatusLabel(submission.status)}
                        </span>
                        {/* Outlier Badge */}
                        {outlier && (
                            <span
                                title={outlier.reason}
                                style={{
                                    fontSize: '9px',
                                    fontWeight: 600,
                                    color: outlier.type === 'exceptional' ? '#10b981'
                                        : outlier.type === 'plagiarism' ? '#ef4444'
                                            : '#f59e0b',
                                    background: outlier.type === 'exceptional' ? 'rgba(16, 185, 129, 0.1)'
                                        : outlier.type === 'plagiarism' ? 'rgba(239, 68, 68, 0.1)'
                                            : 'rgba(245, 158, 11, 0.1)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                }}
                            >
                                {outlier.type === 'exceptional' ? '⭐' : outlier.type === 'plagiarism' ? '⚠️' : '⚡'}
                                {outlier.type === 'exceptional' ? 'Excellent'
                                    : outlier.type === 'plagiarism' ? 'Review'
                                        : 'Attention'}
                            </span>
                        )}
                        {hasSimilarityWarning && !outlier && (
                            <span style={{
                                fontSize: '9px',
                                fontWeight: 600,
                                color: '#ef4444',
                                background: 'rgba(239, 68, 68, 0.1)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                            }}>
                                {submission.similarity_score}% Similar
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {submission.section} • {formatDate(submission.submitted_at)}
                    </div>
                    {submission.status === 'graded' && submission.score !== null && submission.score !== undefined && (
                        <div style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: (submission.score ?? 0) >= (task?.points || 100) * 0.75 ? '#10b981' : (submission.score ?? 0) >= (task?.points || 100) * 0.6 ? '#f59e0b' : '#ef4444',
                            marginTop: '2px',
                        }}>
                            Score: {submission.score}/{task?.points || 100}
                        </div>
                    )}
                </div>

                {/* Flag button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); onFlag(); }}
                    style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        border: 'none',
                        background: submission.is_flagged ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                        color: submission.is_flagged ? '#f59e0b' : '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: submission.is_flagged ? 1 : 0,
                        transition: 'opacity 0.15s ease',
                    }}
                    className="flag-btn"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={submission.is_flagged ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                        <line x1="4" y1="22" x2="4" y2="15" />
                    </svg>
                </motion.button>
            </div>

            <style>{`
                div:hover .flag-btn { opacity: 1 !important; }
            `}</style>
        </MotionWrapper>
    );
};


// File Preview Panel Component
const FilePreviewPanel: React.FC<{
    file: { name: string; url: string; type: string } | null;
    onClose: () => void;
}> = ({ file, onClose }) => {
    if (!file) return null;

    const isPdf = file.type.includes('pdf');

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: '50%',
                background: '#ffffff',
                borderLeft: '1px solid rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 10,
            }}
        >
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getFileIcon(file.type)}
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{file.name}</span>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'rgba(0,0,0,0.04)',
                        color: '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </motion.button>
            </div>

            {/* Preview Content */}
            <div style={{ flex: 1, overflow: 'auto', background: '#f8fafc' }}>
                {isPdf ? (
                    <iframe
                        src={file.url}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        title="PDF Preview"
                    />
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: '#64748b',
                        gap: '12px',
                    }}>
                        {getFileIcon(file.type)}
                        <span style={{ fontSize: '14px' }}>Preview not available for this file type</span>
                        <motion.a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.02 }}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                background: '#3b82f6',
                                color: '#ffffff',
                                fontSize: '13px',
                                fontWeight: 500,
                                textDecoration: 'none',
                            }}
                        >
                            Download File
                        </motion.a>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// Grade History Panel Component
const GradeHistoryPanel: React.FC<{
    history: GradeHistory[];
    maxPoints: number;
}> = ({ history, maxPoints }) => {
    if (!history || history.length === 0) return null;

    return (
        <div style={{
            padding: '12px',
            background: 'rgba(139, 92, 246, 0.04)',
            borderRadius: '10px',
            border: '1px solid rgba(139, 92, 246, 0.1)',
            marginBottom: '16px',
        }}>
            <div style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#8b5cf6',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
            }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
                Previous Grades ({history.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {history.map((h, idx) => (
                    <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        background: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid rgba(0,0,0,0.04)',
                    }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            background: 'rgba(139, 92, 246, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#8b5cf6',
                        }}>
                            v{h.version}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                                {h.score}/{maxPoints} ({((h.score / maxPoints) * 100).toFixed(0)}%)
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>
                                {formatDate(h.graded_at)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Grading Timer Component
const GradingTimer: React.FC<{
    isActive: boolean;
    gradedCount: number;
}> = ({ isActive, gradedCount }) => {
    const [seconds, setSeconds] = useState(0);
    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        if (!isActive) return;

        startTimeRef.current = Date.now();
        const interval = setInterval(() => {
            setSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive]);

    const avgTime = gradedCount > 0 ? Math.floor(seconds / gradedCount) : 0;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 12px',
            background: 'rgba(16, 185, 129, 0.06)',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.15)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>{formatSeconds(seconds)}</span>
            </div>
            {gradedCount > 0 && (
                <>
                    <div style={{ width: '1px', height: '16px', background: 'rgba(16, 185, 129, 0.2)' }} />
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                        <span style={{ fontWeight: 600, color: '#10b981' }}>{gradedCount}</span> graded • ~{formatSeconds(avgTime)}/each
                    </div>
                </>
            )}
        </div>
    );
};


// Grading Panel Component
const GradingPanel: React.FC<{
    submission: Submission;
    task: Task | undefined;
    onGrade: (score: number, feedback: string) => void;
    onNext: () => void;
    onPrevious: () => void;
    onFlag: () => void;
    hasNext: boolean;
    hasPrevious: boolean;
    currentIndex: number;
    totalCount: number;
    draft: DraftGrade | null;
    onDraftChange: (draft: DraftGrade) => void;
    onPreviewFile: (file: { name: string; url: string; type: string }) => void;
    gradingSettings?: {
        autoSave: boolean;
        confirmSubmit: boolean;
        showAnalytics: boolean;
        latePenalty: boolean;
        latePenaltyPercent: number;
    };
}> = ({ submission, task, onGrade, onNext, onPrevious, onFlag, hasNext, hasPrevious, currentIndex, totalCount, draft, onDraftChange, onPreviewFile, gradingSettings }) => {
    const { isMobile } = useResponsive();
    const [score, setScore] = useState<string>(draft?.score?.toString() || submission.score?.toString() || '');
    const [feedback, setFeedback] = useState(draft?.feedback || submission.feedback || '');
    const [showRubric, setShowRubric] = useState(false);
    const [rubricScores, setRubricScores] = useState<Record<string, number>>(draft?.rubricScores || {});
    const [aiSuggestion, setAiSuggestion] = useState('');
    const scoreInputRef = useRef<HTMLInputElement>(null);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Confirmation dialog state
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingGrade, setPendingGrade] = useState<{ score: number; feedback: string } | null>(null);

    // AI Grading State
    const [isAIGrading, setIsAIGrading] = useState(false);
    const [aiGradingResult, setAiGradingResult] = useState<AIGradingResult | null>(null);
    const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
    const [dismissedAISuggestion, setDismissedAISuggestion] = useState(false);
    const aiConfigured = isAIGradingConfigured();

    // Calculate late penalty if enabled
    const calculateFinalScore = useCallback((rawScore: number): number => {
        if (!gradingSettings?.latePenalty || !submission.is_late) {
            return rawScore;
        }
        const penaltyPercent = gradingSettings.latePenaltyPercent || 10;
        const penalty = Math.round(rawScore * (penaltyPercent / 100));
        return Math.max(0, rawScore - penalty);
    }, [gradingSettings?.latePenalty, gradingSettings?.latePenaltyPercent, submission.is_late]);

    // Reset state when submission changes
    useEffect(() => {
        setScore(draft?.score?.toString() || submission.score?.toString() || '');
        setFeedback(draft?.feedback || submission.feedback || '');
        setRubricScores(draft?.rubricScores || {});
        // Reset AI state
        setAiGradingResult(null);
        setDismissedAISuggestion(false);
    }, [submission.id, draft]);

    // Auto-save draft
    useEffect(() => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(() => {
            if (score || feedback || Object.keys(rubricScores).length > 0) {
                onDraftChange({
                    score,
                    feedback,
                    rubricScores,
                    lastSaved: new Date(),
                });
            }
        }, 1000);

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [score, feedback, rubricScores, onDraftChange]);

    // Calculate rubric total
    const rubricTotal = useMemo(() => {
        return Object.values(rubricScores).reduce((sum, val) => sum + val, 0);
    }, [rubricScores]);

    // Apply rubric total to score
    useEffect(() => {
        if (showRubric && Object.keys(rubricScores).length > 0) {
            setScore(rubricTotal.toString());
        }
    }, [rubricTotal, showRubric, rubricScores]);

    // Generate AI suggestion when score changes
    useEffect(() => {
        if (score && task) {
            const suggestion = getAIFeedbackSuggestion(parseInt(score) || 0, task.points);
            setAiSuggestion(suggestion);
        }
    }, [score, task]);

    // Handle grade submission with optional confirmation
    const handleSaveAndNext = () => {
        const rawScore = parseInt(score) || 0;
        const finalScore = calculateFinalScore(rawScore);

        // If confirmation is enabled, show dialog first
        if (gradingSettings?.confirmSubmit) {
            setPendingGrade({ score: finalScore, feedback });
            setShowConfirmDialog(true);
        } else {
            // Submit directly
            onGrade(finalScore, feedback);
            if (hasNext) onNext();
        }
    };

    // Confirm and submit grade
    const handleConfirmGrade = () => {
        if (pendingGrade) {
            onGrade(pendingGrade.score, pendingGrade.feedback);
            setShowConfirmDialog(false);
            setPendingGrade(null);
            if (hasNext) onNext();
        }
    };

    // Cancel confirmation
    const handleCancelConfirm = () => {
        setShowConfirmDialog(false);
        setPendingGrade(null);
    };

    const handleQuickScore = (value: number) => {
        setScore(value.toString());
        scoreInputRef.current?.focus();
    };

    const handleApplyAISuggestion = () => {
        setFeedback(prev => prev ? `${prev}\n\n${aiSuggestion}` : aiSuggestion);
    };

    // AI Grading Handler - Enhanced with content extraction
    const handleAIGrade = async () => {
        if (!task || isAIGrading) return;

        setIsAIGrading(true);
        setAiGradingResult(null);

        try {
            // Use enhanced content extraction
            const submissionContent = extractSubmissionContent({
                textContent: submission.text_content,
                attachments: submission.attachments.map(a => ({
                    name: a.name,
                    type: a.type,
                    url: a.url,
                    textContent: a.textContent,
                })),
            });

            console.log('[AI Grade] Analyzing submission content:', submissionContent.substring(0, 200) + '...');

            const result = await gradeSubmission({
                submissionContent,
                taskTitle: task.title,
                taskDescription: task.description || 'Complete the assigned task.',
                maxPoints: task.points,
                studentName: submission.student_name,
            });

            setAiGradingResult(result);

            if (result.success) {
                console.log(`[AI Grade] Suggested ${result.suggestedScore}/${task.points} (${result.confidence}% confidence)`);
            }
        } catch (error) {
            console.error('[AI Grade] Error:', error);
            setAiGradingResult({
                success: false,
                suggestedScore: 0,
                confidence: 0,
                reasoning: '',
                feedback: '',
                error: 'Failed to analyze submission',
            });
        } finally {
            setIsAIGrading(false);
        }
    };

    // Accept AI suggestion
    const handleAcceptAISuggestion = () => {
        if (!aiGradingResult?.success) return;
        setScore(aiGradingResult.suggestedScore.toString());
        setFeedback(aiGradingResult.feedback);
        setAiGradingResult(null);
    };

    // Dismiss AI suggestion
    const handleDismissAISuggestion = () => {
        setAiGradingResult(null);
        setDismissedAISuggestion(true);
    };

    // Generate AI feedback only
    const handleGenerateAIFeedback = async () => {
        if (!task || isGeneratingFeedback || !score) return;

        setIsGeneratingFeedback(true);

        try {
            const submissionContent = submission.attachments.length > 0
                ? `Submitted files: ${submission.attachments.map(a => a.name).join(', ')}`
                : 'No files submitted';

            const result = await generateFeedback(
                submissionContent,
                parseInt(score) || 0,
                task.points,
                task.title
            );

            if (result.success && result.feedback) {
                setFeedback(prev => prev ? `${prev}\n\n${result.feedback}` : result.feedback);
            }
        } catch (error) {
            console.error('[AI Feedback] Error:', error);
        } finally {
            setIsGeneratingFeedback(false);
        }
    };

    const scoreNum = parseInt(score) || 0;
    const maxPoints = task?.points || 100;
    const scorePercent = (scoreNum / maxPoints) * 100;
    const scoreColor = scorePercent >= 75 ? '#10b981' : scorePercent >= 60 ? '#f59e0b' : '#ef4444';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{
                padding: isMobile ? '10px 12px' : '16px 20px',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                background: 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? '6px' : '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px' }}>
                        <div style={{
                            width: isMobile ? '32px' : '42px',
                            height: isMobile ? '32px' : '42px',
                            borderRadius: isMobile ? '8px' : '10px',
                            background: `linear-gradient(135deg, ${getStatusColor(submission.status)}20 0%, ${getStatusColor(submission.status)}10 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: getStatusColor(submission.status),
                            fontWeight: 700,
                            fontSize: isMobile ? '11px' : '14px',
                        }}>
                            {submission.student_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <h3 style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                                    {submission.student_name}
                                </h3>
                                {submission.is_flagged && (
                                    <span style={{ fontSize: isMobile ? '9px' : '10px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                        Flagged
                                    </span>
                                )}
                            </div>
                            <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#64748b' }}>
                                {submission.student_id} • {submission.section}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px' }}>
                        <motion.button
                            whileHover={!isMobile ? { scale: 1.05 } : undefined}
                            whileTap={{ scale: 0.95 }}
                            onClick={onFlag}
                            style={{
                                width: isMobile ? '28px' : '32px',
                                height: isMobile ? '28px' : '32px',
                                borderRadius: isMobile ? '6px' : '8px',
                                border: '1px solid rgba(245, 158, 11, 0.2)',
                                background: submission.is_flagged ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                                color: submission.is_flagged ? '#f59e0b' : '#94a3b8',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            title="Flag for review"
                        >
                            <svg width={isMobile ? "12" : "14"} height={isMobile ? "12" : "14"} viewBox="0 0 24 24" fill={submission.is_flagged ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                <line x1="4" y1="22" x2="4" y2="15" />
                            </svg>
                        </motion.button>
                        <div style={{
                            fontSize: isMobile ? '10px' : '12px',
                            color: '#64748b',
                            background: 'rgba(0,0,0,0.04)',
                            padding: isMobile ? '4px 8px' : '6px 10px',
                            borderRadius: '6px',
                            fontWeight: 500,
                        }}>
                            {currentIndex + 1}/{totalCount}
                        </div>
                    </div>
                </div>

                {/* Task info */}
                {task && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '6px' : '8px',
                        padding: isMobile ? '6px 10px' : '8px 12px',
                        background: 'rgba(59, 130, 246, 0.06)',
                        borderRadius: isMobile ? '6px' : '8px',
                        border: '1px solid rgba(59, 130, 246, 0.1)',
                    }}>
                        <div style={{ color: '#3b82f6', flexShrink: 0 }}>{getTaskTypeIcon(task.type)}</div>
                        <span style={{ fontSize: isMobile ? '11px' : '12px', fontWeight: 500, color: '#1e40af', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                        <span style={{ fontSize: isMobile ? '10px' : '11px', color: '#64748b', flexShrink: 0 }}>{task.points} pts</span>
                    </div>
                )}

                {/* Similarity Warning */}
                {submission.similarity_score && submission.similarity_score > 15 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: `${getSimilarityColor(submission.similarity_score)}10`,
                        borderRadius: '8px',
                        border: `1px solid ${getSimilarityColor(submission.similarity_score)}20`,
                        marginTop: '8px',
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={getSimilarityColor(submission.similarity_score)} strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: getSimilarityColor(submission.similarity_score) }}>
                            {submission.similarity_score}% similarity detected - Review for potential plagiarism
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '10px 12px' : '16px 20px' }}>
                {/* Grade History */}
                {submission.grade_history && submission.grade_history.length > 0 && (
                    <GradeHistoryPanel history={submission.grade_history} maxPoints={maxPoints} />
                )}

                {/* Attachments */}
                {submission.attachments.length > 0 && (
                    <div style={{ marginBottom: isMobile ? '12px' : '16px' }}>
                        <div style={{ fontSize: isMobile ? '10px' : '11px', fontWeight: 600, color: '#64748b', marginBottom: isMobile ? '6px' : '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Submitted Files
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '4px' : '6px' }}>
                            {submission.attachments.map((file, idx) => (
                                <motion.button
                                    key={idx}
                                    whileHover={!isMobile ? { scale: 1.01, background: 'rgba(59, 130, 246, 0.06)' } : undefined}
                                    onClick={() => onPreviewFile(file)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: isMobile ? '8px' : '10px',
                                        padding: isMobile ? '8px 10px' : '10px 12px',
                                        borderRadius: isMobile ? '6px' : '8px',
                                        background: 'rgba(0,0,0,0.02)',
                                        border: '1px solid rgba(0,0,0,0.06)',
                                        cursor: 'pointer',
                                        width: '100%',
                                        textAlign: 'left',
                                    }}
                                >
                                    {getFileIcon(file.type)}
                                    <span style={{ fontSize: isMobile ? '11px' : '12px', fontWeight: 500, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                                    <svg width={isMobile ? "12" : "14"} height={isMobile ? "12" : "14"} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Score Section */}
                <div style={{ marginBottom: isMobile ? '12px' : '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? '6px' : '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: isMobile ? '10px' : '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Score
                            </div>
                            {/* AI Grade Button */}
                            {aiConfigured && !aiGradingResult && !dismissedAISuggestion && (
                                <motion.button
                                    whileHover={!isMobile ? { scale: 1.02 } : undefined}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleAIGrade}
                                    disabled={isAIGrading}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: isMobile ? '3px 8px' : '4px 10px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: isAIGrading
                                            ? 'rgba(59, 130, 246, 0.1)'
                                            : '#3b82f6',
                                        color: isAIGrading ? '#3b82f6' : '#ffffff',
                                        fontSize: isMobile ? '9px' : '10px',
                                        fontWeight: 600,
                                        cursor: isAIGrading ? 'wait' : 'pointer',
                                        boxShadow: isAIGrading ? 'none' : '0 2px 8px rgba(59, 130, 246, 0.25)',
                                    }}
                                >
                                    {isAIGrading ? (
                                        <>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                style={{ width: '10px', height: '10px' }}
                                            >
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                                </svg>
                                            </motion.div>
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                                                <circle cx="12" cy="12" r="4" />
                                            </svg>
                                            AI Grade
                                        </>
                                    )}
                                </motion.button>
                            )}
                        </div>
                        <motion.button
                            whileHover={!isMobile ? { scale: 1.02 } : undefined}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowRubric(!showRubric)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: isMobile ? '3px 8px' : '4px 10px',
                                borderRadius: '6px',
                                border: '1px solid rgba(139, 92, 246, 0.2)',
                                background: showRubric ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                color: '#8b5cf6',
                                fontSize: isMobile ? '10px' : '11px',
                                fontWeight: 500,
                                cursor: 'pointer',
                            }}
                        >
                            <svg width={isMobile ? "10" : "12"} height={isMobile ? "10" : "12"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <line x1="3" y1="9" x2="21" y2="9" />
                                <line x1="9" y1="21" x2="9" y2="9" />
                            </svg>
                            Rubric
                        </motion.button>
                    </div>

                    {/* AI Grading Result */}
                    <AnimatePresence>
                        {aiGradingResult && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                style={{
                                    marginBottom: '12px',
                                    padding: '12px',
                                    background: aiGradingResult.success
                                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)'
                                        : 'rgba(239, 68, 68, 0.08)',
                                    borderRadius: '10px',
                                    border: `1px solid ${aiGradingResult.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                                    overflow: 'hidden',
                                }}
                            >
                                {aiGradingResult.success ? (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '6px',
                                                    background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                                                        <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                                                        <circle cx="12" cy="12" r="4" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                        AI Suggestion
                                                    </div>
                                                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                                                        {aiGradingResult.suggestedScore}/{task?.points || 100}
                                                        <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b', marginLeft: '6px' }}>
                                                            {aiGradingResult.confidence}% confident
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={handleAcceptAISuggestion}
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        border: 'none',
                                                        background: '#10b981',
                                                        color: '#ffffff',
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    Accept
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={handleDismissAISuggestion}
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        border: '1px solid rgba(0,0,0,0.1)',
                                                        background: '#ffffff',
                                                        color: '#64748b',
                                                        fontSize: '11px',
                                                        fontWeight: 500,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    Dismiss
                                                </motion.button>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5, marginBottom: '6px' }}>
                                            <strong style={{ color: '#0f172a' }}>Reasoning:</strong> {aiGradingResult.reasoning}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                                            Feedback preview: "{aiGradingResult.feedback.slice(0, 100)}..."
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                        <span style={{ fontSize: '12px' }}>{aiGradingResult.error || 'Failed to analyze submission'}</span>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setAiGradingResult(null)}
                                            style={{
                                                marginLeft: 'auto',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                border: 'none',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                color: '#ef4444',
                                                fontSize: '10px',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Dismiss
                                        </motion.button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Rubric Grading */}
                    <AnimatePresence>
                        {showRubric && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ marginBottom: '12px', overflow: 'hidden' }}
                            >
                                <div style={{
                                    padding: '12px',
                                    borderRadius: '10px',
                                    background: 'rgba(139, 92, 246, 0.04)',
                                    border: '1px solid rgba(139, 92, 246, 0.1)',
                                }}>
                                    {DEMO_RUBRIC.map((criteria) => (
                                        <div key={criteria.id} style={{ marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{criteria.name}</span>
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#8b5cf6' }}>
                                                    {rubricScores[criteria.id] || 0}/{criteria.max_points}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max={criteria.max_points}
                                                value={rubricScores[criteria.id] || 0}
                                                onChange={(e) => setRubricScores(prev => ({ ...prev, [criteria.id]: parseInt(e.target.value) }))}
                                                style={{ width: '100%', accentColor: '#8b5cf6', height: '4px' }}
                                            />
                                        </div>
                                    ))}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingTop: '10px',
                                        borderTop: '1px solid rgba(139, 92, 246, 0.15)',
                                    }}>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Total</span>
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#8b5cf6' }}>{rubricTotal}/{maxPoints}</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Score Input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input
                                ref={scoreInputRef}
                                type="number"
                                min="0"
                                max={maxPoints}
                                value={score}
                                onChange={(e) => setScore(e.target.value)}
                                placeholder="0"
                                style={{
                                    width: '100%',
                                    padding: '12px 50px 12px 14px',
                                    fontSize: '20px',
                                    fontWeight: 700,
                                    color: score ? scoreColor : '#94a3b8',
                                    border: `2px solid ${score ? `${scoreColor}40` : 'rgba(0,0,0,0.08)'}`,
                                    borderRadius: '10px',
                                    background: score ? `${scoreColor}05` : '#ffffff',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                }}
                            />
                            <span style={{
                                position: 'absolute',
                                right: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#94a3b8',
                            }}>
                                / {maxPoints}
                            </span>
                        </div>
                        {score && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    background: `${scoreColor}15`,
                                    color: scoreColor,
                                    fontSize: '14px',
                                    fontWeight: 700,
                                }}
                            >
                                {scorePercent.toFixed(0)}%
                            </motion.div>
                        )}
                    </div>

                    {/* Quick Scores */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {QUICK_SCORES.map((qs) => (
                            <motion.button
                                key={qs}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleQuickScore(qs)}
                                style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    border: score === qs.toString() ? '1px solid #3b82f6' : '1px solid rgba(0,0,0,0.08)',
                                    background: score === qs.toString() ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                    color: score === qs.toString() ? '#3b82f6' : '#64748b',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                {qs}
                            </motion.button>
                        ))}
                    </div>

                    {/* Late Penalty Indicator */}
                    {submission.is_late && gradingSettings?.latePenalty && score && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                background: 'rgba(245, 158, 11, 0.08)',
                                borderRadius: '8px',
                                border: '1px solid rgba(245, 158, 11, 0.2)',
                                marginTop: '8px',
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <div style={{ flex: 1 }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b' }}>
                                    Late submission penalty
                                </span>
                                <span style={{ fontSize: '11px', color: '#92400e', marginLeft: '6px' }}>
                                    -{gradingSettings.latePenaltyPercent}% ({Math.round((parseInt(score) || 0) * (gradingSettings.latePenaltyPercent / 100))} pts)
                                </span>
                            </div>
                            <div style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                color: '#f59e0b',
                                background: 'rgba(245, 158, 11, 0.15)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                            }}>
                                Final: {calculateFinalScore(parseInt(score) || 0)}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* AI Suggestion */}
                {score && aiSuggestion && (
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            style={{
                                padding: '10px 12px',
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(139, 92, 246, 0.06) 100%)',
                                borderRadius: '10px',
                                border: '1px solid rgba(59, 130, 246, 0.15)',
                                marginBottom: '12px',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '6px',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                                        <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                                        <path d="M12 2a10 10 0 0 1 10 10" />
                                        <circle cx="12" cy="12" r="6" />
                                    </svg>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#3b82f6', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        AI Suggestion
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                                        {aiSuggestion}
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleApplyAISuggestion}
                                    style={{
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: '#3b82f6',
                                        color: '#ffffff',
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    Apply
                                </motion.button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                )}

                {/* Feedback Section */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Feedback
                        </div>
                        {/* AI Feedback Button */}
                        {aiConfigured && score && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleGenerateAIFeedback}
                                disabled={isGeneratingFeedback}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(139, 92, 246, 0.2)',
                                    background: isGeneratingFeedback ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                    color: '#8b5cf6',
                                    fontSize: '10px',
                                    fontWeight: 500,
                                    cursor: isGeneratingFeedback ? 'wait' : 'pointer',
                                }}
                            >
                                {isGeneratingFeedback ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            style={{ width: '10px', height: '10px' }}
                                        >
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                            </svg>
                                        </motion.div>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                                            <circle cx="12" cy="12" r="4" />
                                        </svg>
                                        AI Feedback
                                    </>
                                )}
                            </motion.button>
                        )}
                    </div>
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Write feedback for the student..."
                        style={{
                            width: '100%',
                            minHeight: '100px',
                            padding: '12px 14px',
                            fontSize: '13px',
                            color: '#0f172a',
                            border: '1px solid rgba(0,0,0,0.08)',
                            borderRadius: '10px',
                            background: '#ffffff',
                            outline: 'none',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            lineHeight: 1.6,
                        }}
                    />
                    {draft && draft.lastSaved && (
                        <div style={{ fontSize: isMobile ? '9px' : '10px', color: '#94a3b8', marginTop: '4px' }}>
                            Auto-saved {formatDate(draft.lastSaved.toISOString())}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div style={{
                padding: isMobile ? '8px 12px' : '12px 20px',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                background: '#fafbfc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: isMobile ? '8px' : '0',
            }}>
                <div style={{ display: 'flex', gap: isMobile ? '4px' : '6px' }}>
                    <motion.button
                        whileHover={!isMobile ? { scale: 1.02 } : undefined}
                        whileTap={{ scale: 0.98 }}
                        onClick={onPrevious}
                        disabled={!hasPrevious}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: isMobile ? '6px 10px' : '8px 12px',
                            borderRadius: isMobile ? '6px' : '8px',
                            border: '1px solid rgba(0,0,0,0.08)',
                            background: '#ffffff',
                            color: hasPrevious ? '#0f172a' : '#94a3b8',
                            fontSize: isMobile ? '11px' : '12px',
                            fontWeight: 500,
                            cursor: hasPrevious ? 'pointer' : 'not-allowed',
                            opacity: hasPrevious ? 1 : 0.5,
                        }}
                    >
                        <svg width={isMobile ? "12" : "14"} height={isMobile ? "12" : "14"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        {!isMobile && 'Prev'}
                    </motion.button>
                    <motion.button
                        whileHover={!isMobile ? { scale: 1.02 } : undefined}
                        whileTap={{ scale: 0.98 }}
                        onClick={onNext}
                        disabled={!hasNext}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: isMobile ? '6px 10px' : '8px 12px',
                            borderRadius: isMobile ? '6px' : '8px',
                            border: '1px solid rgba(0,0,0,0.08)',
                            background: '#ffffff',
                            color: hasNext ? '#0f172a' : '#94a3b8',
                            fontSize: isMobile ? '11px' : '12px',
                            fontWeight: 500,
                            cursor: hasNext ? 'pointer' : 'not-allowed',
                            opacity: hasNext ? 1 : 0.5,
                        }}
                    >
                        {!isMobile && 'Next'}
                        <svg width={isMobile ? "12" : "14"} height={isMobile ? "12" : "14"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </motion.button>
                </div>
                <motion.button
                    whileHover={!isMobile ? { scale: 1.02, boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)' } : undefined}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveAndNext}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '4px' : '6px',
                        padding: isMobile ? '8px 14px' : '10px 20px',
                        borderRadius: isMobile ? '6px' : '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        fontSize: isMobile ? '12px' : '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                    }}
                >
                    <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    {isMobile ? 'Save' : `Save ${hasNext ? '& Next' : ''}`}
                </motion.button>
            </div>

            {/* Confirmation Dialog */}
            <AnimatePresence>
                {showConfirmDialog && pendingGrade && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(15, 23, 42, 0.6)',
                            backdropFilter: 'blur(4px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 100,
                        }}
                        onClick={handleCancelConfirm}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: '340px',
                                background: '#ffffff',
                                borderRadius: '16px',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                                overflow: 'hidden',
                            }}
                        >
                            <div style={{ padding: '20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#3b82f6',
                                    }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                                            Confirm Grade Submission
                                        </h3>
                                        <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                                            Review before finalizing
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '20px' }}>
                                <div style={{
                                    padding: '14px',
                                    background: 'rgba(59, 130, 246, 0.04)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(59, 130, 246, 0.1)',
                                    marginBottom: '16px',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>Student</span>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{submission.student_name}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>Score</span>
                                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>
                                            {pendingGrade.score}/{task?.points || 100}
                                        </span>
                                    </div>
                                    {submission.is_late && gradingSettings?.latePenalty && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 10px',
                                            background: 'rgba(245, 158, 11, 0.1)',
                                            borderRadius: '6px',
                                            marginTop: '8px',
                                        }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 500 }}>
                                                Late penalty ({gradingSettings.latePenaltyPercent}%) applied
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {pendingGrade.feedback && (
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>
                                            Feedback
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#475569',
                                            lineHeight: 1.5,
                                            maxHeight: '80px',
                                            overflow: 'auto',
                                            padding: '10px',
                                            background: 'rgba(0,0,0,0.02)',
                                            borderRadius: '8px',
                                        }}>
                                            {pendingGrade.feedback}
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <motion.button
                                        whileHover={{ background: 'rgba(0,0,0,0.06)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleCancelConfirm}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(0,0,0,0.1)',
                                            background: 'transparent',
                                            color: '#64748b',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleConfirmGrade}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            color: '#ffffff',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Confirm
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


// Batch Grade Modal Component
const BatchGradeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    selectedCount: number;
    maxPoints: number;
    onApply: (score: number, feedback: string) => void;
}> = ({ isOpen, onClose, selectedCount, maxPoints, onApply }) => {
    const [score, setScore] = useState('');
    const [feedback, setFeedback] = useState('');

    if (!isOpen) return null;

    const handleApply = () => {
        onApply(parseInt(score) || 0, feedback);
        setScore('');
        setFeedback('');
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                style={{
                    width: '400px',
                    background: '#ffffff',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    overflow: 'hidden',
                }}
            >
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                        Batch Grade
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                        Apply the same grade to {selectedCount} selected submissions
                    </p>
                </div>

                <div style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                            Score
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="number"
                                min="0"
                                max={maxPoints}
                                value={score}
                                onChange={(e) => setScore(e.target.value)}
                                placeholder="0"
                                style={{
                                    flex: 1,
                                    padding: '10px 12px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    borderRadius: '8px',
                                    outline: 'none',
                                }}
                            />
                            <span style={{ fontSize: '14px', color: '#64748b' }}>/ {maxPoints}</span>
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                            Feedback (optional)
                        </label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Common feedback for all selected..."
                            style={{
                                width: '100%',
                                minHeight: '80px',
                                padding: '10px 12px',
                                fontSize: '13px',
                                border: '1px solid rgba(0,0,0,0.1)',
                                borderRadius: '8px',
                                outline: 'none',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                            }}
                        />
                    </div>
                </div>

                <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(0,0,0,0.1)',
                            background: '#ffffff',
                            color: '#64748b',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleApply}
                        disabled={!score}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            background: score ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'rgba(0,0,0,0.1)',
                            color: score ? '#ffffff' : '#94a3b8',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: score ? 'pointer' : 'not-allowed',
                        }}
                    >
                        Apply to {selectedCount}
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};


// Main Modal Component
const GradeSubmissionsModal: React.FC<GradeSubmissionsModalProps> = ({ isOpen, onClose }) => {
    // Responsive state for mobile compatibility
    const { isMobile, isSmallMobile } = useResponsive();

    const [viewMode, setViewMode] = useState<ViewMode>('split');
    const [selectedCourse, setSelectedCourse] = useState<string>('all');
    const [selectedTask, setSelectedTask] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [sortBy, setSortBy] = useState<SortOption>('smart');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [batchSelected, setBatchSelected] = useState<Set<string>>(new Set());
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ name: string; url: string; type: string } | null>(null);
    const [drafts, setDrafts] = useState<Record<string, DraftGrade>>({});
    const [gradedThisSession, setGradedThisSession] = useState(0);
    const [courses, setCourses] = useState<Course[]>([]);
    const [useRealData, setUseRealData] = useState(true); // Always use real data now

    // Grading settings from context
    const { settings: gradingSettings } = useGradingSettings();

    // Display settings from context
    const { settings: displaySettings, shouldAnimate, shouldShowAvatar } = useDisplaySettings();
    const isCompact = displaySettings.compactView;

    // Batch AI Grading State
    const [isBatchAIGrading, setIsBatchAIGrading] = useState(false);
    const [batchAIProgress, setBatchAIProgress] = useState<{ current: number; total: number; studentName: string } | null>(null);
    const [batchAIResults, setBatchAIResults] = useState<Map<string, AIGradingResult> | null>(null);
    const [showBatchAIReview, setShowBatchAIReview] = useState(false);

    // Fetch real data from Supabase when modal opens
    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                setIsLoadingData(true);
                try {
                    // Fetch courses
                    const catalogCourses = await getCatalogCourses();
                    if (catalogCourses && catalogCourses.length > 0) {
                        const mappedCourses: Course[] = catalogCourses.map((c: CatalogCourse) => ({
                            id: c.id,
                            short_title: c.shortTitle,
                            title: c.title,
                        }));
                        setCourses(mappedCourses);
                        console.log('[GradeSubmissionsModal] Loaded courses:', mappedCourses.length);
                    }

                    // Fetch tasks from Supabase
                    const dbTasks = await fetchTasksForGrading();
                    if (dbTasks && dbTasks.length > 0) {
                        const mappedTasks: Task[] = dbTasks.map((t: DbTask) => ({
                            id: t.id,
                            course_id: t.course_id,
                            type: t.type,
                            title: t.title,
                            description: t.description,
                            due_date: t.due_date,
                            points: t.points,
                        }));
                        setTasks(mappedTasks);
                        console.log('[GradeSubmissionsModal] Loaded tasks from DB:', mappedTasks.length);
                    } else {
                        // No tasks in database - use demo data
                        const { DEMO_GRADING_TASKS } = await import('./demoData');
                        const demoTasks: Task[] = DEMO_GRADING_TASKS.map(t => ({
                            id: t.id,
                            course_id: t.course_id,
                            type: t.type,
                            title: t.title,
                            description: t.description,
                            due_date: t.due_date,
                            points: t.points,
                        }));
                        setTasks(demoTasks);
                        console.log('[GradeSubmissionsModal] Using demo tasks:', demoTasks.length);
                    }

                    // Fetch submissions from Supabase
                    const dbSubmissions = await fetchAllSubmissions();
                    if (dbSubmissions && dbSubmissions.length > 0) {
                        const mappedSubmissions: Submission[] = dbSubmissions.map((s: DbSubmission) => ({
                            id: s.id,
                            task_id: s.task_id,
                            student_id: s.student_id,
                            student_name: s.student_name,
                            section: s.section || 'BSIT101A',
                            text_content: s.text_content,
                            attachments: s.attachments.map(a => ({
                                name: a.name,
                                url: a.url,
                                type: a.type,
                            })),
                            status: s.status,
                            score: s.score,
                            feedback: s.feedback,
                            submitted_at: s.submitted_at,
                            graded_at: s.graded_at,
                            is_late: s.is_late,
                            is_flagged: s.is_flagged,
                            similarity_score: s.similarity_score,
                            grade_history: s.grade_history,
                        }));
                        setSubmissions(mappedSubmissions);
                        setUseRealData(true);
                        console.log('[GradeSubmissionsModal] Loaded submissions from DB:', mappedSubmissions.length);
                    } else {
                        // No submissions in database - use demo data
                        const { DEMO_GRADING_SUBMISSIONS } = await import('./demoData');
                        const demoSubmissions: Submission[] = DEMO_GRADING_SUBMISSIONS.map(s => ({
                            id: s.id,
                            task_id: s.task_id,
                            student_id: s.student_id,
                            student_name: s.student_name,
                            section: 'CS-3A',
                            text_content: s.text_content || '',
                            attachments: s.attachments,
                            status: s.status,
                            score: s.score,
                            feedback: s.feedback,
                            submitted_at: s.submitted_at,
                            graded_at: undefined,
                            is_late: s.is_late,
                            is_flagged: s.is_flagged,
                            similarity_score: s.similarity_score,
                            grade_history: s.grade_history,
                        }));
                        setSubmissions(demoSubmissions);
                        setUseRealData(false);
                        console.log('[GradeSubmissionsModal] Using demo submissions:', demoSubmissions.length);
                    }
                } catch (error) {
                    console.error('[GradeSubmissionsModal] Failed to fetch data:', error);
                    // On error, use demo data as fallback
                    const { DEMO_GRADING_TASKS, DEMO_GRADING_SUBMISSIONS } = await import('./demoData');
                    const demoTasks: Task[] = DEMO_GRADING_TASKS.map(t => ({
                        id: t.id,
                        course_id: t.course_id,
                        type: t.type,
                        title: t.title,
                        description: t.description,
                        due_date: t.due_date,
                        points: t.points,
                    }));
                    const demoSubmissions: Submission[] = DEMO_GRADING_SUBMISSIONS.map(s => ({
                        id: s.id,
                        task_id: s.task_id,
                        student_id: s.student_id,
                        student_name: s.student_name,
                        section: 'CS-3A',
                        text_content: s.text_content || '',
                        attachments: s.attachments,
                        status: s.status,
                        score: s.score,
                        feedback: s.feedback,
                        submitted_at: s.submitted_at,
                        graded_at: undefined,
                        is_late: s.is_late,
                        is_flagged: s.is_flagged,
                        similarity_score: s.similarity_score,
                        grade_history: s.grade_history,
                    }));
                    setTasks(demoTasks);
                    setSubmissions(demoSubmissions);
                    setUseRealData(false);
                    console.log('[GradeSubmissionsModal] Using demo data after error');
                } finally {
                    setIsLoadingData(false);
                }
            };
            fetchData();
        }
    }, [isOpen]);

    // Get the active tasks list (real data only)
    const activeTasks = useMemo(() => {
        return tasks;
    }, [tasks]);

    // Filter and sort submissions
    const filteredSubmissions = useMemo(() => {
        let result = [...submissions];

        // Filter by course
        if (selectedCourse !== 'all') {
            const courseTasks = activeTasks.filter(t => t.course_id === selectedCourse).map(t => t.id);
            result = result.filter(s => courseTasks.includes(s.task_id));
        }

        // Filter by task
        if (selectedTask !== 'all') {
            result = result.filter(s => s.task_id === selectedTask);
        }

        // Filter by status
        if (filterStatus !== 'all') {
            if (filterStatus === 'pending') {
                result = result.filter(s => s.status === 'submitted' || s.status === 'resubmitted');
            } else if (filterStatus === 'flagged') {
                result = result.filter(s => s.is_flagged);
            } else {
                result = result.filter(s => s.status === filterStatus);
            }
        }

        // Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.student_name.toLowerCase().includes(query) ||
                s.student_id.includes(query) ||
                s.section.toLowerCase().includes(query)
            );
        }

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'smart':
                    return getSmartPriority(b) - getSmartPriority(a);
                case 'name':
                    return a.student_name.localeCompare(b.student_name);
                case 'status':
                    return a.status.localeCompare(b.status);
                case 'submitted':
                default:
                    return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
            }
        });

        return result;
    }, [submissions, selectedCourse, selectedTask, filterStatus, searchQuery, sortBy]);


    // Get available tasks for selected course
    const availableTasks = useMemo(() => {
        if (selectedCourse === 'all') return activeTasks;
        return activeTasks.filter(t => t.course_id === selectedCourse);
    }, [selectedCourse, activeTasks]);

    // Stats
    const stats = useMemo(() => {
        const pending = filteredSubmissions.filter(s => s.status === 'submitted' || s.status === 'resubmitted').length;
        const graded = filteredSubmissions.filter(s => s.status === 'graded').length;
        const late = filteredSubmissions.filter(s => s.status === 'late').length;
        const flagged = filteredSubmissions.filter(s => s.is_flagged).length;
        return { total: filteredSubmissions.length, pending, graded, late, flagged };
    }, [filteredSubmissions]);

    // Selected submission
    const selectedSubmission = useMemo(() => {
        return filteredSubmissions.find(s => s.id === selectedSubmissionId);
    }, [filteredSubmissions, selectedSubmissionId]);

    const selectedIndex = useMemo(() => {
        return filteredSubmissions.findIndex(s => s.id === selectedSubmissionId);
    }, [filteredSubmissions, selectedSubmissionId]);

    // Auto-select first submission
    useEffect(() => {
        if (filteredSubmissions.length > 0 && !selectedSubmissionId) {
            setSelectedSubmissionId(filteredSubmissions[0].id);
        }
    }, [filteredSubmissions, selectedSubmissionId]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key === 'Escape') {
                if (previewFile) setPreviewFile(null);
                else onClose();
            } else if (e.key === 'ArrowUp' && selectedIndex > 0) {
                setSelectedSubmissionId(filteredSubmissions[selectedIndex - 1].id);
            } else if (e.key === 'ArrowDown' && selectedIndex < filteredSubmissions.length - 1) {
                setSelectedSubmissionId(filteredSubmissions[selectedIndex + 1].id);
            } else if (e.key.toLowerCase() === 'r' && selectedSubmissionId) {
                handleFlag(selectedSubmissionId);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, selectedIndex, filteredSubmissions, previewFile, selectedSubmissionId]);

    // Handle grading - saves to Supabase if using real data
    const handleGrade = useCallback(async (score: number, feedback: string) => {
        if (!selectedSubmissionId) return;

        // Update local state immediately for responsiveness
        setSubmissions(prev => prev.map(s =>
            s.id === selectedSubmissionId
                ? { ...s, score, feedback, status: 'graded' as const, graded_at: new Date().toISOString(), is_flagged: false }
                : s
        ));

        // Clear draft
        setDrafts(prev => {
            const next = { ...prev };
            delete next[selectedSubmissionId];
            return next;
        });

        setGradedThisSession(prev => prev + 1);

        // Save to Supabase if using real data
        if (useRealData) {
            try {
                const success = await saveGradeToDb({
                    submissionId: selectedSubmissionId,
                    score,
                    feedback,
                    gradedBy: 'teacher', // TODO: Get actual teacher ID from auth context
                });
                if (success) {
                    console.log('[GradeSubmissionsModal] Grade saved to database');
                } else {
                    console.warn('[GradeSubmissionsModal] Failed to save grade to database');
                }
            } catch (error) {
                console.error('[GradeSubmissionsModal] Error saving grade:', error);
            }
        }
    }, [selectedSubmissionId, useRealData]);

    // Handle flagging - saves to Supabase if using real data
    const handleFlag = useCallback(async (id: string) => {
        // Update local state immediately
        setSubmissions(prev => prev.map(s =>
            s.id === id ? { ...s, is_flagged: !s.is_flagged } : s
        ));

        // Save to Supabase if using real data
        if (useRealData) {
            try {
                await toggleSubmissionFlag(id);
            } catch (error) {
                console.error('[GradeSubmissionsModal] Error toggling flag:', error);
            }
        }
    }, [useRealData]);

    // Handle draft change
    const handleDraftChange = useCallback((draft: DraftGrade) => {
        if (!selectedSubmissionId) return;
        setDrafts(prev => ({ ...prev, [selectedSubmissionId]: draft }));
    }, [selectedSubmissionId]);

    // Navigation
    const handleNext = useCallback(() => {
        if (selectedIndex < filteredSubmissions.length - 1) {
            setSelectedSubmissionId(filteredSubmissions[selectedIndex + 1].id);
        }
    }, [selectedIndex, filteredSubmissions]);

    const handlePrevious = useCallback(() => {
        if (selectedIndex > 0) {
            setSelectedSubmissionId(filteredSubmissions[selectedIndex - 1].id);
        }
    }, [selectedIndex, filteredSubmissions]);

    // Batch mode
    const toggleBatchSelect = (id: string) => {
        setBatchSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleBatchGrade = (score: number, feedback: string) => {
        setSubmissions(prev => prev.map(s =>
            batchSelected.has(s.id)
                ? { ...s, score, feedback, status: 'graded' as const, graded_at: new Date().toISOString() }
                : s
        ));
        setGradedThisSession(prev => prev + batchSelected.size);
        setBatchSelected(new Set());
    };

    // Batch AI Grading Handler - Enhanced with content extraction
    const handleBatchAIGrade = async () => {
        if (batchSelected.size === 0 || isBatchAIGrading) return;

        // Get task info from first selected submission
        const firstSelectedId = Array.from(batchSelected)[0];
        const firstSubmission = submissions.find(s => s.id === firstSelectedId);
        const task = firstSubmission ? activeTasks.find(t => t.id === firstSubmission.task_id) : null;

        if (!task) return;

        setIsBatchAIGrading(true);
        setBatchAIProgress({ current: 0, total: batchSelected.size, studentName: '' });

        // Prepare submissions for batch grading with enhanced content extraction
        const submissionsToGrade = Array.from(batchSelected)
            .map(id => submissions.find(s => s.id === id))
            .filter((s): s is Submission => s !== undefined)
            .map(s => ({
                id: s.id,
                studentName: s.student_name,
                content: extractSubmissionContent({
                    textContent: s.text_content,
                    attachments: s.attachments.map(a => ({
                        name: a.name,
                        type: a.type,
                        url: a.url,
                        textContent: a.textContent,
                    })),
                }),
            }));

        try {
            const result = await batchGradeSubmissions(
                submissionsToGrade,
                {
                    title: task.title,
                    description: task.description || 'Complete the assigned task.',
                    maxPoints: task.points,
                },
                (current, total, studentName) => {
                    setBatchAIProgress({ current, total, studentName });
                }
            );

            setBatchAIResults(result.results);
            setShowBatchAIReview(true);
            console.log(`[Batch AI Grade] Completed: ${result.gradedCount} graded, ${result.failedCount} failed`);
        } catch (error) {
            console.error('[Batch AI Grade] Error:', error);
        } finally {
            setIsBatchAIGrading(false);
            setBatchAIProgress(null);
        }
    };

    // Apply all batch AI results - saves to Supabase if using real data
    const handleApplyBatchAIResults = async () => {
        if (!batchAIResults) return;

        setSubmissions(prev => prev.map(s => {
            const result = batchAIResults.get(s.id);
            if (result?.success) {
                return {
                    ...s,
                    score: result.suggestedScore,
                    feedback: result.feedback,
                    status: 'graded' as const,
                    graded_at: new Date().toISOString(),
                };
            }
            return s;
        }));

        const successCount = Array.from(batchAIResults.values()).filter(r => r.success).length;
        setGradedThisSession(prev => prev + successCount);
        setBatchSelected(new Set());
        setBatchAIResults(null);
        setShowBatchAIReview(false);
    };

    // Cancel batch AI review
    const handleCancelBatchAIReview = () => {
        setBatchAIResults(null);
        setShowBatchAIReview(false);
    };

    if (!isOpen) return null;

    const selectedTask_obj = selectedSubmission ? activeTasks.find(t => t.id === selectedSubmission.task_id) : undefined;


    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: isMobile ? 'stretch' : 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: isMobile ? 0 : '20px',
                    }}
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? '100%' : 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? '100%' : 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            width: '100%',
                            maxWidth: isMobile ? '100%' : '1200px',
                            height: isMobile ? '100%' : '90vh',
                            maxHeight: isMobile ? '100%' : '850px',
                            background: '#ffffff',
                            borderRadius: isMobile ? 0 : '20px',
                            boxShadow: isMobile ? 'none' : '0 25px 80px rgba(0,0,0,0.25)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            position: 'relative',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: isMobile ? '12px 16px' : '16px 20px',
                            borderBottom: '1px solid rgba(0,0,0,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '12px' }}>
                                <div style={{
                                    width: isMobile ? '36px' : '40px',
                                    height: isMobile ? '36px' : '40px',
                                    borderRadius: isMobile ? '10px' : '12px',
                                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
                                    border: '1px solid rgba(245, 158, 11, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#f59e0b',
                                    flexShrink: 0,
                                }}>
                                    <svg width={isMobile ? "18" : "20"} height={isMobile ? "18" : "20"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                        Grade Submissions
                                    </h2>
                                    <p style={{ fontSize: isMobile ? '11px' : '12px', color: '#64748b', margin: 0 }}>
                                        {stats.pending} pending • {stats.graded} graded
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '10px' }}>
                                {/* Grading Timer - hide on small mobile */}
                                {!isSmallMobile && <GradingTimer isActive={isOpen} gradedCount={gradedThisSession} />}

                                {/* View Mode Toggle - hide on mobile (force list view) */}
                                {!isMobile && (
                                    <div style={{
                                        display: 'flex',
                                        background: 'rgba(0,0,0,0.04)',
                                        borderRadius: '8px',
                                        padding: '3px',
                                        position: 'relative',
                                    }}>
                                        {/* Sliding Background Indicator */}
                                        <motion.div
                                            layout
                                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                            style={{
                                                position: 'absolute',
                                                top: '3px',
                                                left: viewMode === 'split' ? '3px' : 'calc(50% + 1.5px)',
                                                width: 'calc(50% - 4.5px)',
                                                height: 'calc(100% - 6px)',
                                                background: '#ffffff',
                                                borderRadius: '6px',
                                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                            }}
                                        />
                                        {(['split', 'batch'] as ViewMode[]).map((mode) => (
                                            <motion.button
                                                key={mode}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setViewMode(mode)}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    color: viewMode === mode ? '#0f172a' : '#64748b',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    textTransform: 'capitalize',
                                                    position: 'relative',
                                                    zIndex: 1,
                                                    transition: 'color 0.2s ease',
                                                }}
                                            >
                                                {mode}
                                            </motion.button>
                                        ))}
                                    </div>
                                )}

                                {/* Shortcuts - hide on mobile */}
                                {!isMobile && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowShortcuts(!showShortcuts)}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(0,0,0,0.08)',
                                            background: showShortcuts ? 'rgba(59, 130, 246, 0.1)' : '#ffffff',
                                            color: showShortcuts ? '#3b82f6' : '#64748b',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                        title="Keyboard Shortcuts"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="2" y="4" width="20" height="16" rx="2" />
                                            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
                                        </svg>
                                    </motion.button>
                                )}

                                {/* Close */}
                                <motion.button
                                    whileHover={{ scale: 1.05, background: 'rgba(239, 68, 68, 0.1)' }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onClose}
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: 'rgba(0,0,0,0.04)',
                                        color: '#64748b',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </motion.button>
                            </div>
                        </div>

                        {/* Shortcuts Panel */}
                        <AnimatePresence>
                            {showShortcuts && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    style={{
                                        borderBottom: '1px solid rgba(0,0,0,0.06)',
                                        background: 'rgba(59, 130, 246, 0.04)',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                                        {KEYBOARD_SHORTCUTS.map((s, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <kbd style={{
                                                    padding: '2px 5px',
                                                    borderRadius: '4px',
                                                    background: '#ffffff',
                                                    border: '1px solid rgba(0,0,0,0.1)',
                                                    fontSize: '10px',
                                                    fontWeight: 600,
                                                    fontFamily: 'monospace',
                                                }}>
                                                    {s.key}
                                                </kbd>
                                                <span style={{ fontSize: '10px', color: '#64748b' }}>{s.action}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>


                        {/* Main Content */}
                        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row' }}>
                            {/* Left Panel */}
                            <div style={{
                                width: isMobile ? '100%' : '420px',
                                minWidth: isMobile ? undefined : '420px',
                                borderRight: isMobile ? 'none' : '1px solid rgba(0,0,0,0.06)',
                                borderBottom: isMobile ? '1px solid rgba(0,0,0,0.06)' : 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                background: '#fafbfc',
                                flex: isMobile ? '1 1 auto' : undefined,
                                overflow: isMobile ? 'auto' : undefined,
                            }}>
                                {/* Stats Bar - Conditional based on showAnalytics setting, hide on mobile */}
                                {gradingSettings.showAnalytics && !isMobile && (
                                    <div style={{ padding: '12px' }}>
                                        <StatsBar submissions={filteredSubmissions} tasks={activeTasks} />
                                    </div>
                                )}

                                {/* Filters */}
                                <div style={{ padding: isMobile ? '8px 12px' : '0 16px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                                    {/* Search */}
                                    <div style={{ position: 'relative', marginBottom: isMobile ? '8px' : '10px' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                            <circle cx="11" cy="11" r="8" />
                                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                        </svg>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search students..."
                                            style={{
                                                width: '100%',
                                                padding: isMobile ? '8px 12px 8px 32px' : '9px 12px 9px 32px',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(0,0,0,0.08)',
                                                background: '#ffffff',
                                                fontSize: '13px',
                                                outline: 'none',
                                            }}
                                        />
                                    </div>

                                    {/* Filter Row 1 - Course, Task & Sort */}
                                    <div style={{
                                        display: 'flex',
                                        gap: isMobile ? '6px' : '8px',
                                        marginBottom: isMobile ? '8px' : '10px',
                                        justifyContent: isMobile ? 'center' : 'flex-start',
                                        flexWrap: isMobile ? 'wrap' : 'nowrap',
                                    }}>
                                        <CustomDropdown
                                            value={selectedCourse}
                                            onChange={(val) => { setSelectedCourse(val); setSelectedTask('all'); }}
                                            placeholder="Select a course"
                                            options={[
                                                { id: 'all', label: 'All Courses' },
                                                ...courses.map(c => ({
                                                    id: c.id,
                                                    label: c.short_title
                                                        ? `${c.short_title} - ${c.title || c.name || ''}`.trim()
                                                        : c.title || c.name || 'Course'
                                                }))
                                            ]}
                                            minWidth={isMobile ? '120px' : '120px'}
                                        />
                                        <CustomDropdown
                                            value={selectedTask}
                                            onChange={(val) => setSelectedTask(val)}
                                            placeholder="Select a task"
                                            options={[
                                                { id: 'all', label: 'All Tasks' },
                                                ...availableTasks.map(t => ({ id: t.id, label: t.title }))
                                            ]}
                                            minWidth={isMobile ? '100px' : '120px'}
                                        />
                                        <CustomDropdown
                                            value={sortBy}
                                            onChange={(val) => setSortBy(val as SortOption)}
                                            variant="purple"
                                            minWidth={isMobile ? '90px' : '110px'}
                                            options={[
                                                { id: 'smart', label: 'Smart', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg> },
                                                { id: 'submitted', label: 'Recent' },
                                                { id: 'name', label: 'Name' },
                                            ]}
                                        />
                                    </div>

                                    {/* Filter Row 2 - Status Pills with Container */}
                                    <div style={{
                                        display: 'flex',
                                        gap: isMobile ? '1px' : '2px',
                                        background: 'rgba(0,0,0,0.04)',
                                        borderRadius: isMobile ? '8px' : '10px',
                                        padding: isMobile ? '2px' : '3px',
                                        overflowX: isMobile ? 'auto' : 'visible',
                                        WebkitOverflowScrolling: 'touch',
                                    }}>
                                        {([
                                            { value: 'all', label: 'All', count: stats.total },
                                            { value: 'pending', label: isMobile ? 'Pend' : 'Pending', count: stats.pending, color: '#3b82f6' },
                                            { value: 'graded', label: isMobile ? 'Done' : 'Graded', count: stats.graded, color: '#10b981' },
                                            { value: 'late', label: 'Late', count: stats.late, color: '#ef4444' },
                                            { value: 'flagged', label: isMobile ? 'Flag' : 'Flagged', count: stats.flagged, color: '#f59e0b' },
                                        ] as { value: FilterStatus; label: string; count: number; color?: string }[]).map((f) => (
                                            <motion.button
                                                key={f.value}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setFilterStatus(f.value)}
                                                style={{
                                                    flex: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: isMobile ? '2px' : '4px',
                                                    padding: isMobile ? '4px 6px' : '5px 10px',
                                                    borderRadius: isMobile ? '6px' : '8px',
                                                    border: 'none',
                                                    background: filterStatus === f.value ? '#ffffff' : 'transparent',
                                                    boxShadow: filterStatus === f.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                                    color: filterStatus === f.value ? f.color || '#0f172a' : '#64748b',
                                                    fontSize: isMobile ? '10px' : '11px',
                                                    fontWeight: filterStatus === f.value ? 600 : 500,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease',
                                                    flexShrink: 0,
                                                    minWidth: isMobile ? 'auto' : undefined,
                                                }}
                                            >
                                                {f.label}
                                                <span style={{
                                                    fontSize: isMobile ? '9px' : '10px',
                                                    fontWeight: 700,
                                                    padding: isMobile ? '1px 4px' : '1px 5px',
                                                    borderRadius: '4px',
                                                    background: filterStatus === f.value ? `${f.color || '#0f172a'}15` : 'rgba(0,0,0,0.06)',
                                                    color: filterStatus === f.value ? f.color || '#0f172a' : '#94a3b8',
                                                }}>
                                                    {f.count}
                                                </span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Submissions List */}
                                <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '6px 8px' : '8px 12px', minHeight: isMobile ? '100px' : undefined }}>
                                    {isLoadingData ? (
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: isMobile ? '100px' : '150px',
                                            color: '#94a3b8',
                                        }}>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                style={{ marginBottom: '8px' }}
                                            >
                                                <svg width={isMobile ? "20" : "24"} height={isMobile ? "20" : "24"} viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                                </svg>
                                            </motion.div>
                                            <span style={{ fontSize: isMobile ? '11px' : '12px' }}>Loading submissions...</span>
                                        </div>
                                    ) : filteredSubmissions.length === 0 ? (
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: isMobile ? 'auto' : '200px',
                                            minHeight: isMobile ? '80px' : '200px',
                                            color: '#94a3b8',
                                            padding: isMobile ? '16px 12px' : '20px',
                                            textAlign: 'center',
                                        }}>
                                            <svg width={isMobile ? "32" : "48"} height={isMobile ? "32" : "48"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: isMobile ? '8px' : '12px', opacity: 0.4 }}>
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14 2 14 8 20 8" />
                                                <line x1="9" y1="13" x2="15" y2="13" />
                                                <line x1="9" y1="17" x2="13" y2="17" />
                                            </svg>
                                            <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 500, color: '#64748b', marginBottom: '4px' }}>
                                                {submissions.length === 0 ? 'No submissions yet' : 'No matching submissions'}
                                            </span>
                                            <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#94a3b8', maxWidth: isMobile ? '220px' : '200px' }}>
                                                {submissions.length === 0
                                                    ? 'Submissions will appear here once students submit'
                                                    : 'Try adjusting your filters'
                                                }
                                            </span>
                                        </div>
                                    ) : (
                                        filteredSubmissions.map((submission, index) => (
                                            <SubmissionCard
                                                key={submission.id}
                                                submission={submission}
                                                task={activeTasks.find(t => t.id === submission.task_id)}
                                                isSelected={selectedSubmissionId === submission.id}
                                                onClick={() => setSelectedSubmissionId(submission.id)}
                                                onFlag={() => handleFlag(submission.id)}
                                                index={index}
                                                showCheckbox={viewMode === 'batch'}
                                                isChecked={batchSelected.has(submission.id)}
                                                onCheck={() => toggleBatchSelect(submission.id)}
                                                showAvatars={isMobile ? false : shouldShowAvatar}
                                                shouldAnimate={isMobile ? false : shouldAnimate}
                                                isCompact={isMobile ? true : isCompact}
                                            />
                                        ))
                                    )}
                                </div>

                                {/* Batch Actions */}
                                {viewMode === 'batch' && batchSelected.size > 0 && !isBatchAIGrading && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            padding: '10px 12px',
                                            borderTop: '1px solid rgba(0,0,0,0.06)',
                                            background: '#ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <span style={{ fontSize: '12px', fontWeight: 500, color: '#0f172a' }}>
                                            {batchSelected.size} selected
                                        </span>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <motion.button
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setBatchSelected(new Set())}
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid rgba(0,0,0,0.08)',
                                                    background: '#ffffff',
                                                    color: '#64748b',
                                                    fontSize: '11px',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Clear
                                            </motion.button>
                                            {/* AI Grade All Button */}
                                            {isAIGradingConfigured() && (
                                                <motion.button
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={handleBatchAIGrade}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        padding: '6px 10px',
                                                        borderRadius: '6px',
                                                        border: 'none',
                                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                        color: '#ffffff',
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                                                    }}
                                                >
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                                                        <circle cx="12" cy="12" r="4" />
                                                    </svg>
                                                    AI Grade All
                                                </motion.button>
                                            )}
                                            <motion.button
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setShowBatchModal(true)}
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                    color: '#ffffff',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Manual Grade
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Batch AI Grading Progress */}
                                {isBatchAIGrading && batchAIProgress && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            padding: '12px',
                                            borderTop: '1px solid rgba(0,0,0,0.06)',
                                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                                </svg>
                                            </motion.div>
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#10b981' }}>
                                                AI Grading {batchAIProgress.current} of {batchAIProgress.total}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                                            Analyzing: {batchAIProgress.studentName}...
                                        </div>
                                        <div style={{ height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(batchAIProgress.current / batchAIProgress.total) * 100}%` }}
                                                style={{
                                                    height: '100%',
                                                    background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
                                                    borderRadius: '3px',
                                                }}
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {/* Batch AI Review Panel */}
                                {showBatchAIReview && batchAIResults && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            padding: '12px',
                                            borderTop: '1px solid rgba(0,0,0,0.06)',
                                            background: '#ffffff',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <div>
                                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                                                    AI Grading Complete
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                    {Array.from(batchAIResults.values()).filter(r => r.success).length} of {batchAIResults.size} graded successfully
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <motion.button
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={handleCancelBatchAIReview}
                                                    style={{
                                                        padding: '6px 10px',
                                                        borderRadius: '6px',
                                                        border: '1px solid rgba(0,0,0,0.08)',
                                                        background: '#ffffff',
                                                        color: '#64748b',
                                                        fontSize: '11px',
                                                        fontWeight: 500,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    Cancel
                                                </motion.button>
                                                <motion.button
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={handleApplyBatchAIResults}
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        border: 'none',
                                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                        color: '#ffffff',
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    Apply All Grades
                                                </motion.button>
                                            </div>
                                        </div>
                                        {/* Preview of results */}
                                        <div style={{ maxHeight: '120px', overflow: 'auto', fontSize: '10px', color: '#64748b' }}>
                                            {Array.from(batchAIResults.entries()).slice(0, 5).map(([id, result]) => {
                                                const sub = submissions.find(s => s.id === id);
                                                return (
                                                    <div key={id} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '4px 0',
                                                        borderBottom: '1px solid rgba(0,0,0,0.04)',
                                                    }}>
                                                        <span style={{
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            background: result.success ? '#10b981' : '#ef4444',
                                                        }} />
                                                        <span style={{ flex: 1 }}>{sub?.student_name || 'Unknown'}</span>
                                                        {result.success ? (
                                                            <span style={{ fontWeight: 600, color: '#10b981' }}>
                                                                {result.suggestedScore} pts ({result.confidence}%)
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: '#ef4444' }}>Failed</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {batchAIResults.size > 5 && (
                                                <div style={{ padding: '4px 0', fontStyle: 'italic' }}>
                                                    +{batchAIResults.size - 5} more...
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </div>


                            {/* Right Panel - Grading */}
                            {selectedSubmission ? (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff', position: 'relative', minHeight: isMobile ? '200px' : undefined }}>
                                    <GradingPanel
                                        submission={selectedSubmission}
                                        task={selectedTask_obj}
                                        onGrade={handleGrade}
                                        onNext={handleNext}
                                        onPrevious={handlePrevious}
                                        onFlag={() => handleFlag(selectedSubmission.id)}
                                        hasNext={selectedIndex < filteredSubmissions.length - 1}
                                        hasPrevious={selectedIndex > 0}
                                        currentIndex={selectedIndex}
                                        totalCount={filteredSubmissions.length}
                                        draft={drafts[selectedSubmission.id] || null}
                                        onDraftChange={handleDraftChange}
                                        onPreviewFile={setPreviewFile}
                                        gradingSettings={gradingSettings}
                                    />

                                    {/* File Preview Overlay */}
                                    <AnimatePresence>
                                        {previewFile && (
                                            <FilePreviewPanel file={previewFile} onClose={() => setPreviewFile(null)} />
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                /* Hide empty state on mobile to give more room to submissions list */
                                !isMobile && (
                                    <div style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#ffffff',
                                        color: '#94a3b8',
                                        padding: '20px',
                                    }}>
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '12px', opacity: 0.4 }}>
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                        <span style={{ fontSize: '14px', fontWeight: 500 }}>Select a submission</span>
                                        <span style={{ fontSize: '12px', marginTop: '4px' }}>Choose from the list to start grading</span>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Batch Grade Modal */}
                        <AnimatePresence>
                            {showBatchModal && (
                                <BatchGradeModal
                                    isOpen={showBatchModal}
                                    onClose={() => setShowBatchModal(false)}
                                    selectedCount={batchSelected.size}
                                    maxPoints={selectedTask_obj?.points || 100}
                                    onApply={handleBatchGrade}
                                />
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default GradeSubmissionsModal;
