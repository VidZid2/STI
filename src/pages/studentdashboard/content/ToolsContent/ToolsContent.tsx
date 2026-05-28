import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wrench, FileBox, FileText, ShieldCheck } from 'lucide-react';

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
    category: string;
    icon: React.ReactNode;
    accept: string;
    multiple: boolean;
    badges?: string[];
    accent?: 'blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan';
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
import { CategoryTabs, ToolsSkeleton } from './components/ToolsShared';
import ToolsHeader from './components/ToolsHeader';

const ToolsContent: React.FC = () => {
    const recentStorageKey = 'elms_recent_tools';
    const [activeCategory, setActiveCategory] = useState('all');
    const [convertingFile, setConvertingFile] = useState<string | null>(null);
    const [conversionSuccess, setConversionSuccess] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isToolsLoading, setIsToolsLoading] = useState(true);
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

    // Initial loading state
    useEffect(() => {
        const timer = setTimeout(() => setIsToolsLoading(false), 600);
        return () => clearTimeout(timer);
    }, []);

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
        return <div className={isDarkMode ? 'dark' : ''}><CitationGenerator onBack={() => setShowCitationGenerator(false)} /></div>;
    }

    // If Text Summarizer is active, show dedicated page
    if (showTextSummarizer) {
        return <div className={isDarkMode ? 'dark' : ''}><TextSummarizer onBack={() => setShowTextSummarizer(false)} /></div>;
    }

    // If Reference Manager is active, show dedicated page
    if (showReferenceManager) {
        return <div className={isDarkMode ? 'dark' : ''}><ReferenceManager onBack={() => setShowReferenceManager(false)} /></div>;
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
            category: 'text',
            accept: '',
            multiple: false,
            badges: ['Auto-save', 'APA/MLA', 'Export'],
            accent: 'amber',
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
            category: 'text',
            accept: '',
            multiple: false,
            badges: ['Auto-save', 'Saved library', 'Export'],
            accent: 'violet',
            onClick: () => setShowReferenceManager(true), // Opens dedicated page
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
            ) },
        {
            id: 'paraphraser',
            name: 'Paraphraser',
            description: 'Rewrite text in different styles',
            category: 'text',
            accept: '',
            multiple: false,
            badges: ['Auto-save', 'Modes', 'Guardrails'],
            accent: 'emerald',
            recommended: true,
            onClick: () => setShowParaphraser(true), // Opens dedicated page
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
            ) },
        {
            id: 'plagiarism-checker',
            name: 'Plagiarism Checker',
            description: 'Check text originality • Basic free tier',
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
    ];

    const allTools = [...tools, ...newTools];

    const visibleTools = activeCategory === 'all'
        ? allTools
        : allTools.filter((tool) => tool.category === activeCategory);

    const filteredTools = [...visibleTools].sort((a, b) => {
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

    // Show skeleton while loading
    if (isToolsLoading) {
        return <div className={`tools-content pb-24 ${isDarkMode ? 'dark' : ''}`}><ToolsSkeleton /></div>;
    }

    return (
        <div className={`tools-content pb-24 text-zinc-900 dark:text-zinc-100 ${isDarkMode ? 'dark' : ''}`}>
            {/* Premium Minimalistic Tools Header */}
            <ToolsHeader totalTools={allTools.length} />

            {/* Confetti for success celebration */}
            <SuccessConfetti isActive={!!conversionSuccess} />

            <ResultModal result={analysisResult} onClose={() => setAnalysisResult(null)} />

            {/* Premium Category Filter Tabs with Sliding Indicator */}
            <CategoryTabs
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
            />

            {/* Tools Grid - Uniform Card Sizes */}
            <motion.div
                layout
                className="grid auto-rows-[404px] grid-cols-1 gap-8 lg:grid-cols-2 2xl:grid-cols-3"
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
                            style={{ height: '100%' }} // Ensure wrapper takes full height
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

            {/* Animated SaaS Trust Banner */}
            <motion.div
                className="group relative flex items-center justify-center w-fit mx-auto mt-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 25 }}
            >
                {/* Background ambient pulse on hover */}
                <motion.div
                    className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-xl transition-all duration-300 group-hover:bg-blue-500/30"
                    aria-hidden="true"
                />
                
                <div className="relative flex items-center gap-3 px-6 py-3 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 rounded-full shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300">
                    <motion.div
                        animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                        transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 5 }}
                        className="flex items-center justify-center p-1.5 bg-blue-50 dark:bg-blue-900/40 rounded-full text-blue-600 dark:text-blue-400"
                    >
                        <ShieldCheck className="w-4 h-4" />
                    </motion.div>
                    <p className="text-[13px] font-medium text-zinc-600 dark:text-zinc-300 m-0">
                        Local-first file tools. Connected AI runs only when configured.
                    </p>
                </div>
            </motion.div>

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
