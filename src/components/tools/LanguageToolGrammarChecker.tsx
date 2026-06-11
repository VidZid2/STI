/**
 * LanguageTool Grammar Checker Component
 * Free grammar checking - no API key required!
 * 
 * Features:
 * - Real-time grammar checking with LanguageTool API
 * - Color-coded underlines (Red: errors, Yellow: improvements, Blue: punctuation)
 * - Hover dropdown with suggestions
 * - One-click fix buttons
 * - Minimalistic, professional design
 */

import * as React from "react";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { Save, FileSpreadsheet, Trash2 } from "lucide-react";
import {
    checkGrammar,
    getLanguageToolStatus,
    applyFix,
    type GrammarIssue
} from "../../lib/converters/languageToolService";
import { NumberTicker } from "@/components/ui/number-ticker";
import { formatToolSessionTime, useToolSession } from "./useToolSession";
import { ToolHeaderBadge, ToolHeaderLiveBadge } from "./ToolHeaderBadges";
import ToolMobileSheet from "./ToolMobileSheet";
import { exportToDocx, downloadBlob } from "../../lib/export/docxExport";

interface LanguageToolGrammarCheckerProps {
    onBack: () => void;
    initialText?: string;
}

const SAMPLE_TEXT = `This sentense is have a very bad spelling error. I has went to the store yesterday to buy some grocerys. Its a beautifull day, isnt it? Their going to they're house over there. Your the best person I know, and you're help is appreciated.`;

interface GrammarCheckerSession {
    text: string;
    issues: GrammarIssue[];
}

const EMPTY_GRAMMAR_SESSION: GrammarCheckerSession = {
    text: "",
    issues: [],
};

const shouldPersistGrammarSession = (session: GrammarCheckerSession) =>
    (Boolean(session.text.trim()) && session.text !== SAMPLE_TEXT) || session.issues.length > 0;

