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
        
        const hasShown = localStorage.getItem(tutorialKey) === 'true';
        if (!hasShown) {
            setShowTutorial(true);
            setCurrentStep(0);
            return;
        }
        
        // If tool has custom onClick handler (e.g. Grammar Checker), use it
        if (tool.onClick) {
            tool.onClick();
            return;
        }
        if (tool.linkTo) {
            window.open(tool.linkTo, '_blank', 'noopener,noreferrer');
        } else {
            setIsOpen(true);
        }
    };

    const resolvedTutorial = tool.tutorial ?? {
        title: `How to use ${tool.name}`,
        steps: [
            `Start by opening ${tool.name} from the Tools grid.`,
            `Paste/upload your content (or choose your files if this is a converter).`,
            `Review the output, then copy/download it when it looks correct.`,
        ],
        tip: 'Tip: Keep your draft as original as possible, then iterate with the AI output for best academic results.',
    };

    const handleTutorialNext = () => {
        if (currentStep < resolvedTutorial.steps.length - 1) {
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
        if (tool.onClick) {
            tool.onClick();
            return;
        }
        if (tool.linkTo) {
            window.open(tool.linkTo, '_blank', 'noopener,noreferrer');
        } else {
            setIsOpen(true);
        }
    };

    const handleSkipTutorial = () => {
        localStorage.setItem(tutorialKey, 'true');
        setShowTutorial(false);
        setCurrentStep(0);
        if (tool.onClick) {
            tool.onClick();
            return;
        }
        if (tool.linkTo) {
            window.open(tool.linkTo, '_blank', 'noopener,noreferrer');
        } else {
            setIsOpen(true);
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
    const statusBadgeClass = 'inline-flex h-[24px] items-center gap-1.5 rounded-full border px-2.5 text-[10.5px] font-extrabold uppercase leading-none tracking-wide shadow-sm';
    const staticTagClass = 'inline-flex h-[24px] items-center gap-1.5 rounded-md px-2 text-[10.5px] font-bold uppercase leading-none tracking-wide';
    const cardActionLabel = `${tool.name}. ${tool.description}. ${tool.onClick ? 'Open workspace' : 'Choose file'}.`;

    return (
        <>
            {/* Responsive academic workbench card */}
            <motion.button
                type="button"
                className="group relative flex h-full min-h-[280px] w-full flex-col items-start overflow-hidden rounded-[20px] border border-zinc-200/70 bg-white p-5 text-left shadow-sm transition-[border-color] duration-300 ease-out hover:border-blue-200/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-zinc-800/70 dark:bg-zinc-900 dark:hover:border-blue-800/50 dark:focus-visible:ring-offset-zinc-950 sm:min-h-[300px] sm:p-6 lg:p-7"
                onClick={handleCardClick}
                aria-label={cardActionLabel}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                    opacity: 1,
                    y: isHovered ? -2 : 0,
                    scale: isHovered ? 1.005 : 1,
                    boxShadow: isHovered
                        ? `0 20px 40px -12px ${accent.shadow}, 0 8px 16px -8px ${accent.shadow}, 0 0 0 1px ${accent.shadow}`
                        : '0 8px 24px rgba(2, 6, 23, 0.04), 0 2px 8px rgba(2, 6, 23, 0.02), 0 0 0 1px transparent',
                }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
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
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 sm:h-12 sm:w-12 ${isHovered ? accent.iconActive : accent.iconIdle}`}
                            animate={{ scale: isHovered ? 1.06 : 1, rotate: isHovered ? 4 : 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            aria-hidden="true"
                        >
                            <div className="scale-110">
                                {tool.icon}
                            </div>
                        </motion.div>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                            {tool.recommended && (
                                <span className={`${statusBadgeClass} max-w-[120px] border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800/60 dark:bg-orange-900/30 dark:text-orange-400`}>
                                    <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                    <span className="truncate" title="Rec.">Rec.</span>
                                </span>
                            )}
                            {isRecent && (
                                <span className={`${staticTagClass} max-w-[120px] bg-slate-100/80 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300`}>
                                    <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                    <span className="truncate" title="Recent">Recent</span>
                                </span>
                            )}
                            <span className={`${staticTagClass} max-w-[120px] bg-slate-100/80 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300`}>
                                {tool.category === 'convert' ? (
                                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                ) : (
                                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                )}
                                <span className="truncate" title={categoryLabel}>{categoryLabel}</span>
                            </span>
                            <div className="relative group/tip">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowTutorial(true);
                                        setCurrentStep(0);
                                    }}
                                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-gradient-to-b from-blue-50 to-blue-100/50 text-blue-700 shadow-sm transition-all duration-200 hover:from-blue-100 hover:to-blue-200 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-blue-800/60 dark:from-blue-900/30 dark:to-blue-900/10 dark:text-blue-400 dark:hover:from-blue-800/50 dark:hover:to-blue-900/40"
                                    aria-label={`View ${tool.name} tutorial`}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                        <path d="M12 17h.01" />
                                    </svg>
                                </button>
                                {/* Tooltip */}
                                <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 opacity-0 shadow-md transition-all duration-200 ease-out translate-y-1 group-hover/tip:opacity-100 group-hover/tip:translate-y-0 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 z-20">
                                    Tutorial
                                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 border-l border-t border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" />
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="mt-6 flex min-w-0 flex-col justify-center">
                        <motion.h3
                            className="max-w-full whitespace-normal text-base font-bold leading-snug tracking-tighter text-zinc-900 dark:text-zinc-100 sm:text-lg"
                            transition={{ duration: 0.2 }}
                        >
                            {tool.name}
                        </motion.h3>
                    </div>

                    {/* Description */}
                    <div className="mt-3 w-full text-left">
                        <p className="text-[13.5px] leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-sm">
                            {tool.description}
                        </p>
                    </div>

                    {/* Bottom aligned content wrapper */}
                    <div className="mt-auto flex w-full flex-col pt-4">
                        {/* Best For */}
                        {tool.bestFor && (
                            <div className="mb-4 w-full rounded-[16px] bg-zinc-50/80 px-4 py-3.5 transition-colors duration-300 dark:bg-zinc-800/40">
                                <span className={`mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] ${accent.action}`}>
                                    Best for
                                </span>
                                <span className="block text-[13px] font-medium leading-snug text-zinc-700 dark:text-zinc-300">
                                    {tool.bestFor}
                                </span>
                            </div>
                        )}

                        {/* Action footer */}
                        <div className={`flex w-full items-center justify-start gap-1.5 border-t border-zinc-200 pt-4 text-[13.5px] font-bold transition-colors duration-300 dark:border-zinc-700/60 ${accent.action}`}>
                            <span className="transition-opacity duration-200 group-hover:opacity-100 opacity-85">{tool.onClick ? 'Open workspace' : 'Choose file'}</span>
                            <motion.span animate={{ x: isHovered ? 4 : 0 }} transition={{ type: 'tween', ease: [0.25, 0.46, 0.45, 0.94], duration: 0.25 }} aria-hidden="true">
                                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                            </motion.span>
                        </div>
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
                                                    className="relative overflow-hidden rounded-4xl border border-emerald-400/60 px-8 py-14 text-center bg-gradient-to-b from-emerald-50/80 to-emerald-100/50"
                                                    style={{
                                                        borderWidth: 2,
                                                    }}
                                                >
                                                        {/* Success Icon */}
                                                        <motion.div
                                                            initial={{ scale: 0, rotate: -180 }}
                                                            animate={{ scale: 1, rotate: 0 }}
                                                            transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 15 }}
                                                            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-[0_8px_24px_rgba(16,185,129,0.35)]"
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
                                                                className="m-0 text-lg font-bold text-emerald-800"
                                                            >
                                                                Conversion Successful!
                                                            </motion.p>
                                                            <motion.p
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: 0.25 }}
                                                                className="mt-2 m-0 text-sm font-semibold text-emerald-700"
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
                                                                        // Keep the same “sparkle” behavior but align palette with the tool system (emerald/blue/amber)
                                                                        background: i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#2563eb' : '#f59e0b',
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
                                                        className="rounded-4xl border-2 border-dashed border-blue-300 bg-gradient-to-b from-blue-50 to-blue-100 px-8 py-14 text-center"
                                                    >
                                                        {/* Processing Spinner */}
                                                        <motion.div
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                            style={{
                                                                width: '48px',
                                                                height: '48px',
                                                                border: '3px solid #dbeafe',
                                                                borderTopColor: '#2563eb',
                                                                borderRadius: '50%',
                                                                margin: '0 auto 1rem',
                                                            }}
                                                        />
                                                        <p className="m-0 text-base font-semibold text-blue-700 dark:text-blue-300">
                                                            Processing your file...
                                                        </p>
                                                        <p className="m-0 mt-2 text-xs font-medium text-zinc-500">
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
                                            className="mt-4 flex items-center justify-center gap-2"
                                        >
                                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-2 text-[12px] font-semibold text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300">
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
                                    className="absolute right-5 top-5 z-20 flex items-center justify-center rounded-xl border border-zinc-200 bg-white p-2 text-zinc-500 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
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
                    {showTutorial && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                onClick={handleSkipTutorial}
                                className="fixed inset-0 bg-zinc-900/60 dark:bg-black/60 backdrop-blur-md"
                                style={{ zIndex: 9998 }}
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
                                            className="relative overflow-hidden pointer-events-auto w-[90%] max-w-[480px] rounded-[24px] bg-white shadow-2xl border border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-800/80"
                                            role="dialog"
                                            aria-modal="true"
                                                        aria-labelledby={tutorialTitleId}
                                                        aria-describedby={tutorialDescriptionId}
                                        >
                                            {/* Ambient Glow */}
                                            <div className="pointer-events-none absolute -top-28 -right-28 h-64 w-64 rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-3xl" />

                                            {/* Progress Bar */}
                                            <div className="absolute left-0 right-0 top-0 h-1.5 bg-zinc-200/80 dark:bg-zinc-700/70 shadow-[0_1px_2px_rgba(0,0,0,0.05)] z-30">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${((currentStep + 1) / resolvedTutorial.steps.length) * 100}%` }}
                                                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                                    className="h-full rounded-r-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                                                />
                                            </div>

                                            {/* Close Button */}
                                            <motion.button
                                                ref={tutorialCloseRef}
                                                type="button"
                                                onClick={() => { setShowTutorial(false); setCurrentStep(0); }}
                                                initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                                exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                                                className="absolute right-5 top-5 z-20 flex items-center justify-center rounded-xl border border-zinc-200 bg-white/80 p-2 text-zinc-500 shadow-sm transition-colors hover:bg-white dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.97 }}
                                                aria-label={`Close ${tool.name} tutorial`}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </motion.button>

                                            <div className="p-8 relative">
                                                {/* Ambient Glowing Background */}
                                                <motion.div
                                                    className={`absolute -right-24 -top-24 h-56 w-56 rounded-full blur-3xl pointer-events-none ${accent.glow}`}
                                                    initial={{ scale: 0.95, opacity: 0.35 }}
                                                    animate={{ scale: 1.25, opacity: 0.65 }}
                                                    transition={{ duration: 0.6 }}
                                                    aria-hidden="true"
                                                />

                                                {/* Header with Icon */}
                                                <motion.div
                                                    initial={{ opacity: 0, y: 15 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1, duration: 0.4 }}
                                                    className="text-left mb-6 mt-2 relative z-10"
                                                >
                                                    {/* Custom Tool Icon Container aligned with Card Design */}
                                                    <motion.div
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        transition={{ type: 'spring', damping: 20, stiffness: 350, delay: 0.15 }}
                                                        className={`mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] border ${accent.iconIdle} shadow-sm ring-4 ring-white/50 dark:ring-zinc-900/50`}
                                                    >
                                                        <div className="scale-[1.15]">{tool.icon}</div>
                                                    </motion.div>

                                                    <h2 id={tutorialTitleId} className="text-[22px] font-bold text-zinc-900 dark:text-zinc-50 mb-1.5 tracking-tight leading-tight">
                                                        {resolvedTutorial.title}
                                                    </h2>
                                                    <p id={tutorialDescriptionId} className="text-[14px] font-medium text-zinc-500 dark:text-zinc-400">
                                                        Quick guide to get you started
                                                    </p>
                                                </motion.div>

                                                {/* Hidden ARIA Live Region for Screen Readers */}
                                                <div aria-live="polite" className="sr-only">
                                                    Step {currentStep + 1} of {resolvedTutorial.steps.length}: {resolvedTutorial.steps[currentStep]}
                                                </div>

                                                {/* Step Content */}
                                                <AnimatePresence mode="wait">
                                                    <motion.div
                                                        key={currentStep}
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -20 }}
                                                        transition={{ duration: 0.25 }}
                                                        className="mb-6 relative z-10 flex flex-col gap-2.5 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-3xl p-6 md:p-8"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400">
                                                                Step {currentStep + 1}
                                                            </span>
                                                        </div>
                                                        <p className="text-[15px] font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
                                                            {resolvedTutorial.steps[currentStep]}
                                                        </p>
                                                    </motion.div>
                                                </AnimatePresence>

                                                {/* Tip Box Styled as elegant Callout card */}
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.3, duration: 0.3 }}
                                                    className="mb-6 relative overflow-hidden bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 shadow-sm rounded-2xl px-4 py-3 flex items-center group z-10"
                                                >
                                                    <div className="flex items-center gap-3 relative z-10 w-full">
                                                        <motion.div
                                                            whileHover={{ scale: 1.05, rotate: -5 }}
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.35 }}
                                                            className="w-9 h-9 rounded-xl bg-white dark:bg-yellow-500/10 border border-yellow-100 dark:border-yellow-500/20 flex items-center justify-center flex-shrink-0 shadow-sm"
                                                        >
                                                            <span className="text-base leading-none select-none" aria-hidden="true">💡</span>
                                                        </motion.div>

                                                        <p className="text-[13.5px] font-semibold text-black dark:text-zinc-100 leading-relaxed m-0 flex-1">
                                                            {resolvedTutorial.tip}
                                                        </p>
                                                    </div>
                                                </motion.div>

                                                {/* Refined Glassmorphic Action Buttons */}
                                                <div className="flex flex-row-reverse items-center justify-between mt-4 relative z-10 w-full">
                                                    {currentStep < resolvedTutorial.steps.length - 1 ? (
                                                        <motion.button
                                                            type="button"
                                                            onClick={handleTutorialNext}
                                                            whileHover={{ y: -1 }}
                                                            whileTap={{ scale: 0.97 }}
                                                            className="flex-1 flex justify-center items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors w-full whitespace-nowrap"
                                                        >
                                                            Next
                                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M5 12h14" />
                                                                <polyline points="12 5 19 12 12 19" />
                                                            </svg>
                                                        </motion.button>
                                                    ) : (
                                                        <motion.button
                                                            type="button"
                                                            onClick={handleTutorialComplete}
                                                            whileHover={{ y: -1 }}
                                                            whileTap={{ scale: 0.97 }}
                                                            className="flex-1 flex justify-center items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors w-full whitespace-nowrap"
                                                        >
                                                            Open {tool.name}
                                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                                <polyline points="15 3 21 3 21 9" />
                                                                <line x1="10" y1="14" x2="21" y2="3" />
                                                            </svg>
                                                        </motion.button>
                                                    )}

                                                    <AnimatePresence>
                                                        {currentStep > 0 && (
                                                            <motion.div
                                                                initial={{ width: 0, opacity: 0, marginRight: 0 }}
                                                                animate={{
                                                                    width: 96,
                                                                    opacity: 1,
                                                                    marginRight: 12,
                                                                    transition: { type: 'tween', ease: 'easeOut', duration: 0.28 }
                                                                }}
                                                                exit={{
                                                                    width: 0,
                                                                    opacity: 0,
                                                                    marginRight: 0,
                                                                    transition: { type: 'tween', ease: 'easeIn', duration: 0.2 }
                                                                }}
                                                                className="overflow-hidden shrink-0"
                                                            >
                                                                <motion.button
                                                                    type="button"
                                                                    onClick={handleTutorialPrev}
                                                                    whileHover={{ x: -2 }}
                                                                    whileTap={{ scale: 0.97 }}
                                                                    className="flex items-center justify-center gap-1.5 w-[96px] py-2.5 text-sm font-bold text-zinc-700 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors whitespace-nowrap shrink-0"
                                                                >
                                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                                        <path d="M19 12H5" />
                                                                        <polyline points="12 19 5 12 12 5" />
                                                                    </svg>
                                                                    Back
                                                                </motion.button>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                {/* Skip Button Container - Reserved Space to Prevent Jitter */}
                                                <div className="mt-4 h-[36px] w-full relative z-10">
                                                    <AnimatePresence>
                                                        {currentStep < resolvedTutorial.steps.length - 1 && (
                                                            <motion.button
                                                                type="button"
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.25 } }}
                                                                exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                                                                onClick={handleSkipTutorial}
                                                                whileHover={{ y: -1 }}
                                                                whileTap={{ scale: 0.97 }}
                                                                className="absolute inset-0 w-full flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold text-zinc-700 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                                            >
                                                                Skip tutorial & open directly
                                                            </motion.button>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
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
