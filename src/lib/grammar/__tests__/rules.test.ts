/**
 * Property-based tests for the Grammar Rules Engine.
 * Uses fast-check for generating random test inputs.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  analyzeWithRules,
  TYPO_RULES,
  CONTRACTION_RULES,
  WORDY_PHRASE_RULES,
  CLICHE_RULES,
  ALL_RULES,
} from '../rules';
import { ALL_ISSUE_CATEGORIES } from '../types';

/**
 * **Feature: enhanced-grammar-checker, Property 1: Inline highlight position accuracy**
 * *For any* text containing a known grammar or spelling error, the Grammar_Checker 
 * SHALL produce an issue with startIndex and endIndex that exactly match the 
 * position of the erroneous text segment.
 * **Validates: Requirements 1.1**
 */
describe('Property 1: Inline highlight position accuracy', () => {
  // Generator for text containing a known typo at a random position
  const textWithTypoArb = fc.tuple(
    fc.string({ minLength: 0, maxLength: 50 }), // prefix
    fc.constantFrom('alot', 'definately', 'seperate', 'teh', 'wierd'), // known typo
    fc.string({ minLength: 0, maxLength: 50 }), // suffix
  ).map(([prefix, typo, suffix]) => ({
    text: `${prefix} ${typo} ${suffix}`.trim(),
    typo,
  }));

  it('should detect typos at exact positions in text', () => {
    fc.assert(
      fc.property(textWithTypoArb, ({ text, typo }) => {
        const issues = analyzeWithRules(text, TYPO_RULES);
        
        // Find the issue for our specific typo
        const typoIssue = issues.find(
          (issue) => issue.originalText.toLowerCase() === typo.toLowerCase()
        );
        
        if (typoIssue) {
          // Verify the position matches exactly
          const extractedText = text.substring(typoIssue.startIndex, typoIssue.endIndex);
          expect(extractedText.toLowerCase()).toBe(typo.toLowerCase());
          
          // Verify startIndex and endIndex are valid
          expect(typoIssue.startIndex).toBeGreaterThanOrEqual(0);
          expect(typoIssue.endIndex).toBeGreaterThan(typoIssue.startIndex);
          expect(typoIssue.endIndex).toBeLessThanOrEqual(text.length);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should produce issues where extracted text matches originalText', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (text) => {
          const issues = analyzeWithRules(text, ALL_RULES);
          
          for (const issue of issues) {
            // Skip issues that might have overlapping patterns
            if (issue.startIndex >= 0 && issue.endIndex <= text.length) {
              const extractedText = text.substring(issue.startIndex, issue.endIndex);
              // The extracted text should match the original text (case-insensitive for some rules)
              expect(extractedText.toLowerCase()).toBe(issue.originalText.toLowerCase());
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Test with specific known patterns to ensure position accuracy
  it('should find exact positions for contraction errors', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.string({ minLength: 0, maxLength: 30 }),
          fc.constantFrom('dont', 'wont', 'cant', 'isnt', 'arent'),
          fc.string({ minLength: 0, maxLength: 30 }),
        ),
        ([prefix, contraction, suffix]) => {
          const text = `${prefix} ${contraction} ${suffix}`.trim();
          const issues = analyzeWithRules(text, CONTRACTION_RULES);
          
          const contractionIssue = issues.find(
            (issue) => issue.originalText.toLowerCase() === contraction.toLowerCase()
          );
          
          if (contractionIssue) {
            const extracted = text.substring(contractionIssue.startIndex, contractionIssue.endIndex);
            expect(extracted.toLowerCase()).toBe(contraction.toLowerCase());
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: enhanced-grammar-checker, Property 2: Multiple error detection per sentence**
 * *For any* sentence containing N distinct grammar/spelling errors (where N > 1), 
 * the Grammar_Checker SHALL detect and return N separate issues, each with a 
 * distinct position range and appropriate category color.
 * **Validates: Requirements 1.3**
 */
describe('Property 2: Multiple error detection per sentence', () => {
  // Known typos for generating multiple error texts
  const KNOWN_TYPOS = ['alot', 'definately', 'seperate', 'teh', 'wierd', 'recieve'] as const;
  
  // Generator for text with multiple known errors
  const textWithMultipleErrorsArb = fc.tuple(
    fc.constantFrom(...KNOWN_TYPOS),
    fc.constantFrom(...KNOWN_TYPOS),
  ).filter(([a, b]) => a !== b) // Ensure different errors
    .map(([error1, error2]) => ({
      text: `I have ${error1} of ${error2} things to do.`,
      errors: [error1, error2],
    }));

  it('should detect multiple distinct errors in the same sentence', () => {
    fc.assert(
      fc.property(textWithMultipleErrorsArb, ({ text, errors }) => {
        const issues = analyzeWithRules(text, TYPO_RULES);
        
        // Should find at least as many issues as we inserted errors
        const foundErrors = errors.filter((error) =>
          issues.some((issue) => issue.originalText.toLowerCase() === error.toLowerCase())
        );
        
        expect(foundErrors.length).toBe(errors.length);
        
        // Each issue should have distinct position ranges
        for (let i = 0; i < issues.length; i++) {
          for (let j = i + 1; j < issues.length; j++) {
            // Positions should not be identical
            const samePosition = 
              issues[i].startIndex === issues[j].startIndex &&
              issues[i].endIndex === issues[j].endIndex;
            expect(samePosition).toBe(false);
          }
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should assign appropriate categories to each detected issue', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 200 }),
        (text) => {
          const issues = analyzeWithRules(text, ALL_RULES);
          
          for (const issue of issues) {
            // Every issue must have a valid category
            expect(ALL_ISSUE_CATEGORIES).toContain(issue.type);
            
            // Every issue must have valid severity
            expect(['error', 'warning', 'suggestion']).toContain(issue.severity);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect errors at non-overlapping positions', () => {
    // Test with text containing multiple errors at different positions
    const multiErrorText = 'I dont think alot about teh wierd things.';
    const issues = analyzeWithRules(multiErrorText, [...TYPO_RULES, ...CONTRACTION_RULES]);
    
    // Should find multiple issues
    expect(issues.length).toBeGreaterThan(1);
    
    // Sort by start position
    const sortedIssues = [...issues].sort((a, b) => a.startIndex - b.startIndex);
    
    // Check that issues don't have identical positions (they can overlap but shouldn't be identical)
    for (let i = 0; i < sortedIssues.length - 1; i++) {
      const current = sortedIssues[i];
      const next = sortedIssues[i + 1];
      
      // Either start positions differ or end positions differ
      const differentPositions = 
        current.startIndex !== next.startIndex || 
        current.endIndex !== next.endIndex;
      expect(differentPositions).toBe(true);
    }
  });
});

/**
 * Additional unit tests for rule matching accuracy
 */
describe('Rule matching accuracy', () => {
  it('should correctly identify wordy phrases', () => {
    const text = 'In order to succeed, we need to utilize our resources.';
    const issues = analyzeWithRules(text, WORDY_PHRASE_RULES);
    
    const wordyPhrases = issues.map((i) => i.originalText.toLowerCase());
    expect(wordyPhrases).toContain('in order to');
    expect(wordyPhrases).toContain('utilize');
  });

  it('should correctly identify clichés', () => {
    const text = 'At the end of the day, we need to think outside the box.';
    const issues = analyzeWithRules(text, CLICHE_RULES);
    
    const cliches = issues.map((i) => i.originalText.toLowerCase());
    expect(cliches).toContain('at the end of the day');
    expect(cliches).toContain('think outside the box');
  });

  it('should provide suggestions for each issue', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'I have alot of work.',
          'This is definately wrong.',
          'In order to succeed.',
        ),
        (text) => {
          const issues = analyzeWithRules(text, ALL_RULES);
          
          for (const issue of issues) {
            // Each issue should have at least one suggestion
            expect(issue.suggestions.length).toBeGreaterThan(0);
            
            // Each suggestion should have text and confidence
            for (const suggestion of issue.suggestions) {
              expect(suggestion.text).toBeDefined();
              expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
              expect(suggestion.confidence).toBeLessThanOrEqual(1);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
