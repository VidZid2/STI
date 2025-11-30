/**
 * TonePanel Component
 * 
 * Displays tone analysis including dominant tone with icon,
 * tone breakdown with percentage bars, and consistency indicator.
 * 
 * Requirements: 6.1, 6.2
 */

import * as React from 'react';
import { motion } from 'motion/react';
import type { ToneAnalysis, ToneType } from '../../../lib/grammar/types';

export interface TonePanelProps {
  tone: ToneAnalysis;
  animate?: boolean;
}

/**
 * Configuration for each tone type including icon and color.
 */
const TONE_CONFIG: Record<ToneType, { icon: string; label: string; color: string }> = {
  formal: { icon: '🎩', label: 'Formal', color: '#6366f1' },
  informal: { icon: '😊', label: 'Informal', color: '#f59e0b' },
  confident: { icon: '💪', label: 'Confident', color: '#10b981' },
  neutral: { icon: '⚖️', label: 'Neutral', color: '#64748b' },
  friendly: { icon: '🤝', label: 'Friendly', color: '#ec4899' },
};

/**
 * Dominant tone display component
 */
const DominantToneDisplay: React.FC<{
  tone: ToneType;
  animate?: boolean;
}> = ({ tone, animate = true }) => {
  const config = TONE_CONFIG[tone];

  return (
    <motion.div
      className="dominant-tone"
      initial={animate ? { opacity: 0, scale: 0.9 } : { opacity: 1, scale: 1 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <span className="dominant-icon">{config.icon}</span>
      <div className="dominant-info">
        <span className="dominant-label">Dominant Tone</span>
        <span className="dominant-value" style={{ color: config.color }}>
          {config.label}
        </span>
      </div>
    </motion.div>
  );
};


/**
 * Tone percentage bar component
 */
const ToneBar: React.FC<{
  tone: ToneType;
  percentage: number;
  animate?: boolean;
}> = ({ tone, percentage, animate = true }) => {
  const config = TONE_CONFIG[tone];

  return (
    <div className="tone-bar-item">
      <div className="tone-bar-header">
        <span className="tone-bar-icon">{config.icon}</span>
        <span className="tone-bar-label">{config.label}</span>
        <motion.span
          className="tone-bar-percentage"
          initial={animate ? { opacity: 0 } : { opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {percentage}%
        </motion.span>
      </div>
      <div className="tone-bar-bg">
        <motion.div
          className="tone-bar-fill"
          initial={animate ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ backgroundColor: config.color }}
        />
      </div>
    </div>
  );
};

/**
 * Consistency indicator component
 */
const ConsistencyIndicator: React.FC<{
  isConsistent: boolean;
  inconsistencyCount: number;
  animate?: boolean;
}> = ({ isConsistent, inconsistencyCount, animate = true }) => {
  return (
    <motion.div
      className={`consistency-indicator ${isConsistent ? 'consistent' : 'inconsistent'}`}
      initial={animate ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <span className="consistency-icon">
        {isConsistent ? '✓' : '⚠️'}
      </span>
      <span className="consistency-text">
        {isConsistent
          ? 'Tone is consistent throughout'
          : `${inconsistencyCount} tone inconsistenc${inconsistencyCount === 1 ? 'y' : 'ies'} detected`}
      </span>
    </motion.div>
  );
};


/**
 * TonePanel component that displays tone analysis results.
 * Requirements: 6.1 (dominant tone), 6.2 (tone breakdown with percentages)
 */
const TonePanel: React.FC<TonePanelProps> = ({ tone, animate = true }) => {
  // Sort breakdown by percentage (highest first) for better visualization
  const sortedBreakdown = [...tone.breakdown].sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="tone-panel">
      {/* Dominant Tone Display - Requirements 6.1 */}
      <div className="tone-section">
        <h4 className="section-title">Writing Tone</h4>
        <DominantToneDisplay tone={tone.dominant} animate={animate} />
      </div>

      {/* Tone Breakdown - Requirements 6.2 */}
      <div className="tone-section">
        <h4 className="section-title">Tone Breakdown</h4>
        <div className="tone-bars">
          {sortedBreakdown.map((item) => (
            <ToneBar
              key={item.tone}
              tone={item.tone}
              percentage={item.percentage}
              animate={animate}
            />
          ))}
        </div>
      </div>

      {/* Consistency Indicator */}
      <ConsistencyIndicator
        isConsistent={tone.isConsistent}
        inconsistencyCount={tone.inconsistencies.length}
        animate={animate}
      />

      <style>{`
        .tone-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 20px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .tone-section {
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

        .dominant-tone {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
        }

        .dominant-icon {
          font-size: 32px;
          flex-shrink: 0;
        }

        .dominant-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .dominant-label {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }

        .dominant-value {
          font-size: 18px;
          font-weight: 700;
        }

        .tone-bars {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tone-bar-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tone-bar-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tone-bar-icon {
          font-size: 14px;
          flex-shrink: 0;
        }

        .tone-bar-label {
          flex: 1;
          font-size: 13px;
          font-weight: 500;
          color: #475569;
        }

        .tone-bar-percentage {
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
        }

        .tone-bar-bg {
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          overflow: hidden;
        }

        .tone-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: background-color 0.3s ease;
        }

        .consistency-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 8px;
        }

        .consistency-indicator.consistent {
          background: #d1fae5;
        }

        .consistency-indicator.inconsistent {
          background: #fef3c7;
        }

        .consistency-icon {
          font-size: 14px;
          flex-shrink: 0;
        }

        .consistency-text {
          font-size: 12px;
          font-weight: 500;
        }

        .consistency-indicator.consistent .consistency-text {
          color: #059669;
        }

        .consistency-indicator.inconsistent .consistency-text {
          color: #92400e;
        }
      `}</style>
    </div>
  );
};

export default TonePanel;

// Export sub-components for potential reuse
export { DominantToneDisplay, ToneBar, ConsistencyIndicator, TONE_CONFIG };
