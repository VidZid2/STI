import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { convertImageToPDF, mergePDFs } from '../../lib/pdfUtils';
import { FileUpload } from '../../components/ui/primitives/file-upload';
import { convertDocxToPDF } from '../../lib/converters/docxToPdf';
import { convertPdfToDocx } from '../../lib/converters/pdfToDocx';
import { compressPDF, formatFileSize } from '../../lib/converters/compressPdf';
import { analyzeText, type TextStats } from '../../lib/converters/textAnalysis';
// iLovePDF API Service - For Word to PDF, Image to PDF, Merge PDFs
// 5 accounts × 250 files = 1,250/month
import {
    convertDocxToPdfILovePDF,
    convertImagesToPdfILovePDF,
    mergePdfsILovePDF,
    isILovePDFConfigured,
    getApiStatus,
} from '../../lib/converters/ilovepdfService';
// Adobe PDF Services API - For PDF to Word (best quality!)
// 5 accounts × 500 files = 2,500/month
import {
    convertPdfToDocxAdobe,
    isAdobeConfigured,
    getAdobeApiStatus,
} from '../../lib/converters/adobePdfService';
// LanguageTool Grammar Checker - Free, no API key required!
import LanguageToolGrammarChecker from '../../components/tools/LanguageToolGrammarChecker';
// Word Counter - Offline text analysis
import WordCounter from '../../components/tools/WordCounter';
// Citation Generator - Academic citation formatting
import CitationGenerator from '../../components/tools/CitationGenerator';
// Text Summarizer - AI-powered text summarization
import TextSummarizer from '../../components/tools/TextSummarizer';
// Reference Manager - Save and organize citations
import ReferenceManager from '../../components/tools/ReferenceManager';
// Paraphraser - AI-powered text paraphrasing
import Paraphraser from '../../components/tools/Paraphraser';
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

// Minimalistic Success Confetti Component
interface ConfettiPiece {
    id: number;
    x: number;
    delay: number;
    duration: number;
    color: string;
    size: number;
    rotation: number;
}

const SuccessConfetti: React.FC<{ isActive: boolean; onComplete?: () => void }> = ({ isActive, onComplete }) => {
    const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

    // Professional, muted color palette
    const colors = [
        '#3b82f6', // Blue
        '#60a5fa', // Light blue
        '#1d4ed8', // Dark blue
        '#fbbf24', // Gold
        '#f59e0b', // Amber
        '#22c55e', // Green
        '#10b981', // Emerald
    ];

    useEffect(() => {
        if (isActive) {
            // Generate confetti pieces
            const newPieces: ConfettiPiece[] = [];
            const pieceCount = 50; // Moderate amount for professional look

            for (let i = 0; i < pieceCount; i++) {
                newPieces.push({
                    id: i,
                    x: Math.random() * 100, // Random horizontal position (%)
                    delay: Math.random() * 0.3, // Staggered start
                    duration: 2 + Math.random() * 1.5, // 2-3.5s fall time
                    color: colors[Math.floor(Math.random() * colors.length)],
                    size: 6 + Math.random() * 6, // 6-12px
                    rotation: Math.random() * 360,
                });
            }
            setPieces(newPieces);

            // Clean up after animation
            const timer = setTimeout(() => {
                setPieces([]);
                onComplete?.();
            }, 4000);

            return () => clearTimeout(timer);
        } else {
            setPieces([]);
        }
    }, [isActive, onComplete]);

    if (!isActive && pieces.length === 0) return null;

    return createPortal(
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                zIndex: 99999,
                overflow: 'hidden',
            }}
        >
            {pieces.map((piece) => (
                <motion.div
                    key={piece.id}
                    initial={{
                        x: `${piece.x}vw`,
                        y: -20,
                        rotate: piece.rotation,
                        opacity: 1,
                        scale: 0,
                    }}
                    animate={{
                        y: '110vh',
                        rotate: piece.rotation + (Math.random() > 0.5 ? 720 : -720),
                        opacity: [1, 1, 1, 0],
                        scale: [0, 1, 1, 0.5],
                    }}
                    transition={{
                        duration: piece.duration,
                        delay: piece.delay,
                        ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    style={{
                        position: 'absolute',
                        width: piece.size,
                        height: piece.size,
                        backgroundColor: piece.color,
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        boxShadow: `0 2px 8px ${piece.color}40`,
                    }}
                />
            ))}
        </div>,
        document.body
    );
};

