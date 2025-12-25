/**
 * AI Message Classifier using Groq
 * Classifies chat messages as: question, answer, resource, urgent, or general
 * Uses the same multi-account rotation as paraphraser for unlimited usage
 */

export type MessageType = 'question' | 'answer' | 'resource' | 'urgent' | 'general';

interface ClassificationResult {
    success: boolean;
    type: MessageType;
    confidence: number;
    error?: string;
}

// Cache to avoid re-classifying same messages
const classificationCache = new Map<string, ClassificationResult>();

// Load API keys (same as paraphraser)
const getGroqAccounts = (): { apiKey: string; index: number }[] => {
    const accounts: { apiKey: string; index: number }[] = [];
    
    for (let i = 1; i <= 5; i++) {
        const apiKey = import.meta.env[`VITE_GROQ_API_KEY_${i}`] || '';
        if (apiKey) {
            accounts.push({ apiKey, index: i });
        }
    }
    
    if (accounts.length === 0) {
        const singleKey = import.meta.env.VITE_GROQ_API_KEY || '';
        if (singleKey) {
            accounts.push({ apiKey: singleKey, index: 1 });
        }
    }
    
    return accounts;
};

let currentAccountIndex = 0;
const failedAccounts = new Set<number>();

async function callGroqClassifier(
    apiKey: string,
    message: string
): Promise<{ success: boolean; type: MessageType; confidence: number; rateLimited?: boolean; error?: string }> {
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
                        content: `You are a message classifier for a student study group chat. Classify messages into exactly ONE category.

CATEGORIES:
- question: Student is asking for help, clarification, or information (even without ?)
- answer: Student is providing an explanation, solution, or helpful response
- resource: Student is sharing links, files, documents, or study materials
- urgent: Message about deadlines, exams, emergencies, or time-sensitive matters
- general: Casual chat, greetings, acknowledgments, or doesn't fit other categories

RESPOND WITH ONLY ONE WORD: question, answer, resource, urgent, or general
Nothing else. Just the category word.`,
                    },
                    {
                        role: 'user',
                        content: message,
                    },
                ],
                temperature: 0.1,
                max_tokens: 10,
            }),
        });

        if (response.status === 429) {
            return { success: false, type: 'general', confidence: 0, rateLimited: true };
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const isRateLimit = errorData.error?.message?.toLowerCase().includes('rate');
            return {
                success: false,
                type: 'general',
                confidence: 0,
                rateLimited: isRateLimit,
                error: errorData.error?.message || `API error: ${response.status}`,
            };
        }

        const data = await response.json();
        const result = data.choices?.[0]?.message?.content?.trim().toLowerCase();

        const validTypes: MessageType[] = ['question', 'answer', 'resource', 'urgent', 'general'];
        const detectedType = validTypes.find(t => result?.includes(t)) || 'general';

        return { success: true, type: detectedType, confidence: 0.95 };
    } catch (error) {
        return {
            success: false,
            type: 'general',
            confidence: 0,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

/**
 * Classify a message using AI
 * Falls back to keyword detection if AI fails
 */
export async function classifyMessage(message: string): Promise<ClassificationResult> {
    // Check cache first
    const cacheKey = message.trim().toLowerCase().slice(0, 200);
    if (classificationCache.has(cacheKey)) {
        return classificationCache.get(cacheKey)!;
    }

    // Skip very short messages
    if (message.trim().length < 3) {
        return { success: true, type: 'general', confidence: 1 };
    }

    const accounts = getGroqAccounts();
    
    // If no API keys, use keyword fallback
    if (accounts.length === 0) {
        const result = keywordClassify(message);
        classificationCache.set(cacheKey, result);
        return result;
    }

    // Reset failed accounts if all failed
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
        const result = await callGroqClassifier(account.apiKey, message);

        if (result.success) {
            const classResult = { success: true, type: result.type, confidence: result.confidence };
            classificationCache.set(cacheKey, classResult);
            return classResult;
        }

        if (result.rateLimited) {
            failedAccounts.add(currentAccountIndex);
            currentAccountIndex = (currentAccountIndex + 1) % accounts.length;
            attempts++;
            continue;
        }

        break;
    }

    // Fallback to keyword detection
    const fallback = keywordClassify(message);
    classificationCache.set(cacheKey, fallback);
    return fallback;
}

/**
 * Keyword-based classification (fallback)
 */
function keywordClassify(message: string): ClassificationResult {
    const content = message.toLowerCase();
    
    // Urgent detection
    const urgentKeywords = ['urgent', 'asap', 'deadline', 'due today', 'due tomorrow', 
        'important', 'help!', 'emergency', 'exam', 'quiz tomorrow', 'need help now'];
    if (urgentKeywords.some(k => content.includes(k))) {
        return { success: true, type: 'urgent', confidence: 0.8 };
    }

    // Resource detection
    if (content.includes('http') || content.includes('www.') || 
        content.includes('.pdf') || content.includes('.doc') ||
        content.includes('check out') || content.includes('here\'s the link')) {
        return { success: true, type: 'resource', confidence: 0.85 };
    }

    // Question detection
    const questionStarters = ['how', 'what', 'why', 'when', 'where', 'can', 'does', 'is ', 'are ', 'do '];
    if (content.includes('?') || questionStarters.some(q => content.startsWith(q))) {
        return { success: true, type: 'question', confidence: 0.75 };
    }

    // Answer detection
    const answerStarters = ['yes', 'no,', 'the answer', 'it\'s', 'because', 'solution', 'you can', 'try this'];
    if (answerStarters.some(a => content.startsWith(a) || content.includes(a))) {
        return { success: true, type: 'answer', confidence: 0.7 };
    }

    return { success: true, type: 'general', confidence: 0.6 };
}

/**
 * Clear the classification cache
 */
export function clearClassificationCache(): void {
    classificationCache.clear();
}

/**
 * Check if classifier is configured with API keys
 */
export function isClassifierConfigured(): boolean {
    return getGroqAccounts().length > 0;
}
