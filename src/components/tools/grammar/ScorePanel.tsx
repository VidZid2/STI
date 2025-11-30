/**
 * ScorePanel Component
 * 
 * Displays the writing quality score with a circular progress ring,
 * color-coded indicators, animated transitions, and category breakdown.
 * 
 * Requirements: 3.1, 3.2, 3.4
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { WritingScore, IssueCategory } from '../../../lib/grammar/types';
import { getScoreColor, getScoreDescription } from '../../../lib/grammar/score';

export interface ScorePanelProps {
  score: WritingScore;
  previousScore?: number;
  isAnimating?: boolean;
}

/**
 * Category display configuration
 */
const CATEGORY_CONFIG: Record<IssueCategory, { label: string; icon: string }> = {
  correctness: { label: 'Correctness', icon: '✓' },
  clarity: { label: 'Clarity', icon: '◎' },
  engagement: { label: 'Engagement', icon: '★' },
  delivery: { label: 'Delivery', icon: '◆' },
};

/**
 * Circular progress ring component
 */
const CircularProgress: React.FC<{
  value: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  animate?: boolean;
}> = ({ value, size = 120, strokeWidth = 8, color, animate = true }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="circular-progress">
      {/* Background circle */}
      <circle
        className="progress-bg"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <motion.circle
        className="progress-bar"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={animate ? { strokeDashoffset: circumference } : { strokeDashoffset: offset }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          transform: 'rotate(-90deg)',
          transformOrigin: '50% 50%',
        }}
      />
    </svg>
  );
};

/**
 * Category score bar component
 */
const CategoryScoreBar: React.FC<{
  category: IssueCategory;
  score: number;
  animate?: boolean;
}> = ({ category, score, animate = true }) => {
  const config = CATEGORY_CONFIG[category];
  const color = getScoreColor(score);

  return (
    <div className="category-score-item">
      <div className="category-header">
        <span className="category-icon">{config.icon}</span>
        <span className="category-label">{config.label}</span>
        <motion.span
          className="category-value"
          initial={animate ? { opacity: 0 } : { opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ color }}
        >
          {score}
        </motion.span>
      </div>
      <div className="category-bar-bg">
        <motion.div
          className="category-bar-fill"
          initial={animate ? { width: 0 } : { width: `${score}%` }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
};

/**
 * ScorePanel component that displays writing quality scores.
 * Requirements: 3.1 (score 0-100), 3.2 (color-coded gauge), 3.4 (animated transitions)
 */
const ScorePanel: React.FC<ScorePanelProps> = ({
  score,
  previousScore,
  isAnimating = true,
}) => {
  const [displayScore, setDisplayScore] = useState(score.overall);
  const [showChange, setShowChange] = useState(false);
  const scoreColor = getScoreColor(score.overall);
  const scoreDescription = getScoreDescription(score.overall);

  // Animate score number change - Requirements 3.4 (300ms animation)
  useEffect(() => {
    if (!isAnimating) {
      setDisplayScore(score.overall);
      return;
    }

    const startScore = displayScore;
    const endScore = score.overall;
    const duration = 300; // 300ms as per requirements
    const startTime = performance.now();

    const animateScore = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentScore = Math.round(startScore + (endScore - startScore) * easeProgress);
      
      setDisplayScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animateScore);
      }
    };

    requestAnimationFrame(animateScore);
  }, [score.overall, isAnimating]);

  // Show score change indicator
  useEffect(() => {
    if (previousScore !== undefined && previousScore !== score.overall) {
      setShowChange(true);
      const timer = setTimeout(() => setShowChange(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [score.overall, previousScore]);

  const scoreChange = previousScore !== undefined ? score.overall - previousScore : 0;

  return (
    <div className="score-panel">
      {/* Main Score Display */}
      <div className="score-main">
        <div className="score-ring-container">
          <CircularProgress
            value={score.overall}
            size={120}
            strokeWidth={8}
            color={scoreColor}
            animate={isAnimating}
          />
          <div className="score-value-container">
            <motion.span
              className="score-value"
              style={{ color: scoreColor }}
              key={displayScore}
            >
              {displayScore}
            </motion.span>
            <span className="score-max">/100</span>
          </div>
        </div>

        {/* Score Change Indicator */}
        <AnimatePresence>
          {showChange && scoreChange !== 0 && (
            <motion.div
              className={`score-change ${scoreChange > 0 ? 'positive' : 'negative'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {scoreChange > 0 ? '+' : ''}{scoreChange}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Score Description */}
        <motion.div
          className="score-description"
          initial={isAnimating ? { opacity: 0 } : { opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.2 }}
        >
          {scoreDescription}
        </motion.div>
      </div>

      {/* Category Breakdown - Requirements 3.2 */}
      <div className="score-categories">
        <h4 className="categories-title">Score Breakdown</h4>
        <div className="categories-list">
          <CategoryScoreBar
            category="correctness"
            score={score.correctness}
            animate={isAnimating}
          />
          <CategoryScoreBar
            category="clarity"
            score={score.clarity}
            animate={isAnimating}
          />
          <CategoryScoreBar
            category="engagement"
            score={score.engagement}
            animate={isAnimating}
          />
          <CategoryScoreBar
            category="delivery"
            score={score.delivery}
            animate={isAnimating}
          />
        </div>
      </div>

      <style>{`
        .score-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 20px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .score-main {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .score-ring-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .circular-progress {
          transform: rotate(-90deg);
        }

        .score-value-container {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .score-value {
          font-size: 32px;
          font-weight: 700;
          line-height: 1;
        }

        .score-max {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
        }

        .score-change {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        .score-change.positive {
          background: #d1fae5;
          color: #059669;
        }

        .score-change.negative {
          background: #fee2e2;
          color: #dc2626;
        }

        .score-description {
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .score-categories {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .categories-title {
          margin: 0;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .categories-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .category-score-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .category-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .category-icon {
          font-size: 12px;
          color: #94a3b8;
        }

        .category-label {
          flex: 1;
          font-size: 13px;
          font-weight: 500;
          color: #475569;
        }

        .category-value {
          font-size: 13px;
          font-weight: 700;
        }

        .category-bar-bg {
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          overflow: hidden;
        }

        .category-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: background-color 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default ScorePanel;

// Export sub-components for potential reuse
export { CircularProgress, CategoryScoreBar };
