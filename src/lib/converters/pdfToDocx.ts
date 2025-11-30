import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    PageBreak,
    BorderStyle,
    convertInchesToTwip,
    UnderlineType,
} from 'docx';

// Dynamically import pdfjs-dist
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

const initPdfJs = async () => {
    if (!pdfjsLib) {
        pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            '/pdf.worker.min.mjs',
            window.location.origin
        ).href;
    }
    return pdfjsLib;
};

interface RawTextItem {
    str: string;
    dir: string;
    transform: number[];
    width: number;
    height: number;
    fontName: string;
    hasEOL: boolean;
}

interface StyleInfo {
    isBold: boolean;
    isItalic: boolean;
    isUnderline: boolean;
}

interface TextChunk {
    text: string;
    x: number;
    y: number;
    endX: number;
    fontSize: number;
    fontName: string;
    style: StyleInfo;
}

interface TextLine {
    chunks: TextChunk[];
    y: number;
}

// Font style cache
const fontStyleCache = new Map<string, StyleInfo>();

// Analyze font name to detect style
const analyzeFont = (fontName: string): StyleInfo => {
    if (fontStyleCache.has(fontName)) {
        return fontStyleCache.get(fontName)!;
    }

    const fn = fontName.toLowerCase();
    
    const style: StyleInfo = {
        isBold: 
            fn.includes('bold') ||
            fn.includes('black') ||
            fn.includes('heavy') ||
            fn.includes('semibold') ||
            fn.includes('demi') ||
            fn.includes('medium') ||
            /-b[^a-z]/i.test(fontName) ||
            /\bb\b/i.test(fontName) ||
            fn.endsWith('bd') ||
            fn.endsWith('-b'),
        isItalic:
            fn.includes('italic') ||
            fn.includes('oblique') ||
            fn.includes('inclined') ||
            /-i[^a-z]/i.test(fontName) ||
            fn.endsWith('-i'),
        isUnderline: false,
    };

    fontStyleCache.set(fontName, style);
    return style;
};

// Process raw items into chunks
const processItems = (
    items: RawTextItem[],
    pageHeight: number
): TextChunk[] => {
    const chunks: TextChunk[] = [];
    const seenFonts = new Set<string>();

    for (const item of items) {
        if (!item.str) continue;

        const [scaleX, , , scaleY, x, y] = item.transform;
        const fontSize = Math.abs(scaleY || scaleX) || 12;
        const fontName = item.fontName || '';
        
        seenFonts.add(fontName);

        chunks.push({
            text: item.str,
            x: x,
            y: pageHeight - y,
            endX: x + (item.width || fontSize * item.str.length * 0.5),
            fontSize: fontSize,
            fontName: fontName,
            style: analyzeFont(fontName),
        });
    }

    // Debug: log fonts found
    console.log('Fonts in PDF:', Array.from(seenFonts));
    console.log('Font styles detected:', 
        Array.from(seenFonts).map(f => ({ font: f, ...analyzeFont(f) }))
    );

    return chunks;
};

// Group chunks into lines based on Y position
const groupIntoLines = (chunks: TextChunk[]): TextLine[] => {
    if (chunks.length === 0) return [];

    // Sort by Y then X
    const sorted = [...chunks].sort((a, b) => {
        const yDiff = a.y - b.y;
        if (Math.abs(yDiff) > 4) return yDiff;
        return a.x - b.x;
    });

    const lines: TextLine[] = [];
    let currentChunks: TextChunk[] = [sorted[0]];
    let currentY = sorted[0].y;

    for (let i = 1; i < sorted.length; i++) {
        const chunk = sorted[i];

        if (Math.abs(chunk.y - currentY) <= 4) {
            currentChunks.push(chunk);
        } else {
            currentChunks.sort((a, b) => a.x - b.x);
            lines.push({ chunks: currentChunks, y: currentY });
            currentChunks = [chunk];
            currentY = chunk.y;
        }
    }

    if (currentChunks.length > 0) {
        currentChunks.sort((a, b) => a.x - b.x);
        lines.push({ chunks: currentChunks, y: currentY });
    }

    return lines;
};

// Build text runs from chunks with proper spacing
const buildTextRuns = (chunks: TextChunk[]): TextRun[] => {
    const runs: TextRun[] = [];

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const prev = i > 0 ? chunks[i - 1] : null;

        // Determine if space is needed
        if (prev) {
            const gap = chunk.x - prev.endX;
            const charWidth = prev.text.length > 0
                ? (prev.endX - prev.x) / prev.text.length
                : prev.fontSize * 0.5;

            if (gap > charWidth * 0.25) {
                runs.push(new TextRun({ text: ' ' }));
            }
        }

        runs.push(
            new TextRun({
                text: chunk.text,
                bold: chunk.style.isBold,
                italics: chunk.style.isItalic,
                underline: chunk.style.isUnderline 
                    ? { type: UnderlineType.SINGLE } 
                    : undefined,
                size: Math.round(chunk.fontSize * 2),
            })
        );
    }

    return runs;
};

