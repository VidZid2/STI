/**
 * Plagiarism Checker Component
 * Text similarity and originality checker
 * Uses Copyleaks API when configured (5 accounts × 10 scans = 50/month)
 * Falls back to local checking when API not available
 * 
 * Premium UI - Matches Grammar Checker glassmorphism design
 * 70/30 split layout with Tailwind CSS
 */

import * as React from "react";
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Save, Search, ShieldCheck } from "lucide-react";
import { 
    scanForPlagiarism, 
    isCopyleaksConfigured, 
    getCopyleaksStatus 
} from "../../lib/plagiarism/copyleaksService";
import { formatToolSessionTime, useToolSession } from "./useToolSession";
import { ToolHeaderBadge } from "./ToolHeaderBadges";
import ToolMobileSheet from "./ToolMobileSheet";

interface PlagiarismCheckerProps {
    onBack: () => void;
}

interface SimilarityResult {
    score: number;
    uniqueScore: number;
    sentences: { text: string; similarity: number; source?: string }[];
    sources?: { url: string; title: string; percentage: number }[];
    isApiResult?: boolean;
}

interface PlagiarismSession {
    inputText: string;
    result: SimilarityResult | null;
}

const EMPTY_PLAGIARISM_SESSION: PlagiarismSession = {
    inputText: '',
    result: null,
};

const shouldPersistPlagiarismSession = (session: PlagiarismSession) =>
    Boolean(session.inputText.trim() || session.result);

