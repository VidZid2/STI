/**
 * Property-based tests for the Dismissal Manager module.
 * Tests dismissal state management functionality.
 * 
 * **Feature: enhanced-grammar-checker, Property 14: Dismissal state management**
 * **Validates: Requirements 8.2, 8.3, 8.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  createDismissalManager,
  createPatternKey,
  shouldFlagIssue,
  filterIssuesByDismissals,
} from '../dismissals';
import { calculateWritingScore } from '../score';
import type { GrammarIssue } from '../types';
import { grammarIssueArb, grammarIssuesArb } from './generators';

describe('Dismissal State Management', () => {
  describe('Property 14: Dismissal state management', () => {
    /**
     * **Feature: enhanced-grammar-checker, Property 14a: Dismissed issues excluded from score**
     * **Validates: Requirements 8.2**
     * 
     * For any dismissed issue pattern P, the issue SHALL be excluded from WritingScore calculation.
     */
    it('Property 14a: dismissed issues are excluded from WritingScore calculation', () => {
      fc.assert(
        fc.property(
          grammarIssuesArb.filter((issues) => issues.length > 0),
          fc.integer({ min: 0, max: 19 }),
          (issues, dismissIndex) => {
            // Ensure we have at least one issue to dismiss
            if (issues.length === 0) return true;
            
            const actualDismissIndex = dismissIndex % issues.length;
            const issueToDismiss = issues[actualDismissIndex];
            
            const manager = createDismissalManager();
            
            // Dismiss one issue
            manager.dismiss(issueToDismiss);
            
            // Calculate score excluding dismissed issues
            const scoreExcludingDismissed = manager.calculateScoreExcludingDismissed(issues);
            
            // The score excluding dismissed should match score calculated without that issue
            const issuesWithoutDismissed = issues.filter((_, i) => i !== actualDismissIndex);
            const expectedScore = calculateWritingScore(issuesWithoutDismissed);
            
            // Scores should match (dismissed issue excluded)
            expect(scoreExcludingDismissed.overall).toBe(expectedScore.overall);
            expect(scoreExcludingDismissed.correctness).toBe(expectedScore.correctness);
            expect(scoreExcludingDismissed.clarity).toBe(expectedScore.clarity);
            expect(scoreExcludingDismissed.engagement).toBe(expectedScore.engagement);
            expect(scoreExcludingDismissed.delivery).toBe(expectedScore.delivery);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: enhanced-grammar-checker, Property 14b: Session memory for dismissed patterns**
     * **Validates: Requirements 8.3**
     * 
     * If pattern P appears again in the same session, it SHALL NOT be re-flagged.
     */
    it('Property 14b: dismissed patterns are remembered in session and not re-flagged', () => {
      fc.assert(
        fc.property(grammarIssueArb, (issue) => {
          const manager = createDismissalManager();
          
          // Initially, issue should be flagged
          expect(manager.isDismissed(issue)).toBe(false);
          
          // Dismiss the issue
          manager.dismiss(issue);
          
          // Now the same pattern should be recognized as dismissed
          expect(manager.isDismissed(issue)).toBe(true);
          
          // Create a "new" issue with the same rule and originalText
          // (simulating the pattern appearing again)
          const samePatternIssue: GrammarIssue = {
            ...issue,
            id: 'different-id-' + Math.random(),
            startIndex: issue.startIndex + 100,
            endIndex: issue.endIndex + 100,
          };
          
          // The same pattern should still be dismissed
          expect(manager.isDismissed(samePatternIssue)).toBe(true);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: enhanced-grammar-checker, Property 14c: Reset clears dismissed patterns**
     * **Validates: Requirements 8.4**
     * 
     * After clearing all text (reset), pattern P SHALL be flagged if it reappears.
     */
    it('Property 14c: after reset, previously dismissed patterns are flagged again', () => {
      fc.assert(
        fc.property(grammarIssueArb, (issue) => {
          const manager = createDismissalManager();
          
          // Dismiss the issue
          manager.dismiss(issue);
          expect(manager.isDismissed(issue)).toBe(true);
          
          // Reset (simulating text clear)
          manager.reset();
          
          // After reset, the pattern should be flagged again
          expect(manager.isDismissed(issue)).toBe(false);
          expect(manager.getPatternCount()).toBe(0);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Pattern Key Generation', () => {
    it('creates consistent keys for same rule and text', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (rule, text) => {
            const key1 = createPatternKey(rule, text);
            const key2 = createPatternKey(rule, text);
            expect(key1).toBe(key2);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('normalizes text case for pattern matching', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (rule, text) => {
            const keyLower = createPatternKey(rule, text.toLowerCase());
            const keyUpper = createPatternKey(rule, text.toUpperCase());
            const keyMixed = createPatternKey(rule, text);
            
            // All should produce the same key (case-insensitive)
            expect(keyLower).toBe(keyUpper);
            expect(keyLower).toBe(keyMixed);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Filter Functions', () => {
    it('shouldFlagIssue returns false for dismissed patterns', () => {
      fc.assert(
        fc.property(grammarIssueArb, (issue) => {
          const dismissedKeys = new Set<string>();
          
          // Initially should flag
          expect(shouldFlagIssue(issue, dismissedKeys)).toBe(true);
          
          // Add to dismissed
          const key = createPatternKey(issue.rule, issue.originalText);
          dismissedKeys.add(key);
          
          // Now should not flag
          expect(shouldFlagIssue(issue, dismissedKeys)).toBe(false);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('filterIssuesByDismissals removes all dismissed issues', () => {
      fc.assert(
        fc.property(
          grammarIssuesArb.filter((issues) => issues.length > 0),
          fc.integer({ min: 0, max: 19 }),
          (issues, dismissCount) => {
            if (issues.length === 0) return true;
            
            const actualDismissCount = Math.min(dismissCount % issues.length + 1, issues.length);
            const dismissedKeys = new Set<string>();
            
            // Dismiss some issues
            for (let i = 0; i < actualDismissCount; i++) {
              const key = createPatternKey(issues[i].rule, issues[i].originalText);
              dismissedKeys.add(key);
            }
            
            // Filter
            const filtered = filterIssuesByDismissals(issues, dismissedKeys);
            
            // Filtered list should not contain any dismissed issues
            for (const issue of filtered) {
              const key = createPatternKey(issue.rule, issue.originalText);
              expect(dismissedKeys.has(key)).toBe(false);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('DismissalManager Class', () => {
    it('tracks pattern count correctly', () => {
      fc.assert(
        fc.property(
          grammarIssuesArb.filter((issues) => issues.length > 0 && issues.length <= 10),
          (issues) => {
            const manager = createDismissalManager();
            
            // Make issues unique by rule+text combination
            const uniqueIssues = new Map<string, GrammarIssue>();
            for (const issue of issues) {
              const key = createPatternKey(issue.rule, issue.originalText);
              if (!uniqueIssues.has(key)) {
                uniqueIssues.set(key, issue);
              }
            }
            
            const uniqueIssueList = Array.from(uniqueIssues.values());
            
            // Dismiss each unique issue
            for (const issue of uniqueIssueList) {
              manager.dismiss(issue);
            }
            
            // Count should match unique issues
            expect(manager.getPatternCount()).toBe(uniqueIssueList.length);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('undismiss removes pattern and allows re-flagging', () => {
      fc.assert(
        fc.property(grammarIssueArb, (issue) => {
          const manager = createDismissalManager();
          
          // Dismiss
          manager.dismiss(issue);
          expect(manager.isDismissed(issue)).toBe(true);
          
          // Undismiss
          const removed = manager.undismiss(issue);
          expect(removed).toBe(true);
          expect(manager.isDismissed(issue)).toBe(false);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('getDismissedPatternKeys returns all dismissed keys', () => {
      fc.assert(
        fc.property(
          grammarIssuesArb.filter((issues) => issues.length > 0 && issues.length <= 5),
          (issues) => {
            const manager = createDismissalManager();
            const expectedKeys = new Set<string>();
            
            for (const issue of issues) {
              const key = manager.dismiss(issue);
              expectedKeys.add(key);
            }
            
            const actualKeys = manager.getDismissedPatternKeys();
            
            // All expected keys should be present
            for (const key of expectedKeys) {
              expect(actualKeys.has(key)).toBe(true);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('export and import state preserves patterns', () => {
      fc.assert(
        fc.property(
          grammarIssuesArb.filter((issues) => issues.length > 0 && issues.length <= 5),
          (issues) => {
            const manager1 = createDismissalManager();
            
            // Dismiss issues in first manager
            for (const issue of issues) {
              manager1.dismiss(issue);
            }
            
            // Export state
            const state = manager1.exportState();
            
            // Import into new manager
            const manager2 = createDismissalManager();
            manager2.importState(state);
            
            // Both managers should have same dismissed patterns
            for (const issue of issues) {
              expect(manager2.isDismissed(issue)).toBe(manager1.isDismissed(issue));
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
