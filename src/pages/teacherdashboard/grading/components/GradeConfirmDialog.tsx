import { motion, AnimatePresence } from 'motion/react';
import type { Task, Submission } from '../';

interface GradeConfirmDialogProps {
    show: boolean;
    pendingGrade: { score: number; feedback: string } | null;
    submission: Submission;
    task: Task | undefined;
    gradingSettings?: { latePenalty: boolean; latePenaltyPercent: number };
    onConfirm: () => void;
    onCancel: () => void;
}

const GradeConfirmDialog: React.FC<GradeConfirmDialogProps> = ({
    show, pendingGrade, submission, task, gradingSettings, onConfirm, onCancel,
}) => (
    <AnimatePresence>
        {show && pendingGrade && (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center z-[100] backdrop-blur-sm"
                style={{ background: 'rgba(15,23,42,0.6)' }}
                onClick={onCancel}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                    onClick={e => e.stopPropagation()}
                    className="w-[340px] rounded-2xl overflow-hidden"
                    style={{ background: 'var(--bg-surface)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 p-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                            style={{ background: 'var(--accent-bg)', color: 'var(--accent-primary)' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-[15px] font-semibold m-0" style={{ color: 'var(--text-primary)' }}>Confirm Grade Submission</h3>
                            <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--text-secondary)' }}>Review before finalizing</p>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-5">
                        {/* Grade summary card */}
                        <div className="rounded-[10px] p-3.5 mb-4" style={{ background: 'var(--accent-bg)', border: '1px solid var(--ring-focus)' }}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Student</span>
                                <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{submission.student_name}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Score</span>
                                <span className="text-base font-bold" style={{ color: 'var(--color-success)' }}>{pendingGrade.score}/{task?.points || 100}</span>
                            </div>
                            {submission.is_late && gradingSettings?.latePenalty && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md mt-2"
                                    style={{ background: 'var(--color-warning-bg)' }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-warning)', flexShrink: 0 }}>
                                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    <span className="text-[11px] font-medium" style={{ color: 'var(--color-warning)' }}>
                                        Late penalty ({gradingSettings.latePenaltyPercent}%) applied
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Feedback preview */}
                        {pendingGrade.feedback && (
                            <div className="mb-4">
                                <div className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>Feedback</div>
                                <div className="text-xs leading-relaxed max-h-20 overflow-auto p-2.5 rounded-lg"
                                    style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-alt)' }}>
                                    {pendingGrade.feedback}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2.5">
                            <motion.button
                                whileHover={{ background: 'var(--bg-surface-alt)' }} whileTap={{ scale: 0.98 }}
                                onClick={onCancel}
                                className="flex-1 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer"
                                style={{ border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)' }}>
                                Cancel
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(16,185,129,0.25)' }} whileTap={{ scale: 0.98 }}
                                onClick={onConfirm}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-medium cursor-pointer"
                                style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                Confirm
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

export default GradeConfirmDialog;