const PlagiarismChecker: React.FC<PlagiarismCheckerProps> = ({ onBack }) => {
    const [inputText, setInputText] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [result, setResult] = useState<SimilarityResult | null>(null);
    const [restoredAt, setRestoredAt] = useState<string | null>(null);
    const [apiStatus] = useState(() => getCopyleaksStatus());
    const currentSession = useMemo<PlagiarismSession>(() => ({
        inputText,
        result,
    }), [inputText, result]);
    const {
        initialData,
        initialUpdatedAt,
        hasSavedSession,
        lastSavedAt,
        clearSavedSession,
        saveImmediately,
    } = useToolSession('plagiarism-checker', currentSession, {
        emptySession: EMPTY_PLAGIARISM_SESSION,
        shouldPersist: shouldPersistPlagiarismSession,
    });

    useEffect(() => {
        if (!shouldPersistPlagiarismSession(initialData)) return;

        setInputText(initialData.inputText);
        setResult(initialData.result);
        setRestoredAt(initialUpdatedAt);
    }, [initialData, initialUpdatedAt]);

    // Helper to calculate Jaccard similarity between two strings
    const getJaccardSimilarity = (str1: string, str2: string): number => {
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
            'this', 'that', 'these', 'those', 'it', 'its', 'he', 'she', 'they', 'we'
        ]);
        
        const words1 = str1.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
        const words2 = str2.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
        
        if (words1.length === 0 || words2.length === 0) return 0;
        
        const set1 = new Set(words1);
        const set2 = new Set(words2);
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size;
    };

    // Check plagiarism - uses Copyleaks API if configured, otherwise local
    const checkPlagiarism = async () => {
        if (!inputText.trim()) return;
        
        setIsChecking(true);
        setResult(null);

        // Try Copyleaks API first if configured
        if (isCopyleaksConfigured()) {
            try {
                const apiResult = await scanForPlagiarism(inputText);
                
                if (apiResult.success) {
                    const sentences = inputText.match(/[^.!?]+[.!?]+/g) || [inputText];
                    setResult({
                        score: apiResult.percentPlagiarized || 0,
                        uniqueScore: 100 - (apiResult.percentPlagiarized || 0),
                        sentences: sentences.map(s => ({
                            text: s.trim(),
                            similarity: 0,
                        })),
                        sources: apiResult.sources,
                        isApiResult: true,
                    });
                    setIsChecking(false);
                    return;
                }
                console.warn('Copyleaks API failed, using local check:', apiResult.error);
            } catch (error) {
                console.warn('Copyleaks error, using local check:', error);
            }
        }
        
        // Local fallback (Deterministic bibliography + repetition overlap check)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Load saved references from local storage
        let savedRefs: any[] = [];
        try {
            const rawRefs = localStorage.getItem('references');
            if (rawRefs) {
                savedRefs = JSON.parse(rawRefs);
            }
        } catch (e) {
            console.error('Failed to load references for plagiarism check:', e);
        }

        const sentences = inputText.match(/[^.!?]+[.!?]+/g) || [inputText];
        const matchedSources: { url: string; title: string; percentage: number }[] = [];
        
        const analyzedSentences = sentences.map((sentence, index) => {
            let maxSim = 0;
            let matchSource = '';
            let matchType: 'ref' | 'self' | 'none' = 'none';

            // 1. Check against saved references in Reference Manager
            for (const ref of savedRefs) {
                const refTitle = ref.title || '';
                const refAuthor = ref.authors || '';
                const refPublisher = ref.publisher || '';
                
                const titleSim = getJaccardSimilarity(sentence, refTitle);
                const descSim = getJaccardSimilarity(sentence, `${refAuthor} ${refTitle} ${refPublisher}`);
                const finalRefSim = Math.max(titleSim, descSim);
                
                if (finalRefSim > maxSim) {
                    maxSim = finalRefSim;
                    matchSource = `Saved Reference: "${ref.title}" by ${ref.authors || 'Unknown'}`;
                    matchType = 'ref';
                }
            }

            // 2. Check for self-plagiarism / extreme repetition within the document itself
            if (maxSim < 0.3) {
                for (let otherIdx = 0; otherIdx < sentences.length; otherIdx++) {
                    const otherSentence = sentences[otherIdx];
                    if (otherIdx !== index && sentence.trim().length > 15) {
                        const selfSim = getJaccardSimilarity(sentence, otherSentence);
                        if (selfSim > 0.6 && selfSim > maxSim) {
                            maxSim = selfSim;
                            matchSource = 'Self-plagiarism (repetitive phrasing in document)';
                            matchType = 'self';
                        }
                    }
                }
            }

            // Calculate similarity score percentage (0-100)
            const finalScore = maxSim > 0.15 ? Math.round(maxSim * 100) : 0;

            // Track sources if matched
            if (finalScore > 20 && matchType === 'ref' && matchSource) {
                const refName = matchSource.replace('Saved Reference: ', '');
                const existing = matchedSources.find(s => s.title === refName);
                if (existing) {
                    existing.percentage = Math.max(existing.percentage, finalScore);
                } else {
                    matchedSources.push({
                        title: refName,
                        url: '#',
                        percentage: finalScore
                    });
                }
            }

            return {
                text: sentence.trim(),
                similarity: finalScore,
                source: finalScore > 20 ? matchSource : undefined
            };
        });
        
        const avgSimilarity = analyzedSentences.reduce((acc, s) => acc + s.similarity, 0) / (analyzedSentences.length || 1);
        const finalOverallScore = Math.min(Math.round(avgSimilarity), 100);

        setResult({
            score: finalOverallScore,
            uniqueScore: 100 - finalOverallScore,
            sentences: analyzedSentences,
            sources: matchedSources.length > 0 ? matchedSources : undefined
        });
        
        setIsChecking(false);
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-500 stroke-emerald-500';
        if (score >= 60) return 'text-amber-500 stroke-amber-500';
        return 'text-red-500 stroke-red-500';
    };

    const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

    const handleClear = () => {
        setInputText('');
        setResult(null);
        setRestoredAt(null);
    };

    const handleRestoreSaved = () => {
        setInputText(initialData.inputText);
        setResult(initialData.result);
        setRestoredAt(initialUpdatedAt);
        saveImmediately(initialData);
    };

    const handleClearSaved = () => {
        clearSavedSession();
        setRestoredAt(null);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[1400px] mx-auto h-auto min-h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-8"
        >
            {/* Main Editor Column (70%) */}
            <div className="flex-1 flex flex-col min-w-0">
                
                {/* Editor Header & Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-5 px-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-32 h-32 bg-red-500/5 dark:bg-red-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />
                    
                    {/* Title Area */}
                    <motion.div
                        className="flex items-center gap-4 relative z-10"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                        <motion.div
                            className="flex items-center justify-center w-12 h-12 rounded-[16px] bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/50"
                            whileHover={{ scale: 1.05, rotate: -5 }}
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 9h6v6H9z"/><path d="M9 1v3"/><path d="M15 1v3"/><path d="M9 20v3"/><path d="M15 20v3"/><path d="M20 9h3"/><path d="M20 14h3"/><path d="M1 9h3"/><path d="M1 14h3"/>
                            </svg>
                        </motion.div>
                        
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Plagiarism Checker</h1>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <ToolHeaderBadge icon={Search} label="Similarity" tone="rose" />
                                <ToolHeaderBadge icon={ShieldCheck} label="Basic Free" tone="emerald" />
                                <ToolHeaderBadge label={apiStatus.configured ? 'API Connected' : 'Basic Mode'} tone="violet" />
                                <ToolHeaderBadge
                                    icon={Save}
                                    label={lastSavedAt ? `Saved ${formatToolSessionTime(lastSavedAt)}` : 'Auto-save ready'}
                                    tone="blue"
                                    hideOnSmall
                                />
                            </div>
                            <div className="hidden">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Basic • Free
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                    Pro API Available
                                </span>
                                <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400">
                                    {lastSavedAt ? `Saved ${formatToolSessionTime(lastSavedAt)}` : 'Auto-save ready'}
                                </span>
                            </div>
                            {restoredAt && (
                                <p className="mt-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                    Restored your last scan from {formatToolSessionTime(restoredAt)}.
                                </p>
                            )}
                        </div>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-2 w-full sm:w-auto relative z-10"
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
                                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                </svg>
                                Clear
                            </motion.button>

                            <motion.button
                                layout
                                onClick={checkPlagiarism}
                                disabled={!inputText.trim() || isChecking}
                                className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={{ y: -1, boxShadow: '0 8px 20px rgba(239, 68, 68, 0.35)' }}
                                whileTap={{ scale: 0.97 }}
                            >
                                {isChecking ? (
                                    <>
                                        <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 12a9 9 0 11-6.219-8.56"/>
                                        </svg>
                                        Checking...
                                    </>
                                ) : (
                                    <>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                                        </svg>
                                        Check
                                    </>
                                )}
                            </motion.button>
                        </LayoutGroup>
                    </motion.div>
                </div>

                {/* API Status Banner */}
                <motion.div 
                    className={`mb-6 p-4 rounded-[20px] border flex items-start gap-3 ${
                        apiStatus.configured 
                            ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30' 
                            : 'bg-violet-50/50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800/30'
                    }`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className={`mt-0.5 ${apiStatus.configured ? 'text-emerald-600 dark:text-emerald-400' : 'text-violet-600 dark:text-violet-400'}`}>
                        {apiStatus.configured ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                            </svg>
                        )}
                    </div>
                    <div>
                        <p className={`text-sm font-bold ${apiStatus.configured ? 'text-emerald-800 dark:text-emerald-300' : 'text-violet-800 dark:text-violet-300'}`}>
                            {apiStatus.configured ? 'Copyleaks API Connected' : 'Basic Mode (No API)'}
                        </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {apiStatus.configured 
                                ? `${apiStatus.accountCount} account(s) configured • ${apiStatus.totalScansPerMonth} scans/month available` 
                                : 'Using local similarity checking. Add API keys for professional-grade detection.'}
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                                        Use the score as a revision signal, not a final verdict. High similarity means cite, quote, or rewrite with clearer attribution.
                                    </p>
                                </div>
                            </motion.div>

                {/* Text Input Area (The "Paper") */}
                <motion.div
                    className="flex-1 relative bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm flex flex-col overflow-hidden min-h-[500px]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    {/* Card Header */}
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Your Text</span>
                        <span className="ml-auto text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">
                            {wordCount} words
                        </span>
                    </div>

                    {/* Textarea */}
                    <div className="relative flex-1 w-full h-full">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="absolute inset-0 w-full h-full m-0 p-8 lg:p-10 font-sans text-[17px] leading-[1.8] tracking-normal whitespace-pre-wrap break-words text-left bg-transparent border-none resize-none text-zinc-800 dark:text-zinc-200 focus:ring-0 focus:outline-none z-0 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                            placeholder="Paste your text here to check for plagiarism..."
                            spellCheck={false}
                        />
                    </div>
                </motion.div>
            </div>

            {/* Sidebar Column (30%) */}
            <ToolMobileSheet
                title="Originality Results"
                summary={result ? `${result.uniqueScore}% unique, ${result.score}% similar` : `${wordCount} words ready`}
                actionLabel="Open originality results"
                className="w-full lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)]"
            >
                {/* Results Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-6 relative overflow-hidden flex-1">
                    <AnimatePresence mode="wait">
                        {isChecking ? (
                            <motion.div 
                                key="loading"
                                className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="relative w-16 h-16">
                                    <div className="absolute inset-0 rounded-full border-4 border-zinc-100 dark:border-zinc-800"></div>
                                    <div className="absolute inset-0 rounded-full border-4 border-t-red-500 animate-spin"></div>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Analyzing...</p>
                                    <p className="text-xs text-zinc-400 mt-1">Checking for similarities</p>
                                </div>
                            </motion.div>
                        ) : result ? (
                            <motion.div 
                                key="results" 
                                className="flex flex-col h-full"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                {/* Score Rings */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {/* Unique Score */}
                                    <div className="flex flex-col items-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                                        <div className="relative w-20 h-20 mb-3">
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                <circle cx="18" cy="18" r="16" fill="none" className="stroke-zinc-200 dark:stroke-zinc-700" strokeWidth="3" />
                                                <motion.circle 
                                                    cx="18" cy="18" r="16" fill="none" 
                                                    className={result.uniqueScore >= 80 ? 'stroke-emerald-500' : result.uniqueScore >= 60 ? 'stroke-amber-500' : 'stroke-red-500'}
                                                    strokeWidth="3" 
                                                    strokeLinecap="round"
                                                    strokeDasharray="100"
                                                    initial={{ strokeDashoffset: 100 }}
                                                    animate={{ strokeDashoffset: 100 - result.uniqueScore }}
                                                    transition={{ duration: 1, type: "spring" }}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className={`text-lg font-bold ${getScoreColor(result.uniqueScore).split(' ')[0]}`}>
                                                    <NumberTicker value={result.uniqueScore} className="text-lg" />%
                                                </span>
                                            </div>
                                        </div>
                                            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                            Unique
                                        </span>
                                    </div>

                                    {/* Similarity Score */}
                                    <div className="flex flex-col items-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                                        <div className="relative w-20 h-20 mb-3">
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                <circle cx="18" cy="18" r="16" fill="none" className="stroke-zinc-200 dark:stroke-zinc-700" strokeWidth="3" />
                                                <motion.circle 
                                                    cx="18" cy="18" r="16" fill="none" 
                                                    className="stroke-amber-500"
                                                    strokeWidth="3" 
                                                    strokeLinecap="round"
                                                    strokeDasharray="100"
                                                    initial={{ strokeDashoffset: 100 }}
                                                    animate={{ strokeDashoffset: 100 - result.score }}
                                                    transition={{ duration: 1, type: "spring" }}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-lg font-bold text-amber-500">
                                                    <NumberTicker value={result.score} className="text-lg" />%
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                                            </svg>
                                            Similar
                                            </span>
                                        </div>
                                    </div>

                                <div className="mb-5 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Recommended next step</p>
                                    <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                                        {result.score > 25
                                            ? 'Review highlighted sentences, add citations, and rewrite only after you understand the source idea.'
                                            : 'Originality looks healthy. Still cite any borrowed facts, definitions, or source-specific ideas.'}
                                    </p>
                                </div>

                                {/* Sentence Analysis */}
                                <div className="flex items-center gap-2 mb-3">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                    </svg>
                                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Sentence Analysis</span>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 [scrollbar-width:thin] space-y-2 max-h-[300px]">
                                    {result.sentences.map((s, i) => (
                                        <motion.div 
                                            key={i} 
                                            className={`flex items-start gap-3 p-3 rounded-xl ${
                                                s.similarity > 20 
                                                    ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30' 
                                                    : 'bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800'
                                            }`}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <div 
                                                className={`w-1 h-full min-h-[24px] rounded-full shrink-0 ${
                                                    s.similarity > 20 ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2">{s.text}</p>
                                                {s.source && (
                                                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">{s.source}</p>
                                                )}
                                            </div>
                                            <span className={`text-xs font-bold shrink-0 ${
                                                s.similarity > 20 ? 'text-amber-500' : 'text-emerald-500'
                                            }`}>
                                                {s.similarity}%
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="empty" 
                                className="flex flex-col items-center justify-center h-full min-h-[300px] text-center"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-2xl flex items-center justify-center mb-4">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                                    </svg>
                                </div>
                                <p className="font-bold text-zinc-700 dark:text-zinc-300">Ready to Check</p>
                                <p className="text-xs text-zinc-400 mt-1 px-4">Paste text and click Check to analyze. Drafts and scan results auto-save locally.</p>
                                <div className="mt-4 flex flex-wrap justify-center gap-2">
                                    {['Cite sources', 'Review matches', 'Rewrite ethically'].map((hint) => (
                                        <span key={hint} className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-[11px] font-bold text-red-600 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-300">
                                            {hint}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Quick Stats */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-5">
                    {hasSavedSession && (
                        <button
                            onClick={handleClearSaved}
                            className="mb-4 w-full rounded-xl bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-400 ring-1 ring-zinc-200 hover:text-red-500 dark:bg-zinc-800/50 dark:ring-zinc-800 dark:hover:text-red-400"
                        >
                            Clear saved scan
                        </button>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col items-center justify-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                            <span className="text-lg font-bold text-zinc-700 dark:text-zinc-200">
                                <NumberTicker value={wordCount} className="text-lg" />
                            </span>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Words</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                            <span className="text-lg font-bold text-zinc-700 dark:text-zinc-200">
                                <NumberTicker value={inputText.length} className="text-lg" />
                            </span>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Characters</span>
                        </div>
                    </div>
                </div>
            </ToolMobileSheet>
        </motion.div>
    );
};

export default PlagiarismChecker;
