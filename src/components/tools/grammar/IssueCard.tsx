/**
 * IssueCard Component
 * 
 * Displays a popup card with issue details, correction suggestions, and dismiss option.
 * Positioned near the highlighted text in the editor.
 * 
 * Requirements: 1.2, 2.1, 2.4, 8.1
 */

import * as React from 'react';
import { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { GrammarIssue, Correction, IssueCategory } from '../../../lib/grammar/types';
import { CATEGORY_COLORS } from '../../../lib/grammar/types';

export interface IssueCardProps {
  issue: GrammarIssue;
  onApplyCorrection: (correction: Correction) => void;
  onDismiss: () => void;
  position: { x: number; y: number };
  onClose?: () => void;
}

/**
 * Get category display name
 */
function getCategoryDisplayName(category: IssueCategory): string {
  const names: Record<IssueCategory, string> = {
    correctness: 'Correctness',
    clarity: 'Clarity',
    engagement: 'Engagement',
    delivery: 'Delivery',
  };
  return names[category];
}

/**
 * Get severity icon
 */
function getSeverityIcon(severity: GrammarIssue['severity']): string {
  switch (severity) {
    case 'error':
      return '❌';
    case 'warning':
      return '⚠️';
    case 'suggestion':
      return '💡';
    default:
      return '📝';
  }
}

/**
 * IssueCard component that displays issue details with correction options.
 */
const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  onApplyCorrection,
  onDismiss,
  position,
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const colors = CATEGORY_COLORS[issue.type];


  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep card within viewport
  useEffect(() => {
    if (cardRef.current) {
      const card = cardRef.current;
      const rect = card.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Adjust horizontal position if card goes off-screen
      if (rect.right > viewportWidth - 16) {
        card.style.left = `${viewportWidth - rect.width - 16}px`;
      }
      if (rect.left < 16) {
        card.style.left = '16px';
      }

      // Adjust vertical position if card goes off-screen
      if (rect.bottom > viewportHeight - 16) {
        card.style.top = `${position.y - rect.height - 8}px`;
      }
    }
  }, [position]);

  const handleApplyCorrection = useCallback(
    (correction: Correction) => {
      onApplyCorrection(correction);
      onClose?.();
    },
    [onApplyCorrection, onClose]
  );

  const handleDismiss = useCallback(() => {
    onDismiss();
    onClose?.();
  }, [onDismiss, onClose]);

  return (
    <AnimatePresence>
      <motion.div
        ref={cardRef}
        className="issue-card-popup"
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y + 8,
          zIndex: 1000,
        }}
        role="dialog"
        aria-labelledby="issue-card-title"
        aria-describedby="issue-card-description"
      >
        {/* Header */}
        <div className="issue-card-header">
          <div className="issue-card-category">
            <span className="issue-card-icon">{getSeverityIcon(issue.severity)}</span>
            <span
              className="issue-card-badge"
              style={{
                backgroundColor: `${colors.bg}`,
                color: colors.underline,
                borderColor: colors.underline,
              }}
            >
              {getCategoryDisplayName(issue.type)}
            </span>
          </div>
          <button
            className="issue-card-close"
            onClick={() => onClose?.()}
            aria-label="Close issue card"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>


        {/* Issue Message */}
        <div className="issue-card-content">
          <h4 id="issue-card-title" className="issue-card-message">
            {issue.message}
          </h4>
          {issue.description && (
            <p id="issue-card-description" className="issue-card-description">
              {issue.description}
            </p>
          )}

          {/* Original Text */}
          <div className="issue-card-original">
            <span className="original-label">Original:</span>
            <span
              className="original-text"
              style={{
                textDecoration: 'underline',
                textDecorationColor: colors.underline,
                textDecorationStyle: 'wavy',
              }}
            >
              {issue.originalText}
            </span>
          </div>
        </div>

        {/* Correction Suggestions - Requirements 2.1, 2.4 */}
        {issue.suggestions.length > 0 && (
          <div className="issue-card-suggestions">
            <span className="suggestions-label">
              {issue.suggestions.length === 1 ? 'Suggestion:' : 'Suggestions:'}
            </span>
            <div className="suggestions-list">
              {issue.suggestions.map((correction, index) => (
                <motion.button
                  key={index}
                  className="suggestion-button"
                  onClick={() => handleApplyCorrection(correction)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    borderColor: colors.underline,
                  }}
                >
                  <span className="suggestion-text">{correction.text}</span>
                  {correction.confidence >= 0.9 && (
                    <span className="suggestion-confidence" title="High confidence">
                      ✓
                    </span>
                  )}
                  {correction.description && (
                    <span className="suggestion-description">{correction.description}</span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Actions - Requirements 8.1 */}
        <div className="issue-card-actions">
          <motion.button
            className="dismiss-button"
            onClick={handleDismiss}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
            Dismiss
          </motion.button>
        </div>


        <style>{`
          .issue-card-popup {
            width: 320px;
            max-width: calc(100vw - 32px);
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            font-family: inherit;
          }

          .issue-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            border-bottom: 1px solid #f1f5f9;
            background: #fafbfc;
          }

          .issue-card-category {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .issue-card-icon {
            font-size: 16px;
          }

          .issue-card-badge {
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            border: 1px solid;
          }

          .issue-card-close {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            background: transparent;
            border: none;
            border-radius: 8px;
            color: #94a3b8;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .issue-card-close:hover {
            background: #f1f5f9;
            color: #64748b;
          }

          .issue-card-content {
            padding: 16px;
          }

          .issue-card-message {
            margin: 0 0 8px 0;
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
            line-height: 1.4;
          }

          .issue-card-description {
            margin: 0 0 12px 0;
            font-size: 13px;
            color: #64748b;
            line-height: 1.5;
          }

          .issue-card-original {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: #f8fafc;
            border-radius: 8px;
            font-size: 13px;
          }

          .original-label {
            color: #94a3b8;
            font-weight: 500;
          }

          .original-text {
            color: #1e293b;
            font-weight: 500;
          }

          .issue-card-suggestions {
            padding: 0 16px 16px;
          }

          .suggestions-label {
            display: block;
            font-size: 12px;
            font-weight: 500;
            color: #64748b;
            margin-bottom: 8px;
          }

          .suggestions-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .suggestion-button {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            padding: 10px 14px;
            background: white;
            border: 2px solid;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 500;
            color: #1e293b;
            cursor: pointer;
            transition: all 0.15s ease;
            text-align: left;
          }

          .suggestion-button:hover {
            background: #f8fafc;
            transform: translateY(-1px);
          }

          .suggestion-text {
            flex: 1;
            color: #059669;
            font-weight: 600;
          }

          .suggestion-confidence {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            background: #d1fae5;
            color: #059669;
            border-radius: 50%;
            font-size: 10px;
            font-weight: 700;
          }

          .suggestion-description {
            display: block;
            width: 100%;
            font-size: 11px;
            color: #94a3b8;
            font-weight: 400;
            margin-top: 4px;
          }

          .issue-card-actions {
            display: flex;
            justify-content: flex-end;
            padding: 12px 16px;
            border-top: 1px solid #f1f5f9;
            background: #fafbfc;
          }

          .dismiss-button {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            background: transparent;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            color: #64748b;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .dismiss-button:hover {
            background: #fef2f2;
            border-color: #fecaca;
            color: #dc2626;
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
};

export default IssueCard;

// Export utility functions for testing
export { getCategoryDisplayName, getSeverityIcon };
