import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wrench, FileBox, FileText } from 'lucide-react';

import { convertImageToPDF, mergePDFs } from '../../../../lib/pdfUtils';

import { convertDocxToPDF } from '../../../../lib/converters/docxToPdf';
import { convertPdfToDocx } from '../../../../lib/converters/pdfToDocx';
import { compressPDF, formatFileSize } from '../../../../lib/converters/compressPdf';
import { analyzeText, type TextStats } from '../../../../lib/converters/textAnalysis';
// iLovePDF API Service - For Word to PDF, Image to PDF, Merge PDFs
// 5 accounts × 250 files = 1,250/month
import {
    convertDocxToPdfILovePDF,
    convertImagesToPdfILovePDF,
    mergePdfsILovePDF,
    isILovePDFConfigured } from '../../../../lib/converters/ilovepdfService';
// Adobe PDF Services API - For PDF to Word (best quality!)
// 5 accounts × 500 files = 2,500/month
import {
    convertPdfToDocxAdobe,
    isAdobeConfigured } from '../../../../lib/converters/adobePdfService';
// LanguageTool Grammar Checker - Free, no API key required!
import LanguageToolGrammarChecker from '../../../../components/tools/LanguageToolGrammarChecker';
// Word Counter - Offline text analysis
import WordCounter from '../../../../components/tools/WordCounter';
// Citation Generator - Academic citation formatting
import CitationGenerator from '../../../../components/tools/CitationGenerator';
// Text Summarizer - AI-powered text summarization
import TextSummarizer from '../../../../components/tools/TextSummarizer';
// Reference Manager - Save and organize citations
import ReferenceManager from '../../../../components/tools/ReferenceManager';
// Paraphraser - AI-powered text paraphrasing
import Paraphraser from '../../../../components/tools/Paraphraser';
// Plagiarism Checker
import PlagiarismChecker from '../../../../components/tools/PlagiarismChecker';

interface Tool {
    id: string;
    name: string;
    description: string;
    bestFor?: string;
    category: string;
    icon: React.ReactNode;
    accept: string;
    multiple: boolean;
    badges?: string[];
    accent?: 'blue' | 'emerald' | 'violet' | 'violet' | 'rose' | 'cyan';
    recommended?: boolean;
    linkTo?: string;
    onClick?: () => void; // Custom click handler for dedicated pages
    tutorial?: {
        title: string;
        steps: string[];
        tip: string;
    };
}

interface AnalysisResult {
    type: 'count' | 'grammar' | 'compress';
    data: {
        words?: number;
        chars?: number;
        readingTime?: string;
        issues?: string[];
        originalText?: string;
        // Extended text stats
        textStats?: TextStats;
        // Compression stats
        originalSize?: string;
        compressedSize?: string;
        savings?: string;
        savingsPercent?: number;
    };
}

// SuccessConfetti + ToolItem — moved to ./components/ToolItem.tsx
// ResultModal — moved to ./modals/ResultModal.tsx
// CategoryTabs + ToolsSkeleton — moved to ./components/ToolsShared.tsx
import { ToolItem, SuccessConfetti } from './components/ToolItem';
import { ResultModal } from './modals/ResultModal';
import { CategoryTabs } from './components/ToolsShared';
import ToolsHeader from './components/ToolsHeader';

