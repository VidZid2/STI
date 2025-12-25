/**
 * CoursesNavItem Component
 * Self-contained courses navigation item - manages its own state
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import SidebarCoursesDropdown from '../../../components/ui/dropdowns/SidebarCoursesDropdown';
import { getSidebarCoursesWithProgress } from '../utils';
import type { SidebarCourse } from '../types';

interface CoursesNavItemProps {
    onSidebarClose: () => void;
    onCourseSelect: (course: SidebarCourse) => void;
    currentCourseId?: string | null;
}

export const CoursesNavItem: React.FC<CoursesNavItemProps> = React.memo(({ onSidebarClose, onCourseSelect, currentCourseId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = useRef<HTMLDivElement>(null);
    const closeTimeoutRef = useRef<number | null>(null);

    // Get courses with dynamic progress
    const coursesWithProgress = useMemo(() => getSidebarCoursesWithProgress(), []);

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

    const handleCourseClick = useCallback((courseId: string) => {
        const course = coursesWithProgress.find(c => c.id === courseId);
        if (course) {
            onCourseSelect(course);
        }
        setIsOpen(false);
        onSidebarClose();
    }, [onSidebarClose, onCourseSelect, coursesWithProgress]);

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    const isActive = !!currentCourseId;

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
                onClick={(e) => e.preventDefault()}
            >
                <div className="nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                    </svg>
                </div>
                <div className="nav-content">
                    <span className="nav-text">Courses</span>
                    <span className="nav-description">Your enrolled classes</span>
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
            <SidebarCoursesDropdown
                isOpen={isOpen}
                onClose={handleClose}
                courses={coursesWithProgress}
                onCourseClick={handleCourseClick}
                anchorRef={anchorRef}
                currentCourseId={currentCourseId}
            />
        </div>
    );
});

CoursesNavItem.displayName = 'CoursesNavItem';

export default CoursesNavItem;