const ToolItem: React.FC<{
    tool: Tool;
    onProcessFiles: (files: FileList | File[], toolName: string) => void;
    isProcessing: boolean;
    isSuccess: boolean;
    onSuccessClose: () => void;
}> = ({ tool, onProcessFiles, isProcessing, isSuccess, onSuccessClose }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasFiles, setHasFiles] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    // Auto close modal after showing success
    useEffect(() => {
        if (isSuccess && isOpen) {
            const timer = setTimeout(() => {
                setIsOpen(false);
                onSuccessClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isSuccess, isOpen, onSuccessClose]);

    // Check if tutorial has been shown before
    const tutorialKey = `tutorial_shown_${tool.id}`;

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showTutorial) {
                    setShowTutorial(false);
                    setCurrentStep(0);
                } else if (isOpen) {
                    setIsOpen(false);
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, showTutorial]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen || showTutorial) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, showTutorial]);

    // Reset hasFiles when modal closes
    useEffect(() => {
        if (!isOpen) {
            setHasFiles(false);
        }
    }, [isOpen]);

    const handleFileChange = (files: File[]) => {
        if (files.length > 0) {
            onProcessFiles(files, tool.name);
        }
    };

    const handleFilesChange = (filesExist: boolean) => {
        setHasFiles(filesExist);
    };

    const handleCardClick = () => {
        // If tool has custom onClick handler (e.g. Grammar Checker), use it
        if (tool.onClick) {
            tool.onClick();
            return;
        }
        if (tool.linkTo && tool.tutorial) {
            const hasSeenTutorial = localStorage.getItem(tutorialKey);
            if (!hasSeenTutorial) {
                setShowTutorial(true);
                setCurrentStep(0);
            } else {
                window.open(tool.linkTo, '_blank', 'noopener,noreferrer');
            }
        } else if (tool.linkTo) {
            window.open(tool.linkTo, '_blank', 'noopener,noreferrer');
        } else {
            setIsOpen(true);
        }
    };

    const handleTutorialNext = () => {
        if (tool.tutorial && currentStep < tool.tutorial.steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleTutorialPrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleTutorialComplete = () => {
        localStorage.setItem(tutorialKey, 'true');
        setShowTutorial(false);
        setCurrentStep(0);
        if (tool.linkTo) {
            window.open(tool.linkTo, '_blank', 'noopener,noreferrer');
        }
    };

    const handleSkipTutorial = () => {
        localStorage.setItem(tutorialKey, 'true');
        setShowTutorial(false);
        setCurrentStep(0);
        if (tool.linkTo) {
            window.open(tool.linkTo, '_blank', 'noopener,noreferrer');
        }
    };

    // Hover state for smooth Framer Motion animations
    const [isHovered, setIsHovered] = useState(false);

    return (
        <>
            {/* Modern Minimalistic Card - Fixed Height */}
            <motion.button
                className="tool-card-modern"
                onClick={handleCardClick}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                    opacity: 1,
                    y: isHovered ? -8 : 0,
                    boxShadow: isHovered
                        ? '0 25px 50px rgba(59, 130, 246, 0.15)'
                        : '0 4px 20px rgba(0, 0, 0, 0.04)',
                }}
                whileTap={{ scale: 0.98 }}
                transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                    mass: 0.8,
                }}
                style={{
                    width: '100%',
                    height: '220px', // Fixed height for uniform cards
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    textAlign: 'left',
                    position: 'relative',
                    padding: 0,
                }}
            >
                {/* Animated gradient overlay */}
                <motion.div
                    className="tool-card-hover-gradient"
                    animate={{
                        opacity: isHovered ? 1 : 0,
                        scale: isHovered ? 1.2 : 1,
                    }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '180px',
                        height: '180px',
                        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
                        borderRadius: '50%',
                        transform: 'translate(30%, -30%)',
                        pointerEvents: 'none',
                    }}
                />

                <div
                    className="tool-card"
                    style={{
                        position: 'relative',
                        padding: '1.5rem',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {/* Header with Icon and Arrow */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <motion.div
                            className="tool-icon-modern"
                            animate={{
                                background: isHovered
                                    ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                                    : '#f8fafc',
                                color: isHovered ? '#ffffff' : '#3b82f6',
                                borderColor: isHovered ? 'transparent' : '#e2e8f0',
                                scale: isHovered ? 1.05 : 1,
                                rotate: isHovered ? 3 : 0,
                                boxShadow: isHovered
                                    ? '0 10px 25px rgba(59, 130, 246, 0.3)'
                                    : '0 0 0 rgba(0, 0, 0, 0)',
                            }}
                            transition={{
                                type: 'spring',
                                stiffness: 400,
                                damping: 20,
                            }}
                            style={{
                                width: '52px',
                                height: '52px',
                                borderRadius: '14px',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            {tool.icon}
                        </motion.div>

                        {/* Animated Arrow indicator */}
                        <motion.div
                            animate={{
                                opacity: isHovered ? 1 : 0,
                                x: isHovered ? 0 : -10,
                            }}
                            transition={{
                                type: 'spring',
                                stiffness: 400,
                                damping: 25,
                            }}
                        >
                            <svg
                                style={{ width: '18px', height: '18px', color: '#3b82f6' }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </motion.div>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <motion.h3
                            className="tool-title-modern"
                            animate={{
                                color: isHovered ? '#3b82f6' : '#0f172a',
                            }}
                            transition={{ duration: 0.2 }}
                            style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                margin: 0,
                                letterSpacing: '-0.01em',
                            }}
                        >
                            {tool.name}
                        </motion.h3>
                        <p
                            style={{
                                fontSize: '0.8rem',
                                color: '#64748b',
                                lineHeight: 1.5,
                                margin: 0,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }}
                        >
                            {tool.description}
                        </p>
                    </div>

                    {/* Bottom Badge */}
                    <motion.div
                        className="tool-badge-modern"
                        animate={{
                            background: isHovered ? '#dbeafe' : '#f0fdf4',
                        }}
                        transition={{ duration: 0.2 }}
                        style={{
                            display: 'inline-flex',
                            marginTop: 'auto',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.375rem 0.625rem',
                            background: '#f0fdf4',
                            borderRadius: '8px',
                            alignSelf: 'flex-start',
                        }}
                    >
                        <motion.div
                            animate={{
                                background: isHovered ? '#3b82f6' : '#22c55e',
                            }}
                            transition={{ duration: 0.2 }}
                            style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                            }}
                        />
                        <motion.span
                            animate={{
                                color: isHovered ? '#1d4ed8' : '#15803d',
                            }}
                            transition={{ duration: 0.2 }}
                            style={{ fontSize: '0.7rem', fontWeight: 500 }}
                        >
                            {tool.category === 'convert' ? 'Converter' : 'Text Tool'}
                        </motion.span>
                    </motion.div>
                </div>
            </motion.button>

            {/* Modal Portal */}
            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Premium Backdrop with blur */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                onClick={() => setIsOpen(false)}
                                style={{
                                    position: 'fixed',
                                    inset: 0,
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    backdropFilter: 'blur(8px)',
                                    zIndex: 9998,
                                }}
                            />

                            {/* Modal Container */}
                            <div
                                style={{
                                    position: 'fixed',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 9999,
                                    pointerEvents: 'none',
                                    padding: '1rem',
                                }}
                            >
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9, y: 40 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    transition={{
                                        type: 'spring',
                                        damping: 28,
                                        stiffness: 400,
                                        mass: 0.8,
                                    }}
                                    className="tool-modal-container"
                                    style={{
                                        borderRadius: '24px',
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                        width: '90%',
                                        maxWidth: hasFiles ? '560px' : '520px',
                                        boxShadow: '0 25px 80px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                                        pointerEvents: 'auto',
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {/* Decorative gradient accent */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '4px',
                                        background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 50%, #3b82f6 100%)',
                                    }} />

                                    {/* Modal Content */}
                                    <div style={{ padding: '2rem' }}>
                                        {/* Header with Icon */}
                                        <motion.div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '1rem',
                                                marginBottom: '1.5rem',
                                            }}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                                        >
                                            {/* Tool Icon */}
                                            <motion.div
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 15 }}
                                                style={{
                                                    width: '56px',
                                                    height: '56px',
                                                    borderRadius: '16px',
                                                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {tool.icon}
                                            </motion.div>

                                            {/* Title and Description */}
                                            <div style={{ flex: 1, paddingTop: '0.25rem' }}>
                                                <motion.h2
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.15 }}
                                                    style={{
                                                        fontSize: '1.375rem',
                                                        fontWeight: 700,
                                                        color: '#0f172a',
                                                        margin: 0,
                                                        marginBottom: '0.375rem',
                                                        letterSpacing: '-0.02em',
                                                    }}
                                                >
                                                    {tool.name}
                                                </motion.h2>
                                                <motion.p
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.2 }}
                                                    style={{
                                                        fontSize: '0.9rem',
                                                        color: '#64748b',
                                                        margin: 0,
                                                        lineHeight: 1.5,
                                                    }}
                                                >
                                                    {tool.description}
                                                </motion.p>
                                            </div>
                                        </motion.div>

                                        {/* Upload Area with Success State */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                                        >
                                            <AnimatePresence mode="wait">
                                                {isSuccess ? (
                                                    /* Success State */
                                                    <motion.div
                                                        key="success"
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                        style={{
                                                            border: '2px solid #22c55e',
                                                            borderRadius: '16px',
                                                            padding: '3rem 2rem',
                                                            textAlign: 'center',
                                                            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                                                            position: 'relative',
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        {/* Success Icon */}
                                                        <motion.div
                                                            initial={{ scale: 0, rotate: -180 }}
                                                            animate={{ scale: 1, rotate: 0 }}
                                                            transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 15 }}
                                                            style={{
                                                                width: '64px',
                                                                height: '64px',
                                                                borderRadius: '50%',
                                                                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                margin: '0 auto 1rem',
                                                                boxShadow: '0 8px 24px rgba(34, 197, 94, 0.3)',
                                                            }}
                                                        >
                                                            <motion.svg
                                                                width="32"
                                                                height="32"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="white"
                                                                strokeWidth="3"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                <motion.path
                                                                    d="M5 13l4 4L19 7"
                                                                    initial={{ pathLength: 0 }}
                                                                    animate={{ pathLength: 1 }}
                                                                    transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
                                                                />
                                                            </motion.svg>
                                                        </motion.div>
                                                        <motion.p
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.2 }}
                                                            style={{ fontSize: '1.125rem', fontWeight: 700, color: '#166534', margin: 0 }}
                                                        >
                                                            Conversion Successful!
                                                        </motion.p>
                                                        <motion.p
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.25 }}
                                                            style={{ fontSize: '0.875rem', color: '#15803d', margin: '0.5rem 0 0' }}
                                                        >
                                                            Your file has been downloaded
                                                        </motion.p>
                                                        {/* Decorative sparkles */}
                                                        {[...Array(6)].map((_, i) => (
                                                            <motion.div
                                                                key={i}
                                                                initial={{ opacity: 0, scale: 0 }}
                                                                animate={{
                                                                    opacity: [0, 1, 0],
                                                                    scale: [0, 1, 0],
                                                                }}
                                                                transition={{
                                                                    delay: 0.3 + i * 0.1,
                                                                    duration: 0.6,
                                                                    ease: 'easeOut',
                                                                }}
                                                                style={{
                                                                    position: 'absolute',
                                                                    width: '8px',
                                                                    height: '8px',
                                                                    borderRadius: '50%',
                                                                    background: i % 2 === 0 ? '#22c55e' : '#fbbf24',
                                                                    top: `${20 + Math.random() * 60}%`,
                                                                    left: `${10 + Math.random() * 80}%`,
                                                                }}
                                                            />
                                                        ))}
                                                    </motion.div>
                                                ) : isProcessing ? (
                                                    /* Processing State */
                                                    <motion.div
                                                        key="processing"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        style={{
                                                            border: '2px dashed #93c5fd',
                                                            borderRadius: '16px',
                                                            padding: '3rem 2rem',
                                                            textAlign: 'center',
                                                            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                                                        }}
                                                    >
                                                        {/* Processing Spinner */}
                                                        <motion.div
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                            style={{
                                                                width: '48px',
                                                                height: '48px',
                                                                border: '3px solid #dbeafe',
                                                                borderTopColor: '#3b82f6',
                                                                borderRadius: '50%',
                                                                margin: '0 auto 1rem',
                                                            }}
                                                        />
                                                        <p style={{ fontSize: '1rem', fontWeight: 600, color: '#1d4ed8', margin: 0 }}>
                                                            Processing your file...
                                                        </p>
                                                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.5rem 0 0' }}>
                                                            This may take a moment
                                                        </p>
                                                    </motion.div>
                                                ) : (
                                                    /* Default Upload State */
                                                    <motion.div
                                                        key="upload"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                    >
                                                        <FileUpload onChange={handleFileChange} onFilesChange={handleFilesChange} />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>

                                        {/* File Type Badge */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.25 }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem',
                                                marginTop: '1rem',
                                            }}
                                        >
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.375rem',
                                                padding: '0.375rem 0.75rem',
                                                background: '#f1f5f9',
                                                borderRadius: '8px',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: '#64748b',
                                            }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                </svg>
                                                Supported: {tool.accept.replace(/\./g, '').toUpperCase().split(',').join(', ')}
                                            </span>
                                        </motion.div>
                                    </div>

                                    {/* Close Button */}
                                    <motion.button
                                        onClick={() => setIsOpen(false)}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                                        whileHover={{ scale: 1.1, backgroundColor: '#f1f5f9' }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                            position: 'absolute',
                                            top: '1.25rem',
                                            right: '1.25rem',
                                            background: 'white',
                                            border: '1px solid #e2e8f0',
                                            cursor: 'pointer',
                                            padding: '0.5rem',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#64748b',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                        }}
                                    >
                                        <svg
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </motion.button>
                                </motion.div>
                            </div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Tutorial Modal Portal */}
            {createPortal(
                <AnimatePresence>
                    {showTutorial && tool.tutorial && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                onClick={handleSkipTutorial}
                                style={{
                                    position: 'fixed',
                                    inset: 0,
                                    background: 'rgba(0, 0, 0, 0.5)',
                                    backdropFilter: 'blur(8px)',
                                    zIndex: 9998,
                                }}
                            />

                            {/* Tutorial Modal */}
                            <div
                                style={{
                                    position: 'fixed',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 9999,
                                    pointerEvents: 'none',
                                }}
                            >
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.85, y: 40 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.85, y: 40 }}
                                    transition={{
                                        type: 'spring',
                                        damping: 28,
                                        stiffness: 400,
                                    }}
                                    style={{
                                        borderRadius: '24px',
                                        backgroundColor: 'white',
                                        padding: '32px',
                                        width: '90%',
                                        maxWidth: '480px',
                                        boxShadow: '0 25px 80px -15px rgba(0, 0, 0, 0.3)',
                                        pointerEvents: 'auto',
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {/* Progress Bar */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '4px',
                                        background: '#e5e7eb'
                                    }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${((currentStep + 1) / tool.tutorial.steps.length) * 100}%` }}
                                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                            style={{
                                                height: '100%',
                                                background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                                                borderRadius: '0 2px 2px 0',
                                            }}
                                        />
                                    </div>

                                    {/* Header with Icon */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1, duration: 0.4 }}
                                        style={{ textAlign: 'center', marginBottom: '24px', marginTop: '8px' }}
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', damping: 15, stiffness: 400, delay: 0.15 }}
                                            style={{
                                                width: '72px',
                                                height: '72px',
                                                borderRadius: '20px',
                                                background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                margin: '0 auto 16px',
                                                color: '#1d4ed8',
                                            }}
                                        >
                                            {tool.icon}
                                        </motion.div>
                                        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                                            {tool.tutorial.title}
                                        </h2>
                                        <p style={{ fontSize: '14px', color: '#6b7280' }}>
                                            Quick guide to get you started
                                        </p>
                                    </motion.div>

                                    {/* Step Content */}
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentStep}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.25 }}
                                            style={{
                                                background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                                                borderRadius: '16px',
                                                padding: '20px',
                                                marginBottom: '20px',
                                                minHeight: '100px',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: 'spring', damping: 12, stiffness: 400 }}
                                                    style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                                        color: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 700,
                                                        fontSize: '14px',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {currentStep + 1}
                                                </motion.div>
                                                <p style={{
                                                    fontSize: '15px',
                                                    color: '#374151',
                                                    lineHeight: 1.6,
                                                    margin: 0,
                                                    paddingTop: '4px',
                                                }}>
                                                    {tool.tutorial.steps[currentStep]}
                                                </p>
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>

                                    {/* Tip */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3, duration: 0.3 }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '12px 16px',
                                            background: '#fef3c7',
                                            borderRadius: '12px',
                                            marginBottom: '24px',
                                        }}
                                    >
                                        <span style={{ fontSize: '18px' }}>💡</span>
                                        <p style={{ fontSize: '13px', color: '#92400e', margin: 0, lineHeight: 1.5 }}>
                                            {tool.tutorial.tip}
                                        </p>
                                    </motion.div>

                                    {/* Step Indicators */}
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                                        {tool.tutorial.steps.map((_, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ scale: 0.8 }}
                                                animate={{
                                                    scale: idx === currentStep ? 1.2 : 1,
                                                    backgroundColor: idx === currentStep ? '#3b82f6' : idx < currentStep ? '#93c5fd' : '#e5e7eb'
                                                }}
                                                transition={{ type: 'spring', damping: 15, stiffness: 400 }}
                                                style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    cursor: 'pointer',
                                                }}
                                                onClick={() => setCurrentStep(idx)}
                                            />
                                        ))}
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        {currentStep > 0 && (
                                            <motion.button
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                onClick={handleTutorialPrev}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                style={{
                                                    flex: 1,
                                                    padding: '14px 20px',
                                                    borderRadius: '12px',
                                                    border: '2px solid #e5e7eb',
                                                    background: 'white',
                                                    color: '#374151',
                                                    fontWeight: 600,
                                                    fontSize: '14px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px',
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M19 12H5M12 19l-7-7 7-7" />
                                                </svg>
                                                Back
                                            </motion.button>
                                        )}

                                        {currentStep < tool.tutorial.steps.length - 1 ? (
                                            <motion.button
                                                onClick={handleTutorialNext}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                style={{
                                                    flex: 1,
                                                    padding: '14px 20px',
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                                    color: 'white',
                                                    fontWeight: 600,
                                                    fontSize: '14px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px',
                                                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                                                }}
                                            >
                                                Next
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                                </svg>
                                            </motion.button>
                                        ) : (
                                            <motion.button
                                                onClick={handleTutorialComplete}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                style={{
                                                    flex: 1,
                                                    padding: '14px 20px',
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                                    color: 'white',
                                                    fontWeight: 600,
                                                    fontSize: '14px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                                                }}
                                            >
                                                Open {tool.name}
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                                                </svg>
                                            </motion.button>
                                        )}
                                    </div>

                                    {/* Skip Button */}
                                    <motion.button
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        onClick={handleSkipTutorial}
                                        style={{
                                            width: '100%',
                                            marginTop: '12px',
                                            padding: '10px',
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#9ca3af',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Skip tutorial & open directly
                                    </motion.button>

                                    {/* Close Button */}
                                    <motion.button
                                        onClick={() => { setShowTutorial(false); setCurrentStep(0); }}
                                        initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                        exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                                        style={{
                                            position: 'absolute',
                                            top: '16px',
                                            right: '16px',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '8px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#9ca3af',
                                            transition: 'all 0.2s ease',
                                        }}
                                        whileHover={{ backgroundColor: '#f3f4f6', color: '#4b5563' }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </motion.button>
                                </motion.div>
                            </div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

const ResultModal: React.FC<{ result: AnalysisResult | null; onClose: () => void }> = ({ result, onClose }) => {
    if (!result) return null;

    const getTitle = () => {
        switch (result.type) {
            case 'count': return 'Text Analysis Results';
            case 'grammar': return 'Grammar Check Results';
            case 'compress': return 'Compression Results';
            default: return 'Results';
        }
    };

    return (
        createPortal(
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 10000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'white',
                            padding: '32px',
                            borderRadius: '24px',
                            width: '90%',
                            maxWidth: '550px',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        }}
                    >
                        <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px', color: '#111827' }}>
                            {getTitle()}
                        </h3>

                        {result.type === 'count' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#2563eb' }}>{result.data.words}</div>
                                    <div style={{ fontSize: '13px', color: '#6b7280' }}>Words</div>
                                </div>
                                <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#2563eb' }}>{result.data.chars}</div>
                                    <div style={{ fontSize: '13px', color: '#6b7280' }}>Characters</div>
                                </div>
                                {result.data.textStats && (
                                    <>
                                        <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '12px' }}>
                                            <div style={{ fontSize: '28px', fontWeight: 700, color: '#7c3aed' }}>{result.data.textStats.sentences}</div>
                                            <div style={{ fontSize: '13px', color: '#6b7280' }}>Sentences</div>
                                        </div>
                                        <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '12px' }}>
                                            <div style={{ fontSize: '28px', fontWeight: 700, color: '#7c3aed' }}>{result.data.textStats.paragraphs}</div>
                                            <div style={{ fontSize: '13px', color: '#6b7280' }}>Paragraphs</div>
                                        </div>
                                    </>
                                )}
                                <div style={{ background: '#dbeafe', padding: '16px', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 600, color: '#1e40af' }}>{result.data.readingTime}</div>
                                    <div style={{ fontSize: '13px', color: '#3b82f6' }}>Reading Time</div>
                                </div>
                                {result.data.textStats && (
                                    <div style={{ background: '#dbeafe', padding: '16px', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 600, color: '#1e40af' }}>{result.data.textStats.speakingTime}</div>
                                        <div style={{ fontSize: '13px', color: '#3b82f6' }}>Speaking Time</div>
                                    </div>
                                )}
                                {result.data.textStats && result.data.textStats.topWords.length > 0 && (
                                    <div style={{ gridColumn: 'span 2', background: '#f0fdf4', padding: '16px', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#166534', marginBottom: '8px' }}>Top Keywords</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {result.data.textStats.topWords.map((item, idx) => (
                                                <span key={idx} style={{
                                                    background: '#dcfce7',
                                                    padding: '4px 10px',
                                                    borderRadius: '16px',
                                                    fontSize: '13px',
                                                    color: '#15803d'
                                                }}>
                                                    {item.word} ({item.count})
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {result.type === 'compress' && (
                            <div style={{ display: 'grid', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f3f4f6', padding: '20px', borderRadius: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Original Size</div>
                                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#374151' }}>{result.data.originalSize}</div>
                                    </div>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Compressed Size</div>
                                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#059669' }}>{result.data.compressedSize}</div>
                                    </div>
                                </div>
                                <div style={{
                                    background: result.data.savingsPercent && result.data.savingsPercent > 0 ? '#ecfdf5' : '#fef3c7',
                                    padding: '20px',
                                    borderRadius: '12px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{
                                        fontSize: '48px',
                                        fontWeight: 700,
                                        color: result.data.savingsPercent && result.data.savingsPercent > 0 ? '#059669' : '#d97706'
                                    }}>
                                        {result.data.savingsPercent}%
                                    </div>
                                    <div style={{ fontSize: '14px', color: result.data.savingsPercent && result.data.savingsPercent > 0 ? '#047857' : '#b45309' }}>
                                        {result.data.savingsPercent && result.data.savingsPercent > 0
                                            ? `Saved ${result.data.savings}`
                                            : 'File is already optimized'}
                                    </div>
                                </div>
                                <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', margin: 0 }}>
                                    Your compressed file has been downloaded automatically.
                                </p>
                            </div>
                        )}

                        {result.type === 'grammar' && (
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {result.data.issues && result.data.issues.length > 0 ? (
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {result.data.issues.map((issue, idx) => (
                                            <li key={idx} style={{ padding: '12px', background: '#fef2f2', borderRadius: '8px', marginBottom: '8px', borderLeft: '4px solid #ef4444', color: '#991b1b' }}>
                                                {issue}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#059669', background: '#ecfdf5', borderRadius: '12px' }}>
                                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <p style={{ fontWeight: 600 }}>No issues found!</p>
                                        <p style={{ fontSize: '14px' }}>Your text looks great.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            style={{
                                marginTop: '24px',
                                width: '100%',
                                padding: '12px',
                                background: '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Close
                        </button>
                    </motion.div>
                </motion.div>
            </AnimatePresence>,
            document.body
        )
    );
};

// Premium Category Tabs Component with Sliding Indicator
interface CategoryTabsProps {
    categories: { id: string; name: string; icon: string }[];
    activeCategory: string;
    onCategoryChange: (id: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, activeCategory, onCategoryChange }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [tabDimensions, setTabDimensions] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
    const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    // Update indicator position when active category changes
    const updateIndicator = useCallback(() => {
        const activeTab = tabRefs.current.get(activeCategory);
        const container = containerRef.current;
        if (activeTab && container) {
            const containerRect = container.getBoundingClientRect();
            const tabRect = activeTab.getBoundingClientRect();
            setTabDimensions({
                left: tabRect.left - containerRect.left,
                width: tabRect.width,
            });
        }
    }, [activeCategory]);

    useEffect(() => {
        updateIndicator();
        // Also update on window resize
        window.addEventListener('resize', updateIndicator);
        return () => window.removeEventListener('resize', updateIndicator);
    }, [updateIndicator]);

    // Initial measurement after mount
    useEffect(() => {
        const timer = setTimeout(updateIndicator, 50);
        return () => clearTimeout(timer);
    }, [updateIndicator]);

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
            style={{
                position: 'relative',
                display: 'flex',
                gap: '0.25rem',
                marginBottom: '2rem',
                padding: '0.375rem',
                background: '#f1f5f9',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                width: 'fit-content',
            }}
            className="category-tabs-container"
        >
            {/* Sliding Background Indicator */}
            <motion.div
                style={{
                    position: 'absolute',
                    top: '0.375rem',
                    bottom: '0.375rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    borderRadius: '10px',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.35)',
                    zIndex: 0,
                }}
                initial={false}
                animate={{
                    left: tabDimensions.left,
                    width: tabDimensions.width,
                }}
                transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 35,
                    mass: 0.8,
                }}
            />

            {categories.map((category, idx) => (
                <motion.button
                    key={category.id}
                    ref={(el) => {
                        if (el) tabRefs.current.set(category.id, el);
                    }}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + idx * 0.05, type: 'spring', stiffness: 300 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onCategoryChange(category.id)}
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        padding: '0.625rem 1.25rem',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'transparent',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <motion.span
                        style={{ fontSize: '1rem', display: 'flex' }}
                        animate={{
                            scale: activeCategory === category.id ? 1.15 : 1,
                            filter: activeCategory === category.id ? 'brightness(1.2)' : 'brightness(1)',
                        }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                        {category.icon}
                    </motion.span>
                    <motion.span
                        animate={{
                            color: activeCategory === category.id ? '#ffffff' : '#64748b',
                            fontWeight: activeCategory === category.id ? 600 : 500,
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        {category.name}
                    </motion.span>
                </motion.button>
            ))}
        </motion.div>
    );
};

// Premium Skeleton Loading Component for Tools
const ToolsSkeleton: React.FC = () => (
    <div className="tools-content">
        {/* Hero Section Skeleton - Two Cards Layout */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                alignItems: 'stretch',
            }}
        >
            {/* Main Hero Card Skeleton */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '20px',
                    padding: '2rem 2.5rem',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Shimmer overlay */}
                <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                        pointerEvents: 'none',
                    }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {/* Icon skeleton */}
                    <motion.div
                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '20px',
                            background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                        }}
                    />
                    <div style={{ flex: 1 }}>
                        {/* Label skeleton */}
                        <motion.div
                            animate={{ opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
                            style={{ width: '100px', height: '14px', background: '#e2e8f0', borderRadius: '6px', marginBottom: '0.5rem' }}
                        />
                        {/* Title skeleton */}
                        <motion.div
                            animate={{ opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.15 }}
                            style={{ width: '180px', height: '28px', background: '#cbd5e1', borderRadius: '8px', marginBottom: '0.5rem' }}
                        />
                        {/* Description skeleton */}
                        <motion.div
                            animate={{ opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                            style={{ width: '280px', height: '16px', background: '#e2e8f0', borderRadius: '6px', marginBottom: '1rem' }}
                        />
                        {/* Feature pills skeleton */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{ opacity: [0.4, 0.7, 0.4] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.25 + i * 0.05 }}
                                    style={{
                                        width: '100px',
                                        height: '48px',
                                        background: '#f1f5f9',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '10px',
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Card Skeleton */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                style={{
                    width: '280px',
                    background: 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)',
                    borderRadius: '20px',
                    padding: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden',
                    flexShrink: 0,
                }}
            >
                {/* Shimmer overlay */}
                <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: 0.3 }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                        pointerEvents: 'none',
                    }}
                />
                {/* Header skeleton */}
                <motion.div
                    animate={{ opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ width: '80px', height: '14px', background: 'rgba(255,255,255,0.3)', borderRadius: '6px', marginBottom: '1rem' }}
                />
                {/* Stats grid skeleton */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    {[0, 1].map(i => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <motion.div
                                animate={{ opacity: [0.3, 0.5, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                style={{ width: '50px', height: '32px', background: 'rgba(255,255,255,0.3)', borderRadius: '8px', margin: '0 auto 0.25rem' }}
                            />
                            <motion.div
                                animate={{ opacity: [0.3, 0.5, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 + 0.05 }}
                                style={{ width: '40px', height: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', margin: '0 auto' }}
                            />
                        </div>
                    ))}
                </div>
                {/* Badge skeleton */}
                <motion.div
                    animate={{ opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                    style={{ width: '100%', height: '40px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px' }}
                />
            </motion.div>
        </motion.div>

        {/* Category Tabs Skeleton */}
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
                display: 'flex',
                gap: '0.25rem',
                marginBottom: '2rem',
                padding: '0.375rem',
                background: '#f1f5f9',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                width: 'fit-content',
            }}
        >
            {[0, 1, 2].map(i => (
                <motion.div
                    key={i}
                    animate={{ opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                    style={{
                        width: '120px',
                        height: '40px',
                        background: i === 0 ? 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)' : '#e2e8f0',
                        borderRadius: '10px',
                    }}
                />
            ))}
        </motion.div>

        {/* Tools Grid Skeleton */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.25rem',
            }}
        >
            {[...Array(7)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.05, type: 'spring', stiffness: 300 }}
                    style={{
                        height: '220px',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '20px',
                        padding: '1.5rem',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Shimmer overlay */}
                    <motion.div
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.1 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                            pointerEvents: 'none',
                        }}
                    />
                    {/* Icon skeleton */}
                    <motion.div
                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }}
                        style={{
                            width: '52px',
                            height: '52px',
                            background: '#e2e8f0',
                            borderRadius: '14px',
                            marginBottom: '1rem',
                        }}
                    />
                    {/* Title skeleton */}
                    <motion.div
                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 + 0.1 }}
                        style={{ width: '120px', height: '18px', background: '#e2e8f0', borderRadius: '6px', marginBottom: '0.5rem' }}
                    />
                    {/* Description skeleton */}
                    <motion.div
                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 + 0.15 }}
                        style={{ width: '100%', height: '14px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '0.375rem' }}
                    />
                    <motion.div
                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 + 0.2 }}
                        style={{ width: '80%', height: '14px', background: '#f1f5f9', borderRadius: '4px', marginBottom: 'auto' }}
                    />
                    {/* Badge skeleton */}
                    <motion.div
                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 + 0.25 }}
                        style={{
                            width: '80px',
                            height: '26px',
                            background: '#f0fdf4',
                            borderRadius: '8px',
                            position: 'absolute',
                            bottom: '1.5rem',
                            left: '1.5rem',
                        }}
                    />
                </motion.div>
            ))}
        </motion.div>
    </div>
);

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
                        console.log('Using iLovePDF for Image to PDF conversion', getApiStatus());
                        blob = await convertImagesToPdfILovePDF(imageFiles);
                    } catch (error) {
                        console.warn('iLovePDF failed, falling back to local conversion:', error);
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
                        console.log('Using iLovePDF for Merge PDFs', getApiStatus());
                        blob = await mergePdfsILovePDF(pdfFiles);
                    } catch (error) {
                        console.warn('iLovePDF failed, falling back to local merge:', error);
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
                if (text.match(/\s{2,}/)) issues.push("Multiple spaces detected");
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
                        console.log('Using Adobe PDF Services for PDF to Word', getAdobeApiStatus());
                        blob = await convertPdfToDocxAdobe(pdfFile);
                    } catch (error) {
                        console.warn('Adobe PDF Services failed, using local conversion:', error);
                        blob = await convertPdfToDocx(pdfFile);
                    }
                } else {
                    console.log('Using local conversion for PDF to Word');
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
                        console.log('Using iLovePDF for Word to PDF', getApiStatus());
                        blob = await convertDocxToPdfILovePDF(docFile);
                    } catch (error) {
                        console.warn('iLovePDF failed, using local conversion:', error);
                        const result = await convertDocxToPDF(docFile);
                        blob = result.blob;
                        if (result.warnings.length > 0) {
                            console.warn('Conversion warnings:', result.warnings);
                        }
                    }
                } else {
                    // Local conversion
                    const result = await convertDocxToPDF(docFile);
                    blob = result.blob;
                    if (result.warnings.length > 0) {
                        console.warn('Conversion warnings:', result.warnings);
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
                        savingsPercent: result.savingsPercent,
                    }
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
            console.error('Conversion failed:', error);
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
            ),
        },
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
            ),
        },
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
            ),
        },
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
            ),
        },
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
            ),
        },
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
            ),
        },
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
            ),
        },
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
            ),
        },
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
            ),
        },
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
            ),
        },
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
            ),
        },
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
                    alignItems: 'stretch',
                }}
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
                        delay: 0.1,
                    }}
                    whileHover={{
                        borderColor: '#93c5fd',
                        boxShadow: '0 20px 40px rgba(59, 130, 246, 0.1)',
                    }}
                    style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '20px',
                        padding: '2rem 2.5rem',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
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
                        pointerEvents: 'none',
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '-30px',
                        right: '100px',
                        width: '120px',
                        height: '120px',
                        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.06) 0%, transparent 70%)',
                        borderRadius: '50%',
                        pointerEvents: 'none',
                    }} />

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
                                flexShrink: 0,
                            }}
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
                                    marginBottom: '0.25rem',
                                }}
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
                                    lineHeight: 1.1,
                                }}
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
                                    marginTop: '0.5rem',
                                }}
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
                                    flexWrap: 'wrap',
                                }}
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
                                            cursor: 'default',
                                        }}
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
                        delay: 0.2,
                    }}
                    whileHover={{
                        scale: 1.02,
                        boxShadow: '0 25px 50px rgba(30, 64, 175, 0.3)',
                    }}
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
                        flexShrink: 0,
                    }}
                >
                    {/* Decorative circles */}
                    <div style={{
                        position: 'absolute',
                        top: '-20px',
                        right: '-20px',
                        width: '100px',
                        height: '100px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '50%',
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '-30px',
                        left: '-30px',
                        width: '80px',
                        height: '80px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '50%',
                    }} />

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
                            backdropFilter: 'blur(10px)',
                        }}
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
                                background: '#22c55e',
                            }}
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
                                delay: idx * 0.04,
                            }}
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
                    gap: '0.75rem',
                }}
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