const LanguageToolGrammarChecker: React.FC<LanguageToolGrammarCheckerProps> = ({
    onBack,
    initialText = ""
}) => {
    // Text state
    const [text, setText] = useState(initialText || SAMPLE_TEXT);
    const [isPageLoading, setIsPageLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsPageLoading(false), 400);
        return () => clearTimeout(timer);
    }, []);


    // Analysis state
    const [issues, setIssues] = useState<GrammarIssue[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // UI state
    const [apiStatus, setApiStatus] = useState(getLanguageToolStatus());

    const containerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const currentSession = useMemo<GrammarCheckerSession>(() => ({
        text,
        issues,
    }), [issues, text]);
    const {
        initialData,
        hasSavedSession,
        lastSavedAt,
        clearSavedSession,
        saveImmediately,
    } = useToolSession('grammar-checker', currentSession, {
        emptySession: EMPTY_GRAMMAR_SESSION,
        shouldPersist: shouldPersistGrammarSession,
    });

    useEffect(() => {
        if (initialText) return;
        if (!shouldPersistGrammarSession(initialData)) return;

        setText(initialData.text);
        setIssues(initialData.issues);
    }, [initialData, initialText]);

    // Typing indicator effect (matches Paraphraser/TextSummarizer)
    useEffect(() => {
        if (text) {
            setIsTyping(true);
            const timeout = setTimeout(() => setIsTyping(false), 150);
            return () => clearTimeout(timeout);
        }
    }, [text]);

    // Update API status periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setApiStatus(getLanguageToolStatus());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Perform analysis
    const performAnalysis = useCallback(async () => {
        if (!text.trim()) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            const result = await checkGrammar(text);
            setIssues(result);
        } catch (err: unknown) {
            console.error("Analysis failed", err);
            setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
        } finally {
            setIsAnalyzing(false);
            setApiStatus(getLanguageToolStatus());
        }
    }, [text]);



    // Handle clear
    const handleClear = useCallback(() => {
        setText("");
        setIssues([]);
        setError(null);
    }, []);

    // Export corrected text to DOCX
    const handleExportDocx = useCallback(async () => {
        if (!text.trim()) return;
        try {
            const blob = await exportToDocx({
                title: 'Grammar Check Results',
                content: text,
                metadata: {
                    author: 'STI eLMS Grammar Checker',
                    createdAt: new Date(),
                },
            });
            downloadBlob(blob, `grammar_check_${new Date().toISOString().split('T')[0]}.docx`);
        } catch (err) {
            console.error('DOCX export failed:', err);
        }
    }, [text]);

    const handleRestoreSaved = useCallback(() => {
        setText(initialData.text);
        setIssues(initialData.issues);
        setError(null);
        saveImmediately(initialData);
    }, [initialData, saveImmediately]);

    const handleClearSaved = useCallback(() => {
        clearSavedSession();
    }, [clearSavedSession]);

    // Handle apply fix
    const handleApplyFix = useCallback((issue: GrammarIssue, replacement: string) => {
        const newText = applyFix(text, issue, replacement);
        setText(newText);

        // Recalculate offsets for remaining issues
        const offsetDiff = replacement.length - issue.length;
        setIssues(prev => prev
            .filter(i => i.id !== issue.id)
            .map(i => i.offset > issue.offset
                ? { ...i, offset: i.offset + offsetDiff }
                : i
            )
        );
    }, [text]);

    // Handle dismiss
    const handleDismiss = useCallback((issue: GrammarIssue) => {
        setIssues(prev => prev.filter(i => i.id !== issue.id));
    }, []);

    // Fix all issues
    const handleFixAll = useCallback(() => {
        if (issues.length === 0) return;

        let newText = text;
        let offsetAdjustment = 0;

        // Sort by offset and apply fixes
        const sortedIssues = [...issues].sort((a, b) => a.offset - b.offset);

        sortedIssues.forEach(issue => {
            if (issue.replacements.length > 0) {
                const replacement = issue.replacements[0];
                const adjustedOffset = issue.offset + offsetAdjustment;
                newText = newText.slice(0, adjustedOffset) + replacement + newText.slice(adjustedOffset + issue.length);
                offsetAdjustment += replacement.length - issue.length;
            }
        });

        setText(newText);
        setIssues([]);
    }, [text, issues]);

    // Sync scrolling
    const handleScroll = useCallback(() => {
        // Scroll sync no longer needed as overlay is removed
    }, []);

    useEffect(() => {
        // Hook kept for future use if needed
    }, [text, issues]);





    // Calculate stats
    const stats = useMemo(() => {
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
        const readingTime = Math.ceil(words / 200);

        return { words, chars, sentences, readingTime };
    }, [text]);

    // Calculate quality score
    const qualityScore = useMemo(() => {
        if (!text.trim() && issues.length === 0) return 100;
        const baseScore = 100;
        const deduction = issues.length * 5; // Deduct 5 points per issue
        return Math.max(0, baseScore - deduction);
    }, [issues.length, text]);

    // Helper to extract a context snippet for the issue card
    const getIssueContext = (issue: GrammarIssue) => {
        const contextStart = Math.max(0, issue.offset - 15);
        const contextEnd = Math.min(text.length, issue.offset + issue.length + 15);
        const prefix = text.substring(contextStart, issue.offset);
        const problematic = text.substring(issue.offset, issue.offset + issue.length);
        const suffix = text.substring(issue.offset + issue.length, contextEnd);
        
        return {
            prefix: (contextStart > 0 ? "..." : "") + prefix,
            problematic,
            suffix: suffix + (contextEnd < text.length ? "..." : "")
        };
    };

    const getIssueLesson = (issue: GrammarIssue) => {
        const ruleId = issue.ruleId || '';
        
        // 1. Dynamic checks for common student pitfalls (APA/MLA guidelines)
        if (ruleId.includes('EN_A_VS_AN')) {
            return "Use 'a' before consonant sounds (e.g., 'a college') and 'an' before vowel sounds (e.g., 'an eLMS'). This preserves correct English pronunciation flow.";
        }
        if (ruleId.includes('ITS_IT_S')) {
            return "'Its' is possessive (e.g., 'its layout'). 'It's' is a contraction of 'it is' (e.g., 'it's ready'). In academic writing, avoid contractions and spell them out.";
        }
        if (ruleId.includes('THERE_THEIR_THEY_RE') || ruleId.includes('THEIR_THERE_THEY_RE')) {
            return "'Their' is possessive (belonging to them), 'there' refers to place/existence, and 'they're' is 'they are'. Confusing these homophones severely impacts professional trust.";
        }
        if (ruleId.includes('YOUR_YOU_RE')) {
            return "'Your' is possessive (e.g., 'your grades'), while 'you're' is a contraction of 'you are'. Double check pronoun usage for logical alignment.";
        }
        if (ruleId.includes('SUBJECT_VERB_AGREEMENT') || ruleId.includes('SVA')) {
            return "A singular subject requires a singular verb, and a plural subject requires a plural verb. Plural subjects with singular verbs disrupt structural symmetry.";
        }
        if (ruleId.includes('COMMA') || ruleId.includes('PUNCTUATION')) {
            return "Punctuation indicates structural pauses and separates introductory clauses. Precision in comma placement clarifies sentence transitions and list groupings.";
        }
        
        // 2. Fallback to using the rule description returned by LanguageTool
        if (issue.ruleDescription && issue.ruleDescription.length > 5) {
            return `${issue.ruleDescription}. ${issue.message}`;
        }
        
        if (issue.category === 'error') {
            return `Spelling or structural correction: ${issue.message}`;
        }
        
        return `Stylistic suggestion: ${issue.message}`;
    };

    // Loading Skeleton
    if (isPageLoading) {
        return (
            <div className="w-full max-w-[1400px] mx-auto h-auto min-h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-8 p-0 sm:p-0" role="status" aria-busy="true" aria-label="Loading Grammar Checker">
                {/* Main Editor Column Skeleton */}
                <div className="flex-1 flex flex-col min-w-0">
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
                            <div className="skeleton-bone w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2 hidden sm:block" />
                            <div className="skeleton-bone w-20 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 hidden sm:block" />
                            <div className="skeleton-bone w-20 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/50" />
                            <div className="skeleton-bone w-24 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                        </div>
                    </div>

                    {/* Text Area Skeleton */}
                    <div className="flex-1 relative bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm flex flex-col overflow-hidden min-h-[500px] p-8 lg:p-10 gap-4 skeleton-stagger">
                        <div className="skeleton-bone w-full h-4 rounded bg-zinc-100 dark:bg-zinc-800/50" />
                        <div className="skeleton-bone w-11/12 h-4 rounded bg-zinc-100 dark:bg-zinc-800/50" />
                        <div className="skeleton-bone w-10/12 h-4 rounded bg-zinc-100 dark:bg-zinc-800/50" />
                        <div className="skeleton-bone w-4/5 h-4 rounded bg-zinc-100 dark:bg-zinc-800/50" />
                    </div>
                </div>

                {/* Sidebar Column Skeleton */}
                <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)]">
                    {/* Quality Score Header */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-6 relative overflow-hidden flex items-center justify-between">
                        <div className="flex flex-col gap-2 skeleton-stagger">
                            <div className="skeleton-bone w-24 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            <div className="skeleton-bone w-16 h-8 bg-zinc-200 dark:bg-zinc-800 rounded" />
                        </div>
                        <div className="skeleton-bone w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800/50 hidden sm:block" />
                    </div>
                    
                    {/* Scrollable Issue Cards */}
                    <div className="flex-1 flex flex-col gap-4 min-h-[300px]">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[20px] shadow-sm h-32 p-4 flex flex-col gap-3 skeleton-stagger">
                                <div className="skeleton-bone w-20 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
                                <div className="skeleton-bone w-full h-4 rounded bg-zinc-100 dark:bg-zinc-800/50" />
                                <div className="skeleton-bone w-3/4 h-4 rounded bg-zinc-100 dark:bg-zinc-800/50" />
                            </div>
                        ))}
                    </div>

                    {/* Statistics Grid */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-5 h-[100px] flex items-center justify-center gap-4">
                        <div className="skeleton-bone flex-1 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800/50" />
                        <div className="skeleton-bone flex-1 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800/50" />
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
        <div className="mt-[72px] sm:mt-0 flex flex-row justify-between items-center gap-4 mb-6 p-5 px-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:border-green-200/80 dark:hover:border-green-800/50">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-green-500/10 dark:bg-green-500/5 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-700" aria-hidden="true" />
          
          {/* Title Area */}
          <motion.div
            className="flex items-center gap-4 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <motion.div
              className="flex items-center justify-center w-12 h-12 rounded-[16px] bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 shadow-sm ring-4 ring-white/50 dark:ring-zinc-900/50"
              whileHover={{ scale: 1.05, rotate: -5 }}
              transition={{ type: 'spring', damping: 20, stiffness: 350 }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </motion.div>
            
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight whitespace-nowrap">Grammar Checker</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <ToolHeaderLiveBadge label={`System ${apiStatus.canRequest ? 'Online' : 'Limited'}`} isOnline={apiStatus.canRequest} />
                <ToolHeaderBadge
                  icon={Save}
                  label={lastSavedAt ? `Saved ${formatToolSessionTime(lastSavedAt)}` : 'Auto-save ready'}
                  tone="blue"
                  hideOnSmall
                />
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <LayoutGroup>
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-nowrap items-center gap-1.5 sm:gap-2 w-auto shrink-0 relative z-10 overflow-x-auto [scrollbar-width:none]"
            >
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

              <AnimatePresence mode="popLayout">
                  {issues.length > 0 && (
                      <motion.button
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={handleFixAll}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ layout: { type: "spring", bounce: 0.2, duration: 0.6 } }}
                      >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M15 4V2" />
                              <path d="M15 16v-2" />
                              <path d="M8 9h2" />
                              <path d="M20 9h2" />
                              <path d="M17.8 11.8L19 13" />
                              <path d="M15 9h0" />
                              <path d="M17.8 6.2L19 5" />
                              <path d="M3 21l9-9" />
                              <path d="M12.2 6.2L11 5" />
                          </svg>
                          Fix All
                          <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-md ml-1">{issues.length}</span>
                      </motion.button>
                  )}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        </div>

        {/* Text Area (The "Paper") */}
        <motion.div
          className="flex-1 relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[24px] shadow-md hover:shadow-lg overflow-hidden min-h-[500px] focus-within:border-emerald-400 dark:focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 dark:focus-within:ring-emerald-500/10 transition-all duration-300 flex flex-col group"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Subtle top indicator for typing */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0 opacity-0 transition-opacity duration-300" style={{ opacity: isTyping ? 1 : 0 }} />
          
              {/* Inner Header Row (Like Paraphraser) */}
              <div className="border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full px-4 py-3 sm:px-6 sm:py-4 gap-3 sm:gap-4">
                      <div className="flex items-center justify-start w-auto gap-3 shrink-0">
                          <motion.div
                          whileHover={{ scale: 1.05, rotate: -5 }}
                          transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                          className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50/80 dark:bg-emerald-900/30 border border-emerald-200 shadow-sm ring-4 ring-white/50 dark:border-emerald-800/60 dark:ring-zinc-900/50 text-emerald-600 dark:text-emerald-400"
                      >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                      </motion.div>
                      <div className="flex items-center gap-2.5">
                          <span className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight shrink-0 whitespace-nowrap">Text Editor</span>
                          {/* Mobile Words Badge */}
                          <span className="flex sm:hidden text-[10.5px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100/80 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
                              {stats.words} words
                          </span>
                      </div>
                      
                      {/* Desktop Words Badge */}
                      <span className="hidden sm:flex text-[11px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100/80 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
                          {stats.words} words
                      </span>
                  </div>


                  
                  {/* Action Buttons on right (Desktop) */}
                  <div className="hidden sm:flex items-center w-auto justify-end gap-3 shrink-0">
                      {/* Desktop Restore/Clear */}
                      {hasSavedSession && (
                          <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-zinc-100 dark:border-zinc-800/60">
                              <button
                                onClick={handleRestoreSaved}
                                className="flex whitespace-nowrap text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-200/50 dark:border-blue-800/50 transition-colors shrink-0"
                              >
                                Restore
                              </button>
                              <button
                                onClick={handleClearSaved}
                                className="flex whitespace-nowrap text-[11px] font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 px-3 py-1.5 rounded-lg border border-rose-200/50 dark:border-rose-800/50 transition-colors shrink-0"
                              >
                                Clear
                              </button>
                          </div>
                      )}
                      <button
                          type="button"
                          onClick={handleExportDocx}
                          disabled={!text.trim()}
                          className="flex items-center justify-center w-[46px] h-[46px] rounded-[16px] bg-[#f4f5f7] text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Export as Word document"
                      >
                          <FileSpreadsheet className="w-[18px] h-[18px] shrink-0" />
                      </button>
                      <button
                          type="button"
                          onClick={handleClear}
                          disabled={!text}
                          className="flex items-center justify-center w-[46px] h-[46px] rounded-[16px] bg-[#fff0f0] text-red-500 transition-colors hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <Trash2 className="w-[18px] h-[18px] shrink-0" />
                      </button>
                      <button
                          type="button"
                          onClick={performAnalysis}
                          disabled={isAnalyzing || !text.trim() || !apiStatus.canRequest}
                          className="flex items-center justify-center gap-2 rounded-[16px] bg-blue-600 hover:bg-blue-700 px-5 h-[46px] text-[15px] font-bold text-white transition-all duration-300 shadow-sm hover:shadow-[0_8px_20px_rgba(37,99,235,0.35)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
                      >
                          {isAnalyzing ? (
                              <>
                                  <svg className="animate-spin w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                                  </svg>
                                  <span className="whitespace-nowrap tracking-tight">Analyzing...</span>
                              </>
                          ) : 'Check'}
                      </button>
                  </div>
              </div>
          </div>

          {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 px-6 text-sm font-semibold flex justify-between items-center border-b border-red-100 dark:border-red-900/30">
                  <span>{error}</span>
                  <button onClick={() => setError(null)}>×</button>
              </div>
          )}

          <div ref={containerRef} className="relative flex-1 w-full h-full flex flex-col">


              <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onScroll={handleScroll}
                  className="flex-1 w-full h-full p-6 lg:p-8 font-sans text-[15px] sm:text-[17px] leading-[1.8] tracking-normal whitespace-pre-wrap break-words text-left bg-transparent border-none resize-none text-zinc-800 dark:text-zinc-200 focus:ring-0 focus:outline-none z-0 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 [scrollbar-width:thin]"
                  placeholder="Type or paste your text here to check grammar..."
                  spellCheck={false}
              />
          </div>

          {/* Action Footer (Mobile) */}
          <div className="flex sm:hidden bg-zinc-50/50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-zinc-800 px-4 py-4 items-center justify-between gap-3 relative z-10">
              <button
                  type="button"
                  onClick={handleExportDocx}
                  disabled={!text.trim()}
                  className="flex items-center justify-center shrink-0 w-[46px] h-[46px] rounded-[16px] bg-[#f4f5f7] text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <FileSpreadsheet className="w-[18px] h-[18px] shrink-0" />
              </button>
              <button
                  type="button"
                  onClick={handleClear}
                  disabled={!text}
                  className="flex items-center justify-center shrink-0 w-[46px] h-[46px] rounded-[16px] bg-[#fff0f0] text-red-500 transition-colors hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <Trash2 className="w-[18px] h-[18px] shrink-0" />
              </button>
              <button
                  type="button"
                  onClick={performAnalysis}
                  disabled={isAnalyzing || !text.trim() || !apiStatus.canRequest}
                  className="flex-1 flex items-center justify-center gap-2 rounded-[16px] bg-blue-600 hover:bg-blue-700 h-[46px] text-[15px] font-bold text-white transition-all duration-300 shadow-sm hover:shadow-[0_8px_20px_rgba(37,99,235,0.35)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
              >
                  {isAnalyzing ? (
                      <>
                          <svg className="animate-spin w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 12a9 9 0 11-6.219-8.56"/>
                          </svg>
                          <span className="whitespace-nowrap tracking-tight">Analyzing...</span>
                      </>
                  ) : 'Check'}
              </button>
          </div>
        </motion.div>
      </div>

      {/* Sidebar Column (30%) */}
      <ToolMobileSheet
        title="Grammar Insights"
        summary={`${issues.length} ${issues.length === 1 ? 'issue' : 'issues'}, ${qualityScore}/100 score`}
        actionLabel="Open grammar insights"
        className="w-full h-full lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col gap-6"
      >
        
        {/* Quality Score - Premium Container */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-5 md:p-6 relative overflow-hidden group shrink-0 transition-all duration-300 hover:shadow-md hover:border-green-200/80 dark:hover:border-green-800/50">
            {/* SaaS Background Accents */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-green-500/10 dark:bg-green-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
            
            <div className="flex flex-col gap-5 relative z-10">
                {/* Header Row: Exact Paraphraser Pattern */}
                <div className="flex items-center gap-4">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: -5 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                        className={`w-14 h-14 rounded-[16px] flex items-center justify-center flex-shrink-0 shadow-sm ring-4 ring-white/50 dark:ring-zinc-900/50 ${qualityScore >= 90 ? 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800/60' : qualityScore >= 70 ? 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800/60' : 'bg-red-50 border border-red-200 dark:bg-red-900/30 dark:border-red-800/60'}`}
                    >
                        {/* Static Premium Icon */}
                        {qualityScore >= 90 ? (
                            <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            </svg>
                        ) : qualityScore >= 70 ? (
                            <svg className="w-7 h-7 text-yellow-600 dark:text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                        ) : (
                            <svg className="w-7 h-7 text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                        )}
                    </motion.div>

                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-0.5">
                            Quality Score
                        </h2>
                        <p className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400 leading-tight">
                            Overall grammar accuracy
                        </p>
                    </div>
                </div>

                {/* Inner Data Module: Exact Paraphraser Pattern */}
                <div className="flex items-center justify-between p-4 px-5 bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-700/80 rounded-[20px] shadow-sm">
                    <div className="flex flex-col">
                        <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                            Score Result
                        </span>
                        <div className="flex items-baseline gap-1">
                            <NumberTicker value={qualityScore} className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-none" />
                            <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">/ 100</span>
                        </div>
                    </div>
                    
                    {/* The Circular Progress Bar */}
                    <div className="relative w-14 h-14">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="16" fill="none" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="3.5" />
                            <motion.circle 
                                cx="18" cy="18" r="16" fill="none" 
                                className={`stroke-current ${qualityScore >= 90 ? 'text-emerald-500' : qualityScore >= 70 ? 'text-yellow-500' : 'text-red-500'}`}
                                strokeWidth="3.5" strokeDasharray="100" 
                                initial={{ strokeDashoffset: 100 }}
                                animate={{ strokeDashoffset: 100 - qualityScore }}
                                transition={{ duration: 1, type: "spring" }}
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        {/* Scrollable Issue Cards */}
        <div className="flex-1 overflow-y-auto pb-4 [scrollbar-width:thin] flex flex-col gap-4 min-h-[300px]">
            <AnimatePresence mode="popLayout">
                {issues.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative flex flex-col items-center justify-center py-16 px-6 h-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm overflow-hidden group shrink-0 transition-all duration-300 hover:shadow-md hover:border-green-200/80 dark:hover:border-green-800/50"
                    >
                        {/* SaaS Background Accents */}
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-green-500/10 dark:bg-green-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                        
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: -5 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                            className="w-16 h-16 rounded-[16px] bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center mb-5 shadow-sm ring-4 ring-white/50 dark:ring-zinc-900/50 relative z-10 shrink-0"
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </motion.div>
                        
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-2 relative z-10 text-center">
                            Great Job!
                        </h3>
                        <p className="text-[13px] sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 text-center max-w-[240px] leading-relaxed relative z-10">
                            Your text looks completely clean. Run a check after edits to verify.
                        </p>
                    </motion.div>
                ) : (
                    issues.map((issue) => {
                        const context = getIssueContext(issue);
                        const isError = issue.category === 'error';
                        const isWarning = issue.category === 'warning';
                        
                        return (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                key={issue.id}
                                className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm overflow-hidden flex flex-col relative group shrink-0"
                            >
                                {/* Header */}
                                <div className="flex justify-between items-center p-5 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center ${isError ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : isWarning ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                            {isError ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                            ) : isWarning ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                                            )}
                                        </div>
                                        <span className={`text-[11px] font-black uppercase tracking-wider ${isError ? 'text-red-600 dark:text-red-400' : isWarning ? 'text-yellow-600 dark:text-yellow-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                            {issue.category}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => handleDismiss(issue)}
                                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-[10px] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-5 pt-0 flex flex-col gap-4">
                                    <h4 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 leading-snug tracking-tight">
                                        {issue.shortMessage || issue.message}
                                    </h4>

                                    <div className="rounded-[16px] border border-blue-100/50 bg-blue-50/50 p-4 dark:border-blue-800/30 dark:bg-blue-900/10">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                                            <p className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Why this matters</p>
                                        </div>
                                        <p className="text-[13px] font-medium leading-relaxed text-blue-900/70 dark:text-blue-100/70">{getIssueLesson(issue)}</p>
                                    </div>

                                    {/* Text Snippet Context */}
                                    <div className="text-[13px] font-mono p-4 bg-zinc-50/80 dark:bg-zinc-800/50 rounded-[16px] text-zinc-500 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-700/50 leading-relaxed shadow-inner">
                                        {context.prefix}
                                        <span className={`font-bold px-1.5 py-0.5 rounded-md mx-0.5 ${
                                            isError ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 
                                            isWarning ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' : 
                                            'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                        }`}>
                                            {context.problematic}
                                        </span>
                                        {context.suffix}
                                    </div>

                                    {/* Fix Suggestions */}
                                    {issue.replacements.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {issue.replacements.slice(0, 3).map((rep, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleApplyFix(issue, rep)}
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-zinc-800 dark:text-zinc-200 hover:text-emerald-700 dark:hover:text-emerald-400 text-sm font-bold rounded-[12px] transition-all shadow-sm hover:shadow group/btn"
                                                >
                                                    {rep}
                                                    <svg className="opacity-0 group-hover/btn:opacity-100 transition-opacity" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </AnimatePresence>
        </div>

        {/* Statistics Grid - Premium Container */}
        <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-5 md:p-6 relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:border-green-200/80 dark:hover:border-green-800/50">
            {/* SaaS Background Accents */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-green-500/10 dark:bg-green-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
            
            <div className="flex flex-col gap-5 relative z-10">
                {/* Header Row: Exact Paraphraser Pattern */}
                <div className="flex items-center gap-4">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: -5 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                        className="w-14 h-14 rounded-[16px] bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center flex-shrink-0 shadow-sm ring-4 ring-white/50 dark:ring-zinc-900/50"
                    >
                        <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h7"/>
                        </svg>
                    </motion.div>
                    
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-0.5">
                            Document Stats
                        </h2>
                        <p className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400 leading-tight">
                            Real-time length metrics
                        </p>
                    </div>
                </div>

                {/* Inner Data Modules */}
                <div className="grid grid-cols-2 gap-3">
                    <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col items-center justify-center p-4 px-2 bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-700/80 rounded-[20px] transition-colors hover:border-green-300 dark:hover:border-green-700 shadow-sm text-center">
                        <NumberTicker value={stats.words} className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-1 leading-none tracking-tight" />
                        <span className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Words</span>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col items-center justify-center p-4 px-2 bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-700/80 rounded-[20px] transition-colors hover:border-green-300 dark:hover:border-green-700 shadow-sm text-center">
                        <NumberTicker value={stats.chars} className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-1 leading-none tracking-tight" />
                        <span className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Characters</span>
                    </motion.div>
                </div>
            </div>
        </div>



      </ToolMobileSheet>

      {/* Global Floating Restore Banner (Mobile) */}
      <AnimatePresence>
          {hasSavedSession && (
              <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed bottom-20 inset-x-4 z-[90] sm:hidden flex items-center justify-between p-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-[20px] border border-zinc-200/60 dark:border-zinc-800/60"
              >
                  <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-[14px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shrink-0">
                          <Save className="w-[18px] h-[18px]" />
                      </div>
                      <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-zinc-900 dark:text-white leading-tight">Draft Saved</span>
                          <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 leading-tight">Tap to recover</span>
                      </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                      <button
                          onClick={handleClearSaved}
                          className="flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#fff0f0] hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 transition-colors"
                      >
                          <Trash2 className="w-[18px] h-[18px]" />
                      </button>
                      <button
                          onClick={handleRestoreSaved}
                          className="px-4 h-10 flex items-center justify-center text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-[14px] shadow-sm hover:scale-105 active:scale-95 transition-all"
                      >
                          Restore
                      </button>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LanguageToolGrammarChecker;
