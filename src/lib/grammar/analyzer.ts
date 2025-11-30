/**
 * Unified Analysis Engine for the Enhanced Grammar Checker.
 * Integrates grammar rules, readability, tone, and statistics modules.
 * Implements debounced analysis (500ms delay).
 * Requirements: 1.4, 2.3
 */

import type { AnalysisResult, GrammarIssue } from './types';
import { analyzeWithRules } from './rules';
import { calculateReadability, generateReadabilityIssues } from './readability';
import { analyzeTone, generateToneIssues } from './tone';
import { calculateStatistics } from './statistics';
import { calculateWritingScore } from './score';
import { runAdvancedChecks } from './advanced';

/**
 * Debounce delay in milliseconds.
 * Requirements: 1.4 (update within 500ms of user stopping typing)
 */
const DEBOUNCE_DELAY_MS = 500;

/**
 * Debounce timer reference type.
 */
type DebounceTimer = ReturnType<typeof setTimeout> | null;

/**
 * Callback type for analysis completion.
 */
type AnalysisCallback = (result: AnalysisResult) => void;

/**
 * Creates a pattern key for dismissed pattern matching.
 */
export function createDismissedPatternKey(rule: string, originalText: string): string {
  return `${rule}:${originalText.toLowerCase()}`;
}

/**
 * Checks if an issue matches a dismissed pattern.
 */
export function isIssueDismissed(
  issue: GrammarIssue,
  dismissedPatterns: Set<string>
): boolean {
  const key = createDismissedPatternKey(issue.rule, issue.originalText);
  return dismissedPatterns.has(key);
}

/**
 * Filters out dismissed issues from the issue list.
 */
export function filterDismissedIssues(
  issues: GrammarIssue[],
  dismissedPatterns: Set<string>
): GrammarIssue[] {
  return issues.filter((issue) => !isIssueDismissed(issue, dismissedPatterns));
}

/**
 * Removes duplicate issues that have the same position and rule.
 */
function deduplicateIssues(issues: GrammarIssue[]): GrammarIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.startIndex}-${issue.endIndex}-${issue.rule}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Performs synchronous text analysis.
 * Combines all analysis modules into a single AnalysisResult.
 * 
 * @param text - The text to analyze
 * @param dismissedPatterns - Set of dismissed pattern keys to exclude
 * @returns Complete AnalysisResult
 */
export function analyzeText(
  text: string,
  dismissedPatterns: Set<string> = new Set()
): AnalysisResult {
  // Handle empty text
  if (!text || text.trim().length === 0) {
    return createEmptyAnalysisResult();
  }

  // Collect all issues from different modules
  let allIssues: GrammarIssue[] = [];

  // Grammar rules (typos, contractions, confused words, etc.)
  const ruleIssues = analyzeWithRules(text);
  allIssues.push(...ruleIssues);

  // Advanced checks (passive voice, wordy phrases, clichés, number formatting)
  const advancedIssues = runAdvancedChecks(text);
  allIssues.push(...advancedIssues);

  // Readability issues (long sentences, complex vocabulary)
  const readabilityIssues = generateReadabilityIssues(text);
  allIssues.push(...readabilityIssues);

  // Tone issues (inconsistencies)
  const toneIssues = generateToneIssues(text);
  allIssues.push(...toneIssues);

  // Remove duplicates and filter dismissed patterns
  allIssues = deduplicateIssues(allIssues);
  allIssues = filterDismissedIssues(allIssues, dismissedPatterns);

  // Sort by position
  allIssues.sort((a, b) => a.startIndex - b.startIndex);

  // Calculate metrics
  const statistics = calculateStatistics(text);
  const readability = calculateReadability(text);
  const tone = analyzeTone(text);
  const score = calculateWritingScore(allIssues);

  return {
    issues: allIssues,
    score,
    readability,
    tone,
    statistics,
  };
}

/**
 * Creates an empty analysis result for empty text.
 */
export function createEmptyAnalysisResult(): AnalysisResult {
  return {
    issues: [],
    score: {
      overall: 100,
      correctness: 100,
      clarity: 100,
      engagement: 100,
      delivery: 100,
    },
    readability: {
      fleschKincaidGrade: 0,
      educationLevel: 'Grade 1',
      averageSentenceLength: 0,
      averageWordLength: 0,
      difficultSentences: [],
    },
    tone: {
      dominant: 'neutral',
      breakdown: [
        { tone: 'formal', percentage: 0 },
        { tone: 'informal', percentage: 0 },
        { tone: 'confident', percentage: 0 },
        { tone: 'neutral', percentage: 100 },
        { tone: 'friendly', percentage: 0 },
      ],
      isConsistent: true,
      inconsistencies: [],
    },
    statistics: {
      wordCount: 0,
      characterCount: 0,
      characterCountNoSpaces: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      averageSentenceLength: 0,
      readingTimeMinutes: 0,
    },
  };
}

/**
 * Applies a correction to text at the specified position.
 * Returns the modified text.
 * 
 * @param text - Original text
 * @param startIndex - Start position of text to replace
 * @param endIndex - End position of text to replace
 * @param correction - Replacement text
 * @returns Modified text with correction applied
 */
export function applyCorrection(
  text: string,
  startIndex: number,
  endIndex: number,
  correction: string
): string {
  if (startIndex < 0 || endIndex > text.length || startIndex > endIndex) {
    return text; // Invalid indices, return unchanged
  }
  return text.substring(0, startIndex) + correction + text.substring(endIndex);
}

