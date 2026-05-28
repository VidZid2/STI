import * as React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { FileText, Save, Sparkles } from "lucide-react";
import { formatToolSessionTime, useToolSession } from "./useToolSession";
import { ToolHeaderBadge } from "./ToolHeaderBadges";
import ToolMobileSheet from "./ToolMobileSheet";
import { summarizeWithGroq, isSummarizerGroqConfigured } from "../../lib/summarizer/groqSummarizerService";

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
  const [summary, setSummary] = useState('');
  const [summaryLength, setSummaryLength] = useState<SummaryLength>('medium');
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [restoredAt, setRestoredAt] = useState<string | null>(null);
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
    initialUpdatedAt,
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
    setRestoredAt(initialUpdatedAt);
  }, [initialData, initialText, initialUpdatedAt]);

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

  const handleDownload = () => {
    if (!summary) return;

    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'summary.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleClear = () => {
    setInputText('');
    setSummary('');
    setRestoredAt(null);
    if (textareaRef.current) {
        textareaRef.current.focus();
    }
  };

  const handleRestoreSaved = () => {
    setInputText(initialData.inputText);
    setSummary(initialData.summary);
    setSummaryLength(initialData.summaryLength);
    setRestoredAt(initialUpdatedAt);
    saveImmediately(initialData);
  };

  const handleRestoreSnapshot = (session: TextSummarizerSession, updatedAt: string) => {
    setInputText(session.inputText);
    setSummary(session.summary);
    setSummaryLength(session.summaryLength);
    setRestoredAt(updatedAt);
    saveImmediately(session);
  };

  const handleClearSaved = () => {
    clearSavedSession();
    setRestoredAt(null);
  };

  const inputWordCount = getWordCount(inputText);
  const summaryWordCount = getWordCount(summary);
  const reductionPercent = inputWordCount > 0
    ? Math.round(((inputWordCount - summaryWordCount) / inputWordCount) * 100)
    : 0;

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
                <ToolHeaderBadge icon={Sparkles} label="AI" tone="violet" />
                <ToolHeaderBadge icon={FileText} label="Study Notes" tone="blue" />
                <ToolHeaderBadge icon={FileText} label="Local Engine" tone="emerald" />
                <ToolHeaderBadge
                  icon={Save}
                  label={lastSavedAt ? `Saved ${formatToolSessionTime(lastSavedAt)}` : 'Auto-save ready'}
                  tone="blue"
                  hideOnSmall
                />
              </div>
              {restoredAt && (
                <p className="mt-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Restored your last draft from {formatToolSessionTime(restoredAt)}.
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
                Clear
              </motion.button>
              
              <motion.button
                layout
                onClick={handleSummarize}
                disabled={!inputText.trim() || isSummarizing}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ y: -1, boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)' }}
                whileTap={{ scale: 0.97 }}
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
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
          className="flex-1 relative bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm flex flex-col overflow-hidden min-h-[400px]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Subtle top indicator for typing */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 opacity-0 transition-opacity duration-300" style={{ opacity: isTyping ? 1 : 0 }} />
          
          <div className="absolute top-4 right-4 z-10">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {inputWordCount} words
              </span>
          </div>

          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 w-full p-8 lg:p-10 bg-transparent border-none resize-none text-zinc-800 dark:text-zinc-200 focus:ring-0 focus:outline-none text-lg leading-relaxed placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
            placeholder="Paste your text here to summarize..."
            spellCheck="false"
          />

          {/* Controls Bar at bottom of Editor */}
          <div className="border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20 p-4 px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Summary Length</span>
                  <div className="flex bg-zinc-200/50 dark:bg-zinc-800 rounded-lg p-1">
                      {(['short', 'medium', 'long'] as SummaryLength[]).map((len) => (
                          <button
                              key={len}
                              onClick={() => setSummaryLength(len)}
                              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                  summaryLength === len 
                                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50'
                              }`}
                          >
                              {len.charAt(0).toUpperCase() + len.slice(1)}
                          </button>
                      ))}
                  </div>
              </div>
              {hasSavedSession && (
                <button
                  onClick={handleClearSaved}
                  className="text-xs font-bold text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-colors"
                >
                  Clear saved draft
                </button>
              )}
          </div>
        </motion.div>
      </div>

      {/* Sidebar Column (30%) */}
      <ToolMobileSheet
        title="Summary Result"
        summary={summary ? `${summaryWordCount} words, ${reductionPercent}% reduced` : 'Summary, export, and study tips'}
        actionLabel="Open summary panel"
        className="w-full lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-8"
      >
        
        {/* Output/Summary Card */}
        <div className={`bg-white dark:bg-zinc-900 border ${summary ? 'border-emerald-200/80 dark:border-emerald-800/50 shadow-emerald-900/5' : 'border-zinc-200/80 dark:border-zinc-800/80'} rounded-[24px] shadow-sm p-6 relative overflow-hidden group flex flex-col flex-1 min-h-[400px] transition-colors duration-500`}>
             <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl transition-colors pointer-events-none duration-700 ${summary ? 'bg-emerald-500/10 dark:bg-emerald-500/20' : 'bg-emerald-500/0'}`} />
             
             <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500 ${summary ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-400'}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex-1">Summary Result</h3>
                <AnimatePresence>
                    {summary && (
                         <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white"
                         >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col flex-1 h-full"
                         >
                             <div className="flex-1 relative bg-zinc-50/50 dark:bg-zinc-800/20 rounded-2xl p-6 mb-5 border border-zinc-100 dark:border-zinc-800/50 overflow-y-auto max-h-[300px]">
                                 <div className="absolute top-4 left-4 text-emerald-500/10 dark:text-emerald-500/5">
                                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                                      </svg>
                                 </div>
                                 <p className="relative z-10 text-zinc-800 dark:text-zinc-200 text-[15px] leading-loose break-words whitespace-pre-wrap pl-2 pt-2">{summary}</p>
                             </div>

                             <div className="flex items-center justify-between p-4 bg-zinc-50/80 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800/60 mb-5">
                                 <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                             <path d="M4 7V4h16v3" />
                                             <path d="M9 20h6" />
                                             <path d="M12 4v16" />
                                         </svg>
                                     </div>
                                     <div className="flex flex-col">
                                         <span className="text-xl font-black text-zinc-900 dark:text-zinc-100 leading-none">{summaryWordCount}</span>
                                         <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-1">Words</span>
                                     </div>
                                 </div>
                                 <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-700"></div>
                                 <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                             <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                             <polyline points="17 6 23 6 23 12" />
                                         </svg>
                                     </div>
                                     <div className="flex flex-col text-right">
                                         <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{reductionPercent}%</span>
                                         <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-wider mt-1">Reduced</span>
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
                                            Copy Summary
                                        </motion.div>
                                     )}
                                  </AnimatePresence>
                              </motion.button>

                              <motion.button
                                onClick={handleDownload}
                                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                                    downloaded
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                                }`}
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                {downloaded ? 'Downloaded!' : 'Download .txt'}
                              </motion.button>
                              </div>
                          </motion.div>
                      ) : (
                         <motion.div
                            key="empty-state"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-full py-12 text-zinc-400 dark:text-zinc-500"
                         >
                            <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-300">
                              <div className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40" />
                              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="relative z-10">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                              </svg>
                            </div>
                            <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300">Ready to build study notes</span>
                            <span className="text-xs mt-2 text-zinc-400/90 text-center px-4 leading-relaxed">Paste lecture notes, an article, or a module section. Your draft auto-saves while you work.</span>
                            <div className="mt-5 flex flex-wrap justify-center gap-2">
                              {['Key points', 'Reviewer format', 'Quick recap'].map((hint) => (
                                <span key={hint} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-600 dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-300">
                                  {hint}
                                </span>
                              ))}
                            </div>
                          </motion.div>
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
                    onClick={() => handleRestoreSnapshot(item.data, item.updatedAt)}
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

        {/* Pro Tips Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
             
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Pro Tips</h3>
            </div>

            <div className="flex flex-col gap-3 relative z-10">
                <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <div className="mt-0.5 text-blue-500">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">Longer texts generally produce better and more coherent summaries.</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <div className="mt-0.5 text-amber-500">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">Use "Short" length for quick, high-level overviews of the content.</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <div className="mt-0.5 text-purple-500">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">Always review and edit the generated summary for the best results.</p>
                </div>
            </div>
        </div>

      </ToolMobileSheet>
    </motion.div>
  );
};

export default TextSummarizer;
