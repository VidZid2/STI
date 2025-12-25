/**
 * PathsNavItem Component
 * Self-contained paths navigation item - manages its own state
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import SidebarPathsDropdown from '../../../components/ui/dropdowns/SidebarPathsDropdown';

interface PathsNavItemProps {
    onSidebarClose: () => void;
    onViewPaths: () => void;
    isActive?: boolean;
}

export const PathsNavItem: React.FC<PathsNavItemProps> = React.memo(({ onSidebarClose, onViewPaths, isActive }) => {
    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = useRef<HTMLDivElement>(null);
    const closeTimeoutRef = useRef<number | null>(null);

    const handleMouseEnter = useCallback(() => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setIsOpen(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        closeTimeoutRef.current = window.setTimeout(() => {
            setIsOpen(false);
        }, 200);
    }, []);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    const handleViewAllClick = useCallback(() => {
        setIsOpen(false);
        onSidebarClose();
        onViewPaths();
    }, [onSidebarClose, onViewPaths]);

    const handlePathClick = useCallback((_pathId: string) => {
        setIsOpen(false);
        onSidebarClose();
        onViewPaths();
    }, [onSidebarClose, onViewPaths]);

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
            <a
                href="#"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={(e) => {
                    e.preventDefault();
                    handleViewAllClick();
                }}
            >
                <div className="nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3v18h18"></path>
                        <path d="m19 9-5 5-4-4-3 3"></path>
                    </svg>
                </div>
                <div className="nav-content">
                    <span className="nav-text">Paths</span>
                    <span className="nav-description">Learning journeys</span>
                </div>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        marginLeft: 'auto',
                        color: '#94a3b8',
                        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.12s ease'
                    }}
                >
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </a>
            {/* Invisible bridge to connect anchor to dropdown */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: -20,
                        width: '20px',
                        height: '100%',
                        zIndex: 9999,
                    }}
                    onMouseEnter={handleMouseEnter}
                />
            )}
            <SidebarPathsDropdown
                isOpen={isOpen}
                onClose={handleClose}
                onPathClick={handlePathClick}
                onViewAllClick={handleViewAllClick}
                anchorRef={anchorRef}
            />
        </div>
    );
});

PathsNavItem.displayName = 'PathsNavItem';

export default PathsNavItem;
