import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { addXP } from '../../../services/studyTimeService';

interface TutorialStep {
    id: string;
    target: string; // CSS selector for the element to highlight
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
    fixedTooltip?: boolean; // If true, tooltip is fixed to far left of screen
    multipleTargets?: boolean;
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: 'logo',
        target: '.sidebar-logo-header, [alt="STI Logo"]',
        title: 'STI eLMS 2.0',
        description: 'Welcome to your newly designed student portal. We\'ve upgraded your learning experience to be cleaner, faster, and more intuitive. Let\'s take a quick tour!',
        position: 'bottom'
    },
    {
        id: 'sidebar-nav',
        target: '.sidebar-nav, .mobile-bottom-dock',
        title: 'Main Navigation',
        description: 'Access all dashboard pages here. View your Home page, continue learning in Courses, view custom Learning Paths, track personal Goals, and collaborate in Workspaces and Community.',
        position: 'right'
    },
    {
        id: 'streak',
        target: '.streak-dropdown-trigger',
        title: 'Daily Streak Tracker',
        description: 'Build your daily streak by learning and completing modules regularly. Click this flame trigger to check your streak level, view milestone progress, and stay motivated!',
        position: 'bottom'
    },
    {
        id: 'level',
        target: '.level-dropdown-trigger',
        title: 'Level & XP Progress',
        description: 'Monitor your learning level status. Click here to see your total XP, review the detailed XP log, and inspect your earned Crown badges!',
        position: 'bottom'
    },
    {
        id: 'tools',
        target: '[aria-label="Getting Started"], [aria-label="Video Tutorials"], [aria-label="FAQs"], [aria-label="Keyboard Shortcuts"], [aria-label="Contact Support"]',
        multipleTargets: true,
        title: 'Learning & Support Tools',
        description: 'Quickly access critical resources on the left side of the toolbar. Open the student manual, watch video guides, check FAQs, view keyboard shortcuts, or chat with support.',
        position: 'bottom'
    },
    {
        id: 'toolbar',
        target: '.header-right, .mobile-toolbar',
        title: 'Quick Actions & Settings',
        description: 'Use the right side of the toolbar to search courses, review recent notifications, view inbox messages, or adjust dashboard settings.',
        position: 'bottom'
    },
    {
        id: 'stats',
        target: '.dashboard-expanded-stats',
        title: 'Performance Stats Panel',
        description: 'See detailed metrics of your studies. Check your active streaks, total learning hours, overall progress, and check exactly how many modules are completed or remaining in your curriculum.',
        position: 'top'
    },
    {
        id: 'widgets',
        target: '#widgets-content-area-inline, #widgets-content-area, .floating-widgets-toggle',
        title: 'Productivity Widgets',
        description: 'Stay on top of deadlines. Toggle the widgets sidebar to check calendar events, manage to-do items, collaborate with groups, and read the latest announcements.',
        position: 'right'
    },
    {
        id: 'courses',
        target: '.courses-carousel-card',
        title: 'Premium Course Hub',
        description: 'Dive back into your classes immediately. Review your course grades, module progression, and up-next tasks, then slide between all your enrolled subjects smoothly.',
        position: 'top'
    },
    {
        id: 'finish',
        target: '.welcome-main-card',
        title: 'You\'re All Set!',
        description: 'That\'s the tour! Explore the portal and start learning. You can replay this tour anytime by pressing the single quote key (\') on your keyboard.',
        position: 'bottom'
    }
];

interface DashboardTutorialProps {
    isOpen: boolean;
    onClose: () => void;
    onToggleWidgetsSidebar?: (open: boolean) => void;
}

interface HighlightRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

