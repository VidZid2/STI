/**
 * Writing score calculation module.
 * Calculates overall and category-based writing quality scores.
 * Requirements: 3.1, 3.2, 3.3
 */

import type { GrammarIssue, WritingScore, IssueCategory, IssueSeverity } from './types';

/**
 * Weight multipliers for different severity levels.
 * Higher severity issues have more impact on the score.
 */
const SEVERITY_WEIGHTS: Record<IssueSeverity, number> = {
  error: 3,
  warning: 2,
  suggestion: 1,
};

/**
 * Base score when there are no issues.
 */
const BASE_SCORE = 100;

/**
 * Minimum score (floor).
 */
const MIN_SCORE = 0;

/**
 * Maximum score (ceiling).
 */
const MAX_SCORE = 100;

/**
 * Points deducted per weighted issue.
 * This is calibrated so that a few errors significantly impact the score.
 */
const POINTS_PER_WEIGHTED_ISSUE = 5;

/**
 * Calculates the weighted issue count for a set of issues.
 * Issues are weighted by their severity.
 */
export function calculateWeightedIssueCount(issues: GrammarIssue[]): number {
  return issues.reduce((total, issue) => {
    return total + SEVERITY_WEIGHTS[issue.severity];
  }, 0);
}

/**
 * Calculates a score based on weighted issue count.
 * Score decreases as issues increase, bounded to [0, 100].
 */
export function calculateScoreFromIssues(issues: GrammarIssue[]): number {
  const weightedCount = calculateWeightedIssueCount(issues);
  const deduction = weightedCount * POINTS_PER_WEIGHTED_ISSUE;
  const score = BASE_SCORE - deduction;
  
  return clampScore(score);
}

/**
 * Clamps a score to the valid range [0, 100].
 * Requirements: 3.1 (score must be between 0 and 100)
 */
export function clampScore(score: number): number {
  if (!Number.isFinite(score) || Number.isNaN(score)) {
    return MIN_SCORE;
  }
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(score)));
}

/**
 * Filters issues by category.
 */
export function filterIssuesByCategory(
  issues: GrammarIssue[],
  category: IssueCategory
): GrammarIssue[] {
  return issues.filter((issue) => issue.type === category);
}

/**
 * Calculates the score for a specific category.
 * Requirements: 3.2 (category breakdown)
 */
export function calculateCategoryScore(
  issues: GrammarIssue[],
  category: IssueCategory
): number {
  const categoryIssues = filterIssuesByCategory(issues, category);
  return calculateScoreFromIssues(categoryIssues);
}

/**
 * Calculates the overall writing score.
 * The overall score is a weighted average of category scores.
 * Requirements: 3.1
 */
export function calculateOverallScore(
  correctnessScore: number,
  clarityScore: number,
  engagementScore: number,
  deliveryScore: number
): number {
  // Correctness is weighted more heavily as it represents actual errors
  const weights = {
    correctness: 0.4,
    clarity: 0.25,
    engagement: 0.2,
    delivery: 0.15,
  };
  
  const weightedSum =
    correctnessScore * weights.correctness +
    clarityScore * weights.clarity +
    engagementScore * weights.engagement +
    deliveryScore * weights.delivery;
  
  return clampScore(weightedSum);
}

/**
 * Calculates the complete writing score breakdown.
 * Requirements: 3.1, 3.2
 */
export function calculateWritingScore(issues: GrammarIssue[]): WritingScore {
  const correctness = calculateCategoryScore(issues, 'correctness');
  const clarity = calculateCategoryScore(issues, 'clarity');
  const engagement = calculateCategoryScore(issues, 'engagement');
  const delivery = calculateCategoryScore(issues, 'delivery');
  
  const overall = calculateOverallScore(correctness, clarity, engagement, delivery);
  
  return {
    overall,
    correctness,
    clarity,
    engagement,
    delivery,
  };
}

/**
 * Calculates the updated score after fixing an issue.
 * Requirements: 3.3 (score improvement on fix)
 * 
 * @param currentIssues - Current list of issues
 * @param fixedIssueId - ID of the issue that was fixed
 * @returns New WritingScore after the fix
 */
export function calculateScoreAfterFix(
  currentIssues: GrammarIssue[],
  fixedIssueId: string
): WritingScore {
  const remainingIssues = currentIssues.filter((issue) => issue.id !== fixedIssueId);
  return calculateWritingScore(remainingIssues);
}

/**
 * Calculates the updated score after dismissing an issue.
 * Dismissed issues are excluded from score calculation.
 * Requirements: 8.2 (dismissed issues excluded from score)
 * 
 * @param currentIssues - Current list of issues
 * @param dismissedIssueId - ID of the issue that was dismissed
 * @returns New WritingScore after dismissal
 */
export function calculateScoreAfterDismissal(
  currentIssues: GrammarIssue[],
  dismissedIssueId: string
): WritingScore {
  // Same logic as fix - the issue is removed from consideration
  return calculateScoreAfterFix(currentIssues, dismissedIssueId);
}

/**
 * Creates an empty/perfect writing score (no issues).
 */
export function createEmptyScore(): WritingScore {
  return {
    overall: MAX_SCORE,
    correctness: MAX_SCORE,
    clarity: MAX_SCORE,
    engagement: MAX_SCORE,
    delivery: MAX_SCORE,
  };
}

/**
 * Checks if a score represents a perfect score (100 in all categories).
 */
export function isPerfectScore(score: WritingScore): boolean {
  return (
    score.overall === MAX_SCORE &&
    score.correctness === MAX_SCORE &&
    score.clarity === MAX_SCORE &&
    score.engagement === MAX_SCORE &&
    score.delivery === MAX_SCORE
  );
}

/**
 * Gets the score color based on the score value.
 * Used for visual indicators.
 * Requirements: 3.2 (color-coded gauge)
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return '#38a169'; // Green - excellent
  if (score >= 60) return '#d69e2e'; // Yellow - good
  if (score >= 40) return '#dd6b20'; // Orange - needs work
  return '#e53e3e'; // Red - poor
}

/**
 * Gets a text description of the score quality.
 */
export function getScoreDescription(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Needs Improvement';
  if (score >= 40) return 'Poor';
  return 'Very Poor';
}
