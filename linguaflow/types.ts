export enum IssueType {
  Correctness = 'correctness', // Grammar, spelling, fact checks
  Clarity = 'clarity',         // Conciseness, readability
  Engagement = 'engagement',   // Vocabulary, variety
  Delivery = 'delivery'        // Tone, politeness
}

export interface Issue {
  id: string;
  original: string;
  replacements: string[]; // Changed to array for multiple options
  type: IssueType;
  explanation: string;
  contextStart?: number; 
  sources?: string[]; // URLs from search grounding
}

export interface AnalysisStats {
  score: number;
  wordCount: number;
  readabilityScore: number;
}