import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const ACCENT_COLOR = '#3b82f6';

export interface AtRiskStudent {
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
    currentGrade: number;
    absences: number;
    issue: string;
    trend: 'declining' | 'stable' | 'improving';
}

interface AtRiskStudentCardProps {
    student: AtRiskStudent;
    index: number;
    onViewDetails: (student: AtRiskStudent) => void;
    onSendEmail: (student: AtRiskStudent) => void;
    showAvatars: boolean;
    shouldAnimate: boolean;
    isCompact: boolean;
}

const getGradeColor = (grade: number) =>
    grade < 70 ? 'var(--color-danger)' : grade < 75 ? 'var(--color-warning)' : 'var(--color-success)';

const TrendIcon: React.FC<{ trend: string }> = ({ trend }) => {
    if (trend === 'declining') return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
        </svg>
    );
    if (trend === 'improving') return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
        </svg>
    );
    return null;
};

const AtRiskStudentCard: React.FC<AtRiskStudentCardProps> = ({
    student, index, onViewDetails, onSendEmail, showAvatars, shouldAnimate, isCompact,
}) => {
    const [isHovered, setIsHovered] = useState(false);
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
            className="rounded-xl cursor-pointer"
            style={{
                background: 'var(--bg-surface)',
                border: `1px solid ${isHovered ? 'rgba(59,130,246,0.2)' : 'var(--border-subtle)'}`,
                padding: isCompact ? '8px' : '10px',
                transition: shouldAnimate ? 'border-color 0.2s ease' : 'none',
            }}
            onClick={() => onViewDetails(student)}
        >
            <div className="flex items-center" style={{ gap: isCompact ? '8px' : '10px' }}>
                {showAvatars && (
                    <div className="rounded-full flex items-center justify-center font-semibold shrink-0 overflow-hidden"
                        style={{
                            width: isCompact ? '40px' : '48px',
                            height: isCompact ? '40px' : '48px',
                            background: `linear-gradient(135deg, ${ACCENT_COLOR}20 0%, ${ACCENT_COLOR}10 100%)`,
                            color: ACCENT_COLOR,
                            fontSize: isCompact ? '11px' : '13px',
                        }}>
                        {student.profile_image
                            ? <img src={student.profile_image} alt={student.full_name} className="w-full h-full object-cover" />
                            : initials}
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate" style={{ fontSize: isCompact ? '10px' : '11px', color: 'var(--text-primary)' }}>
                        {student.full_name}
                    </div>
                    <div className="flex items-center gap-1" style={{ fontSize: isCompact ? '9px' : '10px', color: 'var(--text-secondary)' }}>
                        <span>{student.section}</span>
                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                        <span>{student.student_id}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1" style={{ fontSize: '9px', color: 'var(--color-danger)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        {student.issue}
                    </div>
                </div>

                <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 justify-end font-bold"
                        style={{ fontSize: isCompact ? '13px' : '14px', color: getGradeColor(student.currentGrade) }}>
                        {student.currentGrade}%
                        <TrendIcon trend={student.trend} />
                    </div>
                    <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{student.absences} absences</div>
                    {shouldAnimate && (
                        <AnimatePresence>
                            {isHovered && (
                                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                    className="flex gap-1.5 mt-2 justify-end">
                                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                                        onClick={(e) => { e.stopPropagation(); onSendEmail(student); }}
                                        aria-label={`Send email to ${student.full_name}`}
                                        className="w-7 h-7 rounded-md border-none flex items-center justify-center cursor-pointer"
                                        style={{ background: 'var(--accent-bg)', color: ACCENT_COLOR }}>
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

export default memo(AtRiskStudentCard);
