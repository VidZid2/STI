/**
 * AI Grading Service
 * Multi-Account GROQ API integration for intelligent grading
 * Uses same rotation pattern as groqService.ts (5 accounts × 14,400 req/day = 72,000 req/day FREE)
 * 
 * Enhanced Features:
 * - Text content analysis from submissions
 * - File content extraction support
 * - Rubric-based grading
 * - Batch grading with progress tracking
 */

import type { AIGradingResult, GradingRequest, RubricCriteriaInput } from './types';

// ============================================
// Content Extraction Utilities
// ============================================

/**
 * Extract readable content from submission for AI analysis
 * Handles text content, file descriptions, and attachment metadata
 */
export function extractSubmissionContent(submission: {
    textContent?: string;
    attachments?: Array<{ name: string; type: string; url: string; textContent?: string }>;
}): string {
    const parts: string[] = [];

    // Add direct text content if available
    if (submission.textContent && submission.textContent.trim()) {
        parts.push('=== STUDENT WRITTEN RESPONSE ===');
        parts.push(submission.textContent.trim());
    }

    // Add attachment information
    if (submission.attachments && submission.attachments.length > 0) {
        parts.push('\n=== SUBMITTED FILES ===');
        
        submission.attachments.forEach((file, index) => {
            parts.push(`\nFile ${index + 1}: ${file.name}`);
            parts.push(`Type: ${file.type}`);
            
            // If text content was extracted from the file
            if (file.textContent && file.textContent.trim()) {
                parts.push('Content:');
                // Limit content length to avoid token limits
                const content = file.textContent.trim();
                const maxLength = 3000;
                if (content.length > maxLength) {
                    parts.push(content.substring(0, maxLength) + '\n[Content truncated for analysis...]');
                } else {
                    parts.push(content);
                }
            }
        });
    }

    // If no content at all
    if (parts.length === 0) {
        return '[No content submitted - student did not provide text or files]';
    }

    return parts.join('\n');
}

/**
 * Analyze submission quality based on content
 */
export function analyzeSubmissionQuality(content: string): {
    hasContent: boolean;
    wordCount: number;
    hasFiles: boolean;
    contentType: 'text' | 'files' | 'both' | 'none';
} {
    const hasTextContent = content.includes('STUDENT WRITTEN RESPONSE');
    const hasFiles = content.includes('SUBMITTED FILES');
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

    return {
        hasContent: hasTextContent || hasFiles,
        wordCount,
        hasFiles,
        contentType: hasTextContent && hasFiles ? 'both' 
            : hasTextContent ? 'text' 
            : hasFiles ? 'files' 
            : 'none',
    };
}

interface GroqAccount {
    apiKey: string;
    index: number;
}

// Load all API keys from environment
const getGroqAccounts = (): GroqAccount[] => {
    const accounts: GroqAccount[] = [];
    
    for (let i = 1; i <= 5; i++) {
        const apiKey = import.meta.env[`VITE_GROQ_API_KEY_${i}`] || '';
        if (apiKey) {
            accounts.push({ apiKey, index: i });
        }
    }
    
    // Fallback to single key format
    if (accounts.length === 0) {
        const singleKey = import.meta.env.VITE_GROQ_API_KEY || '';
        if (singleKey) {
            accounts.push({ apiKey: singleKey, index: 1 });
        }
    }
    
    return accounts;
};

// Track current account index and failed accounts
let currentAccountIndex = 0;
const failedAccounts = new Set<number>();
const STORAGE_KEY = 'groq_grading_account';

// Load saved account index
const loadCurrentAccount = (): void => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            currentAccountIndex = parseInt(saved, 10) || 0;
        }
    } catch {
        currentAccountIndex = 0;
    }
};

const saveCurrentAccount = (): void => {
    try {
        localStorage.setItem(STORAGE_KEY, currentAccountIndex.toString());
    } catch {
        // Ignore
    }
};

loadCurrentAccount();

