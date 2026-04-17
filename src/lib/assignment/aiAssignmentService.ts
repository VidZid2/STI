/**
 * AI Assignment Creation Service
 * Conversational AI that helps teachers create assignments through natural language chat.
 * Uses GROQ API with multi-account rotation (same pattern as groqService.ts).
 * 
 * Flow:
 * 1. Teacher describes what they want in plain English
 * 2. AI asks clarifying questions if needed
 * 3. When ready, AI generates structured assignment data
 * 4. Data auto-fills the CreateAssignmentModal form
 */

// ============================================
// Types
// ============================================

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface AssignmentAIResult {
    /** Whether the AI is ready to generate the assignment or needs more info */
    ready: boolean;
    /** The chat response message to display */
    message: string;
    /** Structured assignment data (only present when ready === true) */
    assignmentData?: GeneratedAssignmentData;
}

export interface GeneratedAssignmentData {
    title: string;
    description: string;
    type: 'assignment' | 'quiz' | 'project' | 'journal';
    points: number;
    instructions: string;
    allowLateSubmission: boolean;
    latePenalty: number;
    maxAttempts: number;
    rubricEnabled: boolean;
    rubricCriteria: {
        id: string;
        name: string;
        description: string;
        points: number;
        levels: { label: string; points: number; description: string }[];
    }[];
    /** Suggested due date as relative description, e.g. "next_friday" or ISO date */
    dueDateSuggestion?: string;
}

// ============================================
// GROQ API Setup (reuses same key rotation)
// ============================================

interface GroqAccount {
    apiKey: string;
    index: number;
}

