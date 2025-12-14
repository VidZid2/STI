import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import GettingStartedModal from './GettingStartedModal';
import VideoTutorialsModal from './VideoTutorialsModal';
import FAQsModal from './FAQsModal';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import ContactSupportModal from './ContactSupportModal';
import HelpCenterModal from './HelpCenterModal';

interface SidebarHelpDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    anchorRef?: React.RefObject<HTMLDivElement | null>;
}

// Dark mode color palette - STI blue/yellow theme
const getColors = (isDark: boolean) => ({
    dropdownBg: isDark ? '#1e293b' : '#ffffff',
    headerBorder: isDark ? 'rgba(71, 85, 105, 0.5)' : '#f4f4f5',
    hoverBg: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
    textPrimary: isDark ? '#f1f5f9' : '#18181b',
    textSecondary: isDark ? '#94a3b8' : '#71717a',
    textMuted: isDark ? '#64748b' : '#a1a1aa',
    textAccent: isDark ? '#60a5fa' : '#3b82f6',
    // STI colors for icons - Blue background, White SVG
    iconBg: '#3b82f6', // Blue background
    iconColor: '#ffffff', // White SVG color
    boxShadow: isDark 
        ? '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(71, 85, 105, 0.3)' 
        : '0 4px 24px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
});

const helpItems = [
    {
        id: 'getting-started',
        lordIconSrc: 'https://cdn.lordicon.com/hjrbjhnq.json',
        label: 'Getting Started',
        description: 'Learn the basics of the platform',
        tooltip: 'Quick introduction to navigate and use all features effectively',
    },
    {
        id: 'tutorials',
        lordIconSrc: 'https://cdn.lordicon.com/wjogzler.json',
        label: 'Video Tutorials',
        description: 'Watch step-by-step guides',
        tooltip: 'Visual walkthroughs for courses, tools, and dashboard features',
    },
    {
        id: 'faq',
        lordIconSrc: 'https://cdn.lordicon.com/biqqsrac.json',
        lordIconState: 'hover-help-center-2',
        label: 'FAQs',
        description: 'Common questions answered',
        tooltip: 'Find answers to frequently asked questions about the platform',
    },
    {
        id: 'keyboard',
        lordIconSrc: 'https://cdn.lordicon.com/navborva.json',
        lordIconStroke: 'bold',
        label: 'Keyboard Shortcuts',
        description: 'Speed up your workflow',
        tooltip: 'Master keyboard shortcuts to navigate faster and boost productivity',
    },
    {
        id: 'contact',
        lordIconSrc: 'https://cdn.lordicon.com/jdgfsfzr.json',
        lordIconStroke: 'bold',
        label: 'Contact Support',
        description: 'Get help from our team',
        tooltip: 'Reach out to our support team for personalized assistance',
    },
];

