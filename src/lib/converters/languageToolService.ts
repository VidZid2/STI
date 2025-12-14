/**
 * LanguageTool API Service
 * 
 * Free grammar checking API with:
 * - 20 requests per minute
 * - 75,000 characters per minute
 * - 20,000 characters per request
 * - No API key required for basic usage!
 */

// ==================== TYPES ====================

export interface LanguageToolMatch {
    message: string;
    shortMessage: string;
    offset: number;
    length: number;
    replacements: { value: string }[];
    context: {
        text: string;
        offset: number;
        length: number;
    };
    rule: {
        id: string;
        description: string;
        issueType: string;
        category: {
            id: string;
            name: string;
        };
    };
}

export interface LanguageToolResponse {
    software: {
        name: string;
        version: string;
    };
    language: {
        name: string;
        code: string;
    };
    matches: LanguageToolMatch[];
}

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

// ==================== API CONFIGURATION ====================

const LANGUAGETOOL_API_URL = 'https://api.languagetool.org/v2/check';

// Rate limiting tracker
let lastRequestTime = 0;
let requestsThisMinute = 0;
let minuteStartTime = Date.now();

const REQUESTS_PER_MINUTE = 20;
const MIN_REQUEST_INTERVAL = 3000; // 3 seconds between requests

/**
 * Check if we can make a request (rate limiting)
 */
const canMakeRequest = (): boolean => {
    const now = Date.now();

    // Reset counter every minute
    if (now - minuteStartTime > 60000) {
        minuteStartTime = now;
        requestsThisMinute = 0;
    }

    // Check if we've exceeded the rate limit
    if (requestsThisMinute >= REQUESTS_PER_MINUTE) {
        return false;
    }

    // Check minimum interval between requests
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
        return false;
    }

    return true;
};

/**
 * Wait for rate limit to clear
 */
const waitForRateLimit = async (): Promise<void> => {
    const now = Date.now();

    // If we've exceeded requests this minute, wait for next minute
    if (requestsThisMinute >= REQUESTS_PER_MINUTE) {
        const waitTime = 60000 - (now - minuteStartTime) + 1000;
        console.log(`Rate limited, waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        minuteStartTime = Date.now();
        requestsThisMinute = 0;
    }

    // Wait for minimum interval
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
};

// ==================== CATEGORY MAPPING ====================

/**
 * Map LanguageTool category to our issue category
 */
const mapCategory = (categoryId: string, issueType: string): IssueCategoryType => {
    // Spelling and grammar errors = Red
    if (categoryId === 'TYPOS' ||
        categoryId === 'MISSPELLING' ||
        categoryId === 'GRAMMAR' ||
        issueType === 'misspelling' ||
        issueType === 'grammar') {
        return IssueCategory.Error;
    }

    // Style and improvements = Yellow
    if (categoryId === 'STYLE' ||
        categoryId === 'REDUNDANCY' ||
        categoryId === 'CONFUSED_WORDS' ||
        categoryId === 'CASING' ||
        issueType === 'style' ||
        issueType === 'locale-violation') {
        return IssueCategory.Warning;
    }

    // Punctuation and typography = Blue
    if (categoryId === 'PUNCTUATION' ||
        categoryId === 'TYPOGRAPHY' ||
        categoryId === 'COMPOUNDING' ||
        issueType === 'typographical') {
        return IssueCategory.Info;
    }

    // Default to warning
    return IssueCategory.Warning;
};

// ==================== MAIN API FUNCTION ====================

/**
 * Check text for grammar issues using LanguageTool API
 */
export const checkGrammar = async (
    text: string,
    language: string = 'en-US'
): Promise<GrammarIssue[]> => {
    if (!text.trim()) {
        return [];
    }

    // Enforce character limit (20,000 chars max)
    const truncatedText = text.slice(0, 20000);

    // Wait for rate limit if needed
    await waitForRateLimit();

    // Track request
    lastRequestTime = Date.now();
    requestsThisMinute++;

    console.log(`LanguageTool: Checking ${truncatedText.length} characters...`);

    try {
        const formData = new URLSearchParams();
        formData.append('text', truncatedText);
        formData.append('language', language);
        formData.append('enabledOnly', 'false');

        const response = await fetch(LANGUAGETOOL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            body: formData,
        });

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please wait a moment and try again.');
            }
            throw new Error(`LanguageTool API error: ${response.status}`);
        }

        const data: LanguageToolResponse = await response.json();

        console.log(`LanguageTool: Found ${data.matches.length} issues`);

        // Map to our issue format
        const issues: GrammarIssue[] = data.matches.map((match, index) => ({
            id: `lt-${index}-${match.offset}`,
            message: match.message,
            shortMessage: match.shortMessage || match.rule.description,
            original: truncatedText.slice(match.offset, match.offset + match.length),
            offset: match.offset,
            length: match.length,
            replacements: match.replacements.slice(0, 5).map(r => r.value),
            category: mapCategory(match.rule.category.id, match.rule.issueType),
            categoryName: match.rule.category.name,
            ruleId: match.rule.id,
            ruleDescription: match.rule.description,
        }));

        return issues;

    } catch (error) {
        console.error('LanguageTool API error:', error);
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
 * Get API status
 */
export const getLanguageToolStatus = () => {
    const now = Date.now();
    const timeUntilReset = Math.max(0, 60000 - (now - minuteStartTime));

    return {
        requestsThisMinute,
        maxRequestsPerMinute: REQUESTS_PER_MINUTE,
        timeUntilReset: Math.ceil(timeUntilReset / 1000),
        canRequest: canMakeRequest(),
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
