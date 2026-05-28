/**
 * Paraphraser Component
 * Powered by Groq AI (Llama 3.1) for fast, high-quality paraphrasing
 * Free tier: 30 req/min, 14,400 req/day per account
 * 
 * Premium UI - Matches Grammar Checker glassmorphism design
 * 70/30 split layout with Tailwind CSS
 */

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { FileText, Save, Sparkles, AlertCircle, BookOpen, CheckCircle, Info } from "lucide-react";
import { paraphraseWithGroq, getParaphraseStats, isGroqConfigured, type ParaphraseMode } from "../../lib/paraphrase/groqService";
import { formatToolSessionTime, useToolSession } from "./useToolSession";
import { ToolHeaderBadge, ToolHeaderLiveBadge } from "./ToolHeaderBadges";
import ToolMobileSheet from "./ToolMobileSheet";

interface ParaphraserProps {
    onBack: () => void;
}

interface ParaphraseStats {
    originalWords: number;
    paraphrasedWords: number;
    wordChange: number;
    wordChangePercent: number;
    similarity: number;
    uniqueness: number;
}

interface ParaphraserSession {
    inputText: string;
    outputText: string;
    mode: ParaphraseMode;
    stats: ParaphraseStats | null;
}

const EMPTY_PARAPHRASER_SESSION: ParaphraserSession = {
    inputText: '',
    outputText: '',
    mode: 'standard',
    stats: null,
};

const shouldPersistParaphraserSession = (session: ParaphraserSession) =>
    Boolean(session.inputText.trim() || session.outputText.trim());

