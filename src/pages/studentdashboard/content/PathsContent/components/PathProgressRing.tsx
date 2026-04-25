/**
 * PathProgressRing + ModalTooltip
 * Animated progress ring with hover tooltip.
 * Extracted from PathsContent.tsx during Phase 8.6
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

// Progress Ring with Animated Hover Tooltip
const ProgressRingWithTooltip: React.FC<{
    progress: number;
    pathColor: string;
    index: number;
}> = ({ progress, pathColor, index }) => {
    const [isHovered, setIsHovered] = useState(false);

    // Get short description based on progress
    const getDescription = () => {
        if (progress === 100) return 'Complete!';
        if (progress >= 75) return 'Almost there';
        if (progress >= 50) return 'Halfway done';
        if (progress >= 25) return 'Good start';
        if (progress > 0) return 'Just started';
        return 'Not started';
    };

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.2, duration: 0.4 }}
            style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0, cursor: 'pointer' }}
            whileHover={{ scale: 1.08 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            {/* Animated Tooltip - Left Side, Centered to Circle */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, x: 8, scale: 0.85 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 4, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        style={{
                            position: 'absolute',
                            top: '20%',
                            right: '100%',
                            transform: 'translateY(-50%)',
                            marginRight: '10px',
                            padding: '4px 8px',
                            background: '#ffffff',
                            borderRadius: '6px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                            zIndex: 50,
                        }}
                    >
                        <span style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            color: '#3b82f6',
                        }}>
                            {getDescription()}
                        </span>
                        {/* Tooltip Arrow - Right Side */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            right: '-5px',
                            transform: 'translateY(-50%) rotate(45deg)',
                            width: '8px',
                            height: '8px',
                            background: '#ffffff',
                            borderRight: '1px solid rgba(59, 130, 246, 0.2)',
                            borderTop: '1px solid rgba(59, 130, 246, 0.2)',
                        }} />
                    </motion.div>
                )}
            </AnimatePresence>
            
            <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background circle */}
                <circle
                    cx="26"
                    cy="26"
                    r="22"
                    fill="none"
                    stroke={'var(--bg-hover)'}
                    strokeWidth="4"
                />
                {/* Progress circle */}
                <motion.circle
                    cx="26"
                    cy="26"
                    r="22"
                    fill="none"
                    stroke={progress === 100 ? '#10b981' : pathColor}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 22}
                    initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - progress / 100) }}
                    transition={{ duration: 0.8, delay: index * 0.05 + 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
            </svg>
            {/* Percentage in center */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '12px',
                fontWeight: 700,
                color: progress === 100 ? '#10b981' : pathColor,
            }}>
                {progress}%
            </div>
        </motion.div>
    );
};


// Hover Tooltip Component for Modal - White bg, Blue text, Small size, Properly Centered
const ModalTooltip: React.FC<{
    text: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ text, children, position = 'top' }) => {
    const [isHovered, setIsHovered] = useState(false);
    const triggerRef = React.useRef<HTMLDivElement>(null);
    const tooltipRef = React.useRef<HTMLDivElement>(null);

    // Update tooltip position on hover and during animation
    useEffect(() => {
        if (!isHovered || !triggerRef.current || !tooltipRef.current) return;
        
        const updatePos = () => {
            if (!triggerRef.current || !tooltipRef.current) return;
            const rect = triggerRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const gap = 8;
            
            let top = 0;
            let left = 0;
            
            switch (position) {
                case 'top':
                    top = rect.top - tooltipRect.height - gap;
                    left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                    break;
                case 'bottom':
                    top = rect.bottom + gap;
                    left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                    break;
                case 'left':
                    top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                    left = rect.left - tooltipRect.width - gap;
                    break;
                case 'right':
                    top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                    left = rect.right + gap;
                    break;
            }
            
            tooltipRef.current.style.top = `${top}px`;
            tooltipRef.current.style.left = `${left}px`;
        };
        
        // Initial position update
        requestAnimationFrame(updatePos);
    }, [isHovered, position]);

    const getArrowStyle = (): React.CSSProperties => {
        const base: React.CSSProperties = {
            position: 'absolute',
            width: '6px',
            height: '6px',
            background: '#ffffff',
        };
        switch (position) {
            case 'top':
                return { ...base, bottom: '-3px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', borderRight: '1px solid rgba(59, 130, 246, 0.15)', borderBottom: '1px solid rgba(59, 130, 246, 0.15)' };
            case 'bottom':
                return { ...base, top: '-3px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', borderLeft: '1px solid rgba(59, 130, 246, 0.15)', borderTop: '1px solid rgba(59, 130, 246, 0.15)' };
            case 'left':
                return { ...base, right: '-3px', top: '50%', transform: 'translateY(-50%) rotate(45deg)', borderTop: '1px solid rgba(59, 130, 246, 0.15)', borderRight: '1px solid rgba(59, 130, 246, 0.15)' };
            case 'right':
                return { ...base, left: '-3px', top: '50%', transform: 'translateY(-50%) rotate(45deg)', borderBottom: '1px solid rgba(59, 130, 246, 0.15)', borderLeft: '1px solid rgba(59, 130, 246, 0.15)' };
            default:
                return base;
        }
    };

    return (
        <div
            ref={triggerRef}
            style={{ display: 'inline-flex' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {children}
            {createPortal(
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            ref={tooltipRef}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                padding: '4px 8px',
                                background: '#ffffff',
                                borderRadius: '5px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                                border: '1px solid rgba(59, 130, 246, 0.15)',
                                whiteSpace: 'nowrap',
                                pointerEvents: 'none',
                                zIndex: 99999,
                            }}
                        >
                            <span style={{ fontSize: '10px', fontWeight: 500, color: '#3b82f6' }}>
                                {text}
                            </span>
                            <div style={getArrowStyle()} />
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};


export { ProgressRingWithTooltip, ModalTooltip };
