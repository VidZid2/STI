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
import {
    checkGrammar,
    applyFix,
    getLanguageToolStatus,
    getCategoryColor,
    IssueCategory,
    type GrammarIssue,
    type IssueCategoryType
} from "../../lib/converters/languageToolService";

interface LanguageToolGrammarCheckerProps {
    onBack: () => void;
    initialText?: string;
}

const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog. This sentense has a spelling error.

I has went to the store yesterday to buy some grocerys. Its a beautifull day, isnt it?

Their going to they're house over there. Your the best person I know, and you're help is appreciated.`;

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
    const [hoveredIssue, setHoveredIssue] = useState<GrammarIssue | null>(null);
    const [hoverPosition, setHoverPosition] = useState<{ x: number, y: number } | null>(null);
    const [apiStatus, setApiStatus] = useState(getLanguageToolStatus());
    const [isDismissHovered, setIsDismissHovered] = useState(false);
    const [isTitleHovered, setIsTitleHovered] = useState(false);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    // Page load state
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
        }, 1200);
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
        setHoveredIssue(null);

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
        setHoveredIssue(null);
    }, [text]);

    // Handle dismiss
    const handleDismiss = useCallback((issue: GrammarIssue) => {
        setIssues(prev => prev.filter(i => i.id !== issue.id));
        setHoveredIssue(null);
    }, []);

    // Handle clear
    const handleClear = useCallback(() => {
        setText("");
        setIssues([]);
        setError(null);
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
        if (textareaRef.current && backdropRef.current) {
            backdropRef.current.scrollTop = textareaRef.current.scrollTop;
        }
        setHoveredIssue(null);
    }, []);

    // Get underline color class
    const getUnderlineClass = (category: IssueCategoryType): string => {
        switch (category) {
            case IssueCategory.Error:
                return 'underline-error';
            case IssueCategory.Warning:
                return 'underline-warning';
            case IssueCategory.Info:
                return 'underline-info';
            default:
                return 'underline-default';
        }
    };

    // Render highlights
    const renderHighlights = useMemo(() => {
        if (!text) return null;

        // Sort issues by offset
        const sortedIssues = [...issues].sort((a, b) => a.offset - b.offset);

        const segments: { text: string; issue?: GrammarIssue }[] = [];
        let lastIndex = 0;

        sortedIssues.forEach(issue => {
            // Add text before this issue
            if (issue.offset > lastIndex) {
                segments.push({ text: text.slice(lastIndex, issue.offset) });
            }
            // Add the issue text
            segments.push({
                text: text.slice(issue.offset, issue.offset + issue.length),
                issue
            });
            lastIndex = issue.offset + issue.length;
        });

        // Add remaining text
        if (lastIndex < text.length) {
            segments.push({ text: text.slice(lastIndex) });
        }

        return segments.map((segment, idx) => {
            if (segment.issue) {
                return (
                    <span
                        key={idx}
                        className={`highlight-span ${getUnderlineClass(segment.issue.category)}`}
                        onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const containerRect = containerRef.current?.getBoundingClientRect();
                            if (containerRect) {
                                setHoverPosition({
                                    x: rect.left - containerRect.left,
                                    y: rect.bottom - containerRect.top + 8
                                });
                                setHoveredIssue(segment.issue || null);
                            }
                        }}
                    >
                        {segment.text}
                    </span>
                );
            }
            return <span key={idx}>{segment.text}</span>;
        });
    }, [text, issues]);

    // Count issues by category
    const issueCounts = useMemo(() => ({
        errors: issues.filter(i => i.category === IssueCategory.Error).length,
        warnings: issues.filter(i => i.category === IssueCategory.Warning).length,
        info: issues.filter(i => i.category === IssueCategory.Info).length,
    }), [issues]);

    // Calculate stats
    const stats = useMemo(() => {
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
        const readingTime = Math.ceil(words / 200);

        return { words, chars, sentences, readingTime };
    }, [text]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lt-grammar-checker"
        >
            {/* Header Area */}
            <div className="lt-header-area">
                {/* Title Card (Top Left) */}
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
                    className="lt-title-card"
                    onHoverStart={() => setIsTitleHovered(true)}
                    onHoverEnd={() => setIsTitleHovered(false)}
                >
                    {/* Animated gradient overlay */}
                    <motion.div
                        animate={{
                            opacity: isTitleHovered ? 1 : 0,
                            scale: isTitleHovered ? 1.2 : 1,
                        }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '160px',
                            height: '160px',
                            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
                            borderRadius: '50%',
                            transform: 'translate(30%, -30%)',
                            pointerEvents: 'none',
                        }}
                    />

                    {isLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
                            <div className="lt-skeleton" style={{ width: '52px', height: '52px', borderRadius: '14px' }} />
                            <div>
                                <div className="lt-skeleton" style={{ width: '180px', height: '24px', marginBottom: '8px' }} />
                                <div className="lt-skeleton" style={{ width: '150px', height: '16px' }} />
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
                            <motion.div
                                className="lt-title-icon-wrapper"
                                animate={{
                                    background: isTitleHovered
                                        ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                                        : (isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff'),
                                    color: isTitleHovered ? '#ffffff' : (isDarkMode ? '#60a5fa' : '#3b82f6'),
                                    scale: isTitleHovered ? 1.05 : 1,
                                    rotate: isTitleHovered ? 3 : 0,
                                    boxShadow: isTitleHovered
                                        ? '0 10px 25px rgba(59, 130, 246, 0.35)'
                                        : '0 2px 8px rgba(0, 0, 0, 0.04)'
                                }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 20,
                                }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                            </motion.div>
                            <div>
                                <motion.h1
                                    animate={{ color: isTitleHovered ? '#3b82f6' : (isDarkMode ? '#f1f5f9' : '#1e293b') }}
                                    transition={{ duration: 0.2 }}
                                >
                                    Grammar Checker
                                </motion.h1>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                    <motion.span
                                        className="lt-badge"
                                        animate={{
                                            scale: isTitleHovered ? 1.02 : 1,
                                            backgroundColor: isTitleHovered
                                                ? 'rgba(59, 130, 246, 0.1)'
                                                : (isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'),
                                            color: isTitleHovered ? '#3b82f6' : (isDarkMode ? '#94a3b8' : '#64748b'),
                                        }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                        LanguageTool
                                    </motion.span>
                                    <motion.span
                                        className="lt-badge"
                                        animate={{
                                            scale: isTitleHovered ? 1.02 : 1,
                                            backgroundColor: isTitleHovered
                                                ? 'rgba(139, 92, 246, 0.1)'
                                                : (isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'),
                                            color: isTitleHovered ? '#8b5cf6' : (isDarkMode ? '#94a3b8' : '#64748b'),
                                        }}
                                        transition={{ duration: 0.2, delay: 0.05 }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                            <path d="M2 17l10 5 10-5" />
                                            <path d="M2 12l10 5 10-5" />
                                        </svg>
                                        AI Analysis
                                    </motion.span>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Main Actions Bar (Top Right) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="lt-actions-bar"
                >
                    {/* Navigation Group */}
                    <motion.button
                        onClick={onBack}
                        className="lt-btn lt-btn-ghost"
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

                    <div className="lt-actions-divider"></div>

                    {/* Tool Actions Group */}
                    <LayoutGroup>
                        <div className="lt-actions">
                            <motion.button
                                layout
                                layoutId="clear-btn"
                                onClick={handleClear}
                                className="lt-btn lt-btn-secondary"
                                whileHover={{
                                    scale: 1.02,
                                    backgroundColor: '#f1f5f9',
                                    transition: { duration: 0.15 }
                                }}
                                whileTap={{ scale: 0.97 }}
                                disabled={!text}
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

                            <AnimatePresence mode="wait">
                                {issues.length > 0 && (
                                    <motion.button
                                        layout
                                        layoutId="fix-all-btn"
                                        key="fix-all-btn"
                                        onClick={handleFixAll}
                                        className="lt-btn lt-btn-fix-all"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{
                                            layout: {
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 30
                                            },
                                            opacity: { duration: 0.15 },
                                            scale: { type: 'spring', stiffness: 400, damping: 25 }
                                        }}
                                        whileHover={{
                                            scale: 1.02,
                                            transition: { duration: 0.15 }
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <motion.svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            initial={{ rotate: -10 }}
                                            animate={{ rotate: 0 }}
                                            transition={{ type: 'spring', stiffness: 300 }}
                                        >
                                            <path d="M15 4V2" />
                                            <path d="M15 16v-2" />
                                            <path d="M8 9h2" />
                                            <path d="M20 9h2" />
                                            <path d="M17.8 11.8L19 13" />
                                            <path d="M15 9h0" />
                                            <path d="M17.8 6.2L19 5" />
                                            <path d="M3 21l9-9" />
                                            <path d="M12.2 6.2L11 5" />
                                        </motion.svg>
                                        <span>Fix All</span>
                                        <motion.span
                                            className="lt-btn-count"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 500, delay: 0.1 }}
                                        >
                                            {issues.length}
                                        </motion.span>
                                    </motion.button>
                                )}
                            </AnimatePresence>

                            <motion.button
                                layout
                                layoutId="check-grammar-btn"
                                onClick={performAnalysis}
                                disabled={isAnalyzing || !text.trim() || !apiStatus.canRequest}
                                className={`lt-btn lt-btn-primary ${isAnalyzing ? 'analyzing' : ''}`}
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
                                    {isAnalyzing ? (
                                        <motion.div
                                            key="analyzing"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <div className="lt-spinner" />
                                            Analyzing...
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="check"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                <polyline points="22 4 12 14.01 9 11.01" />
                                            </svg>
                                            Check Grammar
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        </div>
                    </LayoutGroup>
                </motion.div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="lt-error"
                    >
                        <span>⚠️ {error}</span>
                        <button onClick={() => setError(null)}>×</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="lt-content">
                {/* Editor Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="lt-editor-section"
                >
                    <div
                        ref={containerRef}
                        className="lt-editor-container"
                        onMouseLeave={() => setHoveredIssue(null)}
                    >
                        {isLoading ? (
                            <div style={{ padding: '24px', height: '100%' }}>
                                <div className="lt-skeleton" style={{ width: '40%', height: '28px', marginBottom: '24px' }}></div>
                                <div className="lt-skeleton" style={{ width: '100%', height: '16px', marginBottom: '12px' }}></div>
                                <div className="lt-skeleton" style={{ width: '95%', height: '16px', marginBottom: '12px' }}></div>
                                <div className="lt-skeleton" style={{ width: '90%', height: '16px', marginBottom: '12px' }}></div>
                                <div className="lt-skeleton" style={{ width: '98%', height: '16px', marginBottom: '12px' }}></div>
                                <div className="lt-skeleton" style={{ width: '60%', height: '16px', marginBottom: '32px' }}></div>

                                <div className="lt-skeleton" style={{ width: '100%', height: '16px', marginBottom: '12px' }}></div>
                                <div className="lt-skeleton" style={{ width: '92%', height: '16px', marginBottom: '12px' }}></div>
                                <div className="lt-skeleton" style={{ width: '96%', height: '16px', marginBottom: '12px' }}></div>
                                <div className="lt-skeleton" style={{ width: '50%', height: '16px' }}></div>
                            </div>
                        ) : (
                            <>
                                {/* Show rendered text with highlights when we have issues */}
                                {issues.length > 0 && (
                                    <div
                                        ref={backdropRef}
                                        className="lt-rendered-text"
                                        onClick={() => {
                                            // Focus textarea when clicking rendered area
                                            textareaRef.current?.focus();
                                        }}
                                    >
                                        {renderHighlights}
                                    </div>
                                )}

                                {/* Input Layer (Textarea) - visible when no issues or when editing */}
                                <textarea
                                    ref={textareaRef}
                                    value={text}
                                    onChange={(e) => {
                                        setText(e.target.value);
                                        // Clear issues when text changes
                                        if (issues.length > 0) {
                                            setIssues([]);
                                        }
                                    }}
                                    onScroll={handleScroll}
                                    className={`lt-textarea ${issues.length > 0 ? 'lt-textarea-hidden' : ''}`}
                                    placeholder="Type or paste your text here to check for grammar, spelling, and style issues..."
                                    spellCheck={false}
                                />

                                {/* Hover Tooltip */}
                                <AnimatePresence>
                                    {hoveredIssue && hoverPosition && (
                                        <motion.div
                                            className="lt-tooltip"
                                            style={{
                                                top: hoverPosition.y + 10,
                                                left: Math.min(hoverPosition.x - 14, (containerRef.current?.offsetWidth || 0) - 300)
                                            }}
                                            initial={{ opacity: 0, y: 4, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 4, scale: 0.96 }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 25,
                                                mass: 0.8
                                            }}
                                            onMouseEnter={() => { }}
                                            onMouseLeave={() => setHoveredIssue(null)}
                                        >
                                            <div className="lt-tooltip-arrow" />

                                            <div className="lt-tooltip-header">
                                                <div className="lt-tooltip-category-wrapper" style={{ color: getCategoryColor(hoveredIssue.category) }}>
                                                    <span
                                                        className="lt-category-dot"
                                                        style={{ backgroundColor: getCategoryColor(hoveredIssue.category) }}
                                                    />
                                                    <span className="lt-category-name">
                                                        {hoveredIssue.categoryName}
                                                    </span>
                                                </div>
                                                <div style={{ position: 'relative' }}>
                                                    <button
                                                        onClick={() => handleDismiss(hoveredIssue)}
                                                        className="lt-tooltip-dismiss"
                                                        onMouseEnter={() => setIsDismissHovered(true)}
                                                        onMouseLeave={() => setIsDismissHovered(false)}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                                        </svg>
                                                    </button>
                                                    <AnimatePresence>
                                                        {isDismissHovered && (
                                                            <motion.div
                                                                initial={{ opacity: 0, x: -5, scale: 0.9 }}
                                                                animate={{
                                                                    opacity: 1,
                                                                    x: 0,
                                                                    scale: 1,
                                                                    transition: { delay: 1.5, duration: 0.2 }
                                                                }}
                                                                exit={{
                                                                    opacity: 0,
                                                                    scale: 0.9,
                                                                    transition: { delay: 0, duration: 0.1 }
                                                                }}
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '-2px',
                                                                    left: '34px',
                                                                    background: 'white',
                                                                    color: '#3b82f6',
                                                                    padding: '6px 10px',
                                                                    borderRadius: '8px',
                                                                    fontSize: '11px',
                                                                    fontWeight: 600,
                                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                                    whiteSpace: 'nowrap',
                                                                    pointerEvents: 'none',
                                                                    zIndex: 10
                                                                }}
                                                            >
                                                                Ignore this issue?
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    top: '10px',
                                                                    left: '-3px',
                                                                    width: '8px',
                                                                    height: '8px',
                                                                    background: 'white',
                                                                    transform: 'rotate(45deg)',
                                                                    zIndex: -1
                                                                }} />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>

                                            <p className="lt-tooltip-message">{hoveredIssue.message}</p>

                                            {hoveredIssue.replacements.length > 0 && (
                                                <div className="lt-tooltip-suggestions">
                                                    <span className="lt-suggestions-label">Suggestions:</span>
                                                    {hoveredIssue.replacements.slice(0, 3).map((replacement, idx) => (
                                                        <motion.button
                                                            key={idx}
                                                            onClick={() => handleApplyFix(hoveredIssue, replacement)}
                                                            className="lt-suggestion-btn"
                                                            whileHover={{ x: 2, backgroundColor: "rgba(0,0,0,0.02)" }}
                                                            whileTap={{ scale: 0.99 }}
                                                        >
                                                            <span className="lt-suggestion-text">{replacement || '(remove)'}</span>
                                                            <span className="lt-apply-icon">
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={getCategoryColor(hoveredIssue.category)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                            </span>
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        )}
                    </div>
                </motion.div>

                {/* Sidebar */}
                <motion.aside
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="lt-sidebar"
                >
                    {/* Issue Summary */}
                    <motion.div
                        className="lt-issues-summary"
                        whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    >
                        <div className="lt-card-header">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                            <h3>Issues Found</h3>
                        </div>

                        <div className="lt-issue-categories">
                            {isAnalyzing || isLoading ? (
                                <>
                                    <div className="lt-skeleton lt-skeleton-item"></div>
                                    <div className="lt-skeleton lt-skeleton-item" style={{ width: '80%' }}></div>
                                    <div className="lt-skeleton lt-skeleton-item" style={{ width: '60%' }}></div>
                                </>
                            ) : (
                                <>
                                    {issueCounts.errors > 0 && (
                                        <motion.div
                                            className="lt-category-item error"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            whileHover={{ x: 4, transition: { duration: 0.15 } }}
                                        >
                                            <span className="lt-category-icon-wrapper error">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="15" y1="9" x2="9" y2="15" />
                                                    <line x1="9" y1="9" x2="15" y2="15" />
                                                </svg>
                                            </span>
                                            <span className="lt-category-label">Errors</span>
                                            <motion.span
                                                className="lt-category-count error"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                            >
                                                {issueCounts.errors}
                                            </motion.span>
                                        </motion.div>
                                    )}

                                    {issueCounts.warnings > 0 && (
                                        <motion.div
                                            className="lt-category-item warning"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.05 }}
                                            whileHover={{ x: 4, transition: { duration: 0.15 } }}
                                        >
                                            <span className="lt-category-icon-wrapper warning">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                                    <line x1="12" y1="9" x2="12" y2="13" />
                                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                                </svg>
                                            </span>
                                            <span className="lt-category-label">Improvements</span>
                                            <motion.span
                                                className="lt-category-count warning"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.05 }}
                                            >
                                                {issueCounts.warnings}
                                            </motion.span>
                                        </motion.div>
                                    )}

                                    {issueCounts.info > 0 && (
                                        <motion.div
                                            className="lt-category-item info"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 }}
                                            whileHover={{ x: 4, transition: { duration: 0.15 } }}
                                        >
                                            <span className="lt-category-icon-wrapper info">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                                </svg>
                                            </span>
                                            <span className="lt-category-label">Style</span>
                                            <motion.span
                                                className="lt-category-count info"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
                                            >
                                                {issueCounts.info}
                                            </motion.span>
                                        </motion.div>
                                    )}

                                    {issues.length === 0 && text.length > 0 && !isAnalyzing && (
                                        <motion.div
                                            className="lt-all-clear"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                        >
                                            <motion.span
                                                className="lt-clear-icon-wrapper"
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                                            >
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                    <polyline points="22 4 12 14.01 9 11.01" />
                                                </svg>
                                            </motion.span>
                                            <p>No issues found!</p>
                                        </motion.div>
                                    )}

                                    {issues.length === 0 && text.length === 0 && (
                                        <div className="lt-empty-state">
                                            <span className="lt-empty-icon-wrapper">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </span>
                                            <p>Enter text and click "Check Grammar" to analyze.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>

                    {/* Text Stats */}
                    <motion.div
                        className="lt-stats"
                        whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    >
                        <div className="lt-card-header">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="20" x2="18" y2="10" />
                                <line x1="12" y1="20" x2="12" y2="4" />
                                <line x1="6" y1="20" x2="6" y2="14" />
                            </svg>
                            <h3>Statistics</h3>
                        </div>
                        <div className="lt-stats-grid">
                            {isAnalyzing || isLoading ? (
                                <>
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="lt-stat">
                                            <div className="lt-skeleton" style={{ height: '24px', width: '60%', margin: '0 auto 8px' }}></div>
                                            <div className="lt-skeleton" style={{ height: '12px', width: '80%', margin: '0 auto' }}></div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <>
                                    <motion.div
                                        className="lt-stat"
                                        whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
                                    >
                                        <motion.span
                                            className="lt-stat-value"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            {stats.words}
                                        </motion.span>
                                        <span className="lt-stat-label">Words</span>
                                    </motion.div>
                                    <motion.div
                                        className="lt-stat"
                                        whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
                                    >
                                        <motion.span
                                            className="lt-stat-value"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.05 }}
                                        >
                                            {stats.chars}
                                        </motion.span>
                                        <span className="lt-stat-label">Characters</span>
                                    </motion.div>
                                    <motion.div
                                        className="lt-stat"
                                        whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
                                    >
                                        <motion.span
                                            className="lt-stat-value"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            {stats.sentences}
                                        </motion.span>
                                        <span className="lt-stat-label">Sentences</span>
                                    </motion.div>
                                    <motion.div
                                        className="lt-stat"
                                        whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
                                    >
                                        <motion.span
                                            className="lt-stat-value"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.15 }}
                                        >
                                            {stats.readingTime}m
                                        </motion.span>
                                        <span className="lt-stat-label">Read Time</span>
                                    </motion.div>
                                </>
                            )}
                        </div>
                    </motion.div>

                    {/* API Status */}
                    <motion.div
                        className="lt-api-status"
                        whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    >
                        {isLoading ? (
                            <>
                                <div className="lt-skeleton" style={{ width: '100%', height: '16px', marginBottom: '8px' }}></div>
                                <div className="lt-skeleton" style={{ width: '70%', height: '16px' }}></div>
                            </>
                        ) : (
                            <>
                                <div className="lt-status-row">
                                    <span className="lt-status-label">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                        </svg>
                                        API Status
                                    </span>
                                    <motion.span
                                        className={`lt-status-value ${apiStatus.canRequest ? 'ready' : 'limited'}`}
                                        animate={{
                                            scale: apiStatus.canRequest ? [1, 1.05, 1] : 1,
                                        }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <span className="lt-status-dot"></span>
                                        {apiStatus.canRequest ? 'Ready' : 'Rate Limited'}
                                    </motion.span>
                                </div>
                                <div className="lt-status-row">
                                    <span className="lt-status-label">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                        </svg>
                                        Requests
                                    </span>
                                    <span className="lt-status-value">
                                        {apiStatus.requestsThisMinute}/{apiStatus.maxRequestsPerMinute} per min
                                    </span>
                                </div>
                            </>
                        )}
                    </motion.div>

                    {/* Legend */}
                    <motion.div
                        className="lt-legend"
                        whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    >
                        {isLoading ? (
                            <>
                                <div className="lt-skeleton" style={{ width: '40%', height: '16px', marginBottom: '16px' }}></div>
                                <div className="lt-skeleton" style={{ width: '80%', height: '16px', marginBottom: '10px' }}></div>
                                <div className="lt-skeleton" style={{ width: '80%', height: '16px', marginBottom: '10px' }}></div>
                                <div className="lt-skeleton" style={{ width: '80%', height: '16px', marginBottom: '10px' }}></div>
                            </>
                        ) : (
                            <>
                                <div className="lt-card-header">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="8" y1="6" x2="21" y2="6" />
                                        <line x1="8" y1="12" x2="21" y2="12" />
                                        <line x1="8" y1="18" x2="21" y2="18" />
                                        <line x1="3" y1="6" x2="3.01" y2="6" />
                                        <line x1="3" y1="12" x2="3.01" y2="12" />
                                        <line x1="3" y1="18" x2="3.01" y2="18" />
                                    </svg>
                                    <h4>Underline Colors</h4>
                                </div>
                                <motion.div
                                    className="lt-legend-item"
                                    whileHover={{ x: 4, transition: { duration: 0.15 } }}
                                >
                                    <span className="lt-legend-line error"></span>
                                    <span>Spelling/Grammar Errors</span>
                                </motion.div>
                                <motion.div
                                    className="lt-legend-item"
                                    whileHover={{ x: 4, transition: { duration: 0.15 } }}
                                >
                                    <span className="lt-legend-line warning"></span>
                                    <span>Style Improvements</span>
                                </motion.div>
                                <motion.div
                                    className="lt-legend-item"
                                    whileHover={{ x: 4, transition: { duration: 0.15 } }}
                                >
                                    <span className="lt-legend-line info"></span>
                                    <span>Punctuation/Formatting</span>
                                </motion.div>
                            </>
                        )}
                    </motion.div>
                </motion.aside>
            </div>

            <style>{`
                .lt-grammar-checker {
                    min-height: 100%;
                    padding: 24px;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                }
                
                body.dark-mode .lt-grammar-checker {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                }

                .lt-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .lt-back-button {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    color: #64748b;
                    font-weight: 500;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .lt-back-button:hover {
                    color: #3b82f6;
                    border-color: #3b82f6;
                    background: #f0f9ff;
                }
                
                body.dark-mode .lt-back-button {
                    background: #1e293b;
                    border-color: #334155;
                    color: #94a3b8;
                }
                
                body.dark-mode .lt-back-button:hover {
                    background: rgba(59, 130, 246, 0.1);
                    border-color: #60a5fa;
                    color: #60a5fa;
                }

                .lt-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .lt-title-icon {
                    font-size: 28px;
                }

                .lt-header-area {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    margin-bottom: 32px;
                    flex-wrap: wrap;
                    gap: 24px;
                }

                .lt-title-card {
                    padding: 20px 24px;
                    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                    border-radius: 20px;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                    min-width: 320px;
                }
                
                .lt-actions-bar {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding-top: 8px;
                }
                
                .lt-actions-divider {
                    width: 1px;
                    height: 24px;
                    background: #e2e8f0;
                }

                .lt-title-icon-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 52px;
                    height: 52px;
                    border-radius: 14px;
                    background: #eff6ff;
                    color: #3b82f6;
                    flex-shrink: 0;
                }

                .lt-title h1 {
                    font-size: 22px;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                    line-height: 1.2;
                    letter-spacing: -0.02em;
                }

                .lt-title p {
                    font-size: 13px;
                    color: #64748b;
                    margin: 4px 0 0;
                    font-weight: 500;
                }

                .lt-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 5px 10px;
                    font-size: 11px;
                    font-weight: 600;
                    border-radius: 20px;
                    background: rgba(0, 0, 0, 0.04);
                    color: #64748b;
                    letter-spacing: 0.01em;
                }

                .lt-badge svg {
                    flex-shrink: 0;
                }
                
                body.dark-mode .lt-badge {
                    background: rgba(255, 255, 255, 0.08);
                    color: #94a3b8;
                }
                
                body.dark-mode .lt-title-card {
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                    border-color: #334155;
                }

                body.dark-mode .lt-title-card:hover {
                    border-color: #60a5fa !important;
                }
                
                body.dark-mode .lt-title-icon-wrapper {
                    background: rgba(59, 130, 246, 0.15);
                    color: #60a5fa;
                }
                
                body.dark-mode .lt-actions-divider {
                    background: #334155;
                }

                .lt-actions {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .lt-btn {
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

                .lt-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                    pointer-events: none;
                }

                .lt-btn-ghost {
                    background: white;
                    border: 1px solid #e2e8f0;
                    color: #64748b;
                }

                .lt-btn-secondary {
                    background: white;
                    border: 1px solid #e2e8f0;
                    color: #64748b;
                }

                .lt-btn-fix-all {
                    background: white;
                    border: 1.5px solid #10b981;
                    color: #10b981;
                }

                .lt-btn-fix-all:hover {
                    background: #ecfdf5;
                }

                .lt-btn-fix-all span {
                    font-weight: 600;
                }

                .lt-btn-count {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 22px;
                    height: 22px;
                    padding: 0 7px;
                    background: #10b981;
                    color: white;
                    border-radius: 11px;
                    font-size: 11px;
                    font-weight: 700;
                    margin-left: 2px;
                }

                .lt-btn-primary {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }

                .lt-btn-primary.analyzing {
                    background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
                    box-shadow: none;
                }

                .lt-spinner {
                    width: 14px;
                    height: 14px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                body.dark-mode .lt-btn-ghost,
                body.dark-mode .lt-btn-secondary {
                    background: #1e293b;
                    border-color: #334155;
                    color: #94a3b8;
                }
                
                body.dark-mode .lt-btn-ghost:hover,
                body.dark-mode .lt-btn-secondary:hover {
                    background: #334155 !important;
                    color: #f1f5f9 !important;
                }

                .lt-error {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 10px;
                    margin-bottom: 16px;
                    color: #dc2626;
                    font-size: 14px;
                }

                .lt-error button {
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    color: #dc2626;
                    padding: 0 4px;
                }

                .lt-content {
                    display: grid;
                    grid-template-columns: 1fr 300px;
                    gap: 24px;
                    min-height: calc(100vh - 200px);
                }

                @media (max-width: 900px) {
                    .lt-content {
                        grid-template-columns: 1fr;
                    }
                }

                .lt-editor-section {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    overflow: hidden;
                }

                .lt-editor-container {
                    position: relative;
                    height: 100%;
                    min-height: 500px;
                }

                .lt-rendered-text {
                    position: absolute;
                    inset: 0;
                    padding: 20px;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    font-size: 15px;
                    line-height: 1.7;
                    color: #1e293b;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    overflow: auto;
                    cursor: text;
                    z-index: 10;
                }

                .lt-textarea {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    padding: 20px;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    font-size: 15px;
                    line-height: 1.7;
                    color: #1e293b;
                    background: white;
                    border: none;
                    resize: none;
                    outline: none;
                    caret-color: #3b82f6;
                    z-index: 5;
                }
                
                /* Editor Dark Mode */
                body.dark-mode .lt-editor-section {
                    background: #1e293b;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                }
                
                body.dark-mode .lt-rendered-text {
                    color: #e2e8f0;
                }
                
                body.dark-mode .lt-textarea {
                    color: #e2e8f0;
                    background: #1e293b;
                    caret-color: #60a5fa;
                }

                .lt-textarea-hidden {
                    opacity: 0;
                    pointer-events: none;
                    z-index: 1;
                }

                .lt-textarea::placeholder {
                    color: #94a3b8;
                }

                .highlight-span {
                    position: relative;
                    cursor: pointer;
                    pointer-events: auto;
                    padding: 0;
                    margin: 0;
                }

                .underline-error {
                    border-bottom: 3px solid #ef4444;
                    padding-bottom: 1px;
                }

                .underline-warning {
                    border-bottom: 3px solid #f59e0b;
                    padding-bottom: 1px;
                }

                .underline-info {
                    border-bottom: 3px solid #3b82f6;
                    padding-bottom: 1px;
                }

                .lt-tooltip {
                    position: absolute;
                    z-index: 100;
                    background: white;
                    border-radius: 14px;
                    box-shadow: 
                        0 10px 30px -10px rgba(0,0,0,0.1),
                        0 4px 10px -2px rgba(0,0,0,0.05),
                        0 0 0 1px rgba(0,0,0,0.05);
                    width: 320px;
                    padding: 16px;
                    transform-origin: top left;
                }

                .lt-tooltip-arrow {
                    position: absolute;
                    top: -6px;
                    left: 14px;
                    width: 12px;
                    height: 12px;
                    background: white;
                    transform: rotate(45deg);
                    border-top: 1px solid #e2e8f0;
                    border-left: 1px solid #e2e8f0;
                    z-index: 101;
                }

                .lt-tooltip-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 12px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #f1f5f9;
                }

                .lt-tooltip-category-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    font-weight: 600;
                }

                .lt-category-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }

                .lt-category-name {
                    text-transform: capitalize;
                }

                .lt-tooltip-dismiss {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    color: #94a3b8;
                    cursor: pointer;
                    transition: all 0.2s;
                    padding: 0;
                }

                .lt-tooltip-dismiss:hover {
                    background: #f1f5f9;
                    color: #64748b;
                }

                .lt-tooltip-message {
                    font-size: 14px;
                    color: #334155;
                    margin: 0 0 16px 0;
                    line-height: 1.6;
                    font-weight: 400;
                }

                .lt-tooltip-suggestions {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .lt-suggestions-label {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #94a3b8;
                    margin-bottom: 4px;
                    font-weight: 600;
                }

                .lt-suggestion-btn {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 8px 12px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    color: #1e293b;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                }

                .lt-suggestion-btn:hover {
                    border-color: #cbd5e1;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }

                .lt-suggestion-text {
                    flex: 1;
                }

                .lt-apply-icon {
                    opacity: 0;
                    transform: translateX(-5px);
                    transition: all 0.2s ease;
                }

                .lt-suggestion-btn:hover .lt-apply-icon {
                    opacity: 1;
                    transform: translateX(0);
                }

                .lt-sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .lt-issues-summary, .lt-stats, .lt-api-status, .lt-legend {
                    background: white;
                    border-radius: 14px;
                    padding: 18px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                .lt-issues-summary h3, .lt-stats h3, .lt-legend h4 {
                    font-size: 13px;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .lt-card-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 16px;
                }

                .lt-card-header svg {
                    flex-shrink: 0;
                }
                
                /* Sidebar Cards Dark Mode */
                body.dark-mode .lt-issues-summary,
                body.dark-mode .lt-stats,
                body.dark-mode .lt-api-status-card,
                body.dark-mode .lt-legend {
                    background: #1e293b;
                    border-color: #334155;
                }
                
                body.dark-mode .lt-issues-summary h3,
                body.dark-mode .lt-stats h3,
                body.dark-mode .lt-legend h4 {
                    color: #f1f5f9;
                }
                
                body.dark-mode .lt-category-label {
                    color: #cbd5e1;
                }

                .lt-issue-categories {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .lt-category-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px;
                    border-radius: 12px;
                    font-size: 14px;
                    cursor: default;
                }

                .lt-category-item.error {
                    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                    border: 1px solid #fecaca;
                }

                .lt-category-item.warning {
                    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
                    border: 1px solid #fde68a;
                }

                .lt-category-item.info {
                    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                    border: 1px solid #bfdbfe;
                }

                .lt-category-icon-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                    flex-shrink: 0;
                }

                .lt-category-icon-wrapper.error {
                    background: #ef4444;
                    color: white;
                }

                .lt-category-icon-wrapper.warning {
                    background: #f59e0b;
                    color: white;
                }

                .lt-category-icon-wrapper.info {
                    background: #3b82f6;
                    color: white;
                }

                .lt-category-label {
                    flex: 1;
                    color: #475569;
                    font-weight: 500;
                }

                .lt-category-count {
                    font-weight: 700;
                    font-size: 13px;
                    padding: 4px 10px;
                    border-radius: 20px;
                }

                .lt-category-count.error {
                    background: #ef4444;
                    color: white;
                }

                .lt-category-count.warning {
                    background: #f59e0b;
                    color: white;
                }

                .lt-category-count.info {
                    background: #3b82f6;
                    color: white;
                }

                .lt-all-clear, .lt-empty-state {
                    text-align: center;
                    padding: 24px 16px;
                    color: #64748b;
                }

                .lt-clear-icon-wrapper, .lt-empty-icon-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 48px;
                    height: 48px;
                    margin: 0 auto 12px;
                    background: #ecfdf5;
                    border-radius: 50%;
                }

                .lt-empty-icon-wrapper {
                    background: #f1f5f9;
                }

                .lt-all-clear p, .lt-empty-state p {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 500;
                }

                .lt-all-clear p {
                    color: #10b981;
                }

                .lt-stats-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }

                .lt-stat {
                    text-align: center;
                    padding: 14px 8px;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                }

                .lt-stat-value {
                    display: block;
                    font-size: 22px;
                    font-weight: 700;
                    color: #1e293b;
                    line-height: 1.2;
                }

                .lt-stat-label {
                    font-size: 10px;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-weight: 600;
                    margin-top: 4px;
                    display: block;
                }

                .lt-api-status {
                    font-size: 13px;
                }

                .lt-status-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 0;
                }

                .lt-status-row:first-child {
                    padding-top: 0;
                }

                .lt-status-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #64748b;
                    font-weight: 500;
                }

                .lt-status-value {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #475569;
                    font-weight: 600;
                }

                .lt-status-value.ready {
                    color: #10b981;
                }

                .lt-status-value.limited {
                    color: #f59e0b;
                }
                
                /* Statistics Card Dark Mode */
                body.dark-mode .lt-stat {
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                    border-color: #334155;
                }
                
                body.dark-mode .lt-stat-value {
                    color: #f1f5f9;
                }
                
                body.dark-mode .lt-stat-label {
                    color: #94a3b8;
                }
                
                body.dark-mode .lt-status-label {
                    color: #94a3b8;
                }
                
                body.dark-mode .lt-status-value {
                    color: #cbd5e1;
                }

                .lt-status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: currentColor;
                    animation: pulse 2s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .lt-status-value.ready {
                    color: #10b981;
                }

                .lt-status-value.limited {
                    color: #f59e0b;
                }

                .lt-legend h4 {
                    font-size: 12px;
                    margin-bottom: 10px;
                }

                .lt-legend-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 12px;
                    color: #64748b;
                    margin-bottom: 8px;
                }

                .lt-legend-line {
                    width: 24px;
                    height: 3px;
                    border-radius: 2px;
                }

                .lt-legend-line.error {
                    background: #ef4444;
                }

                .lt-legend-line.warning {
                    background: #f59e0b;
                }

                .lt-legend-line.info {
                    background: #3b82f6;
                }

                .lt-skeleton {
                    background: #e2e8f0;
                    border-radius: 4px;
                    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }

                .lt-skeleton-item {
                    height: 48px;
                    margin-bottom: 8px;
                    border-radius: 10px;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                /* Dark Mode Support via class */
                body.dark-mode .lt-grammar-checker {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                }

                body.dark-mode .lt-skeleton {
                    background: #334155;
                }

                body.dark-mode .lt-header h1 {
                    color: #fff;
                }

                body.dark-mode .lt-header p {
                    color: #94a3b8;
                }

                body.dark-mode .lt-back-button {
                    background: #1e293b;
                    border-color: #334155;
                    color: #94a3b8;
                }
                
                body.dark-mode .lt-back-button:hover {
                    color: #60a5fa;
                    border-color: #60a5fa;
                    background: #1e293b;
                }

                body.dark-mode .lt-title h1 {
                    color: #e2e8f0;
                }

                body.dark-mode .lt-editor-section {
                    background: #1e293b;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }

                body.dark-mode .lt-textarea {
                    background: #1e293b;
                    color: #e2e8f0;
                }

                body.dark-mode .lt-rendered-text {
                    color: #e2e8f0;
                }

                body.dark-mode .lt-issues-summary, 
                body.dark-mode .lt-stats, 
                body.dark-mode .lt-api-status, 
                body.dark-mode .lt-legend {
                    background: #1e293b;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                }
                
                body.dark-mode .lt-issues-summary h3, 
                body.dark-mode .lt-stats h3, 
                body.dark-mode .lt-legend h4 {
                    color: #94a3b8;
                }

                body.dark-mode .lt-stat {
                    background: #0f172a;
                }

                body.dark-mode .lt-stat-value {
                    color: #e2e8f0;
                }

                body.dark-mode .lt-tooltip {
                    background: #0f172a;
                    border-color: #334155;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                }

                body.dark-mode .lt-tooltip-arrow {
                    background: #0f172a;
                    border-color: #334155;
                }

                body.dark-mode .lt-tooltip-header {
                    border-color: #334155;
                }

                body.dark-mode .lt-tooltip-message {
                    color: #cbd5e1;
                }
                
                body.dark-mode .lt-suggestion-btn {
                    background: #0f172a;
                    border-color: #334155;
                    color: #e2e8f0;
                }

                body.dark-mode .lt-suggestion-btn:hover {
                    border-color: #475569;
                    background: #1e293b;
                }

                body.dark-mode .lt-btn-secondary {
                    background: #1e293b;
                    border-color: #334155;
                    color: #94a3b8;
                }
                
                body.dark-mode .lt-btn-secondary:hover {
                    background: #334155;
                    color: #e2e8f0;
                }

                body.dark-mode .lt-category-item.error {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: rgba(239, 68, 68, 0.2);
                }
                
                body.dark-mode .lt-category-item.warning {
                    background: rgba(245, 158, 11, 0.1);
                    border-color: rgba(245, 158, 11, 0.2);
                }
                
                body.dark-mode .lt-category-item.info {
                    background: rgba(59, 130, 246, 0.1);
                    border-color: rgba(59, 130, 246, 0.2);
                }

                body.dark-mode .lt-category-label {
                    color: #cbd5e1;
                }

                body.dark-mode .lt-category-count {
                    color: #e2e8f0;
                }
            `}</style>
        </motion.div>
    );
};

export default LanguageToolGrammarChecker;
