/**
 * Correction Handler for the Enhanced Grammar Checker.
 * Implements text replacement at specified positions, position adjustment after corrections,
 * and triggers re-analysis after correction.
 * Requirements: 2.1, 2.2, 2.3
 */

import type { GrammarIssue, Correction, AnalysisResult } from './types';
import { analyzeText } from './analyzer';

/**
 * Result of applying a correction to text.
 */
export interface CorrectionResult {
  /** The modified text after applying the correction */
  text: string;
  /** The new analysis result after re-analysis */
  result: AnalysisResult;
  /** Whether the correction was successfully applied */
  success: boolean;
  /** Error message if correction failed */
  error?: string;
}

/**
 * Position adjustment information for issues after a correction.
 */
export interface PositionAdjustment {
  /** Original start index */
  originalStart: number;
  /** Original end index */
  originalEnd: number;
  /** New start index after adjustment */
  newStart: number;
  /** New end index after adjustment */
  newEnd: number;
  /** The delta applied (positive = shifted right, negative = shifted left) */
  delta: number;
}

/**
 * Applies a correction to text at the specified position.
 * Requirements: 2.2 (replace erroneous text with correction)
 * 
 * @param text - Original text
 * @param startIndex - Start position of text to replace
 * @param endIndex - End position of text to replace
 * @param correctionText - Replacement text
 * @returns Modified text with correction applied, or original text if indices are invalid
 */
export function applyTextCorrection(
  text: string,
  startIndex: number,
  endIndex: number,
  correctionText: string
): string {
  // Validate indices
  if (startIndex < 0 || endIndex > text.length || startIndex > endIndex) {
    return text; // Invalid indices, return unchanged
  }
  
  return text.substring(0, startIndex) + correctionText + text.substring(endIndex);
}


/**
 * Calculates the position delta after a correction is applied.
 * 
 * @param originalLength - Length of the original text being replaced
 * @param correctionLength - Length of the correction text
 * @returns The delta (positive = text got longer, negative = text got shorter)
 */
export function calculatePositionDelta(
  originalLength: number,
  correctionLength: number
): number {
  return correctionLength - originalLength;
}

/**
 * Adjusts issue positions after a correction is applied.
 * Issues before the correction point remain unchanged.
 * Issues after the correction point are shifted by the delta.
 * Issues overlapping with the correction are removed (they were fixed).
 * 
 * @param issues - Array of grammar issues
 * @param correctionStart - Start index of the applied correction
 * @param correctionEnd - End index of the applied correction (original)
 * @param delta - Position delta (correction length - original length)
 * @returns Array of issues with adjusted positions
 */
export function adjustIssuePositions(
  issues: GrammarIssue[],
  correctionStart: number,
  correctionEnd: number,
  delta: number
): GrammarIssue[] {
  return issues
    .filter((issue) => {
      // Remove issues that overlap with the correction area
      // An issue overlaps if it starts before the correction ends AND ends after the correction starts
      const overlaps = issue.startIndex < correctionEnd && issue.endIndex > correctionStart;
      return !overlaps;
    })
    .map((issue) => {
      // Issues before the correction remain unchanged
      if (issue.endIndex <= correctionStart) {
        return issue;
      }
      
      // Issues after the correction are shifted by delta
      return {
        ...issue,
        startIndex: issue.startIndex + delta,
        endIndex: issue.endIndex + delta,
      };
    });
}

/**
 * Applies a correction from a GrammarIssue and triggers re-analysis.
 * Requirements: 2.1, 2.2, 2.3
 * 
 * @param text - Original text
 * @param issue - The grammar issue being corrected
 * @param correction - The correction to apply
 * @param dismissedPatterns - Set of dismissed pattern keys
 * @returns CorrectionResult with new text and analysis
 */
export function applyCorrectionFromIssue(
  text: string,
  issue: GrammarIssue,
  correction: Correction,
  dismissedPatterns: Set<string> = new Set()
): CorrectionResult {
  // Validate the issue position matches the expected text
  const actualText = text.substring(issue.startIndex, issue.endIndex);
  if (actualText !== issue.originalText) {
    return {
      text,
      result: analyzeText(text, dismissedPatterns),
      success: false,
      error: `Text mismatch: expected "${issue.originalText}" but found "${actualText}"`,
    };
  }

  // Apply the correction
  const newText = applyTextCorrection(
    text,
    issue.startIndex,
    issue.endIndex,
    correction.text
  );

  // Re-analyze the modified text (Requirements: 2.3)
  const result = analyzeText(newText, dismissedPatterns);

  return {
    text: newText,
    result,
    success: true,
  };
}


