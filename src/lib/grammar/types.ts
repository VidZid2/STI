/**
 * Core TypeScript interfaces for the Enhanced Grammar Checker analysis engine.
 * Requirements: 1.1, 3.1, 4.1, 5.1, 6.1, 9.1
 */

/**
 * Represents a single grammar, spelling, or style issue detected in text.
 */
export interface GrammarIssue {
  id: string;
  type: IssueCategory;
  severity: IssueSeverity;
  message: string;
  description: string;
  startIndex: number;
  endIndex: number;
  originalText: string;
  suggestions: Correction[];
  rule: string;
}

/**
 * Issue category types for categorizing detected issues.
 * Requirements: 4.1, 4.2
 */
export type IssueCategory = 'correctness' | 'clarity' | 'engagement' | 'delivery';

/**
 * Severity levels for issues.
 */
export type IssueSeverity = 'error' | 'warning' | 'suggestion';

/**
 * Represents a suggested correction for an issue.
 */
export interface Correction {
  text: string;
  confidence: number;
  description?: string;
}

/**
 * Complete result of text analysis.
 */
export interface AnalysisResult {
  issues: GrammarIssue[];
  score: WritingScore;
  readability: ReadabilityMetrics;
  tone: ToneAnalysis;
  statistics: TextStatistics;
}


/**
 * Writing quality score breakdown.
 * Requirements: 3.1
 */
export interface WritingScore {
  overall: number; // 0-100
  correctness: number;
  clarity: number;
  engagement: number;
  delivery: number;
}

/**
 * Readability metrics based on Flesch-Kincaid formula.
 * Requirements: 5.1, 5.2
 */
export interface ReadabilityMetrics {
  fleschKincaidGrade: number;
  educationLevel: string;
  averageSentenceLength: number;
  averageWordLength: number;
  difficultSentences: number[];
}

/**
 * Tone analysis result.
 * Requirements: 6.1, 6.2
 */
export interface ToneAnalysis {
  dominant: ToneType;
  breakdown: ToneBreakdown[];
  isConsistent: boolean;
  inconsistencies: ToneInconsistency[];
}

/**
 * Available tone types for analysis.
 */
export type ToneType = 'formal' | 'informal' | 'confident' | 'neutral' | 'friendly';

/**
 * Tone percentage breakdown entry.
 */
export interface ToneBreakdown {
  tone: ToneType;
  percentage: number;
}

/**
 * Represents a tone inconsistency in the text.
 */
export interface ToneInconsistency {
  startIndex: number;
  endIndex: number;
  detectedTone: ToneType;
  expectedTone: ToneType;
}

/**
 * Text statistics metrics.
 * Requirements: 9.1, 9.3, 9.4
 */
export interface TextStatistics {
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces: number;
  sentenceCount: number;
  paragraphCount: number;
  averageSentenceLength: number;
  readingTimeMinutes: number;
}

/**
 * Pattern that has been dismissed by the user.
 */
export interface DismissedPattern {
  rule: string;
  originalText: string;
  timestamp: number;
}

/**
 * Category colors for inline highlighting.
 */
export const CATEGORY_COLORS: Record<IssueCategory, { underline: string; bg: string }> = {
  correctness: { underline: '#e53e3e', bg: '#fed7d7' },  // Red
  clarity: { underline: '#3182ce', bg: '#bee3f8' },      // Blue
  engagement: { underline: '#38a169', bg: '#c6f6d5' },   // Green
  delivery: { underline: '#805ad5', bg: '#e9d8fd' },     // Purple
};

/**
 * Grade level mapping for readability scores.
 */
export const GRADE_LEVELS: Record<number, string> = {
  1: 'Grade 1',
  2: 'Grade 2',
  3: 'Grade 3',
  4: 'Grade 4',
  5: 'Grade 5',
  6: 'Grade 6',
  7: 'Grade 7',
  8: 'Grade 8',
  9: 'High School Freshman',
  10: 'High School Sophomore',
  11: 'High School Junior',
  12: 'High School Senior',
  13: 'College Freshman',
  14: 'College Sophomore',
  15: 'College Junior',
  16: 'College Senior',
  17: 'Graduate Level',
};

/**
 * All valid issue categories.
 */
export const ALL_ISSUE_CATEGORIES: IssueCategory[] = ['correctness', 'clarity', 'engagement', 'delivery'];
