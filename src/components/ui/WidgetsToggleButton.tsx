import * as React from 'react';
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface WidgetsToggleButtonProps {
    isWidgetsSidebarActive: boolean;
    onToggle: () => void;
}

/**
 * Isolated component for the widgets toggle button.
 * This component manages its own mouse proximity detection to prevent
 * re-renders of the parent DashboardPage component.
 */
const WidgetsToggleButton: React.FC<WidgetsToggleButtonProps> = memo(({ 
    isWidgetsSidebarActive, 
    onToggle 
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const isVisibleRef = useRef(false);
    const rafIdRef = useRef<number | null>(null);
    const lastXRef = useRef(0);

    // Check for dark mode
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.body.classList.contains('dark-mode'));
        };
        checkDarkMode();
        
        // Watch for class changes on body
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        
        return () => observer.disconnect();
    }, []);

    // Mouse proximity detection - completely isolated from parent
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Skip if position hasn't changed significantly (10px threshold for better perf)
            if (Math.abs(e.clientX - lastXRef.current) < 10) {
                return;
            }
            lastXRef.current = e.clientX;

            // Cancel any pending RAF
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }

            // Use requestAnimationFrame for smooth updates
            rafIdRef.current = requestAnimationFrame(() => {
                const screenWidth = window.innerWidth;
                const proximityThreshold = 100;

                // Right edge detection for widgets toggle
                const shouldShow = screenWidth - e.clientX < proximityThreshold;
                
                // Only update state if value actually changed
                if (shouldShow !== isVisibleRef.current) {
                    isVisibleRef.current = shouldShow;
                    setIsVisible(shouldShow);
                }
            });
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, []);

    const handleClick = useCallback(() => {
        setIsHovered(false);
        onToggle();
    }, [onToggle]);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
    }, []);

    // Determine if button should be shown (either sidebar is active OR mouse is near right edge)
    const shouldShowButton = isWidgetsSidebarActive || isVisible;

    return (
        <div 
            style={{
                position: 'fixed',
                right: shouldShowButton ? (isWidgetsSidebarActive ? '360px' : '0px') : '-50px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 101,
                transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                // Use will-change for GPU acceleration
                willChange: 'right',
            }}
        >
            <button
                className="floating-widgets-toggle visible"
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                    width: '50px',
                    height: '80px',
                    borderRadius: '12px 0 0 12px',
                    background: isWidgetsSidebarActive 
                        ? (isDarkMode ? '#334155' : 'white') 
                        : '#1d4ed8',
                    border: isWidgetsSidebarActive 
                        ? `2px solid ${isDarkMode ? '#60a5fa' : '#1d4ed8'}` 
                        : 'none',
                    borderRight: 'none',
                    color: isWidgetsSidebarActive 
                        ? (isDarkMode ? '#60a5fa' : '#1d4ed8') 
                        : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    boxShadow: isHovered
                        ? (isDarkMode ? '-6px 0 20px rgba(0, 0, 0, 0.4)' : '-6px 0 20px rgba(30, 64, 175, 0.3)')
                        : (isDarkMode ? '-4px 0 12px rgba(0, 0, 0, 0.3)' : '-4px 0 12px rgba(30, 64, 175, 0.15)'),
                    transition: 'background 0.3s, border 0.3s, color 0.3s, box-shadow 0.3s',
                    willChange: 'box-shadow',
                }}
            >
                <motion.div
                    animate={{ rotate: isWidgetsSidebarActive ? 0 : 180 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </motion.div>
            </button>
            
            {/* Tooltip - using CSS-based visibility for better performance */}
            <AnimatePresence mode="wait">
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: 'absolute',
                            right: '60px',
                            top: 'calc(50% - 12.5px)',
                            pointerEvents: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0',
                            width: 'max-content',
                        }}
                    >
                        <div 
                            className="rounded-md border px-3 py-1.5 text-sm whitespace-nowrap shadow-lg"
                            style={{
                                background: isDarkMode ? '#334155' : 'white',
                                borderColor: isDarkMode ? '#60a5fa' : '#1d4ed8',
                                color: isDarkMode ? '#60a5fa' : '#1d4ed8',
                            }}
                        >
                            {isWidgetsSidebarActive ? 'Hide Widgets' : 'Dashboard Widgets'}
                        </div>
                        {/* Arrow pointing to the button */}
                        <div style={{
                            width: 0,
                            height: 0,
                            borderTop: '8px solid transparent',
                            borderBottom: '8px solid transparent',
                            borderLeft: `8px solid ${isDarkMode ? '#60a5fa' : '#1d4ed8'}`,
                            marginLeft: '-1px',
                        }} />
                        <div style={{
                            width: 0,
                            height: 0,
                            borderTop: '7px solid transparent',
                            borderBottom: '7px solid transparent',
                            borderLeft: `7px solid ${isDarkMode ? '#334155' : 'white'}`,
                            marginLeft: '-8px',
                        }} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

WidgetsToggleButton.displayName = 'WidgetsToggleButton';

export default WidgetsToggleButton;
