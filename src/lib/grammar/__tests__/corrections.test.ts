/**
 * Property-based tests for the Correction Handler.
 * Uses fast-check for generating random test inputs.
 * 
 * **Feature: enhanced-grammar-checker, Property 3: Correction application transforms text correctly**
 * **Validates: Requirements 2.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  applyTextCorrection,
  calculatePositionDelta,
  adjustIssuePositions,
  applyCorrectionFromIssue,
  validateCorrection,
  createCorrectionHandler,
} from '../corrections';
import type { GrammarIssue, Correction } from '../types';

/**
 * **Feature: enhanced-grammar-checker, Property 3: Correction application transforms text correctly**
 * *For any* text with an issue at position [start, end] and a correction suggestion, 
 * applying the correction SHALL result in text where the substring at 
 * [start, start + correction.length] equals the correction text.
 * **Validates: Requirements 2.2**
 */
describe('Property 3: Correction application transforms text correctly', () => {
  // Generator for valid correction scenarios
  const correctionScenarioArb = fc.tuple(
    fc.string({ minLength: 5, maxLength: 100 }), // base text
    fc.nat({ max: 50 }), // start offset
    fc.integer({ min: 1, max: 20 }), // length of text to replace
    fc.string({ minLength: 1, maxLength: 30 }), // correction text
  ).chain(([baseText, startOffset, replaceLength, correction]) => {
    // Ensure we have valid indices within the text
    const maxStart = Math.max(0, baseText.length - 1);
    const start = Math.min(startOffset, maxStart);
    const end = Math.min(start + replaceLength, baseText.length);
    
    // Only proceed if we have a valid range
    if (start >= end || start >= baseText.length) {
      return fc.constant(null);
    }
    
    return fc.constant({
      text: baseText,
      startIndex: start,
      endIndex: end,
      correction,
    });
  }).filter((scenario): scenario is NonNullable<typeof scenario> => scenario !== null);

  it('should replace text at exact position with correction text', () => {
    fc.assert(
      fc.property(correctionScenarioArb, ({ text, startIndex, endIndex, correction }) => {
        const result = applyTextCorrection(text, startIndex, endIndex, correction);
        
        // The correction text should appear at the start position
        const extractedCorrection = result.substring(startIndex, startIndex + correction.length);
        expect(extractedCorrection).toBe(correction);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });


  it('should preserve text before the correction position', () => {
    fc.assert(
      fc.property(correctionScenarioArb, ({ text, startIndex, endIndex, correction }) => {
        const result = applyTextCorrection(text, startIndex, endIndex, correction);
        
        // Text before the correction should be unchanged
        const originalPrefix = text.substring(0, startIndex);
        const resultPrefix = result.substring(0, startIndex);
        expect(resultPrefix).toBe(originalPrefix);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve text after the correction position', () => {
    fc.assert(
      fc.property(correctionScenarioArb, ({ text, startIndex, endIndex, correction }) => {
        const result = applyTextCorrection(text, startIndex, endIndex, correction);
        
        // Text after the correction should be unchanged (but shifted)
        const originalSuffix = text.substring(endIndex);
        const newEndPosition = startIndex + correction.length;
        const resultSuffix = result.substring(newEndPosition);
        expect(resultSuffix).toBe(originalSuffix);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should produce correct result length after correction', () => {
    fc.assert(
      fc.property(correctionScenarioArb, ({ text, startIndex, endIndex, correction }) => {
        const result = applyTextCorrection(text, startIndex, endIndex, correction);
        
        // New length = original length - replaced length + correction length
        const replacedLength = endIndex - startIndex;
        const expectedLength = text.length - replacedLength + correction.length;
        expect(result.length).toBe(expectedLength);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should handle empty correction (deletion)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 50 }),
        fc.nat({ max: 20 }),
        fc.integer({ min: 1, max: 10 }),
        (text, startOffset, length) => {
          const start = Math.min(startOffset, Math.max(0, text.length - 2));
          const end = Math.min(start + length, text.length);
          
          if (start >= end) return true;
          
          const result = applyTextCorrection(text, start, end, '');
          
          // Result should be shorter by the deleted length
          expect(result.length).toBe(text.length - (end - start));
          
          // Text before and after should be preserved
          expect(result).toBe(text.substring(0, start) + text.substring(end));
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Tests for position delta calculation
 */
describe('Position delta calculation', () => {
  it('should calculate positive delta when correction is longer', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 50 }),
        (originalLength, extraLength) => {
          const correctionLength = originalLength + extraLength;
          const delta = calculatePositionDelta(originalLength, correctionLength);
          expect(delta).toBe(extraLength);
          expect(delta).toBeGreaterThan(0);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate negative delta when correction is shorter', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 50 }),
        fc.integer({ min: 1, max: 49 }),
        (originalLength, reduction) => {
          const correctionLength = Math.max(0, originalLength - reduction);
          const delta = calculatePositionDelta(originalLength, correctionLength);
          expect(delta).toBeLessThanOrEqual(0);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate zero delta when lengths are equal', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (length) => {
          const delta = calculatePositionDelta(length, length);
          expect(delta).toBe(0);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Tests for issue position adjustment after corrections
 */
describe('Issue position adjustment', () => {
  // Helper to create a mock issue at a specific position
  const createMockIssue = (start: number, end: number, id: string = 'test'): GrammarIssue => ({
    id,
    type: 'correctness',
    severity: 'error',
    message: 'Test issue',
    description: 'Test description',
    startIndex: start,
    endIndex: end,
    originalText: 'test',
    suggestions: [],
    rule: 'test-rule',
  });

  it('should not adjust issues before the correction', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50 }),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 60, max: 100 }),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: -20, max: 20 }),
        (issueStart, issueLength, correctionStart, correctionLength, delta) => {
          const issueEnd = issueStart + issueLength;
          const correctionEnd = correctionStart + correctionLength;
          
          // Ensure issue is before correction
          if (issueEnd > correctionStart) return true;
          
          const issues = [createMockIssue(issueStart, issueEnd)];
          const adjusted = adjustIssuePositions(issues, correctionStart, correctionEnd, delta);
          
          expect(adjusted.length).toBe(1);
          expect(adjusted[0].startIndex).toBe(issueStart);
          expect(adjusted[0].endIndex).toBe(issueEnd);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should adjust issues after the correction by delta', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 100 }),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 0, max: 30 }),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: -20, max: 20 }),
        (issueStart, issueLength, correctionStart, correctionLength, delta) => {
          const issueEnd = issueStart + issueLength;
          const correctionEnd = correctionStart + correctionLength;
          
          // Ensure issue is after correction
          if (issueStart < correctionEnd) return true;
          
          const issues = [createMockIssue(issueStart, issueEnd)];
          const adjusted = adjustIssuePositions(issues, correctionStart, correctionEnd, delta);
          
          expect(adjusted.length).toBe(1);
          expect(adjusted[0].startIndex).toBe(issueStart + delta);
          expect(adjusted[0].endIndex).toBe(issueEnd + delta);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should remove issues that overlap with the correction', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 30 }),
        fc.integer({ min: 5, max: 15 }),
        fc.integer({ min: 15, max: 35 }),
        fc.integer({ min: 5, max: 15 }),
        (issueStart, issueLength, correctionStart, correctionLength) => {
          const issueEnd = issueStart + issueLength;
          const correctionEnd = correctionStart + correctionLength;
          
          // Check if they overlap
          const overlaps = issueStart < correctionEnd && issueEnd > correctionStart;
          
          const issues = [createMockIssue(issueStart, issueEnd)];
          const adjusted = adjustIssuePositions(issues, correctionStart, correctionEnd, 0);
          
          if (overlaps) {
            expect(adjusted.length).toBe(0);
          } else {
            expect(adjusted.length).toBe(1);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Tests for correction validation
 */
describe('Correction validation', () => {
  it('should reject negative start index', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: -100, max: -1 }),
        fc.nat({ max: 50 }),
        (text, start, end) => {
          const result = validateCorrection(text, start, end);
          expect(result.isValid).toBe(false);
          expect(result.error).toContain('negative');
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject end index beyond text length', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.nat({ max: 50 }),
        fc.integer({ min: 1, max: 50 }),
        (text, start, extra) => {
          const end = text.length + extra;
          const result = validateCorrection(text, Math.min(start, text.length - 1), end);
          expect(result.isValid).toBe(false);
          expect(result.error).toContain('exceeds');
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject start index greater than end index', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 50 }),
        fc.integer({ min: 5, max: 40 }),
        fc.integer({ min: 1, max: 5 }),
        (text, end, diff) => {
          const start = end + diff;
          if (start >= text.length || end >= text.length) return true;
          
          const result = validateCorrection(text, start, end);
          expect(result.isValid).toBe(false);
          expect(result.error).toContain('greater');
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept valid indices', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 50 }),
        fc.nat({ max: 30 }),
        fc.integer({ min: 1, max: 10 }),
        (text, startOffset, length) => {
          const start = Math.min(startOffset, Math.max(0, text.length - 2));
          const end = Math.min(start + length, text.length);
          
          if (start >= end) return true;
          
          const result = validateCorrection(text, start, end);
          expect(result.isValid).toBe(true);
          expect(result.error).toBeUndefined();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate expected original text', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 50 }),
        fc.nat({ max: 30 }),
        fc.integer({ min: 1, max: 5 }),
        (text, startOffset, length) => {
          const start = Math.min(startOffset, Math.max(0, text.length - 2));
          const end = Math.min(start + length, text.length);
          
          if (start >= end) return true;
          
          const expectedOriginal = text.substring(start, end);
          const result = validateCorrection(text, start, end, expectedOriginal);
          expect(result.isValid).toBe(true);
          
          // Wrong expected text should fail
          const wrongResult = validateCorrection(text, start, end, 'wrong_text_xyz');
          expect(wrongResult.isValid).toBe(false);
          expect(wrongResult.error).toContain('mismatch');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Tests for CorrectionHandler class
 */
describe('CorrectionHandler', () => {
  it('should apply corrections and update text', () => {
    const handler = createCorrectionHandler('I have alot of work.');
    
    const issue: GrammarIssue = {
      id: 'test-1',
      type: 'correctness',
      severity: 'error',
      message: 'Common misspelling',
      description: '"alot" should be "a lot"',
      startIndex: 7,
      endIndex: 11,
      originalText: 'alot',
      suggestions: [{ text: 'a lot', confidence: 0.95 }],
      rule: 'typo-alot',
    };
    
    const correction: Correction = { text: 'a lot', confidence: 0.95 };
    const result = handler.applyCorrection(issue, correction);
    
    expect(result.success).toBe(true);
    expect(result.text).toBe('I have a lot of work.');
    expect(handler.getText()).toBe('I have a lot of work.');
  });

  it('should support undo after correction', () => {
    const originalText = 'I have alot of work.';
    const handler = createCorrectionHandler(originalText);
    
    const issue: GrammarIssue = {
      id: 'test-1',
      type: 'correctness',
      severity: 'error',
      message: 'Common misspelling',
      description: '"alot" should be "a lot"',
      startIndex: 7,
      endIndex: 11,
      originalText: 'alot',
      suggestions: [{ text: 'a lot', confidence: 0.95 }],
      rule: 'typo-alot',
    };
    
    const correction: Correction = { text: 'a lot', confidence: 0.95 };
    handler.applyCorrection(issue, correction);
    
    expect(handler.canUndo()).toBe(true);
    
    const undoResult = handler.undo();
    expect(undoResult).not.toBeNull();
    expect(handler.getText()).toBe(originalText);
  });

  it('should track history size correctly', () => {
    const handler = createCorrectionHandler('test text here now');
    
    expect(handler.getHistorySize()).toBe(0);
    expect(handler.canUndo()).toBe(false);
    
    // Apply a correction
    const issue: GrammarIssue = {
      id: 'test-1',
      type: 'correctness',
      severity: 'error',
      message: 'Test',
      description: 'Test',
      startIndex: 0,
      endIndex: 4,
      originalText: 'test',
      suggestions: [{ text: 'Test', confidence: 0.9 }],
      rule: 'test-rule',
    };
    
    handler.applyCorrection(issue, { text: 'Test', confidence: 0.9 });
    
    expect(handler.getHistorySize()).toBe(1);
    expect(handler.canUndo()).toBe(true);
  });

  it('should clear history when requested', () => {
    const handler = createCorrectionHandler('test');
    
    const issue: GrammarIssue = {
      id: 'test-1',
      type: 'correctness',
      severity: 'error',
      message: 'Test',
      description: 'Test',
      startIndex: 0,
      endIndex: 4,
      originalText: 'test',
      suggestions: [{ text: 'Test', confidence: 0.9 }],
      rule: 'test-rule',
    };
    
    handler.applyCorrection(issue, { text: 'Test', confidence: 0.9 });
    expect(handler.canUndo()).toBe(true);
    
    handler.clearHistory();
    expect(handler.canUndo()).toBe(false);
    expect(handler.getHistorySize()).toBe(0);
  });
});

/**
 * Tests for applyCorrectionFromIssue with re-analysis
 */
describe('Correction with re-analysis', () => {
  it('should trigger re-analysis after applying correction', () => {
    const text = 'I have alot of work to do.';
    const issue: GrammarIssue = {
      id: 'test-1',
      type: 'correctness',
      severity: 'error',
      message: 'Common misspelling',
      description: '"alot" should be "a lot"',
      startIndex: 7,
      endIndex: 11,
      originalText: 'alot',
      suggestions: [{ text: 'a lot', confidence: 0.95 }],
      rule: 'typo-alot',
    };
    
    const correction: Correction = { text: 'a lot', confidence: 0.95 };
    const result = applyCorrectionFromIssue(text, issue, correction);
    
    expect(result.success).toBe(true);
    expect(result.text).toBe('I have a lot of work to do.');
    
    // Result should contain a new analysis
    expect(result.result).toBeDefined();
    expect(result.result.issues).toBeDefined();
    expect(result.result.score).toBeDefined();
    expect(result.result.statistics).toBeDefined();
  });

  it('should fail when text at position does not match expected', () => {
    const text = 'I have lots of work to do.';
    const issue: GrammarIssue = {
      id: 'test-1',
      type: 'correctness',
      severity: 'error',
      message: 'Common misspelling',
      description: '"alot" should be "a lot"',
      startIndex: 7,
      endIndex: 11,
      originalText: 'alot', // This doesn't match what's actually at position 7-11
      suggestions: [{ text: 'a lot', confidence: 0.95 }],
      rule: 'typo-alot',
    };
    
    const correction: Correction = { text: 'a lot', confidence: 0.95 };
    const result = applyCorrectionFromIssue(text, issue, correction);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('mismatch');
    expect(result.text).toBe(text); // Original text unchanged
  });
});
