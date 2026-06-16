import React, { useState, useEffect } from 'react';
import { Sparkles, LayoutDashboard, X, Rocket, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollReelTestimonials } from '../components/ui/scroll-reel-testimonials';
import { AdvantagesBento } from '../components/ui/advantages-bento';
import HoverBrandLogo from '../components/ui/hover-brand-logo';
import { DiaText } from '../components/ui/dia-text';

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
    { id: 'changes', label: 'Changes', icon: LayoutDashboard },
    { id: 'advantages', label: 'Advantages', icon: ShieldCheck },
    { id: 'features', label: 'New Features', icon: Rocket },
];

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('changes');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const renderContent = () => {
        switch (activeTab) {
            case 'changes':
                return (
                    <motion.div 
                        key="changes"
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full h-full flex flex-col items-center gap-2 md:gap-4"
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
                        <div className="w-full flex-1 min-h-0 flex items-center justify-center">
                            <ScrollReelTestimonials testimonials={CHANGES_TESTIMONIALS} className="w-full h-full max-h-[300px] md:max-h-[380px]" />
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
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full h-full"
                    >
                        <AdvantagesBento />
                    </motion.div>
                );
            case 'features':
                return (
                    <motion.div 
                        key="features"
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
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
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                        className="relative w-full max-w-4xl lg:max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 flex flex-col max-h-[90vh] min-h-[500px] lg:min-h-[700px]"
                    >
                        {/* Close Button */}
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors z-20"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-6 sm:p-10 flex flex-col flex-1 overflow-hidden pt-12 sm:pt-14">
                            {/* Tabs */}
                            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit mx-auto flex-shrink-0">
                                {TABS.map(tab => {
                                    const isActive = activeTab === tab.id;
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`relative flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                                                isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                            }`}
                                        >
                                            {isActive && (
                                                <motion.div 
                                                    layoutId="welcome-tab-indicator"
                                                    className="absolute inset-0 bg-white dark:bg-slate-700 shadow-sm rounded-xl"
                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                />
                                            )}
                                            <span className="relative z-10 flex items-center gap-2">
                                                <Icon className="w-4 h-4" />
                                                <span className="hidden sm:inline">{tab.label}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <AnimatePresence mode="wait">
                                    {renderContent()}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default WelcomeModal;
