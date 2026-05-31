/**
 * Google Custom Search Plagiarism Detection Service
 * Searches 50 academic domains for matching text
 * 
 * How it works:
 * 1. Extracts key sentences from the document
 * 2. Searches each sentence on Google Custom Search (50 academic sites)
 * 3. Compares the original text against search result snippets
 * 4. Calculates a similarity percentage and returns matched sources
 * 
 * Free tier: 100 searches/day per key × 5 keys = 500 searches/day
 */

interface GoogleSearchAccount {
    apiKey: string;
    index: number;
}

export interface PlagiarismSource {
    url: string;
    title: string;
    snippet: string;
    matchedSentence: string;
    similarityScore: number;
}

export interface GooglePlagiarismResult {
    success: boolean;
    overallSimilarity: number;
    uniquePercentage: number;
    totalSentencesChecked: number;
    flaggedSentences: number;
    sources: PlagiarismSource[];
    sentenceResults: {
        sentence: string;
        similarity: number;
        source?: string;
    }[];
    error?: string;
    accountUsed?: number;
}

// Load API keys from environment
const getGoogleSearchAccounts = (): GoogleSearchAccount[] => {
    const accounts: GoogleSearchAccount[] = [];
    for (let i = 1; i <= 5; i++) {
        const apiKey = import.meta.env[`VITE_GOOGLE_SEARCH_API_KEY_${i}`] || '';
        if (apiKey) {
            accounts.push({ apiKey, index: i });
        }
    }
    return accounts;
};

const getSearchEngineId = (): string => {
    return import.meta.env.VITE_GOOGLE_SEARCH_CX || '';
};

// Track current account and failed accounts
let currentAccountIndex = 0;
const failedAccounts = new Set<number>();
const STORAGE_KEY = 'google_search_plagiarism_account';

const loadCurrentAccount = (): void => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) currentAccountIndex = parseInt(saved, 10) || 0;
    } catch {
        currentAccountIndex = 0;
    }
};

const saveCurrentAccount = (): void => {
    try {
        localStorage.setItem(STORAGE_KEY, currentAccountIndex.toString());
    } catch { /* ignore */ }
};

loadCurrentAccount();

/**
 * Check if Google Search plagiarism detection is configured
 */
export const isGoogleSearchConfigured = (): boolean => {
    return getGoogleSearchAccounts().length > 0 && !!getSearchEngineId();
};

/**
 * Get status of the Google Search configuration
 */
export const getGoogleSearchStatus = () => ({
    configured: isGoogleSearchConfigured(),
    accountCount: getGoogleSearchAccounts().length,
    searchesPerDay: getGoogleSearchAccounts().length * 100,
});

/**
 * Extract the most important sentences from text for searching
 * Picks sentences that are most likely to be plagiarized (longer, more specific)
 */
const extractKeySentences = (text: string, maxSentences: number = 6): string[] => {
    const sentences = text
        .replace(/\n+/g, ' ')
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => {
            const wordCount = s.split(/\s+/).length;
            return wordCount >= 8 && wordCount <= 40 && s.length > 30;
        });

    if (sentences.length === 0) return [];

    // Sort by length (longer sentences are more specific and searchable)
    const sorted = [...sentences].sort((a, b) => b.length - a.length);

    // Pick evenly distributed sentences from the document
    const selected: string[] = [];
    const step = Math.max(1, Math.floor(sorted.length / maxSentences));
    
    for (let i = 0; i < sorted.length && selected.length < maxSentences; i += step) {
        selected.push(sorted[i]);
    }

    return selected;
};

/**
 * Calculate text similarity between two strings using word overlap
 */
const calculateSimilarity = (text1: string, text2: string): number => {
    const normalize = (t: string) =>
        t.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);

    const words1 = normalize(text1);
    const words2 = normalize(text2);

    if (words1.length === 0 || words2.length === 0) return 0;

    const set2 = new Set(words2);
    let matches = 0;
    for (const word of words1) {
        if (set2.has(word)) matches++;
    }

    return Math.round((matches / words1.length) * 100);
};

/**
 * Search Google Custom Search API for a single query
 */
