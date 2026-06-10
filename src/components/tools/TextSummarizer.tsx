import * as React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { Save, FileText, FileSpreadsheet, AlertCircle, History, ChevronDown, Copy, BookOpen } from "lucide-react";
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
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  
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

  const isErrorOutput = summary && (
      summary.toLowerCase().includes("[unrecognizable_text]") ||
      summary.toLowerCase().includes("does not form a coherent message") || 
      summary.toLowerCase().includes("cannot summarize") || 
      summary.toLowerCase().includes("random assortment of characters") ||
      summary.toLowerCase().includes("hindi ko maintindihan") ||
      summary.toLowerCase().includes("unrecognizable text") ||
      summary.toLowerCase().includes("walang kakaibang impormasyon") ||
      summary.toLowerCase().includes("walang impormasyon") ||
      summary.toLowerCase().includes("does not contain sufficient information") ||
      summary.toLowerCase().includes("i cannot fulfill this request") ||
      summary.toLowerCase().includes("randomly generated characters")
  );

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
        <div className="mt-[72px] sm:mt-0 flex flex-row justify-between items-center gap-4 mb-6 p-4 sm:p-5 px-5 sm:px-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50">
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
                    <motion.div layout transition={{ layout: { type: "spring", bounce: 0.2, duration: 0.6 } }} className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2 hidden sm:block" />
                    <motion.button
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
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
          <div className="border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 gap-4">
                  <div className="flex items-center justify-between w-full sm:w-auto gap-3 shrink-0 pr-0">
                      <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-[14px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shrink-0">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                              </svg>
                          </div>
                          <span className="text-[17px] sm:text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight shrink-0 whitespace-nowrap">Original Document</span>
                          <span className="whitespace-nowrap text-[11px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100/80 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
                              {inputWordCount} words
                          </span>
                      </div>
                  </div>
                  
                  {/* Controls on right for Desktop */}
                  <div className="hidden sm:flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-3">
                          <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden xl:inline">Length</span>
                          <div className="flex bg-zinc-100/80 dark:bg-zinc-800/80 rounded-lg p-1 border border-zinc-200/50 dark:border-zinc-700/50">
                              {(['short', 'medium', 'long'] as SummaryLength[]).map((len) => (
                                  <button
                                      key={len}
                                      onClick={() => setSummaryLength(len)}
                                      className={`relative px-3 lg:px-4 py-1.5 text-[11px] lg:text-[12px] font-bold rounded-md transition-colors ${
                                          summaryLength === len 
                                              ? 'text-blue-600 dark:text-blue-400' 
                                              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                                      }`}
                                  >
                                      {summaryLength === len && (
                                          <motion.div
                                              layoutId="desktopLengthTab"
                                              className="absolute inset-0 bg-white dark:bg-zinc-700 shadow-sm border border-zinc-200/50 dark:border-zinc-600/50 rounded-md"
                                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                          />
                                      )}
                                      <span className="relative z-10">{len.charAt(0).toUpperCase() + len.slice(1)}</span>
                                  </button>
                              ))}
                          </div>
                      </div>
                      
                      <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1 hidden lg:block"></div>

                      <button
                          type="button"
                          onClick={handleClear}
                          className="flex items-center justify-center w-[40px] h-[40px] lg:w-[46px] lg:h-[46px] rounded-[14px] bg-[#fff0f0] text-red-500 transition-colors hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 focus:outline-none"
                      >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          </svg>
                      </button>
                      <button
                          type="button"
                          onClick={handleSummarize}
                          disabled={!inputText.trim() || isSummarizing}
                          className="flex items-center justify-center gap-2 rounded-[14px] bg-blue-600 hover:bg-blue-700 px-4 lg:px-5 h-[40px] lg:h-[46px] text-[14px] lg:text-[15px] font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none shadow-sm hover:shadow-md"
                      >
                          {isSummarizing ? (
                              <>
                                  <svg className="animate-spin w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                                  </svg>
                                  <span className="whitespace-nowrap tracking-tight hidden lg:inline">Processing...</span>
                              </>
                          ) : (
                              <>
                                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                  </svg>
                                  <span className="whitespace-nowrap tracking-tight">Summarize</span>
                              </>
                          )}
                      </button>
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

          {/* Action Footer (Mobile) */}
          <div className="flex sm:hidden flex-col gap-4 bg-zinc-50/50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-zinc-800 px-4 py-4 relative z-10">
              {/* Summary Length selector on mobile */}
              <div className="flex items-center gap-3 justify-center">
                  <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Length:</span>
                  <div className="flex bg-zinc-100/80 dark:bg-zinc-800/80 rounded-lg p-1 border border-zinc-200/50 dark:border-zinc-700/50 flex-1">
                      {(['short', 'medium', 'long'] as SummaryLength[]).map((len) => (
                          <button
                              key={len}
                              onClick={() => setSummaryLength(len)}
                              className={`relative flex-1 px-2 py-1.5 text-[12px] font-bold rounded-md transition-colors ${
                                  summaryLength === len 
                                      ? 'text-blue-600 dark:text-blue-400' 
                                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                              }`}
                          >
                              {summaryLength === len && (
                                  <motion.div
                                      layoutId="mobileLengthTab"
                                      className="absolute inset-0 bg-white dark:bg-zinc-700 shadow-sm border border-zinc-200/50 dark:border-zinc-600/50 rounded-md"
                                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                  />
                              )}
                              <span className="relative z-10">{len.charAt(0).toUpperCase() + len.slice(1)}</span>
                          </button>
                      ))}
                  </div>
              </div>

              {/* Action buttons on mobile */}
              <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 justify-end">
                      <button
                          type="button"
                          onClick={handleClear}
                          className="flex items-center justify-center shrink-0 w-[46px] h-[46px] rounded-[14px] bg-[#fff0f0] text-red-500 transition-colors hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 focus:outline-none"
                      >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          </svg>
                      </button>
                      <button
                          type="button"
                          onClick={handleSummarize}
                          disabled={!inputText.trim() || isSummarizing}
                          className="flex-1 flex items-center justify-center gap-2 rounded-[14px] bg-blue-600 hover:bg-blue-700 h-[46px] text-[15px] font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none shadow-sm hover:shadow-md"
                      >
                          {isSummarizing ? (
                              <>
                                  <svg className="animate-spin w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                                  </svg>
                                  <span className="whitespace-nowrap tracking-tight">Wait...</span>
                              </>
                          ) : (
                              <>
                                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                  </svg>
                                  <span className="whitespace-nowrap tracking-tight">Summarize</span>
                              </>
                          )}
                      </button>
                  </div>
              </div>
          </div>

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
        <div className={`bg-white dark:bg-zinc-900 border ${summary ? 'border-blue-200/80 dark:border-blue-800/50 shadow-blue-900/5' : 'border-zinc-200/80 dark:border-zinc-800/80'} rounded-[24px] shadow-sm p-5 md:p-6 relative overflow-hidden group flex flex-col flex-1 min-h-[400px] transition-all duration-300 hover:shadow-md ${summary ? 'hover:border-blue-300/80 dark:hover:border-blue-700/50' : 'hover:border-blue-200/80 dark:hover:border-blue-800/50'} shrink-0`}>
             <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150 ${summary ? 'bg-blue-500/10 dark:bg-blue-500/5' : 'bg-blue-500/10 dark:bg-blue-500/5'}`} aria-hidden="true" />
             <div className={`absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150 ${summary ? 'bg-blue-500/10 dark:bg-blue-500/5' : 'bg-blue-500/10 dark:bg-blue-500/5'}`} aria-hidden="true" />
             
             {/* Header Row: Matches ToolsHeader Pattern */}
             <div className="flex items-center gap-5 mb-6 relative z-10">
                <motion.div
                    whileHover={{ scale: 1.05, rotate: -5 }}
                    transition={{ type: 'spring' as const, stiffness: 400, damping: 15 }}
                    className={`w-16 h-16 rounded-[20px] flex items-center justify-center flex-shrink-0 shadow-sm transition-colors duration-500 ${summary ? 'bg-blue-50 border border-blue-100 dark:bg-blue-900/30 dark:border-blue-800/50 text-blue-600 dark:text-blue-400' : 'bg-blue-50 border border-blue-100 dark:bg-blue-900/30 dark:border-blue-800/50 text-blue-600 dark:text-blue-400'}`}
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
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-sm"
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
                            className={`flex flex-col flex-1 h-full relative ${isErrorOutput ? 'overflow-hidden' : ''}`}
                         >
                             {isErrorOutput && (
                                 <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-[20px]">
                                     <div className="bg-white dark:bg-zinc-800 border border-red-200 dark:border-red-900/50 shadow-sm sm:shadow-xl rounded-2xl p-5 sm:p-6 max-w-sm w-full mx-4 sm:mx-auto text-center transform transition-all">
                                         <div className="w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                                             <AlertCircle className="w-6 h-6" />
                                         </div>
                                         <h3 className="text-[15px] sm:text-base font-bold text-zinc-900 dark:text-white mb-2">Unrecognizable Text</h3>
                                         <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed line-clamp-3">
                                             {summary.includes('[UNRECOGNIZABLE_TEXT]') 
                                                 ? "The provided text cannot be summarized as it appears to be a random assortment of characters without any coherent meaning or information." 
                                                 : summary}
                                         </p>
                                         <button
                                             onClick={() => {
                                                 setSummary('');
                                                 setInputText('');
                                             }}
                                             className="w-full py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl transition-colors"
                                         >
                                             Clear and Try Again
                                         </button>
                                     </div>
                                 </div>
                             )}

                             <div className={`flex-1 relative bg-zinc-50/50 dark:bg-zinc-800/20 rounded-[20px] p-6 mb-5 border border-zinc-100 dark:border-zinc-800/50 overflow-y-auto max-h-[300px] ${isErrorOutput ? "opacity-20 pointer-events-none filter blur-[2px] transition-all duration-300" : ""}`}>
                                 <div className="absolute top-4 left-4 text-blue-500/10 dark:text-blue-500/5">
                                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                                      </svg>
                                 </div>
                                 <p className="relative z-10 text-zinc-800 dark:text-zinc-200 text-[15px] leading-loose break-words whitespace-pre-wrap pl-2 pt-2 font-medium">{summary}</p>
                             </div>

                             <div className={`flex items-center justify-between p-4 bg-white/60 dark:bg-zinc-900/40 rounded-[20px] border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm mb-5 ${isErrorOutput ? "opacity-20 pointer-events-none filter blur-[2px] transition-all duration-300" : ""}`}>
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
                                     <div className="w-12 h-12 rounded-[14px] bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                             <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                             <polyline points="17 6 23 6 23 12" />
                                         </svg>
                                     </div>
                                     <div className="flex flex-col text-right">
                                         <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-0.5">Reduced</span>
                                         <span className="text-2xl font-black text-blue-600 dark:text-blue-400 leading-none tracking-tight">{reductionPercent}%</span>
                                     </div>
                                 </div>
                             </div>

                              <div className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${isErrorOutput ? "opacity-20 pointer-events-none filter blur-[2px] transition-all duration-300" : ""}`}>
                                <motion.button
                                  onClick={handleCopy}
                                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                                      copied 
                                           ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                           : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40'
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
                                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40'
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
                                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
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
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-5 sm:p-6 relative overflow-hidden group">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                  <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={{ scale: 1.05, rotate: -5 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                      className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50"
                  >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                      </svg>
                  </motion.div>
                  
                  <div className="flex flex-col">
                      <h2 className="text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
                          Saved summaries
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  <span className="hidden sm:inline">Clear</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 relative z-10">
              {sessionHistory.map((item) => {
                const words = item.data.summary.trim()
                  ? getWordCount(item.data.summary)
                  : getWordCount(item.data.inputText);

                const isUnrecognizable = item.data.summary === '[UNRECOGNIZABLE_TEXT]';
                const displaySummary = isUnrecognizable 
                    ? 'The sequence of characters provided does not form a coherent message or text, appearing to be a random assortment of characters.'
                    : (item.data.summary || item.data.inputText);

                const isExpanded = expandedHistoryId === item.id;

                return (
                  <div
                      key={item.id}
                      className={`group relative flex flex-col rounded-2xl border-2 bg-white p-4 text-left shadow-sm transition-[border-color,box-shadow] duration-300 dark:bg-zinc-900/50 ${
                          isExpanded 
                              ? 'border-blue-200 shadow-md dark:border-blue-800' 
                              : 'border-zinc-100 hover:border-blue-200 hover:shadow-md dark:border-zinc-800 dark:hover:border-blue-800'
                      }`}
                  >
                      {/* Header row — always visible */}
                      <div 
                          className="flex items-start justify-between gap-4 cursor-pointer"
                          onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                      >
                          <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  <BookOpen className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                  <span className="text-sm font-bold capitalize text-zinc-900 dark:text-zinc-100 leading-none">
                                      {item.data.summaryLength} Summary
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
                              <div className={`p-1 rounded-md transition-colors duration-200 ${isExpanded ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-500' : 'bg-zinc-50 text-zinc-400 group-hover:bg-blue-50 group-hover:text-blue-500 dark:bg-zinc-800 dark:text-zinc-500 dark:group-hover:bg-blue-900/20 dark:group-hover:text-blue-500'}`}>
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
                              {displaySummary}
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
                                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 px-4 py-2.5 text-sm font-bold transition-colors"
                                  >
                                      <Copy className="w-4 h-4" />
                                      Restore this summary
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Complete Redesign - HomeContent/CourseViewPage Aesthetic */}
        <div className="flex flex-col gap-3.5 w-full mt-4">
            
            {/* Header Area */}
            <div className="flex items-center gap-3 mb-2 px-1">
                <div className="w-8 h-8 rounded-[10px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/80 dark:border-slate-700 shadow-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-400">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-none">Pro Tips</h3>
                </div>
            </div>

            {/* Quality Card */}
            <div className="p-4 relative overflow-hidden bg-white dark:bg-slate-800 rounded-[16px] border border-slate-200/80 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-blue-300 dark:hover:border-blue-700 cursor-default group/tip">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover/tip:bg-blue-500/20 transition-all duration-500" />
                <div className="flex items-start gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 shadow-sm bg-blue-50 dark:bg-blue-500/15 group-hover/tip:scale-110 transition-transform duration-300 border border-blue-100/50 dark:border-blue-500/20">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0 text-left pt-0.5">
                        <div className="text-[12px] font-bold tracking-wider leading-none text-slate-900 dark:text-slate-100 uppercase mb-1.5">
                            Quality
                        </div>
                        <div className="text-[13px] font-medium leading-[1.45] text-slate-500 dark:text-slate-400">
                            Longer texts generally produce better and more coherent summaries.
                        </div>
                    </div>
                </div>
            </div>

            {/* Overview Card */}
            <div className="p-4 relative overflow-hidden bg-white dark:bg-slate-800 rounded-[16px] border border-slate-200/80 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-amber-300 dark:hover:border-amber-700 cursor-default group/tip">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover/tip:bg-amber-500/20 transition-all duration-500" />
                <div className="flex items-start gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 shadow-sm bg-amber-50 dark:bg-amber-500/15 group-hover/tip:scale-110 transition-transform duration-300 border border-amber-100/50 dark:border-amber-500/20">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0 text-left pt-0.5">
                        <div className="text-[12px] font-bold tracking-wider leading-none text-slate-900 dark:text-slate-100 uppercase mb-1.5">
                            Overview
                        </div>
                        <div className="text-[13px] font-medium leading-[1.45] text-slate-500 dark:text-slate-400">
                            Use "Short" length for quick, high-level overviews of the content.
                        </div>
                    </div>
                </div>
            </div>

            {/* Refine Card */}
            <div className="p-4 relative overflow-hidden bg-white dark:bg-slate-800 rounded-[16px] border border-slate-200/80 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-purple-300 dark:hover:border-purple-700 cursor-default group/tip">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover/tip:bg-purple-500/20 transition-all duration-500" />
                <div className="flex items-start gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 shadow-sm bg-purple-50 dark:bg-purple-500/15 group-hover/tip:scale-110 transition-transform duration-300 border border-purple-100/50 dark:border-purple-500/20">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 dark:text-purple-400">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0 text-left pt-0.5">
                        <div className="text-[12px] font-bold tracking-wider leading-none text-slate-900 dark:text-slate-100 uppercase mb-1.5">
                            Refine
                        </div>
                        <div className="text-[13px] font-medium leading-[1.45] text-slate-500 dark:text-slate-400">
                            Always review and edit the generated summary for best results.
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </ToolMobileSheet>
    </motion.div>
  );
};

export default TextSummarizer;
