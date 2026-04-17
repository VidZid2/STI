/**
 * AIGradeResultCard — full-screen overlay showing AI grading result.
 * Extracted from GradingPanel to reduce its inline style count.
 */
import { motion, AnimatePresence } from 'motion/react';
import type { AIGradingResult } from '../../../../lib/grading';
import type { Task } from '../types';
import { useResponsive } from '../../hooks';

interface AIGradeResultCardProps {
    result: AIGradingResult | null;
    task: Task | undefined;
    onAccept: () => void;
    onDismiss: () => void;
}

const AIGradeResultCard: React.FC<AIGradeResultCardProps> = ({ result, task, onAccept, onDismiss }) => {
    const { isMobile } = useResponsive();

    return (
        <AnimatePresence>
            {result && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 flex items-center justify-center z-[999998] p-5 backdrop-blur-sm"
                    style={{ background: 'rgba(15,23,42,0.6)' }}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
                        className="w-full max-w-[520px] rounded-[20px] overflow-hidden p-6 relative"
                        style={{ background: 'var(--bg-surface)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                    >
                        {/* Close */}
                        <motion.button
                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={onDismiss}
                            aria-label="Dismiss AI suggestion"
                            className="absolute top-4 right-4 w-8 h-8 rounded-lg border-none flex items-center justify-center cursor-pointer"
                            style={{ background: 'transparent', color: 'var(--text-muted)' }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </motion.button>

                        {result.success ? (
                            <>
                                {/* Header: icon + score */}
                                <div className="flex items-center gap-4 mb-5 pr-10">
                                    <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0"
                                        style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary) 100%)', boxShadow: '0 6px 16px rgba(59,130,246,0.35)' }}>
                                        <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                                            <defs><radialGradient id="gm1" cx="78%" cy="55%" r="78%"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#f59e0b" /></radialGradient></defs>
                                            <g transform="translate(28,28) scale(0.78)"><path fill="url(#gm1)" d="m122.062 172.77l-10.27 23.52c-3.947 9.042-16.459 9.042-20.406 0l-10.27-23.52c-9.14-20.933-25.59-37.595-46.108-46.703L6.74 113.52c-8.987-3.99-8.987-17.064 0-21.053l27.385-12.156C55.172 70.97 71.917 53.69 80.9 32.043L91.303 6.977c3.86-9.303 16.712-9.303 20.573 0l10.403 25.066c8.983 21.646 25.728 38.926 46.775 48.268l27.384 12.156c8.987 3.99 8.987 17.063 0 21.053l-28.267 12.547c-20.52 9.108-36.97 25.77-46.109 46.703" /></g>
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[11px] font-bold uppercase tracking-[0.8px]" style={{ color: 'var(--accent-primary)' }}>AI Suggestion</span>
                                            <span className="px-2 py-px rounded-[10px] text-[10px] font-bold"
                                                style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)', border: '1px solid rgba(245,158,11,0.3)', color: '#b45309' }}>
                                                {result.confidence}% confident
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="font-extrabold leading-none tracking-[-1px]"
                                                style={{ fontSize: isMobile ? '26px' : '32px', color: 'var(--text-primary)' }}>
                                                {result.suggestedScore}
                                            </span>
                                            <span className="font-medium" style={{ fontSize: isMobile ? '16px' : '18px', color: 'var(--text-muted)' }}>
                                                / {task?.points || 100}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Reasoning */}
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                                    className="mb-3 rounded-xl overflow-hidden"
                                    style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas)' }}>
                                    <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--accent-bg)' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2a8 8 0 0 0-8 8c0 3.5 2 5.5 3 7h10c1-1.5 3-3.5 3-7a8 8 0 0 0-8-8z" /><path d="M9 22h6" /><path d="M10 18h4" />
                                        </svg>
                                        <span className="text-[11px] font-bold uppercase tracking-[0.5px]" style={{ color: 'var(--accent-primary)' }}>Reasoning</span>
                                    </div>
                                    <div className="px-4 py-3.5 text-sm leading-[1.7]" style={{ color: 'var(--text-primary)' }}>{result.reasoning}</div>
                                </motion.div>

                                {/* Feedback preview */}
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                                    className="mb-3 rounded-xl overflow-hidden"
                                    style={{ border: '1px solid rgba(245,158,11,0.15)', background: 'var(--color-warning-bg)' }}>
                                    <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(245,158,11,0.1)', background: 'rgba(245,158,11,0.04)' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        </svg>
                                        <span className="text-[11px] font-bold uppercase tracking-[0.5px]" style={{ color: '#b45309' }}>Feedback Preview</span>
                                    </div>
                                    <div className="px-4 py-3.5 text-[13px] leading-[1.7] italic" style={{ color: 'var(--text-secondary)' }}>
                                        &ldquo;{result.feedback}&rdquo;
                                    </div>
                                </motion.div>

                                {/* Actions */}
                                <div className="flex gap-2.5 justify-end">
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onDismiss}
                                        className="px-4 py-2 rounded-[10px] text-[13px] font-semibold cursor-pointer"
                                        style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                                        Cancel
                                    </motion.button>
                                    <motion.button whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(59,130,246,0.4)' }} whileTap={{ scale: 0.98 }} onClick={onAccept}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold cursor-pointer text-white"
                                        style={{ background: 'var(--accent-primary)', border: '1px solid var(--accent-primary)' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        Apply
                                    </motion.button>
                                </div>
                            </>
                        ) : (
                            /* Error state */
                            <div className="flex flex-col items-center text-center py-5">
                                <div className="p-4 rounded-full mb-4" style={{ background: 'var(--color-danger-bg)' }}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                </div>
                                <h3 className="m-0 mb-2 text-lg" style={{ color: 'var(--text-primary)' }}>Analysis Failed</h3>
                                <span className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                                    {result.error || 'The AI was unable to analyze this submission.'}
                                </span>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onDismiss}
                                    className="px-6 py-2.5 rounded-lg border-none text-sm font-semibold cursor-pointer text-white"
                                    style={{ background: 'var(--color-danger)' }}>
                                    Close
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AIGradeResultCard;
