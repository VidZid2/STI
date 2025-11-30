/**
 * Property-based tests for statistics calculation accuracy.
 * **Feature: enhanced-grammar-checker, Property 15: Statistics calculation accuracy**
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateStatistics } from '../statistics';

/**
 * Generator for text with words (non-empty, whitespace-separated tokens).
 */
const textWithWordsArb = fc
  .array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), {
    minLength: 1,
    maxLength: 50,
  })
  .map(words => words.join(' '));

/**
 * Generator for text with sentences (ends with sentence-ending punctuation).
 */
const textWithSentencesArb = fc
  .array(
    fc.tuple(
      fc.array(fc.string({ minLength: 1, maxLength: 15 }).filter(s => s.trim().length > 0 && !/[.!?]/.test(s)), {
        minLength: 1,
        maxLength: 10,
      }),
      fc.constantFrom('.', '!', '?')
    ),
    { minLength: 1, maxLength: 10 }
  )
  .map(sentences => sentences.map(([words, punct]) => words.join(' ') + punct).join(' '));

describe('Property 15: Statistics calculation accuracy', () => {
  /**
   * **Feature: enhanced-grammar-checker, Property 15: Statistics calculation accuracy**
   * **Validates: Requirements 9.1**
   * 
   * wordCount = count of whitespace-separated tokens
   */
  it('wordCount equals count of whitespace-separated tokens', () => {
    fc.assert(
      fc.property(textWithWordsArb, (text) => {
        const stats = calculateStatistics(text);
        const expectedWordCount = text.trim().split(/\s+/).filter(t => t.length > 0).length;
        
        expect(stats.wordCount).toBe(expectedWordCount);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-grammar-checker, Property 15: Statistics calculation accuracy**
   * **Validates: Requirements 9.1**
   * 
   * characterCount = T.length
   */
  it('characterCount equals text length', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 1000 }), (text) => {
        const stats = calculateStatistics(text);
        
        expect(stats.characterCount).toBe(text.length);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-grammar-checker, Property 15: Statistics calculation accuracy**
   * **Validates: Requirements 9.1**
   * 
   * characterCountNoSpaces = T.replace(/\s/g, '').length
   */
  it('characterCountNoSpaces equals text length without whitespace', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 1000 }), (text) => {
        const stats = calculateStatistics(text);
        const expectedNoSpaces = text.replace(/\s/g, '').length;
        
        expect(stats.characterCountNoSpaces).toBe(expectedNoSpaces);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-grammar-checker, Property 15: Statistics calculation accuracy**
   * **Validates: Requirements 9.1**
   * 
   * sentenceCount = count of sentence-ending punctuation
   */
  it('sentenceCount equals count of sentence-ending punctuation', () => {
    fc.assert(
      fc.property(textWithSentencesArb, (text) => {
        const stats = calculateStatistics(text);
        const sentenceEndings = text.match(/[.!?]+/g);
        const expectedSentenceCount = sentenceEndings ? sentenceEndings.length : 0;
        
        expect(stats.sentenceCount).toBe(expectedSentenceCount);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-grammar-checker, Property 15: Statistics calculation accuracy**
   * **Validates: Requirements 9.3**
   * 
   * readingTimeMinutes = Math.ceil(wordCount / 200)
   */
  it('readingTimeMinutes equals ceil of wordCount divided by 200', () => {
    fc.assert(
      fc.property(textWithWordsArb, (text) => {
        const stats = calculateStatistics(text);
        const expectedReadingTime = stats.wordCount > 0 
          ? Math.ceil(stats.wordCount / 200) 
          : 0;
        
        expect(stats.readingTimeMinutes).toBe(expectedReadingTime);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-grammar-checker, Property 15: Statistics calculation accuracy**
   * **Validates: Requirements 9.4**
   * 
   * averageSentenceLength = wordCount / sentenceCount
   */
  it('averageSentenceLength equals wordCount divided by sentenceCount', () => {
    fc.assert(
      fc.property(textWithSentencesArb, (text) => {
        const stats = calculateStatistics(text);
        
        if (stats.sentenceCount > 0) {
          const expectedAvg = stats.wordCount / stats.sentenceCount;
          expect(stats.averageSentenceLength).toBeCloseTo(expectedAvg, 10);
        } else {
          expect(stats.averageSentenceLength).toBe(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Empty text should return zero for all statistics.
   */
  it('empty text returns zero statistics', () => {
    const stats = calculateStatistics('');
    
    expect(stats.wordCount).toBe(0);
    expect(stats.characterCount).toBe(0);
    expect(stats.characterCountNoSpaces).toBe(0);
    expect(stats.sentenceCount).toBe(0);
    expect(stats.paragraphCount).toBe(0);
    expect(stats.averageSentenceLength).toBe(0);
    expect(stats.readingTimeMinutes).toBe(0);
  });

  /**
   * Whitespace-only text should return zero word count.
   */
  it('whitespace-only text returns zero word count', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 50 })
          .map(chars => chars.join('')),
        (text: string) => {
          const stats = calculateStatistics(text);
          
          expect(stats.wordCount).toBe(0);
          expect(stats.characterCount).toBe(text.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