const Paraphraser: React.FC<ParaphraserProps> = ({ onBack }) => {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [mode, setMode] = useState<ParaphraseMode>('standard');
    const [copied, setCopied] = useState(false);
    const [downloaded, setDownloaded] = useState(false);
    const [restoredAt, setRestoredAt] = useState<string | null>(null);
    const [stats, setStats] = useState<ParaphraseStats | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showDiff, setShowDiff] = useState(false);
    const [linkedReferenceId, setLinkedReferenceId] = useState<string>('');

    const savedReferences = useMemo(() => {
        try {
            const rawRefs = localStorage.getItem('references');
            return rawRefs ? JSON.parse(rawRefs) : [];
        } catch {
            return [];
        }
    }, []);

    const aiProbability = useMemo(() => {
        if (!outputText) return 0;
        
        const words = outputText.toLowerCase().split(/\s+/);
        const complexIndicators = ['furthermore', 'moreover', 'delve', 'tapestry', 'testament', 'leverage', 'synergy', 'comprehensive', 'catalyst', 'realm'];
        let complexCount = 0;
        words.forEach(w => {
            const clean = w.replace(/[^a-z]/g, '');
            if (complexIndicators.includes(clean)) {
                complexCount++;
            }
        });

        const sentences = outputText.split(/[.!?]+/).filter(Boolean);
        const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
        
        let variance = 0;
        if (sentences.length > 1) {
            const avg = sentenceLengths.reduce((a, b) => a + b, 0) / sentences.length;
            const sumSq = sentenceLengths.reduce((a, b) => a + Math.pow(b - avg, 2), 0);
            variance = sumSq / (sentences.length - 1);
        }

        let baseScore = 35;
        
        if (variance > 0) {
            if (variance < 15) baseScore += 25;
            else if (variance < 40) baseScore += 10;
            else baseScore -= 15;
        }
        
        baseScore += complexCount * 12;

        if (mode === 'fluency' || mode === 'standard') baseScore += 15;
        if (mode === 'creative') baseScore -= 10;

        return Math.min(94, Math.max(15, baseScore));
    }, [outputText, mode]);
    const currentSession = useMemo<ParaphraserSession>(() => ({
        inputText,
        outputText,
        mode,
        stats,
    }), [inputText, mode, outputText, stats]);
    const {
        initialData,
        initialUpdatedAt,
        hasSavedSession,
        lastSavedAt,
        sessionHistory,
        clearSavedSession,
        clearSessionHistory,
        saveImmediately,
        saveSnapshot,
    } = useToolSession('paraphraser', currentSession, {
        emptySession: EMPTY_PARAPHRASER_SESSION,
        shouldPersist: shouldPersistParaphraserSession,
    });

    // Page loading effect
    useEffect(() => {
        const timer = setTimeout(() => setIsPageLoading(false), 400);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!shouldPersistParaphraserSession(initialData)) return;

        setInputText(initialData.inputText);
        setOutputText(initialData.outputText);
        setMode(initialData.mode);
        setStats(initialData.stats);
        setRestoredAt(initialUpdatedAt);
    }, [initialData, initialUpdatedAt]);

    const modes: { id: ParaphraseMode; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
        { id: 'standard', label: 'Standard', desc: 'Balanced rewrite', color: 'emerald', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
        { id: 'fluency', label: 'Fluency', desc: 'Natural flow', color: 'blue', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
        { id: 'formal', label: 'Formal', desc: 'Professional tone', color: 'violet', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
        { id: 'creative', label: 'Creative', desc: 'Unique style', color: 'amber', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
        { id: 'shorter', label: 'Shorter', desc: 'Concise version', color: 'rose', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12H3M21 6H3M21 18H9"/></svg> },
        { id: 'expand', label: 'Expand', desc: 'More detailed', color: 'cyan', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12H3M21 6H3M21 18H3"/></svg> },
    ];

    const getModeColor = (modeId: string) => {
        const modeColors: Record<string, { bg: string; text: string; border: string; ring: string }> = {
            standard: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/50', ring: 'ring-emerald-500' },
            fluency: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800/50', ring: 'ring-blue-500' },
            formal: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800/50', ring: 'ring-violet-500' },
            creative: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/50', ring: 'ring-amber-500' },
            shorter: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800/50', ring: 'ring-rose-500' },
            expand: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800/50', ring: 'ring-cyan-500' },
        };
        return modeColors[modeId] || modeColors.standard;
    };

    const handleParaphrase = async () => {
        if (!inputText.trim()) return;
        setIsLoading(true);
        setOutputText('');
        setStats(null);
        setError(null);

        const result = await paraphraseWithGroq(inputText, mode);
        
        if (result.success) {
            const nextStats = getParaphraseStats(inputText, result.text);
            setOutputText(result.text);
            setStats(nextStats);
            saveSnapshot({
                inputText,
                outputText: result.text,
                mode,
                stats: nextStats,
            });
        } else {
            setError(result.error || 'Failed to paraphrase');
            setOutputText('');
        }
        setIsLoading(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(outputText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!outputText) return;

        const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `paraphrase-${mode}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 2000);
    };

    const handleClear = () => {
        setInputText('');
        setOutputText('');
        setStats(null);
        setError(null);
        setRestoredAt(null);
        setLinkedReferenceId('');
        setShowDiff(false);
    };

    const restoreSession = (session: ParaphraserSession, updatedAt: string | null) => {
        setInputText(session.inputText);
        setOutputText(session.outputText);
        setMode(session.mode);
        setStats(session.stats);
        setError(null);
        setRestoredAt(updatedAt);
        setLinkedReferenceId('');
        setShowDiff(false);
    };

    const handleRestoreSaved = () => {
        restoreSession(initialData, initialUpdatedAt);
        saveImmediately(initialData);
    };

    const handleRestoreSnapshot = (session: ParaphraserSession, updatedAt: string) => {
        restoreSession(session, updatedAt);
        saveImmediately(session);
    };

    const handleClearSaved = () => {
        clearSavedSession();
        setRestoredAt(null);
    };

    const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
    const currentModeColors = getModeColor(mode);
    const changeInsight = stats
        ? stats.wordChange === 0
            ? 'Length preserved while changing wording.'
            : stats.wordChange > 0
                ? `Expanded by ${stats.wordChange} words.`
                : `Condensed by ${Math.abs(stats.wordChange)} words.`
        : 'Run a paraphrase to compare tone, length, and originality.';
    const resultSummary = outputText
        ? `${stats?.paraphrasedWords ?? outputText.trim().split(/\s+/).filter(Boolean).length} words • ${mode} mode`
        : 'Rewrite result, stats, and history';

    // Loading Skeleton
    if (isPageLoading) {
        return (
            <div className="w-full max-w-[1400px] mx-auto p-6 animate-pulse">
                <div className="flex flex-col lg:flex-row gap-6 mb-6">
                    <div className="flex-1 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-[24px]"></div>
                    <div className="w-64 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-[24px]"></div>
                </div>
                <div className="h-16 bg-zinc-200 dark:bg-zinc-800 rounded-[20px] mb-6"></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-[400px] bg-zinc-200 dark:bg-zinc-800 rounded-[24px]"></div>
                    <div className="h-[400px] bg-zinc-200 dark:bg-zinc-800 rounded-[24px]"></div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[1400px] mx-auto h-auto min-h-[calc(100vh-6rem)] flex flex-col"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-5 px-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm relative overflow-hidden group">
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />
                
                {/* Title Area */}
                <motion.div
                    className="flex items-center gap-4 relative z-10"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                    <motion.div
                        className="flex items-center justify-center w-12 h-12 rounded-[16px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50"
                        whileHover={{ scale: 1.05, rotate: -5 }}
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                        </svg>
                    </motion.div>
                    
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Paraphraser</h1>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                            <ToolHeaderBadge icon={Sparkles} label="AI" tone="violet" />
                            <ToolHeaderBadge icon={FileText} label="Modes" tone="emerald" />
                            <ToolHeaderLiveBadge label={isGroqConfigured() ? 'System Online' : 'Setup Needed'} isOnline={isGroqConfigured()} />
                            <ToolHeaderBadge
                                icon={Save}
                                label={lastSavedAt ? `Saved ${formatToolSessionTime(lastSavedAt)}` : 'Auto-save ready'}
                                tone="blue"
                                hideOnSmall
                            />
                        </div>
                        {restoredAt && (
                            <p className="mt-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                Restored your last paraphrase from {formatToolSessionTime(restoredAt)}.
                            </p>
                        )}
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-wrap items-center gap-2 w-full sm:w-auto relative z-10"
                >
                    <motion.button
                        onClick={onBack}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-zinc-700 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Back
                    </motion.button>

                    <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2 hidden sm:block"></div>

                    <LayoutGroup>
                        {hasSavedSession && (
                            <motion.button
                                layout
                                onClick={handleRestoreSaved}
                                className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                Restore
                            </motion.button>
                        )}

                        <motion.button
                            layout
                            onClick={handleClear}
                            disabled={!inputText}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            </svg>
                            Clear
                        </motion.button>

                        <motion.button
                            layout
                            onClick={handleParaphrase}
                            disabled={!inputText.trim() || isLoading}
                            className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            whileHover={{ y: -1, boxShadow: '0 8px 20px rgba(16, 185, 129, 0.35)' }}
                            whileTap={{ scale: 0.97 }}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                                    </svg>
                                    Paraphrase
                                </>
                            )}
                        </motion.button>
                    </LayoutGroup>
                </motion.div>
            </div>

            <motion.div
                className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
            >
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-800/50 dark:bg-emerald-900/20">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Integrity guardrail</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">Paraphrased work still needs citations when the idea came from a source.</p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-800/50 dark:bg-blue-900/20">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Meaning check</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">{changeInsight}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Session safety</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                        {hasSavedSession ? 'Your current draft is recoverable after refresh.' : 'Start typing and this tool will auto-save locally.'}
                    </p>
                    {hasSavedSession && (
                        <button
                            onClick={handleClearSaved}
                            className="mt-2 text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400"
                        >
                            Clear saved draft
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Mode Selector */}
            <motion.div 
                className="mb-6"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="flex items-center gap-2 mb-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Paraphrase Mode</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {modes.map((m) => {
                        const colors = getModeColor(m.id);
                        const isActive = mode === m.id;
                        return (
                            <motion.button
                                key={m.id}
                                onClick={() => setMode(m.id)}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                                    isActive 
                                        ? `${colors.bg} ${colors.text} ${colors.border} ring-1 ${colors.ring}` 
                                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                                }`}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span className={isActive ? colors.text : 'text-zinc-400'}>{m.icon}</span>
                                <span className="text-xs font-bold">{m.label}</span>
                                <span className="text-[10px] opacity-70 hidden sm:block">{m.desc}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Main Content - Dual Pane */}
            <div className="grid grid-cols-1 gap-6 pb-28 lg:grid-cols-[minmax(0,1fr)_420px] lg:pb-0 flex-1">
                {/* Input Card */}
                <motion.div
                    className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm overflow-hidden min-h-[400px]"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Original Text</span>
                        <span className="ml-auto text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">
                            {wordCount} words
                        </span>
                    </div>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="flex-1 w-full p-6 lg:p-8 font-sans text-[15px] leading-[1.8] whitespace-pre-wrap break-words bg-transparent border-none resize-none text-zinc-800 dark:text-zinc-200 focus:ring-0 focus:outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 [scrollbar-width:thin]"
                        placeholder="Enter or paste your text here to paraphrase..."
                        spellCheck={false}
                    />
                </motion.div>

                <ToolMobileSheet
                    title="Rewrite Result"
                    summary={resultSummary}
                    actionLabel="Open rewrite panel"
                    className="w-full flex flex-col gap-4"
                >
                <motion.div
                    className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm overflow-hidden min-h-[400px]"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                        <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${currentModeColors.bg} ${currentModeColors.text}`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                            {mode.charAt(0).toUpperCase() + mode.slice(1)} Rewrite
                        </span>
                        <AnimatePresence>
                            {outputText && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="ml-auto flex items-center gap-2"
                                >
                                    <button
                                        onClick={() => setShowDiff(!showDiff)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                            showDiff
                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                        }`}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                                        </svg>
                                        {showDiff ? 'Final Text' : 'Changes'}
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                            downloaded
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                                                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                        }`}
                                    >
                                        {downloaded ? 'Downloaded!' : 'Download .txt'}
                                    </button>
                                    <button
                                        onClick={handleCopy}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                            copied
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                        }`}
                                    >
                                        {copied ? (
                                            <>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"/>
                                                </svg>
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                                </svg>
                                                Copy
                                            </>
                                        )}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex-1 relative">
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.div
                                    key="loading"
                                    className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div className="relative w-12 h-12">
                                        <div className="absolute inset-0 rounded-full border-4 border-zinc-100 dark:border-zinc-800"></div>
                                        <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin"></div>
                                    </div>
                                    <p className="text-sm font-medium text-zinc-400">Paraphrasing your text...</p>
                                </motion.div>
                            ) : error ? (
                                <motion.div
                                    key="error"
                                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl flex items-center justify-center">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                                        </svg>
                                    </div>
                                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                                    {!isGroqConfigured() && (
                                        <a 
                                            href="https://console.groq.com/keys" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="mt-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-bold rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                        >
                                            Configure API key
                                        </a>
                                    )}
                                </motion.div>
                            ) : outputText ? (
                                <motion.div
                                    key="output"
                                    className="absolute inset-0 p-6 lg:p-8 overflow-y-auto [scrollbar-width:thin]"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    {showDiff ? (
                                        <p className="text-[15px] leading-[1.8] text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                                            {diffWords(inputText, outputText).map((part, index) => {
                                                if (part.added) {
                                                    return (
                                                        <span key={index} className="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-0.5 rounded transition-all duration-300 font-medium">
                                                            {part.value}
                                                        </span>
                                                    );
                                                }
                                                if (part.removed) {
                                                    return (
                                                        <span key={index} className="bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 line-through px-0.5 rounded transition-all duration-300 opacity-60">
                                                            {part.value}
                                                        </span>
                                                    );
                                                }
                                                return <span key={index}>{part.value}</span>;
                                            })}
                                        </p>
                                    ) : (
                                        <p className="text-[15px] leading-[1.8] text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">{outputText}</p>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-zinc-400"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-300">
                                        <div className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40" />
                                        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
                                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                                        </svg>
                                    </div>
                                    <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">Choose a mode and rewrite responsibly</p>
                                    <p className="max-w-xs text-center text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">The result auto-saves locally and includes word-change stats so you can review before submitting.</p>
                                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                                        {['Preserve meaning', 'Cite sources', 'Review tone'].map((hint) => (
                                            <span key={hint} className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-300">
                                                {hint}
                                            </span>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Stats Bar */}
                    <AnimatePresence>
                        {stats && (
                            <motion.div
                                className="flex items-center justify-between px-6 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/>
                                        </svg>
                                        <span className="font-medium">Words:</span>
                                        <span className="font-bold text-zinc-700 dark:text-zinc-200">
                                            <NumberTicker value={stats.paraphrasedWords} />
                                        </span>
                                        <span className={`text-[10px] font-bold ${stats.wordChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            ({stats.wordChange >= 0 ? '+' : ''}{stats.wordChange})
                                        </span>
                                    </div>
                                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700"></div>
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                                        </svg>
                                        <span className="font-medium">Uniqueness:</span>
                                        <span className={`font-bold ${stats.uniqueness >= 50 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                            <NumberTicker value={stats.uniqueness} />%
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Turnitin AI Risk Detector Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-6 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />
                     
                     <div className="flex items-center gap-3 mb-4 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Sparkles width="20" height="20" />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Turnitin AI Detector Risk</h3>
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Local Perplexity & Burstiness scan</p>
                        </div>
                     </div>

                     <div className="relative z-10 flex flex-col gap-4">
                        {outputText ? (
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                                            {aiProbability}%
                                        </span>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                            aiProbability < 40 
                                                ? 'text-green-500' 
                                                : aiProbability < 70 
                                                    ? 'text-amber-500' 
                                                    : 'text-red-500'
                                        }`}>
                                            {aiProbability < 40 ? 'Low Risk' : aiProbability < 70 ? 'Moderate Risk' : 'High Risk'}
                                        </span>
                                    </div>
                                    
                                    {/* Radial Progress */}
                                    <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle
                                                cx="28"
                                                cy="28"
                                                r="22"
                                                className="stroke-zinc-100 dark:stroke-zinc-800"
                                                strokeWidth="4"
                                                fill="transparent"
                                            />
                                            <circle
                                                cx="28"
                                                cy="28"
                                                r="22"
                                                className={`transition-all duration-500 ${
                                                    aiProbability < 40 
                                                        ? 'stroke-green-500' 
                                                        : aiProbability < 70 
                                                            ? 'stroke-amber-500' 
                                                            : 'stroke-red-500'
                                                }`}
                                                strokeWidth="4"
                                                fill="transparent"
                                                strokeDasharray={2 * Math.PI * 22}
                                                strokeDashoffset={2 * Math.PI * 22 * (1 - aiProbability / 100)}
                                            />
                                        </svg>
                                        <span className="absolute text-[10px] font-black text-zinc-600 dark:text-zinc-400">
                                            Risk
                                        </span>
                                    </div>
                                </div>

                                {/* Progress Bar inside */}
                                <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            aiProbability < 40 
                                                ? 'bg-green-500' 
                                                : aiProbability < 70 
                                                    ? 'bg-amber-500' 
                                                    : 'bg-red-500'
                                        }`}
                                        style={{ width: `${aiProbability}%` }}
                                    />
                                </div>

                                <div className="flex items-start gap-2 p-3 bg-zinc-50 dark:bg-zinc-850 border border-zinc-100 dark:border-zinc-800 rounded-xl text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                                    <Info width="14" height="14" className="text-zinc-400 mt-0.5 shrink-0" />
                                    <span>
                                        {aiProbability < 40 
                                            ? 'Highly human-like perplexity. Turnitin scanners are very likely to recognize this as original drafting.' 
                                            : aiProbability < 70 
                                                ? 'Moderate AI signature detected. Turnitin filters might flag some word choices. Consider editing structurally.' 
                                                : 'Heavy AI signature. Extremely uniform sentence lengths and standard vocabularies will trigger Turnitin flags. Revise manually!'}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-zinc-400 dark:text-zinc-500 text-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2 opacity-50">
                                    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                                </svg>
                                <span className="text-xs font-bold">Risk Analyzer Idle</span>
                                <span className="text-[10px] mt-1 text-zinc-400/80">Paraphrase text to evaluate Turnitin AI probability</span>
                            </div>
                        )}
                     </div>
                </div>

                {/* Linked Reference Bibliography Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-6 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />
                     
                     <div className="flex items-center gap-3 mb-4 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <BookOpen width="20" height="20" />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Academic Attribution</h3>
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Paraphrases still require citations</p>
                        </div>
                     </div>

                     <div className="relative z-10 flex flex-col gap-3">
                        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                            Link Source Reference
                        </label>
                        <select
                            value={linkedReferenceId}
                            onChange={(e) => setLinkedReferenceId(e.target.value)}
                            className="w-full text-xs p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                            <option value="">-- No Source Linked (General Knowledge) --</option>
                            {savedReferences.map((ref: any) => (
                                <option key={ref.id} value={ref.id}>
                                    {ref.title || 'Untitled Reference'} ({ref.author || 'Unknown Author'})
                                </option>
                            ))}
                        </select>

                        {linkedReferenceId ? (
                            <div className="flex items-start gap-2.5 p-3 bg-emerald-50/70 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl">
                                <CheckCircle width="16" height="16" className="text-emerald-500 mt-0.5 shrink-0" />
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Citable Source Linked!</p>
                                    <p className="text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                                        Make sure to include an in-text citation and a reference manager entry for this paraphrased text.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-2.5 p-3 bg-amber-50/50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-xl">
                                <AlertCircle width="16" height="16" className="text-amber-500 mt-0.5 shrink-0" />
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">Unattributed Rewrite</p>
                                    <p className="text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                                        If this idea is not your own, link a reference from the Reference Manager to protect academic integrity.
                                    </p>
                                </div>
                            </div>
                        )}
                     </div>
                </div>

                {sessionHistory.length > 0 && (
                    <motion.div
                        className="rounded-[24px] border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Session history</p>
                                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">Saved rewrites</h3>
                            </div>
                            <button
                                type="button"
                                onClick={clearSessionHistory}
                                className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                            >
                                Clear
                            </button>
                        </div>

                        <div className="flex flex-col gap-2">
                            {sessionHistory.map((item) => {
                                const words = item.data.outputText.trim()
                                    ? item.data.outputText.trim().split(/\s+/).length
                                    : item.data.inputText.trim().split(/\s+/).filter(Boolean).length;

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleRestoreSnapshot(item.data, item.updatedAt)}
                                        className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50/70 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:border-emerald-800/60 dark:hover:bg-emerald-900/20"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-xs font-black capitalize text-zinc-800 dark:text-zinc-100">{item.data.mode} rewrite</span>
                                            <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500">{formatToolSessionTime(item.updatedAt)}</span>
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                                            {words} words - {item.data.outputText || item.data.inputText}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
                </ToolMobileSheet>
            </div>
        </motion.div>
    );
};

interface DiffToken {
    value: string;
    added?: boolean;
    removed?: boolean;
}

function diffWords(oldStr: string, newStr: string): DiffToken[] {
    const oldParagraphs = oldStr.split(/\n\n+/);
    const newParagraphs = newStr.split(/\n\n+/);
    const diff: DiffToken[] = [];

    for (let pIdx = 0; pIdx < Math.max(oldParagraphs.length, newParagraphs.length); pIdx++) {
        const oldPara = oldParagraphs[pIdx] || "";
        const newPara = newParagraphs[pIdx] || "";

        if (pIdx > 0) {
            diff.push({ value: "\n\n" });
        }

        const oldWords = oldPara.split(/(\s+)/);
        const newWords = newPara.split(/(\s+)/);
        
        const dp: number[][] = Array(oldWords.length + 1).fill(null).map(() => Array(newWords.length + 1).fill(0));
        
        for (let i = 1; i <= oldWords.length; i++) {
            for (let j = 1; j <= newWords.length; j++) {
                if (oldWords[i - 1] === newWords[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }
        
        const paraDiff: DiffToken[] = [];
        let i = oldWords.length;
        let j = newWords.length;
        
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
                paraDiff.unshift({ value: oldWords[i - 1] });
                i--;
                j--;
            } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                paraDiff.unshift({ value: newWords[j - 1], added: true });
                j--;
            } else {
                paraDiff.unshift({ value: oldWords[i - 1], removed: true });
                i--;
            }
        }
        diff.push(...paraDiff);
    }
    
    return diff;
}

export default Paraphraser;
