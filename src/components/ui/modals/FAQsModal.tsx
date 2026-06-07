/**
 * FAQs Modal - Minimalistic Design
 * Accordion-style FAQ with search and category tabs
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { getStudentId } from '../../../services/databaseService';

interface FAQsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
}

const BLUE = '#3b82f6';

const categories = ['All', 'Account', 'Courses', 'Tools', 'Progress', 'Technical'];

const faqs: FAQ[] = [
    {
        id: 'reset-password',
        question: 'How do I reset my password?',
        answer: 'Go to Settings > Account > Change Password. Enter your current password and your new password twice to confirm. If you forgot your password, click "Forgot Password" on the login page to receive a reset link via email.',
        category: 'Account',
    },
    {
        id: 'update-profile',
        question: 'How can I update my profile information?',
        answer: 'Navigate to Settings > Profile. Here you can update your name, profile picture, email, and other personal information. Changes are saved automatically.',
        category: 'Account',
    },
    {
        id: 'add-course',
        question: 'How do I add a new course?',
        answer: 'Click the "+" button on your dashboard or go to Courses > Add Course. Enter the course name, select a color, and optionally add a description. You can also upload course materials immediately.',
        category: 'Courses',
    },
    {
        id: 'upload-materials',
        question: 'What file types can I upload?',
        answer: 'You can upload PDF, DOCX, DOC, TXT, and image files (PNG, JPG, JPEG). Maximum file size is 25MB per file. For larger files, consider compressing them or splitting into multiple documents.',
        category: 'Courses',
    },
    {
        id: 'grammar-checker',
        question: 'How does the Grammar Checker work?',
        answer: 'The Grammar Checker analyzes your text for spelling, grammar, punctuation, and style issues. Simply paste your text or upload a document, and it will highlight errors with suggestions for corrections. Click on any highlighted issue to see the suggestion and apply the fix.',
        category: 'Tools',
    },
    {
        id: 'citation-formats',
        question: 'What citation formats are supported?',
        answer: 'We support APA 7th Edition, MLA 9th Edition, Chicago 17th Edition, Harvard, IEEE, and Vancouver formats. You can switch between formats at any time, and your citations will be automatically reformatted.',
        category: 'Tools',
    },
    {
        id: 'paraphraser-modes',
        question: 'What are the different paraphraser modes?',
        answer: 'We offer Standard (balanced rewriting), Fluency (improves readability), Formal (academic tone), Creative (more varied vocabulary), and Expand/Shorten modes. Each mode is optimized for different use cases.',
        category: 'Tools',
    },
    {
        id: 'study-streak',
        question: 'How do study streaks work?',
        answer: 'Your streak increases each day you log in and study for at least 5 minutes. The streak resets if you miss a day. Maintaining streaks earns you achievement badges and helps build consistent study habits.',
        category: 'Progress',
    },
    {
        id: 'grade-prediction',
        question: 'How accurate are grade predictions?',
        answer: 'Grade predictions are based on your study time, assignment completion, quiz scores, and historical performance. While not guaranteed, they provide a helpful estimate. The more data you provide, the more accurate predictions become.',
        category: 'Progress',
    },
    {
        id: 'offline-access',
        question: 'Can I use the platform offline?',
        answer: 'Currently, an internet connection is required for most features. However, you can download your course materials for offline viewing. We are working on expanded offline capabilities for future updates.',
        category: 'Technical',
    },
    {
        id: 'browser-support',
        question: 'Which browsers are supported?',
        answer: 'We support the latest versions of Chrome, Firefox, Safari, and Edge. For the best experience, we recommend using Chrome or Firefox. Internet Explorer is not supported.',
        category: 'Technical',
    },
    {
        id: 'data-privacy',
        question: 'How is my data protected?',
        answer: 'Your data is encrypted both in transit and at rest. We never share your personal information with third parties without consent. You can export or delete your data at any time from Settings > Privacy.',
        category: 'Account',
    },
];


// SVG Icons
const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
    </svg>
);



// Category Icons - Minimalistic SVG icons for each filter


const ChevronIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
    <motion.svg 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
        <polyline points="6 9 12 15 18 9" />
    </motion.svg>
);

// Lord Icon Question Mark Component
const QuestionLordIcon: React.FC<{ size?: number; isOpen?: boolean }> = ({ size = 20, isOpen = false }) => (
    // @ts-ignore
    <lord-icon
        src="https://cdn.lordicon.com/biqqsrac.json"
        trigger="hover"
        state="hover-help-center-2"
        colors={isOpen ? "primary:#ffffff,secondary:#ffffff" : `primary:${BLUE},secondary:${BLUE}`}
        style={{ width: `${size}px`, height: `${size}px` }}
    />
);

// Search Loading Spinner Component
const SearchSpinner: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        style={{
            position: 'absolute',
            right: '14px',
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}
    >
        <motion.svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ display: 'block' }}
        >
            <circle
                cx="12"
                cy="12"
                r="10"
                stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
                strokeWidth="3"
            />
            <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke={BLUE}
                strokeWidth="3"
                strokeLinecap="round"
            />
        </motion.svg>
    </motion.div>
);

/// FAQ Skeleton Loading Component
const FAQSkeleton: React.FC<{ isDarkMode: boolean; index: number }> = ({ isDarkMode, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ delay: index * 0.05 }}
        style={{
            background: isDarkMode ? '#1e293b' : '#ffffff',
            borderRadius: '20px',
            padding: '20px',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Icon skeleton */}
            <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '16px',
                    background: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                    flexShrink: 0
                }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Category badge skeleton */}
                <motion.div
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                    style={{
                        width: '70px',
                        height: '20px',
                        borderRadius: '6px',
                        background: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                        marginBottom: '6px',
                    }}
                />
                {/* Question text skeleton */}
                <motion.div
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                    style={{
                        width: `${60 + (index % 3) * 15}%`,
                        height: '20px',
                        borderRadius: '6px',
                        background: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                    }}
                />
            </div>
            {/* Chevron skeleton */}
            <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    flexShrink: 0,
                    marginLeft: '8px'
                }}
            />
        </div>
    </motion.div>
);