const DashboardTutorial: React.FC<DashboardTutorialProps> = ({ isOpen, onClose, onToggleWidgetsSidebar }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isMobileToolbarSecondPhase, setIsMobileToolbarSecondPhase] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const step = TUTORIAL_STEPS[currentStep];
    const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
    const isFirstStep = currentStep === 0;
    const isMobileView = window.innerWidth < 1024;
    const hideNextButton = step?.id === 'toolbar' && isMobileView && !isMobileToolbarSecondPhase;

    // Reset toolbar second phase on step change
    useEffect(() => {
        setIsMobileToolbarSecondPhase(false);
    }, [currentStep]);

    // Timer to trigger second phase on Step 6 on mobile after 4 seconds
    useEffect(() => {
        if (!isOpen || !step || step.id !== 'toolbar') return;
        
        const isMobile = window.innerWidth < 1024;
        if (!isMobile) return;

        const timer = setTimeout(() => {
            setIsMobileToolbarSecondPhase(true);
        }, 4000);

        return () => clearTimeout(timer);
    }, [currentStep, step, isOpen]);

    const getTargetSelector = useCallback(() => {
        if (!step) return '';
        const isMobile = window.innerWidth < 1024;
        if (step.id === 'toolbar' && isMobile) {
            return isMobileToolbarSecondPhase ? '.mobile-toolbar' : '.profile-dropdown-trigger';
        }
        return step.target;
    }, [step, isMobileToolbarSecondPhase]);

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

    const calculatePositions = useCallback(() => {
        if (!step) return;

        const rects: DOMRect[] = [];
        const isMobile = window.innerWidth < 1024;
        if (step.id === 'stats' && isMobile) {
            const cards = document.querySelectorAll('.dashboard-expanded-stats > div');
            cards.forEach(card => {
                const r = card.getBoundingClientRect();
                if (r.width > 0 && r.height > 0) {
                    rects.push(r);
                }
            });
        } else {
            const targetSelector = getTargetSelector();
            if (targetSelector) {
                const selectors = targetSelector.split(',').map(s => s.trim());
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

        if (step.fixedTooltip && step.id === 'widgets' && isMobile) {
            // Only apply fixed layout on mobile/tablet if collapsible widgets sidebar is active
            top = window.innerHeight / 2 - actualTooltipHeight / 2;
            left = 40; 
        } else {
            // Dynamic position logic for widgets: right on inline, left on collapsible
            let position = step.position;
            if (step.id === 'widgets') {
                position = isMobile ? 'left' : 'right';
            }

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
        }

        setTooltipPosition({ top, left });
    }, [step, getTargetSelector]);

    const prevStepIdRef = React.useRef<string | null>(null);

    // Keep track of the previous step ID to detect layout changes
    useEffect(() => {
        if (step) {
            prevStepIdRef.current = step.id;
        }
    }, [step]);

    // Scroll target into view when step changes to prevent scroll-measurement fight loops
    useEffect(() => {
        if (!isOpen || !step) return;

        // Skip auto-scrolling if it's a mobile fixed widgets step
        const isMobile = window.innerWidth < 1024;
        if (step.fixedTooltip && step.id === 'widgets' && isMobile) {
            return;
        }

        const isStatsTransition = step.id === 'stats' || prevStepIdRef.current === 'stats';
        const delay = isStatsTransition ? 500 : 150;

        const timer = setTimeout(() => {
            const targetSelector = getTargetSelector();
            const selectors = targetSelector.split(',').map(s => s.trim());
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element && element.getBoundingClientRect().width > 0) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    break;
                }
            }

            // On mobile, if we are transitioning to the toolbar second phase, auto-swipe inside the tool container
            if (isMobile && step.id === 'toolbar' && isMobileToolbarSecondPhase) {
                const toolbarEl = document.querySelector('.mobile-toolbar');
                if (toolbarEl) {
                    toolbarEl.scrollLeft = 0;
                }
            }
        }, delay);

        return () => clearTimeout(timer);
    }, [currentStep, step, isOpen, isMobileToolbarSecondPhase, getTargetSelector]);

    // Handle automatically expanding/collapsing stats panel
    useEffect(() => {
        if (!isOpen) return;

        const mainCard = document.querySelector('.welcome-main-card');
        const isExpanded = mainCard?.getAttribute('data-expanded') === 'true';

        if (step?.id === 'stats') {
            if (!isExpanded) {
                window.dispatchEvent(new CustomEvent('dashboard-stats-toggle', { detail: { expand: true } }));
            }
        } else {
            if (isExpanded) {
                window.dispatchEvent(new CustomEvent('dashboard-stats-toggle', { detail: { expand: false } }));
            }
        }
    }, [currentStep, step, isOpen]);

    // Handle opening/closing widgets sidebar for the widgets, tools, and toolbar steps
    useEffect(() => {
        if (!isOpen || !onToggleWidgetsSidebar) return;
        
        const isMobile = window.innerWidth < 1024;
        let needsSidebarOpen = ['widgets', 'tools'].includes(step?.id || '');
        if (step?.id === 'toolbar') {
            needsSidebarOpen = isMobile ? isMobileToolbarSecondPhase : false;
        }
        
        if (isMobile) {
            onToggleWidgetsSidebar(needsSidebarOpen);
        } else {
            // On desktop, keep collapsible widgets sidebar closed since it's inline
            onToggleWidgetsSidebar(false);
        }
    }, [currentStep, step, isOpen, isMobileToolbarSecondPhase, onToggleWidgetsSidebar]);

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
            addXP(100); // Give 100 XP to level up to Level 2
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
                            <mask id="tutorial-mask">
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
                                        rx="16"
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
                            mask="url(#tutorial-mask)"
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
                            className="absolute border-2 border-blue-500/80 rounded-[16px] pointer-events-none"
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
                                animate={{ width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
                                transition={{ duration: 0.25 }}
                                className="h-full bg-blue-500 dark:bg-blue-400"
                            />
                        </div>

                        <div className="p-5 flex flex-col gap-4 flex-grow">
                            {/* Header Step Counter */}
                            <div className="flex items-center">
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                    Step {currentStep + 1} of {TUTORIAL_STEPS.length}
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
                                    {TUTORIAL_STEPS.map((_, idx) => (
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
                                    {!hideNextButton && (
                                        <button
                                            onClick={handleNext}
                                            className="h-9 px-4 rounded-xl bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border-none"
                                        >
                                            <span>{isLastStep ? 'Finish' : 'Next'}</span>
                                            {!isLastStep && <ArrowRight size={14} strokeWidth={2.5} />}
                                        </button>
                                    )}
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

export default DashboardTutorial;
