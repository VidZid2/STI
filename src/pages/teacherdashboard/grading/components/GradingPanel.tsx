import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    gradeSubmission,
    generateFeedback,
    isAIGradingConfigured,
    extractSubmissionContent,
    type AIGradingResult
} from '../../../../lib/grading';
import {
    QUICK_SCORES,
    getAIFeedbackSuggestion,
} from '../';
import type { Task, Submission, DraftGrade } from '../';
import { useResponsive } from '../../hooks';
import {
    GradeHistoryPanel,
    GradingPanelHeader,
    AIReGradeWarningModal,
    AIGradeResultCard,
    RubricSection,
    FeedbackSection,
    GradeConfirmDialog,
    GradingFooter,
} from './';

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
    aiEnabled?: boolean;
}> = ({
    submission, task, onGrade, onNext, onPrevious, onFlag,
    hasNext, hasPrevious, currentIndex, totalCount,
    draft, onDraftChange, onPreviewFile, gradingSettings, aiEnabled = true,
}) => {
    const { isMobile } = useResponsive();
    const [score, setScore] = useState<string>(draft?.score?.toString() || submission.score?.toString() || '');
    const [feedback, setFeedback] = useState(draft?.feedback || submission.feedback || '');
    const [showRubric, setShowRubric] = useState(false);
    const [rubricScores, setRubricScores] = useState<Record<string, number>>(draft?.rubricScores || {});
    const [aiSuggestion, setAiSuggestion] = useState('');
    const scoreInputRef = useRef<HTMLInputElement>(null);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingGrade, setPendingGrade] = useState<{ score: number; feedback: string } | null>(null);

    const [isAIGrading, setIsAIGrading] = useState(false);
    const [showAIAccidentalWarning, setShowAIAccidentalWarning] = useState(false);
    const [aiGradingResult, setAiGradingResult] = useState<AIGradingResult | null>(null);
    const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
    const [dismissedAISuggestion, setDismissedAISuggestion] = useState(false);

    const aiConfigured = aiEnabled && isAIGradingConfigured();
    const isTaskAIGradable = task && ['journal', 'performance', 'practical'].includes(task.type);

    const calculateFinalScore = useCallback((rawScore: number): number => {
        if (!gradingSettings?.latePenalty || !submission.is_late) return rawScore;
        const penaltyPercent = gradingSettings.latePenaltyPercent || 10;
        return Math.max(0, rawScore - Math.round(rawScore * (penaltyPercent / 100)));
    }, [gradingSettings?.latePenalty, gradingSettings?.latePenaltyPercent, submission.is_late]);

    useEffect(() => {
        setScore(draft?.score?.toString() || submission.score?.toString() || '');
        setFeedback(draft?.feedback || submission.feedback || '');
        setRubricScores(draft?.rubricScores || {});
        setAiGradingResult(null);
        setDismissedAISuggestion(false);
    }, [submission.id, draft]);

    useEffect(() => {
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => {
            if (score || feedback || Object.keys(rubricScores).length > 0) {
                onDraftChange({ score, feedback, rubricScores, lastSaved: new Date() });
            }
        }, 1000);
        return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
    }, [score, feedback, rubricScores, onDraftChange]);

    const rubricTotal = useMemo(() => Object.values(rubricScores).reduce((sum, val) => sum + val, 0), [rubricScores]);

    useEffect(() => {
        if (showRubric && Object.keys(rubricScores).length > 0) setScore(rubricTotal.toString());
    }, [rubricTotal, showRubric, rubricScores]);

    useEffect(() => {
        if (score && task && isTaskAIGradable && aiEnabled) {
            setAiSuggestion(getAIFeedbackSuggestion(parseInt(score) || 0, task.points));
        }
    }, [score, task, isTaskAIGradable, aiEnabled]);

    const handleSaveAndNext = () => {
        const finalScore = calculateFinalScore(parseInt(score) || 0);
        if (gradingSettings?.confirmSubmit) {
            setPendingGrade({ score: finalScore, feedback });
            setShowConfirmDialog(true);
        } else {
            onGrade(finalScore, feedback);
            if (hasNext) onNext();
        }
    };

    const handleConfirmGrade = () => {
        if (pendingGrade) {
            onGrade(pendingGrade.score, pendingGrade.feedback);
            setShowConfirmDialog(false);
            setPendingGrade(null);
            if (hasNext) onNext();
        }
    };

    const handleCancelConfirm = () => { setShowConfirmDialog(false); setPendingGrade(null); };
    const handleQuickScore = (value: number) => { setScore(value.toString()); scoreInputRef.current?.focus(); };
    const handleApplyAISuggestion = () => setFeedback(prev => prev ? `${prev}\n\n${aiSuggestion}` : aiSuggestion);

    const handleAIGrade = async (force: boolean | React.MouseEvent = false) => {
        if (!task || isAIGrading || !isTaskAIGradable || !aiEnabled) return;
        const isForced = force === true;
        if (!isForced && (submission.status === 'graded' || (submission.status as string) === 'ai-checked' || score !== '')) {
            setShowAIAccidentalWarning(true);
            return;
        }
        setShowAIAccidentalWarning(false);
        setIsAIGrading(true);
        setAiGradingResult(null);
        try {
            const submissionContent = extractSubmissionContent({
                textContent: submission.text_content,
                attachments: submission.attachments.map(a => ({ name: a.name, type: a.type, url: a.url, textContent: a.textContent })),
            });
            const result = await gradeSubmission({
                submissionContent,
                taskTitle: task.title,
                taskDescription: task.description || 'Complete the assigned task.',
                maxPoints: task.points,
                studentName: submission.student_name,
                attachments: submission.attachments.map(a => ({ name: a.name, type: a.type, url: a.url })),
            });
            setAiGradingResult(result);
        } catch {
            setAiGradingResult({ success: false, suggestedScore: 0, confidence: 0, reasoning: '', feedback: '', error: 'Failed to analyze submission' });
        } finally {
            setIsAIGrading(false);
        }
    };

    const handleAcceptAISuggestion = () => {
        if (!aiGradingResult?.success) return;
        setScore(aiGradingResult.suggestedScore.toString());
        setFeedback(aiGradingResult.feedback);
        setAiGradingResult(null);
    };

    const handleDismissAISuggestion = () => { setAiGradingResult(null); setDismissedAISuggestion(true); };

    const handleGenerateAIFeedback = async () => {
        if (!task || isGeneratingFeedback || !score || !aiEnabled) return;
        setIsGeneratingFeedback(true);
        try {
            const submissionContent = submission.attachments.length > 0
                ? `Submitted files: ${submission.attachments.map(a => a.name).join(', ')}`
                : 'No files submitted';
            const result = await generateFeedback(submissionContent, parseInt(score) || 0, task.points, task.title);
            if (result.success && result.feedback) setFeedback(prev => prev ? `${prev}\n\n${result.feedback}` : result.feedback);
        } catch { /* ignore */ } finally {
            setIsGeneratingFeedback(false);
        }
    };

    const scoreNum = parseInt(score) || 0;
    const maxPoints = task?.points || 100;
    const scorePercent = (scoreNum / maxPoints) * 100;
    const scoreColor = scorePercent >= 75 ? 'var(--color-success)' : scorePercent >= 60 ? 'var(--color-warning)' : 'var(--color-danger)';
    const isFeedbackOptimized = Boolean(feedback && feedback.trim().length > 50);

    return (
        <div className="flex flex-col h-full">

            {/* Header */}
            <GradingPanelHeader
                submission={submission}
                task={task}
                currentIndex={currentIndex}
                totalCount={totalCount}
                onFlag={onFlag}
            />

            {/* AI Re-grade warning */}
            <AIReGradeWarningModal
                show={showAIAccidentalWarning}
                onConfirm={() => handleAIGrade(true)}
                onCancel={() => setShowAIAccidentalWarning(false)}
            />

            {/* AI Grade result overlay â€” extracted component */}
            <AIGradeResultCard
                result={aiGradingResult}
                task={task}
                onAccept={handleAcceptAISuggestion}
                onDismiss={handleDismissAISuggestion}
            />

            {/* Scrollable content */}
            <div className="flex-1 overflow-auto" style={{ padding: isMobile ? '10px 12px' : '16px 20px' }}>

                {/* Grade history */}
                {submission.grade_history && submission.grade_history.length > 0 && (
                    <GradeHistoryPanel history={submission.grade_history} maxPoints={maxPoints} />
                )}

                {/* Attachments */}
                {submission.attachments.length > 0 && (
                    <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
                        <div className="font-semibold uppercase tracking-[0.5px]"
                            style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-secondary)', marginBottom: isMobile ? '8px' : '10px' }}>
                            SUBMITTED FILES
                        </div>
                        <div className="flex flex-col" style={{ gap: isMobile ? '6px' : '8px' }}>
                            {submission.attachments.map((file, idx) => (
                                <motion.button
                                    key={idx}
                                    whileHover={!isMobile ? { scale: 1.01, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } : undefined}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    onClick={() => onPreviewFile(file)}
                                    className="flex items-center w-full text-left transition-all"
                                    style={{
                                        gap: isMobile ? '10px' : '12px',
                                        padding: isMobile ? '10px 12px' : '12px 16px',
                                        borderRadius: isMobile ? '8px' : '10px',
                                        background: 'var(--bg-surface)',
                                        border: '1px solid var(--border-subtle)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div className="flex items-center" style={{ color: 'var(--color-danger)' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                                        </svg>
                                    </div>
                                    <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-medium"
                                        style={{ fontSize: isMobile ? '13px' : '14px', color: 'var(--text-primary)' }}>
                                        {file.name}
                                    </span>
                                    <div className="flex items-center" style={{ color: 'var(--text-secondary)' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                        </svg>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Score section */}
                <div style={{ marginBottom: isMobile ? '12px' : '16px' }}>
                    {/* Score header row */}
                    <div className="flex items-center justify-between flex-wrap" style={{ marginBottom: isMobile ? '10px' : '12px', gap: '8px' }}>
                        <div className="flex items-center flex-wrap" style={{ gap: isMobile ? '8px' : '12px' }}>
                            <div className="font-semibold uppercase tracking-[0.5px]"
                                style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-secondary)' }}>
                                SCORE
                            </div>
                            {aiEnabled && aiConfigured && isTaskAIGradable && !aiGradingResult && !dismissedAISuggestion && (
                                <motion.button
                                    whileHover={!isMobile ? { scale: 1.05, boxShadow: '0 4px 12px rgba(59,130,246,0.3)' } : undefined}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleAIGrade}
                                    disabled={isAIGrading}
                                    className="flex items-center gap-1.5 rounded-lg border-none font-semibold text-white"
                                    style={{
                                        padding: isMobile ? '4px 10px' : '6px 12px',
                                        fontSize: isMobile ? '11px' : '12px',
                                        background: isAIGrading ? 'var(--accent-bg)' : 'var(--accent-primary)',
                                        cursor: isAIGrading ? 'wait' : 'pointer',
                                    }}
                                >
                                    {isAIGrading ? (
                                        <>
                                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-3 h-3 flex">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                                            </motion.div>
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                                                <defs><radialGradient id="gg1" cx="78%" cy="55%" r="78%"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#f59e0b" /></radialGradient></defs>
                                                <g transform="translate(28,28) scale(0.78)"><path fill="url(#gg1)" d="m122.062 172.77l-10.27 23.52c-3.947 9.042-16.459 9.042-20.406 0l-10.27-23.52c-9.14-20.933-25.59-37.595-46.108-46.703L6.74 113.52c-8.987-3.99-8.987-17.064 0-21.053l27.385-12.156C55.172 70.97 71.917 53.69 80.9 32.043L91.303 6.977c3.86-9.303 16.712-9.303 20.573 0l10.403 25.066c8.983 21.646 25.728 38.926 46.775 48.268l27.384 12.156c8.987 3.99 8.987 17.063 0 21.053l-28.267 12.547c-20.52 9.108-36.97 25.77-46.109 46.703" /></g>
                                            </svg>
                                            AI Grade
                                        </>
                                    )}
                                </motion.button>
                            )}
                        </div>
                        <motion.button
                            whileHover={!isMobile ? { scale: 1.05, background: 'var(--color-purple-bg)' } : undefined}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowRubric(!showRubric)}
                            className="flex items-center gap-1.5 rounded-lg font-semibold cursor-pointer"
                            style={{
                                padding: isMobile ? '4px 10px' : '6px 12px',
                                border: '1px solid rgba(139,92,246,0.3)',
                                background: showRubric ? 'var(--color-purple-bg)' : 'var(--bg-surface)',
                                color: 'var(--color-purple)',
                                fontSize: isMobile ? '11px' : '12px',
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
                            </svg>
                            Rubric
                        </motion.button>
                    </div>

                    {/* Rubric */}
                    <RubricSection
                        show={showRubric}
                        rubric={task?.rubric}
                        rubricScores={rubricScores}
                        rubricTotal={rubricTotal}
                        onScoreChange={(id, value) => setRubricScores(prev => ({ ...prev, [id]: value }))}
                    />

                    {/* Score input */}
                    <div className="flex items-stretch gap-2 mb-3">
                        <motion.div whileTap={{ scale: 0.99 }} className="relative flex-1 flex">
                            <input
                                ref={scoreInputRef}
                                type="number" min="0" max={maxPoints} value={score}
                                onChange={e => setScore(e.target.value)}
                                placeholder="0"
                                aria-label={`Score out of ${maxPoints}`}
                                className="w-full rounded-xl outline-none transition-all font-bold leading-none"
                                style={{
                                    padding: isMobile ? '12px 64px 12px 16px' : '16px 72px 16px 20px',
                                    fontSize: isMobile ? '20px' : '24px',
                                    color: score ? scoreColor : 'var(--text-muted)',
                                    border: `1px solid ${score ? `${scoreColor}50` : 'var(--border-subtle)'}`,
                                    background: 'var(--bg-surface)',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                                }}
                            />
                            <div className="absolute right-4 inset-y-0 flex items-center">
                                <span className="font-semibold" style={{ fontSize: isMobile ? '13px' : '15px', color: 'var(--text-muted)' }}>/{maxPoints}</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Quick scores */}
                    <div className="flex gap-1.5 flex-wrap mb-3">
                        {QUICK_SCORES.map(pct => (
                            <motion.button
                                key={pct}
                                whileHover={!isMobile ? { scale: 1.05 } : undefined}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleQuickScore(Math.round((pct / 100) * maxPoints))}
                                aria-label={`Set score to ${pct}% (${Math.round((pct / 100) * maxPoints)} out of ${maxPoints})`}
                                className="rounded-md font-medium cursor-pointer transition-all"
                                style={{
                                    padding: isMobile ? '4px 8px' : '5px 10px',
                                    border: '1px solid var(--border-subtle)',
                                    background: 'var(--bg-surface)',
                                    color: 'var(--text-secondary)',
                                    fontSize: isMobile ? '11px' : '12px',
                                }}
                            >
                                {pct}%
                            </motion.button>
                        ))}
                    </div>

                    {/* Late penalty */}
                    {submission.is_late && gradingSettings?.latePenalty && score && (
                        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg mb-3"
                            style={{ background: 'var(--color-warning-bg)', border: '1px solid rgba(245,158,11,0.15)' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span className="text-xs font-medium" style={{ color: 'var(--color-warning)' }}>
                                Late penalty: {gradingSettings.latePenaltyPercent}% â€” Final: {calculateFinalScore(parseInt(score) || 0)}/{maxPoints}
                            </span>
                        </div>
                    )}

                    {/* AI suggestion inline card */}
                    <AnimatePresence>
                        {aiSuggestion && score && isTaskAIGradable && !dismissedAISuggestion && !aiGradingResult && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                className="flex items-start justify-between gap-3 px-3.5 py-3 rounded-[10px] mb-3"
                                style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-subtle)' }}
                            >
                                <div className="flex-1">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.5px] mb-1" style={{ color: 'var(--accent-primary)' }}>AI Suggestion</div>
                                    <div className="text-[13px] leading-[1.5]" style={{ color: 'var(--text-secondary)' }}>{aiSuggestion}</div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={handleApplyAISuggestion}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                                    style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--accent-primary)' }}
                                >
                                    Apply
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Feedback */}
                <FeedbackSection
                    feedback={feedback}
                    score={score}
                    draft={draft}
                    aiEnabled={aiEnabled}
                    aiConfigured={aiConfigured}
                    isGeneratingFeedback={isGeneratingFeedback}
                    isFeedbackOptimized={isFeedbackOptimized}
                    onFeedbackChange={setFeedback}
                    onGenerateAIFeedback={handleGenerateAIFeedback}
                />
            </div>

            {/* Footer */}
            <GradingFooter
                hasNext={hasNext}
                hasPrevious={hasPrevious}
                onNext={onNext}
                onPrevious={onPrevious}
                onSaveAndNext={handleSaveAndNext}
            />

            {/* Confirm dialog */}
            <GradeConfirmDialog
                show={showConfirmDialog}
                pendingGrade={pendingGrade}
                submission={submission}
                task={task}
                gradingSettings={gradingSettings}
                onConfirm={handleConfirmGrade}
                onCancel={handleCancelConfirm}
            />
        </div>
    );
};

export default GradingPanel;
