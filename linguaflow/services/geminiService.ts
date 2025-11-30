import { GoogleGenAI } from "@google/genai";
import { Issue, IssueType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

export const analyzeTextWithGemini = async (text: string): Promise<{ issues: Issue[], stats: { score: number, readabilityScore: number } }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this text for improvements and factual accuracy:\n\n${text}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        temperature: 0.3, // Lower temperature for more consistent editing
      },
    });

    const outputText = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    // Extract JSON
    const jsonMatch = outputText.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      // Try parsing the whole response if code blocks are missing
      try {
        const raw = JSON.parse(outputText);
        return mapResponseToIssues(raw, groundingChunks);
      } catch (e) {
        console.warn("Parsing failed", outputText);
        throw new Error("Failed to parse analysis results.");
      }
    }

    const jsonString = jsonMatch[1];
    const parsedData = JSON.parse(jsonString);

    return mapResponseToIssues(parsedData, groundingChunks);

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapResponseToIssues(data: any, groundingChunks: any[] | undefined): { issues: Issue[], stats: { score: number, readabilityScore: number } } {
  const issues: Issue[] = (data.issues || []).map((item: any, index: number) => {
    
    // Attribute sources if this is a correctness issue likely related to grounding
    let sources: string[] = [];
    if (groundingChunks && item.type === 'correctness') {
      sources = groundingChunks
        .filter(chunk => chunk.web?.uri)
        .map(chunk => chunk.web?.uri);
    }

    // Handle single 'replacement' legacy format if model hallucinates it
    const replacements = Array.isArray(item.replacements) 
        ? item.replacements 
        : (item.replacement ? [item.replacement] : []);

    return {
      id: `issue-${index}-${Date.now()}`,
      original: item.original,
      replacements: replacements,
      type: item.type as IssueType,
      explanation: item.explanation,
      sources: sources.length > 0 ? sources : undefined
    };
  });

  return {
    issues,
    stats: {
      score: data.overallScore || 85,
      readabilityScore: data.readabilityScore || 80
    }
  };
}