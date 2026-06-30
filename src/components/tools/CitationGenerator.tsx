/**
 * Citation Generator Component
 * Generate properly formatted citations for academic papers
 * 
 * Features:
 * - Multiple citation styles (APA, MLA, Chicago)
 * - Various source types (Book, Website, Journal)
 * - Real-time animated completeness score ring
 * - Copy to clipboard with rich HTML (keeps italics when pasted in Word/Docs)
 * - Integrates directly with Reference Manager (saves references to local storage)
 * - Search bar with intelligent client-side Auto-Fill for URLs, Wikipedia, and ISBNs
 * - Clean, minimalistic, standard Tailwind CSS design matching WordCounter
 */

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { BookMarked, BookOpen, Bookmark, CheckCircle2, ClipboardCheck, Globe2, Newspaper, Save, Search, Sparkles, Zap, Type, Layers, FileText, FileSpreadsheet, Trash2, AlertCircle, Lightbulb } from "lucide-react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { formatToolSessionTime, useToolSession } from "./useToolSession";
import { extractCitationWithAI, isCitationAIConfigured, fetchWebsiteMetadata, extractDOI, fetchDOIMetadata } from '../../lib/converters/aiCitationService';
import { ToolHeaderBadge } from "./ToolHeaderBadges";
import ToolMobileSheet from "./ToolMobileSheet";
import { exportBibliographyToDocx } from "../../lib/export/docxExport";
import { CitationGeneratorEmpty } from "./empty-states";

interface CitationGeneratorProps {
    onBack: () => void;
    initialText?: string;
    onGoToReferenceManager?: () => void;
}

type CitationStyle = 'APA' | 'MLA' | 'Chicago';
type SourceType = 'book' | 'website' | 'journal';

