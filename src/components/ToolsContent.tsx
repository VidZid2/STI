import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { convertImageToPDF, mergePDFs } from '../lib/pdfUtils';
import { FileUpload } from './ui/file-upload';
import { convertDocxToPDF } from '../lib/converters/docxToPdf';
import { convertPdfToDocx } from '../lib/converters/pdfToDocx';
import { compressPDF, formatFileSize } from '../lib/converters/compressPdf';
import { analyzeText, type TextStats } from '../lib/converters/textAnalysis';
import { 
    convertPdfToDocxCloud, 
    convertDocxToPdfCloud,
    isCloudConvertConfigured 
} from '../lib/converters/cloudConvertService';

interface Tool {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: React.ReactNode;
    accept: string;
    multiple: boolean;
    linkTo?: string;
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

const ToolItem: React.FC<{ 
    tool: Tool; 
    onProcessFiles: (files: FileList | File[], toolName: string) => void; 
    isProcessing: boolean;
}> = ({ tool, onProcessFiles, isProcessing }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasFiles, setHasFiles] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

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

    return (
        <>
            {/* Card Trigger */}
            <motion.button
                className="tool-card-trigger"
                onClick={handleCardClick}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                style={{
                    width: '100%',
                    borderRadius: '16px',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    textAlign: 'left',
                }}
            >
                <div
                    className="tool-card"
                    style={{
                        position: 'relative',
                        padding: '24px',
                        background: 'white',
                        borderRadius: '16px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <div
                        className="tool-icon"
                        style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px',
                            color: '#1d4ed8',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        {tool.icon}
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>{tool.name}</h3>
                    <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5, margin: 0 }}>{tool.description}</p>

                    <div style={{ position: 'absolute', top: '24px', right: '24px', opacity: 0, transition: 'opacity 0.3s ease' }} className="tool-arrow">
                        <svg style={{ width: '20px', height: '20px', color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </div>
                </div>
            </motion.button>

            {/* Modal Portal */}
            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => setIsOpen(false)}
                                style={{
                                    position: 'fixed',
                                    inset: 0,
                                    background: 'rgba(0, 0, 0, 0.4)',
                                    backdropFilter: 'blur(4px)',
                                    zIndex: 9998,
                                }}
                            />

                            {/* Modal Container - for centering */}
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
                                    layout
                                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                    transition={{
                                        type: 'spring',
                                        damping: 25,
                                        stiffness: 350,
                                        layout: {
                                            type: 'spring',
                                            damping: 25,
                                            stiffness: 300,
                                        }
                                    }}
                                    style={{
                                        borderRadius: '24px',
                                        backgroundColor: 'white',
                                        padding: '32px',
                                        width: '90%',
                                        maxWidth: hasFiles ? '550px' : '500px',
                                        boxShadow: '0 25px 80px -15px rgba(0, 0, 0, 0.25)',
                                        pointerEvents: 'auto',
                                        position: 'relative',
                                    }}
                                >
                                    {/* Header */}
                                    <motion.div
                                        style={{ marginBottom: '24px' }}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1, duration: 0.3 }}
                                    >
                                        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>{tool.name}</h2>
                                        <p style={{ fontSize: '16px', color: '#6b7280' }}>{tool.description}</p>
                                    </motion.div>

                                    {/* Upload Area */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15, duration: 0.3 }}
                                    >
                                        {isProcessing ? (
                                            <div style={{
                                                border: '2px dashed #e5e7eb',
                                                borderRadius: '16px',
                                                padding: '40px 20px',
                                                textAlign: 'center',
                                                backgroundColor: '#f9fafb',
                                            }}>
                                                <p style={{ fontSize: '16px', fontWeight: 600, color: '#374151' }}>
                                                    Processing...
                                                </p>
                                            </div>
                                        ) : (
                                            <FileUpload onChange={handleFileChange} onFilesChange={handleFilesChange} />
                                        )}
                                        <p style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', marginTop: '8px' }}>
                                            {tool.accept.replace(/\./g, ' ').toUpperCase()}
                                        </p>
                                    </motion.div>

                                    {/* Close Button */}
                                    <motion.button
                                        onClick={() => setIsOpen(false)}
                                        initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                        exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 300,
                                            damping: 20,
                                            delay: 0.1
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: '20px',
                                            right: '20px',
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
                                        whileHover={{
                                            backgroundColor: '#f3f4f6',
                                            color: '#4b5563'
                                        }}
                                    >
                                        <svg
                                            width="20"
                                            height="20"
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

