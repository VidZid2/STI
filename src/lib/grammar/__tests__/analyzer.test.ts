/**
 * Property-based tests for the Unified Analysis Engine.
 * Uses fast-check for generating random test inputs.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  analyzeText,
  analyzeAfterCorrection,
  applyCorrection,
  createEmptyAnalysisResult,
  createDismissedPatternKey,
  isIssueDismissed,
  filterDismissedIssues,
  AnalysisEngine,
} from '../analyzer';
import { ALL_ISSUE_CATEGORIES } from '../types';

/**
 * **Feature: enhanced-grammar-checker, Property 4: Re-analysis after correction**
 * *For any* text where a correction is applied, the Grammar_Checker SHALL re-analyze 
 * the modified text and return a new AnalysisResult reflecting the current state.
 * **Validates: Requirements 2.3**
 */
describe('Property 4: Re-analysis after correction', () => {
  // Generator for text with a known typo that can be corrected
  const textWithCorrectableTypoArb = fc.tuple(
    fc.string({ minLength: 0, maxLength: 30 }).filter(s => !s.includes('alot')),
    fc.string({ minLength: 0, maxLength: 30 }).filter(s => !s.includes('alot')),
  ).map(([prefix, suffix]) => ({
    text: `${prefix} alot ${suffix}`.trim(),
    typo: 'alot',
    correction: 'a lot',
  }));

  it('should return a new AnalysisResult after applying a correction', () => {
    fc.assert(
      fc.property(textWithCorrectableTypoArb, ({ text, typo, correction }) => {
        // First analyze the original text
        const originalResult = analyzeText(text);
        
        // Find the typo issue
        const typoIssue = originalResult.issues.find(
          (issue) => issue.originalText.toLowerCase() === typo.toLowerCase()
        );
        
        if (typoIssue) {
          // Apply the correction and re-analyze
          const { text: newText, result: newResult } = analyzeAfterCorrection(
            text,
            typoIssue.startIndex,
            typoIssue.endIndex,
            correction
          );
          
          // The new text should contain the correction
          expect(newText).toContain(correction);
          expect(newText).not.toContain(typo);
          
          // The new result should be a valid AnalysisResult
          expect(newResult).toBeDefined();
          expect(newResult.issues).toBeDefined();
          expect(newResult.score).toBeDefined();
          expect(newResult.readability).toBeDefined();
          expect(newResult.tone).toBeDefined();
          expect(newResult.statistics).toBeDefined();
          
          // The typo issue should no longer be present
          const typoStillPresent = newResult.issues.some(
            (issue) => issue.originalText.toLowerCase() === typo.toLowerCase()
          );
          expect(typoStillPresent).toBe(false);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should update statistics after correction', () => {
    fc.assert(
      fc.property(textWithCorrectableTypoArb, ({ text, typo, correction }) => {
        const originalResult = analyzeText(text);
        const typoIssue = originalResult.issues.find(
          (issue) => issue.originalText.toLowerCase() === typo.toLowerCase()
        );
        
        if (typoIssue) {
          const { result: newResult } = analyzeAfterCorrection(
            text,
            typoIssue.startIndex,
            typoIssue.endIndex,
            correction
          );
          
          // Statistics should reflect the new text
          // 'alot' (1 word) -> 'a lot' (2 words), so word count should increase
          expect(newResult.statistics.wordCount).toBeGreaterThanOrEqual(
            originalResult.statistics.wordCount
          );
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should produce valid score bounds after correction', () => {
    fc.assert(
      fc.property(textWithCorrectableTypoArb, ({ text, typo, correction }) => {
        const originalResult = analyzeText(text);
        const typoIssue = originalResult.issues.find(
          (issue) => issue.originalText.toLowerCase() === typo.toLowerCase()
        );
        
        if (typoIssue) {
          const { result: newResult } = analyzeAfterCorrection(
            text,
            typoIssue.startIndex,
            typoIssue.endIndex,
            correction
          );
          
          // All scores should be in valid range [0, 100]
          expect(newResult.score.overall).toBeGreaterThanOrEqual(0);
          expect(newResult.score.overall).toBeLessThanOrEqual(100);
          expect(newResult.score.correctness).toBeGreaterThanOrEqual(0);
          expect(newResult.score.correctness).toBeLessThanOrEqual(100);
          expect(newResult.score.clarity).toBeGreaterThanOrEqual(0);
          expect(newResult.score.clarity).toBeLessThanOrEqual(100);
          expect(newResult.score.engagement).toBeGreaterThanOrEqual(0);
          expect(newResult.score.engagement).toBeLessThanOrEqual(100);
          expect(newResult.score.delivery).toBeGreaterThanOrEqual(0);
          expect(newResult.score.delivery).toBeLessThanOrEqual(100);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain issue position validity after correction', () => {
    fc.assert(
      fc.property(textWithCorrectableTypoArb, ({ text, typo, correction }) => {
        const originalResult = analyzeText(text);
        const typoIssue = originalResult.issues.find(
          (issue) => issue.originalText.toLowerCase() === typo.toLowerCase()
        );
        
        if (typoIssue) {
          const { text: newText, result: newResult } = analyzeAfterCorrection(
            text,
            typoIssue.startIndex,
            typoIssue.endIndex,
            correction
          );
          
          // All issues in the new result should have valid positions
          for (const issue of newResult.issues) {
            expect(issue.startIndex).toBeGreaterThanOrEqual(0);
            expect(issue.endIndex).toBeGreaterThan(issue.startIndex);
            expect(issue.endIndex).toBeLessThanOrEqual(newText.length);
            
            // The extracted text should match the original text
            const extracted = newText.substring(issue.startIndex, issue.endIndex);
            expect(extracted.toLowerCase()).toBe(issue.originalText.toLowerCase());
          }
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should categorize all issues after correction', () => {
    fc.assert(
      fc.property(textWithCorrectableTypoArb, ({ text, typo, correction }) => {
        const originalResult = analyzeText(text);
        const typoIssue = originalResult.issues.find(
          (issue) => issue.originalText.toLowerCase() === typo.toLowerCase()
        );
        
        if (typoIssue) {
          const { result: newResult } = analyzeAfterCorrection(
            text,
            typoIssue.startIndex,
            typoIssue.endIndex,
            correction
          );
          
          // All issues should have valid categories
          for (const issue of newResult.issues) {
            expect(ALL_ISSUE_CATEGORIES).toContain(issue.type);
          }
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Unit tests for applyCorrection function
 */
describe('applyCorrection', () => {
  it('should correctly replace text at specified position', () => {
    const text = 'I have alot of work.';
    const result = applyCorrection(text, 7, 11, 'a lot');
    expect(result).toBe('I have a lot of work.');
  });

  it('should handle correction at start of text', () => {
    const text = 'alot of work';
    const result = applyCorrection(text, 0, 4, 'A lot');
    expect(result).toBe('A lot of work');
  });

  it('should handle correction at end of text', () => {
    const text = 'I have alot';
    const result = applyCorrection(text, 7, 11, 'a lot');
    expect(result).toBe('I have a lot');
  });

  it('should return unchanged text for invalid indices', () => {
    const text = 'Hello world';
    expect(applyCorrection(text, -1, 5, 'test')).toBe(text);
    expect(applyCorrection(text, 0, 100, 'test')).toBe(text);
    expect(applyCorrection(text, 5, 3, 'test')).toBe(text);
  });
});

/**
 * Unit tests for createEmptyAnalysisResult
 */
describe('createEmptyAnalysisResult', () => {
  it('should return a valid empty result', () => {
    const result = createEmptyAnalysisResult();
    
    expect(result.issues).toEqual([]);
    expect(result.score.overall).toBe(100);
    expect(result.score.correctness).toBe(100);
    expect(result.score.clarity).toBe(100);
    expect(result.score.engagement).toBe(100);
    expect(result.score.delivery).toBe(100);
    expect(result.statistics.wordCount).toBe(0);
    expect(result.tone.dominant).toBe('neutral');
    expect(result.tone.isConsistent).toBe(true);
  });
});

/**
 * Unit tests for dismissal functionality
 */
describe('Dismissal functionality', () => {
  it('should create consistent pattern keys', () => {
    const key1 = createDismissedPatternKey('typo-alot', 'alot');
    const key2 = createDismissedPatternKey('typo-alot', 'ALOT');
    expect(key1).toBe(key2); // Case-insensitive
  });

  it('should correctly identify dismissed issues', () => {
    const dismissedPatterns = new Set(['typo-alot:alot']);
    const issue = {
      id: 'test-1',
      type: 'correctness' as const,
      severity: 'error' as const,
      message: 'Test',
      description: 'Test',
      startIndex: 0,
      endIndex: 4,
      originalText: 'alot',
      suggestions: [],
      rule: 'typo-alot',
    };
    
    expect(isIssueDismissed(issue, dismissedPatterns)).toBe(true);
  });

  it('should filter out dismissed issues', () => {
    const dismissedPatterns = new Set(['typo-alot:alot']);
    const issues = [
      {
        id: 'test-1',
        type: 'correctness' as const,
        severity: 'error' as const,
        message: 'Test',
        description: 'Test',
        startIndex: 0,
        endIndex: 4,
        originalText: 'alot',
        suggestions: [],
        rule: 'typo-alot',
      },
      {
        id: 'test-2',
        type: 'correctness' as const,
        severity: 'error' as const,
        message: 'Test 2',
        description: 'Test 2',
        startIndex: 10,
        endIndex: 14,
        originalText: 'teh',
        suggestions: [],
        rule: 'typo-teh',
      },
    ];
    
    const filtered = filterDismissedIssues(issues, dismissedPatterns);
    expect(filtered.length).toBe(1);
    expect(filtered[0].originalText).toBe('teh');
  });
});

/**
 * Unit tests for AnalysisEngine class
 */
describe('AnalysisEngine', () => {
  it('should analyze text immediately', () => {
    const engine = new AnalysisEngine();
    const result = engine.analyzeImmediate('I have alot of work.');
    
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues.some(i => i.originalText.toLowerCase() === 'alot')).toBe(true);
  });

  it('should apply corrections and re-analyze', () => {
    const engine = new AnalysisEngine();
    engine.analyzeImmediate('I have alot of work.');
    
    const result = engine.getResult();
    const typoIssue = result.issues.find(i => i.originalText.toLowerCase() === 'alot');
    
    if (typoIssue) {
      const { text, result: newResult } = engine.applyCorrection(
        typoIssue.startIndex,
        typoIssue.endIndex,
        'a lot'
      );
      
      expect(text).toContain('a lot');
      expect(newResult.issues.some(i => i.originalText.toLowerCase() === 'alot')).toBe(false);
    }
  });

  it('should handle dismissals', () => {
    const engine = new AnalysisEngine();
    engine.analyzeImmediate('I have alot of work.');
    
    const result = engine.getResult();
    const typoIssue = result.issues.find(i => i.originalText.toLowerCase() === 'alot');
    
    if (typoIssue) {
      engine.dismissIssue(typoIssue);
      const newResult = engine.getResult();
      
      // The dismissed issue should no longer appear
      expect(newResult.issues.some(i => i.originalText.toLowerCase() === 'alot')).toBe(false);
    }
  });

  it('should reset state correctly', () => {
    const engine = new AnalysisEngine();
    engine.analyzeImmediate('I have alot of work.');
    
    const result = engine.getResult();
    const typoIssue = result.issues.find(i => i.originalText.toLowerCase() === 'alot');
    
    if (typoIssue) {
      engine.dismissIssue(typoIssue);
    }
    
    engine.reset();
    
    expect(engine.getText()).toBe('');
    expect(engine.getResult().issues).toEqual([]);
    expect(engine.getDismissedPatterns().size).toBe(0);
  });
});

/**
 * Integration tests for full analysis flow
 */
describe('Full analysis integration', () => {
  it('should analyze text with multiple issue types', () => {
    const text = 'I dont think alot about teh wierd things. In order to succeed, we need to think outside the box.';
    const result = analyzeText(text);
    
    // Should find correctness issues (typos, contractions)
    const correctnessIssues = result.issues.filter(i => i.type === 'correctness');
    expect(correctnessIssues.length).toBeGreaterThan(0);
    
    // Should find clarity issues (wordy phrases)
    const clarityIssues = result.issues.filter(i => i.type === 'clarity');
    expect(clarityIssues.length).toBeGreaterThan(0);
    
    // Should find engagement issues (clichés)
    const engagementIssues = result.issues.filter(i => i.type === 'engagement');
    expect(engagementIssues.length).toBeGreaterThan(0);
    
    // Score should reflect the issues
    expect(result.score.overall).toBeLessThan(100);
  });

  it('should handle empty text', () => {
    const result = analyzeText('');
    
    expect(result.issues).toEqual([]);
    expect(result.score.overall).toBe(100);
    expect(result.statistics.wordCount).toBe(0);
  });

  it('should handle text with no issues', () => {
    const result = analyzeText('This is a simple sentence.');
    
    // May have some suggestions but should have high score
    expect(result.score.overall).toBeGreaterThanOrEqual(80);
  });
});
