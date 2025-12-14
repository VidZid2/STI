/**
 * Paraphraser Component
 * Powered by Groq AI (Llama 3.1) for fast, high-quality paraphrasing
 * Free tier: 30 req/min, 14,400 req/day per account
 */

import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { paraphraseWithGroq, getParaphraseStats, isGroqConfigured, type ParaphraseMode } from "../../lib/paraphrase/groqService";

interface ParaphraserProps {
    onBack: () => void;
}

interface ParaphraseStats {
    originalWords: number;
    paraphrasedWords: number;
    wordChange: number;
    wordChangePercent: number;
    similarity: number;
    uniqueness: number;
}

// Loading Skeleton Component
const ParaphraserSkeleton: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <div className={`para-skeleton ${isDarkMode ? 'dark' : ''}`}>
        <div className="para-skeleton-header">
            <div className="para-skeleton-title-card">
                <div className="para-skeleton-icon shimmer" />
                <div className="para-skeleton-title-content">
                    <div className="para-skeleton-title shimmer" />
                    <div className="para-skeleton-badges shimmer" />
                </div>
            </div>
            <div className="para-skeleton-actions">
                <div className="para-skeleton-btn shimmer" />
                <div className="para-skeleton-btn-primary shimmer" />
            </div>
        </div>
        <div className="para-skeleton-modes">
            <div className="para-skeleton-modes-label shimmer" />
            <div className="para-skeleton-modes-grid">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="para-skeleton-mode shimmer" />
                ))}
            </div>
        </div>
        <div className="para-skeleton-content">
            <div className="para-skeleton-card">
                <div className="para-skeleton-card-header shimmer" />
                <div className="para-skeleton-textarea shimmer" />
            </div>
            <div className="para-skeleton-card">
                <div className="para-skeleton-card-header shimmer" />
                <div className="para-skeleton-textarea shimmer" />
            </div>
        </div>
        <style>{`
            .para-skeleton { min-height: 100%; padding: 24px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); }
            .para-skeleton.dark { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); }
            .para-skeleton-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-bottom: 24px; flex-wrap: wrap; }
            .para-skeleton-title-card { display: flex; align-items: center; gap: 16px; padding: 20px 24px; background: white; border-radius: 20px; min-width: 320px; }
            .para-skeleton.dark .para-skeleton-title-card { background: #1e293b; }
            .para-skeleton-icon { width: 52px; height: 52px; border-radius: 14px; background: #e2e8f0; }
            .para-skeleton.dark .para-skeleton-icon { background: #334155; }
            .para-skeleton-title-content { display: flex; flex-direction: column; gap: 8px; }
            .para-skeleton-title { width: 140px; height: 24px; border-radius: 6px; background: #e2e8f0; }
            .para-skeleton.dark .para-skeleton-title { background: #334155; }
            .para-skeleton-badges { width: 100px; height: 20px; border-radius: 10px; background: #e2e8f0; }
            .para-skeleton.dark .para-skeleton-badges { background: #334155; }
            .para-skeleton-actions { display: flex; gap: 8px; }
            .para-skeleton-btn { width: 80px; height: 40px; border-radius: 12px; background: #e2e8f0; }
            .para-skeleton.dark .para-skeleton-btn { background: #334155; }
            .para-skeleton-btn-primary { width: 120px; height: 40px; border-radius: 12px; background: #d1fae5; }
            .para-skeleton.dark .para-skeleton-btn-primary { background: rgba(16, 185, 129, 0.2); }
            .para-skeleton-modes { margin-bottom: 24px; }
            .para-skeleton-modes-label { width: 140px; height: 16px; border-radius: 4px; background: #e2e8f0; margin-bottom: 12px; }
            .para-skeleton.dark .para-skeleton-modes-label { background: #334155; }
            .para-skeleton-modes-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
            @media (max-width: 900px) { .para-skeleton-modes-grid { grid-template-columns: repeat(3, 1fr); } }
            @media (max-width: 600px) { .para-skeleton-modes-grid { grid-template-columns: repeat(2, 1fr); } }
            .para-skeleton-mode { height: 80px; border-radius: 12px; background: #e2e8f0; }
            .para-skeleton.dark .para-skeleton-mode { background: #334155; }
            .para-skeleton-content { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            @media (max-width: 900px) { .para-skeleton-content { grid-template-columns: 1fr; } }
            .para-skeleton-card { background: white; border-radius: 16px; overflow: hidden; min-height: 350px; }
            .para-skeleton.dark .para-skeleton-card { background: #1e293b; }
            .para-skeleton-card-header { height: 60px; background: #f1f5f9; }
            .para-skeleton.dark .para-skeleton-card-header { background: rgba(15, 23, 42, 0.6); }
            .para-skeleton-textarea { height: 290px; margin: 16px; border-radius: 8px; background: #e2e8f0; }
            .para-skeleton.dark .para-skeleton-textarea { background: #334155; }
            .shimmer { position: relative; overflow: hidden; }
            .shimmer::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); animation: shimmer 1.5s infinite; }
            .para-skeleton.dark .shimmer::after { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); }
            @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        `}</style>
    </div>
);

