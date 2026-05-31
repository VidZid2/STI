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
import {
    scanWithGoogleSearch,
    isGoogleSearchConfigured
} from "../../lib/plagiarism/googleSearchService";
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
    const [isTyping, setIsTyping] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [aiModel, setAiModel] = useState('standard');

    useEffect(() => {
        const timer = setTimeout(() => setIsPageLoading(false), 400);
        return () => clearTimeout(timer);
    }, []);
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
        setResult(initialData.result);
        setRestoredAt(initialUpdatedAt);
    }, [initialData, initialUpdatedAt]);

    // Typing indicator effect (matches Paraphraser/TextSummarizer)
    useEffect(() => {
        if (inputText) {
            setIsTyping(true);
            const timeout = setTimeout(() => setIsTyping(false), 150);
            return () => clearTimeout(timeout);
        }
    }, [inputText]);

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
                console.warn('Copyleaks API failed, using fallback check:', apiResult.error);
            } catch (error) {
                console.warn('Copyleaks error, using fallback check:', error);
            }
        }
        
        // Try Google Custom Search API as secondary fallback
        let googleResult = null;
        if (isGoogleSearchConfigured()) {
            try {
                googleResult = await scanWithGoogleSearch(inputText);
                if (!googleResult.success) {
                    console.warn('Google Search API failed:', googleResult.error);
                }
            } catch (error) {
                console.warn('Google Search API error:', error);
            }
        }

        // Local fallback (Deterministic bibliography + repetition overlap check)
        if (!googleResult) {
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
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
        
        if (googleResult && googleResult.success && googleResult.sources) {
            matchedSources.push(...googleResult.sources.map(s => ({
                title: s.title,
                url: s.url,
                percentage: s.similarityScore
            })));
        }

        const analyzedSentences = sentences.map((sentence, index) => {
            let maxSim = 0;
            let matchSource = '';
            let matchType: 'ref' | 'self' | 'google' | 'none' = 'none';
            const cleanSentence = sentence.trim();

            // 0. Check Google Search results
            if (googleResult && googleResult.success) {
                const googleMatch = googleResult.sentenceResults.find(r => 
                    r.sentence === cleanSentence || r.sentence.includes(cleanSentence) || cleanSentence.includes(r.sentence)
                );
                if (googleMatch && googleMatch.similarity > maxSim) {
                    maxSim = googleMatch.similarity / 100; // normalize to 0-1
                    matchSource = googleMatch.source ? `Web Source: ${googleMatch.source}` : 'Web Match';
                    matchType = 'google';
                }
            }

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
                text: cleanSentence,
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
            sources: matchedSources.length > 0 ? matchedSources : undefined,
            isApiResult: !!(googleResult && googleResult.success && googleResult.totalSentencesChecked > 0)
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

    // Loading Skeleton
    if (isPageLoading) {
        return (
            <div className="w-full max-w-[1400px] mx-auto h-auto min-h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-8 p-0 sm:p-0" role="status" aria-busy="true" aria-label="Loading Plagiarism Checker">
                {/* Main Editor Column Skeleton */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header Skeleton */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-5 px-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-4">
                            <div className="skeleton-bone w-12 h-12 rounded-[16px] bg-zinc-200 dark:bg-zinc-800" />
                            <div className="flex flex-col gap-2 skeleton-stagger">
                                <div className="skeleton-bone w-48 h-6 rounded-md bg-zinc-200 dark:bg-zinc-800" />
                                <div className="flex gap-2">
                                    <div className="skeleton-bone w-24 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800/50" />
                                    <div className="skeleton-bone w-32 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800/50" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="skeleton-bone w-20 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 hidden sm:block" />
                            <div className="skeleton-bone w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2 hidden sm:block" />
                            <div className="skeleton-bone w-24 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 hidden sm:block" />
                            <div className="skeleton-bone w-24 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                        </div>
                    </div>

                    {/* API Status Banner Skeleton */}
                    <div className="mb-6 p-4 rounded-[20px] border bg-zinc-50 dark:bg-zinc-800/20 border-zinc-200 dark:border-zinc-800/30 flex items-start gap-3">
                        <div className="skeleton-bone w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 mt-0.5" />
                        <div className="flex flex-col gap-2 w-full skeleton-stagger">
                            <div className="skeleton-bone w-48 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            <div className="skeleton-bone w-3/4 h-3 bg-zinc-100 dark:bg-zinc-800/50 rounded mt-1" />
                            <div className="skeleton-bone w-full h-3 bg-zinc-100 dark:bg-zinc-800/50 rounded mt-2" />
                        </div>
                    </div>

                    {/* Text Area Skeleton */}
                    <div className="flex-1 relative bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm flex flex-col overflow-hidden min-h-[500px]">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="skeleton-bone w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                            <div className="skeleton-bone w-24 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            <div className="skeleton-bone w-16 h-6 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg ml-auto" />
                        </div>
                        <div className="flex-1 p-8 lg:p-10 flex flex-col gap-4 skeleton-stagger">
                            <div className="skeleton-bone w-full h-4 rounded bg-zinc-100 dark:bg-zinc-800/50" />
                            <div className="skeleton-bone w-11/12 h-4 rounded bg-zinc-100 dark:bg-zinc-800/50" />
                            <div className="skeleton-bone w-10/12 h-4 rounded bg-zinc-100 dark:bg-zinc-800/50" />
                            <div className="skeleton-bone w-4/5 h-4 rounded bg-zinc-100 dark:bg-zinc-800/50" />
                        </div>
                    </div>
                </div>

                {/* Sidebar Column Skeleton */}
                <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)]">
                    {/* Results Card Skeleton */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-6 relative overflow-hidden flex-1 min-h-[300px] flex flex-col justify-center items-center gap-4">
                        <div className="skeleton-bone w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                        <div className="skeleton-bone w-32 h-5 bg-zinc-200 dark:bg-zinc-800 rounded" />
                        <div className="skeleton-bone w-48 h-3 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
                    </div>

                    {/* Quick Stats Skeleton */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-5">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col items-center justify-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                <div className="skeleton-bone w-12 h-6 bg-zinc-200 dark:bg-zinc-800 rounded mb-1" />
                                <div className="skeleton-bone w-16 h-3 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
                            </div>
                            <div className="flex flex-col items-center justify-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                <div className="skeleton-bone w-12 h-6 bg-zinc-200 dark:bg-zinc-800 rounded mb-1" />
                                <div className="skeleton-bone w-16 h-3 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
                            </div>
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
            className="w-full max-w-[1400px] mx-auto h-auto min-h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-8"
        >
            {/* Main Editor Column (70%) */}
            <div className="flex-1 flex flex-col min-w-0 self-stretch">
                
                {/* Editor Header & Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-6 lg:p-7 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:border-red-200/80 dark:hover:border-red-800/50">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-red-500/10 dark:bg-red-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 bg-red-500/10 dark:bg-red-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                    
                    {/* Title Area */}
                    <motion.div
                        className="flex items-center gap-5 relative z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                        <motion.div
                            className="flex items-center justify-center w-16 h-16 rounded-[20px] bg-red-50 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20 text-red-600 dark:text-red-400 shadow-sm flex-shrink-0"
                            whileHover={{ scale: 1.05, rotate: -5 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 9h6v6H9z"/><path d="M9 1v3"/><path d="M15 1v3"/><path d="M9 20v3"/><path d="M15 20v3"/><path d="M20 9h3"/><path d="M20 14h3"/><path d="M1 9h3"/><path d="M1 14h3"/>
                            </svg>
                        </motion.div>
                        
                        <div className="flex flex-col">
                            <h1 className="text-[22px] sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Plagiarism Checker</h1>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <ToolHeaderBadge icon={Search} label="Similarity" tone="rose" />
                                <ToolHeaderBadge icon={ShieldCheck} label="Basic Free" tone="emerald" />
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-2 w-full sm:w-auto relative z-10"
                    >
                        <LayoutGroup>
                            <motion.button
                                layout
                                onClick={onBack}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-zinc-700 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
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

                            <motion.div layout transition={{ layout: { type: "spring", bounce: 0.2, duration: 0.6 } }} className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2 hidden sm:block"></motion.div>
                            {hasSavedSession && (
                                <motion.button
                                    layout
                                    onClick={handleRestoreSaved}
                                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.97 }}
                                    transition={{ layout: { type: "spring", bounce: 0.2, duration: 0.6 } }}
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
                                transition={{ layout: { type: "spring", bounce: 0.2, duration: 0.6 } }}
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
                                transition={{ layout: { type: "spring", bounce: 0.2, duration: 0.6 } }}
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
                    className="mb-6 relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-6 lg:p-7 flex items-center gap-5 group transition-all duration-300 hover:shadow-md hover:border-red-200/80 dark:hover:border-red-800/50"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
                >
                    {/* Background Accents based on status */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-red-500/10 dark:bg-red-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 bg-red-500/10 dark:bg-red-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

                    {/* Icon Container */}
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: -5 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        className="w-16 h-16 rounded-[20px] flex items-center justify-center flex-shrink-0 shadow-sm relative z-10 bg-red-50 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20 text-red-600 dark:text-red-400"
                    >
                        {apiStatus.configured ? (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                        ) : (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                            </svg>
                        )}
                    </motion.div>

                    {/* Content */}
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-[22px] sm:text-2xl font-bold tracking-tight text-red-900 dark:text-red-100">
                                {apiStatus.configured ? 'Copyleaks API Connected' : 'Basic Mode (No API)'}
                            </h2>
                        </div>
                        <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
                            {apiStatus.configured 
                                ? `${apiStatus.accountCount} account(s) configured • ${apiStatus.totalScansPerMonth} scans/month available` 
                                : 'Using local similarity checking. Add API keys for professional-grade detection.'}
                        </p>
                        <p className="text-[13px] text-zinc-500 dark:text-zinc-500 mt-1.5 font-medium">
                            Use the score as a revision signal, not a final verdict. High similarity means cite, quote, or rewrite with clearer attribution.
                        </p>
                    </div>
                </motion.div>

                {/* Text Input Area (The "Paper") */}
                <motion.div
                    className="flex-1 relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[24px] shadow-md hover:shadow-lg overflow-hidden min-h-[500px] focus-within:border-red-400 dark:focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10 dark:focus-within:ring-red-500/10 transition-all duration-300 flex flex-col group"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    {/* Subtle top indicator for typing */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0 opacity-0 transition-opacity duration-300" style={{ opacity: isTyping ? 1 : 0 }} />

                    {/* Card Header (Matches TextSummarizer) */}
                    <div className="border-b border-zinc-100 dark:border-zinc-800 overflow-x-auto [scrollbar-width:none]">
                        <div className="flex items-center justify-between min-w-full w-max px-6 py-4">
                            {/* Title moved to left */}
                            <div className="flex items-center gap-3 shrink-0 pr-6">
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                    transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                                    className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-red-50/80 dark:bg-red-900/30 border border-red-200 shadow-sm ring-4 ring-white/50 dark:border-red-800/60 dark:ring-zinc-900/50 text-red-600 dark:text-red-400"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                                    </svg>
                                </motion.div>
                                <span className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight shrink-0 whitespace-nowrap">Original Document</span>
                            </div>
                            
                            <div className="flex items-center gap-4 shrink-0">
                                <span className="whitespace-nowrap text-[11px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100/80 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
                                    {wordCount} words
                                </span>

                                {hasSavedSession && (
                                  <button
                                    onClick={clearSavedSession}
                                    className="whitespace-nowrap text-[11px] font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 px-3 py-1.5 rounded-lg border border-rose-200/50 dark:border-rose-800/50 transition-colors shrink-0"
                                  >
                                    Clear saved
                                  </button>
                                )}
                            </div>
                        </div>
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
                className="w-full lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col gap-6"
            >
                {/* Results Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-6 lg:p-7 relative overflow-hidden flex-1 group transition-all duration-300 hover:shadow-md hover:border-red-200/80 dark:hover:border-red-800/50">
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
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
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
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
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
                                className="flex flex-col items-start justify-start h-full text-left relative group w-full"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                            >
                                {/* Background Accents */}
                                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-red-500/10 dark:bg-red-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 bg-red-500/10 dark:bg-red-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

                                <div className="relative z-10 w-full flex flex-col gap-2">
                                    <div className="flex items-center gap-5 w-full mb-6">
                                        <motion.div
                                            whileHover={{ scale: 1.05, rotate: -5 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                            className="w-16 h-16 rounded-[20px] bg-red-50 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20 flex items-center justify-center flex-shrink-0 shadow-sm"
                                        >
                                            <Search width="28" height="28" className="text-red-600 dark:text-red-400" strokeWidth={2.5} />
                                        </motion.div>
                                        
                                        <div>
                                            <h2 className="text-[22px] sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-1">
                                                Ready to Check
                                            </h2>
                                            <p className="text-[13px] sm:text-[14px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                                                Paste text and click Check to analyze.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 mt-1 w-full pr-1">
                                        <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-[20px] bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 shadow-sm transition-colors hover:border-red-300 dark:hover:border-red-700 group/item cursor-default w-full">
                                            <div className="w-10 h-10 rounded-[14px] bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 dark:text-red-400">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M10 14h4"/><polyline points="12 12 14 14 12 16"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">Step 1</p>
                                                <p className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 leading-none">Cite sources</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-[20px] bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 shadow-sm transition-colors hover:border-blue-300 dark:hover:border-blue-700 group/item cursor-default w-full">
                                            <div className="w-10 h-10 rounded-[14px] bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 dark:text-blue-400">
                                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">Step 2</p>
                                                <p className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 leading-none">Review matches</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-[20px] bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 shadow-sm transition-colors hover:border-emerald-300 dark:hover:border-emerald-700 group/item cursor-default w-full">
                                            <div className="w-10 h-10 rounded-[14px] bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 dark:text-emerald-400">
                                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">Step 3</p>
                                                <p className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 leading-none">Rewrite ethically</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Document Stats */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-6 lg:p-7 relative overflow-hidden shrink-0 group transition-all duration-300 hover:shadow-md hover:border-red-200/80 dark:hover:border-red-800/50">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-red-500/10 dark:bg-red-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 bg-red-500/10 dark:bg-red-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                    
                    <div className="flex flex-col gap-2 relative z-10">
                        {/* Header Row */}
                        <div className="flex items-center gap-5 w-full mb-6">
                            <motion.div
                                whileHover={{ scale: 1.05, rotate: -5 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                className="w-16 h-16 rounded-[20px] bg-red-50 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20 flex items-center justify-center flex-shrink-0 shadow-sm"
                            >
                                <svg width="28" height="28" className="text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h7"/>
                                </svg>
                            </motion.div>
                            
                            <div>
                                <h2 className="text-[22px] sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-1">
                                    Document Stats
                                </h2>
                                <p className="text-[13px] sm:text-[14px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                                    Real-time length metrics
                                </p>
                            </div>
                        </div>

                        {hasSavedSession && (
                            <button
                                onClick={handleClearSaved}
                                className="w-full rounded-xl bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-400 ring-1 ring-zinc-200 hover:text-red-500 dark:bg-zinc-800/50 dark:ring-zinc-800 dark:hover:text-red-400 transition-colors"
                            >
                                Clear saved scan
                            </button>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 p-3 pr-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm transition-colors hover:border-red-300 dark:hover:border-red-700 group/stat">
                                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14,2 14,8 20,8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                        <polyline points="10,9 9,9 8,9" />
                                    </svg>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">Words</span>
                                    <span className="text-lg font-black text-zinc-900 dark:text-zinc-100 leading-none"><NumberTicker value={wordCount} /></span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 pr-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm transition-colors hover:border-red-300 dark:hover:border-red-700 group/stat">
                                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400">
                                        <polyline points="4,7 4,4 20,4 20,7" />
                                        <line x1="9" y1="20" x2="15" y2="20" />
                                        <line x1="12" y1="4" x2="12" y2="20" />
                                    </svg>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">Characters</span>
                                    <span className="text-lg font-black text-zinc-900 dark:text-zinc-100 leading-none"><NumberTicker value={inputText.length} /></span>
                                </div>
                            </div>
                        </div>

                        {/* AI Model Selector */}
                        <div className="flex flex-col gap-2.5 mt-2">
                            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Detection Engine</span>
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={() => setAiModel('standard')}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                        aiModel === 'standard' 
                                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/60 ring-2 ring-red-500/20' 
                                            : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:border-red-300 dark:hover:border-red-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${aiModel === 'standard' ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'bg-zinc-200/50 dark:bg-zinc-700/50'}`}>
                                            <Search className={`w-4 h-4 ${aiModel === 'standard' ? 'text-red-600 dark:text-red-400' : 'text-zinc-500'}`} />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className={`text-sm font-bold leading-tight ${aiModel === 'standard' ? 'text-red-900 dark:text-red-100' : 'text-zinc-700 dark:text-zinc-300'}`}>Standard Scan</span>
                                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Fast internet database check</span>
                                        </div>
                                    </div>
                                    {aiModel === 'standard' && (
                                        <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                        </div>
                                    )}
                                </button>

                                <button 
                                    onClick={() => setAiModel('deep')}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                        aiModel === 'deep' 
                                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/60 ring-2 ring-red-500/20' 
                                            : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:border-red-300 dark:hover:border-red-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${aiModel === 'deep' ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'bg-zinc-200/50 dark:bg-zinc-700/50'}`}>
                                            <ShieldCheck className={`w-4 h-4 ${aiModel === 'deep' ? 'text-red-600 dark:text-red-400' : 'text-zinc-500'}`} />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className={`text-sm font-bold leading-tight ${aiModel === 'deep' ? 'text-red-900 dark:text-red-100' : 'text-zinc-700 dark:text-zinc-300'}`}>Deep AI Analysis</span>
                                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Detects LLM & AI generated text</span>
                                        </div>
                                    </div>
                                    {aiModel === 'deep' && (
                                        <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </ToolMobileSheet>
        </motion.div>
    );
};

export default PlagiarismChecker;
