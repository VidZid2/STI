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
import { Save, ShieldCheck, Sparkles } from "lucide-react";
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

    // Analysis state
    const [issues, setIssues] = useState<GrammarIssue[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
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
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />
          
          {/* Title Area */}
          <motion.div
            className="flex items-center gap-4 relative z-10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <motion.div
              className="flex items-center justify-center w-12 h-12 rounded-[16px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50"
              whileHover={{ scale: 1.05, rotate: -5 }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </motion.div>
            
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Grammar Checker</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <ToolHeaderBadge icon={ShieldCheck} label="LanguageTool" tone="blue" />
                <ToolHeaderBadge icon={Sparkles} label="AI" tone="violet" />
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
                disabled={!text}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                Clear
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

              <motion.button
                layout
                onClick={performAnalysis}
                disabled={isAnalyzing || !text.trim() || !apiStatus.canRequest}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ y: -1, boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)' }}
                whileTap={{ scale: 0.97 }}
              >
                  {isAnalyzing ? 'Analyzing...' : 'Check'}
              </motion.button>
            </LayoutGroup>
          </motion.div>
        </div>

        {/* Text Area (The "Paper") */}
        <motion.div
          className="flex-1 relative bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm flex flex-col overflow-hidden min-h-[500px]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 px-6 text-sm font-semibold flex justify-between items-center border-b border-red-100 dark:border-red-900/30">
                  <span>{error}</span>
                  <button onClick={() => setError(null)}>×</button>
              </div>
          )}

          <div ref={containerRef} className="relative flex-1 w-full h-full p-8 lg:p-10">
              <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onScroll={handleScroll}
                  className="absolute inset-0 w-full h-full m-0 p-8 lg:p-10 font-sans text-[17px] leading-[1.8] tracking-normal whitespace-pre-wrap break-words text-left bg-transparent border-none resize-none text-zinc-800 dark:text-zinc-200 focus:ring-0 focus:outline-none z-0 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  placeholder="Type or paste your text here to check grammar..."
                  spellCheck="false"
              />
              {hasSavedSession && (
                  <button
                    onClick={handleClearSaved}
                    className="absolute bottom-4 right-5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-zinc-400 shadow-sm ring-1 ring-zinc-200 hover:text-red-500 dark:bg-zinc-900/80 dark:ring-zinc-800 dark:hover:text-red-400"
                  >
                    Clear saved draft
                  </button>
              )}
          </div>
        </motion.div>
      </div>

      {/* Sidebar Column (30%) */}
      <ToolMobileSheet
        title="Grammar Insights"
        summary={`${issues.length} ${issues.length === 1 ? 'issue' : 'issues'}, ${qualityScore}/100 score`}
        actionLabel="Open grammar insights"
        className="w-full lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)]"
      >
        
        {/* Quality Score Header */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-6 relative overflow-hidden flex items-center justify-between">
            <div className="flex flex-col">
                <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Quality Score</h3>
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-baseline gap-0.5">
                    <NumberTicker value={qualityScore} className="text-2xl tracking-tight" />
                    <span className="text-sm font-semibold text-zinc-400">/ 100</span>
                </div>
            </div>
            <div className="relative hidden sm:flex w-16 h-16 items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-zinc-100 dark:stroke-zinc-800" strokeWidth="4" />
                    <motion.circle 
                        cx="18" cy="18" r="16" fill="none" 
                        className={`stroke-current ${qualityScore >= 90 ? 'text-emerald-500' : qualityScore >= 70 ? 'text-yellow-500' : 'text-red-500'}`}
                        strokeWidth="4" strokeDasharray="100" 
                        initial={{ strokeDashoffset: 100 }}
                        animate={{ strokeDashoffset: 100 - qualityScore }}
                        transition={{ duration: 1, type: "spring" }}
                        strokeLinecap="round"
                    />
                </svg>
            </div>
        </div>

        {/* Scrollable Issue Cards */}
        <div className="flex-1 overflow-y-auto pr-2 [scrollbar-width:thin] flex flex-col gap-4 min-h-[300px]">
            <AnimatePresence mode="popLayout">
                {issues.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col items-center justify-center py-12 text-zinc-500 dark:text-zinc-400 h-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px]"
                    >
                        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">Great Job!</span>
                        <span className="text-sm font-medium mt-1 text-center px-6">Your text looks clean. Run a check after edits to keep the saved draft current.</span>
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
                                className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[20px] shadow-sm overflow-hidden flex flex-col relative group shrink-0"
                            >
                                {/* Header */}
                                <div className="flex justify-between items-start p-4 pb-0">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${isError ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                                        <span className={`text-[11px] font-black uppercase tracking-wider ${isError ? 'text-red-500' : isWarning ? 'text-yellow-600 dark:text-yellow-500' : 'text-blue-500'}`}>
                                            {issue.category}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => handleDismiss(issue)}
                                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-4 pt-2">
                                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 leading-relaxed">
                                        {issue.shortMessage || issue.message}
                                    </h4>

                                    <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3 dark:border-blue-800/50 dark:bg-blue-900/20">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Why this matters</p>
                                        <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">{getIssueLesson(issue)}</p>
                                    </div>

                                    {/* Text Snippet Context */}
                                    <div className="text-sm font-mono p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-zinc-500 dark:text-zinc-400 mb-4 border border-zinc-100 dark:border-zinc-700/50 leading-relaxed">
                                        {context.prefix}
                                        <span className={`font-bold px-1 rounded mx-0.5 ${
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
                                        <div className="flex flex-wrap gap-2">
                                            {issue.replacements.slice(0, 3).map((rep, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleApplyFix(issue, rep)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-zinc-700 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-400 text-sm font-semibold rounded-lg transition-all shadow-sm group/btn"
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

        {/* Statistics Grid */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-5 relative overflow-hidden group shrink-0">
            <div className="grid grid-cols-2 gap-3 relative z-10">
                <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col items-center justify-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <NumberTicker value={stats.words} className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-0.5" />
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Words</span>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col items-center justify-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <NumberTicker value={stats.chars} className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-0.5" />
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Characters</span>
                </motion.div>
            </div>
        </div>



      </ToolMobileSheet>
    </motion.div>
  );
};

export default LanguageToolGrammarChecker;
