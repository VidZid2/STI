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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            label: 'Getting Started',
            description: 'Learn the basics',
            onClick: () => setShowGettingStarted(true),
        },
        {
            id: 'tutorials',
            icon: (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            ),
            label: 'Video Tutorials',
            description: 'Watch & learn',
            onClick: () => setShowVideoTutorials(true),
        },
        {
            id: 'faq',
            icon: (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            label: 'FAQs',
            description: 'Common questions',
            onClick: () => setShowFAQs(true),
        },
        {
            id: 'keyboard',
            icon: (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="2" y="4" width="20" height="16" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
                </svg>
            ),
            label: 'Keyboard Shortcuts',
            description: 'Speed up workflow',
            onClick: () => setShowKeyboardShortcuts(true),
        },
        {
            id: 'contact',
            icon: (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
            label: 'Contact Support',
            description: 'Get help from us',
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
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isDarkMode 
                        ? 'bg-blue-900/30 hover:bg-blue-900/50 text-blue-400' 
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                }`}
            >
                <motion.svg 
                    className="w-3.5 h-3.5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                        className={`absolute bottom-full right-0 mb-2 rounded-xl shadow-lg border overflow-hidden z-50 ${
                            isDarkMode 
                                ? 'bg-slate-800 border-slate-700' 
                                : 'bg-white border-zinc-100'
                        }`}
                        style={{ width: '220px' }}
                    >
                        {/* Header */}
                        <div className={`px-3 py-2.5 border-b ${isDarkMode ? 'border-slate-700 bg-gradient-to-r from-blue-900/30 to-indigo-900/30' : 'border-zinc-100 bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center overflow-hidden">
                                    <lord-icon
                                        src="https://cdn.lordicon.com/biqqsrac.json"
                                        trigger="hover"
                                        state="hover-help-center-2"
                                        colors="primary:#ffffff,secondary:#ffffff"
                                        style={{ width: '20px', height: '20px' }}
                                    />
                                </div>
                                <div>
                                    <span className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-200' : 'text-zinc-700'}`}>Need Help?</span>
                                    <p className={`text-[9px] ${isDarkMode ? 'text-slate-400' : 'text-zinc-500'}`}>We're here to assist you</p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className={`px-3 py-2.5 border-b ${isDarkMode ? 'bg-slate-700/30 border-slate-700' : 'bg-zinc-50/50 border-zinc-100'}`}>
                            <p className={`text-[10px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-zinc-500'}`}>
                                Find answers to common questions, explore tutorials, or visit our help center for detailed guides.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div className="py-1">
                            {helpLinks.map((link, index) => (
                                <motion.a
                                    key={link.id}
                                    href="#"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    whileHover="hover"
                                    transition={{ delay: index * 0.03 }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setIsOpen(false);
                                        link.onClick?.();
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 group"
                                    style={{ 
                                        transition: 'background-color 0.2s ease-out',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = isDarkMode 
                                            ? 'rgba(59, 130, 246, 0.15)' 
                                            : 'rgba(59, 130, 246, 0.08)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${isDarkMode ? 'bg-slate-700 text-slate-400 group-hover:bg-blue-500/20 group-hover:text-blue-400' : 'bg-zinc-100 text-zinc-500 group-hover:bg-blue-100 group-hover:text-blue-500'}`}>
                                        {link.icon}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-200' : 'text-zinc-700'}`}>{link.label}</div>
                                        <div className={`text-[9px] truncate ${isDarkMode ? 'text-slate-400' : 'text-zinc-400'}`}>{link.description}</div>
                                    </div>
                                    <svg className={`w-3 h-3 transition-colors duration-200 ${isDarkMode ? 'text-slate-500 group-hover:text-blue-400' : 'text-zinc-300 group-hover:text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </motion.a>
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
                            className={`w-full flex items-center justify-center gap-1.5 px-3 py-2.5 border-t text-[10px] font-medium text-blue-500 rounded-b-xl ${isDarkMode ? 'border-slate-700' : 'border-zinc-100'}`}
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
