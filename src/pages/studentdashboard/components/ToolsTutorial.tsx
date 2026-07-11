import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { addXP } from '../../../services/studyTimeService';

interface ToolsTutorialStep {
    id: string;
    target: string; // CSS selector for the element to highlight
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
    multipleTargets?: boolean;
}

const TOOLS_TUTORIAL_STEPS: ToolsTutorialStep[] = [
    {
        id: 'tools-header',
        target: '.tools-header-container',
        title: 'Student Tools Hub',
        description: 'Welcome to your academic workbench. Access local-first utilities for checking grammar, summarizing notes, converting files, and generating citations in a unified, premium space.',
        position: 'bottom'
    },
    {
        id: 'search-filter',
        target: '.tools-search-card',
        title: 'Search & Category Filters',
        description: 'Need a specific utility? Type search queries like "APA", "compress", or "essay", or use the category filter tabs (All, Converters, Text Tools) to instantly narrow your search.',
        position: 'bottom'
    },
    {
        id: 'recommended-tools',
        target: '.tools-recommended-container',
        title: 'Premium Writing Assistants',
        description: 'Quickly launch the three most popular tools directly from this sidebar: Grammar Checker for essays, Text Summarizer for review guides, and Paraphraser for writing practice.',
        position: 'bottom'
    },
    {
        id: 'grammar-checker-card',
        target: '.tool-card-grammar-check',
        title: 'Grammar Checker',
        description: 'Polish your drafts effortlessly. Paste your writing to detect grammar, style, and spelling issues instantly using our secure, privacy-focused browser parser.',
        position: 'top'
    },
    {
        id: 'summarizer-card',
        target: '.tool-card-text-summarizer',
        title: 'Text Summarizer',
        description: 'Turn lengthy readings or class notes into clean, digestible review summaries. Perfect for reviewing key points before exams without losing momentum.',
        position: 'top'
    },
    {
        id: 'pdf-converters',
        target: '.tool-card-word-pdf, .tool-card-image-pdf, .tool-card-compress-pdf',
        multipleTargets: true,
        title: 'PDF & File Converters',
        description: 'Convert docs or compile homework images to PDF offline. Use the "Compress PDF" tool to shrink file sizes down and bypass eLMS upload limits safely!',
        position: 'top'
    },
    {
        id: 'citation-tools',
        target: '.tool-card-citation-generator, .tool-card-reference-manager',
        multipleTargets: true,
        title: 'Citations & Bibliographies',
        description: 'Generate formatted citations automatically in APA, MLA, or Chicago format. Organize your bibliography inside the Reference Manager to export it directly into your reports.',
        position: 'top'
    },
    {
        id: 'all-tools-grid',
        target: '.tools-grid-list',
        title: 'Explore All 11 Tools',
        description: 'Scroll through the entire catalog of utilities. All tools run directly inside your browser so your drafts and files never leave your device.',
        position: 'top'
    },
    {
        id: 'finish-tools',
        target: '.tools-header-container',
        title: 'Academic Success Unlocked!',
        description: 'You\'re ready to work smarter. Click any tool card to launch its workspace. Replay this tools walkthrough anytime by pressing the single quote key (\') while on this page.',
        position: 'bottom'
    }
];

interface ToolsTutorialProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenToolsPage?: () => void;
}

interface HighlightRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

