/**
 * Smart Mention Service
 * Hybrid approach: Local keyword matching + Optional Groq AI fallback
 * Suggests relevant users based on message content
 */

import type { MentionUser } from '../../pages/GroupChatPage/components/MentionAutocomplete';

// Subject categories with keywords
export const SUBJECT_KEYWORDS: Record<string, string[]> = {
    math: [
        'math', 'mathematics', 'calculus', 'algebra', 'geometry', 'trigonometry',
        'statistics', 'probability', 'equation', 'formula', 'derivative', 'integral',
        'function', 'graph', 'number', 'calculate', 'solve', 'proof', 'theorem',
        'matrix', 'vector', 'linear', 'quadratic', 'polynomial', 'fraction',
    ],
    science: [
        'science', 'physics', 'chemistry', 'biology', 'lab', 'experiment',
        'hypothesis', 'theory', 'atom', 'molecule', 'cell', 'organism',
        'energy', 'force', 'motion', 'reaction', 'element', 'compound',
        'genetics', 'evolution', 'ecosystem', 'photosynthesis',
    ],
    programming: [
        'code', 'coding', 'programming', 'developer', 'software', 'algorithm',
        'javascript', 'python', 'java', 'react', 'html', 'css', 'database',
        'api', 'function', 'variable', 'loop', 'array', 'object', 'class',
        'debug', 'error', 'bug', 'git', 'github', 'frontend', 'backend',
    ],
    writing: [
        'essay', 'writing', 'grammar', 'paragraph', 'thesis', 'citation',
        'research', 'paper', 'article', 'report', 'summary', 'analysis',
        'argument', 'conclusion', 'introduction', 'outline', 'draft',
        'proofread', 'edit', 'revise', 'apa', 'mla', 'bibliography',
    ],
    language: [
        'english', 'spanish', 'french', 'german', 'chinese', 'japanese',
        'language', 'vocabulary', 'grammar', 'pronunciation', 'translation',
        'conjugation', 'tense', 'verb', 'noun', 'adjective', 'sentence',
    ],
    history: [
        'history', 'historical', 'war', 'revolution', 'civilization', 'empire',
        'ancient', 'medieval', 'modern', 'century', 'era', 'period',
        'president', 'king', 'queen', 'dynasty', 'colonization',
    ],
    business: [
        'business', 'economics', 'finance', 'accounting', 'marketing',
        'management', 'entrepreneur', 'startup', 'investment', 'stock',
        'profit', 'revenue', 'budget', 'strategy', 'market', 'trade',
    ],
    art: [
        'art', 'design', 'drawing', 'painting', 'sculpture', 'photography',
        'graphic', 'illustration', 'creative', 'color', 'composition',
        'portfolio', 'sketch', 'digital', 'animation', 'visual',
    ],
};

// Extended user type with expertise
export interface SmartMentionUser extends MentionUser {
    expertise?: string[];
    recentMentions?: number;
    lastActive?: Date;
    studyStreak?: number;
    level?: number;
    availability?: 'available' | 'studying' | 'busy' | 'offline';
}

// Cache for AI suggestions
const aiSuggestionCache = new Map<string, { subjects: string[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Extract subjects from text using local keyword matching
 */
export function extractSubjectsLocal(text: string): string[] {
    const lowerText = text.toLowerCase();
    const foundSubjects: string[] = [];
    
    for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
        for (const keyword of keywords) {
            if (lowerText.includes(keyword)) {
                if (!foundSubjects.includes(subject)) {
                    foundSubjects.push(subject);
                }
                break;
            }
        }
    }
    
    return foundSubjects;
}

/**
 * Extract subjects using Groq AI (for complex queries)
 */
export async function extractSubjectsAI(text: string): Promise<string[]> {
    // Check cache first
    const cacheKey = text.toLowerCase().trim();
    const cached = aiSuggestionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.subjects;
    }
    
    // Get API key
    const apiKey = import.meta.env.VITE_GROQ_API_KEY_1 || import.meta.env.VITE_GROQ_API_KEY || '';
    if (!apiKey) {
        return [];
    }
    
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
                        content: `You are a subject classifier. Given a student's message, identify which academic subjects it relates to.
                        
Available subjects: math, science, programming, writing, language, history, business, art

Rules:
- Return ONLY a JSON array of subject names, nothing else
- Return empty array [] if no clear subject
- Maximum 3 subjects
- Example: ["math", "programming"]`,
                    },
                    {
                        role: 'user',
                        content: text,
                    },
                ],
                temperature: 0.1,
                max_tokens: 50,
            }),
        });
        
        if (!response.ok) {
            return [];
        }
        
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim() || '[]';
        
        // Parse JSON response
        const subjects = JSON.parse(content);
        if (Array.isArray(subjects)) {
            const validSubjects = subjects.filter(s => 
                typeof s === 'string' && Object.keys(SUBJECT_KEYWORDS).includes(s)
            );
            
            // Cache result
            aiSuggestionCache.set(cacheKey, { subjects: validSubjects, timestamp: Date.now() });
            return validSubjects;
        }
        
        return [];
    } catch (error) {
        console.error('[SmartMention] AI extraction failed:', error);
        return [];
    }
}

