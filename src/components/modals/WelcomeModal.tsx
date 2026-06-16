import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, LayoutDashboard, X, Rocket, ShieldCheck, ChevronRight, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollReelTestimonials } from '../ui/scroll-reel-testimonials';
import { AdvantagesBento } from '../ui/advantages-bento';
import HoverBrandLogo from '../ui/hover-brand-logo';
import { DiaText } from '../ui/dia-text';

const CHANGES_TESTIMONIALS = [
  {
    quote: "We've completely refreshed the dashboard to make your learning experience smooth and distraction-free.",
    author: "A Cleaner, Faster UI",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80&auto=format&fit=crop",
    alt: "A Cleaner, Faster UI",
  },
  {
    quote: "Say goodbye to visual noise. Everything is organized exactly where you expect it.",
    author: "Decluttered View",
    image: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=400&q=80&auto=format&fit=crop",
    alt: "Decluttered View",
  },
  {
    quote: "Studying on the go? The mobile layout is now fully optimized and incredibly easy to navigate.",
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
    const [activeTab, setActiveTab] = useState('changes');
    const [direction, setDirection] = useState(0); // -1 = left, 1 = right
    const contentRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState<number>(0);
    const wheelCooldown = useRef(false);
    const hasAutoScrolled = useRef<Record<string, boolean>>({});

    const tabIds = TABS.map(t => t.id);

    // Mobile auto-scroll for 'changes' and 'advantages' tabs (once per refresh per tab)
    useEffect(() => {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (!isMobile || !isOpen) return;
        if (activeTab !== 'changes' && activeTab !== 'advantages') return;
        if (hasAutoScrolled.current[activeTab]) return;

        const scrollEl = modalRef.current;
        if (!scrollEl) return;

        let rafId: number;
        let cancelled = false;

        // Mark as done so it won't repeat
        hasAutoScrolled.current[activeTab] = true;

        // Wait for content to fully render before starting
        const startDelay = setTimeout(() => {
            if (cancelled) return;

            const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
            if (maxScroll <= 5) return; // Nothing meaningful to scroll

            let scrollPos = 0;
            let phase: 'down' | 'pause' | 'up' | 'done' = 'down';
            const SPEED_DOWN = 0.6;  // px per frame (~36px/s at 60fps) — slow & gentle
            const SPEED_UP = 1.2;    // px per frame — a bit faster going back up

            const step = () => {
                if (cancelled) return;

                if (phase === 'down') {
                    scrollPos += SPEED_DOWN;
                    if (scrollPos >= maxScroll) {
                        scrollPos = maxScroll;
                        scrollEl.scrollTop = scrollPos;
                        phase = 'pause';
                        // Pause at the bottom for 800ms before scrolling back
                        setTimeout(() => {
                            if (!cancelled) {
                                phase = 'up';
                                rafId = requestAnimationFrame(step);
                            }
                        }, 800);
                        return;
                    }
                    scrollEl.scrollTop = scrollPos;
                    rafId = requestAnimationFrame(step);
                } else if (phase === 'up') {
                    scrollPos -= SPEED_UP;
                    if (scrollPos <= 0) {
                        scrollPos = 0;
                        scrollEl.scrollTop = 0;
                        phase = 'done';
                        return; // Finished — only once
                    }
                    scrollEl.scrollTop = scrollPos;
                    rafId = requestAnimationFrame(step);
                }
            };

            rafId = requestAnimationFrame(step);
        }, 1200); // 1.2s delay so content settles first

        // If user touches the modal, cancel auto-scroll immediately
        const onTouch = () => {
            cancelled = true;
            cancelAnimationFrame(rafId);
        };
        scrollEl.addEventListener('touchstart', onTouch, { once: true, passive: true });

        return () => {
            cancelled = true;
            clearTimeout(startDelay);
            cancelAnimationFrame(rafId);
            scrollEl.removeEventListener('touchstart', onTouch);
        };
    }, [activeTab, isOpen]);

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

        // Only block touches that are OUTSIDE the modal (background/backdrop)
        const preventTouch = (e: TouchEvent) => {
            if (modalRef.current && modalRef.current.contains(e.target as Node)) {
                return; // Allow scrolling inside the modal
            }
            e.preventDefault();
        };

        // Lock CSS completely
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overscrollBehavior = 'none';

        // Add passive: false to ensure preventDefault works
        document.addEventListener('touchmove', preventTouch, { passive: false });

        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            document.body.style.overscrollBehavior = '';
            document.removeEventListener('touchmove', preventTouch);
        };
    }, [isOpen]);

    // ResizeObserver to track content height changes
    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;

        let rafId: number;
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                if (el) {
                    const h = el.scrollHeight;
                    if (h > 0) setContentHeight(prev => prev !== h ? h : prev);
                }
            });
        });

        observer.observe(el);
        // Also observe all direct children so we catch AnimatePresence swaps
        Array.from(el.children).forEach(child => observer.observe(child));

        return () => {
            cancelAnimationFrame(rafId);
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
                        <div className="text-center flex-shrink-0 mb-2">
                            <p className="text-2xl sm:text-3xl lg:text-4xl font-light text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
                                Your eLMS is now{" "}
                                <DiaText
                                    repeat
                                    repeatDelay={1.1}
                                    text={["cleaner.", "faster.", "smarter."]}
                                    className="font-bold"
                                />
                            </p>
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
                        className="space-y-6"
                        style={{ willChange: 'transform, opacity' }}
                    >
                        <div className="text-center space-y-2 mb-8">
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Exciting New Tools</h3>
                            <p className="text-slate-500 dark:text-slate-400">Discover the new interactive widgets we've added to boost your productivity.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { title: "Streak Tracking", desc: "Stay motivated by tracking your consecutive study days.", icon: Sparkles, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30", border: "hover:border-orange-200 dark:hover:border-orange-800/50" },
                                { title: "Interactive Widgets", desc: "Live weather and dynamic study goals right on your dashboard.", icon: Rocket, color: "text-indigo-500", bg: "bg-indigo-100 dark:bg-indigo-900/30", border: "hover:border-indigo-200 dark:hover:border-indigo-800/50" }
                            ].map((feat, i) => (
                                <div key={i} className={`flex items-center gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 transition-all cursor-pointer ${feat.border}`}>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${feat.bg} ${feat.color}`}>
                                        <feat.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-700 dark:text-slate-200">{feat.title}</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{feat.desc}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                                </div>
                            ))}
                        </div>
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
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 sm:bg-slate-900/40 backdrop-blur-sm sm:backdrop-blur-md"
                        style={{ willChange: 'opacity' }}
                    />

                    {/* Modal Content */}
                    <motion.div
                        ref={modalRef}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
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
                                                <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none absolute -bottom-10 translate-y-2 group-hover:translate-y-0 text-[10px] sm:text-[11px] tracking-wide text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md shadow-md border border-slate-100 dark:border-slate-700 font-bold whitespace-nowrap z-50">
                                                    {tab.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Content Area — CSS height transition */}
                            <div 
                                className="overflow-hidden hide-scrollbar"
                                style={{ 
                                    height: contentHeight > 0 ? `${contentHeight}px` : 'auto',
                                    transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                    willChange: 'height',
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