// Skeleton Loading Component for Tools
const ToolsSkeleton: React.FC = () => (
    <div className="tools-content">
        {/* Header Skeleton */}
        <motion.div className="tools-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-3">
                <motion.div className="w-10 h-10 bg-zinc-200 rounded-xl" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                <div className="space-y-2">
                    <motion.div className="h-6 w-32 bg-zinc-200 rounded" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    <motion.div className="h-3 w-48 bg-zinc-100 rounded" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }} />
                </div>
            </div>
        </motion.div>
        {/* Category Tabs Skeleton */}
        <motion.div className="flex gap-2 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            {[0, 1, 2, 3, 4].map(i => (
                <motion.div key={i} className="h-9 w-24 bg-zinc-100 rounded-xl" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }} />
            ))}
        </motion.div>
        {/* Tools Grid Skeleton */}
        <motion.div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            {[...Array(8)].map((_, i) => (
                <motion.div key={i} className="bg-zinc-100 rounded-2xl p-5 space-y-4" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }}>
                    <motion.div className="w-12 h-12 bg-zinc-200 rounded-xl" />
                    <motion.div className="h-4 w-24 bg-zinc-200 rounded" />
                    <motion.div className="h-3 w-full bg-zinc-200 rounded" />
                    <motion.div className="h-3 w-3/4 bg-zinc-200 rounded" />
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

    // Initial loading state
    useEffect(() => {
        const timer = setTimeout(() => setIsToolsLoading(false), 600);
        return () => clearTimeout(timer);
    }, []);

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
                blob = await convertImageToPDF(imageFiles);
                fileName = 'images-converted.pdf';
            } else if (toolName === 'Merge PDFs') {
                // Filter only PDF files
                const pdfFiles = fileArray.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
                if (pdfFiles.length < 2) {
                    alert('Please select at least 2 PDF files to merge.');
                    setConvertingFile(null);
                    return;
                }
                blob = await mergePDFs(pdfFiles);
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
                // Convert PDF to DOCX - use CloudConvert if configured, else local
                const pdfFile = fileArray[0];
                if (!pdfFile.type.includes('pdf') && !pdfFile.name.toLowerCase().endsWith('.pdf')) {
                    alert('Please select a valid PDF file.');
                    setConvertingFile(null);
                    return;
                }
                
                if (isCloudConvertConfigured()) {
                    // Use CloudConvert for accurate conversion
                    blob = await convertPdfToDocxCloud(pdfFile);
                } else {
                    // Fallback to local conversion (less accurate)
                    blob = await convertPdfToDocx(pdfFile);
                }
                fileName = pdfFile.name.replace(/\.pdf$/i, '') + '.docx';
            } else if (toolName === 'Convert to PDF' || toolName === 'Word to PDF') {
                // Convert DOCX to PDF - use CloudConvert if configured, else local
                const docFile = fileArray[0];
                const validExtensions = ['.doc', '.docx'];
                const hasValidExt = validExtensions.some(ext => docFile.name.toLowerCase().endsWith(ext));
                if (!hasValidExt) {
                    alert('Please select a valid Word document (.doc or .docx).');
                    setConvertingFile(null);
                    return;
                }
                
                if (isCloudConvertConfigured()) {
                    // Use CloudConvert for accurate conversion
                    blob = await convertDocxToPdfCloud(docFile);
                } else {
                    // Fallback to local conversion
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
            description: 'Check text for common grammar issues (works offline)',
            category: 'text',
            accept: '.txt,.md',
            multiple: false,
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
    ];

    const allTools = [...tools, ...newTools];

    const filteredTools = activeCategory === 'all' ? allTools : allTools.filter((tool) => tool.category === activeCategory);

    // Show skeleton while loading
    if (isToolsLoading) {
        return <ToolsSkeleton />;
    }

    return (
        <div className="tools-content">
            <section className="welcome-banner" style={{ marginBottom: '2rem' }}>
                <div className="welcome-content">
                    <div className="welcome-greeting">
                        <h1>
                            Student <span className="highlight-text">Tools</span>
                        </h1>
                        <p>PDF conversion utilities to help you with your documents</p>
                    </div>
                    <div className="welcome-stats">
                        <div className="stat-item">
                            <div className="stat-value">{allTools.length}</div>
                            <div className="stat-label">Tools</div>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <div className="stat-value">Free</div>
                            <div className="stat-label">To Use</div>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <div className="stat-value">24/7</div>
                            <div className="stat-label">Available</div>
                        </div>
                    </div>
                </div>
            </section>

            <AnimatePresence>
                {conversionSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className="fixed top-24 left-1/2 px-6 py-3 bg-green-500 text-white text-sm font-medium rounded-xl shadow-lg flex items-center gap-2 z-50"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {conversionSuccess} completed successfully!
                    </motion.div>
                )}
            </AnimatePresence>

            <ResultModal result={analysisResult} onClose={() => setAnalysisResult(null)} />

            <div style={{ display: 'flex', gap: '12px', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {categories.map((category) => (
                    <motion.button
                        key={category.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveCategory(category.id)}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: activeCategory === category.id ? '2px solid #1d4ed8' : '2px solid #e5e7eb',
                            background: activeCategory === category.id ? 'linear-gradient(135deg, #1d4ed8, #3b82f6)' : 'white',
                            color: activeCategory === category.id ? 'white' : '#374151',
                            fontWeight: 500,
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            boxShadow: activeCategory === category.id ? '0 4px 12px rgba(29, 78, 216, 0.3)' : 'none',
                        }}
                    >
                        <span>{category.icon}</span>
                        {category.name}
                    </motion.button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {filteredTools.map((tool) => (
                    <ToolItem
                        key={tool.id}
                        tool={tool}
                        onProcessFiles={processFiles}
                        isProcessing={convertingFile === tool.name}
                    />
                ))}
            </div>

            <div style={{ marginTop: '3rem', padding: '20px', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderRadius: '12px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>💡 All tools are free to use • Select a file to convert</p>
            </div>

            <style>{`
                .tool-card-trigger {
                    transition: all 0.3s ease, transform 0.2s ease !important;
                }
                .tool-card-trigger:hover {
                    border-color: #3b82f6 !important;
                    box-shadow: 0 8px 30px rgba(59, 130, 246, 0.15) !important;
                }
                .tool-card-trigger:hover .tool-arrow { 
                    opacity: 1 !important; 
                }
                .tool-card-trigger:hover .tool-icon { 
                    background: linear-gradient(135deg, #dbeafe, #bfdbfe) !important; 
                }
            `}</style>
        </div>
    );
};

export default ToolsContent;