interface CitationData {
    sourceType: SourceType;
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

interface CitationGeneratorSession {
    citationStyle: CitationStyle;
    sourceType: SourceType;
    citationData: CitationData;
    generatedCitation: string;
    autoFillInput: string;
}

const createEmptyCitationData = (sourceType: SourceType = 'book'): CitationData => ({
    sourceType,
    authors: '',
    title: '',
    publicationYear: '',
    publisher: '',
    url: '',
    accessDate: '',
    journalName: '',
    volume: '',
    issue: '',
    pages: '',
});

const citationDataHasContent = (data: CitationData) => {
    return Object.entries(data).some(([key, value]) => (
        key !== 'sourceType' && typeof value === 'string' && value.trim() !== ''
    ));
};

const shouldPersistCitationSession = (session: CitationGeneratorSession) => {
    return (
        citationDataHasContent(session.citationData) ||
        session.generatedCitation.trim().length > 0 ||
        session.autoFillInput.trim().length > 0
    );
};

const emptyCitationSession: CitationGeneratorSession = {
    citationStyle: 'APA',
    sourceType: 'book',
    citationData: createEmptyCitationData(),
    generatedCitation: '',
    autoFillInput: '',
};

// Reusable Floating label input field component (defined outside CitationGenerator to prevent focus loss on re-render)
const FloatingInput = ({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
}) => {
    const id = React.useId();
    return (
        <div className="relative w-full">
            <input
                id={id}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder=" "
                autoComplete="off"
                className="peer w-full rounded-[1rem] border-[1.5px] border-zinc-300 bg-transparent p-4 text-base text-zinc-900 outline-none transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] focus:border-violet-500 dark:border-zinc-700 dark:text-zinc-100 dark:focus:border-violet-500"
            />
            <label
                htmlFor={id}
                className="pointer-events-none absolute left-[15px] top-0 origin-left -translate-y-1/2 scale-[0.8] bg-white px-1 text-zinc-500 transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] peer-placeholder-shown:translate-y-[1rem] peer-placeholder-shown:scale-100 peer-placeholder-shown:bg-transparent peer-placeholder-shown:px-0 peer-focus:-translate-y-1/2 peer-focus:scale-[0.8] peer-focus:bg-white peer-focus:px-1 peer-focus:text-violet-600 dark:bg-zinc-900 dark:text-zinc-400 dark:peer-focus:bg-zinc-900 dark:peer-focus:text-violet-400 dark:peer-placeholder-shown:bg-transparent"
            >
                {label}
            </label>
        </div>
    );
};

const CitationGenerator: React.FC<CitationGeneratorProps> = ({ onBack, onGoToReferenceManager }) => {
    const [citationStyle, setCitationStyle] = useState<CitationStyle>('APA');
    const [sourceType, setSourceType] = useState<SourceType>('book');
    const [citationData, setCitationData] = useState<CitationData>(createEmptyCitationData());
    const [generatedCitation, setGeneratedCitation] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [savedToReference, setSavedToReference] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(true);

    // Auto-fill states
    const [autoFillInput, setAutoFillInput] = useState('');
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const [autoFillWarning, setAutoFillWarning] = useState<string | null>(null);
    const [failedUrl, setFailedUrl] = useState<string | null>(null);

    const hasAnyInput = useMemo(() => {
        return citationDataHasContent(citationData);
    }, [citationData]);
    const hasClearableWork = hasAnyInput || generatedCitation.trim().length > 0 || autoFillInput.trim().length > 0;

    const currentSession = useMemo<CitationGeneratorSession>(() => ({
        citationStyle,
        sourceType,
        citationData,
        generatedCitation,
        autoFillInput,
    }), [autoFillInput, citationData, citationStyle, generatedCitation, sourceType]);

    const {
        initialData,
        hasSavedSession,
        lastSavedAt,
        clearSavedSession,
    } = useToolSession('citation-generator', currentSession, {
        emptySession: emptyCitationSession,
        shouldPersist: shouldPersistCitationSession,
    });

    const restoreSavedCitationSession = () => {
        const restoredSourceType = initialData.sourceType || 'book';
        setCitationStyle(initialData.citationStyle || 'APA');
        setSourceType(restoredSourceType);
        setCitationData({
            ...createEmptyCitationData(restoredSourceType),
            ...(initialData.citationData || {}),
            sourceType: restoredSourceType,
        });
        setGeneratedCitation(initialData.generatedCitation || '');
        setAutoFillInput(initialData.autoFillInput || '');
    };

    // Simulate initial page load
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsPageLoading(false);
        }, 400);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (shouldPersistCitationSession(initialData)) {
            restoreSavedCitationSession();
        }
    }, []);

    // Update source type when changed
    useEffect(() => {
        setCitationData(prev => ({ ...prev, sourceType }));
    }, [sourceType]);

    // Generate citation whenever data or style changes
    useEffect(() => {
        if (citationData.authors && citationData.title && citationData.publicationYear) {
            const citation = generateCitation(citationData, citationStyle);
            setGeneratedCitation(citation);
        } else {
            setGeneratedCitation('');
        }
    }, [citationData, citationStyle]);

    const generateCitation = (data: CitationData, style: CitationStyle): string => {
        const { authors, title, publicationYear, publisher, url, accessDate, journalName, volume, issue, pages } = data;

        switch (style) {
            case 'APA':
                if (data.sourceType === 'book') {
                    return `${authors} (${publicationYear}). *${title}*${publisher ? `. ${publisher}` : ''}.`;
                } else if (data.sourceType === 'website') {
                    return `${authors} (${publicationYear}). *${title}*. Retrieved ${accessDate || 'Month Day, Year'}, from ${url || 'URL'}`;
                } else if (data.sourceType === 'journal') {
                    return `${authors} (${publicationYear}). ${title}. *${journalName}*, *${volume}*(${issue}), ${pages}.`;
                }
                break;

            case 'MLA':
                if (data.sourceType === 'book') {
                    return `${authors}. *${title}*${publisher ? `. ${publisher}` : ''}, ${publicationYear}.`;
                } else if (data.sourceType === 'website') {
                    return `${authors}. "${title}." ${publicationYear}. Web. ${accessDate || 'Day Month Year'}. <${url || 'URL'}>.`;
                } else if (data.sourceType === 'journal') {
                    return `${authors}. "${title}." *${journalName}* ${volume}.${issue} (${publicationYear}): ${pages}. Print.`;
                }
                break;

            case 'Chicago':
                if (data.sourceType === 'book') {
                    return `${authors}. *${title}*${publisher ? `. ${publisher}` : ''}, ${publicationYear}.`;
                } else if (data.sourceType === 'website') {
                    return `${authors}. "${title}." Accessed ${accessDate || 'Month Day, Year'}. ${url || 'URL'}.`;
                } else if (data.sourceType === 'journal') {
                    return `${authors}. "${title}." *${journalName}* ${volume}, no. ${issue} (${publicationYear}): ${pages}.`;
                }
                break;
        }

        return '';
    };

    // Helper to format current date for website citations
    const getTodayFormatted = () => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date().toLocaleDateString('en-US', options);
    };

    // Auto-fill logic based on URL or ISBN patterns
    const handleAutoFill = async () => {
        if (!autoFillInput.trim()) return;
        setIsAutoFilling(true);
        setAutoFillWarning(null);
        setFailedUrl(null);
        
        const input = autoFillInput.trim();
        const today = getTodayFormatted();

        try {
            // 1. Wikipedia Article Check
            if (input.includes('wikipedia.org')) {
                setSourceType('website');
                const match = input.match(/\/wiki\/([^?#]+)/);
                const pageTitle = match ? match[1] : '';

                if (pageTitle) {
                    let wikiCache: Record<string, any> = {};
                    try {
                        const cachedData = localStorage.getItem('wiki_cache');
                        if (cachedData) {
                            wikiCache = JSON.parse(cachedData);
                        }
                    } catch (e) {
                        console.error('Failed to read Wikipedia cache:', e);
                    }

                    if (wikiCache[pageTitle]) {
                        setCitationData({
                            sourceType: 'website',
                            ...wikiCache[pageTitle]
                        });
                        setAutoFillInput('');
                        setIsAutoFilling(false);
                        return;
                    }

                    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${pageTitle}`);
                    if (response.ok) {
                        const data = await response.json();
                        const wikiDetails = {
                            authors: 'Wikipedia Contributors',
                            title: data.title || decodeURIComponent(pageTitle).replace(/_/g, ' '),
                            publicationYear: data.timestamp ? new Date(data.timestamp).getFullYear().toString() : new Date().getFullYear().toString(),
                            url: input,
                            accessDate: today
                        };

                        try {
                            wikiCache[pageTitle] = wikiDetails;
                            localStorage.setItem('wiki_cache', JSON.stringify(wikiCache));
                        } catch (e) {
                            console.error('Failed to write Wikipedia cache:', e);
                        }

                        setCitationData({
                            sourceType: 'website',
                            ...wikiDetails
                        });
                        setAutoFillInput('');
                        setIsAutoFilling(false);
                        return;
                    }
                }
                
                const urlParts = input.split('/wiki/');
                const cleanName = urlParts[1] ? decodeURIComponent(urlParts[1]).replace(/_/g, ' ') : 'Wikipedia Article';
                setCitationData({
                    sourceType: 'website',
                    authors: 'Wikipedia Contributors',
                    title: cleanName,
                    publicationYear: new Date().getFullYear().toString(),
                    url: input,
                    accessDate: today
                });
            }
            // 2. ISBN Code Check (10 or 13 digits)
            else if (/^\d+$/.test(input.replace(/[- ]/g, ''))) {
                setSourceType('book');
                const cleanIsbn = input.replace(/[- ]/g, '');
                
                let isbnCache: Record<string, any> = {};
                try {
                    const cachedData = localStorage.getItem('isbn_cache');
                    if (cachedData) {
                        isbnCache = JSON.parse(cachedData);
                    }
                } catch (e) {
                    console.error('Failed to read ISBN cache:', e);
                }

                if (isbnCache[cleanIsbn]) {
                    setCitationData({
                        sourceType: 'book',
                        ...isbnCache[cleanIsbn]
                    });
                    setAutoFillInput('');
                    setIsAutoFilling(false);
                    return;
                }

                const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`);
                if (response.ok) {
                    const data = await response.json();
                    const bookKey = `ISBN:${cleanIsbn}`;
                    const book = data[bookKey];

                    if (book) {
                        const bookDetails = {
                            sourceType: 'book' as const,
                            authors: book.authors ? book.authors.map((a: any) => a.name).join(', ') : 'Unknown Author',
                            title: book.title || 'Untitled Book',
                            publicationYear: book.publish_date ? (book.publish_date.match(/\d{4}/)?.[0] || book.publish_date) : new Date().getFullYear().toString(),
                            publisher: book.publishers ? book.publishers.map((p: any) => p.name).join(', ') : 'Unknown Publisher'
                        };

                        try {
                            isbnCache[cleanIsbn] = bookDetails;
                            localStorage.setItem('isbn_cache', JSON.stringify(isbnCache));
                        } catch (e) {
                            console.error('Failed to write ISBN cache:', e);
                        }

                        setCitationData(bookDetails);
                        setAutoFillInput('');
                        setIsAutoFilling(false);
                        return;
                    }
                }

                setCitationData({
                    sourceType: 'book',
                    authors: 'Unknown Author',
                    title: `Book (ISBN: ${input})`,
                    publicationYear: new Date().getFullYear().toString(),
                    publisher: 'Unknown Publisher'
                });
            }
            // 3. AI Text Extraction, DOI Fetch, or URL Fallback
            else {
                if (isCitationAIConfigured()) {
                    let aiInput = input;
                    
                    // Check for Academic DOI first (Highest accuracy, bypasses AI)
                    const doi = extractDOI(input);
                    if (doi) {
                        const doiData = await fetchDOIMetadata(doi);
                        if (doiData) {
                            const safeData = { ...createEmptyCitationData('journal') };
                            (Object.keys(doiData) as Array<keyof typeof doiData>).forEach(key => {
                                if (doiData[key as keyof typeof doiData] !== null && doiData[key as keyof typeof doiData] !== undefined) {
                                    (safeData as any)[key] = doiData[key as keyof typeof doiData];
                                }
                            });
                            
                            setSourceType('journal');
                            setCitationData({
                                ...safeData,
                                accessDate: safeData.accessDate || today
                            });
                            setAutoFillInput('');
                            setIsAutoFilling(false);
                            return;
                        }
                    }
                    
                    // If it's a URL, attempt to scrape metadata via our CORS proxy first
                    if (input.startsWith('http') || input.startsWith('www')) {
                        const targetUrl = input.startsWith('http') ? input : `https://${input}`;
                        const metadataText = await fetchWebsiteMetadata(targetUrl);
                        if (metadataText) {
                            aiInput = metadataText; // Send the extracted metadata to AI instead of raw URL
                        }
                    }

                    const aiResult = await extractCitationWithAI(aiInput);
                    if (aiResult.success && aiResult.data) {
                        const safeData = { ...createEmptyCitationData(aiResult.data.sourceType) };
                        // Safely copy string values and avoid null/undefined
                        (Object.keys(aiResult.data) as Array<keyof typeof aiResult.data>).forEach(key => {
                            if (aiResult.data![key] !== null && aiResult.data![key] !== undefined) {
                                (safeData as any)[key] = aiResult.data![key];
                            }
                        });
                        
                        setSourceType(safeData.sourceType);
                        setCitationData({
                            ...safeData,
                            accessDate: safeData.accessDate || today
                        });
                        setAutoFillInput('');
                        setIsAutoFilling(false);
                        
                        // If the AI returned partial data but we failed to scrape the site (meaning it guessed from the URL)
                        if (aiInput === input && (input.startsWith('http') || input.startsWith('www'))) {
                            setFailedUrl(input);
                            setAutoFillWarning('Publisher bot-protection blocked our scanner. Please look for the DOI link on the publisher\'s page (starts with https://doi.org/...) and paste it here for 100% accuracy.');
                        } else if (!aiResult.data?.authors || aiResult.data.authors === 'Unknown Author') {
                            setAutoFillWarning('MiMo 2.5 successfully analyzed the link, but could not find a clear Author. Please double-check the source.');
                        } else if (!aiResult.data?.publicationYear) {
                            setAutoFillWarning('MiMo 2.5 found the article but could not locate a clear publication date. You may need to enter it manually.');
                        } else {
                            setAutoFillWarning(null); // Clear warnings if everything is perfect
                        }
                        
                        return;
                    } else {
                        // If the AI failed completely but it was a raw URL that we couldn't scrape, it's definitely a protected site
                        if (aiInput === input && (input.startsWith('http') || input.startsWith('www'))) {
                            setFailedUrl(input);
                            setAutoFillWarning('Publisher bot-protection blocked our scanner. Please look for the DOI link on the publisher\'s page (starts with https://doi.org/...) and paste it here for 100% accuracy.');
                        } else {
                            setAutoFillWarning(`MiMo 2.5 failed to analyze this link (${aiResult.error || 'Unknown error'}). Using basic fallback data.`);
                        }
                    }
                }
                
                // Fallback to basic URL parsing or simple text fallback if AI fails or is not configured
                if (input.startsWith('http') || input.startsWith('www')) {
                    if (!autoFillWarning) setAutoFillWarning('Could not fetch rich metadata for this link. Basic domain details were used.');
                    setSourceType('website');
                    const urlObj = new URL(input.startsWith('http') ? input : `https://${input}`);
                    const hostParts = urlObj.hostname.replace('www.', '').split('.');
                    const domainName = hostParts[0].charAt(0).toUpperCase() + hostParts[0].slice(1);

                    setCitationData({
                        sourceType: 'website',
                        authors: 'Unknown Author',
                        title: `${domainName} Web Resource`,
                        publicationYear: new Date().getFullYear().toString(),
                        url: input,
                        accessDate: today
                    });
                } else {
                    if (!autoFillWarning) setAutoFillWarning('No specific URL or ISBN detected. Using basic text fallback.');
                    setSourceType('book');
                    setCitationData({
                        sourceType: 'book',
                        authors: 'Unknown Author',
                        title: input.charAt(0).toUpperCase() + input.slice(1),
                        publicationYear: new Date().getFullYear().toString(),
                        publisher: 'Unknown Publisher'
                    });
                }
            }
        } catch (error) {
            console.error('[CitationGenerator] Auto-Fill Error:', error);
            setAutoFillWarning('An unexpected error occurred while auto-filling. Using fallback data.');
            // Graceful fallback
            setSourceType('website');
            setCitationData({
                sourceType: 'website',
                authors: 'Unknown Author',
                title: 'Online Source',
                publicationYear: new Date().getFullYear().toString(),
                url: input,
                accessDate: today
            });
        } finally {
            setAutoFillInput('');
            setIsAutoFilling(false);
        }
    };

    const handleCopy = async () => {
        if (generatedCitation) {
            try {
                const cleanText = generatedCitation.replace(/\*/g, '');
                
                // Format markdown *text* into HTML <i>text</i> for copy/paste compatibility
                const htmlText = generatedCitation
                    .replace(/\*([^*]+)\*/g, '<i>$1</i>')
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/&lt;i&gt;/g, '<i>')
                    .replace(/&lt;\/i&gt;/g, '</i>');
                
                const blobPlain = new Blob([cleanText], { type: 'text/plain' });
                const blobHtml = new Blob([htmlText], { type: 'text/html' });
                
                const clipboardItem = new ClipboardItem({
                    'text/plain': blobPlain,
                    'text/html': blobHtml
                });
                
                await navigator.clipboard.write([clipboardItem]);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                // Standard plain text fallback
                await navigator.clipboard.writeText(generatedCitation.replace(/\*/g, ''));
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        }
    };

    const handleSaveReference = () => {
        if (!citationData.authors || !citationData.title || !citationData.publicationYear) return;
        try {
            const saved = localStorage.getItem('references');
            const refs = saved ? JSON.parse(saved) : [];
            const newRef = {
                id: Date.now().toString(),
                sourceType,
                authors: citationData.authors,
                title: citationData.title,
                publicationYear: citationData.publicationYear,
                publisher: citationData.publisher || undefined,
                url: citationData.url || undefined,
                accessDate: citationData.accessDate || undefined,
                journalName: citationData.journalName || undefined,
                volume: citationData.volume || undefined,
                issue: citationData.issue || undefined,
                pages: citationData.pages || undefined,
                tags: ['Citation Generator'],
                dateAdded: Date.now()
            };
            
            // Avoid duplicate saves
            const isDuplicate = refs.some((r: any) => r.title === newRef.title && r.authors === newRef.authors);
            if (!isDuplicate) {
                refs.push(newRef);
                localStorage.setItem('references', JSON.stringify(refs));
            }
            
            setSavedToReference(true);
            setTimeout(() => setSavedToReference(false), 2000);
        } catch (err) {
            console.error("Failed to save reference:", err);
        }
    };

    const handleInputChange = (field: keyof CitationData, value: string) => {
        setCitationData(prev => ({ ...prev, [field]: value }));
    };

    const handleClear = () => {
        setCitationData(createEmptyCitationData(sourceType));
        setGeneratedCitation('');
        setAutoFillInput('');
        clearSavedSession();
    };

    // Calculate completeness score dynamically
    const completenessScore = useMemo(() => {
        const fields = {
            book: ['authors', 'title', 'publicationYear', 'publisher'],
            website: ['authors', 'title', 'publicationYear', 'url', 'accessDate'],
            journal: ['authors', 'title', 'publicationYear', 'journalName', 'volume', 'issue', 'pages']
        }[sourceType] || [];
        
        if (fields.length === 0) return 0;
        
        let filledCount = 0;
        fields.forEach(field => {
            if (citationData[field as keyof CitationData]?.trim()) {
                filledCount++;
            }
        });
        
        return Math.round((filledCount / fields.length) * 100);
    }, [citationData, sourceType]);

    // Format asterisks as italic elements safely
    const formatCitation = (text: string) => {
        const parts = text.split('*');
        return parts.map((part, idx) => {
            if (idx % 2 === 1) {
                return <em key={idx} className="italic not-italic font-serif font-semibold">{part}</em>;
            }
            return <span key={idx}>{part}</span>;
        });
    };


    if (isPageLoading) {
        return (
            <div className="mx-auto flex h-auto min-h-[calc(100vh-6rem)] w-full max-w-[1500px] flex-col gap-6 p-0 sm:p-0" role="status" aria-busy="true" aria-label="Loading Citation Generator">
                {/* Top Section */}
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
                    {/* Header Card */}
                    <div className="relative overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900 sm:p-8 flex flex-col gap-7 min-h-[250px]">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="skeleton-stagger">
                                <div className="skeleton-bone w-32 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-4" />
                                <div className="skeleton-bone w-3/4 max-w-md h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-3" />
                                <div className="skeleton-bone w-full max-w-lg h-12 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <div className="skeleton-bone w-24 h-11 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
                                <div className="skeleton-bone w-24 h-11 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
                            </div>
                        </div>
                    </div>
                    {/* Step Cards */}
                    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-4 rounded-[22px] border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900">
                                <div className="skeleton-bone h-12 w-12 shrink-0 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
                                <div className="min-w-0 flex flex-col gap-2 w-full skeleton-stagger">
                                    <div className="skeleton-bone w-16 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                                    <div className="skeleton-bone w-32 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Workspace */}
                <div className="flex flex-col gap-6 lg:flex-row">
                    {/* Input Form Column */}
                    <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex min-h-[540px] flex-1 flex-col gap-7 overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900 sm:p-7">
                            <div className="skeleton-bone rounded-[24px] border border-zinc-200/70 bg-white p-4 dark:border-zinc-800/70 dark:bg-zinc-950/40 h-28" />
                            
                            <div className="flex flex-col gap-2 skeleton-stagger">
                                <div className="skeleton-bone w-24 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                                <div className="skeleton-bone w-full sm:max-w-md h-12 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="skeleton-bone w-24 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                                <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="skeleton-bone h-20 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
                                    <div className="skeleton-bone h-20 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
                                    <div className="skeleton-bone h-20 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="skeleton-bone w-24 h-4 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="skeleton-bone h-14 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
                                    <div className="skeleton-bone h-14 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
                                    <div className="skeleton-bone h-14 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
                                    <div className="skeleton-bone h-14 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Preview) */}
                    <div className="flex w-full flex-col gap-6 lg:w-[380px] xl:w-[420px] shrink-0">
                        <div className="rounded-[28px] border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900 flex flex-col gap-6 h-[400px]">
                            <div className="flex items-center justify-between">
                                <div className="skeleton-bone w-32 h-6 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            </div>
                            <div className="skeleton-bone w-full h-32 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl mt-4" />
                            <div className="skeleton-bone w-full h-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl mt-4" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-auto flex h-auto min-h-[calc(100vh-6rem)] w-full max-w-[1500px] flex-col gap-6"
        >
            <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="flex flex-col gap-6"
                aria-label="Citation generator overview"
            >
                <div className="mt-[72px] sm:mt-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-5 px-5 sm:px-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:border-violet-200/80 dark:hover:border-violet-800/50">
                    
                    {/* Title Area */}
                    <motion.div
                        className="flex items-center gap-4 relative z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                        <motion.div
                            className="flex items-center justify-center w-12 h-12 rounded-[16px] bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800/50"
                            whileHover={{ scale: 1.05, rotate: -5 }}
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                            </svg>
                        </motion.div>
                        
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Citation Manager</h1>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <ToolHeaderBadge icon={Sparkles} label="Citation workspace" tone="violet" />
                                <ToolHeaderBadge
                                    icon={Save}
                                    label={hasSavedSession ? `Saved ${formatToolSessionTime(lastSavedAt)}` : 'Auto-save ready'}
                                    tone="violet"
                                    hideOnSmall
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto relative z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <LayoutGroup>
                            {onGoToReferenceManager && (
                                <motion.button
                                    layout
                                    onClick={onGoToReferenceManager}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 text-[13px] sm:text-sm font-bold text-violet-700 bg-violet-50 dark:text-violet-300 dark:bg-violet-950/30 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors shadow-sm whitespace-nowrap w-full sm:w-auto"
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.97 }}
                                    transition={{ layout: { type: "spring", bounce: 0.2, duration: 0.6 } }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                    </svg>
                                    Reference Library
                                </motion.button>
                            )}
                            <motion.button
                                layout
                                onClick={onBack}
                                className="flex items-center justify-center gap-1 sm:gap-1.5 px-3 py-2 sm:px-4 sm:py-2 text-[13px] sm:text-sm font-bold text-zinc-700 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors whitespace-nowrap w-full sm:w-auto"
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.97 }}
                                transition={{ layout: { type: "spring", bounce: 0.2, duration: 0.6 } }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 12H5" />
                                    <polyline points="12 19 5 12 12 5" />
                                </svg>
                                Back
                            </motion.button>
                        </LayoutGroup>
                    </motion.div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    {[
                        { 
                            label: 'Step 1', 
                            title: 'Find metadata', 
                            detail: 'URL, ISBN, or manual input', 
                            icon: Search,
                            borderHover: 'hover:border-violet-300 dark:hover:border-violet-700/50',
                            textHover: 'group-hover/step:text-violet-600 dark:group-hover/step:text-violet-400',
                            iconStyle: 'bg-violet-50 border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20 text-violet-600 dark:text-violet-400'
                        },
                        { 
                            label: 'Step 2', 
                            title: `${citationStyle} + ${sourceType}`, 
                            detail: 'Choose style and source', 
                            icon: BookMarked,
                            borderHover: 'hover:border-violet-300 dark:hover:border-violet-700/50',
                            textHover: 'group-hover/step:text-violet-600 dark:group-hover/step:text-violet-400',
                            iconStyle: 'bg-violet-50 border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20 text-violet-600 dark:text-violet-400'
                        },
                        { 
                            label: 'Step 3', 
                            title: `${completenessScore}/100 complete`, 
                            detail: generatedCitation ? 'Ready to copy or save' : 'Fill required fields', 
                            icon: ClipboardCheck,
                            borderHover: 'hover:border-violet-300 dark:hover:border-violet-700/50',
                            textHover: 'group-hover/step:text-violet-600 dark:group-hover/step:text-violet-400',
                            iconStyle: 'bg-violet-50 border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20 text-violet-600 dark:text-violet-400'
                        },
                    ].map((item) => {
                        const Icon = item.icon;
                        return (
                            <motion.div
                                key={item.label}
                                whileHover={{ scale: 1.02 }}
                                className={`group/step flex items-center gap-4 rounded-[24px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm transition-all duration-300 hover:shadow-md relative overflow-hidden ${item.borderHover}`}
                            >
                                {/* SaaS Background Accents */}
                                
                                <motion.div 
                                    whileHover={{ scale: 1.1, rotate: -5 }}
                                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] shadow-sm transition-colors border ${item.iconStyle}`}
                                >
                                    <Icon className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
                                </motion.div>
                                <div className="min-w-0 flex flex-col">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 mb-1">{item.label}</p>
                                    <p className={`truncate text-[16px] font-bold text-zinc-900 dark:text-zinc-100 leading-none transition-colors mb-1 ${item.textHover}`}>{item.title}</p>
                                    <p className="truncate text-[13px] font-medium text-zinc-500 dark:text-zinc-400 leading-tight">{item.detail}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.section>

            <div className="flex flex-col gap-6 lg:flex-row">
{/* Main Workspace Column */}
            <div className="flex min-w-0 flex-1 flex-col">

                {/* Main Input Workspace Form */}
                <motion.div 
                    className="flex min-w-0 flex-1 flex-col rounded-[32px] border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/40 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    {/* Auto-Fill / Search Metadata Bar */}
                    <div className="p-5 sm:p-7 relative overflow-hidden group transition-all duration-300 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                        <div className="mb-6 flex items-start justify-between relative z-10">
                            <div className="flex items-center gap-5">
                                <motion.div
                                    className="flex items-center justify-center w-16 h-16 rounded-[20px] bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 shadow-sm border border-violet-100 dark:border-violet-800/50 shrink-0"
                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                >
                                    <Zap className="w-8 h-8" strokeWidth={2} />
                                </motion.div>
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Smart Capture</h2>
                                    <p className="text-[15px] text-zinc-500 dark:text-zinc-400 mt-1">
                                        Paste a source URL, ISBN, or raw text and let MiMo 2.5 auto-fill it.
                                    </p>
                                </div>
                            </div>
                            
                            <motion.button
                                layout
                                onClick={handleClear}
                                disabled={!hasClearableWork}
                                className="flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#fff0f0] hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.97 }}
                                transition={{ layout: { type: "spring", bounce: 0.2, duration: 0.6 } }}
                                title="Clear Workspace"
                            >
                                <Trash2 className="w-[18px] h-[18px]" strokeWidth={2.5} />
                            </motion.button>
                        </div>
                        <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/80 rounded-[1.25rem] p-2 shadow-inner w-full">
                            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center relative z-10">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={autoFillInput}
                                        onChange={(e) => setAutoFillInput(e.target.value)}
                                        placeholder="Paste website URL, book ISBN, or raw reference text to auto-fill..."
                                        className="h-12 w-full rounded-2xl border border-zinc-200/60 bg-white px-4 pl-11 text-[15px] font-semibold text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm shadow-sm"
                                        disabled={isAutoFilling}
                                    />
                                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
                                </div>
                        <motion.button
                            layout
                            onClick={handleAutoFill}
                            disabled={isAutoFilling || !autoFillInput.trim()}
                            className="flex h-12 shrink-0 items-center justify-center gap-1.5 px-5 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            whileHover={{ y: -1, boxShadow: '0 8px 20px rgba(124, 58, 237, 0.35)' }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ layout: { type: "spring", bounce: 0.2, duration: 0.6 } }}
                        >
                            {isAutoFilling ? (
                                <>
                                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" opacity="0.25" stroke="currentColor" />
                                        <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
                                    </svg>
                                    Fetching...
                                </>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Auto-Fill
                                </>
                            )}
                            </motion.button>
                            </div>
                        </div>
                        
                        <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-3 relative z-10">
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[13px] font-medium text-amber-700/90 dark:text-amber-400/90 leading-snug">
                                AI-generated citations may occasionally contain inaccuracies. Please verify the extracted fields.
                            </p>
                        </div>
                        <AnimatePresence>
                            {autoFillWarning && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                    className="overflow-hidden"
                                >
                                    {(() => {
                                        const isAcademic = autoFillWarning.includes('DOI');
                                        const bgColor = isAcademic ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-amber-50 dark:bg-amber-900/20';
                                        const borderColor = isAcademic ? 'border-indigo-200/60 dark:border-indigo-800/40' : 'border-amber-200/60 dark:border-amber-800/40';
                                        const textColor = isAcademic ? 'text-indigo-800 dark:text-indigo-300' : 'text-amber-800 dark:text-amber-300';
                                        const iconColor = isAcademic ? 'text-indigo-500' : 'text-amber-500';
                                        const IconInfo = isAcademic ? Lightbulb : AlertCircle;
                                        
                                        return (
                                            <div className={`flex flex-col gap-3 p-3.5 rounded-xl ${bgColor} border ${borderColor} relative z-10`}>
                                                <div className="flex items-start gap-3">
                                                    <IconInfo className={`w-5 h-5 ${iconColor} shrink-0 mt-0.5`} />
                                                    <p className={`text-sm font-medium ${textColor}`}>
                                                        {autoFillWarning}
                                                    </p>
                                                </div>
                                                {isAcademic && failedUrl && (
                                                    <div className="pl-8 flex flex-wrap gap-2">
                                                        <a 
                                                            href={`https://scholar.google.com/scholar?q=${encodeURIComponent(failedUrl)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors shadow-sm"
                                                        >
                                                            <Search className="w-3.5 h-3.5" />
                                                            Search on Google Scholar
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Citation Style Selector */}
                    <div className="p-5 sm:p-7 relative overflow-hidden group transition-all duration-300 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                        <div className="flex items-center gap-5 mb-6 relative z-10">
                            <motion.div
                                className="flex items-center justify-center w-16 h-16 rounded-[20px] bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 shadow-sm border border-violet-100 dark:border-violet-800/50 shrink-0"
                                whileHover={{ scale: 1.05, rotate: -5 }}
                            >
                                <Type className="w-8 h-8" strokeWidth={2} />
                            </motion.div>
                            <div>
                                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Citation Style</h2>
                                <p className="text-[15px] text-zinc-500 dark:text-zinc-400 mt-1">Select your preferred academic formatting style.</p>
                            </div>
                        </div>
                        <div className="relative flex w-full rounded-2xl bg-white p-1.5 shadow-sm border border-zinc-200/80 dark:border-zinc-800 dark:bg-zinc-900 relative z-10">
                            {(['APA', 'MLA', 'Chicago'] as CitationStyle[]).map((style) => (
                                <button
                                    key={style}
                                    onClick={() => setCitationStyle(style)}
                                    className={`relative z-10 flex-1 rounded-xl py-3.5 text-center text-[15px] font-bold transition-colors ${
                                        citationStyle === style 
                                            ? 'text-violet-700 dark:text-violet-300' 
                                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                    }`}
                                >
                                    {citationStyle === style && (
                                        <motion.div
                                            layoutId="activeStyleTab"
                                            className="absolute inset-0 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100/50 dark:border-violet-800/50 shadow-sm"
                                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                            style={{ zIndex: -1 }}
                                        />
                                    )}
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Source Type Selector */}
                    <div className="p-5 sm:p-7 relative overflow-hidden group transition-all duration-300 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                        <div className="flex items-center gap-5 mb-6 relative z-10">
                            <motion.div
                                className="flex items-center justify-center w-16 h-16 rounded-[20px] bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 shadow-sm border border-violet-100 dark:border-violet-800/50 shrink-0"
                                whileHover={{ scale: 1.05, rotate: -5 }}
                            >
                                <Layers className="w-8 h-8" strokeWidth={2} />
                            </motion.div>
                            <div>
                                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                                    Source Type
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full dark:bg-violet-900/40 dark:text-violet-400">
                                        <Zap className="w-3 h-3" strokeWidth={3} /> Auto-selected by MiMo 2.5
                                    </span>
                                </h2>
                                <p className="text-[15px] text-zinc-500 dark:text-zinc-400 mt-1">Choose the type of material, or let the AI detect it automatically.</p>
                            </div>
                        </div>
                        <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/80 rounded-[1.25rem] p-2 shadow-inner w-full relative z-10">
                            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                            {[
                                { type: 'book' as SourceType, label: 'Book', helper: 'Books, ebooks, chapters', icon: BookOpen },
                                { type: 'website' as SourceType, label: 'Website', helper: 'Pages, articles, online sources', icon: Globe2 },
                                { type: 'journal' as SourceType, label: 'Journal', helper: 'Research papers and volumes', icon: Newspaper }
                            ].map(({ type, label, helper, icon: Icon }) => (
                                <button
                                    key={type}
                                    onClick={() => setSourceType(type)}
                                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all shadow-sm ${
                                        sourceType === type
                                            ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300'
                                            : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700'
                                    }`}
                                >
                                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                        sourceType === type
                                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                                            : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'
                                    }`}>
                                        <Icon className="h-5 w-5" aria-hidden="true" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="block text-[15px] font-bold">{label}</span>
                                        <span className="mt-0.5 block text-[13px] font-medium opacity-75">{helper}</span>
                                    </div>
                                </button>
                            ))}
                            </div>
                        </div>
                    </div>

                    {/* Source Details Form Fields */}
                    <div className="p-5 sm:p-7 relative overflow-hidden group transition-all duration-300 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                        <div className="flex items-center gap-5 mb-6 relative z-10">
                            <motion.div
                                className="flex items-center justify-center w-16 h-16 rounded-[20px] bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 shadow-sm border border-violet-100 dark:border-violet-800/50 shrink-0"
                                whileHover={{ scale: 1.05, rotate: -5 }}
                            >
                                <FileText className="w-8 h-8" strokeWidth={2} />
                            </motion.div>
                            <div>
                                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Source Details</h2>
                                <p className="text-[15px] text-zinc-500 dark:text-zinc-400 mt-1">Fill in the required information manually.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 relative z-10">
                                <FloatingInput 
                                    label="Author(s) (e.g. Smith, J.)" 
                                    value={citationData.authors} 
                                    onChange={(val) => handleInputChange('authors', val)} 
                                />
                                
                                <FloatingInput 
                                    label="Title" 
                                    value={citationData.title} 
                                    onChange={(val) => handleInputChange('title', val)} 
                                />

                                <FloatingInput 
                                    label="Publication Year" 
                                    value={citationData.publicationYear} 
                                    onChange={(val) => handleInputChange('publicationYear', val)} 
                                />

                                {sourceType === 'book' && (
                                    <FloatingInput 
                                        label="Publisher" 
                                        value={citationData.publisher || ''} 
                                        onChange={(val) => handleInputChange('publisher', val)} 
                                    />
                                )}

                                {sourceType === 'website' && (
                                    <>
                                        <FloatingInput 
                                            label="URL" 
                                            value={citationData.url || ''} 
                                            onChange={(val) => handleInputChange('url', val)} 
                                        />
                                        <FloatingInput 
                                            label="Access Date (e.g. May 27, 2026)" 
                                            value={citationData.accessDate || ''} 
                                            onChange={(val) => handleInputChange('accessDate', val)} 
                                        />
                                    </>
                                )}

                                {sourceType === 'journal' && (
                                    <>
                                        <FloatingInput 
                                            label="Journal Name" 
                                            value={citationData.journalName || ''} 
                                            onChange={(val) => handleInputChange('journalName', val)} 
                                        />
                                        <FloatingInput 
                                            label="Volume" 
                                            value={citationData.volume || ''} 
                                            onChange={(val) => handleInputChange('volume', val)} 
                                        />
                                        <FloatingInput 
                                            label="Issue" 
                                            value={citationData.issue || ''} 
                                            onChange={(val) => handleInputChange('issue', val)} 
                                        />
                                        <FloatingInput 
                                            label="Pages" 
                                            value={citationData.pages || ''} 
                                            onChange={(val) => handleInputChange('pages', val)} 
                                        />
                                    </>
                                )}
                            </div>
                    </div>
                </motion.div>
            </div>

            {/* Sidebar Column (30%) */}
            <ToolMobileSheet
                title="Citation Output"
                summary={generatedCitation ? `${completenessScore}/100 complete` : 'Preview, save, and citation tips'}
                actionLabel="Open citation output"
                className="w-full lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-8"
                tone="violet"
            >
                {/* Completeness Score Circular Indicator */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                    className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-6 lg:p-7 flex flex-col gap-2 group transition-all duration-300 hover:shadow-md hover:border-violet-200/80 dark:hover:border-violet-800/50"
                >
                    {/* SaaS Background Accents */}

                    {/* Left: Icon & Core Info */}
                    <div className="flex items-center gap-5 relative z-10 w-full mb-6">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: -5 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            className="w-16 h-16 rounded-[20px] bg-violet-50 border border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20 flex items-center justify-center flex-shrink-0 shadow-sm"
                        >
                            <ClipboardCheck className="w-7 h-7 text-violet-600 dark:text-violet-400" strokeWidth={2.5} />
                        </motion.div>

                        <div>
                            <h2 className="text-[22px] sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-1">
                                Completeness
                            </h2>
                            <p className="text-[13px] sm:text-[14px] font-medium text-zinc-500 dark:text-zinc-400 leading-tight">
                                Fill in all required fields to build a perfectly formatted citation.
                            </p>
                        </div>
                    </div>

                    {/* Right: Modern Stat Cards */}
                    <div className="flex items-center gap-4 relative z-10 w-full">
                        {/* Score Card combining both text and ring */}
                        <div className="flex flex-1 items-center gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 shadow-sm transition-colors hover:border-violet-300 dark:hover:border-violet-700/50 group/card">
                            {/* The Ring acts as the icon! */}
                            <div className="w-10 h-10 flex-shrink-0 relative flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200/50 dark:border-zinc-700/50">
                                <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-zinc-100 dark:stroke-zinc-800" strokeWidth="4" />
                                    <motion.circle 
                                        cx="18" cy="18" r="16" fill="none" 
                                        className={`stroke-current ${
                                            completenessScore === 100 
                                                ? 'text-emerald-500' 
                                                : completenessScore >= 50 
                                                    ? 'text-violet-500' 
                                                    : 'text-zinc-300 dark:text-zinc-700'
                                        }`}
                                        strokeWidth="4" 
                                        strokeDasharray="100" 
                                        initial={{ strokeDashoffset: 100 }}
                                        animate={{ strokeDashoffset: 100 - completenessScore }}
                                        transition={{ duration: 0.8, type: "spring" }}
                                        strokeLinecap={completenessScore > 0 ? "round" : undefined}
                                    />
                                </svg>
                            </div>
                            
                            <div>
                                <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5 group-hover/card:text-violet-600 dark:group-hover/card:text-violet-400 transition-colors">Score</p>
                                <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-none flex items-baseline gap-1">
                                    <NumberTicker value={completenessScore} className="tracking-tight" />
                                    <span className="text-xs font-semibold text-zinc-500">/ 100</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Generated Citation Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
                    className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-6 lg:p-7 flex flex-col gap-2 group transition-all duration-300 hover:shadow-md hover:border-violet-200/80 dark:hover:border-violet-800/50"
                >
                    {/* SaaS Background Accents */}

                    {/* Left: Icon & Core Info */}
                    <div className="flex items-center gap-5 relative z-10 w-full mb-6">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: -5 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            className="w-16 h-16 rounded-[20px] bg-violet-50 border border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20 flex items-center justify-center flex-shrink-0 shadow-sm"
                        >
                            <ClipboardCheck className="w-7 h-7 text-violet-600 dark:text-violet-400" strokeWidth={2.5} />
                        </motion.div>

                        <div>
                            <h2 className="text-[22px] sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-1">
                                Generated Citation
                            </h2>
                            <p className="text-[13px] sm:text-[14px] font-medium text-zinc-500 dark:text-zinc-400 leading-tight">
                                Preview your citation, copy it with rich formatting, or save it to your workspace.
                            </p>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {generatedCitation ? (
                            <motion.div
                                key="citation"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex flex-col gap-4 relative z-10"
                            >
                                <div className="relative overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50/80 to-white p-5 sm:p-6 font-serif text-[15px] sm:text-[16px] leading-relaxed text-zinc-800 shadow-sm dark:border-violet-900/30 dark:from-violet-900/10 dark:to-zinc-900 dark:text-zinc-200">
                                    {/* Left Accent Bar */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-violet-400 dark:bg-violet-500" />
                                    
                                    <div className="relative z-10 pl-2">
                                        {formatCitation(generatedCitation)}
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 w-full pt-4 border-t border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
                                    {/* Export DOCX Button */}
                                    <button
                                        onClick={() => exportBibliographyToDocx([{ citation: generatedCitation, format: citationStyle }], { title: 'Citation', style: citationStyle })}
                                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-bold rounded-[14px] transition-colors shadow-sm focus:outline-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                                        title="Export as Word document"
                                    >
                                        <FileSpreadsheet className="w-4 h-4 shrink-0" />
                                        <span className="whitespace-nowrap tracking-tight">.docx</span>
                                    </button>

                                    {/* Save to Reference Button */}
                                    <button
                                        onClick={handleSaveReference}
                                        className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-bold rounded-[14px] transition-colors shadow-sm focus:outline-none ${
                                            savedToReference
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}
                                        title="Save to Reference Manager"
                                    >
                                        {savedToReference ? (
                                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                                        ) : (
                                            <Bookmark className="w-4 h-4 shrink-0" />
                                        )}
                                        <span className="whitespace-nowrap tracking-tight">{savedToReference ? 'Saved' : 'Save'}</span>
                                    </button>

                                    {/* Copy Button */}
                                    <button
                                        onClick={handleCopy}
                                        className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-bold rounded-[14px] transition-colors shadow-sm focus:outline-none ${
                                            copied
                                                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/50 dark:hover:bg-emerald-900/70 dark:text-emerald-400'
                                                : 'bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/50 dark:hover:bg-violet-900/70 text-violet-700 dark:text-violet-300'
                                        }`}
                                    >
                                        {copied ? (
                                            <>
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                    <polyline points="20 6 9 17 4 12"/>
                                                </svg>
                                                <span className="whitespace-nowrap tracking-tight">Copied</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                                </svg>
                                                <span className="whitespace-nowrap tracking-tight">Copy</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <CitationGeneratorEmpty 
                                onAction={() => {
                                    // Pre-fill with sample book data
                                    setCitationData({
                                        sourceType: 'book',
                                        authors: 'Smith, J. D.',
                                        title: 'The Art of Academic Writing',
                                        publicationYear: '2023',
                                        publisher: 'University Press',
                                    });
                                    setSourceType('book');
                                }}
                            />
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Quick Tips */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.2 }}
                    className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-6 lg:p-7 flex flex-col gap-2 group transition-all duration-300 hover:shadow-md hover:border-violet-200/80 dark:hover:border-violet-800/50"
                >
                    {/* SaaS Background Accents */}

                    {/* Left: Icon & Core Info */}
                    <div className="flex items-center gap-5 relative z-10 w-full mb-6">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: -5 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            className="w-16 h-16 rounded-[20px] bg-violet-50 border border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20 flex items-center justify-center flex-shrink-0 shadow-sm"
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-violet-600 dark:text-violet-400">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                        </motion.div>

                        <div>
                            <h2 className="text-[22px] sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-1">
                                Quick Tips
                            </h2>
                            <p className="text-[13px] sm:text-[14px] font-medium text-zinc-500 dark:text-zinc-400 leading-tight">
                                Helpful reminders to keep your references accurate and perfectly formatted.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 relative z-10">
                        {[
                            {
                                title: "Author Formatting",
                                text: "Separate multiple authors with commas.",
                                borderHover: "hover:border-violet-300 dark:hover:border-violet-700/50",
                                textHover: "group-hover/tip:text-violet-600 dark:group-hover/tip:text-violet-400",
                                iconStyle: "bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 text-violet-600 dark:text-violet-400",
                                icon: (
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                )
                            },
                            {
                                title: "Title Styling",
                                text: "Use italics for book and journal titles.",
                                borderHover: "hover:border-purple-300 dark:hover:border-purple-700/50",
                                textHover: "group-hover/tip:text-purple-600 dark:group-hover/tip:text-purple-400",
                                iconStyle: "bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400",
                                icon: (
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="19" y1="4" x2="10" y2="4" />
                                        <line x1="14" y1="20" x2="5" y2="20" />
                                        <line x1="15" y1="4" x2="9" y2="20" />
                                    </svg>
                                )
                            },
                            {
                                title: "Accuracy Check",
                                text: "Verify references against your university guide.",
                                borderHover: "hover:border-emerald-300 dark:hover:border-emerald-700/50",
                                textHover: "group-hover/tip:text-emerald-600 dark:group-hover/tip:text-emerald-400",
                                iconStyle: "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
                                icon: (
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                )
                            }
                        ].map((tip, idx) => (
                            <motion.div 
                                key={idx} 
                                whileHover={{ scale: 1.02 }}
                                className={`group/tip flex items-center gap-4 px-4 py-3 rounded-[20px] bg-white dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 shadow-sm transition-all ${tip.borderHover}`}
                            >
                                <motion.div 
                                    whileHover={{ scale: 1.1, rotate: -5 }}
                                    className={`w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0 shadow-sm transition-colors ${tip.iconStyle}`}
                                >
                                    {tip.icon}
                                </motion.div>
                                <div className="flex flex-col min-w-0">
                                    <h4 className={`text-[14px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none mb-1 transition-colors ${tip.textHover}`}>
                                        {tip.title}
                                    </h4>
                                    <span className="text-[12.5px] text-zinc-600 dark:text-zinc-400 leading-snug">
                                        {tip.text}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </ToolMobileSheet>
            </div>
            
            {/* Global Floating Restore Banner (Mobile) */}
            <AnimatePresence>
                {hasSavedSession && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed bottom-20 inset-x-4 z-[90] sm:hidden flex items-center justify-between p-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-[20px] border border-zinc-200/60 dark:border-zinc-800/60"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-[14px] bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 shrink-0">
                                <Save className="w-[18px] h-[18px]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-zinc-900 dark:text-white leading-tight">Draft Saved</span>
                                <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 leading-tight">Tap to recover</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={clearSavedSession}
                                className="flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#fff0f0] hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 transition-colors"
                            >
                                <Trash2 className="w-[18px] h-[18px]" />
                            </button>
                            <button
                                onClick={restoreSavedCitationSession}
                                className="px-4 h-10 flex items-center justify-center text-[13px] font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-[14px] shadow-sm hover:scale-105 active:scale-95 transition-all"
                            >
                                Restore
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

export default CitationGenerator;
