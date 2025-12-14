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

interface WordCounterProps {
  onBack: () => void;
  initialText?: string;
}

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
}

interface KeywordData {
  word: string;
  count: number;
  percentage: number;
}

const SAMPLE_TEXT = `Welcome to the Word Counter tool! This powerful text analyzer helps you track your writing progress in real-time.

Simply paste or type your text here to see detailed statistics including word count, character count, sentences, paragraphs, and estimated reading time.

Whether you're writing an essay, blog post, or academic paper, this tool helps ensure you meet your word count requirements.`;

const SkeletonBlock = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
  <div className={`wc-skeleton ${className || ''}`} style={style} />
);

const WordCounter: React.FC<WordCounterProps> = ({ onBack, initialText = "" }) => {
  const [text, setText] = useState(initialText);
  const [isTyping, setIsTyping] = useState(false);
  const [isTitleHovered, setIsTitleHovered] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect dark mode from settings
  useEffect(() => {
    const checkDarkMode = () => {
      const darkModeEnabled = localStorage.getItem('darkModeEnabled') === 'true';
      setIsDarkMode(darkModeEnabled);
    };

    checkDarkMode();

    // Listen for storage changes and body class changes
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.body.classList.contains('dark-mode'));
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('storage', checkDarkMode);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', checkDarkMode);
    };
  }, []);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

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
      speakingTime
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
      className="wc-container"
    >
      {/* Header Area */}
      <div className="wc-header-area">
        {/* Title Card */}
        <motion.div
          className="wc-title-card"
          onMouseEnter={() => setIsTitleHovered(true)}
          onMouseLeave={() => setIsTitleHovered(false)}
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: 1,
            y: isTitleHovered ? -4 : 0,
            boxShadow: isTitleHovered
              ? '0 20px 40px rgba(59, 130, 246, 0.12)'
              : '0 4px 20px rgba(0, 0, 0, 0.04)'
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 25,
            opacity: { duration: 0.3 }
          }}
        >
          {/* Animated gradient overlay */}
          <motion.div
            className="wc-title-gradient"
            initial={{ opacity: 0 }}
            animate={{ opacity: isTitleHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Icon */}
          <motion.div
            className="wc-title-icon"
            animate={{
              background: isTitleHovered
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                : (isDarkMode ? '#1e3a8a' : '#e0f2fe'),
              rotate: isTitleHovered ? 3 : 0,
              scale: isTitleHovered ? 1.05 : 1
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <motion.svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ display: 'block', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
              animate={{ color: isTitleHovered ? '#ffffff' : (isDarkMode ? '#60a5fa' : '#0369a1') }}
            >
              <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </motion.svg>
          </motion.div>

          {/* Title Content */}
          <div className="wc-title-content">
            <motion.h1
              className="wc-title"
              animate={{ color: isTitleHovered ? '#2563eb' : (isDarkMode ? '#f1f5f9' : '#1e293b') }}
              transition={{ duration: 0.2 }}
            >
              Word Counter
            </motion.h1>

            {/* Badges */}
            <div className="wc-badges">
              <motion.span
                className="wc-badge"
                animate={{
                  scale: isTitleHovered ? 1.02 : 1,
                  backgroundColor: isTitleHovered
                    ? (isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
                    : (isDarkMode ? '#1e3a8a' : '#f0f9ff'),
                  color: isTitleHovered ? '#60a5fa' : (isDarkMode ? '#93c5fd' : '#0369a1')
                }}
                transition={{ duration: 0.2 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Works Offline
              </motion.span>
            </div>
          </div>
        </motion.div>

        {/* Actions Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="wc-actions-bar"
        >
          <motion.button
            onClick={onBack}
            className="wc-btn wc-btn-ghost"
            whileHover={{
              x: -2,
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              color: '#3b82f6',
              transition: { duration: 0.15 }
            }}
            whileTap={{ scale: 0.97 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </motion.button>

          <div className="wc-actions-divider"></div>

          <LayoutGroup>
            <div className="wc-actions">
              <motion.button
                layout
                layoutId="sample-btn"
                onClick={handleLoadSample}
                className="wc-btn wc-btn-secondary"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                  layout: { type: 'spring', stiffness: 400, damping: 30 }
                }}
                whileHover={{
                  scale: 1.03,
                  y: -2,
                  backgroundColor: '#eff6ff',
                  borderColor: '#93c5fd',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.97, y: 0 }}
                disabled={!!text}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                Sample
              </motion.button>

              <AnimatePresence mode="popLayout">
                {text && (
                  <motion.button
                    layout
                    layoutId="copy-btn"
                    key="copy-btn"
                    onClick={handleCopy}
                    className={`wc-btn wc-btn-secondary ${copySuccess ? 'success' : ''}`}
                    initial={{ opacity: 0, scale: 0.8, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: -10 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                      layout: { type: 'spring', stiffness: 400, damping: 30 }
                    }}
                    whileHover={{
                      scale: 1.03,
                      y: -2,
                      backgroundColor: copySuccess ? '#dcfce7' : '#eff6ff',
                      borderColor: copySuccess ? '#86efac' : '#93c5fd',
                      boxShadow: copySuccess
                        ? '0 4px 12px rgba(34, 197, 94, 0.15)'
                        : '0 4px 12px rgba(59, 130, 246, 0.15)',
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.97, y: 0 }}
                  >
                    {copySuccess ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                        Copy
                      </>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>

              <AnimatePresence mode="popLayout">
                {text && (
                  <motion.button
                    layout
                    layoutId="clear-btn"
                    key="clear-btn"
                    onClick={handleClear}
                    className="wc-btn wc-btn-clear"
                    initial={{ opacity: 0, scale: 0.8, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: -10 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                      delay: 0.05,
                      layout: { type: 'spring', stiffness: 400, damping: 30 }
                    }}
                    whileHover={{
                      scale: 1.03,
                      y: -2,
                      backgroundColor: '#fef2f2',
                      borderColor: '#fca5a5',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.97, y: 0 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Clear
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </LayoutGroup>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="wc-main">
        {/* Text Editor */}
        <motion.div
          className="wc-editor-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="wc-editor-header">
            <span className="wc-editor-label">Your Text</span>
            <motion.div
              className="wc-typing-indicator"
              initial={{ opacity: 0 }}
              animate={{ opacity: isTyping ? 1 : 0 }}
            >
              <span className="wc-typing-dot"></span>
              <span className="wc-typing-dot"></span>
              <span className="wc-typing-dot"></span>
            </motion.div>
          </div>

          {/* New Uiverse-inspired Input Group */}
          <motion.div
            className={`wc-input-group ${isTyping ? 'is-typing' : ''}`}
            animate={{
              opacity: isLoading ? 0.6 : 1
            }}
            transition={{ duration: 0.3 }}
          >
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={`wc-input ${text ? 'has-value' : ''} ${isTyping ? 'is-typing' : ''}`}
              required
            />
            <label className="wc-user-label">Your Text</label>

            {/* Typing Indicator Spinner */}
            <motion.div
              className="wc-typing-indicator"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: isTyping ? 1 : 0,
                scale: isTyping ? 1 : 0.8
              }}
              transition={{ duration: 0.2 }}
            >
              <svg className="wc-spinner" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="31.4 31.4" />
              </svg>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Stats Grid - Horizontal Wrapper */}
        <div className="wc-stats-container">

          {/* Time Estimates Card - White Design */}
          <motion.div
            className="wc-small-card wc-time-card-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.15 }}
            whileHover={{ y: -3, boxShadow: '0 12px 24px rgba(59, 130, 246, 0.12)' }}
          >
            {isLoading ? (
              <div className="wc-skeleton-wrapper">
                <SkeletonBlock className="h-6 w-32 mb-4" />
                <SkeletonBlock className="h-16 w-full mb-3" />
                <SkeletonBlock className="h-16 w-full" />
              </div>
            ) : (
              <>
                {/* Card Header */}
                <motion.div
                  className="wc-time-header"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <div className="wc-time-header-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <span>Time Estimates</span>
                </motion.div>

                {/* Time Items */}
                <div className="wc-time-items">
                  {/* Reading Time */}
                  <motion.div
                    className="wc-time-item-white"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                    whileHover={{ scale: 1.02, backgroundColor: isDarkMode ? '#1e3a8a' : '#eff6ff' }}
                  >
                    <div className="wc-time-item-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                    </div>
                    <div className="wc-time-item-content">
                      <span className="wc-time-item-label">Reading</span>
                      <motion.span
                        className="wc-time-item-value"
                        key={stats.readingTime}
                        initial={{ scale: 1.2, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        {stats.readingTime}
                      </motion.span>
                    </div>
                  </motion.div>

                  {/* Speaking Time */}
                  <motion.div
                    className="wc-time-item-white"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35, type: 'spring', stiffness: 300 }}
                    whileHover={{ scale: 1.02, backgroundColor: isDarkMode ? '#1e3a8a' : '#eff6ff' }}
                  >
                    <div className="wc-time-item-icon wc-speaking">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                    </div>
                    <div className="wc-time-item-content">
                      <span className="wc-time-item-label">Speaking</span>
                      <motion.span
                        className="wc-time-item-value"
                        key={stats.speakingTime}
                        initial={{ scale: 1.2, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        {stats.speakingTime}
                      </motion.span>
                    </div>
                  </motion.div>
                </div>
              </>
            )}
          </motion.div>

          {/* Detailed Statistics Card */}
          <motion.div
            className="wc-small-card wide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.2 }}
            whileHover={{ y: -3, boxShadow: '0 12px 24px rgba(59, 130, 246, 0.08)' }}
          >
            {isLoading ? (
              <div className="wc-skeleton-grid">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="wc-stat-skeleton">
                    <SkeletonBlock className="h-10 w-10 rounded-lg mb-2" />
                    <SkeletonBlock className="h-6 w-16 mb-1" />
                    <SkeletonBlock className="h-3 w-12" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <motion.div
                  className="wc-card-header mb-4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <div className="wc-header-icon-box">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </div>
                  <span>Detailed Statistics</span>
                </motion.div>

                <div className="wc-compact-stats-grid">
                  {statItems.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      className="wc-compact-stat-item"
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                        delay: 0.25 + index * 0.04
                      }}
                      whileHover={{
                        y: -3,
                        scale: 1.02,
                        backgroundColor: isDarkMode ? '#1e3a8a' : '#eff6ff',
                        transition: { duration: 0.15 }
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        className="wc-compact-icon"
                        whileHover={{ rotate: 5 }}
                        transition={{ duration: 0.15 }}
                      >
                        {stat.icon}
                      </motion.div>
                      <div className="wc-compact-info">
                        <motion.span
                          className="wc-compact-value"
                          key={stat.value}
                          initial={{ scale: 1.15, opacity: 0.5 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 400 }}
                        >
                          {stat.value.toLocaleString()}
                        </motion.span>
                        <span className="wc-compact-label">{stat.label}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>

          {/* Keywords Card */}
          <motion.div
            className="wc-small-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {isLoading ? (
              <div className="wc-skeleton-wrapper">
                <SkeletonBlock className="h-6 w-24 mb-4" />
                {[...Array(5)].map((_, i) => (
                  <SkeletonBlock key={i} className="h-8 w-full mb-2 rounded-md" />
                ))}
              </div>
            ) : (
              <>
                <div className="wc-card-header mb-3">
                  <div className="wc-header-icon-box">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="9" x2="20" y2="9" />
                      <line x1="4" y1="15" x2="20" y2="15" />
                      <line x1="10" y1="3" x2="8" y2="21" />
                      <line x1="16" y1="3" x2="14" y2="21" />
                    </svg>
                  </div>
                  <span>Keywords</span>
                </div>
                <div className="wc-keyword-list">
                  {keywords.length > 0 ? (
                    keywords.map((k) => (
                      <div key={k.word} className="wc-keyword-row">
                        <span className="wc-kw-text">{k.word}</span>
                        <span className="wc-kw-badge">{k.count}</span>
                      </div>
                    ))
                  ) : (
                    <div className="wc-empty-keywords">
                      No keywords yet
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>

      <style>{`
                /* Skeleton Loading Animation */
                @keyframes pulse {
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
