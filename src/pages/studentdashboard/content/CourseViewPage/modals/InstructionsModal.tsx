/**
 * InstructionsModal
 * Extracted from CourseViewPage.tsx during Phase 1.1
 * Shows task instructions, description, assignment rules, and rubric criteria.
 */
import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface InstructionsModalProps {
    task: {
        title: string;
        description?: string;
        instructions?: string;
        allowLateSubmission?: boolean;
        latePenalty?: number;
        maxAttempts?: number;
        rubricEnabled?: boolean;
        rubricCriteria?: { id?: string; name: string; points: number; description?: string }[];
        submissionCount?: number;
        [key: string]: any;
    } | null;
    onClose: () => void;
}

const InstructionsModal: React.FC<InstructionsModalProps> = ({ task, onClose }) => {
    return (
        <AnimatePresence>
            {task && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: "spring", duration: 0.4 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="px-8 py-6 flex items-start justify-between bg-white relative border-b border-zinc-200/80">
                            <div className="pr-8">
                                <h3 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1.5">
                                    {task.title}
                                </h3>
                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Task Instructions & Details</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="absolute right-6 top-6 p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-all"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="px-8 pb-8 pt-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                            <div className="space-y-6">
                                {task.description && (
                                    <div className="border border-zinc-200/80 rounded-2xl p-6 bg-zinc-50/30">
                                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="12" y1="16" x2="12" y2="12" />
                                                <line x1="12" y1="8" x2="12.01" y2="8" />
                                            </svg>
                                            Description
                                        </h4>
                                        <div className="text-[15px] text-zinc-700 leading-relaxed whitespace-pre-wrap font-normal">
                                            {task.description}
                                        </div>
                                    </div>
                                )}

                                {task.instructions ? (
                                    <div className="border border-zinc-200/80 rounded-2xl p-6 bg-zinc-50/30">
                                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                            </svg>
                                            Detailed Instructions
                                        </h4>
                                        <div
                                            className="text-[15px] text-zinc-700 leading-relaxed whitespace-pre-wrap prose prose-zinc prose-sm max-w-none font-normal"
                                            dangerouslySetInnerHTML={{ __html: task.instructions }}
                                        />
                                    </div>
                                ) : (
                                    !task.description && (
                                        <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                <line x1="9" y1="3" x2="9" y2="21" />
                                            </svg>
                                            <p className="text-[15px] font-medium">No additional details provided.</p>
                                        </div>
                                    )
                                )}

                                {/* Assignment Rules */}
                                {(task.allowLateSubmission !== undefined ||
                                    (task.maxAttempts ?? 0) > 1 ||
                                    task.rubricEnabled) && (
                                    <div className="border border-zinc-200/80 rounded-2xl p-6 bg-zinc-50/30">
                                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                            </svg>
                                            Assignment Rules
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {/* Late Submission Policy */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '10px 14px',
                                                borderRadius: '12px',
                                                background: task.allowLateSubmission
                                                    ? 'rgba(245, 158, 11, 0.08)'
                                                    : 'rgba(239, 68, 68, 0.06)',
                                                border: task.allowLateSubmission
                                                    ? '1px solid rgba(245, 158, 11, 0.15)'
                                                    : '1px solid rgba(239, 68, 68, 0.12)',
                                            }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                                    stroke={task.allowLateSubmission ? '#f59e0b' : '#ef4444'}
                                                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                                <div>
                                                    <div style={{
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        color: task.allowLateSubmission ? '#92400e' : '#991b1b',
                                                    }}>
                                                        {task.allowLateSubmission
                                                            ? 'Late submissions allowed'
                                                            : 'No late submissions'}
                                                    </div>
                                                    {task.allowLateSubmission && (task.latePenalty ?? 0) > 0 && (
                                                        <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px' }}>
                                                            {task.latePenalty}% penalty per day late
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Max Attempts */}
                                            {(task.maxAttempts ?? 0) > 1 && (
                                                <div style={{
                                                    padding: '10px 14px',
                                                    borderRadius: '12px',
                                                    background: 'rgba(59, 130, 246, 0.06)',
                                                    border: '1px solid rgba(59, 130, 246, 0.12)',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="1 4 1 10 7 10" />
                                                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                                        </svg>
                                                        <div>
                                                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e40af' }}>
                                                                {task.maxAttempts} attempts allowed
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '2px' }}>
                                                                {(() => {
                                                                    const used = task.submissionCount || 0;
                                                                    const max = task.maxAttempts || 1;
                                                                    const remaining = Math.max(0, max - used);
                                                                    if (used === 0) return `You have ${max} attempts remaining`;
                                                                    if (remaining === 0) return '⚠ No attempts remaining';
                                                                    return `${used} used · ${remaining} remaining`;
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Rubric Criteria Display */}
                                            {task.rubricEnabled && (
                                                <div style={{
                                                    padding: '14px',
                                                    borderRadius: '12px',
                                                    background: 'rgba(16, 185, 129, 0.06)',
                                                    border: '1px solid rgba(16, 185, 129, 0.12)',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: (task.rubricCriteria?.length ?? 0) > 0 ? '12px' : '0' }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                            <line x1="3" y1="9" x2="21" y2="9" />
                                                            <line x1="9" y1="21" x2="9" y2="9" />
                                                        </svg>
                                                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#065f46' }}>
                                                            Graded with rubric
                                                        </div>
                                                    </div>

                                                    {(task.rubricCriteria?.length ?? 0) > 0 && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {(task.rubricCriteria ?? []).map((criterion, idx) => (
                                                                <div key={criterion.id || idx} style={{
                                                                    padding: '10px 12px',
                                                                    borderRadius: '8px',
                                                                    background: 'rgba(255, 255, 255, 0.7)',
                                                                    border: '1px solid rgba(16, 185, 129, 0.1)',
                                                                }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: criterion.description ? '4px' : '0' }}>
                                                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                                                                            {criterion.name}
                                                                        </span>
                                                                        <span style={{
                                                                            fontSize: '11px',
                                                                            fontWeight: 600,
                                                                            padding: '2px 8px',
                                                                            borderRadius: '6px',
                                                                            background: 'rgba(16, 185, 129, 0.1)',
                                                                            color: '#10b981',
                                                                        }}>
                                                                            {criterion.points} pts
                                                                        </span>
                                                                    </div>
                                                                    {criterion.description && (
                                                                        <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                                                                            {criterion.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-5 flex justify-end gap-3 bg-white border-t border-zinc-100/50">
                            <motion.button
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(244, 244, 245, 1)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="px-6 py-2.5 text-sm font-semibold text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-xl transition-all"
                            >
                                Close
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InstructionsModal;
