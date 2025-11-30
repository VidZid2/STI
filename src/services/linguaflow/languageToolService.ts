/**
 * LinguaFlow LanguageTool Service
 * Grammar checking using the free LanguageTool API
 * No API key required for basic usage (rate limited to 20 req/min)
 */

import { IssueType } from './types';
import type { Issue, AnalysisResult } from './types';

const LANGUAGE_TOOL_API = 'https://api.languagetool.org/v2/check';

interface LanguageToolMatch {
  message: string;
  shortMessage: string;
  replacements: { value: string }[];
  offset: number;
  length: number;
  context: {
    text: string;
    offset: number;
    length: number;
  };
  rule: {
    id: string;
    description: string;
    category: {
      id: string;
      name: string;
    };
  };
}

interface LanguageToolResponse {
  matches: LanguageToolMatch[];
}

// Map LanguageTool categories to our issue types
function mapCategoryToIssueType(categoryId: string, ruleId: string): IssueType {
  const categoryLower = categoryId.toLowerCase();
  const ruleLower = ruleId.toLowerCase();
  
  // Correctness: spelling, grammar, punctuation, typos
  if (
    categoryLower.includes('typo') ||
    categoryLower.includes('spell') ||
    categoryLower.includes('grammar') ||
    categoryLower.includes('punctuation') ||
    categoryLower.includes('casing') ||
    ruleLower.includes('spell') ||
    ruleLower.includes('typo')
  ) {
    return IssueType.Correctness;
  }
  
  // Clarity: redundancy, wordiness, confused words
  if (
    categoryLower.includes('redundancy') ||
    categoryLower.includes('wordiness') ||
    categoryLower.includes('confused') ||
    categoryLower.includes('plain_english') ||
    categoryLower.includes('clarity')
  ) {
    return IssueType.Clarity;
  }
  
  // Engagement: style, repetition
  if (
    categoryLower.includes('style') ||
    categoryLower.includes('repetition') ||
    categoryLower.includes('colloquial')
  ) {
    return IssueType.Engagement;
  }
  
  // Delivery: tone, formality
  if (
    categoryLower.includes('tone') ||
    categoryLower.includes('formal') ||
    categoryLower.includes('gender')
  ) {
    return IssueType.Delivery;
  }
  
  // Default to correctness for unknown categories
  return IssueType.Correctness;
}

export async function analyzeTextWithLanguageTool(text: string): Promise<AnalysisResult> {
  if (!text.trim()) {
    return createEmptyResult(text);
  }

  try {
    const response = await fetch(LANGUAGE_TOOL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: text,
        language: 'en-US',
        enabledOnly: 'false',
      }),
    });

    if (!response.ok) {
      throw new Error(`LanguageTool API error: ${response.status}`);
    }

    const data: LanguageToolResponse = await response.json();
    return mapResponseToResult(data, text);
  } catch (error) {
    console.error('LanguageTool Analysis Error:', error);
    throw error;
  }
}

function createEmptyResult(text: string): AnalysisResult {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const sentenceCount = (text.match(/[.!?]+/g) || []).length || (text.length > 0 ? 1 : 0);
  
  return {
    issues: [],
    stats: {
      score: text.length > 0 ? 100 : 0,
      wordCount,
      readabilityScore: 100,
      sentenceCount,
      characterCount: text.length,
      readingTimeMinutes: Math.ceil(wordCount / 200),
    }
  };
}

function mapResponseToResult(data: LanguageToolResponse, text: string): AnalysisResult {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const sentenceCount = (text.match(/[.!?]+/g) || []).length || (text.length > 0 ? 1 : 0);
  
  const issues: Issue[] = data.matches.map((match, index) => {
    const original = text.substring(match.offset, match.offset + match.length);
    const replacements = match.replacements
      .slice(0, 5) // Limit to 5 suggestions
      .map(r => r.value)
      .filter(v => v !== original);

    return {
      id: `issue-${index}-${Date.now()}`,
      original,
      replacements,
      type: mapCategoryToIssueType(match.rule.category.id, match.rule.id),
      explanation: match.message,
      contextStart: match.offset,
      contextEnd: match.offset + match.length,
    };
  });

  // Calculate score based on issues (fewer issues = higher score)
  const issuesPenalty = Math.min(issues.length * 3, 50); // Max 50 point penalty
  const score = Math.max(50, 100 - issuesPenalty);
  
  // Simple readability estimate based on sentence length
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  const readabilityScore = avgWordsPerSentence <= 15 ? 90 : 
                          avgWordsPerSentence <= 20 ? 80 :
                          avgWordsPerSentence <= 25 ? 70 : 60;

  return {
    issues,
    stats: {
      score,
      wordCount,
      readabilityScore,
      sentenceCount,
      characterCount: text.length,
      readingTimeMinutes: Math.ceil(wordCount / 200),
    }
  };
}

// No API key needed for basic usage, but these functions maintain compatibility
export function hasApiKey(): boolean {
  return true; // LanguageTool works without API key
}

export function setApiKey(_key: string): void {
  // Optional: store premium API key if user has one
  localStorage.setItem('LANGUAGETOOL_API_KEY', _key);
}

export function clearApiKey(): void {
  localStorage.removeItem('LANGUAGETOOL_API_KEY');
}
