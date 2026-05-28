/**
 * Word Counter Component
 * Comprehensive text analysis tool - works offline!
 * 
 * Features:
 * - Real-time word, character, sentence, paragraph counting
 * - Reading and speaking time estimates
 * - Keyword density analysis
 * - Modern, minimalistic design matching Grammar Checker
 * - Monochromatic Blue Theme
 */

import * as React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { FileText, Save, ShieldCheck } from "lucide-react";
import { formatToolSessionTime, useToolSession } from "./useToolSession";
import { ToolHeaderBadge } from "./ToolHeaderBadges";
import ToolMobileSheet from "./ToolMobileSheet";

interface WordCounterProps {
  onBack: () => void;
  initialText?: string;
}

interface WordCounterSession {
  text: string;
}

const EMPTY_WORDCOUNTER_SESSION: WordCounterSession = {
  text: '',
};

const shouldPersistWordCounterSession = (session: WordCounterSession) =>
  Boolean(session.text.trim());

interface Stats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  avgWordLength: number;
  avgSentenceLength: number;
  readingTime: string;
  speakingTime: string;
  ariScore: number;
  ariGrade: string;
  ariColor: string;
  passiveCount: number;
  passiveDensity: number;
  clicheCount: number;
  detectedCliches: { phrase: string; alternative: string; count: number }[];
  toneScore: number;
  toneLevel: string;
  toneColor: string;
  contractionCount: number;
  academicCount: number;
}

interface KeywordData {
  word: string;
  count: number;
  percentage: number;
}

const SAMPLE_TEXT = `Welcome to the Word Counter tool! This powerful text analyzer helps you track your writing progress in real-time.

Simply paste or type your text here to see detailed statistics including word count, character count, sentences, paragraphs, and estimated reading time.

Whether you're writing an essay, blog post, or academic paper, this tool helps ensure you meet your word count requirements.`;

