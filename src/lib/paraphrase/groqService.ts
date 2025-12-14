/**
 * Groq API Service for Paraphrasing
 * Multi-Account Rotation System: 5 accounts × 14,400 req/day = 72,000 req/day FREE!
 * Uses Llama 3.1 8B - Fast and high quality
 * Get your free API keys at: https://console.groq.com/keys
 */

export type ParaphraseMode = 'standard' | 'fluency' | 'formal' | 'creative' | 'shorter' | 'expand';

interface ParaphraseResult {
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
const STORAGE_KEY = 'groq_paraphrase_account';

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

const modePrompts: Record<ParaphraseMode, string> = {
    standard: 'Rewrite the following text using different words and sentence structures while preserving the exact same meaning. Make moderate but noticeable changes.',
    fluency: 'Rewrite the following text to improve its flow, readability, and natural sound while keeping the same meaning. Focus on making it easier to read.',
    formal: 'Rewrite the following text in a formal, professional, academic tone. Use sophisticated vocabulary, proper grammar, and a scholarly style.',
    creative: 'Rewrite the following text in a creative, engaging, and unique way. Use vivid language, metaphors, and interesting expressions while keeping the core meaning.',
    shorter: 'Rewrite the following text to be significantly more concise. Remove unnecessary words, combine sentences, and make it shorter while keeping the essential message.',
    expand: 'Rewrite the following text with more detail, elaboration, and context. Add explanations and expand on ideas while keeping the core meaning intact.',
};

async function callGroqAPI(
    apiKey: string,
    text: string,
    mode: ParaphraseMode
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
                        content: `You are a professional paraphrasing assistant. ${modePrompts[mode]}

IMPORTANT RULES:
- Output ONLY the paraphrased text, nothing else
- Do NOT add quotes, explanations, or introductions
- Maintain the original language
- Keep proper nouns, names, numbers unchanged
- Preserve paragraph structure`,
                    },
                    {
                        role: 'user',
                        content: text,
                    },
                ],
                temperature: mode === 'creative' ? 0.9 : mode === 'formal' ? 0.3 : 0.7,
                max_tokens: Math.max(text.split(' ').length * 3, 256),
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
        let paraphrasedText = data.choices?.[0]?.message?.content?.trim();

        if (!paraphrasedText) {
            return { success: false, text: '', error: 'No response from API' };
        }

        // Clean up AI response patterns
        paraphrasedText = paraphrasedText
            .replace(/^(Here is|Here's|The paraphrased text is|Paraphrased:)\s*/i, '')
            .replace(/^["']|["']$/g, '')
            .trim();

        return { success: true, text: paraphrasedText };
    } catch (error) {
        return {
            success: false,
            text: '',
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

export async function paraphraseWithGroq(
    text: string,
    mode: ParaphraseMode
): Promise<ParaphraseResult> {
    const accounts = getGroqAccounts();
    
    if (accounts.length === 0) {
        return {
            success: false,
            text: text,
            error: 'No Groq API keys configured. Add VITE_GROQ_API_KEY_1 to VITE_GROQ_API_KEY_5 in your .env.local file. Get free keys at https://console.groq.com/keys',
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
        console.log(`[Groq] Using account ${account.index}`);

        const result = await callGroqAPI(account.apiKey, text, mode);

        if (result.success) {
            saveCurrentAccount();
            return {
                success: true,
                text: result.text,
                accountUsed: account.index,
            };
        }

        if (result.rateLimited) {
            console.log(`[Groq] Account ${account.index} rate limited, switching...`);
            failedAccounts.add(currentAccountIndex);
            currentAccountIndex = (currentAccountIndex + 1) % accounts.length;
            saveCurrentAccount();
            attempts++;
            continue;
        }

        return { success: false, text: text, error: result.error };
    }

    return {
        success: false,
        text: text,
        error: 'All Groq accounts have reached their rate limits. Please try again later.',
    };
}

/**
 * Get statistics about the paraphrase
 */
export function getParaphraseStats(original: string, paraphrased: string) {
    const originalWords = original.trim().split(/\s+/).filter(w => w).length;
    const paraphrasedWords = paraphrased.trim().split(/\s+/).filter(w => w).length;

    const normalize = (text: string) =>
        text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    
    const originalSet = new Set(normalize(original));
    const paraphrasedSet = new Set(normalize(paraphrased));

    let overlap = 0;
    for (const word of paraphrasedSet) {
        if (originalSet.has(word)) overlap++;
    }

    const union = new Set([...originalSet, ...paraphrasedSet]).size;
    const similarity = union > 0 ? Math.round((overlap / union) * 100) : 0;

    return {
        originalWords,
        paraphrasedWords,
        wordChange: paraphrasedWords - originalWords,
        wordChangePercent: originalWords > 0 
            ? Math.round(((paraphrasedWords - originalWords) / originalWords) * 100) 
            : 0,
        similarity,
        uniqueness: 100 - similarity,
    };
}

export function isGroqConfigured(): boolean {
    return getGroqAccounts().length > 0;
}

export function getConfiguredAccountCount(): number {
    return getGroqAccounts().length;
}

export function resetFailedAccounts(): void {
    failedAccounts.clear();
    currentAccountIndex = 0;
    saveCurrentAccount();
}
