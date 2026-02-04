/**
 * Philippine Grading System Utilities
 * 
 * Supports multiple grading systems used in Philippine HEIs:
 * 1. DepEd K-12 (75-100 scale with descriptors)
 * 2. CHED/College (1.0-5.0 scale)
 * 3. STI College specific grading scale
 * 
 * Includes transmutation tables for converting raw scores to grades
 */

// ============================================
// TYPES
// ============================================

export interface GradeResult {
    rawScore: number;
    percentageScore: number;
    transmutedGrade: number;      // 75-100 scale
    gradePoint: number;           // 1.0-5.0 scale
    letterGrade: string;          // A, B, C, D, F or numeric equivalent
    descriptor: string;           // Outstanding, Very Satisfactory, etc.
    remarks: 'PASSED' | 'FAILED' | 'INC' | 'DRP';
    equivalentDescription: string; // Detailed description
}

export interface TransmutationRow {
    minPercent: number;
    maxPercent: number;
    transmutedGrade: number;
}

export interface GradeScale {
    minGrade: number;
    maxGrade: number;
    gradePoint: number;
    letterGrade: string;
    descriptor: string;
    description: string;
}

export type GradingSystem = 'deped' | 'ched' | 'sti';

// ============================================
// TRANSMUTATION TABLE (DepEd Standard)
// ============================================
// Converts percentage scores to transmuted grades (75-100)

export const TRANSMUTATION_TABLE: TransmutationRow[] = [
    { minPercent: 100, maxPercent: 100, transmutedGrade: 100 },
    { minPercent: 98.40, maxPercent: 99.99, transmutedGrade: 99 },
    { minPercent: 96.80, maxPercent: 98.39, transmutedGrade: 98 },
    { minPercent: 95.20, maxPercent: 96.79, transmutedGrade: 97 },
    { minPercent: 93.60, maxPercent: 95.19, transmutedGrade: 96 },
    { minPercent: 92.00, maxPercent: 93.59, transmutedGrade: 95 },
    { minPercent: 90.40, maxPercent: 91.99, transmutedGrade: 94 },
    { minPercent: 88.80, maxPercent: 90.39, transmutedGrade: 93 },
    { minPercent: 87.20, maxPercent: 88.79, transmutedGrade: 92 },
    { minPercent: 85.60, maxPercent: 87.19, transmutedGrade: 91 },
    { minPercent: 84.00, maxPercent: 85.59, transmutedGrade: 90 },
    { minPercent: 82.40, maxPercent: 83.99, transmutedGrade: 89 },
    { minPercent: 80.80, maxPercent: 82.39, transmutedGrade: 88 },
    { minPercent: 79.20, maxPercent: 80.79, transmutedGrade: 87 },
    { minPercent: 77.60, maxPercent: 79.19, transmutedGrade: 86 },
    { minPercent: 76.00, maxPercent: 77.59, transmutedGrade: 85 },
    { minPercent: 74.40, maxPercent: 75.99, transmutedGrade: 84 },
    { minPercent: 72.80, maxPercent: 74.39, transmutedGrade: 83 },
    { minPercent: 71.20, maxPercent: 72.79, transmutedGrade: 82 },
    { minPercent: 69.60, maxPercent: 71.19, transmutedGrade: 81 },
    { minPercent: 68.00, maxPercent: 69.59, transmutedGrade: 80 },
    { minPercent: 66.40, maxPercent: 67.99, transmutedGrade: 79 },
    { minPercent: 64.80, maxPercent: 66.39, transmutedGrade: 78 },
    { minPercent: 63.20, maxPercent: 64.79, transmutedGrade: 77 },
    { minPercent: 61.60, maxPercent: 63.19, transmutedGrade: 76 },
    { minPercent: 60.00, maxPercent: 61.59, transmutedGrade: 75 },
    { minPercent: 56.00, maxPercent: 59.99, transmutedGrade: 74 },
    { minPercent: 52.00, maxPercent: 55.99, transmutedGrade: 73 },
    { minPercent: 48.00, maxPercent: 51.99, transmutedGrade: 72 },
    { minPercent: 44.00, maxPercent: 47.99, transmutedGrade: 71 },
    { minPercent: 40.00, maxPercent: 43.99, transmutedGrade: 70 },
    { minPercent: 36.00, maxPercent: 39.99, transmutedGrade: 69 },
    { minPercent: 32.00, maxPercent: 35.99, transmutedGrade: 68 },
    { minPercent: 28.00, maxPercent: 31.99, transmutedGrade: 67 },
    { minPercent: 24.00, maxPercent: 27.99, transmutedGrade: 66 },
    { minPercent: 20.00, maxPercent: 23.99, transmutedGrade: 65 },
    { minPercent: 16.00, maxPercent: 19.99, transmutedGrade: 64 },
    { minPercent: 12.00, maxPercent: 15.99, transmutedGrade: 63 },
    { minPercent: 8.00, maxPercent: 11.99, transmutedGrade: 62 },
    { minPercent: 4.00, maxPercent: 7.99, transmutedGrade: 61 },
    { minPercent: 0, maxPercent: 3.99, transmutedGrade: 60 },
];

