/**
 * AI Grading Types
 * Type definitions for AI-powered grading system
 */

export interface AIGradingResult {
    success: boolean;
    suggestedScore: number;
    confidence: number;        // 0-100
    reasoning: string;         // Why this score
    feedback: string;          // For student
    error?: string;
    accountUsed?: number;
}

export interface RubricCriteriaInput {
    id: string;
    name: string;
    description: string;
    maxPoints: number;
}

export interface RubricScoreResult {
    criteriaId: string;
    score: number;
    reasoning: string;
}

export interface AIRubricGradingResult extends AIGradingResult {
    rubricScores: RubricScoreResult[];
}

export interface GradingRequest {
    submissionContent: string;      // Text content or file description
    taskTitle: string;
    taskDescription: string;
    maxPoints: number;
    rubric?: RubricCriteriaInput[];
    studentName?: string;           // For personalized feedback
}

export interface BatchGradingProgress {
    current: number;
    total: number;
    currentStudent: string;
    completed: string[];
    failed: string[];
}

export interface BatchGradingResult {
    success: boolean;
    gradedCount: number;
    failedCount: number;
    results: Map<string, AIGradingResult>;
}

// Outlier detection types
export type OutlierType = 'exceptional' | 'concerning' | 'plagiarism' | null;

export interface OutlierInfo {
    type: OutlierType;
    reason: string;
    confidence: number;
}
