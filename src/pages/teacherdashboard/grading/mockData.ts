/**
 * GradeSubmissionsModal Mock Data
 * Rubric demo data for development and testing
 */

import type { RubricCriteria } from './types';

// ============================================
// DEMO RUBRIC (standalone for testing)
// ============================================
export const DEMO_RUBRIC: RubricCriteria[] = [
    {
        id: 'rubric-1',
        name: 'Content Quality',
        description: 'Accuracy and depth of content',
        points: 40,
        max_points: 40,
        levels: [
            { score: 40, label: 'Excellent', description: 'Comprehensive and accurate' },
            { score: 30, label: 'Good', description: 'Mostly accurate with minor gaps' },
            { score: 20, label: 'Satisfactory', description: 'Basic understanding shown' },
            { score: 10, label: 'Needs Work', description: 'Significant gaps in understanding' },
        ],
    },
    {
        id: 'rubric-2',
        name: 'Organization',
        description: 'Structure and logical flow',
        points: 30,
        max_points: 30,
        levels: [
            { score: 30, label: 'Excellent', description: 'Clear, logical structure' },
            { score: 22, label: 'Good', description: 'Generally well-organized' },
            { score: 15, label: 'Satisfactory', description: 'Some organizational issues' },
            { score: 8, label: 'Needs Work', description: 'Lacks clear structure' },
        ],
    },
    {
        id: 'rubric-3',
        name: 'Presentation',
        description: 'Grammar, formatting, and style',
        points: 30,
        max_points: 30,
        levels: [
            { score: 30, label: 'Excellent', description: 'Professional quality' },
            { score: 22, label: 'Good', description: 'Minor errors only' },
            { score: 15, label: 'Satisfactory', description: 'Several errors present' },
            { score: 8, label: 'Needs Work', description: 'Many errors, needs revision' },
        ],
    },
];
