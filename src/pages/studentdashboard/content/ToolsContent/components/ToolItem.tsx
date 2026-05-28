/**
 * ToolItem + SuccessConfetti
 * Individual tool card with file processing.
 * Extracted from ToolsContent.tsx during Phase 8.7
 */
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Clock3, Sparkles } from 'lucide-react';
import { FileUpload } from '../../../../../components/ui/file-upload';
import type { Tool } from '../types';

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
    isRecent?: boolean;
    onToolOpen?: (toolId: string) => void;
}> = ({ tool, onProcessFiles, isProcessing, isSuccess, onSuccessClose, isRecent = false, onToolOpen }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasFiles, setHasFiles] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const fileModalCloseRef = useRef<HTMLButtonElement>(null);
    const tutorialCloseRef = useRef<HTMLButtonElement>(null);
    const fileModalTitleId = React.useId();
    const fileModalDescriptionId = React.useId();
    const tutorialTitleId = React.useId();
    const tutorialDescriptionId = React.useId();

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

    useEffect(() => {
        if (!isOpen) return;
        const timer = window.setTimeout(() => fileModalCloseRef.current?.focus(), 0);
        return () => window.clearTimeout(timer);
    }, [isOpen]);

    useEffect(() => {
        if (!showTutorial) return;
        const timer = window.setTimeout(() => tutorialCloseRef.current?.focus(), 0);
        return () => window.clearTimeout(timer);
    }, [showTutorial]);

    // Reset hasFiles when modal closes
    useEffect(() => {
        if (!isOpen) {
            setHasFiles(false);
        }
    }, [isOpen]);

    const handleFileChange = (files: File[]) => {
        if (files.length > 0) {
            onToolOpen?.(tool.id);
            onProcessFiles(files, tool.name);
        }
    };

    const handleFilesChange = (filesExist: boolean) => {
        setHasFiles(filesExist);
    };

    const handleCardClick = () => {
        onToolOpen?.(tool.id);
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
    const accentStyles: Record<NonNullable<Tool['accent']>, {
        glow: string;
        iconIdle: string;
        iconActive: string;
        action: string;
        shadow: string;
    }> = {
        blue: {
            glow: 'bg-blue-500/15 dark:bg-blue-500/20',
            iconIdle: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50',
            iconActive: 'bg-blue-600 text-white border-blue-600',
            action: 'text-blue-600 dark:text-blue-400',
            shadow: 'rgba(59, 130, 246, 0.18)',
        },
        emerald: {
            glow: 'bg-emerald-500/15 dark:bg-emerald-500/20',
            iconIdle: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50',
            iconActive: 'bg-emerald-600 text-white border-emerald-600',
            action: 'text-emerald-600 dark:text-emerald-400',
            shadow: 'rgba(16, 185, 129, 0.18)',
        },
        violet: {
            glow: 'bg-violet-500/15 dark:bg-violet-500/20',
            iconIdle: 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800/50',
            iconActive: 'bg-violet-600 text-white border-violet-600',
            action: 'text-violet-600 dark:text-violet-400',
            shadow: 'rgba(124, 58, 237, 0.18)',
        },
        amber: {
            glow: 'bg-amber-500/15 dark:bg-amber-500/20',
            iconIdle: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50',
            iconActive: 'bg-amber-500 text-white border-amber-500',
            action: 'text-amber-600 dark:text-amber-400',
            shadow: 'rgba(245, 158, 11, 0.18)',
        },
        rose: {
            glow: 'bg-rose-500/15 dark:bg-rose-500/20',
            iconIdle: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50',
            iconActive: 'bg-rose-600 text-white border-rose-600',
            action: 'text-rose-600 dark:text-rose-400',
            shadow: 'rgba(225, 29, 72, 0.18)',
        },
        cyan: {
            glow: 'bg-cyan-500/15 dark:bg-cyan-500/20',
            iconIdle: 'bg-cyan-50 text-cyan-600 border-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800/50',
            iconActive: 'bg-cyan-600 text-white border-cyan-600',
            action: 'text-cyan-600 dark:text-cyan-400',
            shadow: 'rgba(6, 182, 212, 0.18)',
        },
    };
    const accent = accentStyles[tool.accent || (tool.category === 'convert' ? 'emerald' : 'blue')];
    const categoryLabel = tool.category === 'convert' ? 'Converter' : 'Text Tool';
    const badges = tool.badges?.length ? tool.badges : [tool.category === 'convert' ? 'Local file flow' : 'Academic writing'];
    const visibleBadges = badges.slice(0, 3);
    const hiddenBadgeCount = Math.max(0, badges.length - visibleBadges.length);
    const metaBadgeClass = 'inline-flex h-6 items-center gap-1 rounded-full border px-2.5 text-[10px] font-semibold uppercase leading-none tracking-normal shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
    const featureBadgeClass = 'inline-flex h-8 items-center rounded-full border border-zinc-200/80 bg-zinc-50/80 px-3 text-[12px] font-medium leading-none tracking-normal text-zinc-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors group-hover:border-zinc-300 group-hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300 dark:group-hover:border-zinc-700 dark:group-hover:bg-zinc-900';
    const cardActionLabel = `${tool.name}. ${tool.description}. ${tool.onClick ? 'Open workspace' : 'Choose file'}.`;

    return (
        <>
            {/* Responsive academic workbench card */}
            <motion.button
                type="button"
                className="group relative flex h-full w-full flex-col items-start overflow-hidden rounded-[26px] border border-zinc-200/80 bg-white p-8 text-left shadow-sm transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-zinc-800/80 dark:bg-zinc-900 dark:focus-visible:ring-offset-zinc-950 sm:p-9"
                onClick={handleCardClick}
                aria-label={cardActionLabel}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                initial={{ opacity: 0, y: 15 }}
                animate={{
                    opacity: 1,
                    y: isHovered ? -2 : 0,
                    boxShadow: isHovered
                        ? `0 18px 36px -16px ${accent.shadow}, 0 0 0 1px ${accent.shadow}`
                        : '0 4px 10px rgba(0, 0, 0, 0.03), 0 0 0 1px transparent',
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
                {/* Background Ambient Glow */}
                <motion.div
                    className={`absolute -right-20 -top-20 h-48 w-48 rounded-full blur-3xl pointer-events-none ${accent.glow}`}
                    animate={{ scale: isHovered ? 1.35 : 0.95, opacity: isHovered ? 1 : 0.35 }}
                    transition={{ duration: 0.4 }}
                    aria-hidden="true"
                />

                <div className="relative z-10 flex w-full flex-1 flex-col">
                    <div className="flex w-full items-start justify-between gap-4">
                        <motion.div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border transition-colors duration-300 ${isHovered ? accent.iconActive : accent.iconIdle}`}
                            animate={{ scale: isHovered ? 1.06 : 1, rotate: isHovered ? 4 : 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            aria-hidden="true"
                        >
                            <div className="scale-110">
                                {tool.icon}
                            </div>
                        </motion.div>

                        <div className="flex max-w-[240px] flex-wrap justify-end gap-1.5">
                            {tool.recommended && (
                                <span className={`${metaBadgeClass} border-amber-200/80 bg-amber-50/80 text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300`}>
                                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                                    Rec.
                                </span>
                            )}
                            {isRecent && (
                                <span className={`${metaBadgeClass} border-zinc-200 bg-white/90 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300`}>
                                    <Clock3 className="h-3 w-3" aria-hidden="true" />
                                    Recent
                                </span>
                            )}
                            <span className={`${metaBadgeClass} border-zinc-200 bg-zinc-50/90 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-300`}>
                                {categoryLabel}
                            </span>
                        </div>
                    </div>

                    <div className="mt-5 flex min-w-0 flex-col justify-center">
                        <motion.h3
                            className="max-w-full whitespace-normal text-[16px] font-bold leading-tight tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-[17px]"
                            transition={{ duration: 0.2 }}
                        >
                            {tool.name}
                        </motion.h3>
                    </div>

                    {/* Middle Section: Content */}
                    <div className="mt-7 min-h-[72px] w-full text-left">
                        <p className="text-[13px] leading-7 text-zinc-600 dark:text-zinc-400 sm:text-[14px]">
                        {tool.description}
                    </p>
                </div>

                    <div className="mt-6 flex min-h-[40px] flex-wrap gap-2.5">
                        {visibleBadges.map((badge) => (
                            <span
                                key={badge}
                                className={featureBadgeClass}
                            >
                                {badge}
                            </span>
                        ))}
                        {hiddenBadgeCount > 0 && (
                            <span className={featureBadgeClass}>
                                +{hiddenBadgeCount}
                            </span>
                        )}
                    </div>

                    <div className={`mt-auto flex w-full items-center justify-between pt-6 text-sm font-bold ${accent.action}`}>
                        <span>{tool.onClick ? 'Open workspace' : 'Choose file'}</span>
                        <motion.span animate={{ x: isHovered ? 3 : 0 }} transition={{ type: 'spring', stiffness: 450, damping: 20 }} aria-hidden="true">
                            <ArrowRight className="h-4 w-4" />
                        </motion.span>
                    </div>
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
                                className="fixed inset-0 bg-zinc-900/60 dark:bg-black/60 backdrop-blur-md z-[9998]"
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
                                    className="relative w-[90%] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-2xl overflow-hidden pointer-events-auto"
                                    role="dialog"
                                    aria-modal="true"
                                    aria-labelledby={fileModalTitleId}
                                    aria-describedby={fileModalDescriptionId}
                                    style={{
                                        maxWidth: hasFiles ? '560px' : '520px',
                                    }}
                                >
                                    {/* Ambient Glow */}
                                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

                                    {/* Modal Content */}
                                    <div className="p-8">
                                        {/* Header with Icon */}
                                        <motion.div
                                            className="flex items-start gap-4 mb-6 relative z-10"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                                        >
                                            {/* Tool Icon */}
                                            <motion.div
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 15 }}
                                                className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 shrink-0"
                                            >
                                                <div className="scale-125">
                                                    {tool.icon}
                                                </div>
                                            </motion.div>

                                            {/* Title and Description */}
                                            <div className="flex-1 pt-0.5">
                                                <motion.h2
                                                    id={fileModalTitleId}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.15 }}
                                                    className="text-[22px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight"
                                                >
                                                    {tool.name}
                                                </motion.h2>
                                                <motion.p
                                                    id={fileModalDescriptionId}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.2 }}
                                                    className="mt-1.5 text-[14px] text-zinc-500 dark:text-zinc-400 leading-relaxed"
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
                                                        <FileUpload onChange={(files) => {
                                                            handleFileChange(files);
                                                            handleFilesChange(files.length > 0);
                                                        }} />
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
                                        ref={fileModalCloseRef}
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="absolute top-5 right-5 p-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-sm z-20 flex items-center justify-center transition-colors"
                                        aria-label={`Close ${tool.name} dialog`}
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
                                    role="dialog"
                                    aria-modal="true"
                                    aria-labelledby={tutorialTitleId}
                                    aria-describedby={tutorialDescriptionId}
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
                                        <h2 id={tutorialTitleId} style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                                            {tool.tutorial.title}
                                        </h2>
                                        <p id={tutorialDescriptionId} style={{ fontSize: '14px', color: '#6b7280' }}>
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
                                            <motion.button
                                                type="button"
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
                                                    border: 0,
                                                    padding: 0,
                                                }}
                                                onClick={() => setCurrentStep(idx)}
                                                aria-label={`Go to tutorial step ${idx + 1}`}
                                                aria-current={idx === currentStep ? 'step' : undefined}
                                            />
                                        ))}
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        {currentStep > 0 && (
                                            <motion.button
                                                type="button"
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
                                                type="button"
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
                                                type="button"
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
                                        type="button"
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
                                        ref={tutorialCloseRef}
                                        type="button"
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
                                        aria-label={`Close ${tool.name} tutorial`}
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