// ============================================
// GRADE SCALES
// ============================================

// DepEd K-12 Grading Scale (75-100)
export const DEPED_GRADE_SCALE: GradeScale[] = [
    { minGrade: 90, maxGrade: 100, gradePoint: 1.0, letterGrade: 'O', descriptor: 'Outstanding', description: 'Exceeds expectations consistently' },
    { minGrade: 85, maxGrade: 89, gradePoint: 1.5, letterGrade: 'VS', descriptor: 'Very Satisfactory', description: 'Meets expectations with distinction' },
    { minGrade: 80, maxGrade: 84, gradePoint: 2.0, letterGrade: 'S', descriptor: 'Satisfactory', description: 'Meets expectations adequately' },
    { minGrade: 75, maxGrade: 79, gradePoint: 2.5, letterGrade: 'FS', descriptor: 'Fairly Satisfactory', description: 'Meets minimum expectations' },
    { minGrade: 0, maxGrade: 74, gradePoint: 5.0, letterGrade: 'DND', descriptor: 'Did Not Meet Expectations', description: 'Below passing standard' },
];

// STI College Grading Scale (1.0-5.0)
export const STI_GRADE_SCALE: GradeScale[] = [
    { minGrade: 97, maxGrade: 100, gradePoint: 1.0, letterGrade: '1.0', descriptor: 'Excellent', description: 'Outstanding performance' },
    { minGrade: 94, maxGrade: 96, gradePoint: 1.25, letterGrade: '1.25', descriptor: 'Excellent', description: 'Excellent performance' },
    { minGrade: 91, maxGrade: 93, gradePoint: 1.5, letterGrade: '1.5', descriptor: 'Very Good', description: 'Very good performance' },
    { minGrade: 88, maxGrade: 90, gradePoint: 1.75, letterGrade: '1.75', descriptor: 'Very Good', description: 'Above average performance' },
    { minGrade: 85, maxGrade: 87, gradePoint: 2.0, letterGrade: '2.0', descriptor: 'Good', description: 'Good performance' },
    { minGrade: 82, maxGrade: 84, gradePoint: 2.25, letterGrade: '2.25', descriptor: 'Good', description: 'Satisfactory performance' },
    { minGrade: 79, maxGrade: 81, gradePoint: 2.5, letterGrade: '2.5', descriptor: 'Satisfactory', description: 'Fair performance' },
    { minGrade: 76, maxGrade: 78, gradePoint: 2.75, letterGrade: '2.75', descriptor: 'Satisfactory', description: 'Passing performance' },
    { minGrade: 75, maxGrade: 75, gradePoint: 3.0, letterGrade: '3.0', descriptor: 'Passing', description: 'Minimum passing grade' },
    { minGrade: 0, maxGrade: 74, gradePoint: 5.0, letterGrade: '5.0', descriptor: 'Failed', description: 'Did not meet requirements' },
];

