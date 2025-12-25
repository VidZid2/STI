/**
 * FAQs Modal - Minimalistic Design
 * Accordion-style FAQ with search and category tabs
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
);

// Category Icons - Minimalistic SVG icons for each filter
const CategoryIcons: Record<string, React.FC<{ size?: number }>> = {
    All: ({ size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    ),
    Account: ({ size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
        </svg>
    ),
    Courses: ({ size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <line x1="8" y1="7" x2="16" y2="7" />
            <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
    ),
    Tools: ({ size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
    ),
    Progress: ({ size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="20" x2="12" y2="10" />
            <line x1="18" y1="20" x2="18" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    ),
    Technical: ({ size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
};

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
const QuestionLordIcon: React.FC<{ size?: number; isOpen?: boolean; isHeader?: boolean }> = ({ size = 20, isOpen = false, isHeader = false }) => (
    // @ts-ignore
    <lord-icon
        src="https://cdn.lordicon.com/biqqsrac.json"
        trigger={isHeader ? "hover" : "hover"}
        state="hover-help-center-2"
        colors={isOpen || isHeader ? "primary:#ffffff,secondary:#ffffff" : `primary:${BLUE},secondary:${BLUE}`}
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

// FAQ Skeleton Loading Component
const FAQSkeleton: React.FC<{ isDarkMode: boolean; index: number }> = ({ isDarkMode, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ delay: index * 0.05 }}
        style={{
            background: isDarkMode ? '#1e293b' : '#ffffff',
            borderRadius: '14px',
            padding: '14px 16px',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Icon skeleton */}
            <motion.div
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: isDarkMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
                }}
            />
            <div style={{ flex: 1 }}>
                {/* Category badge skeleton */}
                <motion.div
                    animate={{ opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                    style={{
                        width: '60px',
                        height: '14px',
                        borderRadius: '4px',
                        background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        marginBottom: '8px',
                    }}
                />
                {/* Question text skeleton */}
                <motion.div
                    animate={{ opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                    style={{
                        width: `${70 + (index % 3) * 10}%`,
                        height: '16px',
                        borderRadius: '4px',
                        background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                    }}
                />
            </div>
            {/* Chevron skeleton */}
            <motion.div
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
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
        style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            minWidth: '18px',
            height: '18px',
            padding: '0 5px',
            borderRadius: '9px',
            background: '#ef4444',
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
        }}
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
        style={{
            background: isDarkMode ? '#1e293b' : '#ffffff',
            borderRadius: '14px',
            overflow: 'hidden',
            border: `1px solid ${isOpen 
                ? BLUE + '40' 
                : isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            boxShadow: isOpen 
                ? `0 4px 20px ${BLUE}15` 
                : isDarkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
        }}
    >
        {/* Question header */}
        <motion.button
            onClick={handleClick}
            whileHover={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}
            style={{
                width: '100%',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
            }}
        >
            <motion.div 
                animate={{ 
                    background: isOpen ? BLUE : isDarkMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
                    color: isOpen ? '#ffffff' : BLUE,
                }}
                transition={{ duration: 0.2 }}
                style={{
                    position: 'relative',
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                <AnimatePresence>
                    {isNew && <UnreadBadge count={1} />}
                </AnimatePresence>
                <QuestionLordIcon size={20} isOpen={isOpen} />
            </motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                        display: 'inline-block',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: `${BLUE}12`,
                        color: BLUE,
                        fontSize: '9px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                    }}>
                        {faq.category}
                    </span>
                    <AnimatePresence>
                        {isNew && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: '#ef444420',
                                    color: '#ef4444',
                                    fontSize: '9px',
                                    fontWeight: 600,
                                }}
                            >
                                NEW
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
                <h3 style={{
                    margin: 0,
                    fontSize: '13px',
                    fontWeight: 600,
                    color: isDarkMode ? '#f1f5f9' : '#0f172a',
                    lineHeight: 1.4,
                }}>
                    {faq.question}
                </h3>
            </div>
            <motion.div 
                animate={{ color: isOpen ? BLUE : isDarkMode ? '#64748b' : '#94a3b8' }}
                style={{ flexShrink: 0 }}
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
                    <div style={{
                        padding: '0 16px 16px 62px',
                    }}>
                        <motion.p
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            style={{
                                margin: 0,
                                fontSize: '13px',
                                lineHeight: 1.7,
                                color: isDarkMode ? '#94a3b8' : '#64748b',
                            }}
                        >
                            {faq.answer}
                        </motion.p>
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

    // Debounced search with loading state
    useEffect(() => {
        if (searchQuery) {
            setIsSearching(true);
            const timer = setTimeout(() => {
                setIsSearching(false);
            }, 400); // Short delay for smooth UX
            return () => clearTimeout(timer);
        } else {
            setIsSearching(false);
        }
    }, [searchQuery]);

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
                            maxHeight: '85vh',
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
                        <div style={{
                            padding: '20px 24px 16px',
                            borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                            background: isDarkMode ? '#1e293b' : '#ffffff',
                        }}>
                            {/* Title row */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', delay: 0.1 }}
                                        style={{
                                            position: 'relative',
                                            width: '42px',
                                            height: '42px',
                                            borderRadius: '12px',
                                            background: BLUE,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#ffffff',
                                            boxShadow: `0 4px 12px ${BLUE}40`,
                                        }}
                                    >
                                        <QuestionLordIcon size={24} isHeader={true} />
                                        <AnimatePresence>
                                            {unreadCount > 0 && <UnreadBadge count={unreadCount} />}
                                        </AnimatePresence>
                                    </motion.div>
                                    <div>
                                        <h2 style={{
                                            margin: 0,
                                            fontSize: '18px',
                                            fontWeight: 700,
                                            color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                        }}>
                                            Frequently Asked Questions
                                        </h2>
                                        <p style={{
                                            margin: '2px 0 0',
                                            fontSize: '12px',
                                            color: isDarkMode ? '#64748b' : '#94a3b8',
                                        }}>
                                            {filteredFAQs.length} question{filteredFAQs.length !== 1 ? 's' : ''} found
                                        </p>
                                    </div>
                                </div>
                                <motion.button
                                    onClick={onClose}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: isDarkMode ? '#94a3b8' : '#64748b',
                                    }}
                                >
                                    <CloseIcon />
                                </motion.button>
                            </div>


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
                                style={{
                                    display: 'flex',
                                    gap: '8px',
                                    overflowX: 'auto',
                                    paddingBottom: '4px',
                                }}
                            >
                                {categories.map((cat, i) => {
                                    const IconComponent = CategoryIcons[cat];
                                    const isActive = activeCategory === cat;
                                    return (
                                        <motion.button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.1 + i * 0.03 }}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            style={{
                                                padding: '8px 14px',
                                                borderRadius: '10px',
                                                border: 'none',
                                                background: isActive 
                                                    ? BLUE 
                                                    : isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                                color: isActive 
                                                    ? '#ffffff' 
                                                    : isDarkMode ? '#94a3b8' : '#64748b',
                                                fontSize: '12px',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap',
                                                boxShadow: isActive ? `0 4px 12px ${BLUE}30` : 'none',
                                                transition: 'background 0.2s, color 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                            }}
                                        >
                                            <motion.span
                                                initial={false}
                                                animate={{ 
                                                    scale: isActive ? 1.1 : 1,
                                                    rotate: isActive ? [0, -10, 10, 0] : 0,
                                                }}
                                                transition={{ 
                                                    scale: { duration: 0.2 },
                                                    rotate: { duration: 0.4, ease: 'easeInOut' }
                                                }}
                                                style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                {IconComponent && <IconComponent size={14} />}
                                            </motion.span>
                                            {cat}
                                        </motion.button>
                                    );
                                })}
                            </motion.div>
                        </div>


                        {/* FAQ List */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '20px 24px',
                        }}>
                            <AnimatePresence mode="popLayout">
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
                                        layout
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
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            textAlign: 'center',
                                            padding: '60px 20px',
                                        }}
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', delay: 0.1 }}
                                            style={{
                                                width: '64px',
                                                height: '64px',
                                                margin: '0 auto 16px',
                                                borderRadius: '16px',
                                                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: isDarkMode ? '#475569' : '#cbd5e1',
                                            }}
                                        >
                                            <SearchIcon />
                                        </motion.div>
                                        <h3 style={{
                                            margin: '0 0 8px',
                                            fontSize: '16px',
                                            fontWeight: 600,
                                            color: isDarkMode ? '#94a3b8' : '#64748b',
                                        }}>
                                            No questions found
                                        </h3>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '13px',
                                            color: isDarkMode ? '#64748b' : '#94a3b8',
                                        }}>
                                            Try adjusting your search or filter
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            style={{
                                padding: '16px 24px',
                                borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                                background: isDarkMode ? '#1e293b' : '#ffffff',
                                textAlign: 'center',
                            }}
                        >
                            <p style={{
                                margin: '0 0 10px',
                                fontSize: '13px',
                                color: isDarkMode ? '#64748b' : '#94a3b8',
                            }}>
                                Can't find what you're looking for?
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.02, boxShadow: `0 6px 20px ${BLUE}30` }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: BLUE,
                                    color: '#ffffff',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: `0 4px 12px ${BLUE}25`,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                                Contact Support
                            </motion.button>
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default FAQsModal;