/**
 * Text statistics calculation module.
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import type { TextStatistics } from './types';

/**
 * Average reading speed in words per minute.
 * Used for calculating estimated reading time.
 */
const AVERAGE_READING_SPEED_WPM = 200;

/**
 * Counts the number of words in text.
 * Words are whitespace-separated tokens.
 */
export function countWords(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }
  // Split by whitespace and filter out empty strings
  return text.trim().split(/\s+/).filter(token => token.length > 0).length;
}

/**
 * Counts the total number of characters in text (including spaces).
 */
export function countCharacters(text: string): number {
  return text.length;
}

/**
 * Counts the number of characters excluding spaces.
 */
export function countCharactersNoSpaces(text: string): number {
  return text.replace(/\s/g, '').length;
}

/**
 * Counts the number of sentences in text.
 * Sentences are determined by sentence-ending punctuation: . ! ?
 */
export function countSentences(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }
  // Match sentence-ending punctuation
  const sentenceEndings = text.match(/[.!?]+/g);
  return sentenceEndings ? sentenceEndings.length : 0;
}

/**
 * Counts the number of paragraphs in text.
 * Paragraphs are separated by one or more blank lines.
 */
export function countParagraphs(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }
  // Split by double newlines (or more) and filter out empty paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  // If no double newlines but text exists, it's one paragraph
  return paragraphs.length > 0 ? paragraphs.length : 1;
}

/**
 * Calculates the average sentence length in words.
 */
export function calculateAverageSentenceLength(text: string): number {
  const wordCount = countWords(text);
  const sentenceCount = countSentences(text);
  
  if (sentenceCount === 0) {
    return 0;
  }
  
  return wordCount / sentenceCount;
}

/**
 * Calculates estimated reading time in minutes.
 * Based on average reading speed of 200 words per minute.
 */
export function calculateReadingTime(text: string): number {
  const wordCount = countWords(text);
  if (wordCount === 0) {
    return 0;
  }
  return Math.ceil(wordCount / AVERAGE_READING_SPEED_WPM);
}

/**
 * Calculates complete text statistics.
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */
export function calculateStatistics(text: string): TextStatistics {
  const wordCount = countWords(text);
  const sentenceCount = countSentences(text);
  
  return {
    wordCount,
    characterCount: countCharacters(text),
    characterCountNoSpaces: countCharactersNoSpaces(text),
    sentenceCount,
    paragraphCount: countParagraphs(text),
    averageSentenceLength: sentenceCount > 0 ? wordCount / sentenceCount : 0,
    readingTimeMinutes: wordCount > 0 ? Math.ceil(wordCount / AVERAGE_READING_SPEED_WPM) : 0,
  };
}
