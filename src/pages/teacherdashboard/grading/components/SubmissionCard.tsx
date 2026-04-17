import React, { memo } from 'react';
import { motion } from 'motion/react';
import type { Submission, Task } from '../types';
import { getStatusColor, getOutlierIndicator, getStatusLabel, formatDate } from '../utils';
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



// Professional Stats Bar Component - Detailed grading analytics
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
    const maxPoints = task?.points || 100;
    const scorePercent = submission.score !== null && submission.score !== undefined ? Math.round((submission.score / maxPoints) * 100) : null;

    // Get outlier indicator
    const outlier = getOutlierIndicator(
        submission.score ?? undefined,
        maxPoints,
        submission.similarity_score,
        submission.is_late ?? false,
        submission.attachments.length
    );

    // Score color logic
    const getScoreColor = (pct: number) => {
        if (pct >= 75) return 'var(--color-success)';
        if (pct >= 60) return 'var(--color-warning)';
        return 'var(--color-danger)';
    };

    const MotionWrapper = shouldAnimate ? motion.div : 'div';
    const motionProps = shouldAnimate ? {
        initial: { opacity: 0, x: -10 },
        animate: { opacity: 1, x: 0 },
        transition: { delay: index * 0.02 },
        whileHover: {
            background: isSelected ? `${statusColor}0a` : 'rgba(0,0,0,0.015)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        },
    } : {};

    return (
        <MotionWrapper
            {...motionProps}
            onClick={onClick}
            className="submission-item-wrapper"
            style={{
                padding: isCompact ? '10px 12px' : '10px 14px',
                borderRadius: '14px',
                background: isSelected ? `${statusColor}08` : 'transparent',
                border: `1.5px solid ${isSelected ? `${statusColor}35` : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                transition: shouldAnimate ? 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                position: 'relative',
                marginBottom: '4px',
            }}
        >
            {/* Color accent bar on the left for instant status recognition */}
            <div style={{
                position: 'absolute',
                left: 0,
                top: '8px',
                bottom: '8px',
                width: '3px',
                borderRadius: '0 3px 3px 0',
                background: statusColor,
                opacity: isSelected ? 1 : 0.5,
                transition: 'opacity 0.2s',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: isCompact ? '8px' : '10px', paddingLeft: '6px' }}>
                {/* Checkbox for batch mode */}
                {showCheckbox && (
                    <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => { e.stopPropagation(); onCheck?.(); }}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)', cursor: 'pointer', flexShrink: 0 }}
                    />
                )}

                {/* Avatar with Outlier Indicator - conditionally rendered */}
                {showAvatars && (
                    <div style={{
                        width: isCompact ? '38px' : '42px',
                        height: isCompact ? '38px' : '42px',
                        borderRadius: '12px',
                        background: `linear-gradient(135deg, ${statusColor}25 0%, ${statusColor}10 100%)`,
                        border: `1.5px solid ${statusColor}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: statusColor,
                        fontWeight: 700,
                        fontSize: isCompact ? '12px' : '13px',
                        letterSpacing: '0.5px',
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
                                    background: outlier.type === 'exceptional' ? 'var(--color-success)'
                                        : outlier.type === 'plagiarism' ? 'var(--color-danger)'
                                            : 'var(--color-warning)',
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
                                    background: outlier.type === 'exceptional' ? 'var(--color-success)'
                                        : outlier.type === 'plagiarism' ? 'var(--color-danger)'
                                            : 'var(--color-warning)',
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
                                background: 'var(--color-warning)',
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
                    {/* Row 1: Student name + status badge + outlier */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                        <span style={{
                            fontSize: isCompact ? '12.5px' : '13.5px',
                            fontWeight: 650,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '140px',
                        }}>
                            {submission.student_name}
                        </span>
                        <span style={{
                            fontSize: '9px',
                            fontWeight: 600,
                            color: statusColor,
                            background: `${statusColor}10`,
                            padding: '3px 8px 3px 6px',
                            borderRadius: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                        }}>
                            {/* Status-specific SVG icon */}
                            {submission.status === 'graded' ? (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : submission.status === 'resubmitted' ? (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="23 4 23 10 17 10" />
                                    <polyline points="1 20 1 14 7 14" />
                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                </svg>
                            ) : submission.status === 'late' ? (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            ) : (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                            )}
                            {getStatusLabel(submission.status)}
                        </span>
                        {/* Outlier Badge */}
                        {outlier && (
                            <span
                                title={outlier.reason}
                                style={{
                                    fontSize: '9px',
                                    fontWeight: 600,
                                    color: outlier.type === 'exceptional' ? 'var(--color-success)'
                                        : outlier.type === 'plagiarism' ? 'var(--color-danger)'
                                            : 'var(--color-warning)',
                                    background: outlier.type === 'exceptional' ? 'rgba(16, 185, 129, 0.1)'
                                        : outlier.type === 'plagiarism' ? 'rgba(239, 68, 68, 0.1)'
                                            : 'rgba(245, 158, 11, 0.1)',
                                    padding: '2px 6px',
                                    borderRadius: '5px',
                                    display: 'inline-flex',
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
                                color: 'var(--color-danger)',
                                background: 'rgba(239, 68, 68, 0.1)',
                                padding: '2px 6px',
                                borderRadius: '5px',
                            }}>
                                {submission.similarity_score}% Similar
                            </span>
                        )}
                    </div>

                    {/* Row 2: Section, date, task title, attachments — as smooth mini badges */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexWrap: 'wrap',
                        marginTop: '1px',
                    }}>
                        {/* Section badge */}
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '10px',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            background: 'var(--bg-surface-alt)',
                            padding: '2px 7px 2px 5px',
                            borderRadius: '5px',
                        }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            {submission.section}
                        </span>

                        {/* Date badge */}
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '10px',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            background: 'var(--bg-surface-alt)',
                            padding: '2px 7px 2px 5px',
                            borderRadius: '5px',
                        }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            {formatDate(submission.submitted_at)}
                        </span>

                        {/* Task title badge */}
                        {task && (
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '10px',
                                fontWeight: 500,
                                color: 'var(--accent-primary)',
                                background: 'var(--accent-bg)',
                                padding: '2px 7px 2px 5px',
                                borderRadius: '5px',
                                maxWidth: '130px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                                {task.title}
                            </span>
                        )}

                        {/* Attachment badge */}
                        {submission.attachments.length > 0 && (
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '10px',
                                fontWeight: 600,
                                color: 'var(--color-purple)',
                                background: 'rgba(139, 92, 246, 0.07)',
                                padding: '2px 7px 2px 5px',
                                borderRadius: '5px',
                            }}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round">
                                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                </svg>
                                {submission.attachments.length}
                            </span>
                        )}
                    </div>

                    {/* Row 3: Score with mini progress bar for graded submissions */}
                    {submission.status === 'graded' && scorePercent !== null && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '5px',
                        }}>
                            <div style={{
                                flex: 1,
                                height: '4px',
                                borderRadius: '4px',
                                background: 'rgba(0,0,0,0.06)', // neutral track — intentional
                                overflow: 'hidden',
                                maxWidth: '80px',
                            }}>
                                <div style={{
                                    width: `${scorePercent}%`,
                                    height: '100%',
                                    borderRadius: '4px',
                                    background: getScoreColor(scorePercent),
                                    transition: 'width 0.4s ease',
                                }} />
                            </div>
                            <span style={{
                                fontSize: '11.5px',
                                fontWeight: 700,
                                color: getScoreColor(scorePercent),
                                letterSpacing: '-0.2px',
                            }}>
                                {submission.score}/{maxPoints}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Flag button — slides up from the top-right corner on hover */}
            <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(e) => { e.stopPropagation(); onFlag(); }}
                aria-label={submission.is_flagged ? 'Remove flag from submission' : 'Flag submission for review'}
                aria-pressed={submission.is_flagged}
                className={`submission-flag-slide submission-flag-${submission.id.replace(/[^a-zA-Z0-9]/g, '')}`}
                style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '10px',
                    width: '24px',
                    height: '28px',
                    borderRadius: '0 0 6px 6px',
                    border: 'none',
                    background: submission.is_flagged
                        ? 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)'
                        : 'linear-gradient(180deg, var(--bg-surface-alt) 0%, var(--border-subtle) 100%)',
                    color: submission.is_flagged ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingTop: '4px',
                    opacity: submission.is_flagged ? 1 : 0,
                    transform: submission.is_flagged ? 'translateY(0)' : 'translateY(-20px)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 2,
                    boxShadow: submission.is_flagged
                        ? '0 3px 8px rgba(245, 158, 11, 0.35)'
                        : '0 2px 6px rgba(0,0,0,0.08)',
                }}
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill={submission.is_flagged ? '#fff' : 'none'} stroke={submission.is_flagged ? '#fff' : 'var(--text-muted)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
            </motion.button>

            <style>{`
                .submission-card-wrapper:hover .submission-flag-slide {
                    opacity: 1 !important;
                    transform: translateY(0) !important;
                }
            `}</style>
        </MotionWrapper>
    );
};


// File Preview Modal Component — Full-screen portal modal

export { getTaskTypeIcon };

/**
 * Custom equality check — prevents re-renders when parent state changes
 * (search query, filter, sort) don't affect this specific card's data.
 */
const areSubmissionCardPropsEqual = (
    prev: React.ComponentProps<typeof SubmissionCard>,
    next: React.ComponentProps<typeof SubmissionCard>
) => {
    return (
        prev.isSelected === next.isSelected &&
        prev.isChecked === next.isChecked &&
        prev.showCheckbox === next.showCheckbox &&
        prev.index === next.index &&
        prev.showAvatars === next.showAvatars &&
        prev.shouldAnimate === next.shouldAnimate &&
        prev.isCompact === next.isCompact &&
        prev.submission.id === next.submission.id &&
        prev.submission.status === next.submission.status &&
        prev.submission.score === next.submission.score &&
        prev.submission.is_flagged === next.submission.is_flagged &&
        prev.submission.similarity_score === next.submission.similarity_score &&
        prev.task?.id === next.task?.id
    );
};

export default memo(SubmissionCard, areSubmissionCardPropsEqual);
