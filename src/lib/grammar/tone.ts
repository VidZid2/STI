/**
 * Tone Analysis Module for the Enhanced Grammar Checker.
 * Provides tone detection, percentage breakdown, consistency detection,
 * and inconsistency identification.
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import nlp from 'compromise';
import type {
  ToneAnalysis,
  ToneType,
  ToneBreakdown,
  ToneInconsistency,
  GrammarIssue,
} from './types';
import { generateIssueId } from './rules';

/**
 * All valid tone types.
 */
export const TONE_TYPES: ToneType[] = ['formal', 'informal', 'confident', 'neutral', 'friendly'];

/**
 * Formal tone indicators - words and phrases that suggest formal writing.
 */
const FORMAL_INDICATORS: string[] = [
  'therefore', 'consequently', 'furthermore', 'moreover', 'nevertheless',
  'notwithstanding', 'henceforth', 'hereby', 'whereas', 'whereby',
  'accordingly', 'subsequently', 'thus', 'hence', 'regarding',
  'concerning', 'pertaining', 'pursuant', 'aforementioned', 'herein',
  'shall', 'ought', 'must', 'require', 'necessitate',
  'demonstrate', 'indicate', 'illustrate', 'establish', 'constitute',
  'facilitate', 'implement', 'utilize', 'endeavor', 'commence',
  'terminate', 'ascertain', 'procure', 'substantiate', 'corroborate',
];

/**
 * Informal tone indicators - words and phrases that suggest casual writing.
 */
const INFORMAL_INDICATORS: string[] = [
  'gonna', 'wanna', 'gotta', 'kinda', 'sorta', 'dunno', 'lemme',
  'yeah', 'yep', 'nope', 'okay', 'ok', 'cool', 'awesome', 'stuff',
  'things', 'lots', 'tons', 'super', 'really', 'pretty', 'kind of',
  'sort of', 'like', 'basically', 'actually', 'literally', 'totally',
  'absolutely', 'definitely', 'honestly', 'seriously', 'obviously',
  'hey', 'hi', 'bye', 'thanks', 'cheers', 'lol', 'omg', 'btw',
  "don't", "won't", "can't", "shouldn't", "wouldn't", "couldn't",
  "isn't", "aren't", "wasn't", "weren't", "haven't", "hasn't",
];

/**
 * Confident tone indicators - words that convey certainty and authority.
 */
const CONFIDENT_INDICATORS: string[] = [
  'will', 'must', 'certainly', 'definitely', 'absolutely', 'clearly',
  'undoubtedly', 'unquestionably', 'without doubt', 'assuredly',
  'guaranteed', 'proven', 'established', 'confirmed', 'verified',
  'know', 'believe', 'confident', 'sure', 'certain', 'convinced',
  'determined', 'committed', 'dedicated', 'focused', 'driven',
  'achieve', 'accomplish', 'succeed', 'excel', 'lead', 'dominate',
  'best', 'top', 'premier', 'leading', 'superior', 'exceptional',
  'always', 'never', 'every', 'all', 'none', 'complete', 'total',
];

/**
 * Friendly tone indicators - words that convey warmth and approachability.
 */
const FRIENDLY_INDICATORS: string[] = [
  'please', 'thank', 'thanks', 'appreciate', 'grateful', 'welcome',
  'glad', 'happy', 'delighted', 'pleased', 'excited', 'thrilled',
  'wonderful', 'great', 'fantastic', 'amazing', 'lovely', 'nice',
  'help', 'support', 'assist', 'guide', 'share', 'together',
  'we', 'us', 'our', 'team', 'community', 'family', 'friends',
  'hope', 'wish', 'look forward', 'enjoy', 'love', 'care',
  'feel free', 'no problem', 'of course', 'happy to', 'glad to',
  'smile', 'laugh', 'fun', 'joy', 'warm', 'kind', 'gentle',
];


/**
 * Sentence-level tone detection result.
 */
