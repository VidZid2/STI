import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

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
// Plagiarism Checker - Reserved for Teacher Dashboard (hidden from students)
// import PlagiarismChecker from '../../components/tools/PlagiarismChecker';

interface Tool {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: React.ReactNode;
    accept: string;
    multiple: boolean;
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

const ToolsContent: React.FC = () => {
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
    // Plagiarism Checker - Reserved for Teacher Dashboard (hidden from students)
    // const [showPlagiarismChecker, setShowPlagiarismChecker] = useState(false);

    // Initial loading state
    useEffect(() => {
        const timer = setTimeout(() => setIsToolsLoading(false), 600);
        return () => clearTimeout(timer);
    }, []);

    // If Grammar Checker is active, show dedicated page
    if (showGrammarChecker) {
        return <LanguageToolGrammarChecker onBack={() => setShowGrammarChecker(false)} />;
    }

    // If Word Counter is active, show dedicated page
    if (showWordCounter) {
        return <WordCounter onBack={() => setShowWordCounter(false)} />;
    }

    // If Citation Generator is active, show dedicated page
    if (showCitationGenerator) {
        return <CitationGenerator onBack={() => setShowCitationGenerator(false)} />;
    }

    // If Text Summarizer is active, show dedicated page
    if (showTextSummarizer) {
        return <TextSummarizer onBack={() => setShowTextSummarizer(false)} />;
    }

    // If Reference Manager is active, show dedicated page
    if (showReferenceManager) {
        return <ReferenceManager onBack={() => setShowReferenceManager(false)} />;
    }

    // If Paraphraser is active, show dedicated page
    if (showParaphraser) {
        return <Paraphraser onBack={() => setShowParaphraser(false)} />;
    }

    // Plagiarism Checker - Reserved for Teacher Dashboard (hidden from students)
    // if (showPlagiarismChecker) {
    //     return <PlagiarismChecker onBack={() => setShowPlagiarismChecker(false)} />;
    // }

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
        { id: 'all', name: 'All Tools', icon: '🔧' },
        { id: 'convert', name: 'Converters', icon: '📄' },
        { id: 'text', name: 'Text Tools', icon: '📝' },
    ];

