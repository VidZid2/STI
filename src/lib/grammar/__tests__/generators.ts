/**
 * Test utilities and generators for property-based testing of the Grammar Checker.
 * Uses fast-check for generating random test inputs.
 */

import * as fc from 'fast-check';
import type {
  GrammarIssue,
  Correction,
  WritingScore,
  ReadabilityMetrics,
  ToneAnalysis,
  TextStatistics,
  IssueCategory,
  IssueSeverity,
  ToneType,
  ToneBreakdown,
} from '../types';

/**
 * All valid issue categories.
 */
export const ISSUE_CATEGORIES: IssueCategory[] = ['correctness', 'clarity', 'engagement', 'delivery'];

/**
 * All valid severity levels.
 */
export const SEVERITY_LEVELS: IssueSeverity[] = ['error', 'warning', 'suggestion'];

/**
 * All valid tone types.
 */
export const TONE_TYPES: ToneType[] = ['formal', 'informal', 'confident', 'neutral', 'friendly'];

/**
 * Generator for issue categories.
 */
export const issueCategoryArb: fc.Arbitrary<IssueCategory> = fc.constantFrom(...ISSUE_CATEGORIES);

/**
 * Generator for severity levels.
 */
export const severityArb: fc.Arbitrary<IssueSeverity> = fc.constantFrom(...SEVERITY_LEVELS);

/**
 * Generator for tone types.
 */
export const toneTypeArb: fc.Arbitrary<ToneType> = fc.constantFrom(...TONE_TYPES);


/**
 * Generator for a Correction object.
 */
export const correctionArb: fc.Arbitrary<Correction> = fc.record({
  text: fc.string({ minLength: 1, maxLength: 50 }),
  confidence: fc.double({ min: 0, max: 1, noNaN: true }),
  description: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
});

/**
 * Generator for a GrammarIssue object.
 * Note: startIndex and endIndex are generated to be valid (start < end).
 */
export const grammarIssueArb: fc.Arbitrary<GrammarIssue> = fc.record({
  id: fc.uuid(),
  type: issueCategoryArb,
  severity: severityArb,
  message: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ maxLength: 200 }),
  startIndex: fc.nat({ max: 1000 }),
  endIndex: fc.nat({ max: 1000 }),
  originalText: fc.string({ minLength: 1, maxLength: 50 }),
  suggestions: fc.array(correctionArb, { minLength: 0, maxLength: 5 }),
  rule: fc.string({ minLength: 1, maxLength: 50 }),
}).map((issue) => ({
  ...issue,
  // Ensure endIndex > startIndex
  endIndex: issue.startIndex + Math.max(1, issue.endIndex - issue.startIndex + 1),
}));

/**
 * Generator for an array of GrammarIssues with valid categories.
 */
export const grammarIssuesArb: fc.Arbitrary<GrammarIssue[]> = fc.array(grammarIssueArb, {
  minLength: 0,
  maxLength: 20,
});

/**
 * Generator for WritingScore with valid bounds (0-100).
 */
export const writingScoreArb: fc.Arbitrary<WritingScore> = fc.record({
  overall: fc.integer({ min: 0, max: 100 }),
  correctness: fc.integer({ min: 0, max: 100 }),
  clarity: fc.integer({ min: 0, max: 100 }),
  engagement: fc.integer({ min: 0, max: 100 }),
  delivery: fc.integer({ min: 0, max: 100 }),
});

/**
 * Generator for ToneBreakdown entries that sum to 100%.
 */
export const toneBreakdownArb: fc.Arbitrary<ToneBreakdown[]> = fc
  .array(fc.integer({ min: 0, max: 100 }), { minLength: 5, maxLength: 5 })
  .map((values) => {
    const total = values.reduce((a, b) => a + b, 0);
    if (total === 0) {
      // If all zeros, give 100% to first tone
      return TONE_TYPES.map((tone, i) => ({
        tone,
        percentage: i === 0 ? 100 : 0,
      }));
    }
    // Normalize to sum to 100
    const normalized = values.map((v) => Math.round((v / total) * 100));
    // Adjust for rounding errors
    const sum = normalized.reduce((a, b) => a + b, 0);
    if (sum !== 100) {
      normalized[0] += 100 - sum;
    }
    return TONE_TYPES.map((tone, i) => ({
      tone,
      percentage: normalized[i],
    }));
  });

/**
 * Generator for ToneAnalysis.
 */
export const toneAnalysisArb: fc.Arbitrary<ToneAnalysis> = fc.record({
  dominant: toneTypeArb,
  breakdown: toneBreakdownArb,
  isConsistent: fc.boolean(),
  inconsistencies: fc.array(
    fc.record({
      startIndex: fc.nat({ max: 1000 }),
      endIndex: fc.nat({ max: 1000 }),
      detectedTone: toneTypeArb,
      expectedTone: toneTypeArb,
    }),
    { maxLength: 5 }
  ),
});

/**
 * Generator for TextStatistics.
 */
export const textStatisticsArb: fc.Arbitrary<TextStatistics> = fc.record({
  wordCount: fc.nat({ max: 10000 }),
  characterCount: fc.nat({ max: 50000 }),
  characterCountNoSpaces: fc.nat({ max: 50000 }),
  sentenceCount: fc.nat({ max: 1000 }),
  paragraphCount: fc.nat({ max: 500 }),
  averageSentenceLength: fc.double({ min: 0, max: 100, noNaN: true }),
  readingTimeMinutes: fc.nat({ max: 60 }),
});

/**
 * Generator for ReadabilityMetrics.
 */
export const readabilityMetricsArb: fc.Arbitrary<ReadabilityMetrics> = fc.record({
  fleschKincaidGrade: fc.double({ min: 0, max: 20, noNaN: true }),
  educationLevel: fc.string({ minLength: 1, maxLength: 30 }),
  averageSentenceLength: fc.double({ min: 0, max: 100, noNaN: true }),
  averageWordLength: fc.double({ min: 0, max: 20, noNaN: true }),
  difficultSentences: fc.array(fc.nat({ max: 100 }), { maxLength: 20 }),
});

/**
 * Generator for non-empty text strings (simulating user input).
 */
export const textInputArb: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 5000 });

/**
 * Generator for text with sentences (contains periods).
 */
export const textWithSentencesArb: fc.Arbitrary<string> = fc
  .array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 10 })
  .map((sentences) => sentences.join('. ') + '.');
