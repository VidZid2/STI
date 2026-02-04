import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TutorialStep {
    id: string;
    target: string; // CSS selector for the element to highlight
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
    fixedTooltip?: boolean; // If true, tooltip is fixed to far left of screen
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: 'logo',
        target: '.logo',
        title: 'STI eLMS',
        description: 'Welcome to the new STI Enhanced Learning Management System. Let us show you around!',
        position: 'bottom',
    },
    {
        id: 'menu',
        target: '.sidebar-toggle',
        title: 'Menu Button',
        description: 'Click here to open the navigation sidebar. Access all your courses, tools, and settings.',
        position: 'bottom',
    },
    {
        id: 'toolbar',
        target: '.header-right',
        title: 'Quick Actions',
        description: 'Your notifications, messages, and profile are here. Click any icon to see more options.',
        position: 'bottom',
    },
    {
        id: 'welcome',
        target: '.welcome-main-card',
        title: 'Welcome Area',
        description: 'See your personalized greeting, current streak, and quick stats at a glance.',
        position: 'bottom',
    },
    {
        id: 'stats',
        target: '.stats-row-cards',
        title: 'Your Statistics',
        description: 'Track your progress with detailed statistics. Click on any stat card to see more details.',
        position: 'top',
    },
    {
        id: 'courses',
        target: '.courses-section-premium',
        title: 'Your Courses',
        description: 'All your enrolled courses appear here. Click any course to continue learning where you left off.',
        position: 'top',
    },
    {
        id: 'widgets-toggle',
        target: '.floating-widgets-toggle',
        title: 'Widgets Panel',
        description: 'This button opens the widgets sidebar. It contains your calendar, to-do list, and more.',
        position: 'left',
        fixedTooltip: true, // Tooltip on far left
    },
    {
        id: 'widgets-sidebar',
        target: '#widgets-content-area',
        title: 'Dashboard Widgets',
        description: 'Access your calendar, to-do list, groups, news, and announcements. You can hide or show widgets as needed.',
        position: 'left',
        fixedTooltip: true, // Tooltip on far left
    },
    {
        id: 'dock',
        target: '.floating-dock-container',
        title: 'Quick Actions Dock',
        description: 'Access frequently used features instantly from this dock. Hover over icons to see tooltips.',
        position: 'top',
    },
    {
        id: 'finish',
        target: '.welcome-main-card',
        title: 'You\'re All Set!',
        description: 'That\'s the tour! Explore the dashboard and start learning. You can always access help from the menu.',
        position: 'bottom',
    },
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

    const step = TUTORIAL_STEPS[currentStep];
    const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
    const isFirstStep = currentStep === 0;

    const calculatePositions = useCallback(() => {
        if (!step) return;

        // Try each selector in the target (comma-separated)
        const selectors = step.target.split(',').map(s => s.trim());
        let element: Element | null = null;
        
        for (const selector of selectors) {
            element = document.querySelector(selector);
            if (element) break;
        }

        if (!element) {
            // If element not found, show a default center position
            setHighlightRect(null);
            setTooltipPosition({ 
                top: window.innerHeight / 2 - 90, 
                left: window.innerWidth / 2 - 160 
            });
            return;
        }

        // Scroll element into view if needed (smooth scroll)
        const rect = element.getBoundingClientRect();
        const isInViewport = rect.top >= 0 && rect.bottom <= window.innerHeight;
        
        if (!isInViewport) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Recalculate after scroll animation
            setTimeout(() => calculatePositions(), 400);
            return;
        }

        const padding = 12;

        setHighlightRect({
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
        });

        // Calculate tooltip position
        const tooltipWidth = 320;
        const tooltipHeight = 280; // Increased to account for actual tooltip size
        const gap = 30; // Increased gap for more spacing

        let top = 0;
        let left = 0;

        // Special case: fixed tooltip to far left for widgets sidebar
        if (step.fixedTooltip) {
            top = window.innerHeight / 2 - tooltipHeight / 2;
            left = 40; // Fixed to far left
        } else {
            switch (step.position) {
                case 'right':
                    top = rect.top + rect.height / 2 - tooltipHeight / 2;
                    left = rect.right + gap;
                    break;
                case 'left':
                    top = rect.top + rect.height / 2 - tooltipHeight / 2;
                    left = rect.left - tooltipWidth - gap;
                    break;
                case 'bottom':
                    top = rect.bottom + gap;
                    left = rect.left + rect.width / 2 - tooltipWidth / 2;
                    break;
                case 'top':
                    top = rect.top - tooltipHeight - gap;
                    left = rect.left + rect.width / 2 - tooltipWidth / 2;
                    break;
            }

            // Keep tooltip within viewport (but don't push it below the element for 'top' position)
            if (step.position !== 'top') {
                top = Math.max(20, Math.min(top, window.innerHeight - tooltipHeight - 20));
            } else {
                // For top position, ensure it doesn't go above viewport
                top = Math.max(20, top);
            }
            left = Math.max(20, Math.min(left, window.innerWidth - tooltipWidth - 20));
        }

        setTooltipPosition({ top, left });
    }, [step, currentStep]);

    // Open/close widgets sidebar based on current step
    useEffect(() => {
        if (!isOpen || !onToggleWidgetsSidebar) return;
        
        if (step?.id === 'widgets-toggle') {
            // Open sidebar for step 7, then highlight the toggle button
            onToggleWidgetsSidebar(true);
            const timer = setTimeout(() => {
                const toggleBtn = document.querySelector('.floating-widgets-toggle');
                if (toggleBtn) {
                    const rect = toggleBtn.getBoundingClientRect();
                    const padding = 12;
                    setHighlightRect({
                        top: rect.top - padding,
                        left: rect.left - padding,
                        width: rect.width + padding * 2,
                        height: rect.height + padding * 2,
                    });
                }
            }, 500);
            return () => clearTimeout(timer);
        } else if (step?.id === 'widgets-sidebar') {
            // Sidebar should already be open from step 7, highlight the content
            onToggleWidgetsSidebar(true);
            const timer = setTimeout(() => {
                const widgetsContent = document.querySelector('#widgets-content-area');
                if (widgetsContent) {
                    const rect = widgetsContent.getBoundingClientRect();
                    const padding = 12;
                    setHighlightRect({
                        top: rect.top - padding,
                        left: rect.left - padding,
                        width: rect.width + padding * 2,
                        height: rect.height + padding * 2,
                    });
                }
            }, 400);
            return () => clearTimeout(timer);
        } else if (step?.id === 'dock' || step?.id === 'finish') {
            // Close sidebar for dock and finish steps
            onToggleWidgetsSidebar(false);
        }
    }, [currentStep, step, isOpen, onToggleWidgetsSidebar]);

    useEffect(() => {
        if (isOpen) {
            // For widgets steps, let the sidebar effect handle positioning
            // to ensure the sidebar is fully open before calculating
            if (step?.id !== 'widgets-sidebar' && step?.id !== 'widgets-toggle') {
                calculatePositions();
            }
            window.addEventListener('resize', calculatePositions);
            window.addEventListener('scroll', calculatePositions);
        }
        return () => {
            window.removeEventListener('resize', calculatePositions);
            window.removeEventListener('scroll', calculatePositions);
        };
    }, [isOpen, calculatePositions, step]);

    const handleNext = () => {
        if (isLastStep) {
            handleFinish();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (!isFirstStep) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        onClose();
    };

    const handleFinish = () => {
        onClose();
    };

    if (!isOpen) return null;


    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 10000,
                        pointerEvents: 'auto',
                    }}
                >
                    {/* Backdrop with cutout */}
                    <svg
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                        }}
                    >
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
                                            height: highlightRect.height,
                                        }}
                                        transition={{ 
                                            duration: 0.35, 
                                            ease: [0.4, 0, 0.2, 1],
                                        }}
                                        rx="12"
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
                            fill="rgba(15, 23, 42, 0.75)"
                            mask="url(#tutorial-mask)"
                            style={{ backdropFilter: 'blur(2px)' }}
                        />
                    </svg>

                    {/* Highlight border */}
                    {highlightRect && (
                        <motion.div
                            initial={false}
                            animate={{ 
                                opacity: 1,
                                top: highlightRect.top,
                                left: highlightRect.left,
                                width: highlightRect.width,
                                height: highlightRect.height,
                            }}
                            transition={{ 
                                duration: 0.35, 
                                ease: [0.4, 0, 0.2, 1],
                            }}
                            style={{
                                position: 'absolute',
                                borderRadius: '12px',
                                border: '2px solid #3b82f6',
                                boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.2), 0 0 30px rgba(59, 130, 246, 0.3)',
                                pointerEvents: 'none',
                            }}
                        />
                    )}

                    {/* Tooltip */}
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
                        style={{
                            position: 'absolute',
                            top: tooltipPosition.top,
                            left: tooltipPosition.left,
                            width: '320px',
                            backgroundColor: '#fff',
                            borderRadius: '16px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Progress bar */}
                        <div style={{ height: '3px', backgroundColor: '#e2e8f0' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
                                transition={{ duration: 0.3 }}
                                style={{ height: '100%', backgroundColor: '#3b82f6' }}
                            />
                        </div>

                        <div style={{ padding: '20px' }}>
                            {/* Step indicator */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                marginBottom: '12px' 
                            }}>
                                <span style={{ 
                                    fontSize: '11px', 
                                    fontWeight: 600, 
                                    color: '#3b82f6',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    Step {currentStep + 1} of {TUTORIAL_STEPS.length}
                                </span>
                                <button
                                    onClick={handleSkip}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '12px',
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    Skip tour
                                </button>
                            </div>

                            {/* Content */}
                            <h3 style={{ 
                                fontSize: '18px', 
                                fontWeight: 700, 
                                color: '#0f172a',
                                margin: '0 0 8px 0'
                            }}>
                                {step?.title}
                            </h3>
                            <p style={{ 
                                fontSize: '14px', 
                                color: '#64748b',
                                lineHeight: 1.6,
                                margin: '0 0 20px 0'
                            }}>
                                {step?.description}
                            </p>

                            {/* Navigation */}
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                {!isFirstStep && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handlePrev}
                                        style={{
                                            padding: '10px 16px',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            backgroundColor: '#fff',
                                            color: '#64748b',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Back
                                    </motion.button>
                                )}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleNext}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        backgroundColor: '#3b82f6',
                                        color: '#fff',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}
                                >
                                    {isLastStep ? 'Finish' : 'Next'}
                                    {!isLastStep && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    )}
                                </motion.button>
                            </div>
                        </div>

                        {/* Step dots */}
                        <div style={{ 
                            padding: '12px 20px',
                            borderTop: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '6px'
                        }}>
                            {TUTORIAL_STEPS.map((_, index) => (
                                <motion.div
                                    key={index}
                                    animate={{
                                        backgroundColor: index === currentStep ? '#3b82f6' : index < currentStep ? '#93c5fd' : '#e2e8f0',
                                        scale: index === currentStep ? 1.2 : 1,
                                    }}
                                    style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => setCurrentStep(index)}
                                />
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DashboardTutorial;
