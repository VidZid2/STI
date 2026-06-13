import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import GettingStartedModal from '../modals/GettingStartedModal';
import VideoTutorialsModal from '../modals/VideoTutorialsModal';
import FAQsModal from '../modals/FAQsModal';
import KeyboardShortcutsModal from '../modals/KeyboardShortcutsModal';
import ContactSupportModal from '../modals/ContactSupportModal';
import HelpCenterModal from '../modals/HelpCenterModal';

const HelpDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // Modal states
    const [showGettingStarted, setShowGettingStarted] = useState(false);
    const [showVideoTutorials, setShowVideoTutorials] = useState(false);
    const [showFAQs, setShowFAQs] = useState(false);
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
    const [showContactSupport, setShowContactSupport] = useState(false);
    const [showHelpCenter, setShowHelpCenter] = useState(false);

    // Check for dark mode
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.body.classList.contains('dark-mode'));
        };
        checkDarkMode();
        
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        
        return () => observer.disconnect();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const helpLinks = [
        {
            id: 'getting-started',
            icon: (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
            label: 'Getting Started',
            description: 'Learn the basics of the platform',
            onClick: () => setShowGettingStarted(true),
        },
        {
            id: 'tutorials',
            icon: (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            label: 'Video Tutorials',
            description: 'Watch step-by-step guides',
            onClick: () => setShowVideoTutorials(true),
        },
        {
            id: 'faq',
            icon: (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            label: 'FAQs',
            description: 'Common questions answered',
            onClick: () => setShowFAQs(true),
        },
        {
            id: 'keyboard',
            icon: (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="2" y="4" width="20" height="16" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
                </svg>
            ),
            label: 'Keyboard Shortcuts',
            description: 'Speed up your workflow',
            onClick: () => setShowKeyboardShortcuts(true),
        },
        {
            id: 'contact',
            icon: (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
            label: 'Contact Support',
            description: 'Get help from our team',
            onClick: () => setShowContactSupport(true),
        },
    ];

    return (
        <div ref={dropdownRef} className="relative flex-1">
            {/* Help Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-center gap-1.5 lg:gap-1 text-[13px] lg:text-[11px] font-bold py-2 lg:py-1.5 px-3 lg:px-2 rounded-[12px] lg:rounded-[10px] transition-colors shadow-sm ${
                    isDarkMode 
                        ? 'bg-blue-900/50 hover:bg-blue-900/70 text-blue-300' 
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                }`}
            >
                <motion.svg 
                    className="w-4 h-4 lg:w-3.5 lg:h-3.5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </motion.svg>
                Help
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ 
                            type: 'spring',
                            stiffness: 400,
                            damping: 25,
                        }}
                        className={`absolute bottom-full right-0 mb-2 rounded-xl shadow-lg border overflow-hidden z-50 w-[calc(100vw-32px)] sm:w-[270px] lg:w-[calc(200%+8px)] max-w-[300px] sm:max-w-none ${
                            isDarkMode 
                                ? 'bg-slate-800 border-slate-700' 
                                : 'bg-white border-zinc-100'
                        }`}
                    >
                        {/* Header */}
                        <div className={`px-2.5 py-1.5 border-b ${isDarkMode ? 'border-slate-700 bg-slate-700/50' : 'border-zinc-100 bg-zinc-50/50'}`}>
                            <span className={`text-[9px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-zinc-400'}`}>Help & Support</span>
                        </div>

                        {/* Quick Links */}
                        <div className="py-1">
                            {helpLinks.map((link, index) => (
                                <motion.div
                                    key={link.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    onClick={() => {
                                        setIsOpen(false);
                                        link.onClick?.();
                                    }}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className={`flex items-center gap-2 p-2 mx-1.5 my-1 rounded-xl cursor-pointer transition-colors shadow-sm border ${link.id === 'keyboard' ? 'hidden md:flex' : 'flex'} ${
                                        isDarkMode 
                                            ? 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700/80' 
                                            : 'bg-white border-zinc-200/80 hover:border-zinc-300'
                                    }`}
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                        className={`p-1.5 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                                            isDarkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'
                                        }`}
                                    >
                                        {React.cloneElement(link.icon as React.ReactElement<any>, { className: 'w-3.5 h-3.5', strokeWidth: "2.5" })}
                                    </motion.div>
                                    
                                    <div className="flex-1 min-w-0 pr-1 text-left">
                                        <div className={`text-[11.5px] font-extrabold tracking-tight leading-none mb-0.5 ${
                                            isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
                                        }`}>
                                            {link.label}
                                        </div>
                                        <div className={`text-[9.5px] font-medium leading-tight ${
                                            isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                                        }`}>
                                            {link.description}
                                        </div>
                                    </div>

                                    {/* Chevron Right */}
                                    <svg className={`w-2.5 h-2.5 flex-shrink-0 ${isDarkMode ? 'text-slate-500' : 'text-zinc-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </motion.div>
                            ))}
                        </div>

                        {/* Footer - Visit Help Center */}
                        <motion.a
                            href="#"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            whileHover={{ 
                                backgroundColor: isDarkMode 
                                    ? 'rgba(59, 130, 246, 0.15)' 
                                    : 'rgba(59, 130, 246, 0.08)'
                            }}
                            transition={{ delay: 0.15, backgroundColor: { duration: 0.2, ease: 'easeOut' } }}
                            onClick={(e) => {
                                e.preventDefault();
                                setIsOpen(false);
                                setShowHelpCenter(true);
                            }}
                            className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 border-t text-[10px] font-medium text-blue-500 rounded-b-xl ${isDarkMode ? 'border-slate-700' : 'border-zinc-100'}`}
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Visit Help Center
                        </motion.a>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Modals */}
            <GettingStartedModal 
                isOpen={showGettingStarted} 
                onClose={() => setShowGettingStarted(false)} 
            />
            <VideoTutorialsModal
                isOpen={showVideoTutorials}
                onClose={() => setShowVideoTutorials(false)}
            />
            <FAQsModal
                isOpen={showFAQs}
                onClose={() => setShowFAQs(false)}
            />
            <KeyboardShortcutsModal
                isOpen={showKeyboardShortcuts}
                onClose={() => setShowKeyboardShortcuts(false)}
            />
            <ContactSupportModal
                isOpen={showContactSupport}
                onClose={() => setShowContactSupport(false)}
            />
            <HelpCenterModal
                isOpen={showHelpCenter}
                onClose={() => setShowHelpCenter(false)}
            />
        </div>
    );
};

export default HelpDropdown;
