/**
 * StatsBar Component
 * Phase 2B: Extracted from GradeSubmissionsModal
 * 
 * Professional stats bar showing grading progress and grade distribution.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GRADE_COLORS, GRADE_LABELS, GRADING_COLORS } from '../constants';
import type { Submission, Task } from '../types';

export interface StatsBarProps {
    submissions: Submission[];
    tasks: Task[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ submissions, tasks }) => {
    const [hoveredGrade, setHoveredGrade] = useState<string | null>(null);

    const stats = useMemo(() => {
        const graded = submissions.filter((s) => s.status === 'graded');
        const pending = submissions.filter((s) => s.status !== 'graded');
        const late = submissions.filter((s) => s.status === 'late');
        const scores = graded.map((s) => s.score || 0);
        const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const highest = scores.length > 0 ? Math.max(...scores) : 0;
        const lowest = scores.length > 0 ? Math.min(...scores) : 0;

        // Grade distribution
        const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        graded.forEach((s) => {
            const task = tasks.find((t) => t.id === s.task_id);
            const percent = ((s.score || 0) / (task?.points || 100)) * 100;
            if (percent >= 90) distribution.A++;
            else if (percent >= 80) distribution.B++;
            else if (percent >= 70) distribution.C++;
            else if (percent >= 60) distribution.D++;
            else distribution.F++;
        });

        return {
            graded: graded.length,
            pending: pending.length,
            late: late.length,
            avg,
            highest,
            lowest,
            distribution,
            total: submissions.length,
        };
    }, [submissions, tasks]);

    const progressPercent = stats.total > 0 ? (stats.graded / stats.total) * 100 : 0;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '14px 16px',
                background: GRADING_COLORS.surface,
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
        >
            {/* Top Row - Progress & Key Stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Grading Progress */}
                <div style={{ flex: 1 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '6px',
                        }}
                    >
                        <span style={{ fontSize: '11px', fontWeight: 600, color: GRADING_COLORS.textSecondary }}>
                            Grading Progress
                        </span>
                        <span
                            style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                color: progressPercent === 100 ? GRADING_COLORS.success : GRADING_COLORS.primary,
                            }}
                        >
                            {stats.graded} of {stats.total} graded
                        </span>
                    </div>
                    <div
                        style={{
                            height: '8px',
                            background: 'rgba(0,0,0,0.04)',
                            borderRadius: '4px',
                            overflow: 'hidden',
                        }}
                    >
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                                height: '100%',
                                background: progressPercent === 100 ? GRADING_COLORS.success : GRADING_COLORS.primary,
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
                        <div style={{ fontSize: '18px', fontWeight: 700, color: GRADING_COLORS.textPrimary, lineHeight: 1 }}>
                            {stats.avg.toFixed(1)}
                        </div>
                        <div style={{ fontSize: '10px', color: GRADING_COLORS.textSecondary, marginTop: '2px' }}>AVG</div>
                    </div>
                    {/* Highest */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: GRADING_COLORS.success, lineHeight: 1 }}>
                            {stats.highest}
                        </div>
                        <div style={{ fontSize: '10px', color: GRADING_COLORS.textSecondary, marginTop: '2px' }}>HIGH</div>
                    </div>
                    {/* Lowest */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: GRADING_COLORS.danger, lineHeight: 1 }}>
                            {stats.lowest}
                        </div>
                        <div style={{ fontSize: '10px', color: GRADING_COLORS.textSecondary, marginTop: '2px' }}>LOW</div>
                    </div>
                </div>
            </div>

            {/* Bottom Row - Grade Distribution */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%)',
                    borderRadius: '8px',
                }}
            >
                {/* Distribution Label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '80px' }}>
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={GRADING_COLORS.textSecondary}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: GRADING_COLORS.textSecondary }}>
                        Distribution
                    </span>
                </div>

                {/* Grade Bars */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '6px', height: '28px' }}>
                    {Object.entries(stats.distribution).map(([grade, count]) => {
                        const maxCount = Math.max(...Object.values(stats.distribution), 1);
                        const height = stats.graded > 0 ? (count / maxCount) * 18 + 4 : 4;
                        const isHovered = hoveredGrade === grade;
                        const gradeColor = GRADE_COLORS[grade];

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
                                                background: GRADING_COLORS.surface,
                                                borderRadius: '6px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                                border: `1px solid ${gradeColor}30`,
                                                whiteSpace: 'nowrap',
                                                zIndex: 10,
                                            }}
                                        >
                                            <div style={{ fontSize: '11px', fontWeight: 600, color: gradeColor }}>
                                                {count} student{count !== 1 ? 's' : ''}
                                            </div>
                                            <div style={{ fontSize: '9px', color: GRADING_COLORS.textMuted }}>
                                                {GRADE_LABELS[grade]}
                                            </div>
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
                                        background:
                                            count > 0
                                                ? `linear-gradient(180deg, ${gradeColor} 0%, ${gradeColor}cc 100%)`
                                                : 'rgba(0,0,0,0.06)',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        boxShadow: count > 0 && isHovered ? `0 2px 8px ${gradeColor}40` : 'none',
                                    }}
                                />
                                {/* Grade Label */}
                                <span
                                    style={{
                                        fontSize: '9px',
                                        fontWeight: 600,
                                        color: isHovered ? gradeColor : GRADING_COLORS.textMuted,
                                        transition: 'color 0.15s ease',
                                        lineHeight: 1,
                                    }}
                                >
                                    {grade}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Status Counts */}
                <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
                    {stats.pending > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: GRADING_COLORS.primaryLight,
                            }}
                        >
                            <div
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: GRADING_COLORS.primary,
                                }}
                            />
                            <span style={{ fontSize: '10px', fontWeight: 600, color: GRADING_COLORS.primary }}>
                                {stats.pending} pending
                            </span>
                        </div>
                    )}
                    {stats.late > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: GRADING_COLORS.dangerLight,
                            }}
                        >
                            <div
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: GRADING_COLORS.danger,
                                }}
                            />
                            <span style={{ fontSize: '10px', fontWeight: 600, color: GRADING_COLORS.danger }}>
                                {stats.late} late
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatsBar;
