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
import { Save, Sparkles, AlertCircle, BookOpen, CheckCircle, Info, ChevronDown, FileText, FileSpreadsheet, Copy, Trash2 } from "lucide-react";
import { paraphraseWithGroq, getParaphraseStats, isGroqConfigured, detectAIProbabilityWithGroq, type ParaphraseMode } from "../../lib/paraphrase/groqService";
import { formatToolSessionTime, useToolSession } from "./useToolSession";
import { ToolHeaderBadge, ToolHeaderLiveBadge } from "./ToolHeaderBadges";
import ToolMobileSheet from "./ToolMobileSheet";
import { ParaphraserEmpty } from "./empty-states";
import { exportParaphraseToDocx } from "../../lib/export/docxExport";
import { exportParaphraseToTxt } from "../../lib/export/txtExport";

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
    const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
    const [stats, setStats] = useState<ParaphraseStats | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showDiff, setShowDiff] = useState(false);
    const [linkedReferenceId, setLinkedReferenceId] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isScanningRisk, setIsScanningRisk] = useState(false);
    const [aiProbability, setAiProbability] = useState(0);
    const [showInsights, setShowInsights] = useState(false);

    const savedReferences = useMemo(() => {
        try {
            const rawRefs = localStorage.getItem('references');
            return rawRefs ? JSON.parse(rawRefs) : [];
        } catch {
            return [];
        }
    }, []);

    useEffect(() => {
        if (!outputText || isTyping || isLoading) {
            if (!outputText) setAiProbability(0);
            return;
        }

        let isMounted = true;
        const scan = async () => {
            setIsScanningRisk(true);
            const result = await detectAIProbabilityWithGroq(outputText);
            if (isMounted) {
                if (result.success) {
                    setAiProbability(result.probability);
                } else {
                    setAiProbability(35); // Fallback so UI doesn't break
                }
                setIsScanningRisk(false);
            }
        };

        const timer = setTimeout(scan, 500); // Short debounce
        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [outputText, isTyping, isLoading]);
    const currentSession = useMemo<ParaphraserSession>(() => ({
        inputText,
        outputText,
        mode,
        stats,
    }), [inputText, mode, outputText, stats]);
    const {
        initialData,
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
    }, [initialData]);

    // Typing indicator effect (matches TextSummarizer)
    useEffect(() => {
        if (inputText) {
            setIsTyping(true);
            const timeout = setTimeout(() => setIsTyping(false), 150);
            return () => clearTimeout(timeout);
        }
    }, [inputText]);

    const modes: { id: ParaphraseMode; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
        { id: 'standard', label: 'Standard', desc: 'Balanced rewrite', color: 'emerald', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
        { id: 'fluency', label: 'Fluency', desc: 'Natural flow', color: 'blue', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
        { id: 'formal', label: 'Formal', desc: 'Professional tone', color: 'violet', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
        { id: 'creative', label: 'Creative', desc: 'Unique style', color: 'amber', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
        { id: 'shorter', label: 'Shorter', desc: 'Concise version', color: 'rose', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12H3M21 6H3M21 18H9"/></svg> },
        { id: 'expand', label: 'Expand', desc: 'More detailed', color: 'cyan', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12H3M21 6H3M21 18H3"/></svg> },
    ];

    const getModeColor = (modeId: string) => {
        const modeColors: Record<string, { bg: string; text: string; border: string; ring: string; glow: string; iconBg: string }> = {
            standard: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/50', ring: 'ring-emerald-500', glow: 'from-emerald-500/20 dark:from-emerald-500/10', iconBg: 'bg-emerald-100 dark:bg-emerald-800/40' },
            fluency: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800/50', ring: 'ring-blue-500', glow: 'from-blue-500/20 dark:from-blue-500/10', iconBg: 'bg-blue-100 dark:bg-blue-800/40' },
            formal: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800/50', ring: 'ring-violet-500', glow: 'from-violet-500/20 dark:from-violet-500/10', iconBg: 'bg-violet-100 dark:bg-violet-800/40' },
            creative: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/50', ring: 'ring-amber-500', glow: 'from-amber-500/20 dark:from-amber-500/10', iconBg: 'bg-amber-100 dark:bg-amber-800/40' },
            shorter: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800/50', ring: 'ring-rose-500', glow: 'from-rose-500/20 dark:from-rose-500/10', iconBg: 'bg-rose-100 dark:bg-rose-800/40' },
            expand: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800/50', ring: 'ring-cyan-500', glow: 'from-cyan-500/20 dark:from-cyan-500/10', iconBg: 'bg-cyan-100 dark:bg-cyan-800/40' },
        };
        return modeColors[modeId] || modeColors.standard;
    };

    const getThemeColors = (modeId: string) => {
        const themes: Record<string, any> = {
            standard: {
                gradient1: 'bg-emerald-500/5 dark:bg-emerald-500/[0.03]',
                gradient2: 'bg-green-500/5 dark:bg-green-500/[0.03]',
                hoverBorder: 'hover:border-emerald-200/80',
                cardHoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
                iconContainer: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50',
                iconContainerAlt: 'bg-emerald-50/80 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/60 shadow-sm ring-4 ring-white/50 dark:ring-zinc-900/50 text-emerald-600 dark:text-emerald-400',
                button: 'bg-emerald-600 hover:bg-emerald-700',
                buttonShadow: 'rgba(16, 185, 129, 0.35)',
                hoverBg: 'group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20',
                hoverText: 'group-hover:text-emerald-500 dark:group-hover:text-emerald-400',
                textStatus: 'text-emerald-500'
            },
            fluency: {
                gradient1: 'bg-blue-500/5 dark:bg-blue-500/[0.03]',
                gradient2: 'bg-cyan-500/5 dark:bg-cyan-500/[0.03]',
                hoverBorder: 'hover:border-blue-200/80',
                cardHoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
                iconContainer: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50',
                iconContainerAlt: 'bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/60 shadow-sm ring-4 ring-white/50 dark:ring-zinc-900/50 text-blue-600 dark:text-blue-400',
                button: 'bg-blue-600 hover:bg-blue-700',
                buttonShadow: 'rgba(59, 130, 246, 0.35)',
                hoverBg: 'group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20',
                hoverText: 'group-hover:text-blue-500 dark:group-hover:text-blue-400',
                textStatus: 'text-blue-500'
            },
            formal: {
                gradient1: 'bg-violet-500/5 dark:bg-violet-500/[0.03]',
                gradient2: 'bg-fuchsia-500/5 dark:bg-fuchsia-500/[0.03]',
                hoverBorder: 'hover:border-violet-200/80',
                cardHoverBorder: 'hover:border-violet-300 dark:hover:border-violet-700',
                iconContainer: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800/50',
                iconContainerAlt: 'bg-violet-50/80 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/60 shadow-sm ring-4 ring-white/50 dark:ring-zinc-900/50 text-violet-600 dark:text-violet-400',
                button: 'bg-violet-600 hover:bg-violet-700',
                buttonShadow: 'rgba(139, 92, 246, 0.35)',
                hoverBg: 'group-hover:bg-violet-50 dark:group-hover:bg-violet-900/20',
                hoverText: 'group-hover:text-violet-500 dark:group-hover:text-violet-400',
                textStatus: 'text-violet-500'
            },
            creative: {
                gradient1: 'bg-amber-500/5 dark:bg-amber-500/[0.03]',
                gradient2: 'bg-orange-500/5 dark:bg-orange-500/[0.03]',
                hoverBorder: 'hover:border-amber-200/80',
                cardHoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
                iconContainer: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50',
                iconContainerAlt: 'bg-amber-50/80 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/60 shadow-sm ring-4 ring-white/50 dark:ring-zinc-900/50 text-amber-600 dark:text-amber-400',
                button: 'bg-amber-600 hover:bg-amber-700',
                buttonShadow: 'rgba(245, 158, 11, 0.35)',
                hoverBg: 'group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20',
                hoverText: 'group-hover:text-amber-500 dark:group-hover:text-amber-400',
                textStatus: 'text-amber-500'
            },
            shorter: {
                gradient1: 'bg-rose-500/5 dark:bg-rose-500/[0.03]',
                gradient2: 'bg-pink-500/5 dark:bg-pink-500/[0.03]',
                hoverBorder: 'hover:border-rose-200/80',
                cardHoverBorder: 'hover:border-rose-300 dark:hover:border-rose-700',
                iconContainer: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50',
                iconContainerAlt: 'bg-rose-50/80 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/60 shadow-sm ring-4 ring-white/50 dark:ring-zinc-900/50 text-rose-600 dark:text-rose-400',
                button: 'bg-rose-600 hover:bg-rose-700',
                buttonShadow: 'rgba(244, 63, 94, 0.35)',
                hoverBg: 'group-hover:bg-rose-50 dark:group-hover:bg-rose-900/20',
                hoverText: 'group-hover:text-rose-500 dark:group-hover:text-rose-400',
                textStatus: 'text-rose-500'
            },
            expand: {
                gradient1: 'bg-cyan-500/5 dark:bg-cyan-500/[0.03]',
                gradient2: 'bg-blue-500/5 dark:bg-blue-500/[0.03]',
                hoverBorder: 'hover:border-cyan-200/80',
                cardHoverBorder: 'hover:border-cyan-300 dark:hover:border-cyan-700',
                iconContainer: 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-800/50',
                iconContainerAlt: 'bg-cyan-50/80 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800/60 shadow-sm ring-4 ring-white/50 dark:ring-zinc-900/50 text-cyan-600 dark:text-cyan-400',
                button: 'bg-cyan-600 hover:bg-cyan-700',
                buttonShadow: 'rgba(6, 182, 212, 0.35)',
                hoverBg: 'group-hover:bg-cyan-50 dark:group-hover:bg-cyan-900/20',
                hoverText: 'group-hover:text-cyan-500 dark:group-hover:text-cyan-400',
                textStatus: 'text-cyan-500'
            }
        };
        return themes[modeId] || themes.standard;
    };

    const theme = getThemeColors(mode);

    const isErrorOutput = useMemo(() => {
        if (!outputText) return false;
        const lower = outputText.toLowerCase();
        return lower.includes('[unrecognizable_text]') ||
               lower.includes('jumbled collection') || 
               lower.includes('does not form a coherent') ||
               lower.includes('cannot paraphrase') ||
               lower.includes('unable to paraphrase') ||
               lower.includes('i cannot fulfill') ||
               lower.includes('apologize, but i cannot');
    }, [outputText]);

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

    const handleCopy = (text?: string) => {
        const textToCopy = typeof text === 'string' ? text : outputText;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadTxt = () => {
        if (!outputText) return;
        exportParaphraseToTxt(inputText, outputText, mode);
        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 2000);
    };

    const handleDownloadDocx = async () => {
        if (!outputText) return;
        try {
            await exportParaphraseToDocx(inputText, outputText, mode);
            setDownloaded(true);
            setTimeout(() => setDownloaded(false), 2000);
        } catch (err) {
            console.error('DOCX export failed:', err);
            // Fallback to TXT
            handleDownloadTxt();
        }
    };

    const handleClear = () => {
        setInputText('');
        setOutputText('');
        setStats(null);
        setError(null);
        setLinkedReferenceId('');
        setShowDiff(false);
    };

    const restoreSession = (session: ParaphraserSession) => {
        setInputText(session.inputText);
        setOutputText(session.outputText);
        setMode(session.mode);
        setStats(session.stats);
        setError(null);
        setLinkedReferenceId('');
        setShowDiff(false);
    };

    const handleRestoreSaved = () => {
        restoreSession(initialData);
        saveImmediately(initialData);
    };

    const handleRestoreSnapshot = (session: ParaphraserSession) => {
        restoreSession(session);
        saveImmediately(session);
    };

    const handleClearSaved = () => {
        clearSavedSession();
    };

    const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
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
            <div className="w-full max-w-[1400px] mx-auto h-auto min-h-[calc(100vh-6rem)] flex flex-col p-0 sm:p-0" role="status" aria-busy="true" aria-label="Loading Paraphraser">
                {/* Header Skeleton */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-5 px-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-4">
                        <div className="skeleton-bone w-12 h-12 rounded-[16px] bg-zinc-200 dark:bg-zinc-800" />
                        <div className="flex flex-col gap-2 skeleton-stagger">
                            <div className="skeleton-bone w-32 h-6 rounded-md bg-zinc-200 dark:bg-zinc-800" />
                            <div className="skeleton-bone w-48 h-4 rounded-md bg-zinc-100 dark:bg-zinc-800/50" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="skeleton-bone w-20 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 hidden sm:block" />
                        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2 hidden sm:block" />
                        <div className="skeleton-bone w-24 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/50" />
                        <div className="skeleton-bone w-32 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                </div>

                {/* Insight Cards Skeleton */}
                <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 h-[88px] flex flex-col gap-2 skeleton-stagger">
                            <div className="skeleton-bone w-24 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            <div className="skeleton-bone w-full h-3 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
                            <div className="skeleton-bone w-2/3 h-3 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
                        </div>
                    ))}
                </div>

                {/* Mode Selector Skeleton */}
                <div className="mb-6 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <div className="skeleton-bone w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                        <div className="skeleton-bone w-32 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="skeleton-bone h-20 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
                        ))}
                    </div>
                </div>

                {/* Main Content Dual Pane Skeleton */}
                <div className="grid grid-cols-1 gap-6 pb-0 lg:grid-cols-[minmax(0,1fr)_420px] lg:pb-0 flex-1">
                    <div className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm overflow-hidden min-h-[400px]">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="skeleton-bone w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                            <div className="skeleton-bone w-24 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
                        </div>
                        <div className="flex-1 p-6 lg:p-8 flex flex-col gap-4 skeleton-stagger">
                            <div className="skeleton-bone w-full h-4 rounded bg-zinc-100 dark:bg-zinc-800/50" />
                            <div className="skeleton-bone w-11/12 h-4 rounded bg-zinc-100 dark:bg-zinc-800/50" />
                            <div className="skeleton-bone w-4/5 h-4 rounded bg-zinc-100 dark:bg-zinc-800/50" />
                        </div>
                    </div>
                    
                    <div className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm overflow-hidden min-h-[400px]">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="skeleton-bone w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                            <div className="skeleton-bone w-24 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
                        </div>
                        <div className="flex-1 p-6 lg:p-8 flex flex-col gap-4 skeleton-stagger">
                            <div className="skeleton-bone w-full h-4 rounded bg-zinc-100 dark:bg-zinc-800/50" />
                            <div className="skeleton-bone w-11/12 h-4 rounded bg-zinc-100 dark:bg-zinc-800/50" />
                        </div>
                    </div>
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
            <div className={`mt-[72px] sm:mt-0 flex flex-row justify-between items-center gap-4 mb-6 p-4 sm:p-5 px-5 sm:px-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm relative overflow-hidden group ${theme.hoverBorder} hover:shadow-md transition-all duration-300`}>
                <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 ${theme.gradient1} rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150`} aria-hidden="true" />
                <div className={`absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 ${theme.gradient2} rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150`} aria-hidden="true" />
                
                {/* Title Area */}
                <motion.div
                    className="flex items-center gap-4 relative z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                    <motion.div
                        className={`flex items-center justify-center w-12 h-12 rounded-[16px] ${theme.iconContainer}`}
                        whileHover={{ scale: 1.05, rotate: -5 }}
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                        </svg>
                    </motion.div>
                    
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Paraphraser</h1>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                            <ToolHeaderLiveBadge label={isGroqConfigured() ? 'System Online' : 'Setup Needed'} isOnline={isGroqConfigured()} />
                            <ToolHeaderBadge
                                icon={Save}
                                label={lastSavedAt ? `Saved ${formatToolSessionTime(lastSavedAt)}` : 'Auto-save ready'}
                                tone="cyan"
                                hideOnSmall
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-nowrap items-center gap-1.5 sm:gap-2 w-auto shrink-0 relative z-10 overflow-x-auto [scrollbar-width:none]"
                >
                    <LayoutGroup>
                        <motion.button
                            layout
                            onClick={onBack}
                            className="flex items-center gap-1 sm:gap-1.5 px-3 py-2 sm:px-4 sm:py-2 text-[13px] sm:text-sm font-bold text-zinc-700 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800/50 rounded-[14px] hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors whitespace-nowrap"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ layout: { type: "spring", bounce: 0.2, duration: 0.6 } }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                            Back
                        </motion.button>

                        {hasSavedSession && (
                            <>
                                <motion.div layout transition={{ layout: { type: "spring", bounce: 0.2, duration: 0.6 } }} className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2 hidden sm:block"></motion.div>
                                <motion.button
                                    layout
                                    onClick={handleRestoreSaved}
                                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-[14px] hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.97 }}
                                    transition={{ layout: { type: "spring", bounce: 0.2, duration: 0.6 } }}
                                >
                                    Restore
                                </motion.button>
                            </>
                        )}


                    </LayoutGroup>
                </motion.div>
            </div>

            {/* Insights & Safety - Secondary Container (Toned down) */}
            <div className="mb-4 md:mb-6">
                {/* Collapsible header — always visible */}
                <motion.button
                    type="button"
                    onClick={() => setShowInsights((v) => !v)}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring' as const, stiffness: 300, damping: 24, delay: 0.12 }}
                    className={`w-full flex items-center justify-between p-4 md:p-5 bg-white dark:bg-zinc-800/30 border border-zinc-200/60 dark:border-zinc-800/60 rounded-[24px] group ${theme.hoverBorder} hover:shadow-md transition-all duration-300 xl:pointer-events-none xl:cursor-default`}
                >
                    <div className="flex items-center gap-4 relative z-10">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            transition={{ type: 'spring' as const, stiffness: 400, damping: 15 }}
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] sm:rounded-[16px] ${theme.iconContainerAlt} flex items-center justify-center flex-shrink-0`}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-6 sm:h-6">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            </svg>
                        </motion.div>
                        <div className="text-left">
                            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                Session Insights
                            </h2>
                            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium hidden sm:block">
                                Safety, integrity, and meaning checks.
                            </p>
                        </div>
                    </div>
                    <motion.div
                        animate={{ rotate: showInsights ? 180 : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="text-zinc-400 xl:hidden"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </motion.div>
                </motion.button>

                {/* Expanded cards — hidden on mobile unless open, always visible on xl */}
                <div className="xl:hidden">
                    <AnimatePresence>
                        {showInsights && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                                className="overflow-hidden"
                            >
                                <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
                                    {/* Integrity Guardrail Card */}
                                    <div className={`flex flex-col items-start gap-2.5 px-4 py-3.5 rounded-[20px] bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm ${theme.cardHoverBorder} transition-colors`}>
                                        <div className={`w-9 h-9 rounded-[12px] ${theme.iconContainerAlt} flex items-center justify-center shrink-0`}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">Integrity Guardrail</p>
                                            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-tight">Paraphrased work needs citations.</p>
                                        </div>
                                    </div>

                                    {/* Meaning Check Card */}
                                    <div className={`flex flex-col items-start gap-2.5 px-4 py-3.5 rounded-[20px] bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm ${theme.cardHoverBorder} transition-colors`}>
                                        <div className={`w-9 h-9 rounded-[12px] ${theme.iconContainerAlt} flex items-center justify-center shrink-0`}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">Meaning Check</p>
                                            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-tight">{changeInsight}</p>
                                        </div>
                                    </div>

                                    {/* Session Safety Card */}
                                    <div className="flex flex-col items-start justify-between gap-2.5 px-4 py-3.5 rounded-[20px] bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors sm:col-span-2 lg:col-span-1">
                                        <div>
                                            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">Session Safety</p>
                                            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-tight">
                                                {hasSavedSession ? 'Draft recoverable' : 'Auto-saves locally'}
                                            </p>
                                        </div>
                                        {hasSavedSession && (
                                            <button
                                                onClick={handleClearSaved}
                                                className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-xl shrink-0"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                                </svg>
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Desktop xl+: always visible, no toggle */}
                <div className="hidden xl:block mt-3">
                    <div className="flex flex-col xl:flex-row items-start xl:items-center gap-3 sm:gap-4 relative z-10 w-full xl:w-auto flex-1">
                        {/* Integrity Guardrail Card */}
                        <div className={`flex flex-col xl:flex-row items-start xl:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 rounded-[20px] bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm ${theme.cardHoverBorder} transition-colors flex-1 min-w-[200px]`}>
                            <motion.div
                                whileHover={{ scale: 1.05, rotate: -5 }}
                                transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] ${theme.iconContainerAlt} flex items-center justify-center shrink-0`}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                </svg>
                            </motion.div>
                            <div>
                                <p className="text-[10px] sm:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5 sm:mb-1">Integrity Guardrail</p>
                                <p className="text-xs sm:text-[13px] font-bold text-zinc-800 dark:text-zinc-200 leading-tight">Paraphrased work needs citations.</p>
                            </div>
                        </div>

                        {/* Meaning Check Card */}
                        <div className={`flex flex-col xl:flex-row items-start xl:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 rounded-[20px] bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm ${theme.cardHoverBorder} transition-colors flex-1 min-w-[200px]`}>
                            <motion.div
                                whileHover={{ scale: 1.05, rotate: -5 }}
                                transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] ${theme.iconContainerAlt} flex items-center justify-center shrink-0`}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                                </svg>
                            </motion.div>
                            <div>
                                <p className="text-[10px] sm:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5 sm:mb-1">Meaning Check</p>
                                <p className="text-xs sm:text-[13px] font-bold text-zinc-800 dark:text-zinc-200 leading-tight">{changeInsight}</p>
                            </div>
                        </div>

                        {/* Session Safety Card */}
                        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-5 py-4 rounded-[20px] bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors flex-1 min-w-[200px]">
                            <div>
                                <p className="text-[10px] sm:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5 sm:mb-1">Session Safety</p>
                                <p className="text-xs sm:text-[13px] font-bold text-zinc-800 dark:text-zinc-200 leading-tight">
                                    {hasSavedSession ? 'Draft recoverable' : 'Auto-saves locally'}
                                </p>
                            </div>
                            {hasSavedSession && (
                                <button
                                    onClick={handleClearSaved}
                                    className="mt-1 xl:mt-0 inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-xl shrink-0"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                    </svg>
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mode Selector - Premium Container */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring' as const, stiffness: 300, damping: 24, delay: 0.1 }}
                className={`mb-5 md:mb-8 relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-[24px] p-4 md:p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6 group ${theme.hoverBorder} hover:shadow-md transition-all duration-300`}
            >
                {/* SaaS Background Accents */}
                <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 ${theme.gradient1} rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150`} aria-hidden="true" />
                <div className={`absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 ${theme.gradient2} rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150`} aria-hidden="true" />

                {/* Left: Icon & Core Info */}
                <div className="flex items-center gap-5 relative z-10 w-full xl:w-auto shrink-0">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: -5 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] sm:rounded-[18px] ${theme.iconContainerAlt} flex items-center justify-center flex-shrink-0`}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-7 sm:h-7">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                    </motion.div>

                    <div>
                        <div className="flex items-center gap-3 mb-0.5">
                            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                Paraphrase Mode
                            </h1>
                        </div>
                        <p className="text-[13px] sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-sm leading-relaxed font-medium">
                            Tailor your rewriting style and tone.
                        </p>
                    </div>
                </div>

                {/* Right: Mode Buttons Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-3 relative z-10 flex-1 w-full xl:w-auto">
                    {modes.map((m) => {
                        const colors = getModeColor(m.id);
                        const isActive = mode === m.id;
                        return (
                            <motion.button
                                key={m.id}
                                onClick={() => setMode(m.id)}
                                className={`group relative flex flex-col items-center justify-center gap-2.5 p-2.5 sm:p-3.5 rounded-[20px] transition-all overflow-hidden h-full ${
                                    isActive 
                                        ? `${colors.bg} ${colors.border} border ring-2 ${colors.ring} shadow-sm` 
                                        : 'bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200/50 dark:border-zinc-700/50 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm hover:border-zinc-300 dark:hover:border-zinc-600'
                                }`}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {/* Active background inner glow */}
                                {isActive && (
                                    <div className={`absolute inset-0 opacity-40 bg-gradient-to-b ${colors.glow} pointer-events-none`} />
                                )}
                                
                                <div className={`relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-[14px] transition-colors ${
                                    isActive
                                        ? `${colors.iconBg} shadow-sm`
                                        : `bg-zinc-100/80 dark:bg-zinc-700/50 ${theme.hoverBg}`
                                }`}>
                                    <span className={isActive ? colors.text : `text-zinc-400 ${theme.hoverText} transition-colors`}>
                                        {m.icon}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center gap-0.5 relative text-center">
                                    <span className={`text-[12px] sm:text-[13px] font-bold tracking-tight ${isActive ? colors.text : 'text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors'}`}>
                                        {m.label}
                                    </span>
                                    <span className={`text-[9px] sm:text-[10px] font-bold hidden 2xl:block ${isActive ? 'opacity-70' : 'text-zinc-400'}`}>
                                        {m.desc}
                                    </span>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Main Content - Dual Pane */}
            <div className="grid grid-cols-1 gap-6 pb-0 lg:grid-cols-[minmax(0,1fr)_480px] lg:pb-0 flex-1">
                {/* Input Card - The True Hero */}
                <motion.div
                    className="flex-1 relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[24px] shadow-md hover:shadow-lg overflow-hidden min-h-[300px] lg:min-h-[400px] focus-within:border-emerald-400 dark:focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 dark:focus-within:ring-emerald-500/10 transition-all duration-300 flex flex-col group"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                >
                    {/* Subtle top indicator for typing */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0 opacity-0 transition-opacity duration-300" style={{ opacity: isTyping ? 1 : 0 }} />
                    
                    <div className="border-b border-zinc-100 dark:border-zinc-800">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full px-4 py-3 sm:px-6 sm:py-4 gap-3 sm:gap-4">
                            {/* Title on left */}
                            <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-3 shrink-0">
                                <div className="flex items-center gap-3">
                                    <motion.div
                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                        transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                                        className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-xl ${theme.iconContainerAlt}`}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                        </svg>
                                    </motion.div>
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight shrink-0 whitespace-nowrap">Original Text</span>
                                        {/* Mobile Words Badge */}
                                        <span className="flex sm:hidden text-[10.5px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100/80 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
                                            {wordCount} words
                                        </span>
                                    </div>
                                </div>
                                {/* Desktop Words Badge */}
                                <span className="hidden sm:flex text-[11px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100/80 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
                                    {wordCount} words
                                </span>
                            </div>

                            {/* Action Buttons on right */}
                            <div className="hidden sm:flex items-center w-auto justify-end gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => handleCopy(inputText)}
                                    className="flex items-center justify-center w-[46px] h-[46px] rounded-[16px] bg-[#f4f5f7] text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 focus:outline-none"
                                >
                                    <Copy className="w-[18px] h-[18px] shrink-0" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="flex items-center justify-center w-[46px] h-[46px] rounded-[16px] bg-[#fff0f0] text-red-500 transition-colors hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 focus:outline-none"
                                >
                                    <Trash2 className="w-[18px] h-[18px] shrink-0" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleParaphrase}
                                    disabled={!inputText.trim() || isLoading}
                                    className="flex items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 px-5 h-[46px] text-[15px] font-bold text-white transition-all duration-300 dark:from-emerald-600 dark:to-emerald-700 dark:hover:from-emerald-700 dark:hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none shadow-sm hover:shadow-md"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 12a9 9 0 11-6.219-8.56"/>
                                            </svg>
                                            <span className="whitespace-nowrap tracking-tight">Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                                            </svg>
                                            <span className="whitespace-nowrap tracking-tight">Paraphrase</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="flex-1 w-full p-4 lg:p-8 font-sans text-[15px] leading-[1.8] whitespace-pre-wrap break-words bg-transparent border-none resize-none text-zinc-800 dark:text-zinc-200 focus:ring-0 focus:outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 [scrollbar-width:thin]"
                        placeholder="Enter or paste your text here to paraphrase..."
                        spellCheck={false}
                    />
                    
                    {/* Action Footer (Mobile) */}
                    <div className="flex sm:hidden bg-zinc-50/50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-zinc-800 px-4 py-4 items-center justify-between gap-3 relative z-10">
                        <button
                            type="button"
                            onClick={() => handleCopy(inputText)}
                            className="flex items-center justify-center shrink-0 w-[46px] h-[46px] rounded-[16px] bg-[#f4f5f7] text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 focus:outline-none"
                        >
                            <Copy className="w-[18px] h-[18px] shrink-0" />
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="flex items-center justify-center shrink-0 w-[46px] h-[46px] rounded-[16px] bg-[#fff0f0] text-red-500 transition-colors hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 focus:outline-none"
                        >
                            <Trash2 className="w-[18px] h-[18px] shrink-0" />
                        </button>
                        <button
                            type="button"
                            onClick={handleParaphrase}
                            disabled={!inputText.trim() || isLoading}
                            className="flex-1 flex items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 h-[46px] text-[15px] font-bold text-white transition-all duration-300 dark:from-emerald-600 dark:to-emerald-700 dark:hover:from-emerald-700 dark:hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none shadow-sm hover:shadow-md"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                                    </svg>
                                    <span className="whitespace-nowrap tracking-tight">Processing...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                                    </svg>
                                    <span className="whitespace-nowrap tracking-tight">Paraphrase</span>
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>

                <ToolMobileSheet
                    title="Rewrite Result"
                    summary={resultSummary}
                    actionLabel="Open rewrite panel"
                    className="w-full h-full flex flex-col gap-3 sm:gap-4"
                    tone="cyan"
                >
                <motion.div
                    className={`flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[24px] overflow-hidden min-h-[300px] lg:min-h-[400px] transition-all duration-300 relative group ${theme.hoverBorder} hover:shadow-md`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {/* Background Accents */}
                    <div className={`hidden sm:block absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 ${theme.gradient1} rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150`} aria-hidden="true" />
                    <div className={`hidden sm:block absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 ${theme.gradient2} rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150`} aria-hidden="true" />
                    <div className="border-b border-zinc-100 dark:border-zinc-800 relative z-10">
                        <div className="flex items-center justify-between w-full px-4 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center gap-3 shrink-0">
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                    transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                                    className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-xl ${theme.iconContainerAlt}`}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                </motion.div>
                                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight shrink-0 whitespace-nowrap">
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={`flex-1 relative ${isErrorOutput ? 'min-h-[280px]' : 'min-h-[150px] sm:min-h-[200px]'}`}>
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
                                    className={`absolute inset-0 p-6 lg:p-8 ${isErrorOutput ? 'overflow-hidden' : 'overflow-y-auto'} [scrollbar-width:thin]`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    {isErrorOutput && (
                                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
                                            <div className="bg-white dark:bg-zinc-800 border border-red-200 dark:border-red-900/50 shadow-sm sm:shadow-xl rounded-2xl p-5 sm:p-6 max-w-sm w-full mx-4 sm:mx-auto text-center transform transition-all">
                                                <div className="w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                                                    <AlertCircle className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-[15px] sm:text-base font-bold text-zinc-900 dark:text-white mb-2">Unrecognizable Text</h3>
                                                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed line-clamp-3">
                                                    {outputText.includes('[UNRECOGNIZABLE_TEXT]') 
                                                        ? "The sequence of characters provided does not form a coherent message or text, appearing to be a random assortment of characters." 
                                                        : outputText}
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        setOutputText('');
                                                        setInputText('');
                                                    }}
                                                    className="w-full py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl transition-colors"
                                                >
                                                    Clear and Try Again
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <div className={isErrorOutput ? "opacity-20 pointer-events-none filter blur-[2px] transition-all duration-300" : ""}>
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
                                    </div>
                                </motion.div>
                            ) : (
                                <ParaphraserEmpty 
                                    onAction={() => {
                                        // Sample text to get started
                                        setInputText('The quick brown fox jumps over the lazy dog. This is a sample sentence that demonstrates how the paraphraser can rewrite text in different styles while preserving the original meaning.');
                                    }}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Unified Actions & Stats Footer */}
                    <AnimatePresence>
                        {outputText && !isErrorOutput && (
                            <motion.div
                                className="bg-zinc-50/50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-zinc-800 backdrop-blur-md relative z-10"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4">
                                    {/* Stats (Scrollable on mobile) */}
                                    <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto [scrollbar-width:none] pb-1 sm:pb-0">
                                        {stats && (
                                            <>
                                                {/* Words Badge */}
                                                <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700/80 text-zinc-600 dark:text-zinc-300 shadow-sm transition-colors">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 shrink-0">
                                                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/>
                                                    </svg>
                                                    <span className="whitespace-nowrap">
                                                        <span className="font-bold text-zinc-800 dark:text-zinc-100">
                                                            <NumberTicker value={stats.paraphrasedWords} />
                                                        </span>{' '}
                                                        Words
                                                    </span>
                                                    <span className={`shrink-0 whitespace-nowrap text-[10px] font-bold ${stats.wordChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        ({stats.wordChange >= 0 ? '+' : ''}{stats.wordChange})
                                                    </span>
                                                </div>
                                                
                                                {/* Similarity Badge */}
                                                <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border shadow-sm transition-colors ${
                                                    stats.similarity <= 50 
                                                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400' 
                                                        : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/40 text-amber-700 dark:text-amber-400'
                                                }`}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 shrink-0">
                                                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                                    </svg>
                                                    <span className="whitespace-nowrap">
                                                        <span className="font-bold">
                                                            <NumberTicker value={stats.similarity} />%
                                                        </span>{' '}
                                                        Similar
                                                    </span>
                                                </div>

                                                {/* Uniqueness Badge */}
                                                <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border shadow-sm transition-colors ${
                                                    stats.uniqueness >= 50 
                                                        ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-900/40 text-blue-700 dark:text-blue-400' 
                                                        : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/40 text-amber-700 dark:text-amber-400'
                                                }`}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 shrink-0">
                                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                                                    </svg>
                                                    <span className="whitespace-nowrap">
                                                        <span className="font-bold">
                                                            <NumberTicker value={stats.uniqueness} />%
                                                        </span>{' '}
                                                        Unique
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-0 border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
                                        <button
                                            onClick={() => setShowDiff(!showDiff)}
                                            className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-bold rounded-[14px] transition-colors shadow-sm focus:outline-none ${
                                                showDiff
                                                    ? 'bg-amber-50 border border-amber-200/60 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-400'
                                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                                            </svg>
                                            <span className="whitespace-nowrap tracking-tight">{showDiff ? 'Final' : 'Changes'}</span>
                                        </button>
                                        <button
                                            onClick={handleDownloadDocx}
                                            className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-bold rounded-[14px] transition-colors shadow-sm focus:outline-none ${
                                                downloaded
                                                    ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400'
                                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                            }`}
                                            title="Export as Word document"
                                        >
                                            <FileSpreadsheet className="w-4 h-4 shrink-0" />
                                            <span className="whitespace-nowrap tracking-tight">.docx</span>
                                        </button>
                                        <button
                                            onClick={handleDownloadTxt}
                                            className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-bold rounded-[14px] transition-colors shadow-sm focus:outline-none ${
                                                downloaded
                                                    ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                            }`}
                                            title="Export as plain text"
                                        >
                                            <FileText className="w-4 h-4 shrink-0" />
                                            <span className="whitespace-nowrap tracking-tight">.txt</span>
                                        </button>
                                        <button
                                            onClick={() => handleCopy()}
                                            className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-bold rounded-[14px] transition-colors shadow-sm focus:outline-none ${
                                                copied
                                                    ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/50 dark:hover:bg-emerald-900/70 dark:text-emerald-400'
                                                    : 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300'
                                            }`}
                                        >
                                            {copied ? (
                                                <>
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                        <polyline points="20 6 9 17 4 12"/>
                                                    </svg>
                                                    <span className="whitespace-nowrap tracking-tight">Copied</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                                    </svg>
                                                    <span className="whitespace-nowrap tracking-tight">Copy</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Academic AI Risk Detector Card */}
                <div className={`bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-zinc-200/60 dark:border-zinc-800/60 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] p-4 sm:p-6 relative overflow-hidden group transition-all duration-300 ${theme.hoverBorder} hover:shadow-md`}>
                     {/* Green Background Accents */}
                     <div className={`hidden sm:block absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 ${theme.gradient1} rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150`} aria-hidden="true" />
                     <div className={`hidden sm:block absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 ${theme.gradient2} rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150`} aria-hidden="true" />
                     
                     <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 relative z-10">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: -5 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                            className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${theme.iconContainerAlt} flex items-center justify-center`}
                        >
                            <Sparkles width="20" height="20" strokeWidth="2.5" className="sm:w-6 sm:h-6" />
                        </motion.div>
                        <div className="flex flex-col">
                            <h3 className="text-base sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Academic AI Risk</h3>
                            <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">Groq Llama 3 Detection scan</p>
                        </div>
                     </div>

                     <div className="relative z-10 flex flex-col gap-4 sm:gap-5">
                        {isScanningRisk ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-4 animate-pulse">
                                <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                                <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">Analyzing perplexity with Groq...</p>
                            </div>
                        ) : outputText ? (
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-3">
                                             <span className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">
                                                {aiProbability}%
                                            </span>
                                            <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg border ${
                                                aiProbability < 40 
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50' 
                                                    : aiProbability < 70 
                                                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/50' 
                                                        : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200/60 dark:border-red-800/50'
                                            }`}>
                                                {aiProbability < 40 ? 'Low Risk' : aiProbability < 70 ? 'Moderate Risk' : 'High Risk'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                     {/* Radial Progress */}
                                     <div className="relative w-12 h-12 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                                            <circle
                                                cx="32"
                                                cy="32"
                                                r="26"
                                                className="stroke-zinc-100 dark:stroke-zinc-800"
                                                strokeWidth="5"
                                                fill="transparent"
                                            />
                                            <circle
                                                cx="32"
                                                cy="32"
                                                r="26"
                                                className={`transition-all duration-700 ease-out ${
                                                    aiProbability < 40 
                                                        ? 'stroke-emerald-500' 
                                                        : aiProbability < 70 
                                                            ? 'stroke-amber-500' 
                                                            : 'stroke-red-500'
                                                }`}
                                                strokeWidth="5"
                                                strokeLinecap="round"
                                                fill="transparent"
                                                strokeDasharray={2 * Math.PI * 26}
                                                strokeDashoffset={2 * Math.PI * 26 * (1 - aiProbability / 100)}
                                            />
                                        </svg>
                                        <span className="absolute text-[11px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wide uppercase">
                                            Risk
                                        </span>
                                    </div>
                                </div>

                                {/* Progress Bar inside */}
                                <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                                            aiProbability < 40 
                                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' 
                                                : aiProbability < 70 
                                                    ? 'bg-gradient-to-r from-amber-400 to-amber-500' 
                                                    : 'bg-gradient-to-r from-red-400 to-red-500'
                                        }`}
                                        style={{ width: `${aiProbability}%` }}
                                    />
                                </div>

                                 <div className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl border ${
                                    aiProbability < 40 
                                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                                        : aiProbability < 70
                                            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-300'
                                            : 'bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-300'
                                }`}>
                                    <Info width="16" height="16" className="mt-0.5 shrink-0 opacity-70" />
                                    <span className="text-xs font-medium leading-relaxed">
                                        {aiProbability < 40 
                                            ? 'Highly human-like perplexity. Academic scanners are very likely to recognize this as original drafting.' 
                                            : aiProbability < 70 
                                                ? 'Moderate AI signature detected. Academic filters might flag some word choices. Consider editing structurally.' 
                                                : 'Heavy AI signature. Extremely uniform sentence lengths and standard vocabularies will trigger AI flags. Revise manually!'}
                                    </span>
                                </div>
                            </>
                        ) : (
                             <div className="flex flex-col items-center justify-center py-6 sm:py-10 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700/50">
                                <motion.div 
                                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="mb-4 bg-white dark:bg-zinc-800 p-3 rounded-full shadow-sm"
                                >
                                    <Sparkles width="24" height="24" className="text-zinc-400 dark:text-zinc-500" />
                                </motion.div>
                                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Risk Analyzer Idle</span>
                                <span className="text-xs mt-2 text-zinc-500 dark:text-zinc-400 max-w-[220px] text-center leading-relaxed">Paraphrase text to evaluate Academic AI probability</span>
                            </div>
                        )}
                     </div>
                </div>

                {/* Linked Reference Bibliography Card */}
                <div className={`bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-zinc-200/60 dark:border-zinc-800/60 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] p-4 sm:p-6 relative z-30 group transition-all duration-300 ${theme.hoverBorder} hover:shadow-md`}>
                     {/* Green Background Accents */}
                     <div className="absolute inset-0 overflow-hidden rounded-[24px] pointer-events-none">
                         <div className={`hidden sm:block absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 ${theme.gradient1} rounded-full blur-3xl transition-transform duration-700 group-hover:scale-150`} aria-hidden="true" />
                         <div className={`hidden sm:block absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 ${theme.gradient2} rounded-full blur-3xl transition-transform duration-700 group-hover:scale-150`} aria-hidden="true" />
                     </div>
                     
                     <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 relative z-10">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: -5 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                            className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${theme.iconContainerAlt} flex items-center justify-center`}
                        >
                            <BookOpen width="20" height="20" strokeWidth="2.5" className="sm:w-6 sm:h-6" />
                        </motion.div>
                        <div className="flex flex-col">
                            <h3 className="text-base sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Academic Attribution</h3>
                            <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">Paraphrases still require citations</p>
                        </div>
                     </div>

                     <div className="relative z-10 flex flex-col gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 pl-1 pb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></div>
                            <label className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                                Link Source Reference
                            </label>
                        </div>
                        
                        {/* Custom Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3 bg-white dark:bg-zinc-900/50 border-2 rounded-xl transition-all focus:outline-none text-left ${
                                    isDropdownOpen 
                                        ? 'border-emerald-500/50 ring-4 ring-emerald-500/10 shadow-sm' 
                                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/80'
                                }`}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${linkedReferenceId ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
                                        {linkedReferenceId ? <FileText className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="text-[11px] sm:text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">
                                            {linkedReferenceId ? 'Linked Source' : 'General Knowledge'}
                                        </span>
                                        <span className={`text-sm sm:text-base font-bold truncate ${linkedReferenceId ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                            {linkedReferenceId 
                                                ? savedReferences.find((r: any) => r.id === linkedReferenceId)?.title || 'Untitled Reference'
                                                : 'No Source Linked'
                                            }
                                        </span>
                                    </div>
                                </div>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isDropdownOpen ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-400'}`}>
                                    <ChevronDown width="18" height="18" className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </div>
                            </button>
                            
                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <>
                                        {/* Mobile Backdrop */}
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 z-40 bg-transparent sm:hidden" 
                                            onClick={() => setIsDropdownOpen(false)} 
                                        />
                                        {/* Desktop invisible backdrop */}
                                        <div 
                                            className="fixed inset-0 z-40 hidden sm:block" 
                                            onClick={() => setIsDropdownOpen(false)} 
                                        />
                                        
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="absolute left-0 right-0 top-full mt-2 z-50 py-2 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700/80 rounded-2xl shadow-xl max-h-[300px] overflow-y-auto [scrollbar-width:thin] flex flex-col gap-1 px-2"
                                        >
                                            <button
                                                onClick={() => {
                                                    setLinkedReferenceId('');
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${!linkedReferenceId ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'}`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!linkedReferenceId ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                                                    <BookOpen className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <span className="text-sm font-bold truncate">No Source Linked</span>
                                                    <span className="text-xs font-medium opacity-70 truncate">Use general knowledge</span>
                                                </div>
                                                {!linkedReferenceId && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
                                            </button>

                                            {savedReferences.length > 0 && <div className="h-px bg-zinc-100 dark:bg-zinc-800/50 my-1 mx-2" />}

                                            {savedReferences.map((ref: any) => (
                                                <button
                                                    key={ref.id}
                                                    onClick={() => {
                                                        setLinkedReferenceId(ref.id);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${linkedReferenceId === ref.id ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'}`}
                                                >
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${linkedReferenceId === ref.id ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400'}`}>
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex flex-col flex-1 min-w-0">
                                                        <span className="text-sm font-bold truncate">{ref.title || 'Untitled Reference'}</span>
                                                        <span className="text-xs font-medium opacity-70 truncate">{ref.author || 'Unknown Author'}</span>
                                                    </div>
                                                    {linkedReferenceId === ref.id && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
                                                </button>
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {linkedReferenceId ? (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                className="flex items-start gap-3 sm:gap-3.5 p-3 sm:p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 rounded-xl mt-1"
                            >
                                <div className="bg-emerald-100/80 dark:bg-emerald-900/50 p-1.5 rounded-full shrink-0">
                                    <CheckCircle width="16" height="16" className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="flex flex-col gap-1.5 pt-0.5">
                                    <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300">Citable Source Linked!</p>
                                    <p className="text-xs font-medium leading-relaxed text-emerald-700/80 dark:text-emerald-400/90">
                                        Make sure to include an in-text citation and a reference manager entry for this paraphrased text.
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                className="flex items-start gap-3 sm:gap-3.5 p-3 sm:p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 rounded-xl mt-1"
                            >
                                <div className="bg-amber-100/80 dark:bg-amber-900/50 p-1.5 rounded-full shrink-0">
                                    <AlertCircle width="16" height="16" className="text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="flex flex-col gap-1.5 pt-0.5">
                                    <p className="text-sm font-bold text-amber-900 dark:text-amber-300">Unattributed Rewrite</p>
                                    <p className="text-xs font-medium leading-relaxed text-amber-800/80 dark:text-amber-400/90">
                                        If this idea is not your own, link a reference from the Reference Manager to protect academic integrity.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                     </div>
                </div>

                {sessionHistory.length > 0 && (
                    <motion.div
                        className={`flex-1 relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-[24px] p-4 sm:p-6 lg:p-8 group ${theme.hoverBorder} hover:shadow-md transition-[border-color,box-shadow] duration-300 flex flex-col`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        {/* Green Background Accents */}
                        <div className={`hidden sm:block absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 ${theme.gradient1} rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150`} aria-hidden="true" />
                        <div className={`hidden sm:block absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 ${theme.gradient2} rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150`} aria-hidden="true" />
                        
                        <div className="flex flex-row items-center justify-between mb-4 sm:mb-6 relative z-10">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                    transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                                    className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </motion.div>
                                
                                <div className="flex flex-col">
                                    <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
                                        Saved rewrites
                                    </h2>
                                    <p className="text-[11px] sm:text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                                        Session history
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={clearSessionHistory}
                                className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Clear</span>
                            </button>
                        </div>

                        <div className="flex flex-col gap-3 relative z-10">
                            {sessionHistory.map((item) => {
                                const words = item.data.outputText.trim()
                                    ? item.data.outputText.trim().split(/\s+/).length
                                    : item.data.inputText.trim().split(/\s+/).filter(Boolean).length;
                                const isExpanded = expandedHistoryId === item.id;

                                return (
                                    <div
                                        key={item.id}
                                        className={`group relative flex flex-col rounded-2xl border-2 bg-white p-4 text-left shadow-sm transition-[border-color,box-shadow] duration-300 dark:bg-zinc-900/50 ${
                                            isExpanded 
                                                ? 'border-emerald-200 shadow-md dark:border-emerald-800' 
                                                : 'border-zinc-100 hover:border-emerald-200 hover:shadow-md dark:border-zinc-800 dark:hover:border-emerald-800'
                                        }`}
                                    >
                                        {/* Header row — always visible */}
                                        <div 
                                            className="flex items-start justify-between gap-4 cursor-pointer"
                                            onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                    <BookOpen className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold capitalize text-zinc-900 dark:text-zinc-100 leading-none">
                                                        {item.data.mode}
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mt-1">
                                                        {words} words
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500">
                                                    {formatToolSessionTime(item.updatedAt)}
                                                </span>
                                                <div className={`p-1 rounded-md transition-colors duration-200 ${isExpanded ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-500' : 'bg-zinc-50 text-zinc-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 dark:bg-zinc-800 dark:text-zinc-500 dark:group-hover:bg-emerald-900/20 dark:group-hover:text-emerald-500'}`}>
                                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ease-out ${isExpanded ? 'rotate-180' : ''}`} />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Text preview — smooth max-height for unclamping */}
                                        <div 
                                            className="relative cursor-pointer mt-3 overflow-hidden transition-[max-height] duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                            style={{ maxHeight: isExpanded ? '600px' : '2.8em' }}
                                            onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                                        >
                                            <p className="text-sm font-medium leading-relaxed text-zinc-600 dark:text-zinc-300">
                                                {item.data.outputText || item.data.inputText}
                                            </p>
                                            {/* Fade overlay when collapsed */}
                                            <div 
                                                className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white dark:from-zinc-900/50 to-transparent pointer-events-none transition-opacity duration-300"
                                                style={{ opacity: isExpanded ? 0 : 1 }}
                                            />
                                        </div>

                                        {/* Expandable button section — CSS Grid smooth height */}
                                        <div
                                            className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                            style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                                        >
                                            <div className="overflow-hidden">
                                                <div className={`pt-3 mt-1 border-t border-zinc-100 dark:border-zinc-800/50 transition-opacity duration-300 ease-out ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRestoreSnapshot(item.data);
                                                            setExpandedHistoryId(null);
                                                        }}
                                                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 dark:text-emerald-400 px-4 py-2.5 text-sm font-bold transition-colors"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                        Restore this rewrite
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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