const Paraphraser: React.FC<ParaphraserProps> = ({ onBack }) => {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [mode, setMode] = useState<ParaphraseMode>('standard');
    const [isTitleHovered, setIsTitleHovered] = useState(false);
    const [copied, setCopied] = useState(false);
    const [stats, setStats] = useState<ParaphraseStats | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkModeEnabled');
        return saved === 'true' || document.body.classList.contains('dark-mode');
    });

    // Dark mode sync
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

    // Page loading effect
    useEffect(() => {
        const timer = setTimeout(() => setIsPageLoading(false), 400);
        return () => clearTimeout(timer);
    }, []);

    const modes: { id: ParaphraseMode; label: string; icon: React.ReactNode; desc: string }[] = [
        { id: 'standard', label: 'Standard', desc: 'Balanced rewrite', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
        { id: 'fluency', label: 'Fluency', desc: 'Natural flow', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
        { id: 'formal', label: 'Formal', desc: 'Professional tone', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
    ];

    const moreModesRow: { id: ParaphraseMode; label: string; icon: React.ReactNode; desc: string }[] = [
        { id: 'creative', label: 'Creative', desc: 'Unique style', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
        { id: 'shorter', label: 'Shorter', desc: 'Concise version', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12H3M21 6H3M21 18H9"/></svg> },
        { id: 'expand', label: 'Expand', desc: 'More detailed', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12H3M21 6H3M21 18H3"/></svg> },
    ];

    const [error, setError] = useState<string | null>(null);

    const handleParaphrase = async () => {
        if (!inputText.trim()) return;
        setIsLoading(true);
        setOutputText('');
        setStats(null);
        setError(null);

        const result = await paraphraseWithGroq(inputText, mode);
        
        if (result.success) {
            setOutputText(result.text);
            setStats(getParaphraseStats(inputText, result.text));
        } else {
            setError(result.error || 'Failed to paraphrase');
            setOutputText('');
        }
        setIsLoading(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(outputText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        setInputText('');
        setOutputText('');
        setStats(null);
    };

    const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

    // Show skeleton while page is loading
    if (isPageLoading) {
        return <ParaphraserSkeleton isDarkMode={isDarkMode} />;
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="para-container">
            {/* Header */}
            <div className="para-header-area">
                <motion.div
                    className="para-title-card"
                    onHoverStart={() => setIsTitleHovered(true)}
                    onHoverEnd={() => setIsTitleHovered(false)}
                    animate={{
                        y: isTitleHovered ? -4 : 0,
                        boxShadow: isTitleHovered ? '0 20px 40px rgba(16, 185, 129, 0.15)' : '0 4px 20px rgba(0, 0, 0, 0.04)',
                        borderColor: isTitleHovered ? '#10b981' : (isDarkMode ? '#334155' : 'rgba(226, 232, 240, 0.8)')
                    }}
                >
                    <motion.div className="para-title-gradient" animate={{ opacity: isTitleHovered ? 1 : 0 }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
                        <motion.div
                            className="para-title-icon-wrapper"
                            animate={{
                                background: isTitleHovered ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : (isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5'),
                                color: isTitleHovered ? '#ffffff' : (isDarkMode ? '#34d399' : '#10b981'),
                                scale: isTitleHovered ? 1.05 : 1
                            }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                            </svg>
                        </motion.div>
                        <div className="para-title-content">
                            <motion.h1 animate={{ color: isTitleHovered ? '#10b981' : (isDarkMode ? '#f1f5f9' : '#1e293b') }}>
                                Paraphraser
                            </motion.h1>
                            <div className="para-badges">
                                <motion.span className="para-badge para-badge-ai">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                                    Groq AI
                                </motion.span>
                                <motion.span className="para-badge para-badge-free">Free • Fast</motion.span>
                            </div>
                        </div>
                    </div>
                </motion.div>


                <motion.div className="para-actions-bar">
                    <motion.button onClick={onBack} className="para-btn para-btn-ghost"
                        whileHover={{ x: -2, backgroundColor: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}
                        whileTap={{ scale: 0.97 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
                        Back
                    </motion.button>
                    <div className="para-actions-divider"></div>
                    <LayoutGroup>
                        <div className="para-actions">
                            <motion.button layout onClick={handleClear} className="para-btn para-btn-secondary" disabled={!inputText}
                                whileHover={{ scale: 1.02, backgroundColor: '#f1f5f9' }} whileTap={{ scale: 0.97 }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                Clear
                            </motion.button>
                            <motion.button layout onClick={handleParaphrase} disabled={!inputText.trim() || isLoading} className="para-btn para-btn-primary"
                                whileHover={{ scale: 1.02, boxShadow: '0 8px 20px rgba(16, 185, 129, 0.35)' }} whileTap={{ scale: 0.97 }}>
                                {isLoading ? (
                                    <><svg className="para-spinner" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>Processing...</>
                                ) : (
                                    <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>Paraphrase</>
                                )}
                            </motion.button>
                        </div>
                    </LayoutGroup>
                </motion.div>
            </div>

            {/* Mode Selector */}
            <motion.div className="para-modes-section" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="para-modes-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    Paraphrase Mode
                </div>
                <div className="para-modes-grid">
                    {[...modes, ...moreModesRow].map((m) => (
                        <motion.button key={m.id} className={`para-mode-btn ${mode === m.id ? 'active' : ''}`}
                            onClick={() => setMode(m.id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            {m.icon}
                            <span className="para-mode-label">{m.label}</span>
                            <span className="para-mode-desc">{m.desc}</span>
                        </motion.button>
                    ))}
                </div>
            </motion.div>


            {/* Main Content */}
            <div className="para-content">
                <motion.div className="para-input-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <div className="para-card-header">
                        <div className="para-card-icon para-card-icon-input">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </div>
                        <span className="para-card-title">Original Text</span>
                        <span className="para-word-count">{wordCount} words</span>
                    </div>
                    <textarea
                        className="para-textarea"
                        placeholder="Enter or paste your text here to paraphrase..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />
                </motion.div>

                <motion.div className="para-output-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="para-card-header">
                        <div className="para-card-icon para-card-icon-output">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <span className="para-card-title">Paraphrased Text</span>
                        {outputText && (
                            <motion.button className="para-copy-btn" onClick={handleCopy} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                {copied ? (
                                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>Copied!</>
                                ) : (
                                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy</>
                                )}
                            </motion.button>
                        )}
                    </div>
                    <div className="para-output-area">
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.div key="loading" className="para-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <div className="para-loading-spinner"></div>
                                    <span>Paraphrasing with Groq AI...</span>
                                </motion.div>
                            ) : error ? (
                                <motion.div key="error" className="para-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                    <span>{error}</span>
                                    {!isGroqConfigured() && (
                                        <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="para-error-link">
                                            Get free API key →
                                        </a>
                                    )}
                                </motion.div>
                            ) : outputText ? (
                                <motion.p key="output" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{outputText}</motion.p>
                            ) : (
                                <motion.div key="empty" className="para-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                                    <span>Your paraphrased text will appear here</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {/* Stats Bar */}
                    <AnimatePresence>
                        {stats && (
                            <motion.div 
                                className="para-stats-bar"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <div className="para-stat">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>
                                    <span className="para-stat-label">Words:</span>
                                    <span className="para-stat-value">{stats.paraphrasedWords}</span>
                                    <span className={`para-stat-change ${stats.wordChange >= 0 ? 'positive' : 'negative'}`}>
                                        ({stats.wordChange >= 0 ? '+' : ''}{stats.wordChange})
                                    </span>
                                </div>
                                <div className="para-stat-divider"></div>
                                <div className="para-stat">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                    <span className="para-stat-label">Uniqueness:</span>
                                    <span className={`para-stat-value ${stats.uniqueness >= 50 ? 'good' : 'low'}`}>{stats.uniqueness}%</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>


            <style>{`
                .para-container { min-height: 100%; padding: 24px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); }
                body.dark-mode .para-container { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); }
                .para-header-area { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-bottom: 24px; flex-wrap: wrap; }
                .para-title-card { padding: 20px 24px; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border-radius: 20px; border: 1px solid rgba(226, 232, 240, 0.8); position: relative; overflow: hidden; cursor: pointer; min-width: 320px; }
                body.dark-mode .para-title-card { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-color: #334155; }
                .para-title-gradient { position: absolute; top: 0; right: 0; width: 160px; height: 160px; background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%); border-radius: 50%; transform: translate(30%, -30%); pointer-events: none; }
                .para-title-icon-wrapper { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .para-title-content { display: flex; flex-direction: column; gap: 4px; }
                .para-title-content h1 { font-size: 22px; font-weight: 700; margin: 0; line-height: 1.2; }
                .para-badges { display: flex; gap: 8px; }
                .para-badge { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; font-size: 11px; font-weight: 600; border-radius: 20px; }
                .para-badge-free { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                body.dark-mode .para-badge-free { background: rgba(52, 211, 153, 0.15); color: #34d399; }
                .para-badge-ai { background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); color: #6366f1; }
                body.dark-mode .para-badge-ai { background: linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%); color: #a78bfa; }
                .para-actions-bar { display: flex; gap: 12px; align-items: center; }
                .para-actions-divider { width: 1px; height: 24px; background: #e2e8f0; margin: 0 4px; }
                body.dark-mode .para-actions-divider { background: #334155; }
                .para-actions { display: flex; gap: 8px; }
                .para-btn { display: flex; align-items: center; gap: 6px; padding: 10px 16px; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid transparent; background: transparent; white-space: nowrap; }
                .para-btn:disabled { opacity: 0.4; cursor: not-allowed; }
                .para-btn-ghost { background: white; border: 1px solid #e2e8f0; color: #64748b; }
                .para-btn-secondary { background: white; border: 1px solid #e2e8f0; color: #64748b; }
                .para-btn-primary { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
                body.dark-mode .para-btn-ghost, body.dark-mode .para-btn-secondary { background: #1e293b; border-color: #334155; color: #94a3b8; }
                .para-spinner { animation: para-spin 1s linear infinite; }
                @keyframes para-spin { to { transform: rotate(360deg); } }

                .para-modes-section { margin-bottom: 24px; }
                .para-modes-label { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 12px; }
                body.dark-mode .para-modes-label { color: #94a3b8; }
                .para-modes-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
                @media (max-width: 900px) { .para-modes-grid { grid-template-columns: repeat(3, 1fr); } }
                @media (max-width: 600px) { .para-modes-grid { grid-template-columns: repeat(2, 1fr); } }
                .para-mode-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 12px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s; color: #64748b; }
                .para-mode-btn:hover { border-color: #10b981; background: rgba(16, 185, 129, 0.04); }
                .para-mode-btn.active { border-color: #10b981; background: rgba(16, 185, 129, 0.08); color: #10b981; }
                body.dark-mode .para-mode-btn { background: #1e293b; border-color: #334155; color: #94a3b8; }
                body.dark-mode .para-mode-btn:hover { border-color: #34d399; background: rgba(52, 211, 153, 0.08); }
                body.dark-mode .para-mode-btn.active { border-color: #34d399; background: rgba(52, 211, 153, 0.12); color: #34d399; }
                .para-mode-label { font-size: 12px; font-weight: 600; }
                .para-mode-desc { font-size: 10px; opacity: 0.7; }
                .para-content { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                @media (max-width: 900px) { .para-content { grid-template-columns: 1fr; } }
                .para-input-card, .para-output-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; min-height: 350px; display: flex; flex-direction: column; }
                body.dark-mode .para-input-card, body.dark-mode .para-output-card { background: #1e293b; border-color: #334155; }
                .para-card-header { display: flex; align-items: center; gap: 10px; padding: 14px 18px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
                body.dark-mode .para-card-header { background: rgba(15, 23, 42, 0.6); border-bottom-color: #334155; }
                .para-card-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
                .para-card-icon-input { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .para-card-icon-output { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                body.dark-mode .para-card-icon-input { background: rgba(96, 165, 250, 0.15); color: #60a5fa; }
                body.dark-mode .para-card-icon-output { background: rgba(52, 211, 153, 0.15); color: #34d399; }
                .para-card-title { font-size: 13px; font-weight: 700; color: #1e293b; flex: 1; }
                body.dark-mode .para-card-title { color: #f1f5f9; }
                .para-word-count { font-size: 11px; color: #94a3b8; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; }
                body.dark-mode .para-word-count { background: #334155; color: #64748b; }
                .para-textarea { flex: 1; width: 100%; padding: 16px 18px; border: none; resize: none; font-size: 14px; line-height: 1.7; background: transparent; color: #1e293b; }
                .para-textarea:focus { outline: none; }
                .para-textarea::placeholder { color: #94a3b8; }
                body.dark-mode .para-textarea { color: #e2e8f0; }
                body.dark-mode .para-textarea::placeholder { color: #64748b; }
                .para-output-area { flex: 1; padding: 16px 18px; }
                .para-output-area p { font-size: 14px; line-height: 1.7; color: #1e293b; margin: 0; }
                body.dark-mode .para-output-area p { color: #e2e8f0; }
                .para-copy-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: rgba(16, 185, 129, 0.1); color: #10b981; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
                body.dark-mode .para-copy-btn { background: rgba(52, 211, 153, 0.15); color: #34d399; }
                .para-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; color: #94a3b8; }
                .para-loading-spinner { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #10b981; border-radius: 50%; animation: para-spin 0.8s linear infinite; }
                body.dark-mode .para-loading-spinner { border-color: #334155; border-top-color: #34d399; }
                .para-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; color: #94a3b8; text-align: center; }
                .para-empty svg { opacity: 0.4; }
                .para-error { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; color: #ef4444; text-align: center; padding: 20px; }
                .para-error svg { opacity: 0.6; }
                .para-error span { font-size: 13px; max-width: 300px; line-height: 1.5; }
                body.dark-mode .para-error { color: #f87171; }
                .para-error-link { margin-top: 8px; padding: 8px 16px; background: rgba(99, 102, 241, 0.1); color: #6366f1; border-radius: 8px; font-size: 12px; font-weight: 600; text-decoration: none; transition: all 0.2s; }
                .para-error-link:hover { background: rgba(99, 102, 241, 0.2); }
                body.dark-mode .para-error-link { background: rgba(167, 139, 250, 0.15); color: #a78bfa; }
                .para-stats-bar { display: flex; align-items: center; gap: 16px; padding: 12px 18px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
                body.dark-mode .para-stats-bar { background: rgba(15, 23, 42, 0.6); border-top-color: #334155; }
                .para-stat { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748b; }
                body.dark-mode .para-stat { color: #94a3b8; }
                .para-stat svg { opacity: 0.7; }
                .para-stat-label { font-weight: 500; }
                .para-stat-value { font-weight: 700; color: #1e293b; }
                body.dark-mode .para-stat-value { color: #f1f5f9; }
                .para-stat-value.good { color: #10b981; }
                body.dark-mode .para-stat-value.good { color: #34d399; }
                .para-stat-value.low { color: #f59e0b; }
                body.dark-mode .para-stat-value.low { color: #fbbf24; }
                .para-stat-change { font-size: 11px; font-weight: 600; }
                .para-stat-change.positive { color: #10b981; }
                .para-stat-change.negative { color: #ef4444; }
                body.dark-mode .para-stat-change.positive { color: #34d399; }
                body.dark-mode .para-stat-change.negative { color: #f87171; }
                .para-stat-divider { width: 1px; height: 16px; background: #e2e8f0; }
                body.dark-mode .para-stat-divider { background: #334155; }
            `}</style>
        </motion.div>
    );
};

export default Paraphraser;
