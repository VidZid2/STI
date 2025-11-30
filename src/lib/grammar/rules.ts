/**
 * Grammar Rules Engine for the Enhanced Grammar Checker.
 * Provides pattern matching with position tracking for inline highlighting.
 * Requirements: 1.1, 1.3, 7.1, 7.2, 7.3, 7.4
 */

import type { GrammarIssue, IssueCategory, IssueSeverity, Correction } from './types';

/**
 * Represents a match found by a rule pattern.
 */
export interface RuleMatch {
  text: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Configuration for an analysis rule.
 */
export interface AnalysisRule {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  pattern: RegExp;
  message: string;
  description: string;
  getSuggestions: (match: string, context: string) => Correction[];
}

/**
 * Generates a unique ID for an issue.
 */
let issueIdCounter = 0;
export function generateIssueId(): string {
  return `issue-${Date.now()}-${++issueIdCounter}`;
}

/**
 * Common typo patterns with corrections.
 * Requirements: 1.1
 */
export const TYPO_RULES: AnalysisRule[] = [
  { id: 'typo-alot', category: 'correctness', severity: 'error', pattern: /\balot\b/gi, message: "Spelling error: 'alot' should be 'a lot'", description: "The word 'alot' is not a valid English word. Use 'a lot' (two words) instead.", getSuggestions: () => [{ text: 'a lot', confidence: 1.0 }] },
  { id: 'typo-definately', category: 'correctness', severity: 'error', pattern: /\b(definately|definatly)\b/gi, message: "Spelling error: should be 'definitely'", description: "Common misspelling of 'definitely'.", getSuggestions: () => [{ text: 'definitely', confidence: 1.0 }] },
  { id: 'typo-seperate', category: 'correctness', severity: 'error', pattern: /\bseperate\b/gi, message: "Spelling error: should be 'separate'", description: "Common misspelling of 'separate'.", getSuggestions: () => [{ text: 'separate', confidence: 1.0 }] },
  { id: 'typo-occured', category: 'correctness', severity: 'error', pattern: /\boccured\b/gi, message: "Spelling error: should be 'occurred'", description: "The word 'occurred' has double 'r'.", getSuggestions: () => [{ text: 'occurred', confidence: 1.0 }] },
  { id: 'typo-recieve', category: 'correctness', severity: 'error', pattern: /\brecieve\b/gi, message: "Spelling error: should be 'receive'", description: "Remember: 'i' before 'e' except after 'c'.", getSuggestions: () => [{ text: 'receive', confidence: 1.0 }] },
  { id: 'typo-irregardless', category: 'correctness', severity: 'error', pattern: /\birregardless\b/gi, message: "Use 'regardless' instead of 'irregardless'", description: "'Irregardless' is nonstandard. Use 'regardless'.", getSuggestions: () => [{ text: 'regardless', confidence: 1.0 }] },
  { id: 'typo-teh', category: 'correctness', severity: 'error', pattern: /\bteh\b/gi, message: "Spelling error: should be 'the'", description: "Common typo for 'the'.", getSuggestions: () => [{ text: 'the', confidence: 1.0 }] },
  { id: 'typo-wierd', category: 'correctness', severity: 'error', pattern: /\bwierd\b/gi, message: "Spelling error: should be 'weird'", description: "Exception to 'i before e' rule.", getSuggestions: () => [{ text: 'weird', confidence: 1.0 }] },
  { id: 'typo-accomodate', category: 'correctness', severity: 'error', pattern: /\baccomodate\b/gi, message: "Spelling error: should be 'accommodate'", description: "'Accommodate' has double 'c' and double 'm'.", getSuggestions: () => [{ text: 'accommodate', confidence: 1.0 }] },
  { id: 'typo-untill', category: 'correctness', severity: 'error', pattern: /\buntill\b/gi, message: "Spelling error: should be 'until'", description: "'Until' has only one 'l'.", getSuggestions: () => [{ text: 'until', confidence: 1.0 }] },
  { id: 'typo-belive', category: 'correctness', severity: 'error', pattern: /\bbelive\b/gi, message: "Spelling error: should be 'believe'", description: "Common misspelling of 'believe'.", getSuggestions: () => [{ text: 'believe', confidence: 1.0 }] },
  { id: 'typo-calender', category: 'correctness', severity: 'error', pattern: /\bcalender\b/gi, message: "Spelling error: should be 'calendar'", description: "Common misspelling of 'calendar'.", getSuggestions: () => [{ text: 'calendar', confidence: 1.0 }] },
  { id: 'typo-collegue', category: 'correctness', severity: 'error', pattern: /\bcollegue\b/gi, message: "Spelling error: should be 'colleague'", description: "Common misspelling of 'colleague'.", getSuggestions: () => [{ text: 'colleague', confidence: 1.0 }] },
  { id: 'typo-comming', category: 'correctness', severity: 'error', pattern: /\bcomming\b/gi, message: "Spelling error: should be 'coming'", description: "'Coming' has only one 'm'.", getSuggestions: () => [{ text: 'coming', confidence: 1.0 }] },
  { id: 'typo-existance', category: 'correctness', severity: 'error', pattern: /\bexistance\b/gi, message: "Spelling error: should be 'existence'", description: "Common misspelling of 'existence'.", getSuggestions: () => [{ text: 'existence', confidence: 1.0 }] },
  { id: 'typo-foreward', category: 'correctness', severity: 'error', pattern: /\b(foreward|foward)\b/gi, message: "Spelling error: should be 'forward'", description: "Common misspelling of 'forward'.", getSuggestions: () => [{ text: 'forward', confidence: 1.0 }] },
  { id: 'typo-goverment', category: 'correctness', severity: 'error', pattern: /\bgoverment\b/gi, message: "Spelling error: should be 'government'", description: "Common misspelling of 'government'.", getSuggestions: () => [{ text: 'government', confidence: 1.0 }] },
  { id: 'typo-knowlege', category: 'correctness', severity: 'error', pattern: /\bknowlege\b/gi, message: "Spelling error: should be 'knowledge'", description: "Common misspelling of 'knowledge'.", getSuggestions: () => [{ text: 'knowledge', confidence: 1.0 }] },
  { id: 'typo-mispell', category: 'correctness', severity: 'error', pattern: /\bmispell\b/gi, message: "Spelling error: should be 'misspell'", description: "'Misspell' has double 's'.", getSuggestions: () => [{ text: 'misspell', confidence: 1.0 }] },
  { id: 'typo-neccessary', category: 'correctness', severity: 'error', pattern: /\bneccessary\b/gi, message: "Spelling error: should be 'necessary'", description: "'Necessary' has one 'c' and double 's'.", getSuggestions: () => [{ text: 'necessary', confidence: 1.0 }] },
  { id: 'typo-publically', category: 'correctness', severity: 'error', pattern: /\bpublically\b/gi, message: "Spelling error: should be 'publicly'", description: "'Publicly' does not have 'al'.", getSuggestions: () => [{ text: 'publicly', confidence: 1.0 }] },
  { id: 'typo-suprise', category: 'correctness', severity: 'error', pattern: /\bsuprise\b/gi, message: "Spelling error: should be 'surprise'", description: "Common misspelling of 'surprise'.", getSuggestions: () => [{ text: 'surprise', confidence: 1.0 }] },
  { id: 'typo-truely', category: 'correctness', severity: 'error', pattern: /\btruely\b/gi, message: "Spelling error: should be 'truly'", description: "'Truly' drops the 'e' from 'true'.", getSuggestions: () => [{ text: 'truly', confidence: 1.0 }] },
  { id: 'typo-wich', category: 'correctness', severity: 'error', pattern: /\bwich\b/gi, message: "Spelling error: should be 'which'", description: "Common typo for 'which'.", getSuggestions: () => [{ text: 'which', confidence: 1.0 }] },
];

/**
 * Missing apostrophe contractions.
 * Requirements: 1.1
 */
export const CONTRACTION_RULES: AnalysisRule[] = [
  { id: 'contraction-wont', category: 'correctness', severity: 'error', pattern: /\bwont\b/g, message: "Missing apostrophe: should be 'won't'", description: "Contraction of 'will not' requires an apostrophe.", getSuggestions: () => [{ text: "won't", confidence: 1.0 }] },
  { id: 'contraction-dont', category: 'correctness', severity: 'error', pattern: /\bdont\b/g, message: "Missing apostrophe: should be 'don't'", description: "Contraction of 'do not' requires an apostrophe.", getSuggestions: () => [{ text: "don't", confidence: 1.0 }] },
  { id: 'contraction-cant', category: 'correctness', severity: 'error', pattern: /\bcant\b/g, message: "Missing apostrophe: should be 'can't'", description: "Contraction of 'cannot' requires an apostrophe.", getSuggestions: () => [{ text: "can't", confidence: 1.0 }] },
  { id: 'contraction-shouldnt', category: 'correctness', severity: 'error', pattern: /\bshouldnt\b/g, message: "Missing apostrophe: should be 'shouldn't'", description: "Contraction of 'should not' requires an apostrophe.", getSuggestions: () => [{ text: "shouldn't", confidence: 1.0 }] },
  { id: 'contraction-couldnt', category: 'correctness', severity: 'error', pattern: /\bcouldnt\b/g, message: "Missing apostrophe: should be 'couldn't'", description: "Contraction of 'could not' requires an apostrophe.", getSuggestions: () => [{ text: "couldn't", confidence: 1.0 }] },
  { id: 'contraction-wouldnt', category: 'correctness', severity: 'error', pattern: /\bwouldnt\b/g, message: "Missing apostrophe: should be 'wouldn't'", description: "Contraction of 'would not' requires an apostrophe.", getSuggestions: () => [{ text: "wouldn't", confidence: 1.0 }] },
  { id: 'contraction-hasnt', category: 'correctness', severity: 'error', pattern: /\bhasnt\b/g, message: "Missing apostrophe: should be 'hasn't'", description: "Contraction of 'has not' requires an apostrophe.", getSuggestions: () => [{ text: "hasn't", confidence: 1.0 }] },
  { id: 'contraction-havent', category: 'correctness', severity: 'error', pattern: /\bhavent\b/g, message: "Missing apostrophe: should be 'haven't'", description: "Contraction of 'have not' requires an apostrophe.", getSuggestions: () => [{ text: "haven't", confidence: 1.0 }] },
  { id: 'contraction-isnt', category: 'correctness', severity: 'error', pattern: /\bisnt\b/g, message: "Missing apostrophe: should be 'isn't'", description: "Contraction of 'is not' requires an apostrophe.", getSuggestions: () => [{ text: "isn't", confidence: 1.0 }] },
  { id: 'contraction-arent', category: 'correctness', severity: 'error', pattern: /\barent\b/g, message: "Missing apostrophe: should be 'aren't'", description: "Contraction of 'are not' requires an apostrophe.", getSuggestions: () => [{ text: "aren't", confidence: 1.0 }] },
  { id: 'contraction-didnt', category: 'correctness', severity: 'error', pattern: /\bdidnt\b/g, message: "Missing apostrophe: should be 'didn't'", description: "Contraction of 'did not' requires an apostrophe.", getSuggestions: () => [{ text: "didn't", confidence: 1.0 }] },
  { id: 'contraction-doesnt', category: 'correctness', severity: 'error', pattern: /\bdoesnt\b/g, message: "Missing apostrophe: should be 'doesn't'", description: "Contraction of 'does not' requires an apostrophe.", getSuggestions: () => [{ text: "doesn't", confidence: 1.0 }] },
];


/**
 * Commonly confused words patterns.
 * Requirements: 1.1
 */
export const CONFUSED_WORDS_RULES: AnalysisRule[] = [
  { id: 'confused-their-there', category: 'correctness', severity: 'warning', pattern: /\b(their|there|they're)\b/gi, message: "Check usage of 'their/there/they're'", description: "'their' (possessive), 'there' (location), 'they're' (they are).", getSuggestions: (match) => { const lower = match.toLowerCase(); return lower === 'their' ? [{ text: 'there', confidence: 0.5 }, { text: "they're", confidence: 0.5 }] : lower === 'there' ? [{ text: 'their', confidence: 0.5 }, { text: "they're", confidence: 0.5 }] : [{ text: 'their', confidence: 0.5 }, { text: 'there', confidence: 0.5 }]; } },
  { id: 'confused-its-its', category: 'correctness', severity: 'warning', pattern: /\b(its|it's)\b/gi, message: "Check usage of 'its' vs 'it's'", description: "'its' (possessive) vs 'it's' (it is).", getSuggestions: (match) => match.toLowerCase() === 'its' ? [{ text: "it's", confidence: 0.7 }] : [{ text: 'its', confidence: 0.7 }] },
  { id: 'confused-your-youre', category: 'correctness', severity: 'warning', pattern: /\b(your|you're)\b/gi, message: "Check usage of 'your' vs 'you're'", description: "'your' (possessive) vs 'you're' (you are).", getSuggestions: (match) => match.toLowerCase() === 'your' ? [{ text: "you're", confidence: 0.7 }] : [{ text: 'your', confidence: 0.7 }] },
  { id: 'confused-affect-effect', category: 'correctness', severity: 'warning', pattern: /\b(affect|effect)\b/gi, message: "Check usage of 'affect' vs 'effect'", description: "'affect' (verb) vs 'effect' (noun, usually).", getSuggestions: (match) => match.toLowerCase() === 'affect' ? [{ text: 'effect', confidence: 0.5 }] : [{ text: 'affect', confidence: 0.5 }] },
  { id: 'confused-then-than', category: 'correctness', severity: 'warning', pattern: /\b(then|than)\b/gi, message: "Check usage of 'then' vs 'than'", description: "'then' (time) vs 'than' (comparison).", getSuggestions: (match) => match.toLowerCase() === 'then' ? [{ text: 'than', confidence: 0.5 }] : [{ text: 'then', confidence: 0.5 }] },
  { id: 'confused-loose-lose', category: 'correctness', severity: 'warning', pattern: /\b(loose|lose)\b/gi, message: "Check usage of 'loose' vs 'lose'", description: "'loose' (not tight) vs 'lose' (misplace).", getSuggestions: (match) => match.toLowerCase() === 'loose' ? [{ text: 'lose', confidence: 0.5 }] : [{ text: 'loose', confidence: 0.5 }] },
  { id: 'confused-to-too-two', category: 'correctness', severity: 'warning', pattern: /\b(to|too|two)\b/gi, message: "Check usage of 'to/too/two'", description: "'to' (direction), 'too' (also/excessive), 'two' (2).", getSuggestions: (match) => { const lower = match.toLowerCase(); return lower === 'to' ? [{ text: 'too', confidence: 0.3 }, { text: 'two', confidence: 0.3 }] : lower === 'too' ? [{ text: 'to', confidence: 0.3 }, { text: 'two', confidence: 0.3 }] : [{ text: 'to', confidence: 0.3 }, { text: 'too', confidence: 0.3 }]; } },
  { id: 'confused-whose-whos', category: 'correctness', severity: 'warning', pattern: /\b(whose|who's)\b/gi, message: "Check usage of 'whose' vs 'who's'", description: "'whose' (possessive) vs 'who's' (who is).", getSuggestions: (match) => match.toLowerCase() === 'whose' ? [{ text: "who's", confidence: 0.7 }] : [{ text: 'whose', confidence: 0.7 }] },
  { id: 'confused-accept-except', category: 'correctness', severity: 'warning', pattern: /\b(accept|except)\b/gi, message: "Check usage of 'accept' vs 'except'", description: "'accept' (receive) vs 'except' (exclude).", getSuggestions: (match) => match.toLowerCase() === 'accept' ? [{ text: 'except', confidence: 0.5 }] : [{ text: 'accept', confidence: 0.5 }] },
];

/**
 * Grammar error patterns.
 * Requirements: 1.1
 */
export const GRAMMAR_RULES: AnalysisRule[] = [
  { id: 'grammar-could-of', category: 'correctness', severity: 'error', pattern: /\b(could|would|should) of\b/gi, message: "Use 'have' instead of 'of'", description: "The correct form is 'could have', 'would have', or 'should have'.", getSuggestions: (match) => [{ text: match.replace(/ of$/i, ' have'), confidence: 1.0 }] },
  { id: 'grammar-lowercase-i', category: 'correctness', severity: 'error', pattern: /\bi\b/g, message: "Capitalize 'I' when referring to yourself", description: "The pronoun 'I' should always be capitalized.", getSuggestions: () => [{ text: 'I', confidence: 1.0 }] },
  { id: 'grammar-double-spaces', category: 'correctness', severity: 'error', pattern: /\s{2,}/g, message: "Multiple consecutive spaces detected", description: "Use single spaces between words.", getSuggestions: () => [{ text: ' ', confidence: 1.0 }] },
  { id: 'grammar-space-before-punct', category: 'correctness', severity: 'error', pattern: /\s+([,.!?;:])/g, message: "Remove space before punctuation", description: "Punctuation should directly follow the preceding word.", getSuggestions: (match) => [{ text: match.trim(), confidence: 1.0 }] },
];


/**
 * Wordy phrase patterns for clarity improvements.
 * Requirements: 7.2
 */
export const WORDY_PHRASE_RULES: AnalysisRule[] = [
  { id: 'wordy-in-order-to', category: 'clarity', severity: 'suggestion', pattern: /\bin order to\b/gi, message: "Wordy phrase: consider using 'to'", description: "'In order to' can usually be simplified to 'to'.", getSuggestions: () => [{ text: 'to', confidence: 0.9 }] },
  { id: 'wordy-due-to-fact', category: 'clarity', severity: 'suggestion', pattern: /\bdue to the fact that\b/gi, message: "Wordy phrase: consider using 'because'", description: "'Due to the fact that' can be simplified to 'because'.", getSuggestions: () => [{ text: 'because', confidence: 0.9 }] },
  { id: 'wordy-at-this-point', category: 'clarity', severity: 'suggestion', pattern: /\bat this point in time\b/gi, message: "Wordy phrase: consider using 'now'", description: "'At this point in time' can be simplified to 'now'.", getSuggestions: () => [{ text: 'now', confidence: 0.9 }] },
  { id: 'wordy-utilize', category: 'clarity', severity: 'suggestion', pattern: /\butilize\b/gi, message: "Consider using 'use' instead of 'utilize'", description: "'Use' is simpler and more direct than 'utilize'.", getSuggestions: () => [{ text: 'use', confidence: 0.8 }] },
  { id: 'wordy-a-number-of', category: 'clarity', severity: 'suggestion', pattern: /\ba number of\b/gi, message: "Wordy phrase: consider 'many' or 'some'", description: "'A number of' can often be replaced with 'many' or 'some'.", getSuggestions: () => [{ text: 'many', confidence: 0.7 }, { text: 'some', confidence: 0.7 }] },
  { id: 'wordy-absolutely-essential', category: 'clarity', severity: 'suggestion', pattern: /\babsolutely essential\b/gi, message: "Redundant: 'essential' implies absolute", description: "'Essential' already means absolutely necessary.", getSuggestions: () => [{ text: 'essential', confidence: 0.9 }] },
  { id: 'wordy-advance-planning', category: 'clarity', severity: 'suggestion', pattern: /\badvance planning\b/gi, message: "Redundant: planning is done in advance", description: "Planning inherently involves looking ahead.", getSuggestions: () => [{ text: 'planning', confidence: 0.9 }] },
  { id: 'wordy-ask-question', category: 'clarity', severity: 'suggestion', pattern: /\bask the question\b/gi, message: "Redundant: 'ask' implies a question", description: "Simply use 'ask' without 'the question'.", getSuggestions: () => [{ text: 'ask', confidence: 0.9 }] },
  { id: 'wordy-at-later-date', category: 'clarity', severity: 'suggestion', pattern: /\bat a later date\b/gi, message: "Wordy phrase: consider using 'later'", description: "'At a later date' can be simplified to 'later'.", getSuggestions: () => [{ text: 'later', confidence: 0.9 }] },
  { id: 'wordy-basic-fundamentals', category: 'clarity', severity: 'suggestion', pattern: /\bbasic fundamentals\b/gi, message: "Redundant: fundamentals are basic by definition", description: "Use either 'basics' or 'fundamentals'.", getSuggestions: () => [{ text: 'fundamentals', confidence: 0.9 }, { text: 'basics', confidence: 0.9 }] },
  { id: 'wordy-completely-eliminate', category: 'clarity', severity: 'suggestion', pattern: /\bcompletely eliminate\b/gi, message: "Redundant: 'eliminate' implies completeness", description: "'Eliminate' already means to remove completely.", getSuggestions: () => [{ text: 'eliminate', confidence: 0.9 }] },
  { id: 'wordy-during-course', category: 'clarity', severity: 'suggestion', pattern: /\bduring the course of\b/gi, message: "Wordy phrase: consider using 'during'", description: "'During the course of' can be simplified to 'during'.", getSuggestions: () => [{ text: 'during', confidence: 0.9 }] },
  { id: 'wordy-end-result', category: 'clarity', severity: 'suggestion', pattern: /\bend result\b/gi, message: "Redundant: 'result' implies the end", description: "A result is already the end of a process.", getSuggestions: () => [{ text: 'result', confidence: 0.9 }] },
  { id: 'wordy-future-plans', category: 'clarity', severity: 'suggestion', pattern: /\bfuture plans\b/gi, message: "Redundant: plans are for the future", description: "Plans inherently refer to the future.", getSuggestions: () => [{ text: 'plans', confidence: 0.9 }] },
  { id: 'wordy-past-history', category: 'clarity', severity: 'suggestion', pattern: /\bpast history\b/gi, message: "Redundant: history is in the past", description: "History by definition refers to the past.", getSuggestions: () => [{ text: 'history', confidence: 0.9 }] },
];

/**
 * Cliché patterns for engagement improvements.
 * Requirements: 7.3
 */
export const CLICHE_RULES: AnalysisRule[] = [
  { id: 'cliche-at-end-of-day', category: 'engagement', severity: 'suggestion', pattern: /\bat the end of the day\b/gi, message: "Cliché detected: 'at the end of the day'", description: "Consider a more original expression like 'ultimately' or 'in conclusion'.", getSuggestions: () => [{ text: 'ultimately', confidence: 0.7 }, { text: 'in conclusion', confidence: 0.7 }] },
  { id: 'cliche-think-outside-box', category: 'engagement', severity: 'suggestion', pattern: /\bthink outside the box\b/gi, message: "Cliché detected: 'think outside the box'", description: "Consider 'be creative' or 'innovate'.", getSuggestions: () => [{ text: 'be creative', confidence: 0.7 }, { text: 'innovate', confidence: 0.7 }] },
  { id: 'cliche-low-hanging-fruit', category: 'engagement', severity: 'suggestion', pattern: /\blow[- ]hanging fruit\b/gi, message: "Cliché detected: 'low-hanging fruit'", description: "Consider 'easy wins' or 'quick opportunities'.", getSuggestions: () => [{ text: 'easy wins', confidence: 0.7 }, { text: 'quick opportunities', confidence: 0.7 }] },
  { id: 'cliche-move-needle', category: 'engagement', severity: 'suggestion', pattern: /\bmove the needle\b/gi, message: "Cliché detected: 'move the needle'", description: "Consider 'make progress' or 'have impact'.", getSuggestions: () => [{ text: 'make progress', confidence: 0.7 }, { text: 'have impact', confidence: 0.7 }] },
  { id: 'cliche-synergy', category: 'engagement', severity: 'suggestion', pattern: /\bsynergy\b/gi, message: "Overused business jargon: 'synergy'", description: "Consider 'collaboration' or 'combined effort'.", getSuggestions: () => [{ text: 'collaboration', confidence: 0.7 }, { text: 'combined effort', confidence: 0.7 }] },
  { id: 'cliche-paradigm-shift', category: 'engagement', severity: 'suggestion', pattern: /\bparadigm shift\b/gi, message: "Overused phrase: 'paradigm shift'", description: "Consider 'fundamental change' or 'transformation'.", getSuggestions: () => [{ text: 'fundamental change', confidence: 0.7 }, { text: 'transformation', confidence: 0.7 }] },
  { id: 'cliche-game-changer', category: 'engagement', severity: 'suggestion', pattern: /\bgame[- ]changer\b/gi, message: "Cliché detected: 'game-changer'", description: "Consider 'breakthrough' or 'significant development'.", getSuggestions: () => [{ text: 'breakthrough', confidence: 0.7 }, { text: 'significant development', confidence: 0.7 }] },
  { id: 'cliche-best-practice', category: 'engagement', severity: 'suggestion', pattern: /\bbest practice[s]?\b/gi, message: "Overused phrase: 'best practice(s)'", description: "Consider 'recommended approach' or 'proven method'.", getSuggestions: () => [{ text: 'recommended approach', confidence: 0.7 }, { text: 'proven method', confidence: 0.7 }] },
];


/**
 * Passive voice detection pattern.
 * Requirements: 7.1
 */
export const PASSIVE_VOICE_RULES: AnalysisRule[] = [
  { id: 'passive-voice', category: 'delivery', severity: 'suggestion', pattern: /\b(is|are|was|were|be|been|being)\s+(being\s+)?(\w+ed|written|done|made|taken|given|shown|known|seen|found|told|thought|felt|left|kept|held|brought|bought|caught|taught|sought|fought|meant|sent|spent|built|lent|lost|met|paid|said|sold|stood|understood|won|wound|woken|worn|woven|written)\b/gi, message: "Consider using active voice", description: "Passive voice can make writing less direct. Consider rephrasing with active voice.", getSuggestions: () => [{ text: '[rephrase with active voice]', confidence: 0.5, description: 'Identify the actor and make them the subject' }] },
];

/**
 * Inconsistent number formatting patterns.
 * Requirements: 7.4
 */
export const NUMBER_FORMAT_RULES: AnalysisRule[] = [
  { id: 'number-mixed-format', category: 'delivery', severity: 'suggestion', pattern: /\b(\d+)\b.*\b(one|two|three|four|five|six|seven|eight|nine|ten)\b|\b(one|two|three|four|five|six|seven|eight|nine|ten)\b.*\b(\d+)\b/gi, message: "Inconsistent number formatting detected", description: "Consider using consistent number formatting (all digits or all words).", getSuggestions: () => [{ text: '[use consistent format]', confidence: 0.6, description: 'Use either all digits or all words for numbers' }] },
];

/**
 * Weak adjective patterns for engagement.
 * Requirements: 7.2
 */
export const WEAK_ADJECTIVE_RULES: AnalysisRule[] = [
  { id: 'weak-very-good', category: 'engagement', severity: 'suggestion', pattern: /\bvery good\b/gi, message: "Weak phrase: consider 'excellent'", description: "'Very good' can be replaced with a stronger word.", getSuggestions: () => [{ text: 'excellent', confidence: 0.8 }, { text: 'outstanding', confidence: 0.7 }] },
  { id: 'weak-very-bad', category: 'engagement', severity: 'suggestion', pattern: /\bvery bad\b/gi, message: "Weak phrase: consider 'terrible'", description: "'Very bad' can be replaced with a stronger word.", getSuggestions: () => [{ text: 'terrible', confidence: 0.8 }, { text: 'awful', confidence: 0.7 }] },
  { id: 'weak-very-happy', category: 'engagement', severity: 'suggestion', pattern: /\bvery happy\b/gi, message: "Weak phrase: consider 'ecstatic'", description: "'Very happy' can be replaced with a stronger word.", getSuggestions: () => [{ text: 'ecstatic', confidence: 0.8 }, { text: 'delighted', confidence: 0.7 }] },
  { id: 'weak-very-sad', category: 'engagement', severity: 'suggestion', pattern: /\bvery sad\b/gi, message: "Weak phrase: consider 'devastated'", description: "'Very sad' can be replaced with a stronger word.", getSuggestions: () => [{ text: 'devastated', confidence: 0.8 }, { text: 'heartbroken', confidence: 0.7 }] },
  { id: 'weak-very-big', category: 'engagement', severity: 'suggestion', pattern: /\bvery big\b/gi, message: "Weak phrase: consider 'massive'", description: "'Very big' can be replaced with a stronger word.", getSuggestions: () => [{ text: 'massive', confidence: 0.8 }, { text: 'enormous', confidence: 0.7 }] },
  { id: 'weak-very-small', category: 'engagement', severity: 'suggestion', pattern: /\bvery small\b/gi, message: "Weak phrase: consider 'tiny'", description: "'Very small' can be replaced with a stronger word.", getSuggestions: () => [{ text: 'tiny', confidence: 0.8 }, { text: 'minuscule', confidence: 0.7 }] },
];

/**
 * All rules combined for easy access.
 */
export const ALL_RULES: AnalysisRule[] = [
  ...TYPO_RULES,
  ...CONTRACTION_RULES,
  ...CONFUSED_WORDS_RULES,
  ...GRAMMAR_RULES,
  ...WORDY_PHRASE_RULES,
  ...CLICHE_RULES,
  ...PASSIVE_VOICE_RULES,
  ...NUMBER_FORMAT_RULES,
  ...WEAK_ADJECTIVE_RULES,
];

/**
 * Find all matches of a pattern in text with position tracking.
 * Requirements: 1.1 (position tracking for inline highlights)
 */
export function findMatches(text: string, pattern: RegExp): RuleMatch[] {
  const matches: RuleMatch[] = [];
  // Create a new RegExp with global flag to ensure we can iterate
  const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
  
  let match: RegExpExecArray | null;
  while ((match = globalPattern.exec(text)) !== null) {
    matches.push({
      text: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }
  
  return matches;
}

/**
 * Apply a single rule to text and return all issues found.
 * Requirements: 1.1, 1.3
 */
export function applyRule(text: string, rule: AnalysisRule): GrammarIssue[] {
  const matches = findMatches(text, rule.pattern);
  
  return matches.map((match) => ({
    id: generateIssueId(),
    type: rule.category,
    severity: rule.severity,
    message: rule.message,
    description: rule.description,
    startIndex: match.startIndex,
    endIndex: match.endIndex,
    originalText: match.text,
    suggestions: rule.getSuggestions(match.text, text),
    rule: rule.id,
  }));
}

/**
 * Apply all rules to text and return all issues found.
 * Requirements: 1.1, 1.3
 */
export function analyzeWithRules(text: string, rules: AnalysisRule[] = ALL_RULES): GrammarIssue[] {
  const allIssues: GrammarIssue[] = [];
  
  for (const rule of rules) {
    const issues = applyRule(text, rule);
    allIssues.push(...issues);
  }
  
  // Sort by position for consistent ordering
  allIssues.sort((a, b) => a.startIndex - b.startIndex);
  
  return allIssues;
}

/**
 * Get issues filtered by category.
 */
export function getIssuesByCategory(issues: GrammarIssue[], category: IssueCategory): GrammarIssue[] {
  return issues.filter((issue) => issue.type === category);
}

/**
 * Get count of issues per category.
 */
export function getIssueCounts(issues: GrammarIssue[]): Record<IssueCategory, number> {
  return {
    correctness: issues.filter((i) => i.type === 'correctness').length,
    clarity: issues.filter((i) => i.type === 'clarity').length,
    engagement: issues.filter((i) => i.type === 'engagement').length,
    delivery: issues.filter((i) => i.type === 'delivery').length,
  };
}