interface SentenceTone {
  text: string;
  startIndex: number;
  endIndex: number;
  tone: ToneType;
  scores: Record<ToneType, number>;
}

/**
 * Count occurrences of indicator words in text.
 */
function countIndicators(text: string, indicators: string[]): number {
  const lowerText = text.toLowerCase();
  let count = 0;
  
  for (const indicator of indicators) {
    // Use word boundary matching for accurate counting
    const pattern = new RegExp(`\\b${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = lowerText.match(pattern);
    if (matches) {
      count += matches.length;
    }
  }
  
  return count;
}

/**
 * Calculate tone scores for a piece of text.
 * Returns raw scores (not normalized to 100%).
 * 
 * The scoring algorithm:
 * - Each tone indicator word found adds to that tone's score
 * - Neutral score is only assigned when no other tone indicators are found
 * - This ensures that text with clear tone indicators is properly classified
 */
function calculateToneScores(text: string): Record<ToneType, number> {
  const formalScore = countIndicators(text, FORMAL_INDICATORS);
  const informalScore = countIndicators(text, INFORMAL_INDICATORS);
  const confidentScore = countIndicators(text, CONFIDENT_INDICATORS);
  const friendlyScore = countIndicators(text, FRIENDLY_INDICATORS);
  
  // Total non-neutral indicators found
  const totalIndicators = formalScore + informalScore + confidentScore + friendlyScore;
  
  // Neutral score: only significant when no other indicators are present
  // If there are tone indicators, neutral gets a minimal score
  // If there are no tone indicators, neutral gets a base score
  let neutralScore: number;
  if (totalIndicators === 0) {
    // No tone indicators found - this is neutral text
    neutralScore = 1;
  } else {
    // Some tone indicators found - neutral should not dominate
    neutralScore = 0;
  }
  
  return {
    formal: formalScore,
    informal: informalScore,
    confident: confidentScore,
    neutral: neutralScore,
    friendly: friendlyScore,
  };
}

/**
 * Normalize scores to percentages that sum to 100.
 */
function normalizeToPercentages(scores: Record<ToneType, number>): ToneBreakdown[] {
  const total = Object.values(scores).reduce((sum, val) => sum + val, 0);
  
  if (total === 0) {
    // Default to 100% neutral if no indicators found
    return TONE_TYPES.map(tone => ({
      tone,
      percentage: tone === 'neutral' ? 100 : 0,
    }));
  }
  
  // Calculate raw percentages
  const rawPercentages = TONE_TYPES.map(tone => ({
    tone,
    percentage: Math.round((scores[tone] / total) * 100),
  }));
  
  // Adjust for rounding errors to ensure sum is exactly 100
  const sum = rawPercentages.reduce((s, b) => s + b.percentage, 0);
  if (sum !== 100) {
    // Find the largest percentage and adjust it
    const maxEntry = rawPercentages.reduce((max, curr) => 
      curr.percentage > max.percentage ? curr : max
    );
    maxEntry.percentage += (100 - sum);
  }
  
  return rawPercentages;
}

/**
 * Determine the dominant tone from scores.
 */
function getDominantTone(scores: Record<ToneType, number>): ToneType {
  let maxTone: ToneType = 'neutral';
  let maxScore = -1;
  
  for (const tone of TONE_TYPES) {
    if (scores[tone] > maxScore) {
      maxScore = scores[tone];
      maxTone = tone;
    }
  }
  
  return maxTone;
}

/**
 * Split text into sentences with position tracking.
 */
function getSentencesWithPositions(text: string): Array<{ text: string; startIndex: number; endIndex: number }> {
  const sentences: Array<{ text: string; startIndex: number; endIndex: number }> = [];
  
  // Use compromise for sentence detection
  const doc = nlp(text);
  const sentenceTexts = doc.sentences().out('array') as string[];
  
  let currentIndex = 0;
  for (const sentenceText of sentenceTexts) {
    const startIndex = text.indexOf(sentenceText, currentIndex);
    if (startIndex !== -1) {
      sentences.push({
        text: sentenceText,
        startIndex,
        endIndex: startIndex + sentenceText.length,
      });
      currentIndex = startIndex + sentenceText.length;
    }
  }
  
  return sentences;
}

/**
 * Analyze tone for each sentence.
 */
function analyzeSentenceTones(text: string): SentenceTone[] {
  const sentences = getSentencesWithPositions(text);
  
  return sentences.map(sentence => {
    const scores = calculateToneScores(sentence.text);
    return {
      text: sentence.text,
      startIndex: sentence.startIndex,
      endIndex: sentence.endIndex,
      tone: getDominantTone(scores),
      scores,
    };
  });
}

/**
 * Detect tone inconsistencies in the text.
 * Requirements: 6.4
 */
function detectInconsistencies(
  sentenceTones: SentenceTone[],
  dominantTone: ToneType
): ToneInconsistency[] {
  const inconsistencies: ToneInconsistency[] = [];
  
  for (const sentence of sentenceTones) {
    // Only flag as inconsistent if the sentence has a clearly different tone
    // and it's not neutral (neutral is compatible with everything)
    if (sentence.tone !== dominantTone && 
        sentence.tone !== 'neutral' && 
        dominantTone !== 'neutral') {
      // Check if the tone is significantly different
      const dominantScore = sentence.scores[dominantTone];
      const detectedScore = sentence.scores[sentence.tone];
      
      // Only flag if the detected tone is stronger than the dominant tone in this sentence
      if (detectedScore > dominantScore) {
        inconsistencies.push({
          startIndex: sentence.startIndex,
          endIndex: sentence.endIndex,
          detectedTone: sentence.tone,
          expectedTone: dominantTone,
        });
      }
    }
  }
  
  return inconsistencies;
}


/**
 * Analyze the tone of text.
 * Requirements: 6.1, 6.2, 6.4
 * 
 * @param text - The text to analyze
 * @returns ToneAnalysis with dominant tone, breakdown, consistency, and inconsistencies
 */
export function analyzeTone(text: string): ToneAnalysis {
  // Handle empty or whitespace-only text
  if (!text || text.trim().length === 0) {
    return {
      dominant: 'neutral',
      breakdown: TONE_TYPES.map(tone => ({
        tone,
        percentage: tone === 'neutral' ? 100 : 0,
      })),
      isConsistent: true,
      inconsistencies: [],
    };
  }
  
  // Calculate overall tone scores
  const overallScores = calculateToneScores(text);
  const dominant = getDominantTone(overallScores);
  const breakdown = normalizeToPercentages(overallScores);
  
  // Analyze sentence-level tones for consistency detection
  const sentenceTones = analyzeSentenceTones(text);
  const inconsistencies = detectInconsistencies(sentenceTones, dominant);
  
  // Text is consistent if there are no significant inconsistencies
  const isConsistent = inconsistencies.length === 0;
  
  return {
    dominant,
    breakdown,
    isConsistent,
    inconsistencies,
  };
}

/**
 * Generate tone-related grammar issues for suggestions.
 * Requirements: 6.3, 6.4
 * 
 * @param text - The text to analyze
 * @returns Array of GrammarIssue for tone-related suggestions
 */
export function generateToneIssues(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = [];
  const analysis = analyzeTone(text);
  
  // Generate issues for tone inconsistencies
  for (const inconsistency of analysis.inconsistencies) {
    const inconsistentText = text.substring(inconsistency.startIndex, inconsistency.endIndex);
    const truncatedText = inconsistentText.length > 50 
      ? inconsistentText.substring(0, 50) + '...' 
      : inconsistentText;
    
    issues.push({
      id: generateIssueId(),
      type: 'delivery',
      severity: 'suggestion',
      message: `Tone inconsistency: ${inconsistency.detectedTone} tone in ${analysis.dominant} text`,
      description: `This sentence has a ${inconsistency.detectedTone} tone, but the overall text is ${analysis.dominant}. Consider adjusting for consistency.`,
      startIndex: inconsistency.startIndex,
      endIndex: inconsistency.endIndex,
      originalText: truncatedText,
      suggestions: getToneSuggestions(inconsistency.detectedTone, inconsistency.expectedTone),
      rule: 'tone-inconsistency',
    });
  }
  
  return issues;
}

/**
 * Get suggestions for adjusting tone.
 * Requirements: 6.3
 */
function getToneSuggestions(
  currentTone: ToneType,
  targetTone: ToneType
): Array<{ text: string; confidence: number; description?: string }> {
  const suggestions: Array<{ text: string; confidence: number; description?: string }> = [];
  
  if (currentTone === 'informal' && targetTone === 'formal') {
    suggestions.push({
      text: '[rephrase formally]',
      confidence: 0.6,
      description: 'Replace contractions and casual words with formal alternatives',
    });
  } else if (currentTone === 'formal' && targetTone === 'informal') {
    suggestions.push({
      text: '[rephrase casually]',
      confidence: 0.6,
      description: 'Use contractions and simpler words for a more casual tone',
    });
  } else if (currentTone === 'confident' && targetTone !== 'confident') {
    suggestions.push({
      text: '[soften language]',
      confidence: 0.6,
      description: 'Use hedging words like "may", "might", "could" to soften assertions',
    });
  } else if (targetTone === 'friendly') {
    suggestions.push({
      text: '[add warmth]',
      confidence: 0.6,
      description: 'Add personal pronouns and positive language',
    });
  } else {
    suggestions.push({
      text: '[adjust tone]',
      confidence: 0.5,
      description: `Rephrase to match the ${targetTone} tone of the rest of the text`,
    });
  }
  
  return suggestions;
}

/**
 * Check if text has mixed tones (for Property 12 testing).
 * Returns true if the text contains sentences with detectably different tones.
 */
export function hasMixedTones(text: string): boolean {
  const sentenceTones = analyzeSentenceTones(text);
  
  if (sentenceTones.length < 2) {
    return false;
  }
  
  // Get unique non-neutral tones
  const uniqueTones = new Set<ToneType>();
  for (const sentence of sentenceTones) {
    if (sentence.tone !== 'neutral') {
      uniqueTones.add(sentence.tone);
    }
  }
  
  // Mixed tones if we have more than one distinct non-neutral tone
  return uniqueTones.size > 1;
}

/**
 * Get tone analysis for a specific sentence.
 * Useful for detailed analysis and testing.
 */
export function analyzeSentenceTone(sentence: string): {
  tone: ToneType;
  scores: Record<ToneType, number>;
  breakdown: ToneBreakdown[];
} {
  const scores = calculateToneScores(sentence);
  const tone = getDominantTone(scores);
  const breakdown = normalizeToPercentages(scores);
  
  return { tone, scores, breakdown };
}

/**
 * Validate that a ToneAnalysis object is well-formed.
 * Used for property-based testing.
 */
export function isValidToneAnalysis(analysis: ToneAnalysis): boolean {
  // Check dominant tone is valid
  if (!TONE_TYPES.includes(analysis.dominant)) {
    return false;
  }
  
  // Check breakdown has all tone types
  if (analysis.breakdown.length !== TONE_TYPES.length) {
    return false;
  }
  
  // Check all tones are represented
  const breakdownTones = new Set(analysis.breakdown.map(b => b.tone));
  for (const tone of TONE_TYPES) {
    if (!breakdownTones.has(tone)) {
      return false;
    }
  }
  
  // Check percentages sum to 100
  const sum = analysis.breakdown.reduce((s, b) => s + b.percentage, 0);
  if (sum !== 100) {
    return false;
  }
  
  // Check all percentages are non-negative
  for (const b of analysis.breakdown) {
    if (b.percentage < 0) {
      return false;
    }
  }
  
  return true;
}