const getGroqAccounts = (): GroqAccount[] => {
    const accounts: GroqAccount[] = [];
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
const STORAGE_KEY = 'groq_assignment_ai_account';

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

// ============================================
// System Prompt
// ============================================

const buildSystemPrompt = (
    courses: { id: string; name: string; sections: string[] }[],
    currentDate: string
): string => {
    const courseList = courses.map(c => `  - "${c.name}" (sections: ${c.sections.join(', ')})`).join('\n');

    return `You are an AI Teaching Assistant for an eLMS (electronic Learning Management System) at STI College.
Your role is to help teachers create assignments through a friendly, conversational chat.

## YOUR PERSONALITY
- Friendly, professional, and encouraging
- Brief and concise — don't write long paragraphs
- Use emoji occasionally to feel approachable 📝
- Ask smart follow-up questions when needed

## AVAILABLE COURSES
${courseList || '  - No courses loaded yet'}

## CURRENT DATE
${currentDate}

## HOW TO RESPOND

### Phase 1: Gathering Information
When the teacher first describes what they want, identify what you know and what's missing.
Key information needed:
- Assignment title/topic
- Assignment type (assignment, quiz, project, or journal)
- Points/scoring
- Instructions/requirements for students
- Due date preference
- Late submission policy
- Whether a rubric should be generated

If the teacher gives you enough info (at minimum: topic and type), you can generate the assignment.
If key details are missing, ask 1-2 focused questions — don't overwhelm them.

### Phase 2: Generating the Assignment
When you have enough info and the teacher confirms or says something like "go ahead", "create it", "looks good", "yes", or "that's perfect", respond with ONLY a JSON block.

The JSON must be wrapped in \`\`\`json ... \`\`\` code fences and must follow this exact schema:

\`\`\`json
{
  "ready": true,
  "title": "string — clear, descriptive title",
  "description": "string — A professional, well-written 3-4 sentence paragraph that clearly explains what this assignment is about, what students will do, and what skills or knowledge they will develop. Write it in a formal academic tone suitable for a course syllabus. Do NOT use HTML in the description — plain text only.",
  "type": "assignment | quiz | project | journal",
  "points": number,
  "instructions": "string — Rich HTML formatted instructions using <h3 style='color: #1e40af; border-bottom: 2px solid #dbeafe; padding-bottom: 8px; margin-top: 20px;'> for section headings, <ul>/<ol> with <li> for lists, <strong> for bold, <p> for paragraphs, and <blockquote style='border-left: 4px solid #f59e0b; padding: 10px 16px; background: #fffbeb; border-radius: 4px; margin: 12px 0;'> for important notes. Include these sections: 📋 Objectives, 📝 Requirements/Tasks (numbered), 📤 Submission Guidelines, 📊 Grading Criteria, ⚠️ Important Notes. Make it detailed, specific, and comprehensive.",
  "allowLateSubmission": boolean,
  "latePenalty": number (percentage per day, 0 if no late submission),
  "maxAttempts": number (1 for most, higher for coding/quiz),
  "rubricEnabled": true,
  "rubricCriteria": [
    {
      "name": "Criterion Name (e.g., 'Code Functionality', 'Content Quality', 'Research Depth')",
      "description": "A clear 1-2 sentence explanation of what this criterion evaluates and why it matters. Students should understand exactly what is expected.",
      "points": number (portion of total points for this criterion),
      "levels": [
        { "label": "Excellent (90-100%)", "points": number, "description": "Detailed description of what excellent work looks like — specific, measurable, and clear. Example: 'All code compiles without errors, handles edge cases, follows naming conventions, and includes comprehensive comments.'" },
        { "label": "Good (75-89%)", "points": number, "description": "Detailed description of good work — meets most expectations with minor gaps." },
        { "label": "Satisfactory (60-74%)", "points": number, "description": "Detailed description of satisfactory work — meets minimum requirements but lacks depth or polish." },
        { "label": "Needs Improvement (Below 60%)", "points": number, "description": "Detailed description of what falls short — missing key elements, significant errors, or incomplete work." }
      ]
    }
  ],
  "dueDateSuggestion": "string — e.g., 'next_friday', '2026-02-21', or 'in_one_week'"
}
\`\`\`

## IMPORTANT RULES
1. During Phase 1, respond as normal conversational text — NO JSON.
2. Only output the JSON block when the teacher confirms they're ready.
3. Make instructions detailed and professional — include objectives, requirements, submission format.
4. **ALWAYS generate rubricEnabled: true** with detailed rubric criteria. Never skip the rubric.
5. Generate **3 to 5 rubric criteria** appropriate for the assignment type and topic. Examples:
   - For coding: Code Functionality, Code Quality & Style, Documentation, Testing, Problem-Solving Approach
   - For essays: Content & Analysis, Organization & Structure, Research & Sources, Writing Quality, Formatting
   - For projects: Project Completeness, Technical Implementation, Creativity & Innovation, Documentation, Presentation
   - For quizzes: Knowledge Accuracy, Comprehension, Application, Critical Thinking
6. **Points in rubric criteria MUST sum up exactly to the total points.** Distribute proportionally based on importance.
7. Each rubric level description must be **specific and detailed** (at least 15 words) so students know exactly what is expected.
8. Use HTML formatting in instructions (<p>, <ul>, <li>, <strong>, <em>).
9. When in doubt, ask — don't assume.
10. Keep conversation brief — teachers are busy people.`;
};

// ============================================
// Core API Call
// ============================================

async function callGroqChat(
    apiKey: string,
    messages: ChatMessage[],
): Promise<{ success: boolean; content: string; rateLimited?: boolean; error?: string }> {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages,
                temperature: 0.7,
                max_tokens: 2048,
            }),
        });

        if (response.status === 429) {
            return { success: false, content: '', rateLimited: true, error: 'Rate limit exceeded' };
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const isRateLimit = errorData.error?.message?.toLowerCase().includes('rate') ||
                errorData.error?.message?.toLowerCase().includes('quota');
            return {
                success: false,
                content: '',
                rateLimited: isRateLimit,
                error: errorData.error?.message || `API error: ${response.status}`,
            };
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();

        if (!content) {
            return { success: false, content: '', error: 'No response from API' };
        }

        return { success: true, content };
    } catch (error) {
        return {
            success: false,
            content: '',
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

// ============================================
// Parse AI Response
// ============================================

function parseAIResponse(content: string): AssignmentAIResult {
    // Try multiple strategies to find JSON in the response
    let jsonStr: string | null = null;

    // Strategy 1: ```json ... ``` code fences
    const jsonFenceMatch = content.match(/```json\s*([\s\S]*?)```/);
    if (jsonFenceMatch) {
        jsonStr = jsonFenceMatch[1].trim();
    }

    // Strategy 2: ``` ... ``` code fences without language label
    if (!jsonStr) {
        const plainFenceMatch = content.match(/```\s*([\s\S]*?)```/);
        if (plainFenceMatch) {
            const inner = plainFenceMatch[1].trim();
            if (inner.startsWith('{')) {
                jsonStr = inner;
            }
        }
    }

    // Strategy 3: Raw JSON object (starts with { and ends with })
    if (!jsonStr) {
        // Find the outermost { ... } block in the response
        const braceStart = content.indexOf('{');
        if (braceStart !== -1) {
            let depth = 0;
            let braceEnd = -1;
            for (let i = braceStart; i < content.length; i++) {
                if (content[i] === '{') depth++;
                else if (content[i] === '}') {
                    depth--;
                    if (depth === 0) { braceEnd = i; break; }
                }
            }
            if (braceEnd !== -1) {
                const candidate = content.substring(braceStart, braceEnd + 1);
                // Only treat as JSON if it looks like our assignment schema
                if (candidate.includes('"ready"') || candidate.includes('"title"') || candidate.includes('"instructions"')) {
                    jsonStr = candidate;
                }
            }
        }
    }

    if (jsonStr) {
        try {
            const parsed = JSON.parse(jsonStr);

            if (parsed.ready === true || parsed.title) {
                // Generate unique IDs for rubric criteria
                const rubricCriteria = (parsed.rubricCriteria || []).map((c: any, idx: number) => ({
                    id: `ai-criterion-${idx}-${Date.now()}`,
                    name: c.name || `Criterion ${idx + 1}`,
                    description: c.description || '',
                    points: c.points || 0,
                    levels: (c.levels || []).map((l: any) => ({
                        label: l.label || '',
                        points: l.points || 0,
                        description: l.description || '',
                    })),
                }));

                return {
                    ready: true,
                    message: '✅ Assignment generated! Review the form and make any adjustments before publishing.',
                    assignmentData: {
                        title: parsed.title || '',
                        description: parsed.description || '',
                        type: parsed.type || 'assignment',
                        points: parsed.points || 100,
                        instructions: postProcessInstructions(parsed.instructions || ''),
                        allowLateSubmission: parsed.allowLateSubmission ?? true,
                        latePenalty: parsed.latePenalty ?? 10,
                        maxAttempts: parsed.maxAttempts ?? 1,
                        // Always enable rubric — AI should always generate criteria
                        rubricEnabled: rubricCriteria.length > 0 ? true : (parsed.rubricEnabled ?? true),
                        rubricCriteria,
                        dueDateSuggestion: parsed.dueDateSuggestion,
                    },
                };
            }
        } catch (e) {
            console.warn('[AI Assignment] Failed to parse JSON from response:', e);
            // If we found JSON-like content but couldn't parse it, show a friendly message
            return {
                ready: false,
                message: '⚠️ I tried to generate the assignment but encountered an issue. Could you try asking me again? For example: "Please create the assignment now."',
            };
        }
    }

    // Phase 1 — still chatting, no assignment data yet
    // Clean up any accidental raw JSON that leaked through
    let cleanMessage = content;
    // If the message is predominantly JSON/code, replace with friendly text
    if (cleanMessage.includes('"ready"') && cleanMessage.includes('"title"') && cleanMessage.length > 200) {
        cleanMessage = '⚠️ I generated the assignment data but it wasn\'t formatted correctly. Let me try again — please say "create it" or "generate the assignment".';
    }

    return {
        ready: false,
        message: cleanMessage,
    };
}

// ============================================
// Public API
// ============================================

/**
 * Send a message in the assignment creation conversation.
 * Returns the AI's response and possibly generated assignment data.
 */
export async function chatWithAssignmentAI(
    conversationHistory: ChatMessage[],
    userMessage: string,
    courses: { id: string; name: string; sections: string[] }[],
): Promise<AssignmentAIResult & { error?: string }> {
    const accounts = getGroqAccounts();

    if (accounts.length === 0) {
        return {
            ready: false,
            message: '',
            error: 'No GROQ API keys configured. Add VITE_GROQ_API_KEY_1 to VITE_GROQ_API_KEY_5 in your .env.local file.',
        };
    }

    // Reset if all accounts failed
    if (failedAccounts.size >= accounts.length) {
        failedAccounts.clear();
        currentAccountIndex = 0;
    }

    // Build messages array with system prompt
    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const messages: ChatMessage[] = [
        { role: 'system', content: buildSystemPrompt(courses, currentDate) },
        ...conversationHistory,
        { role: 'user', content: userMessage },
    ];

    // Try accounts with rotation
    let attempts = 0;
    const maxAttempts = accounts.length;

    while (attempts < maxAttempts) {
        while (failedAccounts.has(currentAccountIndex) && attempts < maxAttempts) {
            currentAccountIndex = (currentAccountIndex + 1) % accounts.length;
            attempts++;
        }

        if (attempts >= maxAttempts) break;

        const account = accounts[currentAccountIndex];
        console.log(`[AI Assignment] Using GROQ account ${account.index}`);

        const result = await callGroqChat(account.apiKey, messages);

        if (result.success) {
            saveCurrentAccount();
            return parseAIResponse(result.content);
        }

        if (result.rateLimited) {
            console.log(`[AI Assignment] Account ${account.index} rate limited, switching...`);
            failedAccounts.add(currentAccountIndex);
            currentAccountIndex = (currentAccountIndex + 1) % accounts.length;
            saveCurrentAccount();
            attempts++;
            continue;
        }

        return {
            ready: false,
            message: '',
            error: result.error || 'Failed to get AI response',
        };
    }

    return {
        ready: false,
        message: '',
        error: 'All GROQ accounts have reached their rate limits. Please try again later.',
    };
}

/**
 * Resolve a due date suggestion from the AI into an actual date string (YYYY-MM-DD).
 */
export function resolveDueDateSuggestion(suggestion?: string): string {
    if (!suggestion) return '';

    // If already an ISO date
    if (/^\d{4}-\d{2}-\d{2}$/.test(suggestion)) return suggestion;

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    switch (suggestion.toLowerCase().replace(/\s+/g, '_')) {
        case 'next_friday': {
            const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
            const nextFriday = new Date(today);
            nextFriday.setDate(today.getDate() + daysUntilFriday);
            return nextFriday.toISOString().split('T')[0];
        }
        case 'next_monday': {
            const daysUntilMonday = (1 - dayOfWeek + 7) % 7 || 7;
            const nextMonday = new Date(today);
            nextMonday.setDate(today.getDate() + daysUntilMonday);
            return nextMonday.toISOString().split('T')[0];
        }
        case 'next_week':
        case 'in_one_week':
        case 'in_1_week': {
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            return nextWeek.toISOString().split('T')[0];
        }
        case 'in_two_weeks':
        case 'in_2_weeks': {
            const twoWeeks = new Date(today);
            twoWeeks.setDate(today.getDate() + 14);
            return twoWeeks.toISOString().split('T')[0];
        }
        case 'end_of_week': {
            const endOfWeek = new Date(today);
            const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
            endOfWeek.setDate(today.getDate() + daysUntilSunday);
            return endOfWeek.toISOString().split('T')[0];
        }
        case 'tomorrow': {
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            return tomorrow.toISOString().split('T')[0];
        }
        case 'in_3_days':
        case 'in_three_days': {
            const threeDays = new Date(today);
            threeDays.setDate(today.getDate() + 3);
            return threeDays.toISOString().split('T')[0];
        }
        default: {
            // Try to parse as a date string
            try {
                const parsed = new Date(suggestion);
                if (!isNaN(parsed.getTime())) {
                    return parsed.toISOString().split('T')[0];
                }
            } catch { /* ignore */ }

            // Default: one week from now
            const fallback = new Date(today);
            fallback.setDate(today.getDate() + 7);
            return fallback.toISOString().split('T')[0];
        }
    }
}

/**
 * Post-process AI-generated instructions to ensure proper HTML formatting.
 * Converts any markdown the AI might have used into clean HTML.
 */
function postProcessInstructions(html: string): string {
    let result = html;

    // If the result looks like mostly plain text (no HTML tags), convert it
    const hasHtmlTags = /<(h[1-6]|p|ul|ol|li|strong|em|blockquote|div)\b/i.test(result);

    if (!hasHtmlTags) {
        // Convert markdown-style formatting to HTML
        const lines = result.split('\n');
        const processedLines: string[] = [];
        let inList = false;
        let listType = '';

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) {
                if (inList) {
                    processedLines.push(listType === 'ul' ? '</ul>' : '</ol>');
                    inList = false;
                    listType = '';
                }
                continue;
            }

            // Convert markdown headings
            if (line.startsWith('### ')) {
                if (inList) { processedLines.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; }
                const text = line.replace(/^###\s*/, '');
                processedLines.push(`<h3 style="color: #1e40af; border-bottom: 2px solid #dbeafe; padding-bottom: 8px; margin-top: 20px;">${text}</h3>`);
            } else if (line.startsWith('## ')) {
                if (inList) { processedLines.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; }
                const text = line.replace(/^##\s*/, '');
                processedLines.push(`<h3 style="color: #1e40af; border-bottom: 2px solid #dbeafe; padding-bottom: 8px; margin-top: 20px;">${text}</h3>`);
            } else if (line.startsWith('# ')) {
                if (inList) { processedLines.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; }
                const text = line.replace(/^#\s*/, '');
                processedLines.push(`<h3 style="color: #1e40af; border-bottom: 2px solid #dbeafe; padding-bottom: 8px; margin-top: 20px;">${text}</h3>`);
            }
            // Convert bullet list items
            else if (/^[-*]\s+/.test(line)) {
                const text = line.replace(/^[-*]\s+/, '');
                if (!inList || listType !== 'ul') {
                    if (inList) processedLines.push('</ol>');
                    processedLines.push('<ul>');
                    inList = true;
                    listType = 'ul';
                }
                processedLines.push(`<li>${convertInlineMarkdown(text)}</li>`);
            }
            // Convert numbered list items
            else if (/^\d+[.)]\s+/.test(line)) {
                const text = line.replace(/^\d+[.)]\s+/, '');
                if (!inList || listType !== 'ol') {
                    if (inList) processedLines.push('</ul>');
                    processedLines.push('<ol>');
                    inList = true;
                    listType = 'ol';
                }
                processedLines.push(`<li>${convertInlineMarkdown(text)}</li>`);
            }
            // Convert blockquotes
            else if (line.startsWith('> ')) {
                if (inList) { processedLines.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; }
                const text = line.replace(/^>\s*/, '');
                processedLines.push(`<blockquote style="border-left: 4px solid #f59e0b; padding: 10px 16px; background: #fffbeb; border-radius: 4px; margin: 12px 0;"><p>${convertInlineMarkdown(text)}</p></blockquote>`);
            }
            // Regular paragraph
            else {
                if (inList) { processedLines.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; }
                processedLines.push(`<p>${convertInlineMarkdown(line)}</p>`);
            }
        }

        if (inList) {
            processedLines.push(listType === 'ul' ? '</ul>' : '</ol>');
        }

        result = processedLines.join('\n');
    } else {
        // Already has HTML but might have markdown inline formatting mixed in
        result = convertInlineMarkdown(result);
    }

    return result;
}

/** Convert inline markdown (bold, italic) to HTML tags */
function convertInlineMarkdown(text: string): string {
    return text
        // Bold: **text** or __text__
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        // Italic: *text* or _text_ (but not inside words)
        .replace(/(?<!\w)\*(?!\s)(.+?)(?<!\s)\*(?!\w)/g, '<em>$1</em>')
        .replace(/(?<!\w)_(?!\s)(.+?)(?<!\s)_(?!\w)/g, '<em>$1</em>');
}

/**
 * Generate AI-suggested instructions based on assignment title and description.
 * Returns HTML-formatted instructions string.
 */
export async function generateAIInstructions(
    title: string,
    description: string,
    assignmentType: string = 'assignment',
): Promise<{ success: boolean; instructions: string; error?: string }> {
    const accounts = getGroqAccounts();

    if (accounts.length === 0) {
        return { success: false, instructions: '', error: 'No GROQ API keys configured.' };
    }

    // Reset if all accounts failed
    if (failedAccounts.size >= accounts.length) {
        failedAccounts.clear();
        currentAccountIndex = 0;
    }

    const systemPrompt = `You are an expert teaching assistant at STI College. Your job is to generate beautifully formatted, professional assignment instructions using ONLY raw HTML tags.

## CRITICAL FORMAT RULES
- You MUST return raw HTML only. No markdown. No code fences. No preamble text.
- Every section heading MUST use <h3> tags with a bottom border for visual separation.
- Use <ul> with <li> for bullet lists, <ol> with <li> for numbered/step lists.
- Use <strong> for bold labels and key terms. Use <em> for emphasis.
- Use <p> tags for paragraphs — NEVER plain text without tags.
- Add <br> or use separate <p> tags for spacing between sections.
- Use <blockquote> for important notes or warnings.

## REQUIRED SECTIONS (use these exact headings wrapped in <h3> tags):
1. 📋 Objectives / Learning Outcomes — bullet list of what students will learn
2. 📝 Requirements / Tasks — numbered list of specific tasks to complete
3. 📤 Submission Guidelines — how/where/when to submit
4. 📊 Grading Criteria — brief table or list of how work will be graded
5. ⚠️ Important Notes — academic integrity, late policy, tips

## EXAMPLE OUTPUT (follow this structure exactly):

<h3 style="color: #1e40af; border-bottom: 2px solid #dbeafe; padding-bottom: 8px; margin-top: 20px;">📋 Objectives / Learning Outcomes</h3>
<p>By completing this ${assignmentType}, you will be able to:</p>
<ul>
<li><strong>Understand</strong> the core concepts of the topic</li>
<li><strong>Apply</strong> practical skills in real-world scenarios</li>
<li><strong>Demonstrate</strong> critical thinking and analysis</li>
</ul>

<h3 style="color: #1e40af; border-bottom: 2px solid #dbeafe; padding-bottom: 8px; margin-top: 20px;">📝 Requirements / Tasks</h3>
<p>Complete the following tasks in order:</p>
<ol>
<li><strong>Task 1:</strong> Description of what to do with specific details</li>
<li><strong>Task 2:</strong> Next step with clear instructions</li>
<li><strong>Task 3:</strong> Another task with measurable criteria</li>
</ol>

<h3 style="color: #1e40af; border-bottom: 2px solid #dbeafe; padding-bottom: 8px; margin-top: 20px;">📤 Submission Guidelines</h3>
<ul>
<li><strong>Format:</strong> Submit as a .docx or .pdf file</li>
<li><strong>Naming Convention:</strong> LastName_FirstName_AssignmentTitle</li>
<li><strong>Where:</strong> Upload through the eLMS portal</li>
</ul>

<h3 style="color: #1e40af; border-bottom: 2px solid #dbeafe; padding-bottom: 8px; margin-top: 20px;">📊 Grading Criteria</h3>
<ul>
<li><strong>Completeness (40%)</strong> — All tasks are completed as specified</li>
<li><strong>Quality (30%)</strong> — Work demonstrates understanding</li>
<li><strong>Presentation (20%)</strong> — Clean, organized, well-formatted</li>
<li><strong>Timeliness (10%)</strong> — Submitted on or before the deadline</li>
</ul>

<h3 style="color: #1e40af; border-bottom: 2px solid #dbeafe; padding-bottom: 8px; margin-top: 20px;">⚠️ Important Notes</h3>
<blockquote style="border-left: 4px solid #f59e0b; padding: 10px 16px; background: #fffbeb; border-radius: 4px; margin: 12px 0;">
<p><strong>Academic Integrity:</strong> All work must be your own. Plagiarism will result in a failing grade.</p>
</blockquote>
<ul>
<li>Late submissions may incur a penalty</li>
<li>Ask your instructor if you need clarification</li>
</ul>

## INSTRUCTIONS
Now generate complete, detailed, well-formatted HTML instructions for the ${assignmentType} described below. Follow the exact structure and styling from the example above. Make the content SPECIFIC to the topic — do not use generic placeholder text.`;

    const userPrompt = `Generate detailed, well-formatted HTML instructions for this ${assignmentType}:

Title: ${title}
${description ? `Description: ${description}` : '(No description provided — infer from the title)'}

IMPORTANT: Return ONLY raw HTML. Use <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote> tags. Follow the exact section structure and inline styles from the system prompt example. Make content specific and detailed.`;

    const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
    ];

    // Try accounts with rotation
    let attempts = 0;
    const maxAttempts = accounts.length;

    while (attempts < maxAttempts) {
        while (failedAccounts.has(currentAccountIndex) && attempts < maxAttempts) {
            currentAccountIndex = (currentAccountIndex + 1) % accounts.length;
            attempts++;
        }
        if (attempts >= maxAttempts) break;

        const account = accounts[currentAccountIndex];
        const result = await callGroqChat(account.apiKey, messages);

        if (result.success) {
            saveCurrentAccount();
            // Clean up and post-process the response
            let instructions = result.content
                .replace(/```html\s*/gi, '')
                .replace(/```\s*/g, '')
                .trim();

            // Post-process: convert any markdown the AI might have used into HTML
            instructions = postProcessInstructions(instructions);

            return { success: true, instructions };
        }

        if (result.rateLimited) {
            failedAccounts.add(currentAccountIndex);
            currentAccountIndex = (currentAccountIndex + 1) % accounts.length;
            saveCurrentAccount();
            attempts++;
            continue;
        }

        return { success: false, instructions: '', error: result.error || 'Failed to generate instructions' };
    }

    return { success: false, instructions: '', error: 'All API accounts rate limited. Try again later.' };
}

/**
 * Check if AI assignment creation is available (API keys configured).
 */
export function isAIAssignmentConfigured(): boolean {
    return getGroqAccounts().length > 0;
}
