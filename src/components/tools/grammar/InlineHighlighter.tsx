/**
 * InlineHighlighter Component
 * 
 * Renders text with inline highlighting for grammar issues.
 * Displays colored underlines at issue positions based on category.
 * Handles overlapping highlights by prioritizing severity.
 * 
 * Requirements: 1.1, 1.3
 */

import * as React from 'react';
import { useMemo, useCallback, useRef, useState } from 'react';
import type { GrammarIssue, IssueCategory, IssueSeverity } from '../../../lib/grammar/types';
import { CATEGORY_COLORS } from '../../../lib/grammar/types';

export interface InlineHighlighterProps {
  text: string;
  issues: GrammarIssue[];
  onIssueHover: (issue: GrammarIssue | null) => void;
  onIssueClick: (issue: GrammarIssue) => void;
  dismissedPatterns: Set<string>;
  onChange?: (newText: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Severity priority for overlapping highlights.
 * Higher number = higher priority.
 */
const SEVERITY_PRIORITY: Record<IssueSeverity, number> = {
  error: 3,
  warning: 2,
  suggestion: 1,
};

/**
 * Represents a segment of text with optional highlighting.
 */
interface TextSegment {
  text: string;
  startIndex: number;
  endIndex: number;
  issue: GrammarIssue | null;
}

/**
 * Creates a unique key for a dismissed pattern.
 */
function createDismissalKey(rule: string, originalText: string): string {
  return `${rule}:${originalText.toLowerCase()}`;
}

/**
 * Filters out dismissed issues from the issues array.
 */
function filterDismissedIssues(
  issues: GrammarIssue[],
  dismissedPatterns: Set<string>
): GrammarIssue[] {
  return issues.filter(issue => {
    const key = createDismissalKey(issue.rule, issue.originalText);
    return !dismissedPatterns.has(key);
  });
}

/**
 * Resolves overlapping issues by keeping the one with highest severity.
 * For same severity, keeps the first one encountered.
 */
function resolveOverlappingIssues(issues: GrammarIssue[]): GrammarIssue[] {
  if (issues.length === 0) return [];

  // Sort by start index, then by severity (highest first)
  const sorted = [...issues].sort((a, b) => {
    if (a.startIndex !== b.startIndex) {
      return a.startIndex - b.startIndex;
    }
    return SEVERITY_PRIORITY[b.severity] - SEVERITY_PRIORITY[a.severity];
  });

  const resolved: GrammarIssue[] = [];
  let lastEnd = -1;

  for (const issue of sorted) {
    // If this issue starts after the last one ends, add it
    if (issue.startIndex >= lastEnd) {
      resolved.push(issue);
      lastEnd = issue.endIndex;
    } else if (issue.startIndex < lastEnd && issue.endIndex > lastEnd) {
      // Partial overlap - check if this issue has higher priority
      const lastIssue = resolved[resolved.length - 1];
      if (lastIssue && SEVERITY_PRIORITY[issue.severity] > SEVERITY_PRIORITY[lastIssue.severity]) {
        // Replace the last issue with this one
        resolved[resolved.length - 1] = issue;
        lastEnd = issue.endIndex;
      }
    }
    // If completely contained within previous issue, skip it
  }

  return resolved;
}

/**
 * Splits text into segments based on issue positions.
 */
function createTextSegments(text: string, issues: GrammarIssue[]): TextSegment[] {
  if (text.length === 0) return [];
  if (issues.length === 0) {
    return [{
      text,
      startIndex: 0,
      endIndex: text.length,
      issue: null,
    }];
  }

  // Resolve overlapping issues first
  const resolvedIssues = resolveOverlappingIssues(issues);
  
  // Sort by start index
  const sortedIssues = [...resolvedIssues].sort((a, b) => a.startIndex - b.startIndex);
  
  const segments: TextSegment[] = [];
  let currentIndex = 0;

  for (const issue of sortedIssues) {
    // Validate issue positions
    if (issue.startIndex < 0 || issue.endIndex > text.length || issue.startIndex >= issue.endIndex) {
      continue; // Skip invalid issues
    }

    // Add non-highlighted segment before this issue
    if (currentIndex < issue.startIndex) {
      segments.push({
        text: text.slice(currentIndex, issue.startIndex),
        startIndex: currentIndex,
        endIndex: issue.startIndex,
        issue: null,
      });
    }

    // Add highlighted segment for this issue
    segments.push({
      text: text.slice(issue.startIndex, issue.endIndex),
      startIndex: issue.startIndex,
      endIndex: issue.endIndex,
      issue,
    });

    currentIndex = issue.endIndex;
  }

  // Add remaining text after last issue
  if (currentIndex < text.length) {
    segments.push({
      text: text.slice(currentIndex),
      startIndex: currentIndex,
      endIndex: text.length,
      issue: null,
    });
  }

  return segments;
}

/**
 * InlineHighlighter component that renders text with inline issue highlighting.
 */
const InlineHighlighter: React.FC<InlineHighlighterProps> = ({
  text,
  issues,
  onIssueHover,
  onIssueClick,
  dismissedPatterns,
  onChange,
  placeholder = 'Type or paste your text here...',
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Filter out dismissed issues
  const activeIssues = useMemo(
    () => filterDismissedIssues(issues, dismissedPatterns),
    [issues, dismissedPatterns]
  );

  // Create text segments with highlighting info
  const segments = useMemo(
    () => createTextSegments(text, activeIssues),
    [text, activeIssues]
  );

  // Handle text change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange && !disabled) {
        onChange(e.target.value);
      }
    },
    [onChange, disabled]
  );