const ToolsContent: React.FC = () => {
    const recentStorageKey = 'elms_recent_tools';
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [convertingFile, setConvertingFile] = useState<string | null>(null);
    const [conversionSuccess, setConversionSuccess] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    // Grammar Checker dedicated page state
    const [showGrammarChecker, setShowGrammarChecker] = useState(false);
    // Word Counter dedicated page state
    const [showWordCounter, setShowWordCounter] = useState(false);
    // Citation Generator dedicated page state
    const [showCitationGenerator, setShowCitationGenerator] = useState(false);
    // Text Summarizer dedicated page state
    const [showTextSummarizer, setShowTextSummarizer] = useState(false);
    // Reference Manager dedicated page state
    const [showReferenceManager, setShowReferenceManager] = useState(false);
    const [refReferrer, setRefReferrer] = useState<'dashboard' | 'citation'>('dashboard');
    // Paraphraser dedicated page state
    const [showParaphraser, setShowParaphraser] = useState(false);
    // Plagiarism Checker dedicated page state
    const [showPlagiarismChecker, setShowPlagiarismChecker] = useState(false);
    const [recentToolIds, setRecentToolIds] = useState<string[]>([]);
    const [isDarkMode, setIsDarkMode] = useState(() => (
        typeof document !== 'undefined' && (
            document.documentElement.classList.contains('dark') ||
            document.body.classList.contains('dark-mode') ||
            localStorage.getItem('darkModeEnabled') === 'true'
        )
    ));

    // State and lifecycle management handled by React Suspense boundaries

    useEffect(() => {
        const syncDarkMode = () => {
            setIsDarkMode(
                document.documentElement.classList.contains('dark') ||
                document.body.classList.contains('dark-mode') ||
                localStorage.getItem('darkModeEnabled') === 'true'
            );
        };

        const observer = new MutationObserver(syncDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        window.addEventListener('storage', syncDarkMode);

        return () => {
            observer.disconnect();
            window.removeEventListener('storage', syncDarkMode);
        };
    }, []);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(recentStorageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setRecentToolIds(parsed.filter((id): id is string => typeof id === 'string'));
                }
            }
        } catch (error) {
            console.warn('[ToolsContent] Unable to load recent tools', error);
        }
    }, []);

    useEffect(() => {
        if (!searchQuery) {
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        const timer = setTimeout(() => setIsSearching(false), 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const isDedicatedToolOpen =
        showGrammarChecker ||
        showWordCounter ||
        showCitationGenerator ||
        showTextSummarizer ||
        showReferenceManager ||
        showParaphraser ||
        showPlagiarismChecker;

    useEffect(() => {
        if (!isDedicatedToolOpen) return;

        requestAnimationFrame(() => {
            window.scrollTo({ top: 0, behavior: 'auto' });
            document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'auto' });
        });
    }, [isDedicatedToolOpen]);

    const markToolUsed = (toolId: string) => {
        setRecentToolIds((current) => {
            const next = [toolId, ...current.filter((id) => id !== toolId)].slice(0, 4);
            localStorage.setItem(recentStorageKey, JSON.stringify(next));
            return next;
        });
    };

    // If Grammar Checker is active, show dedicated page
    if (showGrammarChecker) {
        return <div className={isDarkMode ? 'dark' : ''}><LanguageToolGrammarChecker onBack={() => setShowGrammarChecker(false)} /></div>;
    }

    // If Word Counter is active, show dedicated page
    if (showWordCounter) {
        return <div className={isDarkMode ? 'dark' : ''}><WordCounter onBack={() => setShowWordCounter(false)} /></div>;
    }

    // If Citation Generator is active, show dedicated page
    if (showCitationGenerator) {
        return (
            <div className={isDarkMode ? 'dark' : ''}>
                <CitationGenerator 
                    onBack={() => setShowCitationGenerator(false)} 
                    onGoToReferenceManager={() => {
                        setRefReferrer('citation');
                        setShowCitationGenerator(false);
                        setShowReferenceManager(true);
                    }}
                />
            </div>
        );
    }

    // If Text Summarizer is active, show dedicated page
    if (showTextSummarizer) {
        return <div className={isDarkMode ? 'dark' : ''}><TextSummarizer onBack={() => setShowTextSummarizer(false)} /></div>;
    }

    // If Reference Manager is active, show dedicated page
    if (showReferenceManager) {
        return (
            <div className={isDarkMode ? 'dark' : ''}>
                <ReferenceManager 
                    onBack={() => {
                        setShowReferenceManager(false);
                        if (refReferrer === 'citation') {
                            setShowCitationGenerator(true);
                        }
                    }} 
                />
            </div>
        );
    }

    // If Paraphraser is active, show dedicated page
    if (showParaphraser) {
        return <div className={isDarkMode ? 'dark' : ''}><Paraphraser onBack={() => setShowParaphraser(false)} /></div>;
    }

    // If Plagiarism Checker is active, show dedicated page
    if (showPlagiarismChecker) {
        return <div className={isDarkMode ? 'dark' : ''}><PlagiarismChecker onBack={() => setShowPlagiarismChecker(false)} /></div>;
    }

    const processFiles = async (files: FileList | File[], toolName: string) => {
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);
        setConvertingFile(toolName);

        try {
            let blob: Blob | null = null;
            let fileName = 'converted.pdf';

            if (toolName === 'Image to PDF') {
                // Filter only image files
                const imageFiles = fileArray.filter(f => f.type.startsWith('image/'));
                if (imageFiles.length === 0) {
                    alert('Please select valid image files (PNG, JPG, JPEG).');
                    setConvertingFile(null);
                    return;
                }

                // Use iLovePDF (online) as primary, local as fallback
                if (isILovePDFConfigured()) {
                    try {
                        blob = await convertImagesToPdfILovePDF(imageFiles);
                    } catch (error) {
                        blob = await convertImageToPDF(imageFiles);
                    }
                } else {
                    blob = await convertImageToPDF(imageFiles);
                }
                fileName = 'images-converted.pdf';
            } else if (toolName === 'Merge PDFs') {
                // Filter only PDF files
                const pdfFiles = fileArray.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
                if (pdfFiles.length < 2) {
                    alert('Please select at least 2 PDF files to merge.');
                    setConvertingFile(null);
                    return;
                }

                // Use iLovePDF (online) as primary, local as fallback
                if (isILovePDFConfigured()) {
                    try {
                        blob = await mergePdfsILovePDF(pdfFiles);
                    } catch (error) {
                        blob = await mergePDFs(pdfFiles);
                    }
                } else {
                    blob = await mergePDFs(pdfFiles);
                }
                fileName = 'merged.pdf';
            } else if (toolName === 'Word Counter') {
                // Use enhanced text analysis
                const text = await readFileAsText(fileArray[0]);
                const textStats = analyzeText(text);

                setAnalysisResult({
                    type: 'count',
                    data: {
                        words: textStats.words,
                        chars: textStats.characters,
                        readingTime: textStats.readingTime,
                        textStats
                    }
                });
                setConvertingFile(null);
                return;
            } else if (toolName === 'Grammar Checker') {
                const text = await readFileAsText(fileArray[0]);
                // Simple simulation of grammar checking
                const issues = [];
                if (text.match(/\b(their|there|they're)\b/i)) issues.push("Check usage of 'their/there/they're'");
                if (text.match(/\b(its|it's)\b/i)) issues.push("Check usage of 'its/it's'");
                if (text.match(/\b(your|you're)\b/i)) issues.push("Check usage of 'your/you're'");
                if (text.match(/\s{2 }/)) issues.push("Multiple spaces detected");
                if (!text.match(/^[A-Z]/)) issues.push("Sentence should start with a capital letter");

                setAnalysisResult({
                    type: 'grammar',
                    data: { issues: issues.length > 0 ? issues : [], originalText: text }
                });
                setConvertingFile(null);
                return;
            } else if (toolName === 'PDF to Word') {
                // Convert PDF to DOCX - Adobe PDF Services (best quality!) with local fallback
                // 5 accounts × 500 = 2,500 conversions/month
                const pdfFile = fileArray[0];
                if (!pdfFile.type.includes('pdf') && !pdfFile.name.toLowerCase().endsWith('.pdf')) {
                    alert('Please select a valid PDF file.');
                    setConvertingFile(null);
                    return;
                }

                // Use Adobe PDF Services first (best quality)
                if (isAdobeConfigured()) {
                    try {
                        blob = await convertPdfToDocxAdobe(pdfFile);
                    } catch (error) {
                        blob = await convertPdfToDocx(pdfFile);
                    }
                } else {
                    blob = await convertPdfToDocx(pdfFile);
                }
                fileName = pdfFile.name.replace(/\.pdf$/i, '') + '.docx';
            } else if (toolName === 'Convert to PDF' || toolName === 'Word to PDF') {
                // Convert DOCX to PDF - iLovePDF with local fallback
                const docFile = fileArray[0];
                const validExtensions = ['.doc', '.docx'];
                const hasValidExt = validExtensions.some(ext => docFile.name.toLowerCase().endsWith(ext));
                if (!hasValidExt) {
                    alert('Please select a valid Word document (.doc or .docx).');
                    setConvertingFile(null);
                    return;
                }

                // Try iLovePDF first (with multi-key rotation)
                if (isILovePDFConfigured()) {
                    try {
                        blob = await convertDocxToPdfILovePDF(docFile);
                    } catch (error) {
                        const result = await convertDocxToPDF(docFile);
                        blob = result.blob;
                        if (result.warnings.length > 0) {
                        }
                    }
                } else {
                    // Local conversion
                    const result = await convertDocxToPDF(docFile);
                    blob = result.blob;
                    if (result.warnings.length > 0) {
                    }
                }
                fileName = docFile.name.replace(/\.(docx?|doc)$/i, '') + '.pdf';
            } else if (toolName === 'Compress PDF') {
                // Compress PDF locally
                const pdfFile = fileArray[0];
                if (!pdfFile.type.includes('pdf') && !pdfFile.name.toLowerCase().endsWith('.pdf')) {
                    alert('Please select a valid PDF file.');
                    setConvertingFile(null);
                    return;
                }
                const result = await compressPDF(pdfFile);

                // Show compression results
                setAnalysisResult({
                    type: 'compress',
                    data: {
                        originalSize: formatFileSize(result.originalSize),
                        compressedSize: formatFileSize(result.compressedSize),
                        savings: formatFileSize(result.savings),
                        savingsPercent: result.savingsPercent }
                });

                // Also download the compressed file
                blob = result.blob;
                fileName = pdfFile.name.replace(/\.pdf$/i, '') + '-compressed.pdf';
            } else {
                // Simulation for other tools
                await new Promise(resolve => setTimeout(resolve, 2000));
                setConvertingFile(null);
                setConversionSuccess(toolName);
                setTimeout(() => setConversionSuccess(null), 3000);
                return;
            }

            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                setConversionSuccess(toolName);
                setTimeout(() => setConversionSuccess(null), 3000);
            }
        } catch (error) {
            alert('An error occurred during conversion.');
        } finally {
            setConvertingFile(null);
        }
    };

    const readFileAsText = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    };

    const categories = [
        { id: 'all', name: 'All Tools', icon: <Wrench className="w-5 h-5" /> },
        { id: 'convert', name: 'Converters', icon: <FileBox className="w-5 h-5" /> },
        { id: 'text', name: 'Text Tools', icon: <FileText className="w-5 h-5" /> },
    ];

    const tools: Tool[] = [
        {
            id: 'image-pdf',
            name: 'Image to PDF',
            description: 'Combine multiple images into a single PDF document (works offline)',
            bestFor: 'Submitting photo-based assignments',
            category: 'convert',
            accept: '.png,.jpg,.jpeg',
            multiple: true,
            badges: ['Offline', 'Multi-image', 'PDF'],
            accent: 'emerald',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ) },
        {
            id: 'merge-pdf',
            name: 'Merge PDFs',
            description: 'Combine multiple PDF files into one document (works offline)',
            bestFor: 'Bundling handouts before upload',
            category: 'convert',
            accept: '.pdf',
            multiple: true,
            badges: ['Offline', 'Multi-file', 'PDF'],
            accent: 'emerald',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
            ) },
        {
            id: 'word-pdf',
            name: 'Word to PDF',
            description: 'Convert Word documents to PDF (works offline)',
            bestFor: 'Locking DOCX formatting',
            category: 'convert',
            accept: '.doc,.docx',
            multiple: false,
            badges: ['DOCX', 'Offline', 'Export'],
            accent: 'blue',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ) },
        {
            id: 'compress-pdf',
            name: 'Compress PDF',
            description: 'Reduce PDF file size by removing metadata (works offline)',
            bestFor: 'Shrinking LMS uploads',
            category: 'convert',
            accept: '.pdf',
            multiple: false,
            badges: ['Offline', 'Smaller files', 'Private'],
            accent: 'cyan',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            ) },
    ];

    const newTools: Tool[] = [
        {
            id: 'word-counter',
            name: 'Word Counter',
            description: 'Analyze text with word count, reading time & keywords (works offline)',
            bestFor: 'Checking essay length',
            category: 'text',
            accept: '.txt,.md,.csv',
            multiple: false,
            badges: ['Auto-save', 'Offline', 'Keywords'],
            accent: 'cyan',
            onClick: () => setShowWordCounter(true), // Opens dedicated page
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            ) },
        {
            id: 'pdf-word',
            name: 'PDF to Word',
            description: 'Convert PDFs to editable Word documents',
            bestFor: 'Recovering editable lecture files',
            category: 'convert',
            accept: '.pdf',
            multiple: false,
            badges: ['PDF', 'DOCX', 'Editable'],
            accent: 'violet',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11v6m0 0l-3-3m3 3l3-3" />
                </svg>
            ) },
        {
            id: 'grammar-check',
            name: 'Grammar Checker',
            description: 'AI-powered grammar checking with LanguageTool • Free',
            bestFor: 'Polishing final drafts',
            category: 'text',
            accept: '.txt,.md',
            multiple: false,
            badges: ['Auto-save', 'LanguageTool', 'AI'],
            accent: 'emerald',
            recommended: true,
            onClick: () => setShowGrammarChecker(true), // Opens dedicated page
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ) },
        {
            id: 'citation-generator',
            name: 'Citation Generator',
            description: 'Generate APA, MLA, and Chicago citations • Free',
            bestFor: 'Building bibliography entries',
            category: 'text',
            accept: '',
            multiple: false,
            badges: ['Auto-save', 'APA/MLA', 'Export'],
            accent: 'violet',
            onClick: () => setShowCitationGenerator(true), // Opens dedicated page
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
            ) },
        {
            id: 'text-summarizer',
            name: 'Text Summarizer',
            description: 'AI-powered text summarization • Free',
            bestFor: 'Turning notes into reviewers',
            category: 'text',
            accept: '.txt,.md',
            multiple: false,
            badges: ['Auto-save', 'Study notes', 'Copy'],
            accent: 'blue',
            recommended: true,
            onClick: () => setShowTextSummarizer(true), // Opens dedicated page
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} points="14 2 14 8 20 8" />
                    <line strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} x1="16" y1="13" x2="8" y2="13" />
                    <line strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} x1="16" y1="17" x2="8" y2="17" />
                    <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} points="10 9 9 9 8 9" />
                </svg>
            ) },
        {
            id: 'reference-manager',
            name: 'Reference Manager',
            description: 'Save & organize citations • Export bibliography',
            bestFor: 'Keeping sources organized',
            category: 'text',
            accept: '',
            multiple: false,
            badges: ['Auto-save', 'Saved library', 'Export'],
            accent: 'violet',
            onClick: () => {
                setRefReferrer('dashboard');
                setShowReferenceManager(true);
            }, // Opens dedicated page
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
            ) },
        {
            id: 'paraphraser',
            name: 'Paraphraser',
            description: 'Rewrite text in different styles',
            bestFor: 'Responsible rewriting practice',
            category: 'text',
            accept: '',
            multiple: false,
            badges: ['Auto-save', 'Modes', 'Guardrails'],
            accent: 'emerald',
            recommended: true,
            onClick: () => setShowParaphraser(true), // Opens dedicated page
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
            ) },
        /*
        {
            id: 'plagiarism-checker',
            name: 'Plagiarism Checker',
            description: 'Check text originality • Basic free tier',
            bestFor: 'Pre-submission similarity review',
            category: 'text',
            accept: '',
            multiple: false,
            badges: ['Auto-save', 'Similarity', 'Sources'],
            accent: 'rose',
            onClick: () => setShowPlagiarismChecker(true),
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9h6v6H9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
                </svg>
            ),
        },
        */
    ];

    const allTools = [...tools, ...newTools];

    const visibleTools = activeCategory === 'all'
        ? allTools
        : allTools.filter((tool) => tool.category === activeCategory);

    const normalizedSearchQuery = searchQuery.trim().toLowerCase();
    const searchFilteredTools = normalizedSearchQuery
        ? visibleTools.filter((tool) => [
            tool.name,
            tool.description,
            tool.bestFor,
            tool.category,
            ...(tool.badges || []),
        ].filter(Boolean).some((value) => value!.toLowerCase().includes(normalizedSearchQuery)))
        : visibleTools;

    const recommendedTools = allTools.filter((tool) => tool.recommended).slice(0, 3);

    const filteredTools = [...searchFilteredTools].sort((a, b) => {
        const aRecent = recentToolIds.indexOf(a.id);
        const bRecent = recentToolIds.indexOf(b.id);

        if (a.recommended !== b.recommended) {
            return a.recommended ? -1 : 1;
        }

        if (aRecent !== -1 || bRecent !== -1) {
            if (aRecent === -1) return 1;
            if (bRecent === -1) return -1;
            return aRecent - bRecent;
        }

        return 0;
    });

    // Render main content (Skeleton is handled natively by Suspense in StudentDashboard)

    return (
        <div className={`tools-content pb-24 text-zinc-900 dark:text-zinc-100 ${isDarkMode ? 'dark' : ''}`}>
            {/* Premium Minimalistic Tools Header */}
            <ToolsHeader totalTools={allTools.length} />

            {/* Confetti for success celebration */}
            <SuccessConfetti isActive={!!conversionSuccess} />

            <ResultModal result={analysisResult} onClose={() => setAnalysisResult(null)} />

            <motion.section
                className="mb-7 grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, type: 'spring', stiffness: 300, damping: 26 }}
                aria-label="Tool search and recommended workflow"
            >
                <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900 sm:p-7">
                    <div className="relative z-10 flex flex-col gap-4 sm:gap-6">
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-2xl">
                                Find the right tool before you lose momentum.
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400 hidden sm:block">
                                Search by task, file type, or outcome.
                            </p>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="relative w-full group/search"
                        >
                            <label htmlFor="tools-search" className="sr-only">Search student tools</label>
                            <svg className="absolute left-3.5 top-0 bottom-0 my-auto w-4 h-4 text-zinc-400 z-10 transition-colors duration-200 group-focus-within/search:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                id="tools-search"
                                type="text"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder='Try "APA", "compress", "essay"...'
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-11 pr-20 py-2 text-sm font-semibold focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all duration-300 text-slate-900 placeholder-slate-400 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/10"
                            />
                            <div className="absolute right-3 top-0 bottom-0 flex items-center justify-center z-10 w-6">
                                <AnimatePresence mode="wait">
                                    {isSearching && searchQuery ? (
                                        <motion.div
                                            key="spinner"
                                            initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                            exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                            className="w-6 h-6 flex items-center justify-center"
                                        >
                                            <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                        </motion.div>
                                    ) : searchQuery ? (
                                        <motion.button
                                            key="clear"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            onClick={() => setSearchQuery('')}
                                            className="!w-5 !h-5 !min-w-[20px] !min-h-[20px] !p-0 flex items-center justify-center rounded-[6px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </motion.button>
                                    ) : (
                                        <motion.kbd
                                            key="hint"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500 dark:shadow-none pointer-events-none"
                                        >
                                            /
                                        </motion.kbd>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        {/* Premium Category Filter Tabs with Sliding Indicator */}
                        <CategoryTabs
                            categories={categories}
                            activeCategory={activeCategory}
                            onCategoryChange={setActiveCategory}
                        />
                    </div>
                </div>

                <div className="flex gap-3 overflow-x-auto [scrollbar-width:none] sm:grid sm:grid-cols-3 xl:grid-cols-1 p-2 -m-2">
                    {recommendedTools.map((tool, index) => (
                        <motion.button
                            key={tool.id}
                            type="button"
                            onClick={() => {
                                markToolUsed(tool.id);
                                if (tool.onClick) {
                                    tool.onClick();
                                } else {
                                    setActiveCategory(tool.category);
                                }
                            }}
                            className="group relative flex min-w-[260px] shrink-0 sm:min-w-0 sm:shrink items-center gap-4 sm:gap-5 overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-[24px] p-4 sm:p-5 text-left transition-all duration-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileTap={{ scale: 0.985 }}
                            transition={{ type: 'tween', ease: [0.25, 0.46, 0.45, 0.94], duration: 0.3, delay: index * 0.04 }}
                        >
                            {/* Background Ambient Glow */}
                            <div
                                className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-blue-500/5 opacity-0 blur-2xl transition-opacity duration-500 ease-out group-hover:opacity-100 dark:bg-blue-500/10"
                                aria-hidden="true"
                            />

                            {/* Icon container — matches Overall Progress card style */}
                            <motion.div 
                                whileHover={{ scale: 1.05, rotate: -5 }}
                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] sm:rounded-[20px] bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center flex-shrink-0 shadow-sm relative transition-transform duration-300 text-blue-600 dark:text-blue-400"
                                aria-hidden="true"
                            >
                                <div className="scale-110">
                                    {tool.icon}
                                </div>
                            </motion.div>

                            {/* Text */}
                            <div className="flex flex-col min-w-0 flex-1">
                                <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-tight mb-0.5 transition-colors truncate">
                                    {tool.name}
                                </h2>
                                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed truncate">
                                    {tool.bestFor}
                                </p>
                            </div>

                            {/* Chevron arrow */}
                            <svg
                                className="relative ml-auto h-4 w-4 shrink-0 text-zinc-300 transition-all duration-300 ease-out group-hover:translate-x-0.5 group-hover:text-blue-400 dark:text-zinc-600 dark:group-hover:text-blue-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </motion.button>
                    ))}
                </div>
            </motion.section>

            {/* Tools Grid - Uniform Card Sizes */}
            {filteredTools.length > 0 ? (
                <motion.div
                    layout
                    className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2 2xl:grid-cols-3"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredTools.map((tool, idx) => (
                            <motion.div
                                key={tool.id}
                                layout
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 350,
                                    damping: 25,
                                    delay: idx * 0.04 }}
                                className="h-full"
                            >
                                <ToolItem
                                    tool={tool}
                                    onProcessFiles={processFiles}
                                    isProcessing={convertingFile === tool.name}
                                    isSuccess={conversionSuccess === tool.name}
                                    onSuccessClose={() => setConversionSuccess(null)}
                                    isRecent={recentToolIds.includes(tool.id)}
                                    onToolOpen={markToolUsed}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ scale: 0.85, rotateX: -15, y: 20 }}
                    animate={{ scale: 1, rotateX: 0, y: 0 }}
                    exit={{ scale: 0.85, rotateX: 15, y: -20 }}
                    transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
                    style={{ perspective: 1200 }}
                    className="relative overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900 sm:p-8 transform-gpu"
                >
                    <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-5">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] border border-blue-100 bg-blue-50 text-blue-600 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
                                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="m21 21-4.35-4.35" />
                                    <circle cx="11" cy="11" r="7.5" />
                                    <path d="M8.75 11h4.5" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">
                                    No matching tools found
                                </h3>
                                <p className="mt-2 max-w-2xl text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
                                    Try a simpler search like “pdf”, “essay”, or “citation”, or reset your filters to browse all student tools.
                                </p>
                            </div>
                        </div>
                        <motion.button
                            type="button"
                            onClick={() => {
                                setSearchQuery('');
                                setActiveCategory('all');
                            }}
                            className="flex shrink-0 items-center justify-center gap-1.5 rounded-[14px] bg-emerald-100 px-4 py-2.5 text-[13px] font-bold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:bg-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-900/70 dark:focus-visible:ring-offset-zinc-950"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M3 12a9 9 0 1 0 3-6.7" />
                                <path d="M3 4v5h5" />
                            </svg>
                            Reset filters
                        </motion.button>
                    </div>
                </motion.div>
            )}

            {/* Removed Local-first banner */}

            <style>{`
                /* Tool Card - Border hover effect (Framer handles the rest) */
                .tool-card-modern:hover {
                    border-color: #93c5fd !important;
                }
                
                /* Dark Mode - Tool Cards */
                body.dark-mode .tool-card-modern {
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
                    border-color: #334155 !important;
                }
                body.dark-mode .tool-card-modern:hover {
                    border-color: #3b82f6 !important;
                }
                body.dark-mode .tool-card-modern p {
                    color: #94a3b8 !important;
                }
                body.dark-mode .tool-card-modern .tool-badge-modern {
                    background: rgba(34, 197, 94, 0.15) !important;
                }
                
                /* Dark Mode - Category Tabs Container */
                body.dark-mode .category-tabs-container {
                    background: #1e293b !important;
                    border-color: #334155 !important;
                }
                body.dark-mode .category-tabs-container button span:last-child {
                    color: #94a3b8;
                }
                
                /* Dark Mode - Footer */
                body.dark-mode .tools-footer-tip {
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
                    border-color: #334155 !important;
                }
                body.dark-mode .tools-footer-tip p {
                    color: #94a3b8 !important;
                }
                body.dark-mode .tools-footer-tip p span {
                    color: #60a5fa !important;
                }
                
                /* Dark Mode - Tool Modal */
                body.dark-mode .tool-modal-container {
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
                }
                body.dark-mode .tool-modal-container h2 {
                    color: #f1f5f9 !important;
                }
                body.dark-mode .tool-modal-container p {
                    color: #94a3b8 !important;
                }
                body.dark-mode .tool-modal-container > div > div:last-child span {
                    background: #334155 !important;
                    color: #94a3b8 !important;
                }
                body.dark-mode .tool-modal-container button[style*="background: white"] {
                    background: #334155 !important;
                    border-color: #475569 !important;
                    color: #94a3b8 !important;
                }
                
                /* Dark Mode - Hero Section */
                body.dark-mode .tools-hero-card {
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
                    border-color: #334155 !important;
                }
                body.dark-mode .tools-hero-card:hover {
                    border-color: #3b82f6 !important;
                }
                body.dark-mode .tools-hero-card h1 {
                    color: #f1f5f9 !important;
                }
                body.dark-mode .tools-hero-card h1 span {
                    color: #60a5fa !important;
                }
                body.dark-mode .tools-hero-card p {
                    color: #94a3b8 !important;
                }
                
                /* Dark Mode - Feature Pills in Hero */
                body.dark-mode .tools-hero-card > div > div > div:last-child > div {
                    background: #1e293b !important;
                    border-color: #334155 !important;
                }
                body.dark-mode .tools-hero-card > div > div > div:last-child > div > div > div:first-child {
                    color: #e2e8f0 !important;
                }
                body.dark-mode .tools-hero-card > div > div > div:last-child > div > div > div:last-child {
                    color: #64748b !important;
                }
                
                /* Dark Mode - Tool Card Title */
                body.dark-mode .tool-card-modern h3 {
                    color: #f1f5f9 !important;
                }
                body.dark-mode .tool-card-modern:hover h3 {
                    color: #60a5fa !important;
                }
                
                /* Dark Mode - Tool Card Icon */
                body.dark-mode .tool-card-modern .tool-icon-modern {
                    background: #1e293b !important;
                    border-color: #334155 !important;
                }
                
                /* Dark Mode - Tool Card Badge */
                body.dark-mode .tool-card-modern .tool-badge-modern span {
                    color: #4ade80 !important;
                }
                body.dark-mode .tool-card-modern:hover .tool-badge-modern {
                    background: rgba(59, 130, 246, 0.2) !important;
                }
                body.dark-mode .tool-card-modern:hover .tool-badge-modern span {
                    color: #93c5fd !important;
                }
                
                /* Dark Mode - Skeleton */
                body.dark-mode .tools-content > div:first-child > div:first-child {
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
                    border-color: #334155 !important;
                }
                body.dark-mode .tools-content > div:first-child > div:last-child {
                    background: linear-gradient(135deg, #334155 0%, #1e293b 100%) !important;
                }
                
                /* Dark Mode - Success Toast */
                body.dark-mode .success-toast-container {
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
                    border-color: #334155 !important;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(34, 197, 94, 0.2) !important;
                }
                body.dark-mode .success-toast-container p:first-of-type {
                    color: #f1f5f9 !important;
                }
                body.dark-mode .success-toast-container p:last-of-type {
                    color: #94a3b8 !important;
                }
            `}</style>
        </div>
    );
};

export default ToolsContent;