const ToolsTutorial: React.FC<ToolsTutorialProps> = ({ isOpen, onClose, onOpenToolsPage }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [isDarkMode, setIsDarkMode] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const step = TOOLS_TUTORIAL_STEPS[currentStep];
    const isLastStep = currentStep === TOOLS_TUTORIAL_STEPS.length - 1;
    const isFirstStep = currentStep === 0;

    // Detect Dark Mode
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.body.classList.contains('dark-mode'));
        };
        checkDarkMode();
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Ensure we are on the Tools page when the tutorial opens
    useEffect(() => {
        if (isOpen && onOpenToolsPage) {
            onOpenToolsPage();
        }
    }, [isOpen, onOpenToolsPage]);

    const calculatePositions = useCallback(() => {
        if (!step) return;

        const selectors = step.target.split(',').map(s => s.trim());
        const rects: DOMRect[] = [];
        
        if (step.multipleTargets) {
            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                for (let i = 0; i < elements.length; i++) {
                    const el = elements[i] as HTMLElement;
                    const r = el.getBoundingClientRect();
                    if (r.width > 0 && r.height > 0) {
                        rects.push(r);
                        break; // matches first visible element for this selector
                    }
                }
            }
        } else {
            // Fallback: use first visible matched element
            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                let found = false;
                for (let i = 0; i < elements.length; i++) {
                    const el = elements[i] as HTMLElement;
                    const r = el.getBoundingClientRect();
                    if (r.width > 0 && r.height > 0) {
                        rects.push(r);
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
        }

        if (rects.length === 0) {
            setHighlightRect(null);
            setTooltipPosition({ 
                top: window.innerHeight / 2 - 110, 
                left: window.innerWidth / 2 - 160 
            });
            return;
        }

        // Calculate union box bounds
        let minTop = Infinity;
        let minLeft = Infinity;
        let maxRight = -Infinity;
        let maxBottom = -Infinity;

        for (const r of rects) {
            minTop = Math.min(minTop, r.top);
            minLeft = Math.min(minLeft, r.left);
            maxRight = Math.max(maxRight, r.right);
            maxBottom = Math.max(maxBottom, r.bottom);
        }

        const padding = 12;
        const rect = {
            top: minTop,
            left: minLeft,
            width: maxRight - minLeft,
            height: maxBottom - minTop,
            bottom: maxBottom,
            right: maxRight
        };

        setHighlightRect({
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2
        });

        // Calculate tooltip position
        const tooltipEl = tooltipRef.current;
        const actualTooltipHeight = tooltipEl ? tooltipEl.offsetHeight : 240;
        const actualTooltipWidth = tooltipEl ? tooltipEl.offsetWidth : 320;
        const gap = 20; 

        let top = 0;
        let left = 0;
        let position = step.position;

        if (window.innerWidth < 1024) {
            // Force top/bottom on mobile/tablet to fit clean screen layout
            if (position === 'left' || position === 'right') {
                // If element is in upper half of viewport, put tooltip below it, else above it
                position = rect.top < window.innerHeight / 2 ? 'bottom' : 'top';
            }
        }

        switch (position) {
            case 'right':
                top = rect.top + rect.height / 2 - actualTooltipHeight / 2;
                left = rect.right + gap;
                break;
            case 'left':
                top = rect.top + rect.height / 2 - actualTooltipHeight / 2;
                left = rect.left - actualTooltipWidth - gap;
                break;
            case 'bottom':
                top = rect.bottom + gap;
                left = rect.left + rect.width / 2 - actualTooltipWidth / 2;
                break;
            case 'top':
                top = rect.top - actualTooltipHeight - gap;
                left = rect.left + rect.width / 2 - actualTooltipWidth / 2;
                break;
        }

        // Keep tooltip within viewport bounds
        if (position !== 'top') {
            top = Math.max(20, Math.min(top, window.innerHeight - actualTooltipHeight - 20));
        } else {
            top = Math.max(20, top);
        }
        left = Math.max(20, Math.min(left, window.innerWidth - actualTooltipWidth - 20));

        setTooltipPosition({ top, left });
    }, [step]);

    // Scroll target into view when step changes
    useEffect(() => {
        if (!isOpen || !step) return;

        const timer = setTimeout(() => {
            const selectors = step.target.split(',').map(s => s.trim());
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element && element.getBoundingClientRect().width > 0) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    break;
                }
            }
        }, 150);

        return () => clearTimeout(timer);
    }, [currentStep, step, isOpen]);

    // Periodically recalculate positions during transitions to keep highlight box matching layout shifts
    useEffect(() => {
        if (!isOpen || !step) return;

        calculatePositions();

        const intervals = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 1000, 1200, 1500];
        const timers = intervals.map(delay => 
            setTimeout(() => {
                calculatePositions();
            }, delay)
        );

        return () => {
            timers.forEach(t => clearTimeout(t));
        };
    }, [currentStep, step, isOpen, calculatePositions]);

    // Set up listeners for resize/scroll
    useEffect(() => {
        if (isOpen) {
            window.addEventListener('resize', calculatePositions);
            window.addEventListener('scroll', calculatePositions);
        }
        return () => {
            window.removeEventListener('resize', calculatePositions);
            window.removeEventListener('scroll', calculatePositions);
        };
    }, [isOpen, calculatePositions]);

    const handleNext = () => {
        if (isLastStep) {
            addXP(100); // Level up on completing this tutorial too!
            onClose();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (!isFirstStep) {
            setCurrentStep(prev => prev - 1);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="fixed inset-0 z-[99999] pointer-events-auto"
                >
                    {/* Backdrop cutout mask */}
                    <svg className="absolute inset-0 w-full h-full">
                        <defs>
                            <mask id="tools-tutorial-mask">
                                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                                {highlightRect && (
                                    <motion.rect
                                        initial={false}
                                        animate={{ 
                                            x: highlightRect.left,
                                            y: highlightRect.top,
                                            width: highlightRect.width,
                                            height: highlightRect.height 
                                        }}
                                        transition={{ 
                                            type: 'spring',
                                            duration: 0.46,
                                            bounce: 0.04
                                        }}
                                        rx="20"
                                        fill="black"
                                    />
                                )}
                            </mask>
                        </defs>
                        <rect
                            x="0"
                            y="0"
                            width="100%"
                            height="100%"
                            fill={isDarkMode ? "rgba(15, 23, 42, 0.7)" : "rgba(15, 23, 42, 0.55)"}
                            mask="url(#tools-tutorial-mask)"
                            style={{ backdropFilter: 'blur(2.5px)' }}
                        />
                    </svg>

                    {/* Subtle highlight border matching student dashboard cards */}
                    {highlightRect && (
                        <motion.div
                            initial={false}
                            animate={{ 
                                opacity: 1,
                                top: highlightRect.top,
                                left: highlightRect.left,
                                width: highlightRect.width,
                                height: highlightRect.height 
                            }}
                            transition={{ 
                                type: 'spring',
                                duration: 0.46,
                                bounce: 0.04
                            }}
                            className="absolute border-2 border-blue-500/80 rounded-[20px] pointer-events-none"
                            style={{
                                boxShadow: isDarkMode 
                                    ? '0 0 0 4px rgba(59, 130, 246, 0.1), 0 10px 30px rgba(0, 0, 0, 0.4)' 
                                    : '0 0 0 4px rgba(59, 130, 246, 0.12), 0 10px 30px rgba(0, 0, 0, 0.08)'
                            }}
                        />
                    )}

                    {/* Tooltip Card (Standard eLMS 2.0 Card Style) */}
                    <motion.div
                        ref={tooltipRef}
                        key={currentStep}
                        initial={{ opacity: 0, y: 15, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -15, scale: 0.96 }}
                        transition={{ type: 'spring', duration: 0.4, bounce: 0.05 }}
                        className="absolute w-[320px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-[24px] overflow-hidden flex flex-col justify-between"
                        style={{
                            top: tooltipPosition.top,
                            left: tooltipPosition.left
                        }}
                    >
                        {/* Clean top progress tracker bar */}
                        <div className="h-[4px] bg-slate-100 dark:bg-slate-700/60 w-full">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentStep + 1) / TOOLS_TUTORIAL_STEPS.length) * 100}%` }}
                                transition={{ duration: 0.25 }}
                                className="h-full bg-blue-500 dark:bg-blue-400"
                            />
                        </div>

                        <div className="p-5 flex flex-col gap-4 flex-grow">
                            {/* Header Step Counter */}
                            <div className="flex items-center">
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                    Step {currentStep + 1} of {TOOLS_TUTORIAL_STEPS.length}
                                </span>
                            </div>

                            {/* Main Content */}
                            <div>
                                <h3 className="text-[17px] font-bold text-slate-900 dark:text-slate-100 mb-1.5 mt-0 tracking-tight leading-tight">
                                    {step?.title}
                                </h3>
                                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-[1.45] m-0">
                                    {step?.description}
                                </p>
                            </div>

                            {/* Buttons and Pagination */}
                            <div className="flex items-center justify-between pt-2 mt-auto">
                                {/* Dot indicator navigation */}
                                <div className="hidden sm:flex items-center gap-1.5">
                                    {TOOLS_TUTORIAL_STEPS.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentStep(idx)}
                                            className="border-none p-0 cursor-pointer outline-none group"
                                            aria-label={`Go to step ${idx + 1}`}
                                        >
                                            <motion.div
                                                animate={{
                                                    backgroundColor: idx === currentStep 
                                                        ? '#3b82f6' 
                                                        : idx < currentStep 
                                                            ? '#93c5fd' 
                                                            : isDarkMode ? '#334155' : '#e2e8f0',
                                                    scale: idx === currentStep ? 1.25 : 1
                                                }}
                                                className="w-1.5 h-1.5 rounded-full transition-all group-hover:scale-125"
                                            />
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-2 ml-auto sm:ml-0">
                                    {!isFirstStep && (
                                        <button
                                            onClick={handlePrev}
                                            className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-200 transition-all flex items-center justify-center cursor-pointer shadow-sm"
                                            aria-label="Back"
                                        >
                                            <ArrowLeft size={16} strokeWidth={2.5} />
                                        </button>
                                    )}
                                    <button
                                        onClick={handleNext}
                                        className="h-9 px-4 rounded-xl bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border-none"
                                    >
                                        <span>{isLastStep ? 'Finish' : 'Next'}</span>
                                        {!isLastStep && <ArrowRight size={14} strokeWidth={2.5} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ToolsTutorial;
