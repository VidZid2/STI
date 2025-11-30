/**
 * LinguaFlow Types
 * AI-powered grammar checking types using Gemini
 */

export const IssueType = {
  Correctness: 'correctness',
  Clarity: 'clarity',
  Engagement: 'engagement',
  Delivery: 'delivery'
} as const;

export type IssueType = typeof IssueType[keyof typeof IssueType];

export interface Issue {
  id: string;
  original: string;
  replacements: string[];
  type: IssueType;
  explanation: string;
  contextStart?: number;
  contextEnd?: number;
  sources?: string[]; // URLs from search grounding
}

export interface AnalysisStats {
  score: number;
  wordCount: number;
  readabilityScore: number;
  sentenceCount: number;
  characterCount: number;
  readingTimeMinutes: number;
}

export interface AnalysisResult {
  issues: Issue[];
  stats: AnalysisStats;
}
