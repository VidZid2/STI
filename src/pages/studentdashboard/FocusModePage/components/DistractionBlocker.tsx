/**
 * DistractionBlocker
 * Full-screen distraction blocker overlay.
 * Extracted from FocusModePage.tsx during Phase 8.5
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Resource } from '../FocusModePage';

// Distraction Blocker Overlay Component
const DistractionBlocker: React.FC<{
    isActive: boolean;
    
    timeLeft: string;
    mode: 'focus' | 'break';
    onExit: () => void;
}> = ({ isActive, timeLeft, mode, onExit }) => {
    const [isHovered, setIsHovered] = useState(false);

    const accentColor = mode === 'focus' ? '#3b82f6' : '#10b981';

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    initial={{ y: 100, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 100, opacity: 0, scale: 0.9 }}
                    transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 30,
                        mass: 0.8 }}
                    onHoverStart={() => setIsHovered(true)}
                    onHoverEnd={() => setIsHovered(false)}
                    style={{
                        position: 'fixed',
                        bottom: 24,
                        left: 0,
                        right: 0,
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        width: 'fit-content',
                        zIndex: 1000,
                        padding: '14px 24px',
                        borderRadius: '16px',
                        background: 'var(--bg-primary)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: isHovered
                            ? `0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px ${accentColor}30`
                            : '0 10px 30px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px',
                        border: `1px solid ${'rgba(255,255,255,0.1)'}`,
                        transition: 'box-shadow 0.3s ease' }}
                >
                    {/* Status text with icon */}
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: accentColor,
                            letterSpacing: '-0.2px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px' }}
                    >
                        {mode === 'focus' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <circle cx="12" cy="12" r="6" />
                                <circle cx="12" cy="12" r="2" fill="currentColor" />
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                                <line x1="6" y1="1" x2="6" y2="4" />
                                <line x1="10" y1="1" x2="10" y2="4" />
                                <line x1="14" y1="1" x2="14" y2="4" />
                            </svg>
                        )}
                        {mode === 'focus' ? 'Focus Mode' : 'Break Time'}
                    </motion.span>

                    {/* Divider */}
                    <div style={{
                        width: 1,
                        height: 20,
                        background: 'var(--bg-hover)' }} />

                    {/* Timer display */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15, type: 'spring', stiffness: 400 }}
                        style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            color: accentColor,
                            fontVariantNumeric: 'tabular-nums',
                            letterSpacing: '-0.5px',
                            padding: '6px 16px',
                            borderRadius: '10px',
                            background: `${accentColor}12`,
                            border: `1px solid ${accentColor}20` }}
                    >
                        {timeLeft}
                    </motion.div>

                    {/* Divider */}
                    <div style={{
                        width: 1,
                        height: 20,
                        background: 'var(--bg-hover)' }} />

                    {/* Exit button */}
                    <motion.button
                        whileHover={{ scale: 1.05, background: 'rgba(239, 68, 68, 0.12)' }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        onClick={onExit}
                        style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: `1px solid ${'var(--bg-hover)'}`,
                            background: 'transparent',
                            color: 'var(--bg-hover)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease' }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Exit
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Resource Type Configuration - Professional color schemes
const RESOURCE_TYPE_CONFIG: Record<Resource['type'], {
    color: string;
    bgGradient: string;
    label: string;
    actionLabel: string;
}> = {
    link: {
        color: '#3b82f6',
        bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.04) 100%)',
        label: 'Link',
        actionLabel: 'Open' },
    file: {
        color: '#f59e0b',
        bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.04) 100%)',
        label: 'File',
        actionLabel: 'Download' },
    image: {
        color: '#22c55e',
        bgGradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.04) 100%)',
        label: 'Image',
        actionLabel: 'View' },
    code: {
        color: '#10b981',
        bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)',
        label: 'Code',
        actionLabel: 'Copy' },
    note: {
        color: '#8b5cf6',
        bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0.04) 100%)',
        label: 'Note',
        actionLabel: 'View' },
    flashcard: {
        color: '#ec4899',
        bgGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(236, 72, 153, 0.04) 100%)',
        label: 'Flashcard',
        actionLabel: 'Study' } };


export { DistractionBlocker, RESOURCE_TYPE_CONFIG };