// CHED Standard Grading Scale
export const CHED_GRADE_SCALE: GradeScale[] = [
    { minGrade: 96, maxGrade: 100, gradePoint: 1.0, letterGrade: 'A+', descriptor: 'Excellent', description: 'Superior performance' },
    { minGrade: 93, maxGrade: 95, gradePoint: 1.25, letterGrade: 'A', descriptor: 'Excellent', description: 'Excellent performance' },
    { minGrade: 90, maxGrade: 92, gradePoint: 1.5, letterGrade: 'A-', descriptor: 'Very Good', description: 'Very good performance' },
    { minGrade: 87, maxGrade: 89, gradePoint: 1.75, letterGrade: 'B+', descriptor: 'Very Good', description: 'Above average' },
    { minGrade: 84, maxGrade: 86, gradePoint: 2.0, letterGrade: 'B', descriptor: 'Good', description: 'Good performance' },
    { minGrade: 81, maxGrade: 83, gradePoint: 2.25, letterGrade: 'B-', descriptor: 'Good', description: 'Satisfactory' },
    { minGrade: 78, maxGrade: 80, gradePoint: 2.5, letterGrade: 'C+', descriptor: 'Satisfactory', description: 'Fair performance' },
    { minGrade: 75, maxGrade: 77, gradePoint: 2.75, letterGrade: 'C', descriptor: 'Satisfactory', description: 'Passing' },
    { minGrade: 70, maxGrade: 74, gradePoint: 3.0, letterGrade: 'C-', descriptor: 'Passing', description: 'Conditional' },
    { minGrade: 0, maxGrade: 69, gradePoint: 5.0, letterGrade: 'F', descriptor: 'Failed', description: 'Failed' },
];

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Transmute a percentage score to the 75-100 scale
 */
export function transmuteScore(percentageScore: number): number {
    // Clamp percentage to 0-100
    const clamped = Math.max(0, Math.min(100, percentageScore));
    
    for (const row of TRANSMUTATION_TABLE) {
        if (clamped >= row.minPercent && clamped <= row.maxPercent) {
            return row.transmutedGrade;
        }
    }
    
    return 60; // Minimum grade
}

/**
 * Get grade scale info based on transmuted grade
 */
export function getGradeScale(
    transmutedGrade: number, 
    system: GradingSystem = 'sti'
): GradeScale {
    const scale = system === 'deped' 
        ? DEPED_GRADE_SCALE 
        : system === 'ched' 
            ? CHED_GRADE_SCALE 
            : STI_GRADE_SCALE;
    
    for (const row of scale) {
        if (transmutedGrade >= row.minGrade && transmutedGrade <= row.maxGrade) {
            return row;
        }
    }
    
    // Return failed grade if not found
    return scale[scale.length - 1];
}

/**
 * Calculate complete grade result from raw score
 */
export function calculateGrade(
    rawScore: number,
    maxScore: number,
    system: GradingSystem = 'sti'
): GradeResult {
    // Calculate percentage
    const percentageScore = maxScore > 0 
        ? Math.round((rawScore / maxScore) * 10000) / 100 
        : 0;
    
    // Transmute to 75-100 scale
    const transmutedGrade = transmuteScore(percentageScore);
    
    // Get grade scale info
    const scaleInfo = getGradeScale(transmutedGrade, system);
    
    // Determine pass/fail
    const passingGrade = system === 'ched' ? 70 : 75;
    const remarks: GradeResult['remarks'] = transmutedGrade >= passingGrade ? 'PASSED' : 'FAILED';
    
    return {
        rawScore,
        percentageScore,
        transmutedGrade,
        gradePoint: scaleInfo.gradePoint,
        letterGrade: scaleInfo.letterGrade,
        descriptor: scaleInfo.descriptor,
        remarks,
        equivalentDescription: scaleInfo.description,
    };
}

