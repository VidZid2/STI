import { motion } from 'motion/react';
import { formatDate } from '../';
import type { DraftGrade } from '../';
import { useResponsive } from '../../hooks';

interface FeedbackSectionProps {
    feedback: string;
    score: string;
    draft: DraftGrade | null;
    aiEnabled: boolean;
    aiConfigured: boolean;
    isGeneratingFeedback: boolean;
    isFeedbackOptimized: boolean;
    onFeedbackChange: (value: string) => void;
    onGenerateAIFeedback: () => void;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({
    feedback, score, draft, aiEnabled, aiConfigured,
    isGeneratingFeedback, isFeedbackOptimized,
    onFeedbackChange, onGenerateAIFeedback,
}) => {
    const { isMobile } = useResponsive();

    return (
        <div>
            {/* Label row */}
            <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="text-[11px] font-bold uppercase tracking-[0.5px]" style={{ color: 'var(--text-secondary)' }}>Feedback</span>
                    {feedback && (
                        <motion.span
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="px-1.5 py-px rounded text-[9px] font-semibold"
                            style={{ background: 'var(--bg-surface-alt)', color: 'var(--text-muted)' }}
                        >
                            {feedback.length} chars
                        </motion.span>
                    )}
                </div>

                {/* AI Feedback button */}
                {aiEnabled && aiConfigured && score && (
                    <motion.button
                        whileHover={!isFeedbackOptimized ? { scale: 1.04, boxShadow: '0 3px 10px rgba(59,130,246,0.15)' } : {}}
                        whileTap={!isFeedbackOptimized ? { scale: 0.96 } : {}}
                        onClick={!isFeedbackOptimized ? onGenerateAIFeedback : undefined}
                        disabled={isGeneratingFeedback || isFeedbackOptimized}
                        className="flex items-center gap-[5px] px-3 py-[5px] rounded-lg text-[11px] font-semibold transition-all"
                        style={{
                            border: isFeedbackOptimized ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--ring-focus)',
                            background: isGeneratingFeedback ? 'var(--accent-bg)' : isFeedbackOptimized ? 'var(--color-success-bg)' : 'var(--bg-surface)',
                            color: isFeedbackOptimized ? 'var(--color-success)' : 'var(--accent-primary)',
                            cursor: isGeneratingFeedback ? 'wait' : isFeedbackOptimized ? 'default' : 'pointer',
                            boxShadow: isFeedbackOptimized ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
                        }}
                    >
                        {isGeneratingFeedback ? (
                            <>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-3 h-3 flex items-center justify-center"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </svg>
                                </motion.div>
                                Generating...
                            </>
                        ) : isFeedbackOptimized ? (
                            <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Optimized
                            </>
                        ) : (
                            <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" fill="currentColor" opacity="0.7" />
                                </svg>
                                AI Feedback
                            </>
                        )}
                    </motion.button>
                )}
            </div>

            {/* Textarea */}
            <div className="relative">
                <textarea
                    value={feedback}
                    onChange={e => onFeedbackChange(e.target.value)}
                    placeholder="Write constructive feedback for the student..."
                    className="w-full min-h-[100px] px-4 py-3.5 text-[13px] rounded-xl outline-none resize-y font-[inherit] leading-[1.7] box-border transition-all"
                    style={{
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-canvas)',
                    }}
                    onFocus={e => {
                        e.target.style.borderColor = 'var(--accent-primary)';
                        e.target.style.boxShadow = '0 0 0 3px var(--ring-focus)';
                        e.target.style.background = 'var(--bg-surface)';
                    }}
                    onBlur={e => {
                        e.target.style.borderColor = 'var(--border-subtle)';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = 'var(--bg-canvas)';
                    }}
                />
            </div>

            {/* Auto-save indicator */}
            {draft?.lastSaved && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-[5px] mt-1.5"
                >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="font-medium" style={{ fontSize: isMobile ? '9px' : '10px', color: 'var(--text-muted)' }}>
                        Auto-saved {formatDate(draft.lastSaved.toISOString())}
                    </span>
                    <motion.div
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-1 h-1 rounded-full"
                        style={{ background: 'var(--color-success)' }}
                    />
                </motion.div>
            )}
        </div>
    );
};

export default FeedbackSection;
