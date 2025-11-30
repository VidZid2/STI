export interface TextStats {
    words: number;
    characters: number;
    charactersNoSpaces: number;
    sentences: number;
    paragraphs: number;
    readingTime: string;
    speakingTime: string;
    avgWordLength: number;
    avgSentenceLength: number;
    longestWord: string;
    topWords: { word: string; count: number }[];
}

export const analyzeText = (text: string): TextStats => {
    const trimmed = text.trim();
    
    // Basic counts
    const words = trimmed ? trimmed.split(/\s+/).filter(w => w.length > 0) : [];
    const wordCount = words.length;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    
    // Sentence detection (handles ., !, ?, and combinations)
    const sentences = (text.match(/[^.!?]*[.!?]+/g) || []).filter(s => s.trim().length > 0);
    const sentenceCount = sentences.length || (trimmed ? 1 : 0);
    
    // Paragraph detection
    const paragraphs = trimmed.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const paragraphCount = paragraphs.length || (trimmed ? 1 : 0);
    
    // Reading/speaking time (avg reading: 200 wpm, speaking: 150 wpm)
    const readingMinutes = Math.ceil(wordCount / 200);
    const speakingMinutes = Math.ceil(wordCount / 150);
    
    // Average word length
    const avgWordLength = wordCount > 0 
        ? Math.round((words.reduce((sum, w) => sum + w.length, 0) / wordCount) * 10) / 10
        : 0;
    
    // Average sentence length
    const avgSentenceLength = sentenceCount > 0 
        ? Math.round(wordCount / sentenceCount)
        : 0;
    
    // Longest word
    const longestWord = words.reduce((longest, word) => 
        word.length > longest.length ? word : longest, '');
    
    // Word frequency (top 5, excluding common words)
    const commonWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
        'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
        'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
        'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when',
        'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
        'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
        'so', 'than', 'too', 'very', 'just', 'as'
    ]);
    
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
        const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
        if (cleaned.length > 2 && !commonWords.has(cleaned)) {
            wordFreq[cleaned] = (wordFreq[cleaned] || 0) + 1;
        }
    });
    
    const topWords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word, count]) => ({ word, count }));
    
    return {
        words: wordCount,
        characters,
        charactersNoSpaces,
        sentences: sentenceCount,
        paragraphs: paragraphCount,
        readingTime: readingMinutes <= 1 ? '< 1 min' : `${readingMinutes} min`,
        speakingTime: speakingMinutes <= 1 ? '< 1 min' : `${speakingMinutes} min`,
        avgWordLength,
        avgSentenceLength,
        longestWord,
        topWords,
    };
};

// Read text from various file types
export const readTextFromFile = async (file: File): Promise<string> => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'txt' || extension === 'md' || extension === 'csv') {
        return await file.text();
    }
    
    // For other text-based files, try to read as text
    try {
        return await file.text();
    } catch {
        throw new Error(`Unable to read text from ${file.name}`);
    }
};
