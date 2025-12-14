/**
 * Text Summarizer Component
 * Condense long texts into concise summaries
 * 
 * Features:
 * - Adjustable summary length (short, medium, long)
 * - Multiple summary algorithms
 * - Word count reduction stats
 * - Copy to clipboard
 * - Dark mode compatible
 */

import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";

interface TextSummarizerProps {
    onBack: () => void;
    initialText?: string;
}

type SummaryLength = 'short' | 'medium' | 'long';

const TextSummarizer: React.FC<TextSummarizerProps> = ({ onBack, initialText = '' }) => {
    const [inputText, setInputText] = useState(initialText);
    const [summary, setSummary] = useState('');
    const [summaryLength, setSummaryLength] = useState<SummaryLength>('medium');
    const [copied, setCopied] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isTitleHovered, setIsTitleHovered] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Dark mode detection
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkModeEnabled');
        return saved === 'true' || document.body.classList.contains('dark-mode');
    });

    // Simulate initial page load
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    // Sync dark mode with settings
    useEffect(() => {
        const checkDarkMode = () => {
            const saved = localStorage.getItem('darkModeEnabled');
            setIsDarkMode(saved === 'true' || document.body.classList.contains('dark-mode'));
        };

        window.addEventListener('storage', checkDarkMode);
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        return () => {
            window.removeEventListener('storage', checkDarkMode);
            observer.disconnect();
        };
    }, []);

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

    const handleSummarize = () => {
        if (!inputText.trim()) return;

        setIsSummarizing(true);

        // Simulate processing delay for better UX
        setTimeout(() => {
            const result = summarizeText(inputText, summaryLength);
            setSummary(result);
            setIsSummarizing(false);
        }, 1000);
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
            className="ts-container"
        >
            {/* Header Area */}
            <div className="ts-header-area">
                {/* Title Card */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{
                        opacity: 1,
                        y: isTitleHovered ? -4 : 0,
                        boxShadow: isTitleHovered
                            ? '0 20px 40px rgba(59, 130, 246, 0.15)'
                            : '0 4px 20px rgba(0, 0, 0, 0.04)',
                        borderColor: isTitleHovered
                            ? '#3b82f6'
                            : (isDarkMode ? '#334155' : 'rgba(226, 232, 240, 0.8)')
                    }}
                    transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                        mass: 0.8
                    }}
                    className="ts-title-card"
                    onHoverStart={() => setIsTitleHovered(true)}
                    onHoverEnd={() => setIsTitleHovered(false)}
                >
                    <motion.div className="ts-title-gradient" animate={{ opacity: isTitleHovered ? 1 : 0 }} />

                    {isLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
                            <div className="ts-skeleton" style={{ width: '52px', height: '52px', borderRadius: '14px' }} />
                            <div>
                                <div className="ts-skeleton" style={{ width: '180px', height: '24px', marginBottom: '8px' }} />
                                <div className="ts-skeleton" style={{ width: '150px', height: '16px' }} />
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
                            <motion.div
                                className="ts-title-icon-wrapper"
                                animate={{
                                    background: isTitleHovered
                                        ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                                        : (isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff'),
                                    color: isTitleHovered ? '#ffffff' : (isDarkMode ? '#60a5fa' : '#3b82f6'),
                                    scale: isTitleHovered ? 1.05 : 1,
                                    rotate: isTitleHovered ? 3 : 0,
                                }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                style={{ position: 'relative' }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                    style={{ display: 'block', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                                >
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                    <polyline points="10 9 9 9 8 9" />
                                </svg>
                            </motion.div>
                            <div className="ts-title-content">
                                <motion.h1
                                    animate={{ color: isTitleHovered ? '#3b82f6' : (isDarkMode ? '#f1f5f9' : '#1e293b') }}
                                    transition={{ duration: 0.2 }}
                                >
                                    Text Summarizer
                                </motion.h1>
                                <div className="ts-badges">
                                    <motion.span
                                        className="ts-badge"
                                        animate={{
                                            scale: isTitleHovered ? 1.02 : 1,
                                            backgroundColor: isTitleHovered
                                                ? 'rgba(59, 130, 246, 0.1)'
                                                : (isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'),
                                            color: isTitleHovered ? '#3b82f6' : (isDarkMode ? '#94a3b8' : '#64748b'),
                                        }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                        </svg>
                                        AI-Powered
                                    </motion.span>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Main Actions Bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="ts-actions-bar"
                >
                    {/* Navigation Group */}
                    <motion.button
                        onClick={onBack}
                        className="ts-btn ts-btn-ghost"
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

                    <div className="ts-actions-divider"></div>

                    {/* Tool Actions Group */}
                    <LayoutGroup>
                        <div className="ts-actions">
                            <motion.button
                                layout
                                layoutId="clear-btn"
                                onClick={handleClear}
                                className="ts-btn ts-btn-secondary"
                                whileHover={{
                                    scale: 1.02,
                                    backgroundColor: '#f1f5f9',
                                    transition: { duration: 0.15 }
                                }}
                                whileTap={{ scale: 0.97 }}
                                disabled={!inputText && !summary}
                                transition={{
                                    layout: {
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 30
                                    }
                                }}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                                    <line x1="18" y1="9" x2="12" y2="15" />
                                    <line x1="12" y1="9" x2="18" y2="15" />
                                </svg>
                                Clear
                            </motion.button>

                            <motion.button
                                layout
                                layoutId="summarize-btn"
                                onClick={handleSummarize}
                                disabled={!inputText.trim() || isSummarizing}
                                className={`ts-btn ts-btn-primary ${isSummarizing ? 'analyzing' : ''}`}
                                whileHover={{ scale: 1.02, boxShadow: '0 8px 20px rgba(59, 130, 246, 0.35)', transition: { duration: 0.15 } }}
                                whileTap={{ scale: 0.97 }}
                                transition={{
                                    layout: {
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 30
                                    }
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    {isSummarizing ? (
                                        <motion.div
                                            key="summarizing"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <div className="ts-spinner" />
                                            Summarizing...
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="summarize"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                            </svg>
                                            Summarize
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        </div>
                    </LayoutGroup>
                </motion.div>
            </div>

            {/* Main Content */}
            {isLoading ? (
                <div className="ts-content">
                    {/* Input Section Skeleton */}
                    <div className="ts-input-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div className="ts-skeleton" style={{ width: '100px', height: '14px' }} />
                            <div className="ts-skeleton" style={{ width: '80px', height: '24px', borderRadius: '12px' }} />
                        </div>
                        <div className="ts-skeleton" style={{ width: '100%', height: '240px', marginBottom: '20px' }} />

                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <div className="ts-skeleton" style={{ width: '120px', height: '12px', marginBottom: '8px' }} />
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                    <div className="ts-skeleton" style={{ height: '60px' }} />
                                    <div className="ts-skeleton" style={{ height: '60px' }} />
                                    <div className="ts-skeleton" style={{ height: '60px' }} />
                                </div>
                            </div>
                            <div className="ts-skeleton" style={{ width: '180px', height: '48px' }} />
                        </div>
                    </div>

                    {/* Sidebar Skeleton */}
                    <aside className="ts-sidebar">
                        <div className="ts-summary-card">
                            <div className="ts-skeleton" style={{ width: '100px', height: '14px', marginBottom: '16px' }} />
                            <div className="ts-skeleton" style={{ width: '100%', height: '120px', marginBottom: '16px' }} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                <div className="ts-skeleton" style={{ height: '60px' }} />
                                <div className="ts-skeleton" style={{ height: '60px' }} />
                            </div>
                            <div className="ts-skeleton" style={{ width: '100%', height: '40px' }} />
                        </div>
                        <div className="ts-tips-card">
                            <div className="ts-skeleton" style={{ width: '80px', height: '14px', marginBottom: '16px' }} />
                            <div className="ts-skeleton" style={{ width: '100%', height: '35px', marginBottom: '10px' }} />
                            <div className="ts-skeleton" style={{ width: '100%', height: '35px', marginBottom: '10px' }} />
                            <div className="ts-skeleton" style={{ width: '100%', height: '35px' }} />
                        </div>
                    </aside>
                </div>
            ) : (
                <div className="ts-content">
                    {/* Input Section */}
                    <motion.div
                        className="ts-input-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="ts-floating-textarea-group">
                            <textarea
                                className={`ts-floating-textarea ${inputText ? 'has-value' : ''}`}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                rows={12}
                            />
                            <label className="ts-floating-textarea-label">Paste your text here to summarize...</label>
                            <span className="ts-word-count-badge">{inputWordCount} words</span>
                        </div>

                        {/* Summary Length Selector */}
                        <div className="ts-controls">
                            <div className="ts-control-group">
                                <label className="ts-control-label">Summary Length</label>
                                <div className="ts-length-tabs">
                                    {([
                                        { value: 'short', label: 'Short', desc: '~20%' },
                                        { value: 'medium', label: 'Medium', desc: '~40%' },
                                        { value: 'long', label: 'Long', desc: '~60%' }
                                    ] as const).map(({ value, label, desc }) => (
                                        <motion.button
                                            key={value}
                                            className={`ts-length-tab ${summaryLength === value ? 'active' : ''}`}
                                            onClick={() => setSummaryLength(value)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <span className="ts-length-label">{label}</span>
                                            <span className="ts-length-desc">{desc}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </motion.div>

                    {/* Output Section */}
                    <motion.aside
                        className="ts-sidebar"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <motion.div 
                            className={`ts-summary-card-v2 ${summary ? 'has-content' : ''}`}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            <div className="ts-card-header-v2">
                                <div className="ts-card-icon-v2 ts-card-icon-green">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                    </svg>
                                </div>
                                <span className="ts-card-title-v2">Summary</span>
                                {summary && (
                                    <motion.div 
                                        className="ts-success-badge"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </motion.div>
                                )}
                            </div>

                            <AnimatePresence mode="wait">
                                {summary ? (
                                    <motion.div
                                        key="summary"
                                        initial={{ opacity: 0, scale: 0.96 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.96 }}
                                        transition={{ duration: 0.25, ease: 'easeOut' }}
                                        className="ts-summary-output-v2"
                                    >
                                        <motion.div 
                                            className="ts-summary-text-v2"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            {summary}
                                        </motion.div>

                                        {/* Stats */}
                                        <div className="ts-stats-grid-v2">
                                            <div className="ts-stat-item-v2">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M4 7V4h16v3" />
                                                    <path d="M9 20h6" />
                                                    <path d="M12 4v16" />
                                                </svg>
                                                <span className="ts-stat-value-v2">{summaryWordCount}</span>
                                                <span className="ts-stat-label-v2">words</span>
                                            </div>
                                            <div className="ts-stat-item-v2">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                                    <polyline points="17 6 23 6 23 12" />
                                                </svg>
                                                <span className="ts-stat-value-v2" style={{ color: '#10b981' }}>
                                                    {reductionPercent}%
                                                </span>
                                                <span className="ts-stat-label-v2">reduced</span>
                                            </div>
                                        </div>

                                        <motion.button
                                            className="ts-copy-btn-v2"
                                            onClick={handleCopy}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                        >
                                            <AnimatePresence mode="wait">
                                                {copied ? (
                                                    <motion.span
                                                        key="copied"
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -8 }}
                                                        className="ts-copy-content"
                                                    >
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                        Copied
                                                    </motion.span>
                                                ) : (
                                                    <motion.span
                                                        key="copy"
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -8 }}
                                                        className="ts-copy-content"
                                                    >
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                        </svg>
                                                        Copy
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </motion.button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="ts-summary-empty-v2"
                                    >
                                        <div className="ts-empty-icon-v2">
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14 2 14 8 20 8" />
                                                <line x1="16" y1="13" x2="8" y2="13" opacity="0.4" />
                                                <line x1="16" y1="17" x2="8" y2="17" opacity="0.4" />
                                            </svg>
                                        </div>
                                        <p>Your summary will appear here</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Tips Card */}
                        <motion.div 
                            className="ts-tips-card-v2"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            <div className="ts-card-header-v2">
                                <div className="ts-card-icon-v2 ts-card-icon-blue">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 16v-4" />
                                        <path d="M12 8h.01" />
                                    </svg>
                                </div>
                                <span className="ts-card-title-v2">Pro Tips</span>
                            </div>
                            <div className="ts-tips-content-v2">
                                <motion.div
                                    className="ts-tip-item-v2"
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    whileHover={{ x: 4 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className="ts-tip-icon-v2" style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <line x1="16" y1="13" x2="8" y2="13" />
                                            <line x1="16" y1="17" x2="8" y2="17" />
                                        </svg>
                                    </div>
                                    <span>Longer texts produce better summaries</span>
                                </motion.div>
                                <motion.div
                                    className="ts-tip-item-v2"
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    whileHover={{ x: 4 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className="ts-tip-icon-v2" style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    </div>
                                    <span>Use "Short" for quick overviews</span>
                                </motion.div>
                                <motion.div
                                    className="ts-tip-item-v2"
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    whileHover={{ x: 4 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className="ts-tip-icon-v2" style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </div>
                                    <span>Review and edit for best results</span>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.aside>
                </div>
            )}

            <style>{`
                .ts-container {
                    min-height: 100%;
                    padding: 24px;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                }

                body.dark-mode .ts-container {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                }

                /* Header Area */
                .ts-header-area {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    gap: 24px;
                    margin-bottom: 32px;
                    flex-wrap: wrap;
                }

                .ts-title-card {
                    padding: 20px 24px;
                    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                    border-radius: 20px;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                    min-width: 320px;
                }

                body.dark-mode .ts-title-card {
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                    border-color: #334155;
                }

                .ts-title-gradient {
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 160px;
                    height: 160px;
                    background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
                    border-radius: 50%;
                    transform: translate(30%, -30%);
                    pointer-events: none;
                }

                .ts-title-icon-wrapper {
                    width: 52px;
                    height: 52px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    position: relative;
                }

                .ts-title-content {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    gap: 4px;
                }

                .ts-title-content h1 {
                    font-size: 22px;
                    font-weight: 700;
                    margin: 0;
                    line-height: 1.2;
                }

                .ts-badges {
                    display: flex;
                    gap: 8px;
                }

                .ts-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 5px 10px;
                    font-size: 11px;
                    font-weight: 600;
                    border-radius: 20px;
                    transition: all 0.2s;
                }

                .ts-badge svg {
                    flex-shrink: 0;
                }

                /* Actions Bar */
                .ts-actions-bar {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                .ts-actions-divider {
                    width: 1px;
                    height: 24px;
                    background: #e2e8f0;
                    margin: 0 4px;
                }

                body.dark-mode .ts-actions-divider {
                    background: #334155;
                }

                .ts-actions {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }

                .ts-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 16px;
                    border-radius: 12px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    border: 1px solid transparent;
                    background: transparent;
                    white-space: nowrap;
                }

                .ts-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                    pointer-events: none;
                }

                .ts-btn-ghost {
                    background: white;
                    border: 1px solid #e2e8f0;
                    color: #64748b;
                }

                .ts-btn-secondary {
                    background: white;
                    border: 1px solid #e2e8f0;
                    color: #64748b;
                }

                .ts-btn-primary {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }

                .ts-btn-primary.analyzing {
                    background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
                    box-shadow: none;
                }

                .ts-spinner {
                    width: 14px;
                    height: 14px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: ts-spin 0.8s linear infinite;
                }

                @keyframes ts-spin {
                    to { transform: rotate(360deg); }
                }

                body.dark-mode .ts-btn-ghost,
                body.dark-mode .ts-btn-secondary {
                    background: #1e293b;
                    border-color: #334155;
                    color: #94a3b8;
                }

                body.dark-mode .ts-btn-ghost:hover,
                body.dark-mode .ts-btn-secondary:hover {
                    background: #334155 !important;
                    color: #f1f5f9 !important;
                }

                /* Content Layout */
                .ts-content {
                    display: grid;
                    grid-template-columns: 1fr 300px;
                    gap: 24px;
                    min-height: calc(100vh - 200px);
                }

                @media (max-width: 900px) {
                    .ts-content {
                        grid-template-columns: 1fr;
                    }
                }

                /* Input Section */
                .ts-input-section {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    padding: 24px;
                }

                body.dark-mode .ts-input-section {
                    background: #1e293b;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                }

                .ts-section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .ts-section-header h3 {
                    font-size: 14px;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                body.dark-mode .ts-section-header h3 {
                    color: #f1f5f9;
                }

                /* Floating Textarea Style */
                .ts-floating-textarea-group {
                    position: relative;
                }

                .ts-floating-textarea {
                    width: 100%;
                    padding: 20px 16px 14px;
                    border: 1.5px solid #cbd5e1;
                    border-radius: 12px;
                    font-size: 14px;
                    line-height: 1.7;
                    color: #1e293b;
                    background: transparent;
                    resize: vertical;
                    font-family: inherit;
                    transition: border 150ms cubic-bezier(0.4, 0, 0.2, 1);
                    outline: none;
                    min-height: 280px;
                }

                .ts-floating-textarea:focus,
                .ts-floating-textarea.has-value {
                    border: 1.5px solid #3b82f6;
                }

                .ts-floating-textarea-label {
                    position: absolute;
                    left: 14px;
                    top: 18px;
                    color: #94a3b8;
                    pointer-events: none;
                    transition: 150ms cubic-bezier(0.4, 0, 0.2, 1);
                    font-size: 14px;
                    font-weight: 500;
                    background: transparent;
                    padding: 0;
                }

                .ts-floating-textarea:focus ~ .ts-floating-textarea-label,
                .ts-floating-textarea.has-value ~ .ts-floating-textarea-label {
                    transform: translateY(-26px) scale(0.85);
                    background-color: white;
                    padding: 0 6px;
                    color: #3b82f6;
                    font-weight: 600;
                }

                .ts-word-count-badge {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #64748b;
                    padding: 4px 10px;
                    background: rgba(248, 250, 252, 0.9);
                    border-radius: 8px;
                    backdrop-filter: blur(4px);
                }

                body.dark-mode .ts-floating-textarea {
                    border-color: #475569;
                    color: #e2e8f0;
                    background: transparent;
                }

                body.dark-mode .ts-floating-textarea:focus,
                body.dark-mode .ts-floating-textarea.has-value {
                    border-color: #60a5fa;
                }

                body.dark-mode .ts-floating-textarea-label {
                    color: #64748b;
                }

                body.dark-mode .ts-floating-textarea:focus ~ .ts-floating-textarea-label,
                body.dark-mode .ts-floating-textarea.has-value ~ .ts-floating-textarea-label {
                    background-color: #1e293b;
                    color: #60a5fa;
                }

                body.dark-mode .ts-word-count-badge {
                    background: rgba(15, 23, 42, 0.9);
                    color: #94a3b8;
                }

                /* Legacy styles */
                .ts-word-count {
                    font-size: 13px;
                    font-weight: 600;
                    color: #64748b;
                    padding: 4px 10px;
                    background: #f8fafc;
                    border-radius: 12px;
                }

                body.dark-mode .ts-word-count {
                    background: #0f172a;
                    color: #94a3b8;
                }

                .ts-textarea {
                    width: 100%;
                    padding: 14px;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 14px;
                    line-height: 1.7;
                    color: #1e293b;
                    background: white;
                    resize: vertical;
                    font-family: inherit;
                    transition: all 0.2s;
                }

                .ts-textarea:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .ts-textarea::placeholder {
                    color: #94a3b8;
                }

                body.dark-mode .ts-textarea {
                    background: #0f172a;
                    border-color: #334155;
                    color: #e2e8f0;
                }

                body.dark-mode .ts-textarea:focus {
                    border-color: #60a5fa;
                    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
                }

                /* Controls */
                .ts-controls {
                    margin-top: 20px;
                    display: flex;
                    gap: 16px;
                    align-items: flex-end;
                    flex-wrap: wrap;
                }

                .ts-control-group {
                    flex: 1;
                    min-width: 250px;
                }

                .ts-control-label {
                    display: block;
                    font-size: 12px;
                    font-weight: 700;
                    color: #475569;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                body.dark-mode .ts-control-label {
                    color: #cbd5e1;
                }

                .ts-length-tabs {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                }

                .ts-length-tab {
                    padding: 10px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 3px;
                }

                .ts-length-label {
                    font-weight: 700;
                }

                .ts-length-desc {
                    font-size: 11px;
                    opacity: 0.7;
                }

                .ts-length-tab:hover {
                    background: #eff6ff;
                    border-color: #3b82f6;
                    color: #3b82f6;
                }

                .ts-length-tab.active {
                    background: #eff6ff;
                    border-color: #3b82f6;
                    color: #3b82f6;
                }

                body.dark-mode .ts-length-tab {
                    background: #0f172a;
                    border-color: #334155;
                    color: #94a3b8;
                }

                body.dark-mode .ts-length-tab:hover,
                body.dark-mode .ts-length-tab.active {
                    background: #334155;
                    border-color: #60a5fa;
                    color: #60a5fa;
                }

                /* Sidebar */
                .ts-sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                /* New Minimalistic Card Styles V2 */
                .ts-summary-card-v2,
                .ts-tips-card-v2 {
                    background: white;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 16px;
                    padding: 20px;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                }

                .ts-summary-card-v2.has-content {
                    border-color: rgba(16, 185, 129, 0.3);
                    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.08);
                }

                body.dark-mode .ts-summary-card-v2,
                body.dark-mode .ts-tips-card-v2 {
                    background: rgba(30, 41, 59, 0.8);
                    border-color: rgba(51, 65, 85, 0.6);
                    backdrop-filter: blur(8px);
                }

                body.dark-mode .ts-summary-card-v2.has-content {
                    border-color: rgba(52, 211, 153, 0.3);
                    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.12);
                }

                .ts-success-badge {
                    margin-left: auto;
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .ts-card-header-v2 {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 18px;
                }

                .ts-card-icon-v2 {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .ts-card-icon-green {
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.06) 100%);
                    color: #10b981;
                }

                body.dark-mode .ts-card-icon-green {
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%);
                    color: #34d399;
                }

                .ts-card-icon-blue {
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%);
                    color: #3b82f6;
                }

                body.dark-mode .ts-card-icon-blue {
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
                    color: #60a5fa;
                }

                .ts-card-title-v2 {
                    font-size: 13px;
                    font-weight: 600;
                    color: #334155;
                    letter-spacing: 0.3px;
                    text-transform: uppercase;
                }

                body.dark-mode .ts-card-title-v2 {
                    color: #e2e8f0;
                }

                /* Summary Output V2 */
                .ts-summary-output-v2 {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .ts-summary-text-v2 {
                    font-size: 13.5px;
                    line-height: 1.7;
                    color: #475569;
                    padding: 14px 16px;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border-radius: 10px;
                    border-left: 3px solid #10b981;
                }

                body.dark-mode .ts-summary-text-v2 {
                    background: linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%);
                    color: #cbd5e1;
                    border-left-color: #34d399;
                }

                .ts-stats-grid-v2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }

                .ts-stat-item-v2 {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 12px;
                    background: rgba(248, 250, 252, 0.8);
                    border-radius: 8px;
                }

                body.dark-mode .ts-stat-item-v2 {
                    background: rgba(15, 23, 42, 0.5);
                }

                .ts-stat-value-v2 {
                    font-size: 16px;
                    font-weight: 700;
                    color: #1e293b;
                }

                body.dark-mode .ts-stat-value-v2 {
                    color: #f1f5f9;
                }

                .ts-stat-label-v2 {
                    font-size: 11px;
                    font-weight: 500;
                    color: #64748b;
                }

                body.dark-mode .ts-stat-label-v2 {
                    color: #94a3b8;
                }

                .ts-copy-btn-v2 {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 10px 18px;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    overflow: hidden;
                    position: relative;
                }

                .ts-copy-btn-v2::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 100%);
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .ts-copy-btn-v2:hover::before {
                    opacity: 1;
                }

                .ts-copy-content {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                /* Empty State V2 */
                .ts-summary-empty-v2 {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 32px 16px;
                    text-align: center;
                }

                .ts-empty-icon-v2 {
                    color: #cbd5e1;
                    margin-bottom: 12px;
                }

                body.dark-mode .ts-empty-icon-v2 {
                    color: #475569;
                }

                .ts-summary-empty-v2 p {
                    font-size: 13px;
                    color: #94a3b8;
                    margin: 0;
                    font-weight: 500;
                }

                body.dark-mode .ts-summary-empty-v2 p {
                    color: #64748b;
                }

                /* Tips Content V2 */
                .ts-tips-content-v2 {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .ts-tip-item-v2 {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    border-radius: 10px;
                    cursor: default;
                    transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }

                .ts-tip-icon-v2 {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .ts-tip-icon-v2 svg {
                    display: block;
                }

                .ts-tip-item-v2 span {
                    font-size: 13px;
                    color: #64748b;
                    line-height: 1.5;
                    font-weight: 450;
                }

                body.dark-mode .ts-tip-item-v2 span {
                    color: #94a3b8;
                }

                /* Legacy styles kept for compatibility */
                .ts-summary-card,
                .ts-tips-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 18px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                body.dark-mode .ts-summary-card,
                body.dark-mode .ts-tips-card {
                    background: #1e293b;
                    border-color: #334155;
                }

                .ts-card-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 16px;
                }

                .ts-card-header h3 {
                    font-size: 13px;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                body.dark-mode .ts-card-header h3 {
                    color: #f1f5f9;
                }

                .ts-summary-empty {
                    text-align: center;
                    padding: 40px 20px;
                    color: #94a3b8;
                }

                .ts-summary-empty svg {
                    margin-bottom: 12px;
                    opacity: 0.5;
                }

                .ts-summary-empty p {
                    font-size: 13px;
                    margin: 0;
                }

                /* Tips Content */
                .ts-tips-content {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .ts-tip-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                }

                .ts-tip-icon {
                    font-size: 16px;
                    flex-shrink: 0;
                }

                .ts-tip-item p {
                    font-size: 12px;
                    color: #64748b;
                    margin: 0;
                    line-height: 1.5;
                }

                body.dark-mode .ts-tip-item p {
                    color: #94a3b8;
                }

                /* Skeleton Loading */
                .ts-skeleton {
                    background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
                    background-size: 200% 100%;
                    animation: loading 1.5s infinite;
                    border-radius: 8px;
                }

                body.dark-mode .ts-skeleton {
                    background: linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%);
                    background-size: 200% 100%;
                }

                @keyframes loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                /* Skeleton Loading */
                .ts-skeleton {
                    background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
                    background-size: 200% 100%;
                    animation: ts-loading 1.5s infinite;
                    border-radius: 8px;
                }

                body.dark-mode .ts-skeleton {
                    background: linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%);
                    background-size: 200% 100%;
                }

                @keyframes ts-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </motion.div>
    );
};

export default TextSummarizer;
