/**
 * Property-based tests for readability calculation.
 * Uses fast-check for property-based testing.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateFleschKincaidGrade,
  getEducationLevel,
  findDifficultSentences,
  generateReadabilityIssues,
  countSyllables,
  countTotalSyllables,
  getWords,
  getSentences,
} from '../readability';
import { GRADE_LEVELS } from '../types';

/**
 * Generator for simple words (alphabetic only, no punctuation).
 */
const simpleWordArb = fc.string({ minLength: 1, maxLength: 15 })
  .filter(s => /^[a-zA-Z]+$/.test(s));

/**
 * Generator for text with at least one complete sentence.
 * Ensures words don't contain sentence-ending punctuation.
 */
const textWithSentencesArb = fc
  .array(
    fc.tuple(
      fc.array(simpleWordArb, { minLength: 1, maxLength: 10 }),
      fc.constantFrom('.', '!', '?')
    ),
    { minLength: 1, maxLength: 5 }
  )
  .map(sentences => sentences.map(([words, punct]) => words.join(' ') + punct).join(' '));


/**
 * **Feature: enhanced-grammar-checker, Property 8: Readability score calculation**
 * **Validates: Requirements 5.1**
 */
describe('Property 8: Readability score calculation (Flesch-Kincaid)', () => {
  /**
   * For any text with at least one sentence, the ReadabilityMetrics.fleschKincaidGrade SHALL equal:
   * 0.39 × (totalWords / totalSentences) + 11.8 × (totalSyllables / totalWords) - 15.59,
   * rounded to one decimal place.
   */
  it('Flesch-Kincaid grade follows the formula: 0.39 × (words/sentences) + 11.8 × (syllables/words) - 15.59', () => {
    fc.assert(
      fc.property(textWithSentencesArb, (text) => {
        const words = getWords(text);
        const sentences = getSentences(text);
        const totalWords = words.length;
        const totalSentences = sentences.length;
        const totalSyllables = countTotalSyllables(text);

        // Skip if no words or sentences (edge case)
        if (totalWords === 0 || totalSentences === 0) {
          return true;
        }

        const expectedGrade = 0.39 * (totalWords / totalSentences) + 11.8 * (totalSyllables / totalWords) - 15.59;
        const expectedRounded = Math.round(expectedGrade * 10) / 10;

        const actualGrade = calculateFleschKincaidGrade(text);

        expect(actualGrade).toBeCloseTo(expectedRounded, 1);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Empty text should return grade 0.
   */
  it('empty text returns grade 0', () => {
    expect(calculateFleschKincaidGrade('')).toBe(0);
  });

});


/**
 * **Feature: enhanced-grammar-checker, Property 9: Education level mapping**
 * **Validates: Requirements 5.2**
 */
describe('Property 9: Education level mapping', () => {
  /**
   * For any Flesch-Kincaid grade level G, the educationLevel string SHALL correspond
   * to the appropriate grade in the GRADE_LEVELS mapping (clamped to range [1, 17]).
   */
  it('education level maps correctly for grades 1-17', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 17 }), (grade) => {
        const educationLevel = getEducationLevel(grade);
        expect(educationLevel).toBe(GRADE_LEVELS[grade]);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Grades below 1 should clamp to Grade 1.
   */
  it('grades below 1 clamp to Grade 1', () => {
    fc.assert(
      fc.property(fc.integer({ min: -100, max: 0 }), (grade) => {
        const educationLevel = getEducationLevel(grade);
        expect(educationLevel).toBe(GRADE_LEVELS[1]);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Grades above 17 should clamp to Graduate Level.
   */
  it('grades above 17 clamp to Graduate Level', () => {
    fc.assert(
      fc.property(fc.integer({ min: 18, max: 100 }), (grade) => {
        const educationLevel = getEducationLevel(grade);
        expect(educationLevel).toBe(GRADE_LEVELS[17]);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Decimal grades should round to nearest integer for mapping.
   */
  it('decimal grades round to nearest integer', () => {
    fc.assert(
      fc.property(fc.double({ min: 1, max: 17, noNaN: true }), (grade) => {
        const educationLevel = getEducationLevel(grade);
        const roundedGrade = Math.max(1, Math.min(17, Math.round(grade)));
        expect(educationLevel).toBe(GRADE_LEVELS[roundedGrade]);
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: enhanced-grammar-checker, Property 10: Readability issue detection**
 * **Validates: Requirements 5.3, 5.4**
 */
describe('Property 10: Readability issue detection', () => {
  /**
   * Generator for a sentence with more than 25 words.
   */
  const longSentenceArb = fc
    .array(simpleWordArb, { minLength: 26, maxLength: 40 })
    .map(words => words.join(' ') + '.');

  /**
   * Generator for a sentence with 25 or fewer words.
   */
  const shortSentenceArb = fc
    .array(simpleWordArb, { minLength: 1, maxLength: 25 })
    .map(words => words.join(' ') + '.');

  /**
   * For any sentence with more than 25 words, the Grammar_Checker SHALL include
   * that sentence's index in ReadabilityMetrics.difficultSentences.
   */
  it('sentences with more than 25 words are flagged as difficult', () => {
    fc.assert(
      fc.property(longSentenceArb, (text) => {
        const difficultSentences = findDifficultSentences(text);
        // The single long sentence should be at index 0
        expect(difficultSentences).toContain(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Sentences with 25 or fewer words should NOT be flagged as difficult.
   */
  it('sentences with 25 or fewer words are not flagged as difficult', () => {
    fc.assert(
      fc.property(shortSentenceArb, (text) => {
        const difficultSentences = findDifficultSentences(text);
        expect(difficultSentences).not.toContain(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Long sentences should generate clarity issues.
   */
  it('long sentences generate clarity issues', () => {
    fc.assert(
      fc.property(longSentenceArb, (text) => {
        const issues = generateReadabilityIssues(text);
        const longSentenceIssues = issues.filter(i => i.rule === 'long-sentence');
        expect(longSentenceIssues.length).toBeGreaterThan(0);
        expect(longSentenceIssues[0].type).toBe('clarity');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Generator for text with long words (average > 6 characters).
   * Uses words that are consistently long.
   */
  const textWithLongWordsArb = fc
    .array(
      fc.string({ minLength: 8, maxLength: 15 }).filter(s => /^[a-zA-Z]+$/.test(s)),
      { minLength: 3, maxLength: 10 }
    )
    .map(words => words.join(' ') + '.');

  /**
   * For any text where average word length exceeds 6 characters,
   * the Grammar_Checker SHALL generate at least one clarity issue suggesting simpler alternatives.
   */
  it('text with average word length > 6 generates complex vocabulary issue', () => {
    fc.assert(
      fc.property(textWithLongWordsArb, (text) => {
        const issues = generateReadabilityIssues(text);
        const complexVocabIssues = issues.filter(i => i.rule === 'complex-vocabulary');
        expect(complexVocabIssues.length).toBeGreaterThan(0);
        expect(complexVocabIssues[0].type).toBe('clarity');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Generator for text with short words (average <= 6 characters).
   */
  const textWithShortWordsArb = fc
    .array(
      fc.string({ minLength: 1, maxLength: 5 }).filter(s => /^[a-zA-Z]+$/.test(s)),
      { minLength: 3, maxLength: 10 }
    )
    .map(words => words.join(' ') + '.');

  /**
   * Text with average word length <= 6 should NOT generate complex vocabulary issue.
   */
  it('text with average word length <= 6 does not generate complex vocabulary issue', () => {
    fc.assert(
      fc.property(textWithShortWordsArb, (text) => {
        const issues = generateReadabilityIssues(text);
        const complexVocabIssues = issues.filter(i => i.rule === 'complex-vocabulary');
        expect(complexVocabIssues.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Unit tests for syllable counting helper function.
 */
describe('Syllable counting', () => {
  it('counts syllables correctly for common words', () => {
    expect(countSyllables('hello')).toBe(2);
    expect(countSyllables('world')).toBe(1);
    expect(countSyllables('beautiful')).toBe(3);
    expect(countSyllables('the')).toBe(1);
    expect(countSyllables('a')).toBe(1);
  });

  it('handles empty and non-alphabetic input', () => {
    expect(countSyllables('')).toBe(0);
    expect(countSyllables('123')).toBe(0);
    expect(countSyllables('...')).toBe(0);
  });
});