    const tools: Tool[] = [
        {
            id: 'image-pdf',
            name: 'Image to PDF',
            description: 'Combine multiple images into a single PDF document (works offline)',
            category: 'convert',
            accept: '.png,.jpg,.jpeg',
            multiple: true,
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
            onClick: () => setShowReferenceManager(true), // Opens dedicated page
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
            ) },
        {
            id: 'paraphraser',
            name: 'Paraphraser',
            description: 'Rewrite text in different styles • Free',
            category: 'text',
            accept: '',
            multiple: false,
            onClick: () => setShowParaphraser(true), // Opens dedicated page
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
            ) },
        // HIDDEN: Plagiarism Checker - Reserved for Teacher Dashboard
        // Uncomment when building teacher side
        // {
        //     id: 'plagiarism-checker',
        //     name: 'Plagiarism Checker',
        //     description: 'Check text originality • Basic free tier',
        //     category: 'text',
        //     accept: '',
        //     multiple: false,
        //     onClick: () => setShowPlagiarismChecker(true),
        //     icon: (
        //         <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9h6v6H9z" />
        //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
        //         </svg>
        //     ),
        // },
    ];

    const allTools = [...tools, ...newTools];

    const filteredTools = activeCategory === 'all' ? allTools : allTools.filter((tool) => tool.category === activeCategory);

    // Show skeleton while loading
    if (isToolsLoading) {
        return <ToolsSkeleton />;
    }

    return (
        <div className="tools-content">
            {/* Modern Minimalistic Tools Header */}
            <motion.section
                className="tools-hero-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{
                    marginBottom: '2rem',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'stretch' }}
            >
                {/* Main Hero Card - Slide in from left */}
                <motion.div
                    className="tools-hero-card"
                    initial={{ opacity: 0, x: -40, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 25,
                        delay: 0.1 }}
                    whileHover={{
                        borderColor: '#93c5fd',
                        boxShadow: '0 20px 40px rgba(59, 130, 246, 0.1)' }}
                    style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '20px',
                        padding: '2rem 2.5rem',
                        position: 'relative',
                        overflow: 'hidden' }}
                >
                    {/* Decorative Background Elements */}
                    <div style={{
                        position: 'absolute',
                        top: '-50px',
                        right: '-50px',
                        width: '200px',
                        height: '200px',
                        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
                        borderRadius: '50%',
                        pointerEvents: 'none' }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '-30px',
                        right: '100px',
                        width: '120px',
                        height: '120px',
                        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.06) 0%, transparent 70%)',
                        borderRadius: '50%',
                        pointerEvents: 'none' }} />

                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        {/* Icon Container */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                            style={{
                                width: '72px',
                                height: '72px',
                                borderRadius: '20px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.25)',
                                flexShrink: 0 }}
                        >
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                            </svg>
                        </motion.div>

                        {/* Text Content */}
                        <div style={{ flex: 1 }}>
                            <motion.p
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                style={{
                                    fontSize: '0.85rem',
                                    color: '#64748b',
                                    fontWeight: 500,
                                    margin: 0,
                                    marginBottom: '0.25rem' }}
                            >
                                Document Utilities
                            </motion.p>
                            <motion.h1
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.35 }}
                                style={{
                                    fontSize: '2rem',
                                    fontWeight: 700,
                                    color: '#0f172a',
                                    margin: 0,
                                    letterSpacing: '-0.03em',
                                    lineHeight: 1.1 }}
                            >
                                Student <span style={{ color: '#3b82f6' }}>Tools</span>
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                style={{
                                    fontSize: '0.9rem',
                                    color: '#64748b',
                                    margin: 0,
                                    marginTop: '0.5rem' }}
                            >
                                Convert, merge, and analyze your documents with ease
                            </motion.p>

                            {/* Feature Pills */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    marginTop: '1rem',
                                    flexWrap: 'wrap' }}
                            >
                                {[
                                    { icon: '🔒', label: 'Privacy First', desc: 'Files stay local' },
                                    { icon: '⚡', label: 'Instant', desc: 'No upload wait' },
                                    { icon: '♾️', label: 'Unlimited', desc: 'No restrictions' },
                                ].map((feature, idx) => (
                                    <motion.div
                                        key={feature.label}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.5 + idx * 0.1 }}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.5rem 0.875rem',
                                            background: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '10px',
                                            cursor: 'default' }}
                                    >
                                        <span style={{ fontSize: '1rem' }}>{feature.icon}</span>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>{feature.label}</div>
                                            <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{feature.desc}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Card - Slide in from right */}
                <motion.div
                    initial={{ opacity: 0, x: 40, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 25,
                        delay: 0.2 }}
                    whileHover={{
                        scale: 1.02,
                        boxShadow: '0 25px 50px rgba(30, 64, 175, 0.3)' }}
                    style={{
                        width: '280px',
                        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                        borderRadius: '20px',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden',
                        flexShrink: 0 }}
                >
                    {/* Decorative circles */}
                    <div style={{
                        position: 'absolute',
                        top: '-20px',
                        right: '-20px',
                        width: '100px',
                        height: '100px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '50%' }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '-30px',
                        left: '-30px',
                        width: '80px',
                        height: '80px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '50%' }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35, type: 'spring', stiffness: 300 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}
                        >
                            <motion.svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ opacity: 0.8 }}
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ delay: 0.4, type: 'spring', stiffness: 400 }}
                            >
                                <path d="M3 3v18h18" />
                                <path d="m19 9-5 5-4-4-3 3" />
                            </motion.svg>
                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Quick Stats</span>
                        </motion.div>

                        {/* Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.45, type: 'spring', stiffness: 400, damping: 15 }}
                                style={{ textAlign: 'center' }}
                            >
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    style={{ fontSize: '2rem', fontWeight: 700, color: 'white', lineHeight: 1 }}
                                >
                                    {allTools.length}
                                </motion.div>
                                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem' }}>Tools</div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5, type: 'spring', stiffness: 400, damping: 15 }}
                                style={{ textAlign: 'center' }}
                            >
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.55 }}
                                    style={{ fontSize: '2rem', fontWeight: 700, color: '#fbbf24', lineHeight: 1 }}
                                >
                                    Free
                                </motion.div>
                                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem' }}>Forever</div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Bottom Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, type: 'spring', stiffness: 300 }}
                        whileHover={{ scale: 1.02 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.625rem 1rem',
                            background: 'rgba(255, 255, 255, 0.15)',
                            borderRadius: '10px',
                            marginTop: '1rem',
                            backdropFilter: 'blur(10px)' }}
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                boxShadow: [
                                    '0 0 8px rgba(34, 197, 94, 0.6)',
                                    '0 0 16px rgba(34, 197, 94, 0.8)',
                                    '0 0 8px rgba(34, 197, 94, 0.6)',
                                ]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#22c55e' }}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'white', fontWeight: 500 }}>Available 24/7</span>
                    </motion.div>
                </motion.div>
            </motion.section>

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
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '1.25rem',
                    gridAutoRows: '1fr', // Ensures all rows have same height
                }}
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
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* Footer Tip */}
            <motion.div
                className="tools-footer-tip"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                    marginTop: '2.5rem',
                    padding: '1rem 1.5rem',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem' }}
            >
                <span style={{ fontSize: '1.25rem' }}>💡</span>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, fontWeight: 500 }}>
                    All tools are <span style={{ color: '#3b82f6', fontWeight: 600 }}>free</span> to use • Your files stay on your device
                </p>
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
                
                /* Dark Mode - Category Tabs (legacy selector) */
                body.dark-mode .tools-content > div:nth-child(3) {
                    background: #1e293b !important;
                    border-color: #334155 !important;
                }
                body.dark-mode .tools-content > div:nth-child(3) button:not([style*="linear-gradient"]) {
                    color: #94a3b8 !important;
                }
                body.dark-mode .tools-content > div:nth-child(3) button:not([style*="linear-gradient"]):hover {
                    color: #e2e8f0 !important;
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
