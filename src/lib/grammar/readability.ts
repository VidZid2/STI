/**
 * Readability calculation module.
 * Implements Flesch-Kincaid grade level formula and related metrics.
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import type { ReadabilityMetrics, GrammarIssue } from './types';
import { GRADE_LEVELS } from './types';

/**
 * Threshold for difficult sentences (word count).
 * Sentences exceeding this are flagged as potentially difficult to read.
 */
const DIFFICULT_SENTENCE_THRESHOLD = 25;

/**
 * Threshold for average word length that triggers simplification suggestions.
 */
const COMPLEX_WORD_LENGTH_THRESHOLD = 6;

/**
 * Counts syllables in a word using a heuristic algorithm.
 * This is an approximation based on English language patterns.
 */
export function countSyllables(word: string): number {
  if (!word || word.length === 0) {
    return 0;
  }

  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length === 0) {
    return 0;
  }

  // Special cases for short words
  if (cleanWord.length <= 3) {
    return 1;
  }

  let syllableCount = 0;
  const vowels = 'aeiouy';
  let previousWasVowel = false;

  for (let i = 0; i < cleanWord.length; i++) {
    const isVowel = vowels.includes(cleanWord[i]);
    if (isVowel && !previousWasVowel) {
      syllableCount++;
    }
    previousWasVowel = isVowel;
  }

  // Handle silent 'e' at end
  if (cleanWord.endsWith('e') && syllableCount > 1) {
    syllableCount--;
  }

  // Handle special endings
  if (cleanWord.endsWith('le') && cleanWord.length > 2 && !vowels.includes(cleanWord[cleanWord.length - 3])) {
    syllableCount++;
  }

  // Ensure at least one syllable
  return Math.max(1, syllableCount);
}


/**
 * Counts total syllables in text.
 */
export function countTotalSyllables(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  return words.reduce((total, word) => total + countSyllables(word), 0);
}

/**
 * Gets words from text.
 */
export function getWords(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }
  return text.trim().split(/\s+/).filter(w => w.length > 0);
}

/**
 * Gets sentences from text.
 */
export function getSentences(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }
  // Split by sentence-ending punctuation, keeping the content
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Calculates the Flesch-Kincaid grade level.
 * Formula: 0.39 × (totalWords / totalSentences) + 11.8 × (totalSyllables / totalWords) - 15.59
 * Requirements: 5.1
 */
export function calculateFleschKincaidGrade(text: string): number {
  const words = getWords(text);
  const sentences = getSentences(text);
  
  const totalWords = words.length;
  const totalSentences = sentences.length;
  const totalSyllables = countTotalSyllables(text);

  if (totalWords === 0 || totalSentences === 0) {
    return 0;
  }

  const grade = 0.39 * (totalWords / totalSentences) + 11.8 * (totalSyllables / totalWords) - 15.59;
  
  // Round to one decimal place
  return Math.round(grade * 10) / 10;
}

/**
 * Maps a Flesch-Kincaid grade level to an education level string.
 * Grade is clamped to range [1, 17].
 * Requirements: 5.2
 */
export function getEducationLevel(grade: number): string {
  // Clamp grade to valid range
  const clampedGrade = Math.max(1, Math.min(17, Math.round(grade)));
  return GRADE_LEVELS[clampedGrade] || GRADE_LEVELS[1];
}

/**
 * Calculates average word length in characters.
 */
export function calculateAverageWordLength(text: string): number {
  const words = getWords(text);
  if (words.length === 0) {
    return 0;
  }
  
  // Remove punctuation from words for accurate character count
  const totalChars = words.reduce((sum, word) => {
    const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
    return sum + cleanWord.length;
  }, 0);
  
  return totalChars / words.length;
}


/**
 * Finds indices of sentences that exceed the difficult sentence threshold (>25 words).
 * Requirements: 5.3
 */
export function findDifficultSentences(text: string): number[] {
  const sentences = getSentences(text);
  const difficultIndices: number[] = [];

  sentences.forEach((sentence, index) => {
    const wordCount = getWords(sentence).length;
    if (wordCount > DIFFICULT_SENTENCE_THRESHOLD) {
      difficultIndices.push(index);
    }
  });

  return difficultIndices;
}

/**
 * Calculates complete readability metrics.
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export function calculateReadability(text: string): ReadabilityMetrics {
  const words = getWords(text);
  const sentences = getSentences(text);
  
  const fleschKincaidGrade = calculateFleschKincaidGrade(text);
  const averageWordLength = calculateAverageWordLength(text);
  const averageSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
  
  return {
    fleschKincaidGrade,
    educationLevel: getEducationLevel(fleschKincaidGrade),
    averageSentenceLength,
    averageWordLength,
    difficultSentences: findDifficultSentences(text),
  };
}

/**
 * Generates readability-related issues for text.
 * - Flags sentences with >25 words as difficult to read (Requirements: 5.3)
 * - Suggests simpler alternatives when average word length >6 chars (Requirements: 5.4)
 */
export function generateReadabilityIssues(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = [];
  const sentences = getSentences(text);
  const averageWordLength = calculateAverageWordLength(text);

  // Find difficult sentences and create issues for them
  let currentIndex = 0;
  sentences.forEach((sentence, sentenceIndex) => {
    const wordCount = getWords(sentence).length;
    const sentenceStart = text.indexOf(sentence, currentIndex);
    const sentenceEnd = sentenceStart + sentence.length;
    
    if (wordCount > DIFFICULT_SENTENCE_THRESHOLD) {
      issues.push({
        id: `readability-long-sentence-${sentenceIndex}`,
        type: 'clarity',
        severity: 'warning',
        message: 'Long sentence detected',
        description: `This sentence has ${wordCount} words. Consider breaking it into shorter sentences for better readability.`,
        startIndex: sentenceStart,
        endIndex: sentenceEnd,
        originalText: sentence,
        suggestions: [],
        rule: 'long-sentence',
      });
    }
    
    currentIndex = sentenceEnd;
  });

  // Add issue for complex vocabulary if average word length exceeds threshold
  if (averageWordLength > COMPLEX_WORD_LENGTH_THRESHOLD && text.trim().length > 0) {
    issues.push({
      id: 'readability-complex-vocabulary',
      type: 'clarity',
      severity: 'suggestion',
      message: 'Complex vocabulary detected',
      description: `The average word length is ${averageWordLength.toFixed(1)} characters. Consider using simpler words for better readability.`,
      startIndex: 0,
      endIndex: text.length,
      originalText: text,
      suggestions: [],
      rule: 'complex-vocabulary',
    });
  }

  return issues;
}
