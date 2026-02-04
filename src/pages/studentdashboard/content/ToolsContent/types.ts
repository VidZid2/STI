/**
 * ToolsContent Types
 * TypeScript type definitions for the tools content component
 */

import type { TextStats } from '../../lib/converters/textAnalysis';

// Re-export for convenience
export type { TextStats };

// Tool definition
export interface Tool {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: React.ReactNode;
    accept: string;
    multiple: boolean;
    linkTo?: string;
    onClick?: () => void;
    tutorial?: ToolTutorial;
}

export interface ToolTutorial {
    title: string;
    steps: string[];
    tip: string;
}

// Analysis results
export interface AnalysisResult {
    type: 'count' | 'grammar' | 'compress';
    data: AnalysisData;
}

export interface AnalysisData {
    words?: number;
    chars?: number;
    readingTime?: string;
    issues?: string[];
    originalText?: string;
    textStats?: TextStats;
    originalSize?: string;
    compressedSize?: string;
    savings?: string;
    savingsPercent?: number;
}

// Confetti animation
export interface ConfettiPiece {
    id: number;
    x: number;
    color: string;
    delay: number;
    rotation: number;
}

// Tool categories
export type ToolCategory = 'converters' | 'writing' | 'research' | 'all';

// Filter state
export interface ToolsFilterState {
    category: ToolCategory;
    searchQuery: string;
}