/**
 * Re-analyzes text after a correction is applied.
 * Requirements: 2.3 (re-analyze after correction)
 * 
 * @param originalText - Text before correction
 * @param startIndex - Start position of correction
 * @param endIndex - End position of correction
 * @param correction - Replacement text
 * @param dismissedPatterns - Set of dismissed pattern keys
 * @returns Object containing new text and new analysis result
 */
export function analyzeAfterCorrection(
  originalText: string,
  startIndex: number,
  endIndex: number,
  correction: string,
  dismissedPatterns: Set<string> = new Set()
): { text: string; result: AnalysisResult } {
  const newText = applyCorrection(originalText, startIndex, endIndex, correction);
  const result = analyzeText(newText, dismissedPatterns);
  return { text: newText, result };
}

/**
 * Creates a debounced analysis function.
 * The analysis will only run after the user stops typing for 500ms.
 * Requirements: 1.4 (update within 500ms of stopping typing)
 * 
 * @param callback - Function to call with analysis result
 * @param dismissedPatterns - Set of dismissed pattern keys
 * @returns Object with analyze function and cancel function
 */
export function createDebouncedAnalyzer(
  callback: AnalysisCallback,
  dismissedPatterns: Set<string> = new Set()
): {
  analyze: (text: string) => void;
  cancel: () => void;
  analyzeImmediate: (text: string) => AnalysisResult;
} {
  let timer: DebounceTimer = null;

  const cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const analyze = (text: string) => {
    cancel();
    timer = setTimeout(() => {
      const result = analyzeText(text, dismissedPatterns);
      callback(result);
    }, DEBOUNCE_DELAY_MS);
  };

  const analyzeImmediate = (text: string): AnalysisResult => {
    cancel();
    return analyzeText(text, dismissedPatterns);
  };

  return { analyze, cancel, analyzeImmediate };
}

/**
 * Analysis engine class for stateful analysis management.
 * Provides debounced analysis, correction handling, and dismissal management.
 */
export class AnalysisEngine {
  private dismissedPatterns: Set<string> = new Set();
  private currentText: string = '';
  private currentResult: AnalysisResult = createEmptyAnalysisResult();
  private debounceTimer: DebounceTimer = null;
  private onAnalysisComplete?: AnalysisCallback;

  constructor(onAnalysisComplete?: AnalysisCallback) {
    this.onAnalysisComplete = onAnalysisComplete;
  }

  /**
   * Sets the callback for analysis completion.
   */
  setCallback(callback: AnalysisCallback): void {
    this.onAnalysisComplete = callback;
  }

  /**
   * Analyzes text with debouncing.
   * Requirements: 1.4
   */
  analyze(text: string): void {
    this.currentText = text;
    this.cancelPendingAnalysis();

    this.debounceTimer = setTimeout(() => {
      this.currentResult = analyzeText(text, this.dismissedPatterns);
      this.onAnalysisComplete?.(this.currentResult);
    }, DEBOUNCE_DELAY_MS);
  }

  /**
   * Analyzes text immediately without debouncing.
   */
  analyzeImmediate(text: string): AnalysisResult {
    this.cancelPendingAnalysis();
    this.currentText = text;
    this.currentResult = analyzeText(text, this.dismissedPatterns);
    this.onAnalysisComplete?.(this.currentResult);
    return this.currentResult;
  }

  /**
   * Applies a correction and re-analyzes.
   * Requirements: 2.3
   */
  applyCorrection(
    startIndex: number,
    endIndex: number,
    correction: string
  ): { text: string; result: AnalysisResult } {
    const { text, result } = analyzeAfterCorrection(
      this.currentText,
      startIndex,
      endIndex,
      correction,
      this.dismissedPatterns
    );
    this.currentText = text;
    this.currentResult = result;
    this.onAnalysisComplete?.(result);
    return { text, result };
  }

  /**
   * Dismisses an issue pattern.
   */
  dismissIssue(issue: GrammarIssue): void {
    const key = createDismissedPatternKey(issue.rule, issue.originalText);
    this.dismissedPatterns.add(key);
    // Re-analyze to update results
    this.analyzeImmediate(this.currentText);
  }

  /**
   * Clears all dismissed patterns.
   */
  clearDismissals(): void {
    this.dismissedPatterns.clear();
  }

  /**
   * Resets the engine state (for text clear).
   */
  reset(): void {
    this.cancelPendingAnalysis();
    this.dismissedPatterns.clear();
    this.currentText = '';
    this.currentResult = createEmptyAnalysisResult();
    this.onAnalysisComplete?.(this.currentResult);
  }

  /**
   * Gets the current analysis result.
   */
  getResult(): AnalysisResult {
    return this.currentResult;
  }

  /**
   * Gets the current text.
   */
  getText(): string {
    return this.currentText;
  }

  /**
   * Gets the dismissed patterns.
   */
  getDismissedPatterns(): Set<string> {
    return new Set(this.dismissedPatterns);
  }

  /**
   * Cancels any pending debounced analysis.
   */
  private cancelPendingAnalysis(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}

/**
 * Creates a new AnalysisEngine instance.
 */
export function createAnalysisEngine(
  onAnalysisComplete?: AnalysisCallback
): AnalysisEngine {
  return new AnalysisEngine(onAnalysisComplete);
}
