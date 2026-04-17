import { motion } from 'motion/react';
import { getStatusColor, getSimilarityColor } from '../';
import type { Task, Submission } from '../';
import { getTaskTypeIcon } from './';
import { useResponsive } from '../../hooks';

interface GradingPanelHeaderProps {
    submission: Submission;
    task: Task | undefined;
    currentIndex: number;
    totalCount: number;
    onFlag: () => void;
}

const GradingPanelHeader: React.FC<GradingPanelHeaderProps> = ({
    submission, task, currentIndex, totalCount, onFlag,
}) => {
    const { isMobile } = useResponsive();
    const statusColor = getStatusColor(submission.status);

    return (
        <div
            style={{
                padding: isMobile ? '10px 12px' : '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
            }}
        >
            {/* Top row: student info + flag/counter */}
            <div className="flex items-center justify-between" style={{ marginBottom: isMobile ? '6px' : '10px' }}>

                {/* Student avatar + name */}
                <div className="flex items-center" style={{ gap: isMobile ? '10px' : '12px' }}>
                    <motion.div
                        whileHover={!isMobile ? { scale: 1.05, rotate: -2, boxShadow: `0 8px 16px ${statusColor}25` } : undefined}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="flex items-center justify-center font-bold shrink-0 cursor-default"
                        style={{
                            width: isMobile ? '36px' : '44px',
                            height: isMobile ? '36px' : '44px',
                            borderRadius: isMobile ? '10px' : '12px',
                            background: `linear-gradient(135deg, ${statusColor}15 0%, ${statusColor}05 100%)`,
                            border: `1px solid ${statusColor}25`,
                            color: statusColor,
                            fontSize: isMobile ? '13px' : '16px',
                            letterSpacing: '0.5px',
                        }}
                    >
                        {submission.student_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </motion.div>

                    <div>
                        {/* Name + flagged badge */}
                        <div className="flex items-center flex-wrap gap-2 mb-1">
                            <motion.h3
                                whileHover={{ x: 2, color: 'var(--accent-primary)' }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                className="m-0 font-bold cursor-default"
                                style={{ fontSize: isMobile ? '14px' : '16px', color: 'var(--text-primary)', letterSpacing: '-0.2px' }}
                            >
                                {submission.student_name}
                            </motion.h3>
                            {submission.is_flagged && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.05, boxShadow: '0 2px 8px rgba(245,158,11,0.2)' }}
                                    className="flex items-center gap-1 px-2 py-px rounded-md font-semibold cursor-default"
                                    style={{
                                        fontSize: isMobile ? '9px' : '11px',
                                        color: 'var(--color-warning)',
                                        background: 'var(--color-warning-bg)',
                                        border: '1px solid rgba(245,158,11,0.15)',
                                    }}
                                >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                    </svg>
                                    Flagged
                                </motion.span>
                            )}
                        </div>

                        {/* ID + section badges */}
                        <div className="flex items-center gap-2" style={{ fontSize: isMobile ? '11px' : '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {[
                                {
                                    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" ry="2" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="12" y2="14" /></svg>,
                                    label: submission.student_id,
                                },
                                {
                                    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>,
                                    label: submission.section,
                                },
                            ].map(({ icon, label }) => (
                                <motion.div
                                    key={label}
                                    whileHover={{ scale: 1.05, color: 'var(--accent-primary)', background: 'var(--accent-bg)', boxShadow: '0 2px 8px rgba(59,130,246,0.1)' }}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-default transition-all"
                                    style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-subtle)' }}
                                >
                                    {icon}{label}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Flag button + counter */}
                <div className="flex items-stretch" style={{ gap: isMobile ? '6px' : '10px' }}>
                    <motion.button
                        whileHover={!isMobile ? { scale: 1.05, boxShadow: submission.is_flagged ? '0 4px 12px rgba(245,158,11,0.15)' : '0 4px 12px rgba(0,0,0,0.05)' } : undefined}
                        whileTap={{ scale: 0.95 }}
                        onClick={onFlag}
                        title={submission.is_flagged ? 'Remove flag' : 'Flag for review'}
                        aria-label={submission.is_flagged ? 'Remove flag from submission' : 'Flag submission for review'}
                        aria-pressed={submission.is_flagged}
                        className="flex items-center justify-center cursor-pointer transition-all"
                        style={{
                            width: isMobile ? '32px' : '38px',
                            height: isMobile ? '32px' : '38px',
                            borderRadius: isMobile ? '8px' : '10px',
                            border: submission.is_flagged ? '1px solid rgba(245,158,11,0.25)' : '1px solid var(--border-subtle)',
                            background: submission.is_flagged ? 'var(--color-warning-bg)' : 'var(--bg-surface-alt)',
                            color: submission.is_flagged ? 'var(--color-warning)' : 'var(--text-muted)',
                        }}
                    >
                        <svg width={isMobile ? '14' : '16'} height={isMobile ? '14' : '16'} viewBox="0 0 24 24" fill={submission.is_flagged ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                            <line x1="4" y1="22" x2="4" y2="15" />
                        </svg>
                    </motion.button>

                    <motion.div
                        whileHover={!isMobile ? { scale: 1.05, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } : undefined}
                        className="flex items-center justify-center font-semibold cursor-default transition-all"
                        style={{
                            fontSize: isMobile ? '12px' : '14px',
                            color: 'var(--accent-primary)',
                            background: 'var(--accent-bg)',
                            padding: isMobile ? '0 12px' : '0 16px',
                            borderRadius: isMobile ? '8px' : '10px',
                            border: '1px solid var(--border-subtle)',
                        }}
                    >
                        {currentIndex + 1}/{totalCount}
                    </motion.div>
                </div>
            </div>

            {/* Task info bar */}
            {task && (
                <motion.div
                    whileHover={{ scale: 1.01, boxShadow: '0 4px 12px rgba(59,130,246,0.08)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="flex items-center cursor-default"
                    style={{
                        gap: isMobile ? '8px' : '12px',
                        padding: isMobile ? '8px 12px' : '10px 16px',
                        background: 'var(--accent-bg)',
                        borderRadius: isMobile ? '8px' : '10px',
                        border: '1px solid var(--border-subtle)',
                        marginTop: '2px',
                    }}
                >
                    <div className="flex items-center shrink-0" style={{ color: 'var(--accent-primary)' }}>
                        {getTaskTypeIcon(task.type)}
                    </div>
                    <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-medium" style={{ fontSize: isMobile ? '12px' : '14px', color: 'var(--accent-primary)', letterSpacing: '-0.1px' }}>
                        {task.title}
                    </span>
                    <span className="shrink-0 font-medium" style={{ fontSize: isMobile ? '11px' : '13px', color: 'var(--text-secondary)' }}>
                        {task.points} pts
                    </span>
                </motion.div>
            )}

            {/* Similarity warning */}
            {submission.similarity_score && submission.similarity_score > 15 && (
                <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg mt-2"
                    style={{
                        background: `${getSimilarityColor(submission.similarity_score)}10`,
                        border: `1px solid ${getSimilarityColor(submission.similarity_score)}20`,
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={getSimilarityColor(submission.similarity_score)} strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span className="text-xs font-medium" style={{ color: getSimilarityColor(submission.similarity_score) }}>
                        {submission.similarity_score}% similarity detected — Review for potential plagiarism
                    </span>
                </div>
            )}
        </div>
    );
};

export default GradingPanelHeader;
