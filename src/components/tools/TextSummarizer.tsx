import * as React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { Save, FileText, FileSpreadsheet } from "lucide-react";
import { formatToolSessionTime, useToolSession } from "./useToolSession";
import { ToolHeaderBadge } from "./ToolHeaderBadges";
import ToolMobileSheet from "./ToolMobileSheet";
import { summarizeWithGroq, isSummarizerGroqConfigured } from "../../lib/summarizer/groqSummarizerService";
import { TextSummarizerEmpty } from "./empty-states";
import { exportSummaryToDocx } from "../../lib/export/docxExport";
import { exportSummaryToTxt } from "../../lib/export/txtExport";

interface TextSummarizerProps {
  onBack: () => void;
  initialText?: string;
}

type SummaryLength = 'short' | 'medium' | 'long';

interface TextSummarizerSession {
  inputText: string;
  summary: string;
  summaryLength: SummaryLength;
}

const EMPTY_SUMMARIZER_SESSION: TextSummarizerSession = {
  inputText: '',
  summary: '',
  summaryLength: 'medium',
};

const shouldPersistSummarizerSession = (session: TextSummarizerSession) =>
  Boolean(session.inputText.trim() || session.summary.trim());

const TextSummarizer: React.FC<TextSummarizerProps> = ({ onBack, initialText = '' }) => {
  const [inputText, setInputText] = useState(initialText);
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const [summary, setSummary] = useState('');
  const [summaryLength, setSummaryLength] = useState<SummaryLength>('medium');
  const [copied, setCopied] = useState(false);
  const downloaded = false;

  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentSession = useMemo<TextSummarizerSession>(() => ({
    inputText,
    summary,
    summaryLength,
  }), [inputText, summary, summaryLength]);
  const {
    initialData,
    hasSavedSession,
    lastSavedAt,
    sessionHistory,
    clearSavedSession,
    clearSessionHistory,
    saveImmediately,
    saveSnapshot,
  } = useToolSession('text-summarizer', currentSession, {
    emptySession: EMPTY_SUMMARIZER_SESSION,
    shouldPersist: shouldPersistSummarizerSession,
  });

  useEffect(() => {
    if (initialText) return;
    if (!shouldPersistSummarizerSession(initialData)) return;

    setInputText(initialData.inputText);
    setSummary(initialData.summary);
    setSummaryLength(initialData.summaryLength);
  }, [initialData, initialText]);

  useEffect(() => {
    if (inputText) {
      setIsTyping(true);
      const timeout = setTimeout(() => setIsTyping(false), 150);
      return () => clearTimeout(timeout);
    }
  }, [inputText]);

  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const summarizeText = (text: string, length: SummaryLength): string => {
    if (!text.trim()) return '';

    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length === 0) return text;

    // Determine number of sentences based on length
    let sentenceCount;
    switch (length) {
      case 'short':
        sentenceCount = Math.max(2, Math.ceil(sentences.length * 0.2));
        break;
      case 'medium':
        sentenceCount = Math.max(3, Math.ceil(sentences.length * 0.4));
        break;
      case 'long':
        sentenceCount = Math.max(4, Math.ceil(sentences.length * 0.6));
        break;
    }

    // Score sentences based on keyword frequency
    const words = text.toLowerCase().split(/\s+/);
    const wordFreq: Record<string, number> = {};

    // Build word frequency map (excluding common words)
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);

    words.forEach(word => {
      const cleanWord = word.replace(/[^a-z0-9]/g, '');
      if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
      }
    });

    // Score each sentence
    const scoredSentences = sentences.map((sentence, index) => {
      const sentenceWords = sentence.toLowerCase().split(/\s+/);
      let score = 0;

      sentenceWords.forEach(word => {
        const cleanWord = word.replace(/[^a-z0-9]/g, '');
        score += wordFreq[cleanWord] || 0;
      });

      // Boost first and last sentences
      if (index === 0) score *= 1.5;
      if (index === sentences.length - 1) score *= 1.2;

      return { sentence: sentence.trim(), score, index };
    });

    // Sort by score and take top N, then re-sort by original order
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, sentenceCount)
      .sort((a, b) => a.index - b.index)
      .map(s => s.sentence);

    return topSentences.join(' ');
  };

  const [error, setError] = useState<string | null>(null);

  const handleSummarize = async () => {
    if (!inputText.trim()) return;

    setIsSummarizing(true);
    setError(null);
    setSummary('');

    // Try AI summarization if configured
    if (isSummarizerGroqConfigured()) {
      const result = await summarizeWithGroq(inputText, summaryLength);
      if (result.success) {
        setSummary(result.text);
        saveSnapshot({
          inputText,
          summary: result.text,
          summaryLength,
        });
        setIsSummarizing(false);
        return;
      } else {
        console.warn('AI Summary failed, falling back to local heuristic:', result.error);
        setError(result.error || 'AI Summary failed. Using offline local fallback.');
      }
    }

    // Local TF-IDF offline fallback summary
    const result = summarizeText(inputText, summaryLength);
    setSummary(result);
    saveSnapshot({
      inputText,
      summary: result,
      summaryLength,
    });
    setIsSummarizing(false);
  };

  const handleCopy = async () => {
    if (summary) {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };



  const handleClear = () => {
    setInputText('');
    setSummary('');
    if (textareaRef.current) {
        textareaRef.current.focus();
    }
  };

  const handleRestoreSaved = () => {
    setInputText(initialData.inputText);
    setSummary(initialData.summary);
    setSummaryLength(initialData.summaryLength);
    saveImmediately(initialData);
  };

  const handleRestoreSnapshot = (session: TextSummarizerSession) => {
    setInputText(session.inputText);
    setSummary(session.summary);
    setSummaryLength(session.summaryLength);
    saveImmediately(session);
  };

  const handleClearSaved = () => {
    clearSavedSession();
  };

  const inputWordCount = getWordCount(inputText);
  const summaryWordCount = getWordCount(summary);
    const reductionPercent = inputWordCount > 0
    ? Math.round(((inputWordCount - summaryWordCount) / inputWordCount) * 100)
    : 0;

  // Loading Skeleton
  if (isPageLoading) {
      return (
          <div className="w-full max-w-[1400px] mx-auto h-auto min-h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-8 p-0 sm:p-0" role="status" aria-busy="true" aria-label="Loading Text Summarizer">
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
                          <div className="skeleton-bone w-32 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                      </div>
                  </div>

                  {/* Text Area Skeleton */}
                  <div className="flex-1 relative bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm flex flex-col overflow-hidden min-h-[400px]">
                      <div className="flex-1 p-8 lg:p-10 flex flex-col gap-4 skeleton-stagger">
                          <div className="skeleton-bone w-full h-4 rounded bg-zinc-100 dark:bg-zinc-800/50" />
                          <div className="skeleton-bone w-11/12 h-4 rounded bg-zinc-100 dark:bg-zinc-800/50" />
                          <div className="skeleton-bone w-10/12 h-4 rounded bg-zinc-100 dark:bg-zinc-800/50" />
                          <div className="skeleton-bone w-4/5 h-4 rounded bg-zinc-100 dark:bg-zinc-800/50" />
                      </div>
                      <div className="border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20 p-4 px-8 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                              <div className="skeleton-bone w-24 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                              <div className="flex bg-zinc-200/50 dark:bg-zinc-800 rounded-lg p-1 gap-1">
                                  <div className="skeleton-bone w-16 h-8 rounded-md bg-zinc-100 dark:bg-zinc-700" />
                                  <div className="skeleton-bone w-16 h-8 rounded-md bg-zinc-200 dark:bg-zinc-800" />
                                  <div className="skeleton-bone w-16 h-8 rounded-md bg-zinc-200 dark:bg-zinc-800" />
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Sidebar Column Skeleton */}
              <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-8">
                  {/* Output Card Skeleton */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-6 flex flex-col flex-1 min-h-[400px]">
                      <div className="flex items-center gap-3 mb-6">
                          <div className="skeleton-bone w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                          <div className="skeleton-bone w-32 h-5 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      </div>
                      <div className="flex flex-col items-center justify-center h-full py-12 gap-4">
                          <div className="skeleton-bone w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50" />
                          <div className="skeleton-bone w-40 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                          <div className="skeleton-bone w-56 h-3 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
                          <div className="flex gap-2 mt-4">
                              <div className="skeleton-bone w-20 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800/50" />
                              <div className="skeleton-bone w-20 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800/50" />
                              <div className="skeleton-bone w-20 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800/50" />
                          </div>
                      </div>
                  </div>

                  {/* Pro Tips Skeleton */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-6 flex flex-col gap-3">
                      <div className="flex items-center gap-3 mb-3">
                          <div className="skeleton-bone w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                          <div className="skeleton-bone w-20 h-5 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      </div>
                      {[1, 2, 3].map((i) => (
                          <div key={i} className="skeleton-bone h-16 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800" />
                      ))}
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
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Editor Header & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-5 px-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
          
          {/* Title Area */}
          <motion.div
            className="flex items-center gap-4 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <motion.div
              className="flex items-center justify-center w-12 h-12 rounded-[16px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
              </svg>
            </motion.div>
            
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Text Summarizer</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
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

              <motion.div layout transition={{ layout: { type: "spring", bounce: 0.2, duration: 0.6 } }} className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2 hidden sm:block" />

              <AnimatePresence mode="popLayout">
                {hasSavedSession && (
                  <motion.button
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={handleRestoreSaved}
                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ layout: { type: "spring", bounce: 0.2, duration: 0.6 } }}
                  >
                    Restore
                  </motion.button>
                )}
              </AnimatePresence>

              <motion.button
                layout
                onClick={handleClear}
                disabled={!inputText}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ layout: { type: "spring", bounce: 0.2, duration: 0.6 } }}
              >
                Clear
              </motion.button>
              
              <motion.button
                layout
                onClick={handleSummarize}
                disabled={!inputText.trim() || isSummarizing}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ y: -1, boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)' }}
                whileTap={{ scale: 0.97 }}
                transition={{ layout: { type: "spring", bounce: 0.2, duration: 0.6 } }}
              >
                {isSummarizing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Summarizing...
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    Summarize
                  </>
                )}
              </motion.button>
            </LayoutGroup>
          </motion.div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 rounded-[20px] bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 flex items-start gap-3"
          >
            <div className="mt-0.5 text-amber-600 dark:text-amber-400 shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                {error}
              </p>
            </div>
          </motion.div>
        )}

        {/* Text Area (The "Paper") */}
        <motion.div
          className="flex-1 relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[24px] shadow-md hover:shadow-lg overflow-hidden min-h-[500px] focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:focus-within:ring-blue-500/10 transition-all duration-300 flex flex-col group"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Subtle top indicator for typing */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 opacity-0 transition-opacity duration-300" style={{ opacity: isTyping ? 1 : 0 }} />
          
          {/* Inner Header Row (Like Paraphraser) */}
          <div className="border-b border-zinc-100 dark:border-zinc-800 overflow-x-auto [scrollbar-width:none]">
              <div className="flex items-center justify-between min-w-full w-max px-5 sm:px-6 py-4 gap-4">
                  <div className="flex items-center gap-3 shrink-0 pr-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shrink-0">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                      </div>
                      <span className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight shrink-0 whitespace-nowrap">Original Document</span>
                  </div>
                  
                  {/* Controls moved to top */}
                  <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-3">
                          <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden md:inline">Summary Length</span>
                          <div className="flex bg-zinc-100/80 dark:bg-zinc-800/80 rounded-lg p-1 border border-zinc-200/50 dark:border-zinc-700/50">
                              {(['short', 'medium', 'long'] as SummaryLength[]).map((len) => (
                                  <button
                                      key={len}
                                      onClick={() => setSummaryLength(len)}
                                      className={`px-3 sm:px-4 py-1 text-[11px] font-bold rounded-md transition-all ${
                                          summaryLength === len 
                                              ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm border border-zinc-200/50 dark:border-zinc-600/50' 
                                              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 border border-transparent'
                                      }`}
                                  >
                                      {len.charAt(0).toUpperCase() + len.slice(1)}
                                  </button>
                              ))}
                          </div>
                      </div>
                      
                      <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 hidden sm:block"></div>

                      <span className="whitespace-nowrap text-[11px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100/80 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
                          {inputWordCount} words
                      </span>

                      {hasSavedSession && (
                        <button
                          onClick={handleClearSaved}
                          className="whitespace-nowrap text-[11px] font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 px-3 py-1.5 rounded-lg border border-rose-200/50 dark:border-rose-800/50 transition-colors shrink-0"
                        >
                          Clear saved
                        </button>
                      )}
                  </div>
              </div>
          </div>

          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 w-full p-6 lg:p-8 font-sans text-[15px] sm:text-[17px] leading-[1.8] tracking-normal whitespace-pre-wrap break-words text-left bg-transparent border-none resize-none text-zinc-800 dark:text-zinc-200 focus:ring-0 focus:outline-none z-0 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 [scrollbar-width:thin]"
            placeholder="Paste your text here to summarize..."
            spellCheck="false"
          />

        </motion.div>
      </div>

      {/* Sidebar Column (30%) */}
      <ToolMobileSheet
        title="Summary Result"
        summary={summary ? `${summaryWordCount} words, ${reductionPercent}% reduced` : 'Summary, export, and study tips'}
        actionLabel="Open summary panel"
        className="w-full lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col gap-6"
      >
        
        {/* Output/Summary Card */}
        <div className={`bg-white dark:bg-zinc-900 border ${summary ? 'border-emerald-200/80 dark:border-emerald-800/50 shadow-emerald-900/5' : 'border-zinc-200/80 dark:border-zinc-800/80'} rounded-[24px] shadow-sm p-5 md:p-6 relative overflow-hidden group flex flex-col flex-1 min-h-[400px] transition-all duration-300 hover:shadow-md ${summary ? 'hover:border-emerald-300/80 dark:hover:border-emerald-700/50' : 'hover:border-blue-200/80 dark:hover:border-blue-800/50'} shrink-0`}>
             <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150 ${summary ? 'bg-emerald-500/10 dark:bg-emerald-500/5' : 'bg-blue-500/10 dark:bg-blue-500/5'}`} aria-hidden="true" />
             <div className={`absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150 ${summary ? 'bg-emerald-500/10 dark:bg-emerald-500/5' : 'bg-blue-500/10 dark:bg-blue-500/5'}`} aria-hidden="true" />
             
             {/* Header Row: Matches ToolsHeader Pattern */}
             <div className="flex items-center gap-5 mb-6 relative z-10">
                <motion.div
                    whileHover={{ scale: 1.05, rotate: -5 }}
                    transition={{ type: 'spring' as const, stiffness: 400, damping: 15 }}
                    className={`w-16 h-16 rounded-[20px] flex items-center justify-center flex-shrink-0 shadow-sm transition-colors duration-500 ${summary ? 'bg-emerald-50 border border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400' : 'bg-blue-50 border border-blue-100 dark:bg-blue-900/30 dark:border-blue-800/50 text-blue-600 dark:text-blue-400'}`}
                >
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                </motion.div>
                
                <div className="flex flex-col flex-1">
                    <h2 className="text-[22px] sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-1">
                        Summary Result
                    </h2>
                    <p className="text-[13px] sm:text-[14px] font-medium text-zinc-500 dark:text-zinc-400 leading-tight">
                        {summary ? 'Your condensed notes' : 'Waiting for input'}
                    </p>
                </div>

                <AnimatePresence>
                    {summary && (
                         <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-sm"
                         >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                         </motion.div>
                    )}
                </AnimatePresence>
             </div>

             <div className="flex flex-col flex-1 relative z-10">
                 <AnimatePresence mode="wait">
                     {summary ? (
                         <motion.div
                            key="summary-content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col flex-1 h-full"
                         >
                             <div className="flex-1 relative bg-zinc-50/50 dark:bg-zinc-800/20 rounded-[20px] p-6 mb-5 border border-zinc-100 dark:border-zinc-800/50 overflow-y-auto max-h-[300px]">
                                 <div className="absolute top-4 left-4 text-emerald-500/10 dark:text-emerald-500/5">
                                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                                      </svg>
                                 </div>
                                 <p className="relative z-10 text-zinc-800 dark:text-zinc-200 text-[15px] leading-loose break-words whitespace-pre-wrap pl-2 pt-2 font-medium">{summary}</p>
                             </div>

                             <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-zinc-900/40 rounded-[20px] border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm mb-5">
                                 <div className="flex items-center gap-3">
                                     <div className="w-12 h-12 rounded-[14px] bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                             <path d="M4 7V4h16v3" />
                                             <path d="M9 20h6" />
                                             <path d="M12 4v16" />
                                         </svg>
                                     </div>
                                     <div className="flex flex-col">
                                         <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-0.5">Words</span>
                                         <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 leading-none tracking-tight">{summaryWordCount}</span>
                                     </div>
                                 </div>
                                 <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-700"></div>
                                 <div className="flex items-center gap-3">
                                     <div className="w-12 h-12 rounded-[14px] bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
                                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                             <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                             <polyline points="17 6 23 6 23 12" />
                                         </svg>
                                     </div>
                                     <div className="flex flex-col text-right">
                                         <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-0.5">Reduced</span>
                                         <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none tracking-tight">{reductionPercent}%</span>
                                     </div>
                                 </div>
                             </div>

                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <motion.button
                                onClick={handleCopy}
                                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                                     copied 
                                         ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                         : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20'
                                }`}
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.98 }}
                             >
                                 <AnimatePresence mode="wait">
                                     {copied ? (
                                        <motion.div key="copied" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            Copied!
                                        </motion.div>
                                     ) : (
                                        <motion.div key="copy" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                            </svg>
                                            Copy
                                        </motion.div>
                                     )}
                                  </AnimatePresence>
                              </motion.button>

                              {/* Export Buttons */}
                              <motion.button
                                onClick={() => exportSummaryToDocx(inputText, summary, summaryLength)}
                                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                                    downloaded
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-500/20'
                                }`}
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                title="Export as Word document"
                              >
                                <FileSpreadsheet className="w-4 h-4" />
                                {downloaded ? 'Saved!' : '.docx'}
                              </motion.button>
                              <motion.button
                                onClick={() => exportSummaryToTxt(inputText, summary, summaryLength)}
                                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 ${
                                    downloaded
                                        ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
                                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                                }`}
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                title="Export as plain text"
                              >
                                <FileText className="w-4 h-4" />
                                .txt
                              </motion.button>
                              </div>
                          </motion.div>
                      ) : (
                         <TextSummarizerEmpty 
                            onAction={() => {
                                // Sample lecture notes
                                setInputText(`Introduction to Computer Science\n\nComputer science is the study of computation, information, and automation. It spans theoretical disciplines (like algorithms and computational theory) to practical disciplines (like hardware and software design).\n\nKey concepts include:\n- Algorithms: Step-by-step procedures for solving problems\n- Data structures: Ways to organize and store data\n- Programming: Writing instructions for computers\n\nThis field has revolutionized modern life, from smartphones to medical diagnostics.`);
                            }}
                         />
                     )}
                 </AnimatePresence>
             </div>
        </div>

        {sessionHistory.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-5 relative overflow-hidden group">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Session history</p>
                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">Saved summaries</h3>
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
                const words = item.data.summary.trim()
                  ? getWordCount(item.data.summary)
                  : getWordCount(item.data.inputText);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleRestoreSnapshot(item.data)}
                    className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/70 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:border-blue-800/60 dark:hover:bg-blue-900/20"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-black capitalize text-zinc-800 dark:text-zinc-100">{item.data.summaryLength} summary</span>
                      <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500">{formatToolSessionTime(item.updatedAt)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                      {words} words - {item.data.summary || item.data.inputText}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Pro Tips Card - Redesigned to match ToolsHeader */}
        <motion.div 
            className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-6 lg:p-7 flex flex-col gap-2 group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        >
            {/* SaaS Background Accents (matches ToolsHeader) */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
            
            {/* Left: Icon & Core Info (matches ToolsHeader) */}
            <div className="flex items-center gap-5 relative z-10 w-full mb-6">
                <motion.div
                    whileHover={{ scale: 1.05, rotate: -5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className="w-16 h-16 rounded-[20px] bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm"
                >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                </motion.div>

                <div>
                    <h2 className="text-[22px] sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-1">
                        Pro Tips
                    </h2>
                    <p className="text-[13px] sm:text-[14px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                        Maximize your AI summarizer
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-3 relative z-10 w-full mt-2">
                <div className="flex items-start gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors hover:border-blue-200 dark:hover:border-blue-800/50">
                    <div className="mt-0.5 text-blue-500 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl flex-shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <div className="flex flex-col justify-center">
                        <p className="text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">Quality</p>
                        <p className="text-[13.5px] text-zinc-700 dark:text-zinc-300 leading-snug font-semibold">Longer texts generally produce better and more coherent summaries.</p>
                    </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors hover:border-amber-200 dark:hover:border-amber-800/50">
                    <div className="mt-0.5 text-amber-500 bg-amber-100 dark:bg-amber-900/30 p-2 rounded-xl flex-shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <div className="flex flex-col justify-center">
                        <p className="text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">Overview</p>
                        <p className="text-[13.5px] text-zinc-700 dark:text-zinc-300 leading-snug font-semibold">Use "Short" length for quick, high-level overviews of the content.</p>
                    </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors hover:border-purple-200 dark:hover:border-purple-800/50">
                    <div className="mt-0.5 text-purple-500 bg-purple-100 dark:bg-purple-900/30 p-2 rounded-xl flex-shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                    </div>
                    <div className="flex flex-col justify-center">
                        <p className="text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">Refine</p>
                        <p className="text-[13.5px] text-zinc-700 dark:text-zinc-300 leading-snug font-semibold">Always review and edit the generated summary for best results.</p>
                    </div>
                </div>
            </div>
        </motion.div>

      </ToolMobileSheet>
    </motion.div>
  );
};

export default TextSummarizer;
