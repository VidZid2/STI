/**
 * Advanced Writing Checks using compromise NLP.
 * Provides passive voice detection, wordy phrase detection, cliché detection,
 * and inconsistent formatting detection.
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import nlp from 'compromise';
import type { GrammarIssue } from './types';
import { generateIssueId } from './rules';

/**
 * Detect passive voice constructions using compromise NLP.
 * Requirements: 7.1
 */
export function detectPassiveVoice(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = [];
  const doc = nlp(text);
  
  // Common passive voice patterns: "be" verb + past participle
  const passivePatterns = [
    { pattern: '#Copula #PastTense', description: 'is/was/were + past participle' },
    { pattern: '#Copula being #PastTense', description: 'is/was being + past participle' },
    { pattern: 'has been #PastTense', description: 'has been + past participle' },
    { pattern: 'have been #PastTense', description: 'have been + past participle' },
    { pattern: 'had been #PastTense', description: 'had been + past participle' },
    { pattern: 'will be #PastTense', description: 'will be + past participle' },
  ];

  for (const { pattern } of passivePatterns) {
    const matches = doc.match(pattern);
    const matchesJson = matches.json();
    
    for (const matchData of matchesJson) {
      const matchText = matchData.text;
      // Find the position in the original text
      const startIndex = text.indexOf(matchText);
      
      if (startIndex !== -1) {
        issues.push({
          id: generateIssueId(),
          type: 'delivery',
          severity: 'suggestion',
          message: 'Consider using active voice',
          description: 'Passive voice can make writing less direct. Consider rephrasing with active voice.',
          startIndex,
          endIndex: startIndex + matchText.length,
          originalText: matchText,
          suggestions: [
            {
              text: '[rephrase with active voice]',
              confidence: 0.5,
              description: 'Identify the actor and make them the subject',
            },
          ],
          rule: 'passive-voice-nlp',
        });
      }
    }
  }

  return issues;
}

/**
 * Wordy phrases with their concise alternatives.
 * Requirements: 7.2
 */
const WORDY_PHRASES: Array<{ phrase: string; alternatives: string[] }> = [
  { phrase: 'in order to', alternatives: ['to'] },
  { phrase: 'due to the fact that', alternatives: ['because'] },
  { phrase: 'at this point in time', alternatives: ['now'] },
  { phrase: 'in the event that', alternatives: ['if'] },
  { phrase: 'for the purpose of', alternatives: ['to', 'for'] },
  { phrase: 'in spite of the fact that', alternatives: ['although', 'despite'] },
  { phrase: 'with regard to', alternatives: ['about', 'regarding'] },
  { phrase: 'in the near future', alternatives: ['soon'] },
  { phrase: 'at the present time', alternatives: ['now', 'currently'] },
  { phrase: 'in close proximity to', alternatives: ['near'] },
  { phrase: 'a large number of', alternatives: ['many'] },
  { phrase: 'a small number of', alternatives: ['few'] },
  { phrase: 'on a daily basis', alternatives: ['daily'] },
  { phrase: 'on a regular basis', alternatives: ['regularly'] },
  { phrase: 'in the process of', alternatives: ['currently'] },
  { phrase: 'has the ability to', alternatives: ['can'] },
  { phrase: 'is able to', alternatives: ['can'] },
  { phrase: 'make a decision', alternatives: ['decide'] },
  { phrase: 'take into consideration', alternatives: ['consider'] },
  { phrase: 'give consideration to', alternatives: ['consider'] },
];

/**
 * Detect wordy phrases and suggest concise alternatives.
 * Requirements: 7.2
 */
