import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, LayoutDashboard, X, Rocket, ShieldCheck, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollReelTestimonials } from '../ui/scroll-reel-testimonials';
import { AdvantagesBento } from '../ui/advantages-bento';
import HoverBrandLogo from '../ui/hover-brand-logo';
import { WelcomeFeatures } from './WelcomeFeatures';
import { DiaText } from '../ui/dia-text';
import { useDevicePerformance } from '../../hooks/use-device-performance';
const CHANGES_TESTIMONIALS = [
  {
    quote: "We've completely refreshed the dashboard. *Navigation is simpler*, *load times are blazingly fast*, and your learning experience is now truly *distraction-free*.",
    author: "A Cleaner, Faster UI",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80&auto=format&fit=crop",
    alt: "A Cleaner, Faster UI",
  },
  {
    quote: "Say *goodbye to visual noise*. We've removed redundant elements so everything you need, from modules to quizzes, is *organized exactly where you expect it*.",
    author: "Decluttered View",
    image: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=400&q=80&auto=format&fit=crop",
    alt: "Decluttered View",
  },
  {
    quote: "Studying on the go? The mobile layout is fully optimized with *buttery smooth animations*, *centered content*, and incredibly easy *one-handed navigation*.",
    author: "Better Mobile Layout",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80&auto=format&fit=crop",
    alt: "Better Mobile Layout",
  },
];

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TABS = [
    { id: 'changes', label: 'What Changed?', icon: LayoutDashboard },
    { id: 'advantages', label: 'Speed & Fixes', icon: ShieldCheck },
    { id: 'features', label: 'New Features', icon: Rocket },
    { id: 'feedback', label: 'Give Feedback', icon: MessageSquare },
];

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
    const { isLowEnd } = useDevicePerformance();
    const [activeTab, setActiveTab] = useState('changes');
    const [direction, setDirection] = useState(0); // -1 = left, 1 = right
    const contentRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState<number>(0);
    const wheelCooldown = useRef(false);

    const tabIds = TABS.map(t => t.id);


    const navigateTab = useCallback((dir: 1 | -1) => {
        setDirection(dir);
        setActiveTab(prev => {
            const currentIndex = tabIds.indexOf(prev);
            const nextIndex = currentIndex + dir;
            if (nextIndex < 0 || nextIndex >= tabIds.length) return prev;
            return tabIds[nextIndex];
        });
    }, [tabIds]);

    // Mouse wheel tab navigation (desktop only)
    useEffect(() => {
        const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
        if (isTouchDevice || !isOpen) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault(); // Unconditionally stop background scrolling

            if (wheelCooldown.current) return;
            const threshold = 30;
            if (Math.abs(e.deltaY) < threshold) return;

            wheelCooldown.current = true;

            if (e.deltaY > 0) {
                navigateTab(1);  // scroll down → next tab (slide right)
            } else {
                navigateTab(-1); // scroll up → prev tab (slide left)
            }

            setTimeout(() => {
                wheelCooldown.current = false;
            }, 600);
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        return () => window.removeEventListener('wheel', handleWheel);
    }, [isOpen, navigateTab]);

    // Comprehensive Background Scroll Lock (Mobile & PC)
    useEffect(() => {
        if (!isOpen) return;

        // Lock CSS completely using standard properties
        document.body.style.overflow = 'hidden';
        document.body.style.overscrollBehavior = 'contain';

        return () => {
            document.body.style.overflow = '';
            document.body.style.overscrollBehavior = '';
        };
    }, [isOpen]);

    // ResizeObserver to track content height changes smoothly
    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;

        let rafId: number;
        let timeoutId: NodeJS.Timeout;
        
        // Debounce the observer to prevent layout thrashing on every animation frame
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(rafId);
            clearTimeout(timeoutId);
            
            timeoutId = setTimeout(() => {
                rafId = requestAnimationFrame(() => {
                    if (el) {
                        const h = el.scrollHeight;
                        if (h > 0) setContentHeight(prev => prev !== h ? h : prev);
                    }
                });
            }, 50);
        });

        observer.observe(el);

        return () => {
            cancelAnimationFrame(rafId);
            clearTimeout(timeoutId);
            observer.disconnect();
        };
    }, [activeTab]);
    const renderContent = () => {
        switch (activeTab) {
            case 'changes':
                return (
                    <motion.div 
                        key="changes"
                        initial={{ opacity: 0, x: direction * 60 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: direction * -60 }}
                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                        className="w-full flex flex-col items-center gap-2 md:gap-4"
                        style={{ willChange: 'transform, opacity' }}
                    >
                        {/* Animated Headline */}
                        <div className="text-center flex-shrink-0 mb-2 px-2">
                            <div className="flex flex-col sm:flex-row items-center justify-center text-2xl sm:text-3xl lg:text-4xl font-light text-slate-800 dark:text-slate-100 tracking-tight leading-tight sm:gap-2">
                                <span>Your eLMS is now</span>
                                <span className="inline-block font-bold">
                                    <DiaText
                                        repeat
                                        repeatDelay={1.1}
                                        fixedWidth={true}
                                        className="text-center"
                                        text={["cleaner.", "faster.", "smarter."]}
                                    />
                                </span>
                            </div>
                        </div>

                        {/* Scroll Reel */}
                        <div className="w-full flex items-center justify-center">
                            <ScrollReelTestimonials testimonials={CHANGES_TESTIMONIALS} className="w-full" />
                        </div>

                        {/* Trusted By Logos */}
                        <div className="w-full mt-auto border-t border-slate-200 dark:border-slate-800/60 pt-2 flex-shrink-0">
                            <HoverBrandLogo className="py-2 lg:py-2" />
                        </div>
                    </motion.div>
                );
            case 'advantages':
                return (
                    <motion.div 
                        key="advantages"
                        initial={{ opacity: 0, x: direction * 60 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: direction * -60 }}
                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                        className="w-full"
                        style={{ willChange: 'transform, opacity' }}
                    >
                        <AdvantagesBento />
                    </motion.div>
                );
            case 'features':
                return (
                    <motion.div 
                        key="features"
                        initial={{ opacity: 0, x: direction * 60 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: direction * -60 }}
                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                        className="w-full flex flex-col"
                        style={{ willChange: 'transform, opacity' }}
                    >
                        <WelcomeFeatures />
                    </motion.div>
                );
            case 'feedback':
                return (
                    <motion.div 
                        key="feedback"
                        initial={{ opacity: 0, x: direction * 60 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: direction * -60 }}
                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                        className="w-full flex flex-col items-center justify-center p-4 sm:p-6 space-y-6"
                        style={{ willChange: 'transform, opacity' }}
                    >
                        <div className="text-center space-y-3 max-w-lg mx-auto">
                            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-800/50 shadow-inner">
                                <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">We Want Your Feedback</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
                                This new update is built entirely for you. If you spot a glitch, have a suggestion, or just want to tell us what you think, let us know!
                            </p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5"
                        >
                            Submit Feedback
                        </button>
                    </motion.div>
                );
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/60 sm:bg-slate-900/40 backdrop-blur-sm sm:backdrop-blur-md"
                        style={{ willChange: 'opacity' }}
                    />

                    {/* Modal Content */}
                    <motion.div
                        ref={modalRef}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full max-w-4xl lg:max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 flex flex-col max-h-[95vh] overflow-y-auto hide-scrollbar"
                        style={{ willChange: 'transform, opacity' }}
                    >
                        {/* Close Button */}
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors z-20"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-4 sm:p-8 flex flex-col pt-10 sm:pt-10">
                            {/* Dock Tabs */}
                            <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8 scale-95 sm:scale-100">
                                <div className="flex items-center gap-3 rounded-[32px] bg-slate-50 dark:bg-slate-900/50 px-3 py-2 shadow-inner ring-1 ring-slate-200/80 dark:ring-slate-700/80 sm:gap-5 sm:rounded-[48px] sm:px-6 sm:py-3 z-50">
                                    {TABS.map((tab, idx) => {
                                        const isActive = activeTab === tab.id;
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => {
                                                    const currentIdx = tabIds.indexOf(activeTab);
                                                    setDirection(idx > currentIdx ? 1 : -1);
                                                    setActiveTab(tab.id);
                                                }}
                                                className={`group relative grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl ring-1 shadow-sm transition-all duration-300 ${
                                                    isActive 
                                                        ? 'bg-blue-50 dark:bg-blue-900/30 ring-blue-300 dark:ring-blue-800/50 shadow-md' 
                                                        : 'bg-white dark:bg-slate-800 ring-slate-100 dark:ring-slate-700 hover:-translate-y-1 hover:scale-[1.05] hover:shadow-md hover:ring-blue-100 dark:hover:ring-blue-900/40'
                                                }`}
                                                aria-label={tab.label}
                                            >
                                                <Icon 
                                                    className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${
                                                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                                    }`} 
                                                    strokeWidth={isActive ? 2.5 : 2.1} 
                                                />
                                                {/* Tooltip */}
                                                <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none absolute -bottom-10 translate-y-2 group-hover:translate-y-0 text-[10px] sm:text-[11px] tracking-wide text-white dark:text-slate-100 bg-slate-800 dark:bg-slate-700 px-2.5 py-1 rounded-md shadow-md border border-slate-700 font-bold whitespace-nowrap z-50">
                                                    {tab.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Content Area — Smooth CSS height transition */}
                            <div 
                                className="overflow-hidden hide-scrollbar"
                                style={{ 
                                    height: (contentHeight > 0 && !isLowEnd) ? `${contentHeight}px` : 'auto',
                                    transition: isLowEnd ? 'none' : 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                    willChange: isLowEnd ? 'auto' : 'height',
                                    scrollbarWidth: 'none', 
                                    msOverflowStyle: 'none' 
                                }}
                            >
                                <div ref={contentRef}>
                                    <AnimatePresence mode="wait" initial={false}>
                                        {renderContent()}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default WelcomeModal;
