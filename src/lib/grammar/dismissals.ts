/**
 * Dismissal state management module for the Enhanced Grammar Checker.
 * Handles pattern storage, lookup, score recalculation, and session memory.
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import type { GrammarIssue, DismissedPattern, WritingScore } from './types';
import { calculateWritingScore } from './score';

/**
 * Maximum number of dismissed patterns to store.
 * Prevents memory issues with excessive dismissals.
 */
const MAX_DISMISSED_PATTERNS = 1000;

/**
 * Creates a unique key for a dismissed pattern.
 * The key combines the rule and normalized original text.
 * 
 * @param rule - The rule identifier
 * @param originalText - The original text that was flagged
 * @returns A unique pattern key
 */
export function createPatternKey(rule: string, originalText: string): string {
  return `${rule}:${originalText.toLowerCase().trim()}`;
}

/**
 * Creates a DismissedPattern object from a GrammarIssue.
 * 
 * @param issue - The issue being dismissed
 * @returns A DismissedPattern object
 */
export function createDismissedPattern(issue: GrammarIssue): DismissedPattern {
  return {
    rule: issue.rule,
    originalText: issue.originalText,
    timestamp: Date.now(),
  };
}

/**
 * Dismissal Manager class for managing dismissed issue patterns.
 * Provides session memory for dismissed patterns and handles score recalculation.
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export class DismissalManager {
  private patterns: Map<string, DismissedPattern> = new Map();

  /**
   * Dismisses an issue and stores the pattern.
   * Requirements: 8.1 (dismiss button), 8.3 (session memory)
   * 
   * @param issue - The issue to dismiss
   * @returns The pattern key that was added
   */
  dismiss(issue: GrammarIssue): string {
    const key = createPatternKey(issue.rule, issue.originalText);
    const pattern = createDismissedPattern(issue);
    
    // Enforce maximum pattern limit
    if (this.patterns.size >= MAX_DISMISSED_PATTERNS) {
      this.removeOldestPattern();
    }
    
    this.patterns.set(key, pattern);
    return key;
  }

  /**
   * Checks if an issue matches a dismissed pattern.
   * Requirements: 8.3 (remember dismissal for identical patterns)
   * 
   * @param issue - The issue to check
   * @returns True if the issue matches a dismissed pattern
   */
  isDismissed(issue: GrammarIssue): boolean {
    const key = createPatternKey(issue.rule, issue.originalText);
    return this.patterns.has(key);
  }

  /**
   * Checks if a pattern key is dismissed.
   * 
   * @param key - The pattern key to check
   * @returns True if the pattern is dismissed
   */
  isPatternKeyDismissed(key: string): boolean {
    return this.patterns.has(key);
  }

  /**
   * Gets all dismissed pattern keys as a Set.
   * Useful for filtering issues during analysis.
   * 
   * @returns Set of dismissed pattern keys
   */
  getDismissedPatternKeys(): Set<string> {
    return new Set(this.patterns.keys());
  }

  /**
   * Gets all dismissed patterns.
   * 
   * @returns Array of DismissedPattern objects
   */
  getAllPatterns(): DismissedPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Gets the count of dismissed patterns.
   * 
   * @returns Number of dismissed patterns
   */
  getPatternCount(): number {
    return this.patterns.size;
  }

  /**
   * Filters out dismissed issues from a list of issues.
   * Requirements: 8.2 (exclude from score calculation)
   * 
   * @param issues - Array of issues to filter
   * @returns Array of issues that are not dismissed
   */
  filterDismissedIssues(issues: GrammarIssue[]): GrammarIssue[] {
    return issues.filter((issue) => !this.isDismissed(issue));
  }

  /**
   * Calculates the writing score excluding dismissed issues.
   * Requirements: 8.2 (exclude dismissed issues from score)
   * 
   * @param allIssues - All detected issues (including dismissed)
   * @returns WritingScore calculated without dismissed issues
   */
  calculateScoreExcludingDismissed(allIssues: GrammarIssue[]): WritingScore {
    const activeIssues = this.filterDismissedIssues(allIssues);
    return calculateWritingScore(activeIssues);
  }

  /**
   * Resets all dismissed patterns.
   * Requirements: 8.4 (reset on text clear)
   */
  reset(): void {
    this.patterns.clear();
  }

  /**
   * Removes a specific dismissed pattern.
   * 
   * @param issue - The issue whose pattern should be removed
   * @returns True if the pattern was removed
   */
  undismiss(issue: GrammarIssue): boolean {
    const key = createPatternKey(issue.rule, issue.originalText);
    return this.patterns.delete(key);
  }

  /**
   * Removes a pattern by its key.
   * 
   * @param key - The pattern key to remove
   * @returns True if the pattern was removed
   */
  undismissByKey(key: string): boolean {
    return this.patterns.delete(key);
  }

  /**
   * Removes the oldest dismissed pattern.
   * Used to enforce the maximum pattern limit.
   */
  private removeOldestPattern(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, pattern] of this.patterns) {
      if (pattern.timestamp < oldestTimestamp) {
        oldestTimestamp = pattern.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey !== null) {
      this.patterns.delete(oldestKey);
    }
  }

  /**
   * Exports the current state for persistence (if needed).
   * 
   * @returns Serializable state object
   */
  exportState(): { patterns: Array<[string, DismissedPattern]> } {
    return {
      patterns: Array.from(this.patterns.entries()),
    };
  }

  /**
   * Imports state from a previously exported state.
   * 
   * @param state - Previously exported state
   */
  importState(state: { patterns: Array<[string, DismissedPattern]> }): void {
    this.patterns.clear();
    for (const [key, pattern] of state.patterns) {
      this.patterns.set(key, pattern);
    }
  }
}

/**
 * Creates a new DismissalManager instance.
 * 
 * @returns A new DismissalManager
 */
export function createDismissalManager(): DismissalManager {
  return new DismissalManager();
}

/**
 * Utility function to check if an issue should be flagged.
 * Returns false if the issue matches a dismissed pattern.
 * 
 * @param issue - The issue to check
 * @param dismissedKeys - Set of dismissed pattern keys
 * @returns True if the issue should be flagged (not dismissed)
 */
export function shouldFlagIssue(
  issue: GrammarIssue,
  dismissedKeys: Set<string>
): boolean {
  const key = createPatternKey(issue.rule, issue.originalText);
  return !dismissedKeys.has(key);
}

/**
 * Filters issues based on dismissed patterns.
 * 
 * @param issues - Array of issues to filter
 * @param dismissedKeys - Set of dismissed pattern keys
 * @returns Array of issues that should be flagged
 */
export function filterIssuesByDismissals(
  issues: GrammarIssue[],
  dismissedKeys: Set<string>
): GrammarIssue[] {
  return issues.filter((issue) => shouldFlagIssue(issue, dismissedKeys));
}
