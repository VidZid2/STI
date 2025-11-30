/**
 * Property-based tests for writing score calculation.
 * **Feature: enhanced-grammar-checker, Property 5: Writing score bounds**
 * **Feature: enhanced-grammar-checker, Property 6: Score improvement on fix**
 * **Validates: Requirements 3.1, 3.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateWritingScore,
  calculateScoreAfterFix,
  clampScore,
  createEmptyScore,
} from '../score';
import type { GrammarIssue, IssueCategory, IssueSeverity } from '../types';

/**
 * All valid issue categories.
 */
const ISSUE_CATEGORIES: IssueCategory[] = ['correctness', 'clarity', 'engagement', 'delivery'];

/**
 * All valid severity levels.
 */
const SEVERITY_LEVELS: IssueSeverity[] = ['error', 'warning', 'suggestion'];

/**
 * Generator for a valid GrammarIssue.
 */
const grammarIssueArb: fc.Arbitrary<GrammarIssue> = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom(...ISSUE_CATEGORIES),
  severity: fc.constantFrom(...SEVERITY_LEVELS),
  message: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ maxLength: 200 }),
  startIndex: fc.nat({ max: 1000 }),
  endIndex: fc.nat({ max: 1000 }),
  originalText: fc.string({ minLength: 1, maxLength: 50 }),
  suggestions: fc.array(
    fc.record({
      text: fc.string({ minLength: 1, maxLength: 50 }),
      confidence: fc.double({ min: 0, max: 1, noNaN: true }),
      description: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
    }),
    { minLength: 0, maxLength: 3 }
  ),
  rule: fc.string({ minLength: 1, maxLength: 50 }),
}).map((issue) => ({
  ...issue,
  endIndex: issue.startIndex + Math.max(1, Math.abs(issue.endIndex - issue.startIndex) + 1),
}));

/**
 * Generator for an array of GrammarIssues.
 */
const grammarIssuesArb: fc.Arbitrary<GrammarIssue[]> = fc.array(grammarIssueArb, {
  minLength: 0,
  maxLength: 30,
});

/**
 * Generator for an array of GrammarIssues with at least one issue.
 */
const nonEmptyGrammarIssuesArb: fc.Arbitrary<GrammarIssue[]> = fc.array(grammarIssueArb, {
  minLength: 1,
  maxLength: 30,
});

/**
 * Helper to check if a value is a valid score (integer in [0, 100]).
 */
function isValidScore(score: number): boolean {
  return (
    Number.isInteger(score) &&
    score >= 0 &&
    score <= 100
  );
}

