/**
 * AI Service for Citation Extraction
 * Uses Opencode API (mimo-v2.5-free) via local proxy
 */

export interface AICitationData {
    sourceType: 'book' | 'website' | 'journal';
    authors: string;
    title: string;
    publicationYear: string;
    publisher?: string;
    url?: string;
    accessDate?: string;
    journalName?: string;
    volume?: string;
    issue?: string;
    pages?: string;
}

export interface AICitationResult {
    success: boolean;
    data?: AICitationData;
    error?: string;
}

export const isCitationAIConfigured = (): boolean => {
    return !!import.meta.env.VITE_OPENCODE_API_KEY;
};

const parseHTMLToMetadata = (html: string, url: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const title = doc.querySelector('title')?.textContent || '';
    const author = doc.querySelector('meta[name="author"]')?.getAttribute('content') || 
                   doc.querySelector('meta[property="article:author"]')?.getAttribute('content') || '';
    const date = doc.querySelector('meta[name="date"]')?.getAttribute('content') || 
                 doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content') || 
                 doc.querySelector('meta[property="article:modified_time"]')?.getAttribute('content') || '';
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || 
                        doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
    const siteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || '';
    const paragraphs = Array.from(doc.querySelectorAll('p')).slice(0, 3).map(p => p.textContent).join('\n');
    return `Website URL: ${url}\nTitle: ${title}\nAuthor: ${author}\nDate: ${date}\nSite Name: ${siteName}\nDescription: ${description}\nContent Snippet: ${paragraphs.substring(0, 800)}`.trim();
};

const fetchMicrolink = async (url: string) => {
    const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error("Microlink failed");
    const data = await res.json();
    if (data.status !== 'success' || !data.data) throw new Error("Microlink invalid data");
    const { title, description, author, publisher, date } = data.data;
    return `Website URL: ${url}\nTitle: ${title || ''}\nAuthor: ${author || ''}\nDate: ${date || ''}\nPublisher: ${publisher || ''}\nDescription: ${description || ''}`.trim();
};

const fetchCorsProxy = async (url: string) => {
    const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error("Corsproxy failed");
    const html = await res.text();
    return parseHTMLToMetadata(html, url);
};

const fetchAllOrigins = async (url: string) => {
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error("Allorigins failed");
    const data = await res.json();
    if (!data.contents) throw new Error("Allorigins empty");
    return parseHTMLToMetadata(data.contents, url);
};

export async function fetchWebsiteMetadata(url: string): Promise<string | null> {
    try {
        // Run all fetchers in parallel, taking the fastest successful one!
        // This makes the process extremely fast and resilient.
        return await Promise.any([
            fetchMicrolink(url),
            fetchCorsProxy(url),
            fetchAllOrigins(url)
        ]);
    } catch (e) {
        console.warn("[AI Citation] All metadata fetchers failed or timed out (likely protected).");
        return null;
    }
}

export function extractDOI(text: string): string | null {
    const doiRegex = /(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i;
    const match = text.match(doiRegex);
    return match ? match[1] : null;
}

export async function fetchDOIMetadata(doi: string): Promise<Partial<AICitationData> | null> {
    try {
        const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
        if (!response.ok) return null;
        
        const data = await response.json();
        const work = data.message;
        
        if (!work) return null;

        const title = work.title && work.title.length > 0 ? work.title[0] : '';
        const publisher = work.publisher || '';
        const authors = work.author ? work.author.map((a: any) => `${a.family}, ${a.given}`).join('; ') : '';
        
        let publicationYear = '';
        if (work.issued && work.issued['date-parts'] && work.issued['date-parts'][0]) {
            publicationYear = work.issued['date-parts'][0][0].toString();
        }

        const journalName = work['container-title'] && work['container-title'].length > 0 ? work['container-title'][0] : '';
        const volume = work.volume || '';
        const issue = work.issue || '';
        const pages = work.page || '';
        
        return {
            sourceType: 'journal',
            title,
            authors,
            publisher,
            publicationYear,
            journalName,
            volume,
            issue,
            pages,
            url: work.URL || `https://doi.org/${doi}`
        };
    } catch (e) {
        console.error("[AI Citation] Failed to fetch DOI from Crossref", e);
        return null;
    }
}

export async function extractCitationWithAI(text: string): Promise<AICitationResult> {
    const apiKey = import.meta.env.VITE_OPENCODE_API_KEY || '';
    if (!apiKey) {
        return {
            success: false,
            error: 'No AI API key configured. Please add VITE_OPENCODE_API_KEY to your environment.',
        };
    }

    const configuredUrl = import.meta.env.VITE_AI_BASE_URL;
    const baseUrl = configuredUrl && configuredUrl !== 'https://api.openai.com/v1/chat/completions' && configuredUrl !== 'https://opencode.ai/zen/v1/chat/completions'
        ? configuredUrl
        : '/api/ai/zen/v1/chat/completions';

    const systemPrompt = `You are an expert academic citation assistant. Your job is to extract citation metadata from raw text, references, or website snippets.
You MUST respond with a JSON object.
Format:
{
  "sourceType": "book" | "website" | "journal",
  "authors": "Author names (e.g. Smith, J., & Doe, A. or Organization Name)",
  "title": "Title of the work",
  "publicationYear": "Year (e.g. 2023) or 'n.d.' if unknown",
  "publisher": "Publisher name (for books)",
  "url": "URL if present",
  "accessDate": "Current date or date from text",
  "journalName": "Name of the journal (for journals)",
  "volume": "Volume number",
  "issue": "Issue number",
  "pages": "Page range (e.g. 15-30)"
}
Rules:
1. Extract as much accurate information as possible.
2. If the text does not contain a specific field, leave it out or empty.
3. For 'sourceType', guess the most appropriate type.
4. ONLY return valid JSON. No markdown formatting outside of the JSON block.`;

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
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: text },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.1,
                max_tokens: 500,
            }),
        });

        const data = await response.json();
        
        if (data.error) {
            console.error('[AI Citation] Upstream API error:', data.error);
            return {
                success: false, 
                error: typeof data.error === 'string' ? data.error : (data.error.message || 'Unknown API Error')
            };
        }

        const jsonString = data.choices?.[0]?.message?.content?.trim();
        if (!jsonString) {
            return { success: false, error: 'No response from API' };
        }

        try {
            const parsed = JSON.parse(jsonString) as AICitationData;
            // Validate basic required fields
            if (!parsed.sourceType || !parsed.title) {
                 return { success: false, error: 'Failed to extract critical citation information' };
            }
            return { success: true, data: parsed };
        } catch (e) {
            console.error('[AI Citation] JSON parse error:', e, 'Raw string:', jsonString);
            return { success: false, error: 'Failed to parse AI output' };
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}