// Build grading prompt
const buildGradingPrompt = (request: GradingRequest): string => {
    // Analyze the submission content
    const quality = analyzeSubmissionQuality(request.submissionContent);
    
    let prompt = `You are an expert academic grader for a Philippine college. Analyze this student submission and provide a fair, constructive evaluation.

TASK INFORMATION:
- Title: ${request.taskTitle}
- Description: ${request.taskDescription}
- Maximum Points: ${request.maxPoints}
${request.studentName ? `- Student: ${request.studentName}` : ''}

SUBMISSION ANALYSIS:
- Content Type: ${quality.contentType}
- Word Count: ${quality.wordCount}
- Has Attachments: ${quality.hasFiles ? 'Yes' : 'No'}

STUDENT SUBMISSION:
${request.submissionContent}
`;

    if (request.rubric && request.rubric.length > 0) {
        prompt += `\nGRADING RUBRIC:\n`;
        request.rubric.forEach((r: RubricCriteriaInput) => {
            prompt += `- ${r.name} (${r.maxPoints} pts): ${r.description}\n`;
        });
    }

    prompt += `
RESPOND IN THIS EXACT JSON FORMAT (no markdown, just raw JSON):
{
    "score": <number between 0 and ${request.maxPoints}>,
    "confidence": <number between 0 and 100>,
    "reasoning": "<2-3 sentences explaining why you gave this score>",
    "feedback": "<constructive feedback for the student, 80-150 words, encouraging and specific>"
}

GRADING GUIDELINES:
1. Be fair and consistent - grade based on content quality and task requirements
2. If no content is submitted, give a low score (0-20%) with feedback to submit work
3. If only file names are visible (no extracted text), grade conservatively (40-60%) and note that full content wasn't available
4. Provide specific, actionable feedback that helps the student improve
5. Maintain an encouraging, professional tone appropriate for Filipino college students
6. Consider effort and attempt even if the answer isn't perfect
7. For programming tasks, look for logic, structure, and problem-solving approach`;

    return prompt;
};

