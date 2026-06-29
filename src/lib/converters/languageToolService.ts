/**
 * AI Grammar Checker Service (Powered by MiMo / OpenAI Compatible API)
 * 
 * Replaces the traditional LanguageTool with a powerful LLM-based grammar checker.
 */

// ==================== TYPES ====================

// Issue types for color coding
export const IssueCategory = {
    Error: 'error',           // Red - spelling, grammar errors
    Warning: 'warning',       // Yellow - style, improvements
    Info: 'info',            // Blue - punctuation, formatting
} as const;

export type IssueCategoryType = typeof IssueCategory[keyof typeof IssueCategory];

export interface GrammarIssue {
    id: string;
    message: string;
    shortMessage: string;
    original: string;
    offset: number;
    length: number;
    replacements: string[];
    category: IssueCategoryType;
    categoryName: string;
    ruleId: string;
    ruleDescription: string;
}

// ==================== MAIN API FUNCTION ====================

/**
 * Check text for grammar issues using AI
 */
export const checkGrammar = async (
    text: string,
    _language: string = 'en-US'
): Promise<GrammarIssue[]> => {
    if (!text.trim()) {
        return [];
    }

    const apiKey = import.meta.env.VITE_OPENCODE_API_KEY || '';
    const configuredUrl = import.meta.env.VITE_AI_BASE_URL;
    
    // If the URL is missing, or is OpenAI/Opencode directly, we must use the proxy to avoid CORS
    const baseUrl = configuredUrl && configuredUrl !== 'https://api.openai.com/v1/chat/completions' && configuredUrl !== 'https://opencode.ai/zen/v1/chat/completions'
        ? configuredUrl
        : '/api/ai/zen/v1/chat/completions';

    if (!apiKey) {
        throw new Error('API Key missing. Please set VITE_OPENCODE_API_KEY in .env.local');
    }

    const systemPrompt = `You are an expert English grammar checker. Find all spelling, grammar, and style errors in the user's text.
You MUST respond with a JSON object containing an "issues" array.
Format:
{
  "issues": [
    {
      "original": "wrong word or phrase",
      "replacements": ["corrected text"],
      "message": "Brief explanation of the error",
      "category": "error"
    }
  ]
}
Rules:
1. 'original' MUST be the exact case-sensitive substring from the user's text.
2. 'category' must be either "error" or "warning".
3. Keep 'message' under 12 words.
4. If there are absolutely no errors, return {"issues": []}.`;

    try {
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'mimo-v2.5-free', // Using the free tier MiMo model
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: text }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.1,
                max_tokens: 1500 // Increased slightly to allow for multiple issues
            })
        });

        if (!response.ok) {
            throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices[0]?.message?.content || '{"issues": []}';
        
        // Strip markdown if the model hallucinated it
        if (content.startsWith('```json')) {
            content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (content.startsWith('```')) {
            content = content.replace(/^```\n/, '').replace(/\n```$/, '');
        }

        const parsed = JSON.parse(content);
        const aiIssues = parsed.issues || [];

        const issues: GrammarIssue[] = [];
        const usedOffsets = new Set<number>();

        for (const issue of aiIssues) {
            if (!issue.original) continue;

            // Find the offset of the 'original' string in the text.
            // We loop to find an occurrence that hasn't been mapped yet to handle duplicate words.
            let offset = text.indexOf(issue.original, 0);
            while (offset !== -1 && usedOffsets.has(offset)) {
                offset = text.indexOf(issue.original, offset + 1);
            }

            if (offset !== -1) {
                usedOffsets.add(offset);
                issues.push({
                    id: `ai-${offset}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    message: issue.message || 'Suggested improvement',
                    shortMessage: issue.shortMessage || 'AI Suggestion',
                    original: issue.original,
                    offset: offset,
                    length: issue.original.length,
                    replacements: issue.replacements || [],
                    category: issue.category as IssueCategoryType || IssueCategory.Warning,
                    categoryName: issue.category === 'error' ? 'Spelling & Grammar' : 'Style & Clarity',
                    ruleId: issue.ruleId || 'AI_SUGGESTION',
                    ruleDescription: issue.ruleDescription || 'AI Grammar Analysis'
                });
            }
        }

        return issues.sort((a, b) => a.offset - b.offset);

    } catch (error) {
        console.error('AI Grammar API error:', error);
        throw error;
    }
};

/**
 * Apply a fix to the text
 */
export const applyFix = (
    text: string,
    issue: GrammarIssue,
    replacement: string
): string => {
    const before = text.slice(0, issue.offset);
    const after = text.slice(issue.offset + issue.length);
    return before + replacement + after;
};

/**
 * Get API status (Mocked for AI readiness)
 */
export const getLanguageToolStatus = () => {
    return {
        requestsThisMinute: 0,
        maxRequestsPerMinute: 9999,
        timeUntilReset: 0,
        canRequest: true,
    };
};

/**
 * Get color for issue category
 */
export const getCategoryColor = (category: IssueCategoryType): string => {
    switch (category) {
        case IssueCategory.Error:
            return '#ef4444'; // Red
        case IssueCategory.Warning:
            return '#f59e0b'; // Yellow/Amber
        case IssueCategory.Info:
            return '#3b82f6'; // Blue
        default:
            return '#64748b'; // Gray
    }
};

/**
 * Get underline style for issue category
 */
export const getCategoryUnderlineStyle = (category: IssueCategoryType): string => {
    switch (category) {
        case IssueCategory.Error:
            return 'wavy underline #ef4444';
        case IssueCategory.Warning:
            return 'wavy underline #f59e0b';
        case IssueCategory.Info:
            return 'wavy underline #3b82f6';
        default:
            return 'wavy underline #64748b';
    }
};
