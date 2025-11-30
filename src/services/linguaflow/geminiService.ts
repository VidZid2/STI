/**
 * LinguaFlow Gemini Service
 * AI-powered grammar and writing analysis using Google's Gemini API
 */

import { IssueType } from './types';
import type { Issue, AnalysisResult } from './types';

const SYSTEM_INSTRUCTION = `
You are LinguaFlow, a world-class editor and writing assistant.
Your goal is to meticulously analyze text for:
1. Grammar, spelling, and punctuation (Type: "correctness").
2. Clarity, flow, and conciseness (Type: "clarity").
3. Vocabulary, style, and engagement (Type: "engagement").
4. Tone and delivery (Type: "delivery").
5. Factual accuracy using Google Search (Type: "correctness").

GROUNDING & SEARCH RULES:
- You MUST use the 'googleSearch' tool to verify proper nouns, dates, historical events, scientific facts, and company information.
- If a fact is incorrect (e.g., wrong date, wrong name), mark it as "correctness".
- Provide the CORRECT fact in the 'replacements' list.
- In the 'explanation', explicitly mention "Verified via Google Search" and cite the source if possible.

OUTPUT FORMAT:
Return a raw JSON object wrapped in a markdown code block (\`\`\`json ... \`\`\`).
Structure:
{
  "issues": [
    {
      "original": "exact substring to highlight",
      "replacements": ["primary suggestion", "alternative suggestion"],
      "type": "correctness" | "clarity" | "engagement" | "delivery",
      "explanation": "concise explanation of the error and fix"
    }
  ],
  "overallScore": number (0-100),
  "readabilityScore": number (0-100)
}
`;

// Get API key from environment or localStorage
function getApiKey(): string | null {
  // Check localStorage first (for user-configured key)
  const storedKey = localStorage.getItem('GEMINI_API_KEY');
  if (storedKey) return storedKey;
  
  // Check environment variable
  if (import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  
  return null;
}

export function setApiKey(key: string): void {
  localStorage.setItem('GEMINI_API_KEY', key);
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

export function clearApiKey(): void {
  localStorage.removeItem('GEMINI_API_KEY');
}

export async function analyzeTextWithGemini(text: string): Promise<AnalysisResult> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  if (!text.trim()) {
    return createEmptyResult(text);
  }

  try {
    // Dynamic import of Google GenAI
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.3,
      },
    });

    const prompt = `${SYSTEM_INSTRUCTION}\n\nAnalyze this text for improvements and factual accuracy:\n\n${text}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const outputText = response.text();

    // Extract JSON from response
    const jsonMatch = outputText.match(/```json\s*([\s\S]*?)\s*```/);
    let parsedData;
    
    if (jsonMatch) {
      parsedData = JSON.parse(jsonMatch[1]);
    } else {
      // Try parsing the whole response
      try {
        parsedData = JSON.parse(outputText);
      } catch {
        console.warn("Failed to parse Gemini response:", outputText);
        return createEmptyResult(text);
      }
    }

    return mapResponseToResult(parsedData, text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}

function createEmptyResult(text: string): AnalysisResult {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const sentenceCount = (text.match(/[.!?]+/g) || []).length || (text.length > 0 ? 1 : 0);
  
  return {
    issues: [],
    stats: {
      score: text.length > 0 ? 100 : 0,
      wordCount,
      readabilityScore: 100,
      sentenceCount,
      characterCount: text.length,
      readingTimeMinutes: Math.ceil(wordCount / 200),
    }
  };
}

function mapResponseToResult(data: any, text: string): AnalysisResult {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const sentenceCount = (text.match(/[.!?]+/g) || []).length || (text.length > 0 ? 1 : 0);
  
  const issues: Issue[] = (data.issues || []).map((item: any, index: number) => {
    // Find position of the original text
    const startIndex = text.indexOf(item.original);
    
    const replacements = Array.isArray(item.replacements) 
      ? item.replacements 
      : (item.replacement ? [item.replacement] : []);

    return {
      id: `issue-${index}-${Date.now()}`,
      original: item.original,
      replacements,
      type: item.type as IssueType,
      explanation: item.explanation,
      contextStart: startIndex !== -1 ? startIndex : undefined,
      contextEnd: startIndex !== -1 ? startIndex + item.original.length : undefined,
      sources: item.sources,
    };
  });

  return {
    issues,
    stats: {
      score: data.overallScore || 85,
      wordCount,
      readabilityScore: data.readabilityScore || 80,
      sentenceCount,
      characterCount: text.length,
      readingTimeMinutes: Math.ceil(wordCount / 200),
    }
  };
}