/**
 * Applies multiple corrections to text in a single operation.
 * Corrections are applied from end to start to preserve positions.
 * 
 * @param text - Original text
 * @param corrections - Array of corrections with their positions
 * @param dismissedPatterns - Set of dismissed pattern keys
 * @returns CorrectionResult with new text and analysis
 */
export function applyMultipleCorrections(
  text: string,
  corrections: Array<{
    startIndex: number;
    endIndex: number;
    correctionText: string;
  }>,
  dismissedPatterns: Set<string> = new Set()
): CorrectionResult {
  if (corrections.length === 0) {
    return {
      text,
      result: analyzeText(text, dismissedPatterns),
      success: true,
    };
  }

  // Sort corrections by start index in descending order
  // This allows us to apply corrections from end to start without position shifts
  const sortedCorrections = [...corrections].sort(
    (a, b) => b.startIndex - a.startIndex
  );

  let newText = text;
  
  for (const correction of sortedCorrections) {
    newText = applyTextCorrection(
      newText,
      correction.startIndex,
      correction.endIndex,
      correction.correctionText
    );
  }

  // Re-analyze the modified text
  const result = analyzeText(newText, dismissedPatterns);

  return {
    text: newText,
    result,
    success: true,
  };
}

/**
 * Validates that a correction can be safely applied.
 * 
 * @param text - The text to validate against
 * @param startIndex - Start position of the correction
 * @param endIndex - End position of the correction
 * @param expectedOriginal - The expected original text at that position
 * @returns Object with isValid flag and optional error message
 */
export function validateCorrection(
  text: string,
  startIndex: number,
  endIndex: number,
  expectedOriginal?: string
): { isValid: boolean; error?: string } {
  // Check bounds
  if (startIndex < 0) {
    return { isValid: false, error: 'Start index cannot be negative' };
  }
  
  if (endIndex > text.length) {
    return { isValid: false, error: 'End index exceeds text length' };
  }
  
  if (startIndex > endIndex) {
    return { isValid: false, error: 'Start index cannot be greater than end index' };
  }

  // Check expected original text if provided
  if (expectedOriginal !== undefined) {
    const actualText = text.substring(startIndex, endIndex);
    if (actualText !== expectedOriginal) {
      return {
        isValid: false,
        error: `Text mismatch: expected "${expectedOriginal}" but found "${actualText}"`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Creates a correction handler with state management.
 * Useful for tracking correction history and managing undo operations.
 */
export class CorrectionHandler {
  private text: string;
  private dismissedPatterns: Set<string>;
  private history: Array<{ text: string; result: AnalysisResult }> = [];
  private maxHistorySize: number;

  constructor(
    initialText: string = '',
    dismissedPatterns: Set<string> = new Set(),
    maxHistorySize: number = 50
  ) {
    this.text = initialText;
    this.dismissedPatterns = dismissedPatterns;
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Gets the current text.
   */
  getText(): string {
    return this.text;
  }

  /**
   * Sets the text and clears history.
   */
  setText(text: string): void {
    this.text = text;
    this.history = [];
  }

  /**
   * Applies a correction and saves to history.
   * Requirements: 2.1, 2.2, 2.3
   */
  applyCorrection(
    issue: GrammarIssue,
    correction: Correction
  ): CorrectionResult {
    // Save current state to history
    const currentResult = analyzeText(this.text, this.dismissedPatterns);
    this.history.push({ text: this.text, result: currentResult });
    
    // Trim history if needed
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Apply the correction
    const result = applyCorrectionFromIssue(
      this.text,
      issue,
      correction,
      this.dismissedPatterns
    );

    if (result.success) {
      this.text = result.text;
    }

    return result;
  }

  /**
   * Undoes the last correction.
   * @returns The previous state or null if no history
   */
  undo(): { text: string; result: AnalysisResult } | null {
    const previous = this.history.pop();
    if (previous) {
      this.text = previous.text;
      return previous;
    }
    return null;
  }

  /**
   * Checks if undo is available.
   */
  canUndo(): boolean {
    return this.history.length > 0;
  }

  /**
   * Gets the history size.
   */
  getHistorySize(): number {
    return this.history.length;
  }

  /**
   * Updates dismissed patterns.
   */
  setDismissedPatterns(patterns: Set<string>): void {
    this.dismissedPatterns = patterns;
  }

  /**
   * Clears the correction history.
   */
  clearHistory(): void {
    this.history = [];
  }
}

/**
 * Creates a new CorrectionHandler instance.
 */
export function createCorrectionHandler(
  initialText: string = '',
  dismissedPatterns: Set<string> = new Set(),
  maxHistorySize: number = 50
): CorrectionHandler {
  return new CorrectionHandler(initialText, dismissedPatterns, maxHistorySize);
}
