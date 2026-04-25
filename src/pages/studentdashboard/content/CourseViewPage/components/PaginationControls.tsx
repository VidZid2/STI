/**
 * PaginationControls
 * PaginationButton + PageNumberButton for CourseViewPage task lists.
 * Extracted from CourseViewPage.tsx during Phase 8.1
 */
import * as React from 'react';
import { useState } from 'react';
import { motion } from 'motion/react';

interface PaginationButtonProps {
    onClick: () => void;
    disabled: boolean;
    direction: 'prev' | 'next';
}

export const PaginationButton: React.FC<PaginationButtonProps> = ({ onClick, disabled, direction }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            onMouseEnter={() => !disabled && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={!disabled ? { scale: 1.05 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            aria-label={direction === 'prev' ? 'Previous page' : 'Next page'}
            style={{
                padding: '8px 12px', borderRadius: '8px',
                border: `1px solid ${disabled ? 'rgba(0,0,0,0.06)' : isHovered ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)'}`,
                background: disabled ? 'transparent' : isHovered ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                color: disabled ? '#cbd5e1' : '#3b82f6',
                fontSize: '12px', fontWeight: 500,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                display: 'flex', alignItems: 'center', gap: '4px',
                transition: 'all 0.15s ease' }}
        >
            {direction === 'prev' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 18l-6-6 6-6" />
                </svg>
            )}
            {direction === 'prev' ? 'Prev' : 'Next'}
            {direction === 'next' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 18l6-6-6-6" />
                </svg>
            )}
        </motion.button>
    );
};

interface PageNumberButtonProps {
    page: number;
    isActive: boolean;
    onClick: () => void;
}

export const PageNumberButton: React.FC<PageNumberButtonProps> = ({ page, isActive, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.button
            onClick={onClick}
            onMouseEnter={() => !isActive && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={!isActive ? { scale: 1.1 } : {}}
            whileTap={{ scale: 0.95 }}
            aria-label={`Page ${page}`}
            aria-current={isActive ? 'page' : undefined}
            style={{
                width: '32px', height: '32px', borderRadius: '8px',
                border: isActive ? '1px solid #3b82f6' : `1px solid ${isHovered ? 'rgba(59, 130, 246, 0.3)' : 'transparent'}`,
                background: isActive ? '#3b82f6' : isHovered ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                color: isActive ? '#ffffff' : isHovered ? '#3b82f6' : '#64748b',
                fontSize: '12px', fontWeight: isActive ? 600 : 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s ease' }}
        >
            {page}
        </motion.button>
    );
};