export function detectWordyPhrases(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = [];
  const lowerText = text.toLowerCase();

  for (const { phrase, alternatives } of WORDY_PHRASES) {
    let startIndex = 0;
    let foundIndex: number;

    while ((foundIndex = lowerText.indexOf(phrase, startIndex)) !== -1) {
      const originalText = text.substring(foundIndex, foundIndex + phrase.length);
      
      issues.push({
        id: generateIssueId(),
        type: 'clarity',
        severity: 'suggestion',
        message: `Wordy phrase: consider using '${alternatives[0]}'`,
        description: `'${phrase}' can be simplified to '${alternatives.join("' or '")}'.`,
        startIndex: foundIndex,
        endIndex: foundIndex + phrase.length,
        originalText,
        suggestions: alternatives.map((alt) => ({
          text: alt,
          confidence: 0.8,
        })),
        rule: `wordy-${phrase.replace(/\s+/g, '-')}`,
      });

      startIndex = foundIndex + phrase.length;
    }
  }

  return issues;
}

/**
 * Common clichés with original alternatives.
 * Requirements: 7.3
 */
const CLICHES: Array<{ phrase: string; alternatives: string[] }> = [
  { phrase: 'at the end of the day', alternatives: ['ultimately', 'in conclusion'] },
  { phrase: 'think outside the box', alternatives: ['be creative', 'innovate'] },
  { phrase: 'low-hanging fruit', alternatives: ['easy wins', 'quick opportunities'] },
  { phrase: 'move the needle', alternatives: ['make progress', 'have impact'] },
  { phrase: 'hit the ground running', alternatives: ['start quickly', 'begin immediately'] },
  { phrase: 'take it to the next level', alternatives: ['improve', 'advance'] },
  { phrase: 'give 110 percent', alternatives: ['work hard', 'do your best'] },
  { phrase: 'push the envelope', alternatives: ['innovate', 'challenge limits'] },
  { phrase: 'circle back', alternatives: ['revisit', 'return to'] },
  { phrase: 'touch base', alternatives: ['contact', 'check in'] },
  { phrase: 'deep dive', alternatives: ['thorough analysis', 'detailed examination'] },
  { phrase: 'bandwidth', alternatives: ['capacity', 'availability'] },
  { phrase: 'leverage', alternatives: ['use', 'utilize'] },
  { phrase: 'synergy', alternatives: ['collaboration', 'combined effort'] },
  { phrase: 'paradigm shift', alternatives: ['fundamental change', 'transformation'] },
  { phrase: 'game changer', alternatives: ['breakthrough', 'significant development'] },
  { phrase: 'best practices', alternatives: ['recommended approaches', 'proven methods'] },
  { phrase: 'win-win', alternatives: ['mutually beneficial', 'advantageous for all'] },
  { phrase: 'on the same page', alternatives: ['in agreement', 'aligned'] },
  { phrase: 'drill down', alternatives: ['examine closely', 'analyze in detail'] },
];

/**
 * Detect clichés and suggest original alternatives.
 * Requirements: 7.3
 */
export function detectCliches(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = [];
  const lowerText = text.toLowerCase();

  for (const { phrase, alternatives } of CLICHES) {
    let startIndex = 0;
    let foundIndex: number;

    while ((foundIndex = lowerText.indexOf(phrase, startIndex)) !== -1) {
      const originalText = text.substring(foundIndex, foundIndex + phrase.length);
      
      issues.push({
        id: generateIssueId(),
        type: 'engagement',
        severity: 'suggestion',
        message: `Cliché detected: '${phrase}'`,
        description: `Consider a more original expression like '${alternatives.join("' or '")}'.`,
        startIndex: foundIndex,
        endIndex: foundIndex + phrase.length,
        originalText,
        suggestions: alternatives.map((alt) => ({
          text: alt,
          confidence: 0.7,
        })),
        rule: `cliche-${phrase.replace(/\s+/g, '-')}`,
      });

      startIndex = foundIndex + phrase.length;
    }
  }

  return issues;
}


/**
 * Number words for detecting inconsistent formatting.
 */
const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4,
  five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20,
};

/**
 * Detect inconsistent number formatting (mixing digits and words).
 * Requirements: 7.4
 */