  // Handle issue hover
  const handleIssueMouseEnter = useCallback(
    (issue: GrammarIssue) => {
      onIssueHover(issue);
    },
    [onIssueHover]
  );

  const handleIssueMouseLeave = useCallback(() => {
    onIssueHover(null);
  }, [onIssueHover]);

  // Handle issue click
  const handleIssueClick = useCallback(
    (issue: GrammarIssue, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onIssueClick(issue);
    },
    [onIssueClick]
  );

  // Sync scroll between textarea and highlight overlay
  const handleScroll = useCallback(() => {
    if (containerRef.current && textareaRef.current) {
      const highlightLayer = containerRef.current.querySelector('.highlight-layer') as HTMLElement;
      if (highlightLayer) {
        highlightLayer.scrollTop = textareaRef.current.scrollTop;
        highlightLayer.scrollLeft = textareaRef.current.scrollLeft;
      }
    }
  }, []);

  // Get underline style for a category
  const getUnderlineStyle = (category: IssueCategory): React.CSSProperties => {
    const colors = CATEGORY_COLORS[category];
    return {
      textDecoration: 'underline',
      textDecorationColor: colors.underline,
      textDecorationStyle: 'wavy' as const,
      textDecorationThickness: '2px',
      backgroundColor: `${colors.bg}80`, // Add transparency
      borderRadius: '2px',
      cursor: 'pointer',
    };
  };

  return (
    <div 
      ref={containerRef}
      className={`inline-highlighter ${isFocused ? 'focused' : ''} ${disabled ? 'disabled' : ''}`}
    >
      {/* Highlight overlay layer */}
      <div className="highlight-layer" aria-hidden="true">
        {segments.map((segment, index) => {
          if (segment.issue) {
            return (
              <span
                key={`${segment.startIndex}-${index}`}
                className={`highlight highlight-${segment.issue.type}`}
                style={getUnderlineStyle(segment.issue.type)}
                onMouseEnter={() => handleIssueMouseEnter(segment.issue!)}
                onMouseLeave={handleIssueMouseLeave}
                onClick={(e) => handleIssueClick(segment.issue!, e)}
                role="button"
                tabIndex={0}
                aria-label={`Issue: ${segment.issue.message}`}
              >
                {segment.text}
              </span>
            );
          }
          return (
            <span key={`${segment.startIndex}-${index}`} className="normal-text">
              {segment.text}
            </span>
          );
        })}
        {text.length === 0 && (
          <span className="placeholder-text">{placeholder}</span>
        )}
      </div>

      {/* Editable textarea layer */}
      <textarea
        ref={textareaRef}
        className="input-layer"
        value={text}
        onChange={handleChange}
        onScroll={handleScroll}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder=""
        disabled={disabled}
        aria-label="Text input with grammar highlighting"
      />

      <style>{`
        .inline-highlighter {
          position: relative;
          width: 100%;
          min-height: 200px;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          background: white;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          overflow: hidden;
        }

        .inline-highlighter.focused {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .inline-highlighter.disabled {
          background: #f8fafc;
          cursor: not-allowed;
        }

        .highlight-layer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 20px;
          font-size: 15px;
          line-height: 1.7;
          font-family: inherit;
          color: #1e293b;
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow: auto;
          pointer-events: none;
        }

        .highlight-layer .highlight {
          pointer-events: auto;
          position: relative;
          transition: background-color 0.15s ease;
        }

        .highlight-layer .highlight:hover {
          filter: brightness(0.95);
        }

        .highlight-layer .highlight:focus {
          outline: 2px solid currentColor;
          outline-offset: 1px;
        }

        .highlight-layer .placeholder-text {
          color: #94a3b8;
        }

        .highlight-layer .normal-text {
          color: transparent;
        }

        .input-layer {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 200px;
          padding: 20px;
          font-size: 15px;
          line-height: 1.7;
          font-family: inherit;
          color: #1e293b;
          background: transparent;
          border: none;
          resize: vertical;
          outline: none;
          caret-color: #1e293b;
        }

        .input-layer::placeholder {
          color: transparent;
        }

        .inline-highlighter.disabled .input-layer {
          cursor: not-allowed;
        }

        /* Category-specific highlight colors */
        .highlight-correctness {
          text-decoration-color: ${CATEGORY_COLORS.correctness.underline} !important;
          background-color: ${CATEGORY_COLORS.correctness.bg}80 !important;
        }

        .highlight-clarity {
          text-decoration-color: ${CATEGORY_COLORS.clarity.underline} !important;
          background-color: ${CATEGORY_COLORS.clarity.bg}80 !important;
        }

        .highlight-engagement {
          text-decoration-color: ${CATEGORY_COLORS.engagement.underline} !important;
          background-color: ${CATEGORY_COLORS.engagement.bg}80 !important;
        }

        .highlight-delivery {
          text-decoration-color: ${CATEGORY_COLORS.delivery.underline} !important;
          background-color: ${CATEGORY_COLORS.delivery.bg}80 !important;
        }
      `}</style>
    </div>
  );
};

export default InlineHighlighter;

// Export utility functions for testing
export {
  createTextSegments,
  resolveOverlappingIssues,
  filterDismissedIssues,
  createDismissalKey,
  SEVERITY_PRIORITY,
};
export type { TextSegment };