const SidebarHelpDropdown: React.FC<SidebarHelpDropdownProps> = ({
    isOpen,
    onClose,
    anchorRef,
}) => {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [isDarkMode, setIsDarkMode] = useState(() => 
        typeof document !== 'undefined' && document.body.classList.contains('dark-mode')
    );
    const closeTimeoutRef = useRef<number | null>(null);
    const [showGettingStarted, setShowGettingStarted] = useState(false);
    const [showVideoTutorials, setShowVideoTutorials] = useState(false);
    const [showFAQs, setShowFAQs] = useState(false);
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
    const [showContactSupport, setShowContactSupport] = useState(false);
    const [showHelpCenter, setShowHelpCenter] = useState(false);

    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.body.classList.contains('dark-mode'));
        };
        checkDarkMode();
        
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (isOpen) {
            setIsDarkMode(document.body.classList.contains('dark-mode'));
        }
    }, [isOpen]);

    const colors = getColors(isDarkMode);

    useEffect(() => {
        if (isOpen && anchorRef?.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            // Position dropdown so it doesn't go below viewport
            // Move it up more since Help is near the bottom of sidebar
            setPosition({
                top: rect.top - 320,
                left: rect.right + 12,
            });
        }
    }, [isOpen, anchorRef]);

    const scheduleClose = useCallback(() => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = window.setTimeout(onClose, 50);
    }, [onClose]);

    const cancelClose = useCallback(() => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        };
    }, []);

    // Don't show dropdown when any modal is open
    const shouldShowDropdown = isOpen && !showGettingStarted && !showVideoTutorials && !showFAQs && !showKeyboardShortcuts && !showContactSupport && !showHelpCenter;

    return [
        createPortal(
        <AnimatePresence>
            {shouldShowDropdown && (
                <motion.div
                    initial={{ opacity: 0, x: -8, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -8, scale: 0.96 }}
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                    style={{
                        position: 'fixed',
                        top: position.top,
                        left: position.left,
                        width: '240px',
                        background: colors.dropdownBg,
                        borderRadius: '12px',
                        boxShadow: colors.boxShadow,
                        overflow: 'hidden',
                        zIndex: 10000,
                    }}
                >
                    {/* Header */}
                    <div style={{ 
                        padding: '12px 14px', 
                        borderBottom: `1px solid ${colors.headerBorder}`,
                        background: isDarkMode 
                            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)'
                            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: '#3b82f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ffffff',
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                    <path d="M12 17h.01" />
                                </svg>
                            </motion.div>
                            <div>
                                <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: colors.textPrimary }}>
                                    Help & Support
                                </p>
                                <p style={{ margin: 0, fontSize: '10px', color: colors.textSecondary }}>
                                    We're here to help you
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Help Items */}
                    <div style={{ padding: '6px' }}>
                        {helpItems.map((item, index) => (
                            <motion.a
                                key={item.id}
                                href="#"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.02, duration: 0.15 }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (item.id === 'getting-started') {
                                        setShowGettingStarted(true);
                                    } else if (item.id === 'tutorials') {
                                        setShowVideoTutorials(true);
                                    } else if (item.id === 'faq') {
                                        setShowFAQs(true);
                                    } else if (item.id === 'keyboard') {
                                        setShowKeyboardShortcuts(true);
                                    } else if (item.id === 'contact') {
                                        setShowContactSupport(true);
                                    }
                                    onClose();
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    transition: 'background 0.15s ease',
                                }}
                                whileHover={{ backgroundColor: colors.hoverBg }}
                            >
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '6px',
                                    background: colors.iconBg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    overflow: 'hidden',
                                }}>
                                    {/* @ts-ignore */}
                                    <lord-icon
                                        src={item.lordIconSrc}
                                        trigger="hover"
                                        colors="primary:#ffffff,secondary:#ffffff"
                                        state={(item as any).lordIconState}
                                        stroke={(item as any).lordIconStroke}
                                        style={{ width: '22px', height: '22px' }}
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ 
                                        margin: 0, 
                                        fontSize: '11px', 
                                        fontWeight: 500, 
                                        color: colors.textPrimary,
                                    }}>
                                        {item.label}
                                    </p>
                                    <p style={{ 
                                        margin: 0, 
                                        fontSize: '9px', 
                                        color: colors.textMuted,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {item.description}
                                    </p>
                                </div>
                                <svg 
                                    width="12" 
                                    height="12" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke={colors.textMuted}
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                >
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </motion.a>
                        ))}
                    </div>
                    


                    {/* Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        style={{
                            padding: '8px 14px 12px',
                            borderTop: `1px solid ${colors.headerBorder}`,
                        }}
                    >
                        <motion.a
                            href="#"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={(e) => {
                                e.preventDefault();
                                setShowHelpCenter(true);
                                onClose();
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '8px',
                                borderRadius: '8px',
                                background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
                                color: colors.textAccent,
                                fontSize: '11px',
                                fontWeight: 500,
                                textDecoration: 'none',
                                transition: 'background 0.15s ease',
                            }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            Visit Help Center
                        </motion.a>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    ),
        // Getting Started Modal
        <GettingStartedModal 
            key="getting-started-modal"
            isOpen={showGettingStarted} 
            onClose={() => setShowGettingStarted(false)} 
        />,
        // Video Tutorials Modal
        <VideoTutorialsModal
            key="video-tutorials-modal"
            isOpen={showVideoTutorials}
            onClose={() => setShowVideoTutorials(false)}
        />,
        // FAQs Modal
        <FAQsModal
            key="faqs-modal"
            isOpen={showFAQs}
            onClose={() => setShowFAQs(false)}
        />,
        // Keyboard Shortcuts Modal
        <KeyboardShortcutsModal
            key="keyboard-shortcuts-modal"
            isOpen={showKeyboardShortcuts}
            onClose={() => setShowKeyboardShortcuts(false)}
        />,
        // Contact Support Modal
        <ContactSupportModal
            key="contact-support-modal"
            isOpen={showContactSupport}
            onClose={() => setShowContactSupport(false)}
        />,
        // Help Center Modal
        <HelpCenterModal
            key="help-center-modal"
            isOpen={showHelpCenter}
            onClose={() => setShowHelpCenter(false)}
        />
    ];
};

export default React.memo(SidebarHelpDropdown);
