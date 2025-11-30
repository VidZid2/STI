/**
 * StatsPanel Component
 * 
 * Displays text statistics including word count, character count, sentence count,
 * paragraph count, average sentence length, reading time estimate, and readability metrics.
 * 
 * Requirements: 5.1, 5.2, 9.1, 9.3, 9.4
 */

import * as React from 'react';
import { motion } from 'motion/react';
import type { TextStatistics, ReadabilityMetrics } from '../../../lib/grammar/types';

export interface StatsPanelProps {
  statistics: TextStatistics;
  readability: ReadabilityMetrics;
}

/**
 * Individual stat item component
 */
const StatItem: React.FC<{
  label: string;
  value: string | number;
  icon: string;
  animate?: boolean;
}> = ({ label, value, icon, animate = true }) => {
  return (
    <motion.div
      className="stat-item"
      initial={animate ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <span className="stat-icon">{icon}</span>
      <div className="stat-content">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </motion.div>
  );
};

/**
 * Formats reading time for display
 */
function formatReadingTime(minutes: number): string {
  if (minutes === 0) {
    return '< 1 min';
  }
  if (minutes === 1) {
    return '1 min';
  }
  return `${minutes} mins`;
}

/**
 * Formats average sentence length for display
 */
function formatAverageSentenceLength(avgLength: number): string {
  if (avgLength === 0) {
    return '0';
  }
  return avgLength.toFixed(1);
}

/**
 * Gets color for readability grade
 */
function getReadabilityColor(grade: number): string {
  if (grade <= 6) return '#22c55e'; // Green - easy
  if (grade <= 10) return '#3b82f6'; // Blue - moderate
  if (grade <= 14) return '#f59e0b'; // Orange - difficult
  return '#ef4444'; // Red - very difficult
}

/**
 * StatsPanel component that displays text statistics and readability metrics.
 * Requirements: 5.1 (readability grade), 5.2 (education level), 9.1 (word/char/sentence count),
 * 9.3 (reading time), 9.4 (paragraph count, avg sentence length)
 */
const StatsPanel: React.FC<StatsPanelProps> = ({ statistics, readability }) => {
  const readabilityColor = getReadabilityColor(readability.fleschKincaidGrade);

  return (
    <div className="stats-panel">
      {/* Text Statistics Section - Requirements 9.1, 9.4 */}
      <div className="stats-section">
        <h4 className="section-title">Text Statistics</h4>
        <div className="stats-grid">
          <StatItem
            label="Words"
            value={statistics.wordCount}
            icon="📝"
          />
          <StatItem
            label="Characters"
            value={statistics.characterCount}
            icon="🔤"
          />
          <StatItem
            label="Sentences"
            value={statistics.sentenceCount}
            icon="📄"
          />
          <StatItem
            label="Paragraphs"
            value={statistics.paragraphCount}
            icon="¶"
          />
          <StatItem
            label="Avg. Sentence"
            value={`${formatAverageSentenceLength(statistics.averageSentenceLength)} words`}
            icon="📏"
          />
          {/* Reading Time - Requirements 9.3 */}
          <StatItem
            label="Reading Time"
            value={formatReadingTime(statistics.readingTimeMinutes)}
            icon="⏱️"
          />
        </div>
      </div>

      {/* Readability Section - Requirements 5.1, 5.2 */}
      <div className="stats-section">
        <h4 className="section-title">Readability</h4>
        <div className="readability-display">
          <motion.div
            className="readability-grade"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ borderColor: readabilityColor }}
          >
            <span className="grade-value" style={{ color: readabilityColor }}>
              {readability.fleschKincaidGrade > 0 ? readability.fleschKincaidGrade.toFixed(1) : '—'}
            </span>
            <span className="grade-label">Grade Level</span>
          </motion.div>
          <div className="readability-info">
            <div className="education-level">
              <span className="info-label">Education Level</span>
              <span className="info-value">{readability.educationLevel}</span>
            </div>
            <div className="difficulty-indicator">
              <span className="info-label">Difficulty</span>
              <span 
                className="difficulty-badge"
                style={{ backgroundColor: readabilityColor }}
              >
                {getDifficultyLabel(readability.fleschKincaidGrade)}
              </span>
            </div>
          </div>
        </div>
        {readability.difficultSentences.length > 0 && (
          <div className="difficult-sentences-notice">
            <span className="notice-icon">⚠️</span>
            <span className="notice-text">
              {readability.difficultSentences.length} sentence{readability.difficultSentences.length > 1 ? 's' : ''} may be difficult to read
            </span>
          </div>
        )}
      </div>

      <style>{`
        .stats-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 20px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .stats-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-title {
          margin: 0;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: #f8fafc;
          border-radius: 10px;
        }

        .stat-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .stat-value {
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .stat-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
        }

        .readability-display {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .readability-grade {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 12px;
          border: 3px solid;
          background: #f8fafc;
          flex-shrink: 0;
        }

        .grade-value {
          font-size: 24px;
          font-weight: 700;
          line-height: 1;
        }

        .grade-label {
          font-size: 10px;
          color: #64748b;
          font-weight: 500;
          margin-top: 4px;
        }

        .readability-info {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }

        .education-level,
        .difficulty-indicator {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .info-label {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }

        .info-value {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }

        .difficulty-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          color: white;
          width: fit-content;
        }

        .difficult-sentences-notice {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: #fef3c7;
          border-radius: 8px;
          margin-top: 4px;
        }

        .notice-icon {
          font-size: 14px;
          flex-shrink: 0;
        }

        .notice-text {
          font-size: 12px;
          color: #92400e;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

/**
 * Gets difficulty label based on grade level
 */
function getDifficultyLabel(grade: number): string {
  if (grade <= 0) return 'N/A';
  if (grade <= 6) return 'Easy';
  if (grade <= 10) return 'Moderate';
  if (grade <= 14) return 'Difficult';
  return 'Very Difficult';
}

export default StatsPanel;

// Export sub-components for potential reuse
export { StatItem };
