/**
 * AI Service for Text Summarization
 * Uses Opencode API (mimo-v2.5-free) via local proxy
 */

export type SummaryLength = 'short' | 'medium' | 'long';

interface SummarizeResult {
    success: boolean;
    text: string;
    error?: string;
}

const lengthPrompts: Record<SummaryLength, string> = {
    short: 'Provide a very concise summary (2-3 sentences max) capturing only the absolute most crucial thesis or takeaway.',
    medium: 'Provide a structured summary consisting of 1-2 distinct paragraphs that cleanly cover the core ideas.',
    long: 'Provide a comprehensive summary consisting of multiple detailed paragraphs covering key themes, followed by a final critical takeaway sentence.',
};

export const isSummarizerAIConfigured = (): boolean => {
    return !!import.meta.env.VITE_OPENCODE_API_KEY;
};

export async function summarizeWithAI(
    text: string,
    length: SummaryLength
): Promise<SummarizeResult> {
    const apiKey = import.meta.env.VITE_OPENCODE_API_KEY || '';
    if (!apiKey) {
        return {
            success: false,
            text: '',
            error: 'No AI API key configured. Please add VITE_OPENCODE_API_KEY to your environment to activate AI summaries.',
        };
    }

    const configuredUrl = import.meta.env.VITE_AI_BASE_URL;
    const baseUrl = configuredUrl && configuredUrl !== 'https://api.openai.com/v1/chat/completions' && configuredUrl !== 'https://opencode.ai/zen/v1/chat/completions'
        ? configuredUrl
        : '/api/ai/zen/v1/chat/completions';

    try {
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'mimo-v2.5-free',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert academic summarization assistant inside the eLMS portal.
Your task is to summarize the user's text accurately. ${lengthPrompts[length]}

IMPORTANT RULES:
- Output ONLY the summary content in plain text format without any styling.
- Provide a direct summary without any introductory phrases or explanations.
- Maintain the original language of the text.
- Maintain academic precision and keep important names, statistics, and dates intact.
- If the input text is complete gibberish (e.g. "Aowopdsp") and has absolutely no meaning, reply with exactly: [UNRECOGNIZABLE_TEXT]`,
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

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                text: '',
                error: errorData.error?.message || `API error: ${response.status}`,
            };
        }

        const data = await response.json();
        
        if (data.error) {
            console.error('[AI Summarizer] Upstream API error:', data.error);
            return {
                success: false, 
                text: '', 
                error: typeof data.error === 'string' ? data.error : (data.error.message || 'Unknown API Error')
            };
        }

        const summaryText = data.choices?.[0]?.message?.content?.trim();

        if (!summaryText) {
            console.error('[AI Summarizer] Empty response content. Full data:', data);
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
