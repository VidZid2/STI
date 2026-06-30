import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import GettingStartedModal from '../modals/GettingStartedModal';
import VideoTutorialsModal from '../modals/VideoTutorialsModal';
import FAQsModal from '../modals/FAQsModal';
import KeyboardShortcutsModal from '../modals/KeyboardShortcutsModal';
import ContactSupportModal from '../modals/ContactSupportModal';
import HelpCenterModal from '../modals/HelpCenterModal';
import { cn } from '../../../lib/utils';
import { BottomSheet } from '../bottom-sheet';


interface SidebarHelpDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    anchorRef?: React.RefObject<HTMLDivElement | null>;
}



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
    const [cardHeight, setCardHeight] = useState(484);
    const [position, setPosition] = useState({ top: 0, left: 0, arrowTop: 30, arrowLeft: -7 });
    const [isDarkMode, setIsDarkMode] = useState(() => 
        typeof document !== 'undefined' && document.body.classList.contains('dark-mode')
    );
    const closeTimeoutRef = useRef<number | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
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
        
        return () => {
            observer.disconnect();
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        if (isOpen) {
            setIsDarkMode(document.body.classList.contains('dark-mode'));
        }
    }, [isOpen]);



    const cardRef = useCallback((node: HTMLDivElement | null) => {
        if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect();
            resizeObserverRef.current = null;
        }

        if (node !== null) {
            const updateHeight = () => {
                const rect = node.getBoundingClientRect();
                if (rect.height > 0) {
                    setCardHeight(rect.height);
                }
            };
            
            updateHeight();
            
            if (typeof ResizeObserver !== 'undefined') {
                const observer = new ResizeObserver(() => {
                    updateHeight();
                });
                observer.observe(node);
                resizeObserverRef.current = observer;
            }
        }
    }, []);

    const updatePosition = useCallback(() => {
        if (anchorRef?.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            const isMobile = window.innerWidth < 640;

            if (isMobile) {
                // Mobile: Position below the anchor
                const cardTop = rect.bottom + 12;
                // Center horizontally relative to screen
                const cardLeft = 12; 
                // Arrow points up to the anchor
                const arrowLeft = rect.left + rect.width / 2 - cardLeft;

                setPosition({
                    top: cardTop,
                    left: cardLeft,
                    arrowTop: -7, // indicating it's pointing up, we'll handle this in render
                    arrowLeft: arrowLeft
                });
            } else {
                // Desktop: Position to the right of the anchor
                const anchorCenter = rect.top + rect.height / 2;
                
                // Set vertical center/bottom of the card relative to anchor center
                const arrowOffsetFromBottom = 30;
                let cardTop = anchorCenter + arrowOffsetFromBottom - cardHeight;
                
                // Clamp to viewport
                if (cardTop < 16) cardTop = 16;
                if (cardTop + cardHeight > window.innerHeight - 16) {
                    cardTop = window.innerHeight - cardHeight - 16;
                }
                
                // Calculate where the arrow should be vertically relative to the card's top
                let arrowTop = anchorCenter - cardTop;
                
                // Clamp arrow position safely inside the card bounds
                if (arrowTop < 16) arrowTop = 16;
                if (arrowTop > cardHeight - 16) arrowTop = cardHeight - 16;
                
                setPosition({
                    top: cardTop,
                    left: rect.right + 12,
                    arrowTop: arrowTop,
                    arrowLeft: -7 // indicating pointing left
                });
            }
        }
    }, [anchorRef, cardHeight]);

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            const id = requestAnimationFrame(updatePosition);
            
            // Add window resize handler
            const handleResize = () => {
                updatePosition();
            };
            window.addEventListener('resize', handleResize);
            window.addEventListener('scroll', handleResize, true);
            
            return () => {
                cancelAnimationFrame(id);
                window.removeEventListener('resize', handleResize);
                window.removeEventListener('scroll', handleResize, true);
            };
        }
    }, [isOpen, updatePosition]);

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

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

    const cardContent = (
        <>
            {/* SaaS Background Accents */}
                        <div className={`absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 rounded-full blur-3xl pointer-events-none ${
                            isDarkMode ? 'bg-blue-500/5' : 'bg-blue-500/10'
                        }`} aria-hidden="true" />
                        <div className={`absolute bottom-0 left-0 -ml-12 -mb-12 w-24 h-24 rounded-full blur-3xl pointer-events-none ${
                            isDarkMode ? 'bg-emerald-400/5' : 'bg-emerald-400/10'
                        }`} aria-hidden="true" />

                        {/* Upper Section: Hero Icon & Text */}
                        <div className="flex gap-4 relative z-10 mt-2 sm:mt-0">
                            {/* Bouncy Help Icon */}
                            <motion.div
                                whileHover={{ scale: 1.05, rotate: -5 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                className={`w-[52px] h-[52px] rounded-[16px] flex items-center justify-center flex-shrink-0 shadow-sm relative z-10 border ${
                                    isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'
                                }`}
                            >
                                <svg className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                    <path d="M12 17h.01" />
                                </svg>
                            </motion.div>

                            {/* Text Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h2 className={`text-[18px] font-bold tracking-tight leading-none ${
                                        isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
                                    }`}>
                                        Help & Support
                                    </h2>
                                </div>
                                <p className={`text-[12.5px] leading-[1.4] font-medium mt-1 ${
                                    isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                                }`}>
                                    Get started quickly, learn with tutorials, and reach our support team anytime.
                                </p>
                            </div>
                        </div>

                        {/* Help Items as Delicate Card Rows */}
                        <div className="flex flex-col gap-2 relative z-10">
                            {helpItems.map((item, index) => (
                                <motion.a
                                    key={item.id}
                                    href="#"
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04, duration: 0.2 }}
                                    whileHover={{ scale: 1.015 }}
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
                                    className={`flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-[14px] border shadow-sm transition-colors no-underline ${
                                        isDarkMode
                                            ? 'bg-zinc-900/50 border-zinc-800/80 hover:border-blue-800/60'
                                            : 'bg-white border-zinc-200/80 hover:border-blue-200'
                                    }`}
                                    style={{ textDecoration: 'none' }}
                                >
                                    {/* Small Squircle Icon */}
                                    <div className={`w-8 h-8 rounded-xl border flex-shrink-0 flex items-center justify-center ${
                                        isDarkMode
                                            ? 'bg-blue-500/10 border-blue-500/20'
                                            : 'bg-blue-50 border-blue-100'
                                    }`}>
                                        {/* LordIcon with error handling and fallback */}
                                        <lord-icon
                                            src={item.lordIconSrc}
                                            trigger="hover"
                                            colors={isDarkMode ? 'primary:#60a5fa,secondary:#60a5fa' : 'primary:#2563eb,secondary:#2563eb'}
                                            state={(item as any).lordIconState}
                                            stroke={(item as any).lordIconStroke}
                                            style={{ width: '18px', height: '18px', display: 'block' }}
                                            onError={(e: Event) => {
                                                // Hide the failed lord-icon and show fallback
                                                const target = e.target as HTMLElement;
                                                if (target) {
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                        const fallback = parent.querySelector('.lord-icon-fallback');
                                                        if (fallback) fallback.classList.remove('hidden');
                                                    }
                                                }
                                            }}
                                        />
                                        {/* SVG Fallback icons */}
                                        <div className={`lord-icon-fallback hidden ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                            {item.id === 'getting-started' && (
                                                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                            )}
                                            {item.id === 'tutorials' && (
                                                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12l-4-4M2 12l4-4m14 4l-4 4M6 12l4 4m0-8v8m4-4h.01M12 17h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                                            )}
                                            {item.id === 'faq' && (
                                                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                                            )}
                                            {item.id === 'keyboard' && (
                                                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/></svg>
                                            )}
                                            {item.id === 'contact' && (
                                                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                            )}
                                        </div>
                                    </div>
                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[13px] font-bold leading-none mb-0.5 ${
                                            isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
                                        }`} style={{ margin: 0 }}>
                                            {item.label}
                                        </p>
                                        <p className={`text-[11.5px] font-medium leading-tight ${
                                            isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                                        }`} style={{ margin: 0 }}>
                                            {item.description}
                                        </p>
                                    </div>
                                    {/* Chevron */}
                                    <svg className={`w-3.5 h-3.5 flex-shrink-0 ${
                                        isDarkMode ? 'text-zinc-600' : 'text-zinc-300'
                                    }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </motion.a>
                            ))}
                        </div>

                        {/* Footer: Help Center Stat Card */}
                        <motion.a
                            href="#"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.25 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={(e) => {
                                e.preventDefault();
                                setShowHelpCenter(true);
                                onClose();
                            }}
                            className={`flex w-full items-center justify-center gap-3 px-4 py-3 rounded-[14px] border shadow-sm transition-colors relative z-10 no-underline ${
                                isDarkMode ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200/80'
                            }`}
                            style={{ textDecoration: 'none' }}
                        >
                            <div className={`w-8 h-8 rounded-xl border flex-shrink-0 flex items-center justify-center ${
                                isDarkMode
                                    ? 'bg-blue-500/10 border-blue-500/20'
                                    : 'bg-blue-50 border-blue-100'
                            }`}>
                                <svg className={`w-[16px] h-[16px] ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                            </div>
                            <div className="flex flex-col justify-center gap-0.5">
                                <span className={`text-[9px] font-bold uppercase tracking-widest leading-none ${
                                    isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                                }`}>
                                    Explore
                                </span>
                                <span className={`text-[12px] font-bold leading-none ${
                                    isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
                                }`}>
                                    Visit Help Center
                                </span>
                            </div>
                        </motion.a>
        </>
    );

    return [
        isMobile ? (
            <BottomSheet key="mobile-bottom-sheet" snapPoints={["auto"]} open={shouldShowDropdown} onOpenChange={(open) => { if (!open) onClose(); }}>
                <div className={cn(
                    "overflow-hidden relative flex flex-col gap-3.5 w-full pt-1 pb-4",
                    isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
                )}>
                    {cardContent}
                </div>
            </BottomSheet>
        ) : (
            createPortal(
                <AnimatePresence>
                    {shouldShowDropdown && (
                        <motion.div
                            key="help-panel"
                            className="flex relative"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            onMouseEnter={cancelClose}
                            onMouseLeave={scheduleClose}
                            style={{
                                position: 'fixed',
                                top: position.top,
                                left: position.left,
                                zIndex: 99999,
                            }}
                        >
                            {/* Arrow */}
                            <div
                                className={cn(
                                    "w-0 h-0 relative z-20 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-r-[7px] -mr-[1px]",
                                    isDarkMode ? 'border-r-zinc-950' : 'border-r-white'
                                )}
                                style={{ 
                                    position: 'absolute', 
                                    left: 0, 
                                    top: position.arrowTop - 7
                                }}
                            />
                            
                            {/* Premium Card */}
                            <div ref={cardRef} className={cn(
                                "overflow-hidden relative flex flex-col gap-3.5 sm:gap-4 border",
                                isDarkMode ? 'bg-zinc-950 border-zinc-800/80' : 'bg-white border-zinc-200/80',
                                "w-[350px] p-4 sm:p-5 shadow-2xl rounded-[20px] ml-[6px]"
                            )}>
                                {cardContent}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )
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