export function detectInconsistentNumberFormatting(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = [];
  
  // Find all digit numbers (1-20 range for comparison)
  const digitPattern = /\b([1-9]|1[0-9]|20)\b/g;
  const digitMatches: Array<{ value: number; index: number; text: string }> = [];
  let match: RegExpExecArray | null;
  
  while ((match = digitPattern.exec(text)) !== null) {
    digitMatches.push({
      value: parseInt(match[0], 10),
      index: match.index,
      text: match[0],
    });
  }
  
  // Find all word numbers
  const wordPattern = /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/gi;
  const wordMatches: Array<{ value: number; index: number; text: string }> = [];
  
  while ((match = wordPattern.exec(text)) !== null) {
    const word = match[0].toLowerCase();
    wordMatches.push({
      value: NUMBER_WORDS[word],
      index: match.index,
      text: match[0],
    });
  }
  
  // If we have both digit and word numbers, flag inconsistency
  if (digitMatches.length > 0 && wordMatches.length > 0) {
    // Flag the minority format (whichever has fewer occurrences)
    const flagDigits = digitMatches.length <= wordMatches.length;
    const matchesToFlag = flagDigits ? digitMatches : wordMatches;
    
    for (const m of matchesToFlag) {
      issues.push({
        id: generateIssueId(),
        type: 'delivery',
        severity: 'suggestion',
        message: 'Inconsistent number formatting detected',
        description: 'Consider using consistent number formatting (all digits or all words) throughout your text.',
        startIndex: m.index,
        endIndex: m.index + m.text.length,
        originalText: m.text,
        suggestions: flagDigits
          ? [{ text: numberToWord(m.value), confidence: 0.6 }]
          : [{ text: String(m.value), confidence: 0.6 }],
        rule: 'inconsistent-number-format',
      });
    }
  }
  
  return issues;
}

/**
 * Convert a number to its word representation.
 */
function numberToWord(num: number): string {
  const words = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
    'seventeen', 'eighteen', 'nineteen', 'twenty',
  ];
  return words[num] || String(num);
}

/**
 * Run all advanced writing checks on text.
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
export function runAdvancedChecks(text: string): GrammarIssue[] {
  const allIssues: GrammarIssue[] = [];
  
  // Run all advanced checks
  allIssues.push(...detectPassiveVoice(text));
  allIssues.push(...detectWordyPhrases(text));
  allIssues.push(...detectCliches(text));
  allIssues.push(...detectInconsistentNumberFormatting(text));
  
  // Sort by position
  allIssues.sort((a, b) => a.startIndex - b.startIndex);
  
  return allIssues;
}

/**
 * Detect sentences that are too long (readability issue).
 * This complements the readability module.
 */
export function detectLongSentences(text: string, maxWords: number = 25): GrammarIssue[] {
  const issues: GrammarIssue[] = [];
  const doc = nlp(text);
  const sentencesJson = doc.sentences().json();
  
  let currentIndex = 0;
  
  for (const sentenceData of sentencesJson) {
    const sentenceText = sentenceData.text;
    const wordCount = sentenceData.terms?.length || sentenceText.split(/\s+/).length;
    
    // Find the sentence position in the original text
    const startIndex = text.indexOf(sentenceText, currentIndex);
    
    if (wordCount > maxWords && startIndex !== -1) {
      issues.push({
        id: generateIssueId(),
        type: 'clarity',
        severity: 'warning',
        message: `Long sentence (${wordCount} words)`,
        description: `This sentence has ${wordCount} words. Consider breaking it into shorter sentences for better readability.`,
        startIndex,
        endIndex: startIndex + sentenceText.length,
        originalText: sentenceText.substring(0, 50) + (sentenceText.length > 50 ? '...' : ''),
        suggestions: [
          {
            text: '[split into shorter sentences]',
            confidence: 0.5,
            description: 'Break this sentence into two or more shorter sentences',
          },
        ],
        rule: 'long-sentence',
      });
    }
    
    if (startIndex !== -1) {
      currentIndex = startIndex + sentenceText.length;
    }
  }
  
  return issues;
}