const WordCounter: React.FC<WordCounterProps> = ({ onBack, initialText = "" }) => {
  const [text, setText] = useState(initialText);
  const [isTyping, setIsTyping] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showCliches, setShowCliches] = useState(false);
  const [showActiveVoiceTips, setShowActiveVoiceTips] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [restoredAt, setRestoredAt] = useState<string | null>(null);

  const currentSession = useMemo<WordCounterSession>(() => ({
    text,
  }), [text]);

  const {
    initialData,
    initialUpdatedAt,
    hasSavedSession,
    lastSavedAt,
    clearSavedSession,
  } = useToolSession('word-counter', currentSession, {
    emptySession: EMPTY_WORDCOUNTER_SESSION,
    shouldPersist: shouldPersistWordCounterSession,
  });

  useEffect(() => {
    if (initialText) return;
    if (!shouldPersistWordCounterSession(initialData)) return;

    setText(initialData.text);
    setRestoredAt(initialUpdatedAt);
  }, [initialData, initialText, initialUpdatedAt]);

  const handleRestoreSaved = () => {
    if (!shouldPersistWordCounterSession(initialData)) return;
    setText(initialData.text);
    setRestoredAt(initialUpdatedAt);
  };

  const handleClearSaved = () => {
    clearSavedSession();
    setRestoredAt(null);
  };

  // Calculate comprehensive statistics
  const stats: Stats = useMemo(() => {
    const trimmedText = text.trim();
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, "").length;
    const words = trimmedText ? trimmedText.split(/\s+/).filter(Boolean).length : 0;
    const sentences = trimmedText
      ? (trimmedText.match(/[.!?]+/g) || []).length || (trimmedText.length > 0 ? 1 : 0)
      : 0;
    const paragraphs = trimmedText ? trimmedText.split(/\n\n+/).filter(Boolean).length : 0;
    const lines = text ? text.split(/\n/).length : 0;

    const avgWordLength = words > 0 ? Math.round((charactersNoSpaces / words) * 10) / 10 : 0;
    const avgSentenceLength = sentences > 0 ? Math.round((words / sentences) * 10) / 10 : 0;

    const readingMinutes = Math.ceil(words / 200);
    const speakingMinutes = Math.ceil(words / 150);

    const readingTime = words === 0 ? "0m" : (readingMinutes < 1 ? "< 1m" : `${readingMinutes}m`);
    const speakingTime = words === 0 ? "0m" : (speakingMinutes < 1 ? "< 1m" : `${speakingMinutes}m`);

    // Style & Tone calculations
    // Readability (ARI)
    let ariScore = 0;
    let ariGrade = "N/A";
    let ariColor = "text-zinc-500 bg-zinc-500/10 border-zinc-500/20 dark:border-zinc-800/30";
    if (words > 0 && sentences > 0) {
      ariScore = Math.round((4.71 * (charactersNoSpaces / words) + 0.5 * (words / sentences) - 21.43) * 10) / 10;
      if (ariScore <= 6) {
        ariGrade = "Elementary Level";
        ariColor = "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/20 border-green-200/50 dark:border-green-800/30";
      } else if (ariScore <= 10) {
        ariGrade = "Junior High School";
        ariColor = "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/30";
      } else if (ariScore <= 12) {
        ariGrade = "Senior High School";
        ariColor = "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/20 border-indigo-200/50 dark:border-indigo-800/30";
      } else if (ariScore <= 16) {
        ariGrade = "College (Undergraduate)";
        ariColor = "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/20 border-purple-200/50 dark:border-purple-800/30";
      } else {
        ariGrade = "Post-Graduate Level";
        ariColor = "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30";
      }
    }

    // Passive Voice Density
    const sentenceList = trimmedText ? trimmedText.split(/[.!?]+/).map(s => s.trim()).filter(Boolean) : [];
    let passiveCount = 0;
    sentenceList.forEach(sentence => {
      const localRegex = /\b(am|is|are|was|were|be|been|being)\b\s+(?:[a-z']+\s+){0,2}\b([a-z']+(?:ed|d|t)|done|seen|taken|known|written|given|made|built|shown|found|held|chosen|drawn|eaten|forgotten|gone|grown|heard|kept|left|lost|paid|run|said|sent|told|thought|understood|won)\b/i;
      if (localRegex.test(sentence)) {
        passiveCount++;
      }
    });
    const passiveDensity = sentenceList.length > 0 ? Math.round((passiveCount / sentenceList.length) * 100) : 0;

    // Academic Clichés & Redundancies
    const CLICHE_MAP: Record<string, string> = {
      "at the end of the day": "ultimately",
      "needless to say": "obviously",
      "in order to": "to",
      "due to the fact that": "because",
      "in spite of the fact that": "although",
      "first and foremost": "first",
      "in the final analysis": "finally",
      "with the exception of": "except",
      "as a matter of fact": "actually",
      "each and every": "each",
      "a large number of": "many",
      "at the present time": "now",
      "for the purpose of": "to",
      "conspicuous by its absence": "noticeably absent",
      "readily available": "available"
    };

    const detectedCliches: { phrase: string; alternative: string; count: number }[] = [];
    let clicheCount = 0;

    if (trimmedText) {
      Object.entries(CLICHE_MAP).forEach(([phrase, alternative]) => {
        const escapedPhrase = phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedPhrase}\\b`, 'gi');
        const matches = trimmedText.match(regex);
        if (matches && matches.length > 0) {
          detectedCliches.push({
            phrase,
            alternative,
            count: matches.length
          });
          clicheCount += matches.length;
        }
      });
    }

    // Formal Tone Strength Index
    const contractionRegex = /\b([a-z]+['’](?:t|s|m|re|ve|ll|d))\b/gi;
    const contractions = trimmedText ? trimmedText.match(contractionRegex) || [] : [];
    const contractionCount = contractions.length;

    const ACADEMIC_WORDS = new Set([
      'furthermore', 'additionally', 'consequently', 'subsequently', 'therefore',
      'empirical', 'methodology', 'theoretical', 'hypothesis', 'literature',
      'correlation', 'significance', 'nonetheless', 'nevertheless', 'moreover',
      'illustrates', 'demonstrates', 'conducted', 'investigated', 'analyzed',
      'evaluate', 'synthesize', 'formulate', 'parameters', 'variables',
      'quantitative', 'qualitative', 'framework', 'paradigm', 'consensus'
    ]);

    const wordsList = trimmedText ? trimmedText.toLowerCase().match(/[a-z']+/g) || [] : [];
    let academicCount = 0;
    wordsList.forEach(w => {
      if (ACADEMIC_WORDS.has(w)) {
        academicCount++;
      }
    });

    let toneScore = 100;
    let toneLevel = "N/A";
    let toneColor = "text-zinc-500 bg-zinc-500/10 border-zinc-500/20 dark:border-zinc-800/30";
    if (trimmedText) {
      const rawScore = 100 - (contractionCount * 5) + (academicCount * 3);
      toneScore = Math.max(0, Math.min(100, rawScore));
      if (toneScore >= 85) {
        toneLevel = "Highly Academic / Formal";
        toneColor = "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30";
      } else if (toneScore >= 70) {
        toneLevel = "Standard Academic";
        toneColor = "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/30";
      } else if (toneScore >= 50) {
        toneLevel = "Semi-Formal";
        toneColor = "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30";
      } else {
        toneLevel = "Conversational / Informal";
        toneColor = "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/20 border-red-200/50 dark:border-red-800/30";
      }
    } else {
      toneScore = 0;
    }

    return {
      characters,
      charactersNoSpaces,
      words,
      sentences,
      paragraphs,
      lines,
      avgWordLength,
      avgSentenceLength,
      readingTime,
      speakingTime,
      ariScore,
      ariGrade,
      ariColor,
      passiveCount,
      passiveDensity,
      clicheCount,
      detectedCliches,
      toneScore,
      toneLevel,
      toneColor,
      contractionCount,
      academicCount
    };
  }, [text]);

  // Calculate top keywords
  const keywords: KeywordData[] = useMemo(() => {
    if (!text.trim()) return [];

    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
      'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
      'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own',
      'same', 'so', 'than', 'too', 'very', 'just', 'as', 'if', 'then', 'because'
    ]);

    const words = text.toLowerCase().match(/[a-z']+/g) || [];
    const wordCount: Record<string, number> = {};

    words.forEach(word => {
      if (word.length > 2 && !stopWords.has(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });

    const totalKeywords = Object.values(wordCount).reduce((a, b) => a + b, 0);

    return Object.entries(wordCount)
      .map(([word, count]) => ({
        word,
        count,
        percentage: Math.round((count / totalKeywords) * 100 * 10) / 10
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Limit to top 5
  }, [text]);

  useEffect(() => {
    if (text) {
      setIsTyping(true);
      const timeout = setTimeout(() => setIsTyping(false), 150);
      return () => clearTimeout(timeout);
    }
  }, [text]);

  const handleClear = () => {
    setText("");
    setRestoredAt(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleLoadSample = () => {
    setText(SAMPLE_TEXT);
  };

  // Monochromatic Blue Stat Items
  const statItems = [
    {
      label: "Words",
      value: stats.words,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10,9 9,9 8,9" />
        </svg>
      ),
    },
    {
      label: "Characters",
      value: stats.characters,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4,7 4,4 20,4 20,7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      ),
    },
    {
      label: "No Spaces",
      value: stats.charactersNoSpaces,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="9" x2="15" y2="15" />
          <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
      ),
    },
    {
      label: "Sentences",
      value: stats.sentences,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      label: "Paragraphs",
      value: stats.paragraphs,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 4v16" />
          <path d="M17 4v16" />
          <path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H13" />
        </svg>
      ),
    },
    {
      label: "Lines",
      value: stats.lines,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      ),
    },
  ];

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
                <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </motion.div>
            
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Word Counter</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <ToolHeaderBadge icon={ShieldCheck} label="Works Offline" tone="blue" />
                <ToolHeaderBadge icon={FileText} label="Text Analytics" tone="zinc" />
                <ToolHeaderBadge
                  icon={Save}
                  label={lastSavedAt ? `Saved ${formatToolSessionTime(lastSavedAt)}` : 'Auto-save ready'}
                  tone="emerald"
                  hideOnSmall
                />
              </div>
              {restoredAt && (
                <p className="mt-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Restored your draft from {formatToolSessionTime(restoredAt)}.
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
                onClick={handleLoadSample}
                disabled={!!text}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                Sample
              </motion.button>

              <AnimatePresence mode="popLayout">
                {text && (
                  <>
                    <motion.button
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={handleCopy}
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-colors ${
                        copySuccess 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {copySuccess ? 'Copied!' : 'Copy'}
                    </motion.button>

                    <motion.button
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={handleClear}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Clear
                    </motion.button>
                  </>
                )}
              </AnimatePresence>
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
          {/* Subtle top indicator for typing */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 opacity-0 transition-opacity duration-300" style={{ opacity: isTyping ? 1 : 0 }} />
          
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 w-full p-8 lg:p-10 bg-transparent border-none resize-none text-zinc-800 dark:text-zinc-200 focus:ring-0 focus:outline-none text-lg leading-relaxed placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
            placeholder="Start typing, or paste your document here..."
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
        </motion.div>
      </div>

      {/* Sidebar Column (30%) */}
      <ToolMobileSheet
        title="Document Stats"
        summary={`${stats.words.toLocaleString()} words, ${stats.readingTime} read`}
        actionLabel="Open word counter stats"
        className="w-full lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-8"
      >
        
        {/* Statistics Grid */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Document Stats</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 relative z-10">
              {statItems.map((stat) => (
                  <div
                      key={stat.label}
                      className="flex flex-col items-start p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors hover:border-blue-200 dark:hover:border-blue-800 group/stat"
                  >
                      <div className="text-zinc-400 dark:text-zinc-500 mb-2 group-hover/stat:text-blue-500 transition-colors">
                          {stat.icon}
                      </div>
                      <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-0.5">{stat.value.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{stat.label}</span>
                  </div>
              ))}
            </div>
        </div>

        {/* Time Estimates */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-6 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
             
             <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:indigo-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Time Estimates</h3>
             </div>

             <div className="flex flex-col gap-3 relative z-10">
                 {/* Reading */}
                 <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors hover:border-indigo-200 dark:hover:border-indigo-800">
                    <div className="flex items-center gap-3">
                      <div className="text-indigo-500 dark:text-indigo-400">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                          </svg>
                      </div>
                      <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Reading</span>
                    </div>
                    <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">{stats.readingTime}</span>
                 </div>

                 {/* Speaking */}
                 <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors hover:border-indigo-200 dark:hover:border-indigo-800">
                    <div className="flex items-center gap-3">
                      <div className="text-indigo-500 dark:text-indigo-400">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                              <line x1="12" y1="19" x2="12" y2="23" />
                              <line x1="8" y1="23" x2="16" y2="23" />
                          </svg>
                      </div>
                      <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Speaking</span>
                    </div>
                    <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">{stats.speakingTime}</span>
                 </div>
             </div>
        </div>

        {/* Style & Tone Insights Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-6 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
             
             <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                    </svg>
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Style & Tone</h3>
             </div>

             <div className="flex flex-col gap-4 relative z-10">
                 {/* Readability Score */}
                 <div className="flex flex-col gap-2 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors hover:border-blue-200 dark:hover:border-blue-800">
                    <div className="flex justify-between items-center">
                       <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Readability (ARI)</span>
                       <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">{stats.ariScore || "0"}</span>
                    </div>
                    {stats.words > 0 ? (
                       <div className={`wc-insight-badge ${stats.ariColor}`}>
                          {stats.ariGrade}
                       </div>
                    ) : (
                       <div className="text-xs text-zinc-400 dark:text-zinc-500 italic text-center">
                          Type text to compute readability
                       </div>
                    )}
                 </div>

                 {/* Tone Strength Index */}
                 <div className="flex flex-col gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors hover:border-blue-200 dark:hover:border-blue-800">
                    <div className="flex justify-between items-center">
                       <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Formal Tone</span>
                       <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">{stats.toneScore}%</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="wc-insight-progress-bg">
                       <div 
                          className="wc-insight-progress-bar" 
                          style={{ width: `${stats.toneScore}%` }}
                       />
                    </div>

                    {stats.words > 0 ? (
                       <div className={`wc-insight-badge ${stats.toneColor}`}>
                          {stats.toneLevel}
                       </div>
                    ) : (
                       <div className="text-xs text-zinc-400 dark:text-zinc-500 italic text-center">
                          Type text to evaluate tone
                       </div>
                    )}
                 </div>

                 {/* Passive Voice */}
                 <div className="flex flex-col gap-2 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors hover:border-blue-200 dark:hover:border-blue-800">
                    <div className="flex justify-between items-center">
                       <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Passive Voice</span>
                       <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                          {stats.passiveCount} ({stats.passiveDensity}%)
                       </span>
                    </div>
                    
                    {stats.passiveCount > 0 && (
                       <>
                          <button 
                             onClick={() => setShowActiveVoiceTips(!showActiveVoiceTips)}
                             className="wc-insight-toggle-btn"
                          >
                             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                             </svg>
                             {showActiveVoiceTips ? "Hide Active Voice tips" : "How to write actively?"}
                          </button>
                          
                          <AnimatePresence>
                             {showActiveVoiceTips && (
                                <motion.div 
                                   initial={{ opacity: 0, height: 0 }}
                                   animate={{ opacity: 1, height: "auto" }}
                                   exit={{ opacity: 0, height: 0 }}
                                   className="wc-insight-details"
                                >
                                   Place the doer of the action before the verb.
                                   <div className="mt-1 font-semibold text-zinc-700 dark:text-zinc-300">
                                      ✗ Passive: <span className="italic font-normal">The paper was written by John.</span>
                                   </div>
                                   <div className="font-semibold text-blue-600 dark:text-blue-400">
                                      ✓ Active: <span className="italic font-normal">John wrote the paper.</span>
                                   </div>
                                </motion.div>
                             )}
                          </AnimatePresence>
                       </>
                    )}
                 </div>

                 {/* Cliches & Redundancies */}
                 <div className="flex flex-col gap-2 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors hover:border-blue-200 dark:hover:border-blue-800">
                    <div className="flex justify-between items-center">
                       <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Academic Clichés</span>
                       <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                          {stats.clicheCount} detected
                       </span>
                    </div>
                    
                    {stats.clicheCount > 0 && (
                       <>
                          <button 
                             onClick={() => setShowCliches(!showCliches)}
                             className="wc-insight-toggle-btn"
                          >
                             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                             </svg>
                             {showCliches ? "Hide clichés list" : "Show detected clichés"}
                          </button>
                          
                          <AnimatePresence>
                             {showCliches && (
                                <motion.div 
                                   initial={{ opacity: 0, height: 0 }}
                                   animate={{ opacity: 1, height: "auto" }}
                                   exit={{ opacity: 0, height: 0 }}
                                   className="wc-insight-details"
                                   style={{ display: "flex", flexDirection: "column", gap: "6px" }}
                                >
                                   {stats.detectedCliches.map((c, i) => (
                                      <div key={i} className="flex flex-col gap-0.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0 pb-1 last:pb-0">
                                         <div className="flex justify-between font-semibold">
                                            <span className="text-red-500 dark:text-red-400">“{c.phrase}”</span>
                                            <span>x{c.count}</span>
                                         </div>
                                         <div className="text-emerald-600 dark:text-emerald-400">
                                            ↳ Suggestion: <span className="font-bold">“{c.alternative}”</span>
                                         </div>
                                      </div>
                                   ))}
                                </motion.div>
                             )}
                          </AnimatePresence>
                       </>
                    )}
                 </div>
             </div>
        </div>

        {/* Keywords Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-6 relative overflow-hidden group flex flex-col flex-1 max-h-[400px]">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
             
             <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="9" x2="20" y2="9" />
                        <line x1="4" y1="15" x2="20" y2="15" />
                        <line x1="10" y1="3" x2="8" y2="21" />
                        <line x1="16" y1="3" x2="14" y2="21" />
                    </svg>
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Top Keywords</h3>
             </div>

             <div className="flex flex-col gap-2 relative z-10 overflow-y-auto pr-2 no-scrollbar">
                {keywords.length > 0 ? (
                    keywords.map((k) => (
                        <div key={k.word} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 truncate mr-2">{k.word}</span>
                            <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-lg shrink-0">
                                {k.count}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-zinc-400 dark:text-zinc-500">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-50">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <span className="text-sm font-medium">No keywords extracted</span>
                        <span className="text-xs mt-1 text-zinc-400/80">Type more text to analyze</span>
                    </div>
                )}
             </div>
        </div>

      </ToolMobileSheet>

      <style>{`
                /* Skeleton Loading Animation */
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                .wc-skeleton {
                    background-color: #e2e8f0;
                    border-radius: 6px;
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                body.dark-mode .wc-skeleton { background-color: #334155; }
                .wc-skeleton-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
                .wc-stat-skeleton { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px; }

                /* Main Container */
                .wc-container {
                    min-height: 100vh;
                    padding: 24px;
                    background: transparent;
                    font-family: 'Inter', sans-serif;
                }
                body.dark-mode .wc-container {
                    background: transparent;
                }

                /* Header Area */
                .wc-header-area {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    gap: 24px;
                    margin-bottom: 20px;
                    max-width: 1200px;
                    margin-left: auto;
                    margin-right: auto;
                }
                .wc-title-card {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 20px;
                    background: white;
                    border: 1px solid #e0f2fe;
                    border-radius: 12px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.02);
                }
                body.dark-mode .wc-title-card { background: #1e293b; border-color: #334155; }
                
                .wc-title-icon {
                    width: 48px; 
                    height: 48px;
                    border-radius: 12px;
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    flex-shrink: 0;
                    position: relative;
                }
                
                .wc-title-icon svg {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }
                
                .wc-title-content {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    gap: 4px;
                }
                
                .wc-title { 
                    font-size: 20px; 
                    font-weight: 700; 
                    margin: 0; 
                    color: #1e293b; 
                    line-height: 1.2;
                }
                body.dark-mode .wc-title { color: #f1f5f9; }
                
                /* Badges */
                .wc-badges { display: flex; gap: 8px; margin-top: 0; }
                .wc-badge {
                    display: inline-flex; align-items: center; gap: 5px;
                    padding: 4px 10px; font-size: 11px; font-weight: 600;
                    border-radius: 100px; color: #0369a1; background: #f0f9ff;
                }
                body.dark-mode .wc-badge { background: #1e3a8a; color: #bfdbfe; }

                /* Action Buttons */
                .wc-actions-bar { display: flex; align-items: center; gap: 16px; }
                .wc-actions { display: flex; align-items: center; gap: 10px; }
                .wc-btn {
                    padding: 9px 16px; 
                    border-radius: 10px; 
                    font-size: 13px; 
                    font-weight: 500;
                    border: 1px solid #e2e8f0; 
                    background: white; 
                    color: #64748b;
                    cursor: pointer; 
                    display: inline-flex; 
                    align-items: center; 
                    gap: 6px;
                }
                .wc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .wc-btn.success { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
                .wc-btn-clear { color: #ef4444; border-color: #fecaca; }
                body.dark-mode .wc-btn { background: #1e293b; border-color: #334155; color: #94a3b8; }
                body.dark-mode .wc-btn-clear { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #f87171; }
                
                .wc-actions-divider { width: 1px; height: 24px; background: #e2e8f0; margin: 0 4px; }
                body.dark-mode .wc-actions-divider { background: #475569; }

                /* Main Content Grid */
                .wc-main { display: flex; flex-direction: column; gap: 20px; max-width: 1200px; margin: 0 auto; }

                /* Editor Section */
                .wc-editor-section {
                    background: white; border-radius: 16px; padding: 20px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    border: 1px solid #e2e8f0;
                }
                body.dark-mode .wc-editor-section { background: #1e293b; border-color: #334155; }
                
                .wc-editor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                .wc-editor-label { font-size: 14px; font-weight: 600; color: #475569; letter-spacing: 0.02em; }
                body.dark-mode .wc-editor-label { color: #cbd5e1; }

                /* Uiverse-inspired Input Group */
                .wc-input-group {
                    position: relative;
                    width: 100%;
                }
                
                .wc-input {
                    width: 100%;
                    min-height: 180px;
                    border: solid 1.5px #cbd5e1;
                    border-radius: 1rem;
                    background: #f8fafc;
                    padding: 1.5rem 1rem 1rem 1rem;
                    font-size: 1rem;
                    font-family: 'Inter', sans-serif;
                    color: #334155;
                    transition: border 150ms cubic-bezier(0.4,0,0.2,1), box-shadow 150ms cubic-bezier(0.4,0,0.2,1);
                    resize: vertical;
                    outline: none;
                    line-height: 1.6;
                }
                
                body.dark-mode .wc-input {
                    border-color: #475569;
                    background: #1e293b;
                    color: #f5f5f5;
                }
                
                .wc-user-label {
                    position: absolute;
                    left: 15px;
                    top: 0;
                    color: #3b82f6;
                    font-weight: 600;
                    font-size: 0.85rem;
                    pointer-events: none;
                    transform: translateY(1rem);
                    transition: 150ms cubic-bezier(0.4,0,0.2,1);
                    background-color: #f8fafc;
                    padding: 0 0.4em;
                }
                
                body.dark-mode .wc-user-label {
                    color: #60a5fa;
                    background-color: #1e293b;
                }
                
                .wc-input:focus, .wc-input.has-value {
                    border: 1.5px solid #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                
                .wc-input:focus ~ .wc-user-label,
                .wc-input.has-value ~ .wc-user-label {
                    transform: translateY(-50%) scale(0.9);
                    color: #3b82f6;
                }
                
                body.dark-mode .wc-input:focus ~ .wc-user-label,
                body.dark-mode .wc-input.has-value ~ .wc-user-label {
                    color: #60a5fa;
                }
                
                /* Typing State - Animated Blue Outline */
                .wc-input.is-typing {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
                    animation: outline-pulse 2s ease-in-out infinite;
                }
                
                body.dark-mode .wc-input.is-typing {
                    border-color: #60a5fa;
                    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
                }
                
                @keyframes outline-pulse {
                    0%, 100% { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
                    50% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25); }
                }
                
                /* Typing Indicator Spinner */
                .wc-typing-indicator {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    width: 20px;
                    height: 20px;
                    color: #3b82f6;
                    pointer-events: none;
                }
                
                body.dark-mode .wc-typing-indicator {
                    color: #60a5fa;
                }
                
                .wc-spinner {
                    width: 100%;
                    height: 100%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                /* Small Cards Grid */
                .wc-stats-container {
                    display: grid;
                    grid-template-columns: 220px 1fr 180px;
                    gap: 16px;
                    align-items: stretch;
                    outline: none;
                    border: none;
                }

                .wc-small-card {
                    background: white; 
                    border-radius: 12px; 
                    padding: 16px;
                    border: 1px solid #e2e8f0; 
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                    display: flex; 
                    flex-direction: column;
                    min-height: 200px;
                }
                .wc-small-card.wide {
                    min-height: 200px;
                }
                body.dark-mode .wc-small-card { background: #1e293b; border-color: #334155; }

                .wc-card-header {
                    display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600;
                    color: #475569;
                }
                body.dark-mode .wc-card-header { color: #cbd5e1; }
                
                .wc-header-icon-box {
                    width: 24px; height: 24px; border-radius: 6px;
                    background: #eff6ff; color: #2563eb;
                    display: flex; align-items: center; justify-content: center;
                }
                body.dark-mode .wc-header-icon-box { background: #1e3a8a; color: #60a5fa; }

                /* White Time Card */
                .wc-time-card-white {
                    background: white;
                    border: 1px solid #e0f2fe;
                    transition: all 0.2s ease;
                }
                body.dark-mode .wc-time-card-white { 
                    background: #1e293b; 
                    border-color: #334155; 
                }
                
                .wc-time-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #475569;
                    margin-bottom: 12px;
                }
                body.dark-mode .wc-time-header { color: #cbd5e1; }
                
                .wc-time-header-icon {
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                    color: #2563eb;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                body.dark-mode .wc-time-header-icon { 
                    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); 
                    color: #60a5fa; 
                }
                
                .wc-time-items {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    flex: 1;
                }
                
                .wc-time-item-white {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: #f8fafc;
                    border-radius: 10px;
                    border: 1px solid #f1f5f9;
                    transition: all 0.15s ease;
                    cursor: default;
                    flex: 1;
                }
                body.dark-mode .wc-time-item-white { 
                    background: #0f172a; 
                    border-color: #334155; 
                }
                body.dark-mode .wc-time-item-white:hover { 
                    background: #1e3a8a !important; 
                }
                
                .wc-time-item-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 9px;
                    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                    color: #2563eb;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                body.dark-mode .wc-time-item-icon { 
                    background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%); 
                    color: #93c5fd; 
                }
                
                .wc-time-item-icon.wc-speaking {
                    background: linear-gradient(135deg, #dbeafe 0%, #c7d2fe 100%);
                    color: #4f46e5;
                }
                body.dark-mode .wc-time-item-icon.wc-speaking { 
                    background: linear-gradient(135deg, #3730a3 0%, #4f46e5 100%); 
                    color: #a5b4fc; 
                }
                
                .wc-time-item-content {
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                }
                
                .wc-time-item-label {
                    font-size: 11px;
                    font-weight: 500;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                body.dark-mode .wc-time-item-label { color: #94a3b8; }
                
                .wc-time-item-value {
                    font-size: 20px;
                    font-weight: 700;
                    color: #1e293b;
                    line-height: 1.2;
                }
                body.dark-mode .wc-time-item-value { color: #f1f5f9; }

                /* Compact Stats Grid */
                .wc-compact-stats-grid {
                    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; flex: 1;
                }
                .wc-compact-stat-item {
                    background: #fcfcfc; border: 1px solid #f1f5f9; border-radius: 10px;
                    padding: 10px; display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: center;
                    transition: all 0.2s;
                }
                body.dark-mode .wc-compact-stat-item { background: #0f172a; border-color: #334155; }
                body.dark-mode .wc-compact-stat-item:hover { background: #1e3a8a !important; }

                .wc-compact-icon {
                    color: #3b82f6; margin-bottom: 6px;
                    background: #eff6ff; width: 32px; height: 32px; border-radius: 8px;
                    display: flex; align-items: center; justify-content: center;
                }
                body.dark-mode .wc-compact-icon { background: #172554; color: #60a5fa; }

                .wc-compact-value { font-size: 20px; font-weight: 700; color: #1e293b; line-height: 1; margin-bottom: 2px; }
                body.dark-mode .wc-compact-value { color: #f1f5f9; }
                
                .wc-compact-label { font-size: 11px; color: #64748b; font-weight: 500; }
                body.dark-mode .wc-compact-label { color: #94a3b8; }

                /* Keywords */
                .wc-keyword-list { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; flex: 1; }
                .wc-keyword-row {
                    display: flex; justify-content: space-between; align-items: center;
                    font-size: 13px; padding: 6px 10px; background: #f8fafc; border-radius: 6px;
                }
                body.dark-mode .wc-keyword-row { background: #0f172a; }
                .wc-kw-text { color: #334155; font-weight: 500; }
                body.dark-mode .wc-kw-text { color: #cbd5e1; }
                .wc-kw-badge {
                    background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 700;
                    padding: 2px 8px; border-radius: 10px;
                }
                body.dark-mode .wc-kw-badge { background: #1e3a8a; color: #93c5fd; }
                .wc-empty-keywords { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px; font-style: italic; }

                /* Typing Indicator */
                .wc-typing-indicator { display: flex; gap: 4px; }
                .wc-typing-dot { width: 4px; height: 4px; background: #3b82f6; border-radius: 50%; animation: typingBounce 1.4s infinite ease-in-out; }
                .wc-typing-dot:nth-child(1) { animation-delay: 0s; }
                .wc-typing-dot:nth-child(2) { animation-delay: 0.2s; }
                .wc-typing-dot:nth-child(3) { animation-delay: 0.4s; }
                @keyframes typingBounce { 0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; } 40% { transform: scale(1.2); opacity: 1; } }

                 /* Style & Tone Insights */
                 .wc-insight-card {
                     display: flex;
                     flex-direction: column;
                     gap: 12px;
                     margin-top: 6px;
                 }
                 .wc-insight-section {
                     background: #f8fafc;
                     border: 1px solid #f1f5f9;
                     border-radius: 10px;
                     padding: 10px 12px;
                     transition: all 0.15s ease;
                     display: flex;
                     flex-direction: column;
                     gap: 6px;
                 }
                 body.dark-mode .wc-insight-section {
                     background: #0f172a;
                     border-color: #334155;
                 }
                 body.dark-mode .wc-insight-section:hover {
                     border-color: #1d4ed8;
                 }
                 .wc-insight-row {
                     display: flex;
                     justify-content: space-between;
                     align-items: center;
                 }
                 .wc-insight-label {
                     font-size: 12px;
                     font-weight: 600;
                     color: #64748b;
                 }
                 body.dark-mode .wc-insight-label { color: #94a3b8; }
                 .wc-insight-value {
                     font-size: 14px;
                     font-weight: 700;
                     color: #1e293b;
                 }
                 body.dark-mode .wc-insight-value { color: #f1f5f9; }
                 .wc-insight-badge {
                     font-size: 11px;
                     font-weight: 700;
                     padding: 3px 8px;
                     border-radius: 6px;
                     border: 1px solid transparent;
                     text-align: center;
                 }
                 .wc-insight-progress-bg {
                     width: 100%;
                     height: 6px;
                     background: #e2e8f0;
                     border-radius: 3px;
                     overflow: hidden;
                 }
                 body.dark-mode .wc-insight-progress-bg { background: #334155; }
                 .wc-insight-progress-bar {
                     height: 100%;
                     background: #3b82f6;
                     border-radius: 3px;
                     transition: width 0.4s ease-out;
                 }
                 .wc-insight-toggle-btn {
                     background: transparent;
                     border: none;
                     padding: 0;
                     font-size: 11px;
                     font-weight: 700;
                     color: #2563eb;
                     cursor: pointer;
                     display: flex;
                     align-items: center;
                     gap: 4px;
                     text-align: left;
                 }
                 body.dark-mode .wc-insight-toggle-btn { color: #60a5fa; }
                 .wc-insight-toggle-btn:hover { text-decoration: underline; }
                 .wc-insight-details {
                     font-size: 11px;
                     line-height: 1.4;
                     color: #64748b;
                     border-top: 1px solid #f1f5f9;
                     padding-top: 8px;
                     margin-top: 4px;
                 }
                 body.dark-mode .wc-insight-details { border-color: #334155; color: #94a3b8; }

                /* Responsive */
                @media (max-width: 1024px) {
                    .wc-stats-container { grid-template-columns: 1fr 1fr; }
                    .wc-small-card.wide { grid-column: span 2; }
                }
                @media (max-width: 768px) {
                    .wc-stats-container { display: flex; flex-direction: column; }
                    .wc-small-card.wide { grid-column: auto; }
                }
            `}</style>
    </motion.div>
  );
};

export default WordCounter;