/**
 * Score a user based on relevance to detected subjects
 */
function scoreUser(user: SmartMentionUser, subjects: string[], messageText: string): number {
    let score = 0;
    
    // Base score for online users
    if (user.isOnline) score += 20;
    if (user.availability === 'available') score += 15;
    if (user.availability === 'studying') score += 10;
    
    // Expertise match (highest priority)
    if (user.expertise && subjects.length > 0) {
        for (const subject of subjects) {
            if (user.expertise.includes(subject)) {
                score += 50; // Big boost for expertise match
            }
        }
    }
    
    // Role bonus
    if (user.role === 'owner') score += 5;
    if (user.role === 'admin') score += 3;
    
    // Activity bonus
    if (user.studyStreak && user.studyStreak > 5) score += 10;
    if (user.level && user.level > 5) score += 5;
    
    // Recent mentions (study buddies)
    if (user.recentMentions && user.recentMentions > 0) {
        score += Math.min(user.recentMentions * 5, 25);
    }
    
    // Name match with query
    const lowerName = user.name.toLowerCase();
    const lowerText = messageText.toLowerCase();
    if (lowerText.includes(lowerName.split(' ')[0])) {
        score += 30;
    }
    
    return score;
}

/**
 * Get smart suggestions for mentions
 */
export async function getSmartSuggestions(
    users: SmartMentionUser[],
    messageText: string,
    options: {
        useAI?: boolean;
        maxResults?: number;
    } = {}
): Promise<{
    users: SmartMentionUser[];
    detectedSubjects: string[];
    aiUsed: boolean;
}> {
    const { useAI = true, maxResults = 6 } = options;
    
    // Step 1: Local keyword extraction (instant)
    let detectedSubjects = extractSubjectsLocal(messageText);
    let aiUsed = false;
    
    // Step 2: AI fallback if local found nothing and text is substantial
    if (useAI && detectedSubjects.length === 0 && messageText.length > 15) {
        const aiSubjects = await extractSubjectsAI(messageText);
        if (aiSubjects.length > 0) {
            detectedSubjects = aiSubjects;
            aiUsed = true;
        }
    }
    
    // Step 3: Score and sort users
    const scoredUsers = users.map(user => ({
        user,
        score: scoreUser(user, detectedSubjects, messageText),
    }));
    
    scoredUsers.sort((a, b) => b.score - a.score);
    
    // Step 4: Return top results
    return {
        users: scoredUsers.slice(0, maxResults).map(s => s.user),
        detectedSubjects,
        aiUsed,
    };
}

/**
 * Get subject icon/emoji
 */
export function getSubjectIcon(subject: string): string {
    const icons: Record<string, string> = {
        math: '🔢',
        science: '🔬',
        programming: '💻',
        writing: '✍️',
        language: '🌐',
        history: '📜',
        business: '📊',
        art: '🎨',
    };
    return icons[subject] || '📚';
}

/**
 * Get subject display name
 */
export function getSubjectName(subject: string): string {
    const names: Record<string, string> = {
        math: 'Mathematics',
        science: 'Science',
        programming: 'Programming',
        writing: 'Writing',
        language: 'Languages',
        history: 'History',
        business: 'Business',
        art: 'Art & Design',
    };
    return names[subject] || subject;
}
