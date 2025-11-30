/**
 * LinguaFlow Grammar Checker Component
 * AI-powered writing assistant using Google's Gemini API
 * 
 * Features:
 * - Real-time AI-powered grammar analysis
 * - Inline error highlighting
 * - One-click corrections
 * - Writing quality scoring
 * - Readability analysis
 */

import * as React from "react";
import { useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  analyzeTextWithGemini, 
  hasApiKey, 
  setApiKey
} from "../../services/linguaflow/geminiService";
import { IssueType } from "../../services/linguaflow/types";
import type { Issue, AnalysisStats } from "../../services/linguaflow/types";

interface GrammarCheckerProps {
  onBack: () => void;
  initialText?: string;
}

const INITIAL_TEXT = `The Mars Rover, Spirit, landed on the read planet in 2004. Its mission was expected to last 90 days, but it continued analyzing the surface for over six years. NASA lost contact with Spirit in 2011.

I think space exploration is super cool and realy important for humanitys future. We should definitely spend more money on it because who knows what we'll find out there?`;

const GrammarChecker: React.FC<GrammarCheckerProps> = ({ onBack, initialText = "" }) => {
  // Text state
  const [text, setText] = useState(initialText || INITIAL_TEXT);
  
  // Analysis state
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<AnalysisStats>({ 
    score: 0, 
    wordCount: 0, 
    readabilityScore: 0,
    sentenceCount: 0,
    characterCount: 0,
    readingTimeMinutes: 0
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [hoveredIssue, setHoveredIssue] = useState<Issue | null>(null);

  const [hoverPosition, setHoverPosition] = useState<{x: number, y: number} | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(!hasApiKey());
  const [apiKeyInput, setApiKeyInput] = useState("");
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Perform analysis
  const performAnalysis = useCallback(async () => {
    if (!text.trim()) return;
    
    setIsAnalyzing(true);
    setSelectedIssueId(null);
    setError(null);

    try {
      const result = await analyzeTextWithGemini(text);
      setIssues(result.issues);
      setStats(result.stats);
    } catch (err: any) {
      console.error("Analysis failed", err);
      if (err.message === 'GEMINI_API_KEY_MISSING') {
        setShowApiKeyModal(true);
        setError("Please configure your Gemini API key to use the grammar checker.");
      } else {
        setError("Analysis failed. Please check your API key and try again.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [text]);

  // Handle apply fix
  const handleApplyFix = useCallback((issue: Issue, replacement: string) => {
    if (!replacement && replacement !== "") return;
    
    const newText = text.replace(issue.original, replacement);
    setText(newText);
    setIssues(prev => prev.filter(i => i.id !== issue.id));
    setSelectedIssueId(null);
    setHoveredIssue(null);
  }, [text]);

  // Handle dismiss
  const handleDismiss = useCallback((issue: Issue) => {
    setIssues(prev => prev.filter(i => i.id !== issue.id));
    setSelectedIssueId(null);
    setHoveredIssue(null);
  }, []);

  // Handle clear
  const handleClear = useCallback(() => {
    setText("");
    setIssues([]);
    setStats({ score: 0, wordCount: 0, readabilityScore: 0, sentenceCount: 0, characterCount: 0, readingTimeMinutes: 0 });
    setSelectedIssueId(null);
    setError(null);
  }, []);

  // Handle API key save
  const handleSaveApiKey = useCallback(() => {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim());
      setShowApiKeyModal(false);
      setApiKeyInput("");
      setError(null);
    }
  }, [apiKeyInput]);

  // Sync scrolling
  const handleScroll = useCallback(() => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
    }
    setHoveredIssue(null);
  }, []);

  // Get border color for issue type
  const getBorderColor = (type: IssueType) => {
    switch (type) {
      case IssueType.Correctness: return 'border-red-500 bg-red-100/50';
      case IssueType.Clarity: return 'border-blue-500 bg-blue-100/50';
      case IssueType.Engagement: return 'border-purple-500 bg-purple-100/50';
      case IssueType.Delivery: return 'border-yellow-500 bg-yellow-100/50';
      default: return 'border-gray-400';
    }
  };

  // Get icon for issue type
  const getIcon = (type: IssueType) => {
    switch (type) {
      case IssueType.Correctness: return '❌';
      case IssueType.Clarity: return '📖';
      case IssueType.Engagement: return '⚡';
      case IssueType.Delivery: return '💬';
      default: return '📝';
    }
  };

  // Get title for issue type
  const getTitle = (type: IssueType) => {
    switch (type) {
      case IssueType.Correctness: return 'Correctness';
      case IssueType.Clarity: return 'Clarity';
      case IssueType.Engagement: return 'Engagement';
      case IssueType.Delivery: return 'Delivery';
      default: return 'Issue';
    }
  };


  // Render highlights
  const renderHighlights = useMemo(() => {
    if (!text) return null;
    
    const issueIndices: { start: number; end: number; issue: Issue }[] = [];
    
    issues.forEach(issue => {
      const regex = new RegExp(issue.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      let match;
      while ((match = regex.exec(text)) !== null) {
        const start = match.index;
        const end = match.index + issue.original.length;
        const overlap = issueIndices.some(existing => 
          (start >= existing.start && start < existing.end) || 
          (end > existing.start && end <= existing.end)
        );

        if (!overlap) {
          issueIndices.push({ start, end, issue });
          break;
        }
      }
    });

    issueIndices.sort((a, b) => a.start - b.start);

    const segments: { text: string; issue?: Issue }[] = [];
    let lastIndex = 0;

    issueIndices.forEach(item => {
      if (item.start > lastIndex) {
        segments.push({ text: text.slice(lastIndex, item.start) });
      }
      segments.push({ text: text.slice(item.start, item.end), issue: item.issue });
      lastIndex = item.end;
    });
    
    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex) });
    }

    return segments.map((segment, idx) => {
      if (segment.issue) {
        return (
          <span
            key={idx}
            className={`border-b-[3px] pb-[1px] cursor-pointer pointer-events-auto transition-colors duration-200 ${getBorderColor(segment.issue.type)}`}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const containerRect = containerRef.current?.getBoundingClientRect();
              if (containerRect) {
                setHoverPosition({
                  x: rect.left - containerRect.left,
                  y: rect.bottom - containerRect.top + 5
                });
                setHoveredIssue(segment.issue || null);
              }
            }}
            onClick={() => setSelectedIssueId(segment.issue?.id || null)}
          >
            {segment.text}
          </span>
        );
      }
      return <span key={idx}>{segment.text}</span>;
    });
  }, [text, issues]);

  // Issue counts by category
  const counts = useMemo(() => ({
    [IssueType.Correctness]: issues.filter(i => i.type === IssueType.Correctness).length,
    [IssueType.Clarity]: issues.filter(i => i.type === IssueType.Clarity).length,
    [IssueType.Engagement]: issues.filter(i => i.type === IssueType.Engagement).length,
    [IssueType.Delivery]: issues.filter(i => i.type === IssueType.Delivery).length,
  }), [issues]);

  const selectedIssue = issues.find(i => i.id === selectedIssueId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grammar-checker-page"
    >
      {/* API Key Modal */}
      <AnimatePresence>
        {showApiKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="api-key-modal-overlay"
            onClick={() => hasApiKey() && setShowApiKeyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="api-key-modal"
              onClick={e => e.stopPropagation()}
            >
              <h2>🔑 Configure Gemini API Key</h2>
              <p>Enter your Google Gemini API key to enable AI-powered grammar checking.</p>
              <p className="api-key-hint">
                Get your API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
              </p>
              <input
                type="password"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder="Enter your Gemini API key..."
                className="api-key-input"
                onKeyDown={e => e.key === 'Enter' && handleSaveApiKey()}
              />
              <div className="api-key-actions">
                {hasApiKey() && (
                  <button onClick={() => setShowApiKeyModal(false)} className="cancel-btn">
                    Cancel
                  </button>
                )}
                <button onClick={handleSaveApiKey} className="save-btn" disabled={!apiKeyInput.trim()}>
                  Save API Key
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="grammar-header"
      >
        <motion.button
          onClick={onBack}
          className="back-button"
          whileHover={{ scale: 1.05, x: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back to Tools</span>
        </motion.button>

        <div className="header-title">
          <motion.div
            className="title-icon"
            animate={isAnalyzing ? { rotate: [0, 360] } : {}}
            transition={{ duration: 1, repeat: isAnalyzing ? Infinity : 0, ease: "linear" }}
          >
            ✍️
          </motion.div>
          <div>
            <h1>LinguaFlow Grammar Checker</h1>
            <p>AI-powered writing assistant</p>
          </div>
        </div>

        <div className="header-actions">
          <motion.button
            onClick={() => setShowApiKeyModal(true)}
            className="action-btn settings"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Configure API Key"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </motion.button>
          <motion.button
            onClick={handleClear}
            className="action-btn clear"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!text}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            Clear
          </motion.button>
          <motion.button
            onClick={performAnalysis}
            disabled={isAnalyzing || !text.trim()}
            className={`action-btn analyze ${isAnalyzing ? 'analyzing' : ''}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isAnalyzing ? (
              <>
                <div className="spinner" />
                Analyzing...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5" />
                </svg>
                Check Text
              </>
            )}
          </motion.button>
        </div>
      </motion.div>


      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="error-banner"
          >
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)}>×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="grammar-content">
        {/* Editor Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="editor-section"
        >
          <div 
            ref={containerRef}
            className="editor-container"
            onMouseLeave={() => setHoveredIssue(null)}
          >
            {/* Backdrop Layer (Highlights) */}
            <div 
              ref={backdropRef}
              className="highlight-backdrop"
              aria-hidden="true"
            >
              {renderHighlights}
              <br />
            </div>

            {/* Input Layer (Textarea) */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onScroll={handleScroll}
              className="editor-textarea"
              placeholder="Type or paste your text here..."
              spellCheck={false}
            />

            {/* Hover Tooltip */}
            {hoveredIssue && hoverPosition && (
              <div 
                className="hover-tooltip"
                style={{ 
                  top: hoverPosition.y, 
                  left: Math.min(hoverPosition.x, (containerRef.current?.offsetWidth || 0) - 300) 
                }}
                onMouseEnter={() => {}}
                onMouseLeave={() => setHoveredIssue(null)}
              >
                <div className="tooltip-header">
                  <span className={`tooltip-type type-${hoveredIssue.type}`}>
                    {hoveredIssue.type}
                  </span>
                  <button 
                    onClick={() => {
                      handleDismiss(hoveredIssue);
                    }}
                    className="tooltip-dismiss"
                  >
                    ×
                  </button>
                </div>

                <p className="tooltip-explanation">{hoveredIssue.explanation}</p>

                <div className="tooltip-suggestions">
                  {hoveredIssue.replacements.map((replacement, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleApplyFix(hoveredIssue, replacement)}
                      className="suggestion-btn"
                    >
                      <span>{replacement}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                  ))}
                </div>

                {hoveredIssue.sources && hoveredIssue.sources.length > 0 && (
                  <div className="tooltip-sources">
                    <p className="sources-label">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                      </svg>
                      Source
                    </p>
                    <a 
                      href={hoveredIssue.sources[0]} 
                      target="_blank" 
                      rel="noreferrer"
                      className="source-link"
                    >
                      {new URL(hoveredIssue.sources[0]).hostname}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>


        {/* Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="sidebar"
        >
          {/* Analyzing State */}
          {isAnalyzing ? (
            <div className="analyzing-state">
              <div className="analyzing-spinner">
                <div className="spinner-ring" />
                <div className="spinner-dot" />
              </div>
              <h3>Analyzing Document</h3>
              <p>Checking grammar, tone, and verifying facts with AI...</p>
            </div>
          ) : (
            <>
              {/* Score Header */}
              <motion.div 
                key={`score-header-${stats.score}`}
                className="score-header"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <div className="score-row">
                  <h2>Overall Score</h2>
                  <motion.span 
                    className={`score-value ${stats.score >= 90 ? 'excellent' : stats.score >= 70 ? 'good' : 'needs-work'}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.3, type: "spring", stiffness: 200 }}
                  >
                    {stats.score}
                  </motion.span>
                </div>
                <motion.div 
                  className="score-bar"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                  style={{ originX: 0 }}
                >
                  <motion.div 
                    className={`score-fill ${stats.score >= 90 ? 'excellent' : stats.score >= 70 ? 'good' : 'needs-work'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.score}%` }}
                    transition={{ duration: 0.8, delay: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                  />
                </motion.div>
                <motion.div 
                  className="stats-row"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                >
                  <div>Words: {stats.wordCount}</div>
                  <div>Readability: {stats.readabilityScore}</div>
                </motion.div>
              </motion.div>

              {/* Selected Issue Detail */}
              {selectedIssue && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="selected-issue-card"
                >
                  <div className="issue-card-header">
                    <div className="issue-type-badge">
                      <span>{getIcon(selectedIssue.type)}</span>
                      <span>{getTitle(selectedIssue.type)}</span>
                    </div>
                    <button onClick={() => handleDismiss(selectedIssue)} className="dismiss-btn">×</button>
                  </div>

                  <div className="issue-comparison">
                    <div className="original-text">{selectedIssue.original}</div>
                    {selectedIssue.replacements.length > 0 && (
                      <div className="replacement-text">{selectedIssue.replacements[0]}</div>
                    )}
                  </div>

                  <p className="issue-explanation">{selectedIssue.explanation}</p>

                  {selectedIssue.sources && selectedIssue.sources.length > 0 && (
                    <div className="issue-sources">
                      <p className="sources-title">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                        </svg>
                        Fact Checked via Google
                      </p>
                      <ul>
                        {selectedIssue.sources.slice(0, 2).map((src, idx) => (
                          <li key={idx}>
                            <a href={src} target="_blank" rel="noopener noreferrer">
                              {new URL(src).hostname}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="issue-actions">
                    {selectedIssue.replacements.map((rep, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleApplyFix(selectedIssue, rep)}
                        className="apply-btn"
                      >
                        Accept: {rep}
                      </button>
                    ))}
                    {selectedIssue.replacements.length === 0 && (
                      <button 
                        onClick={() => handleApplyFix(selectedIssue, "")}
                        className="delete-btn"
                      >
                        Delete Text
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Issues List */}
              {!selectedIssue && (
                <div className="issues-categories">
                  <h3>Issues Found</h3>
                  {Object.entries(counts).map(([type, count]) => {
                    const issueType = type as IssueType;
                    if (count === 0) return null;
                    return (
                      <button 
                        key={type}
                        className="category-btn"
                        onClick={() => {
                          const first = issues.find(i => i.type === issueType);
                          if (first) setSelectedIssueId(first.id);
                        }}
                      >
                        <div className="category-info">
                          <span className="category-icon">{getIcon(issueType)}</span>
                          <span className="category-name">{getTitle(issueType)}</span>
                        </div>
                        <span className="category-count">{count}</span>
                      </button>
                    );
                  })}

                  {issues.length === 0 && text.length > 0 && (
                    <div className="all-clear">
                      <span className="clear-icon">✅</span>
                      <h4>All clear!</h4>
                      <p>Great job. No issues found in your text.</p>
                    </div>
                  )}

                  {issues.length === 0 && text.length === 0 && (
                    <div className="empty-state">
                      <span className="empty-icon">📝</span>
                      <p>Enter some text and click "Check Text" to analyze.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Stats Panel */}
              <div className="stats-panel">
                <h3>Statistics</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Characters</span>
                    <span className="stat-value">{stats.characterCount}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Sentences</span>
                    <span className="stat-value">{stats.sentenceCount}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Reading Time</span>
                    <span className="stat-value">{stats.readingTimeMinutes} min</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.aside>
      </div>


      <style>{`
        .grammar-checker-page {
          min-height: 100%;
          padding: 24px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .grammar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .back-button {
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

        .back-button:hover {
          color: #3b82f6;
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .title-icon {
          font-size: 32px;
        }

        .header-title h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .header-title p {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn:hover:not(:disabled) {
          background: #f1f5f9;
          color: #475569;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn.clear:hover:not(:disabled) {
          background: #fee2e2;
          color: #dc2626;
          border-color: #fecaca;
        }

        .action-btn.analyze {
          background: #6366f1;
          color: white;
          border-color: #6366f1;
        }

        .action-btn.analyze:hover:not(:disabled) {
          background: #4f46e5;
        }

        .action-btn.analyze.analyzing {
          background: #94a3b8;
          border-color: #94a3b8;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #dc2626;
          margin-bottom: 16px;
        }

        .error-banner button {
          background: none;
          border: none;
          color: #dc2626;
          font-size: 20px;
          cursor: pointer;
          padding: 0 4px;
        }

        .grammar-content {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .editor-section {
          display: flex;
          flex-direction: column;
        }

        .editor-container {
          position: relative;
          width: 100%;
          min-height: 500px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }

        .highlight-backdrop {
          position: absolute;
          inset: 0;
          padding: 24px;
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow: hidden;
          pointer-events: none;
          color: transparent;
          font-family: inherit;
          font-size: 16px;
          line-height: 1.8;
          z-index: 1;
        }

        .editor-textarea {
          position: relative;
          z-index: 0;
          width: 100%;
          min-height: 500px;
          padding: 24px;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          font-family: inherit;
          font-size: 16px;
          line-height: 1.8;
          color: #1e293b;
          caret-color: #1e293b;
        }

        .editor-textarea::placeholder {
          color: #94a3b8;
        }

        .hover-tooltip {
          position: absolute;
          z-index: 50;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          border: 1px solid #e2e8f0;
          padding: 16px;
          width: 280px;
          animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .tooltip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .tooltip-type {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .tooltip-type.type-correctness { background: #fee2e2; color: #dc2626; }
        .tooltip-type.type-clarity { background: #dbeafe; color: #2563eb; }
        .tooltip-type.type-engagement { background: #f3e8ff; color: #9333ea; }
        .tooltip-type.type-delivery { background: #fef3c7; color: #d97706; }

        .tooltip-dismiss {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 20px;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
        }

        .tooltip-dismiss:hover {
          color: #64748b;
        }

        .tooltip-explanation {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 12px 0;
          line-height: 1.5;
        }

        .tooltip-suggestions {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .suggestion-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 10px 12px;
          background: #ecfdf5;
          border: none;
          border-radius: 8px;
          color: #059669;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .suggestion-btn:hover {
          background: #d1fae5;
        }

        .suggestion-btn svg {
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .suggestion-btn:hover svg {
          opacity: 1;
        }

        .tooltip-sources {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
        }

        .sources-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #94a3b8;
          margin: 0 0 4px 0;
        }

        .source-link {
          font-size: 12px;
          color: #3b82f6;
          text-decoration: none;
        }

        .source-link:hover {
          text-decoration: underline;
        }
      `}</style>


      <style>{`
        /* Sidebar Styles */
        .sidebar {
          background: #f8fafc;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: fit-content;
        }

        .analyzing-state {
          padding: 48px 24px;
          text-align: center;
        }

        .analyzing-spinner {
          position: relative;
          width: 64px;
          height: 64px;
          margin: 0 auto 24px;
        }

        .spinner-ring {
          position: absolute;
          inset: 0;
          border: 3px solid #e2e8f0;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .spinner-dot {
          position: absolute;
          inset: 8px;
          background: #eef2ff;
          border-radius: 50%;
          animation: pulse 1s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.9); opacity: 0.7; }
        }

        .analyzing-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .analyzing-state p {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .score-header {
          padding: 20px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
        }

        .score-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .score-row h2 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .score-value {
          font-size: 28px;
          font-weight: 700;
        }

        .score-value.excellent { color: #059669; }
        .score-value.good { color: #d97706; }
        .score-value.needs-work { color: #dc2626; }

        .score-bar {
          width: 100%;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .score-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 1s ease;
        }

        .score-fill.excellent { background: #059669; }
        .score-fill.good { background: #d97706; }
        .score-fill.needs-work { background: #dc2626; }

        .stats-row {
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .selected-issue-card {
          margin: 16px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .issue-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .issue-type-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .dismiss-btn {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 20px;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
        }

        .dismiss-btn:hover {
          color: #64748b;
        }

        .issue-comparison {
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
          margin-bottom: 12px;
        }

        .original-text {
          font-size: 14px;
          color: #94a3b8;
          text-decoration: line-through;
          margin-bottom: 4px;
        }

        .replacement-text {
          font-size: 18px;
          font-weight: 600;
          color: #6366f1;
        }

        .issue-explanation {
          font-size: 14px;
          color: #64748b;
          line-height: 1.5;
          margin: 0 0 12px 0;
        }

        .issue-sources {
          padding: 12px;
          background: #eff6ff;
          border-radius: 8px;
          margin-bottom: 12px;
        }

        .sources-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #3b82f6;
          margin: 0 0 8px 0;
        }

        .issue-sources ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .issue-sources li {
          margin-bottom: 4px;
        }

        .issue-sources a {
          font-size: 12px;
          color: #3b82f6;
          text-decoration: none;
        }

        .issue-sources a:hover {
          text-decoration: underline;
        }

        .issue-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .apply-btn {
          width: 100%;
          padding: 10px 16px;
          background: #6366f1;
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .apply-btn:hover {
          background: #4f46e5;
        }

        .delete-btn {
          width: 100%;
          padding: 10px 16px;
          background: #fee2e2;
          border: none;
          border-radius: 8px;
          color: #dc2626;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .delete-btn:hover {
          background: #fecaca;
        }

        .issues-categories {
          padding: 16px;
        }

        .issues-categories h3 {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px 0;
        }

        .category-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 14px 16px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-bottom: 8px;
        }

        .category-btn:hover {
          border-color: #6366f1;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
        }

        .category-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .category-icon {
          font-size: 18px;
        }

        .category-name {
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
        }

        .category-count {
          padding: 4px 10px;
          background: #f1f5f9;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
        }

        .category-btn:hover .category-count {
          background: #eef2ff;
          color: #6366f1;
        }

        .all-clear, .empty-state {
          text-align: center;
          padding: 32px 16px;
        }

        .clear-icon, .empty-icon {
          font-size: 40px;
          display: block;
          margin-bottom: 12px;
        }

        .all-clear h4 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .all-clear p, .empty-state p {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .stats-panel {
          padding: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .stats-panel h3 {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .stat-item {
          text-align: center;
          padding: 12px 8px;
          background: white;
          border-radius: 8px;
        }

        .stat-label {
          display: block;
          font-size: 10px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
        }
      `}</style>


      <style>{`
        /* API Key Modal */
        .api-key-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
        }

        .api-key-modal {
          background: white;
          border-radius: 20px;
          padding: 32px;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .api-key-modal h2 {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 12px 0;
        }

        .api-key-modal p {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 8px 0;
          line-height: 1.5;
        }

        .api-key-hint {
          margin-bottom: 20px !important;
        }

        .api-key-hint a {
          color: #6366f1;
          text-decoration: none;
        }

        .api-key-hint a:hover {
          text-decoration: underline;
        }

        .api-key-input {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          margin-bottom: 16px;
          transition: border-color 0.15s ease;
        }

        .api-key-input:focus {
          outline: none;
          border-color: #6366f1;
        }

        .api-key-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .cancel-btn {
          padding: 12px 20px;
          background: #f1f5f9;
          border: none;
          border-radius: 10px;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .cancel-btn:hover {
          background: #e2e8f0;
        }

        .save-btn {
          padding: 12px 24px;
          background: #6366f1;
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .save-btn:hover:not(:disabled) {
          background: #4f46e5;
        }

        .save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .grammar-content {
            grid-template-columns: 1fr;
          }

          .sidebar {
            order: -1;
          }
        }

        @media (max-width: 768px) {
          .grammar-checker-page {
            padding: 16px;
          }

          .grammar-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .header-title h1 {
            font-size: 20px;
          }

          .header-actions {
            width: 100%;
            flex-wrap: wrap;
          }

          .action-btn {
            flex: 1;
            justify-content: center;
            min-width: 100px;
          }

          .editor-container {
            min-height: 300px;
          }

          .editor-textarea {
            min-height: 300px;
          }
        }

        @media (max-width: 480px) {
          .back-button span {
            display: none;
          }

          .action-btn span:not(.spinner) {
            display: none;
          }

          .action-btn.analyze span {
            display: inline;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default GrammarChecker;
