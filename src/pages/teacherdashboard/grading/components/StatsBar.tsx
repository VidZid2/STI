/**
 * StatsBar Component
 * Phase 2B: Extracted from GradeSubmissionsModal
 * Migrated: inline styles → Tailwind + CSS variables
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GRADE_COLORS, GRADE_LABELS } from '../constants';
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
        return { graded: graded.length, pending: pending.length, late: late.length, avg, highest, lowest, distribution, total: submissions.length };
    }, [submissions, tasks]);

    const progressPercent = stats.total > 0 ? (stats.graded / stats.total) * 100 : 0;
    const progressColor = progressPercent === 100 ? 'var(--color-success)' : 'var(--accent-primary)';

    return (
        <div className="flex flex-col gap-3 px-4 py-3.5 rounded-xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>

            {/* Top row: progress + stats */}
            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Grading Progress</span>
                        <span className="text-xs font-bold" style={{ color: progressColor }}>{stats.graded} of {stats.total} graded</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.04)' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full" style={{ background: progressColor }} />
                    </div>
                </div>
                <div className="w-px h-9" style={{ background: 'var(--border-subtle)' }} />
                <div className="flex gap-4">
                    {[
                        { label: 'AVG', value: stats.avg.toFixed(1), color: 'var(--text-primary)', size: 'text-[18px]' },
                        { label: 'HIGH', value: stats.highest, color: 'var(--color-success)', size: 'text-sm' },
                        { label: 'LOW', value: stats.lowest, color: 'var(--color-danger)', size: 'text-sm' },
                    ].map(({ label, value, color, size }) => (
                        <div key={label} className="text-center">
                            <div className={`${size} font-bold leading-none`} style={{ color }}>{value}</div>
                            <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom row: grade distribution */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
                style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.03) 0%, rgba(139,92,246,0.03) 100%)' }}>
                <div className="flex items-center gap-1.5 min-w-[80px]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
                        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Distribution</span>
                </div>

                {/* Grade bars */}
                <div className="flex-1 flex items-end gap-1.5 h-7">
                    {Object.entries(stats.distribution).map(([grade, count]) => {
                        const maxCount = Math.max(...Object.values(stats.distribution), 1);
                        const height = stats.graded > 0 ? (count / maxCount) * 18 + 4 : 4;
                        const isHov = hoveredGrade === grade;
                        const gradeColor = GRADE_COLORS[grade];
                        return (
                            <div key={grade} className="flex flex-col items-center gap-0.5 flex-1 relative justify-end h-full"
                                onMouseEnter={() => setHoveredGrade(grade)} onMouseLeave={() => setHoveredGrade(null)}>
                                <AnimatePresence>
                                    {isHov && (
                                        <motion.div initial={{ opacity: 0, y: 4, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 2, scale: 0.95 }}
                                            className="absolute bottom-full mb-1 px-2 py-1 rounded-md whitespace-nowrap z-10"
                                            style={{ background: 'var(--bg-surface)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', border: `1px solid ${gradeColor}30` }}>
                                            <div className="text-[11px] font-semibold" style={{ color: gradeColor }}>{count} student{count !== 1 ? 's' : ''}</div>
                                            <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{GRADE_LABELS[grade]}</div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <motion.div initial={{ height: 4 }} animate={{ height, scale: isHov ? 1.1 : 1 }} transition={{ duration: 0.3 }}
                                    className="w-full max-w-[28px] rounded-[4px] cursor-pointer"
                                    style={{
                                        background: count > 0 ? `linear-gradient(180deg, ${gradeColor} 0%, ${gradeColor}cc 100%)` : 'rgba(0,0,0,0.06)',
                                        boxShadow: count > 0 && isHov ? `0 2px 8px ${gradeColor}40` : 'none',
                                    }} />
                                <span className="text-[9px] font-semibold leading-none transition-colors"
                                    style={{ color: isHov ? gradeColor : 'var(--text-muted)' }}>{grade}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Status counts */}
                <div className="flex gap-2 ml-2">
                    {stats.pending > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md" style={{ background: 'var(--accent-bg)' }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-primary)' }} />
                            <span className="text-[10px] font-semibold" style={{ color: 'var(--accent-primary)' }}>{stats.pending} pending</span>
                        </div>
                    )}
                    {stats.late > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md" style={{ background: 'var(--color-danger-bg)' }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-danger)' }} />
                            <span className="text-[10px] font-semibold" style={{ color: 'var(--color-danger)' }}>{stats.late} late</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatsBar;
