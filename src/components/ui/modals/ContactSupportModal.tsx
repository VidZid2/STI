/**
 * Contact Support Modal - Minimalistic Design
 * Contact form with support options and FAQ quick links
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'motion/react';
import { Send } from 'lucide-react';

const EASE_OUT = [0.32, 0.72, 0, 1] as const;
const SPRING_PANEL = { type: 'spring', bounce: 0, duration: 0.4 } as const;

interface ContactSupportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// SVG Icons
const EmailIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);

const ChatIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const PhoneIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);



const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

interface SupportOption {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    action: string;
    color: string;
}

const supportOptions: SupportOption[] = [
    {
        id: 'email',
        icon: <EmailIcon />,
        title: 'Email Support',
        description: 'Get a response within 24 hours',
        action: 'support@elms-sti.edu.ph',
        color: '#3b82f6',
    },
    {
        id: 'chat',
        icon: <ChatIcon />,
        title: 'Live Chat',
        description: 'Chat with our support team',
        action: 'Start Chat',
        color: '#10b981',
    },
    {
        id: 'phone',
        icon: <PhoneIcon />,
        title: 'Phone Support',
        description: 'Mon-Fri, 8AM-5PM',
        action: '(044) 123-4567',
        color: '#8b5cf6',
    },
];



/// Helper to get corresponding badge content for support options
const getBadgeContent = (id: string) => {
    switch (id) {
        case 'email':
            return {
                label: 'RESPONSE',
                value: '< 24 Hours',
                icon: (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                ),
                badgeBg: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-500/20',
                labelColor: 'text-blue-500/80 dark:text-blue-400/80'
            };
        case 'chat':
            return {
                label: 'STATUS',
                value: 'Online Now',
                icon: (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ),
                badgeBg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-500/20 flex items-center justify-center',
                labelColor: 'text-emerald-500/80 dark:text-emerald-400/80'
            };
        case 'phone':
        default:
            return {
                label: 'HOURS',
                value: '8AM - 5PM',
                icon: (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                ),
                badgeBg: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100/50 dark:border-purple-500/20',
                labelColor: 'text-purple-500/80 dark:text-purple-400/80'
            };
    }
};



const ContactSupportModal: React.FC<ContactSupportModalProps> = ({ isOpen, onClose }) => {
    const reduce = useReducedMotion();
    const enterY = reduce ? 0 : 40;
    const enterScale = reduce ? 1 : 0.97;
    const [isDarkMode, setIsDarkMode] = useState(() => document.body.classList.contains('dark-mode'));
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Auto-minimizing scroll state
    const [isMinimized, setIsMinimized] = useState(false);
    const lastScrollY = useRef(0);
    const scrollDirection = useRef<'up' | 'down' | null>(null);
    const anchorScrollY = useRef(0);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const currentScrollY = e.currentTarget.scrollTop;
        const scrollHeight = e.currentTarget.scrollHeight;
        const clientHeight = e.currentTarget.clientHeight;
        
        // Handle iOS rubber banding / top of scroll
        if (currentScrollY <= 10) {
            setIsMinimized(false);
            lastScrollY.current = currentScrollY;
            scrollDirection.current = null;
            anchorScrollY.current = currentScrollY;
            return;
        }

        // Determine current scrolling direction
        const delta = currentScrollY - lastScrollY.current;
        const isNearBottom = scrollHeight - currentScrollY - clientHeight < 50;
        
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
            
            // If we have scrolled up by more than 30px from the anchor, expand
            // Protect against bottom bounce rubber-banding expanding the header
            if (!isNearBottom && anchorScrollY.current - currentScrollY > 30) {
                setIsMinimized(false);
            }
        }

        lastScrollY.current = currentScrollY;
    }, []);

    useEffect(() => {
        const checkDarkMode = () => setIsDarkMode(document.body.classList.contains('dark-mode'));
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setSubject('');
            setMessage('');
            setIsSubmitted(false);
            setIsMinimized(false);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) return;
        
        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSubmitting(false);
        setIsSubmitted(true);
    };

    const handleOptionClick = (optionId: string) => {
        if (optionId === 'email') {
            window.location.href = 'mailto:support@elms-sti.edu.ph';
        } else if (optionId === 'chat') {
            // Could open a chat widget
            console.log('Opening chat...');
        } else if (optionId === 'phone') {
            window.location.href = 'tel:+63441234567';
        }
    };


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
                        transition={{ duration: 0.2, ease: EASE_OUT }}
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
                            maxWidth: '520px',
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
                                                <motion.div layout="position" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
                            <AnimatePresence mode="popLayout" initial={false}>
                                <motion.div
                                    key="content"
                                    initial={
                                        reduce
                                            ? { opacity: 0 }
                                            : { opacity: 0, y: 8, filter: "blur(4px)" }
                                    }
                                    animate={
                                        reduce
                                            ? {
                                                opacity: 1,
                                                transition: { duration: 0.18, ease: [0.32, 0.72, 0, 1] },
                                            }
                                            : {
                                                opacity: 1,
                                                y: 0,
                                                filter: "blur(0px)",
                                                transition: { duration: 0.24, ease: [0.32, 0.72, 0, 1] },
                                            }
                                    }
                                    exit={
                                        reduce
                                            ? {
                                                opacity: 0,
                                                transition: { duration: 0.14, ease: [0.32, 0.72, 0, 1] },
                                            }
                                            : {
                                                opacity: 0,
                                                y: -8,
                                                filter: "blur(4px)",
                                                transition: { duration: 0.16, ease: [0.32, 0.72, 0, 1] },
                                            }
                                    }
                                    onAnimationComplete={(definition) => {
                                        const el = document.getElementById('settings-content-wrapper');
                                        if (el && definition.opacity === 1) {
                                            el.style.filter = 'none';
                                        }
                                    }}
                                    id="settings-content-wrapper"
                                    className="pointer-events-auto"
                            style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, width: '100%' }}
                        >

                        {/* Header */}
                        <motion.div 
                            animate={{
                                padding: isMinimized ? '12px 16px' : '24px 24px 8px 24px'
                            }}
                            className="relative border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-t-[20px]"
                        >
                            <motion.div 
                                animate={{ marginBottom: isMinimized ? '0px' : '8px' }}
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
                                            <ChatIcon size={isMinimized ? 20 : 32} />
                                        </div>
                                        <div className="flex sm:hidden">
                                            <ChatIcon size={isMinimized ? 20 : 24} />
                                        </div>
                                    </motion.div>
                                    
                                    <div className="relative z-10 flex-1 min-w-0 pr-2 sm:pr-4">
                                        <motion.h2 
                                            animate={{ fontSize: isMinimized ? '16px' : '26px' }}
                                            className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight m-0 mb-0.5 sm:mb-1 truncate"
                                        >
                                            Contact Support
                                        </motion.h2>
                                        <motion.p 
                                            animate={{ fontSize: isMinimized ? '12px' : '14.5px' }}
                                            className="text-zinc-600 dark:text-zinc-400 leading-relaxed m-0 truncate"
                                        >
                                            We're here to help you
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
                        </motion.div>


                        {/* Content */}
                        <div 
                            onScroll={handleScroll}
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '20px 24px',
                            }}
                        >
                            <LayoutGroup>
                                <AnimatePresence mode="wait">
                                    {isSubmitted ? (
                                        /* Success State */
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.9, y: 15 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="relative overflow-hidden w-full max-w-md mx-auto bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] group transition-all duration-300 hover:shadow-md hover:border-emerald-200/80 dark:hover:border-emerald-800/50 text-center flex flex-col items-center justify-center p-8 sm:p-10 my-8"
                                        >
                                            {/* SaaS Background Accents */}
                                            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 bg-emerald-400/10 dark:bg-emerald-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                            
                                            <div className="relative z-10 w-full flex flex-col items-center">
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: 'spring', delay: 0.2 }}
                                                    className="w-20 h-20 mb-5 rounded-[24px] bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-sm"
                                                >
                                                    <CheckIcon className="w-10 h-10" />
                                                </motion.div>
                                                <h3 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                                    Message Sent!
                                                </h3>
                                                <p className="mb-8 text-[14.5px] text-zinc-600 dark:text-zinc-400 font-medium max-w-[250px]">
                                                    We'll get back to you within 24 hours.
                                                </p>
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={onClose}
                                                    className="px-8 py-3 w-full sm:w-auto rounded-[14px] border border-blue-500/10 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-[14px] font-extrabold shadow-[0_4px_14px_rgba(59,130,246,0.35)] transition-all"
                                                >
                                                    Done
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    ) : (

                                        /* Form State */
                                        <motion.div
                                            key="form"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            {/* Support Channels Card (Matches Student Tools Style / UserProfileDropdown) */}
                                             <motion.div
                                                 initial={{ opacity: 0, y: 15 }}
                                                 animate={{ opacity: 1, y: 0 }}
                                                 transition={{ delay: 0.1, type: 'spring', damping: 25, stiffness: 300 }}
                                                 className="relative overflow-hidden w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 text-left mb-6"
                                             >
                                                 {/* SaaS Background Accents */}
                                                 <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                                 <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

                                                 <div className="p-5 sm:p-6 flex flex-col gap-6 relative z-10">
                                                     {/* Header matching Student Tools style */}
                                                     <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 w-full text-center sm:text-left">
                                                         <div className="flex flex-col sm:flex-row items-center gap-4">
                                                             <motion.div
                                                                 whileHover={{ scale: 1.05, rotate: -5 }}
                                                                 transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                                 className="w-14 h-14 rounded-[20px] bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm text-blue-600 dark:text-blue-400"
                                                             >
                                                                 <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                     <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                                 </svg>
                                                             </motion.div>
                                                             <div>
                                                                 <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                                                     Support Channels
                                                                 </h1>
                                                                 <p className="text-[13px] sm:text-[14.5px] text-zinc-650 dark:text-zinc-400 leading-relaxed font-medium">
                                                                     Get in touch with our team via these channels
                                                                 </p>
                                                             </div>
                                                         </div>

                                                         <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-550/10 border border-emerald-100/50 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-450 text-[12px] font-bold shrink-0 shadow-sm">
                                                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                             Online Now
                                                         </div>
                                                     </div>

                                                     {/* Subtle divider before option list */}
                                                     <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800"></div>

                                                     {/* Inner Gray Inset Container matching UserProfileDropdown */}
                                                     <div className="bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-150/60 dark:border-zinc-800/85 rounded-[1rem] p-2 sm:p-3 shadow-inner divide-y divide-zinc-200/50 dark:divide-zinc-800/60 flex flex-col">
                                                         {supportOptions.map((option) => {
                                                             const badge = getBadgeContent(option.id);
                                                             const colors = {
                                                                 email: {
                                                                     hoverText: 'group-hover/row:text-blue-600 dark:group-hover/row:text-blue-400',
                                                                     bg: 'bg-blue-50/80 border border-blue-100/50 dark:bg-blue-500/10 dark:border-blue-500/20 text-blue-600 dark:text-blue-400'
                                                                 },
                                                                 chat: {
                                                                     hoverText: 'group-hover/row:text-emerald-600 dark:group-hover/row:text-emerald-400',
                                                                     bg: 'bg-emerald-50/80 border border-emerald-100/50 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                                                 },
                                                                 phone: {
                                                                     hoverText: 'group-hover/row:text-purple-600 dark:group-hover/row:text-purple-400',
                                                                     bg: 'bg-purple-50/80 border border-purple-100/50 dark:bg-purple-500/10 dark:border-purple-500/20 text-purple-600 dark:text-purple-400'
                                                                 }
                                                             }[option.id as 'email' | 'chat' | 'phone'] || {
                                                                 hoverText: 'group-hover/row:text-blue-600 dark:group-hover/row:text-blue-400',
                                                                 bg: 'bg-blue-50/80 border border-blue-100/50 dark:bg-blue-500/10 dark:border-blue-500/20 text-blue-600 dark:text-blue-400'
                                                             };
                                                             return (
                                                                 <button
                                                                     key={option.id}
                                                                     type="button"
                                                                     onClick={() => handleOptionClick(option.id)}
                                                                     className="w-full text-left p-3 hover:bg-white dark:hover:bg-zinc-900/60 transition-colors rounded-xl flex items-center justify-between gap-4 group/row first:pt-3 last:pb-3 cursor-pointer"
                                                                 >
                                                                     <div className="flex items-center gap-3.5 min-w-0">
                                                                         <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 shadow-sm transition-all duration-300 ${colors.bg}`}>
                                                                             {React.cloneElement(option.icon as React.ReactElement<any>, { size: 18 })}
                                                                         </div>
                                                                         <div className="min-w-0">
                                                                             <div className={`text-[14px] font-bold text-zinc-900 dark:text-white truncate transition-colors ${colors.hoverText}`}>
                                                                                 {option.title}
                                                                             </div>
                                                                             <div className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate font-medium">
                                                                                 {option.description}
                                                                             </div>
                                                                         </div>
                                                                     </div>

                                                                     {/* Right side badge */}
                                                                     <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm rounded-[14px] px-3.5 py-2 transition-all duration-300 group-hover/row:bg-white dark:group-hover/row:bg-zinc-900 shrink-0">
                                                                         <div className={`p-1 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${badge.badgeBg}`}>
                                                                             {React.cloneElement(badge.icon as React.ReactElement<any>, { size: 10 })}
                                                                         </div>
                                                                         <div className="flex flex-col justify-center gap-0.5 min-w-0 text-left">
                                                                             <p className={`text-[8.5px] font-bold uppercase tracking-widest leading-none ${badge.labelColor}`}>
                                                                                 {badge.label}
                                                                             </p>
                                                                             <p className="text-[11.5px] font-extrabold text-zinc-850 dark:text-zinc-250 leading-none mt-0.5">
                                                                                 {badge.value}
                                                                             </p>
                                                                         </div>
                                                                     </div>
                                                                 </button>
                                                             );
                                                         })}
                                                     </div>
                                                 </div>
                                             </motion.div>

                                            {/* Divider */}
                                            <motion.div 
                                                initial={{ opacity: 0, scaleX: 0 }}
                                                animate={{ opacity: 1, scaleX: 1 }}
                                                transition={{ delay: 0.2, duration: 0.4 }}
                                                className="flex items-center gap-4 my-6 select-none"
                                            >
                                                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800" />
                                                <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                                                    or send a message
                                                </span>
                                                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800" />
                                            </motion.div>


                                             {/* Contact Form Container Card (Matches Student Tools Style) */}
                                             <motion.div
                                                 initial={{ opacity: 0, y: 15 }}
                                                 animate={{ opacity: 1, y: 0 }}
                                                 transition={{ delay: 0.2, type: 'spring', damping: 25, stiffness: 300 }}
                                                 className="relative overflow-hidden w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 text-left"
                                             >
                                                 {/* SaaS Background Accents */}
                                                 <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                                 <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

                                                 <div className="p-5 sm:p-6 lg:p-7 flex flex-col gap-6 sm:gap-8 relative z-10">
                                                     {/* Header matching Student Tools precisely */}
                                                     <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 w-full text-center sm:text-left">
                                                         <motion.div
                                                             whileHover={{ scale: 1.05, rotate: -5 }}
                                                             transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                             className="w-16 h-16 rounded-[20px] bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm"
                                                         >
                                                             <Send className="w-8 h-8 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                                                         </motion.div>
                                                         <div>
                                                             <div className="flex flex-col sm:flex-row items-center gap-3 mb-1">
                                                                 <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                                                     Send a Message
                                                                 </h1>
                                                             </div>
                                                             <p className="text-[14px] sm:text-base text-zinc-600 dark:text-zinc-400 max-w-lg leading-relaxed">
                                                                 Describe your issue and we'll reply directly via email
                                                             </p>
                                                         </div>
                                                     </div>

                                                     {/* Subtle divider before form */}
                                                     <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800"></div>

                                                     {/* Form section */}
                                                     <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                                         <div className="bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-150/60 dark:border-zinc-800/80 rounded-[1rem] p-4 shadow-inner divide-y divide-zinc-200/50 dark:divide-zinc-800/60 flex flex-col">
                                                             <div className="pb-4">
                                                                 <label className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase flex items-center gap-1.5 mb-2 select-none">
                                                                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                         <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                                         <polyline points="22,6 12,13 2,6" />
                                                                     </svg>
                                                                     Subject
                                                                 </label>
                                                                 <input
                                                                     type="text"
                                                                     value={subject}
                                                                     onChange={(e) => setSubject(e.target.value)}
                                                                     placeholder="What do you need help with?"
                                                                     className="w-full px-4 py-3 rounded-[14px] border border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 text-[13.5px] text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-zinc-900 shadow-sm"
                                                                 />
                                                             </div>

                                                             <div className="pt-4">
                                                                 <label className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase flex items-center gap-1.5 mb-2 select-none">
                                                                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                         <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                                     </svg>
                                                                     Message
                                                                 </label>
                                                                 <textarea
                                                                     value={message}
                                                                     onChange={(e) => setMessage(e.target.value)}
                                                                     placeholder="Describe your issue or question..."
                                                                     rows={3}
                                                                     className="w-full px-4 py-3 rounded-[14px] border border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 text-[13.5px] text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none resize-none min-h-[90px] transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-zinc-900 font-sans shadow-sm"
                                                                 />
                                                             </div>
                                                         </div>

                                                         {/* Character count & Submit Button Row */}
                                                         <div className="flex items-center justify-between mt-1">
                                                             <span className={`text-[11.5px] font-semibold tracking-tight transition-colors duration-200 ${
                                                                 message.length > 500 
                                                                     ? 'text-red-500' 
                                                                     : 'text-zinc-400 dark:text-zinc-500'
                                                             }`}>
                                                                 {message.length} <span className="text-zinc-300 dark:text-zinc-700">/</span> 500 chars
                                                             </span>
                                                             
                                                             <motion.button
                                                                  type="submit"
                                                                  disabled={isSubmitting || !subject.trim() || !message.trim()}
                                                                  whileHover={subject.trim() && message.trim() ? { scale: 1.02, y: -1 } : {}}
                                                             whileTap={subject.trim() && message.trim() ? { scale: 0.98 } : {}}
                                                             className={`px-6 py-2.5 rounded-[14px] text-[13.5px] font-extrabold flex items-center gap-2 border shadow-sm transition-all duration-300 ${
                                                                 (!subject.trim() || !message.trim())
                                                                     ? 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/50 dark:border-zinc-850/50 text-zinc-400 dark:text-zinc-600 cursor-not-allowed shadow-none'
                                                                     : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-blue-500/10 text-white shadow-[0_4px_14px_rgba(59,130,246,0.35)] cursor-pointer'
                                                             }`}
                                                         >
                                                             {isSubmitting ? (
                                                                 <>
                                                                     <motion.div
                                                                         animate={{ rotate: 360 }}
                                                                         transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                                                         className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full flex-shrink-0"
                                                                     />
                                                                     <span>Sending...</span>
                                                                 </>
                                                             ) : (
                                                                 <>
                                                                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                         <line x1="22" y1="2" x2="11" y2="13" />
                                                                         <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                                                     </svg>
                                                                     <span>Send Message</span>
                                                                 </>
                                                             )}
                                                         </motion.button>
                                                    </div>
                                                </form>
                                            </div>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </LayoutGroup>
                        </div>
                        </motion.div>
                            </AnimatePresence>

                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ContactSupportModal;