describe('Property 5: Writing score bounds', () => {
  /**
   * **Feature: enhanced-grammar-checker, Property 5: Writing score bounds**
   * **Validates: Requirements 3.1**
   * 
   * For any set of issues, the overall score must be in [0, 100].
   */
  it('overall score is always in range [0, 100]', () => {
    fc.assert(
      fc.property(grammarIssuesArb, (issues) => {
        const score = calculateWritingScore(issues);
        
        expect(score.overall).toBeGreaterThanOrEqual(0);
        expect(score.overall).toBeLessThanOrEqual(100);
        expect(Number.isInteger(score.overall)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-grammar-checker, Property 5: Writing score bounds**
   * **Validates: Requirements 3.1**
   * 
   * For any set of issues, the correctness score must be in [0, 100].
   */
  it('correctness score is always in range [0, 100]', () => {
    fc.assert(
      fc.property(grammarIssuesArb, (issues) => {
        const score = calculateWritingScore(issues);
        
        expect(score.correctness).toBeGreaterThanOrEqual(0);
        expect(score.correctness).toBeLessThanOrEqual(100);
        expect(Number.isInteger(score.correctness)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-grammar-checker, Property 5: Writing score bounds**
   * **Validates: Requirements 3.1**
   * 
   * For any set of issues, the clarity score must be in [0, 100].
   */
  it('clarity score is always in range [0, 100]', () => {
    fc.assert(
      fc.property(grammarIssuesArb, (issues) => {
        const score = calculateWritingScore(issues);
        
        expect(score.clarity).toBeGreaterThanOrEqual(0);
        expect(score.clarity).toBeLessThanOrEqual(100);
        expect(Number.isInteger(score.clarity)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-grammar-checker, Property 5: Writing score bounds**
   * **Validates: Requirements 3.1**
   * 
   * For any set of issues, the engagement score must be in [0, 100].
   */
  it('engagement score is always in range [0, 100]', () => {
    fc.assert(
      fc.property(grammarIssuesArb, (issues) => {
        const score = calculateWritingScore(issues);
        
        expect(score.engagement).toBeGreaterThanOrEqual(0);
        expect(score.engagement).toBeLessThanOrEqual(100);
        expect(Number.isInteger(score.engagement)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-grammar-checker, Property 5: Writing score bounds**
   * **Validates: Requirements 3.1**
   * 
   * For any set of issues, the delivery score must be in [0, 100].
   */
  it('delivery score is always in range [0, 100]', () => {
    fc.assert(
      fc.property(grammarIssuesArb, (issues) => {
        const score = calculateWritingScore(issues);
        
        expect(score.delivery).toBeGreaterThanOrEqual(0);
        expect(score.delivery).toBeLessThanOrEqual(100);
        expect(Number.isInteger(score.delivery)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-grammar-checker, Property 5: Writing score bounds**
   * **Validates: Requirements 3.1**
   * 
   * Empty issues should result in perfect score (100).
   */
  it('empty issues result in perfect score', () => {
    const score = calculateWritingScore([]);
    
    expect(score.overall).toBe(100);
    expect(score.correctness).toBe(100);
    expect(score.clarity).toBe(100);
    expect(score.engagement).toBe(100);
    expect(score.delivery).toBe(100);
  });

  /**
   * **Feature: enhanced-grammar-checker, Property 5: Writing score bounds**
   * **Validates: Requirements 3.1**
   * 
   * clampScore should always return a value in [0, 100].
   */
  it('clampScore always returns value in [0, 100]', () => {
    fc.assert(
      fc.property(fc.double({ noNaN: false }), (value) => {
        const clamped = clampScore(value);
        
        expect(clamped).toBeGreaterThanOrEqual(0);
        expect(clamped).toBeLessThanOrEqual(100);
        expect(Number.isInteger(clamped)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-grammar-checker, Property 5: Writing score bounds**
   * **Validates: Requirements 3.1**
   * 
   * createEmptyScore should return perfect scores.
   */
  it('createEmptyScore returns perfect scores', () => {
    const score = createEmptyScore();
    
    expect(isValidScore(score.overall)).toBe(true);
    expect(isValidScore(score.correctness)).toBe(true);
    expect(isValidScore(score.clarity)).toBe(true);
    expect(isValidScore(score.engagement)).toBe(true);
    expect(isValidScore(score.delivery)).toBe(true);
    expect(score.overall).toBe(100);
  });
});

describe('Property 6: Score improvement on fix', () => {
  /**
   * **Feature: enhanced-grammar-checker, Property 6: Score improvement on fix**
   * **Validates: Requirements 3.3**
   * 
   * For any set of issues with at least one issue, fixing that issue
   * should result in a score that is greater than or equal to the previous score.
   */
  it('fixing an issue improves or maintains the overall score', () => {
    fc.assert(
      fc.property(nonEmptyGrammarIssuesArb, (issues) => {
        // Calculate score before fix
        const scoreBefore = calculateWritingScore(issues);
        
        // Pick a random issue to fix (first one for simplicity)
        const issueToFix = issues[0];
        
        // Calculate score after fix
        const scoreAfter = calculateScoreAfterFix(issues, issueToFix.id);
        
        // Score should improve or stay the same
        expect(scoreAfter.overall).toBeGreaterThanOrEqual(scoreBefore.overall);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-grammar-checker, Property 6: Score improvement on fix**
   * **Validates: Requirements 3.3**
   * 
   * Fixing all issues should result in a perfect score.
   */
  it('fixing all issues results in perfect score', () => {
    fc.assert(
      fc.property(nonEmptyGrammarIssuesArb, (issues) => {
        // Fix all issues one by one
        let remainingIssues = [...issues];
        
        for (const issue of issues) {
          remainingIssues = remainingIssues.filter(i => i.id !== issue.id);
        }
        
        // Calculate final score (should be perfect)
        const finalScore = calculateWritingScore(remainingIssues);
        
        expect(finalScore.overall).toBe(100);
        expect(finalScore.correctness).toBe(100);
        expect(finalScore.clarity).toBe(100);
        expect(finalScore.engagement).toBe(100);
        expect(finalScore.delivery).toBe(100);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-grammar-checker, Property 6: Score improvement on fix**
   * **Validates: Requirements 3.3**
   * 
   * The category score for the fixed issue's category should improve or stay the same.
   */
  it('fixing an issue improves or maintains the category score', () => {
    fc.assert(
      fc.property(nonEmptyGrammarIssuesArb, (issues) => {
        const issueToFix = issues[0];
        const category = issueToFix.type;
        
        // Calculate score before fix
        const scoreBefore = calculateWritingScore(issues);
        
        // Calculate score after fix
        const scoreAfter = calculateScoreAfterFix(issues, issueToFix.id);
        
        // Category score should improve or stay the same
        expect(scoreAfter[category]).toBeGreaterThanOrEqual(scoreBefore[category]);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-grammar-checker, Property 6: Score improvement on fix**
   * **Validates: Requirements 3.3**
   * 
   * Score after fix should still be within valid bounds.
   */
  it('score after fix is still within valid bounds', () => {
    fc.assert(
      fc.property(nonEmptyGrammarIssuesArb, (issues) => {
        const issueToFix = issues[0];
        const scoreAfter = calculateScoreAfterFix(issues, issueToFix.id);
        
        expect(scoreAfter.overall).toBeGreaterThanOrEqual(0);
        expect(scoreAfter.overall).toBeLessThanOrEqual(100);
        expect(scoreAfter.correctness).toBeGreaterThanOrEqual(0);
        expect(scoreAfter.correctness).toBeLessThanOrEqual(100);
        expect(scoreAfter.clarity).toBeGreaterThanOrEqual(0);
        expect(scoreAfter.clarity).toBeLessThanOrEqual(100);
        expect(scoreAfter.engagement).toBeGreaterThanOrEqual(0);
        expect(scoreAfter.engagement).toBeLessThanOrEqual(100);
        expect(scoreAfter.delivery).toBeGreaterThanOrEqual(0);
        expect(scoreAfter.delivery).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 }
    );
  });
});