const searchGoogle = async (
    query: string,
    apiKey: string,
    cx: string
): Promise<{ success: boolean; items: any[]; rateLimited?: boolean; error?: string }> => {
    try {
        // Wrap in quotes for exact phrase matching
        const exactQuery = `"${query.slice(0, 128)}"`;
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(exactQuery)}&num=3`;

        const response = await fetch(url);

        if (response.status === 429 || response.status === 403) {
            const errorData = await response.json().catch(() => ({}));
            const isQuota = errorData.error?.errors?.[0]?.reason === 'rateLimitExceeded' ||
                           errorData.error?.errors?.[0]?.reason === 'dailyLimitExceeded';
            return { success: false, items: [], rateLimited: isQuota, error: 'Rate limited' };
        }

        if (!response.ok) {
            return { success: false, items: [], error: `API error: ${response.status}` };
        }

        const data = await response.json();
        return { success: true, items: data.items || [] };
    } catch (error) {
        return {
            success: false,
            items: [],
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
};

/**
 * Main plagiarism scanning function
 * Extracts key sentences, searches them on Google, and calculates similarity
 */
export const scanWithGoogleSearch = async (text: string): Promise<GooglePlagiarismResult> => {
    const accounts = getGoogleSearchAccounts();
    const cx = getSearchEngineId();

    if (accounts.length === 0 || !cx) {
        return {
            success: false,
            overallSimilarity: 0,
            uniquePercentage: 100,
            totalSentencesChecked: 0,
            flaggedSentences: 0,
            sources: [],
            sentenceResults: [],
            error: 'Google Custom Search API not configured.',
        };
    }

    // Reset failed accounts if all have failed
    if (failedAccounts.size >= accounts.length) {
        failedAccounts.clear();
        currentAccountIndex = 0;
    }

    const keySentences = extractKeySentences(text);
    if (keySentences.length === 0) {
        return {
            success: true,
            overallSimilarity: 0,
            uniquePercentage: 100,
            totalSentencesChecked: 0,
            flaggedSentences: 0,
            sources: [],
            sentenceResults: [],
        };
    }

    const sources: PlagiarismSource[] = [];
    const sentenceResults: { sentence: string; similarity: number; source?: string }[] = [];
    const seenUrls = new Set<string>();

    for (const sentence of keySentences) {
        // Find a working account
        let account: GoogleSearchAccount | null = null;
        let attempts = 0;

        while (attempts < accounts.length) {
            if (!failedAccounts.has(currentAccountIndex)) {
                account = accounts[currentAccountIndex];
                break;
            }
            currentAccountIndex = (currentAccountIndex + 1) % accounts.length;
            attempts++;
        }

        if (!account) {
            sentenceResults.push({ sentence, similarity: 0 });
            continue;
        }

        console.log(`[Plagiarism] Searching: "${sentence.slice(0, 50)}..." (Account ${account.index})`);

        const result = await searchGoogle(sentence, account.apiKey, cx);

        if (result.rateLimited) {
            console.log(`[Plagiarism] Account ${account.index} rate limited, switching...`);
            failedAccounts.add(currentAccountIndex);
            currentAccountIndex = (currentAccountIndex + 1) % accounts.length;
            saveCurrentAccount();
            // Retry this sentence with next account
            sentenceResults.push({ sentence, similarity: 0 });
            continue;
        }

        if (!result.success || result.items.length === 0) {
            sentenceResults.push({ sentence, similarity: 0 });
            continue;
        }

        // Analyze search results for this sentence
        let bestMatch = 0;
        let bestSource: PlagiarismSource | null = null;

        for (const item of result.items) {
            const snippetSimilarity = calculateSimilarity(sentence, item.snippet || '');
            const titleSimilarity = calculateSimilarity(sentence, item.title || '');
            const overallMatch = Math.max(snippetSimilarity, titleSimilarity);

            if (overallMatch > bestMatch) {
                bestMatch = overallMatch;
                bestSource = {
                    url: item.link || '',
                    title: item.title || 'Unknown Source',
                    snippet: item.snippet || '',
                    matchedSentence: sentence,
                    similarityScore: overallMatch,
                };
            }
        }

        if (bestSource && bestMatch >= 40 && !seenUrls.has(bestSource.url)) {
            sources.push(bestSource);
            seenUrls.add(bestSource.url);
        }

        sentenceResults.push({
            sentence,
            similarity: bestMatch,
            source: bestSource?.url,
        });

        // Small delay between searches to be respectful
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    saveCurrentAccount();

    // Calculate overall similarity
    const flaggedSentences = sentenceResults.filter(r => r.similarity >= 40).length;
    const totalChecked = sentenceResults.length;
    const overallSimilarity = totalChecked > 0
        ? Math.round(sentenceResults.reduce((sum, r) => sum + r.similarity, 0) / totalChecked)
        : 0;

    return {
        success: true,
        overallSimilarity,
        uniquePercentage: Math.max(0, 100 - overallSimilarity),
        totalSentencesChecked: totalChecked,
        flaggedSentences,
        sources: sources.sort((a, b) => b.similarityScore - a.similarityScore),
        sentenceResults,
    };
};

export const resetGoogleSearchAccounts = (): void => {
    failedAccounts.clear();
    currentAccountIndex = 0;
    saveCurrentAccount();
};
