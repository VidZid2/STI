/**
 * ToolItem + SuccessConfetti
 * Individual tool card with file processing.
 * Extracted from ToolsContent.tsx during Phase 8.7
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

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


export { ToolItem, SuccessConfetti };