/**
 * Batch calculate grades for multiple scores
 */
export function calculateGrades(
    scores: { studentId: string; rawScore: number }[],
    maxScore: number,
    system: GradingSystem = 'sti'
): Map<string, GradeResult> {
    const results = new Map<string, GradeResult>();
    
    for (const { studentId, rawScore } of scores) {
        results.set(studentId, calculateGrade(rawScore, maxScore, system));
    }
    
    return results;
}

/**
 * Calculate class statistics with Philippine grading context
 */
export function calculateClassStatistics(
    scores: number[],
    maxScore: number,
    system: GradingSystem = 'sti'
): {
    count: number;
    average: number;
    highest: number;
    lowest: number;
    passingCount: number;
    failingCount: number;
    passingRate: number;
    averageTransmuted: number;
    averageGradePoint: number;
    gradeDistribution: Record<string, number>;
} {
    if (scores.length === 0) {
        return {
            count: 0,
            average: 0,
            highest: 0,
            lowest: 0,
            passingCount: 0,
            failingCount: 0,
            passingRate: 0,
            averageTransmuted: 0,
            averageGradePoint: 0,
            gradeDistribution: {},
        };
    }
    
    const validScores = scores.filter(s => s !== null && s !== undefined);
    const gradeResults = validScores.map(s => calculateGrade(s, maxScore, system));
    
    const passingGrade = system === 'ched' ? 70 : 75;
    const passingCount = gradeResults.filter(g => g.transmutedGrade >= passingGrade).length;
    
    // Calculate grade distribution
    const gradeDistribution: Record<string, number> = {};
    for (const result of gradeResults) {
        const key = result.descriptor;
        gradeDistribution[key] = (gradeDistribution[key] || 0) + 1;
    }
    
    return {
        count: validScores.length,
        average: Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10,
        highest: Math.max(...validScores),
        lowest: Math.min(...validScores),
        passingCount,
        failingCount: validScores.length - passingCount,
        passingRate: Math.round((passingCount / validScores.length) * 1000) / 10,
        averageTransmuted: Math.round(gradeResults.reduce((a, b) => a + b.transmutedGrade, 0) / gradeResults.length * 10) / 10,
        averageGradePoint: Math.round(gradeResults.reduce((a, b) => a + b.gradePoint, 0) / gradeResults.length * 100) / 100,
        gradeDistribution,
    };
}

/**
 * Format grade for display
 */
export function formatGrade(grade: GradeResult, format: 'full' | 'short' | 'gpa' = 'short'): string {
    switch (format) {
        case 'full':
            return `${grade.transmutedGrade} (${grade.letterGrade}) - ${grade.descriptor}`;
        case 'gpa':
            return grade.gradePoint.toFixed(2);
        case 'short':
        default:
            return `${grade.transmutedGrade}`;
    }
}

/**
 * Get color for grade (for UI display)
 */
export function getGradeColor(transmutedGrade: number): string {
    if (transmutedGrade >= 90) return '#10b981'; // Green - Outstanding
    if (transmutedGrade >= 85) return '#3b82f6'; // Blue - Very Satisfactory
    if (transmutedGrade >= 80) return '#8b5cf6'; // Purple - Satisfactory
    if (transmutedGrade >= 75) return '#f59e0b'; // Amber - Fairly Satisfactory
    return '#ef4444'; // Red - Failed
}

/**
 * Get descriptor color
 */
export function getDescriptorColor(descriptor: string): string {
    switch (descriptor.toLowerCase()) {
        case 'excellent':
        case 'outstanding':
            return '#10b981';
        case 'very good':
        case 'very satisfactory':
            return '#3b82f6';
        case 'good':
        case 'satisfactory':
            return '#8b5cf6';
        case 'passing':
        case 'fairly satisfactory':
            return '#f59e0b';
        default:
            return '#ef4444';
    }
}
