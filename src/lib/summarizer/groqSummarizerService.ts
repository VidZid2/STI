/**
 * Groq API Service for Text Summarization
 * Multi-Account Rotation System: 5 accounts × 14,400 req/day = 72,000 req/day FREE!
 * Uses Llama 3.1 8B - Fast and high quality
 */

export type SummaryLength = 'short' | 'medium' | 'long';

interface SummarizeResult {
    success: boolean;
    text: string;
    error?: string;
    accountUsed?: number;
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
const STORAGE_KEY = 'groq_summarizer_account';

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

const lengthPrompts: Record<SummaryLength, string> = {
    short: 'Provide a very concise summary (2-3 sentences max) capturing only the absolute most crucial thesis or takeaway.',
    medium: 'Provide a structured summary (1 quick introductory overview paragraph followed by 3-4 bullet points of the core ideas).',
    long: 'Provide a comprehensive summary (a detailed introductory summary paragraph, followed by a bulleted breakdown of key themes, and a final critical takeaway sentence).',
};

async function callGroqAPI(
    apiKey: string,
    text: string,
    length: SummaryLength
): Promise<{ success: boolean; text: string; rateLimited?: boolean; error?: string }> {
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
                        content: `You are an expert academic summarization assistant inside the eLMS portal.
Your task is to summarize the user's text accurately. ${lengthPrompts[length]}

IMPORTANT RULES:
- Output ONLY the summary content. Do NOT say "Here is your summary:" or introduce your output.
- Maintain the original languages. If the text is in Taglish or Tagalog, summarize it in fluent Taglish/Tagalog.
- Maintain academic precision and keep important names, statistics, and dates intact.
- CRITICAL: If the input text is gibberish, a random assortment of characters (e.g. "Aowopdsp"), too short, or lacks any coherent meaning, you MUST reply with exactly this phrase and nothing else: [UNRECOGNIZABLE_TEXT]`,
                    },
                    {
                        role: 'user',
                        content: text,
                    },
                ],
                temperature: 0.5,
                max_tokens: length === 'short' ? 150 : length === 'medium' ? 300 : 600,
            }),
        });

        // Check for rate limiting
        if (response.status === 429) {
            return { success: false, text: '', rateLimited: true, error: 'Rate limit exceeded' };
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const isRateLimit = errorData.error?.message?.toLowerCase().includes('rate') ||
                               errorData.error?.message?.toLowerCase().includes('quota');
            return {
                success: false,
                text: '',
                rateLimited: isRateLimit,
                error: errorData.error?.message || `API error: ${response.status}`,
            };
        }

        const data = await response.json();
        const summaryText = data.choices?.[0]?.message?.content?.trim();

        if (!summaryText) {
            return { success: false, text: '', error: 'No response from API' };
        }

        return { success: true, text: summaryText };
    } catch (error) {
        return {
            success: false,
            text: '',
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

export async function summarizeWithGroq(
    text: string,
    length: SummaryLength
): Promise<SummarizeResult> {
    const accounts = getGroqAccounts();
    
    if (accounts.length === 0) {
        return {
            success: false,
            text: '',
            error: 'No Groq API keys configured. Please add VITE_GROQ_API_KEY_1 to your environment to activate AI summaries.',
        };
    }

    // Reset failed accounts if all have failed
    if (failedAccounts.size >= accounts.length) {
        failedAccounts.clear();
        currentAccountIndex = 0;
    }

    let attempts = 0;
    const maxAttempts = accounts.length;

    while (attempts < maxAttempts) {
        while (failedAccounts.has(currentAccountIndex) && attempts < maxAttempts) {
            currentAccountIndex = (currentAccountIndex + 1) % accounts.length;
            attempts++;
        }

        if (attempts >= maxAttempts) break;

        const account = accounts[currentAccountIndex];
        console.log(`[GroqSummarizer] Using account ${account.index}`);

        const result = await callGroqAPI(account.apiKey, text, length);

        if (result.success) {
            saveCurrentAccount();
            return {
                success: true,
                text: result.text,
                accountUsed: account.index,
            };
        }

        if (result.rateLimited) {
            console.log(`[GroqSummarizer] Account ${account.index} rate limited, switching...`);
            failedAccounts.add(currentAccountIndex);
            currentAccountIndex = (currentAccountIndex + 1) % accounts.length;
            saveCurrentAccount();
            attempts++;
            continue;
        }

        return { success: false, text: '', error: result.error };
    }

    return {
        success: false,
        text: '',
        error: 'All Groq accounts have reached their rate limits. Falling back to local offline summarizer.',
    };
}

export function isSummarizerGroqConfigured(): boolean {
    return getGroqAccounts().length > 0;
}