// Unread Badge Component
const UnreadBadge: React.FC<{ count: number }> = ({ count }) => (
    <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 border-[2.5px] border-white dark:border-zinc-900 text-white text-[11px] font-bold flex items-center justify-center shadow-md z-20"
    >
        {count > 9 ? '9+' : count}
    </motion.div>
);

// New FAQ IDs - these are the FAQs that show the "NEW" badge
const NEW_FAQ_IDS = ['grammar-checker', 'paraphraser-modes', 'grade-prediction'];

// FAQ Item Component
const FAQItem: React.FC<{
    faq: FAQ;
    index: number;
    isOpen: boolean;
    isDarkMode: boolean;
    isNew?: boolean;
    onToggle: () => void;
    onMarkAsRead?: () => void;
}> = ({ faq, index, isOpen, isDarkMode, isNew, onToggle, onMarkAsRead }) => {
    const handleClick = () => {
        onToggle();
        // Mark as read when clicking on a new FAQ
        if (isNew && onMarkAsRead) {
            onMarkAsRead();
        }
    };

    return (
    <motion.div
        layout
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ delay: index * 0.03, type: 'spring', damping: 25, stiffness: 300 }}
        className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[20px] transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 group"
    >
        {/* SaaS Background Accents */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/[0.03] rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

        {/* Question header */}
        <motion.button
            onClick={handleClick}
            whileHover={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}
            className="w-full flex items-center gap-5 p-5 bg-transparent border-none cursor-pointer text-left focus:outline-none relative z-10"
        >
            <motion.div 
                whileHover={{ scale: 1.05, rotate: -5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className={`w-12 h-12 rounded-[16px] flex items-center justify-center flex-shrink-0 transition-all duration-300 relative z-10 ${isOpen ? 'shadow-md' : 'shadow-sm'}`}
                style={{
                    background: isOpen ? BLUE : isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
                    border: `1px solid ${isOpen ? BLUE : isDarkMode ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe'}`,
                    color: isOpen ? '#ffffff' : BLUE,
                }}
            >
                <AnimatePresence>
                    {isNew && <UnreadBadge count={1} />}
                </AnimatePresence>
                <QuestionLordIcon size={22} isOpen={isOpen} />
            </motion.div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="inline-block px-2 py-0.5 rounded-[6px] bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 text-[10.5px] font-bold uppercase tracking-wider">
                        {faq.category}
                    </span>
                    <AnimatePresence>
                        {isNew && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                                className="inline-block px-2 py-0.5 rounded-[6px] bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400 text-[10.5px] font-bold uppercase tracking-wider"
                            >
                                NEW
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
                <h3 className="m-0 text-[15px] font-bold text-zinc-900 dark:text-zinc-100 leading-snug tracking-tight">
                    {faq.question}
                </h3>
            </div>
            <motion.div 
                animate={{ color: isOpen ? BLUE : isDarkMode ? '#64748b' : '#94a3b8' }}
                className="flex-shrink-0 ml-2"
            >
                <ChevronIcon isOpen={isOpen} />
            </motion.div>
        </motion.button>

        {/* Answer content */}
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                >
                    <div className="px-5 pb-5 pl-[84px]">
                        <div className="bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 rounded-[14px] p-4">
                            <motion.p
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="m-0 text-[13.5px] leading-[1.75] text-zinc-600 dark:text-zinc-400"
                            >
                                {faq.answer}
                            </motion.p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
    );
};


// Helper functions for read FAQs persistence
const STORAGE_KEY = 'read_faqs';

const loadReadFAQsFromStorage = (): string[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const saveReadFAQsToStorage = (readFAQs: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readFAQs));
};

const saveReadFAQsToSupabase = async (readFAQs: string[]) => {
    if (!isSupabaseConfigured() || !supabase) return;
    
    try {
        const studentId = getStudentId();
        await supabase
            .from('student_stats')
            .upsert({
                student_id: studentId,
                read_faqs: readFAQs,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'student_id',
            });
    } catch (err) {
        console.error('[FAQ] Failed to save read FAQs to Supabase:', err);
    }
};

const loadReadFAQsFromSupabase = async (): Promise<string[]> => {
    if (!isSupabaseConfigured() || !supabase) return [];
    
    try {
        const studentId = getStudentId();
        const { data, error } = await supabase
            .from('student_stats')
            .select('read_faqs')
            .eq('student_id', studentId)
            .single();
        
        if (error || !data?.read_faqs) return [];
        return data.read_faqs as string[];
    } catch {
        return [];
    }
};

const FAQsModal: React.FC<FAQsModalProps> = ({ isOpen, onClose }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => document.body.classList.contains('dark-mode'));
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [openFAQ, setOpenFAQ] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [readFAQs, setReadFAQs] = useState<string[]>(() => loadReadFAQsFromStorage());
    
    // Auto-minimizing footer state
    const [isMinimized, setIsMinimized] = useState(false);
    const lastScrollY = useRef(0);
    const scrollDirection = useRef<'up' | 'down' | null>(null);
    const anchorScrollY = useRef(0);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const currentScrollY = e.currentTarget.scrollTop;
        
        // Handle iOS rubber banding / top of scroll
        if (currentScrollY <= 10) {
            setIsMinimized(false);
            lastScrollY.current = currentScrollY;
            scrollDirection.current = null;
            anchorScrollY.current = currentScrollY;
            return;
        }

        const delta = currentScrollY - lastScrollY.current;
        
        if (delta > 0) {
            // Scrolling down
            if (scrollDirection.current !== 'down') {
                scrollDirection.current = 'down';
                anchorScrollY.current = lastScrollY.current;
            }
            
            // If we have scrolled down by more than 30px from the anchor, minimize
            if (currentScrollY - anchorScrollY.current > 30) {
                setIsMinimized(true);
            }
        } else if (delta < 0) {
            // Scrolling up
            if (scrollDirection.current !== 'up') {
                scrollDirection.current = 'up';
                anchorScrollY.current = lastScrollY.current;
            }
            // Do not expand just by scrolling up. Only expand at the very top.
        }

        lastScrollY.current = currentScrollY;
    }, []);

    // Load read FAQs from Supabase on mount
    useEffect(() => {
        const loadFromSupabase = async () => {
            const supabaseReadFAQs = await loadReadFAQsFromSupabase();
            if (supabaseReadFAQs.length > 0) {
                // Merge with local storage (in case of offline changes)
                const merged = [...new Set([...readFAQs, ...supabaseReadFAQs])];
                setReadFAQs(merged);
                saveReadFAQsToStorage(merged);
            }
        };
        loadFromSupabase();
    }, []);

    // Mark FAQ as read
    const markFAQAsRead = useCallback((faqId: string) => {
        if (readFAQs.includes(faqId)) return;
        
        const newReadFAQs = [...readFAQs, faqId];
        setReadFAQs(newReadFAQs);
        saveReadFAQsToStorage(newReadFAQs);
        saveReadFAQsToSupabase(newReadFAQs);
    }, [readFAQs]);

    // Calculate unread count for header badge
    const unreadCount = useMemo(() => {
        return NEW_FAQ_IDS.filter(id => !readFAQs.includes(id)).length;
    }, [readFAQs]);

    useEffect(() => {
        const checkDarkMode = () => setIsDarkMode(document.body.classList.contains('dark-mode'));
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setActiveCategory('All');
            setOpenFAQ(null);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Loading state for search and category switching
    useEffect(() => {
        if (!isOpen) return;
        setIsSearching(true);
        const timer = setTimeout(() => {
            setIsSearching(false);
        }, 350); // Short delay for smooth skeleton transition
        return () => clearTimeout(timer);
    }, [searchQuery, activeCategory, isOpen]);

    const filteredFAQs = useMemo(() => {
        return faqs.filter(f => {
            const matchesSearch = f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  f.answer.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'All' || f.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, activeCategory]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99998,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                }}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: isDarkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(12px)',
                        }}
                    />

                    {/* Modal */}
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ 
                            type: 'spring', 
                            damping: 28, 
                            stiffness: 350,
                            layout: { type: 'spring', damping: 25, stiffness: 200 }
                        }}
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '640px',
                            height: '85vh',
                            maxHeight: '800px',
                            background: isDarkMode ? '#0f172a' : '#f8fafc',
                            borderRadius: '20px',
                            boxShadow: isDarkMode 
                                ? '0 25px 80px rgba(0, 0, 0, 0.6)' 
                                : '0 25px 80px rgba(0, 0, 0, 0.2)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {/* Header */}
                        <motion.div 
                            animate={{
                                padding: isMinimized ? '12px 16px' : '24px 24px 8px 24px'
                            }}
                            className="relative border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-t-[20px]"
                        >
                            <motion.div 
                                animate={{ marginBottom: isMinimized ? '0px' : '24px' }}
                                className="flex items-start gap-3 sm:gap-4"
                            >
                                {/* Student Tools Style Header Card */}
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ 
                                        opacity: 1, 
                                        y: 0,
                                        padding: isMinimized ? '12px 16px' : '24px',
                                        gap: isMinimized ? '16px' : '24px'
                                    }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
                                    className="flex-1 relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[20px] sm:rounded-[24px] flex items-center group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 text-left"
                                >
                                    {/* SaaS Background Accents */}
                                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

                                    <motion.div
                                        animate={{
                                            width: isMinimized ? 40 : 64,
                                            height: isMinimized ? 40 : 64,
                                            borderRadius: isMinimized ? 12 : 20
                                        }}
                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                        className="bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm text-blue-600 dark:text-blue-400 relative z-10"
                                    >
                                        <div className="hidden sm:flex">
                                            <QuestionLordIcon size={32} />
                                        </div>
                                        <div className="flex sm:hidden">
                                            <QuestionLordIcon size={24} />
                                        </div>
                                        <AnimatePresence>
                                            {unreadCount > 0 && (
                                                <UnreadBadge count={unreadCount} />
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                    
                                    <div className="relative z-10 flex-1 min-w-0 pr-2 sm:pr-4">
                                        <motion.h2 
                                            animate={{ fontSize: isMinimized ? '16px' : '26px' }}
                                            className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight m-0 mb-0.5 sm:mb-1 truncate"
                                        >
                                            Frequently Asked Questions
                                        </motion.h2>
                                        <motion.p 
                                            animate={{ fontSize: isMinimized ? '12px' : '14.5px' }}
                                            className="text-zinc-600 dark:text-zinc-400 leading-relaxed m-0"
                                        >
                                            {filteredFAQs.length} question{filteredFAQs.length !== 1 ? 's' : ''} found
                                        </motion.p>
                                    </div>
                                    <div className="relative z-20 self-start">
                                        <motion.button
                                            onClick={onClose}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="flex-shrink-0 flex items-center justify-center rounded-lg sm:rounded-xl border border-zinc-200/80 bg-white/80 backdrop-blur-md p-2 text-zinc-500 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700/80 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                            aria-label="Close modal"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </motion.button>
                                    </div>
                                </motion.div>
                            </motion.div>

                            <AnimatePresence>
                                {!isMinimized && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div style={{ paddingBottom: '4px' }}>


                            {/* Search bar */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                style={{
                                    position: 'relative',
                                    marginBottom: '14px',
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    left: '14px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: isDarkMode ? '#64748b' : '#94a3b8',
                                    pointerEvents: 'none',
                                }}>
                                    <SearchIcon />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search questions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 44px 12px 44px',
                                        borderRadius: '12px',
                                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#ffffff',
                                        color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s, box-shadow 0.2s',
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = BLUE;
                                        e.target.style.boxShadow = `0 0 0 3px ${BLUE}20`;
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                                <AnimatePresence>
                                    {isSearching && <SearchSpinner isDarkMode={isDarkMode} />}
                                </AnimatePresence>
                            </motion.div>

                            {/* Category tabs */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="flex items-center bg-[#f8fafc] dark:bg-zinc-800/40 rounded-[14px] p-[5px] gap-1 border border-[#e2e8f0] dark:border-zinc-700/60"
                            >
                                {categories.map((cat) => {
                                    const isActive = activeCategory === cat;
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            className={`relative flex-1 py-2 px-3 rounded-[10px] text-[13px] font-bold whitespace-nowrap cursor-pointer transition-colors duration-200 z-10 ${
                                                isActive
                                                    ? 'text-[#2563eb] dark:text-blue-400'
                                                    : 'text-[#64748b] dark:text-zinc-400 hover:text-[#475569] dark:hover:text-zinc-300'
                                            }`}
                                            style={{
                                                WebkitTapHighlightColor: 'transparent',
                                                background: 'transparent',
                                                border: 'none',
                                                outline: 'none',
                                            }}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeTabIndicator"
                                                    className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-[10px] border border-[#e2e8f0]/80 dark:border-zinc-600 shadow-[0_2px_4px_rgba(0,0,0,0.02)] -z-10"
                                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                                />
                                            )}
                                            <span className="relative z-10">{cat}</span>
                                        </button>
                                    );
                                })}
                                        </motion.div>
                                    </div>
                                </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>


                        {/* FAQ List */}
                        <div 
                            onScroll={handleScroll}
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '20px 24px',
                            }}
                        >
                            <AnimatePresence mode="wait">
                                {isSearching ? (
                                    /* Loading Skeletons */
                                    <motion.div
                                        key="skeletons"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '12px',
                                        }}
                                    >
                                        {[0, 1, 2, 3].map((i) => (
                                            <FAQSkeleton key={`skeleton-${i}`} isDarkMode={isDarkMode} index={i} />
                                        ))}
                                    </motion.div>
                                ) : filteredFAQs.length > 0 ? (
                                    <motion.div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '12px',
                                        }}
                                    >
                                        {filteredFAQs.map((faq, index) => (
                                            <FAQItem
                                                key={faq.id}
                                                faq={faq}
                                                index={index}
                                                isOpen={openFAQ === faq.id}
                                                isDarkMode={isDarkMode}
                                                isNew={NEW_FAQ_IDS.includes(faq.id) && !readFAQs.includes(faq.id)}
                                                onToggle={() => setOpenFAQ(openFAQ === faq.id ? null : faq.id)}
                                                onMarkAsRead={() => markFAQAsRead(faq.id)}
                                            />
                                        ))}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                        className="relative overflow-hidden w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-8 flex flex-col items-center justify-center text-center group transition-all duration-300 hover:shadow-md"
                                    >
                                        {/* SaaS Accents */}
                                        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-28 h-28 bg-zinc-500/5 dark:bg-zinc-500/5 rounded-full blur-2xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                        
                                        {/* Tinted Search Icon Box */}
                                        <motion.div
                                            whileHover={{ scale: 1.05, rotate: -5 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                            className="w-16 h-16 rounded-[20px] bg-zinc-50 border border-zinc-200/60 dark:bg-zinc-800/30 dark:border-zinc-850/50 flex items-center justify-center flex-shrink-0 shadow-sm text-zinc-400 dark:text-zinc-500 relative z-10 mb-4"
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="11" cy="11" r="8" />
                                                <path d="m21 21-4.35-4.35" />
                                            </svg>
                                        </motion.div>
                                        
                                        {/* Title & Description with premium typography */}
                                        <div className="relative z-10">
                                            <h3 className="text-[17px] font-extrabold text-zinc-800 dark:text-zinc-200 tracking-tight m-0 mb-1 leading-snug">
                                                No Questions Found
                                            </h3>
                                            <p className="text-[13.5px] text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed m-0 max-w-sm">
                                                Try adjusting your search query or selecting a different category filter tab above.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ 
                                opacity: 1,
                                padding: isMinimized ? '8px' : '16px',
                                paddingTop: isMinimized ? '4px' : '4px'
                            }}
                            transition={{ delay: 0.3 }}
                            className="border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-[20px]"
                        >
                            <motion.div
                                animate={{
                                    padding: isMinimized ? '8px 12px' : '16px',
                                    gap: isMinimized ? '10px' : '16px'
                                }}
                                whileHover={{ scale: 1.01 }}
                                className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[20px] flex items-center group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 text-left"
                            >
                                {/* SaaS Background Accents */}
                                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-24 h-24 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

                                {/* Icon Container */}
                                <motion.div
                                    animate={{
                                        width: isMinimized ? 36 : 44,
                                        height: isMinimized ? 36 : 44,
                                        borderRadius: isMinimized ? 12 : 14
                                    }}
                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                    className="bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm text-blue-600 dark:text-blue-400 relative z-10"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                </motion.div>

                                {/* Text Area */}
                                <div className="relative z-10 flex-1">
                                    <motion.h3 
                                        animate={{ fontSize: isMinimized ? '14.5px' : '16px' }}
                                        className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight m-0"
                                        style={{ marginBottom: isMinimized ? '0px' : '2px' }}
                                    >
                                        Still need help?
                                    </motion.h3>
                                    <AnimatePresence>
                                        {!isMinimized && (
                                            <motion.p 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed m-0 pr-2"
                                            >
                                                Can't find what you're looking for? Contact our support team.
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Action Button */}
                                <div className="relative z-10 flex-shrink-0">
                                    <motion.button
                                        animate={{
                                            padding: isMinimized ? '6px 12px' : '8px 16px',
                                            fontSize: isMinimized ? '12px' : '13px'
                                        }}
                                        whileHover={{ scale: 1.05, boxShadow: `0 6px 20px ${BLUE}30` }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: BLUE,
                                            color: '#ffffff',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            boxShadow: `0 4px 12px ${BLUE}25`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                        }}
                                    >
                                        Contact Support
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default FAQsModal;