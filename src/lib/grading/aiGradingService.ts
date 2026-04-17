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

import { GoogleGenerativeAI } from '@google/generative-ai';

interface GeminiAccount {
    apiKey: string;
    index: number;
}

// Load all API keys from environment
const getGeminiAccounts = (): GeminiAccount[] => {
    const accounts: GeminiAccount[] = [];

    for (let i = 1; i <= 5; i++) {
        const apiKey = import.meta.env[`VITE_GEMINI_API_KEY_${i}`] || '';
        if (apiKey) {
            accounts.push({ apiKey, index: i });
        }
    }

    // Fallback to single key format
    if (accounts.length === 0) {
        const singleKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        if (singleKey) {
            accounts.push({ apiKey: singleKey, index: 1 });
        }
    }

    return accounts;
};

// Track current account index and failed accounts
let currentAccountIndex = 0;
const failedAccounts = new Set<number>();
const STORAGE_KEY = 'gemini_grading_account';

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

GRADING GUIDELINES & ANTI-HALLUCINATION RULES:
1. NEVER INVENT OR GUESS CONTENT. If the submission says "placeholder/mock URL", "Note: Failed to download", or if no text/files are attached, YOU MUST GIVE A SCORE OF 0. 
2. If the submission has no content, your feedback MUST BE exactly: "Your file could not be read or was a corrupted empty upload. Please resubmit your file."
3. Do not blindly praise the student if you did not read actual sentences written by them in the text or attached binary files.
4. Be fair and consistent - grade based ONLY on the actual extracted content or binary files attached.
5. Provide specific, actionable feedback that quotes directly from their work to prove you read it.
6. For programming tasks, look for logic, structure, and problem-solving approach.
7. Maintain an encouraging tone, but do not hallucinate positive qualities that aren't visible in the text.`;

    return prompt;
};

// Call Gemini API
async function callGeminiAPI(
    apiKey: string,
    promptParts: any[]
): Promise<{ success: boolean; data?: AIGradingResult; rateLimited?: boolean; error?: string }> {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.3, // Lower temperature for consistent grading
                responseMimeType: "application/json",
            }
        });

        const result = await model.generateContent(promptParts);
        const response = result.response;
        let content = response.text();

        if (!content) {
            return { success: false, error: 'No response from AI' };
        }

        // Clean up response just in case the model returns markdown despite JSON mime type
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
    } catch (error: any) {
        // Log to console and send the exact error back to the screen
        console.error("Gemini API Error:", error);

        let errorMsg = error instanceof Error ? error.message : 'Unknown Network error';
        if (error?.status) {
            errorMsg += ` (Status: ${error.status})`;
        }

        // Bypassing rate limit hiding so the true error shows up on screen
        return {
            success: false,
            error: `API Error: ${errorMsg}`,
        };
    }
}

/**
 * Grade a single submission using AI
 */
export async function gradeSubmission(request: GradingRequest): Promise<AIGradingResult> {
    const accounts = getGeminiAccounts();

    if (accounts.length === 0) {
        return {
            success: false,
            suggestedScore: 0,
            confidence: 0,
            reasoning: '',
            feedback: '',
            error: 'No GEMINI API keys configured. Add VITE_GEMINI_API_KEY_1 to VITE_GEMINI_API_KEY_5 in your .env.local file.',
        };
    }

    // Reset failed accounts if all have failed
    if (failedAccounts.size >= accounts.length) {
        failedAccounts.clear();
        currentAccountIndex = 0;
    }

    const promptParts: any[] = [];
    let extraText = '';

    if (request.attachments && request.attachments.length > 0) {
        for (const att of request.attachments) {
            if (att.url.includes('pdfobject.com') || att.url.includes('dummy.pdf') || att.url.includes('picsum.photos')) {
                extraText += `\n\n[Note: The file ${att.name} was a placeholder/mock URL and could not be analyzed.]\n`;
                continue;
            }

            try {
                const resp = await fetch(att.url);
                if (!resp.ok) continue;

                const isPdf = att.type.includes('pdf') || att.name.toLowerCase().endsWith('.pdf');
                const isImage = att.type.includes('image') || /\.(png|jpg|jpeg|gif|webp)$/i.test(att.name);
                const isText = att.type.includes('text') || /\.(txt|csv|md|json|html|xml|java|js|ts|py|c|cpp|cs|php|rb|go|rs|sql|css)$/i.test(att.name);

                if (isPdf || isImage) {
                    const blob = await resp.blob();
                    const base64Data = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const result = reader.result as string;
                            resolve(result.split(',')[1]);
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });

                    // Add inline data part for Gemini
                    promptParts.push({
                        inlineData: {
                            data: base64Data,
                            mimeType: isPdf ? 'application/pdf' : (att.type || 'image/jpeg')
                        }
                    });
                    extraText += `\n\n[The file ${att.name} has been attached as binary content for your analysis. Read it before answering!]`;
                } else if (isText) {
                    const text = await resp.text();
                    extraText += `\n\n=== TEXT CONTENTS OF FILE: ${att.name} ===\n`;
                    extraText += text.substring(0, 50000); // 50k char max limit per file to avoid prompt blowing up
                    if (text.length > 50000) extraText += '\n[...CONTENT TRUNCATED FOR LENGTH...]';
                } else {
                    extraText += `\n\n[Note: The file ${att.name} is an unsupported format and its contents could not be extracted.]\n`;
                }
            } catch (err) {
                console.error(`[AI Grading] Failed to fetch attachment ${att.name}:`, err);
                extraText += `\n\n[Note: Failed to download file ${att.name} for analysis.]\n`;
            }
        }
    }

    if (extraText) {
        request.submissionContent += extraText;
    }

    const textPrompt = buildGradingPrompt(request);

    // Most crucial step: push the text prompt to the BEGINNING of the parts array, or at the end.
    // Usually it's better to put files first, then the instruction prompt at the end
    promptParts.push({ text: textPrompt });

    let attempts = 0;
    const maxAttempts = accounts.length;

    while (attempts < maxAttempts) {
        while (failedAccounts.has(currentAccountIndex) && attempts < maxAttempts) {
            currentAccountIndex = (currentAccountIndex + 1) % accounts.length;
            attempts++;
        }

        if (attempts >= maxAttempts) break;

        const account = accounts[currentAccountIndex];
        console.log(`[AI Grading] Using Gemini account ${account.index}`);

        const result = await callGeminiAPI(account.apiKey, promptParts);

        if (result.success && result.data) {
            saveCurrentAccount();
            return {
                ...result.data,
                accountUsed: account.index,
            };
        }

        if (result.rateLimited) {
            console.log(`[AI Grading] Gemini Account ${account.index} rate limited, switching...`);
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
        error: 'All GEMINI accounts have reached their rate limits. Please try again later.',
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
    const accounts = getGeminiAccounts();

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

Respond with ONLY the feedback text, no Markdown blocks or JSON or other formatting.`;

    // Use first available account
    const account = accounts[currentAccountIndex % accounts.length];

    try {
        const genAI = new GoogleGenerativeAI(account.apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.7,
            }
        });

        const result = await model.generateContent(prompt);
        const feedback = result.response.text().trim() || '';

        return { success: true, feedback };
    } catch (error: any) {
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
    return getGeminiAccounts().length > 0;
}

/**
 * Get number of configured accounts
 */
export function getConfiguredAccountCount(): number {
    return getGeminiAccounts().length;
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
