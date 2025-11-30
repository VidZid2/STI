/**
 * Property-based tests for issue categorization completeness.
 * **Feature: enhanced-grammar-checker, Property 7: Issue categorization completeness**
 * **Validates: Requirements 4.1, 4.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { grammarIssuesArb, ISSUE_CATEGORIES } from './generators';
import type { GrammarIssue, IssueCategory } from '../types';
import { ALL_ISSUE_CATEGORIES } from '../types';

/**
 * Counts issues by category.
 */
function countIssuesByCategory(issues: GrammarIssue[]): Record<IssueCategory, number> {
  const counts: Record<IssueCategory, number> = {
    correctness: 0,
    clarity: 0,
    engagement: 0,
    delivery: 0,
  };
  
  for (const issue of issues) {
    if (issue.type in counts) {
      counts[issue.type]++;
    }
  }
  
  return counts;
}

/**
 * Validates that an issue has a valid category.
 */
function hasValidCategory(issue: GrammarIssue): boolean {
  return ALL_ISSUE_CATEGORIES.includes(issue.type);
}

describe('Property 7: Issue categorization completeness', () => {
  /**
   * **Feature: enhanced-grammar-checker, Property 7: Issue categorization completeness**
   * **Validates: Requirements 4.1, 4.2**
   * 
   * For any set of detected issues, every issue SHALL have a type in 
   * {'correctness', 'clarity', 'engagement', 'delivery'}, and the sum of 
   * issues per category SHALL equal the total issue count.
   */
  it('every issue has a valid category type', () => {
    fc.assert(
      fc.property(grammarIssuesArb, (issues) => {
        // Every issue must have a valid category
        for (const issue of issues) {
          expect(hasValidCategory(issue)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('sum of issues per category equals total issue count', () => {
    fc.assert(
      fc.property(grammarIssuesArb, (issues) => {
        const counts = countIssuesByCategory(issues);
        const sumOfCategories = Object.values(counts).reduce((a, b) => a + b, 0);
        
        // Sum of all category counts must equal total issues
        expect(sumOfCategories).toBe(issues.length);
      }),
      { numRuns: 100 }
    );
  });

  it('category counts are non-negative integers', () => {
    fc.assert(
      fc.property(grammarIssuesArb, (issues) => {
        const counts = countIssuesByCategory(issues);
        
        for (const category of ISSUE_CATEGORIES) {
          expect(counts[category]).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(counts[category])).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('all four categories are represented in the count structure', () => {
    fc.assert(
      fc.property(grammarIssuesArb, (issues) => {
        const counts = countIssuesByCategory(issues);
        
        // All four categories must exist in the counts object
        expect(Object.keys(counts).sort()).toEqual([...ALL_ISSUE_CATEGORIES].sort());
      }),
      { numRuns: 100 }
    );
  });
});