// Call GROQ API
async function callGroqAPI(
    apiKey: string,
    prompt: string
): Promise<{ success: boolean; data?: AIGradingResult; rateLimited?: boolean; error?: string }> {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert academic grader. Always respond with valid JSON only, no markdown formatting.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.3, // Lower temperature for consistent grading
                max_tokens: 500,
            }),
        });

        // Check for rate limiting
        if (response.status === 429) {
            return { success: false, rateLimited: true, error: 'Rate limit exceeded' };
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const isRateLimit = errorData.error?.message?.toLowerCase().includes('rate') ||
                               errorData.error?.message?.toLowerCase().includes('quota');
            return {
                success: false,
                rateLimited: isRateLimit,
                error: errorData.error?.message || `API error: ${response.status}`,
            };
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content?.trim();

        if (!content) {
            return { success: false, error: 'No response from API' };
        }

        // Clean up response - remove markdown code blocks if present
        content = content
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();

        // Parse JSON response
        try {
            const parsed = JSON.parse(content);
            return {
                success: true,
                data: {
                    success: true,
                    suggestedScore: Math.min(Math.max(0, parsed.score || 0), 100),
                    confidence: Math.min(Math.max(0, parsed.confidence || 70), 100),
                    reasoning: parsed.reasoning || 'Score based on submission quality.',
                    feedback: parsed.feedback || 'Please review your submission.',
                },
            };
        } catch {
            return { success: false, error: 'Failed to parse AI response' };
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

/**
 * Grade a single submission using AI
 */
export async function gradeSubmission(request: GradingRequest): Promise<AIGradingResult> {
    const accounts = getGroqAccounts();
    
    if (accounts.length === 0) {
        return {
            success: false,
            suggestedScore: 0,
            confidence: 0,
            reasoning: '',
            feedback: '',
            error: 'No GROQ API keys configured. Add VITE_GROQ_API_KEY_1 to VITE_GROQ_API_KEY_5 in your .env.local file.',
        };
    }

    // Reset failed accounts if all have failed
    if (failedAccounts.size >= accounts.length) {
        failedAccounts.clear();
        currentAccountIndex = 0;
    }

    const prompt = buildGradingPrompt(request);
    let attempts = 0;
    const maxAttempts = accounts.length;

    while (attempts < maxAttempts) {
        while (failedAccounts.has(currentAccountIndex) && attempts < maxAttempts) {
            currentAccountIndex = (currentAccountIndex + 1) % accounts.length;
            attempts++;
        }

        if (attempts >= maxAttempts) break;

        const account = accounts[currentAccountIndex];
        console.log(`[AI Grading] Using account ${account.index}`);

        const result = await callGroqAPI(account.apiKey, prompt);

        if (result.success && result.data) {
            saveCurrentAccount();
            return {
                ...result.data,
                accountUsed: account.index,
            };
        }

        if (result.rateLimited) {
            console.log(`[AI Grading] Account ${account.index} rate limited, switching...`);
            failedAccounts.add(currentAccountIndex);
            currentAccountIndex = (currentAccountIndex + 1) % accounts.length;
            saveCurrentAccount();
            attempts++;
            continue;
        }

        return {
            success: false,
            suggestedScore: 0,
            confidence: 0,
            reasoning: '',
            feedback: '',
            error: result.error,
        };
    }

    return {
        success: false,
        suggestedScore: 0,
        confidence: 0,
        reasoning: '',
        feedback: '',
        error: 'All GROQ accounts have reached their rate limits. Please try again later.',
    };
}

/**
 * Generate personalized feedback only (without scoring)
 */
export async function generateFeedback(
    submissionContent: string,
    score: number,
    maxPoints: number,
    taskTitle: string
): Promise<{ success: boolean; feedback: string; error?: string }> {
    const accounts = getGroqAccounts();
    
    if (accounts.length === 0) {
        return { success: false, feedback: '', error: 'No API keys configured' };
    }

    const percentage = (score / maxPoints) * 100;
    const prompt = `Generate constructive feedback for a student submission.

TASK: ${taskTitle}
SCORE: ${score}/${maxPoints} (${percentage.toFixed(0)}%)
SUBMISSION CONTENT: ${submissionContent || '[Content not available]'}

Write 50-150 words of personalized, encouraging feedback that:
1. Acknowledges what was done well
2. Suggests specific improvements
3. Maintains a professional, supportive tone

Respond with ONLY the feedback text, no JSON or formatting.`;

    // Use first available account
    const account = accounts[currentAccountIndex % accounts.length];
    
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${account.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 300,
            }),
        });

        if (!response.ok) {
            return { success: false, feedback: '', error: 'API request failed' };
        }

        const data = await response.json();
        const feedback = data.choices?.[0]?.message?.content?.trim() || '';
        
        return { success: true, feedback };
    } catch (error) {
        return { 
            success: false, 
            feedback: '', 
            error: error instanceof Error ? error.message : 'Network error' 
        };
    }
}

/**
 * Check if AI grading is configured
 */
export function isAIGradingConfigured(): boolean {
    return getGroqAccounts().length > 0;
}

/**
 * Get number of configured accounts
 */
export function getConfiguredAccountCount(): number {
    return getGroqAccounts().length;
}

/**
 * Reset failed accounts (useful for retry)
 */
export function resetFailedAccounts(): void {
    failedAccounts.clear();
    currentAccountIndex = 0;
    saveCurrentAccount();
}

/**
 * Batch grade multiple submissions with progress callback
 */
