/**
 * HelpNavItem Component
 * Self-contained help navigation item - manages its own state
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import SidebarHelpDropdown from '../../../components/ui/dropdowns/SidebarHelpDropdown';

interface HelpNavItemProps {
    onSidebarClose: () => void;
    isExpanded?: boolean;
}

export const HelpNavItem: React.FC<HelpNavItemProps> = React.memo(({ onSidebarClose: _onSidebarClose, isExpanded = true }) => {
    void _onSidebarClose; // Reserved for future use
    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = useRef<HTMLDivElement>(null);
    const closeTimeoutRef = useRef<number | null>(null);

    const handleMouseEnter = useCallback(() => {
        // Don't open dropdown when sidebar is collapsed
        if (!isExpanded) return;
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setIsOpen(true);
    }, [isExpanded]);

    const handleMouseLeave = useCallback(() => {
        closeTimeoutRef.current = window.setTimeout(() => {
            setIsOpen(false);
        }, 200);
    }, []);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    // Close dropdown when sidebar collapses
    useEffect(() => {
        if (!isExpanded) {
            setIsOpen(false);
        }
    }, [isExpanded]);

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div
            ref={anchorRef}
            style={{ position: 'relative' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button
                type="button"
                className="nav-item"
                onClick={(e) => e.preventDefault()}
                aria-haspopup="menu"
                aria-expanded={isOpen}
            >
                <div className="nav-icon">
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <path d="M12 17h.01"></path>
                    </svg>
                </div>
                <div className="nav-content">
                    <span className="nav-text">Help</span>
                    <span className="nav-description">Support center</span>
                </div>
                {isExpanded && (
                    <svg
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="nav-chevron"
                        style={{
                            marginLeft: 'auto',
                            color: '#94a3b8',
                            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.12s ease'
                        }}
                    >
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                )}
            </button>
            {/* Invisible bridge to connect anchor to dropdown */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: -20,
                        width: '20px',
                        height: '100%',
                        zIndex: 9999 }}
                    onMouseEnter={handleMouseEnter}
                />
            )}
            <SidebarHelpDropdown
                isOpen={isOpen}
                onClose={handleClose}
                anchorRef={anchorRef}
            />
        </div>
    );
});

HelpNavItem.displayName = 'HelpNavItem';

export default HelpNavItem;
