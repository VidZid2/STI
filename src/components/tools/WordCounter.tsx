import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";

interface WordCounterProps {
  onBack: () => void;
}

interface Stats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  readingTime: string;
  speakingTime: string;
}

const WordCounter: React.FC<WordCounterProps> = ({ onBack }) => {
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const stats: Stats = useMemo(() => {
    const trimmedText = text.trim();
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, "").length;
    const words = trimmedText ? trimmedText.split(/\s+/).filter(Boolean).length : 0;
    const sentences = trimmedText ? (trimmedText.match(/[.!?]+/g) || []).length || (trimmedText.length > 0 ? 1 : 0) : 0;
    const paragraphs = trimmedText ? trimmedText.split(/\n\n+/).filter(Boolean).length : 0;
    
    const readingMinutes = Math.ceil(words / 200);
    const speakingMinutes = Math.ceil(words / 150);
    
    const readingTime = readingMinutes < 1 ? "< 1 min" : `${readingMinutes} min`;
    const speakingTime = speakingMinutes < 1 ? "< 1 min" : `${speakingMinutes} min`;

    return { characters, charactersNoSpaces, words, sentences, paragraphs, readingTime, speakingTime };
  }, [text]);

  useEffect(() => {
    if (text) {
      setIsTyping(true);
      const timeout = setTimeout(() => setIsTyping(false), 150);
      return () => clearTimeout(timeout);
    }
  }, [text]);

  const handleClear = () => setText("");
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };

  const statCards = [
    { label: "Words", value: stats.words, icon: "📝", color: "from-blue-500 to-indigo-500", bg: "bg-blue-50" },
    { label: "Characters", value: stats.characters, icon: "🔤", color: "from-emerald-500 to-teal-500", bg: "bg-emerald-50" },
    { label: "No Spaces", value: stats.charactersNoSpaces, icon: "✨", color: "from-violet-500 to-purple-500", bg: "bg-violet-50" },
    { label: "Sentences", value: stats.sentences, icon: "💬", color: "from-amber-500 to-orange-500", bg: "bg-amber-50" },
    { label: "Paragraphs", value: stats.paragraphs, icon: "📄", color: "from-rose-500 to-pink-500", bg: "bg-rose-50" },
    { label: "Reading", value: stats.readingTime, icon: "📖", color: "from-cyan-500 to-blue-500", bg: "bg-cyan-50", isTime: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="word-counter-page"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="word-counter-header"
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
            animate={{ rotate: isTyping ? [0, -10, 10, 0] : 0 }}
            transition={{ duration: 0.3 }}
          >
            📊
          </motion.div>
          <div>
            <h1>Word Counter</h1>
            <p>Analyze your text instantly</p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="word-counter-content">
        {/* Text Area Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="textarea-section"
        >
          <div className="textarea-header">
            <span className="textarea-label">Your Text</span>
            <div className="textarea-actions">
              <motion.button
                onClick={handleCopy}
                className="action-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!text}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy
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
            </div>
          </div>
          
          <motion.div 
            className="textarea-wrapper"
            animate={{ 
              boxShadow: isTyping 
                ? "0 0 0 3px rgba(59, 130, 246, 0.2), 0 10px 40px rgba(0, 0, 0, 0.1)" 
                : "0 4px 20px rgba(0, 0, 0, 0.08)"
            }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Start typing or paste your text here..."
              className="main-textarea"
            />
            <AnimatePresence>
              {!text && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="textarea-placeholder-hint"
                >
                  <span>💡 Tip: Paste an essay to check word count requirements</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="stats-section"
        >
          <h3 className="stats-title">Statistics</h3>
          <div className="stats-grid">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`stat-card ${stat.bg}`}
              >
                <div className="stat-icon">{stat.icon}</div>
                <motion.div
                  className="stat-value"
                  key={String(stat.value)}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {stat.value}
                </motion.div>
                <div className="stat-label">{stat.label}</div>
                <div className={`stat-gradient bg-gradient-to-r ${stat.color}`} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Speaking Time Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="time-card"
        >
          <div className="time-card-content">
            <div className="time-item">
              <div className="time-icon">📖</div>
              <div className="time-info">
                <span className="time-label">Reading Time</span>
                <span className="time-value">{stats.readingTime}</span>
              </div>
            </div>
            <div className="time-divider" />
            <div className="time-item">
              <div className="time-icon">🎤</div>
              <div className="time-info">
                <span className="time-label">Speaking Time</span>
                <span className="time-value">{stats.speakingTime}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        .word-counter-page {
          min-height: 100%;
          padding: 24px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .word-counter-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
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

        .word-counter-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 900px;
          margin: 0 auto;
        }

        .textarea-section {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .textarea-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .textarea-label {
          font-weight: 600;
          color: #1e293b;
          font-size: 15px;
        }

        .textarea-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: #f1f5f9;
          border: none;
          border-radius: 8px;
          color: #64748b;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn:hover:not(:disabled) {
          background: #e2e8f0;
          color: #475569;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn.clear:hover:not(:disabled) {
          background: #fee2e2;
          color: #dc2626;
        }

        .textarea-wrapper {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          transition: box-shadow 0.3s ease;
        }

        .main-textarea {
          width: 100%;
          min-height: 200px;
          padding: 20px;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          font-size: 15px;
          line-height: 1.7;
          color: #1e293b;
          resize: vertical;
          transition: border-color 0.2s ease;
          font-family: inherit;
        }

        .main-textarea:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .main-textarea::placeholder {
          color: #94a3b8;
        }

        .textarea-placeholder-hint {
          position: absolute;
          bottom: 16px;
          left: 20px;
          font-size: 13px;
          color: #94a3b8;
          pointer-events: none;
        }

        .stats-section {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .stats-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 20px 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 16px;
        }

        .stat-card {
          position: relative;
          padding: 20px 16px;
          border-radius: 16px;
          text-align: center;
          overflow: hidden;
          transition: all 0.3s ease;
          cursor: default;
        }

        .stat-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .stat-gradient {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          opacity: 0.8;
        }

        .time-card {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 10px 40px rgba(30, 41, 59, 0.3);
        }

        .time-card-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
        }

        .time-item {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .time-icon {
          font-size: 32px;
        }

        .time-info {
          display: flex;
          flex-direction: column;
        }

        .time-label {
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
        }

        .time-value {
          font-size: 24px;
          font-weight: 700;
          color: white;
        }

        .time-divider {
          width: 1px;
          height: 50px;
          background: rgba(255, 255, 255, 0.2);
        }

        @media (max-width: 640px) {
          .word-counter-header {
            flex-direction: column-reverse;
            gap: 16px;
            align-items: flex-start;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .time-card-content {
            flex-direction: column;
            gap: 20px;
          }

          .time-divider {
            width: 100%;
            height: 1px;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default WordCounter;