export async function batchGradeSubmissions(
    submissions: Array<{
        id: string;
        studentName: string;
        content: string;
    }>,
    taskInfo: {
        title: string;
        description: string;
        maxPoints: number;
    },
    onProgress?: (current: number, total: number, studentName: string) => void
): Promise<{
    success: boolean;
    results: Map<string, AIGradingResult>;
    gradedCount: number;
    failedCount: number;
}> {
    const results = new Map<string, AIGradingResult>();
    let gradedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < submissions.length; i++) {
        const submission = submissions[i];
        
        // Report progress
        if (onProgress) {
            onProgress(i + 1, submissions.length, submission.studentName);
        }

        try {
            const result = await gradeSubmission({
                submissionContent: submission.content,
                taskTitle: taskInfo.title,
                taskDescription: taskInfo.description,
                maxPoints: taskInfo.maxPoints,
                studentName: submission.studentName,
            });

            results.set(submission.id, result);

            if (result.success) {
                gradedCount++;
            } else {
                failedCount++;
            }

            // Small delay between requests to avoid rate limiting
            if (i < submissions.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        } catch (error) {
            failedCount++;
            results.set(submission.id, {
                success: false,
                suggestedScore: 0,
                confidence: 0,
                reasoning: '',
                feedback: '',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    return {
        success: failedCount === 0,
        results,
        gradedCount,
        failedCount,
    };
}


/**
 * Detect outliers in a set of submissions
 * Identifies exceptional work, concerning submissions, and potential plagiarism
 */
export function detectOutliers(
    submissions: Array<{
        id: string;
        score: number | null;
        maxPoints: number;
        similarityScore?: number;
        isLate?: boolean;
        attachmentCount: number;
    }>,
    classStats?: {
        avgScore: number;
        stdDev: number;
    }
): Map<string, { type: 'exceptional' | 'concerning' | 'plagiarism'; reason: string; confidence: number }> {
    const outliers = new Map<string, { type: 'exceptional' | 'concerning' | 'plagiarism'; reason: string; confidence: number }>();
    
    // Calculate class stats if not provided
    const gradedSubmissions = submissions.filter(s => s.score !== null);
    const scores = gradedSubmissions.map(s => s.score as number);
    
    let avgScore = classStats?.avgScore ?? 0;
    let stdDev = classStats?.stdDev ?? 0;
    
    if (!classStats && scores.length > 0) {
        avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const squaredDiffs = scores.map(s => Math.pow(s - avgScore, 2));
        stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / scores.length);
    }
    
    for (const submission of submissions) {
        // Check for plagiarism first (highest priority)
        if (submission.similarityScore && submission.similarityScore > 30) {
            outliers.set(submission.id, {
                type: 'plagiarism',
                reason: `${submission.similarityScore}% similarity detected`,
                confidence: Math.min(submission.similarityScore, 95),
            });
            continue;
        }
        
        // Only check graded submissions for quality outliers
        if (submission.score === null) continue;
        
        const percentage = (submission.score / submission.maxPoints) * 100;
        
        // Exceptional: Score significantly above average (>1.5 std dev) or perfect/near-perfect
        if (percentage >= 95 || (stdDev > 0 && submission.score > avgScore + 1.5 * stdDev)) {
            outliers.set(submission.id, {
                type: 'exceptional',
                reason: percentage >= 98 ? 'Outstanding performance' : 'Significantly above class average',
                confidence: Math.min(percentage, 95),
            });
            continue;
        }
        
        // Concerning: Score significantly below average (>1.5 std dev) or very low
        if (percentage < 50 || (stdDev > 0 && submission.score < avgScore - 1.5 * stdDev)) {
            let reason = 'Below expectations';
            if (percentage < 40) reason = 'Needs significant improvement';
            if (submission.attachmentCount === 0) reason = 'No files submitted';
            if (submission.isLate) reason = 'Late submission with low score';
            
            outliers.set(submission.id, {
                type: 'concerning',
                reason,
                confidence: Math.max(100 - percentage, 60),
            });
        }
    }
    
    return outliers;
}

/**
 * Get outlier indicator for a single submission
 */
export function getOutlierIndicator(
    score: number | null,
    maxPoints: number,
    similarityScore?: number,
    isLate?: boolean,
    attachmentCount?: number
): { type: 'exceptional' | 'concerning' | 'plagiarism'; reason: string } | null {
    // Plagiarism check
    if (similarityScore && similarityScore > 30) {
        return {
            type: 'plagiarism',
            reason: `${similarityScore}% similarity - review for plagiarism`,
        };
    }
    
    if (score === null) {
        // No files submitted is concerning
        if (attachmentCount === 0) {
            return {
                type: 'concerning',
                reason: 'No files submitted',
            };
        }
        return null;
    }
    
    const percentage = (score / maxPoints) * 100;
    
    // Exceptional
    if (percentage >= 95) {
        return {
            type: 'exceptional',
            reason: percentage >= 98 ? 'Outstanding work!' : 'Excellent performance',
        };
    }
    
    // Concerning
    if (percentage < 50) {
        let reason = 'Needs improvement';
        if (percentage < 40) reason = 'Significant concerns';
        if (isLate) reason = 'Late + low score';
        return {
            type: 'concerning',
            reason,
        };
    }
    
    return null;
}