// Get plain text from line
const getLineText = (line: TextLine): string => {
    return line.chunks.map(c => c.text).join(' ').trim();
};

// Check if line is a separator
const isSeparator = (line: TextLine): boolean => {
    const text = getLineText(line);
    return /^[_\-─━═]{5,}$/.test(text.replace(/\s/g, ''));
};

// Check if majority of line is bold
const isLineBold = (line: TextLine): boolean => {
    const totalChars = line.chunks.reduce((sum, c) => sum + c.text.length, 0);
    const boldChars = line.chunks
        .filter(c => c.style.isBold)
        .reduce((sum, c) => sum + c.text.length, 0);
    return boldChars > totalChars * 0.5;
};

// Get average font size
const getAvgFontSize = (line: TextLine): number => {
    const total = line.chunks.reduce((sum, c) => sum + c.fontSize * c.text.length, 0);
    const chars = line.chunks.reduce((sum, c) => sum + c.text.length, 0);
    return chars > 0 ? total / chars : 12;
};

// Main conversion function
export const convertPdfToDocx = async (file: File): Promise<Blob> => {
    const pdfjs = await initPdfJs();
    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjs.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
    }).promise;

    const allParagraphs: Paragraph[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        const textContent = await page.getTextContent();

        const chunks = processItems(
            textContent.items as RawTextItem[],
            viewport.height
        );

        const lines = groupIntoLines(chunks);

        if (lines.length === 0) continue;

        // Calculate typical line spacing
        const gaps: number[] = [];
        for (let i = 1; i < lines.length; i++) {
            gaps.push(lines[i].y - lines[i - 1].y);
        }
        const avgGap = gaps.length > 0
            ? gaps.reduce((a, b) => a + b, 0) / gaps.length
            : 15;

        // Process lines into paragraphs
        let currentRuns: TextRun[] = [];
        let currentBold = false;
        let currentFontSize = 12;

        const flush = (extraSpace = false) => {
            if (currentRuns.length === 0) return;
            
            allParagraphs.push(
                new Paragraph({
                    children: currentRuns,
                    spacing: { 
                        after: extraSpace ? 280 : 160,
                        line: 276 
                    },
                    alignment: AlignmentType.JUSTIFIED,
                })
            );
            currentRuns = [];
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const prev = i > 0 ? lines[i - 1] : null;
            const text = getLineText(line);

            if (!text) continue;

            // Handle separators
            if (isSeparator(line)) {
                flush();
                allParagraphs.push(
                    new Paragraph({
                        border: {
                            bottom: {
                                color: '000000',
                                space: 1,
                                style: BorderStyle.SINGLE,
                                size: 6,
                            },
                        },
                        spacing: { after: 200 },
                    })
                );
                continue;
            }

            const lineBold = isLineBold(line);
            const lineFontSize = getAvgFontSize(line);

            // Check if new paragraph needed
            let newPara = currentRuns.length === 0;

            if (!newPara && prev) {
                const gap = line.y - prev.y;
                
                // New paragraph conditions
                if (
                    gap > avgGap * 1.5 ||  // Large gap
                    lineBold !== currentBold ||  // Bold changed
                    Math.abs(lineFontSize - currentFontSize) > 1.5  // Font size changed
                ) {
                    flush(gap > avgGap * 1.5);
                    newPara = true;
                }
            }

            if (newPara) {
                currentBold = lineBold;
                currentFontSize = lineFontSize;
            } else {
                // Add space between lines in same paragraph
                currentRuns.push(new TextRun({ text: ' ' }));
            }

            // Add line content
            currentRuns.push(...buildTextRuns(line.chunks));
        }

        flush();

        // Page break
        if (pageNum < pdf.numPages && allParagraphs.length > 0) {
            allParagraphs.push(
                new Paragraph({ children: [new PageBreak()] })
            );
        }
    }

    // Create document
    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: convertInchesToTwip(1),
                            right: convertInchesToTwip(1),
                            bottom: convertInchesToTwip(1),
                            left: convertInchesToTwip(1),
                        },
                    },
                },
                children: allParagraphs.length > 0
                    ? allParagraphs
                    : [new Paragraph({ children: [new TextRun('No text found.')] })],
            },
        ],
    });

    return await Packer.toBlob(doc);
};
